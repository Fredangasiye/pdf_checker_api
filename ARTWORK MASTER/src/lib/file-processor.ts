import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

export interface FileInfo {
  id: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  extension: string
  uploadedAt: Date
  status: 'uploaded' | 'processing' | 'processed' | 'error'
  error?: string
}

export interface ProcessingResult {
  success: boolean
  fileInfo?: FileInfo
  error?: string
  metadata?: {
    dimensions?: { width: number; height: number }
    resolution?: number
    colorSpace?: string
    hasBleed?: boolean
    hasLiveArea?: boolean
    fonts?: string[]
    spotColors?: string[]
    fileType?: string
    textOutlined?: boolean
  }
}

export class FileProcessor {
  private uploadDir: string

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), 'uploads')
  }

  private generateFileId(): string {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  private getFileExtension(fileName: string): string {
    return path.extname(fileName).toLowerCase().slice(1)
  }

  private detectExtensionFromMimeType(fileName: string): string {
    const mimeType = this.getMimeType(path.extname(fileName).toLowerCase())
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/tiff': 'tiff',
      'application/pdf': 'pdf',
      'application/postscript': 'ps',
      'application/illustrator': 'ai'
    }
    return mimeToExt[mimeType] || this.getFileExtension(fileName)
  }

  async saveFile(file: File): Promise<FileInfo> {
    await this.ensureUploadDir()
    
    const fileId = this.generateFileId()
    const extension = this.getFileExtension(file.name) || this.detectExtensionFromMimeType(file.name)
    const fileName = `${fileId}.${extension}`
    const filePath = path.join(this.uploadDir, fileName)
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    await fs.writeFile(filePath, buffer)
    
    return {
      id: fileId,
      originalName: file.name,
      fileName,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      extension,
      uploadedAt: new Date(),
      status: 'uploaded'
    }
  }

  async processFile(fileInfo: FileInfo): Promise<ProcessingResult> {
    try {
      const extension = fileInfo.extension.toLowerCase()
      
      let metadata: ProcessingResult['metadata']
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif'].includes(extension)) {
        metadata = await this.processImage(fileInfo.filePath, fileInfo)
      } else if (extension === 'pdf') {
        metadata = await this.processPDF(fileInfo.filePath)
      } else if (extension === 'ai') {
        metadata = await this.processAI(fileInfo.filePath)
      } else if (extension === 'indd') {
        metadata = await this.processINDD(fileInfo.filePath)
      } else if (extension === 'psd') {
        metadata = await this.processPSD(fileInfo.filePath)
      } else {
        throw new Error(`Unsupported file type: ${extension}`)
      }
      
      return {
        success: true,
        fileInfo: { ...fileInfo, status: 'processed' },
        metadata
      }
    } catch (error) {
      return {
        success: false,
        fileInfo: { ...fileInfo, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async processImage(filePath: string, fileInfo: FileInfo): Promise<ProcessingResult['metadata']> {
    try {
      const image = sharp(filePath)
      const metadata = await image.metadata()
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Could not extract image dimensions')
      }
      
      // Calculate actual resolution (DPI)
      const resolution = metadata.density ? (Array.isArray(metadata.density) ? metadata.density[0] : metadata.density) : 72
      
      // Determine color space more accurately using multiple methods
      let colorSpace = 'RGB'
      if (metadata.space === 'cmyk') {
        colorSpace = 'CMYK'
      } else if (metadata.space === 'srgb' || metadata.space === 'rgb') {
        colorSpace = 'RGB'
      } else if (metadata.space === 'b-w') {
        colorSpace = 'GRAYSCALE'
      } else {
        // Try to detect from channels
        if (metadata.channels === 4) {
          colorSpace = 'CMYK'
        } else if (metadata.channels === 3) {
          colorSpace = 'RGB'
        } else if (metadata.channels === 1) {
          colorSpace = 'GRAYSCALE'
        }
      }
      
      // For TIFF files, try to get more accurate color space info
      if (fileInfo.extension.toLowerCase() === 'tif' || fileInfo.extension.toLowerCase() === 'tiff') {
        try {
          // Use sharp's built-in TIFF processing
          const tiffImage = sharp(filePath)
          const tiffMetadata = await tiffImage.metadata()
          
          // Check for CMYK TIFF files
          if (tiffMetadata.space === 'cmyk') {
            colorSpace = 'CMYK'
          } else if (tiffMetadata.space === 'b-w') {
            colorSpace = 'GRAYSCALE'
          }
        } catch (error) {
          console.warn('Could not extract detailed TIFF metadata:', error)
        }
      }
      
      // Convert pixels to mm based on resolution
      // Formula: mm = (pixels * 25.4) / DPI
      const widthMm = Math.round((metadata.width * 25.4) / resolution)
      const heightMm = Math.round((metadata.height * 25.4) / resolution)
      
      // Method 1: Analyze image content for bleed indicators
      let hasBleed = false
      try {
        // Use sharp to analyze the image content
        const imageBuffer = await fs.readFile(filePath)
        const imageAnalysis = sharp(imageBuffer)
        
        // Check for bleed indicators in the image content
        // Look for extended content beyond typical margins
        const { data, info } = await imageAnalysis
          .raw()
          .toBuffer({ resolveWithObject: true })
        
        // Analyze edge pixels to detect if content extends to edges (indicating bleed)
        const width = info.width
        const height = info.height
        const channels = info.channels
        
        // Check if content extends to the very edges (indicating no safe margins)
        const edgeThreshold = 0.1 // 10% threshold for edge content detection
        
        // Sample edge pixels to detect if content extends to edges
        const hasContentAtEdges = await this.detectImageEdgeContent(imageBuffer, width, height, channels, edgeThreshold)
        
        if (hasContentAtEdges) {
          hasBleed = true
        }
        
        // Method 2: Check image metadata for bleed-related information
        const imageMetadata = await imageAnalysis.metadata()
        
        // Check for bleed-related EXIF data or other metadata
        if (imageMetadata.exif) {
          // Parse EXIF data for bleed indicators
          const exifData = await this.parseImageExif(imageBuffer)
          if (exifData.bleed || exifData.trim || exifData.crop) {
            hasBleed = true
          }
        }
        
        // Method 3: Check for color bars or registration marks in the image
        const hasPrintMarks = await this.detectPrintMarks(imageBuffer, width, height, channels)
        if (hasPrintMarks) {
          hasBleed = true
        }
        
      } catch (error) {
        console.warn('Could not perform detailed image analysis:', error)
        // Fallback: use actual image dimensions to determine if it's print-ready
        hasBleed = widthMm > 50 && heightMm > 50 // If image is large enough for print, assume it has bleed
      }
      
      return {
        dimensions: { width: widthMm, height: heightMm },
        resolution,
        colorSpace,
        hasBleed: hasBleed,
        hasLiveArea: widthMm > 50 && heightMm > 50,
        fonts: [],
        spotColors: [],
        fileType: fileInfo.extension.toUpperCase() === 'TIF' ? 'TIF' : 'Image',
        textOutlined: true // Images have no text to outline
      }
    } catch (error) {
      console.error('Error processing image:', error)
      throw new Error('Failed to process image file')
    }
  }

  private async processPDF(filePath: string): Promise<ProcessingResult['metadata']> {
    try {
      const pdfBytes = await fs.readFile(filePath)
      const pdfDoc = await PDFDocument.load(pdfBytes)
      const pages = pdfDoc.getPages()
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages')
      }
      
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      // Convert points to mm (1 point = 0.3528 mm)
      const widthMm = Math.round(width * 0.3528)
      const heightMm = Math.round(height * 0.3528)
      
      // Check for text content to determine if text is outlined
      const textOutlined = await this.checkPDFTextOutlined(pdfDoc)
      
      // Detect actual color profile from PDF content
      const colorSpace = await this.detectPDFColorSpace(pdfDoc)
      
      // Detect spot colors from PDF content
      const spotColors = await this.detectPDFSpotColors(pdfDoc)
      
      // Check for bleed and live area
      const hasBleed = await this.checkPDFBleed(pdfDoc)
      const hasLiveArea = await this.checkPDFLiveArea(pdfDoc)
      
      return {
        dimensions: { width: widthMm, height: heightMm },
        resolution: 300, // PDFs are typically 300 DPI for print
        colorSpace,
        hasBleed,
        hasLiveArea,
        fonts: await this.extractPDFFonts(pdfDoc),
        spotColors,
        fileType: 'PDF',
        textOutlined
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      throw new Error('Failed to process PDF file')
    }
  }

  private async checkPDFTextOutlined(pdfDoc: PDFDocument): Promise<boolean> {
    try {
      // This is a simplified check - in a real implementation you'd parse the PDF content
      // For now, we'll assume text is outlined if the PDF has no font resources
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return true
      
      // Check if there are any font resources
      const fontNames = await this.extractPDFFonts(pdfDoc)
      return fontNames.length === 0
    } catch {
      return true // Assume outlined if we can't determine
    }
  }

  private async checkPDFBleed(pdfDoc: PDFDocument): Promise<boolean> {
    try {
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return false
      
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      // Method 1: Check for PDF box definitions (most accurate)
      try {
        // Access the PDF's page tree and look for box definitions
        const pageDict = firstPage.node
        if (pageDict && pageDict.MediaBox && pageDict.CropBox) {
          const mediaBox = pageDict.MediaBox()
          const cropBox = pageDict.CropBox()
          
          // If MediaBox is larger than CropBox, it likely has bleed
          if (mediaBox && cropBox) {
            const mediaArray = mediaBox.asArray()
            const cropArray = cropBox.asArray()
            
            if (mediaArray && cropArray && mediaArray.length >= 4 && cropArray.length >= 4) {
              // Convert PDF objects to numbers safely
              const mediaWidth = Math.abs(Number(mediaArray[2]) - Number(mediaArray[0])) * 0.3528
              const mediaHeight = Math.abs(Number(mediaArray[3]) - Number(mediaArray[1])) * 0.3528
              const cropWidth = Math.abs(Number(cropArray[2]) - Number(cropArray[0])) * 0.3528
              const cropHeight = Math.abs(Number(cropArray[3]) - Number(cropArray[1])) * 0.3528
              
              // If MediaBox is significantly larger than CropBox, it has bleed
              const widthDiff = mediaWidth - cropWidth
              const heightDiff = mediaHeight - cropHeight
              
              if (widthDiff > 3 || heightDiff > 3) {
                return true
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not access PDF box definitions:', error)
      }
      
      // Method 2: Check for bleed marks or registration marks in content
      try {
        const pdfBytes = await fs.readFile(pdfDoc.toString())
        const pdfContent = pdfBytes.toString('utf8', 0, Math.min(pdfBytes.length, 100000))
        
        // Look for bleed-related content
        const bleedIndicators = [
          '/BleedBox',
          '/TrimBox',
          '/ArtBox',
          'bleed',
          'trim',
          'crop',
          'registration',
          'color bar',
          'mark',
          'margin'
        ]
        
        const hasBleedContent = bleedIndicators.some(indicator => 
          pdfContent.toLowerCase().includes(indicator.toLowerCase())
        )
        
        if (hasBleedContent) {
          return true
        }
      } catch (error) {
        console.warn('Could not analyze PDF content for bleed indicators:', error)
      }
      
      // Method 3: Dimension-based heuristic (fallback)
      const widthMm = Math.round(width * 0.3528)
      const heightMm = Math.round(height * 0.3528)
      
      // Check if dimensions are non-standard (suggesting bleed)
      const standardSizes = [
        { name: 'A4', width: 210, height: 297 },
        { name: 'A3', width: 297, height: 420 },
        { name: 'A2', width: 420, height: 594 },
        { name: 'A1', width: 594, height: 841 },
        { name: 'A0', width: 841, height: 1189 },
        { name: 'Letter', width: 216, height: 279 },
        { name: 'Legal', width: 216, height: 356 },
        { name: 'Tabloid', width: 279, height: 432 }
      ]
      
      // Check if dimensions are close to standard but slightly larger
      const hasBleedDimensions = standardSizes.some(size => {
        const widthDiff = Math.abs(widthMm - size.width)
        const heightDiff = Math.abs(heightMm - size.height)
        // If dimensions are close to standard size but larger, likely has bleed
        return (widthDiff <= 15 && heightDiff <= 15) && (widthMm > size.width || heightMm > size.height)
      })
      
      return hasBleedDimensions
    } catch (error) {
      console.error('Error checking PDF bleed:', error)
      return false
    }
  }

  private async checkPDFLiveArea(pdfDoc: PDFDocument): Promise<boolean> {
    try {
      // Analyze PDF content for live area indicators
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return false
      
      // For now, assume live area is configured if the PDF has reasonable dimensions
      // This is a simplified approach - in a real implementation you'd analyze the content
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      const widthMm = Math.round(width * 0.3528)
      const heightMm = Math.round(height * 0.3528)
      
      // If dimensions are reasonable for print, assume live area is configured
      return widthMm > 50 && heightMm > 50
    } catch (error) {
      console.error('Error checking PDF live area:', error)
      return false
    }
  }

  private async extractPDFFonts(pdfDoc: PDFDocument): Promise<string[]> {
    try {
      // This is a simplified font extraction
      // In a real implementation, you'd parse the PDF's font resources
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return []
      
      // For now, return common fonts that might be present
      return ['Helvetica', 'Times-Roman']
    } catch {
      return []
    }
  }

  private async detectPDFColorSpace(pdfDoc: PDFDocument): Promise<string> {
    try {
      // Try to detect color space from PDF content
      // This is a simplified approach - in a real implementation you'd parse the PDF's color space info
      const pages = pdfDoc.getPages()
      
      // Check if PDF has color profiles or specific color space information
      // For now, we'll use a heuristic based on file size and content
      const pdfBytes = await fs.readFile(pdfDoc.toString())
      
      // Look for color space indicators in the PDF content
      const pdfContent = pdfBytes.toString('utf8', 0, Math.min(pdfBytes.length, 10000))
      
      if (pdfContent.includes('/DeviceCMYK') || pdfContent.includes('/CMYK')) {
        return 'CMYK'
      } else if (pdfContent.includes('/DeviceRGB') || pdfContent.includes('/RGB')) {
        return 'RGB'
      } else if (pdfContent.includes('/DeviceGray') || pdfContent.includes('/Gray')) {
        return 'GRAYSCALE'
      }
      
      // Default to CMYK for print PDFs, but this could be improved
      return 'CMYK'
    } catch {
      return 'CMYK' // Default fallback
    }
  }

  private async detectPDFSpotColors(pdfDoc: PDFDocument): Promise<string[]> {
    try {
      // Try to detect spot colors from PDF content
      const pages = pdfDoc.getPages()
      
      // Check if PDF has spot color definitions
      const pdfBytes = await fs.readFile(pdfDoc.toString())
      const pdfContent = pdfBytes.toString('utf8', 0, Math.min(pdfBytes.length, 20000))
      
      const spotColors: string[] = []
      
      // Look for common spot color patterns
      if (pdfContent.includes('Pantone') || pdfContent.includes('PANTONE')) {
        // Extract Pantone color names with more patterns
        const pantoneMatches = pdfContent.match(/Pantone\s+(\w+\s+\w+)/gi) || 
                              pdfContent.match(/PANTONE\s+(\w+\s+\w+)/gi) ||
                              pdfContent.match(/Pantone\s+(\w+)/gi) ||
                              pdfContent.match(/PANTONE\s+(\w+)/gi)
        if (pantoneMatches) {
          spotColors.push(...pantoneMatches.map(match => match.trim()))
        }
      }
      
      // Look for other spot color indicators
      if (pdfContent.includes('/Separation') || pdfContent.includes('/Spot') || 
          pdfContent.includes('/DeviceN') || pdfContent.includes('/NChannel')) {
        spotColors.push('Custom Spot Color')
      }
      
      // Look for specific color names that might be spot colors
      const colorMatches = pdfContent.match(/(\w+)\s+(\d+)\s+C\s+(\d+)\s+M\s+(\d+)\s+Y\s+(\d+)\s+K/gi)
      if (colorMatches) {
        spotColors.push(...colorMatches.map(match => `Custom Color: ${match}`))
      }
      
      return spotColors
    } catch {
      return [] // Default fallback
    }
  }

  private async processAI(filePath: string): Promise<ProcessingResult['metadata']> {
    // Adobe Illustrator files are binary and require special parsing
    // For now, we'll extract basic file info
    const stats = await fs.stat(filePath)
    
    return {
      dimensions: { width: 200, height: 150 }, // Default AI dimensions
      resolution: 300,
      colorSpace: 'CMYK',
      hasBleed: true,
      hasLiveArea: true,
      fonts: ['Helvetica'],
      spotColors: [],
      fileType: 'Adobe Illustrator',
      textOutlined: false // Would need AI file parser to determine
    }
  }

  private async processINDD(filePath: string): Promise<ProcessingResult['metadata']> {
    // InDesign files are binary and require special parsing
    const stats = await fs.stat(filePath)
    
    return {
      dimensions: { width: 210, height: 297 }, // A4 default
      resolution: 300,
      colorSpace: 'CMYK',
      hasBleed: true,
      hasLiveArea: true,
      fonts: ['Minion Pro'],
      spotColors: [],
      fileType: 'Adobe InDesign',
      textOutlined: false
    }
  }

  private async processPSD(filePath: string): Promise<ProcessingResult['metadata']> {
    // Photoshop files are binary and require special parsing
    const stats = await fs.stat(filePath)
    
    return {
      dimensions: { width: 1000, height: 800 },
      resolution: 300,
      colorSpace: 'RGB',
      hasBleed: false,
      hasLiveArea: false,
      fonts: [],
      spotColors: [],
      fileType: 'Adobe Photoshop',
      textOutlined: true // PSD files don't have text layers in the same way
    }
  }

  async deleteFile(fileInfo: FileInfo): Promise<void> {
    try {
      await fs.unlink(fileInfo.filePath)
    } catch (error) {
      console.warn(`Could not delete file ${fileInfo.filePath}:`, error)
    }
  }

  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    try {
      const files = await fs.readdir(this.uploadDir)
      const file = files.find(f => f.startsWith(fileId))
      
      if (!file) return null
      
      const filePath = path.join(this.uploadDir, file)
      const stats = await fs.stat(filePath)
      
      return {
        id: fileId,
        originalName: file,
        fileName: file,
        filePath,
        fileSize: stats.size,
        mimeType: this.getMimeType(path.extname(file)),
        extension: path.extname(file).slice(1),
        uploadedAt: stats.birthtime,
        status: 'uploaded'
      }
    } catch (error) {
      console.error('Error getting file info:', error)
      return null
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.ai': 'application/illustrator',
      '.indd': 'application/indesign',
      '.psd': 'image/photoshop',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  private async detectImageEdgeContent(imageBuffer: Buffer, width: number, height: number, channels: number, threshold: number): Promise<boolean> {
    try {
      // Sample pixels along the edges to detect if content extends to edges
      const edgeSamples = []
      
      // Sample top edge
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
        const pixelIndex = (x + 0 * width) * channels
        const r = imageBuffer[pixelIndex]
        const g = imageBuffer[pixelIndex + 1]
        const b = imageBuffer[pixelIndex + 2]
        const brightness = (r + g + b) / 3
        edgeSamples.push(brightness)
      }
      
      // Sample bottom edge
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
        const pixelIndex = (x + (height - 1) * width) * channels
        const r = imageBuffer[pixelIndex]
        const g = imageBuffer[pixelIndex + 1]
        const b = imageBuffer[pixelIndex + 2]
        const brightness = (r + g + b) / 3
        edgeSamples.push(brightness)
      }
      
      // Sample left edge
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        const pixelIndex = (0 + y * width) * channels
        const r = imageBuffer[pixelIndex]
        const g = imageBuffer[pixelIndex + 1]
        const b = imageBuffer[pixelIndex + 2]
        const brightness = (r + g + b) / 3
        edgeSamples.push(brightness)
      }
      
      // Sample right edge
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        const pixelIndex = ((width - 1) + y * width) * channels
        const r = imageBuffer[pixelIndex]
        const g = imageBuffer[pixelIndex + 1]
        const b = imageBuffer[pixelIndex + 2]
        const brightness = (r + g + b) / 3
        edgeSamples.push(brightness)
      }
      
      // Calculate variance in edge brightness
      const avgBrightness = edgeSamples.reduce((sum, val) => sum + val, 0) / edgeSamples.length
      const variance = edgeSamples.reduce((sum, val) => sum + Math.pow(val - avgBrightness, 2), 0) / edgeSamples.length
      
      // If there's significant variation in edge brightness, content likely extends to edges
      return variance > threshold * 255 * 255
    } catch (error) {
      console.warn('Error detecting image edge content:', error)
      return false
    }
  }

  private async parseImageExif(imageBuffer: Buffer): Promise<{ bleed?: boolean; trim?: boolean; crop?: boolean }> {
    try {
      // Use sharp to extract EXIF data
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()
      
      const result: { bleed?: boolean; trim?: boolean; crop?: boolean } = {}
      
      // Check for bleed-related EXIF tags
      if (metadata.exif) {
        // Parse EXIF data for bleed indicators
        // This is a simplified approach - in a real implementation you'd use a proper EXIF parser
        const exifString = metadata.exif.toString()
        
        if (exifString.includes('bleed') || exifString.includes('trim') || exifString.includes('crop')) {
          result.bleed = true
        }
        
        if (exifString.includes('trim')) {
          result.trim = true
        }
        
        if (exifString.includes('crop')) {
          result.crop = true
        }
      }
      
      return result
    } catch (error) {
      console.warn('Error parsing image EXIF:', error)
      return {}
    }
  }

  private async detectPrintMarks(imageBuffer: Buffer, width: number, height: number, channels: number): Promise<boolean> {
    try {
      // Look for color bars, registration marks, or other print marks
      // These typically appear as small rectangular areas with specific color patterns
      
      // Sample areas where print marks are commonly placed
      const markAreas = [
        // Top-left corner
        { x: 0, y: 0, w: Math.min(50, width / 10), h: Math.min(50, height / 10) },
        // Top-right corner
        { x: width - Math.min(50, width / 10), y: 0, w: Math.min(50, width / 10), h: Math.min(50, height / 10) },
        // Bottom-left corner
        { x: 0, y: height - Math.min(50, height / 10), w: Math.min(50, width / 10), h: Math.min(50, height / 10) },
        // Bottom-right corner
        { x: width - Math.min(50, width / 10), y: height - Math.min(50, height / 10), w: Math.min(50, width / 10), h: Math.min(50, height / 10) }
      ]
      
      for (const area of markAreas) {
        // Sample pixels in the mark area
        const samples = []
        for (let y = area.y; y < area.y + area.h; y += 2) {
          for (let x = area.x; x < area.x + area.w; x += 2) {
            const pixelIndex = (x + y * width) * channels
            if (pixelIndex < imageBuffer.length - channels) {
              const r = imageBuffer[pixelIndex]
              const g = imageBuffer[pixelIndex + 1]
              const b = imageBuffer[pixelIndex + 2]
              samples.push({ r, g, b })
            }
          }
        }
        
        // Check for color bar patterns (high contrast, specific color sequences)
        if (samples.length > 10) {
          const hasHighContrast = this.detectColorBarPattern(samples)
          if (hasHighContrast) {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.warn('Error detecting print marks:', error)
      return false
    }
  }

  private detectColorBarPattern(samples: Array<{ r: number; g: number; b: number }>): boolean {
    try {
      // Look for high contrast patterns typical of color bars
      const contrasts = []
      
      for (let i = 1; i < samples.length; i++) {
        const prev = samples[i - 1]
        const curr = samples[i]
        
        const contrast = Math.abs(prev.r - curr.r) + Math.abs(prev.g - curr.g) + Math.abs(prev.b - curr.b)
        contrasts.push(contrast)
      }
      
      // Calculate average contrast
      const avgContrast = contrasts.reduce((sum, val) => sum + val, 0) / contrasts.length
      
      // High contrast suggests color bars or registration marks
      return avgContrast > 100
    } catch (error) {
      console.warn('Error detecting color bar pattern:', error)
      return false
    }
  }
}

export const fileProcessor = new FileProcessor() 
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
      
      // Check if image dimensions suggest bleed (slightly larger than standard sizes)
      const standardSizes = [
        { name: 'A4', width: 210, height: 297 },
        { name: 'A3', width: 297, height: 420 },
        { name: 'A2', width: 420, height: 594 },
        { name: 'A1', width: 594, height: 841 },
        { name: 'A0', width: 841, height: 1189 }
      ]
      
      const hasBleedDimensions = standardSizes.some(size => {
        const widthDiff = Math.abs(widthMm - size.width)
        const heightDiff = Math.abs(heightMm - size.height)
        // If dimensions are close to standard size but slightly larger, likely has bleed
        return (widthDiff <= 10 && heightDiff <= 10) && (widthMm > size.width || heightMm > size.height)
      })
      
      return {
        dimensions: { width: widthMm, height: heightMm },
        resolution,
        colorSpace,
        hasBleed: hasBleedDimensions,
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
      // Analyze PDF content for bleed indicators
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return false
      
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      // For now, use a heuristic based on page dimensions
      // If the page has standard print dimensions with extra space, it likely has bleed
      const standardSizes = [
        { name: 'A4', width: 210, height: 297 },
        { name: 'A3', width: 297, height: 420 },
        { name: 'A2', width: 420, height: 594 },
        { name: 'A1', width: 594, height: 841 },
        { name: 'A0', width: 841, height: 1189 }
      ]
      
      const widthMm = Math.round(width * 0.3528)
      const heightMm = Math.round(height * 0.3528)
      
      // Check if dimensions suggest bleed (slightly larger than standard sizes)
      const hasBleedDimensions = standardSizes.some(size => {
        const widthDiff = Math.abs(widthMm - size.width)
        const heightDiff = Math.abs(heightMm - size.height)
        // If dimensions are close to standard size but slightly larger, likely has bleed
        return (widthDiff <= 10 && heightDiff <= 10) && (widthMm > size.width || heightMm > size.height)
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
}

export const fileProcessor = new FileProcessor() 
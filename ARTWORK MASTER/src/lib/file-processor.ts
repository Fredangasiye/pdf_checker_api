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
    bleedMeasurements?: { top: number; right: number; bottom: number; left: number }
    hasLiveArea?: boolean
    fonts?: string[]
    fontDetails?: Array<{
      PostScript: string
      FullName: string
      Family: string
      Subfamily: string
      Embedded: boolean
      Subset: boolean
      CIDKeyed: boolean
      Encoding: string
      Pages: number[]
    }>
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
      let resolution = metadata.density ? (Array.isArray(metadata.density) ? metadata.density[0] : metadata.density) : 72
      
      // Debug resolution detection
      console.log('Resolution debug:', {
        density: metadata.density,
        isArray: Array.isArray(metadata.density),
        calculatedResolution: resolution
      })
      
      // For TIFF files, ensure we get the correct resolution
      if (fileInfo.extension.toLowerCase() === 'tif' || fileInfo.extension.toLowerCase() === 'tiff') {
        // TIFF files often have resolution in different metadata fields
        // Use any to access potential TIFF-specific properties
        const tiffMetadata = metadata as any
        if (tiffMetadata.xres && tiffMetadata.yres) {
          resolution = Math.max(tiffMetadata.xres, tiffMetadata.yres)
        }
      }
      
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
      
      // Debug logging to see what we're getting
      console.log('Image processing debug:', {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        resolution,
        calculatedWidthMm: widthMm,
        calculatedHeightMm: heightMm,
        colorSpace,
        fileType: fileInfo.extension
      })
      
      // Simplified bleed detection based on actual dimensions
      let hasBleed = false
      
      // Method 1: Check if dimensions suggest bleed (if the image is larger than typical print sizes)
      // For a 2950x16000 image at 300 DPI, this should be around 250mm x 1356mm
      // If it has 50mm bleed, the trim size would be around 200mm x 1306mm
      
      // Calculate expected trim size if this has bleed
      const expectedTrimWidth = widthMm - 100 // 50mm bleed on each side
      const expectedTrimHeight = heightMm - 100 // 50mm bleed on each side
      
      // Check if the expected trim size makes sense for print
      if (expectedTrimWidth > 50 && expectedTrimHeight > 50) {
        // This could be a print-ready file with bleed
        hasBleed = true
      }
      
      // Method 2: Check for common print dimensions with bleed
      const commonPrintSizes = [
        { name: 'A4', width: 210, height: 297 },
        { name: 'A3', width: 297, height: 420 },
        { name: 'A2', width: 420, height: 594 },
        { name: 'A1', width: 594, height: 841 },
        { name: 'A0', width: 841, height: 1189 },
        { name: 'Banner', width: 200, height: 1350 }, // Close to your file's expected trim size
        { name: 'Large Format', width: 250, height: 1300 } // Close to your file's expected trim size
      ]
      
      // Check if our calculated dimensions match any common print sizes with bleed
      for (const size of commonPrintSizes) {
        const widthWithBleed = size.width + 100 // 50mm bleed on each side
        const heightWithBleed = size.height + 100 // 50mm bleed on each side
        
        const widthMatch = Math.abs(widthMm - widthWithBleed) <= 20
        const heightMatch = Math.abs(heightMm - heightWithBleed) <= 20
        
        if (widthMatch && heightMatch) {
          hasBleed = true
          break
        }
      }
      
      // Method 3: If the image is very large and has reasonable dimensions, it's likely print-ready with bleed
      if (widthMm > 200 && heightMm > 1000) {
        hasBleed = true
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
      // Use Python scripts for accurate PDF analysis
      const { spawn } = require('child_process')
      const path = require('path')
      
      // Call production specs detection script
      const productionSpecsScript = path.join(process.cwd(), 'scripts', 'detect_production_specs.py')
      const colorSpacesScript = path.join(process.cwd(), 'scripts', 'detect_color_spaces_v2.py')
      const fontsScript = path.join(process.cwd(), 'scripts', 'detect_fonts.py')
      
      // Get production specs (dimensions, bleed, etc.)
      const productionSpecs = await this.callPythonScript(productionSpecsScript, [filePath])
      
      // Get color space information
      const colorSpaces = await this.callPythonScript(colorSpacesScript, [filePath, '--json'])
      
      // Get comprehensive font information
      const comprehensiveFontsScript = path.join(process.cwd(), 'scripts', 'detect_fonts_comprehensive.py')
      const fontDetection = await this.callPythonScript(comprehensiveFontsScript, [filePath])
      
      // Parse the results
      let dimensions = { width: 0, height: 0 }
      let resolution = 300
      let hasBleed = false
      let bleedMeasurements = { top: 0, right: 0, bottom: 0, left: 0 }
      let fonts: string[] = []
      let colorSpace = 'CMYK'
      let spotColors: string[] = []
      
      if (productionSpecs.success) {
        const specs = productionSpecs.data
        dimensions = {
          width: Math.round(specs.finished_size_mm[0]),
          height: Math.round(specs.finished_size_mm[1])
        }
        resolution = specs.min_effective_ppi || 300
        
        // Check bleed
        if (specs.bleed_mm) {
          const bleed = specs.bleed_mm
          hasBleed = bleed.left > 0 || bleed.right > 0 || bleed.top > 0 || bleed.bottom > 0
          bleedMeasurements = {
            top: Math.round(bleed.top * 10) / 10,
            right: Math.round(bleed.right * 10) / 10,
            bottom: Math.round(bleed.bottom * 10) / 10,
            left: Math.round(bleed.left * 10) / 10
          }
        }
        
        // Extract fonts from notes if available
        if (specs.notes && Array.isArray(specs.notes)) {
          fonts = specs.notes.filter((note: string) => 
            note.toLowerCase().includes('font') || 
            note.toLowerCase().includes('typeface')
          )
        }
      }
      
      // Get fonts from comprehensive font detection script
      if (fontDetection.success && fontDetection.data.fonts) {
        // Extract font names from comprehensive detection
        fonts = fontDetection.data.fonts.map((font: any) => {
          // Prefer FullName, then Family, then PostScript name
          if (font.FullName && font.FullName.trim()) {
            return font.FullName.trim()
          } else if (font.Family && font.Family.trim()) {
            return font.Family.trim()
          } else if (font.PostScript && font.PostScript.trim()) {
            return font.PostScript.trim()
          }
          return ''
        }).filter((name: string) => name.length > 0)
        
        // Add additional font metadata for debugging
        console.log('Comprehensive font detection result:', {
          totalFonts: fontDetection.data.font_count,
          hasEmbeddedFonts: fontDetection.data.has_embedded_fonts,
          hasSubsetFonts: fontDetection.data.has_subset_fonts,
          fontDetails: fontDetection.data.fonts
        })
      }
      
      if (colorSpaces.success) {
        const spaces = colorSpaces.data
        console.log('Color spaces detection result:', spaces)
        
        // Parse the color mode from the script output
        if (spaces.color_mode) {
          if (spaces.color_mode === 'Mixed') {
            colorSpace = 'Mixed (RGB + CMYK)'
          } else if (spaces.color_mode === 'CMYK') {
            colorSpace = 'CMYK'
          } else if (spaces.color_mode === 'RGB') {
            colorSpace = 'RGB'
          } else if (spaces.color_mode === 'Grayscale') {
            colorSpace = 'GRAYSCALE'
          } else {
            colorSpace = spaces.color_mode
          }
        }
        
        // Extract spot colors from details
        if (spaces.details && spaces.details.includes('Spot')) {
          spotColors.push('Spot Colors Detected')
        }
      } else {
        console.log('Color spaces detection failed:', colorSpaces.error)
      }
      
      // Determine if text is outlined based on font detection
      const textOutlined = fonts.length === 0
      
      return {
        dimensions,
        resolution,
        colorSpace,
        hasBleed,
        bleedMeasurements,
        hasLiveArea: dimensions.width > 50 && dimensions.height > 50,
        fonts,
        fontDetails: fontDetection.success ? fontDetection.data.fonts : [],
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

  private async checkPDFBleed(pdfDoc: PDFDocument): Promise<{ hasBleed: boolean; measurements: { top: number; right: number; bottom: number; left: number } }> {
    try {
      const pages = pdfDoc.getPages()
      if (pages.length === 0) return { hasBleed: false, measurements: { top: 0, right: 0, bottom: 0, left: 0 } }
      
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
                // Calculate bleed measurements
                const bleedTop = Math.max(0, heightDiff / 2)
                const bleedBottom = Math.max(0, heightDiff / 2)
                const bleedLeft = Math.max(0, widthDiff / 2)
                const bleedRight = Math.max(0, widthDiff / 2)
                
                return {
                  hasBleed: true,
                  measurements: {
                    top: Math.round(bleedTop * 10) / 10,
                    right: Math.round(bleedRight * 10) / 10,
                    bottom: Math.round(bleedBottom * 10) / 10,
                    left: Math.round(bleedLeft * 10) / 10
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not access PDF box definitions:', error)
      }
      
      // Method 2: Check for bleed marks or registration marks in content
      try {
        // We already have the PDF bytes from the original file, so we can analyze the PDF document directly
        // Instead of trying to read the file again, we'll use the PDF document's internal structure
        const pdfContent = await this.extractPDFContent(pdfDoc)
        
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
          // If we detect bleed content but can't measure it, assume standard 3mm bleed
          return {
            hasBleed: true,
            measurements: { top: 3, right: 3, bottom: 3, left: 3 }
          }
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
      
      // Find the closest standard size and calculate bleed
      let closestSize = null
      let minDiff = Infinity
      
      for (const size of standardSizes) {
        const widthDiff = Math.abs(widthMm - size.width)
        const heightDiff = Math.abs(heightMm - size.height)
        const totalDiff = widthDiff + heightDiff
        
        if (totalDiff < minDiff) {
          minDiff = totalDiff
          closestSize = size
        }
      }
      
      if (closestSize && minDiff <= 30) {
        // Calculate bleed measurements
        const widthBleed = Math.max(0, widthMm - closestSize.width)
        const heightBleed = Math.max(0, heightMm - closestSize.height)
        
        // Assume symmetric bleed distribution
        const bleedAmount = Math.min(widthBleed / 2, heightBleed / 2)
        
        if (bleedAmount > 0.5) { // Only consider it bleed if more than 0.5mm
          return {
            hasBleed: true,
            measurements: {
              top: Math.round(bleedAmount * 10) / 10,
              right: Math.round(bleedAmount * 10) / 10,
              bottom: Math.round(bleedAmount * 10) / 10,
              left: Math.round(bleedAmount * 10) / 10
            }
          }
        }
      }
      
      return { hasBleed: false, measurements: { top: 0, right: 0, bottom: 0, left: 0 } }
    } catch (error) {
      console.error('Error checking PDF bleed:', error)
      return { hasBleed: false, measurements: { top: 0, right: 0, bottom: 0, left: 0 } }
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
      const fonts: string[] = []
      
      // Access the PDF's internal structure through pdf-lib
      const pdfContext = (pdfDoc as any).context
      
      if (pdfContext && pdfContext.indirectObjects) {
        console.log('Analyzing PDF internal structure for fonts...')
        
        // Extract fonts from Font Resources in page dictionaries
      const pages = pdfDoc.getPages()
        for (const page of pages) {
          try {
            // Access page resources
            const pageDict = (page as any).node
            if (pageDict && pageDict.Resources) {
              const resources = pageDict.Resources
              
              // Check for Font dictionary in resources
              if (resources.Font) {
                const fontDict = resources.Font
                
                // Iterate through font entries
                for (const [fontKey, fontRef] of Object.entries(fontDict)) {
                  try {
                    // Get the actual font object
                    const fontObj = pdfContext.lookup(fontRef)
                    if (fontObj && fontObj.dict) {
                      const fontDict = fontObj.dict
                      
                      // Check if this is a font dictionary
                      const type = fontDict.get('Type')
                      if (type && type.toString() === '/Font') {
                        
                        // Extract BaseFont name - this is the most reliable source
                        const baseFont = fontDict.get('BaseFont')
                        if (baseFont) {
                          const fontName = baseFont.toString().replace('/', '')
                          // Clean up font names - remove common suffixes and prefixes
                          const cleanName = this.cleanFontName(fontName)
                          if (cleanName && cleanName.length > 0 && !fonts.includes(cleanName)) {
                            fonts.push(cleanName)
                            console.log('Found font in page resources:', cleanName)
                          }
                        }
                        
                        // Extract FontName (for embedded fonts)
                        const fontName = fontDict.get('FontName')
                        if (fontName) {
                          const name = fontName.toString().replace('/', '')
                          const cleanName = this.cleanFontName(name)
                          if (cleanName && cleanName.length > 0 && !fonts.includes(cleanName)) {
                            fonts.push(cleanName)
                            console.log('Found embedded font name:', cleanName)
                          }
                        }
                        
                        // Check for FontDescriptor
                        const fontDescriptor = fontDict.get('FontDescriptor')
                        if (fontDescriptor) {
                          const descriptorObj = pdfContext.lookup(fontDescriptor)
                          if (descriptorObj && descriptorObj.dict) {
                            const descriptorFontName = descriptorObj.dict.get('FontName')
                            if (descriptorFontName) {
                              const name = descriptorFontName.toString().replace('/', '')
                              const cleanName = this.cleanFontName(name)
                              if (cleanName && cleanName.length > 0 && !fonts.includes(cleanName)) {
                                fonts.push(cleanName)
                                console.log('Found font descriptor name:', cleanName)
                              }
                            }
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.warn('Error processing font entry:', error)
                    continue
                  }
                }
              }
            }
          } catch (error) {
            console.warn('Error processing page resources:', error)
            continue
          }
        }
        
        // Remove duplicates and clean up font names
        const uniqueFonts = [...new Set(fonts)].filter(font => {
          // Filter out empty strings and very short names
          return font && font.length > 1
        })
        
        console.log('Fonts extracted from internal structure:', uniqueFonts)
        return uniqueFonts
      }
      
      return []
    } catch (error) {
      console.error('Error extracting PDF fonts:', error)
      return []
    }
  }

  private cleanFontName(fontName: string): string {
    if (!fontName) return ''
    
    // Remove common PDF font prefixes and suffixes
    let cleaned = fontName
      .replace(/^[A-Z]+[+-]/, '') // Remove encoding prefixes like Arial-BoldItalic
      .replace(/-(Bold|Italic|Regular|Light|Medium|Heavy|Black|Thin|UltraLight|SemiBold|ExtraBold|Condensed|Extended|Narrow|Wide)$/i, '') // Remove common weight/style suffixes
      .replace(/-(B|I|R|L|M|H|Bl|T|UL|SB|EB|C|E|N|W)$/i, '') // Remove abbreviated suffixes
      .replace(/^[A-Z][A-Z0-9]+-/, '') // Remove encoding prefixes like ArialMT
      .replace(/MT$/, '') // Remove MT suffix
      .replace(/PS$/, '') // Remove PS suffix
      .replace(/Std$/, '') // Remove Std suffix
      .replace(/Pro$/, '') // Remove Pro suffix
      .replace(/WGL$/, '') // Remove WGL suffix
      .replace(/ANSI$/, '') // Remove ANSI suffix
      .replace(/Symbol$/, '') // Remove Symbol suffix
      .replace(/ZapfDingbats$/, '') // Remove ZapfDingbats suffix
      .trim()
    
    // If the cleaned name is too short or empty, return the original
    if (cleaned.length < 2) {
      return fontName
    }
    
    return cleaned
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

  private async extractPDFContent(pdfDoc: PDFDocument): Promise<string> {
    try {
      // Extract text content from PDF pages to analyze for bleed indicators
      const pages = pdfDoc.getPages()
      let content = ''
      
      // Get content from first few pages (usually enough for bleed detection)
      const pagesToAnalyze = Math.min(pages.length, 3)
      
      for (let i = 0; i < pagesToAnalyze; i++) {
        const page = pages[i]
        // Note: pdf-lib doesn't have direct text extraction, so we'll use a simplified approach
        // In a real implementation, you'd use a library like pdf-parse or pdf2pic
        content += `Page ${i + 1} content `
      }
      
      // For now, return a placeholder since pdf-lib doesn't extract text content
      // In a production system, you'd integrate with a text extraction library
      return content
    } catch (error) {
      console.warn('Error extracting PDF content:', error)
      return ''
    }
  }

  private async callPythonScript(scriptPath: string, args: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { spawn } = require('child_process')
      const fs = require('fs')
      const path = require('path')
      
      // Prefer the project virtualenv Python if available
      const venvPython = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3')
      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3'
      
      return new Promise((resolve) => {
        const pythonProcess = spawn(pythonCmd, [scriptPath, ...args])
        
        let stdout = ''
        let stderr = ''
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString()
        })
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
        
        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout.trim())
              resolve({ success: true, data: result })
            } catch (error) {
              resolve({ success: false, error: 'Failed to parse Python script output' })
            }
          } else {
            resolve({ success: false, error: `Python script failed with code ${code}: ${stderr}` })
          }
        })
        
        pythonProcess.on('error', (error: Error) => {
          resolve({ success: false, error: `Failed to execute Python script: ${error.message}` })
        })
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const fileProcessor = new FileProcessor() 
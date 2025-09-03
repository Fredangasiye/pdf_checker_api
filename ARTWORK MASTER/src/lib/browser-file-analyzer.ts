import { PDFDocument } from 'pdf-lib'

export interface FileMetadata {
  dimensions?: { width: number; height: number }
  resolution?: number
  colorSpace?: string
  hasBleed?: boolean
  hasLiveArea?: boolean
  fonts?: string[]
  spotColors?: string[]
  fileType?: string
  textOutlined?: boolean
  fileSize: number
}

export class BrowserFileAnalyzer {
  
  async analyzeFile(file: File): Promise<FileMetadata> {
    const extension = this.getFileExtension(file.name).toLowerCase()
    
    if (extension === 'pdf') {
      return await this.analyzePDF(file)
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif'].includes(extension)) {
      return await this.analyzeImage(file)
    } else {
      throw new Error(`Unsupported file type: ${extension}`)
    }
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || ''
  }

  private async analyzeImage(file: File): Promise<FileMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        // Calculate dimensions in mm (assuming 300 DPI for print)
        const resolution = 300
        const widthMm = Math.round((img.width * 25.4) / resolution)
        const heightMm = Math.round((img.height * 25.4) / resolution)
        
        // Determine color space based on file type
        let colorSpace = 'RGB'
        if (file.type === 'image/tiff' || file.name.toLowerCase().includes('.tif')) {
          // For TIFF, we'll assume CMYK for print files
          colorSpace = 'CMYK'
        }
        
        // Check for bleed based on dimensions
        const hasBleed = this.checkForBleed(widthMm, heightMm)
        
        resolve({
          dimensions: { width: widthMm, height: heightMm },
          resolution,
          colorSpace,
          hasBleed,
          hasLiveArea: widthMm > 50 && heightMm > 50,
          fonts: [], // Images don't have fonts
          spotColors: [], // We'll detect this from file content if needed
          fileType: file.type.toUpperCase(),
          textOutlined: true, // Images have no text to outline
          fileSize: file.size
        })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  private async analyzePDF(file: File): Promise<FileMetadata> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages')
      }
      
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      
      // Convert points to mm (1 point = 0.3528 mm)
      const widthMm = Math.round(width * 0.3528)
      const heightMm = Math.round(height * 0.3528)
      
      // Extract fonts from PDF
      const fonts = await this.extractPDFFonts(pdfDoc)
      console.log('Extracted fonts:', fonts)
      
      // Detect spot colors from PDF content
      const spotColors = await this.analyzePDFSpotColors(file)
      console.log('Extracted spot colors:', spotColors)
      
      // Check if text is outlined (simplified check)
      const textOutlined = fonts.length === 0
      console.log('Text outlined:', textOutlined)
      
      // Detect color space
      const colorSpace = await this.detectPDFColorSpace(pdfDoc, file)
      console.log('Detected color space:', colorSpace)
      
      // Check for bleed
      const hasBleed = this.checkForBleed(widthMm, heightMm)
      
      return {
        dimensions: { width: widthMm, height: heightMm },
        resolution: 300, // PDFs are typically 300 DPI for print
        colorSpace,
        hasBleed,
        hasLiveArea: widthMm > 50 && heightMm > 50,
        fonts,
        spotColors,
        fileType: 'PDF',
        textOutlined,
        fileSize: file.size
      }
    } catch (error) {
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async extractPDFFonts(pdfDoc: PDFDocument): Promise<string[]> {
    try {
      const fonts: string[] = []
      
      // Access the PDF's internal structure through pdf-lib
      const pdfContext = (pdfDoc as any).context
      
      if (pdfContext && pdfContext.indirectObjects) {
        console.log('Analyzing PDF internal structure for fonts...')
        
        // Method 1: Extract fonts from Font Resources in page dictionaries
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
                        
                        // Extract BaseFont name
                        const baseFont = fontDict.get('BaseFont')
                        if (baseFont) {
                          const fontName = baseFont.toString().replace('/', '')
                          if (fontName && fontName.length > 0) {
                            fonts.push(fontName)
                            console.log('Found font in page resources:', fontName)
                          }
                        }
                        
                        // Extract FontName (for embedded fonts)
                        const fontName = fontDict.get('FontName')
                        if (fontName) {
                          const name = fontName.toString().replace('/', '')
                          if (name && name.length > 0 && !fonts.includes(name)) {
                            fonts.push(name)
                            console.log('Found embedded font name:', name)
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
                              if (name && name.length > 0 && !fonts.includes(name)) {
                                fonts.push(name)
                                console.log('Found font descriptor name:', name)
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
        
        // Method 2: Extract fonts from global Font Resources
        try {
          const catalog = pdfContext.lookup(pdfContext.trailer.Root)
          if (catalog && catalog.dict) {
            const pages = catalog.dict.get('Pages')
            if (pages) {
              const pagesObj = pdfContext.lookup(pages)
              if (pagesObj && pagesObj.dict) {
                const resources = pagesObj.dict.get('Resources')
                if (resources) {
                  const resourcesObj = pdfContext.lookup(resources)
                  if (resourcesObj && resourcesObj.dict) {
                    const font = resourcesObj.dict.get('Font')
                    if (font) {
                      const fontObj = pdfContext.lookup(font)
                      if (fontObj && fontObj.dict) {
                        // Process global font resources
                        for (const [fontKey, fontRef] of Object.entries(fontObj.dict)) {
                          try {
                            const fontRefObj = pdfContext.lookup(fontRef)
                            if (fontRefObj && fontRefObj.dict) {
                              const type = fontRefObj.dict.get('Type')
                              if (type && type.toString() === '/Font') {
                                const baseFont = fontRefObj.dict.get('BaseFont')
                                if (baseFont) {
                                  const fontName = baseFont.toString().replace('/', '')
                                  if (fontName && fontName.length > 0 && !fonts.includes(fontName)) {
                                    fonts.push(fontName)
                                    console.log('Found global font:', fontName)
                                  }
                                }
                              }
                            }
                          } catch (error) {
                            continue
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error processing global font resources:', error)
        }
        
        // Method 3: Check for text operators in content streams
        let hasTextOperators = false
        try {
          const pdfBytes = await pdfDoc.save()
          const pdfContent = new TextDecoder().decode(pdfBytes)
          
          // Look for text operators that indicate live text
          const textOperators = ['Tj', 'TJ', 'T*', 'Td', 'TD', 'Tm', 'Tc', 'Tw', 'Tz', 'TL', 'Ts', 'Tr', "'", '"']
          hasTextOperators = textOperators.some(operator => pdfContent.includes(operator))
          
          console.log('Text operators found:', hasTextOperators)
        } catch (error) {
          console.warn('Error checking text operators:', error)
        }
        
        // Remove duplicates and filter out common system fonts
        const uniqueFonts = [...new Set(fonts)].filter(font => {
          const systemFonts = ['Helvetica', 'Times-Roman', 'Courier', 'Symbol', 'ZapfDingbats', 'Arial', 'Times', 'CourierNew']
          return !systemFonts.includes(font)
        })
        
        console.log('Fonts extracted from internal structure:', uniqueFonts)
        
        if (uniqueFonts.length > 0) {
          return uniqueFonts
        } else if (hasTextOperators) {
          return ['Live Text Detected (Using Default Fonts)']
        } else {
          return []
        }
      }
      
      return []
    } catch (error) {
      console.error('Error extracting PDF fonts:', error)
      return []
    }
  }

  private async analyzePDFSpotColors(file: File): Promise<string[]> {
    try {
      // Use the advanced spot color detection API
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/detect-spot-colors', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Spot color detection failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.hasSpotColors) {
        // Convert the spot colors object to a readable format
        const spotColorList: string[] = []
        
        for (const [colorName, pages] of Object.entries(result.spotColors)) {
          const pagesStr = Array.isArray(pages) ? pages.join(', ') : String(pages)
          spotColorList.push(`${colorName} (Pages: ${pagesStr})`)
        }
        
        return spotColorList
      } else {
        return ['No spot colors detected - file uses process colors only']
      }
      
    } catch (error) {
      console.warn('Advanced spot color detection failed, falling back to basic detection:', error)
      
      // Fallback to basic detection using pdf-lib
      try {
        const arrayBuffer = await file.arrayBuffer()
        const { PDFDocument, PDFName, PDFDict, PDFRef } = await import('pdf-lib')
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = pdfDoc.getPages()
        
        const spotColors = new Set<string>()
        
        for (const page of pages) {
          try {
            // Get the page's resources
            const resources = page.node.Resources()
            if (resources) {
              // Look for color spaces and patterns that might indicate spot colors
              const colorSpaces = resources.lookup(PDFName.of('ColorSpace'))
              if (colorSpaces && colorSpaces instanceof PDFDict) {
                // This is a simplified detection - in practice you'd need more sophisticated analysis
                // to distinguish between process colors and spot colors
                spotColors.add('Spot colors may be present (requires advanced color analysis)')
              }
            }
          } catch (pageError) {
            console.warn('Error analyzing colors on page:', pageError)
            continue
          }
        }
        
        const colorList = Array.from(spotColors)
        
        if (colorList.length === 0) {
          return ['No spot colors detected - file uses process colors only']
        }
        
        return colorList
      } catch (fallbackError) {
        console.warn('Fallback spot color detection also failed:', fallbackError)
        return ['Color analysis failed - check console for details']
      }
    }
  }

  private async detectPDFColorSpace(pdfDoc: PDFDocument, file: File): Promise<string> {
    try {
      // Method 1: Check global color space
      const pdfContext = (pdfDoc as any).context
      
      if (pdfContext && pdfContext.indirectObjects) {
        console.log('Analyzing PDF internal structure for color space...')
        
        // Look for global color space definitions
        for (const [key, obj] of Object.entries(pdfContext.indirectObjects)) {
          try {
            if (obj && typeof obj === 'object' && 'dict' in obj) {
              const dict = (obj as any).dict
              
              if (dict && dict.get) {
                const colorSpace = dict.get('ColorSpace')
                if (colorSpace) {
                  const csString = colorSpace.toString()
                  
                  if (csString.includes('/DeviceCMYK') || csString.includes('/CMYK')) {
                    console.log('CMYK color space detected')
                    return 'CMYK'
                  }
                  if (csString.includes('/DeviceRGB') || csString.includes('/RGB')) {
                    console.log('RGB color space detected')
                    return 'RGB'
                  }
                  if (csString.includes('/DeviceGray') || csString.includes('/Gray')) {
                    console.log('Grayscale color space detected')
                    return 'GRAYSCALE'
                  }
                }
              }
            }
          } catch (error) {
            continue
          }
        }
      }
      
      // Method 2: Check page resources
      const pages = pdfDoc.getPages()
      for (const page of pages) {
        try {
          const pageDict = (page as any).node
          if (pageDict && pageDict.Resources) {
            const resources = pageDict.Resources
            
            // Check for ColorSpace in resources
            if (resources.ColorSpace) {
              const colorSpaceDict = resources.ColorSpace
              for (const [colorKey, colorRef] of Object.entries(colorSpaceDict)) {
                try {
                  const colorObj = pdfContext.lookup(colorRef)
                  if (colorObj && colorObj.dict) {
                    const colorSpace = colorObj.dict.get('ColorSpace')
                    if (colorSpace) {
                      const csString = colorSpace.toString()
                      
                      if (csString.includes('/DeviceCMYK') || csString.includes('/CMYK')) {
                        console.log('CMYK color space detected in page resources')
                        return 'CMYK'
                      }
                      if (csString.includes('/DeviceRGB') || csString.includes('/RGB')) {
                        console.log('RGB color space detected in page resources')
                        return 'RGB'
                      }
                      if (csString.includes('/DeviceGray') || csString.includes('/Gray')) {
                        console.log('Grayscale color space detected in page resources')
                        return 'GRAYSCALE'
                      }
                    }
                  }
                } catch (error) {
                  continue
                }
              }
            }
          }
        } catch (error) {
          continue
        }
      }
      
      // Method 3: Analyze PDF content
      const pdfBytes = await pdfDoc.save()
      const pdfContent = new TextDecoder().decode(pdfBytes)
      
      // Look for color space indicators
      if (pdfContent.includes('/DeviceCMYK') || pdfContent.includes('/CMYK')) {
        console.log('CMYK color space found in content')
        return 'CMYK'
      }
      if (pdfContent.includes('/DeviceRGB') || pdfContent.includes('/RGB')) {
        console.log('RGB color space found in content')
        return 'RGB'
      }
      if (pdfContent.includes('/DeviceGray') || pdfContent.includes('/Gray')) {
        console.log('Grayscale color space found in content')
        return 'GRAYSCALE'
      }
      
      // Check for ICC profiles
      if (pdfContent.includes('/ICCBased')) {
        console.log('ICC profile found - likely CMYK')
        return 'CMYK'
      }
      
      // Check for separation colors
      if (pdfContent.includes('/Separation') || pdfContent.includes('/DeviceN')) {
        console.log('Separation colors found - assuming CMYK')
        return 'CMYK'
      }
      
      // Check if we detected spot colors
      const spotColors = await this.analyzePDFSpotColors(file)
      if (spotColors.length > 0) {
        console.log('Spot colors detected - assuming CMYK')
        return 'CMYK'
      }
      
      // Default based on file characteristics
      if (pages.length > 0) {
        const firstPage = pages[0]
        const { width, height } = firstPage.getSize()
        
        // Large dimensions suggest print format
        if (width > 500 && height > 500) {
          console.log('Large dimensions detected - assuming CMYK for print')
          return 'CMYK'
        }
      }
      
      console.log('No clear color space indicators - defaulting to RGB')
      return 'RGB'
      
    } catch (error) {
      console.error('Error detecting PDF color space:', error)
      return 'RGB'
    }
  }

  private checkForBleed(widthMm: number, heightMm: number): boolean {
    // Check if dimensions suggest bleed (if the image is larger than typical print sizes)
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
  }
} 
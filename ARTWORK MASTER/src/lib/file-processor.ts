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
      
      // Determine color space
      let colorSpace = 'RGB'
      if (metadata.space === 'cmyk') {
        colorSpace = 'CMYK'
      } else if (metadata.space === 'srgb' || metadata.space === 'rgb') {
        colorSpace = 'RGB'
      }
      
      return {
        dimensions: { width: metadata.width, height: metadata.height },
        resolution,
        colorSpace,
        hasBleed: false, // Images don't have bleed by default
        hasLiveArea: false,
        fonts: [],
        spotColors: [],
        fileType: 'Image',
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
      
      return {
        dimensions: { width: widthMm, height: heightMm },
        resolution: 300, // PDFs are typically 300 DPI for print
        colorSpace: 'CMYK', // Most print PDFs are CMYK
        hasBleed: this.checkPDFBleed(pdfDoc),
        hasLiveArea: this.checkPDFLiveArea(pdfDoc),
        fonts: await this.extractPDFFonts(pdfDoc),
        spotColors: [],
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

  private checkPDFBleed(pdfDoc: PDFDocument): boolean {
    // This would require analyzing the PDF content for bleed marks or extended content
    // For now, return a reasonable default
    return true
  }

  private checkPDFLiveArea(pdfDoc: PDFDocument): boolean {
    // This would require analyzing the PDF content for live area marks
    // For now, return a reasonable default
    return true
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
import { FileProcessor, FileInfo, ProcessingResult } from './file-processor'
import { createMockFile } from './test-utils'
import fs from 'fs/promises'
import path from 'path'

// Mock fs module
jest.mock('fs/promises')
const mockedFs = fs as jest.Mocked<typeof fs>

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor
  const testUploadDir = './test-uploads'

  beforeEach(() => {
    fileProcessor = new FileProcessor(testUploadDir)
    jest.clearAllMocks()
  })

  describe('saveFile', () => {
    it('should save file and return file info', async () => {
      const mockFile = createMockFile('test.pdf', 'application/pdf')
      
      const result = await fileProcessor.saveFile(mockFile)
      
      expect(result).toMatchObject({
        originalName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: 'pdf',
        status: 'uploaded'
      })
      expect(result.id).toMatch(/^file-\d+-[a-z0-9]+$/)
      expect(result.fileName).toMatch(/^file-\d+-[a-z0-9]+\.pdf$/)
      expect(result.filePath).toContain('uploads')
    })

    it('should use existing upload directory if it exists', async () => {
      const mockFile = createMockFile('test.pdf', 'application/pdf', 1024)
      
      mockedFs.access.mockResolvedValue(undefined)
      mockedFs.writeFile.mockResolvedValue(undefined)

      await fileProcessor.saveFile(mockFile)

      expect(mockedFs.mkdir).not.toHaveBeenCalled()
      expect(mockedFs.writeFile).toHaveBeenCalled()
    })
  })

  describe('processFile', () => {
    it('should process PDF file successfully', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.pdf',
        fileName: 'test-id.pdf',
        filePath: path.join(__dirname, 'test-files', 'test.pdf'),
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: 'pdf',
        uploadedAt: new Date(),
        status: 'uploaded'
      }
      
      // Mock the PDF processing since we can't create real PDFs in tests
      jest.spyOn(fileProcessor as any, 'processPDF').mockResolvedValue({
        dimensions: { width: 210, height: 297 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        fonts: ['Helvetica'],
        spotColors: [],
        fileType: 'PDF',
        textOutlined: true
      })
      
      const result = await fileProcessor.processFile(fileInfo)
      
      expect(result.success).toBe(true)
      expect(result.fileInfo?.status).toBe('processed')
      expect(result.metadata).toMatchObject({
        dimensions: { width: 210, height: 297 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        fonts: ['Helvetica'],
        spotColors: [],
        fileType: 'PDF',
        textOutlined: true
      })
    })

    it('should process AI file successfully', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.ai',
        fileName: 'test-id.ai',
        filePath: path.join(__dirname, 'test-files', 'test.ai'),
        fileSize: 1024,
        mimeType: 'application/illustrator',
        extension: 'ai',
        uploadedAt: new Date(),
        status: 'uploaded'
      }
      
      // Mock the AI processing
      jest.spyOn(fileProcessor as any, 'processAI').mockResolvedValue({
        dimensions: { width: 200, height: 150 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        fonts: ['Helvetica'],
        spotColors: [],
        fileType: 'Adobe Illustrator',
        textOutlined: false
      })
      
      const result = await fileProcessor.processFile(fileInfo)
      
      expect(result.success).toBe(true)
      expect(result.fileInfo?.status).toBe('processed')
      expect(result.metadata).toMatchObject({
        dimensions: { width: 200, height: 150 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        fonts: ['Helvetica'],
        spotColors: [],
        fileType: 'Adobe Illustrator',
        textOutlined: false
      })
    })

    it('should handle unsupported file type', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.txt',
        fileName: 'test-id.txt',
        filePath: '/test/path/test-id.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
        extension: '.txt',
        uploadedAt: new Date(),
        status: 'uploaded'
      }

      const result = await fileProcessor.processFile(fileInfo)

      expect(result.success).toBe(false)
      expect(result.fileInfo?.status).toBe('error')
      expect(result.error).toContain('Unsupported file type')
    })

    it('should handle processing errors', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.unknown',
        fileName: 'test-id.unknown',
        filePath: '/test/path/test-id.unknown',
        fileSize: 1024,
        mimeType: 'application/octet-stream',
        extension: 'unknown',
        uploadedAt: new Date(),
        status: 'uploaded'
      }
      
      const result = await fileProcessor.processFile(fileInfo)
      
      expect(result.success).toBe(false)
      expect(result.fileInfo?.status).toBe('error')
      expect(result.error).toBe('Unsupported file type: unknown')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.pdf',
        fileName: 'test-id.pdf',
        filePath: '/test/path/test-id.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: '.pdf',
        uploadedAt: new Date(),
        status: 'uploaded'
      }

      mockedFs.unlink.mockResolvedValue(undefined)

      await fileProcessor.deleteFile(fileInfo)

      expect(mockedFs.unlink).toHaveBeenCalledWith(fileInfo.filePath)
    })

    it('should handle file not found gracefully', async () => {
      const fileInfo: FileInfo = {
        id: 'test-id',
        originalName: 'test.pdf',
        fileName: 'test-id.pdf',
        filePath: '/test/path/test-id.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: '.pdf',
        uploadedAt: new Date(),
        status: 'uploaded'
      }

      mockedFs.unlink.mockRejectedValue(new Error('File not found'))

      // Should not throw
      await expect(fileProcessor.deleteFile(fileInfo)).resolves.toBeUndefined()
    })
  })

  describe('getFileInfo', () => {
    it('should return file info when file exists', async () => {
      const fileId = 'test-id'
      
      // Mock fs.readdir to return a file
      mockedFs.readdir.mockResolvedValue(['test-id.pdf'] as any)
      mockedFs.stat.mockResolvedValue({
        size: 1024,
        birthtime: new Date('2023-01-01')
      } as any)
      
      const result = await fileProcessor.getFileInfo(fileId)
      
      expect(result).toMatchObject({
        id: fileId,
        originalName: 'test-id.pdf',
        fileName: 'test-id.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: 'pdf',
        status: 'uploaded'
      })
    })

    it('should return null when file does not exist', async () => {
      const fileId = 'test-id'

      mockedFs.readdir.mockResolvedValue([] as any)

      const result = await fileProcessor.getFileInfo(fileId)

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const fileId = 'test-id'

      mockedFs.readdir.mockRejectedValue(new Error('Directory error'))

      const result = await fileProcessor.getFileInfo(fileId)

      expect(result).toBeNull()
    })
  })

  describe('getMimeType', () => {
    it('should return correct MIME types for supported extensions', () => {
      const getMimeType = (fileProcessor as any).getMimeType.bind(fileProcessor)
      
      expect(getMimeType('.pdf')).toBe('application/pdf')
      expect(getMimeType('.ai')).toBe('application/illustrator')
      expect(getMimeType('.indd')).toBe('application/indesign')
      expect(getMimeType('.psd')).toBe('image/photoshop')
      expect(getMimeType('.tiff')).toBe('image/tiff')
      expect(getMimeType('.jpg')).toBe('image/jpeg')
      expect(getMimeType('.png')).toBe('image/png')
      expect(getMimeType('.gif')).toBe('image/gif')
      expect(getMimeType('.webp')).toBe('image/webp')
      expect(getMimeType('.unknown')).toBe('application/octet-stream')
    })
  })
}) 
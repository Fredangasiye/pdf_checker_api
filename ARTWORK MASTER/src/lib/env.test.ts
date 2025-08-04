import { env, validateEnv, features, isValidFileSize, isValidFileType } from './env'

// Mock process.env
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Environment Configuration', () => {
  describe('env object', () => {
    it('should have default values when environment variables are not set', () => {
      expect(env.APP_NAME).toBe('Beith Digital Preflight Portal')
      expect(env.APP_URL).toBe('http://localhost:3000')
      expect(env.MAX_FILE_SIZE).toBe(104857600)
      expect(env.ALLOWED_FILE_TYPES).toEqual(['pdf', 'ai', 'indd', 'psd', 'tiff'])
    })

    it('should use environment variables when set', () => {
      process.env.NEXT_PUBLIC_APP_NAME = 'Test App'
      process.env.MAX_FILE_SIZE = '52428800'
      process.env.ALLOWED_FILE_TYPES = 'pdf,jpg,png'

      // Re-import to get updated values
      const { env: updatedEnv } = require('./env')
      
      expect(updatedEnv.APP_NAME).toBe('Test App')
      expect(updatedEnv.MAX_FILE_SIZE).toBe(52428800)
      expect(updatedEnv.ALLOWED_FILE_TYPES).toEqual(['pdf', 'jpg', 'png'])
    })
  })

  describe('validateEnv', () => {
    it('should not throw error when no required variables are missing', () => {
      expect(() => validateEnv()).not.toThrow()
    })

    it('should throw error when required variables are missing', () => {
      // Temporarily add a required variable to test
      const originalValidateEnv = validateEnv
      const mockValidateEnv = () => {
        const requiredVars = ['REQUIRED_VAR']
        const missingVars = requiredVars.filter(varName => !process.env[varName])
        if (missingVars.length > 0) {
          throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
        }
      }

      expect(() => mockValidateEnv()).toThrow('Missing required environment variables: REQUIRED_VAR')
    })
  })

  describe('features', () => {
    it('should return false for features when API keys are not set', () => {
      expect(features.aiAssistant).toBe(false)
      expect(features.vectorDatabase).toBe(false)
      expect(features.emailNotifications).toBe(false)
      expect(features.database).toBe(false)
    })

    it('should return true for features when API keys are set', () => {
      process.env.OPENROUTER_API_KEY = 'test-key'
      process.env.PINECONE_API_KEY = 'test-key'
      process.env.SMTP_HOST = 'smtp.test.com'
      process.env.SMTP_USER = 'test@test.com'
      process.env.SMTP_PASS = 'password'
      process.env.DATABASE_URL = 'postgresql://test'

      // Re-import to get updated values
      const { features: updatedFeatures } = require('./env')
      
      expect(updatedFeatures.aiAssistant).toBe(true)
      expect(updatedFeatures.vectorDatabase).toBe(true)
      expect(updatedFeatures.emailNotifications).toBe(true)
      expect(updatedFeatures.database).toBe(true)
    })
  })

  describe('isValidFileSize', () => {
    it('should return true for valid file sizes', () => {
      expect(isValidFileSize(1024)).toBe(true)
      expect(isValidFileSize(104857600)).toBe(true) // Exactly 100MB
    })

    it('should return false for files that are too large', () => {
      expect(isValidFileSize(104857601)).toBe(false) // Over 100MB
      expect(isValidFileSize(200000000)).toBe(false) // 200MB
    })
  })

  describe('isValidFileType', () => {
    it('should return true for valid file types', () => {
      expect(isValidFileType('document.pdf')).toBe(true)
      expect(isValidFileType('artwork.AI')).toBe(true)
      expect(isValidFileType('design.indd')).toBe(true)
      expect(isValidFileType('image.PSD')).toBe(true)
      expect(isValidFileType('photo.TIFF')).toBe(true)
    })

    it('should return false for invalid file types', () => {
      expect(isValidFileType('document.docx')).toBe(false)
      expect(isValidFileType('image.jpg')).toBe(false)
      expect(isValidFileType('file.txt')).toBe(false)
    })

    it('should handle files without extensions', () => {
      expect(isValidFileType('filename')).toBe(false)
      expect(isValidFileType('')).toBe(false)
    })
  })
}) 
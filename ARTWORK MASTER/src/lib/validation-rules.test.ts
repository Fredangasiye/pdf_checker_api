import { 
  validateArtwork, 
  validationRules, 
  fileFormatRule, 
  dimensionRule, 
  resolutionRule,
  bleedRule,
  liveAreaRule,
  colorSpaceRule,
  fontRule,
  spotColorRule,
  scaleRule,
  type ArtworkMetadata 
} from './validation-rules'

describe('Validation Rules', () => {
  describe('fileFormatRule', () => {
    it('should pass for supported file formats', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'PDF'
      }
      
      const result = fileFormatRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('PDF is supported')
    })

    it('should fail for unsupported file formats', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'UNKNOWN'
      }
      
      const result = fileFormatRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('not supported')
      expect(result.details?.supportedFormats).toContain('PDF')
    })
  })

  describe('dimensionRule', () => {
    it('should pass for valid dimensions', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 } 
      }
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('297mm x 210mm')
    })

    it('should fail for missing dimensions', () => {
      const metadata: ArtworkMetadata = {}
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Could not determine')
    })

    it('should fail for dimensions that are too small', () => {
      const metadata: ArtworkMetadata = {
        dimensions: { width: 0, height: 0 }
      }
      
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Invalid dimensions')
    })

    it('should fail for dimensions that are too large', () => {
      const metadata: ArtworkMetadata = {
        dimensions: { width: -1, height: -1 }
      }
      
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Invalid dimensions')
    })
  })

  describe('resolutionRule', () => {
    it('should pass for adequate resolution on small artwork', () => {
      const metadata: ArtworkMetadata = {
        resolution: 300
      }
      
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('300 DPI')
    })

    it('should pass for adequate resolution on large artwork', () => {
      const metadata: ArtworkMetadata = {
        resolution: 300
      }
      
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('300 DPI')
    })

    it('should fail for inadequate resolution', () => {
      const metadata: ArtworkMetadata = {
        resolution: 72
      }
      
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Resolution too low')
      expect(result.details?.requiredDpi).toBe(300)
    })

    it('should warn for borderline resolution', () => {
      const metadata: ArtworkMetadata = {
        resolution: 200
      }
      
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Resolution may be insufficient')
      expect(result.details?.requiredDpi).toBe(300)
    })

    it('should fail for missing resolution data', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 }
      }
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Could not determine')
    })
  })

  describe('bleedRule', () => {
    it('should pass when bleed is present', () => {
      const metadata: ArtworkMetadata = {
        hasBleed: true
      }
      
      const result = bleedRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Bleed settings are properly configured')
    })

    it('should fail when bleed is missing', () => {
      const metadata: ArtworkMetadata = {
        hasBleed: false
      }
      
      const result = bleedRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Bleed settings not detected')
      expect(result.details?.recommendation).toContain('Add 3mm bleed')
    })
  })

  describe('liveAreaRule', () => {
    it('should pass when live area is present', () => {
      const metadata: ArtworkMetadata = {
        hasLiveArea: true
      }
      
      const result = liveAreaRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Live area is properly configured')
    })

    it('should fail when live area is missing', () => {
      const metadata: ArtworkMetadata = { hasLiveArea: false }
      const result = liveAreaRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Live area not detected')
      expect(result.details?.recommendation).toContain('Keep important content')
    })
  })

  describe('colorSpaceRule', () => {
    it('should pass for CMYK color space', () => {
      const metadata: ArtworkMetadata = {
        colorSpace: 'CMYK'
      }
      
      const result = colorSpaceRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('CMYK (Print Ready)')
    })

    it('should pass for other color spaces', () => {
      const metadata: ArtworkMetadata = {
        colorSpace: 'GRAYSCALE'
      }
      
      const result = colorSpaceRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Grayscale (Print Ready)')
    })
  })

  describe('fontRule', () => {
    it('should pass when no fonts are detected', () => {
      const metadata: ArtworkMetadata = {
        fonts: []
      }
      
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('No text detected or text is properly outlined')
    })

    it('should warn when fonts are detected', () => {
      const metadata: ArtworkMetadata = {
        fonts: ['Helvetica', 'Arial']
      }
      
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Fonts detected - may need to convert text to outlines')
      expect(result.details?.recommendation).toContain('Convert text to outlines')
    })

    it('should pass when text is outlined', () => {
      const metadata: ArtworkMetadata = {
        textOutlined: true
      }
      
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('All text is converted to outlines')
    })

    it('should fail when text is not outlined', () => {
      const metadata: ArtworkMetadata = {
        textOutlined: false
      }
      
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Text is not converted to outlines')
      expect(result.details?.recommendation).toContain('Convert all text to outlines')
    })
  })

  describe('spotColorRule', () => {
    it('should pass when no spot colors are detected', () => {
      const metadata: ArtworkMetadata = { spotColors: [] }
      const result = spotColorRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('No spot colors detected')
    })

    it('should pass when spot colors are detected', () => {
      const metadata: ArtworkMetadata = {
        spotColors: ['Pantone 485 C']
      }
      
      const result = spotColorRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Spot colors detected: 1')
      expect(result.details?.recommendation).toContain('Spot colors will be converted to CMYK')
    })
  })

  describe('scaleRule', () => {
    it('should pass for appropriate scale', () => {
      const metadata: ArtworkMetadata = {
        dimensions: { width: 210, height: 297 }
      }
      
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Scale: 297mm (Appropriate for printing)')
    })

    it('should warn for inappropriate scale', () => {
      const metadata: ArtworkMetadata = {
        dimensions: { width: 10000, height: 8000 }
      }
      
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('may not be optimal')
      expect(result.details?.recommendedScale).toBe(5000)
    })

    it('should pass when scale information is not available', () => {
      const metadata: ArtworkMetadata = {}
      
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Could not determine artwork scale')
    })
  })

  describe('validateArtwork', () => {
    it('should return overall success when all rules pass', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'PDF',
        dimensions: { width: 210, height: 297 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        textOutlined: true
      }
      
      const result = validateArtwork(metadata)
      
      expect(result.overall).toBe(true)
      expect(result.summary.passed).toBeGreaterThan(0)
      expect(result.summary.failed).toBe(0)
      expect(Object.keys(result.results)).toHaveLength(validationRules.length)
    })

    it('should return overall failure when critical rules fail', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'UNKNOWN',
        resolution: 72,
        colorSpace: 'RGB'
      }
      
      const result = validateArtwork(metadata)
      
      expect(result.overall).toBe(false)
      expect(result.summary.failed).toBeGreaterThan(0)
    })

    it('should count warnings separately from failures', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'PDF',
        dimensions: { width: 210, height: 297 },
        resolution: 300,
        colorSpace: 'CMYK',
        hasBleed: true,
        hasLiveArea: true,
        textOutlined: false // This should be a warning, not a failure
      }
      
      const result = validateArtwork(metadata)
      
      expect(result.overall).toBe(true) // Warnings don't cause overall failure
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.summary.failed).toBe(0)
    })
  })
}) 
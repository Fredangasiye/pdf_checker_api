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
      const metadata: ArtworkMetadata = { fileType: 'pdf' }
      const result = fileFormatRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('PDF is supported')
    })

    it('should fail for unsupported file formats', () => {
      const metadata: ArtworkMetadata = { fileType: 'txt' }
      const result = fileFormatRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('not supported')
      expect(result.details?.supportedFormats).toContain('pdf')
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
        dimensions: { width: 5, height: 5 } 
      }
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('too small')
    })

    it('should fail for dimensions that are too large', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 60000, height: 60000 } 
      }
      const result = dimensionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('too large')
    })
  })

  describe('resolutionRule', () => {
    it('should pass for adequate resolution on small artwork', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 },
        trueDpi: 300
      }
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('300 DPI')
    })

    it('should pass for adequate resolution on large artwork', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 5000, height: 5000 },
        trueDpi: 150
      }
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('150 DPI')
    })

    it('should fail for inadequate resolution', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 },
        trueDpi: 72
      }
      const result = resolutionRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Resolution too low')
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
      const metadata: ArtworkMetadata = { hasBleed: true }
      const result = bleedRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Bleed is properly set')
    })

    it('should fail when bleed is missing', () => {
      const metadata: ArtworkMetadata = { hasBleed: false }
      const result = bleedRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('does not have bleed')
      expect(result.details?.recommendation).toContain('Add bleed')
    })
  })

  describe('liveAreaRule', () => {
    it('should pass when live area is present', () => {
      const metadata: ArtworkMetadata = { hasLiveArea: true }
      const result = liveAreaRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Live area is properly defined')
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
      const metadata: ArtworkMetadata = { colorSpace: 'CMYK' }
      const result = colorSpaceRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('CMYK (print-ready)')
    })

    it('should fail for RGB color space', () => {
      const metadata: ArtworkMetadata = { colorSpace: 'RGB' }
      const result = colorSpaceRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('RGB color space')
      expect(result.details?.recommendation).toContain('Convert your artwork to CMYK')
    })

    it('should pass for other color spaces', () => {
      const metadata: ArtworkMetadata = { colorSpace: 'Grayscale' }
      const result = colorSpaceRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('GRAYSCALE')
    })
  })

  describe('fontRule', () => {
    it('should pass when no fonts are detected', () => {
      const metadata: ArtworkMetadata = { fonts: [] }
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('No fonts detected')
    })

    it('should warn when fonts are detected', () => {
      const metadata: ArtworkMetadata = { fonts: ['Arial', 'Times New Roman'] }
      const result = fontRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('Found 2 font(s)')
      expect(result.details?.recommendation).toContain('Convert text to outlines')
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
      const metadata: ArtworkMetadata = { spotColors: ['Pantone 485 C'] }
      const result = spotColorRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Found 1 spot color(s)')
      expect(result.details?.note).toContain('standard Pantone Coated colors')
    })
  })

  describe('scaleRule', () => {
    it('should pass for appropriate scale', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 },
        scale: 100
      }
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Scale: 100%')
    })

    it('should warn for inappropriate scale', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 10000, height: 10000 },
        scale: 100
      }
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(false)
      expect(result.message).toContain('may not be optimal')
      expect(result.details?.recommendedScale).toBe(50)
    })

    it('should pass when scale information is not available', () => {
      const metadata: ArtworkMetadata = { 
        dimensions: { width: 210, height: 297 }
      }
      const result = scaleRule.validate(metadata)
      
      expect(result.passed).toBe(true)
      expect(result.message).toContain('Scale information not available')
    })
  })

  describe('validateArtwork', () => {
    it('should return overall success when all rules pass', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'pdf',
        dimensions: { width: 210, height: 297 },
        trueDpi: 300,
        hasBleed: true,
        hasLiveArea: true,
        colorSpace: 'CMYK',
        fonts: [],
        spotColors: [],
        scale: 100
      }

      const result = validateArtwork(metadata)

      expect(result.overall).toBe(true)
      expect(result.summary.passed).toBeGreaterThan(0)
      expect(result.summary.failed).toBe(0)
      expect(Object.keys(result.results)).toHaveLength(validationRules.length)
    })

    it('should return overall failure when critical rules fail', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'txt', // Unsupported format
        dimensions: { width: 210, height: 297 },
        trueDpi: 72, // Too low
        hasBleed: false,
        hasLiveArea: true,
        colorSpace: 'RGB', // Wrong color space
        fonts: [],
        spotColors: [],
        scale: 100
      }

      const result = validateArtwork(metadata)

      expect(result.overall).toBe(false)
      expect(result.summary.failed).toBeGreaterThan(0)
      expect(result.results['File Format'].passed).toBe(false)
      expect(result.results['Resolution'].passed).toBe(false)
      expect(result.results['Color Space'].passed).toBe(false)
    })

    it('should count warnings separately from failures', () => {
      const metadata: ArtworkMetadata = {
        fileType: 'pdf',
        dimensions: { width: 210, height: 297 },
        trueDpi: 300,
        hasBleed: true,
        hasLiveArea: false, // Warning
        colorSpace: 'CMYK',
        fonts: ['Arial'], // Warning
        spotColors: [],
        scale: 100
      }

      const result = validateArtwork(metadata)

      expect(result.overall).toBe(true) // Warnings don't cause overall failure
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.summary.failed).toBe(0)
    })
  })
}) 
// Beith Digital Artwork Validation Rules
// Based on the provided Artwork Guidelines document

export interface ValidationRule {
  name: string
  description: string
  validate: (metadata: any) => ValidationResult
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationResult {
  passed: boolean
  message: string
  details?: any
}

export interface ArtworkMetadata {
  dimensions?: { width: number; height: number }
  resolution?: number
  colorSpace?: string
  hasBleed?: boolean
  hasLiveArea?: boolean
  fonts?: string[]
  spotColors?: string[]
  fileType?: string
  scale?: number
  trueDpi?: number
  textOutlined?: boolean
}

export const fileFormatRule: ValidationRule = {
  name: 'File Format',
  description: 'Check if file format is supported',
  severity: 'error',
  validate: (metadata: ArtworkMetadata) => {
    const supportedFormats = ['PDF', 'Adobe Illustrator', 'Adobe InDesign', 'Adobe Photoshop', 'TIFF', 'TIF', 'Image']
    const fileType = metadata.fileType || 'Unknown'
    
    if (supportedFormats.includes(fileType)) {
      return {
        passed: true,
        message: `File format ${fileType} is supported`
      }
    }
    
    return {
      passed: false,
      message: `File format "${fileType}" is not supported`,
      details: {
        recommendation: 'Please upload files in PDF, AI, INDD, PSD, TIFF, or TIF format',
        supportedFormats: supportedFormats
      }
    }
  }
}

export const dimensionRule: ValidationRule = {
  name: 'Dimensions',
  description: 'Check artwork dimensions',
  severity: 'error',
  validate: (metadata: ArtworkMetadata) => {
    if (!metadata.dimensions) {
      return {
        passed: false,
        message: 'Could not determine artwork dimensions',
        details: {
          recommendation: 'Please ensure your artwork has proper dimensions set'
        }
      }
    }
    
    const { width, height } = metadata.dimensions
    
    if (width <= 0 || height <= 0) {
      return {
        passed: false,
        message: 'Invalid dimensions detected',
        details: {
          recommendation: 'Please check your artwork dimensions'
        }
      }
    }
    
    return {
      passed: true,
      message: `Dimensions: ${height}mm x ${width}mm (Height x Width)`
    }
  }
}

export const resolutionRule: ValidationRule = {
  name: 'Resolution',
  description: 'Check artwork resolution',
  severity: 'error',
  validate: (metadata: ArtworkMetadata) => {
    if (!metadata.resolution) {
      return {
        passed: false,
        message: 'Could not determine resolution information',
        details: {
          recommendation: 'Please ensure your artwork has proper resolution settings'
        }
      }
    }
    
    const resolution = metadata.resolution
    
    if (resolution < 150) {
      return {
        passed: false,
        message: `Resolution too low. Required: 300 DPI, Actual: ${resolution} DPI`,
        details: {
          requiredDpi: 300,
          actualDpi: resolution,
          recommendation: 'Increase resolution to 300 DPI for print quality'
        }
      }
    } else if (resolution < 300) {
      return {
        passed: false,
        message: `Resolution may be insufficient. Recommended: 300 DPI, Actual: ${resolution} DPI`,
        details: {
          requiredDpi: 300,
          actualDpi: resolution,
          recommendation: 'Consider increasing resolution to 300 DPI for better print quality'
        }
      }
    }
    
    return {
      passed: true,
      message: `Resolution: ${resolution} DPI (Print Ready)`
    }
  }
}

export const bleedRule: ValidationRule = {
  name: 'Bleed',
  description: 'Check for proper bleed settings',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata) => {
    if (metadata.hasBleed === undefined) {
      return {
        passed: false,
        message: 'Could not determine bleed settings',
        details: {
          recommendation: 'Please ensure your artwork has 3mm bleed on all sides'
        }
      }
    }
    
    if (metadata.hasBleed) {
      return {
        passed: true,
        message: 'Bleed settings are properly configured'
      }
    }
    
    return {
      passed: false,
      message: 'Bleed settings not detected',
      details: {
        recommendation: 'Add 3mm bleed on all sides to ensure proper printing',
        examples: {
          'A4 with bleed': '216mm x 303mm (210mm + 6mm)',
          'Bleed area': '3mm on all sides'
        }
      }
    }
  }
}

export const liveAreaRule: ValidationRule = {
  name: 'Live Area',
  description: 'Check for safe printing area',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata) => {
    if (metadata.hasLiveArea === undefined) {
      return {
        passed: false,
        message: 'Could not determine live area settings',
        details: {
          recommendation: 'Please ensure important content is within safe printing area'
        }
      }
    }
    
    if (metadata.hasLiveArea) {
      return {
        passed: true,
        message: 'Live area is properly configured'
      }
    }
    
    return {
      passed: false,
      message: 'Live area not detected',
      details: {
        recommendation: 'Keep important content 5mm from trim edges',
        examples: {
          'Safe area': '5mm from all edges',
          'Text placement': 'Avoid placing text too close to edges'
        }
      }
    }
  }
}

export const colorSpaceRule: ValidationRule = {
  name: 'Color Space',
  description: 'Check color space for print compatibility',
  severity: 'error',
  validate: (metadata: ArtworkMetadata) => {
    if (!metadata.colorSpace) {
      return {
        passed: false,
        message: 'Could not determine color space',
        details: {
          recommendation: 'Please ensure your artwork uses CMYK color space for printing'
        }
      }
    }
    
    const colorSpace = metadata.colorSpace.toUpperCase()
    
    if (colorSpace === 'RGB') {
      return {
        passed: false,
        message: 'Artwork is in RGB color space. Convert to CMYK for printing.',
        details: {
          recommendation: 'Convert your artwork to CMYK color space before printing',
          currentSpace: 'RGB',
          requiredSpace: 'CMYK'
        }
      }
    } else if (colorSpace === 'CMYK') {
      return {
        passed: true,
        message: 'Color space: CMYK (Print Ready)'
      }
    } else if (colorSpace === 'GRAYSCALE') {
      return {
        passed: true,
        message: 'Color space: Grayscale (Print Ready)'
      }
    }
    
    return {
      passed: true,
      message: `Color space: ${colorSpace} (Print Ready)`
    }
  }
}

export const fontRule: ValidationRule = {
  name: 'Text Outlining',
  description: 'Check if text is converted to outlines',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata) => {
    if (metadata.textOutlined === true) {
      return {
        passed: true,
        message: 'All text is converted to outlines (Print Ready)'
      }
    }
    
    if (metadata.textOutlined === false) {
      return {
        passed: false,
        message: 'Text is not converted to outlines',
        details: {
          recommendation: 'Convert all text to outlines to avoid font substitution issues',
          examples: {
            'Adobe Illustrator': 'Select text → Type → Create Outlines',
            'Adobe InDesign': 'Select text → Type → Create Outlines',
            'Adobe Photoshop': 'Text layers should be rasterized'
          }
        }
      }
    }
    
    // If we can't determine text outlining status
    if (metadata.fonts && metadata.fonts.length > 0) {
      return {
        passed: false,
        message: 'Fonts detected - may need to convert text to outlines',
        details: {
          fonts: metadata.fonts,
          recommendation: 'Convert text to outlines to avoid font substitution issues',
          examples: {
            'Adobe Illustrator': 'Select text → Type → Create Outlines',
            'Adobe InDesign': 'Select text → Type → Create Outlines'
          }
        }
      }
    }
    
    return {
      passed: true,
      message: 'No text detected or text is properly outlined'
    }
  }
}

export const spotColorRule: ValidationRule = {
  name: 'Spot Colors',
  description: 'Check for spot color usage',
  severity: 'info',
  validate: (metadata: ArtworkMetadata) => {
    if (!metadata.spotColors || metadata.spotColors.length === 0) {
      return {
        passed: true,
        message: 'No spot colors detected (CMYK only)'
      }
    }
    
    const spotColors = metadata.spotColors
    
    return {
      passed: true,
      message: `Spot colors detected: ${spotColors.length}`,
      details: {
        spotColors: spotColors,
        recommendation: 'Spot colors will be converted to CMYK unless specifically requested',
        examples: {
          'Pantone colors': 'Will be converted to closest CMYK equivalent',
          'Custom colors': 'Ensure they are properly defined'
        }
      }
    }
  }
}

export const scaleRule: ValidationRule = {
  name: 'Scale',
  description: 'Check artwork scale appropriateness',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata) => {
    if (!metadata.dimensions) {
      return {
        passed: false,
        message: 'Could not determine artwork scale',
        details: {
          recommendation: 'Please check your artwork dimensions'
        }
      }
    }
    
    const { width, height } = metadata.dimensions
    const maxDimension = Math.max(width, height)
    
    if (maxDimension > 5000) {
      return {
        passed: false,
        message: 'Artwork scale may not be optimal for printing',
        details: {
          recommendation: 'Consider reducing scale to improve processing time',
          recommendedScale: Math.round(maxDimension / 2),
          currentScale: maxDimension
        }
      }
    }
    
    return {
      passed: true,
      message: `Scale: ${maxDimension}mm (Appropriate for printing)`
    }
  }
}

export const validationRules: ValidationRule[] = [
  fileFormatRule,
  dimensionRule,
  resolutionRule,
  bleedRule,
  liveAreaRule,
  colorSpaceRule,
  fontRule,
  spotColorRule,
  scaleRule
]

export function validateArtwork(metadata: ArtworkMetadata): {
  overall: boolean
  results: Record<string, ValidationResult>
  summary: {
    passed: number
    failed: number
    warnings: number
  }
} {
  const results: Record<string, ValidationResult> = {}
  let passed = 0
  let failed = 0
  let warnings = 0

  validationRules.forEach(rule => {
    const result = rule.validate(metadata)
    results[rule.name] = result
    
    if (result.passed) {
      passed++
    } else if (rule.severity === 'warning') {
      warnings++
    } else {
      failed++
    }
  })

  return {
    overall: failed === 0,
    results,
    summary: {
      passed,
      failed,
      warnings
    }
  }
} 
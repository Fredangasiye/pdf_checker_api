// Beith Digital Artwork Validation Rules
// Based on the provided Artwork Guidelines document

export interface ValidationRule {
  name: string
  description: string
  validate: (metadata: any) => ValidationResult
  severity: 'error' | 'warning'
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
}

// File format validation
export const fileFormatRule: ValidationRule = {
  name: 'File Format',
  description: 'Check if file format is supported',
  severity: 'error',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    const supportedFormats = ['pdf', 'ai', 'indd', 'psd', 'tiff', 'tif']
    const fileType = metadata.fileType?.toLowerCase()
    
    if (!fileType || !supportedFormats.includes(fileType)) {
      return {
        passed: false,
        message: `File format "${fileType}" is not supported. Please use: ${supportedFormats.join(', ').toUpperCase()}`,
        details: { supportedFormats, actualFormat: fileType }
      }
    }
    
    return {
      passed: true,
      message: `File format ${fileType.toUpperCase()} is supported`
    }
  }
}

// Dimension validation (Height x Width format)
export const dimensionRule: ValidationRule = {
  name: 'Dimensions',
  description: 'Check artwork dimensions in Height x Width format',
  severity: 'error',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.dimensions) {
      return {
        passed: false,
        message: 'Could not determine artwork dimensions',
        details: { error: 'No dimension data available' }
      }
    }

    const { width, height } = metadata.dimensions
    
    // Check if dimensions are reasonable (not too small or too large)
    if (width < 10 || height < 10) {
      return {
        passed: false,
        message: 'Artwork dimensions are too small. Minimum size is 10mm x 10mm',
        details: { width, height, minSize: 10 }
      }
    }

    if (width > 50000 || height > 50000) {
      return {
        passed: false,
        message: 'Artwork dimensions are too large. Maximum size is 50000mm x 50000mm',
        details: { width, height, maxSize: 50000 }
      }
    }

    return {
      passed: true,
      message: `Dimensions: ${height}mm x ${width}mm (Height x Width)`,
      details: { width, height, format: 'Height x Width' }
    }
  }
}

// Resolution validation based on Beith Digital's scale table
export const resolutionRule: ValidationRule = {
  name: 'Resolution',
  description: 'Check resolution based on artwork size and scale',
  severity: 'error',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.dimensions || !metadata.trueDpi) {
      return {
        passed: false,
        message: 'Could not determine resolution information',
        details: { error: 'Missing dimension or DPI data' }
      }
    }

    const { width, height } = metadata.dimensions
    const trueDpi = metadata.trueDpi
    const maxDimension = Math.max(width, height)

    // Beith Digital's resolution requirements based on size
    let requiredDpi = 300
    let viewingDistance = 'Close'

    if (maxDimension <= 2500) {
      requiredDpi = 300
      viewingDistance = 'Close'
    } else if (maxDimension <= 5000) {
      requiredDpi = 150
      viewingDistance = 'Close'
    } else if (maxDimension <= 10000) {
      requiredDpi = 100
      viewingDistance = 'Moderate'
    } else if (maxDimension <= 20000) {
      requiredDpi = 38
      viewingDistance = 'Far'
    } else {
      requiredDpi = 19
      viewingDistance = 'Very Far'
    }

    if (trueDpi < requiredDpi) {
      return {
        passed: false,
        message: `Resolution too low. Required: ${requiredDpi} DPI, Actual: ${trueDpi} DPI (${viewingDistance} viewing distance)`,
        details: { 
          requiredDpi, 
          actualDpi: trueDpi, 
          viewingDistance,
          size: `${width}mm x ${height}mm`
        }
      }
    }

    return {
      passed: true,
      message: `Resolution: ${trueDpi} DPI (${viewingDistance} viewing distance)`,
      details: { 
        dpi: trueDpi, 
        viewingDistance,
        size: `${width}mm x ${height}mm`
      }
    }
  }
}

// Bleed validation
export const bleedRule: ValidationRule = {
  name: 'Bleed',
  description: 'Check if artwork has proper bleed',
  severity: 'error',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.hasBleed) {
      return {
        passed: false,
        message: 'Artwork does not have bleed. Bleed is required for all print jobs.',
        details: { 
          recommendation: 'Add bleed to your artwork (typically 3-10mm depending on size)',
          examples: {
            'Decal (300x500mm)': 'Add 3mm bleed',
            'Poster (841x594mm)': 'Add 5mm bleed',
            'Billboard (4500x18000mm)': 'Add 60mm bleed'
          }
        }
      }
    }

    return {
      passed: true,
      message: 'Bleed is properly set'
    }
  }
}

// Live area validation
export const liveAreaRule: ValidationRule = {
  name: 'Live Area',
  description: 'Check if critical content is within safe live area',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.hasLiveArea) {
      return {
        passed: false,
        message: 'Live area not detected. Critical content should be within safe margins.',
        details: {
          recommendation: 'Keep important content away from edges (typically 10-50mm depending on size)',
          examples: {
            'Decal (300x500mm)': 'Keep content 10mm from edges',
            'Poster (841x594mm)': 'Keep content 10mm from edges',
            'Billboard (4500x18000mm)': 'Keep content 100mm from edges'
          }
        }
      }
    }

    return {
      passed: true,
      message: 'Live area is properly defined'
    }
  }
}

// Color space validation
export const colorSpaceRule: ValidationRule = {
  name: 'Color Space',
  description: 'Check if artwork uses CMYK color space',
  severity: 'error',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.colorSpace) {
      return {
        passed: false,
        message: 'Could not determine color space',
        details: { error: 'No color space information available' }
      }
    }

    const colorSpace = metadata.colorSpace.toLowerCase()
    
    if (colorSpace === 'rgb') {
      return {
        passed: false,
        message: 'Artwork is in RGB color space. Convert to CMYK for printing.',
        details: {
          recommendation: 'Convert your artwork to CMYK color space before printing',
          currentSpace: 'RGB',
          requiredSpace: 'CMYK'
        }
      }
    }

    if (colorSpace === 'cmyk') {
      return {
        passed: true,
        message: 'Color space is CMYK (print-ready)',
        details: { colorSpace: 'CMYK' }
      }
    }

    return {
      passed: true,
      message: `Color space: ${colorSpace.toUpperCase()}`,
      details: { colorSpace }
    }
  }
}

// Font validation
export const fontRule: ValidationRule = {
  name: 'Fonts',
  description: 'Check if fonts are embedded or converted to outlines',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.fonts || metadata.fonts.length === 0) {
      return {
        passed: true,
        message: 'No fonts detected (likely converted to outlines)'
      }
    }

    return {
      passed: false,
      message: `Found ${metadata.fonts.length} font(s). Ensure fonts are embedded or converted to outlines.`,
      details: {
        fonts: metadata.fonts,
        recommendation: 'Convert text to outlines or embed fonts to avoid printing issues'
      }
    }
  }
}

// Spot color validation
export const spotColorRule: ValidationRule = {
  name: 'Spot Colors',
  description: 'Check for spot colors and provide guidance',
  severity: 'info',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.spotColors || metadata.spotColors.length === 0) {
      return {
        passed: true,
        message: 'No spot colors detected'
      }
    }

    return {
      passed: true,
      message: `Found ${metadata.spotColors.length} spot color(s)`,
      details: {
        spotColors: metadata.spotColors,
        note: 'Spot colors are supported. Use only standard Pantone Coated colors for best results.'
      }
    }
  }
}

// Scale validation
export const scaleRule: ValidationRule = {
  name: 'Scale',
  description: 'Check if artwork scale is appropriate for size',
  severity: 'warning',
  validate: (metadata: ArtworkMetadata): ValidationResult => {
    if (!metadata.dimensions || !metadata.scale) {
      return {
        passed: true,
        message: 'Scale information not available'
      }
    }

    const { width, height } = metadata.dimensions
    const scale = metadata.scale
    const maxDimension = Math.max(width, height)

    // Recommended scales based on Beith Digital guidelines
    let recommendedScale = 100
    if (maxDimension > 5000) recommendedScale = 50
    if (maxDimension > 10000) recommendedScale = 25
    if (maxDimension > 20000) recommendedScale = 10

    if (scale !== recommendedScale) {
      return {
        passed: false,
        message: `Scale ${scale}% may not be optimal. Recommended: ${recommendedScale}% for ${maxDimension}mm artwork.`,
        details: {
          currentScale: scale,
          recommendedScale,
          size: `${width}mm x ${height}mm`
        }
      }
    }

    return {
      passed: true,
      message: `Scale: ${scale}% (appropriate for artwork size)`,
      details: { scale, size: `${width}mm x ${height}mm` }
    }
  }
}

// Export all validation rules
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

// Main validation function
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

  for (const rule of validationRules) {
    const result = rule.validate(metadata)
    results[rule.name] = result

    if (result.passed) {
      passed++
    } else if (rule.severity === 'warning') {
      warnings++
    } else {
      failed++
    }
  }

  return {
    overall: failed === 0,
    results,
    summary: { passed, failed, warnings }
  }
} 
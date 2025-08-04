import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function that includes providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data helpers
export const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  })
  
  // Add arrayBuffer method for testing
  file.arrayBuffer = async () => {
    return new ArrayBuffer(size)
  }
  
  return file
}

export const createMockPreflightResult = (overrides = {}) => ({
  isValid: true,
  checks: {
    dimensions: { passed: true, message: 'Dimensions are correct' },
    resolution: { passed: true, message: 'Resolution meets requirements' },
    bleed: { passed: true, message: 'Bleed is properly set' },
    liveArea: { passed: true, message: 'Live area is within bounds' },
    colorSpace: { passed: true, message: 'Color space is CMYK' },
    fonts: { passed: true, message: 'Fonts are embedded or outlined' },
    overprint: { passed: true, message: 'Overprint settings are correct' },
  },
  ...overrides,
})

// Mock API responses
export const mockApiResponses = {
  upload: {
    success: { id: 'test-upload-id', status: 'uploaded' },
    error: { error: 'Upload failed', message: 'File too large' },
  },
  preflight: {
    success: createMockPreflightResult(),
    error: { error: 'Preflight failed', message: 'Invalid file format' },
  },
} 
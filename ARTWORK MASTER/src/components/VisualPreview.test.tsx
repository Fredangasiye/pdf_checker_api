import React from 'react'
import { render, screen } from '@/lib/test-utils'
import VisualPreview from './VisualPreview'

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock')
global.URL.revokeObjectURL = jest.fn()

function createMockFile(name: string, type: string, size = 1024): File {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: false })
  file.arrayBuffer = async () => new ArrayBuffer(size)
  return file
}

describe('VisualPreview', () => {
  it('renders image preview for supported image file', () => {
    const file = createMockFile('test.png', 'image/png')
    render(<VisualPreview file={file} />)
    expect(screen.getByAltText('Artwork preview')).toBeInTheDocument()
    expect(screen.getByText('Image Preview')).toBeInTheDocument()
  })

  it('renders fallback for unsupported file type', () => {
    const file = createMockFile('test.ai', 'application/postscript')
    render(<VisualPreview file={file} />)
    expect(screen.getByText('Preview not available for this file type')).toBeInTheDocument()
  })

  it('renders fallback for unknown file type', () => {
    const file = createMockFile('test', '')
    render(<VisualPreview file={file} />)
    expect(screen.getByText('Preview not available for this file type')).toBeInTheDocument()
  })

  it('renders fallback for server-provided preview URL', () => {
    const file = createMockFile('test.unknown', 'application/octet-stream')
    render(<VisualPreview file={file} fileUrl="https://example.com/preview.png" />)
    expect(screen.getByText('Preview not available for this file type')).toBeInTheDocument()
  })

  // PDF preview is difficult to test in JSDOM, so we skip this test for now
  it.skip('renders error for PDF preview if pdfjs fails', async () => {
    // This test is skipped due to dynamic import complexity in Jest
  })
})
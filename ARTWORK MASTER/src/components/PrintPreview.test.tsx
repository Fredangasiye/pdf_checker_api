import React from 'react'
import { render, screen } from '@/lib/test-utils'
import PrintPreview from './PrintPreview'

describe('PrintPreview', () => {
  const defaultProps = {
    artworkUrl: 'https://example.com/artwork.jpg',
    dimensions: { width: 210, height: 297 }
  }

  it('renders print preview with default settings', () => {
    render(<PrintPreview {...defaultProps} />)
    expect(screen.getByText('Print Preview')).toBeInTheDocument()
    expect(screen.getByAltText('Artwork preview')).toBeInTheDocument()
    expect(screen.getByText('Bleed (3mm)')).toBeInTheDocument()
    expect(screen.getByText('Trim line')).toBeInTheDocument()
    expect(screen.getByText('Live area')).toBeInTheDocument()
  })

  it('displays correct dimensions and scale', () => {
    render(<PrintPreview {...defaultProps} />)
    expect(screen.getByText('Dimensions: 210mm × 297mm | Scale: 50%')).toBeInTheDocument()
  })

  it('renders with custom bleed and live area', () => {
    render(
      <PrintPreview 
        {...defaultProps} 
        bleed={5}
        liveArea={{ top: 10, right: 10, bottom: 10, left: 10 }}
      />
    )
    expect(screen.getByText('Bleed (5mm)')).toBeInTheDocument()
  })

  it('renders with custom scale', () => {
    render(<PrintPreview {...defaultProps} scale={0.25} />)
    expect(screen.getByText('Dimensions: 210mm × 297mm | Scale: 25%')).toBeInTheDocument()
  })
}) 
import React from 'react'
import { render, screen, fireEvent } from '@/lib/test-utils'
import PreflightResults from './PreflightResults'
import { ValidationResult } from '@/lib/validation-rules'

describe('PreflightResults', () => {
  const mockResults: Record<string, ValidationResult> = {
    'File Format': {
      passed: true,
      message: 'File format PDF is supported'
    },
    'Dimensions': {
      passed: true,
      message: 'Dimensions: 297mm x 210mm (Height x Width)'
    },
    'Resolution': {
      passed: false,
      message: 'Resolution too low. Required: 300 DPI, Actual: 72 DPI',
      details: {
        requiredDpi: 300,
        actualDpi: 72,
        recommendation: 'Increase resolution to 300 DPI'
      }
    },
    'Color Space': {
      passed: false,
      message: 'Artwork is in RGB color space. Convert to CMYK for printing.',
      details: {
        recommendation: 'Convert your artwork to CMYK color space before printing',
        currentSpace: 'RGB',
        requiredSpace: 'CMYK'
      }
    }
  }

  const mockSummary = {
    passed: 2,
    failed: 2,
    warnings: 0
  }

  const mockMetadata = {
    dimensions: { width: 210, height: 297 },
    resolution: 72,
    colorSpace: 'RGB',
    fonts: ['Arial', 'Times New Roman']
  }

  it('renders preflight results with correct status', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        metadata={mockMetadata}
      />
    )

    expect(screen.getByText('Preflight Results')).toBeInTheDocument()
    expect(screen.getByText('test.pdf (1.0MB)')).toBeInTheDocument()
    expect(screen.getByText('Corrections Needed')).toBeInTheDocument()
  })

  it('shows "Print Ready" status when overall is true', () => {
    const allPassedResults = {
      'File Format': { passed: true, message: 'File format PDF is supported' },
      'Dimensions': { passed: true, message: 'Dimensions are correct' }
    }

    render(
      <PreflightResults
        results={allPassedResults}
        summary={{ passed: 2, failed: 0, warnings: 0 }}
        overall={true}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getByText('Print Ready')).toBeInTheDocument()
  })

  it('displays summary statistics correctly', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getAllByText('2')).toHaveLength(2) // Passed and Failed
    expect(screen.getByText('0')).toBeInTheDocument() // Warnings
    expect(screen.getByText('4')).toBeInTheDocument() // Total Checks
  })

  it('displays file metadata when provided', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        metadata={mockMetadata}
      />
    )

    expect(screen.getByText('File Information')).toBeInTheDocument()
    expect(screen.getAllByText(/297mm x 210mm/)).toHaveLength(2)
    expect(screen.getAllByText(/72 DPI/)).toHaveLength(2)
    expect(screen.getAllByText(/RGB/)).toHaveLength(2)
    expect(screen.getByText(/2 detected/)).toBeInTheDocument() // Fonts
  })

  it('displays validation details for each rule', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getByText('Validation Details')).toBeInTheDocument()
    expect(screen.getByText('File Format')).toBeInTheDocument()
    expect(screen.getByText('Dimensions')).toBeInTheDocument()
    expect(screen.getByText('Resolution')).toBeInTheDocument()
    expect(screen.getByText('Color Space')).toBeInTheDocument()
  })

  it('shows pass/fail status for each validation rule', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getAllByText('Passed')).toHaveLength(3) // Summary + 2 validation rules
    expect(screen.getAllByText('Failed')).toHaveLength(3) // Summary + 2 validation rules
  })

  it('displays detailed information for failed validations', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getByText(/Resolution too low/)).toBeInTheDocument()
    expect(screen.getByText(/RGB color space/)).toBeInTheDocument()
    expect(screen.getByText(/Increase resolution to 300 DPI/)).toBeInTheDocument()
    expect(screen.getByText(/Convert your artwork to CMYK/)).toBeInTheDocument()
  })

  it('shows action buttons', () => {
    const mockOnRetry = jest.fn()
    const mockOnDownload = jest.fn()

    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        onRetry={mockOnRetry}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('Upload New File')).toBeInTheDocument()
    expect(screen.getByText('Print Results')).toBeInTheDocument()
  })

  it('shows download button only when overall is true', () => {
    const mockOnDownload = jest.fn()

    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={true}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        onDownload={mockOnDownload}
      />
    )

    expect(screen.getByText('Download Report')).toBeInTheDocument()
  })

  it('calls onRetry when upload new file button is clicked', () => {
    const mockOnRetry = jest.fn()

    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        onRetry={mockOnRetry}
      />
    )

    fireEvent.click(screen.getByText('Upload New File'))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onDownload when download report button is clicked', () => {
    const mockOnDownload = jest.fn()

    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={true}
        fileName="test.pdf"
        fileSize={1024 * 1024}
        onDownload={mockOnDownload}
      />
    )

    fireEvent.click(screen.getByText('Download Report'))
    expect(mockOnDownload).toHaveBeenCalledTimes(1)
  })

  it('handles missing metadata gracefully', () => {
    render(
      <PreflightResults
        results={mockResults}
        summary={mockSummary}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    // Should not show file information section
    expect(screen.queryByText('File Information')).not.toBeInTheDocument()
  })

  it('displays examples when provided in details', () => {
    const resultsWithExamples = {
      'Bleed': {
        passed: false,
        message: 'Artwork does not have bleed',
        details: {
          recommendation: 'Add bleed to your artwork',
          examples: {
            'Decal (300x500mm)': 'Add 3mm bleed',
            'Poster (841x594mm)': 'Add 5mm bleed'
          }
        }
      }
    }

    render(
      <PreflightResults
        results={resultsWithExamples}
        summary={{ passed: 0, failed: 1, warnings: 0 }}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getByText('Examples:')).toBeInTheDocument()
    expect(screen.getByText(/Decal \(300x500mm\):/)).toBeInTheDocument()
    expect(screen.getByText(/Poster \(841x594mm\):/)).toBeInTheDocument()
  })

  it('displays fonts when provided in details', () => {
    const resultsWithFonts = {
      'Fonts': {
        passed: false,
        message: 'Found 2 font(s)',
        details: {
          fonts: ['Arial', 'Times New Roman'],
          recommendation: 'Convert text to outlines'
        }
      }
    }

    render(
      <PreflightResults
        results={resultsWithFonts}
        summary={{ passed: 0, failed: 1, warnings: 0 }}
        overall={false}
        fileName="test.pdf"
        fileSize={1024 * 1024}
      />
    )

    expect(screen.getByText('Fonts:')).toBeInTheDocument()
    expect(screen.getByText('• Arial')).toBeInTheDocument()
    expect(screen.getByText('• Times New Roman')).toBeInTheDocument()
  })
}) 
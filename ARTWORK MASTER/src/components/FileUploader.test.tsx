import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { createMockFile } from '@/lib/test-utils'
import FileUploader from './FileUploader'

describe('FileUploader', () => {
  const mockOnFileSelect = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload interface correctly', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} onError={mockOnError} />)
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF, AI, INDD, PSD, TIFF, TIF files up to 100MB/i)).toBeInTheDocument()
  })

  it('handles valid file selection', async () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    )

    const file = createMockFile('test.pdf', 'application/pdf', 1024)
    const input = screen.getByRole('button') // The clickable area

    fireEvent.click(input)

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('shows error for invalid file type', async () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    )

    const file = createMockFile('test.txt', 'text/plain', 1024)
    const input = screen.getByRole('button')

    fireEvent.click(input)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File type "txt" is not supported')
      )
    })
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('shows error for file that is too large', async () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        maxSize={1024} // 1KB limit
      />
    )

    const file = createMockFile('test.pdf', 'application/pdf', 2048) // 2KB file
    const input = screen.getByRole('button')

    fireEvent.click(input)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('File size (0.0MB) exceeds the maximum allowed size of 0MB')
      )
    })
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('shows upload progress when file is selected', async () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    )

    const file = createMockFile('test.pdf', 'application/pdf', 1024)
    const input = screen.getByRole('button')

    fireEvent.click(input)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })

    // Wait for progress to complete
    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('handles drag and drop events', async () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
      />
    )

    const uploadArea = screen.getByRole('button')
    const file = createMockFile('test.pdf', 'application/pdf', 1024)

    // Test drag over
    fireEvent.dragOver(uploadArea)
    expect(screen.getByText('Drop your file here to upload')).toBeInTheDocument()

    // Test drag leave
    fireEvent.dragLeave(uploadArea)
    expect(screen.queryByText('Drop your file here to upload')).not.toBeInTheDocument()

    // Test drop
    fireEvent.dragOver(uploadArea)
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file]
      }
    })

    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        disabled={true}
      />
    )

    const uploadArea = screen.getByRole('button')
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('accepts custom file types', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        acceptedTypes={['jpg', 'png']}
      />
    )

    expect(screen.getByText(/JPG, PNG files up to 100MB/i)).toBeInTheDocument()
  })

  it('accepts custom max file size', () => {
    render(
      <FileUploader
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        maxSize={52428800} // 50MB
      />
    )

    expect(screen.getByText(/PDF, AI, INDD, PSD, TIFF, TIF files up to 50MB/i)).toBeInTheDocument()
  })
}) 
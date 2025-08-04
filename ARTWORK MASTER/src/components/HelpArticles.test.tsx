import React from 'react'
import { render, screen, fireEvent } from '@/lib/test-utils'
import HelpArticles from './HelpArticles'

describe('HelpArticles', () => {
  it('renders help articles component', () => {
    render(<HelpArticles />)
    expect(screen.getByText('Help & Correction Guide')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search help articles...')).toBeInTheDocument()
  })

  it('displays article list', () => {
    render(<HelpArticles />)
    expect(screen.getByText('How to Fix Low Resolution Issues')).toBeInTheDocument()
    expect(screen.getByText('Converting RGB to CMYK for Print')).toBeInTheDocument()
    expect(screen.getByText('Adding Bleed to Your Artwork')).toBeInTheDocument()
  })

  it('filters articles by search term', () => {
    render(<HelpArticles />)
    const searchInput = screen.getByPlaceholderText('Search help articles...')
    fireEvent.change(searchInput, { target: { value: 'resolution' } })
    expect(screen.getByText('How to Fix Low Resolution Issues')).toBeInTheDocument()
    expect(screen.queryByText('Converting RGB to CMYK for Print')).not.toBeInTheDocument()
  })

  it('displays article content when selected', () => {
    render(<HelpArticles />)
    fireEvent.click(screen.getByText('How to Fix Low Resolution Issues'))
    expect(screen.getByText('Low resolution can cause blurry or pixelated prints. Here\'s how to fix it:')).toBeInTheDocument()
    expect(screen.getByText('Step-by-Step Instructions:')).toBeInTheDocument()
  })

  it('shows close button when onClose prop is provided', () => {
    const mockOnClose = jest.fn()
    render(<HelpArticles onClose={mockOnClose} />)
    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('filters articles by selected rule', () => {
    render(<HelpArticles selectedRule="Resolution" />)
    expect(screen.getAllByText('How to Fix Low Resolution Issues')).toHaveLength(2)
  })
}) 
import React from 'react'
import { render, screen } from '@/lib/test-utils'
import ResponsiveLayout, { MobileOnly, DesktopOnly, ResponsiveCard, ResponsiveGrid } from './ResponsiveLayout'

describe('ResponsiveLayout', () => {
  it('renders responsive layout with children', () => {
    render(
      <ResponsiveLayout>
        <div>Test content</div>
      </ResponsiveLayout>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders mobile only content', () => {
    render(<MobileOnly>Mobile content</MobileOnly>)
    expect(screen.getByText('Mobile content')).toBeInTheDocument()
  })

  it('renders desktop only content', () => {
    render(<DesktopOnly>Desktop content</DesktopOnly>)
    expect(screen.getByText('Desktop content')).toBeInTheDocument()
  })

  it('renders responsive card', () => {
    render(<ResponsiveCard>Card content</ResponsiveCard>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders responsive grid', () => {
    render(
      <ResponsiveGrid cols={2}>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })
}) 
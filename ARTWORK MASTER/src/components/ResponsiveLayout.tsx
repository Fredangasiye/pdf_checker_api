'use client'

import React from 'react'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`min-h-screen bg-vaib-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="block lg:hidden">{children}</div>
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden lg:block">{children}</div>
}

export function ResponsiveCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-vaib-gray-200 p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

export function ResponsiveGrid({ children, cols = 1 }: { children: React.ReactNode; cols?: number }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid gap-4 sm:gap-6 ${gridCols[cols as keyof typeof gridCols]}`}>
      {children}
    </div>
  )
} 
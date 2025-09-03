'use client'

import React, { useState, ReactNode } from 'react'

type ActiveTool = 'file-upload' | 'bleed-add' | 'bleed-remove' | 'color-change' | 'pullup-banner' | 'documents' | 'media'

interface SidebarNavigationProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
  uploadSlot?: ReactNode
  fileUploader?: ReactNode
}

export default function SidebarNavigation({ activeTool, onToolChange, uploadSlot, fileUploader }: SidebarNavigationProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>('artwork')

  const mainCards = [
    {
      id: 'artwork',
      title: 'ARTWORK',
      icon: (isSelected: boolean) => (
        <svg className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'file-upload' as ActiveTool,
          label: 'File Upload and Analysis',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          description: 'Upload and analyze artwork files'
        },
        {
          id: 'color-change' as ActiveTool,
          label: 'Color Conversion',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
          description: 'Convert color spaces'
        },
        {
          id: 'bleed-add' as ActiveTool,
          label: 'Add Bleed',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          description: 'Add bleed to artwork'
        },
        {
          id: 'bleed-remove' as ActiveTool,
          label: 'Remove Bleed',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
          description: 'Remove bleed from artwork'
        },
        {
          id: 'pullup-banner' as ActiveTool,
          label: 'Pull-Up Banner Template',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
          description: 'Create pull-up banner templates'
        }
      ]
    },
    {
      id: 'media',
      title: 'MEDIA',
      icon: (isSelected: boolean) => (
        <svg className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'media' as ActiveTool,
          label: 'Media Library',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          description: 'Manage media files'
        }
      ]
    },
    {
      id: 'resources',
      title: 'RESOURCES',
      icon: (isSelected: boolean) => (
        <svg className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'documents' as ActiveTool,
          label: 'Document Library',
          icon: (isSelected: boolean) => (
            <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Manage documents'
        }
      ]
    }
  ]

  const handleCardClick = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <nav className="space-y-4 p-4">
      {mainCards.map((card) => (
        <div key={card.id} className="space-y-2">
          {/* Main Card */}
          <button
            onClick={() => handleCardClick(card.id)}
            className={`w-full flex items-center px-4 py-4 text-sm font-medium rounded-lg transition-all duration-200 ${
              expandedCard === card.id
                ? `bg-gradient-to-r ${card.color} text-white shadow-md`
                : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="mr-3">{card.icon(expandedCard === card.id)}</span>
            <div className="text-left">
              <div className="font-bold text-base">{card.title}</div>
            </div>
            <span className="ml-auto text-sm">
              {expandedCard === card.id ? '▼' : '▶'}
            </span>
          </button>

          {/* Sub-items */}
          {expandedCard === card.id && (
            <div className="ml-6 space-y-2">
              {card.items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <button
                    onClick={() => onToolChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTool === item.id
                        ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                        : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className="mr-3">{item.icon(activeTool === item.id)}</span>
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </button>
                  {item.id === 'file-upload' && activeTool === item.id && uploadSlot ? (
                    <div className="mt-2">{uploadSlot}</div>
                  ) : null}
                  {item.id === 'file-upload' && activeTool === item.id && fileUploader ? (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {fileUploader}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
} 
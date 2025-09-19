'use client'

import React, { useState, ReactNode } from 'react'

type ActiveTool = 'file-upload' | 'bleed-add' | 'bleed-remove' | 'color-change' | 'pullup-banner' | 'documents' | 'media'

interface SidebarNavigationProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
  uploadSlot?: ReactNode
  fileUploader?: ReactNode
  isAdmin?: boolean
  onAdminChange?: (next: boolean) => void
}

export default function SidebarNavigation({ activeTool, onToolChange, uploadSlot, fileUploader, isAdmin = false, onAdminChange }: SidebarNavigationProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>('artwork')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const mainCards = [
    {
      id: 'artwork',
      title: 'ARTWORK',
      icon: (isSelected: boolean) => (
        <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'file-upload' as ActiveTool,
          label: 'File Upload',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          description: 'Upload and analyze'
        },
        {
          id: 'color-change' as ActiveTool,
          label: 'Color Conversion',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
          description: 'Convert colors'
        },
        {
          id: 'bleed-add' as ActiveTool,
          label: 'Add Bleed',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          description: 'Add bleed'
        },
        {
          id: 'bleed-remove' as ActiveTool,
          label: 'Remove Bleed',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
          description: 'Remove bleed'
        },
        {
          id: 'pullup-banner' as ActiveTool,
          label: 'Banner Template',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
          description: 'Banner templates'
        }
      ]
    },
    {
      id: 'media',
      title: 'MEDIA',
      icon: (isSelected: boolean) => (
        <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'media' as ActiveTool,
          label: 'Media Library',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          description: 'Manage media'
        }
      ]
    },
    {
      id: 'resources',
      title: 'RESOURCES',
      icon: (isSelected: boolean) => (
        <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-blue-600 to-red-600',
      items: [
        {
          id: 'documents' as ActiveTool,
          label: 'Documents',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Manage docs'
        }
      ]
    }
  ]

  const handleCardClick = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <nav className={`h-full overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      {/* Collapse Toggle Button */}
      <div className="p-1 border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center px-2 py-3 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
        >
          {isCollapsed ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Fixed Header Section - ARTWORK */}
          <div className="p-2 pb-1 border-b border-gray-200">
            {mainCards.filter(card => card.id === 'artwork').map((card) => (
              <div key={card.id} className="space-y-2">
                {/* Main Card */}
                <button
                  onClick={() => handleCardClick(card.id)}
                  className={`w-full flex items-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    expandedCard === card.id
                      ? `bg-gradient-to-r ${card.color} text-white shadow-md`
                      : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{card.icon(expandedCard === card.id)}</span>
                  <div className="text-left">
                    <div className="font-bold text-xs">{card.title}</div>
                  </div>
                  <span className="ml-auto text-xs">
                    {expandedCard === card.id ? '▼' : '▶'}
                  </span>
                </button>

                {/* Sub-items */}
                {expandedCard === card.id && (
                  <div className="ml-2 space-y-2">
                    {card.items.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <button
                          onClick={() => onToolChange(item.id)}
                          className={`w-full flex items-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                            activeTool === item.id
                              ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                              : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className="mr-2">{item.icon(activeTool === item.id)}</span>
                          <div className="text-left">
                            <div className="font-medium text-xs">{item.label}</div>
                            <div className="text-xs opacity-75">{item.description}</div>
                          </div>
                        </button>
                        {item.id === 'file-upload' && activeTool === item.id && uploadSlot ? (
                          <div className="mt-1">{uploadSlot}</div>
                        ) : null}
                        {item.id === 'file-upload' && activeTool === item.id && fileUploader ? (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                            {fileUploader}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Scrollable Content Section - Other Cards */}
          <div className="space-y-2 p-2 pt-1">
            {mainCards.filter(card => card.id !== 'artwork').map((card) => (
              <div key={card.id} className="space-y-2">
                {/* Main Card */}
                <button
                  onClick={() => handleCardClick(card.id)}
                  className={`w-full flex items-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    expandedCard === card.id
                      ? `bg-gradient-to-r ${card.color} text-white shadow-md`
                      : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="mr-2">{card.icon(expandedCard === card.id)}</span>
                  <div className="text-left">
                    <div className="font-bold text-xs">{card.title}</div>
                  </div>
                  <span className="ml-auto text-xs">
                    {expandedCard === card.id ? '▼' : '▶'}
                  </span>
                </button>

                {/* Sub-items */}
                {expandedCard === card.id && (
                  <div className="ml-2 space-y-2">
                    {card.items.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <button
                          onClick={() => onToolChange(item.id)}
                          className={`w-full flex items-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                            activeTool === item.id
                              ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                              : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className="mr-2">{item.icon(activeTool === item.id)}</span>
                          <div className="text-left">
                            <div className="font-medium text-xs">{item.label}</div>
                            <div className="text-xs opacity-75">{item.description}</div>
                          </div>
                        </button>
                      </div>
                    ))}
                    {card.id === 'resources' && (
                      <div className="mt-1 p-1 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-gray-800">Admin</div>
                            <div className="text-xs text-gray-600">Enable features</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!isAdmin}
                              onChange={(e) => onAdminChange?.(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Collapsed View - Show all buttons as icons */}
      {isCollapsed && (
        <div className="p-1 space-y-2">
          {mainCards.map((card) => (
            <div key={card.id} className="space-y-2">
              {/* Main Card Icon */}
              <button
                onClick={() => handleCardClick(card.id)}
                className={`w-full flex items-center justify-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                  expandedCard === card.id
                    ? `bg-gradient-to-r ${card.color} text-white shadow-md`
                    : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
                title={card.title}
              >
                {card.icon(expandedCard === card.id)}
              </button>

              {/* Sub-items as icons */}
              {expandedCard === card.id && (
                <div className="space-y-2">
                  {card.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onToolChange(item.id)}
                      className={`w-full flex items-center justify-center px-2 py-3 text-xs font-medium rounded transition-all duration-300 hover:scale-105 hover:shadow-md ${
                        activeTool === item.id
                          ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md'
                          : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                      }`}
                      title={item.label}
                    >
                      {item.icon(activeTool === item.id)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
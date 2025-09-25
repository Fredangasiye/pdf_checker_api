'use client'

import React, { useState, ReactNode } from 'react'

type ActiveTool = 'file-upload' | 'bleed-add' | 'bleed-remove' | 'color-change' | 'pullup-banner' | 'artwork-guidelines' | 'company-policies' | 'training-manuals' | 'media'

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
          id: 'artwork-guidelines' as ActiveTool,
          label: 'Artwork Guidelines',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Design specifications'
        },
        {
          id: 'company-policies' as ActiveTool,
          label: 'Company Policies',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Corporate policies'
        },
        {
          id: 'training-manuals' as ActiveTool,
          label: 'Training Manuals',
          icon: (isSelected: boolean) => (
            <svg className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Learning materials'
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

      {/* Admin Switch - Outside Resources Section */}
      {!isCollapsed && (
        <div className="p-4 pt-2 border-t border-gray-200">
          <div className="p-2 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-800">Admin Mode</div>
                <div className="text-xs text-gray-600">Enable admin features</div>
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
        </div>
      )}

      {/* Social Media & Web Links - Below Resources Section */}
      {!isCollapsed && (
        <div className="p-4 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-800 mb-3">Connect</div>
          <div className="flex space-x-3">
            <a href="#" className="group p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-blue-200 hover:shadow-lg" title="Website">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </a>
            <a href="#" className="group p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-blue-200 hover:shadow-lg" title="LinkedIn">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" className="group p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-blue-200 hover:shadow-lg" title="Twitter">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="group p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-pink-200 hover:shadow-lg" title="Instagram">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.323s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
              </svg>
            </a>
            <a href="#" className="group p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-green-200 hover:shadow-lg" title="Email">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
            <a href="#" className="group p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 hover:scale-110 hover:rotate-3 transition-all duration-300 ease-in-out rounded-lg border border-transparent hover:border-purple-200 hover:shadow-lg" title="Phone">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
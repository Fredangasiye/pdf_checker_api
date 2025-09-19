'use client'

import React, { useState, useEffect } from 'react'
import FileUploader from '@/components/FileUploader'
import PreflightResults from '@/components/PreflightResults'
import BEITHAChatbot from '@/components/BEITHAChatbot'
import ChatButton from '@/components/ChatButton'
import SidebarNavigation from '@/components/SidebarNavigation'
import MediaGallery from '@/components/MediaGallery'
import BleedAdderTool from '@/components/BleedAdderTool'
import BleedRemovalTool from '@/components/BleedRemovalTool'
import PDFColorChanger from '@/components/PDFColorChanger'
import PullUpBannerTool from '@/components/PullUpBannerTool'
import { validateArtwork } from '@/lib/validation-rules'

interface UploadState {
  file: File | null
  uploading: boolean
  results: any | null
  error: string | null
}

interface MediaItem {
    id: string
    name: string
    type: string
  size: number
    url: string
  category: string
    uploadDate: Date
  uploadedAt: Date
}

interface DocumentItem {
    id: string
    name: string
    type: string
  size: number
    url: string
  uploadedAt: Date
}

type ActiveTool = 'file-upload' | 'bleed-add' | 'bleed-remove' | 'color-change' | 'pullup-banner' | 'media' | 'documents'

// LocalStorage keys
const STORAGE_KEYS = {
  UPLOADED_MEDIA: 'beitha_uploaded_media',
  UPLOADED_DOCUMENTS: 'beitha_uploaded_documents',
  ADMIN_MODE: 'beitha_admin_mode',
  USER_SESSION: 'beitha_user_session'
}

export default function Home() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    results: null,
    error: null
  })

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Tool state
  const [activeTool, setActiveTool] = useState<ActiveTool>('file-upload')

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminToggle, setShowAdminToggle] = useState(false)

  // Media and documents state with persistence
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentItem[]>([])

  // Search and filter state
  const [mediaSearchTerm, setMediaSearchTerm] = useState('')
  const [documentSearchTerm, setDocumentSearchTerm] = useState('')
  const [mediaFilter, setMediaFilter] = useState('all')
  const [documentFilter, setDocumentFilter] = useState('all')

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData()
    checkAdminStatus()
  }, [])

  // Handle sidebar collapse
  useEffect(() => {
    const handleSidebarToggle = () => {
      const sidebar = document.querySelector('nav')
      const mainContent = document.getElementById('main-content')
      
      if (sidebar && mainContent) {
        const isCollapsed = sidebar.classList.contains('w-16')
        if (isCollapsed) {
          mainContent.classList.remove('ml-80')
          mainContent.classList.add('ml-16')
        } else {
          mainContent.classList.remove('ml-16')
          mainContent.classList.add('ml-80')
        }
      }
    }

    // Listen for sidebar changes
    const observer = new MutationObserver(handleSidebarToggle)
    const sidebar = document.querySelector('nav')
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })
    }

    return () => observer.disconnect()
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    savePersistedData()
  }, [uploadedMedia, uploadedDocuments, isAdmin])

  const loadPersistedData = () => {
    try {
      // Load media
      const savedMedia = localStorage.getItem(STORAGE_KEYS.UPLOADED_MEDIA)
      if (savedMedia) {
        const parsedMedia = JSON.parse(savedMedia).map((item: any) => ({
          ...item,
          uploadDate: new Date(item.uploadDate),
          uploadedAt: new Date(item.uploadedAt)
        }))
        setUploadedMedia(parsedMedia)
      }

      // Load documents
      const savedDocuments = localStorage.getItem(STORAGE_KEYS.UPLOADED_DOCUMENTS)
      if (savedDocuments) {
        const parsedDocuments = JSON.parse(savedDocuments).map((item: any) => ({
          ...item,
          uploadedAt: new Date(item.uploadedAt)
        }))
        setUploadedDocuments(parsedDocuments)
      }

      // Load admin mode
      const savedAdminMode = localStorage.getItem(STORAGE_KEYS.ADMIN_MODE)
      if (savedAdminMode) {
        setIsAdmin(JSON.parse(savedAdminMode))
      }
    } catch (error) {
      console.error('Error loading persisted data:', error)
    }
  }

  const savePersistedData = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOADED_MEDIA, JSON.stringify(uploadedMedia))
      localStorage.setItem(STORAGE_KEYS.UPLOADED_DOCUMENTS, JSON.stringify(uploadedDocuments))
      localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, JSON.stringify(isAdmin))
    } catch (error) {
      console.error('Error saving persisted data:', error)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      }
    } catch (error) {
      console.log('Admin check failed, using persisted admin mode')
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadState({
      file,
      uploading: true,
      results: null,
      error: null
    })

    try {
      // Simulate file upload and processing
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload failed')
      }

      const uploadResult = await response.json()
      
      // Run preflight validation
      const validationResults = validateArtwork(uploadResult.metadata || {})
      
      setUploadState({
        file,
        uploading: false,
        results: {
          ...uploadResult,
          validation: validationResults
        },
        error: null
      })
    } catch (error) {
      setUploadState({
        file,
        uploading: false,
        results: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }

  const handleError = (error: string) => {
    setUploadState(prev => ({
      ...prev,
      error
    }))
  }

  const handleRetry = () => {
    setUploadState({
      file: null,
      uploading: false,
      results: null,
      error: null
    })
  }

  // Tool handlers
  const handleBleedAddition = async (file: File, config: any) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('config', JSON.stringify(config))
      
      const response = await fetch('/api/add-bleed', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to add bleed')
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Bleed addition error:', error)
      throw error
    }
  }

  const handleBleedRemoval = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/remove-bleed', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to remove bleed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Bleed removal error:', error)
      throw error
    }
  }

  const handleColorChange = async (file: File, colorSettings: any) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('colorSettings', JSON.stringify(colorSettings))

      const response = await fetch('/api/convert-outlines', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to change colors')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Color change error:', error)
      throw error
    }
  }

  const handleArtworkDrop = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pullup-banner', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to process banner')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Banner processing error:', error)
      throw error
    }
  }

  // Media handlers with persistence
  const handleMediaUpload = async (file: File, category: string = 'Images') => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload media')
      }
        
      const result = await response.json()
      const newMediaItem: MediaItem = {
        id: result.id || `media_${Date.now()}`,
          name: file.name,
          type: file.type,
        size: file.size,
        url: result.url || URL.createObjectURL(file),
          category,
        uploadDate: new Date(),
        uploadedAt: new Date()
      }

      setUploadedMedia(prev => [...prev, newMediaItem])
      return result
    } catch (error) {
      console.error('Media upload error:', error)
      // Even if API fails, save to localStorage for persistence
      const newMediaItem: MediaItem = {
        id: `local_media_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        category: category || 'Images',
        uploadDate: new Date(),
        uploadedAt: new Date()
      }
      setUploadedMedia(prev => [...prev, newMediaItem])
    }
  }

  const handleMediaDelete = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/delete-media/${mediaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete media')
      }
    } catch (error) {
      console.error('Media deletion error:', error)
    } finally {
      setUploadedMedia(prev => prev.filter(item => item.id !== mediaId))
    }
  }

  // Document handlers with persistence
  const handleDocumentUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload document')
      }
        
      const result = await response.json()
      const newDocumentItem: DocumentItem = {
        id: result.id || `doc_${Date.now()}`,
          name: file.name,
          type: file.type,
        size: file.size,
        url: result.url || URL.createObjectURL(file),
        uploadedAt: new Date()
      }

      setUploadedDocuments(prev => [...prev, newDocumentItem])
      return result
    } catch (error) {
      console.error('Document upload error:', error)
      // Even if API fails, save to localStorage for persistence
      const newDocumentItem: DocumentItem = {
        id: `local_doc_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      }
      setUploadedDocuments(prev => [...prev, newDocumentItem])
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/delete-document/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
    } catch (error) {
      console.error('Document deletion error:', error)
    } finally {
      setUploadedDocuments(prev => prev.filter(item => item.id !== documentId))
    }
  }

  const renderToolContent = () => {
    switch (activeTool) {
                  case 'file-upload':
        return (
          <div className="bg-white rounded-lg shadow-lg border border-beith-gray-200 p-8 group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-50">
            {uploadState.results ? (
              <div className="space-y-8">
                {/* Results Dashboard */}
                <PreflightResults
                  results={uploadState.results.validation.results}
                  summary={uploadState.results.validation.summary}
                  overall={uploadState.results.validation.overall}
                  fileName={uploadState.file?.name || ''}
                  fileSize={uploadState.file?.size || 0}
                  metadata={uploadState.results.metadata}
                  onRetry={handleRetry}
                />

              </div>
            ) : (
              <div className="text-center">
                {/* Animated 3D BEITH Logo */}
                <div className="relative">
                  <div className="flex justify-center items-center space-x-1 perspective-1000">
                    <span className="text-8xl font-bold text-blue-500 tracking-widest transform-gpu transition-all duration-500 hover:scale-110 hover:rotate-y-12 hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:text-blue-400 cursor-pointer animate-pulse" 
                          style={{ 
                            fontFamily: 'Bahnschrift, sans-serif',
                            textShadow: '0 4px 8px rgba(59,130,246,0.3), 0 8px 16px rgba(59,130,246,0.2)',
                            transformStyle: 'preserve-3d'
                          }}>B</span>
                    <span className="text-8xl font-bold text-blue-500 tracking-widest transform-gpu transition-all duration-500 hover:scale-110 hover:rotate-y-12 hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:text-blue-400 cursor-pointer animate-pulse" 
                          style={{ 
                            fontFamily: 'Bahnschrift, sans-serif',
                            textShadow: '0 4px 8px rgba(59,130,246,0.3), 0 8px 16px rgba(59,130,246,0.2)',
                            transformStyle: 'preserve-3d'
                          }}>E</span>
                    <span className="text-8xl font-bold text-red-600 tracking-widest transform-gpu transition-all duration-300 hover:scale-125 hover:rotate-y-20 hover:rotate-x-10 hover:drop-shadow-[0_0_40px_rgba(239,68,68,0.9)] hover:text-red-500 cursor-pointer animate-pulse hover:animate-bounce" 
                          style={{ 
                            fontFamily: 'Bahnschrift, sans-serif',
                            textShadow: '0 6px 12px rgba(239,68,68,0.5), 0 12px 24px rgba(239,68,68,0.4), 0 18px 36px rgba(239,68,68,0.3)',
                            transformStyle: 'preserve-3d'
                          }}>I</span>
                    <span className="text-8xl font-bold text-blue-500 tracking-widest transform-gpu transition-all duration-500 hover:scale-110 hover:rotate-y-12 hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:text-blue-400 cursor-pointer animate-pulse" 
                          style={{ 
                            fontFamily: 'Bahnschrift, sans-serif',
                            textShadow: '0 4px 8px rgba(59,130,246,0.3), 0 8px 16px rgba(59,130,246,0.2)',
                            transformStyle: 'preserve-3d'
                          }}>T</span>
                    <span className="text-8xl font-bold text-blue-500 tracking-widest transform-gpu transition-all duration-500 hover:scale-110 hover:rotate-y-12 hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:text-blue-400 cursor-pointer animate-pulse" 
                          style={{ 
                            fontFamily: 'Bahnschrift, sans-serif',
                            textShadow: '0 4px 8px rgba(59,130,246,0.3), 0 8px 16px rgba(59,130,246,0.2)',
                            transformStyle: 'preserve-3d'
                          }}>H</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 'bleed-add':
        return <BleedAdderTool onBleedAddition={handleBleedAddition} isProcessing={uploadState.uploading} />
      case 'bleed-remove':
        return <BleedRemovalTool onBleedRemoval={handleBleedRemoval} isProcessing={uploadState.uploading} />
      case 'color-change':
        return <PDFColorChanger onColorChange={handleColorChange} isProcessing={uploadState.uploading} />
      case 'pullup-banner':
        return <PullUpBannerTool onArtworkDrop={handleArtworkDrop} isProcessing={uploadState.uploading} />
      case 'media':
        return (
              <MediaGallery 
                media={uploadedMedia} 
                onMediaUpload={handleMediaUpload} 
                onMediaDelete={handleMediaDelete} 
                isAdmin={isAdmin} 
              />
        )
      case 'documents':
        return (
          <div className="bg-white rounded-lg shadow-lg border border-beith-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-black">Documents</h2>
              <div className="flex gap-2">
                      <input
                  type="text"
                  placeholder="Search documents..."
                  value={documentSearchTerm}
                  onChange={(e) => setDocumentSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-beith-blue-500"
                />
                <select
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-beith-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="docx">DOCX</option>
                </select>
                    </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedDocuments
                .filter(doc => 
                  doc.name.toLowerCase().includes(documentSearchTerm.toLowerCase()) &&
                  (documentFilter === 'all' || doc.type.includes(documentFilter))
                )
                .map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-black">{doc.name}</h3>
                        <p className="text-sm text-gray-600">{doc.type}</p>
                        <p className="text-sm text-gray-600">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
              <button
                        onClick={() => handleDocumentDelete(doc.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                      </button>
            </div>
                  </div>
                ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Navigation */}
      <div className="bg-white border-r border-gray-200 flex-shrink-0 fixed left-0 top-32 h-full overflow-y-auto z-10">
        <SidebarNavigation
        activeTool={activeTool}
        onToolChange={setActiveTool}
        uploadSlot={activeTool === 'file-upload' && uploadState.file ? (
          <div className="text-sm text-gray-600">
            File: {uploadState.file.name}
          </div>
        ) : undefined}
        fileUploader={
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-8 w-8 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-4 w-4 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-black mb-2">
              Upload Your Artwork
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Drag and drop your files here or click to browse
            </p>
            <FileUploader
              onFileSelect={handleFileSelect}
              onError={handleError}
              acceptedTypes={['pdf', 'ai', 'indd', 'psd', 'tiff', 'tif']}
            />
            {uploadState.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <p className="text-red-700">{uploadState.error}</p>
              </div>
            )}
          </div>
        }
        isAdmin={isAdmin}
        onAdminChange={(next) => setIsAdmin(next)}
        />
      </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto ml-80 mt-4 transition-all duration-300 bg-white" id="main-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header - Only show on artwork section */}
          {activeTool === 'file-upload' && (
            <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-wide">
                      Welcome to Beith Digital Preflight Portal
                    </h1>
              <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
                Upload your artwork files and get instant validation against our print specifications. 
                Ensure your designs are print-ready before production.
              </p>
            </div>
          )}
                
          {/* Tool Content */}
          <div className="max-w-4xl mx-auto">
            {activeTool === 'file-upload' && uploadState.results ? (
              <div className="space-y-8">
                {/* Results Dashboard */}
                <PreflightResults
                  results={uploadState.results.validation.results}
                  summary={uploadState.results.validation.summary}
                  overall={uploadState.results.validation.overall}
                  fileName={uploadState.file?.name || ''}
                  fileSize={uploadState.file?.size || 0}
                  metadata={uploadState.results.metadata}
                  onRetry={handleRetry}
                />

                        </div>
                ) : (
              renderToolContent()
            )}

            {/* Features Grid */}
            {activeTool === 'file-upload' && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-50 p-4 rounded-lg">
                  <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3 group-hover:bg-beith-blue-200 transition-colors duration-300">
                    <svg className="h-5 w-5 text-beith-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                        </div>
                  <h3 className="text-lg font-medium text-gray-800 group-hover:text-beith-blue-600 transition-colors duration-300">Instant Validation</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Get immediate feedback on your artwork specifications</p>
                      </div>

                <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-50 p-4 rounded-lg">
                  <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3 group-hover:bg-beith-blue-200 transition-colors duration-300">
                    <svg className="h-5 w-5 text-beith-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 group-hover:text-beith-blue-600 transition-colors duration-300">Detailed Analysis</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Get comprehensive analysis of your artwork specifications</p>
                          </div>

                <div className="text-center group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-gray-50 p-4 rounded-lg">
                  <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3 group-hover:bg-beith-blue-200 transition-colors duration-300">
                    <svg className="h-5 w-5 text-beith-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                          </div>
                  <h3 className="text-lg font-medium text-gray-800 group-hover:text-beith-blue-600 transition-colors duration-300">Smart Guidance</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Get step-by-step instructions to fix any issues</p>
                        </div>
                  </div>
                )}
                    </div>
                  </div>
                </div>

      {/* BEITHA Chatbot */}
      <BEITHAChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Chat Button */}
      <ChatButton onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />
    </div>
  )
}

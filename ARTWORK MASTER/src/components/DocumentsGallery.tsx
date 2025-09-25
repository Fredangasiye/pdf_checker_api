'use client'

import React, { useState, useEffect } from 'react'

interface DocumentItem {
  id: string
  name: string
  size: number
  type: string
  category: string
  url: string
  thumbnail?: string
  uploadDate: Date
  isUploading?: boolean
  uploadProgress?: number
}

interface DocumentsGalleryProps {
  documents: DocumentItem[]
  onDocumentUpload: (file: File, category: string) => void
  onDocumentUploadMultiple?: (files: File[], category: string) => void
  onDocumentDelete: (id: string) => void
  isAdmin?: boolean
}

export default function DocumentsGallery({ documents, onDocumentUpload, onDocumentUploadMultiple, onDocumentDelete, isAdmin = false }: DocumentsGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('Artwork Guidelines')
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { progress: number; file: File }>>(new Map())

  // Filter documents based on search and filter
  const filteredDocuments = documents.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || item.category === filter
    return matchesSearch && matchesFilter
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      
      // Add files to uploading state
      fileArray.forEach(file => {
        const fileId = `uploading_${Date.now()}_${Math.random()}`
        setUploadingFiles(prev => new Map(prev.set(fileId, { progress: 0, file })))
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const current = prev.get(fileId)
            if (current && current.progress < 100) {
              const newProgress = Math.min(current.progress + Math.random() * 20, 100)
              return new Map(prev.set(fileId, { ...current, progress: newProgress }))
            }
            return prev
          })
        }, 200)
        
        // Complete upload after progress reaches 100
        setTimeout(() => {
          clearInterval(progressInterval)
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        }, 2000 + Math.random() * 1000) // 2-3 seconds total
      })
      
      if (files.length === 1) {
        onDocumentUpload(files[0], uploadCategory)
      } else if (onDocumentUploadMultiple) {
        onDocumentUploadMultiple(fileArray, uploadCategory)
      } else {
        // Fallback: upload files one by one
        fileArray.forEach(file => {
          onDocumentUpload(file, uploadCategory)
        })
      }
      setShowUploadModal(false)
      // Reset the input
      e.target.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('doc')) return '📝'
    if (type.includes('txt')) return '📄'
    if (type.includes('ppt')) return '📊'
    if (type.includes('xls')) return '📈'
    return '📄'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600 mt-1">Manage your document library</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="Artwork Guidelines">Artwork Guidelines</option>
          <option value="Company Policies">Company Policies</option>
          <option value="Training Manuals">Training Manuals</option>
        </select>
      </div>

      {/* Global Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">
              Uploading {uploadingFiles.size} file{uploadingFiles.size > 1 ? 's' : ''}...
            </h3>
            <div className="text-xs text-blue-600">
              {Array.from(uploadingFiles.values()).reduce((acc, { progress }) => acc + progress, 0) / uploadingFiles.size}%
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Array.from(uploadingFiles.values()).reduce((acc, { progress }) => acc + progress, 0) / uploadingFiles.size}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setFilter(filter === 'Artwork Guidelines' ? 'all' : 'Artwork Guidelines')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Artwork Guidelines' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">📋</div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              filter === 'Artwork Guidelines' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {documents.filter(item => item.category === 'Artwork Guidelines').length} items
            </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Artwork Guidelines</h4>
          <p className="text-gray-600 text-sm">Design specifications and guidelines</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'Company Policies' ? 'all' : 'Company Policies')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Company Policies' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🏢</div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              filter === 'Company Policies' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {documents.filter(item => item.category === 'Company Policies').length} items
            </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Company Policies</h4>
          <p className="text-gray-600 text-sm">Corporate policies and procedures</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'Training Manuals' ? 'all' : 'Training Manuals')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Training Manuals' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">📚</div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              filter === 'Training Manuals' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {documents.filter(item => item.category === 'Training Manuals').length} items
            </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Training Manuals</h4>
          <p className="text-gray-600 text-sm">Learning materials and guides</p>
        </button>
      </div>

      {/* Document Content */}
      {filteredDocuments.length === 0 && uploadingFiles.size === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-blue-600">📄</div>
          <p className="text-gray-500 text-lg">No documents found.</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No documents uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {/* Uploading Files */}
          {Array.from(uploadingFiles.entries()).map(([fileId, { progress, file }]) => (
            <div
              key={fileId}
              className={`bg-blue-50 rounded-lg border-2 border-blue-200 overflow-hidden ${
                viewMode === 'list' ? 'flex items-center p-4' : ''
              }`}
            >
              {/* Uploading Thumbnail */}
              <div className={viewMode === 'list' ? 'flex-shrink-0 mr-4' : ''}>
                <div className={`bg-blue-100 border-2 border-blue-300 flex flex-col items-center justify-center ${
                  viewMode === 'list' ? 'w-16 h-16 rounded' : 'w-full h-48'
                }`}>
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                  <span className="text-sm text-blue-700 font-bold text-center">
                    Uploading...
                  </span>
                </div>
              </div>

              {/* Uploading Content */}
              <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'p-4'}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-blue-900 truncate">{file.name}</h4>
                    <p className="text-sm text-blue-600 mt-1">{uploadCategory}</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-blue-500 space-y-1">
                  <div>Size: {formatFileSize(file.size)}</div>
                  <div>Type: {file.type.split('/')[1]?.toUpperCase() || file.type}</div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 text-center">{Math.round(progress)}%</p>
                </div>
              </div>
            </div>
          ))}

          {/* Regular Document Items */}
          {filteredDocuments.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${
                viewMode === 'list' ? 'flex items-center p-4' : ''
              }`}
            >
              {/* Thumbnail */}
              <div className={viewMode === 'list' ? 'flex-shrink-0 mr-4' : ''}>
                {item.type.includes('pdf') || item.type === 'application/pdf' ? (
                  <div className={`bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors ${
                    viewMode === 'list' ? 'w-16 h-16 rounded' : 'w-full h-48'
                  }`} onClick={() => setSelectedDocument(item)}>
                    <svg className="w-8 h-8 text-red-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <span className="text-sm text-red-700 font-bold text-center">
                      PDF
                    </span>
                  </div>
                ) : (
                  <div className={`bg-gray-100 flex items-center justify-center ${
                    viewMode === 'list' ? 'w-16 h-16 rounded' : 'w-full h-48'
                  }`}>
                    <span className="text-2xl text-blue-600">{getFileIcon(item.type)}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'p-4'}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                  </div>
                  
                  {/* Admin Actions */}
                  {isAdmin && (
                    <button
                      onClick={() => onDocumentDelete(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400 space-y-1">
                  <div>Size: {formatFileSize(item.size)}</div>
                  <div>Type: {item.type.split('/')[1]?.toUpperCase() || item.type}</div>
                  <div>Uploaded: {(item.uploadDate || item.uploadedAt || new Date()).toLocaleDateString()}</div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setSelectedDocument(item)}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View
                  </button>
                  <a
                    href={item.url}
                    download={item.name}
                    className="flex-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors text-center"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Artwork Guidelines">Artwork Guidelines</option>
                    <option value="Company Policies">Company Policies</option>
                    <option value="Training Manuals">Training Manuals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {selectedDocument.type.includes('pdf') || selectedDocument.type === 'application/pdf' ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="bg-red-50 border-4 border-red-200 rounded-lg p-8">
                      <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <div className="text-2xl font-bold text-red-700">PDF</div>
                    </div>
                  </div>
                  <p className="text-gray-500 mb-6 text-lg">{selectedDocument.name}</p>
                  <div className="space-y-3">
                    <a
                      href={selectedDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      View PDF
                    </a>
                    <a
                      href={selectedDocument.url}
                      download={selectedDocument.name}
                      className="block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-blue-600">{getFileIcon(selectedDocument.type)}</div>
                  <p className="text-gray-500">{selectedDocument.name}</p>
                  <a
                    href={selectedDocument.url}
                    download={selectedDocument.name}
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
                <p>Size: {formatFileSize(selectedDocument.size)}</p>
                <p>Type: {selectedDocument.type}</p>
                <p>Uploaded: {(selectedDocument.uploadDate || selectedDocument.uploadedAt || new Date()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
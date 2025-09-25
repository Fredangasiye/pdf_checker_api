'use client'

import React, { useState, useEffect } from 'react'

interface MediaItem {
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

interface MediaGalleryProps {
  media: MediaItem[]
  onMediaUpload: (file: File, category: string) => void
  onMediaUploadMultiple?: (files: File[], category: string) => void
  onMediaDelete: (id: string) => void
  isAdmin?: boolean
}

export default function MediaGallery({ media, onMediaUpload, onMediaUploadMultiple, onMediaDelete, isAdmin = false }: MediaGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('Images')
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, { progress: number; file: File }>>(new Map())

  // Filter media based on search and filter
  const filteredMedia = media.filter(item => {
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
        onMediaUpload(files[0], uploadCategory)
      } else if (onMediaUploadMultiple) {
        onMediaUploadMultiple(fileArray, uploadCategory)
      } else {
        // Fallback: upload files one by one
        fileArray.forEach(file => {
          onMediaUpload(file, uploadCategory)
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
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.includes('pdf')) return '📄'
    if (type.includes('ai') || type.includes('eps') || type.includes('svg')) return '🎨'
    if (type.includes('psd') || type.includes('indd') || type.includes('sketch')) return '🖌️'
    return '📁'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Media Gallery</h3>
          <p className="text-gray-600">
            {filteredMedia.length} of {media.length} item{media.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>

          {/* Admin Upload Button - Only visible when admin mode is enabled */}
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Upload Media
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search media..."
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
          <option value="Images">Images</option>
          <option value="Videos">Videos</option>
          <option value="Brand Assets">Brand Assets</option>
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

      {/* Media Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setFilter(filter === 'Images' ? 'all' : 'Images')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Images' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                          filter === 'Images' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {media.filter(item => item.category === 'Images').length} items
                        </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Images</h4>
          <p className="text-gray-600 text-sm">Photos, graphics, and visual content</p>
        </button>
        
        <button
          onClick={() => setFilter(filter === 'Videos' ? 'all' : 'Videos')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Videos' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                          filter === 'Videos' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {media.filter(item => item.category === 'Videos').length} items
                        </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Videos</h4>
          <p className="text-gray-600 text-sm">Video content and motion graphics</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'Brand Assets' ? 'all' : 'Brand Assets')}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-all duration-200 text-left ${
            filter === 'Brand Assets' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                          filter === 'Brand Assets' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {media.filter(item => item.category === 'Brand Assets').length} items
                        </span>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Brand Assets</h4>
          <p className="text-gray-600 text-sm">Logos, icons, brand materials, and PDFs</p>
        </button>
      </div>

      {/* Media Content */}
      {filteredMedia.length === 0 && uploadingFiles.size === 0 ? (
                        <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-blue-600">🎨</div>
                  <p className="text-gray-500 text-lg">No media found.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No media uploaded yet.'}
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

          {/* Regular Media Items */}
          {filteredMedia.map((item) => (
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
                  }`} onClick={() => setSelectedMedia(item)}>
                    <svg className="w-8 h-8 text-red-600 mb-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <span className="text-sm text-red-700 font-bold text-center">
                      PDF
                    </span>
                  </div>
                ) : item.type.startsWith('image/') ? (
                  <div className={`relative overflow-hidden cursor-pointer bg-gray-50 ${
                    viewMode === 'list' ? 'w-16 h-16 rounded' : 'w-full h-48'
                  }`} onClick={() => setSelectedMedia(item)}>
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : item.thumbnail ? (
                  <div className={`relative overflow-hidden cursor-pointer bg-gray-50 ${
                    viewMode === 'list' ? 'w-16 h-16 rounded' : 'w-full h-48'
                  }`} onClick={() => setSelectedMedia(item)}>
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      style={{ objectFit: 'contain' }}
                    />
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
                      onClick={() => onMediaDelete(item.id)}
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
                  <div>Uploaded: {item.uploadDate.toLocaleDateString()}</div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setSelectedMedia(item)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Media</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Images">Images</option>
                  <option value="Videos">Videos</option>
                  <option value="Brand Assets">Brand Assets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept={
                    uploadCategory === 'Images' ? 'image/*,.pdf' :
                    uploadCategory === 'Videos' ? 'video/*' :
                    uploadCategory === 'Brand Assets' ? '.ai,.eps,.svg,.psd,.png,.jpg,.jpeg,.gif,.pdf' :
                    '.ai,.eps,.svg,.psd,.png,.jpg,.jpeg,.gif'
                  }
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
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedMedia.name}</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {selectedMedia.type.startsWith('image/') ? (
                <div className="flex justify-center">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.name}
                    className="max-w-full max-h-[60vh] object-contain"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : selectedMedia.type.startsWith('video/') ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-[60vh] mx-auto"
                />
              ) : selectedMedia.type.includes('pdf') || selectedMedia.type === 'application/pdf' ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="bg-red-50 border-4 border-red-200 rounded-lg p-8">
                      <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <div className="text-2xl font-bold text-red-700">PDF</div>
                    </div>
                  </div>
                  <p className="text-gray-500 mb-6 text-lg">{selectedMedia.name}</p>
                  <div className="space-y-3">
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      View PDF
                    </a>
                    <a
                      href={selectedMedia.url}
                      download={selectedMedia.name}
                      className="block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-blue-600">{getFileIcon(selectedMedia.type)}</div>
                  <p className="text-gray-500">{selectedMedia.name}</p>
                  <a
                    href={selectedMedia.url}
                    download={selectedMedia.name}
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Size: {formatFileSize(selectedMedia.size)}</p>
                <p>Type: {selectedMedia.type}</p>
                <p>Uploaded: {selectedMedia.uploadDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
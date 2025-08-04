'use client'

import React, { useState, useCallback, useRef } from 'react'
import { isValidFileSize, isValidFileType } from '@/lib/env'

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  onError: (message: string) => void
  maxSize?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

interface UploadState {
  isDragOver: boolean
  isUploading: boolean
  progress: number
}

export default function FileUploader({
  onFileSelect,
  onError,
  maxSize = 104857600, // 100MB default
  acceptedTypes = ['pdf', 'ai', 'indd', 'psd', 'tiff'],
  disabled = false
}: FileUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    progress: 0
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !acceptedTypes.includes(extension)) {
      return `File type "${extension}" is not supported. Please upload: ${acceptedTypes.join(', ').toUpperCase()} files`
    }

    return null
  }, [maxSize, acceptedTypes])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    setUploadState(prev => ({ ...prev, isUploading: true, progress: 0 }))
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadState(prev => {
        if (prev.progress >= 100) {
          clearInterval(interval)
          return { ...prev, isUploading: false, progress: 100 }
        }
        return { ...prev, progress: prev.progress + 10 }
      })
    }, 100)

    // Call the parent handler
    onFileSelect(file)
  }, [validateFile, onFileSelect, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setUploadState(prev => ({ ...prev, isDragOver: true }))
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragOver: false }))
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  const getDragOverStyles = () => {
    if (uploadState.isDragOver) {
      return 'border-beith-blue-400 bg-beith-blue-50'
    }
    return 'border-beith-gray-300 hover:border-beith-blue-400'
  }

  const getUploadProgressStyles = () => {
    if (uploadState.isUploading) {
      return 'bg-beith-blue-100'
    }
    return 'bg-white'
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all duration-200
          ${getDragOverStyles()}
          ${getUploadProgressStyles()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="text-center">
          {uploadState.isUploading ? (
            <div className="space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-beith-blue-100">
                <svg className="animate-spin h-6 w-6 text-beith-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-beith-gray-900">Uploading...</p>
                <div className="mt-2 w-full bg-beith-gray-200 rounded-full h-2">
                  <div 
                    className="bg-beith-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-beith-gray-500 mt-1">{uploadState.progress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-beith-blue-100 mb-4">
                <svg className="h-6 w-6 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-beith-gray-600 mb-2">
                <span className="font-medium text-beith-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-beith-gray-500">
                {acceptedTypes.join(', ').toUpperCase()} files up to {(maxSize / 1024 / 1024).toFixed(0)}MB
              </p>
            </>
          )}
        </div>
      </div>

      {uploadState.isDragOver && (
        <div className="mt-2 text-center">
          <p className="text-sm text-beith-blue-600 font-medium">
            Drop your file here to upload
          </p>
        </div>
      )}
    </div>
  )
} 
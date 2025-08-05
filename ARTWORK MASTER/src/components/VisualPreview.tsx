'use client'

import React, { useEffect, useRef, useState } from 'react'

interface VisualPreviewProps {
  file: File
  fileUrl?: string // Optional: for server-provided preview URLs
  width?: number
  height?: number
}

export default function VisualPreview({ file, fileUrl, width = 320, height = 240 }: VisualPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!file) return
    setError(null)
    setPreviewUrl(null)
    setIsPdf(false)

    // Improved file format detection
    const fileName = file.name.toLowerCase()
    const mimeType = file.type.toLowerCase()
    
    // Check for image formats
    if (['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'webp'].some(ext => fileName.endsWith(`.${ext}`)) ||
        mimeType.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } 
    // Check for PDF
    else if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') {
      setIsPdf(true)
      return
    }
    // Check for other supported formats
    else if (['ai', 'indd', 'psd'].some(ext => fileName.endsWith(`.${ext}`))) {
      // Show appropriate icon for these formats
      setError('Preview not available for this file type')
      return
    }
    else {
      setError('File format not supported. Please upload: PDF, AI, INDD, PSD, or TIFF files')
    }
  }, [file, width, height])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg border">
        <svg className="w-12 h-12 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-gray-800 font-medium">{error}</span>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg border">
        <svg className="w-16 h-16 mb-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
        <span className="text-lg font-medium text-gray-800">PDF Document</span>
        <span className="text-sm text-gray-600 mt-1">{file.name}</span>
      </div>
    )
  }

  if (previewUrl) {
    return (
      <div className="flex flex-col items-center">
        <img
          src={previewUrl}
          alt="Artwork preview"
          width={width}
          height={height}
          className="object-contain border rounded shadow"
        />
        <span className="text-xs text-gray-600 mt-2 font-medium">Image Preview</span>
      </div>
    )
  }

  // Fallback for server-provided preview URL
  if (fileUrl) {
    return (
      <div className="flex flex-col items-center">
        <img
          src={fileUrl}
          alt="Artwork preview"
          width={width}
          height={height}
          className="object-contain border rounded shadow"
        />
        <span className="text-xs text-gray-600 mt-2 font-medium">Preview</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50 rounded-lg border">
      <svg className="w-12 h-12 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-gray-800 font-medium">No preview available</span>
    </div>
  )
}
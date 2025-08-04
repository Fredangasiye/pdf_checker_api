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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!file) return
    setError(null)
    setPreviewUrl(null)

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext) {
      setError('Unknown file type')
      return
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'bmp', 'webp'].includes(ext)) {
      // Image preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (ext === 'pdf') {
      // PDF preview (first page)
      import('pdfjs-dist/build/pdf').then(pdfjsLib => {
        import('pdfjs-dist/build/pdf.worker.entry').then(() => {
          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              const typedarray = new Uint8Array(e.target?.result as ArrayBuffer)
              pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.js'
              const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
              const page = await pdf.getPage(1)
              const viewport = page.getViewport({ scale: 1 })
              const canvas = canvasRef.current
              if (!canvas) return
              const context = canvas.getContext('2d')
              canvas.width = width
              canvas.height = height
              const renderContext = {
                canvasContext: context,
                viewport: page.getViewport({ scale: Math.min(width / viewport.width, height / viewport.height) })
              }
              await page.render(renderContext).promise
              setPreviewUrl('pdf-canvas')
            } catch (err) {
              setError('Could not render PDF preview')
            }
          }
          reader.readAsArrayBuffer(file)
        })
      })
      return
    } else {
      setError('Preview not available for this file type')
    }
  }, [file, width, height])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-beith-gray-500">
        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>{error}</span>
      </div>
    )
  }

  if (previewUrl === 'pdf-canvas') {
    return (
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} width={width} height={height} className="border rounded shadow" />
        <span className="text-xs text-beith-gray-500 mt-2">PDF Preview (first page)</span>
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
        <span className="text-xs text-beith-gray-500 mt-2">Image Preview</span>
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
        <span className="text-xs text-beith-gray-500 mt-2">Preview</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-beith-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>No preview available</span>
    </div>
  )
}
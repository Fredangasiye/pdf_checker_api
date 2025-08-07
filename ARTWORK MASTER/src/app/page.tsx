'use client'

import React, { useState } from 'react'
import FileUploader from '@/components/FileUploader'
import VisualPreview from '@/components/VisualPreview'
import PreflightResults from '@/components/PreflightResults'
import PrintPreview from '@/components/PrintPreview'
import { validateArtwork } from '@/lib/validation-rules'

interface UploadState {
  file: File | null
  uploading: boolean
  results: any | null
  error: string | null
}

export default function Home() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    results: null,
    error: null
  })

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-black mb-4">
          Welcome to Beith Digital Preflight Portal
        </h1>
        <p className="text-xl text-black max-w-3xl mx-auto">
          Upload your artwork files and get instant validation against our print specifications. 
          Ensure your designs are print-ready before production.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {!uploadState.results ? (
          <div className="bg-white rounded-lg shadow-lg border border-beith-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-beith-blue-100 mb-4">
                <svg className="h-6 w-6 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-black mb-2">
                Upload Your Artwork
              </h2>
              <p className="text-black">
                Drag and drop your files here or click to browse
              </p>
            </div>

            <FileUploader
              onFileSelect={handleFileSelect}
              onError={handleError}
              acceptedTypes={['pdf', 'ai', 'indd', 'psd', 'tiff', 'tif']}
            />

            {uploadState.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{uploadState.error}</p>
              </div>
            )}

            {uploadState.uploading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-beith-blue-100 text-beith-blue-700 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing your artwork...
                </div>
              </div>
            )}
          </div>
        ) : (
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

            {/* Visual Preview */}
            {uploadState.file && (
              <div className="bg-white rounded-lg shadow-lg border border-beith-gray-200 p-6">
                <h3 className="text-xl font-semibold text-black mb-4">Artwork Preview</h3>
                <div className="flex justify-center">
                  <VisualPreview file={uploadState.file} />
                </div>
              </div>
            )}

            {/* Print Preview */}
            {uploadState.results.metadata?.dimensions && (
              <PrintPreview
                artworkUrl={uploadState.file ? URL.createObjectURL(uploadState.file) : ''}
                dimensions={uploadState.results.metadata.dimensions}
                bleed={uploadState.results.metadata.hasBleed ? 3 : 0}
                liveArea={{ top: 5, right: 5, bottom: 5, left: 5 }}
              />
            )}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-black">Instant Validation</h3>
            <p className="text-sm text-black">Get immediate feedback on your artwork specifications</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-black">Visual Preview</h3>
            <p className="text-sm text-black">See exactly how your artwork will print with guides</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-black">Smart Guidance</h3>
            <p className="text-sm text-black">Get step-by-step instructions to fix any issues</p>
          </div>
        </div>
      </div>
    </div>
  )
}

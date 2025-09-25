'use client'
import React, { useState, useRef } from 'react'

interface PullUpBannerToolProps {
  onArtworkDrop: (file: File) => void
  isProcessing: boolean
}

interface BannerTemplate {
  id: string
  name: string
  width: number
  height: number
  description: string
  previewImage: string
}

const bannerTemplates: BannerTemplate[] = [
  {
    id: 'pull-up-banner-2050x850',
    name: 'Pull-Up Banner',
    width: 2050,
    height: 850,
    description: 'Standard 2050mm x 850mm pull-up banner',
    previewImage: '/banner-templates/pull-up-banner-2050x850.png'
  }
]

export default function PullUpBannerTool({ onArtworkDrop, isProcessing }: PullUpBannerToolProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BannerTemplate>(bannerTemplates[0])
  const [uploadedArtwork, setUploadedArtwork] = useState<File | null>(null)
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)
  const [fitInfo, setFitInfo] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name, file.type, file.size)
      // Accept all image types and PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        handleArtworkUpload(file)
      } else {
        alert('Please select an image file (JPG, PNG, GIF, etc.) or PDF file.')
      }
    }
  }

  const handleArtworkUpload = (file: File) => {
    setIsLoading(true)
    setUploadedArtwork(file)
    console.log('Processing artwork:', file.name, file.type, file.size)
    
    if (file.type === 'application/pdf') {
      // For PDFs, create a data URL for iframe preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('PDF data URL created, length:', result?.length)
        setArtworkPreview(result)
        
        // Try to get PDF dimensions using PDF.js or estimate
        // For now, use estimated dimensions and let iframe handle scaling
        const estimatedWidth = 2050 // Assume standard banner width
        const estimatedHeight = 850 // Assume standard banner height
        
        const templateAspectRatio = selectedTemplate.width / selectedTemplate.height
        const pdfAspectRatio = estimatedWidth / estimatedHeight
        
        let fitType = 'perfect'
        let scale = 1
        
        if (pdfAspectRatio > templateAspectRatio) {
          fitType = 'width'
          scale = selectedTemplate.width / estimatedWidth
        } else {
          fitType = 'height'
          scale = selectedTemplate.height / estimatedHeight
        }
        
        const fit = {
          fitType,
          scale,
          scaledWidth: estimatedWidth * scale,
          scaledHeight: estimatedHeight * scale,
          templateWidth: selectedTemplate.width,
          templateHeight: selectedTemplate.height
        }
        setFitInfo(fit)
        setIsLoading(false)
        console.log('PDF preview set, fitInfo:', fit)
      }
      reader.onerror = (error) => {
        console.error('Error reading PDF file:', error)
        alert('Error reading the PDF file. Please try a different file.')
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } else {
      // For images, create data URL preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('Image preview created, length:', result?.length)
        setArtworkPreview(result)
        
        // Calculate fit after image is loaded
        setTimeout(() => {
          calculateArtworkFit().then((fit) => {
            if (fit) {
              setFitInfo(fit)
            }
            setIsLoading(false)
          }).catch((error) => {
            console.error('Error calculating fit:', error)
            setIsLoading(false)
          })
        }, 100)
      }
      reader.onerror = (error) => {
        console.error('Error reading file:', error)
        alert('Error reading the image file. Please try a different file.')
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      console.log('File dropped:', file.name, file.type, file.size)
      // Accept all image types and PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        handleArtworkUpload(file)
      } else {
        alert('Please drop an image file (JPG, PNG, GIF, etc.) or PDF file.')
      }
    }
  }

  const handleTemplateChange = (template: BannerTemplate) => {
    setSelectedTemplate(template)
  }

  const calculateArtworkFit = async () => {
    if (!artworkPreview || !uploadedArtwork) return null

    const templateAspectRatio = selectedTemplate.width / selectedTemplate.height
    
    // Use estimated dimensions for PDFs
    if (uploadedArtwork.type === 'application/pdf') {
      const artworkWidth = 1000
      const artworkHeight = 1000
      const artworkAspectRatio = artworkWidth / artworkHeight
      
      let fitType = 'perfect'
      let scale = 1
      
      if (artworkAspectRatio > templateAspectRatio) {
        fitType = 'width'
        scale = selectedTemplate.width / artworkWidth
      } else {
        fitType = 'height'
        scale = selectedTemplate.height / artworkHeight
      }

      return {
        fitType,
        scale,
        scaledWidth: artworkWidth * scale,
        scaledHeight: artworkHeight * scale,
        templateWidth: selectedTemplate.width,
        templateHeight: selectedTemplate.height
      }
    }
    
    // For images, create a new Image object to get dimensions
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height)
        
        const artworkWidth = img.width
        const artworkHeight = img.height
        const artworkAspectRatio = artworkWidth / artworkHeight
        
        let fitType = 'perfect'
        let scale = 1
        
        if (artworkAspectRatio > templateAspectRatio) {
          fitType = 'width'
          scale = selectedTemplate.width / artworkWidth
        } else {
          fitType = 'height'
          scale = selectedTemplate.height / artworkHeight
        }

        resolve({
          fitType,
          scale,
          scaledWidth: artworkWidth * scale,
          scaledHeight: artworkHeight * scale,
          templateWidth: selectedTemplate.width,
          templateHeight: selectedTemplate.height
        })
      }
      
      img.onerror = (error) => {
        console.error('Failed to load image preview:', error)
        // Fallback to estimated dimensions
        const artworkWidth = 1000
        const artworkHeight = 1000
        const artworkAspectRatio = artworkWidth / artworkHeight
        
        let fitType = 'perfect'
        let scale = 1
        
        if (artworkAspectRatio > templateAspectRatio) {
          fitType = 'width'
          scale = selectedTemplate.width / artworkWidth
        } else {
          fitType = 'height'
          scale = selectedTemplate.height / artworkHeight
        }

        resolve({
          fitType,
          scale,
          scaledWidth: artworkWidth * scale,
          scaledHeight: artworkHeight * scale,
          templateWidth: selectedTemplate.width,
          templateHeight: selectedTemplate.height
        })
      }
      
      img.src = artworkPreview
    })
  }

  // fitInfo is now managed by state

  return (
    <div className="bg-gradient-to-br from-gray-800/15 via-gray-900/20 to-black/25 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-8 max-w-6xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Pull-Up Banner Template Tool</h2>
                    <p className="text-gray-700">Drop your artwork into the 2050×850mm pull-up banner template to see how it will look</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Template Selection & Upload */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-gray-800/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Select Banner Template</h3>
            <div className="grid grid-cols-1 gap-3">
              {bannerTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
                  }`}
                >
                  <div className="text-left">
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    <p className="text-sm text-gray-300">{template.description}</p>
                    <p className="text-xs text-blue-400">{template.width}mm × {template.height}mm</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Artwork Upload */}
          <div className="bg-gray-800/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Upload Artwork</h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-6xl text-gray-400">📁</div>
                <div>
                  <p className="text-white font-medium">Drop your artwork here</p>
                  <p className="text-gray-400 text-sm">Supports: JPG, PNG, GIF, PDF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.PDF"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    console.log('Choose file button clicked')
                    fileInputRef.current?.click()
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Choose File
                </button>
                <p className="text-xs text-gray-500">Click the button above or drag & drop a file</p>
              </div>
            </div>

            {uploadedArtwork && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium">✓ Artwork uploaded</p>
                <p className="text-green-300 text-sm">{uploadedArtwork.name}</p>
              </div>
            )}
            
            {/* File Info - Outside preview area */}
            {uploadedArtwork && (
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-gray-700">{uploadedArtwork.name}</p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            )}

          </div>

          {/* Fit Information */}
          {fitInfo && (
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Template Zones</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Bleed Area:</span>
                  <span className="text-pink-400 font-medium">2090mm × 890mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Trim Area:</span>
                  <span className="text-white font-medium">2050mm × 850mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Live Area:</span>
                  <span className="text-blue-400 font-medium">1955mm × 830mm</span>
                </div>
                <div className="border-t border-gray-600 mt-3 pt-3">
                  {uploadedArtwork?.type === 'application/pdf' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">File Type:</span>
                        <span className="text-blue-400 font-medium">PDF Document</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">File Name:</span>
                        <span className="text-white text-xs truncate max-w-32">{uploadedArtwork.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-green-400 font-medium">Ready for Processing</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Artwork Size:</span>
                        <span className="text-white">{Math.round(fitInfo.scaledWidth)}mm × {Math.round(fitInfo.scaledHeight)}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Fit Type:</span>
                        <span className={`font-medium ${fitInfo.fitType === 'perfect' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {fitInfo.fitType === 'perfect' ? 'Perfect Fit' : fitInfo.fitType === 'width' ? 'Fits to Width' : 'Fits to Height'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Scale:</span>
                        <span className="text-white">{(fitInfo.scale * 100).toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Visual Preview */}
        <div className="bg-gray-800/30 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-4">Visual Preview</h3>
          
                          <div className="relative bg-white rounded-lg overflow-hidden shadow-lg" style={{ width: '50%', height: '800px', margin: '0 auto' }}>
                            {/* Preview pane aspect ratio: 50% width × 800px height = 0.5 × 800 = 400px effective width */}
                            {/* So aspect ratio is approximately 400:800 = 1:2 */}
            {/* Template Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200">
              {/* Title */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-center">
                <h3 className="text-lg font-bold text-blue-800">PULL-UP BANNER</h3>
                <p className="text-sm font-semibold text-blue-800">{selectedTemplate.width}×{selectedTemplate.height}mm</p>
              </div>
              
              {/* Bleed Area (Outermost) */}
              <div className="absolute inset-2 border-2 border-pink-400 pointer-events-none">
                <div className="absolute -top-6 left-2 text-xs font-bold text-pink-600">BLEED-2090×890</div>
              </div>
              
              {/* Trim Area (Middle) */}
              <div className="absolute inset-4 border-2 border-black pointer-events-none">
                <div className="absolute -top-6 left-2 text-xs font-bold text-black">TRIM-2050×850</div>
              </div>
              
              {/* Live Area (Innermost) */}
              <div className="absolute inset-6 border-2 border-blue-400 pointer-events-none">
                <div className="absolute -top-6 left-2 text-xs font-bold text-blue-600">LIVE AREA-1955×830</div>
              </div>
            </div>

            {/* Artwork Overlay - Positioned in Live Area */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              </div>
            )}
            
            {artworkPreview && !isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  padding: '2%' // Reduced padding for larger preview
                }}
              >

                                                {uploadedArtwork?.type === 'application/pdf' ? (
                  // PDF Preview - Back to iframe with hidden interface
                  <iframe
                    src={`${artworkPreview}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit&pagemode=none`}
                    className="w-full h-full"
                    style={{
                      border: 'none',
                      height: '100%',
                      width: '100%',
                      transform: 'scale(0.75)',
                      transformOrigin: 'center center'
                    }}
                    title="PDF Preview"
                    scrolling="no"
                    frameBorder="0"
                  />
                ) : (
                  // Image Preview
                  <img
                    src={artworkPreview}
                    alt="Artwork Preview"
                    className="max-w-full max-h-full object-contain shadow-lg"
                    style={fitInfo ? {
                      width: `${(fitInfo.scaledWidth / fitInfo.templateWidth) * 88}%`,
                      height: `${(fitInfo.scaledHeight / fitInfo.templateHeight) * 88}%`
                    } : {
                      width: '60%',
                      height: '60%'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load in preview')
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
            )}
            


          </div>

          {/* Template Info */}
          <div className="mt-4 text-center">
            <p className="text-gray-300 text-sm">{selectedTemplate.name}</p>
            <p className="text-gray-400 text-xs">{selectedTemplate.description}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <button
          onClick={() => {
            setUploadedArtwork(null)
            setArtworkPreview(null)
            setFitInfo(null)
            setIsLoading(false)
          }}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Clear Artwork
        </button>
        <button
          onClick={() => {
            if (uploadedArtwork) {
              onArtworkDrop(uploadedArtwork)
            }
          }}
          disabled={!uploadedArtwork || isProcessing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Process Artwork'}
        </button>
      </div>
    </div>
  )
} 
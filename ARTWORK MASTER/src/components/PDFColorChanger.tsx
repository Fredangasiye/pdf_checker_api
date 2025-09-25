'use client'

import React, { useState } from 'react'

interface ColorPair {
  oldColor: string
  newColor: string
}

interface DetectedColor {
  rgb: [number, number, number]
  cmyk: [number, number, number, number]
  standardized_rgb: [number, number, number]
  standardized_cmyk: [number, number, number, number]
  color_name: string
  standard_rgb_255: [number, number, number]
}

interface PDFColorChangerProps {
  onColorChange: (file: File, colorPairs: ColorPair[], tolerance: number) => Promise<void>
  isProcessing: boolean
}

export default function PDFColorChanger({ onColorChange, isProcessing }: PDFColorChangerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tolerance, setTolerance] = useState(30.0)
  const [colorPairs, setColorPairs] = useState<ColorPair[]>([
    { oldColor: '', newColor: '' }
  ])
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([])
  const [showColorInfo, setShowColorInfo] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setDetectedColors([])
      setShowColorInfo(false)
    }
  }

  const addColorPair = () => {
    setColorPairs([...colorPairs, { oldColor: '', newColor: '' }])
  }

  const removeColorPair = (index: number) => {
    if (colorPairs.length > 1) {
      setColorPairs(colorPairs.filter((_, i) => i !== index))
    }
  }

  const updateColorPair = (index: number, field: 'oldColor' | 'newColor', value: string) => {
    const newPairs = [...colorPairs]
    newPairs[index][field] = value
    setColorPairs(newPairs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const validPairs = colorPairs.filter(pair => pair.oldColor && pair.newColor)
    if (validPairs.length === 0) return

    await onColorChange(selectedFile, validPairs, tolerance)
  }

  const handleAnalyzeColors = async () => {
    if (!selectedFile) return
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('analyze', 'true')

      const response = await fetch('/api/change-colors', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        if (result.colors) {
          setDetectedColors(result.colors)
          setShowColorInfo(true)
        }
      }
    } catch (error) {
      console.error('Error analyzing colors:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/15 via-gray-900/20 to-black/25 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-blue-500/2 to-cyan-500/2"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/3 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/3 to-transparent rounded-full blur-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">PDF Color Changer</h2>
          <p className="text-gray-600">
            Intelligently find and replace colors in your PDF files
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              1. Upload PDF File
            </label>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
            />
            {selectedFile && (
              <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-600">
              Selected: {selectedFile.name}
            </p>
                <button
                  type="button"
                  onClick={handleAnalyzeColors}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors text-sm"
                >
                  Analyze Colors
                </button>
              </div>
            )}
          </div>

          {/* Detected Colors */}
          {showColorInfo && detectedColors.length > 0 && (
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
              <h3 className="text-sm font-medium text-white mb-3">Detected Colors in PDF:</h3>
              <div className="grid grid-cols-1 gap-4">
                {detectedColors.map((color, index) => (
                  <div key={index} className="p-3 bg-gray-700/30 rounded border border-gray-600/30">
                    {/* Color Swatch */}
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-8 h-8 rounded border border-gray-500"
                        style={{
                          backgroundColor: `rgb(${Math.round(color.rgb[0] * 255)}, ${Math.round(color.rgb[1] * 255)}, ${Math.round(color.rgb[2] * 255)})`
                        }}
                      ></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {color.color_name !== "Custom" ? color.color_name : "Custom Color"}
                        </div>
                        {color.color_name !== "Custom" && (
                          <div className="text-xs text-gray-600">
                            Standard color match
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actual Detected Values */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-2">Actual Detected Values:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-700">
                          <span className="text-gray-600">RGB:</span> {Math.round(color.rgb[0] * 255)}, {Math.round(color.rgb[1] * 255)}, {Math.round(color.rgb[2] * 255)}
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-600">CMYK:</span> {Math.round(color.cmyk[0])}, {Math.round(color.cmyk[1])}, {Math.round(color.cmyk[2])}, {Math.round(color.cmyk[3])}
                        </div>
                      </div>
                    </div>
                    
                    {/* Standardized Values */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-2">Standardized (Illustrator Match):</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-gray-700">
                          <span className="text-gray-600">RGB:</span> {color.standardized_rgb[0]}, {color.standardized_rgb[1]}, {color.standardized_rgb[2]}
                        </div>
                        <div className="text-gray-700">
                          <span className="text-gray-600">CMYK:</span> {color.standardized_cmyk[0]}, {color.standardized_cmyk[1]}, {color.standardized_cmyk[2]}, {color.standardized_cmyk[3]}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Copy Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cmykStr = `${color.standardized_cmyk[0]},${color.standardized_cmyk[1]},${color.standardized_cmyk[2]},${color.standardized_cmyk[3]}`
                          navigator.clipboard.writeText(cmykStr)
                        }}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        Copy CMYK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rgbStr = `${color.standardized_rgb[0]},${color.standardized_rgb[1]},${color.standardized_rgb[2]}`
                          navigator.clipboard.writeText(rgbStr)
                        }}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                      >
                        Copy RGB
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <p className="text-xs text-blue-300">
                  💡 <strong>Pro Tip:</strong> Use the "Standardized" values (which match what you saved in Illustrator) as your "Old Color" for better matching results. The "Copy" buttons will copy the exact values you need.
                </p>
              </div>
            </div>
          )}

          {/* Tolerance */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              2. CMYK Matching Tolerance
            </label>
            <input
              type="number"
              value={tolerance}
              onChange={(e) => setTolerance(parseFloat(e.target.value))}
              step="1.0"
              min="0"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-600">
              For finding CMYK colors. Lower is stricter. Increase if colors aren't found.
            </p>
          </div>

          {/* Color Replacements */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">
              3. Define Color Replacements
            </label>
            
            {colorPairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-600/30">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={pair.oldColor}
                    onChange={(e) => updateColorPair(index, 'oldColor', e.target.value)}
                    placeholder="Old Color (e.g., 100,0,0,0)"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500"
                  />
                  <div className="text-center">
                    <span className="text-sm text-gray-600">to</span>
                  </div>
                  <input
                    type="text"
                    value={pair.newColor}
                    onChange={(e) => updateColorPair(index, 'newColor', e.target.value)}
                    placeholder="New Color (e.g., 0,100,0,0)"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500"
                  />
                </div>
                {colorPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColorPair(index)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addColorPair}
              className="w-full py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
            >
              Add Another Color Replacement
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || isProcessing}
            className="w-full py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Replace Colors & Download'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 
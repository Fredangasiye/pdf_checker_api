'use client'

import React, { useState } from 'react'

interface BleedRemovalToolProps {
  onBleedRemoval: (file: File, config: BleedRemovalConfig) => Promise<void>
  isProcessing: boolean
}

interface BleedRemovalConfig {
  removeTop: boolean
  removeRight: boolean
  removeBottom: boolean
  removeLeft: boolean
  bleedAmount: number
}

export default function BleedRemovalTool({ onBleedRemoval, isProcessing }: BleedRemovalToolProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bleedAmount, setBleedAmount] = useState(3)
  const [bleedConfig, setBleedConfig] = useState<BleedRemovalConfig>({
    removeTop: false,
    removeRight: false,
    removeBottom: false,
    removeLeft: false,
    bleedAmount: 3
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    }
  }

  const handleSideToggle = (side: keyof Omit<BleedRemovalConfig, 'bleedAmount'>) => {
    setBleedConfig(prev => ({
      ...prev,
      [side]: !prev[side]
    }))
  }

  const handleBleedAmountChange = (amount: number) => {
    setBleedAmount(amount)
    setBleedConfig(prev => ({
      ...prev,
      bleedAmount: amount
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    // Check if at least one side is selected
    const hasSelection = bleedConfig.removeTop || bleedConfig.removeRight || 
                        bleedConfig.removeBottom || bleedConfig.removeLeft
    
    if (!hasSelection) {
      alert('Please select at least one side to remove bleed from')
      return
    }

    await onBleedRemoval(selectedFile, bleedConfig)
  }

  const getSelectedSidesCount = () => {
    return [bleedConfig.removeTop, bleedConfig.removeRight, 
            bleedConfig.removeBottom, bleedConfig.removeLeft]
      .filter(Boolean).length
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/15 via-gray-900/20 to-black/25 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-8 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/2 via-red-500/2 to-pink-500/2"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/3 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/3 to-transparent rounded-full blur-2xl"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bleed Removal Tool</h2>
          <p className="text-gray-300">
            Selectively remove bleed from specific sides of your artwork
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
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30"
            />
            {selectedFile && (
              <p className="text-sm text-gray-400">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Bleed Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              2. Bleed Amount (mm)
            </label>
            <input
              type="number"
              value={bleedAmount}
              onChange={(e) => handleBleedAmountChange(parseFloat(e.target.value) || 3)}
              step="0.5"
              min="0.5"
              max="10"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400">
              Standard bleed is 3mm. Adjust if your artwork uses a different bleed amount.
            </p>
          </div>

          {/* Visual Bleed Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white">
              3. Select Sides to Remove Bleed From
            </label>
            
            {/* Visual Representation */}
            <div className="flex justify-center">
              <div className="relative w-64 h-64 bg-gray-800/50 border-2 border-gray-600/50 rounded-lg">
                {/* Artwork Area */}
                <div className="absolute inset-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded">
                  <div className="flex items-center justify-center h-full text-xs text-blue-300">
                    Artwork
                  </div>
                </div>
                
                {/* Bleed Areas */}
                {/* Top Bleed */}
                <div 
                  className={`absolute top-0 left-8 right-8 h-8 cursor-pointer transition-all ${
                    bleedConfig.removeTop 
                      ? 'bg-red-500/60 border-2 border-red-400' 
                      : 'bg-orange-500/30 border-2 border-orange-400/50 hover:bg-orange-500/50'
                  }`}
                  onClick={() => handleSideToggle('removeTop')}
                >
                  <div className="flex items-center justify-center h-full text-xs text-white font-medium">
                    {bleedConfig.removeTop ? 'REMOVE' : 'Top'}
                  </div>
                </div>
                
                {/* Right Bleed */}
                <div 
                  className={`absolute top-8 right-0 bottom-8 w-8 cursor-pointer transition-all ${
                    bleedConfig.removeRight 
                      ? 'bg-red-500/60 border-2 border-red-400' 
                      : 'bg-orange-500/30 border-2 border-orange-400/50 hover:bg-orange-500/50'
                  }`}
                  onClick={() => handleSideToggle('removeRight')}
                >
                  <div className="flex items-center justify-center h-full text-xs text-white font-medium rotate-90">
                    {bleedConfig.removeRight ? 'REMOVE' : 'Right'}
                  </div>
                </div>
                
                {/* Bottom Bleed */}
                <div 
                  className={`absolute bottom-0 left-8 right-8 h-8 cursor-pointer transition-all ${
                    bleedConfig.removeBottom 
                      ? 'bg-red-500/60 border-2 border-red-400' 
                      : 'bg-orange-500/30 border-2 border-orange-400/50 hover:bg-orange-500/50'
                  }`}
                  onClick={() => handleSideToggle('removeBottom')}
                >
                  <div className="flex items-center justify-center h-full text-xs text-white font-medium">
                    {bleedConfig.removeBottom ? 'REMOVE' : 'Bottom'}
                  </div>
                </div>
                
                {/* Left Bleed */}
                <div 
                  className={`absolute top-8 left-0 bottom-8 w-8 cursor-pointer transition-all ${
                    bleedConfig.removeLeft 
                      ? 'bg-red-500/60 border-2 border-red-400' 
                      : 'bg-orange-500/30 border-2 border-orange-400/50 hover:bg-orange-500/50'
                  }`}
                  onClick={() => handleSideToggle('removeLeft')}
                >
                  <div className="flex items-center justify-center h-full text-xs text-white font-medium rotate-90">
                    {bleedConfig.removeLeft ? 'REMOVE' : 'Left'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setBleedConfig({
                  ...bleedConfig,
                  removeTop: true,
                  removeRight: true,
                  removeBottom: true,
                  removeLeft: true
                })}
                className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors text-sm"
              >
                Remove All Sides
              </button>
              <button
                type="button"
                onClick={() => setBleedConfig({
                  ...bleedConfig,
                  removeTop: false,
                  removeRight: false,
                  removeBottom: false,
                  removeLeft: false
                })}
                className="px-3 py-2 bg-gray-500/20 text-gray-400 rounded-md hover:bg-gray-500/30 transition-colors text-sm"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setBleedConfig({
                  ...bleedConfig,
                  removeTop: true,
                  removeBottom: true,
                  removeLeft: false,
                  removeRight: false
                })}
                className="px-3 py-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors text-sm"
              >
                Top & Bottom Only
              </button>
              <button
                type="button"
                onClick={() => setBleedConfig({
                  ...bleedConfig,
                  removeTop: false,
                  removeBottom: false,
                  removeLeft: true,
                  removeRight: true
                })}
                className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition-colors text-sm"
              >
                Left & Right Only
              </button>
            </div>

            {/* Selection Summary */}
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Selected: <span className="text-orange-400 font-medium">{getSelectedSidesCount()}</span> side{getSelectedSidesCount() !== 1 ? 's' : ''}
              </p>
              {getSelectedSidesCount() > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Will remove {bleedAmount}mm bleed from selected sides
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-orange-300 mb-1">How it works</h4>
                <p className="text-xs text-orange-200/80">
                  This tool crops your PDF to remove the specified bleed areas. The artwork content remains unchanged - 
                  only the bleed margins are removed. This is useful when you need to remove bleed for digital use 
                  or when preparing files for specific printing requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedFile || isProcessing || getSelectedSidesCount() === 0}
            className="w-full py-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white rounded-lg hover:from-orange-500/30 hover:to-red-500/30 transition-all border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Removing Bleed...
              </div>
            ) : (
              'Remove Bleed & Download'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 
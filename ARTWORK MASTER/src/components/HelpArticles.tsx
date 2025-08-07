'use client'

import React, { useState } from 'react'

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
  steps?: string[]
  relatedRules?: string[]
}

const helpArticles: HelpArticle[] = [
  {
    id: 'resolution-fix',
    title: 'How to Fix Low Resolution Issues',
    category: 'Resolution',
    content: 'Low resolution can cause blurry or pixelated prints. Here\'s how to fix it:',
    steps: [
      'Open your artwork in your design software',
      'Check the current document resolution (usually in Document Setup or Properties)',
      'Increase the resolution to 300 DPI or higher',
      'If scaling up, use high-quality interpolation settings',
      'Save your file and re-upload for validation'
    ],
    relatedRules: ['Resolution']
  },
  {
    id: 'color-space-conversion',
    title: 'Converting RGB to CMYK for Print',
    category: 'Color Space',
    content: 'RGB colors may not print accurately. Convert to CMYK for consistent results:',
    steps: [
      'Open your artwork in Adobe Illustrator, Photoshop, or InDesign',
      'Go to Edit > Color Settings (or similar)',
      'Select a CMYK color profile (e.g., SWOP, FOGRA)',
      'Convert your artwork to CMYK color mode',
      'Check that colors still look good (some bright colors may dull)',
      'Save and re-upload for validation'
    ],
    relatedRules: ['Color Space']
  },
  {
    id: 'adding-bleed',
    title: 'Adding Bleed to Your Artwork',
    category: 'Bleed',
    content: 'Bleed ensures your design extends to the edge of the printed piece:',
    steps: [
      'Determine your final print size (e.g., A4: 210mm x 297mm)',
      'Add 3mm bleed on all sides (total size: 216mm x 303mm)',
      'Extend background colors and images into the bleed area',
      'Keep important content within the safe area (6mm from edges)',
      'Set up your document with bleed settings in your software',
      'Save and re-upload for validation'
    ],
    relatedRules: ['Bleed', 'Live Area']
  },
  {
    id: 'font-embedding',
    title: 'Embedding Fonts in Your Document',
    category: 'Fonts',
    content: 'Embedding fonts ensures your text prints correctly:',
    steps: [
      'In Adobe Illustrator: Select all text and go to Type > Create Outlines',
      'In Adobe InDesign: Go to File > Package and include fonts',
      'In Adobe Photoshop: Rasterize text layers or use smart objects',
      'Alternative: Use system fonts that are widely available',
      'Save your file and re-upload for validation'
    ],
    relatedRules: ['Fonts']
  }
]

interface HelpArticlesProps {
  selectedRule?: string
  onClose?: () => void
}

export default function HelpArticles({ selectedRule, onClose }: HelpArticlesProps) {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(selectedRule ? 'resolution-fix' : null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredArticles = helpArticles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (selectedRule && article.relatedRules?.includes(selectedRule))
  )

  const currentArticle = helpArticles.find(article => article.id === selectedArticle)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">Help & Correction Guide</h2>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-black hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Article List */}
        <div className="lg:col-span-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-beith-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-beith-blue-500"
            />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredArticles.map(article => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedArticle === article.id
                    ? 'border-beith-blue-500 bg-beith-blue-50 text-beith-blue-700'
                    : 'border-beith-gray-200 hover:border-beith-gray-300 hover:bg-beith-gray-50'
                }`}
              >
                <div className="font-medium">{article.title}</div>
                <div className="text-sm text-black">{article.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Article Content */}
        <div className="lg:col-span-2">
          {currentArticle ? (
            <div>
              <h3 className="text-xl font-semibold text-black mb-2">
                {currentArticle.title}
              </h3>
                              <div className="text-sm text-black mb-4">
                Category: {currentArticle.category}
              </div>
              
                              <p className="text-black mb-6">{currentArticle.content}</p>
              
              {currentArticle.steps && (
                <div>
                  <h4 className="font-semibold text-black mb-3">Step-by-Step Instructions:</h4>
                  <ol className="space-y-3">
                    {currentArticle.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-beith-blue-100 text-beith-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-black">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              {currentArticle.relatedRules && (
                <div className="mt-6 pt-4 border-t border-beith-gray-200">
                  <h4 className="font-semibold text-black mb-2">Related Validation Rules:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentArticle.relatedRules.map(rule => (
                      <span
                        key={rule}
                        className="px-2 py-1 bg-gray-100 text-black rounded text-sm"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-black py-12">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p>Select an article from the list to view help and correction instructions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
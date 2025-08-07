'use client'

import React from 'react'
import { ValidationResult } from '@/lib/validation-rules'

interface PreflightResultsProps {
  results: Record<string, ValidationResult>
  summary: {
    passed: number
    failed: number
    warnings: number
  }
  overall: boolean
  fileName: string
  fileSize: number
  metadata?: any
  onRetry?: () => void
  onDownload?: () => void
}

export default function PreflightResults({
  results,
  summary,
  overall,
  fileName,
  fileSize,
  metadata,
  onRetry,
  onDownload
}: PreflightResultsProps) {
  const getStatusColor = () => {
    if (overall) return 'bg-green-100 text-green-800 border-green-200'
    if (summary.failed > 0) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getStatusIcon = () => {
    if (overall) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    if (summary.failed > 0) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  }

  const getStatusText = () => {
    if (overall) return 'Print Ready'
    if (summary.failed > 0) return 'Corrections Needed'
    return 'Review Required'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
                  <h2 className="text-2xl font-bold text-black">Preflight Results</h2>
        <p className="text-black mt-1">
            {fileName} ({(fileSize / 1024 / 1024).toFixed(1)}MB)
          </p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-semibold">{getStatusText()}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
          <div className="text-sm text-green-700">Passed</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
          <div className="text-sm text-yellow-700">Warnings</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{Object.keys(results).length}</div>
          <div className="text-sm text-blue-700">Total Checks</div>
        </div>
      </div>

      {/* File Metadata */}
      {metadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-black mb-2">File Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {metadata.dimensions && (
              <div>
                <span className="font-medium text-black">Dimensions:</span>
                <span className="ml-2 text-black">
                  {metadata.dimensions.height}mm x {metadata.dimensions.width}mm
                </span>
              </div>
            )}
            {metadata.resolution && (
              <div>
                <span className="font-medium text-black">Resolution:</span>
                <span className="ml-2 text-black">{metadata.resolution} DPI</span>
              </div>
            )}
            {metadata.colorSpace && (
              <div>
                <span className="font-medium text-black">Color Space:</span>
                <span className="ml-2 text-black">{metadata.colorSpace}</span>
              </div>
            )}
            {metadata.fonts && metadata.fonts.length > 0 && (
              <div>
                <span className="font-medium text-black">Fonts:</span>
                <span className="ml-2 text-black">{metadata.fonts.length} detected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-4">
        <h3 className="font-semibold text-black">Validation Details</h3>
        {Object.entries(results).map(([ruleName, result]) => (
          <div
            key={ruleName}
            className={`border rounded-lg p-4 ${
              result.passed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(result.passed ? 'info' : 'error')}`}>
                  {getSeverityIcon(result.passed ? 'info' : 'error')}
                  <span>{ruleName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {result.passed ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`font-medium ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                    {result.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>
            
            <p className={`mt-2 ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>

            {result.details && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="text-sm font-medium text-black mb-2">Details</h4>
                {result.details.recommendation && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-black">Recommendation:</span>
                    <p className="text-sm text-black mt-1">{result.details.recommendation}</p>
                  </div>
                )}
                {result.details.examples && (
                  <div>
                    <span className="text-sm font-medium text-black">Examples:</span>
                    <ul className="text-sm text-black mt-1 space-y-1">
                      {Object.entries(result.details.examples).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium">{key}:</span> {value as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.details.fonts && (
                  <div>
                    <span className="text-sm font-medium text-black">Fonts:</span>
                    <ul className="text-sm text-black mt-1">
                      {result.details.fonts.map((font: string, index: number) => (
                        <li key={index}>• {font}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-beith-gray-200">
        <div className="flex space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Upload New File
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          {overall && onDownload && (
            <button
              onClick={onDownload}
              className="px-6 py-2 bg-beith-blue-600 text-white rounded-lg hover:bg-beith-blue-700 focus:outline-none focus:ring-2 focus:ring-beith-blue-500"
            >
              Download Report
            </button>
          )}
          <button
            onClick={() => window.print()}
                          className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  )
} 
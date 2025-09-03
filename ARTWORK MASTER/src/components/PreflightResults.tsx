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
  overall: string
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
    if (overall === 'pass') return 'bg-green-100 text-green-800 border-green-200'
    if (overall === 'fail') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getStatusIcon = () => {
    if (overall === 'pass') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    if (overall === 'fail') {
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
    if (overall === 'pass') return 'Print Ready'
    if (overall === 'fail') return 'Corrections Needed'
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
    <div className="bg-gray-900/70 rounded-2xl backdrop-blur-sm border border-[var(--accent-neon)] p-6 max-w-4xl mx-auto transition-shadow shadow-[0_0_10px_var(--accent-neon)] hover:shadow-[0_0_20px_var(--accent-neon)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Preflight Results</h2>
          <p className="text-gray-700 mt-1">
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
        <div className="bg-gray-800/50 border border-[var(--accent-neon)] rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-400">{summary.passed}</div>
          <div className="text-sm text-green-300">Passed</div>
        </div>
        <div className="bg-gray-800/50 border border-[var(--accent-neon)] rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
          <div className="text-sm text-red-300">Failed</div>
        </div>
        <div className="bg-gray-800/50 border border-[var(--accent-neon)] rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-yellow-400">{summary.warnings}</div>
          <div className="text-sm text-yellow-300">Warnings</div>
        </div>
        <div className="bg-gray-800/50 border border-[var(--accent-neon)] rounded-lg p-4 text-center backdrop-blur-sm">
          <div className="text-2xl font-bold text-blue-400">{Object.keys(results).length}</div>
          <div className="text-sm text-blue-300">Total Checks</div>
        </div>
      </div>

      {/* File Metadata */}
      {metadata && (
        <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">File Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {metadata.dimensions && (
              <div>
                <span className="font-medium text-gray-700">Finished Size:</span>
                <span className="ml-2 text-white">
                  {metadata.hasBleed 
                    ? `${metadata.dimensions.height - 6}mm x ${metadata.dimensions.width - 6}mm (trim size)`
                    : `${metadata.dimensions.height}mm x ${metadata.dimensions.width}mm`
                  }
                </span>
              </div>
            )}
            <div>
                              <span className="font-medium text-gray-700">File Size:</span>
              <span className="ml-2 text-white">
                {(fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            {metadata.resolution && (
              <div>
                <span className="font-medium text-gray-700">Resolution:</span>
                <span className="ml-2 text-white">{metadata.resolution} DPI</span>
              </div>
            )}
            {metadata.colorSpace && (
              <div>
                <span className="font-medium text-gray-700">Color Space:</span>
                <span className="ml-2 text-white">{metadata.colorSpace}</span>
              </div>
            )}
            <div>
                              <span className="font-medium text-gray-700">Bleed:</span>
              <span className="ml-2 text-white">
                {metadata.hasBleed ? '3mm (Configured)' : 'Not configured'}
              </span>
            </div>
            {metadata.spotColors && metadata.spotColors.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Spot Colors:</span>
                <span className="ml-2 text-white">
                  {metadata.spotColors.join(', ')}
                </span>
              </div>
            )}
            {metadata.fonts && metadata.fonts.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Fonts:</span>
                <span className="ml-2 text-white">
                  {metadata.fonts.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-4">
        <h3 className="font-semibold text-white">Validation Details</h3>
        {Object.entries(results).map(([ruleName, result]) => (
          <div
            key={ruleName}
            className={`border rounded-lg p-4 backdrop-blur-sm ${
              result.passed 
                ? 'bg-green-900/20 border-green-700/50' 
                : 'bg-red-900/20 border-red-700/50'
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
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`font-medium ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                    {result.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>
            
            <p className={`mt-2 ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
              {result.message}
            </p>

            {result.details && (
              <div className="mt-3 p-3 bg-gray-700/30 rounded border border-gray-600/50 backdrop-blur-sm">
                <h4 className="text-sm font-medium text-white mb-2">Details</h4>
                {result.details.recommendation && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-300">Recommendation:</span>
                    <p className="text-sm text-white mt-1">{result.details.recommendation}</p>
                  </div>
                )}
                {result.details.examples && (
                  <div>
                    <span className="text-sm font-medium text-gray-300">Examples:</span>
                    <ul className="text-sm text-white mt-1 space-y-1">
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
                    <span className="text-sm font-medium text-gray-300">Fonts:</span>
                    <ul className="text-sm text-white mt-1">
                      {result.details.fonts.map((font: string, index: number) => (
                        <li key={index}>• {font}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.details.spotColors && (
                  <div>
                    <span className="text-sm font-medium text-gray-300">Spot Colors:</span>
                    <ul className="text-sm text-white mt-1">
                      {result.details.spotColors.map((color: string, index: number) => (
                        <li key={index}>• {color}</li>
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
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-600/50">
        <div className="flex space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-white bg-gray-700/50 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm transition-all duration-200"
            >
              Upload New File
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          {overall === 'pass' && onDownload && (
            <button
              onClick={onDownload}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              Download Report
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-white bg-gray-700/50 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm transition-all duration-200"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  )
} 
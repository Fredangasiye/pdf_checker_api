'use client'

import React from 'react'

interface PrintPreviewProps {
  artworkUrl: string
  dimensions: { width: number; height: number }
  bleed?: number // in mm
  liveArea?: { top: number; right: number; bottom: number; left: number } // margins in mm
  scale?: number // display scale (1 = 100%)
}

export default function PrintPreview({ 
  artworkUrl, 
  dimensions, 
  bleed = 3, 
  liveArea = { top: 5, right: 5, bottom: 5, left: 5 },
  scale = 0.5 
}: PrintPreviewProps) {
  const totalWidth = dimensions.width + (bleed * 2)
  const totalHeight = dimensions.height + (bleed * 2)
  
  const displayWidth = totalWidth * scale
  const displayHeight = totalHeight * scale

  return (
    <div className="flex flex-col items-center p-4 bg-beith-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold text-beith-gray-900 mb-4">Print Preview</h3>
      
      <div className="relative border-2 border-beith-gray-300 bg-white shadow-lg" 
           style={{ width: displayWidth, height: displayHeight }}>
        
        {/* Bleed area (outer) */}
        <div className="absolute inset-0 border-2 border-red-400 border-dashed opacity-50"
             title="Bleed area (3mm)"></div>
        
        {/* Trim line */}
        <div className="absolute border border-red-600"
             style={{
               top: bleed * scale,
               left: bleed * scale,
               width: dimensions.width * scale,
               height: dimensions.height * scale
             }}
             title="Trim line"></div>
        
        {/* Live area (safe zone) */}
        <div className="absolute border-2 border-blue-500 border-dashed opacity-70"
             style={{
               top: (bleed + liveArea.top) * scale,
               left: (bleed + liveArea.left) * scale,
               width: (dimensions.width - liveArea.left - liveArea.right) * scale,
               height: (dimensions.height - liveArea.top - liveArea.bottom) * scale
             }}
             title="Live area (safe zone)"></div>
        
        {/* Artwork image */}
        <img
          src={artworkUrl}
          alt="Artwork preview"
          className="absolute object-contain"
          style={{
            top: bleed * scale,
            left: bleed * scale,
            width: dimensions.width * scale,
            height: dimensions.height * scale
          }}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-red-400 border-dashed bg-red-50"></div>
          <span>Bleed ({bleed}mm)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border border-red-600"></div>
          <span>Trim line</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-dashed bg-blue-50"></div>
          <span>Live area</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-beith-gray-600">
        Dimensions: {dimensions.width}mm × {dimensions.height}mm | Scale: {scale * 100}%
      </div>
    </div>
  )
} 
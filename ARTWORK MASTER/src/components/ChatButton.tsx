'use client'

import React, { useState } from 'react'

interface ChatButtonProps {
  onClick: () => void
  isOpen: boolean
}

export default function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isOpen) return null

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-40 group"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* BEITHA Logo */}
        <div className="text-white font-bold text-xl">B</div>
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
        
        {/* Hover Effect */}
        {isHovered && (
          <div className="absolute -top-12 right-0 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
            Chat with BEITHA
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        )}
      </div>
    </button>
  )
} 
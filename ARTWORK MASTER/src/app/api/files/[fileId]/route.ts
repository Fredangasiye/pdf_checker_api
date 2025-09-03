import { NextRequest, NextResponse } from 'next/server'
import { fileProcessor } from '@/lib/file-processor'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get file info from the processor
    const fileInfo = await fileProcessor.getFileInfo(fileId)

    if (!fileInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if file exists on disk
    try {
      await fs.access(fileInfo.filePath)
    } catch {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(fileInfo.filePath)

    // Determine content type
    const contentType = fileInfo.mimeType || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileInfo.originalName}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })

  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to serve file',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 
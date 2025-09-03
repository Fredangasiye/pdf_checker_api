import { NextRequest, NextResponse } from 'next/server'
import { fileProcessor } from '@/lib/file-processor'
import { isValidFileSize, isValidFileType } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as any
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1)
      const maxSizeMB = (file.size / 1024 / 1024).toFixed(0)
      return NextResponse.json(
        { 
          error: 'File too large',
          message: `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB`
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          message: `File type "${file.name.split('.').pop()}" is not supported. Please upload: PDF, AI, INDD, PSD, or TIFF files`
        },
        { status: 400 }
      )
    }

    // Save file to storage
    const fileInfo = await fileProcessor.saveFile(file)

    // Process file to extract metadata
    const processingResult = await fileProcessor.processFile(fileInfo)

    if (!processingResult.success) {
      return NextResponse.json(
        { 
          error: 'File processing failed',
          message: processingResult.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fileId: fileInfo.id,
      fileName: fileInfo.originalName,
      fileSize: fileInfo.fileSize,
      metadata: processingResult.metadata,
      uploadedAt: fileInfo.uploadedAt
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    const fileInfo = await fileProcessor.getFileInfo(fileId)

    if (!fileInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      fileInfo: {
        id: fileInfo.id,
        fileName: fileInfo.originalName,
        fileSize: fileInfo.fileSize,
        uploadedAt: fileInfo.uploadedAt,
        status: fileInfo.status
      }
    })

  } catch (error) {
    console.error('Get file info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get file info',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    const fileInfo = await fileProcessor.getFileInfo(fileId)

    if (!fileInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    await fileProcessor.deleteFile(fileInfo)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

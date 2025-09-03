import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { fileId, fileName } = await request.json()

    if (!fileId || !fileName) {
      return NextResponse.json({ error: 'Missing fileId or fileName' }, { status: 400 })
    }

    // Construct the file paths
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const inputPath = path.join(uploadsDir, `${fileId}.pdf`)
    const outputPath = path.join(uploadsDir, `${fileId}_outlined.pdf`)

    // Check if input file exists
    try {
      await fs.access(inputPath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Use Ghostscript to convert text to outlines
    // This command flattens all text to paths/outlines
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/printer -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`

    try {
      await execAsync(gsCommand)
    } catch (gsError) {
      console.error('Ghostscript error:', gsError)
      return NextResponse.json(
        { error: 'Failed to convert text to outlines. Ghostscript may not be installed.' },
        { status: 500 }
      )
    }

    // Check if output file was created
    try {
      await fs.access(outputPath)
    } catch {
      return NextResponse.json(
        { error: 'Failed to create output file' },
        { status: 500 }
      )
    }

    // Read the converted PDF
    const convertedPdfBytes = await fs.readFile(outputPath)

    // Clean up the temporary output file
    try {
      await fs.unlink(outputPath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError)
    }

    // Return the converted PDF
    return new Response(new Uint8Array(convertedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName.replace('.pdf', '_outlined.pdf')}"`,
      },
    })

  } catch (error) {
    console.error('Error converting text to outlines:', error)
    return NextResponse.json(
      { error: 'Failed to convert text to outlines' },
      { status: 500 }
    )
  }
}

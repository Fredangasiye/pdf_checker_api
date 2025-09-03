import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { PDFDocument } from 'pdf-lib'

interface BleedRemovalConfig {
  removeTop: boolean
  removeRight: boolean
  removeBottom: boolean
  removeLeft: boolean
  bleedAmount: number // in mm
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as any
    const file = formData.get('file')
    const removeTop = formData.get('removeTop') === 'true'
    const removeRight = formData.get('removeRight') === 'true'
    const removeBottom = formData.get('removeBottom') === 'true'
    const removeLeft = formData.get('removeLeft') === 'true'
    const bleedAmount = parseFloat(formData.get('bleedAmount') as string || '3')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate that at least one side is selected for removal
    if (!removeTop && !removeRight && !removeBottom && !removeLeft) {
      return NextResponse.json({ error: 'Please select at least one side to remove bleed from' }, { status: 400 })
    }

    // Create upload and output directories
    const uploadDir = join(process.cwd(), 'uploads')
    const outputDir = join(process.cwd(), 'outputs')
    
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true })

    // Save uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const inputPath = join(uploadDir, file.name)
    const outputPath = join(outputDir, `no_bleed_${file.name}`)
    
    await writeFile(inputPath, buffer)

    // Process the PDF to remove bleed
    const result = await removeBleedFromPDF(inputPath, outputPath, {
      removeTop,
      removeRight,
      removeBottom,
      removeLeft,
      bleedAmount
    })

    if (result.success) {
      // Read the processed PDF file
      const pdfBuffer = await readFile(outputPath)
      
      // Return the PDF file for download
      const response = new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="no_bleed_${file.name}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: result.error || 'Bleed removal failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in bleed removal:', error)
    return NextResponse.json(
      { error: `An error occurred during bleed removal: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

async function removeBleedFromPDF(
  inputPath: string, 
  outputPath: string, 
  config: BleedRemovalConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting bleed removal with config:', config)
    
    // Load the PDF
    const pdfBytes = await readFile(inputPath)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      return { success: false, error: 'PDF has no pages' }
    }

    // Convert bleed amount from mm to points (1 point = 0.3528 mm)
    const bleedPoints = config.bleedAmount / 0.3528

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      
      console.log(`Processing page ${i + 1}: ${width}x${height} points`)
      
      // Calculate new dimensions based on which sides to remove bleed from
      let newX = 0
      let newY = 0
      let newWidth = width
      let newHeight = height
      
      if (config.removeLeft) {
        newX += bleedPoints
        newWidth -= bleedPoints
      }
      
      if (config.removeRight) {
        newWidth -= bleedPoints
      }
      
      if (config.removeBottom) {
        newY += bleedPoints
        newHeight -= bleedPoints
      }
      
      if (config.removeTop) {
        newHeight -= bleedPoints
      }
      
      console.log(`New crop area: x=${newX}, y=${newY}, width=${newWidth}, height=${newHeight}`)
      
      // Set the new crop box (this effectively removes the bleed)
      page.setCropBox(newX, newY, newWidth, newHeight)
      
      // Also set the media box to match the crop box for consistency
      page.setMediaBox(newX, newY, newWidth, newHeight)
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    await writeFile(outputPath, modifiedPdfBytes)
    
    console.log('Bleed removal completed successfully')
    return { success: true }

  } catch (error) {
    console.error('Error removing bleed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

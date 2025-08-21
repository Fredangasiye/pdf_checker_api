// import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { PDFDocument, PDFPage, PDFImage, PDFFormXObject } from 'pdf-lib'

interface BleedAdditionConfig {
  addTop: boolean
  addRight: boolean
  addBottom: boolean
  addLeft: boolean
  bleedAmount: number // in mm
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const addTop = formData.get('addTop') === 'true'
    const addRight = formData.get('addRight') === 'true'
    const addBottom = formData.get('addBottom') === 'true'
    const addLeft = formData.get('addLeft') === 'true'
    const bleedAmount = parseFloat(formData.get('bleedAmount') as string || '3')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('🔍 DEBUG: Starting bleed addition with config:', { addTop, addRight, addBottom, addLeft, bleedAmount })
    console.log('🔍 DEBUG: Selected sides - Top:', addTop, 'Right:', addRight, 'Bottom:', addBottom, 'Left:', addLeft)
    console.log('🔍 DEBUG: Bleed amount:', bleedAmount, 'mm')

    // Validate that at least one side is selected for addition
    if (!addTop && !addRight && !addBottom && !addLeft) {
      return NextResponse.json({ error: 'Please select at least one side to add bleed to' }, { status: 400 })
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
    const outputPath = join(outputDir, `with_bleed_${file.name}`)
    
    await writeFile(inputPath, buffer)

    // Process the PDF to add bleed
    const result = await addBleedToPDF(inputPath, outputPath, {
      addTop,
      addRight,
      addBottom,
      addLeft,
      bleedAmount
    })

    if (result.success) {
      // Read the processed PDF file
      const pdfBuffer = await readFile(outputPath)
      
      // Return the PDF file for download
      const response = new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="with_bleed_${file.name}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: result.error || 'Bleed addition failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in bleed addition:', error)
    return NextResponse.json(
      { error: `An error occurred during bleed addition: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

async function addBleedToPDF(
  inputPath: string, 
  outputPath: string, 
  config: BleedAdditionConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting bleed addition with config:', config)
    
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
      
      // Calculate new dimensions based on which sides to add bleed to
      let newWidth = width
      let newHeight = height
      
      if (config.addLeft) newWidth += bleedPoints
      if (config.addRight) newWidth += bleedPoints
      if (config.addTop) newHeight += bleedPoints
      if (config.addBottom) newHeight += bleedPoints
      
      console.log(`New page size: ${newWidth}x${newHeight} points`)
      
      // Create a new page with the larger size
      const newPage = pdfDoc.addPage([newWidth, newHeight])
      
      // Calculate the offset to center the original content
      const offsetX = config.addLeft ? bleedPoints : 0
      const offsetY = config.addBottom ? bleedPoints : 0
      
      // Embed the original page and draw it on the new page
      const embeddedPage = await pdfDoc.embedPage(page)
      newPage.drawPage(embeddedPage, {
        x: offsetX,
        y: offsetY,
        width: width,
        height: height
      })
      
      // Add extended content for bleed areas (correct positioning)
      console.log('🔍 DEBUG: Adding bleed areas...')
      console.log('🔍 DEBUG: Original page size:', width, 'x', height, 'points')
      console.log('🔍 DEBUG: New page size:', newWidth, 'x', newHeight, 'points')
      console.log('🔍 DEBUG: Offset X:', offsetX, 'Y:', offsetY)
      console.log('🔍 DEBUG: Bleed points:', bleedPoints)
      
      if (config.addLeft) {
        console.log('🔍 DEBUG: Adding LEFT bleed at x=0, y=', offsetY, 'width=', bleedPoints, 'height=', height)
        // Extend left edge content by showing the right edge portion
        newPage.drawPage(embeddedPage, {
          x: 0,  // Start at left edge
          y: offsetY,
          width: bleedPoints,
          height: height,
          sourceX: width - bleedPoints,
          sourceY: 0,
          sourceWidth: bleedPoints,
          sourceHeight: height
        })
      }
      
      if (config.addRight) {
        console.log('🔍 DEBUG: Adding RIGHT bleed at x=', newWidth - bleedPoints, 'y=', offsetY, 'width=', bleedPoints, 'height=', height)
        // Extend right edge content by showing the left edge portion
        newPage.drawPage(embeddedPage, {
          x: newWidth - bleedPoints,  // Start at right edge
          y: offsetY,
          width: bleedPoints,
          height: height,
          sourceX: 0,
          sourceY: 0,
          sourceWidth: bleedPoints,
          sourceHeight: height
        })
      }
      
      if (config.addTop) {
        console.log('🔍 DEBUG: Adding TOP bleed at x=', offsetX, 'y=', newHeight - bleedPoints, 'width=', width, 'height=', bleedPoints)
        // Extend top edge content by showing the bottom edge portion
        newPage.drawPage(embeddedPage, {
          x: offsetX,
          y: newHeight - bleedPoints,  // Start at top edge
          width: width,
          height: bleedPoints,
          sourceX: 0,
          sourceY: 0,
          sourceWidth: width,
          sourceHeight: bleedPoints
        })
      }
      
      if (config.addBottom) {
        console.log('🔍 DEBUG: Adding BOTTOM bleed at x=', offsetX, 'y=0, width=', width, 'height=', bleedPoints)
        // Extend bottom edge content by showing the top edge portion
        newPage.drawPage(embeddedPage, {
          x: offsetX,
          y: 0,  // Start at bottom edge
          width: width,
          height: bleedPoints,
          sourceX: 0,
          sourceY: height - bleedPoints,
          sourceWidth: width,
          sourceHeight: bleedPoints
        })
      }
    }

    // Remove the original pages
    for (let i = pages.length - 1; i >= 0; i--) {
      pdfDoc.removePage(i)
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    await writeFile(outputPath, modifiedPdfBytes)
    
    console.log('Bleed addition completed successfully')
    return { success: true }

  } catch (error) {
    console.error('Error adding bleed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as any
    const file = formData.get('file')
    const isAnalyze = formData.get('analyze') === 'true'
    
    if (isAnalyze) {
      // Handle color analysis request
      if (!file) {
        return NextResponse.json({ error: 'No file provided for analysis' }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Create upload directory
      const uploadDir = join(process.cwd(), 'uploads')
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

      // Save uploaded file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const inputPath = join(uploadDir, file.name)
      await writeFile(inputPath, buffer)

      // Call Python script for color analysis
      const pythonScript = join(process.cwd(), 'scripts', 'pdf_color_changer.py')
      
      if (!existsSync(pythonScript)) {
        return NextResponse.json(
          { error: 'PDF color changer script not found' },
          { status: 500 }
        )
      }

      const config = {
        input_path: inputPath,
        analyze_only: true
      }

      return new Promise<Response>((resolve) => {
        const pythonProcess = spawn('python3', [pythonScript, JSON.stringify(config)])
        
        let stdout = ''
        let stderr = ''
        
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString()
        })
        
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString()
        })
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const cleanStdout = stdout.trim()
              const result = JSON.parse(cleanStdout)
              
              if (result.success && result.colors) {
                resolve(NextResponse.json({
                  success: true,
                  colors: result.colors
                }))
              } else {
                resolve(NextResponse.json(
                  { error: result.error || 'Color analysis failed' },
                  { status: 500 }
                ))
              }
            } catch (error) {
              resolve(NextResponse.json(
                { error: 'Failed to parse color analysis output' },
                { status: 500 }
              ))
            }
          } else {
            resolve(NextResponse.json(
              { error: `Color analysis failed: ${stderr}` },
              { status: 500 }
            ))
          }
        })
        
        pythonProcess.on('error', (error) => {
          resolve(NextResponse.json(
            { error: `Failed to execute color analysis: ${error.message}` },
            { status: 500 }
          ))
        })
      })
    }

    // Handle color change request (existing logic)
    const oldColors = formData.getAll('oldColor') as string[]
    const newColors = formData.getAll('newColor') as string[]
    const tolerance = parseFloat(formData.get('tolerance') as string || '30.0')

    if (!file || !oldColors.length || !newColors.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    const outputPath = join(outputDir, `replaced_${file.name}`)
    
    await writeFile(inputPath, buffer)

    // Call Python script for PDF color changing
    const pythonScript = join(process.cwd(), 'scripts', 'pdf_color_changer.py')
    
    if (!existsSync(pythonScript)) {
      console.error('Python script not found at:', pythonScript)
      return NextResponse.json(
        { error: 'PDF color changer script not found. Please ensure the script exists at scripts/pdf_color_changer.py' },
        { status: 500 }
      )
    }

    const config = {
      input_path: inputPath,
      output_path: outputPath,
      old_colors: oldColors,
      new_colors: newColors,
      tolerance: tolerance
    }

    console.log('Calling Python script with config:', config)

    return new Promise<Response>((resolve) => {
      const pythonProcess = spawn('python3', [pythonScript, JSON.stringify(config)])
      
      let stdout = ''
      let stderr = ''
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
        console.log('Python stdout:', data.toString())
      })
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
        console.log('Python stderr (debug info):', data.toString())
      })
      
      pythonProcess.on('close', async (code) => {
        console.log('Python process exited with code:', code)
        console.log('Python stdout (JSON response):', stdout)
        console.log('Python stderr (debug info):', stderr)
        
        if (code === 0) {
          try {
            // Clean up stdout - remove any extra whitespace or newlines
            const cleanStdout = stdout.trim()
            const result = JSON.parse(cleanStdout)
            
            if (result.success) {
              // Check if output file exists
              if (existsSync(outputPath)) {
                // Read the processed PDF file
                const pdfBuffer = await readFile(outputPath)
                
                // Return the PDF file for download
                const response = new Response(new Uint8Array(pdfBuffer), {
                  status: 200,
                  headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="replaced_${file.name}"`,
                    'Content-Length': pdfBuffer.length.toString()
                  }
                })
                
                resolve(response)
              } else {
                resolve(NextResponse.json(
                  { error: 'Processed PDF file not found' },
                  { status: 500 }
                ))
              }
            } else {
              resolve(NextResponse.json(
                { error: result.error || 'PDF processing failed' },
                { status: 500 }
              ))
            }
          } catch (error) {
            console.error('Failed to parse Python output:', error)
            console.error('Raw stdout:', stdout)
            console.error('Raw stderr:', stderr)
            resolve(NextResponse.json(
              { error: 'Failed to parse Python script output. Check server logs for details.' },
              { status: 500 }
            ))
          }
        } else {
          resolve(NextResponse.json(
            { error: `Python script failed with code ${code}: ${stderr}` },
            { status: 500 }
          ))
        }
      })
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to execute Python script:', error)
        resolve(NextResponse.json(
          { error: `Failed to execute Python script: ${error.message}` },
          { status: 500 }
        ))
      })
    })

  } catch (error) {
    console.error('Error in PDF color changer:', error)
    return NextResponse.json(
      { error: `An error occurred during PDF processing: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

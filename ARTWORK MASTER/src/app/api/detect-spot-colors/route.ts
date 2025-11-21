import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create temporary file path
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${file.name}`)
    
    try {
      // Write file to temp directory
      await writeFile(tempFilePath, buffer)

      // Run Python script to detect spot colors
      const pythonScript = path.join(process.cwd(), 'scripts', 'detect_spot_colors.py')
      const pythonPath = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3')
      
      // Check if Python script and virtual environment exist
      try {
        await import('fs').then(fs => fs.promises.access(pythonScript))
        await import('fs').then(fs => fs.promises.access(pythonPath))
        console.log('Python environment found:', { pythonScript, pythonPath })
      } catch (error) {
        console.warn('Python environment not available, falling back to basic detection')
        return NextResponse.json({
          success: false,
          error: 'Advanced spot color detection not available',
          fallback: true,
          message: 'Python environment not configured. Install dependencies with: ./scripts/install.sh'
        })
      }
      
      return new Promise<Response>((resolve, reject) => {
        console.log('Starting Python process with:', { pythonPath, pythonScript, tempFilePath })
        
        const pythonProcess = spawn(pythonPath, [pythonScript, tempFilePath])
        
        let output = ''
        let errorOutput = ''
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString()
          console.log('Python stdout:', data.toString())
        })
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
          console.log('Python stderr:', data.toString())
        })
        
        pythonProcess.on('close', async (code) => {
          console.log('Python process closed with code:', code)
          console.log('Python output:', output)
          console.log('Python error output:', errorOutput)
          
          try {
            // Clean up temp file
            await unlink(tempFilePath)
            
            if (code !== 0) {
              console.error('Python script error:', errorOutput)
              resolve(NextResponse.json({ 
                error: 'Spot color detection failed',
                details: errorOutput,
                code,
                output
              }, { status: 500 }))
              return
            }
            
            // Parse the output to extract spot color information
            const spotColors = parsePythonOutput(output)
            console.log('Parsed spot colors:', spotColors)
            
            resolve(NextResponse.json({
              success: true,
              spotColors,
              hasSpotColors: Object.keys(spotColors).length > 0,
              totalDetected: Object.keys(spotColors).length,
              rawOutput: output
            }))
            
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError)
            resolve(NextResponse.json({ 
              error: 'File cleanup failed',
              details: cleanupError 
            }, { status: 500 }))
          }
        })
        
        pythonProcess.on('error', async (error) => {
          console.error('Python process error:', error)
          try {
            await unlink(tempFilePath)
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError)
          }
          
          resolve(NextResponse.json({ 
            error: 'Failed to run spot color detection',
            details: error.message 
          }, { status: 500 }))
        })
      })
      
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('Spot color detection error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function parsePythonOutput(output: string): Record<string, number[]> {
  const spotColors: Record<string, number[]> = {}
  
  // Look for spot color detection patterns in the output
  const lines = output.split('\n')
  let inSpotColorsSection = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if we're entering the spot colors section
    if (trimmedLine.includes('🎨 Spot Colors Detected:') || 
        trimmedLine.includes('Spot Colors Detected:')) {
      inSpotColorsSection = true
      continue
    }
    
    // Check if we're leaving the spot colors section
    if (trimmedLine.includes('Analysis complete!') || 
        trimmedLine.includes('✅ No spot colors detected')) {
      inSpotColorsSection = false
      continue
    }
    
    // Parse spot color lines (format: "• Pantone 186 C (Pages: 1, 3)")
    if (inSpotColorsSection && trimmedLine.startsWith('•')) {
      const match = trimmedLine.match(/• (.+?) \(Pages: (.+)\)/)
      if (match) {
        const colorName = match[1].trim()
        const pagesStr = match[2].trim()
        const pages = pagesStr.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
        
        if (colorName && pages.length > 0) {
          spotColors[colorName] = pages
        }
      }
    }
  }
  
  return spotColors
} 
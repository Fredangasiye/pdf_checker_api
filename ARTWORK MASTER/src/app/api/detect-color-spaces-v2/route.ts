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

      // Run Python script to detect color spaces
      const pythonScript = path.join(process.cwd(), 'scripts', 'detect_color_spaces_v2.py')
      const pythonPath = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3')
      
      // Check if Python script and virtual environment exist
      try {
        await import('fs').then(fs => fs.promises.access(pythonScript))
        await import('fs').then(fs => fs.promises.access(pythonPath))
        console.log('Python environment found for enhanced color space detection:', { pythonScript, pythonPath })
      } catch (error) {
        console.warn('Python environment not available for enhanced color space detection, falling back to basic detection')
        return NextResponse.json({
          success: false,
          error: 'Enhanced color space detection not available',
          fallback: true,
          message: 'Python environment not configured. Install dependencies with: ./scripts/install.sh'
        })
      }
      
      return new Promise((resolve, reject) => {
        console.log('Starting enhanced Python color space detection process with:', { pythonPath, pythonScript, tempFilePath })
        
        const pythonProcess = spawn(pythonPath, [pythonScript, tempFilePath])
        
        let output = ''
        let errorOutput = ''
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString()
          console.log('Python stdout (enhanced color spaces):', data.toString())
        })
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
          console.log('Python stderr (enhanced color spaces):', data.toString())
        })
        
        pythonProcess.on('close', async (code) => {
          console.log('Enhanced Python color space detection process closed with code:', code)
          console.log('Python output (enhanced color spaces):', output)
          console.log('Python error output (enhanced color spaces):', errorOutput)
          
          try {
            // Clean up temp file
            await unlink(tempFilePath)
            
            if (code !== 0) {
              console.error('Enhanced Python color space detection script error:', errorOutput)
              resolve(NextResponse.json({ 
                error: 'Enhanced color space detection failed',
                details: errorOutput,
                code,
                output
              }, { status: 500 }))
              return
            }
            
            // Parse the output to extract color space information
            const colorSpaceInfo = parseEnhancedColorSpaceOutput(output)
            console.log('Parsed enhanced color space info:', colorSpaceInfo)
            
            resolve(NextResponse.json({
              success: true,
              ...colorSpaceInfo,
              rawOutput: output
            }))
            
          } catch (cleanupError) {
            console.error('Cleanup error in enhanced color space detection:', cleanupError)
            resolve(NextResponse.json({ 
              error: 'File cleanup failed',
              details: cleanupError 
            }, { status: 500 }))
          }
        })
        
        pythonProcess.on('error', async (error) => {
          console.error('Enhanced Python color space detection process error:', error)
          try {
            await unlink(tempFilePath)
          } catch (cleanupError) {
            console.error('Cleanup error in enhanced color space detection:', cleanupError)
          }
          
          resolve(NextResponse.json({ 
            error: 'Failed to run enhanced color space detection',
            details: error.message 
          }, { status: 500 }))
        })
      })
      
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Cleanup error in enhanced color space detection:', cleanupError)
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('Enhanced color space detection error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function parseEnhancedColorSpaceOutput(output: string): any {
  const lines = output.split('\n')
  const results: any = {}
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('📁 File:')) {
      results.fileName = trimmedLine.replace('📁 File:', '').trim()
    } else if (trimmedLine.startsWith('🎨 Color Mode:')) {
      results.colorMode = trimmedLine.replace('🎨 Color Mode:', '').trim()
    } else if (trimmedLine.startsWith('📋 Details:')) {
      const details = trimmedLine.replace('📋 Details:', '').trim()
      results.details = details
      
      // Extract detected color spaces from details
      if (details.startsWith('Detected:')) {
        const detected = details.replace('Detected:', '').trim()
        results.detectedColorSpaces = detected.split(', ').map(s => s.trim())
      } else if (details.startsWith('PIL mode:')) {
        const mode = details.replace('PIL mode:', '').trim()
        results.pilMode = mode
      } else if (details.startsWith('EPS operators:')) {
        const operators = details.replace('EPS operators:', '').trim()
        results.epsOperators = operators.split(', ').map(s => s.trim())
      }
    } else if (trimmedLine.startsWith('🔒 ICC Profile:')) {
      const profile = trimmedLine.replace('🔒 ICC Profile:', '').trim()
      results.iccProfile = profile === 'None' ? null : profile
    }
  }
  
  // Determine if mixed spaces
  if (results.colorMode && results.colorMode.includes('Mixed')) {
    results.mixedSpaces = true
  }
  
  // Determine if spot colors
  if (results.colorMode && results.colorMode.includes('Spot')) {
    results.hasSpotColors = true
  }
  
  return results
} 
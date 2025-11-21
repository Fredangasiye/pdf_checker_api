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
      const pythonScript = path.join(process.cwd(), 'scripts', 'detect_color_spaces.py')
      const pythonPath = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3')
      
      // Check if Python script and virtual environment exist
      try {
        await import('fs').then(fs => fs.promises.access(pythonScript))
        await import('fs').then(fs => fs.promises.access(pythonPath))
        console.log('Python environment found for color space detection:', { pythonScript, pythonPath })
      } catch (error) {
        console.warn('Python environment not available for color space detection, falling back to basic detection')
        return NextResponse.json({
          success: false,
          error: 'Advanced color space detection not available',
          fallback: true,
          message: 'Python environment not configured. Install dependencies with: ./scripts/install.sh'
        })
      }
      
      return new Promise<Response>((resolve, reject) => {
        console.log('Starting Python color space detection process with:', { pythonPath, pythonScript, tempFilePath })
        
        const pythonProcess = spawn(pythonPath, [pythonScript, tempFilePath])
        
        let output = ''
        let errorOutput = ''
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString()
          console.log('Python stdout (color spaces):', data.toString())
        })
        
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
          console.log('Python stderr (color spaces):', data.toString())
        })
        
        pythonProcess.on('close', async (code) => {
          console.log('Python color space detection process closed with code:', code)
          console.log('Python output (color spaces):', output)
          console.log('Python error output (color spaces):', errorOutput)
          
          try {
            // Clean up temp file
            await unlink(tempFilePath)
            
            if (code !== 0) {
              console.error('Python color space detection script error:', errorOutput)
              resolve(NextResponse.json({ 
                error: 'Color space detection failed',
                details: errorOutput,
                code,
                output
              }, { status: 500 }))
              return
            }
            
            // Parse the output to extract color space information
            const colorSpaceInfo = parseColorSpaceOutput(output)
            console.log('Parsed color space info:', colorSpaceInfo)
            
            resolve(NextResponse.json({
              success: true,
              ...colorSpaceInfo,
              rawOutput: output
            }))
            
          } catch (cleanupError) {
            console.error('Cleanup error in color space detection:', cleanupError)
            resolve(NextResponse.json({ 
              error: 'File cleanup failed',
              details: cleanupError 
            }, { status: 500 }))
          }
        })
        
        pythonProcess.on('error', async (error) => {
          console.error('Python color space detection process error:', error)
          try {
            await unlink(tempFilePath)
          } catch (cleanupError) {
            console.error('Cleanup error in color space detection:', cleanupError)
          }
          
          resolve(NextResponse.json({ 
            error: 'Failed to run color space detection',
            details: error.message 
          }, { status: 500 }))
        })
      })
      
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Cleanup error in color space detection:', cleanupError)
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('Color space detection error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function parseColorSpaceOutput(output: string): any {
  const lines = output.split('\n')
  const results: any = {}
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('📁 File Type:')) {
      results.fileType = trimmedLine.replace('📁 File Type:', '').trim()
    } else if (trimmedLine.startsWith('🎨 Color Mode:')) {
      results.colorMode = trimmedLine.replace('🎨 Color Mode:', '').trim()
    } else if (trimmedLine.startsWith('🔍 Color Spaces:')) {
      const spaces = trimmedLine.replace('🔍 Color Spaces:', '').trim()
      results.colorSpaces = spaces === 'None detected' ? [] : spaces.split(', ').map(s => s.trim())
    } else if (trimmedLine.startsWith('📋 ICC Profiles:')) {
      const profiles = trimmedLine.replace('📋 ICC Profiles:', '').trim()
      results.iccProfiles = profiles === 'None detected' ? [] : profiles.split(', ').map(s => s.trim())
    } else if (trimmedLine.startsWith('🎯 Spot Colors:')) {
      const colors = trimmedLine.replace('🎯 Spot Colors:', '').trim()
      results.spotColors = colors === 'None detected' ? [] : colors.split(', ').map(s => s.trim())
    } else if (trimmedLine.includes('Mixed color spaces detected')) {
      results.mixedSpaces = true
    } else if (trimmedLine.startsWith('📄 Page-by-page analysis:')) {
      results.pageAnalysis = {}
      // Parse page analysis data
      let inPageAnalysis = true
      let i = lines.indexOf(line) + 1
      while (i < lines.length && inPageAnalysis) {
        const pageLine = lines[i].trim()
        if (pageLine.startsWith('Page') && pageLine.includes(':')) {
          const [page, colors] = pageLine.split(':').map(s => s.trim())
          results.pageAnalysis[page] = colors === 'No colors detected' ? [] : colors.split(', ').map(s => s.trim())
        } else if (pageLine === '' || !pageLine.startsWith('  ')) {
          inPageAnalysis = false
        }
        i++
      }
    }
  }
  
  return results
} 
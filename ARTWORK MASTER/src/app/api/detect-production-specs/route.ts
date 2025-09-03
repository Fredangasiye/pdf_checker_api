import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${file.name}`)

    await writeFile(tempFilePath, buffer)

    const pythonScript = path.join(process.cwd(), 'scripts', 'detect_production_specs.py')
    const pythonPath = path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3')

    return await new Promise((resolve) => {
      const proc = spawn(pythonPath, [pythonScript, tempFilePath])
      let out = ''
      let err = ''
      proc.stdout.on('data', d => (out += d.toString()))
      proc.stderr.on('data', d => (err += d.toString()))
      proc.on('close', async (code) => {
        try { await unlink(tempFilePath) } catch {}
        if (code !== 0) {
          resolve(NextResponse.json({ error: 'spec detection failed', details: err, out }, { status: 500 }))
          return
        }
        try {
          const json = JSON.parse(out.trim())
          resolve(NextResponse.json({ success: true, ...json }))
        } catch (e) {
          resolve(NextResponse.json({ success: true, raw: out }))
        }
      })
    })
  } catch (e) {
    return NextResponse.json({ error: 'server error', details: String(e) }, { status: 500 })
  }
}
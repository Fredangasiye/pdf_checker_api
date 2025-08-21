import { spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SpotColorResult {
  status: 'success' | 'error';
  data: string[] | string;
}

export class GhostscriptDetector {
  private gsCommand: string;

  constructor(ghostscriptPath?: string) {
    this.gsCommand = this.findGhostscript(ghostscriptPath);
  }

  private findGhostscript(customPath?: string): string {
    if (customPath) {
      return customPath;
    }
    
    // Default to 'gs' for Unix-like systems (macOS, Linux)
    return 'gs';
  }

  async getSpotColors(filePath: string): Promise<SpotColorResult> {
    try {
      // Check if file exists
      await fs.access(filePath);
    } catch {
      return {
        status: 'error',
        data: `File not found at path: ${filePath}`
      };
    }

    try {
      // Ghostscript command to extract spot color information
      const command = [
        this.gsCommand,
        '-q',           // Quiet mode
        '-dNODISPLAY',  // Suppress normal output/display
        '-dPARANOIDSAFER', // Extra security precautions
        '-c',
        `(${path.basename(filePath)}) (r) file runpdfbegin pdfpagecount {pop} repeat quit`
      ];

      const workingDir = path.dirname(filePath) || '.';
      
      // Execute Ghostscript command
      const result = await this.executeGhostscript(command, workingDir);
      
      // Parse the output for spot colors
      const spotColors = this.parseSpotColors(result.stderr);
      
      return {
        status: 'success',
        data: spotColors
      };

    } catch (error: any) {
      // Even if the process fails, it might have output color names in stderr
      if (error.stderr) {
        const spotColors = this.parseSpotColors(error.stderr);
        if (spotColors.length > 0) {
          return {
            status: 'success',
            data: spotColors
          };
        }
      }
      
      return {
        status: 'error',
        data: `Ghostscript error: ${error.message || error.stderr || 'Unknown error'}`
      };
    }
  }

  private async executeGhostscript(command: string[], workingDir: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command[0], command.slice(1), {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Ghostscript exited with code ${code}. Stderr: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private parseSpotColors(output: string): string[] {
    // Regex pattern to find Separation color spaces
    // This looks for '/Separation' followed by the name of the color
    const spotColorPattern = /\/Separation\s+\/([\w\d\.\-\_]+)/g;
    
    const matches = output.match(spotColorPattern);
    if (!matches) {
      return [];
    }

    // Extract color names and remove duplicates
    const colorNames = matches.map(match => 
      match.replace('/Separation /', '').trim()
    );

    // Remove duplicates while preserving order
    return [...new Set(colorNames)];
  }

  // Test method to verify Ghostscript is working
  async testGhostscript(): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const execAsync = promisify(exec);
      
      await execAsync(`${this.gsCommand} --version`);
      return true;
    } catch {
      return false;
    }
  }
} 
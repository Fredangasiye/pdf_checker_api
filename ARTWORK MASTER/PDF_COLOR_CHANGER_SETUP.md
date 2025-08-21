# PDF Color Changer Integration Setup

## Overview
The PDF Color Changer functionality has been integrated into your BEITH AI artwork validation app. This feature allows users to intelligently find and replace colors in PDF files, with special handling for CMYK colors.

## Features
- **Intelligent Color Detection**: Automatically finds colors in PDFs using PyMuPDF's drawing analysis
- **CMYK Support**: Handles CMYK color matching with tolerance settings
- **Multiple Color Replacements**: Support for multiple color pair replacements in a single operation
- **Modern UI**: Integrated into the existing dark theme with tabbed interface

## Installation

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Verify PyMuPDF Installation
```bash
python3 -c "import fitz; print('PyMuPDF installed successfully')"
```

### 3. Make Python Script Executable
```bash
chmod +x scripts/pdf_color_changer.py
```

## Usage

### In the Application
1. **Navigate to PDF Color Changer Tab**: Click the "PDF Color Changer" tab in the main interface
2. **Upload PDF**: Select a PDF file to process
3. **Set Tolerance**: Adjust the CMYK matching tolerance (default: 30.0)
4. **Define Color Replacements**: 
   - Enter old colors in format: `100,0,0,0` (CMYK) or `255,0,0` (RGB)
   - Enter new colors in the same format
   - Add multiple color pairs as needed
5. **Process**: Click "Replace Colors & Download" to process the PDF

### Color Format Examples
- **CMYK**: `100,0,0,0` (Pure Cyan)
- **RGB**: `255,0,0` (Pure Red)
- **CMYK with values**: `50,25,0,10` (Mixed CMYK)
- **RGB with values**: `128,64,255` (Mixed RGB)

## Technical Details

### Architecture
- **Frontend**: React component with TypeScript
- **Backend**: Next.js API route
- **PDF Processing**: Python script using PyMuPDF
- **Communication**: Child process spawning between Node.js and Python

### File Structure
```
├── src/
│   ├── components/
│   │   └── PDFColorChanger.tsx    # React component
│   └── app/
│       └── api/
│           └── change-colors/
│               └── route.ts       # API endpoint
├── scripts/
│   └── pdf_color_changer.py       # Python processing script
├── uploads/                        # Temporary upload directory
├── outputs/                        # Processed PDF output directory
└── requirements.txt                # Python dependencies
```

### API Endpoint
- **URL**: `/api/change-colors`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `file`: PDF file
  - `oldColor[]`: Array of old colors
  - `newColor[]`: Array of new colors
  - `tolerance`: CMYK matching tolerance

## Troubleshooting

### Common Issues

1. **PyMuPDF Not Found**
   ```
   Error: PDF color changer script not found
   ```
   **Solution**: Install PyMuPDF using `pip install PyMuPDF`

2. **Python Script Permission Denied**
   ```
   Error: Failed to execute Python script
   ```
   **Solution**: Make script executable with `chmod +x scripts/pdf_color_changer.py`

3. **No Colors Found**
   ```
   INFO: No close match for CMYK (distance > tolerance)
   ```
   **Solution**: Increase tolerance value or check color format

### Debug Mode
To enable debug logging, check the browser console and server logs for detailed information about the color matching process.

## Performance Notes
- Large PDFs may take longer to process
- Color matching is performed on all pages
- Output files are optimized with garbage collection and compression

## Security Considerations
- Uploaded files are stored temporarily in the `uploads/` directory
- Processed files are stored in the `outputs/` directory
- Consider implementing file cleanup for production use
- Validate file types and sizes before processing 
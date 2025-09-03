# 🎨 Advanced PDF Spot Color Detection

This feature provides **professional-grade spot color detection** for PDF files, going far beyond basic detection to extract actual spot color names like "Pantone 186 C" or "RAL 2002".

## ✨ What It Does

- **🔍 Deep PDF Parsing**: Analyzes PDF resource dictionaries at the `/ColorSpace` level
- **📝 Real Color Names**: Extracts actual spot color names (not just "spot present")
- **📄 Page Mapping**: Shows which pages each spot color appears on
- **🎯 Multiple Spots**: Handles files with multiple spot colors (e.g., metallic + Pantone)
- **🔄 Fallback Support**: Falls back to basic detection if advanced analysis fails

## 🚀 Features

### **Advanced Detection**
- Parses `/Separation` color spaces (single spot colors)
- Parses `/DeviceN` color spaces (multi-channel spot colors)
- Decodes PDF string escapes (e.g., `#20` → space)
- Handles complex PDF structures

### **Real Results**
Instead of generic messages like "Spot colors may be present", you'll get:
```
🎨 Spot Colors Detected:
• Pantone 186 C (Pages: 1, 3)
• Pantone 300 U (Pages: 2)
• RAL 2002 (Pages: 1, 4)
```

### **Integration**
- **Automatic**: Works seamlessly with your existing preflight portal
- **API Endpoint**: `/api/detect-spot-colors` for programmatic access
- **Fallback**: Gracefully falls back to basic detection if needed

## 🛠 Technical Implementation

### **Core Technology**
- **Python Script**: `scripts/detect_spot_colors.py` - Deep PDF parsing
- **pikepdf**: PDF specification-compliant library for raw object access
- **API Route**: Next.js API endpoint for integration
- **Fallback**: pdf-lib for basic detection if Python fails

### **How It Works**
1. **PDF Upload**: File uploaded to preflight portal
2. **Python Analysis**: Python script parses PDF at resource dictionary level
3. **Spot Detection**: Identifies `/Separation` and `/DeviceN` color spaces
4. **Name Extraction**: Decodes actual color names from PDF objects
5. **Page Mapping**: Maps colors to specific pages
6. **Results**: Returns structured data with real color names

## 📦 Installation

### **Prerequisites**
- Python 3.8 or higher
- Node.js 18+ (for the web portal)

### **Quick Setup**
```bash
# Navigate to project directory
cd "BEITH AI/ARTWORK MASTER"

# Run installation script
./scripts/install.sh
```

### **Manual Setup**
```bash
# Create virtual environment
python3 -m venv scripts/venv

# Activate environment
source scripts/venv/bin/activate

# Install dependencies
pip install -r scripts/requirements.txt
```

## 🧪 Testing

### **Test the Python Script**
```bash
# Activate virtual environment
source scripts/venv/bin/activate

# Test with a PDF file
python3 scripts/detect_spot_colors.py path/to/your/file.pdf
```

### **Test the Web Portal**
1. Start the development server: `npm run dev`
2. Upload a PDF with spot colors
3. Check the "Spot Color Analysis" section
4. You should see actual color names instead of generic messages

## 🔧 Configuration

### **Environment Variables**
The system automatically detects Python and uses the virtual environment. No additional configuration needed.

### **Customization**
You can modify `scripts/detect_spot_colors.py` to:
- Add more color name patterns
- Customize output format
- Add additional PDF analysis features

## 📊 Example Output

### **Before (Basic Detection)**
```
Spot colors may be present (requires advanced color analysis)
```

### **After (Advanced Detection)**
```
🎨 Spot Colors Detected:
• Pantone 186 C (Pages: 1, 3)
• Pantone 300 U (Pages: 2)
• RAL 2002 (Pages: 1, 4)
• Custom Brand Blue (Pages: 1, 2, 3)
```

## 🚨 Troubleshooting

### **Common Issues**

**Python not found**
```bash
# Install Python 3
brew install python3  # macOS
sudo apt install python3  # Ubuntu
```

**pikepdf installation fails**
```bash
# Try upgrading pip first
pip install --upgrade pip

# Install with specific version
pip install pikepdf==8.0.0
```

**Permission denied on scripts**
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### **Debug Mode**
Enable debug logging by checking the browser console and terminal output for detailed error messages.

## 🔮 Future Enhancements

- **Color Conversion**: Convert spot colors to CMYK/process
- **Visual Highlighting**: Show where spot colors appear on page previews
- **Color Library**: Database of common spot color definitions
- **Batch Processing**: Analyze multiple PDFs at once
- **Export Options**: Generate reports in various formats

## 📚 Technical Details

### **PDF Structure Analysis**
The script analyzes these PDF objects:
- `/Resources` → `/ColorSpace` → `/Separation` (single spot)
- `/Resources` → `/ColorSpace` → `/DeviceN` (multiple spots)
- String decoding for color names
- Page resource mapping

### **Performance**
- **Fast**: Processes most PDFs in under 1 second
- **Efficient**: Only parses necessary PDF objects
- **Scalable**: Handles large PDFs with many pages
- **Reliable**: Graceful fallback if advanced detection fails

## 🤝 Contributing

To improve the spot color detection:

1. **Enhance Python Script**: Add more color detection patterns
2. **Improve API**: Add more analysis options
3. **Better Fallbacks**: Enhance basic detection methods
4. **Testing**: Test with various PDF formats and structures

## 📄 License

This feature is part of the BEITH AI Preflight Portal project.

---

**🎯 Goal**: Provide professional-grade spot color detection that rivals commercial tools like PitStop Pro.

**💡 Tip**: For best results, test with PDFs that contain known spot colors (Pantone, RAL, custom brand colors). 
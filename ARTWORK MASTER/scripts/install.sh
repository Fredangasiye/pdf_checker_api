#!/bin/bash

echo "🔧 Installing Python dependencies for advanced PDF spot color detection..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $python_version detected"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing required packages..."
pip install -r requirements.txt

echo "✅ Installation complete!"
echo ""
echo "To use the spot color detection:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Test with: python3 detect_spot_colors.py your_file.pdf"
echo ""
echo "The preflight portal will automatically use this for advanced spot color detection." 
#!/usr/bin/env python3
"""
Advanced PDF Spot Color Detection
Detects actual spot color names (e.g., "Pantone 186 C") from PDF files
by parsing the PDF resource dictionary and color spaces.
"""

import pikepdf
import json
import sys
import os
from typing import Dict, List, Set, Tuple
from pathlib import Path

def decode_pdf_string(pdf_string: str) -> str:
    """Decode PDF string by replacing #20 with spaces and other common escapes."""
    if not pdf_string:
        return ""
    
    # Replace #20 with spaces (PDF escape for space)
    decoded = pdf_string.replace("#20", " ")
    
    # Remove PDF object notation if present
    if decoded.startswith("/"):
        decoded = decoded[1:]
    
    return decoded.strip()

def detect_spot_colors(pdf_path: str) -> Dict[str, List[int]]:
    """
    Detect spot colors in a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Dictionary mapping spot color names to list of page numbers where they appear
    """
    spot_colors = {}
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                try:
                    # Get page resources
                    resources = page.get("/Resources", {})
                    if not resources:
                        continue
                    
                    # Get color spaces
                    colorspaces = resources.get("/ColorSpace", {})
                    if not colorspaces:
                        continue
                    
                    # Process each color space
                    for name, cs in colorspaces.items():
                        try:
                            if not isinstance(cs, pikepdf.Array):
                                continue
                                
                            if len(cs) < 2:
                                continue
                            
                            cs_type = str(cs[0])
                            
                            if cs_type == "/Separation":
                                # Single spot color
                                if len(cs) >= 2:
                                    spot_name = decode_pdf_string(str(cs[1]))
                                    if spot_name:
                                        if spot_name not in spot_colors:
                                            spot_colors[spot_name] = []
                                        if page_num not in spot_colors[spot_name]:
                                            spot_colors[spot_name].append(page_num)
                                            
                            elif cs_type == "/DeviceN":
                                # Multiple spot colors
                                if len(cs) >= 2:
                                    color_names = cs[1]
                                    if isinstance(color_names, pikepdf.Array):
                                        for color_name in color_names:
                                            spot_name = decode_pdf_string(str(color_name))
                                            if spot_name:
                                                if spot_name not in spot_colors:
                                                    spot_colors[spot_name] = []
                                                if page_num not in spot_colors[spot_name]:
                                                    spot_colors[spot_name].append(page_num)
                                                    
                        except Exception as e:
                            print(f"Warning: Error processing color space on page {page_num}: {e}")
                            continue
                            
                except Exception as e:
                    print(f"Warning: Error processing page {page_num}: {e}")
                    continue
                    
    except Exception as e:
        print(f"Error opening PDF {pdf_path}: {e}")
        return {}
    
    return spot_colors

def analyze_pdf_colors(pdf_path: str) -> Dict:
    """
    Comprehensive PDF color analysis including spot colors and color spaces.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Dictionary with color analysis results
    """
    results = {
        "spot_colors": {},
        "color_spaces": set(),
        "total_pages": 0,
        "has_spot_colors": False,
        "analysis_success": False
    }
    
    try:
        with pikepdf.open(pdf_path) as pdf:
            results["total_pages"] = len(pdf.pages)
            
            # Detect spot colors
            spot_colors = detect_spot_colors(pdf_path)
            results["spot_colors"] = spot_colors
            results["has_spot_colors"] = len(spot_colors) > 0
            
            # Analyze color spaces
            for page in pdf.pages:
                try:
                    resources = page.get("/Resources", {})
                    if resources:
                        colorspaces = resources.get("/ColorSpace", {})
                        if colorspaces:
                            for name, cs in colorspaces.items():
                                if isinstance(cs, pikepdf.Array) and len(cs) > 0:
                                    cs_type = str(cs[0])
                                    results["color_spaces"].add(cs_type)
                except Exception:
                    continue
            
            results["color_spaces"] = list(results["color_spaces"])
            results["analysis_success"] = True
            
    except Exception as e:
        print(f"Error analyzing PDF {pdf_path}: {e}")
        results["error"] = str(e)
    
    return results

def main():
    """Main function for command line usage."""
    if len(sys.argv) != 2:
        print("Usage: python detect_spot_colors.py <pdf_file>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} not found")
        sys.exit(1)
    
    print(f"Analyzing PDF: {pdf_path}")
    print("-" * 50)
    
    # Analyze the PDF
    results = analyze_pdf_colors(pdf_path)
    
    if not results["analysis_success"]:
        print("Analysis failed!")
        sys.exit(1)
    
    print(f"Total pages: {results['total_pages']}")
    print(f"Color spaces detected: {', '.join(results['color_spaces'])}")
    print()
    
    if results["has_spot_colors"]:
        print("🎨 Spot Colors Detected:")
        print("-" * 30)
        for spot_name, pages in results["spot_colors"].items():
            pages_str = ", ".join(map(str, sorted(pages)))
            print(f"• {spot_name} (Pages: {pages_str})")
    else:
        print("✅ No spot colors detected")
        print("File uses process colors only")
    
    print()
    print("Analysis complete!")

if __name__ == "__main__":
    main() 
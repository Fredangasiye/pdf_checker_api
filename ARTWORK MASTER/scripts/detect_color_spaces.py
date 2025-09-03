#!/usr/bin/env python3
"""
Comprehensive Color Space Detection
Analyzes PDFs, TIFFs, JPEGs, and other files for actual color space usage.
"""

import pikepdf
import fitz  # PyMuPDF
from PIL import Image
import tifffile
import json
import sys
import os
from typing import Dict, List, Set, Any
from pathlib import Path

def detect_pdf_color_spaces(pdf_path: str) -> Dict[str, Any]:
    """
    Comprehensive PDF color space detection by parsing content streams and resources.
    """
    results = {
        "file_type": "PDF",
        "color_mode": "Unknown",
        "color_spaces": [],
        "icc_profiles": [],
        "mixed_spaces": False,
        "spot_colors": [],
        "content_analysis": {},
        "pages_analyzed": 0,
        "analysis_success": False
    }
    
    try:
        # Use pikepdf for deep PDF structure analysis
        with pikepdf.open(pdf_path) as pdf:
            results["pages_analyzed"] = len(pdf.pages)
            
            all_color_spaces = set()
            all_icc_profiles = set()
            all_spot_colors = set()
            page_color_usage = {}
            
            for page_num, page in enumerate(pdf.pages, start=1):
                page_colors = set()
                
                try:
                    # Get page resources
                    resources = page.get("/Resources", {})
                    if resources:
                        # Check for color spaces in resources
                        colorspaces = resources.get("/ColorSpace", {})
                        if colorspaces:
                            for name, cs in colorspaces.items():
                                try:
                                    if isinstance(cs, pikepdf.Array) and len(cs) > 0:
                                        cs_type = str(cs[0])
                                        
                                        if cs_type == "/DeviceRGB":
                                            page_colors.add("RGB")
                                            all_color_spaces.add("RGB")
                                        elif cs_type == "/DeviceCMYK":
                                            page_colors.add("CMYK")
                                            all_color_spaces.add("CMYK")
                                        elif cs_type == "/DeviceGray":
                                            page_colors.add("Grayscale")
                                            all_color_spaces.add("Grayscale")
                                        elif cs_type == "/Separation":
                                            page_colors.add("Spot")
                                            all_color_spaces.add("Spot")
                                            if len(cs) >= 2:
                                                spot_name = str(cs[1]).replace("#20", " ")
                                                all_spot_colors.add(spot_name)
                                        elif cs_type == "/DeviceN":
                                            page_colors.add("Spot")
                                            all_color_spaces.add("Spot")
                                            if len(cs) >= 2:
                                                for color_name in cs[1]:
                                                    spot_name = str(color_name).replace("#20", " ")
                                                    all_spot_colors.add(spot_name)
                                        elif cs_type == "/ICCBased":
                                            page_colors.add("ICC")
                                            all_color_spaces.add("ICC")
                                            if len(cs) >= 2:
                                                icc_info = str(cs[1])
                                                all_icc_profiles.add(icc_info)
                                        elif cs_type == "/Indexed":
                                            page_colors.add("Indexed")
                                            all_color_spaces.add("Indexed")
                                            # Check base color space
                                            if len(cs) >= 2:
                                                base_cs = str(cs[1])
                                                if "/DeviceRGB" in base_cs:
                                                    page_colors.add("RGB")
                                                    all_color_spaces.add("RGB")
                                                elif "/DeviceCMYK" in base_cs:
                                                    page_colors.add("CMYK")
                                                    all_color_spaces.add("CMYK")
                                                elif "/DeviceGray" in base_cs:
                                                    page_colors.add("Grayscale")
                                                    all_color_spaces.add("Grayscale")
                                except Exception as e:
                                    print(f"Warning: Error processing color space on page {page_num}: {e}")
                                    continue
                        
                        # Check for XObject resources (images)
                        xobjects = resources.get("/XObject", {})
                        if xobjects:
                            for name, xobject in xobjects.items():
                                try:
                                    if hasattr(xobject, 'get'):
                                        subtype = xobject.get("/Subtype", "")
                                        if str(subtype) == "/Image":
                                            # Check image color space
                                            img_colorspace = xobject.get("/ColorSpace", "")
                                            if img_colorspace:
                                                if "/DeviceRGB" in str(img_colorspace):
                                                    page_colors.add("RGB")
                                                    all_color_spaces.add("RGB")
                                                elif "/DeviceCMYK" in str(img_colorspace):
                                                    page_colors.add("CMYK")
                                                    all_color_spaces.add("CMYK")
                                                elif "/DeviceGray" in str(img_colorspace):
                                                    page_colors.add("Grayscale")
                                                    all_color_spaces.add("Grayscale")
                                                elif "/Indexed" in str(img_colorspace):
                                                    page_colors.add("Indexed")
                                                    all_color_spaces.add("Indexed")
                                except Exception as e:
                                    print(f"Warning: Error processing XObject on page {page_num}: {e}")
                                    continue
                
                except Exception as e:
                    print(f"Warning: Error processing page {page_num}: {e}")
                    continue
                
                # If no colors detected from resources, check content stream
                if not page_colors:
                    try:
                        # Use PyMuPDF to check content stream for color operators
                        pdf_doc = fitz.open(pdf_path)
                        page_obj = pdf_doc[page_num - 1]
                        
                        # Get page content as text to look for color operators
                        content = page_obj.get_text("dict")
                        
                        if "blocks" in content:
                            for block in content["blocks"]:
                                if "lines" in block:
                                    for line in block["lines"]:
                                        if "spans" in line:
                                            for span in line["spans"]:
                                                if "text" in span:
                                                    text = span["text"]
                                                    # Look for color operators
                                                    if any(op in text for op in ["rg", "g", "k", "scn", "sc"]):
                                                        if "rg" in text or "g" in text:
                                                            page_colors.add("RGB")
                                                            all_color_spaces.add("RGB")
                                                        if "k" in text:
                                                            page_colors.add("CMYK")
                                                            all_color_spaces.add("CMYK")
                                                        if "sc" in text or "scn" in text:
                                                            page_colors.add("Spot")
                                                            all_color_spaces.add("Spot")
                        
                        pdf_doc.close()
                        
                    except Exception as e:
                        print(f"Warning: Error analyzing content stream on page {page_num}: {e}")
                        continue
                
                page_color_usage[f"Page {page_num}"] = list(page_colors)
            
            # Determine overall color mode
            if len(all_color_spaces) > 1:
                # Multiple color spaces detected - determine primary color space
                results["mixed_spaces"] = True
                
                # Check for primary color space based on content analysis
                if "CMYK" in all_color_spaces or "Spot" in all_color_spaces:
                    # If CMYK or Spot colors are present, this is primarily a print file
                    if "RGB" in all_color_spaces:
                        results["color_mode"] = "CMYK + RGB (Mixed - Print with RGB elements)"
                    else:
                        results["color_mode"] = "CMYK (Print-ready)"
                elif "RGB" in all_color_spaces:
                    # If RGB is present without CMYK/Spot, this is primarily a web/display file
                    if "Indexed" in all_color_spaces:
                        results["color_mode"] = "RGB + Indexed (Mixed - Web with indexed elements)"
                    else:
                        results["color_mode"] = "RGB (Web/Display)"
                elif "Indexed" in all_color_spaces:
                    # Check what the indexed color space is based on
                    if any("RGB" in str(cs) for cs in all_color_spaces):
                        results["color_mode"] = "RGB (Indexed RGB)"
                    elif any("CMYK" in str(cs) for cs in all_color_spaces):
                        results["color_mode"] = "CMYK (Indexed CMYK)"
                    else:
                        results["color_mode"] = "Indexed (Mixed base colors)"
                else:
                    results["color_mode"] = "Mixed"
            elif "CMYK" in all_color_spaces:
                results["color_mode"] = "CMYK"
            elif "RGB" in all_color_spaces:
                results["color_mode"] = "RGB"
            elif "Grayscale" in all_color_spaces:
                results["color_mode"] = "Grayscale"
            elif "Spot" in all_color_spaces:
                results["color_mode"] = "Spot Colors"
            elif "ICC" in all_color_spaces:
                results["color_mode"] = "ICC Profile"
            elif "Indexed" in all_color_spaces:
                # For indexed colors, try to determine the base color space
                # This would require deeper analysis of the indexed color definitions
                results["color_mode"] = "Indexed (Base color space unknown)"
            else:
                # Default to RGB for web/display files, CMYK for print
                # Check file size and other indicators
                file_size = os.path.getsize(pdf_path)
                if file_size > 1024 * 1024:  # > 1MB, likely print file
                    results["color_mode"] = "CMYK (likely for print)"
                else:
                    results["color_mode"] = "RGB (likely for web)"
            
            results["color_spaces"] = list(all_color_spaces)
            results["icc_profiles"] = list(all_icc_profiles)
            results["spot_colors"] = list(all_spot_colors)
            results["content_analysis"] = page_color_usage
            results["analysis_success"] = True
        
    except Exception as e:
        results["error"] = str(e)
        results["analysis_success"] = False
    
    return results

def detect_image_color_spaces(image_path: str) -> Dict[str, Any]:
    """
    Detect color spaces in image files (TIFF, JPEG, PNG, etc.).
    """
    results = {
        "file_type": "Image",
        "color_mode": "Unknown",
        "color_spaces": [],
        "icc_profiles": [],
        "mixed_spaces": False,
        "analysis_success": False
    }
    
    try:
        # Get file extension
        ext = Path(image_path).suffix.lower()
        
        if ext in ['.tiff', '.tif']:
            # Use tifffile for detailed TIFF analysis
            with tifffile.TiffFile(image_path) as tiff:
                # Check photometric interpretation
                for page in tiff.pages:
                    tags = page.tags
                    
                    # PhotometricInterpretation tag
                    if 262 in tags:  # PhotometricInterpretation
                        photometric = tags[262].value
                        if photometric == 2:
                            results["color_mode"] = "RGB"
                            results["color_spaces"].append("RGB")
                        elif photometric == 5:
                            results["color_mode"] = "CMYK"
                            results["color_spaces"].append("CMYK")
                        elif photometric == 6:
                            results["color_mode"] = "YCbCr"
                            results["color_spaces"].append("YCbCr")
                        elif photometric == 1:
                            results["color_mode"] = "Grayscale"
                            results["color_spaces"].append("Grayscale")
                    
                    # Check for ICC profile
                    if 34675 in tags:  # ICC Profile
                        results["icc_profiles"].append("ICC Profile Present")
                        results["color_spaces"].append("ICC")
                    
                    # Check for color space tag
                    if 40961 in tags:  # ColorSpace
                        color_space = tags[40961].value
                        if color_space == 1:
                            results["color_spaces"].append("RGB")
                        elif color_space == 2:
                            results["color_spaces"].append("CMYK")
                        elif color_space == 3:
                            results["color_spaces"].append("YCbCr")
                        elif color_space == 4:
                            results["color_spaces"].append("Lab")
        
        # Use Pillow for additional analysis
        with Image.open(image_path) as img:
            # Get image mode
            mode = img.mode
            if mode == "RGB":
                results["color_spaces"].append("RGB")
                if results["color_mode"] == "Unknown":
                    results["color_mode"] = "RGB"
            elif mode == "CMYK":
                results["color_spaces"].append("CMYK")
                if results["color_mode"] == "Unknown":
                    results["color_mode"] = "CMYK"
            elif mode == "L":
                results["color_spaces"].append("Grayscale")
                if results["color_mode"] == "Unknown":
                    results["color_mode"] = "Grayscale"
            elif mode == "LAB":
                results["color_spaces"].append("Lab")
                if results["color_mode"] == "Unknown":
                    results["color_mode"] = "Lab"
            
            # Check for ICC profile
            if "icc_profile" in img.info:
                results["icc_profiles"].append("ICC Profile Present")
                results["color_spaces"].append("ICC")
            
            # Check for Adobe markers (JPEG)
            if ext in ['.jpg', '.jpeg'] and "adobe" in img.info:
                adobe_info = img.info["adobe"]
                if adobe_info.get("transform") == 2:  # YCCK
                    results["color_mode"] = "YCCK"
                    results["color_spaces"].append("YCCK")
        
        # Remove duplicates
        results["color_spaces"] = list(set(results["color_spaces"]))
        
        # Determine if mixed spaces
        if len(results["color_spaces"]) > 1:
            results["mixed_spaces"] = True
            if results["color_mode"] == "Unknown":
                results["color_mode"] = "Mixed"
        
        results["analysis_success"] = True
        
    except Exception as e:
        results["error"] = str(e)
        results["analysis_success"] = False
    
    return results

def detect_file_color_spaces(file_path: str) -> Dict[str, Any]:
    """
    Main function to detect color spaces in any supported file type.
    """
    if not os.path.exists(file_path):
        return {"error": "File not found", "analysis_success": False}
    
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == '.pdf':
        return detect_pdf_color_spaces(file_path)
    elif file_ext in ['.tiff', '.tif', '.jpg', '.jpeg', '.png', '.bmp']:
        return detect_image_color_spaces(file_path)
    else:
        return {
            "error": f"Unsupported file type: {file_ext}",
            "analysis_success": False
        }

def main():
    """Main function for command line usage."""
    if len(sys.argv) != 2:
        print("Usage: python detect_color_spaces.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    print(f"Analyzing color spaces in: {file_path}")
    print("-" * 60)
    
    # Analyze the file
    results = detect_file_color_spaces(file_path)
    
    if not results["analysis_success"]:
        print(f"❌ Analysis failed: {results.get('error', 'Unknown error')}")
        sys.exit(1)
    
    # Display results
    print(f"📁 File Type: {results['file_type']}")
    print(f"🎨 Color Mode: {results['color_mode']}")
    print(f"🔍 Color Spaces: {', '.join(results['color_spaces']) if results['color_spaces'] else 'None detected'}")
    
    if results['icc_profiles']:
        print(f"📋 ICC Profiles: {', '.join(results['icc_profiles'])}")
    
    if results['spot_colors']:
        print(f"🎯 Spot Colors: {', '.join(results['spot_colors'])}")
    
    if results['mixed_spaces']:
        print("⚠️  Mixed color spaces detected")
    
    if 'content_analysis' in results and results['content_analysis']:
        print("\n📄 Page-by-page analysis:")
        for page, colors in results['content_analysis'].items():
            print(f"  {page}: {', '.join(colors) if colors else 'No colors detected'}")
    
    print(f"\n✅ Analysis complete! Analyzed {results.get('pages_analyzed', 1)} page(s)")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Enhanced Color Space Detection v2
Clean, focused detection for PDF, TIFF, JPEG, EPS and other formats.
"""

import os
from PIL import Image
import fitz  # PyMuPDF (for PDFs)
import struct
import json
import sys
from typing import Dict, Any
import pikepdf  # add near top with other imports
import re  # add near imports

def detect_colorspace(file_path: str) -> Dict[str, Any]:
    """
    Main function to detect color space in any supported file type.
    """
    if not os.path.exists(file_path):
        return {
            "file": file_path, 
            "color_mode": "Error", 
            "details": "File not found",
            "success": False
        }
    
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".jpg", ".jpeg", ".tif", ".tiff", ".png", ".bmp"]:
        return detect_image_colorspace(file_path)
    elif ext == ".pdf":
        return detect_pdf_colorspace(file_path)
    elif ext in [".eps", ".ps"]:
        return detect_eps_colorspace(file_path)
    else:
        return {
            "file": file_path, 
            "color_mode": "Unknown", 
            "details": f"Unsupported format: {ext}",
            "success": False
        }

def detect_image_colorspace(file_path: str) -> Dict[str, Any]:
    """
    Detect color space in image files using Pillow.
    """
    try:
        with Image.open(file_path) as img:
            mode = img.mode
            icc = img.info.get("icc_profile", None)
            
            # Map PIL modes to color spaces
            if mode == "RGB":
                color_mode = "RGB"
            elif mode == "CMYK":
                color_mode = "CMYK"
            elif mode == "L":
                color_mode = "Grayscale"
            elif mode == "LAB":
                color_mode = "Lab"
            elif mode == "YCbCr":
                color_mode = "YCbCr"
            else:
                color_mode = mode

            return {
                "file": file_path,
                "color_mode": color_mode,
                "icc_profile": "Embedded ICC" if icc else None,
                "details": f"PIL mode: {mode}",
                "success": True
            }
    except Exception as e:
        return {
            "file": file_path, 
            "color_mode": "Error", 
            "details": f"Image processing error: {str(e)}",
            "success": False
        }

def detect_pdf_colorspace(file_path: str) -> Dict[str, Any]:
    """
    Detect color space in PDF files using pikepdf resource parsing (accurate),
    with PyMuPDF image inspection as a complement. No heuristic fallbacks.
    """
    try:
        all_color_spaces = set()
        spot_colors = set()
        icc_profiles = []

        # Pass 1: pikepdf - inspect resources, XObjects, and content operators
        with pikepdf.open(file_path) as pdf:
            for page in pdf.pages:
                try:
                    resources = page.get("/Resources", pikepdf.Dictionary())
                    # ColorSpace dictionary
                    cs_dict = resources.get("/ColorSpace", pikepdf.Dictionary())
                    if isinstance(cs_dict, pikepdf.Dictionary):
                        for _, cs in cs_dict.items():
                            try:
                                cs_resolved = cs
                                # Array-based color spaces
                                if isinstance(cs_resolved, pikepdf.Array) and len(cs_resolved) > 0:
                                    cs_type = str(cs_resolved[0])
                                    if cs_type == "/DeviceRGB":
                                        all_color_spaces.add("RGB")
                                    elif cs_type == "/DeviceCMYK":
                                        all_color_spaces.add("CMYK")
                                    elif cs_type == "/DeviceGray":
                                        all_color_spaces.add("Grayscale")
                                    elif cs_type == "/ICCBased":
                                        all_color_spaces.add("ICC")
                                        # Determine ICC components if possible
                                        if len(cs_resolved) >= 2:
                                            icc = cs_resolved[1]
                                            try:
                                                n = icc.get("/N") if hasattr(icc, 'get') else None
                                                if n == 3:
                                                    all_color_spaces.add("RGB")
                                                elif n == 4:
                                                    all_color_spaces.add("CMYK")
                                                icc_profiles.append("Embedded ICC")
                                            except Exception:
                                                pass
                                    elif cs_type == "/Indexed":
                                        all_color_spaces.add("Indexed")
                                        if len(cs_resolved) >= 2:
                                            base_cs = str(cs_resolved[1])
                                            if "/DeviceRGB" in base_cs:
                                                all_color_spaces.add("RGB")
                                            elif "/DeviceCMYK" in base_cs:
                                                all_color_spaces.add("CMYK")
                                            elif "/DeviceGray" in base_cs:
                                                all_color_spaces.add("Grayscale")
                                    elif cs_type == "/Separation":
                                        all_color_spaces.add("Spot")
                                        if len(cs_resolved) >= 2:
                                            spot_name = str(cs_resolved[1]).replace("#20", " ")
                                            spot_colors.add(spot_name)
                                    elif cs_type == "/DeviceN":
                                        all_color_spaces.add("Spot")
                                        if len(cs_resolved) >= 2:
                                            try:
                                                for color_name in cs_resolved[1]:
                                                    spot_colors.add(str(color_name).replace("#20", " "))
                                            except Exception:
                                                pass
                                # Name-based device color spaces
                                elif isinstance(cs_resolved, pikepdf.Name):
                                    name = str(cs_resolved)
                                    if name == "/DeviceRGB":
                                        all_color_spaces.add("RGB")
                                    elif name == "/DeviceCMYK":
                                        all_color_spaces.add("CMYK")
                                    elif name == "/DeviceGray":
                                        all_color_spaces.add("Grayscale")
                            except Exception:
                                continue

                    # XObjects (images)
                    xo = resources.get("/XObject", pikepdf.Dictionary())
                    if isinstance(xo, pikepdf.Dictionary):
                        for _, xobj in xo.items():
                            try:
                                if hasattr(xobj, 'get') and str(xobj.get("/Subtype", "")) == "/Image":
                                    img_cs = xobj.get("/ColorSpace", None)
                                    if img_cs is None:
                                        continue
                                    img_cs_str = str(img_cs)
                                    if "/DeviceRGB" in img_cs_str:
                                        all_color_spaces.add("RGB")
                                    elif "/DeviceCMYK" in img_cs_str:
                                        all_color_spaces.add("CMYK")
                                    elif "/DeviceGray" in img_cs_str:
                                        all_color_spaces.add("Grayscale")
                                    elif "/Indexed" in img_cs_str:
                                        all_color_spaces.add("Indexed")
                            except Exception:
                                continue

                    # Content streams: scan operators
                    contents = page.get("/Contents", None)
                    streams: list = []
                    if isinstance(contents, pikepdf.Stream):
                        streams = [contents]
                    elif isinstance(contents, pikepdf.Array):
                        streams = [c for c in contents if isinstance(c, pikepdf.Stream)]
                    for s in streams:
                        try:
                            data = s.read_bytes()
                            text = data.decode('latin-1', errors='ignore')
                            # Device operators
                            if re.search(r"(?<![A-Za-z])rg(?![A-Za-z])", text) or re.search(r"(?<![A-Za-z])RG(?![A-Za-z])", text):
                                all_color_spaces.add("RGB")
                            if re.search(r"(?<![A-Za-z])k(?![A-Za-z])", text) or re.search(r"(?<![A-Za-z])K(?![A-Za-z])", text):
                                all_color_spaces.add("CMYK")
                            if re.search(r"(?<![A-Za-z])g(?![A-Za-z])", text) or re.search(r"(?<![A-Za-z])G(?![A-Za-z])", text):
                                all_color_spaces.add("Grayscale")
                            # Generic operators with color spaces
                            if "/DeviceRGB cs" in text or "/DeviceRGB CS" in text:
                                all_color_spaces.add("RGB")
                            if "/DeviceCMYK cs" in text or "/DeviceCMYK CS" in text:
                                all_color_spaces.add("CMYK")
                            if "/DeviceGray cs" in text or "/DeviceGray CS" in text:
                                all_color_spaces.add("Grayscale")
                            if "/Separation" in text or "/DeviceN" in text or re.search(r"(?<![A-Za-z])SCN?(?![A-Za-z])", text):
                                all_color_spaces.add("Spot")
                        except Exception:
                            continue
                except Exception:
                    continue

        # Pass 2: PyMuPDF - inspect embedded image pixmaps (complementary)
        try:
            doc = fitz.open(file_path)
            for page in doc:
                # Embedded images
                for img in page.get_images(full=True):
                    xref = img[0]
                    try:
                        pix = fitz.Pixmap(doc, xref)
                        if pix.colorspace is not None:
                            csn = pix.colorspace.n
                            if csn == 3:
                                all_color_spaces.add("RGB")
                            elif csn == 4:
                                all_color_spaces.add("CMYK")
                            elif csn == 1:
                                all_color_spaces.add("Grayscale")
                        pix = None
                    except Exception:
                        continue
                # Vector drawings colors (fill/stroke component count)
                try:
                    drawings = page.get_drawings()
                    for d in drawings:
                        fill = d.get('fill')
                        stroke = d.get('color') or d.get('stroke')
                        for comp in (fill, stroke):
                            if isinstance(comp, (list, tuple)):
                                if len(comp) == 4:
                                    all_color_spaces.add("CMYK")
                                elif len(comp) == 3:
                                    all_color_spaces.add("RGB")
                                elif len(comp) == 1:
                                    all_color_spaces.add("Grayscale")
                except Exception:
                    pass
            doc.close()
        except Exception:
            pass

        # Decide color mode strictly from findings (no heuristics)
        color_mode: str
        non_icc_spaces = {s for s in all_color_spaces if s not in {"ICC", "Indexed"}}
        if "Spot" in all_color_spaces and len(non_icc_spaces - {"Spot"}) == 0:
            color_mode = "Spot Colors"
        elif len({s for s in non_icc_spaces if s != "Spot"}) > 1:
            color_mode = "Mixed"
        elif "CMYK" in non_icc_spaces:
            color_mode = "CMYK"
        elif "RGB" in non_icc_spaces:
            color_mode = "RGB"
        elif "Grayscale" in non_icc_spaces:
            color_mode = "Grayscale"
        elif "Indexed" in all_color_spaces:
            color_mode = "Indexed"
        else:
            color_mode = "Unknown"

        return {
            "file": file_path,
            "color_mode": color_mode,
            "icc_profile": ("Embedded ICC" if icc_profiles else None),
            "details": f"Detected: {', '.join(sorted(all_color_spaces.union(spot_colors)))}",
            "success": True
        }
    except Exception as e:
        return {
            "file": file_path,
            "color_mode": "Error",
            "details": f"PDF processing error: {str(e)}",
            "success": False
        }

def detect_eps_colorspace(file_path: str) -> Dict[str, Any]:
    """
    Detect color space in EPS/PS files by parsing operators.
    """
    try:
        color_modes = set()
        with open(file_path, "r", errors="ignore") as f:
            for line in f:
                if "setrgbcolor" in line:
                    color_modes.add("RGB")
                elif "setcmykcolor" in line:
                    color_modes.add("CMYK")
                elif "spotcolor" in line.lower():
                    color_modes.add("Spot")
                elif "setgray" in line:
                    color_modes.add("Grayscale")

        if not color_modes:
            return {
                "file": file_path, 
                "color_mode": "Unknown", 
                "details": "No colorspace operators found in EPS",
                "success": False
            }

        if len(color_modes) > 1:
            color_mode = "Mixed"
        else:
            color_mode = list(color_modes)[0]

        return {
            "file": file_path,
            "color_mode": color_mode,
            "icc_profile": None,
            "details": f"EPS operators: {', '.join(color_modes)}",
            "success": True
        }
    except Exception as e:
        return {
            "file": file_path, 
            "color_mode": "Error", 
            "details": f"EPS processing error: {str(e)}",
            "success": False
        }

def main():
    """Main function for command line usage."""
    if len(sys.argv) < 2:
        print("Usage: python detect_color_spaces_v2.py <file_path> [--json]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    json_output = len(sys.argv) > 2 and sys.argv[2] == '--json'
    
    if not os.path.exists(file_path):
        if json_output:
            print(json.dumps({"success": False, "error": f"File {file_path} not found"}))
        else:
            print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    if not json_output:
        print(f"Analyzing color space in: {file_path}")
        print("-" * 60)
    
    # Analyze the file
    result = detect_colorspace(file_path)
    
    if not result["success"]:
        if json_output:
            print(json.dumps({"success": False, "error": result.get('details', 'Unknown error')}))
        else:
            print(f"❌ Analysis failed: {result.get('details', 'Unknown error')}")
        sys.exit(1)
    
    if json_output:
        # Return JSON for API usage
        print(json.dumps(result))
    else:
        # Display results
        print(f"📁 File: {os.path.basename(result['file'])}")
        print(f"🎨 Color Mode: {result['color_mode']}")
        print(f"📋 Details: {result['details']}")
        
        if result['icc_profile']:
            print(f"🔒 ICC Profile: {result['icc_profile']}")
        
        print(f"\n✅ Analysis complete!")

if __name__ == "__main__":
    main() 
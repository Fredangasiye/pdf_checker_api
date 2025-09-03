#!/usr/bin/env python3
"""
Production Specs Detection
Reads finished size (trim), effective resolution, and bleed from artwork files.
Supports: PDF, TIFF, JPEG, PNG, EPS

Notes:
- PDF sizes are in points (pt). 1 inch = 72 pt. 1 inch = 25.4 mm.
- Effective PPI for PDF images computed from image pixel size and placed size on page.
"""
import os
import sys
import json
from typing import Any, Dict, List, Tuple

import fitz  # PyMuPDF
import pikepdf
from PIL import Image

PT_PER_INCH = 72.0
MM_PER_INCH = 25.4


def pt_to_mm(pt: float) -> float:
    return (pt / PT_PER_INCH) * MM_PER_INCH


def rect_to_mm(rect: List[float]) -> Tuple[float, float]:
    # rect = [llx, lly, urx, ury]
    width_pt = float(rect[2]) - float(rect[0])
    height_pt = float(rect[3]) - float(rect[1])
    return round(pt_to_mm(width_pt), 2), round(pt_to_mm(height_pt), 2)


def detect_pdf_specs(file_path: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "file_type": "PDF",
        "pages": 0,
        "finished_size_mm": None,
        "finished_size_points": None,
        "bleed_mm": None,
        "bleed_points": None,
        "image_effective_ppi": [],  # per-image effective PPI values
        "min_effective_ppi": None,
        "notes": [],
    }
    try:
        with pikepdf.open(file_path) as pdf:
            num_pages = len(pdf.pages)
            result["pages"] = num_pages
            finished_mm = None
            bleed_mm = None
            finished_points = None
            bleed_points = None

            for page_index, page in enumerate(pdf.pages, start=1):
                media = page.get("/MediaBox", None)
                trim = page.get("/TrimBox", None)
                crop = page.get("/CropBox", None)
                bleed = page.get("/BleedBox", None)

                # Determine finished from TrimBox else CropBox else MediaBox
                box = trim or crop or media
                if isinstance(box, pikepdf.Array) and len(box) == 4:
                    finished_points = [float(x) for x in box]
                    finished_mm = rect_to_mm(finished_points)
                # Bleed from BleedBox if present
                if isinstance(bleed, pikepdf.Array) and len(bleed) == 4 and isinstance(box, pikepdf.Array):
                    bleed_points = [float(x) for x in bleed]
                    # bleed per side (symmetric assumption)
                    bleed_left = float(bleed_points[0]) - float(box[0])
                    bleed_bottom = float(bleed_points[1]) - float(box[1])
                    bleed_right = float(box[2]) - float(bleed_points[2])
                    bleed_top = float(box[3]) - float(bleed_points[3])
                    bleed_mm = {
                        "left": round(pt_to_mm(abs(bleed_left)), 2),
                        "right": round(pt_to_mm(abs(bleed_right)), 2),
                        "top": round(pt_to_mm(abs(bleed_top)), 2),
                        "bottom": round(pt_to_mm(abs(bleed_bottom)), 2),
                    }
                # Only read first page for page-level sizes
                break

        # Effective PPI per image using PyMuPDF
        try:
            doc = fitz.open(file_path)
            if doc.page_count > 0:
                page = doc[0]
                images = page.get_images(full=True)
                ppi_values: List[float] = []
                for img in images:
                    xref = img[0]
                    width_px = img[2]
                    height_px = img[3]
                    try:
                        rects = page.get_image_rects(xref)
                    except Exception:
                        rects = []
                    if not rects:
                        # Fallback: whole page placement (rare)
                        placed_w_in = page.rect.width / PT_PER_INCH
                        placed_h_in = page.rect.height / PT_PER_INCH
                        if placed_w_in > 0 and placed_h_in > 0:
                            ppi_x = width_px / placed_w_in
                            ppi_y = height_px / placed_h_in
                            ppi_values.append(round(min(ppi_x, ppi_y), 1))
                        continue
                    for r in rects:
                        placed_w_in = r.width / PT_PER_INCH
                        placed_h_in = r.height / PT_PER_INCH
                        if placed_w_in > 0 and placed_h_in > 0:
                            ppi_x = width_px / placed_w_in
                            ppi_y = height_px / placed_h_in
                            ppi_values.append(round(min(ppi_x, ppi_y), 1))
                result["image_effective_ppi"] = ppi_values
                if ppi_values:
                    result["min_effective_ppi"] = min(ppi_values)
            doc.close()
        except Exception as e:
            result["notes"].append(f"Image PPI analysis skipped: {e}")

        result["finished_size_mm"] = finished_mm
        result["finished_size_points"] = finished_points
        result["bleed_mm"] = bleed_mm
        result["bleed_points"] = bleed_points
        return result
    except Exception as e:
        return {"error": str(e), "success": False}


def detect_image_specs(file_path: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "file_type": "Image",
        "pixel_size": None,
        "dpi": None,
        "finished_size_mm": None,
        "notes": [],
    }
    try:
        with Image.open(file_path) as im:
            width_px, height_px = im.size
            dpi = None
            if "dpi" in im.info and isinstance(im.info["dpi"], tuple):
                dpi = im.info["dpi"][0] or im.info["dpi"][1]
            elif "jfif_density" in im.info and im.info.get("jfif_unit", 0) == 1:
                # JFIF density is in DPI if unit==1
                dpi = im.info["jfif_density"][0]
            result["pixel_size"] = {"width_px": width_px, "height_px": height_px}
            result["dpi"] = dpi
            if dpi and dpi > 0:
                width_in = width_px / dpi
                height_in = height_px / dpi
                result["finished_size_mm"] = {
                    "width": round(width_in * MM_PER_INCH, 2),
                    "height": round(height_in * MM_PER_INCH, 2),
                }
            return result
    except Exception as e:
        return {"error": str(e), "success": False}


def detect_eps_specs(file_path: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "file_type": "EPS",
        "finished_size_mm": None,
        "notes": [],
    }
    try:
        # Look for BoundingBox comment
        with open(file_path, "r", errors="ignore") as f:
            for line in f:
                if line.startswith("%%BoundingBox:"):
                    parts = line.strip().split()
                    if len(parts) == 5:
                        llx, lly, urx, ury = map(float, parts[1:])
                        width_mm = round(pt_to_mm(urx - llx), 2)
                        height_mm = round(pt_to_mm(ury - lly), 2)
                        result["finished_size_mm"] = (width_mm, height_mm)
                        break
        return result
    except Exception as e:
        return {"error": str(e), "success": False}


def detect_specs(file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        return {"error": "File not found", "success": False}
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return detect_pdf_specs(file_path)
    if ext in [".tif", ".tiff", ".jpg", ".jpeg", ".png"]:
        return detect_image_specs(file_path)
    if ext in [".eps"]:
        return detect_eps_specs(file_path)
    return {"error": f"Unsupported: {ext}", "success": False}


def main():
    if len(sys.argv) != 2:
        print("Usage: python detect_production_specs.py <file_path>")
        sys.exit(1)
    path = sys.argv[1]
    res = detect_specs(path)
    print(json.dumps(res))

if __name__ == "__main__":
    main()
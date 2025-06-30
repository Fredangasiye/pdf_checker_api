from flask import Flask, request, jsonify
import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import re

app = Flask(__name__)

MATERIAL_KEYWORDS = [
    "CORRUGATED", "MESH COATED", "PVC BLACK WHITE MATTE", "MAGNETIC PRINT", "CORREX",
    "TEAR RESISTANT SATIN", "VINYL POLYMERIC", "FABRIC FRONTLIT", "VINYL WHITE GLOSS",
    "VINYL ONE WAY VISION", "FOAM PVC", "ACRYLIC XT CLEAR", "VINYL CAST", "WALLPAPER",
    "STYRENE", "FABRIWALL", "FABRIC BACKLIT", "FILM BACKLIT", "HI Q", "CHROMADECK",
    "VINYL FROSTED", "WOOD (MDF)", "PE BLACK WHITE", "PP SILICONE WINDOW FILM",
    "VINYL EASYDOT", "TRANSFER PAPER", "APET CLEAR", "VINYL WALL OUTDOOR", "KRAFTBOARD",
    "BIE-VINYL", "MAGNETIC FERRIS PAPER", "VINYL- WINDOW- FLUX", "HI-Q Titan Gloss",
    "PVC BACKLIT", "MESH COATED (Large perforation)", "WALLPAPER- FINE SAND TEXTURED",
    "B-SILKYSMOOTH WALLCOVERING", "B-WALLCOVERING-CANVAS PREMIUM", "WALLPAPER- (B TEX)",
    "VINYL POLYMERIC B/ O WHITE GLOSS", "FABRIC WHITE BLACK", "FABRIC BACKLIT (LED)",
    "FABRIC TEXTILE BACKLIT (LED)", "TEAR RESISTANT SATIN PREMIUM", "MAGNETIC PRINT 0.6MM"
]

def extract_text_from_pdf(file_stream):
    with pdfplumber.open(file_stream) as pdf:
        text = "\n".join([p.extract_text() or "" for p in pdf.pages])
    return text

def extract_text_with_ocr(file_stream):
    full_text = ""
    with fitz.open(stream=file_stream.read(), filetype="pdf") as pdf:
        for page in pdf:
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            full_text += pytesseract.image_to_string(img) + "\n"
    return full_text

def normalize_size(size_mm, scale_percent):
    return (size_mm[0] * scale_percent / 100, size_mm[1] * scale_percent / 100)

def fuzzy_match_material(text):
    text_lower = text.lower()
    for material in MATERIAL_KEYWORDS:
        if all(kw.lower() in text_lower for kw in material.split()[:2]):
            return material
    return None

def parse_pdf_details(text):
    clean_text = "\n".join(line for line in text.splitlines() if not re.match(r"(PDF Version|ICC Profile|Sizes|Overprints|Transparancies)", line, re.IGNORECASE))
    size_match = re.search(r"Finished Size:\s*(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)mm", clean_text)
    bleed_match = re.search(r"Bleed\s*\(\+(\d+(\.\d+)?)\):\s*(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)mm", clean_text)
    scale_match = re.search(r"(\d+(\.\d+)?)%", clean_text)
    material_match = fuzzy_match_material(clean_text)
    colourspace_match = re.search(r"Colourspace\s*:\s*(\w+)", clean_text, re.IGNORECASE)

    details = {
        "width": float(size_match.group(1)) if size_match else None,
        "height": float(size_match.group(2)) if size_match else None,
        "bleed": float(bleed_match.group(1)) if bleed_match else None,
        "scale": float(scale_match.group(1)) if scale_match else 100,
        "material": material_match or "Not found",
        "colourspace": colourspace_match.group(1).upper() if colourspace_match else "Not found"
    }
    return details

@app.route('/check', methods=['POST'])
def check_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    uploaded_file = request.files['file']
    filename = uploaded_file.filename

    try:
        text_content = extract_text_from_pdf(uploaded_file)
        if not text_content.strip():
            uploaded_file.seek(0)
            text_content = extract_text_with_ocr(uploaded_file)

        details = parse_pdf_details(text_content)
        normalized_size = normalize_size((details['width'], details['height']), details['scale']) if details['width'] and details['height'] else (None, None)

        response = {
            "filename": filename,
            "size_mm": normalized_size,
            "bleed_mm": details['bleed'],
            "material": details['material'],
            "colourspace": details['colourspace'],
            "scale_percent": details['scale']
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)

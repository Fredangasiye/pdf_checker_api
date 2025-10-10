#!/usr/bin/env python3
"""
Font Detection Script
Detects fonts used in PDF files using PyMuPDF
"""
import sys
import json
import fitz  # PyMuPDF

def clean_font_name(font_name):
    """Clean font names by removing common prefixes and suffixes"""
    if not font_name:
        return ''
    
    import re
    
    # Remove common PDF font prefixes and suffixes
    cleaned = font_name
    # Remove encoding prefixes like Arial-BoldItalic
    cleaned = re.sub(r'^[A-Z]+[+-]', '', cleaned)
    # Remove common weight/style suffixes
    cleaned = re.sub(r'-(Bold|Italic|Regular|Light|Medium|Heavy|Black|Thin|UltraLight|SemiBold|ExtraBold|Condensed|Extended|Narrow|Wide)$', '', cleaned, flags=re.IGNORECASE)
    # Remove abbreviated suffixes
    cleaned = re.sub(r'-(B|I|R|L|M|H|Bl|T|UL|SB|EB|C|E|N|W)$', '', cleaned, flags=re.IGNORECASE)
    # Remove encoding prefixes like ArialMT
    cleaned = re.sub(r'^[A-Z][A-Z0-9]+-', '', cleaned)
    # Remove common suffixes
    cleaned = cleaned.replace('MT', '').replace('PS', '').replace('Std', '').replace('Pro', '').replace('WGL', '').replace('ANSI', '')
    cleaned = cleaned.replace('Symbol', '').replace('ZapfDingbats', '')
    cleaned = cleaned.strip()
    
    # If the cleaned name is too short or empty, return the original
    if len(cleaned) < 2:
        return font_name
    
    return cleaned

def detect_pdf_fonts(file_path):
    """Detect fonts in a PDF file"""
    try:
        doc = fitz.open(file_path)
        fonts = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get font information from the page
            font_list = page.get_fonts()
            
            for font_info in font_list:
                if len(font_info) >= 4:
                    font_name = font_info[4]  # Font name is typically at index 4
                    if font_name:
                        cleaned_name = clean_font_name(font_name)
                        if cleaned_name and cleaned_name not in fonts:
                            fonts.append(cleaned_name)
            
            # Also try to get fonts from text blocks
            try:
                text_dict = page.get_text("dict")
                for block in text_dict.get("blocks", []):
                    if "lines" in block:
                        for line in block["lines"]:
                            for span in line["spans"]:
                                font_name = span.get("font", "")
                                if font_name:
                                    cleaned_name = clean_font_name(font_name)
                                    if cleaned_name and cleaned_name not in fonts:
                                        fonts.append(cleaned_name)
            except:
                pass  # If text extraction fails, continue with font list method
        
        doc.close()
        
        return {
            "success": True,
            "fonts": fonts,
            "font_count": len(fonts)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fonts": [],
            "font_count": 0
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python detect_fonts.py <pdf_file_path>"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = detect_pdf_fonts(file_path)
    print(json.dumps(result))
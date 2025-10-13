#!/usr/bin/env python3
"""
Comprehensive PDF Font Detection Script
Detects actual font names, embedded fonts, subsets, and provides detailed metadata
"""

import sys
import json
import io
import re
import fitz  # PyMuPDF
from fontTools.ttLib import TTFont
from fontTools.cffLib import CFFFontSet

# Regex for subset font names (e.g., ABCDEF+MinionPro-Regular)
SUBSET_RE = re.compile(r"^[A-Z]{6}\+")
KNOWN_TT_MIMES = {"/FontFile2", "/FontFile"}   # TTF/Type1
KNOWN_OT_CFF = {"/FontFile3"}                  # OTF(CFF) / Type1C

def strip_subset(name: str) -> str:
    """Remove subset prefix from font names"""
    return SUBSET_RE.sub("", name or "")

def read_ttf_names(buf: bytes):
    """Extract font names from TTF/OTF embedded fonts"""
    names = {}
    try:
        bio = io.BytesIO(buf)
        tt = TTFont(bio, lazy=True, fontNumber=0)
        def get_name(nid):
            val = tt["name"].getDebugName(nid)
            return val or ""
        names["postscript_name"] = get_name(6)
        names["full_name"] = get_name(4)
        names["family"] = get_name(1)
        names["subfamily"] = get_name(2)
        return names
    except Exception:
        return None

def read_cff_names(buf: bytes):
    """Extract font names from CFF/Type1C embedded fonts"""
    try:
        bio = io.BytesIO(buf)
        cff = CFFFontSet(bio)
        if not cff or not cff.fontNames:
            return None
        top = cff[cff.fontNames[0]].rawDict
        return {
            "postscript_name": top.get("FullName", "") or top.get("FontName", ""),
            "full_name": top.get("FullName", ""),
            "family": top.get("FamilyName", ""),
            "subfamily": ""
        }
    except Exception:
        return None

def extract_embedded_font(doc, xref):
    """Extract raw font file bytes from PDF"""
    try:
        return doc.xref_stream(xref)
    except Exception:
        return None

def get_fontfile_xref(font_dict):
    """Find font file xref in font descriptor"""
    for key in ("/FontFile2", "/FontFile3", "/FontFile"):
        if key in font_dict:
            return font_dict.get(key)
    return None

def resolve_font_names_from_descriptor(doc, font_desc):
    """Resolve font names from font descriptor, including embedded fonts"""
    result = {
        "postscript_name": strip_subset(font_desc.get("/FontName", "")),
        "full_name": "",
        "family": "",
        "subfamily": "",
        "embedded": False,
        "subset": False,
    }
    base_ps = result["postscript_name"]
    result["subset"] = bool(SUBSET_RE.match(font_desc.get("/FontName", "")))

    xref = get_fontfile_xref(font_desc)
    if xref:
        raw = extract_embedded_font(doc, xref)
        if raw:
            result["embedded"] = True
            # Try TTF/OTF first, then CFF
            meta = read_ttf_names(raw) or read_cff_names(raw)
            if meta:
                # Prefer embedded names over BaseFont guess
                for k, v in meta.items():
                    if v:
                        result[k] = v
    return result

def detect_pdf_fonts_comprehensive(file_path):
    """Comprehensive font detection with embedded font extraction"""
    try:
        doc = fitz.open(file_path)
        fonts = {}  # key: font object id → info
        pages_using = {}  # ps_name → set of page numbers

        for pno in range(doc.page_count):
            page = doc.load_page(pno)
            
            # Get font usage from text spans
            raw = page.get_text("rawdict")
            if raw:
                blocks = raw.get("blocks", [])
                for b in blocks:
                    for l in b.get("lines", []):
                        for s in l.get("spans", []):
                            ps_name = strip_subset(s.get("font", ""))
                            if ps_name:
                                pages_using.setdefault(ps_name, set()).add(pno + 1)

            # Get font resources and descriptors
            xref_fonts = page.get_fonts(full=True)
            for xf in xref_fonts:
                xref, ext, name, enc, cid, subset = xf[:6]
                fd_xref = xf[-1] if xf[-1] else None

                name_ps = strip_subset(name)
                info = {
                    "postscript_name": name_ps,
                    "full_name": "",
                    "family": "",
                    "subfamily": "",
                    "embedded": False,
                    "subset": bool(subset),
                    "cid_keyed": bool(cid),
                    "encoding": enc or "",
                    "font_xref": xref,
                    "descriptor_xref": fd_xref,
                }

                # Try to resolve via descriptor
                if fd_xref:
                    try:
                        fdesc = doc.xref_object(fd_xref, compressed=True)
                        fd = {}
                        for k in ("/FontName", "/FontFile", "/FontFile2", "/FontFile3"):
                            m = re.search(rf"{k}\s+(\d+)\s+0\s+R", fdesc)
                            if m:
                                fd[k] = int(m.group(1))
                        mname = re.search(r"/FontName\s*/([^\s/]+)", fdesc)
                        if mname:
                            fd["/FontName"] = mname.group(1)
                        
                        # Resolve names from descriptor
                        resolved = resolve_font_names_from_descriptor(doc, fd)
                        for k, v in resolved.items():
                            if v:
                                info[k] = v
                        info["embedded"] = info["embedded"] or resolved.get("embedded", False)
                    except Exception:
                        pass  # Continue with basic info

                fonts[name_ps] = {k: v for k, v in info.items()}

        # Attach pages used
        for ps, pset in pages_using.items():
            if ps in fonts:
                fonts[ps]["pages"] = sorted(pset)
            else:
                fonts[ps] = {"postscript_name": ps, "pages": sorted(pset)}

        # Produce clean output
        font_list = []
        for ps, meta in sorted(fonts.items()):
            font_list.append({
                "PostScript": meta.get("postscript_name", ps),
                "FullName": meta.get("full_name", ""),
                "Family": meta.get("family", ""),
                "Subfamily": meta.get("subfamily", ""),
                "Embedded": meta.get("embedded", False),
                "Subset": meta.get("subset", False),
                "CIDKeyed": meta.get("cid_keyed", False),
                "Encoding": meta.get("encoding", ""),
                "Pages": meta.get("pages", []),
            })

        doc.close()
        
        return {
            "success": True,
            "fonts": font_list,
            "font_count": len(font_list),
            "has_embedded_fonts": any(f.get("Embedded", False) for f in font_list),
            "has_subset_fonts": any(f.get("Subset", False) for f in font_list),
            "total_pages": doc.page_count
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fonts": [],
            "font_count": 0,
            "has_embedded_fonts": False,
            "has_subset_fonts": False,
            "total_pages": 0
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python detect_fonts_comprehensive.py <file_path>"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = detect_pdf_fonts_comprehensive(file_path)
    print(json.dumps(result))
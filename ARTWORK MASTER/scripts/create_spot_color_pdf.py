#!/usr/bin/env python3
"""
Create a test PDF with Pantone spot colors for testing spot color detection.
"""

import pikepdf
from pikepdf import Pdf, PdfImage, Name, Object, Array, Dictionary

def create_spot_color_pdf():
    """Create a PDF with Pantone spot colors."""
    
    # Create a new PDF
    pdf = Pdf.new()
    
    # Create a page
    page = pdf.add_blank_page(page_size=(595, 842))  # A4
    
    # Add content to the page (this is simplified - in practice you'd add actual content)
    # For testing purposes, we'll just create the PDF structure
    
    # Create a page with spot color resources
    page_dict = page.obj
    
    # Add resources dictionary
    resources = Dictionary()
    
    # Create color space dictionary with spot colors
    color_spaces = Dictionary()
    
    # Add Pantone 186 C (red)
    pantone_186 = Array([
        Name.Separation,
        "PANTONE 186 C",  # This will be encoded as PANTONE#20186#20C in PDF
        Name.DeviceCMYK,
        Array([0, 1, 1, 0])  # CMYK values for Pantone 186 C
    ])
    color_spaces[Name.CS1] = pantone_186
    
    # Add Pantone 300 U (blue)
    pantone_300 = Array([
        Name.Separation,
        "PANTONE 300 U",  # This will be encoded as PANTONE#20300#20U in PDF
        Name.DeviceCMYK,
        Array([1, 1, 0, 0])  # CMYK values for Pantone 300 U
    ])
    color_spaces[Name.CS2] = pantone_300
    
    # Add RAL 2002 (orange)
    ral_2002 = Array([
        Name.Separation,
        "RAL 2002",  # This will be encoded as RAL#202002 in PDF
        Name.DeviceCMYK,
        Array([0, 0.8, 1, 0])  # CMYK values for RAL 2002
    ])
    color_spaces[Name.CS3] = ral_2002
    
    # Add resources to page
    resources[Name.ColorSpace] = color_spaces
    page_dict[Name.Resources] = resources
    
    # Save the PDF
    output_path = "uploads/spot_color_test.pdf"
    pdf.save(output_path)
    
    print(f"Created spot color test PDF: {output_path}")
    print("This PDF contains:")
    print("- Pantone 186 C (red)")
    print("- Pantone 300 U (blue)")
    print("- RAL 2002 (orange)")
    
    return output_path

if __name__ == "__main__":
    create_spot_color_pdf() 
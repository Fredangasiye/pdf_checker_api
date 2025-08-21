#!/usr/bin/env python3

import fitz  # PyMuPDF

def create_magenta_test_pdf():
    """Create a test PDF with 100% magenta color for testing CMYK replacement."""
    
    # Create a new PDF document
    doc = fitz.open()
    
    # Add a page
    page = doc.new_page(width=400, height=300)
    
    # Define 100% magenta color (CMYK: 0, 100, 0, 0)
    # In RGB this is approximately (255, 0, 255)
    magenta_color = (1.0, 0.0, 1.0)  # Pure magenta in RGB
    
    # Create a rectangle with magenta color
    rect = fitz.Rect(50, 50, 350, 200)
    page.draw_rect(rect, color=magenta_color, fill=magenta_color)
    
    # Add some text
    page.insert_text((50, 250), "Test PDF with 100% Magenta (CMYK: 0,100,0,0)", color=(0, 0, 0))
    
    # Save the PDF
    doc.save("uploads/magenta_test.pdf")
    doc.close()
    
    print("Created magenta test PDF: uploads/magenta_test.pdf")
    print("Color in PDF: 100% Magenta")
    print("- RGB: (255, 0, 255)")
    print("- CMYK: (0, 100, 0, 0)")

if __name__ == "__main__":
    create_magenta_test_pdf() 
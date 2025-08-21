#!/usr/bin/env python3

import fitz  # PyMuPDF

def create_test_pdf():
    """Create a simple test PDF with obvious colors for testing color replacement."""
    
    # Create a new PDF document
    doc = fitz.open()
    
    # Add a page
    page = doc.new_page(width=400, height=300)
    
    # Define colors (RGB values 0-1)
    red_color = (1.0, 0.0, 0.0)      # Pure red
    blue_color = (0.0, 0.0, 1.0)     # Pure blue
    green_color = (0.0, 1.0, 0.0)    # Pure green
    
    # Create rectangles with different colors
    # Red rectangle
    rect1 = fitz.Rect(50, 50, 150, 100)
    page.draw_rect(rect1, color=red_color, fill=red_color)
    
    # Blue rectangle
    rect2 = fitz.Rect(200, 50, 300, 100)
    page.draw_rect(rect2, color=blue_color, fill=blue_color)
    
    # Green rectangle
    rect3 = fitz.Rect(125, 150, 225, 200)
    page.draw_rect(rect3, color=green_color, fill=green_color)
    
    # Add some text
    page.insert_text((50, 250), "Test PDF with Red, Blue, and Green colors", color=(0, 0, 0))
    
    # Save the PDF
    doc.save("uploads/simple_test.pdf")
    doc.close()
    
    print("Created test PDF: uploads/simple_test.pdf")
    print("Colors in PDF:")
    print("- Red: RGB(255, 0, 0) -> CMYK(0, 100, 100, 0)")
    print("- Blue: RGB(0, 0, 255) -> CMYK(100, 100, 0, 0)")
    print("- Green: RGB(0, 255, 0) -> CMYK(100, 0, 100, 0)")

if __name__ == "__main__":
    create_test_pdf() 
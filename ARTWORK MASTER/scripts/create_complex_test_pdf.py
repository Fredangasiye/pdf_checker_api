#!/usr/bin/env python3

import fitz  # PyMuPDF

def create_complex_test_pdf():
    """Create a test PDF with complex colors to test color standardization."""
    
    # Create a new PDF document
    doc = fitz.open()
    
    # Add a page
    page = doc.new_page(width=500, height=400)
    
    # Define various colors with slight variations
    colors = [
        ((0.925, 0.0, 0.549), "Complex Red"),      # Close to standard red
        ((0.0, 0.584, 0.853), "Complex Blue"),     # Close to standard blue  
        ((0.167, 0.712, 0.451), "Complex Green"),  # Close to standard green
        ((0.926, 0.0, 0.548), "Another Red"),      # Another red variation
        ((0.914, 0.031, 0.550), "Pink-ish"),       # Close to magenta
    ]
    
    y_position = 50
    for i, (color, name) in enumerate(colors):
        # Create rectangle
        rect = fitz.Rect(50, y_position, 450, y_position + 60)
        page.draw_rect(rect, color=color, fill=color)
        
        # Add text label
        page.insert_text((50, y_position + 80), f"{name}: RGB{color}", color=(0, 0, 0))
        
        y_position += 100
    
    # Save the PDF
    doc.save("uploads/complex_test.pdf")
    doc.close()
    
    print("Created complex test PDF: uploads/complex_test.pdf")
    print("Contains colors with slight variations from standard values")

if __name__ == "__main__":
    create_complex_test_pdf() 
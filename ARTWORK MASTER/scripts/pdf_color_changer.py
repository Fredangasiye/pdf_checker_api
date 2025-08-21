#!/usr/bin/env python3

import sys
import json
import fitz  # PyMuPDF
import os
import math
import traceback
from pathlib import Path

def parse_color_to_tuple(color_str):
    """Parses a user-input color string into a tuple of floats (0-1 scale) and identifies its type."""
    try:
        parts = [p.strip() for p in color_str.split(',')]
        if len(parts) == 3: 
            scale, color_type = 255.0, "RGB"
        elif len(parts) == 4: 
            scale, color_type = 100.0, "CMYK"
        else: 
            raise ValueError("Color must have 3 (RGB) or 4 (CMYK) components.")
        return tuple(float(p) / scale for p in parts), color_type
    except Exception as e:
        raise ValueError(f"Invalid color format for '{color_str}'. Error: {e}")

def rgb_to_cmyk_fingerprint(rgb_tuple):
    """Converts a 0-1 RGB tuple to a 0-100 CMYK tuple using a standard formula."""
    r, g, b = rgb_tuple
    if (r, g, b) == (0, 0, 0): 
        return (0.0, 0.0, 0.0, 100.0)
    k = 1 - max(r, g, b)
    if (1 - k) == 0: 
        return (0.0, 0.0, 0.0, 100.0)
    c = (1 - r - k) / (1 - k)
    m = (1 - g - k) / (1 - k)
    y = (1 - b - k) / (1 - k)
    return (c * 100, m * 100, y * 100, k * 100)

def cmyk_to_rgb(cmyk_tuple):
    """Converts a 0-100 CMYK tuple to a 0-1 RGB tuple."""
    c, m, y, k = [val / 100.0 for val in cmyk_tuple]
    r = 1 - min(1, c * (1 - k) + k)
    g = 1 - min(1, m * (1 - k) + k)
    b = 1 - min(1, y * (1 - k) + k)
    return (r, g, b)

def standardize_cmyk(cmyk_tuple, tolerance=5):
    """
    Standardizes CMYK values to common print values.
    Rounds to nearest 5% for easier matching with Illustrator values.
    """
    c, m, y, k = cmyk_tuple
    # Round to nearest 5%
    c_std = round(c / 5) * 5
    m_std = round(m / 5) * 5
    y_std = round(y / 5) * 5
    k_std = round(k / 5) * 5
    
    # Ensure values are within 0-100 range
    c_std = max(0, min(100, c_std))
    m_std = max(0, min(100, m_std))
    y_std = max(0, min(100, y_std))
    k_std = max(0, min(100, k_std))
    
    return (c_std, m_std, y_std, k_std)

def standardize_rgb(rgb_tuple, tolerance=10):
    """
    Standardizes RGB values to common values.
    Rounds to nearest 10 for easier matching.
    """
    r, g, b = rgb_tuple
    # Convert to 0-255 scale
    r_255 = r * 255
    g_255 = g * 255
    b_255 = b * 255
    
    # Round to nearest 10
    r_std = round(r_255 / 10) * 10
    g_std = round(g_255 / 10) * 10
    b_std = round(b_255 / 10) * 10
    
    # Ensure values are within 0-255 range
    r_std = max(0, min(255, r_std))
    g_std = max(0, min(255, g_std))
    b_std = max(0, min(255, b_std))
    
    return (r_std, g_std, b_std)

def identify_standard_color(rgb_tuple, cmyk_tuple):
    """
    Identifies if the color matches common standard colors.
    Returns the standard color name and values.
    """
    r, g, b = rgb_tuple
    c, m, y, k = cmyk_tuple
    
    # Convert to 0-255 scale for RGB
    r_255, g_255, b_255 = r * 255, g * 255, b * 255
    
    # Common standard colors (RGB values)
    standard_colors = {
        "Black": (0, 0, 0),
        "White": (255, 255, 255),
        "Red": (255, 0, 0),
        "Green": (0, 255, 0),
        "Blue": (0, 0, 255),
        "Cyan": (0, 255, 255),
        "Magenta": (255, 0, 255),
        "Yellow": (255, 255, 0),
        "Orange": (255, 165, 0),
        "Purple": (128, 0, 128),
        "Pink": (255, 192, 203),
        "Brown": (165, 42, 42),
        "Gray": (128, 128, 128),
        "Light Gray": (192, 192, 192),
        "Dark Gray": (64, 64, 64)
    }
    
    # Find closest match
    min_distance = float('inf')
    closest_color = "Custom"
    
    for color_name, std_rgb in standard_colors.items():
        distance = math.sqrt((r_255 - std_rgb[0])**2 + (g_255 - std_rgb[1])**2 + (b_255 - std_rgb[2])**2)
        if distance < min_distance:
            min_distance = distance
            closest_color = color_name
    
    # Only return standard color if it's close enough (within 30 units)
    if min_distance <= 30:
        return closest_color, standard_colors[closest_color]
    else:
        return "Custom", (int(r_255), int(g_255), int(b_255))

def color_distance(c1, c2):
    """Calculates the Euclidean distance between two colors (tuples)."""
    return math.sqrt(sum([(a - b) ** 2 for a, b in zip(c1, c2)]))

def format_color_for_stream(color_tuple, color_type, operator_case='lower'):
    """
    Formats a 0-1 color tuple into a PDF stream string, matching PyMuPDF's sanitizer.
    Example: (0.0, 0.681, 0.938) -> "0 0.681 0.938 rg"
    """
    parts = []
    # PyMuPDF's sanitizer uses ~3 decimal places for floats and integers for whole numbers.
    for val in color_tuple:
        if val == int(val):
            parts.append(str(int(val)))
        else:
            # Using .3g formats numbers like 0.6809 to 0.681, which is what we need
            parts.append(f"{val:.3g}")
    
    operator = 'rg' if color_type == 'RGB' else 'k'
    if operator_case == 'upper':
        operator = operator.upper()
    return f"{' '.join(parts)} {operator}"

def change_pdf_colors(input_path, output_path, old_colors, new_colors, tolerance):
    """Main function to change colors in a PDF file."""
    try:
        doc = fitz.open(input_path)
        
        # --- PASS 1: Build the Color Map using the proven get_drawings() method ---
        print("Pass 1: Building color fingerprint map from drawings...", file=sys.stderr)
        pdf_color_map = {}
        detected_colors = []
        
        for page in doc:
            for d in page.get_drawings():
                for color_prop in ("fill", "color"): # 'color' is for stroke
                    rgb_color = d.get(color_prop)
                    if rgb_color and len(rgb_color) == 3:
                        fingerprint = rgb_to_cmyk_fingerprint(rgb_color)
                        # Store the precise RGB tuple that get_drawings() found
                        if fingerprint not in pdf_color_map:
                            pdf_color_map[fingerprint] = rgb_color
                            
                            # Standardize the color
                            std_cmyk = standardize_cmyk(fingerprint)
                            std_rgb = standardize_rgb(rgb_color)
                            color_name, std_rgb_255 = identify_standard_color(rgb_color, fingerprint)
                            
                            detected_colors.append({
                                "rgb": list(rgb_color),
                                "cmyk": list(fingerprint),
                                "standardized_rgb": list(std_rgb),
                                "standardized_cmyk": list(std_cmyk),
                                "color_name": color_name,
                                "standard_rgb_255": list(std_rgb_255)
                            })
                            
                            print(f"Found color: RGB{rgb_color} -> CMYK{fingerprint}", file=sys.stderr)
                            print(f"  Standardized: RGB{std_rgb} -> CMYK{std_cmyk} ({color_name})", file=sys.stderr)
        print(f"Found {len(pdf_color_map)} unique color fingerprints in PDF.", file=sys.stderr)
        
        # If this is just an analysis request, return the colors
        if not old_colors or not new_colors:
            doc.close()
            return {
                "success": True,
                "colors": detected_colors,
                "message": f"Found {len(detected_colors)} unique colors in PDF"
            }
        
        # --- Prepare the final replacement rules as byte strings ---
        byte_replacements = []
        for old_str, new_str in zip(old_colors, new_colors):
            if not old_str or not new_str: 
                continue

            user_old_tuple, user_old_type = parse_color_to_tuple(old_str)
            user_new_tuple, user_new_type = parse_color_to_tuple(new_str)
            
            print(f"Processing replacement: {old_str} ({user_old_type}) -> {new_str} ({user_new_type})", file=sys.stderr)
            
            if user_old_type == "RGB":
                # For RGB colors, try to find exact match first
                user_old_rgb = tuple(c for c in user_old_tuple)
                best_match_rgb = None
                min_distance = float('inf')
                
                for rgb_color in pdf_color_map.values():
                    dist = color_distance(user_old_rgb, rgb_color)
                    if dist < min_distance:
                        min_distance = dist
                        best_match_rgb = rgb_color
                
                if best_match_rgb and min_distance <= tolerance:
                    print(f"SUCCESS: Match for RGB {old_str} (dist {min_distance:.2f}). Target PDF RGB is {best_match_rgb}", file=sys.stderr)
                    
                    # Create multiple format variations for better replacement success
                    old_fill_bytes = format_color_for_stream(best_match_rgb, "RGB", 'lower').encode('latin-1')
                    old_stroke_bytes = format_color_for_stream(best_match_rgb, "RGB", 'upper').encode('latin-1')
                    new_fill_bytes = format_color_for_stream(user_new_tuple, user_new_type, 'lower').encode('latin-1')
                    new_stroke_bytes = format_color_for_stream(user_new_tuple, user_new_type, 'upper').encode('latin-1')
                    
                    print(f"Old fill bytes: {old_fill_bytes}", file=sys.stderr)
                    print(f"New fill bytes: {new_fill_bytes}", file=sys.stderr)
                    
                    # Add the replacements
                    byte_replacements.append((old_fill_bytes, new_fill_bytes))
                    byte_replacements.append((old_stroke_bytes, new_stroke_bytes))
                    
                    # Also try with different precision formats
                    old_fill_alt = f"{best_match_rgb[0]:.2f} {best_match_rgb[1]:.2f} {best_match_rgb[2]:.2f} rg".encode('latin-1')
                    old_stroke_alt = f"{best_match_rgb[0]:.2f} {best_match_rgb[1]:.2f} {best_match_rgb[2]:.2f} RG".encode('latin-1')
                    new_fill_alt = f"{user_new_tuple[0]:.2f} {user_new_tuple[1]:.2f} {user_new_tuple[2]:.2f} rg".encode('latin-1')
                    new_stroke_alt = f"{user_new_tuple[0]:.2f} {user_new_tuple[1]:.2f} {user_new_tuple[2]:.2f} RG".encode('latin-1')
                    
                    byte_replacements.append((old_fill_alt, new_fill_alt))
                    byte_replacements.append((old_stroke_alt, new_stroke_alt))
                    
                    # Try with 3 decimal places
                    old_fill_3dec = f"{best_match_rgb[0]:.3f} {best_match_rgb[1]:.3f} {best_match_rgb[2]:.3f} rg".encode('latin-1')
                    old_stroke_3dec = f"{best_match_rgb[0]:.3f} {best_match_rgb[1]:.3f} {best_match_rgb[2]:.3f} RG".encode('latin-1')
                    new_fill_3dec = f"{user_new_tuple[0]:.3f} {user_new_tuple[1]:.3f} {user_new_tuple[2]:.3f} rg".encode('latin-1')
                    new_stroke_3dec = f"{user_new_tuple[0]:.3f} {user_new_tuple[1]:.3f} {user_new_tuple[2]:.3f} RG".encode('latin-1')
                    
                    byte_replacements.append((old_fill_3dec, new_fill_3dec))
                    byte_replacements.append((old_stroke_3dec, new_stroke_3dec))
                    
                    # Try with 1 decimal place
                    old_fill_1dec = f"{best_match_rgb[0]:.1f} {best_match_rgb[1]:.1f} {best_match_rgb[2]:.1f} rg".encode('latin-1')
                    old_stroke_1dec = f"{best_match_rgb[0]:.1f} {best_match_rgb[1]:.1f} {best_match_rgb[2]:.1f} RG".encode('latin-1')
                    new_fill_1dec = f"{user_new_tuple[0]:.1f} {user_new_tuple[1]:.1f} {user_new_tuple[2]:.1f} rg".encode('latin-1')
                    new_stroke_1dec = f"{user_new_tuple[0]:.1f} {user_new_tuple[1]:.1f} {user_new_tuple[2]:.1f} RG".encode('latin-1')
                    
                    byte_replacements.append((old_fill_1dec, new_fill_1dec))
                    byte_replacements.append((old_stroke_1dec, new_stroke_1dec))
                    
                    # Try with no decimal places (integers)
                    old_fill_int = f"{int(best_match_rgb[0])} {int(best_match_rgb[1])} {int(best_match_rgb[2])} rg".encode('latin-1')
                    old_stroke_int = f"{int(best_match_rgb[0])} {int(best_match_rgb[1])} {int(best_match_rgb[2])} RG".encode('latin-1')
                    new_fill_int = f"{int(user_new_tuple[0])} {int(user_new_tuple[1])} {int(user_new_tuple[2])} rg".encode('latin-1')
                    new_stroke_int = f"{int(user_new_tuple[0])} {int(user_new_tuple[1])} {int(user_new_tuple[2])} RG".encode('latin-1')
                    
                    byte_replacements.append((old_fill_int, new_fill_int))
                    byte_replacements.append((old_stroke_int, new_stroke_int))
                    
                else:
                    print(f"INFO: No close match for RGB {old_str} (smallest distance {min_distance:.2f} > tolerance {tolerance})", file=sys.stderr)
                    
            elif user_old_type == "CMYK":
                user_old_cmyk_100 = tuple(c * 100 for c in user_old_tuple)
                if not pdf_color_map: 
                    continue
                
                best_match_rgb = min(pdf_color_map.values(), 
                                     key=lambda rgb: color_distance(user_old_cmyk_100, rgb_to_cmyk_fingerprint(rgb)),
                                     default=None)
                
                if best_match_rgb:
                    dist = color_distance(user_old_cmyk_100, rgb_to_cmyk_fingerprint(best_match_rgb))
                    if dist <= tolerance:
                        print(f"SUCCESS: Match for CMYK {old_str} (dist {dist:.2f}). Target PDF RGB is {best_match_rgb}", file=sys.stderr)
                        
                        # Create multiple format variations for better replacement success
                        old_fill_bytes = format_color_for_stream(best_match_rgb, "RGB", 'lower').encode('latin-1')
                        old_stroke_bytes = format_color_for_stream(best_match_rgb, "RGB", 'upper').encode('latin-1')
                        new_fill_bytes = format_color_for_stream(user_new_tuple, user_new_type, 'lower').encode('latin-1')
                        new_stroke_bytes = format_color_for_stream(user_new_tuple, user_new_type, 'upper').encode('latin-1')
                        
                        # Add the replacements
                        byte_replacements.append((old_fill_bytes, new_fill_bytes))
                        byte_replacements.append((old_stroke_bytes, new_stroke_bytes))
                        
                        # Also try with different precision formats
                        old_fill_alt = f"{best_match_rgb[0]:.2f} {best_match_rgb[1]:.2f} {best_match_rgb[2]:.2f} rg".encode('latin-1')
                        old_stroke_alt = f"{best_match_rgb[0]:.2f} {best_match_rgb[1]:.2f} {best_match_rgb[2]:.2f} RG".encode('latin-1')
                        new_fill_alt = f"{user_new_tuple[0]:.2f} {user_new_tuple[1]:.2f} {user_new_tuple[2]:.2f} rg".encode('latin-1')
                        new_stroke_alt = f"{user_new_tuple[0]:.2f} {user_new_tuple[1]:.2f} {user_new_tuple[2]:.2f} RG".encode('latin-1')
                        
                        byte_replacements.append((old_fill_alt, new_fill_alt))
                        byte_replacements.append((old_stroke_alt, new_stroke_alt))
                        
                        # Try with 3 decimal places
                        old_fill_3dec = f"{best_match_rgb[0]:.3f} {best_match_rgb[1]:.3f} {best_match_rgb[2]:.3f} rg".encode('latin-1')
                        old_stroke_3dec = f"{best_match_rgb[0]:.3f} {best_match_rgb[1]:.3f} {best_match_rgb[2]:.3f} RG".encode('latin-1')
                        new_fill_3dec = f"{user_new_tuple[0]:.3f} {user_new_tuple[1]:.3f} {user_new_tuple[2]:.3f} rg".encode('latin-1')
                        new_stroke_3dec = f"{user_new_tuple[0]:.3f} {user_new_tuple[1]:.3f} {user_new_tuple[2]:.3f} RG".encode('latin-1')
                        
                        byte_replacements.append((old_fill_3dec, new_fill_3dec))
                        byte_replacements.append((old_stroke_3dec, new_stroke_3dec))
                        
                        # Try with 1 decimal place
                        old_fill_1dec = f"{best_match_rgb[0]:.1f} {best_match_rgb[1]:.1f} {best_match_rgb[2]:.1f} rg".encode('latin-1')
                        old_stroke_1dec = f"{best_match_rgb[0]:.1f} {best_match_rgb[1]:.1f} {best_match_rgb[2]:.1f} RG".encode('latin-1')
                        new_fill_1dec = f"{user_new_tuple[0]:.1f} {user_new_tuple[1]:.1f} {user_new_tuple[2]:.1f} rg".encode('latin-1')
                        new_stroke_1dec = f"{user_new_tuple[0]:.1f} {user_new_tuple[1]:.1f} {user_new_tuple[2]:.1f} RG".encode('latin-1')
                        
                        byte_replacements.append((old_fill_1dec, new_fill_1dec))
                        byte_replacements.append((old_stroke_1dec, new_stroke_1dec))
                        
                        # Try with no decimal places (integers)
                        old_fill_int = f"{int(best_match_rgb[0])} {int(best_match_rgb[1])} {int(best_match_rgb[2])} rg".encode('latin-1')
                        old_stroke_int = f"{int(best_match_rgb[0])} {int(best_match_rgb[1])} {int(best_match_rgb[2])} RG".encode('latin-1')
                        new_fill_int = f"{int(user_new_tuple[0])} {int(user_new_tuple[1])} {int(user_new_tuple[2])} rg".encode('latin-1')
                        new_stroke_int = f"{int(user_new_tuple[0])} {int(user_new_tuple[1])} {int(user_new_tuple[2])} RG".encode('latin-1')
                        
                        byte_replacements.append((old_fill_int, new_fill_int))
                        byte_replacements.append((old_stroke_int, new_stroke_int))
                        
                    else:
                        print(f"INFO: No close match for CMYK {old_str} (smallest distance {dist:.2f} > tolerance {tolerance})", file=sys.stderr)

        # --- PASS 2: Apply replacements using PyMuPDF's drawing methods ---
        print(f"\nPass 2: Applying color replacements using PyMuPDF drawing methods...", file=sys.stderr)
        total_changes = 0
        
        for page_num, page in enumerate(doc):
            try:
                drawings = page.get_drawings()
                print(f"Page {page_num + 1}: Found {len(drawings)} drawing objects", file=sys.stderr)
                
                # Store drawings that need to be replaced
                drawings_to_replace = []
                
                for i, drawing in enumerate(drawings):
                    fill_color = drawing.get('fill')
                    stroke_color = drawing.get('color')
                    
                    if fill_color:
                        # Check if this color matches our target
                        fill_rgb = tuple(fill_color)
                        fill_cmyk = rgb_to_cmyk_fingerprint(fill_rgb)
                        
                        # Check if this color matches our old color within tolerance
                        old_cmyk = tuple(float(x) for x in old_colors[0].split(','))
                        distance = color_distance(fill_cmyk, old_cmyk)
                        
                        if distance <= tolerance:
                            print(f"  Drawing {i}: Found matching fill color {fill_rgb} (distance: {distance:.2f})", file=sys.stderr)
                            
                            # Convert new color to RGB for the drawing
                            new_rgb = cmyk_to_rgb(tuple(float(x) for x in new_colors[0].split(',')))
                            print(f"  Will replace with new RGB: {new_rgb}", file=sys.stderr)
                            
                            # Store this drawing for replacement
                            drawings_to_replace.append({
                                'original': drawing,
                                'new_color': new_rgb,
                                'index': i
                            })
                            total_changes += 1
                
                # Now replace the drawings by recreating them with new colors
                if drawings_to_replace:
                    print(f"  Recreating {len(drawings_to_replace)} drawings with new colors...", file=sys.stderr)
                    
                    # Clear the page content
                    page.clean_contents()
                    
                    # Recreate all drawings with updated colors
                    for replacement in drawings_to_replace:
                        original = replacement['original']
                        new_color = replacement['new_color']
                        
                        # Get the rectangle from the original drawing
                        rect = original.get('rect')
                        if rect:
                            # Draw a new rectangle with the new color
                            page.draw_rect(rect, color=new_color, fill=new_color)
                            print(f"    Recreated drawing with new color {new_color}", file=sys.stderr)
                            
            except Exception as e:
                print(f"Error processing page {page_num + 1}: {e}", file=sys.stderr)
        
        print(f"Process complete. Total color instances replaced: {total_changes}", file=sys.stderr)
        
        # If no changes made, provide detailed debugging info
        if total_changes == 0:
            print("\nDEBUGGING INFO:", file=sys.stderr)
            print(f"Number of replacement rules created: {len(byte_replacements)}", file=sys.stderr)
            for i, (old_bytes, new_bytes) in enumerate(byte_replacements):
                print(f"Rule {i+1}: {old_bytes} -> {new_bytes}", file=sys.stderr)
            
            # Check if any of these patterns exist in the PDF
            print("\nChecking for color patterns in PDF streams...", file=sys.stderr)
            for page_num, page in enumerate(doc):
                print(f"Page {page_num + 1}:", file=sys.stderr)
                for xref in page.get_contents():
                    stream = doc.xref_stream(xref)
                    for i, (old_bytes, new_bytes) in enumerate(byte_replacements):
                        count = stream.count(old_bytes)
                        if count > 0:
                            print(f"  Found {count} instances of rule {i+1} in stream", file=sys.stderr)
                        else:
                            print(f"  Rule {i+1} not found in stream", file=sys.stderr)
        
        doc.save(output_path, garbage=4, deflate=True)
        doc.close()
        
        return {
            "success": True,
            "total_changes": total_changes,
            "message": f"Successfully replaced {total_changes} color instances"
        }
        
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_color_changer.py <config_json>"
        }))
        sys.exit(1)
    
    try:
        config = json.loads(sys.argv[1])
        
        # Check if this is an analysis-only request
        if config.get("analyze_only", False):
            result = change_pdf_colors(
                config["input_path"],
                None,  # No output path needed for analysis
                [],    # No old colors
                [],    # No new colors
                0      # No tolerance needed
            )
        else:
            result = change_pdf_colors(
                config["input_path"],
                config["output_path"],
                config["old_colors"],
                config["new_colors"],
                config["tolerance"]
            )
        
        # Only output the JSON result to stdout
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        })) 
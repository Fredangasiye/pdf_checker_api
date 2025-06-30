from setuptools import setup

APP = ['pdf_print_checker.py']  # Make sure your script name matches

OPTIONS = {
    'argv_emulation': True,
    'packages': [
        'streamlit',
        'pdfplumber',
        'pytesseract',
        'PIL',
        'fitz',
        'pypdfium2_raw'
    ],
    'includes': [
        'pdfplumber',
        'pytesseract',
        'PIL',
        'fitz',
        'pypdfium2_raw'
    ],
    'excludes': ['tkinter'],
    'plist': {
        'CFBundleName': 'PDF Print Checker',
        'CFBundleShortVersionString': '1.0.0',
        'CFBundleIdentifier': 'com.yourcompany.pdfchecker'
    },
    'frameworks': [],
}

setup(
    app=APP,
    name='PDF Print Checker',
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)

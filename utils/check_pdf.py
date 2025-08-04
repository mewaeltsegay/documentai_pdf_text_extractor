#!/usr/bin/env python3
"""
Check PDF File Validity
"""

import os
from pathlib import Path

def check_pdf_file(pdf_path):
    """Check if a PDF file is valid and readable."""
    print(f"🔍 Checking PDF: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return False
    
    try:
        with open(pdf_path, "rb") as f:
            content = f.read()
        
        file_size = len(content)
        print(f"   File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
        
        # Check if it starts with PDF header
        if content.startswith(b'%PDF-'):
            print("✅ File has valid PDF header")
        else:
            print("❌ File doesn't have valid PDF header")
            print(f"   First 20 bytes: {content[:20]}")
            return False
        
        # Check if it ends properly
        if b'%%EOF' in content[-1024:]:  # EOF should be near the end
            print("✅ File has proper PDF ending")
        else:
            print("⚠️  File might not have proper PDF ending")
        
        # Check for password protection
        if b'/Encrypt' in content:
            print("⚠️  PDF might be password protected")
        else:
            print("✅ PDF is not password protected")
        
        # Basic structure check
        if b'xref' in content and b'trailer' in content:
            print("✅ PDF has basic structure elements")
        else:
            print("⚠️  PDF might have structural issues")
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return False

def main():
    """Check the first PDF file."""
    pdf_files = list(Path("PDFs").glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in PDFs directory")
        return
    
    # Check the first few PDFs
    for pdf_file in pdf_files[:3]:
        check_pdf_file(pdf_file)
        print("-" * 50)

if __name__ == "__main__":
    main() 
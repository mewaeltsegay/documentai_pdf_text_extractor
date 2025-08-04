#!/usr/bin/env python3
"""
Example script for processing a single PDF document with Google Document AI
This is useful for testing your setup and understanding the output structure.
"""

import json
import os
from parser import DocumentAILayoutParser

def process_single_document(pdf_path: str):
    """
    Process a single PDF document and display the results.
    
    Args:
        pdf_path: Path to the PDF file to process
    """
    # Import configuration
    try:
        from config_local import PROJECT_ID, LOCATION, PROCESSOR_ID, SERVICE_ACCOUNT_PATH
        print("Using configuration from config_local.py")
    except ImportError:
        try:
            from config import PROJECT_ID, LOCATION, PROCESSOR_ID, SERVICE_ACCOUNT_PATH
            print("Using configuration from config.py")
        except ImportError:
            print("❌ Could not import configuration. Please ensure config.py or config_local.py exists.")
            raise
    
    # Initialize the parser
    parser = DocumentAILayoutParser(
        project_id=PROJECT_ID,
        location=LOCATION,
        processor_id=PROCESSOR_ID,
        service_account_path=SERVICE_ACCOUNT_PATH
    )
    
    # Process the document
    print(f"Processing: {pdf_path}")
    result = parser.process_pdf(pdf_path)
    
    # Display results
    if result.get("status") == "success":
        print("\n" + "="*50)
        print("PROCESSING RESULTS")
        print("="*50)
        
        # Document info
        doc_info = result.get("document_info", {})
        print(f"File: {result.get('file_name', 'Unknown')}")
        print(f"Total Pages: {doc_info.get('total_pages', 0)}")
        print(f"Text Length: {doc_info.get('text_length', 0)} characters")
        print(f"Processing Time: {result.get('processing_timestamp', 'Unknown')}")
        
        # Page-level info
        pages = result.get("pages", [])
        if pages:
            print(f"\nPage Details:")
            for page in pages:
                print(f"  Page {page['page_number']}: {page['width']}x{page['height']} pixels")
                print(f"    - Blocks: {page['blocks_count']}")
                print(f"    - Paragraphs: {page['paragraphs_count']}")
                print(f"    - Lines: {page['lines_count']}")
                print(f"    - Tokens: {page['tokens_count']}")
                print(f"    - Tables: {page['tables_count']}")
                print(f"    - Form Fields: {page['form_fields_count']}")
        
        # Sample text blocks
        blocks = result.get("blocks", [])
        if blocks:
            print(f"\nSample Text Blocks (first 3):")
            for i, block in enumerate(blocks[:3]):
                text = block.get("text", "")[:100]  # First 100 chars
                if len(block.get("text", "")) > 100:
                    text += "..."
                print(f"  Block {i+1} (Page {block.get('page_number', '?')}): {text}")
        
        # Tables info
        tables = result.get("tables", [])
        if tables:
            print(f"\nTables Found: {len(tables)}")
            for i, table in enumerate(tables):
                print(f"  Table {i+1} (Page {table.get('page_number', '?')}): "
                      f"{table.get('rows_count', 0)} rows, {len(table.get('cells', []))} cells")
        
        # Form fields
        form_fields = result.get("form_fields", [])
        if form_fields:
            print(f"\nForm Fields Found: {len(form_fields)}")
            for i, field in enumerate(form_fields[:5]):  # Show first 5
                name = field.get("field_name", "").strip()
                value = field.get("field_value", "").strip()
                if name or value:
                    print(f"  Field {i+1}: '{name}' = '{value}'")
        
        # Save detailed results
        output_file = f"single_doc_result_{os.path.basename(pdf_path)}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed results saved to: {output_file}")
        
    else:
        print(f"❌ Processing failed: {result.get('error', 'Unknown error')}")


def main():
    """Main function for the single document example."""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python example_single_doc.py <path_to_pdf>")
        print("\nExample:")
        print("  python example_single_doc.py PDFs/haddas_eritra_05012020.pdf")
        return
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return
    
    if not pdf_path.lower().endswith('.pdf'):
        print(f"❌ File must be a PDF: {pdf_path}")
        return
    
    try:
        process_single_document(pdf_path)
    except Exception as e:
        print(f"❌ Error processing document: {str(e)}")
        raise


if __name__ == "__main__":
    main() 
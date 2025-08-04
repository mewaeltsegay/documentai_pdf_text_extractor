import os
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
from google.cloud import documentai
from google.api_core.client_options import ClientOptions
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DocumentAILayoutParser:
    """
    A parser that uses Google Document AI to extract layout information from PDFs
    and create a structured dataset.
    """
    
    def __init__(self, project_id: str, location: str, processor_id: str, 
                 service_account_path: str = None):
        """
        Initialize the Document AI client.
        
        Args:
            project_id: Google Cloud project ID
            location: Processor location (e.g., 'us' or 'eu')
            processor_id: Document AI processor ID
            service_account_path: Path to service account JSON file (optional)
        """
        self.project_id = project_id
        self.location = location
        self.processor_id = processor_id
        
        logger.info(f"Initializing Document AI client:")
        logger.info(f"  Project ID: {project_id}")
        logger.info(f"  Location: {location}")
        logger.info(f"  Processor ID: {processor_id}")
        
        # Set up authentication if service account path is provided
        if service_account_path:
            if not os.path.exists(service_account_path):
                raise FileNotFoundError(f"Service account file not found: {service_account_path}")
            
            logger.info(f"  Service Account: {service_account_path}")
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        else:
            logger.info("  Using default credentials (environment variable or gcloud auth)")
        
        try:
            # Initialize Document AI client
            opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
            self.client = documentai.DocumentProcessorServiceClient(client_options=opts)
            self.processor_name = self.client.processor_path(
                project_id, location, processor_id
            )
            
            logger.info(f"  Processor Path: {self.processor_name}")
            logger.info("✅ Document AI client initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Document AI client: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            raise
        
        # Initialize dataset storage
        self.dataset = []
        
    def process_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Process a single PDF and extract layout information.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing extracted layout information
        """
        logger.info(f"Processing PDF: {pdf_path}")
        
        try:
            # Check if file exists and is readable
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Read the PDF file
            with open(pdf_path, "rb") as pdf_file:
                pdf_content = pdf_file.read()
            
            file_size = len(pdf_content)
            logger.info(f"PDF file size: {file_size} bytes")
            
            if file_size == 0:
                raise ValueError(f"PDF file is empty: {pdf_path}")
            
            # Check file size limit (Document AI has a 20MB limit for synchronous processing)
            if file_size > 20 * 1024 * 1024:  # 20MB
                logger.warning(f"File size ({file_size} bytes) exceeds 20MB limit for synchronous processing")
            
            # Create the document request
            raw_document = documentai.RawDocument(
                content=pdf_content,
                mime_type="application/pdf"
            )
            
            request = documentai.ProcessRequest(
                name=self.processor_name,
                raw_document=raw_document
            )
            
            logger.info(f"Sending request to Document AI processor: {self.processor_name}")
            
            # Process the document
            result = self.client.process_document(request=request)
            document = result.document
            
            # Log basic document info
            logger.info(f"Document AI response - Pages: {len(document.pages)}, Text length: {len(document.text)}")
            
            if len(document.pages) == 0:
                logger.warning(f"Document AI returned 0 pages for {pdf_path}")
                logger.warning(f"Document text: '{document.text[:200]}...' (first 200 chars)")
            
            # Extract layout information
            layout_info = self._extract_layout_info(document, pdf_path)
            
            logger.info(f"Successfully processed: {pdf_path}")
            return layout_info
            
        except Exception as e:
            logger.error(f"Error processing {pdf_path}: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            return {"file_path": pdf_path, "error": str(e), "status": "failed"}
    
    def _extract_layout_info(self, document, pdf_path: str) -> Dict[str, Any]:
        """
        Extract detailed layout information from the processed document.
        
        Args:
            document: Processed document from Document AI
            pdf_path: Path to the original PDF file
            
        Returns:
            Dictionary containing layout information
        """
        layout_data = {
            "file_path": pdf_path,
            "file_name": os.path.basename(pdf_path),
            "processing_timestamp": datetime.now().isoformat(),
            "status": "success",
            "document_info": {
                "total_pages": len(document.pages),
                "text_length": len(document.text),
            },
            "pages": [],
            "blocks": [],
            "paragraphs": [],
            "lines": [],
            "tokens": [],
            "tables": [],
            "form_fields": []
        }
        
        # Process each page
        for page_num, page in enumerate(document.pages):
            page_info = {
                "page_number": page_num + 1,
                "width": page.dimension.width,
                "height": page.dimension.height,
                "blocks_count": len(page.blocks),
                "paragraphs_count": len(page.paragraphs),
                "lines_count": len(page.lines),
                "tokens_count": len(page.tokens),
                "tables_count": len(page.tables),
                "form_fields_count": len(page.form_fields)
            }
            layout_data["pages"].append(page_info)
            
            # Extract blocks
            for block_num, block in enumerate(page.blocks):
                block_info = self._extract_text_element_info(
                    block, document.text, page_num + 1, "block", block_num
                )
                layout_data["blocks"].append(block_info)
            
            # Extract paragraphs
            for para_num, paragraph in enumerate(page.paragraphs):
                para_info = self._extract_text_element_info(
                    paragraph, document.text, page_num + 1, "paragraph", para_num
                )
                layout_data["paragraphs"].append(para_info)
            
            # Extract lines
            for line_num, line in enumerate(page.lines):
                line_info = self._extract_text_element_info(
                    line, document.text, page_num + 1, "line", line_num
                )
                layout_data["lines"].append(line_info)
            
            # Extract tokens
            for token_num, token in enumerate(page.tokens):
                token_info = self._extract_text_element_info(
                    token, document.text, page_num + 1, "token", token_num
                )
                layout_data["tokens"].append(token_info)
            
            # Extract tables
            for table_num, table in enumerate(page.tables):
                table_info = self._extract_table_info(
                    table, document.text, page_num + 1, table_num
                )
                layout_data["tables"].append(table_info)
            
            # Extract form fields
            for field_num, field in enumerate(page.form_fields):
                field_info = self._extract_form_field_info(
                    field, document.text, page_num + 1, field_num
                )
                layout_data["form_fields"].append(field_info)
        
        return layout_data
    
    def _extract_text_element_info(self, element, document_text: str, 
                                  page_num: int, element_type: str, 
                                  element_num: int) -> Dict[str, Any]:
        """Extract information from text elements (blocks, paragraphs, lines, tokens)."""
        if not element.layout:
            return {}
        
        # Get bounding box
        bbox = element.layout.bounding_poly
        vertices = [(vertex.x, vertex.y) for vertex in bbox.vertices] if bbox.vertices else []
        
        # Extract text
        text_segments = element.layout.text_anchor.text_segments if element.layout.text_anchor else []
        extracted_text = ""
        for segment in text_segments:
            start_idx = int(segment.start_index) if segment.start_index else 0
            end_idx = int(segment.end_index) if segment.end_index else len(document_text)
            extracted_text += document_text[start_idx:end_idx]
        
        return {
            "page_number": page_num,
            "element_type": element_type,
            "element_number": element_num,
            "text": extracted_text.strip(),
            "text_length": len(extracted_text.strip()),
            "bounding_box": vertices,
            "confidence": getattr(element.layout, 'confidence', None)
        }
    
    def _extract_table_info(self, table, document_text: str, 
                           page_num: int, table_num: int) -> Dict[str, Any]:
        """Extract information from tables."""
        table_info = {
            "page_number": page_num,
            "table_number": table_num,
            "rows_count": len(table.body_rows) if table.body_rows else 0,
            "header_rows_count": len(table.header_rows) if table.header_rows else 0,
            "cells": []
        }
        
        # Process header rows
        if table.header_rows:
            for row_idx, row in enumerate(table.header_rows):
                for cell_idx, cell in enumerate(row.cells):
                    cell_info = self._extract_cell_info(
                        cell, document_text, page_num, table_num, 
                        row_idx, cell_idx, "header"
                    )
                    table_info["cells"].append(cell_info)
        
        # Process body rows
        if table.body_rows:
            for row_idx, row in enumerate(table.body_rows):
                for cell_idx, cell in enumerate(row.cells):
                    cell_info = self._extract_cell_info(
                        cell, document_text, page_num, table_num, 
                        row_idx, cell_idx, "body"
                    )
                    table_info["cells"].append(cell_info)
        
        return table_info
    
    def _extract_cell_info(self, cell, document_text: str, page_num: int, 
                          table_num: int, row_idx: int, cell_idx: int, 
                          cell_type: str) -> Dict[str, Any]:
        """Extract information from table cells."""
        # Extract text from cell
        text_segments = cell.layout.text_anchor.text_segments if cell.layout and cell.layout.text_anchor else []
        extracted_text = ""
        for segment in text_segments:
            start_idx = int(segment.start_index) if segment.start_index else 0
            end_idx = int(segment.end_index) if segment.end_index else len(document_text)
            extracted_text += document_text[start_idx:end_idx]
        
        # Get bounding box
        bbox = cell.layout.bounding_poly if cell.layout else None
        vertices = [(vertex.x, vertex.y) for vertex in bbox.vertices] if bbox and bbox.vertices else []
        
        return {
            "page_number": page_num,
            "table_number": table_num,
            "row_index": row_idx,
            "cell_index": cell_idx,
            "cell_type": cell_type,
            "text": extracted_text.strip(),
            "text_length": len(extracted_text.strip()),
            "bounding_box": vertices,
            "row_span": cell.row_span if hasattr(cell, 'row_span') else 1,
            "col_span": cell.col_span if hasattr(cell, 'col_span') else 1
        }
    
    def _extract_form_field_info(self, field, document_text: str, 
                                page_num: int, field_num: int) -> Dict[str, Any]:
        """Extract information from form fields."""
        field_info = {
            "page_number": page_num,
            "field_number": field_num,
            "field_name": "",
            "field_value": ""
        }
        
        # Extract field name
        if field.field_name and field.field_name.text_anchor:
            for segment in field.field_name.text_anchor.text_segments:
                start_idx = int(segment.start_index) if segment.start_index else 0
                end_idx = int(segment.end_index) if segment.end_index else len(document_text)
                field_info["field_name"] += document_text[start_idx:end_idx]
        
        # Extract field value
        if field.field_value and field.field_value.text_anchor:
            for segment in field.field_value.text_anchor.text_segments:
                start_idx = int(segment.start_index) if segment.start_index else 0
                end_idx = int(segment.end_index) if segment.end_index else len(document_text)
                field_info["field_value"] += document_text[start_idx:end_idx]
        
        field_info["field_name"] = field_info["field_name"].strip()
        field_info["field_value"] = field_info["field_value"].strip()
        
        return field_info
    
    def process_all_pdfs(self, pdf_directory: str) -> List[Dict[str, Any]]:
        """
        Process all PDFs in a directory.
        
        Args:
            pdf_directory: Path to directory containing PDFs
            
        Returns:
            List of dictionaries containing layout information for each PDF
        """
        pdf_files = list(Path(pdf_directory).glob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        for pdf_file in pdf_files:
            layout_info = self.process_pdf(str(pdf_file))
            self.dataset.append(layout_info)
        
        return self.dataset
    
    def save_dataset(self, output_dir: str = "output"):
        """
        Save the extracted dataset in multiple formats.
        
        Args:
            output_dir: Directory to save the output files
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Save complete dataset as JSON
        json_path = os.path.join(output_dir, "layout_dataset.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(self.dataset, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved complete dataset to {json_path}")
        
        # Create summary statistics
        self._create_summary_statistics(output_dir)
        
        # Create CSV exports for different data types
        self._export_to_csv(output_dir)
        
    def _create_summary_statistics(self, output_dir: str):
        """Create summary statistics for the dataset."""
        summary = {
            "total_documents": len(self.dataset),
            "successful_documents": len([d for d in self.dataset if d.get("status") == "success"]),
            "failed_documents": len([d for d in self.dataset if d.get("status") == "failed"]),
            "total_pages": sum(d.get("document_info", {}).get("total_pages", 0) for d in self.dataset if d.get("status") == "success"),
            "average_pages_per_document": 0,
            "total_blocks": sum(len(d.get("blocks", [])) for d in self.dataset if d.get("status") == "success"),
            "total_paragraphs": sum(len(d.get("paragraphs", [])) for d in self.dataset if d.get("status") == "success"),
            "total_lines": sum(len(d.get("lines", [])) for d in self.dataset if d.get("status") == "success"),
            "total_tokens": sum(len(d.get("tokens", [])) for d in self.dataset if d.get("status") == "success"),
            "total_tables": sum(len(d.get("tables", [])) for d in self.dataset if d.get("status") == "success"),
            "total_form_fields": sum(len(d.get("form_fields", [])) for d in self.dataset if d.get("status") == "success")
        }
        
        if summary["successful_documents"] > 0:
            summary["average_pages_per_document"] = summary["total_pages"] / summary["successful_documents"]
        
        summary_path = os.path.join(output_dir, "dataset_summary.json")
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)
        logger.info(f"Saved summary statistics to {summary_path}")
    
    def _export_to_csv(self, output_dir: str):
        """Export different data types to CSV files."""
        successful_docs = [d for d in self.dataset if d.get("status") == "success"]
        
        # Document-level CSV
        doc_data = []
        for doc in successful_docs:
            doc_row = {
                "file_name": doc.get("file_name", ""),
                "file_path": doc.get("file_path", ""),
                "total_pages": doc.get("document_info", {}).get("total_pages", 0),
                "text_length": doc.get("document_info", {}).get("text_length", 0),
                "blocks_count": len(doc.get("blocks", [])),
                "paragraphs_count": len(doc.get("paragraphs", [])),
                "lines_count": len(doc.get("lines", [])),
                "tokens_count": len(doc.get("tokens", [])),
                "tables_count": len(doc.get("tables", [])),
                "form_fields_count": len(doc.get("form_fields", []))
            }
            doc_data.append(doc_row)
        
        if doc_data:
            df_docs = pd.DataFrame(doc_data)
            docs_csv_path = os.path.join(output_dir, "documents_summary.csv")
            df_docs.to_csv(docs_csv_path, index=False)
            logger.info(f"Saved documents summary to {docs_csv_path}")
        
        # Blocks CSV
        all_blocks = []
        for doc in successful_docs:
            for block in doc.get("blocks", []):
                block["file_name"] = doc.get("file_name", "")
                all_blocks.append(block)
        
        if all_blocks:
            df_blocks = pd.DataFrame(all_blocks)
            blocks_csv_path = os.path.join(output_dir, "blocks.csv")
            df_blocks.to_csv(blocks_csv_path, index=False)
            logger.info(f"Saved blocks data to {blocks_csv_path}")
        
        # Tables CSV
        all_tables = []
        for doc in successful_docs:
            for table in doc.get("tables", []):
                table["file_name"] = doc.get("file_name", "")
                all_tables.append(table)
        
        if all_tables:
            df_tables = pd.DataFrame(all_tables)
            tables_csv_path = os.path.join(output_dir, "tables.csv")
            df_tables.to_csv(tables_csv_path, index=False)
            logger.info(f"Saved tables data to {tables_csv_path}")


def main():
    """
    Main function to run the Document AI layout parser.
    Loads configuration from config_local.py or falls back to config.py
    """
    # Import configuration
    try:
        from config_local import (
            PROJECT_ID, LOCATION, PROCESSOR_ID, 
            SERVICE_ACCOUNT_PATH, PDF_DIRECTORY, OUTPUT_DIRECTORY
        )
        logger.info("Using configuration from config_local.py")
    except ImportError:
        try:
            from config import (
                PROJECT_ID, LOCATION, PROCESSOR_ID, 
                SERVICE_ACCOUNT_PATH, PDF_DIRECTORY, OUTPUT_DIRECTORY
            )
            logger.info("Using configuration from config.py")
        except ImportError:
            logger.error("Could not import configuration. Please ensure config.py or config_local.py exists.")
            raise
    
    try:
        # Initialize the parser
        parser = DocumentAILayoutParser(
            project_id=PROJECT_ID,
            location=LOCATION,
            processor_id=PROCESSOR_ID,
            service_account_path=SERVICE_ACCOUNT_PATH
        )
        
        # Process all PDFs
        logger.info("Starting PDF processing...")
        dataset = parser.process_all_pdfs(PDF_DIRECTORY)
        
        # Save the dataset
        logger.info("Saving dataset...")
        parser.save_dataset(OUTPUT_DIRECTORY)
        
        logger.info(f"Processing complete! Dataset saved to {OUTPUT_DIRECTORY}")
        logger.info(f"Processed {len(dataset)} documents")
        
    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
        raise


if __name__ == "__main__":
    main()

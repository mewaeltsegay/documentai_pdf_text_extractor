# Utility Scripts

This directory contains diagnostic and utility scripts for the Document AI parser.

## Scripts

### Setup & Diagnostics
- **`quick_start.py`** - Interactive setup wizard with dependency checking
- **`diagnostic_test.py`** - Comprehensive system test for troubleshooting
- **`check_service_account.py`** - Verify service account credentials
- **`list_processors.py`** - List available Document AI processors
- **`check_pdf.py`** - Validate PDF file integrity

### Examples
- **`example_single_doc.py`** - Process a single PDF document (for testing)

## Usage

Run from the project root directory:

```bash
# Interactive setup
python utils/quick_start.py

# System diagnostics
python utils/diagnostic_test.py

# Check credentials
python utils/check_service_account.py

# List processors
python utils/list_processors.py

# Validate PDFs
python utils/check_pdf.py

# Test single document
python utils/example_single_doc.py
```

These tools help with initial setup, troubleshooting, and testing individual components of the system. 
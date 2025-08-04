# Document AI Layout Parser

A comprehensive tool for extracting layout information from PDF documents using Google Document AI, with specialized functionality for creating LLM training datasets.

## 🚀 Features

- **Document AI Integration**: Extract layout elements (blocks, paragraphs, lines, tokens, tables, form fields) from PDFs
- **LLM Dataset Creation**: Generate clean JSONL datasets for language model training
- **Web Interface**: Interactive PDF viewer with bounding box visualization and editing capabilities
- **Multiple Export Formats**: JSON, JSONL, CSV, and plain text outputs
- **Diagnostic Tools**: Comprehensive setup validation and troubleshooting utilities

## 📁 Project Structure

```
├── parser.py                 # Main Document AI layout parser
├── extract_llm_dataset.py    # LLM dataset extractor (JSONL format)
├── config.py                 # Configuration template
├── requirements.txt          # Python dependencies
├── SETUP_GUIDE.md           # Detailed setup instructions
├── interface/               # Web-based PDF viewer and editor
│   ├── index.html          # Main interface
│   ├── script.js           # Interactive functionality
│   ├── styles.css          # UI styling
│   └── launch.py          # Local server launcher
└── utils/                   # Diagnostic and utility scripts
    ├── quick_start.py      # Interactive setup helper
    ├── example_single_doc.py # Single document processing example
    ├── check_*.py          # Various diagnostic tools
    └── diagnostic_test.py  # Comprehensive system testing
```

## 🎯 Quick Start

### 1. Prerequisites

- Python 3.7+
- Google Cloud Project with Document AI API enabled
- Service account with Document AI permissions

### 2. Installation

```bash
git clone <repository-url>
cd document-parser
pip install -r requirements.txt
```

### 3. Configuration

1. Copy your service account key to `key.json`
2. Create `config_local.py` (or modify `config.py`):

```python
PROJECT_ID = "your-google-cloud-project-id"
LOCATION = "us"  # or "eu"
PROCESSOR_ID = "your-processor-id"
SERVICE_ACCOUNT_PATH = "key.json"
PDF_DIRECTORY = "PDFs"
OUTPUT_DIRECTORY = "output"
```

### 4. Basic Usage

#### Extract LLM Dataset (Recommended)
```bash
python extract_llm_dataset.py
```
Creates `llm_dataset/llm_dataset_YYYYMMDD_HHMMSS.jsonl` with paragraphs ≥50 characters.

#### Full Document Processing
```bash
python parser.py
```
Processes all PDFs and creates comprehensive layout dataset in `output/`.

#### Interactive Setup
```bash
python utils/quick_start.py
```
Guided setup with dependency checking and configuration validation.

## 📊 Output Formats

### LLM Dataset (JSONL)
Perfect for language model training:
```json
{"text": "First paragraph content..."}
{"text": "Second paragraph content..."}
```

### Complete Layout Data (JSON)
Comprehensive document structure with bounding boxes, confidence scores, and metadata.

### Web Interface
Interactive PDF viewer with:
- Bounding box visualization
- Element type filtering
- Drag-and-drop editing
- Undo/redo functionality
- Export capabilities

## 🔧 Advanced Usage

### Single Document Processing
```bash
python utils/example_single_doc.py
```

### Web Interface
```bash
cd interface
python launch.py
```
Access at `http://localhost:8000/interface/`

### Diagnostic Tools
```bash
python utils/diagnostic_test.py      # Comprehensive system test
python utils/check_pdf.py           # PDF validation
python utils/list_processors.py     # Available processors
```

## 📋 Requirements

### Google Cloud Setup
1. Create Google Cloud Project
2. Enable Document AI API
3. Create Document AI Processor (Layout Parser)
4. Create Service Account with "Document AI API User" role
5. Download service account key

### Python Dependencies
- `google-cloud-documentai`
- `pandas`
- `pathlib2`
- Standard library modules

## 🌍 Language Support

Optimized for multilingual documents with proper UTF-8 encoding support. Tested with:
- English
- Arabic scripts
- Various international languages

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied (403)**
   - Verify service account has "Document AI API User" role
   - Check processor ID and project ID are correct

2. **Empty Results**
   - Verify PDF is not password-protected
   - Check PDF is not image-only (requires OCR processor)
   - Validate file is not corrupted

3. **Large File Processing**
   - Document AI has 20MB limit for synchronous processing
   - Consider splitting large documents

### Diagnostic Commands
```bash
python utils/check_service_account.py  # Verify credentials
python utils/check_pdf.py             # Validate PDF files
python utils/diagnostic_test.py        # Full system test
```

## 📖 Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- Interface README - Web interface documentation
- Google Document AI - [Official documentation](https://cloud.google.com/document-ai/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License

## 🔗 Related Resources

- [Google Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [PDF.js Library](https://mozilla.github.io/pdf.js/)
- [JSONL Format Specification](http://jsonlines.org/)

---

**Note**: This project requires Google Cloud credentials. Never commit service account keys or sensitive configuration files to version control. 
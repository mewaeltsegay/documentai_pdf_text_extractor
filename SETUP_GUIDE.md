# Google Document AI Layout Parser Setup Guide

This guide will help you set up and use Google Document AI to extract layout information from your PDF documents and create a structured dataset.

## Prerequisites

1. **Google Cloud Account**: You need an active Google Cloud account
2. **Python 3.7+**: Make sure you have Python 3.7 or later installed
3. **PDF Files**: Your PDF files should be in the `PDFs` directory

## Step 1: Google Cloud Setup

### 1.1 Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (you'll need this later)

### 1.2 Enable Document AI API
1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Document AI API"
3. Click on it and press **Enable**

### 1.3 Create a Document AI Processor
1. Go to **Document AI > Processors**
2. Click **Create Processor**
3. Choose **Document OCR** (or **Form Parser** if you have forms)
4. Select your region (US, EU, etc.)
5. Give it a name and create
6. **Copy the Processor ID** from the processor details page

### 1.4 Set Up Authentication
1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Give it a name and description
4. Click **Create and Continue**
5. Add the role **Document AI API User**
6. Click **Done**
7. Click on your service account
8. Go to **Keys** tab
9. Click **Add Key > Create New Key**
10. Choose **JSON** format and download the file
11. **Save this JSON file securely** (you'll reference its path in the config)

## Step 2: Local Setup

### 2.1 Install Dependencies
```bash
pip install -r requirements.txt
```

### 2.2 Configure the Application
1. Copy `config.py` to `config_local.py`:
   ```bash
   cp config.py config_local.py
   ```

2. Edit `config_local.py` and fill in your details:
   ```python
   PROJECT_ID = "your-actual-project-id"
   LOCATION = "us"  # or "eu" based on where you created your processor
   PROCESSOR_ID = "your-actual-processor-id"
   SERVICE_ACCOUNT_PATH = "path/to/your/downloaded-service-account.json"
   ```

### 2.3 Update the Main Script
Edit `parser.py` and update the configuration section at the bottom:

```python
def main():
    # Import your local configuration
    try:
        from config_local import (
            PROJECT_ID, LOCATION, PROCESSOR_ID, 
            SERVICE_ACCOUNT_PATH, PDF_DIRECTORY, OUTPUT_DIRECTORY
        )
    except ImportError:
        # Fallback to default config
        from config import (
            PROJECT_ID, LOCATION, PROCESSOR_ID, 
            SERVICE_ACCOUNT_PATH, PDF_DIRECTORY, OUTPUT_DIRECTORY
        )
    
    # Rest of the main function remains the same...
```

## Step 3: Running the Parser

### 3.1 Prepare Your PDFs
Make sure all your PDF files are in the `PDFs` directory.

### 3.2 Run the Parser
```bash
python parser.py
```

### 3.3 Monitor Progress
The script will:
- Process each PDF file
- Log progress to the console
- Save results to the `output` directory

## Step 4: Understanding the Output

The parser creates several output files in the `output` directory:

### 4.1 Main Dataset
- **`layout_dataset.json`**: Complete dataset with all extracted information
- **`dataset_summary.json`**: Summary statistics of the processing

### 4.2 CSV Files
- **`documents_summary.csv`**: Document-level statistics
- **`blocks.csv`**: All text blocks with their positions and content
- **`tables.csv`**: All detected tables with their structure

### 4.3 Data Structure
Each processed document contains:
- **Document Info**: Page count, text length, processing timestamp
- **Pages**: Dimensions, element counts per page
- **Blocks**: Text blocks with bounding boxes and content
- **Paragraphs**: Paragraph-level text elements
- **Lines**: Individual text lines
- **Tokens**: Individual words/tokens
- **Tables**: Structured table data with cells
- **Form Fields**: Detected form fields and their values

## Step 5: Customization Options

### 5.1 Processor Types
You can use different Document AI processors:
- **Document OCR**: General text extraction
- **Form Parser**: Better for forms and structured documents
- **Specialized Processors**: Invoice, receipt, etc.

### 5.2 Output Formats
Modify the `save_dataset()` method to add more output formats:
- Excel files
- Database storage
- Custom JSON structures

### 5.3 Filtering and Processing
Add custom logic to:
- Filter specific document types
- Extract custom features
- Apply post-processing rules

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify your service account JSON file path
   - Check if the service account has Document AI API User role
   - Ensure the Document AI API is enabled

2. **Processor Not Found**
   - Verify your Project ID, Location, and Processor ID
   - Make sure the processor exists in the specified region

3. **Quota Exceeded**
   - Document AI has usage quotas (check Google Cloud Console)
   - Consider adding delays between requests for large datasets

4. **File Processing Errors**
   - Check if PDF files are corrupted
   - Verify file sizes (Document AI has size limits)
   - Review the error logs for specific issues

### Cost Considerations

- Document AI charges per page processed
- Check current pricing at [Google Cloud Pricing](https://cloud.google.com/document-ai/pricing)
- Monitor usage in the Google Cloud Console

## Advanced Usage

### Batch Processing with Rate Limiting
```python
import time

# Add delay between requests
time.sleep(1)  # 1 second delay between documents
```

### Parallel Processing
The current implementation processes documents sequentially. For faster processing of large datasets, consider implementing parallel processing with proper rate limiting.

### Custom Analysis
After extracting the basic layout information, you can add custom analysis:
- Document classification
- Content analysis
- Layout pattern recognition
- Quality assessment

## Support

If you encounter issues:
1. Check the Google Cloud Console for API usage and errors
2. Review the application logs for detailed error messages
3. Consult the [Google Document AI documentation](https://cloud.google.com/document-ai/docs)

---

**Note**: Keep your service account JSON file secure and never commit it to version control. Add it to your `.gitignore` file. 
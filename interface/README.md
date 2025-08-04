# Document AI Layout Dataset Viewer

A modern web interface for viewing and analyzing Document AI layout extraction results.

## Features

### 📊 **Dashboard**
- Overview statistics of your dataset
- Processing status charts
- Recent document activity
- Quick access to key metrics

### 📄 **Documents View**
- Browse all processed documents
- Filter by processing status (success/failed)
- Sort by name, date, or page count
- Search documents by filename
- Click any document for detailed information

### 🔤 **Text Blocks View**
- View all extracted text elements
- Filter by type (blocks, paragraphs, lines, tokens)
- See bounding box information
- Confidence scores for each element

### 📋 **Tables View**
- Preview all extracted tables
- See table structure and cell content
- Organized by document and page

### 📄 **Pages View**
- View page-level statistics
- Page dimensions and element counts
- Organized by document

### 👁️ **PDF Viewer with Bounding Box Editor** (NEW!)
- **Visual PDF Rendering**: View actual PDF pages with overlaid bounding boxes
- **Interactive Elements**: Click on any bounding box to see detailed element information
- **Element Type Filtering**: Toggle visibility of blocks, paragraphs, lines, tokens, and tables
- **Page Navigation**: Browse through multi-page documents
- **Zoom Controls**: Zoom in/out for detailed inspection
- **Color-coded Elements**: Each element type has a distinct color for easy identification
- **Element Information Panel**: Detailed sidebar showing text content, confidence scores, and coordinates

#### ✏️ **Edit Mode** (NEW!)
- **Interactive Editing**: Toggle edit mode to modify bounding box positions and sizes
- **Drag & Drop**: Click and drag bounding boxes to reposition them
- **Resize Handles**: Use corner and edge handles to resize bounding boxes
- **Visual Feedback**: Selected boxes are highlighted with blue outlines and resize handles
- **Live Coordinate Updates**: Changes are converted back to Document AI coordinate system
- **Edit History**: Full undo/redo support for all modifications
- **Save Changes**: Export corrected dataset with updated bounding box coordinates
- **Reset Function**: Revert all edits back to original coordinates
- **Change Counter**: Track the number of modifications made

### 🔍 **Advanced Search**
- Search across all content
- Filter by content type
- Highlight matching terms
- Contextual results

## Getting Started

### Prerequisites
1. **Run Document AI Parser**: Make sure you've processed your PDFs using the main parser
   ```bash
   python parser.py
   ```

2. **Output Files**: Ensure the `output/layout_dataset.json` file exists in your project root

### Launch the Interface

#### Option 1: Simple HTTP Server (Recommended)
```bash
# Navigate to the interface directory
cd interface

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Open your browser and go to:
# http://localhost:8000
```

#### Option 2: Using Node.js
```bash
# Install a simple server
npm install -g http-server

# Navigate to interface directory
cd interface

# Start server
http-server

# Open the provided URL in your browser
```

#### Option 3: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## File Structure

```
interface/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling
├── script.js           # Interactive functionality
└── README.md           # This file
```

## Usage Guide

### Navigation
- Use the **sidebar menu** to switch between different views
- The **dashboard** provides a quick overview of your dataset
- Each view offers specific filtering and search capabilities

### Document Details
- **Click any document card** to open detailed information
- View processing statistics, page details, and error information
- Modal window shows comprehensive document metadata

### Searching
- **Quick search**: Use search bars in each view for immediate filtering
- **Global search**: Use the Search view for advanced cross-content searching
- **Filters**: Apply status filters, sort options, and content type filters

### Data Export
- Click the **"Export"** button in the header to download the complete dataset
- Exports as JSON format with timestamp

### PDF Viewer
- **Select Document**: Choose a successfully processed document from the dropdown
- **Navigate Pages**: Use Previous/Next buttons to browse through multi-page documents
- **Zoom**: Use zoom in/out buttons to get a closer look at details
- **Toggle Elements**: Check/uncheck element types to show/hide their bounding boxes
- **Inspect Elements**: Click on any colored bounding box to see detailed information
- **Element Details**: View text content, confidence scores, and coordinate information in the side panel

### Bounding Box Editing
- **Enable Edit Mode**: Check the "Enable Editing" checkbox to activate editing capabilities
- **Select Elements**: Click on any bounding box to select it (it will show a blue outline)
- **Move Boxes**: Drag selected bounding boxes to reposition them
- **Resize Boxes**: Use the 8 resize handles (corners and edges) to change box dimensions
- **Undo/Redo**: Use the undo and redo buttons to navigate through your edit history
- **Save Changes**: Click "Save Changes" to download an updated dataset with corrected coordinates
- **Reset All**: Click "Reset All" to revert all changes back to original coordinates
- **Track Changes**: The edit counter shows how many modifications you've made

## Data Sources

The interface automatically loads data from:
- `../output/layout_dataset.json` - Main dataset file
- `../output/dataset_summary.json` - Summary statistics (if available)

## Troubleshooting

### "Unable to Load Dataset" Error
**Causes:**
- Dataset file doesn't exist
- Wrong file path
- Browser security restrictions

**Solutions:**
1. **Run the parser first**:
   ```bash
   python parser.py
   ```

2. **Check file location**: Ensure `output/layout_dataset.json` exists

3. **Use a proper web server**: Don't open `index.html` directly in browser (use http-server)

4. **Check browser console**: Press F12 and look for error messages

### Empty or No Data Displayed
**Causes:**
- No documents were successfully processed
- All documents failed processing

**Solutions:**
1. **Check Document AI setup**: Run the diagnostic script
   ```bash
   python diagnostic_test.py
   ```

2. **Review processing logs**: Check for authentication or permission issues

3. **Verify PDF files**: Ensure PDFs are valid and readable

### Performance Issues
**For large datasets:**
- The interface limits blocks view to 1000 items for performance
- Use filters to narrow down results
- Consider processing smaller batches

### PDF Viewer Issues
**"PDF file not found" Error:**
- Ensure your PDF files are in the `PDFs/` directory relative to your project root
- Check that the PDF filenames in your dataset match the actual files
- PDFs must be accessible via the web server (not just local file system)

**Bounding boxes not appearing:**
- Check that element type toggles are enabled (blocks, paragraphs, etc.)
- Ensure the document was successfully processed (green status)
- Verify the Document AI found elements on the current page

**Performance with large PDFs:**
- Use zoom controls to focus on specific areas
- Toggle off element types you don't need to see
- Large PDFs may take a moment to load and render

## Browser Compatibility

**Supported Browsers:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Required Features:**
- ES6+ JavaScript support
- Fetch API
- CSS Grid and Flexbox

## Development

### Customization
- **Styling**: Modify `styles.css` for custom themes
- **Functionality**: Extend `script.js` for additional features
- **Layout**: Update `index.html` for structural changes

### Adding New Views
1. Add navigation item in `index.html`
2. Create corresponding view content section
3. Add view logic in `script.js`
4. Update `switchView()` function

## Data Structure

The interface expects this JSON structure:
```json
[
  {
    "file_name": "document.pdf",
    "status": "success",
    "processing_timestamp": "2023-...",
    "document_info": {
      "total_pages": 5,
      "text_length": 1500
    },
    "pages": [...],
    "blocks": [...],
    "tables": [...],
    "paragraphs": [...],
    "lines": [...],
    "tokens": [...]
  }
]
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Document AI setup
3. Ensure all prerequisite files exist
4. Try the diagnostic script for Document AI issues

---

**Tip**: For best experience, process a few documents first to test the interface, then scale up to your full dataset. 
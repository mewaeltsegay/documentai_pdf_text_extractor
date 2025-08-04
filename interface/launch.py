#!/usr/bin/env python3
"""
Simple HTTP server launcher for the Document AI Dataset Viewer interface.
This script starts a local web server to serve the HTML interface and PDFs.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve the interface by default"""
    
    def do_GET(self):
        # If requesting the root path, serve the interface/index.html
        if self.path == '/' or self.path == '':
            self.path = '/interface/index.html'
        # If requesting a path without extension and no file exists, try adding .html
        elif '.' not in self.path.split('/')[-1]:
            test_path = self.path.rstrip('/') + '.html'
            if os.path.exists('.' + test_path):
                self.path = test_path
        
        return super().do_GET()

def main():
    # Configuration
    PORT = 8000
    HOST = 'localhost'
    
    # Change to the parent directory so we can serve both interface/ and PDFs/
    parent_dir = Path(__file__).parent.parent
    os.chdir(parent_dir)
    
    print("🚀 Document AI Dataset Viewer")
    print("=" * 40)
    print(f"Starting server on http://{HOST}:{PORT}")
    print(f"Serving files from: {parent_dir}")
    print(f"Interface available at: http://{HOST}:{PORT}/interface/")
    print()
    
    # Check if demo data exists
    demo_file = parent_dir / 'interface' / 'demo-data.json'
    main_data_file = parent_dir / 'output' / 'layout_dataset.json'
    pdfs_dir = parent_dir / 'PDFs'
    
    if main_data_file.exists():
        print("✅ Main dataset found: output/layout_dataset.json")
    elif demo_file.exists():
        print("📋 Using demo data for testing")
        print("   Run 'python parser.py' to generate real data")
    else:
        print("⚠️  No dataset files found")
        print("   - Run 'python parser.py' to generate data")
        print("   - Or ensure demo-data.json exists for testing")
    
    if pdfs_dir.exists():
        pdf_count = len(list(pdfs_dir.glob('*.pdf')))
        print(f"📁 Found {pdf_count} PDF files in PDFs/ directory")
    else:
        print("⚠️  PDFs directory not found")
    
    print()
    print("📖 How to use:")
    print("   1. The interface will open in your browser automatically")
    print("   2. Navigate between different views using the sidebar")
    print("   3. Click on documents to see detailed information")
    print("   4. Use search and filters to explore your data")
    print()
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 40)
    
    # Create server
    handler = CustomHTTPRequestHandler
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
        '.pdf': 'application/pdf',
    })
    
    try:
        with socketserver.TCPServer((HOST, PORT), handler) as httpd:
            print(f"Server started at http://{HOST}:{PORT}")
            
            # Try to open browser automatically to the interface
            try:
                webbrowser.open(f'http://{HOST}:{PORT}/interface/')
                print("🌐 Opening browser...")
            except Exception as e:
                print(f"Could not open browser automatically: {e}")
                print(f"Please open http://{HOST}:{PORT}/interface/ manually")
            
            print("\nReady! The interface is now available.")
            print(f"   - Interface: http://{HOST}:{PORT}/interface/")
            print(f"   - PDFs: http://{HOST}:{PORT}/PDFs/")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("\nTroubleshooting:")
        print(f"   - Port {PORT} might be in use. Try a different port.")
        print("   - Check your firewall settings.")
        print("   - Ensure you have proper permissions.")
        sys.exit(1)

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Diagnostic Test Script for Google Document AI Setup

This script helps diagnose issues with Document AI authentication and processing.
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test if all required libraries can be imported."""
    print("🔍 Testing imports...")
    
    try:
        import google.cloud.documentai
        print("✅ Google Cloud Document AI imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Google Cloud Document AI: {e}")
        return False
    
    try:
        from google.api_core.client_options import ClientOptions
        print("✅ Google API Core imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Google API Core: {e}")
        return False
    
    return True

def test_configuration():
    """Test configuration import."""
    print("\n🔍 Testing configuration...")
    
    try:
        from config_local import PROJECT_ID, LOCATION, PROCESSOR_ID, SERVICE_ACCOUNT_PATH
        print("✅ Configuration imported from config_local.py")
        config_source = "config_local.py"
    except ImportError:
        try:
            from config import PROJECT_ID, LOCATION, PROCESSOR_ID, SERVICE_ACCOUNT_PATH
            print("✅ Configuration imported from config.py")
            config_source = "config.py"
        except ImportError:
            print("❌ Could not import configuration from either config_local.py or config.py")
            return False, None, None, None, None, None
    
    print(f"   Project ID: {PROJECT_ID}")
    print(f"   Location: {LOCATION}")
    print(f"   Processor ID: {PROCESSOR_ID}")
    print(f"   Service Account Path: {SERVICE_ACCOUNT_PATH}")
    
    return True, PROJECT_ID, LOCATION, PROCESSOR_ID, SERVICE_ACCOUNT_PATH, config_source

def test_service_account_file(service_account_path):
    """Test if service account file exists and is readable."""
    print("\n🔍 Testing service account file...")
    
    if not service_account_path:
        print("⚠️  No service account path specified")
        return False
    
    if not os.path.exists(service_account_path):
        print(f"❌ Service account file not found: {service_account_path}")
        return False
    
    try:
        with open(service_account_path, 'r') as f:
            import json
            data = json.load(f)
            if 'type' in data and data['type'] == 'service_account':
                print("✅ Service account file is valid JSON with correct type")
                print(f"   Service account email: {data.get('client_email', 'N/A')}")
                print(f"   Project ID in file: {data.get('project_id', 'N/A')}")
                return True
            else:
                print("❌ Service account file doesn't appear to be a valid service account JSON")
                return False
    except json.JSONDecodeError:
        print("❌ Service account file is not valid JSON")
        return False
    except Exception as e:
        print(f"❌ Error reading service account file: {e}")
        return False

def test_document_ai_client(project_id, location, processor_id, service_account_path):
    """Test Document AI client initialization."""
    print("\n🔍 Testing Document AI client initialization...")
    
    try:
        from google.cloud import documentai
        from google.api_core.client_options import ClientOptions
        
        # Set up authentication
        if service_account_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        
        # Initialize client
        opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
        client = documentai.DocumentProcessorServiceClient(client_options=opts)
        processor_name = client.processor_path(project_id, location, processor_id)
        
        print("✅ Document AI client initialized successfully")
        print(f"   Processor path: {processor_name}")
        
        return True, client, processor_name
        
    except Exception as e:
        print(f"❌ Failed to initialize Document AI client: {e}")
        print(f"   Error type: {type(e).__name__}")
        return False, None, None

def test_processor_access(client, processor_name):
    """Test if we can access the processor."""
    print("\n🔍 Testing processor access...")
    
    try:
        # Try to get processor info (this tests if the processor exists and we have access)
        processor_info = client.get_processor(name=processor_name)
        print("✅ Processor is accessible")
        print(f"   Processor name: {processor_info.name}")
        print(f"   Display name: {processor_info.display_name}")
        print(f"   Type: {processor_info.type_}")
        print(f"   State: {processor_info.state}")
        return True
        
    except Exception as e:
        print(f"❌ Cannot access processor: {e}")
        print(f"   Error type: {type(e).__name__}")
        
        # Common error messages and their meanings
        error_str = str(e).lower()
        if "not found" in error_str:
            print("   💡 This usually means the processor ID is incorrect or doesn't exist")
        elif "permission" in error_str or "access" in error_str:
            print("   💡 This usually means your service account doesn't have Document AI API User role")
        elif "authentication" in error_str:
            print("   💡 This usually means authentication is not set up correctly")
        
        return False

def test_simple_processing(client, processor_name):
    """Test simple document processing with a small test document."""
    print("\n🔍 Testing simple document processing...")
    
    # Find a PDF to test with
    pdf_files = list(Path("PDFs").glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in PDFs directory")
        return False
    
    test_file = pdf_files[0]
    print(f"   Testing with: {test_file.name}")
    
    try:
        from google.cloud import documentai
        
        # Read the complete PDF file
        with open(test_file, "rb") as f:
            content = f.read()  # Read the entire file
        
        print(f"   File size: {len(content)} bytes")
        
        # Create the request
        raw_document = documentai.RawDocument(
            content=content,
            mime_type="application/pdf"
        )
        
        request = documentai.ProcessRequest(
            name=processor_name,
            raw_document=raw_document
        )
        
        print("   Sending request to Document AI...")
        
        # Process the document
        result = client.process_document(request=request)
        document = result.document
        
        print(f"✅ Document processed successfully")
        print(f"   Pages returned: {len(document.pages)}")
        print(f"   Text length: {len(document.text)}")
        print(f"   First 100 chars: '{document.text[:100]}...'")
        
        if len(document.pages) == 0:
            print("⚠️  Warning: Document AI returned 0 pages")
            print("   This could indicate:")
            print("   - The PDF is corrupted or unreadable")
            print("   - The processor type doesn't support this document format")
            print("   - The document is entirely images without extractable text")
        
        return True
        
    except Exception as e:
        print(f"❌ Document processing failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        return False

def main():
    """Main diagnostic function."""
    print("🏥 Google Document AI Diagnostic Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed. Please install requirements:")
        print("   pip install -r requirements.txt")
        return
    
    # Test configuration
    config_ok, project_id, location, processor_id, service_account_path, config_source = test_configuration()
    if not config_ok:
        print("\n❌ Configuration test failed. Please set up your configuration.")
        return
    
    # Test service account file
    if not test_service_account_file(service_account_path):
        print(f"\n❌ Service account test failed. Please check {config_source}")
        return
    
    # Test Document AI client
    client_ok, client, processor_name = test_document_ai_client(project_id, location, processor_id, service_account_path)
    if not client_ok:
        return
    
    # Test processor access
    if not test_processor_access(client, processor_name):
        return
    
    # Test simple processing
    test_simple_processing(client, processor_name)
    
    print("\n" + "=" * 50)
    print("🎉 Diagnostic tests completed!")
    print("If you see warnings above, those might explain why processing returns empty results.")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
List Document AI Processors
This script lists all processors in your project to verify IDs.
"""

import os
from google.cloud import documentai
from google.api_core.client_options import ClientOptions

def list_processors():
    """List all processors in the project."""
    try:
        from config import PROJECT_ID, LOCATION, SERVICE_ACCOUNT_PATH
    except ImportError:
        print("❌ Could not import configuration")
        return
    
    print(f"🔍 Listing processors in project: {PROJECT_ID}")
    print(f"   Location: {LOCATION}")
    
    try:
        # Set up authentication
        if SERVICE_ACCOUNT_PATH:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = SERVICE_ACCOUNT_PATH
        
        # Initialize client
        opts = ClientOptions(api_endpoint=f"{LOCATION}-documentai.googleapis.com")
        client = documentai.DocumentProcessorServiceClient(client_options=opts)
        
        # List processors
        parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"
        
        print(f"   Requesting processors from: {parent}")
        
        processors = client.list_processors(parent=parent)
        
        print("✅ Available processors:")
        found_processors = False
        for processor in processors:
            found_processors = True
            # Extract processor ID from the full name
            processor_id = processor.name.split('/')[-1]
            print(f"   ID: {processor_id}")
            print(f"   Name: {processor.display_name}")
            print(f"   Type: {processor.type_}")
            print(f"   State: {processor.state}")
            print(f"   Full path: {processor.name}")
            print("-" * 40)
        
        if not found_processors:
            print("⚠️  No processors found in this project/location")
            print("   You may need to:")
            print("   1. Create a processor in the Google Cloud Console")
            print("   2. Check if you're using the correct location")
            print("   3. Verify your project ID")
        
    except Exception as e:
        print(f"❌ Error listing processors: {e}")
        print(f"   Error type: {type(e).__name__}")
        
        if "403" in str(e) or "Permission" in str(e):
            print("   💡 This is the same permission error - your service account needs permissions")

if __name__ == "__main__":
    list_processors() 
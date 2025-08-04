#!/usr/bin/env python3
"""
Check Service Account Details
"""

import json
import os

def check_service_account():
    """Check the service account file details."""
    try:
        from config import SERVICE_ACCOUNT_PATH
    except ImportError:
        print("❌ Could not import SERVICE_ACCOUNT_PATH from config.py")
        return
    
    print(f"🔍 Checking service account file: {SERVICE_ACCOUNT_PATH}")
    
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"❌ Service account file not found: {SERVICE_ACCOUNT_PATH}")
        return
    
    try:
        with open(SERVICE_ACCOUNT_PATH, 'r') as f:
            data = json.load(f)
        
        print("✅ Service account file contents:")
        print(f"   Type: {data.get('type', 'MISSING')}")
        print(f"   Project ID: {data.get('project_id', 'MISSING')}")
        print(f"   Client Email: {data.get('client_email', 'MISSING')}")
        print(f"   Client ID: {data.get('client_id', 'MISSING')}")
        
        # Check if project IDs match
        from config import PROJECT_ID
        file_project = data.get('project_id', '')
        config_project = PROJECT_ID
        
        print(f"\n🔍 Project ID Comparison:")
        print(f"   Config PROJECT_ID: {config_project}")
        print(f"   Service Account project_id: {file_project}")
        
        if file_project != config_project:
            print("⚠️  WARNING: Project IDs don't match!")
            print("   This is likely the cause of your permission error.")
        else:
            print("✅ Project IDs match")
        
    except json.JSONDecodeError:
        print("❌ Service account file is not valid JSON")
    except Exception as e:
        print(f"❌ Error reading service account file: {e}")

if __name__ == "__main__":
    check_service_account() 
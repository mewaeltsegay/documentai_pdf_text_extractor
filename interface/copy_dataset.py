#!/usr/bin/env python3
"""
Utility script to copy the main dataset to the interface directory
for easier access when path resolution issues occur.
"""

import shutil
import os
from pathlib import Path

def main():
    print("📊 Dataset Copy Utility")
    print("=" * 30)
    
    # Define paths
    interface_dir = Path(__file__).parent
    output_dir = interface_dir.parent / 'output'
    source_file = output_dir / 'layout_dataset.json'
    target_file = interface_dir / 'layout_dataset.json'
    
    print(f"Source: {source_file}")
    print(f"Target: {target_file}")
    print()
    
    # Check if source exists
    if not source_file.exists():
        print("❌ Source dataset not found!")
        print("   Please run 'python parser.py' first to generate the dataset.")
        return
    
    # Get file size for info
    file_size = source_file.stat().st_size / (1024 * 1024)  # MB
    print(f"📁 Found dataset: {file_size:.1f} MB")
    
    # Check if target already exists
    if target_file.exists():
        target_size = target_file.stat().st_size / (1024 * 1024)
        print(f"⚠️  Target file already exists ({target_size:.1f} MB)")
        
        response = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Copy cancelled.")
            return
    
    # Copy the file
    print("📋 Copying dataset...")
    try:
        shutil.copy2(source_file, target_file)
        print("✅ Dataset copied successfully!")
        print()
        print("Now the interface can load data from:")
        print("  - ./layout_dataset.json (local copy)")
        print("  - ../output/layout_dataset.json (original)")
        print()
        print("💡 Tip: Run 'python launch.py' to start the interface")
        
    except Exception as e:
        print(f"❌ Error copying file: {e}")

if __name__ == "__main__":
    main() 
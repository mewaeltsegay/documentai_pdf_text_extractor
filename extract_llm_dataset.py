#!/usr/bin/env python3
"""
Extract LLM Dataset from Document AI Paragraphs

Extracts all paragraphs over 50 characters into JSONL format 
suitable for LLM training (single "text" field per line).
"""

import os
import json
from datetime import datetime

def main():
    # Configuration
    dataset_path = "output/layout_dataset.json"
    output_folder = "llm_dataset"
    min_length = 50
    
    print("🤖 LLM Dataset Extractor")
    print("=" * 40)
    print(f"Minimum paragraph length: {min_length} characters")
    
    # Load dataset
    print(f"Loading dataset from: {dataset_path}")
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset file not found: {dataset_path}")
        return
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    
    print(f"✅ Loaded {len(dataset)} documents")
    
    # Extract paragraphs
    print(f"Extracting paragraphs over {min_length} characters...")
    paragraphs = []
    total_paragraphs = 0
    
    for doc in dataset:
        if doc.get('status') != 'success':
            continue
        
        doc_paragraphs = doc.get('paragraphs', [])
        total_paragraphs += len(doc_paragraphs)
        
        for paragraph in doc_paragraphs:
            text = paragraph.get('text', '').strip()
            if len(text) >= min_length:
                paragraphs.append({"text": text})
    
    print(f"✅ Extracted {len(paragraphs)} paragraphs out of {total_paragraphs} total")
    
    if not paragraphs:
        print("❌ No paragraphs found matching criteria")
        return
    
    # Create output folder and save
    os.makedirs(output_folder, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    jsonl_filename = f"llm_dataset_{timestamp}.jsonl"
    jsonl_path = os.path.join(output_folder, jsonl_filename)
    
    # Save as JSONL
    with open(jsonl_path, 'w', encoding='utf-8') as f:
        for paragraph in paragraphs:
            json.dump(paragraph, f, ensure_ascii=False, separators=(',', ':'))
            f.write('\n')
    
    file_size_mb = os.path.getsize(jsonl_path) / (1024 * 1024)
    
    # Results
    print("\n" + "=" * 40)
    print("📊 EXTRACTION COMPLETE")
    print("=" * 40)
    print(f"📄 Paragraphs extracted: {len(paragraphs)}")
    print(f"📁 Output file: {jsonl_path}")
    print(f"📏 File size: {file_size_mb:.2f} MB")
    print(f"📋 Format: LLM-ready JSONL")
    
    # Show samples
    print(f"\n📄 Sample entries:")
    for i, p in enumerate(paragraphs[:3], 1):
        preview = p['text'][:60] + "..." if len(p['text']) > 60 else p['text']
        print(f"{i}. {preview}")
    
    print(f"\n✅ LLM dataset ready! Use: {jsonl_path}")

if __name__ == "__main__":
    main() 
# Google Cloud Document AI Configuration
# Copy this file to config_local.py and fill in your actual values

# Google Cloud Project Settings
PROJECT_ID = "aerial-valor-463418-h0"  # Replace with your Google Cloud project ID
LOCATION = "us"  # Choose: "us", "eu", or other supported regions
PROCESSOR_ID = "de1835f5a737dd16"  # Replace with your Document AI processor ID

# Authentication (choose one method)
# Method 1: Service Account JSON file path
SERVICE_ACCOUNT_PATH = "key.json"

# Method 2: Environment variable (alternative to service account file)
# Set GOOGLE_APPLICATION_CREDENTIALS environment variable to point to your service account JSON
# SERVICE_ACCOUNT_PATH = None  # Set to None if using environment variable

# Directory Settings
PDF_DIRECTORY = "PDFs"  # Directory containing your PDF files
OUTPUT_DIRECTORY = "output"  # Directory where results will be saved

# Processing Settings
MAX_CONCURRENT_REQUESTS = 5  # Number of parallel requests to Document AI
RETRY_ATTEMPTS = 3  # Number of retry attempts for failed requests
TIMEOUT_SECONDS = 60  # Timeout for each request 
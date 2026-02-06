"""
Test actual upload via API
"""
import requests

# Get auth token from Supabase (you'll need to replace this)
# For now, test without auth to see the error
url = "http://127.0.0.1:8000/upload/financials"

files = {'file': open('test_upload.csv', 'rb')}
data = {'type': 'bank'}

# This will fail with 401 but we can see if parsing works
try:
    response = requests.post(url, files=files, data=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

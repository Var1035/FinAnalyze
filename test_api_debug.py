
import requests
import json

url = "http://127.0.0.1:8000/upload/financials"
files = {'file': open('test_bank.csv', 'rb')}
# I'll revert to minimal payload to see the FIRST error again if possible, or send full payload to see CURRENT error.
# Sending FULL payload for now.
data = {
    'type': 'bank' # This is what the Form param expects. 
    # But backend logic adds user_id, file_type, upload_type, status, processing_error to DB insert.
}

try:
    response = requests.post(url, files=files, data=data)
    with open("api_response.json", "w") as f:
        # Saving json dump
        try:
            json.dump(response.json(), f, indent=2)
        except:
            f.write(response.text)
except Exception as e:
    print("Error:", e)

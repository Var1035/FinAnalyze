
import requests

url = "http://127.0.0.1:8000/upload/financials"
files = {'file': open('test_bank.csv', 'rb')}
data = {'type': 'bank'}

try:
    response = requests.post(url, files=files, data=data)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except Exception as e:
    print("Error:", e)

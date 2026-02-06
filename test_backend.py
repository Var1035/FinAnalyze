
import requests
import io

API_URL = "http://127.0.0.1:8000"

def test_upload():
    print("Testing Upload...")
    
    # Create valid dummy CSV
    csv_content = """
    Date, Description, Amount, Type
    2024-01-01, Client Payment, 5000, Credit
    2024-01-02, Server Cost, 100, Debit
    2024-01-03, Subscription, 200, Debit
    """
    
    files = {
        'file': ('test.csv', csv_content, 'text/csv')
    }
    data = {'type': 'bank'}
    
    try:
        response = requests.post(f"{API_URL}/upload/financials", files=files, data=data)
        print(f"Upload Status: {response.status_code}")
        print(f"Upload Response: {response.json()}")
        
        if response.status_code == 200:
            return True
    except Exception as e:
        print(f"Upload Failed: {e}")
        return False

def test_metrics():
    print("\nTesting Metrics Aggregation...")
    try:
        response = requests.get(f"{API_URL}/metrics/overview")
        print(f"Metrics Status: {response.status_code}")
        data = response.json()
        print(f"Metrics Response: {data}")
        
        if data['total_revenue'] > 0 or data['cash_inflow'] > 0:
            print("\nSUCCESS: Non-zero metrics found!")
        else:
            print("\nFAILURE: Metrics are still zero.")
            
    except Exception as e:
        print(f"Metrics Fetch Failed: {e}")

if __name__ == "__main__":
    if test_upload():
        test_metrics()

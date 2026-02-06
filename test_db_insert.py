
try:
    from backend.db_client import supabase
    print("Attempting to INSERT into financial_uploads...")
    data = {"filename": "test_script.csv", "upload_type": "bank"}
    res = supabase.table('financial_uploads').insert(data).execute()
    print("Success:", res)
except Exception as e:
    print("Error:", e)

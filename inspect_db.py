
try:
    from backend.db_client import supabase
    print("Fetching one row to inspect columns...")
    res = supabase.table('financial_uploads').select('*').limit(1).execute()
    if res.data:
        print("Columns:", list(res.data[0].keys()))
    else:
        print("No data found to inspect columns.")
except Exception as e:
    print("Error:", e)

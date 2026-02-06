
try:
    from backend.db_client import supabase
    print("Fetching one row to inspect columns...")
    res = supabase.table('financial_uploads').select('*').limit(1).execute()
    if res.data:
        keys = list(res.data[0].keys())
        keys.sort()
        print("Columns Found:", keys)
    else:
        print("No rows found. Can't inspect columns via SELECT.")
except Exception as e:
    print("Error:", e)

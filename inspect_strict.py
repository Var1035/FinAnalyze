
try:
    from backend.db_client import supabase
    res = supabase.table('financial_uploads').select('*').limit(1).execute()
    if res.data:
        keys = list(res.data[0].keys())
        keys.sort()
        for k in keys:
            print(f"COLUMN: {k}")
    else:
        print("No data.")
except Exception as e:
    print("Error:", e)

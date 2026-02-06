
try:
    from backend.db_client import supabase
    print("Attempting to query financial_uploads...")
    res = supabase.table('financial_uploads').select('*').limit(1).execute()
    print("Success:", res)
except Exception as e:
    print("Error:", e)

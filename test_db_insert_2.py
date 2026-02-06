
try:
    from backend.db_client import supabase
    print("Attempting to INSERT...")
    data = {"filename": "test_script.csv", "upload_type": "bank"}
    try:
        res = supabase.table('financial_uploads').insert(data).execute()
        print("Success:", res)
    except Exception as e:
        # Try to print the message if it's a dict-like string or object using str(e)
        err_str = str(e)
        print("FULL_ERROR:", err_str)
        if hasattr(e, 'message'):
            print("MSG:", e.message)
        if hasattr(e, 'code'):
            print("CODE:", e.code)
except Exception as e:
    print("Outer Error:", e)

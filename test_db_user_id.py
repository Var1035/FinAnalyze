
import uuid
try:
    from backend.db_client import supabase
    print("Attempting to INSERT with user_id...")
    my_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    data = {"id": my_id, "user_id": user_id, "filename": "test_auth_uuid.csv", "upload_type": "bank"}
    try:
        res = supabase.table('financial_uploads').insert(data).execute()
        print("Success:", res)
    except Exception as e:
        print("FULL_ERROR:", str(e))
except Exception as e:
    print("Outer Error:", e)

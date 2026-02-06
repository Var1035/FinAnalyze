"""
Quick script to apply the database migration for parsed_data column
"""
import os
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.db_client import supabase

def run_migration():
    migration_sql = """
    -- Add parsed_data column to financial_uploads table
    ALTER TABLE financial_uploads 
    ADD COLUMN IF NOT EXISTS parsed_data JSONB,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS file_type TEXT,
    ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS error_message TEXT;

    -- Add user_id to financial_metrics for proper filtering
    ALTER TABLE financial_metrics
    ADD COLUMN IF NOT EXISTS user_id UUID;

    -- Create index for faster user-specific queries
    CREATE INDEX IF NOT EXISTS idx_financial_uploads_user_id ON financial_uploads(user_id);
    CREATE INDEX IF NOT EXISTS idx_financial_metrics_user_id ON financial_metrics(user_id);
    """
    
    try:
        # Execute using Supabase SQL
        result = supabase.rpc('exec_sql', {'query': migration_sql}).execute()
        print("✅ Migration completed successfully!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("\nPlease run this SQL directly in your Supabase SQL editor:")
        print(migration_sql)

if __name__ == "__main__":
    run_migration()

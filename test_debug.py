"""
Detailed debug test
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
import pandas as pd
import io
from backend.services.financial_analysis import process_financial_data, normalize_columns, match_column

async def test():
    csv_content = b"""Date,Description,Amount,Type
2024-01-01,Payment,5000,Credit
2024-01-02,Purchase,200,Debit"""
    
    # Test 1: Direct DataFrame
    print("=== TEST 1: Direct DataFrame ===")
    df = pd.read_csv(io.BytesIO(csv_content))
    print(f"Original columns: {df.columns.tolist()}")
    
    normalized = normalize_columns(df.columns)
    print(f"Normalized: {normalized}")
    
    date_col = match_column(normalized, ['date', 'txn_date'])
    amount_col = match_column(normalized, ['amount', 'txn_amount'])
    type_col = match_column(normalized, ['type', 'txn_type'])
    
    print(f"Matched - date: {date_col}, amount: {amount_col}, type: {type_col}")
    
    # Test 2: Full processing
    print("\n=== TEST 2: Full Processing ===")
    result = await process_financial_data(csv_content, "test.csv", "bank")
    print(f"Result: {result}")

asyncio.run(test())

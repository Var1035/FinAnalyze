"""
Test script to verify parsed_data is being generated correctly
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from backend.services.financial_analysis import process_financial_data

async def test_parsing():
    # Create a simple test CSV
    csv_content = b"""Date,Description,Amount,Type
2024-01-01,Payment,5000,Credit
2024-01-02,Purchase,200,Debit
2024-01-03,Sale,1500,Credit"""
    
    result = await process_financial_data(csv_content, "test.csv", "bank")
    
    print("=== PARSING TEST RESULTS ===")
    print(f"Metrics: {result.get('metrics')}")
    print(f"Parsed Data Length: {len(result.get('parsed_data', []))}")
    print(f"Parsed Data: {result.get('parsed_data')}")
    
    if len(result.get('parsed_data', [])) > 0:
        print("\n✅ SUCCESS: parsed_data is being generated")
    else:
        print("\n❌ FAILURE: parsed_data is empty")

if __name__ == "__main__":
    asyncio.run(test_parsing())

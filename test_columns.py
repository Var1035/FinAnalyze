"""
Debug script to see actual column names after normalization
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
import io
from backend.services.financial_analysis import normalize_columns

# Test CSV
csv_content = b"""Date,Description,Amount,Type
2024-01-01,Payment,5000,Credit
2024-01-02,Purchase,200,Debit"""

df = pd.read_csv(io.BytesIO(csv_content))

print("Original columns:", df.columns.tolist())
print("Normalized columns:", normalize_columns(df.columns))

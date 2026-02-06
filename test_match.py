"""
Test match_column function
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from backend.services.financial_analysis import match_column

cols = ['date', 'description', 'amount', 'type']

date_col = match_column(cols, ['date', 'txn_date', 'transaction_date', 'value_date'])
amount_col = match_column(cols, ['amount', 'txn_amount', 'transaction_amount', 'net_amount'])
type_col = match_column(cols, ['type', 'txn_type', 'transaction_type', 'dr_cr'])

print(f"Columns: {cols}")
print(f"date_col: {date_col}")
print(f"amount_col: {amount_col}")
print(f"type_col: {type_col}")

if date_col and amount_col and type_col:
    print("\n✅ All columns matched!")
else:
    print("\n❌ Some columns not matched")

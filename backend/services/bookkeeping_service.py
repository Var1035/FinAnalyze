"""
Bookkeeping Service - Auto-generate bookkeeping summaries from parsed financial data
This is bookkeeping assistance ONLY, NOT double-entry accounting.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


def classify_transaction(transaction: Dict[str, Any], upload_type: str) -> Dict[str, Any]:
    """
    Classify a transaction into bookkeeping categories.
    Returns classified transaction with category.
    """
    amount = float(transaction.get('amount', 0) or 0)
    credit = float(transaction.get('credit', 0) or 0)
    debit = float(transaction.get('debit', 0) or 0)
    description = str(transaction.get('description', '') or '').lower()
    
    # Determine transaction type based on upload type and values
    if upload_type == 'sales':
        return {
            'category': 'Income',
            'subcategory': 'Sales Revenue',
            'amount': amount or credit or 0,
            'date': transaction.get('date'),
            'description': transaction.get('description', '')
        }
    elif upload_type == 'purchase':
        # Categorize expenses based on description keywords
        subcategory = categorize_expense(description)
        return {
            'category': 'Expense',
            'subcategory': subcategory,
            'amount': amount or debit or 0,
            'date': transaction.get('date'),
            'description': transaction.get('description', '')
        }
    elif upload_type == 'bank':
        # Bank transactions can be either income or expense
        if credit > 0:
            return {
                'category': 'Income',
                'subcategory': 'Bank Credit',
                'amount': credit,
                'date': transaction.get('date'),
                'description': transaction.get('description', ''),
                'is_cash': True
            }
        elif debit > 0:
            subcategory = categorize_expense(description)
            return {
                'category': 'Expense',
                'subcategory': subcategory,
                'amount': debit,
                'date': transaction.get('date'),
                'description': transaction.get('description', ''),
                'is_cash': True
            }
    
    return {
        'category': 'Uncategorized',
        'subcategory': 'Other',
        'amount': amount or credit or debit or 0,
        'date': transaction.get('date'),
        'description': transaction.get('description', '')
    }


def categorize_expense(description: str) -> str:
    """
    Categorize expense based on description keywords.
    """
    description = description.lower() if description else ''
    
    # Category keywords mapping
    categories = {
        'Salary & Wages': ['salary', 'wages', 'payroll', 'employee', 'staff'],
        'Rent & Utilities': ['rent', 'lease', 'electricity', 'water', 'utility', 'power', 'gas'],
        'Office Supplies': ['office', 'stationery', 'supplies', 'printer', 'paper'],
        'Marketing & Advertising': ['marketing', 'advertising', 'promotion', 'ads', 'campaign'],
        'Travel & Transport': ['travel', 'transport', 'fuel', 'petrol', 'diesel', 'cab', 'taxi', 'flight'],
        'Professional Services': ['consulting', 'legal', 'accounting', 'professional', 'advisory'],
        'Raw Materials': ['material', 'raw', 'goods', 'inventory', 'stock', 'purchase'],
        'Equipment & Maintenance': ['equipment', 'machinery', 'repair', 'maintenance', 'service'],
        'Insurance': ['insurance', 'premium', 'policy'],
        'Bank Charges': ['bank', 'charge', 'fee', 'interest', 'commission'],
        'Taxes': ['tax', 'gst', 'vat', 'tds', 'duty'],
    }
    
    for category, keywords in categories.items():
        if any(keyword in description for keyword in keywords):
            return category
    
    return 'General Expenses'


def parse_date_month(date_str: Any) -> Optional[str]:
    """Extract month-year from date string for grouping."""
    if not date_str:
        return None
    
    try:
        # Try common date formats
        date_str = str(date_str)
        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%m/%d/%Y']:
            try:
                dt = datetime.strptime(date_str[:10], fmt)
                return dt.strftime('%b %Y')  # e.g., "Jan 2026"
            except ValueError:
                continue
        return None
    except Exception:
        return None


def generate_bookkeeping_summary(uploads_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a bookkeeping summary from all uploaded financial data.
    
    Args:
        uploads_data: List of upload records with parsed_data and file_type
    
    Returns:
        Structured bookkeeping summary
    """
    all_transactions = []
    monthly_income = defaultdict(float)
    monthly_expenses = defaultdict(float)
    expense_categories = defaultdict(float)
    cash_transactions = 0
    non_cash_transactions = 0
    total_income = 0
    total_expenses = 0
    
    for upload in uploads_data:
        upload_type = upload.get('file_type', 'bank')
        filename = str(upload.get('filename', ''))
        
        # Skip masqueraded auxiliary files
        if filename.startswith('[INVENTORY]') or filename.startswith('[LOAN]'):
            continue
            
        parsed_data = upload.get('parsed_data', [])
        
        if not parsed_data or not isinstance(parsed_data, list):
            continue
        
        for transaction in parsed_data:
            if not isinstance(transaction, dict):
                continue
            
            classified = classify_transaction(transaction, upload_type)
            all_transactions.append(classified)
            
            amount = classified.get('amount', 0) or 0
            month = parse_date_month(classified.get('date'))
            
            if classified['category'] == 'Income':
                total_income += amount
                if month:
                    monthly_income[month] += amount
            elif classified['category'] == 'Expense':
                total_expenses += amount
                expense_categories[classified['subcategory']] += amount
                if month:
                    monthly_expenses[month] += amount
            
            # Track cash vs non-cash
            if classified.get('is_cash'):
                cash_transactions += 1
            else:
                non_cash_transactions += 1
    
    # Sort expense categories by amount
    sorted_categories = sorted(
        expense_categories.items(),
        key=lambda x: x[1],
        reverse=True
    )
    
    # Sort monthly data
    def month_sort_key(month_str):
        try:
            return datetime.strptime(month_str, '%b %Y')
        except:
            return datetime.min
    
    sorted_monthly_income = sorted(monthly_income.items(), key=lambda x: month_sort_key(x[0]))
    sorted_monthly_expenses = sorted(monthly_expenses.items(), key=lambda x: month_sort_key(x[0]))
    
    return {
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'net_balance': round(total_income - total_expenses, 2),
        'monthly_income': [
            {'month': m, 'amount': round(a, 2)} for m, a in sorted_monthly_income
        ],
        'monthly_expenses': [
            {'month': m, 'amount': round(a, 2)} for m, a in sorted_monthly_expenses
        ],
        'expense_categories': [
            {'category': cat, 'amount': round(amt, 2)} for cat, amt in sorted_categories[:10]
        ],
        'cash_transactions': cash_transactions,
        'non_cash_transactions': non_cash_transactions,
        'total_transactions': len(all_transactions),
        'has_sufficient_data': len(all_transactions) >= 3
    }

"""
Inventory & Loan Service - Process inventory and loan data uploads
Optional data extensions for SME financial tracking
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


# ============================================
# INVENTORY PROCESSING
# ============================================

def process_inventory_data(parsed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process inventory upload data.
    
    Expected fields: item_name, quantity, unit_value
    
    Returns:
        Inventory summary with total items and value
    """
    if not parsed_data or not isinstance(parsed_data, list):
        return {
            'total_items': 0,
            'total_value': 0,
            'items': [],
            'has_data': False
        }
    
    items = []
    total_value = 0.0
    total_quantity = 0
    
    for record in parsed_data:
        if not isinstance(record, dict):
            continue
        
        item_name = str(record.get('item_name', '') or 
                       record.get('name', '') or 
                       record.get('product', '') or 
                       record.get('description', '') or 'Unknown')
        
        quantity = float(record.get('quantity', 0) or 
                        record.get('qty', 0) or 
                        record.get('stock', 0) or 0)
        
        unit_value = float(record.get('unit_value', 0) or 
                          record.get('value', 0) or 
                          record.get('price', 0) or 
                          record.get('rate', 0) or 0)
        
        item_total = quantity * unit_value
        total_value += item_total
        total_quantity += int(quantity)
        
        items.append({
            'item_name': item_name,
            'quantity': int(quantity),
            'unit_value': round(unit_value, 2),
            'total_value': round(item_total, 2)
        })
    
    return {
        'total_items': len(items),
        'total_quantity': total_quantity,
        'total_value': round(total_value, 2),
        'items': items[:20],  # Limit to top 20 items
        'has_data': len(items) > 0
    }


def get_inventory_summary(uploads_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Get inventory summary from all inventory uploads.
    """
    inventory_uploads = [
        u for u in uploads_data 
        if u.get('file_type') == 'inventory' or 
        (u.get('file_type') == 'bank' and str(u.get('filename', '')).startswith('[INVENTORY]'))
    ]
    
    if not inventory_uploads:
        return {
            'total_items': 0,
            'total_value': 0,
            'has_data': False
        }
    
    # Aggregate from all inventory uploads
    all_items = []
    total_value = 0.0
    total_quantity = 0
    
    for upload in inventory_uploads:
        parsed_data = upload.get('parsed_data', [])
        result = process_inventory_data(parsed_data)
        all_items.extend(result.get('items', []))
        total_value += result.get('total_value', 0)
        total_quantity += result.get('total_quantity', 0)
    
    return {
        'total_items': len(all_items),
        'total_quantity': total_quantity,
        'total_value': round(total_value, 2),
        'top_items': sorted(all_items, key=lambda x: x['total_value'], reverse=True)[:10],
        'has_data': len(all_items) > 0
    }


# ============================================
# LOAN OBLIGATIONS PROCESSING
# ============================================

def process_loan_data(parsed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Process loan obligations data.
    
    Expected fields: lender, outstanding_amount, monthly_emi, interest_rate (optional)
    
    Returns:
        Loan summary with total outstanding and EMI
    """
    if not parsed_data or not isinstance(parsed_data, list):
        return {
            'total_outstanding': 0,
            'total_monthly_emi': 0,
            'loans': [],
            'has_data': False
        }
    
    loans = []
    total_outstanding = 0.0
    total_emi = 0.0
    
    for record in parsed_data:
        if not isinstance(record, dict):
            continue
        
        lender = str(record.get('lender', '') or 
                    record.get('bank', '') or 
                    record.get('institution', '') or 
                    record.get('name', '') or 'Unknown')
        
        outstanding = float(record.get('outstanding_amount', 0) or 
                           record.get('outstanding', 0) or 
                           record.get('principal', 0) or 
                           record.get('amount', 0) or 0)
        
        emi = float(record.get('monthly_emi', 0) or 
                   record.get('emi', 0) or 
                   record.get('installment', 0) or 0)
        
        interest_rate = float(record.get('interest_rate', 0) or 
                             record.get('rate', 0) or 
                             record.get('interest', 0) or 0)
        
        total_outstanding += outstanding
        total_emi += emi
        
        loans.append({
            'lender': lender,
            'outstanding_amount': round(outstanding, 2),
            'monthly_emi': round(emi, 2),
            'interest_rate': round(interest_rate, 2) if interest_rate > 0 else None
        })
    
    return {
        'total_outstanding': round(total_outstanding, 2),
        'total_monthly_emi': round(total_emi, 2),
        'loan_count': len(loans),
        'loans': loans,
        'has_data': len(loans) > 0
    }


def get_loan_summary(uploads_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Get loan obligations summary from all loan uploads.
    """
    loan_uploads = [
        u for u in uploads_data 
        if u.get('file_type') == 'loan' or 
        (u.get('file_type') == 'bank' and str(u.get('filename', '')).startswith('[LOAN]'))
    ]
    
    if not loan_uploads:
        return {
            'total_outstanding': 0,
            'total_monthly_emi': 0,
            'loan_count': 0,
            'has_data': False
        }
    
    # Aggregate from all loan uploads
    all_loans = []
    total_outstanding = 0.0
    total_emi = 0.0
    
    for upload in loan_uploads:
        parsed_data = upload.get('parsed_data', [])
        result = process_loan_data(parsed_data)
        all_loans.extend(result.get('loans', []))
        total_outstanding += result.get('total_outstanding', 0)
        total_emi += result.get('total_monthly_emi', 0)
    
    # Calculate EMI burden ratio (if cash outflow exists)
    return {
        'total_outstanding': round(total_outstanding, 2),
        'total_monthly_emi': round(total_emi, 2),
        'loan_count': len(all_loans),
        'loans': all_loans,
        'has_data': len(all_loans) > 0
    }

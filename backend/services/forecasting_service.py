"""
Financial Forecasting Service - Rule-based forecasting using historical averages
NO AI/ML - purely deterministic calculations
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)


def parse_date_month_year(date_str: Any) -> Optional[tuple]:
    """Extract (year, month) tuple from date string for ordering."""
    if not date_str:
        return None
    
    try:
        date_str = str(date_str)
        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%m/%d/%Y']:
            try:
                dt = datetime.strptime(date_str[:10], fmt)
                return (dt.year, dt.month)
            except ValueError:
                continue
        return None
    except Exception:
        return None


def get_month_label(year: int, month: int) -> str:
    """Convert year/month to readable label."""
    try:
        return datetime(year, month, 1).strftime('%b %Y')
    except:
        return f"{month}/{year}"


def generate_forecast(uploads_data: List[Dict[str, Any]], current_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate 3-month financial forecast based on historical averages.
    
    Args:
        uploads_data: List of upload records with parsed_data and file_type
        current_metrics: Current aggregated metrics
    
    Returns:
        3-month forecast with projections
    """
    # Aggregate monthly data from parsed transactions
    monthly_revenue = defaultdict(float)
    monthly_expenses = defaultdict(float)
    monthly_cash_in = defaultdict(float)
    monthly_cash_out = defaultdict(float)
    
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
            
            month_key = parse_date_month_year(transaction.get('date'))
            if not month_key:
                continue
            
            amount = float(transaction.get('amount', 0) or 0)
            credit = float(transaction.get('credit', 0) or 0)
            debit = float(transaction.get('debit', 0) or 0)
            
            if upload_type == 'sales':
                monthly_revenue[month_key] += amount or credit
            elif upload_type == 'purchase':
                monthly_expenses[month_key] += amount or debit
            elif upload_type == 'bank':
                if credit > 0:
                    monthly_cash_in[month_key] += credit
                if debit > 0:
                    monthly_cash_out[month_key] += debit
    
    # Get last 3 months of data (sorted by date)
    all_months = set(monthly_revenue.keys()) | set(monthly_expenses.keys()) | \
                 set(monthly_cash_in.keys()) | set(monthly_cash_out.keys())
    
    sorted_months = sorted(all_months, reverse=True)[:3]  # Last 3 months
    
    if len(sorted_months) < 1:
        # Not enough data - use current metrics as fallback
        if current_metrics:
            avg_revenue = current_metrics.get('total_revenue', 0)
            avg_expenses = current_metrics.get('total_expenses', 0)
            avg_cash_in = current_metrics.get('cash_inflow', 0)
            avg_cash_out = current_metrics.get('cash_outflow', 0)
        else:
            return {
                'has_sufficient_data': False,
                'message': 'Not enough historical data to forecast',
                'monthly_projections': [],
                'summary': {}
            }
    else:
        # Calculate averages from historical data
        n = len(sorted_months)
        avg_revenue = sum(monthly_revenue.get(m, 0) for m in sorted_months) / n
        avg_expenses = sum(monthly_expenses.get(m, 0) for m in sorted_months) / n
        avg_cash_in = sum(monthly_cash_in.get(m, 0) for m in sorted_months) / n
        avg_cash_out = sum(monthly_cash_out.get(m, 0) for m in sorted_months) / n
    
    # If averages are zero, try to use current metrics
    if avg_revenue == 0 and current_metrics:
        avg_revenue = current_metrics.get('total_revenue', 0) / 3  # Assume 3 months
    if avg_expenses == 0 and current_metrics:
        avg_expenses = current_metrics.get('total_expenses', 0) / 3
    if avg_cash_in == 0 and current_metrics:
        avg_cash_in = current_metrics.get('cash_inflow', 0) / 3
    if avg_cash_out == 0 and current_metrics:
        avg_cash_out = current_metrics.get('cash_outflow', 0) / 3
    
    # Generate projections for next 3 months
    now = datetime.now()
    projections = []
    
    cumulative_cash = 0
    for i in range(1, 4):  # Next 3 months
        month = (now.month + i - 1) % 12 + 1
        year = now.year + ((now.month + i - 1) // 12)
        
        projected_revenue = round(avg_revenue, 2)
        projected_expenses = round(avg_expenses, 2)
        projected_cash_in = round(avg_cash_in, 2)
        projected_cash_out = round(avg_cash_out, 2)
        net_cash = round(projected_cash_in - projected_cash_out, 2)
        cumulative_cash += net_cash
        
        projections.append({
            'month': get_month_label(year, month),
            'projected_revenue': projected_revenue,
            'projected_expenses': projected_expenses,
            'projected_profit': round(projected_revenue - projected_expenses, 2),
            'projected_cash_inflow': projected_cash_in,
            'projected_cash_outflow': projected_cash_out,
            'net_cash_movement': net_cash,
            'cumulative_cash_movement': round(cumulative_cash, 2)
        })
    
    # Summary
    total_projected_revenue = sum(p['projected_revenue'] for p in projections)
    total_projected_expenses = sum(p['projected_expenses'] for p in projections)
    total_net_cash = sum(p['net_cash_movement'] for p in projections)
    
    return {
        'has_sufficient_data': True,
        'data_months_used': len(sorted_months) if sorted_months else 1,
        'monthly_projections': projections,
        'summary': {
            'total_3month_revenue': round(total_projected_revenue, 2),
            'total_3month_expenses': round(total_projected_expenses, 2),
            'total_3month_profit': round(total_projected_revenue - total_projected_expenses, 2),
            'total_net_cash_movement': round(total_net_cash, 2),
            'avg_monthly_revenue': round(avg_revenue, 2),
            'avg_monthly_expenses': round(avg_expenses, 2)
        },
        'disclaimer': 'Rule-based estimate for planning purposes. Based on historical averages only.'
    }

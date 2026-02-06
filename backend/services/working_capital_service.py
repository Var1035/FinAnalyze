"""
Working Capital Service - Calculate working capital health from financial data
All calculations are deterministic based on parsed data
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def calculate_working_capital(
    uploads_data: List[Dict[str, Any]],
    metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate working capital health metrics.
    
    Args:
        uploads_data: List of upload records with parsed_data and file_type
        metrics: Current aggregated financial metrics
    
    Returns:
        Working capital health assessment
    """
    # Get receivables and payables from metrics
    total_receivables = metrics.get('total_receivables', 0) or 0
    total_payables = metrics.get('total_payables', 0) or 0
    monthly_revenue = (metrics.get('total_revenue', 0) or 0) / 3  # Assume 3 months average
    
    # Calculate from parsed_data if metrics are zero
    if total_receivables == 0 or total_payables == 0:
        calc_receivables, calc_payables = calculate_from_parsed_data(uploads_data)
        if total_receivables == 0:
            total_receivables = calc_receivables
        if total_payables == 0:
            total_payables = calc_payables
    
    # Calculate working capital gap
    working_capital_gap = total_receivables - total_payables
    
    # Risk classification
    risk_level = classify_risk(working_capital_gap, monthly_revenue)
    
    # Generate key observations
    observations = generate_observations(
        total_receivables, total_payables, working_capital_gap, risk_level, monthly_revenue
    )
    
    # Check if we have sufficient data
    has_sufficient_data = (total_receivables > 0 or total_payables > 0 or 
                           metrics.get('total_revenue', 0) > 0)
    
    return {
        'receivables': round(total_receivables, 2),
        'payables': round(total_payables, 2),
        'working_capital_gap': round(working_capital_gap, 2),
        'risk_level': risk_level,
        'key_observations': observations,
        'has_sufficient_data': has_sufficient_data
    }


def calculate_from_parsed_data(uploads_data: List[Dict[str, Any]]) -> tuple:
    """
    Calculate receivables and payables from parsed transaction data.
    """
    receivables = 0.0
    payables = 0.0
    
    for upload in uploads_data:
        upload_type = upload.get('file_type', '')
        parsed_data = upload.get('parsed_data', [])
        
        if not parsed_data or not isinstance(parsed_data, list):
            continue
        
        for transaction in parsed_data:
            if not isinstance(transaction, dict):
                continue
            
            status = str(transaction.get('status', '')).lower()
            amount = float(transaction.get('amount', 0) or 0)
            credit = float(transaction.get('credit', 0) or 0)
            debit = float(transaction.get('debit', 0) or 0)
            
            # Unpaid sales = receivables
            if upload_type == 'sales':
                if status in ['pending', 'unpaid', 'outstanding', 'due', '']:
                    receivables += amount or credit
            
            # Unpaid purchases = payables
            elif upload_type == 'purchase':
                if status in ['pending', 'unpaid', 'outstanding', 'due', '']:
                    payables += amount or debit
    
    return receivables, payables


def classify_risk(gap: float, monthly_revenue: float) -> str:
    """
    Classify working capital risk level.
    
    - Low: gap <= 0 (payables >= receivables)
    - Medium: gap > 0 and <= 30% of monthly revenue
    - High: gap > 30% of monthly revenue
    """
    if gap <= 0:
        return 'Low'
    
    if monthly_revenue <= 0:
        # If no revenue data, use absolute threshold
        if gap > 100000:  # ₹1 lakh threshold
            return 'High'
        return 'Medium'
    
    gap_ratio = gap / monthly_revenue
    
    if gap_ratio <= 0.30:
        return 'Medium'
    else:
        return 'High'


def generate_observations(
    receivables: float,
    payables: float,
    gap: float,
    risk_level: str,
    monthly_revenue: float
) -> List[str]:
    """
    Generate key observations about working capital health.
    """
    observations = []
    
    if receivables > 0:
        observations.append(f"₹{receivables:,.0f} tied up in receivables (unpaid invoices)")
    
    if payables > 0:
        observations.append(f"₹{payables:,.0f} in pending payables to suppliers/vendors")
    
    if gap > 0:
        observations.append(f"Working capital gap of ₹{gap:,.0f} indicates cash is blocked")
        if risk_level == 'High':
            observations.append("⚠️ High risk: Consider faster receivable collection")
        elif risk_level == 'Medium':
            observations.append("Monitor receivables closely to maintain liquidity")
    elif gap < 0:
        observations.append(f"Positive working capital position: payables exceed receivables by ₹{abs(gap):,.0f}")
        observations.append("✅ Healthy cash flow position")
    else:
        observations.append("Balanced working capital: receivables equal payables")
    
    if receivables > 0 and monthly_revenue > 0:
        receivable_days = (receivables / monthly_revenue) * 30
        if receivable_days > 45:
            observations.append(f"Average receivable period: ~{receivable_days:.0f} days (consider faster collection)")
        elif receivable_days > 0:
            observations.append(f"Average receivable period: ~{receivable_days:.0f} days")
    
    return observations

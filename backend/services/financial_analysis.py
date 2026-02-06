
import pandas as pd
import io
import re
import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ============================================================
# A) COLUMN NORMALIZATION & ALIAS DICTIONARIES
# ============================================================

COLUMN_ALIASES = {
    # Date columns
    "date": ["date", "txn_date", "transaction_date", "invoice_date", "bill_date", 
             "posting_date", "value_date", "trans_date", "entry_date", "voucher_date"],
    
    # Amount columns
    "amount": ["amount", "total", "value", "amt", "net_amount", "gross_amount",
               "txn_amount", "transaction_amount", "invoice_amount", "bill_amount"],
    
    # Credit/Revenue columns
    "credit": ["credit", "cr", "income", "receipt", "receipts", "deposits", 
               "credit_amount", "inflow", "sales", "revenue"],
    
    # Debit/Expense columns
    "debit": ["debit", "dr", "expense", "payment", "payments", "withdrawals",
              "debit_amount", "outflow", "purchase", "cost"],
    
    # Type/Direction indicator
    "type": ["type", "txn_type", "transaction_type", "dr_cr", "cr_dr", 
             "direction", "nature", "indicator"],
    
    # Description columns
    "description": ["description", "desc", "narration", "particulars", "details",
                    "remarks", "memo", "notes"],
    
    # Status columns
    "status": ["status", "payment_status", "invoice_status", "bill_status", "paid"],
    
    # Customer/Vendor columns
    "party": ["customer", "client", "party", "vendor", "supplier", "buyer", "seller", "name"]
}

# Required fields per upload type
REQUIRED_FIELDS = {
    "bank": ["date", ("credit", "debit", "amount")],  # Need date + (credit/debit OR amount)
    "sales": ["date", ("amount", "credit")],           # Need date + amount
    "purchase": ["date", ("amount", "debit")]          # Need date + amount
}

def normalize_column_name(col: str) -> str:
    """Normalize a single column name: lowercase, strip, remove special chars."""
    if pd.isna(col) or col is None:
        return ""
    s = str(col).lower().strip()
    # Replace spaces, dots, underscores with single underscore
    s = re.sub(r'[\s._-]+', '_', s)
    # Remove special characters except underscore
    s = re.sub(r'[^a-z0-9_]', '', s)
    return s

def match_column_to_standard(col: str) -> Tuple[Optional[str], int]:
    """
    Match a column name to a standard field using alias dictionary.
    Returns (standard_field_name, confidence_score 0-100).
    """
    normalized = normalize_column_name(col)
    
    if not normalized:
        return None, 0
    
    # Exact match first (100% confidence)
    for standard, aliases in COLUMN_ALIASES.items():
        if normalized in aliases:
            return standard, 100
    
    # Partial match (80% confidence)
    for standard, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized or normalized in alias:
                return standard, 80
    
    return None, 0

def analyze_column_mapping(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze DataFrame columns and create mapping to standard fields.
    Returns mapping with confidence scores.
    """
    original_columns = df.columns.tolist()
    mapping = {}
    unmapped = []
    min_confidence = 100
    
    for col in original_columns:
        standard_field, confidence = match_column_to_standard(col)
        
        if standard_field:
            mapping[col] = {
                "standard": standard_field,
                "confidence": confidence
            }
            if confidence < min_confidence:
                min_confidence = confidence
        else:
            unmapped.append(col)
    
    logger.info(f"Column mapping: {mapping}")
    logger.info(f"Unmapped columns: {unmapped}")
    logger.info(f"Minimum confidence: {min_confidence}%")
    
    return {
        "mapping": mapping,
        "unmapped": unmapped,
        "min_confidence": min_confidence,
        "original_columns": original_columns
    }

def validate_required_fields(mapping: Dict, upload_type: str) -> Tuple[bool, List[str]]:
    """
    Validate that required fields are present for the upload type.
    Returns (is_valid, list_of_missing_fields).
    """
    # Special bypass for direct parsing types
    if upload_type in ['inventory', 'loan']:
        return True, []

    required = REQUIRED_FIELDS.get(upload_type, [])
    mapped_standards = {v["standard"] for v in mapping.values()}
    missing = []
    
    for req in required:
        if isinstance(req, tuple):
            # At least one of these must be present
            if not any(r in mapped_standards for r in req):
                missing.append(f"one of: {', '.join(req)}")
        else:
            # This exact field must be present
            if req not in mapped_standards:
                missing.append(req)
    
    return len(missing) == 0, missing

# ============================================================
# B) DATA PARSING WITH VALIDATED MAPPING
# ============================================================

def sanitize_value(val: Any) -> Any:
    """Convert value to JSON-safe format."""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (np.integer, np.floating)):
        return float(val)
    if isinstance(val, np.bool_):
        return bool(val)
    return str(val)

def clean_amount(val: Any) -> float:
    """Clean any value to a float amount."""
    if pd.isna(val) or val is None:
        return 0.0
    if isinstance(val, (int, float, np.integer, np.floating)):
        return float(val)
    
    s = str(val).strip()
    if not s:
        return 0.0
    
    # Remove currency symbols and commas
    s = re.sub(r'[$₹€£,\s]', '', s)
    # Handle brackets for negative
    if s.startswith('(') and s.endswith(')'):
        s = '-' + s[1:-1]
        
    try:
        return float(s)
    except ValueError:
        return 0.0

def parse_with_mapping(df: pd.DataFrame, mapping: Dict, upload_type: str) -> List[Dict[str, Any]]:
    """
    Parse DataFrame rows using the validated column mapping.
    Returns list of standardized record objects.
    """
    # Create reverse mapping: standard_field -> original_column
    std_to_orig = {}
    for orig_col, info in mapping.items():
        std = info["standard"]
        if std not in std_to_orig:  # Keep first match
            std_to_orig[std] = orig_col
    
    logger.info(f"Standard to original mapping: {std_to_orig}")
    
    parsed_rows = []
    
    for idx, row in df.iterrows():
        try:
            record = {}
            
            # Date
            if "date" in std_to_orig:
                date_val = row[std_to_orig["date"]]
                record["date"] = str(date_val) if pd.notna(date_val) else None
            else:
                record["date"] = str(idx)
            
            # Amount - try different approaches based on available columns
            amount = 0.0
            direction = "credit"  # Default
            
            if "credit" in std_to_orig and "debit" in std_to_orig:
                # Separate credit/debit columns
                credit_val = clean_amount(row[std_to_orig["credit"]])
                debit_val = clean_amount(row[std_to_orig["debit"]])
                if credit_val > 0:
                    amount = credit_val
                    direction = "credit"
                elif debit_val > 0:
                    amount = debit_val
                    direction = "debit"
            elif "amount" in std_to_orig:
                # Single amount column
                amount = clean_amount(row[std_to_orig["amount"]])
                if "type" in std_to_orig:
                    type_val = str(row[std_to_orig["type"]]).lower()
                    if any(x in type_val for x in ["debit", "dr", "expense", "payment"]):
                        direction = "debit"
                    else:
                        direction = "credit"
                elif amount < 0:
                    direction = "debit"
                    amount = abs(amount)
            elif "credit" in std_to_orig:
                amount = clean_amount(row[std_to_orig["credit"]])
                direction = "credit"
            elif "debit" in std_to_orig:
                amount = clean_amount(row[std_to_orig["debit"]])
                direction = "debit"
            
            if amount == 0:
                continue  # Skip zero-amount rows
            
            record["amount"] = float(amount)
            record["direction"] = direction
            
            # Status
            if "status" in std_to_orig:
                status_val = str(row[std_to_orig["status"]]).lower()
                if any(x in status_val for x in ["unpaid", "pending", "due", "overdue"]):
                    record["status"] = "unpaid"
                else:
                    record["status"] = "paid"
            else:
                record["status"] = "paid"
            
            # Description
            if "description" in std_to_orig:
                desc_val = row[std_to_orig["description"]]
                record["description"] = str(desc_val) if pd.notna(desc_val) else ""
            
            parsed_rows.append(record)
            
        except Exception as e:
            logger.warning(f"Row {idx} parse error: {e}")
            continue
    
    return parsed_rows

def compute_metrics(parsed_rows: List[Dict], upload_type: str) -> Dict[str, float]:
    """Compute financial metrics from parsed rows."""
    if not parsed_rows:
        return {}
    
    total_credit = sum(r["amount"] for r in parsed_rows if r.get("direction") == "credit")
    total_debit = sum(r["amount"] for r in parsed_rows if r.get("direction") == "debit")
    total_unpaid = sum(r["amount"] for r in parsed_rows if r.get("status") == "unpaid")
    
    if upload_type == "bank":
        return {
            "cash_inflow": total_credit,
            "cash_outflow": total_debit
        }
    elif upload_type == "sales":
        return {
            "total_revenue": total_credit + total_debit,
            "total_receivables": total_unpaid
        }
    elif upload_type == "purchase":
        return {
            "total_expenses": total_credit + total_debit,
            "total_payables": total_unpaid
        }
    
    return {}

# ============================================================
# C) MAIN PROCESSING FUNCTION
# ============================================================

async def process_financial_data(file_contents: bytes, filename: str, upload_type: str) -> Dict[str, Any]:
    """
    Process uploaded file with smart column mapping.
    Returns parsed_data, metrics, and mapping info for UI confirmation.
    """
    logger.info(f"=== PROCESSING: {filename} (type: {upload_type}) ===")
    
    try:
        # Read the file into DataFrame
        df = None
        if filename.lower().endswith('.csv'):
            try:
                df = pd.read_csv(io.BytesIO(file_contents))
            except:
                df = pd.read_csv(io.BytesIO(file_contents), encoding='latin1')
        elif filename.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_contents), sheet_name=0)
        else:
            raise ValueError("Unsupported file format. Please upload CSV or XLSX.")
        
        if df.empty:
            raise ValueError("Uploaded file has no rows")
        

        # Drop completely empty rows
        df = df.dropna(how='all')

        logger.info(f"Loaded {len(df)} rows with columns: {df.columns.tolist()}")

        if upload_type in ['inventory', 'loan']:
            # DIRECT PARSING OVERRIDE (Requirements Part A & B)
            # Bypass standard mapping logic entirely for these types
            logger.info(f"Using direct parsing for {upload_type}")

            # Create a 1:1 mapping for UI display purposes (so user sees what they uploaded)
            mapping = {col: {"standard": col, "confidence": 100} for col in df.columns}
            confidence = 100
            
            mapping_result = {
                "mapping": mapping,
                "min_confidence": 100,
                "missing": []
            }

            # Convert DF directly to record list
            # Handle NaN values explicitly
            df_filled = df.where(pd.notnull(df), None)
            parsed_data = df_filled.to_dict(orient='records')

            # No financial metrics for these auxiliary types
            metrics = {}

            # Map specific fields if needed for downstream services, but generally pass raw
            # The downstream specific services (inventory_loan_service) handle the specific field validation

        else:
            # STANDARD FINANCIAL PARSING (Bank/Sales/Purchase)

            # A) Analyze column mapping
            mapping_result = analyze_column_mapping(df)
            mapping = mapping_result["mapping"]
            confidence = mapping_result["min_confidence"]

            # B) Validate required fields
            is_valid, missing = validate_required_fields(mapping, upload_type)

            if not is_valid:
                error_msg = f"Missing required fields for {upload_type}: {', '.join(missing)}"
                logger.error(error_msg)
                raise ValueError(error_msg)

            # C) Parse data using mapping
            parsed_data = parse_with_mapping(df, mapping, upload_type)

            # D) Compute metrics
            metrics = compute_metrics(parsed_data, upload_type)

        if not parsed_data:
            raise ValueError("No valid data rows could be parsed. Check column names and data format.")

        logger.info(f"✅ Parsed {len(parsed_data)} rows successfully")
        logger.info(f"✅ Metrics: {metrics}")
        
        return {
            "metrics": metrics,
            "parsed_data": parsed_data,
            "column_mapping": mapping_result,
            "confidence": confidence,
            "rows_parsed": len(parsed_data)
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to process file: {str(e)}")

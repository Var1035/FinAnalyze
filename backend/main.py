
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal, Dict, Any, List, Optional
from pydantic import BaseModel
import logging
import json
import os
from dotenv import load_dotenv
import uvicorn

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

# --------------------------------------------------
# Create FastAPI app  ✅ THIS WAS MISSING
# --------------------------------------------------
app = FastAPI(
    title="FinAnalyze API",
    version="1.0.0"
)

# --------------------------------------------------
# CORS (important for frontend like Netlify)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # change later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Basic routes (health check)
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "FinAnalyze backend running successfully"}

@app.get("/health")
def health():
    return {"status": "ok"}

# --------------------------------------------------
# Start server (Railway compatible)
# --------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

load_dotenv()

from backend.db_client import supabase
from backend.services.financial_analysis import process_financial_data


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SME Financial Backend", version="1.0.0")

# CORS Setup
origins = ["*"]  # Allow all for hackathon/dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetricsResponse(BaseModel):
    total_revenue: float
    total_expenses: float
    cash_inflow: float
    cash_outflow: float
    total_receivables: float
    total_payables: float
    net_profit: float
    profit_margin: float


async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Extract user from JWT token in Authorization header.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        # Extract token (format: "Bearer <token>")
        token = authorization.replace("Bearer ", "").strip()
        
        # Verify token with Supabase
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = response.user.id
        logger.info(f"Authenticated user: {user_id}")
        return user_id
        
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Financial Backend is running"}

@app.post("/upload/financials")
async def upload_financials(
    file: UploadFile = File(...),
    type: Literal['bank', 'sales', 'purchase', 'inventory', 'loan'] = Form(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a financial file (CSV/XLSX) - PREVIEW AND STORE.
    Returns parsed data for frontend display, then stores to database.
    """
    try:
        content = await file.read()
        logger.info(f"Received upload: {file.filename} of type {type} for user {user_id}")
        
        logger.info(f"Received upload: {file.filename} of type {type} for user {user_id}")
        
        result = await process_financial_data(content, file.filename, type)
        metrics = result.get("metrics", {})
        parsed_data = result.get("parsed_data", [])
        
        logger.info(f"✅ Parsed {len(parsed_data)} rows")
        logger.info(f"✅ Metrics: {metrics}")
        
        if not parsed_data:
            raise HTTPException(status_code=400, detail="No data could be parsed from the file")
        
        # Log first few rows for debugging
        for i, row in enumerate(parsed_data[:3]):
            logger.info(f"Row {i}: {row}")
        
        filename = file.filename or "uploaded_file.csv"
        
        filename = file.filename or "uploaded_file.csv"
        
        # DB CONSTRAINT WORKAROUND: Masquerade 'inventory' and 'loan' as 'bank'
        # but prepend specific tag to filename for downstream identification.
        
        db_type = type
        db_filename = filename
        
        if type in ['inventory', 'loan']:
            db_type = 'bank' # Masquerade as allowed type
            tag = f"[{type.upper()}]"
            if not db_filename.startswith(tag):
                db_filename = f"{tag} {db_filename}"
                
        upload_data = {
            "user_id": user_id,
            "filename": db_filename,
            "file_type": db_type,
            "processing_status": "completed",
            "parsed_data": parsed_data
        }
        
        logger.info(f"=== STORING TO DATABASE ===")
        logger.info(f"Storing {len(parsed_data)} rows to financial_uploads")
        
        res_upload = supabase.table("financial_uploads").insert(upload_data).execute()
        if not res_upload.data:
            raise HTTPException(status_code=500, detail="Failed to save upload record")
            
        upload_id = res_upload.data[0]['id']
        logger.info(f"✅ Upload saved with ID: {upload_id}")
        
        # Fetch existing metrics for this user
        existing_metrics = supabase.table("financial_metrics").select("*").eq("user_id", user_id).execute()
        
        current = existing_metrics.data[0] if existing_metrics.data else {}
        
        new_total_revenue = current.get("total_revenue", 0) + metrics.get("total_revenue", 0)
        new_total_expenses = current.get("total_expenses", 0) + metrics.get("total_expenses", 0)
        new_cash_inflow = current.get("cash_inflow", 0) + metrics.get("cash_inflow", 0)
        new_cash_outflow = current.get("cash_outflow", 0) + metrics.get("cash_outflow", 0)
        new_receivables = current.get("total_receivables", 0) + metrics.get("total_receivables", 0)
        new_payables = current.get("total_payables", 0) + metrics.get("total_payables", 0)
        
        new_payables = current.get("total_payables", 0) + metrics.get("total_payables", 0)
        
        new_net_profit = new_total_revenue - new_total_expenses
        new_profit_margin = (new_net_profit / new_total_revenue * 100) if new_total_revenue > 0 else 0.0
        
        metrics_payload = {
            "user_id": user_id,
            "upload_id": upload_id,  # Use latest upload_id (required NOT NULL field)
            "total_revenue": new_total_revenue,
            "total_expenses": new_total_expenses,
            "cash_inflow": new_cash_inflow,
            "cash_outflow": new_cash_outflow,
            "total_receivables": new_receivables,
            "total_payables": new_payables,
            "net_profit": new_net_profit,
            "profit_margin": new_profit_margin
        }
        
        logger.info(f"=== UPSERT METRICS ===")
        logger.info(f"Previous: {current}")
        logger.info(f"New values: {metrics_payload}")
        
        if existing_metrics.data:
            # UPDATE existing record using user_id as key
            res_metrics = supabase.table("financial_metrics").update(metrics_payload).eq("user_id", user_id).execute()
            logger.info(f"✅ Metrics UPDATED: {res_metrics.data}")
        else:
            # INSERT new record
            res_metrics = supabase.table("financial_metrics").insert(metrics_payload).execute()
            logger.info(f"✅ Metrics INSERTED: {res_metrics.data}")
        
        return {
            "message": "File processed and saved successfully", 
            "upload_id": upload_id,
            "rows_parsed": len(parsed_data),
            "parsed_data": parsed_data,
            "metrics": metrics,
            "column_mapping": result.get("column_mapping"),
            "confidence": result.get("confidence", 100)
        }

    except Exception as e:
        logger.error(f"❌ Error processing upload: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics/overview", response_model=MetricsResponse)
async def get_metrics_overview(user_id: str = Depends(get_current_user)):
    """
    Get financial metrics for the authenticated user.
    Returns single consolidated metrics record.
    """
    try:
        logger.info(f"Fetching metrics for user: {user_id}")
        
        # Fetch single metrics record for this user
        response = supabase.table("financial_metrics").select("*").eq("user_id", user_id).limit(1).execute()
        
        if not response.data:
            logger.info(f"No metrics found for user {user_id}")
            return MetricsResponse(
                total_revenue=0, total_expenses=0,
                cash_inflow=0, cash_outflow=0,
                total_receivables=0, total_payables=0,
                net_profit=0, profit_margin=0
            )
        
        data = response.data[0]
        logger.info(f"✅ Metrics found: {data}")
        
        return MetricsResponse(
            total_revenue=data.get("total_revenue", 0),
            total_expenses=data.get("total_expenses", 0),
            cash_inflow=data.get("cash_inflow", 0),
            cash_outflow=data.get("cash_outflow", 0),
            total_receivables=data.get("total_receivables", 0),
            total_payables=data.get("total_payables", 0),
            net_profit=data.get("net_profit", 0),
            profit_margin=data.get("profit_margin", 0)
        )
        
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




class AIExplanationRequest(BaseModel):
    system_prompt: str
    user_prompt: str
    section: str
    status: str
    metrics: Dict[str, Any]
    language: str

class AIExplanationResponse(BaseModel):
    explanation: str
    error: Optional[str] = None

@app.post("/api/ai/explain", response_model=AIExplanationResponse)
async def get_ai_explanation(
    request: AIExplanationRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Generate AI explanation using Mistral API.
    Only uses provided metrics context - no raw data access.
    """
    import os
    import httpx
    
    try:
        logger.info(f"AI explanation request for section: {request.section}, language: {request.language}")
        
        # Get Mistral API key from environment
        mistral_api_key = os.getenv("MISTRAL_API_KEY")
        
        if not mistral_api_key:
            logger.warning("MISTRAL_API_KEY not set, using fallback explanation")
            # Return a helpful fallback if API key not configured
            fallback_messages = {
                'en': f"Based on your {request.section} status ({request.status}): Your financial data shows the metrics provided. For detailed AI-powered insights, please configure the Mistral API key.",
                'hi': f"आपकी {request.section} स्थिति ({request.status}) के आधार पर: आपका वित्तीय डेटा प्रदान की गई मेट्रिक्स दिखाता है। विस्तृत AI-संचालित अंतर्दृष्टि के लिए, कृपया Mistral API कुंजी कॉन्फ़िगर करें।",
                'te': f"మీ {request.section} స్థితి ({request.status}) ఆధారంగా: మీ ఆర్థిక డేటా అందించిన మెట్రిక్స్‌ను చూపిస్తుంది. వివరమైన AI-ఆధారిత అంతర్దృష్టుల కోసం, దయచేసి Mistral API కీని కాన్ఫిగర్ చేయండి."
            }
            return AIExplanationResponse(
                explanation=fallback_messages.get(request.language, fallback_messages['en'])
            )
        
        # Call Mistral API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small-latest",
                    "messages": [
                        {"role": "system", "content": request.system_prompt},
                        {"role": "user", "content": request.user_prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Mistral API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
            
            result = response.json()
            explanation = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not explanation:
                raise HTTPException(status_code=502, detail="Empty response from AI service")
            
            logger.info(f"✅ AI explanation generated successfully")
            return AIExplanationResponse(explanation=explanation)
            
    except httpx.TimeoutException:
        logger.error("Mistral API timeout")
        return AIExplanationResponse(
            explanation="",
            error="AI explanation temporarily unavailable due to timeout. Please try again."
        )
    except Exception as e:
        logger.error(f"AI explanation error: {str(e)}")
        return AIExplanationResponse(
            explanation="",
            error="AI explanation temporarily unavailable. Please try again."
        )




from backend.services.gst_service import get_gst_overview

class GSTOverviewResponse(BaseModel):
    gstin: str
    period: str
    total_taxable_value: float
    gst_collected: float
    gst_paid: float
    pending_liability: float
    compliance_status: str
    compliance_reason: str
    gstr_1_status: str
    gstr_3b_status: str
    last_filed_date: str
    delay_days: int
    is_demo: bool

@app.get("/api/gst/overview", response_model=GSTOverviewResponse)
async def get_gst_overview_endpoint(user_id: str = Depends(get_current_user)):
    """
    Get GST compliance overview from Mockoon demo API.
    This is a SIMULATED DEMO, not real GST data.
    """
    try:
        logger.info(f"GST overview request from user: {user_id}")
        
        gst_data = await get_gst_overview()
        
        if not gst_data:
            logger.warning("GST demo API unavailable")
            raise HTTPException(
                status_code=503,
                detail="GST demo data unavailable. Please ensure Mockoon is running on port 3001."
            )
        
        logger.info(f"✅ GST overview fetched successfully")
        return GSTOverviewResponse(**gst_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GST overview error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




from backend.services.bookkeeping_service import generate_bookkeeping_summary

class BookkeepingSummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    monthly_income: List[Dict[str, Any]]
    monthly_expenses: List[Dict[str, Any]]
    expense_categories: List[Dict[str, Any]]
    cash_transactions: int
    non_cash_transactions: int
    total_transactions: int
    has_sufficient_data: bool

@app.get("/api/bookkeeping/summary", response_model=BookkeepingSummaryResponse)
async def get_bookkeeping_summary(user_id: str = Depends(get_current_user)):
    """
    Generate auto-bookkeeping summary from all uploaded financial data.
    This is bookkeeping ASSISTANCE, not double-entry accounting.
    """
    try:
        logger.info(f"Bookkeeping summary request from user: {user_id}")
        
        # Fetch all user uploads with parsed_data
        result = supabase.table("financial_uploads") \
            .select("file_type, parsed_data, filename") \
            .eq("user_id", user_id) \
            .eq("processing_status", "completed") \
            .execute()
        
        uploads_data = result.data if result.data else []
        
        if not uploads_data:
            return BookkeepingSummaryResponse(
                total_income=0,
                total_expenses=0,
                net_balance=0,
                monthly_income=[],
                monthly_expenses=[],
                expense_categories=[],
                cash_transactions=0,
                non_cash_transactions=0,
                total_transactions=0,
                has_sufficient_data=False
            )
        
        summary = generate_bookkeeping_summary(uploads_data)
        logger.info(f"✅ Bookkeeping summary generated: {summary['total_transactions']} transactions")
        
        return BookkeepingSummaryResponse(**summary)
        
    except Exception as e:
        logger.error(f"Bookkeeping summary error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




from backend.services.forecasting_service import generate_forecast

class ForecastResponse(BaseModel):
    has_sufficient_data: bool
    message: Optional[str] = None
    data_months_used: Optional[int] = None
    monthly_projections: List[Dict[str, Any]]
    summary: Dict[str, Any]
    disclaimer: Optional[str] = None

@app.get("/api/forecast/3month", response_model=ForecastResponse)
async def get_financial_forecast(user_id: str = Depends(get_current_user)):
    """
    Generate 3-month financial forecast using rule-based calculations.
    NO AI/ML - purely deterministic based on historical averages.
    """
    try:
        logger.info(f"Forecast request from user: {user_id}")
        
        # Fetch all user uploads with parsed_data
        uploads_result = supabase.table("financial_uploads") \
            .select("file_type, parsed_data, filename") \
            .eq("user_id", user_id) \
            .eq("processing_status", "completed") \
            .execute()
        
        uploads_data = uploads_result.data if uploads_result.data else []
        
        # Fetch current metrics for fallback
        metrics_result = supabase.table("financial_metrics") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        
        current_metrics = {}
        if metrics_result.data:
            for row in metrics_result.data:
                for key, val in row.items():
                    if isinstance(val, (int, float)) and key not in ['id', 'user_id']:
                        current_metrics[key] = current_metrics.get(key, 0) + val
        
        forecast = generate_forecast(uploads_data, current_metrics)
        logger.info(f"✅ Forecast generated: {forecast.get('has_sufficient_data')}")
        
        return ForecastResponse(**forecast)
        
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




from backend.services.working_capital_service import calculate_working_capital

class WorkingCapitalResponse(BaseModel):
    receivables: float
    payables: float
    working_capital_gap: float
    risk_level: str
    key_observations: List[str]
    has_sufficient_data: bool

@app.get("/api/working-capital/health", response_model=WorkingCapitalResponse)
async def get_working_capital_health(user_id: str = Depends(get_current_user)):
    """
    Calculate working capital health metrics.
    """
    try:
        logger.info(f"Working capital request from user: {user_id}")
        
        # Fetch uploads
        uploads_result = supabase.table("financial_uploads") \
            .select("file_type, parsed_data, filename") \
            .eq("user_id", user_id) \
            .eq("processing_status", "completed") \
            .execute()
        uploads_data = uploads_result.data if uploads_result.data else []
        
        # Fetch metrics
        metrics_result = supabase.table("financial_metrics") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        
        metrics = {}
        if metrics_result.data:
            for row in metrics_result.data:
                for key, val in row.items():
                    if isinstance(val, (int, float)) and key not in ['id', 'user_id']:
                        metrics[key] = metrics.get(key, 0) + val
        
        result = calculate_working_capital(uploads_data, metrics)
        logger.info(f"✅ Working capital calculated: risk={result['risk_level']}")
        
        return WorkingCapitalResponse(**result)
        
    except Exception as e:
        logger.error(f"Working capital error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




from backend.services.inventory_loan_service import get_inventory_summary, get_loan_summary

class InventorySummaryResponse(BaseModel):
    total_items: int
    total_quantity: Optional[int] = 0
    total_value: float
    top_items: Optional[List[Dict[str, Any]]] = []
    has_data: bool

@app.get("/api/inventory/summary", response_model=InventorySummaryResponse)
async def get_inventory_data(user_id: str = Depends(get_current_user)):
    """
    Get inventory snapshot from uploaded inventory data.
    """
    try:
        logger.info(f"Inventory summary request from user: {user_id}")
        
        uploads_result = supabase.table("financial_uploads") \
            .select("file_type, parsed_data, filename") \
            .eq("user_id", user_id) \
            .eq("processing_status", "completed") \
            .execute()
        uploads_data = uploads_result.data if uploads_result.data else []
        
        result = get_inventory_summary(uploads_data)
        logger.info(f"✅ Inventory summary: {result['total_items']} items")
        
        return InventorySummaryResponse(**result)
        
    except Exception as e:
        logger.error(f"Inventory error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




class LoanSummaryResponse(BaseModel):
    total_outstanding: float
    total_monthly_emi: float
    loan_count: int
    loans: Optional[List[Dict[str, Any]]] = []
    has_data: bool

@app.get("/api/loans/summary", response_model=LoanSummaryResponse)
async def get_loan_data(user_id: str = Depends(get_current_user)):
    """
    Get loan obligations summary from uploaded loan data.
    """
    try:
        logger.info(f"Loan summary request from user: {user_id}")
        
        uploads_result = supabase.table("financial_uploads") \
            .select("file_type, parsed_data, filename") \
            .eq("user_id", user_id) \
            .eq("processing_status", "completed") \
            .execute()
        uploads_data = uploads_result.data if uploads_result.data else []
        
        result = get_loan_summary(uploads_data)
        logger.info(f"✅ Loan summary: {result['loan_count']} loans")
        
        return LoanSummaryResponse(**result)
        
    except Exception as e:
        logger.error(f"Loan error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

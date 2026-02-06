"""
GST Demo Service - Fetches simulated GST data from Mockoon
This is a DEMO integration, NOT real GST API
"""

import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Mockoon base URL for GST demo
MOCKOON_BASE_URL = "http://localhost:3001"


async def fetch_gst_summary() -> Optional[Dict[str, Any]]:
    """Fetch GST summary from Mockoon demo API"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{MOCKOON_BASE_URL}/gst/summary")
            if response.status_code == 200:
                return response.json()
            logger.warning(f"GST summary API returned {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch GST summary: {e}")
        return None


async def fetch_gst_returns() -> Optional[Dict[str, Any]]:
    """Fetch GST returns status from Mockoon demo API"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{MOCKOON_BASE_URL}/gst/returns")
            if response.status_code == 200:
                return response.json()
            logger.warning(f"GST returns API returned {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch GST returns: {e}")
        return None


async def fetch_gst_compliance_status() -> Optional[Dict[str, Any]]:
    """Fetch GST compliance status from Mockoon demo API"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{MOCKOON_BASE_URL}/gst/compliance-status")
            if response.status_code == 200:
                return response.json()
            logger.warning(f"GST compliance API returned {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch GST compliance status: {e}")
        return None


async def get_gst_overview() -> Optional[Dict[str, Any]]:
    """
    Aggregate GST demo data from all Mockoon endpoints.
    Returns normalized response for frontend.
    """
    try:
        # Fetch all GST data concurrently
        summary = await fetch_gst_summary()
        returns = await fetch_gst_returns()
        compliance = await fetch_gst_compliance_status()

        # If all failed, return None
        if not summary and not returns and not compliance:
            logger.warning("All GST demo APIs unavailable")
            return None

        # Build normalized response
        return {
            "gstin": summary.get("gstin", "N/A") if summary else "N/A",
            "period": summary.get("period", "N/A") if summary else "N/A",
            "total_taxable_value": summary.get("total_taxable_value", 0) if summary else 0,
            "gst_collected": summary.get("gst_collected", 0) if summary else 0,
            "gst_paid": summary.get("gst_paid", 0) if summary else 0,
            "pending_liability": summary.get("pending_liability", 0) if summary else 0,
            "compliance_status": compliance.get("status", "Unknown") if compliance else (summary.get("compliance_status", "Unknown") if summary else "Unknown"),
            "compliance_reason": compliance.get("reason", "") if compliance else "",
            "gstr_1_status": returns.get("gstr_1", "Unknown") if returns else "Unknown",
            "gstr_3b_status": returns.get("gstr_3b", "Unknown") if returns else "Unknown",
            "last_filed_date": returns.get("last_filed_date", "N/A") if returns else "N/A",
            "delay_days": returns.get("delay_days", 0) if returns else 0,
            "is_demo": True  # Always mark as demo
        }
    except Exception as e:
        logger.error(f"Error aggregating GST data: {e}")
        return None

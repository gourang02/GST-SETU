# =========================================
# FILE: main.py  (FULLY COMPLETE — all 27 finalized routes)
# =========================================

import os
import io
import csv
import uuid
import json
from datetime import datetime, date
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
import google.generativeai as genai

from schemas import AuditResponse, ExtractedInvoice
from database import get_db_connection, log_ai_action
from vector_db import get_chroma_collection
from agents.agent1_vision import extract_invoice_data
from agents.agent2_ledger import verify_ledger_data
from agents.agent3_tax import check_tax_compliance

# =========================================
# APP INIT
# =========================================

app = FastAPI(title="Autonomous Tax Audit Swarm (ATAS)")

# CORS — needed so your friend's frontend (running on a different port/domain)
# can actually call this backend from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's actual domain before final deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

EMBEDDING_MODEL = "models/gemini-embedding-001"


# =========================================
# EXTRA PYDANTIC MODELS
# (not in schemas.py yet — request/response shapes needed for these routes.
#  Move these into schemas.py later if you want everything centralized.)
# =========================================

class OverridePayload(BaseModel):
    status: str = Field(description="One of: APPROVED, FLAGGED, MANUAL_REVIEW")
    reason: str = Field(description="Why the human reviewer is overriding the AI verdict")
    overridden_by: str = Field(default="unknown_user", description="Who performed the override")


class VendorCreate(BaseModel):
    vendor_gstin: str
    vendor_name: str
    state_code: str
    risk_score: int = 0


class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    state_code: Optional[str] = None
    risk_score: Optional[int] = None


class LedgerCreate(BaseModel):
    invoice_id: str
    vendor_gstin: str
    base_amount: float
    tax_amount: float
    total_amount: float
    status: str = "PENDING"


class BankTransactionCreate(BaseModel):
    vendor_gstin: str
    amount_paid: float
    payment_date: Optional[date] = None


class RuleCreate(BaseModel):
    rule_text: str = Field(description="Full text of the new tax rule to add to the knowledge base")


class LoginRequest(BaseModel):
    username: str
    password: str


class AIConfig(BaseModel):
    confidence_threshold: float = 0.90
    gemini_model: str = "gemini-flash-latest"
    gst_rate: float = 0.18


# =========================================
# IN-MEMORY STATE
# (Prototype-level only. For a real production system these belong in the DB —
#  flagged clearly below.)
# =========================================

# NOTE: This is a hackathon-grade fake auth store, NOT secure production auth.
# Real system needs hashed passwords + JWT + a `users` table.
FAKE_USERS_DB = {
    "admin": {"password": "admin123", "role": "auditor"}
}
FAKE_TOKENS = {}  # token -> username

# NOTE: AI config kept in memory only — resets on server restart.
# For persistence across restarts, store this in a dedicated `ai_config` table.
_ai_config_store = AIConfig()


# =========================================
# WEBSOCKET CONNECTION MANAGER
# =========================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)


manager = ConnectionManager()


# =========================================
# HELPER: reconstruct ExtractedInvoice from DB (used in re-audit)
# =========================================

def _build_extracted_invoice_from_db(invoice_id: str) -> ExtractedInvoice:
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT pl.invoice_id, pl.vendor_gstin, pl.base_amount, pl.tax_amount, pl.total_amount,
                   v.vendor_name
            FROM purchase_ledgers pl
            JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
            WHERE pl.invoice_id = %s;
            """,
            (invoice_id,)
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")

        return ExtractedInvoice(
            invoice_number=row["invoice_id"],
            vendor_name=row["vendor_name"],
            vendor_gstin=row["vendor_gstin"],
            base_amount=float(row["base_amount"]),
            tax_amount=float(row["tax_amount"]),
            total_amount=float(row["total_amount"]),
            confidence_score=1.0  # re-audit skips Agent 1, so confidence is treated as pre-verified
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 1. POST /audit-invoice
# =========================================

@app.post("/audit-invoice", response_model=AuditResponse)
async def audit_invoice(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"

        try:
            extracted_data = await extract_invoice_data(file_bytes, mime_type)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Vision extraction failed: {str(e)}")

        invoice_id = (
            extracted_data.invoice_number.strip()
            if extracted_data.invoice_number and extracted_data.invoice_number.strip()
            else f"TEMP-{uuid.uuid4().hex[:12].upper()}"
        )

        # Persist the raw uploaded file to disk, named by invoice_id, so
        # GET /invoices/{invoice_id}/file can serve it later.
        file_ext = os.path.splitext(file.filename or "")[1] or ".bin"
        saved_path = os.path.join(UPLOAD_DIR, f"{invoice_id}{file_ext}")
        with open(saved_path, "wb") as f:
            f.write(file_bytes)

        await manager.broadcast({"invoice_id": invoice_id, "agent": "Agent1_Vision", "status": "EXTRACTED"})

        if extracted_data.confidence_score < _ai_config_store.confidence_threshold:
            await manager.broadcast({"invoice_id": invoice_id, "agent": "Pipeline", "status": "MANUAL_REVIEW"})
            return AuditResponse(
                status="MANUAL_REVIEW",
                reason=f"Low extraction confidence ({extracted_data.confidence_score}).",
                extracted_data=extracted_data
            )

        ledger_result = await verify_ledger_data(extracted_data, invoice_id)
        await manager.broadcast({"invoice_id": invoice_id, "agent": "Agent2_Ledger", "status": ledger_result["is_valid"]})

        if not ledger_result["is_valid"]:
            await manager.broadcast({"invoice_id": invoice_id, "agent": "Pipeline", "status": "FLAGGED"})
            return AuditResponse(
                status="FLAGGED",
                reason=ledger_result["error_message"],
                extracted_data=extracted_data
            )

        tax_result = await check_tax_compliance(extracted_data, invoice_id)
        await manager.broadcast({"invoice_id": invoice_id, "agent": "Agent3_Tax", "status": tax_result["is_compliant"]})

        if not tax_result["is_compliant"]:
            await manager.broadcast({"invoice_id": invoice_id, "agent": "Pipeline", "status": "FLAGGED"})
            return AuditResponse(
                status="FLAGGED",
                reason=tax_result["rule_cited"],
                extracted_data=extracted_data
            )

        await manager.broadcast({"invoice_id": invoice_id, "agent": "Pipeline", "status": "APPROVED"})
        return AuditResponse(
            status="APPROVED",
            reason="All Swarm checks passed successfully",
            extracted_data=extracted_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit pipeline encountered an unexpected error: {str(e)}")


# =========================================
# 2. POST /invoices/{invoice_id}/re-audit
# =========================================

@app.post("/invoices/{invoice_id}/re-audit", response_model=AuditResponse)
async def re_audit_invoice(invoice_id: str):
    """
    Re-runs Agent 2 (Ledger) and Agent 3 (Tax) using data already stored in
    the DB for this invoice. Skips Agent 1 (Vision) since no new file is
    uploaded — reconstructs an ExtractedInvoice from purchase_ledgers + vendors.
    """
    try:
        extracted_data = _build_extracted_invoice_from_db(invoice_id)

        ledger_result = await verify_ledger_data(extracted_data, invoice_id)
        if not ledger_result["is_valid"]:
             return AuditResponse(status="FLAGGED", reason=ledger_result["error_message"], extracted_data=extracted_data)

        tax_result = await check_tax_compliance(extracted_data, invoice_id)
        if not tax_result["is_compliant"]:
            return AuditResponse(status="FLAGGED", reason=tax_result["rule_cited"], extracted_data=extracted_data)

        return AuditResponse(status="APPROVED", reason="Re-audit passed all checks", extracted_data=extracted_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Re-audit failed: {str(e)}")


# =========================================
# 3. PATCH /invoices/{invoice_id}/override
# =========================================

@app.patch("/invoices/{invoice_id}/override")
def override_invoice_status(invoice_id: str, payload: OverridePayload):
    valid_statuses = {"APPROVED", "FLAGGED", "MANUAL_REVIEW", "PENDING"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid_statuses}")

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE purchase_ledgers SET status = %s WHERE invoice_id = %s RETURNING invoice_id;",
            (payload.status, invoice_id)
        )
        updated = cursor.fetchone()
        if updated is None:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")
        conn.commit()

        log_ai_action(
            invoice_id=invoice_id,
            agent_name=f"Human_Override({payload.overridden_by})",
            action_taken=payload.status,
            reason=payload.reason
        )

        return {"invoice_id": invoice_id, "new_status": payload.status, "message": "Override applied successfully"}

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 4. WS /ws/audit-logs
# =========================================

@app.websocket("/ws/audit-logs")
async def websocket_audit_logs(websocket: WebSocket):
    """
    Frontend connects here to receive live agent-by-agent progress events
    while /audit-invoice is running. Each event is broadcast via manager.broadcast()
    at each pipeline stage inside audit_invoice().
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; we don't expect the client to send anything,
            # but we need to await something or the socket closes immediately.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =========================================
# 5-7. KNOWLEDGE BASE (RAG rules) ROUTES
# =========================================

@app.get("/knowledge-base/rules")
def list_rules():
    try:
        collection = get_chroma_collection()
        results = collection.get()
        rules = [
            {"rule_id": rid, "text": doc}
            for rid, doc in zip(results.get("ids", []), results.get("documents", []))
        ]
        return {"total": len(rules), "rules": rules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge-base/rules")
def add_rule(payload: RuleCreate):
    try:
        collection = get_chroma_collection()
        rule_id = f"rule_{uuid.uuid4().hex[:8]}"

        embedding_response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=payload.rule_text,
            task_type="retrieval_document"
        )
        vector = embedding_response["embedding"]

        collection.upsert(ids=[rule_id], embeddings=[vector], documents=[payload.rule_text])
        return {"rule_id": rule_id, "text": payload.rule_text, "message": "Rule added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/knowledge-base/rules/{rule_id}")
def delete_rule(rule_id: str):
    try:
        collection = get_chroma_collection()
        collection.delete(ids=[rule_id])
        return {"rule_id": rule_id, "message": "Rule deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================
# 8-13. INVOICES ROUTES
# =========================================

@app.get("/invoices")
def list_invoices(status: Optional[str] = None, limit: int = 20, offset: int = 0):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if status:
            cursor.execute(
                """
                SELECT pl.invoice_id, v.vendor_name, pl.total_amount, pl.status, pl.created_at
                FROM purchase_ledgers pl
                JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
                WHERE pl.status = %s
                ORDER BY pl.created_at DESC
                LIMIT %s OFFSET %s;
                """,
                (status, limit, offset)
            )
        else:
            cursor.execute(
                """
                SELECT pl.invoice_id, v.vendor_name, pl.total_amount, pl.status, pl.created_at
                FROM purchase_ledgers pl
                JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
                ORDER BY pl.created_at DESC
                LIMIT %s OFFSET %s;
                """,
                (limit, offset)
            )

        rows = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) AS count FROM purchase_ledgers;")
        total = cursor.fetchone()["count"]

        return {"total": total, "invoices": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/invoices/search")
def search_invoices(
    vendor_name: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        conditions = []
        params = []

        if vendor_name:
            conditions.append("v.vendor_name ILIKE %s")
            params.append(f"%{vendor_name}%")
        if status:
            conditions.append("pl.status = %s")
            params.append(status)
        if date_from:
            conditions.append("pl.created_at >= %s")
            params.append(date_from)
        if date_to:
            conditions.append("pl.created_at <= %s")
            params.append(date_to)
        if min_amount is not None:
            conditions.append("pl.total_amount >= %s")
            params.append(min_amount)
        if max_amount is not None:
            conditions.append("pl.total_amount <= %s")
            params.append(max_amount)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        query = f"""
            SELECT pl.invoice_id, v.vendor_name, pl.total_amount, pl.status, pl.created_at
            FROM purchase_ledgers pl
            JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
            {where_clause}
            ORDER BY pl.created_at DESC;
        """
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return {"total": len(rows), "invoices": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT pl.*, v.vendor_name, v.state_code, v.risk_score
            FROM purchase_ledgers pl
            JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
            WHERE pl.invoice_id = %s;
            """,
            (invoice_id,)
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/invoices/{invoice_id}/file")
def get_invoice_file(invoice_id: str):
    """
    Serves the original uploaded invoice file from local disk.
    Files were saved during /audit-invoice as uploads/{invoice_id}{ext}.
    NOTE: local disk storage is fine for the hackathon demo; for real
    deployment this should move to S3/Cloudinary since local disk won't
    persist across container restarts on most hosting platforms.
    """
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(invoice_id):
            return FileResponse(os.path.join(UPLOAD_DIR, filename))
    raise HTTPException(status_code=404, detail=f"No file found for invoice {invoice_id}.")


@app.get("/invoices/{invoice_id}/audit-trail")
def get_audit_trail(invoice_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT agent_name, action_taken, reason, created_at
            FROM ai_audit_logs
            WHERE invoice_id = %s
            ORDER BY created_at ASC;
            """,
            (invoice_id,)
        )
        rows = cursor.fetchall()
        return {"invoice_id": invoice_id, "trail": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM purchase_ledgers WHERE invoice_id = %s RETURNING invoice_id;", (invoice_id,))
        deleted = cursor.fetchone()
        if deleted is None:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")
        conn.commit()
        return {"invoice_id": invoice_id, "message": "Invoice deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 14-18. VENDORS ROUTES
# =========================================

@app.get("/vendors")
def list_vendors():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vendors ORDER BY risk_score DESC;")
        return {"vendors": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.post("/vendors")
def create_vendor(payload: VendorCreate):
    if len(payload.vendor_gstin) != 15:
        raise HTTPException(status_code=400, detail="vendor_gstin must be exactly 15 characters.")

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO vendors (vendor_gstin, vendor_name, state_code, risk_score)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
            """,
            (payload.vendor_gstin, payload.vendor_name, payload.state_code, payload.risk_score)
        )
        new_vendor = cursor.fetchone()
        conn.commit()
        return new_vendor
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/vendors/{vendor_gstin}")
def get_vendor(vendor_gstin: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vendors WHERE vendor_gstin = %s;", (vendor_gstin,))
        vendor = cursor.fetchone()
        if vendor is None:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_gstin} not found.")

        cursor.execute("SELECT COUNT(*) AS total FROM purchase_ledgers WHERE vendor_gstin = %s;", (vendor_gstin,))
        total_invoices = cursor.fetchone()["total"]

        cursor.execute(
            "SELECT COUNT(*) AS flagged FROM purchase_ledgers WHERE vendor_gstin = %s AND status = 'FLAGGED';",
            (vendor_gstin,)
        )
        flagged_invoices = cursor.fetchone()["flagged"]

        return {**vendor, "total_invoices": total_invoices, "flagged_invoices": flagged_invoices}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.patch("/vendors/{vendor_gstin}")
def update_vendor(vendor_gstin: str, payload: VendorUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        set_clause = ", ".join(f"{col} = %s" for col in updates.keys())
        params = list(updates.values()) + [vendor_gstin]

        cursor.execute(
            f"UPDATE vendors SET {set_clause} WHERE vendor_gstin = %s RETURNING *;",
            params
        )
        updated = cursor.fetchone()
        if updated is None:
            raise HTTPException(status_code=404, detail=f"Vendor {vendor_gstin} not found.")
        conn.commit()
        return updated
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/vendors/{vendor_gstin}/invoices")
def get_vendor_invoices(vendor_gstin: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM purchase_ledgers WHERE vendor_gstin = %s ORDER BY created_at DESC;",
            (vendor_gstin,)
        )
        return {"vendor_gstin": vendor_gstin, "invoices": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 19-22. LEDGERS & BANK TRANSACTIONS ROUTES
# =========================================

@app.get("/ledgers")
def list_ledgers():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM purchase_ledgers ORDER BY created_at DESC;")
        return {"ledgers": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.post("/ledgers")
def create_ledger(payload: LedgerCreate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO purchase_ledgers (invoice_id, vendor_gstin, base_amount, tax_amount, total_amount, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
            """,
            (payload.invoice_id, payload.vendor_gstin, payload.base_amount,
             payload.tax_amount, payload.total_amount, payload.status)
        )
        new_ledger = cursor.fetchone()
        conn.commit()
        return new_ledger
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/bank-transactions")
def list_bank_transactions():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bank_transactions ORDER BY created_at DESC;")
        return {"transactions": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.post("/bank-transactions")
def create_bank_transaction(payload: BankTransactionCreate):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO bank_transactions (vendor_gstin, amount_paid, payment_date)
            VALUES (%s, %s, COALESCE(%s, CURRENT_DATE))
            RETURNING *;
            """,
            (payload.vendor_gstin, payload.amount_paid, payload.payment_date)
        )
        new_txn = cursor.fetchone()
        conn.commit()
        return new_txn
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 23-25. DASHBOARD & REPORTS ROUTES
# =========================================

@app.get("/dashboard/stats")
def get_dashboard_stats():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) AS total FROM purchase_ledgers;")
        total = cursor.fetchone()["total"]

        cursor.execute("SELECT status, COUNT(*) AS count FROM purchase_ledgers GROUP BY status;")
        status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total_amount FROM purchase_ledgers;")
        total_amount = cursor.fetchone()["total_amount"]

        return {
            "total_invoices": total,
            "approved": status_counts.get("APPROVED", 0),
            "flagged": status_counts.get("FLAGGED", 0),
            "manual_review": status_counts.get("MANUAL_REVIEW", 0),
            "pending": status_counts.get("PENDING", 0),
            "total_amount_audited": float(total_amount)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/invoices/{invoice_id}/export")
def export_invoice(invoice_id: str):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT pl.*, v.vendor_name, v.state_code
            FROM purchase_ledgers pl
            JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
            WHERE pl.invoice_id = %s;
            """,
            (invoice_id,)
        )
        row = cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(row.keys()))
        writer.writeheader()
        writer.writerow(row)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={invoice_id}.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.get("/reports/export")
def export_all_invoices():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT pl.invoice_id, v.vendor_name, pl.vendor_gstin, pl.base_amount,
                   pl.tax_amount, pl.total_amount, pl.status, pl.created_at
            FROM purchase_ledgers pl
            JOIN vendors v ON pl.vendor_gstin = v.vendor_gstin
            ORDER BY pl.created_at DESC;
            """
        )
        rows = cursor.fetchall()
        if not rows:
            raise HTTPException(status_code=404, detail="No invoices to export.")

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=all_invoices_report.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# =========================================
# 26-27. AUTH ROUTES
# =========================================

@app.post("/auth/login")
def login(payload: LoginRequest):
    """
    NOTE: Prototype-level auth only — plaintext password check against an
    in-memory dict, and a random token with no expiry. Fine for a hackathon
    demo. Do NOT use this pattern in a real production deployment.
    """
    user = FAKE_USERS_DB.get(payload.username)
    if user is None or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = uuid.uuid4().hex
    FAKE_TOKENS[token] = payload.username

    return {"access_token": token, "token_type": "bearer", "username": payload.username, "role": user["role"]}


@app.get("/auth/me")
def get_me(token: str = Query(..., description="Bearer token from /auth/login")):
    username = FAKE_TOKENS.get(token)
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = FAKE_USERS_DB.get(username)
    return {"username": username, "role": user["role"]}


# =========================================
# 28. HEALTH CHECK
# =========================================

@app.get("/health")
def health_check():
    db_connected = True
    try:
        conn = get_db_connection()
        conn.close()
    except Exception:
        db_connected = False

    return {"status": "ok", "db_connected": db_connected}


# =========================================
# 29-30. AI CONFIG SETTINGS ROUTES
# =========================================

@app.get("/settings/ai-config")
def get_ai_config():
    return _ai_config_store


@app.patch("/settings/ai-config")
def update_ai_config(payload: AIConfig):
    global _ai_config_store
    _ai_config_store = payload
    return {"message": "AI config updated successfully", "config": _ai_config_store}
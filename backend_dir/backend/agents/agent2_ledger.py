# =========================================
# FILE: agents/agent2_ledger.py (UPDATED)
# =========================================

from schemas import ExtractedInvoice
from database import get_db_connection, log_ai_action

AGENT_NAME = "Agent2_Ledger"
AMOUNT_TOLERANCE = 0.01  # Rupees — accounts for floating point precision drift


async def verify_ledger_data(extracted_data: ExtractedInvoice, invoice_id: str) -> dict:
    """
    Cross-verifies AI-extracted invoice data against internal ledger and
    bank transaction records to detect fraud (unregistered vendors,
    tampered amounts, or ghost invoices with no real payment).

    Strings from the AI (invoice_number, vendor_gstin) are sanitized
    (.strip().upper()) before use, since vision-model output can carry
    invisible whitespace/newlines or inconsistent casing that breaks
    exact-match SQL lookups even when the "real" values are identical.

    Args:
        extracted_data: Validated ExtractedInvoice object from Agent 1.
        invoice_id: The invoice ID this verification run is tied to
                    (used for audit logging).

    Returns:
        dict: {"is_valid": bool, "error_message": str}
    """
    conn = None
    cursor = None

    # ---- STEP 0: Sanitize AI-extracted strings ----
    ai_invoice_num = (extracted_data.invoice_number or "").strip().upper()
    ai_gstin = (extracted_data.vendor_gstin or "").strip().upper()

    if not ai_invoice_num:
        result = {"is_valid": False, "error_message": "Invoice number is missing"}
        log_ai_action(
            invoice_id=invoice_id,
            agent_name=AGENT_NAME,
            action_taken="FLAGGED",
            reason="Invoice number missing or empty after sanitization."
        )
        return result

    print(f"\n[AGENT 2 DEBUG] Querying DB with Cleaned Data -> Invoice: '{ai_invoice_num}' | GSTIN: '{ai_gstin}'")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ---- STEP 1: Vendor registration check ----
        cursor.execute(
            "SELECT vendor_gstin, vendor_name FROM vendors WHERE UPPER(TRIM(vendor_gstin)) = %s;",
            (ai_gstin,)
        )
        vendor_row = cursor.fetchone()

        if vendor_row is None:
            result = {
                "is_valid": False,
                "error_message": "Unregistered Vendor"
            }
            log_ai_action(
                invoice_id=invoice_id,
                agent_name=AGENT_NAME,
                action_taken="FLAGGED",
                reason=f"Vendor GSTIN {ai_gstin} not found in vendors master table."
            )
            return result

        # ---- STEP 2: Ledger match — by exact invoice_number now, not just vendor ----
        cursor.execute(
            """
            SELECT total_amount FROM purchase_ledgers
            WHERE UPPER(TRIM(invoice_id)) = %s AND UPPER(TRIM(vendor_gstin)) = %s
            LIMIT 1;
            """,
            (ai_invoice_num, ai_gstin)
        )
        ledger_row = cursor.fetchone()

        if ledger_row is None:
            result = {
                "is_valid": False,
                "error_message": "No matching purchase ledger entry found for this invoice number and vendor"
            }
            log_ai_action(
                invoice_id=invoice_id,
                agent_name=AGENT_NAME,
                action_taken="FLAGGED",
                reason=(
                    f"No purchase_ledgers record found for invoice_number="
                    f"{ai_invoice_num}, GSTIN={ai_gstin}."
                )
            )
            return result

        ledger_total = float(ledger_row["total_amount"])
        extracted_total = float(extracted_data.total_amount)

        # Float tolerance widened to a flat ₹1.00 margin per spec, rather than
        # the stricter AMOUNT_TOLERANCE used elsewhere, since this comparison
        # is specifically absorbing AI extraction rounding noise.
        if abs(ledger_total - extracted_total) > 1.0:
            result = {
                "is_valid": False,
                "error_message": "Price Alteration/Mismatch Detected"
            }
            log_ai_action(
                invoice_id=invoice_id,
                agent_name=AGENT_NAME,
                action_taken="FLAGGED",
                reason=(
                    f"Amount mismatch: ledger total={ledger_total}, "
                    f"extracted total={extracted_total}."
                )
            )
            return result

        # ---- STEP 3: Bank payment clearance check — tolerance-based match ----
        cursor.execute(
            """
            SELECT amount_paid FROM bank_transactions
            WHERE UPPER(TRIM(vendor_gstin)) = %s
              AND ABS(amount_paid - %s) < %s
            LIMIT 1;
            """,
            (ai_gstin, extracted_total, AMOUNT_TOLERANCE)
        )
        bank_row = cursor.fetchone()

        if bank_row is None:
            result = {
                "is_valid": False,
                "error_message": "Ghost Invoice: No bank payment cleared"
            }
            log_ai_action(
                invoice_id=invoice_id,
                agent_name=AGENT_NAME,
                action_taken="FLAGGED",
                reason=(
                    f"No bank_transactions record found for GSTIN "
                    f"{ai_gstin} matching amount {extracted_total} "
                    f"(tolerance ±{AMOUNT_TOLERANCE})."
                )
            )
            return result

        # ---- All checks passed ----
        result = {
            "is_valid": True,
            "error_message": "Matched with internal ledger and bank statements"
        }
        log_ai_action(
            invoice_id=invoice_id,
            agent_name=AGENT_NAME,
            action_taken="VALIDATED",
            reason="Vendor registered, ledger amount matched, bank payment cleared."
        )
        return result

    except Exception as e:
        error_msg = f"Ledger verification failed due to internal error: {str(e)}"
        log_ai_action(
            invoice_id=invoice_id,
            agent_name=AGENT_NAME,
            action_taken="ERROR",
            reason=error_msg
        )
        return {"is_valid": False, "error_message": error_msg}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
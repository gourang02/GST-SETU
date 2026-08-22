# =========================================
# FILE: agents/agent3_tax.py
# =========================================

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

from schemas import ExtractedInvoice
from database import log_ai_action
from vector_db import get_chroma_collection

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "models/gemini-embedding-001"
LLM_MODEL = "gemini-3.6-flash"
AGENT_NAME = "Agent 3 - Tax Inspector"
GST_RATE = 0.18
TAX_TOLERANCE = 1.00  # rupees, allows for rounding differences

# Buyer's own GSTIN — read from .env so it's configurable per deployment
BUYER_GSTIN = os.getenv("BUYER_GSTIN", "09AAACR5055K1Z5")


async def check_tax_compliance(
    extracted_data: ExtractedInvoice,
    invoice_id: str,
    buyer_gstin: str = BUYER_GSTIN
) -> dict:
    """
    Checks an extracted invoice against Indian GST law using RAG
    (ChromaDB + Gemini embeddings) combined with deterministic math
    checks (18% rate, place-of-supply from GSTIN prefixes).

    Args:
        extracted_data: Validated ExtractedInvoice from Agent 1.
        invoice_id: Invoice ID for audit logging.
        buyer_gstin: The auditing company's own GSTIN, used to determine
                     intra-state vs inter-state supply.

    Returns:
        dict: {"is_compliant": bool, "rule_cited": str}
    """
    try:
        # ---- STEP 1: Deterministic pre-computation (ground truth math) ----
        expected_tax = round(extracted_data.base_amount * GST_RATE, 2)
        tax_math_ok = abs(extracted_data.tax_amount - expected_tax) <= TAX_TOLERANCE

        vendor_state_code = extracted_data.vendor_gstin[:2]
        buyer_state_code = buyer_gstin[:2]
        supply_type = (
            "INTRA-STATE (CGST + SGST)"
            if vendor_state_code == buyer_state_code
            else "INTER-STATE (IGST)"
        )

        # ---- STEP 2: Build search query and retrieve relevant laws ----
        search_query = (
            f"Tax rules for vendor {extracted_data.vendor_name} "
            f"with base amount {extracted_data.base_amount} "
            f"and tax amount {extracted_data.tax_amount}"
        )

        query_embedding_response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=search_query,
            task_type="retrieval_query"
        )
        query_embedding = query_embedding_response["embedding"]

        collection = get_chroma_collection()
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=2
        )

        retrieved_docs = results.get("documents", [[]])[0]
        retrieved_laws_text = "\n".join(f"- {doc}" for doc in retrieved_docs)

        if not retrieved_laws_text:
            retrieved_laws_text = "No relevant laws found in knowledge base."

        # ---- STEP 3: Build strict prompt with deterministic facts + retrieved laws ----
        prompt = f"""You are a strict Tax Auditor. Using ONLY the provided retrieved laws, evaluate this invoice. Check if the tax math (18%) and state code rules align. Output MUST be valid JSON: {{"is_compliant": bool, "rule_cited": "Reason or Section from retrieved law"}}.

RETRIEVED LAWS:
{retrieved_laws_text}

DETERMINISTIC FACTS (pre-computed, do not recalculate):
- Expected tax at 18% of base_amount ({extracted_data.base_amount}) = {expected_tax}
- Actual tax_amount on invoice = {extracted_data.tax_amount}
- Tax math matches expected 18%: {tax_math_ok}
- Vendor GSTIN state code: {vendor_state_code}
- Buyer GSTIN state code: {buyer_state_code}
- Supply type based on state codes: {supply_type}

INVOICE DATA:
{extracted_data.model_dump_json()}

Evaluate compliance using the deterministic facts above combined with the retrieved laws. Output ONLY the JSON object, nothing else."""

        # ---- STEP 4: Call Gemini for compliance evaluation ----
        model = genai.GenerativeModel(LLM_MODEL)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        try:
            llm_result = json.loads(response.text)
            llm_is_compliant = bool(llm_result["is_compliant"])
            llm_rule_cited = str(llm_result["rule_cited"])
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            raise ValueError(f"Gemini returned invalid compliance JSON: {response.text}") from e

        # ---- STEP 5: Deterministic override — never trust LLM over hard math ----
        # If the tax math is provably wrong, the invoice is non-compliant
        # regardless of what the LLM concluded.
        if not tax_math_ok:
            final_is_compliant = False
            final_rule_cited = (
                f"HSN 8471: Tax mismatch. Expected {expected_tax} (18% of "
                f"{extracted_data.base_amount}), found {extracted_data.tax_amount}."
            )
        else:
            final_is_compliant = llm_is_compliant
            final_rule_cited = llm_rule_cited

        result = {
            "is_compliant": final_is_compliant,
            "rule_cited": final_rule_cited
        }

        # ---- STEP 6: Log decision ----
        action_taken = "APPROVED" if final_is_compliant else "FLAGGED"
        log_ai_action(
            invoice_id=invoice_id,
            agent_name=AGENT_NAME,
            action_taken=action_taken,
            reason=final_rule_cited
        )

        return result

    except Exception as e:
        error_msg = f"Tax compliance check failed due to internal error: {str(e)}"
        log_ai_action(
            invoice_id=invoice_id,
            agent_name=AGENT_NAME,
            action_taken="ERROR",
            reason=error_msg
        )
        return {"is_compliant": False, "rule_cited": error_msg}
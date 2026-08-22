import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from pydantic import ValidationError, BaseModel

from schemas import ExtractedInvoice

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.6-flash"

EXTRACTION_PROMPT = """You are a highly precise automated tax extraction AI. Analyze the attached invoice and extract the required details, including the invoice_number printed on the document. Output MUST be valid JSON only matching the provided schema. Ensure base_amount + tax_amount = total_amount. If the image is blurry or unreadable, set the confidence_score below 0.85."""


# NOTE: This schema mirrors ExtractedInvoice but WITHOUT Field(ge=..., le=...)
# constraints. Gemini's response_schema converter (in this version of the
# google-generativeai SDK) doesn't support "minimum"/"maximum" JSON schema
# keys and throws "Unknown field for Schema: maximum" if we pass
# ExtractedInvoice directly. We still validate the real 0.0-1.0 constraint
# afterward via ExtractedInvoice(**parsed_json) below, so no validation is lost.
class GeminiExtractionSchema(BaseModel):
    invoice_number: str
    vendor_name: str
    vendor_gstin: str
    base_amount: float
    tax_amount: float
    total_amount: float
    confidence_score: float

async def extract_invoice_data(file_bytes: bytes, mime_type: str) -> ExtractedInvoice:
    """
    Sends invoice file bytes to Gemini 1.5 Flash and enforces structured
    output matching the ExtractedInvoice Pydantic schema.

    Args:
        file_bytes: Raw bytes of the uploaded PDF or image.
        mime_type: MIME type of the file (e.g. 'application/pdf', 'image/jpeg').

    Returns:
        ExtractedInvoice: Validated Pydantic object.

    Raises:
        ValueError: If Gemini's output fails schema validation or JSON parsing.
    """

    model = genai.GenerativeModel(MODEL_NAME)

    generation_config = {
        "response_mime_type": "application/json",
        "response_schema": GeminiExtractionSchema,
    }

    file_part = {
        "mime_type": mime_type,
        "data": file_bytes,
    }

    try:
        response = model.generate_content(
            [EXTRACTION_PROMPT, file_part],
            generation_config=generation_config,
        )
    except Exception as e:
        raise ValueError(f"Gemini API call failed: {str(e)}")

    raw_text = response.text

    try:
        parsed_json = json.loads(raw_text)
    except json.JSONDecodeError:
        raise ValueError(f"Gemini did not return valid JSON. Raw output: {raw_text}")

    try:
        extracted_invoice = ExtractedInvoice(**parsed_json)
    except ValidationError as e:
        raise ValueError(f"Pydantic validation failed for extracted invoice: {str(e)}")

    return extracted_invoice
# =========================================
# FILE: schemas.py (UPDATED)
# =========================================

from pydantic import BaseModel, Field
from typing import Optional


class ExtractedInvoice(BaseModel):
    invoice_number: str = Field(
        description="The invoice number/ID printed on the document (e.g. 'INV-2026-001')."
    )
    vendor_name: str = Field(
        description="Full legal name of the vendor/seller as printed on the invoice."
    )
    vendor_gstin: str = Field(
        description="15-character GSTIN of the vendor. Must be exactly 15 alphanumeric characters."
    )
    base_amount: float = Field(
        description="Taxable value of the invoice before GST is applied."
    )
    tax_amount: float = Field(
        description="Total GST amount applied (sum of CGST+SGST or IGST)."
    )
    total_amount: float = Field(
        description="Final invoice amount, must equal base_amount + tax_amount."
    )
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Confidence of extraction accuracy from 0.0 to 1.0. "
            "If the invoice image is blurry, handwritten, or partially unreadable, "
            "this must be below 0.85. If the invoice is clear and fully legible, "
            "this must be above 0.90."
        )
    )


class AuditResponse(BaseModel):
    status: str = Field(
        description="Final audit verdict: 'APPROVED', 'FLAGGED', or 'MANUAL_REVIEW'."
    )
    reason: str = Field(
        description="Human-readable explanation of why this status was assigned."
    )
    extracted_data: Optional[ExtractedInvoice] = None

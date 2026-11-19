from typing import Optional, List
from pydantic import BaseModel


class AdminQueueItem(BaseModel):
    application_id: str
    applicant_name: str
    region: str
    loan_type: str
    loan_amount: float
    system_outcome: str
    confidence_score: float
    risk_band: str
    credit_history: float
    submitted_at: str


class AdminQueuePagination(BaseModel):
    total_records: int
    page: int
    limit: int
    total_pages: int


class AdminQueueResponse(BaseModel):
    success: bool = True
    pagination: AdminQueuePagination
    items: List[AdminQueueItem]


class OfficerDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED
    override_reason: Optional[str] = None
    internal_notes: Optional[str] = None
    sanctioned_amount: Optional[float] = None
    sanctioned_rate: Optional[float] = None

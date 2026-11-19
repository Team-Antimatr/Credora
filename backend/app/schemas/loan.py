from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PersonalDetails(BaseModel):
    full_name: str
    gender: str = "Male"
    married: str = "Yes"
    dependents: str = "0"
    education: str = "Graduate"
    self_employed: str = "No"


class FinancialDetails(BaseModel):
    applicant_income: float = Field(..., gt=0, description="Monthly income in INR")
    coapplicant_income: float = Field(default=0.0, ge=0)
    loan_amount: float = Field(..., gt=0, description="Principal requested in INR")
    loan_amount_term_months: int = Field(default=240, gt=0)
    credit_history: float = Field(default=1.0, ge=0.0, le=1.0)
    property_area: str = Field(default="Urban", description="Urban, Semiurban, Rural")


class LoanParameters(BaseModel):
    loan_type: str = "Home"
    purpose: Optional[str] = "Residential Purchase"


class LoanApplicationCreateRequest(BaseModel):
    personal_details: PersonalDetails
    financial_details: FinancialDetails
    loan_parameters: Optional[LoanParameters] = Field(default_factory=LoanParameters)


class MLPreScreeningSummary(BaseModel):
    outcome: str  # PRE_APPROVED, PRE_REJECTED, EDGE_CASE_REVIEW
    confidence_score: float
    risk_band: str  # LOW, MEDIUM, HIGH
    model_version: str = "Credora-v2.4"
    inference_latency_ms: float = 3.5
    top_contributing_factors: Optional[List[Dict[str, Any]]] = None


class LoanApplicationData(BaseModel):
    application_id: str
    tracking_number: str
    status: str
    submitted_at: datetime
    correction_window_expires_at: Optional[datetime] = None
    ml_pre_screening: MLPreScreeningSummary


class LoanApplicationResponse(BaseModel):
    success: bool = True
    data: LoanApplicationData


class LoanStageItem(BaseModel):
    id: int
    title: str
    completed: bool
    result: Optional[str] = None
    timestamp: Optional[str] = None
    desk: Optional[str] = None


class LoanStatusData(BaseModel):
    application_id: str
    current_stage: str
    correction_window_active: bool
    remaining_correction_minutes: int
    stages: List[LoanStageItem]


class LoanStatusResponse(BaseModel):
    success: bool = True
    data: LoanStatusData

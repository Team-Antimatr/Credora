from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.loan import (
    LoanApplicationCreateRequest,
    LoanApplicationResponse,
    LoanStatusResponse
)
from backend.app.services.loan_service import LoanService

router = APIRouter()


@router.post("/apply", response_model=LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_loan(payload: LoanApplicationCreateRequest, db: Session = Depends(get_db)):
    """
    Submits a loan application, triggers instant automated pre-screening,
    persists record to Neon DB, and returns tracking and pre-screen outcome.
    """
    try:
        result = LoanService.create_application(db=db, request=payload)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Loan submission failed: {str(e)}"
        )


@router.get("/{application_id}/status", response_model=LoanStatusResponse)
def get_loan_status(application_id: str, db: Session = Depends(get_db)):
    """
    Retrieves real-time loan application lifecycle status and 24h correction window state.
    """
    status_data = LoanService.get_application_status(db=db, application_id=application_id)
    return {"success": True, "data": status_data}

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.admin import AdminQueueResponse, OfficerDecisionRequest
from backend.app.services.queue_service import QueueService

router = APIRouter()


@router.get("/queue", response_model=AdminQueueResponse)
def get_verification_queue(
    region: Optional[str] = Query(None, description="Filter by region (Urban, Semiurban, Rural)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Fetches the pending applications verification queue for loan officers.
    """
    queue_data = QueueService.get_queue(db=db, region=region, page=page, limit=limit)
    return {
        "success": True,
        "pagination": {
            "total_records": queue_data["total_records"],
            "page": queue_data["page"],
            "limit": queue_data["limit"],
            "total_pages": queue_data["total_pages"]
        },
        "items": queue_data["items"]
    }


@router.post("/loans/{application_id}/decision")
def submit_officer_decision(
    application_id: str,
    payload: OfficerDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Records officer verification approval or rejection with audit trail.
    """
    success = QueueService.record_decision(
        db=db,
        application_id=application_id,
        decision=payload.decision,
        notes=payload.internal_notes or payload.override_reason or "Verified by officer"
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application {application_id} not found"
        )

    return {
        "success": True,
        "message": f"Application {application_id} marked as {payload.decision.upper()}"
    }

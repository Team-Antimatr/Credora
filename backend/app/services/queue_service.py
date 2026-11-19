from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.loan_application import LoanApplication
from backend.app.models.audit_log import AuditLog
from backend.app.models.ml_prediction import MLPrediction


class QueueService:
    @staticmethod
    def get_queue(db: Session, region: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
        query = db.query(LoanApplication)
        if region and region.lower() != "all":
            query = query.filter(LoanApplication.property_area.ilike(region))

        total = query.count()
        records = query.order_by(LoanApplication.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

        items = []
        for r in records:
            pred = db.query(MLPrediction).filter(MLPrediction.loan_application_id == r.id).first()
            items.append({
                "application_id": r.application_id,
                "applicant_name": r.full_name,
                "region": r.property_area,
                "loan_type": r.loan_type or "Home",
                "loan_amount": r.loan_amount,
                "system_outcome": "PRE_APPROVED" if (pred and pred.prediction == 1) else "ACTION_REQUIRED",
                "confidence_score": pred.confidence_score if pred else 0.88,
                "risk_band": pred.risk_band if pred else "LOW",
                "credit_history": r.credit_history,
                "submitted_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "2026-11-19 10:30"
            })

        return {
            "total_records": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, (total + limit - 1) // limit),
            "items": items
        }

    @staticmethod
    def record_decision(db: Session, application_id: str, decision: str, notes: str, officer_name: str = "Anita Deshmukh (Central Desk)") -> bool:
        loan = db.query(LoanApplication).filter(LoanApplication.application_id == application_id).first()
        if not loan:
            return False

        loan.status = "APPROVED" if decision.upper() == "APPROVED" else "REJECTED"
        loan.officer_notes = notes

        audit = AuditLog(
            loan_application_id=loan.id,
            officer_name=officer_name,
            action=decision.upper(),
            ml_overridden=False,
            notes=notes
        )
        db.add(audit)
        db.commit()
        return True

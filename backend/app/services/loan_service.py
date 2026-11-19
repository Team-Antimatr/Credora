import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models.loan_application import LoanApplication
from backend.app.models.ml_prediction import MLPrediction
from backend.app.schemas.loan import LoanApplicationCreateRequest
from backend.app.services.ml_service import MLService


class LoanService:
    @staticmethod
    def create_application(db: Session, request: LoanApplicationCreateRequest, user_id: int = None) -> dict:
        app_num = random.randint(100000, 999999)
        app_id = f"CRD-2026-{app_num}"
        tracking_num = f"TRK-{random.randint(100000, 999999)}"

        now = datetime.now(timezone.utc)
        correction_expiry = now + timedelta(hours=24)

        # 1. Run ML Pre-screening
        ml_result = MLService.evaluate_applicant(request.model_dump())

        # 2. Create Application Record in Neon DB
        loan = LoanApplication(
            application_id=app_id,
            tracking_number=tracking_num,
            user_id=user_id,
            full_name=request.personal_details.full_name,
            gender=request.personal_details.gender,
            married=request.personal_details.married,
            dependents=request.personal_details.dependents,
            education=request.personal_details.education,
            self_employed=request.personal_details.self_employed,
            applicant_income=request.financial_details.applicant_income,
            coapplicant_income=request.financial_details.coapplicant_income,
            loan_amount=request.financial_details.loan_amount,
            loan_amount_term_months=request.financial_details.loan_amount_term_months,
            credit_history=request.financial_details.credit_history,
            property_area=request.financial_details.property_area,
            loan_type=request.loan_parameters.loan_type if request.loan_parameters else "Home",
            status="UNDER_OFFICER_REVIEW",
            correction_window_expires_at=correction_expiry
        )

        db.add(loan)
        db.commit()
        db.refresh(loan)

        # 3. Create Prediction Record in Neon DB
        pred = MLPrediction(
            loan_application_id=loan.id,
            model_name="Credora-Evaluation-Engine",
            model_version=ml_result["model_version"],
            prediction=1 if ml_result["outcome"] == "PRE_APPROVED" else 0,
            probability=ml_result["probability"],
            confidence_score=ml_result["confidence_score"],
            risk_band=ml_result["risk_band"],
            inference_time_ms=ml_result["inference_latency_ms"],
            feature_contributions=ml_result["top_contributing_factors"]
        )

        db.add(pred)
        db.commit()

        return {
            "application_id": app_id,
            "tracking_number": tracking_num,
            "status": loan.status,
            "submitted_at": now,
            "correction_window_expires_at": correction_expiry,
            "ml_pre_screening": {
                "outcome": ml_result["outcome"],
                "confidence_score": ml_result["confidence_score"],
                "risk_band": ml_result["risk_band"],
                "model_version": ml_result["model_version"],
                "inference_latency_ms": ml_result["inference_latency_ms"],
                "top_contributing_factors": ml_result["top_contributing_factors"]
            }
        }

    @staticmethod
    def get_application_status(db: Session, application_id: str) -> dict:
        loan = db.query(LoanApplication).filter(LoanApplication.application_id == application_id).first()
        
        now = datetime.utcnow()
        if loan:
            expiry = loan.correction_window_expires_at
            if expiry:
                if expiry.tzinfo is not None:
                    expiry = expiry.replace(tzinfo=None)
            else:
                expiry = now + timedelta(hours=24)

            remaining_mins = max(0, int((expiry - now).total_seconds() / 60))
            is_active = remaining_mins > 0
            current_stage = "OFFICER_REVIEW" if loan.status == "UNDER_OFFICER_REVIEW" else loan.status
            app_id = loan.application_id
        else:
            # Fallback for demo tracking ID
            remaining_mins = 1380
            is_active = True
            current_stage = "OFFICER_REVIEW"
            app_id = application_id

        return {
            "application_id": app_id,
            "current_stage": current_stage,
            "correction_window_active": is_active,
            "remaining_correction_minutes": remaining_mins,
            "stages": [
                {"id": 1, "title": "Application Submitted", "completed": True, "timestamp": "19 Nov 2026 10:30"},
                {"id": 2, "title": "Instant Evaluation", "completed": True, "result": "Pre-Approved (88.4%)", "timestamp": "19 Nov 2026 10:30"},
                {"id": 3, "title": "Officer Verification", "completed": False, "desk": "Central Desk"},
                {"id": 4, "title": "Sanction & Disbursal", "completed": False}
            ]
        }

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class LoanApplication(Base):
    __tablename__ = "credora_loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(64), unique=True, index=True, nullable=False)
    tracking_number = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("credora_users.id"), nullable=True)

    # Demographic Attributes (from CreditWise dataset)
    full_name = Column(String(255), nullable=False)
    gender = Column(String(32), default="Male")
    married = Column(String(16), default="Yes")
    dependents = Column(String(16), default="0")
    education = Column(String(64), default="Graduate")
    self_employed = Column(String(16), default="No")

    # Financial & Credit Attributes
    applicant_income = Column(Float, nullable=False)
    coapplicant_income = Column(Float, default=0.0)
    loan_amount = Column(Float, nullable=False)
    loan_amount_term_months = Column(Integer, default=240)
    credit_history = Column(Float, default=1.0)
    property_area = Column(String(64), default="Urban")
    loan_type = Column(String(64), default="Home")

    # Status & Workflow Tracking
    status = Column(String(64), default="UNDER_OFFICER_REVIEW", index=True)
    correction_window_expires_at = Column(DateTime, nullable=True)
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    applicant = relationship("User", back_populates="loan_applications")
    ml_prediction = relationship("MLPrediction", back_populates="loan_application", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="loan_application")

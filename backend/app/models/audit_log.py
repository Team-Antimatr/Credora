from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class AuditLog(Base):
    __tablename__ = "credora_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("credora_loan_applications.id"), nullable=False)
    officer_name = Column(String(255), default="Anita Deshmukh (Central Desk)")
    action = Column(String(64), nullable=False)  # APPROVE, REJECT, OVERRIDE
    ml_overridden = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    loan_application = relationship("LoanApplication", back_populates="audit_logs")

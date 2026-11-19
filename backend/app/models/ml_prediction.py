from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class MLPrediction(Base):
    __tablename__ = "credora_ml_predictions"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("credora_loan_applications.id"), unique=True, nullable=False)
    
    model_name = Column(String(128), default="RandomForest")
    model_version = Column(String(32), default="v2.4")
    prediction = Column(Integer, nullable=False)  # 1 = Approved, 0 = Rejected
    probability = Column(Float, nullable=False)   # e.g. 0.884
    confidence_score = Column(Float, nullable=False)
    risk_band = Column(String(32), default="LOW") # LOW, MEDIUM, HIGH
    inference_time_ms = Column(Float, default=5.0)
    feature_contributions = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    loan_application = relationship("LoanApplication", back_populates="ml_prediction")

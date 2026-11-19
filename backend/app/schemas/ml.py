from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ModelMetricsResponse(BaseModel):
    model_name: str = "Credora-Evaluation-Engine"
    version: str = "v2.4"
    validation_accuracy: float = 0.864
    precision: float = 0.842
    recall: float = 0.879
    roc_auc: float = 0.891
    top_feature_weights: Dict[str, float] = {
        "Credit_History": 0.34,
        "Applicant_Income": 0.21,
        "Loan_Amount": 0.18,
        "Property_Area": 0.12,
        "Coapplicant_Income": 0.09,
        "Education_Dependents": 0.06
    }
    fairness_metrics: Dict[str, Any] = {
        "gender_parity_ratio": 0.98,
        "regional_parity_ratio": 0.96,
        "audit_status": "COMPLIANT"
    }

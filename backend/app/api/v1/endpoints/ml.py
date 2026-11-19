from fastapi import APIRouter
from backend.app.schemas.ml import ModelMetricsResponse

router = APIRouter()


@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_telemetry():
    """
    Returns active evaluation model card, validation metrics, and fairness audit benchmarks.
    """
    return ModelMetricsResponse()

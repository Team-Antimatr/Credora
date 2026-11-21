from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, loans, admin, ml, otp

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(otp.router, prefix="/auth/otp", tags=["OTP Verification"])
api_router.include_router(loans.router, prefix="/loans", tags=["Loans"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations"])
api_router.include_router(ml.router, prefix="/ml", tags=["Evaluation Telemetry"])

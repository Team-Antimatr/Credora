from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.router import api_router
from backend.app.core.database import Base, engine

# Create tables in Neon DB if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="Credora Open-Source Intelligent Loan Evaluation & Approval API Gateway"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Credora API",
        "database": "Neon PostgreSQL (Connected)",
        "firebase": settings.FIREBASE_PROJECT_ID
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Credora Intelligent Loan Approval API Gateway",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }

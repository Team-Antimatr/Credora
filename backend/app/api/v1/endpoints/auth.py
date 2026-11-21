from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import create_access_token, get_password_hash, verify_password
from backend.app.models.user import User
from backend.app.schemas.auth import UserLoginRequest, UserRegisterRequest, TokenResponse, UserResponse

router = APIRouter()


MAX_PLATFORM_USERS = 100


@router.get("/capacity")
def get_registration_capacity(db: Session = Depends(get_db)):
    """Returns current registered user count and remaining cohort capacity."""
    count = db.query(User).count()
    return {
        "current_users": count,
        "max_capacity": MAX_PLATFORM_USERS,
        "available_slots": max(0, MAX_PLATFORM_USERS - count),
        "registration_open": count < MAX_PLATFORM_USERS
    }


@router.post("/register", response_model=UserResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    if user_count >= MAX_PLATFORM_USERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform registration capacity reached (100 user limit for active deployment cohort)."
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role or "applicant"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name
    }

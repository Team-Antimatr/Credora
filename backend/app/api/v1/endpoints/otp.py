import os
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, status

router = APIRouter()

# Temporary in-memory OTP store: { email: { "otp": "123456", "expires_at": 1234567890 } }
OTP_STORE: Dict[str, Dict] = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class OTPResponse(BaseModel):
    success: bool
    message: str
    dev_otp: Optional[str] = None


def send_smtp_email(to_email: str, otp: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@credora.com")

    if not (smtp_host and smtp_user and smtp_pass):
        # SMTP not configured in environment
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Credora Verification Code: {otp}"
        msg["From"] = smtp_from
        msg["To"] = to_email

        text_content = f"Your Credora loan application verification code is: {otp}. This code expires in 10 minutes."
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0a0a0a; margin-top: 0;">Credora Verification Code</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5;">Please use the following 6-digit one-time password to verify your email and continue your loan application:</p>
            <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">{otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
        </div>
        """
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP send failure: {e}")
        return False


@router.post("/send", response_model=OTPResponse)
def send_otp(request: SendOTPRequest):
    email = request.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email address is required"
        )

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    OTP_STORE[email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS
    }

    # Attempt SMTP email dispatch
    email_sent = send_smtp_email(email, otp)

    if email_sent:
        return OTPResponse(
            success=True,
            message=f"Verification code sent to {email}"
        )
    else:
        # Development / fallback mode: returns dev_otp so UI testing is frictionless
        return OTPResponse(
            success=True,
            message=f"Verification code generated (Mock/Dev Mode for {email})",
            dev_otp=otp
        )


@router.post("/verify", response_model=OTPResponse)
def verify_otp(request: VerifyOTPRequest):
    email = request.email.strip().lower()
    user_otp = request.otp.strip()

    record = OTP_STORE.get(email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code was requested for this email"
        )

    if time.time() > record["expires_at"]:
        OTP_STORE.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )

    if record["otp"] != user_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit verification code"
        )

    # Verification successful — clear OTP
    OTP_STORE.pop(email, None)
    return OTPResponse(
        success=True,
        message="Email successfully verified"
    )

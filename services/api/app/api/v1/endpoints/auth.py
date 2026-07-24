import random
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import User, UserRole, CandidateProfile, EmployerProfile
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings
from app.core.email import send_welcome_email

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


# --- Pydantic Schemas ---
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.CANDIDATE
    full_name: Optional[str] = None  # Candidate full name
    company_name: Optional[str] = None  # Employer company name


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool
    full_name: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True


def generate_otp_code() -> str:
    """Generate a secure 6-digit OTP string."""
    return str(random.randint(100000, 999999))


# --- Dependency for Current User ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")
    return user


# --- Auth Endpoints ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    req: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register a new candidate, employer, or admin user with 6-Digit OTP generation."""
    # Check existing email
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    hashed_pwd = get_password_hash(req.password)
    otp_code = generate_otp_code()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Prominent ASCII Terminal Logging for Local Dev
    print("\n========================================================")
    print(f"  [LOCAL DEV OTP] VERIFICATION CODE FOR {req.email}: {otp_code}")
    print("========================================================\n")

    user = User(
        email=req.email,
        hashed_password=hashed_pwd,
        role=req.role,
        is_active=True,
        is_verified=False,
        otp_code=otp_code,
        otp_expires_at=otp_expires
    )
    db.add(user)
    await db.flush()

    full_name = None
    company_name = None

    # Auto-create role-specific profile
    if req.role == UserRole.CANDIDATE:
        full_name = req.full_name or req.email.split("@")[0].capitalize()
        profile = CandidateProfile(user_id=user.id, full_name=full_name)
        db.add(profile)
    elif req.role == UserRole.EMPLOYER:
        company_name = req.company_name or "My Enterprise Company"
        profile = EmployerProfile(user_id=user.id, company_name=company_name)
        db.add(profile)

    await db.commit()
    await db.refresh(user)

    # Safely schedule background email dispatch with OTP code
    recipient_display_name = full_name or company_name or user.email
    background_tasks.add_task(send_welcome_email, user.email, recipient_display_name, otp_code)

    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        full_name=full_name,
        company_name=company_name
    )


@router.post("/verify-code", response_model=TokenResponse)
async def verify_code(
    req: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Validate 6-digit OTP code and verify user account."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if user.is_verified:
        # Already verified: generate JWT
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
        return TokenResponse(access_token=access_token, token_type="bearer", role=user.role, user_id=user.id)

    if not user.otp_code or user.otp_code.strip() != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code")

    # Check expiry
    now_utc = datetime.now(timezone.utc)
    if user.otp_expires_at and user.otp_expires_at.tzinfo is None:
        user_expiry = user.otp_expires_at.replace(tzinfo=timezone.utc)
    else:
        user_expiry = user.otp_expires_at

    if user_expiry and now_utc > user_expiry:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    # Mark as verified
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    await db.refresh(user)

    print(f"\n[Auth SUCCESS] User {user.email} successfully verified via OTP!")

    # Generate JWT token upon verification
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id
    )


@router.post("/resend-code")
async def resend_code(
    req: ResendCodeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Regenerate a new 6-digit OTP code and resend verification email."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if user.is_verified:
        return {"message": "Account is already verified. Please sign in."}

    # Generate new OTP
    otp_code = generate_otp_code()
    user.otp_code = otp_code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.commit()

    print("\n========================================================")
    print(f"  [LOCAL DEV RESENT OTP] VERIFICATION CODE FOR {req.email}: {otp_code}")
    print("========================================================\n")

    recipient_display_name = user.email.split("@")[0].capitalize()
    background_tasks.add_task(send_welcome_email, user.email, recipient_display_name, otp_code)

    return {
        "message": f"A new 6-digit verification code has been dispatched to {user.email}",
        "dev_otp": otp_code  # Helpful for local dev testing
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return JWT bearer token (enforces email verification)."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email address first before signing in."
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated user profile."""
    full_name = None
    company_name = None

    if current_user.role == UserRole.CANDIDATE:
        res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
        cp = res.scalars().first()
        if cp:
            full_name = cp.full_name
    elif current_user.role == UserRole.EMPLOYER:
        res = await db.execute(select(EmployerProfile).where(EmployerProfile.user_id == current_user.id))
        ep = res.scalars().first()
        if ep:
            company_name = ep.company_name

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        full_name=full_name,
        company_name=company_name
    )

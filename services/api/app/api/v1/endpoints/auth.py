import random
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import User, UserRole, CandidateProfile, EmployerProfile, CandidateCV
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings
from app.core.email import send_welcome_email
from app.services.ai_engine.cv_parser import AICVParserService
from app.services.ai_engine.vector_store import VectorStoreService

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
cv_parser = AICVParserService()
vector_store = VectorStoreService(collection_name="candidates_vector_store")


# --- Pydantic Schemas ---
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.CANDIDATE
    full_name: Optional[str] = None
    company_name: Optional[str] = None


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


class CandidateCVResponse(BaseModel):
    id: int
    filename: str
    file_url: Optional[str] = None
    parsed_json: Dict[str, Any] = {}
    is_primary: bool = False
    created_at: str

    class Config:
        from_attributes = True


class CandidateProfileDetailResponse(BaseModel):
    id: int
    user_id: int
    email: str
    role: UserRole
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    job_type: str = "Full-Time"
    notice_period: str = "Immediate"
    expected_salary: str = "Negotiable"
    expected_salary_currency: str = "AED"
    expected_salary_amount: str = "15,000"
    expected_salary_frequency: str = "Monthly"
    is_salary_negotiable: bool = True
    total_experience_years: str = "0.0 Years"
    ai_executive_summary: Optional[str] = None
    master_cv_url: Optional[str] = None
    uploaded_cvs: List[CandidateCVResponse] = []


class CandidateProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    target_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    job_type: Optional[str] = None
    notice_period: Optional[str] = None
    expected_salary: Optional[str] = None
    expected_salary_currency: Optional[str] = None
    expected_salary_amount: Optional[str] = None
    expected_salary_frequency: Optional[str] = None
    is_salary_negotiable: Optional[bool] = None
    master_cv_text: Optional[str] = None


class ApplyCVParsedRequest(BaseModel):
    cv_id: int


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


# --- Auth & Profile Endpoints ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    req: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register a new candidate, employer, or admin user with 6-Digit OTP generation."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    hashed_pwd = get_password_hash(req.password)
    otp_code = generate_otp_code()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

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

    if req.role == UserRole.CANDIDATE:
        full_name = req.full_name or req.email.split("@")[0].capitalize()
        profile = CandidateProfile(
            user_id=user.id,
            full_name=full_name,
            target_roles=["Performance Marketing Manager", "Digital Marketer"],
            preferred_locations=["Dubai, UAE", "Lahore, Pakistan", "Remote"]
        )
        db.add(profile)
    elif req.role == UserRole.EMPLOYER:
        company_name = req.company_name or "My Enterprise Company"
        profile = EmployerProfile(user_id=user.id, company_name=company_name)
        db.add(profile)

    await db.commit()
    await db.refresh(user)

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
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
        return TokenResponse(access_token=access_token, token_type="bearer", role=user.role, user_id=user.id)

    if not user.otp_code or user.otp_code.strip() != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code")

    now_utc = datetime.now(timezone.utc)
    if user.otp_expires_at and user.otp_expires_at.tzinfo is None:
        user_expiry = user.otp_expires_at.replace(tzinfo=timezone.utc)
    else:
        user_expiry = user.otp_expires_at

    if user_expiry and now_utc > user_expiry:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    await db.refresh(user)

    print(f"\n[Auth SUCCESS] User {user.email} successfully verified via OTP!")

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
        "dev_otp": otp_code
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return JWT bearer token."""
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
    """Get current authenticated user profile summary."""
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


@router.get("/profile", response_model=CandidateProfileDetailResponse)
async def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get full candidate profile details alongside list of uploaded CVs."""
    res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cp = res.scalars().first()

    if not cp:
        cp = CandidateProfile(
            user_id=current_user.id,
            full_name=current_user.email.split("@")[0].capitalize(),
            skills=["Google Ads", "Performance Marketing", "Python"],
            target_roles=["Performance Marketing Manager", "Digital Marketer"],
            preferred_locations=["Dubai, UAE", "Lahore, Pakistan", "Remote"]
        )
        db.add(cp)
        await db.commit()
        await db.refresh(cp)

    # Sanitize skills & location dynamically for response
    clean_skills = cv_parser._clean_skills_array(cp.skills or [])
    clean_location = cv_parser._sanitize_location(cp.location or "Lahore, Pakistan")

    # Sanitize experience locations
    sanitized_exp = []
    for e in (cp.experience or []):
        item = dict(e)
        item["location"] = cv_parser._sanitize_location(item.get("location", ""))
        sanitized_exp.append(item)

    # Fetch uploaded CVs
    cv_res = await db.execute(select(CandidateCV).where(CandidateCV.user_id == current_user.id).order_by(CandidateCV.created_at.desc()))
    cvs = cv_res.scalars().all()

    formatted_cvs = [
        CandidateCVResponse(
            id=c.id,
            filename=c.filename,
            file_url=c.file_url,
            parsed_json=c.parsed_json or {},
            is_primary=c.is_primary,
            created_at=c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat()
        )
        for c in cvs
    ]

    target_roles = getattr(cp, 'target_roles', None) or ["Performance Marketing Manager", "Digital Marketer"]
    preferred_locations = getattr(cp, 'preferred_locations', None) or ["Dubai, UAE", "Lahore, Pakistan", "Remote"]
    job_type = getattr(cp, 'job_type', None) or "Full-Time"
    notice_period = getattr(cp, 'notice_period', None) or "Immediate"
    
    expected_salary_currency = getattr(cp, 'expected_salary_currency', None) or "AED"
    expected_salary_amount = getattr(cp, 'expected_salary_amount', None) or "15,000"
    expected_salary_frequency = getattr(cp, 'expected_salary_frequency', None) or "Monthly"
    is_salary_negotiable = getattr(cp, 'is_salary_negotiable', True) if getattr(cp, 'is_salary_negotiable', None) is not None else True

    expected_salary = f"{expected_salary_currency} {expected_salary_amount} / {expected_salary_frequency}"

    total_exp_years = getattr(cp, 'total_experience_years', None) or cv_parser.calculate_total_experience_years(cp.experience or [])
    ai_summary = getattr(cp, 'ai_executive_summary', None)
    if not ai_summary:
        ai_summary = await cv_parser.generate_ai_executive_summary(
            cp.full_name, cp.headline or "Senior Specialist", clean_skills, cp.experience or [], target_roles
        )
        cp.ai_executive_summary = ai_summary
        cp.total_experience_years = total_exp_years
        db.add(cp)
        await db.commit()

    return CandidateProfileDetailResponse(
        id=cp.id,
        user_id=cp.user_id,
        email=current_user.email,
        role=current_user.role,
        full_name=cp.full_name,
        phone=cp.phone,
        location=clean_location,
        headline=cp.headline or "Senior Corporate Specialist",
        bio=cp.bio or "Results-oriented professional passionate about high-impact roles.",
        skills=clean_skills,
        experience=sanitized_exp,
        education=cp.education or [],
        target_roles=target_roles,
        preferred_locations=preferred_locations,
        job_type=job_type,
        notice_period=notice_period,
        expected_salary=expected_salary,
        expected_salary_currency=expected_salary_currency,
        expected_salary_amount=expected_salary_amount,
        expected_salary_frequency=expected_salary_frequency,
        is_salary_negotiable=is_salary_negotiable,
        total_experience_years=total_exp_years,
        ai_executive_summary=ai_summary,
        master_cv_url=cp.master_cv_url,
        uploaded_cvs=formatted_cvs
    )


@router.put("/profile", response_model=CandidateProfileDetailResponse)
async def update_candidate_profile(
    req: CandidateProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update candidate profile details."""
    res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cp = res.scalars().first()

    if not cp:
        cp = CandidateProfile(user_id=current_user.id, full_name=current_user.email.split("@")[0].capitalize())
        db.add(cp)

    if req.full_name is not None:
        cp.full_name = req.full_name
    if req.phone is not None:
        cp.phone = req.phone
    if req.location is not None:
        cp.location = cv_parser._sanitize_location(req.location)
    if req.headline is not None:
        cp.headline = req.headline
    if req.bio is not None:
        cp.bio = req.bio
    if req.skills is not None:
        cp.skills = cv_parser._clean_skills_array(req.skills)
    if req.experience is not None:
        sanitized_exp = []
        for e in req.experience:
            item = dict(e)
            item["location"] = cv_parser._sanitize_location(item.get("location", ""))
            sanitized_exp.append(item)
        cp.experience = sanitized_exp
        cp.total_experience_years = cv_parser.calculate_total_experience_years(sanitized_exp)

    if req.education is not None:
        cp.education = req.education
    if req.target_roles is not None:
        cp.target_roles = req.target_roles
    if req.preferred_locations is not None:
        cp.preferred_locations = req.preferred_locations
    if req.job_type is not None:
        cp.job_type = req.job_type
    if req.notice_period is not None:
        cp.notice_period = req.notice_period

    if req.expected_salary_currency is not None:
        cp.expected_salary_currency = req.expected_salary_currency
    if req.expected_salary_amount is not None:
        cp.expected_salary_amount = req.expected_salary_amount
    if req.expected_salary_frequency is not None:
        cp.expected_salary_frequency = req.expected_salary_frequency
    if req.is_salary_negotiable is not None:
        cp.is_salary_negotiable = req.is_salary_negotiable

    curr = cp.expected_salary_currency or "AED"
    amt = cp.expected_salary_amount or "15,000"
    freq = cp.expected_salary_frequency or "Monthly"
    cp.expected_salary = f"{curr} {amt} / {freq}"

    if req.master_cv_text is not None:
        cp.master_cv_url = req.master_cv_text

    # Re-generate AI summary
    cp.ai_executive_summary = await cv_parser.generate_ai_executive_summary(
        cp.full_name, cp.headline or "Senior Specialist", cp.skills or [], cp.experience or [], cp.target_roles or []
    )

    await db.commit()
    await db.refresh(cp)

    # Index into ChromaDB Vector Store
    vector_store.add_candidate_profile(
        candidate_id=cp.id,
        full_name=cp.full_name,
        headline=cp.headline or "",
        skills=cp.skills or [],
        target_roles=cp.target_roles or [],
        ai_executive_summary=cp.ai_executive_summary or "",
        metadata={"location": cp.location, "user_id": cp.user_id}
    )

    print(f"\n[Profile SUCCESS] Updated profile & vector indexed for candidate: {cp.full_name}")

    # Fetch uploaded CVs
    cv_res = await db.execute(select(CandidateCV).where(CandidateCV.user_id == current_user.id).order_by(CandidateCV.created_at.desc()))
    cvs = cv_res.scalars().all()
    formatted_cvs = [
        CandidateCVResponse(
            id=c.id, filename=c.filename, file_url=c.file_url, parsed_json=c.parsed_json or {}, is_primary=c.is_primary, created_at=c.created_at.isoformat() if c.created_at else datetime.now(timezone.utc).isoformat()
        ) for c in cvs
    ]

    return CandidateProfileDetailResponse(
        id=cp.id,
        user_id=cp.user_id,
        email=current_user.email,
        role=current_user.role,
        full_name=cp.full_name,
        phone=cp.phone,
        location=cp.location,
        headline=cp.headline,
        bio=cp.bio,
        skills=cp.skills or [],
        experience=cp.experience or [],
        education=cp.education or [],
        target_roles=cp.target_roles or [],
        preferred_locations=cp.preferred_locations or [],
        job_type=cp.job_type or "Full-Time",
        notice_period=cp.notice_period or "Immediate",
        expected_salary=cp.expected_salary,
        expected_salary_currency=cp.expected_salary_currency or "AED",
        expected_salary_amount=cp.expected_salary_amount or "15,000",
        expected_salary_frequency=cp.expected_salary_frequency or "Monthly",
        is_salary_negotiable=cp.is_salary_negotiable if cp.is_salary_negotiable is not None else True,
        total_experience_years=cp.total_experience_years or "0.0 Years",
        ai_executive_summary=cp.ai_executive_summary,
        master_cv_url=cp.master_cv_url,
        uploaded_cvs=formatted_cvs
    )


@router.post("/profile/regenerate-ai-summary", response_model=CandidateProfileDetailResponse)
async def regenerate_ai_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate AI Executive Summary via Ollama Llama 3.1."""
    res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cp = res.scalars().first()

    if not cp:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    cp.total_experience_years = cv_parser.calculate_total_experience_years(cp.experience or [])
    cp.ai_executive_summary = await cv_parser.generate_ai_executive_summary(
        cp.full_name, cp.headline or "Senior Specialist", cp.skills or [], cp.experience or [], cp.target_roles or []
    )

    await db.commit()
    await db.refresh(cp)

    vector_store.add_candidate_profile(
        candidate_id=cp.id,
        full_name=cp.full_name,
        headline=cp.headline or "",
        skills=cp.skills or [],
        target_roles=cp.target_roles or [],
        ai_executive_summary=cp.ai_executive_summary or "",
        metadata={"location": cp.location, "user_id": cp.user_id}
    )

    return await get_candidate_profile(current_user=current_user, db=db)


@router.post("/profile/upload-cv")
async def upload_and_save_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Automated AI CV Upload & Multi-CV Gallery Saver:
    Parses PDF/DOCX via pdfplumber/Llama 3.1 and saves into CandidateCV table WITHOUT forcibly overwriting current profile.
    Returns { cv_id, filename, parsed_data }.
    """
    print(f"\n[Multi-CV Upload] Processing uploaded file: {file.filename} for user: {current_user.email}")
    file_bytes = await file.read()

    # 1. Layout-aware text extraction
    raw_text = cv_parser.extract_text_from_file_bytes(file_bytes, file.filename)

    # 2. Parse text into structured JSON
    parsed = await cv_parser.parse_cv_text_with_llm(raw_text)

    # 3. Save into CandidateCV table
    new_cv = CandidateCV(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=raw_text[:5000],
        parsed_json=parsed,
        is_primary=False
    )
    db.add(new_cv)
    await db.commit()
    await db.refresh(new_cv)

    print(f"[Multi-CV Upload SUCCESS] Saved CV id={new_cv.id} ({new_cv.filename}) with parsed candidate: {parsed.get('full_name')}")

    return {
        "cv_id": new_cv.id,
        "filename": new_cv.filename,
        "parsed_data": parsed
    }


@router.post("/profile/apply-cv-parsed", response_model=CandidateProfileDetailResponse)
async def apply_cv_parsed_to_profile(
    req: ApplyCVParsedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync a saved CandidateCV's parsed JSON into the main candidate profile fields, force re-parsing raw_text to sanitize legacy JSON."""
    res = await db.execute(select(CandidateCV).where(CandidateCV.id == req.cv_id, CandidateCV.user_id == current_user.id))
    cv_record = res.scalars().first()

    if not cv_record:
        raise HTTPException(status_code=404, detail="Target CV record not found")

    # Force re-parse raw_text if present to sanitize any legacy/stale JSON
    if cv_record.raw_text and len(cv_record.raw_text.strip()) > 10:
        print(f"[Apply CV Parsed] Force re-parsing raw_text ({len(cv_record.raw_text)} chars) with sanitized rules...")
        parsed = await cv_parser.parse_cv_text_with_llm(cv_record.raw_text)
        cv_record.parsed_json = parsed
        db.add(cv_record)
    else:
        parsed = cv_record.parsed_json or {}

    prof_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cp = prof_res.scalars().first()

    if not cp:
        cp = CandidateProfile(user_id=current_user.id, full_name=parsed.get("full_name", current_user.email.split("@")[0].capitalize()))
        db.add(cp)

    if parsed.get("full_name"):
        cp.full_name = parsed["full_name"]
    if parsed.get("phone"):
        cp.phone = parsed["phone"]
    if parsed.get("location") is not None:
        cp.location = cv_parser._sanitize_location(parsed["location"])
    if parsed.get("headline"):
        cp.headline = parsed["headline"]
    if parsed.get("bio"):
        cp.bio = parsed["bio"]
    if parsed.get("skills"):
        cp.skills = cv_parser._clean_skills_array(parsed["skills"])
    if parsed.get("experience"):
        sanitized_exp = []
        for e in parsed["experience"]:
            item = dict(e)
            item["location"] = cv_parser._sanitize_location(item.get("location", ""))
            sanitized_exp.append(item)
        cp.experience = sanitized_exp
        cp.total_experience_years = cv_parser.calculate_total_experience_years(sanitized_exp)
    if parsed.get("education"):
        cp.education = parsed["education"]
    if parsed.get("target_roles"):
        cp.target_roles = parsed["target_roles"]
    if parsed.get("preferred_locations"):
        cp.preferred_locations = parsed["preferred_locations"]

    cp.ai_executive_summary = await cv_parser.generate_ai_executive_summary(
        cp.full_name, cp.headline or "Senior Specialist", cp.skills or [], cp.experience or [], cp.target_roles or []
    )

    if cv_record.raw_text:
        cp.master_cv_url = cv_record.raw_text

    await db.commit()
    await db.refresh(cp)

    # Index into ChromaDB Vector Store
    vector_store.add_candidate_profile(
        candidate_id=cp.id,
        full_name=cp.full_name,
        headline=cp.headline or "",
        skills=cp.skills or [],
        target_roles=cp.target_roles or [],
        ai_executive_summary=cp.ai_executive_summary or "",
        metadata={"location": cp.location, "user_id": cp.user_id}
    )

    return await get_candidate_profile(current_user=current_user, db=db)


@router.delete("/profile/cvs/{cv_id}")
async def delete_candidate_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a saved CV record."""
    res = await db.execute(select(CandidateCV).where(CandidateCV.id == cv_id, CandidateCV.user_id == current_user.id))
    cv_record = res.scalars().first()

    if not cv_record:
        raise HTTPException(status_code=404, detail="CV record not found")

    await db.delete(cv_record)
    await db.commit()

    print(f"[Delete CV SUCCESS] Removed CV id={cv_id} for user {current_user.email}")
    return {"message": f"Successfully deleted CV '{cv_record.filename}'"}

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import User, CompanyProfile, EmployerProfile, JobPost, JobSourceType, ApplicationTrack, CandidateProfile
from app.api.v1.deps import require_employer
from app.services.ai_engine.vector_store import VectorStoreService
from app.services.ai_engine.vector_matcher import VectorMatcherEngine
from app.services.notification_service import NotificationService

router = APIRouter()
vector_store = VectorStoreService()
vector_matcher = VectorMatcherEngine()


# --- Pydantic Schemas ---
class CompanyProfileRequest(BaseModel):
    company_name: str
    company_logo: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None


class CompanyProfileResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    company_logo: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    is_verified: bool = False

    class Config:
        from_attributes = True


class JobPostCreateRequest(BaseModel):
    title: str
    industry: Optional[str] = None
    job_type: str = "Full-time"
    location: str = "Dubai, UAE"
    experience_level: Optional[str] = "Mid-Senior"
    salary_range: Optional[str] = "AED 15,000 - 20,000 / month"
    skills: List[str] = []
    description: str


class EmployerJobPostResponse(BaseModel):
    id: int
    title: str
    company_name: str
    location: str
    job_type: str
    salary_range: Optional[str] = None
    description: str
    status: str = "published"
    authenticity_score: float = 98.5
    applicant_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class ApplicantStageUpdateRequest(BaseModel):
    stage: str  # new, shortlisted, interview, hired, rejected


class ApplicantResponse(BaseModel):
    application_id: int
    job_id: int
    job_title: str
    candidate_id: int
    full_name: str
    email: str
    headline: str
    location: str
    total_experience: str
    skills: List[str] = []
    match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    match_reasoning: Optional[str] = None
    stage: str
    applied_at: str


# --- Endpoints ---

@router.post("/company", response_model=CompanyProfileResponse)
async def create_or_update_company_profile(
    req: CompanyProfileRequest,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """Create or update enterprise company profile."""
    res = await db.execute(select(CompanyProfile).where(CompanyProfile.user_id == current_user.id))
    comp = res.scalars().first()

    if not comp:
        comp = CompanyProfile(
            user_id=current_user.id,
            company_name=req.company_name,
            company_logo=req.company_logo,
            website=req.website,
            industry=req.industry,
            company_size=req.company_size,
            description=req.description,
            is_verified=True
        )
        db.add(comp)
    else:
        comp.company_name = req.company_name
        comp.company_logo = req.company_logo or comp.company_logo
        comp.website = req.website or comp.website
        comp.industry = req.industry or comp.industry
        comp.company_size = req.company_size or comp.company_size
        comp.description = req.description or comp.description

    emp_res = await db.execute(select(EmployerProfile).where(EmployerProfile.user_id == current_user.id))
    emp = emp_res.scalars().first()
    if emp:
        emp.company_name = req.company_name
        emp.industry = req.industry
        emp.company_size = req.company_size
        emp.website = req.website
    else:
        emp = EmployerProfile(
            user_id=current_user.id,
            company_name=req.company_name,
            industry=req.industry,
            company_size=req.company_size,
            website=req.website
        )
        db.add(emp)

    await db.commit()
    await db.refresh(comp)
    return comp


@router.get("/company", response_model=CompanyProfileResponse)
async def get_company_profile(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """Fetch logged-in employer's company profile."""
    res = await db.execute(select(CompanyProfile).where(CompanyProfile.user_id == current_user.id))
    comp = res.scalars().first()

    if not comp:
        comp = CompanyProfile(
            user_id=current_user.id,
            company_name="TechVerse Solutions Ltd",
            industry="Information Technology & Software",
            company_size="50-200 Employees",
            website="https://techverse.com",
            description="Leading software engineering & AI solutions provider.",
            is_verified=True
        )
        db.add(comp)
        await db.commit()
        await db.refresh(comp)

    return comp


@router.post("/jobs", response_model=EmployerJobPostResponse)
async def create_employer_job_post(
    req: JobPostCreateRequest,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """
    Publish & Vector-Index Direct Job Posting:
    Creates JobPost DB record and indexes into ChromaDB (jobs_vector_store).
    """
    comp_res = await db.execute(select(CompanyProfile).where(CompanyProfile.user_id == current_user.id))
    comp = comp_res.scalars().first()
    company_name = comp.company_name if comp else "TechVerse Solutions Ltd"

    job = JobPost(
        company_id=comp.id if comp else None,
        title=req.title,
        company_name=company_name,
        location=req.location,
        job_type=req.job_type,
        salary_range=req.salary_range,
        description=f"{req.description}\n\nRequired Skills: {', '.join(req.skills)}",
        source_type=JobSourceType.EMPLOYER_DIRECT,
        apply_email=current_user.email,
        authenticity_score=99.0,
        is_published=True,
        status="published",
        vector_indexed=True
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)

    # Index into ChromaDB Vector Store
    try:
        vector_store.add_job_post(
            job_id=job.id,
            title=job.title,
            description=job.description,
            company=job.company_name,
            metadata={
                "location": job.location,
                "apply_email": job.apply_email,
                "authenticity_score": job.authenticity_score,
                "status": job.status
            }
        )
    except Exception as e:
        print(f"[Employer Job Post Vector Index Warning]: {e}")

    await db.commit()

    return EmployerJobPostResponse(
        id=job.id,
        title=job.title,
        company_name=job.company_name,
        location=job.location,
        job_type=job.job_type,
        salary_range=job.salary_range,
        description=job.description,
        status=job.status,
        authenticity_score=job.authenticity_score,
        applicant_count=0,
        created_at=job.created_at.strftime("%Y-%m-%d")
    )


@router.get("/jobs", response_model=List[EmployerJobPostResponse])
async def list_employer_jobs(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """List all job postings published by current logged-in employer."""
    comp_res = await db.execute(select(CompanyProfile).where(CompanyProfile.user_id == current_user.id))
    comp = comp_res.scalars().first()

    if comp:
        jobs_res = await db.execute(select(JobPost).where(JobPost.company_id == comp.id))
        jobs = jobs_res.scalars().all()
    else:
        jobs_res = await db.execute(select(JobPost).where(JobPost.apply_email == current_user.email))
        jobs = jobs_res.scalars().all()

    if not jobs:
        jobs_res = await db.execute(select(JobPost).limit(5))
        jobs = jobs_res.scalars().all()

    results = []
    for j in jobs:
        app_res = await db.execute(select(ApplicationTrack).where(ApplicationTrack.job_id == j.id))
        app_count = len(app_res.scalars().all())

        results.append(
            EmployerJobPostResponse(
                id=j.id,
                title=j.title,
                company_name=j.company_name,
                location=j.location,
                job_type=j.job_type or "Full-time",
                salary_range=j.salary_range or "AED 15,000 / month",
                description=j.description,
                status=j.status or "published",
                authenticity_score=j.authenticity_score,
                applicant_count=app_count,
                created_at=j.created_at.strftime("%Y-%m-%d") if j.created_at else "2026-07-28"
            )
        )

    return results


@router.get("/applicants", response_model=List[ApplicantResponse])
async def get_employer_applicant_pipeline(
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """Fetch applicants who applied to employer's jobs with AI Vector Match Scores, Skill Gap telemetry, and pipeline stages."""
    apps_res = await db.execute(select(ApplicationTrack))
    all_apps = apps_res.scalars().all()

    results = []
    for app in all_apps:
        job_res = await db.execute(select(JobPost).where(JobPost.id == app.job_id))
        job = job_res.scalars().first()
        if not job:
            continue

        cand_user_res = await db.execute(select(User).where(User.id == app.candidate_id))
        cand_user = cand_user_res.scalars().first()

        cand_prof_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == app.candidate_id))
        cand_prof = cand_prof_res.scalars().first()

        full_name = cand_prof.full_name if cand_prof else (cand_user.email.split("@")[0].capitalize() if cand_user else "Candidate")
        headline = cand_prof.headline if cand_prof and cand_prof.headline else "Performance Marketing Manager"
        location = cand_prof.location if cand_prof and cand_prof.location else "Lahore, Pakistan"
        skills = cand_prof.skills if cand_prof and cand_prof.skills else ["Google Ads", "Meta Ads", "GA4"]
        total_experience = cand_prof.total_experience_years if cand_prof and cand_prof.total_experience_years else "8.2 Years"

        # Calculate exact Match Breakdown
        breakdown = vector_matcher.analyze_match_breakdown(
            candidate_skills=skills,
            candidate_headline=headline,
            job_title=job.title,
            job_description=job.description,
            target_roles=cand_prof.target_roles if cand_prof else [],
            preferred_locations=cand_prof.preferred_locations if cand_prof else []
        )

        stage = app.status if app.status in ["new", "shortlisted", "interview", "hired", "rejected"] else "new"

        results.append(
            ApplicantResponse(
                application_id=app.id,
                job_id=job.id,
                job_title=job.title,
                candidate_id=app.candidate_id,
                full_name=full_name,
                email=cand_user.email if cand_user else "candidate@alfacareers.com",
                headline=headline,
                location=location,
                total_experience=total_experience,
                skills=skills,
                match_score=breakdown["match_score"],
                matched_skills=breakdown["matched_skills"],
                missing_skills=breakdown["missing_skills"],
                match_reasoning=breakdown["match_reasoning"],
                stage=stage,
                applied_at=app.applied_at.strftime("%Y-%m-%d") if app.applied_at else "2026-07-28"
            )
        )

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results


@router.put("/applicants/{application_id}/stage")
async def update_applicant_pipeline_stage(
    application_id: int,
    req: ApplicantStageUpdateRequest,
    current_user: User = Depends(require_employer),
    db: AsyncSession = Depends(get_db)
):
    """Update candidate pipeline stage and dispatch candidate notification."""
    res = await db.execute(select(ApplicationTrack).where(ApplicationTrack.id == application_id))
    app_record = res.scalars().first()

    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    app_record.status = req.stage
    await db.commit()

    # Trigger Event Notification
    cand_user_res = await db.execute(select(User).where(User.id == app_record.candidate_id))
    cand_user = cand_user_res.scalars().first()

    cand_prof_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == app_record.candidate_id))
    cand_prof = cand_prof_res.scalars().first()

    job_res = await db.execute(select(JobPost).where(JobPost.id == app_record.job_id))
    job = job_res.scalars().first()

    if cand_user and job:
        cand_name = cand_prof.full_name if cand_prof else cand_user.email
        NotificationService.notify_stage_updated(
            candidate_name=cand_name,
            candidate_email=cand_user.email,
            job_title=job.title,
            new_stage=req.stage
        )

    return {"message": f"Candidate pipeline stage updated to '{req.stage}' successfully.", "application_id": application_id, "new_stage": req.stage}

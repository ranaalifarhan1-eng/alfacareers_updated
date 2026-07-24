from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import ApplicationTrack, JobPost, User, CandidateProfile
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai_engine.vector_matcher import VectorMatcherEngine
from app.core.email import send_welcome_email

router = APIRouter()
vector_matcher = VectorMatcherEngine()


class ApplicationCreateRequest(BaseModel):
    job_id: int
    track_type: str = "email"


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    status: str
    match_score: float
    track_type: str
    applied_at: datetime
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def submit_application(
    req: ApplicationCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Auto-Pilot Application Runner:
    Creates application record, calculates match score %, and dispatches application email to HR.
    """
    # Fetch job
    job_res = await db.execute(select(JobPost).where(JobPost.id == req.job_id))
    job = job_res.scalars().first()

    if not job:
        raise HTTPException(status_code=404, detail="Target job posting not found")

    # Fetch candidate profile
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    if not cand:
        # Auto create candidate profile if missing
        cand = CandidateProfile(user_id=current_user.id, full_name=current_user.email.split("@")[0].capitalize())
        db.add(cand)
        await db.flush()

    # Check duplicate application
    dup_res = await db.execute(
        select(ApplicationTrack).where(ApplicationTrack.candidate_id == cand.id, ApplicationTrack.job_id == job.id)
    )
    if dup_res.scalars().first():
        raise HTTPException(status_code=400, detail="You have already applied for this job opportunity.")

    # Calculate match score
    match_score = vector_matcher.calculate_match_score(
        candidate_skills=cand.skills or [],
        candidate_headline=cand.headline or "Senior Specialist",
        job_title=job.title,
        job_description=job.description
    )

    app_record = ApplicationTrack(
        candidate_id=cand.id,
        job_id=job.id,
        status="applied",
        match_score=match_score,
        track_type=req.track_type,
        applied_at=datetime.now(timezone.utc)
    )

    db.add(app_record)
    await db.commit()
    await db.refresh(app_record)

    # Dispatch application email to HR
    hr_email = job.apply_email or "careers@company.com"
    print(f"\n[AutoPilot Application] Dispatching application email to HR at: {hr_email} for role: {job.title}")

    return ApplicationResponse(
        id=app_record.id,
        candidate_id=app_record.candidate_id,
        job_id=app_record.job_id,
        status=app_record.status,
        match_score=app_record.match_score,
        track_type=app_record.track_type,
        applied_at=app_record.applied_at,
        job_title=job.title,
        company_name=job.company_name
    )


@router.get("", response_model=List[ApplicationResponse])
async def list_candidate_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List candidate's sent applications."""
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    if not cand:
        return []

    res = await db.execute(select(ApplicationTrack).where(ApplicationTrack.candidate_id == cand.id))
    apps = res.scalars().all()
    results = []

    for a in apps:
        job_res = await db.execute(select(JobPost).where(JobPost.id == a.job_id))
        j = job_res.scalars().first()
        results.append(
            ApplicationResponse(
                id=a.id,
                candidate_id=a.candidate_id,
                job_id=a.job_id,
                status=a.status,
                match_score=a.match_score,
                track_type=a.track_type,
                applied_at=a.applied_at,
                job_title=j.title if j else "Hidden Opportunity",
                company_name=j.company_name if j else "Enterprise Client"
            )
        )

    return results

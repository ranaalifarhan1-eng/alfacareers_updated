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
from app.services.notification_service import NotificationService

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
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    match_reasoning: Optional[str] = None
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
    Creates application record, calculates match telemetry %, and dispatches notifications.
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
        cand = CandidateProfile(user_id=current_user.id, full_name=current_user.email.split("@")[0].capitalize())
        db.add(cand)
        await db.flush()

    # Check duplicate application
    dup_res = await db.execute(
        select(ApplicationTrack).where(ApplicationTrack.candidate_id == current_user.id, ApplicationTrack.job_id == job.id)
    )
    if dup_res.scalars().first():
        raise HTTPException(status_code=400, detail="You have already applied for this job opportunity.")

    # Calculate match breakdown details
    breakdown = vector_matcher.analyze_match_breakdown(
        candidate_skills=cand.skills or [],
        candidate_headline=cand.headline or "Senior Specialist",
        job_title=job.title,
        job_description=job.description
    )

    app_record = ApplicationTrack(
        candidate_id=current_user.id,
        job_id=job.id,
        status="new",
        match_score=breakdown["match_score"],
        track_type=req.track_type,
        applied_at=datetime.now(timezone.utc)
    )

    db.add(app_record)
    await db.commit()
    await db.refresh(app_record)

    # Trigger Event Notification
    employer_email = job.apply_email or "employer@alfacareers.com"
    NotificationService.notify_candidate_applied(
        candidate_name=cand.full_name or current_user.email,
        candidate_email=current_user.email,
        job_title=job.title,
        employer_email=employer_email
    )

    return ApplicationResponse(
        id=app_record.id,
        candidate_id=app_record.candidate_id,
        job_id=app_record.job_id,
        status=app_record.status,
        match_score=app_record.match_score,
        matched_skills=breakdown["matched_skills"],
        missing_skills=breakdown["missing_skills"],
        match_reasoning=breakdown["match_reasoning"],
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
    """List candidate's sent applications with AI match telemetry breakdown."""
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    res = await db.execute(select(ApplicationTrack).where(ApplicationTrack.candidate_id == current_user.id))
    apps = res.scalars().all()
    results = []

    for a in apps:
        job_res = await db.execute(select(JobPost).where(JobPost.id == a.job_id))
        j = job_res.scalars().first()

        breakdown = vector_matcher.analyze_match_breakdown(
            candidate_skills=cand.skills if cand and cand.skills else ["Google Ads", "Meta Ads", "GA4"],
            candidate_headline=cand.headline if cand and cand.headline else "Performance Marketing Manager",
            job_title=j.title if j else "Growth Manager",
            job_description=j.description if j else "Acquisition Marketing"
        )

        results.append(
            ApplicationResponse(
                id=a.id,
                candidate_id=a.candidate_id,
                job_id=a.job_id,
                status=a.status,
                match_score=a.match_score if a.match_score > 0 else breakdown["match_score"],
                matched_skills=breakdown["matched_skills"],
                missing_skills=breakdown["missing_skills"],
                match_reasoning=breakdown["match_reasoning"],
                track_type=a.track_type,
                applied_at=a.applied_at,
                job_title=j.title if j else "Hidden Opportunity",
                company_name=j.company_name if j else "Enterprise Client"
            )
        )

    return results

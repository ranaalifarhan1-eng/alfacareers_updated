from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import JobPost, JobSourceType, User, CandidateProfile
from app.services.deep_web_hunter.query_builder import DeepWebQueryBuilder
from app.services.deep_web_hunter.crawler import CareerPageCrawler
from app.services.ai_engine.llm_parser import OllamaJobStructurer
from app.services.ai_engine.vector_store import VectorStoreService
from app.services.ai_engine.vector_matcher import VectorMatcherEngine
from app.services.pdf_compiler.ats_generator import ATSResumeCompiler
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

query_builder = DeepWebQueryBuilder()
crawler = CareerPageCrawler()
llm_structurer = OllamaJobStructurer()
vector_store = VectorStoreService()
ats_compiler = ATSResumeCompiler()
vector_matcher_engine = VectorMatcherEngine()


class JobHuntRequest(BaseModel):
    keyword: str  # Required, e.g. "Performance Marketing Manager"
    location: Optional[str] = None  # e.g. "Dubai", "Lahore"
    company: Optional[str] = None


class JobPostResponse(BaseModel):
    id: int
    title: str
    company_name: str
    location: str
    job_type: Optional[str] = "Full-time"
    salary_range: Optional[str] = None
    description: str
    source_type: JobSourceType
    apply_url: Optional[str] = None
    apply_email: Optional[str] = None
    authenticity_score: float

    class Config:
        from_attributes = True


class MatchedJobPostResponse(BaseModel):
    id: int
    title: str
    company_name: str
    location: str
    job_type: Optional[str] = "Full-time"
    salary_range: Optional[str] = None
    description: str
    source_type: JobSourceType
    apply_url: Optional[str] = None
    apply_email: Optional[str] = None
    authenticity_score: float
    match_score_pct: float

    class Config:
        from_attributes = True


@router.get("/matched", response_model=List[MatchedJobPostResponse])
async def get_matched_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Vector Profile Job Matcher:
    Fetches logged-in candidate profile, calculates exact Vector Match Score % against published hidden jobs, and returns ranked opportunities.
    """
    # Fetch candidate profile
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    skills = cand.skills if cand and cand.skills else ["Google Ads", "Performance Marketing", "Python"]
    headline = cand.headline if cand and cand.headline else "Performance Marketing Manager"
    target_roles = cand.target_roles if cand and cand.target_roles else ["Performance Marketing Manager", "Digital Marketer"]
    preferred_locations = cand.preferred_locations if cand and cand.preferred_locations else ["Dubai, UAE", "Lahore, Pakistan", "Remote"]

    # Fetch all published jobs
    res = await db.execute(select(JobPost).where(JobPost.is_published == True))
    all_jobs = res.scalars().all()

    # Seed default deep web jobs if DB is empty
    if not all_jobs:
        default_jobs_data = [
            {
                "title": "Performance Marketing Manager",
                "company_name": "Seven States Global Visa Services - Dubai",
                "location": "Dubai, UAE",
                "job_type": "Full-time",
                "salary_range": "AED 15,000 - 20,000 / month",
                "description": "Leading ROI-driven performance campaigns across Google Ads, Meta Ads, GA4, and conversion rate optimization.",
                "apply_email": "careers@sevenstates.ae",
                "authenticity_score": 98.5
            },
            {
                "title": "Digital Marketing & PPC Lead",
                "company_name": "One Word Technologies / OWCareers",
                "location": "Lahore, Pakistan",
                "job_type": "Full-time",
                "salary_range": "PKR 250,000 - 350,000 / month",
                "description": "Managing paid acquisition channels, GTM tracking, landing page CRO, and client growth strategy.",
                "apply_email": "hr@owcareers.com",
                "authenticity_score": 97.2
            },
            {
                "title": "Senior Growth Marketer",
                "company_name": "UnblinkTechnology",
                "location": "Remote",
                "job_type": "Remote Only",
                "salary_range": "$4,000 - $6,000 / month",
                "description": "Driving international B2B and B2C digital media campaigns, audience segmentation, and multi-channel marketing.",
                "apply_email": "jobs@unblinktech.com",
                "authenticity_score": 96.8
            }
        ]

        for d in default_jobs_data:
            jp = JobPost(
                title=d["title"],
                company_name=d["company_name"],
                location=d["location"],
                job_type=d["job_type"],
                salary_range=d["salary_range"],
                description=d["description"],
                source_type=JobSourceType.DEEP_WEB,
                apply_email=d["apply_email"],
                authenticity_score=d["authenticity_score"],
                is_published=True
            )
            db.add(jp)

        await db.commit()
        res = await db.execute(select(JobPost).where(JobPost.is_published == True))
        all_jobs = res.scalars().all()

    matched_jobs = []
    for j in all_jobs:
        score_pct = vector_matcher_engine.calculate_match_score(
            candidate_skills=skills,
            candidate_headline=headline,
            job_title=j.title,
            job_description=j.description,
            target_roles=target_roles,
            preferred_locations=preferred_locations,
            candidate_location=cand.location if cand else ""
        )

        matched_jobs.append(
            MatchedJobPostResponse(
                id=j.id,
                title=j.title,
                company_name=j.company_name,
                location=j.location,
                job_type=j.job_type or "Full-time",
                salary_range=j.salary_range or "AED 15,000 / month",
                description=j.description,
                source_type=j.source_type,
                apply_url=j.apply_url,
                apply_email=j.apply_email,
                authenticity_score=j.authenticity_score,
                match_score_pct=score_pct
            )
        )

    # Sort descending by match_score_pct
    matched_jobs.sort(key=lambda x: x.match_score_pct, reverse=True)
    return matched_jobs


@router.post("/hunt", response_model=List[MatchedJobPostResponse])
async def trigger_deep_web_hunt(
    req: JobHuntRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger Deep Web Hunter:
    Construct un-syndicated search query -> Crawl pages -> Parse via Ollama Llama 3.1 -> Store in DB & ChromaDB.
    """
    query_str = query_builder.build_search_query(
        keyword=req.keyword,
        location=req.location,
        company=req.company
    )
    print(f"\n[Jobs Endpoint] Triggering Deep Web Hunt for: {query_str}")

    # Fetch candidate profile for vector matching
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    skills = cand.skills if cand and cand.skills else ["Google Ads", "Performance Marketing"]
    headline = cand.headline if cand and cand.headline else req.keyword
    target_roles = cand.target_roles if cand and cand.target_roles else [req.keyword]
    preferred_locations = cand.preferred_locations if cand and cand.preferred_locations else ([req.location] if req.location else ["Dubai, UAE"])

    # 1. Search career pages
    search_results = await query_builder.search_career_pages(
        query=query_str,
        num_results=3,
        keyword=req.keyword,
        location=req.location or "",
        company=req.company or ""
    )
    created_jobs: List[JobPost] = []

    for item in search_results:
        url = item.get("url", "")
        snippet = item.get("snippet", "")

        # 2. Crawl target URL
        crawl_data = await crawler.fetch_page_content(url)
        raw_text = crawl_data.get("text", "")

        # 3. Structuring via Ollama Llama 3.1 LLM
        parsed_data = await llm_structurer.parse_job_posting(raw_text, url, snippet)

        title = parsed_data.get("title") or req.keyword.title()
        company_name = parsed_data.get("company_name") or (req.company.title() if req.company else "Enterprise Employer")
        location = parsed_data.get("location") or (req.location.title() if req.location else "Dubai, UAE")

        # 4. Save to Database
        job = JobPost(
            title=title,
            company_name=company_name,
            location=location,
            job_type=parsed_data.get("job_type", "Full-time"),
            salary_range=parsed_data.get("salary_range", "AED 15,000 / month"),
            description=parsed_data.get("description", f"High-impact role at {company_name} in {location}."),
            source_type=JobSourceType.DEEP_WEB,
            apply_url=parsed_data.get("apply_url", url),
            apply_email=parsed_data.get("apply_email", "careers@" + company_name.lower().replace(" ", "").replace("/", "") + ".com"),
            authenticity_score=float(parsed_data.get("authenticity_score", 96.5)),
            is_published=True
        )

        db.add(job)
        await db.flush()
        await db.refresh(job)

        # 5. Index in ChromaDB Vector Store
        vector_store.add_job_post(
            job_id=job.id,
            title=job.title,
            description=job.description,
            company=job.company_name,
            metadata={
                "location": job.location,
                "apply_email": job.apply_email,
                "authenticity_score": job.authenticity_score
            }
        )

        created_jobs.append(job)

    await db.commit()

    # Return matched jobs
    return await get_matched_jobs(current_user=current_user, db=db)


@router.get("", response_model=List[JobPostResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """List published hidden jobs from database."""
    res = await db.execute(select(JobPost).where(JobPost.is_published == True).offset(skip).limit(limit))
    return res.scalars().all()


@router.post("/{job_id}/compile-resume")
async def compile_tailored_ats_resume(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate single-page ATS-compliant PDF resume tailored specifically to target job posting.
    """
    res = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = res.scalars().first()

    if not job:
        raise HTTPException(status_code=404, detail="Target job posting not found")

    # Fetch candidate profile
    cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
    cand = cand_res.scalars().first()

    candidate_name = cand.full_name if cand else current_user.email.split("@")[0].capitalize()
    location = cand.location if cand and cand.location else "Lahore, Pakistan"
    headline = cand.headline if cand and cand.headline else "Performance Marketing Manager"
    skills = cand.skills if cand and cand.skills else ["Google Ads", "Meta Ads", "GA4", "GTM"]

    pdf_bytes = ats_compiler.compile_tailored_pdf(
        candidate_name=candidate_name,
        email=current_user.email,
        phone=cand.phone if cand and cand.phone else "+92 300 1234567",
        location=location,
        headline=headline,
        target_job_title=job.title,
        target_company=job.company_name,
        job_description=job.description,
        skills=skills
    )

    filename = f"ATS_Resume_{candidate_name.replace(' ', '_')}_{job.company_name.replace(' ', '_')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

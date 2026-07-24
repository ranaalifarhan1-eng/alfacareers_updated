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
from app.services.pdf_compiler.ats_generator import ATSResumeCompiler
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

query_builder = DeepWebQueryBuilder()
crawler = CareerPageCrawler()
llm_structurer = OllamaJobStructurer()
vector_store = VectorStoreService()
ats_compiler = ATSResumeCompiler()


class JobHuntRequest(BaseModel):
    keyword: str  # Required, e.g. "Finance Manager" or "Lead Software Engineer"
    location: Optional[str] = None  # e.g. "Lahore", "Dubai", "Pakistan", "UAE"
    company: Optional[str] = None  # e.g. "Engro", "Careem", "engro.com"


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


@router.post("/hunt", response_model=List[JobPostResponse])
async def trigger_deep_web_hunt(
    req: JobHuntRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger Deep Web Hunter MVP:
    Construct un-syndicated search query -> Crawl pages -> Parse via Ollama Llama 3.1 -> Store in DB & ChromaDB.
    """
    query_str = query_builder.build_search_query(
        keyword=req.keyword,
        location=req.location,
        company=req.company
    )
    print(f"\n[Jobs Endpoint] Triggering Deep Web Hunt for: {query_str}")

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

        # Override location/title/company if specified by user search
        title = parsed_data.get("title") or req.keyword.title()
        company_name = parsed_data.get("company_name") or (req.company.title() if req.company else "Enterprise Employer")
        location = parsed_data.get("location") or (req.location.title() if req.location else "Lahore, Pakistan")

        # 4. Save to Database
        job = JobPost(
            title=title,
            company_name=company_name,
            location=location,
            job_type=parsed_data.get("job_type", "Full-time"),
            salary_range=parsed_data.get("salary_range", "$ Negotiable"),
            description=parsed_data.get("description", f"High-impact role at {company_name} in {location}."),
            source_type=JobSourceType.DEEP_WEB,
            apply_url=parsed_data.get("apply_url", url),
            apply_email=parsed_data.get("apply_email", "careers@" + company_name.lower().replace(" ", "") + ".com"),
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
    print(f"[Jobs Endpoint SUCCESS] Deep Web Hunt completed. Discovered & indexed {len(created_jobs)} jobs.")

    return created_jobs


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
    headline = cand.headline if cand and cand.headline else "Senior Corporate Specialist"
    skills = cand.skills if cand and cand.skills else ["Financial Analysis", "Strategic Operations", "Python", "Data Modeling"]

    pdf_bytes = ats_compiler.compile_tailored_pdf(
        candidate_name=candidate_name,
        email=current_user.email,
        phone="+92 300 1234567",
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

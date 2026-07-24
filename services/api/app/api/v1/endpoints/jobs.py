from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db
from app.db.models import JobPost, JobSourceType
from app.services.deep_web_hunter.query_builder import DeepWebQueryBuilder
from app.services.deep_web_hunter.crawler import CareerPageCrawler
from app.services.ai_engine.llm_parser import OllamaJobStructurer
from app.services.ai_engine.vector_store import VectorStoreService

router = APIRouter()

query_builder = DeepWebQueryBuilder()
crawler = CareerPageCrawler()
llm_structurer = OllamaJobStructurer()
vector_store = VectorStoreService()


class JobHuntRequest(BaseModel):
    domain: str = "engro.com/careers"
    keyword: Optional[str] = "Finance"


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
    Search un-syndicated corporate pages -> Crawl URL -> Parse via Ollama Llama 3.1 -> Store in DB & ChromaDB.
    """
    query_str = query_builder.build_query(req.domain, req.keyword or "")
    print(f"\n[Jobs Endpoint] Starting Deep Web Hunt for query: {query_str}")

    # 1. Search career pages
    search_results = await query_builder.search_career_pages(query_str, num_results=3)
    created_jobs: List[JobPost] = []

    for item in search_results:
        url = item.get("url", "")
        snippet = item.get("snippet", "")

        # 2. Crawl target URL
        crawl_data = await crawler.fetch_page_content(url)
        raw_text = crawl_data.get("text", "")

        # 3. Structuring via Ollama Llama 3.1 LLM
        parsed_data = await llm_structurer.parse_job_posting(raw_text, url, snippet)

        # 4. Save to Database
        job = JobPost(
            title=parsed_data.get("title", "Corporate Opportunity"),
            company_name=parsed_data.get("company_name", "Enterprise Employer"),
            location=parsed_data.get("location", "Lahore, Pakistan"),
            job_type=parsed_data.get("job_type", "Full-time"),
            salary_range=parsed_data.get("salary_range", "$ Negotiable"),
            description=parsed_data.get("description", "High-impact un-syndicated role."),
            source_type=JobSourceType.DEEP_WEB,
            apply_url=parsed_data.get("apply_url", url),
            apply_email=parsed_data.get("apply_email", "careers@company.com"),
            authenticity_score=float(parsed_data.get("authenticity_score", 95.0)),
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
    print(f"[Jobs Endpoint SUCCESS] Deep Web Hunt completed. Created & indexed {len(created_jobs)} jobs.")

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

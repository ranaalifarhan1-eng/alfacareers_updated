import asyncio
import logging
from sqlalchemy.future import select
from app.db.base import AsyncSessionLocal, init_db
from app.db.models import JobPost, JobSourceType, ApplicationTrack

logger = logging.getLogger("clean_test_jobs")


async def clean_duplicate_test_jobs():
    """Deduplicate job posts, remove repetitive mock entries, and seed a clean curated job list."""
    await init_db()

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(JobPost).order_by(JobPost.id.asc()))
        all_jobs = res.scalars().all()

        seen_keys = set()
        jobs_to_keep = []
        jobs_to_delete_ids = []

        for j in all_jobs:
            key = (j.title.strip().lower(), j.company_name.strip().lower())
            if key not in seen_keys:
                seen_keys.add(key)
                jobs_to_keep.append(j)
            else:
                jobs_to_delete_ids.append(j.id)

        print(f"\n[DB Job Cleanup] Total Jobs Found: {len(all_jobs)}")
        print(f"[DB Job Cleanup] Jobs to Keep: {len(jobs_to_keep)} | Duplicate Job IDs to Delete: {len(jobs_to_delete_ids)}")

        # Delete dependent applications referencing deleted jobs
        if jobs_to_delete_ids:
            apps_res = await session.execute(
                select(ApplicationTrack).where(ApplicationTrack.job_id.in_(jobs_to_delete_ids))
            )
            apps_to_delete = apps_res.scalars().all()
            for app in apps_to_delete:
                await session.delete(app)

            # Delete duplicate jobs
            for jid in jobs_to_delete_ids:
                job_obj = await session.get(JobPost, jid)
                if job_obj:
                    await session.delete(job_obj)

            await session.commit()

        # Ensure at least 2 pending approval jobs exist for Admin Moderation Queue testing
        pending_res = await session.execute(select(JobPost).where(JobPost.status == "pending_approval"))
        pending_jobs = pending_res.scalars().all()

        if len(pending_jobs) < 2:
            pending_samples = [
                JobPost(
                    title="Senior Growth Marketing Specialist",
                    company_name="Seven States Global Visa Services - Dubai",
                    location="Dubai, UAE",
                    job_type="Hybrid",
                    salary_range="AED 22,000 - 28,000 / month",
                    description="Driving regional performance acquisition, Meta & Google Ads scaling, conversion rate optimization, and GA4 analytics.",
                    source_type=JobSourceType.DEEP_WEB,
                    apply_email="careers@sevenstates.ae",
                    authenticity_score=97.5,
                    is_published=False,
                    status="pending_approval",
                    vector_indexed=False
                ),
                JobPost(
                    title="Lead Data Engineer (AI & Vector Pipelines)",
                    company_name="AeroCloud Systems - Abu Dhabi",
                    location="Abu Dhabi, UAE",
                    job_type="On-site",
                    salary_range="AED 30,000 - 38,000 / month",
                    description="Building real-time vector search pipelines, ChromaDB indexing, FastAPI microservices, and Snowflake data warehouses.",
                    source_type=JobSourceType.DEEP_WEB,
                    apply_email="jobs@aerocloud.ae",
                    authenticity_score=98.2,
                    is_published=False,
                    status="pending_approval",
                    vector_indexed=False
                )
            ]
            for ps in pending_samples:
                session.add(ps)

            await session.commit()

        # Print final count
        final_res = await session.execute(select(JobPost))
        final_jobs = final_res.scalars().all()

        print("\n" + "="*80)
        print("      DATABASE CLEANUP COMPLETE: CURATED JOB POSTINGS LIST")
        print("="*80)
        for fj in final_jobs:
            print(f"ID #{fj.id:<4} | {fj.status.upper():<16} | {fj.title:<35} | {fj.company_name}")
        print("="*80)
        print(f"TOTAL CLEAN JOBS REMAINING: {len(final_jobs)}\n")


if __name__ == "__main__":
    asyncio.run(clean_duplicate_test_jobs())

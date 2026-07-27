from fastapi import APIRouter
from app.api.v1.endpoints import auth, jobs, applications, employer

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs & Deep Web Hunter"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications Auto-Pilot"])
api_router.include_router(employer.router, prefix="/employer", tags=["Employer Enterprise Core"])

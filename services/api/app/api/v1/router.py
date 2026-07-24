from fastapi import APIRouter
from app.api.v1.endpoints import auth, jobs

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs & Deep Web Hunter"])

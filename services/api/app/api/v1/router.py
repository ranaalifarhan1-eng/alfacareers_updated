from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()

# Include Auth Router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])


@api_router.get("/status", tags=["System"])
async def get_system_status():
    return {
        "status": "operational",
        "service": "AlfaCareers Core Engine",
        "version": "2.0.0",
        "modules": {
            "authentication": "active",
            "deep_web_hunter": "active",
            "vector_store": "ready",
            "ats_compiler": "ready",
            "whatsapp_gateway": "configured"
        }
    }

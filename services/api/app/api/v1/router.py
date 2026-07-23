from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/status", tags=["System"])
async def get_system_status():
    return {
        "status": "operational",
        "service": "AlfaCareers Core Engine",
        "version": "2.0.0",
        "modules": {
            "deep_web_hunter": "active",
            "vector_matcher": "ready",
            "ats_compiler": "ready",
            "whatsapp_gateway": "configured"
        }
    }

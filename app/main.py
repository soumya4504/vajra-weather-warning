import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    weather,
    prediction,
    risk_map,
    alerts,
    features,
    training
)


# ---------------------------------
# CONFIGURATION
# ---------------------------------

HOST = os.getenv("HOST", "0.0.0.0")

PORT = int(
    os.getenv("PORT", "8001")
)

API_BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://localhost:8001"
)

API_TIMEOUT_SECONDS = int(
    os.getenv("API_TIMEOUT_SECONDS", "10")
)


# ---------------------------------
# MODEL STATE
# ---------------------------------

try:
    from app.services.inference_service import model, MODEL_PATH
except Exception:
    model = None
    MODEL_PATH = None


# ---------------------------------
# FASTAPI APPLICATION
# ---------------------------------

app = FastAPI(
    title="Vajra Weather Nowcasting API",
    description="AI-Driven Hyper-Local Early Warning System",
    version="1.0.0"
)


# ---------------------------------
# CORS CONFIGURATION
# ---------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ---------------------------------
# REGISTER API ROUTERS
# ---------------------------------

app.include_router(weather.router)
app.include_router(prediction.router)
app.include_router(risk_map.router)
app.include_router(alerts.router)
app.include_router(features.router)
app.include_router(training.router)


# ---------------------------------
# HOME ENDPOINT
# ---------------------------------

@app.get("/")
def home():

    return {
        "message": "Vajra Weather Nowcasting System is running",
        "status": "healthy",
        "version": "1.0.0",
        "api_documentation": "/docs",

        "endpoints": {
            "health": "/health",
            "weather": "/api/weather",
            "predictions": "/api/predictions",
            "test_prediction": "/api/test-predict",
            "live_prediction": "/api/predict/live",
            "alerts": "/api/alerts",
            "risk_map": "/api/risk-map"
        }
    }


# ---------------------------------
# HEALTH CHECK
# ---------------------------------

@app.get("/health")
def health_check():

    model_status = "loaded"

    if model is None:
        model_status = "not loaded"

    return {
        "status": "healthy",
        "service": "vajra-backend",
        "version": "1.0.0",

        "host": HOST,
        "port": PORT,

        "api_base_url": API_BASE_URL,

        "components": {
            "api": "running",
            "ml_model": model_status
        }
    }


# ---------------------------------
# SYSTEM STATUS
# ---------------------------------

@app.get("/api/system-status")
def system_status():

    ml_status = "available" if model is not None else "unavailable"

    return {
        "system": "Vajra Weather Nowcasting System",

        "status": "operational" if model is not None else "degraded",

        "components": {
            "weather_data": "available",
            "weather_sequence": "available",
            "ml_inference": ml_status,
            "risk_classification": "available",
            "alert_generation": "available"
        },

        "model_details": {
            "loaded": model is not None,
            "model_path": str(MODEL_PATH) if MODEL_PATH else None,
            "hazards": ["thunderstorm", "cloudburst", "flash_flood"]
        },

        "available_services": {
            "weather": "/api/weather",
            "prediction": "/api/predict",
            "live_prediction": "/api/predict/live",
            "alerts": "/api/alerts",
            "risk_map": "/api/risk-map",
            "documentation": "/docs"
        }
    }


# ---------------------------------
# RUN APPLICATION
# ---------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=False
    )
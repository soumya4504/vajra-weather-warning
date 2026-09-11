from pydantic import BaseModel
from datetime import datetime


class HazardPrediction(BaseModel):
    probability: float
    risk_level: str


class PredictionResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float

    lead_time_hours: int
    model_confidence: float

    timestamp: datetime

    thunderstorm: HazardPrediction
    cloudburst: HazardPrediction
    flash_flood: HazardPrediction
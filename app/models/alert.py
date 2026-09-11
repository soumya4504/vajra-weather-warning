from datetime import datetime
from pydantic import BaseModel


class AlertResponse(BaseModel):
    alert_id: str

    hazard: str
    severity: str

    location_name: str
    latitude: float
    longitude: float

    probability: float
    lead_time_hours: int

    message: str
    recommended_action: str

    created_at: datetime
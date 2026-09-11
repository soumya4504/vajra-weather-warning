from pydantic import BaseModel
from typing import Optional


class WeatherData(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    temperature_c: float
    feels_like_c: float
    humidity_percent: float
    pressure_hpa: float
    wind_speed_kmh: float
    wind_direction_deg: Optional[float] = None
    rainfall_mm: float
    cloudiness_percent: float
    weather_condition: str
    iwv: float
    cape: float
    cloud_top_temp: float
    source: str
    village: Optional[str] = None
    subdistrict: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    formatted_address: Optional[str] = None


class WeatherResponse(BaseModel):
    status: str
    data: WeatherData
    location: Optional[dict] = None

from typing import List

from pydantic import BaseModel, Field


class WeatherObservation(BaseModel):

    iwv: float = Field(
        ...,
        description="Integrated Water Vapor"
    )

    cape: float = Field(
        ...,
        description="Convective Available Potential Energy"
    )

    rainfall_mm: float = Field(
        ...,
        ge=0
    )

    cloud_top_temp: float

    wind_speed_kmh: float = Field(
        ...,
        ge=0
    )


class PredictionRequest(BaseModel):

    weather_sequence: List[WeatherObservation]
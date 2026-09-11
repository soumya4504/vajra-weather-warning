from app.services.data_service import get_latest_weather_record


def get_weather_data():

    record = get_latest_weather_record()

    return {
        "location": {
            "name": "Demo Location",
            "latitude": float(record["latitude"]),
            "longitude": float(record["longitude"])
        },

        "timestamp": record["timestamp"],

        "weather": {
            "temperature_c": float(record["temperature_c"]),
            "humidity_percent": float(
                record["humidity_percent"]
            ),
            "wind_speed_kmh": float(
                record["wind_speed_kmh"]
            ),
            "rainfall_mm": float(
                record["rainfall_mm"]
            )
        }
    }

from fastapi import APIRouter

from app.services.weather_data_service import (
    get_latest_weather_data
)


router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"]
)


@router.get("/latest")
def get_latest_weather():

    weather_data = get_latest_weather_data()

    return {
        "status": "success",
        "data": weather_data
    }
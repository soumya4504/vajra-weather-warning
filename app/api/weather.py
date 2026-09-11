from fastapi import APIRouter, HTTPException, Query

from app.services.weather_data_service import (
    get_latest_weather_data
)

from app.schemas.weather import WeatherResponse


# ---------------------------------
# ROUTER CONFIGURATION
# ---------------------------------

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"]
)


# ---------------------------------
# GET LIVE WEATHER
# ---------------------------------

@router.get("", include_in_schema=False)
@router.get("/")
@router.get("/latest", response_model=WeatherResponse)
def get_latest_weather(
    lat: float | None = Query(
        default=None,
        description="Latitude of the user's location"
    ),
    lon: float | None = Query(
        default=None,
        description="Longitude of the user's location"
    )
):

    try:

        # ---------------------------------
        # VALIDATE LOCATION PARAMETERS
        # ---------------------------------

        if lat is not None and not -90 <= lat <= 90:
            raise HTTPException(
                status_code=400,
                detail="Latitude must be between -90 and 90"
            )

        if lon is not None and not -180 <= lon <= 180:
            raise HTTPException(
                status_code=400,
                detail="Longitude must be between -180 and 180"
            )

        # ---------------------------------
        # VALIDATE BOTH PARAMETERS
        # ---------------------------------

        if (lat is None and lon is not None) or (
            lat is not None and lon is None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Both latitude and longitude are required "
                    "for location-based weather data"
                )
            )

        # ---------------------------------
        # GET WEATHER DATA
        # ---------------------------------

        weather_data = get_latest_weather_data(
            latitude=lat,
            longitude=lon
        )

        # ---------------------------------
        # RESPONSE
        # ---------------------------------

        return {
            "status": "success",
            "data": weather_data,
            "location": {
                "latitude": lat,
                "longitude": lon
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
from fastapi import APIRouter, HTTPException, Query

from app.services.risk_map_service import get_risk_map


# ---------------------------------
# ROUTER CONFIGURATION
# ---------------------------------

router = APIRouter(
    prefix="/api",
    tags=["Risk Map"]
)


# ---------------------------------
# GET RISK MAP DATA
# ---------------------------------

@router.get("/risk-map")
def get_risk_map_data(
    hazard: str = Query(
        default="thunderstorm",
        description="Hazard type: thunderstorm, cloudburst, or flash_flood"
    ),
    lat: float | None = Query(
        default=None,
        description="Latitude of target location"
    ),
    lon: float | None = Query(
        default=None,
        description="Longitude of target location"
    )
):

    valid_hazards = [
        "thunderstorm",
        "cloudburst",
        "flash_flood"
    ]

    hazard = hazard.lower().strip()

    if hazard not in valid_hazards:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid hazard. Use: thunderstorm, "
                "cloudburst, or flash_flood"
            )
        )

    return get_risk_map(
        hazard=hazard,
        latitude=lat,
        longitude=lon
    )
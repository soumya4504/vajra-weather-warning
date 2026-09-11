from fastapi import APIRouter, Query

from app.models.alert import AlertResponse
from app.services.alert_service import get_alerts


# ---------------------------------
# ROUTER CONFIGURATION
# ---------------------------------

router = APIRouter(
    prefix="/api",
    tags=["Alerts"]
)


# ---------------------------------
# GET ALL GENERATED ALERTS
# ---------------------------------

@router.get(
    "/alerts",
    response_model=list[AlertResponse]
)
def get_all_alerts(
    lat: float | None = Query(
        default=None,
        description="Latitude of target location"
    ),
    lon: float | None = Query(
        default=None,
        description="Longitude of target location"
    )
):

    return get_alerts(
        latitude=lat,
        longitude=lon
    )
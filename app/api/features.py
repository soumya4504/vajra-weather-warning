from fastapi import APIRouter

from app.services.feature_service import (
    get_latest_features,
    get_weather_sequence,
    get_normalized_weather_sequence
)

router = APIRouter(
    prefix="/api",
    tags=["Features"]
)


@router.get("/features")
def get_features():
    return get_latest_features()


@router.get("/features/sequence")
def get_feature_sequence():
    return {
        "window_size": 5,
        "sequence": get_weather_sequence(
            window_size=5
        )
    }

@router.get("/features/normalized-sequence")
def get_normalized_sequence():

    return {
        "window_size": 5,

        "sequence": (
            get_normalized_weather_sequence(
                window_size=5
            )
        )
    }
from datetime import datetime, timezone

from app.models.prediction import (
    PredictionResponse,
    HazardPrediction
)
from app.services.weather_data_service import (
    get_latest_weather_data,
    DEFAULT_LAT,
    DEFAULT_LON
)
from app.services.weather_sequence_service import (
    build_weather_sequence,
    extract_feature_attribution_deltas
)
from app.services.inference_service import (
    predict_hazards,
    get_risk_level
)


def get_prediction(
    latitude: float | None = None,
    longitude: float | None = None
) -> PredictionResponse:
    """
    Generate location-aware hazard predictions using the trained
    multi-output Random Forest nowcasting model and live atmospheric sequence.
    """
    lat = float(latitude) if latitude is not None else DEFAULT_LAT
    lon = float(longitude) if longitude is not None else DEFAULT_LON

    # Fetch live weather & location name
    weather_data = get_latest_weather_data(lat, lon)
    location_name = weather_data.get("city") or f"Zone ({lat:.2f}°N, {lon:.2f}°E)"

    # Build real time-aligned 5x5 sequence
    weather_sequence = build_weather_sequence(
        latitude=lat,
        longitude=lon,
        weather_data=weather_data
    )

    # Execute ML Inference
    result = predict_hazards(weather_sequence)

    # Model confidence metric based on feature availability
    confidence = 0.88 if weather_data.get("source") == "open-meteo" else 0.78

    return PredictionResponse(
        location_name=location_name,
        latitude=lat,
        longitude=lon,
        lead_time_hours=3,
        model_confidence=confidence,
        timestamp=datetime.now(timezone.utc),
        thunderstorm=HazardPrediction(
            probability=float(result["thunderstorm"]["probability"]),
            risk_level=result["thunderstorm"]["risk_level"]
        ),
        cloudburst=HazardPrediction(
            probability=float(result["cloudburst"]["probability"]),
            risk_level=result["cloudburst"]["risk_level"]
        ),
        flash_flood=HazardPrediction(
            probability=float(result["flash_flood"]["probability"]),
            risk_level=result["flash_flood"]["risk_level"]
        )
    )
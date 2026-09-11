from fastapi import APIRouter, HTTPException, Query

from app.services.prediction_service import get_prediction
from app.models.prediction import PredictionResponse
from app.schemas.prediction import PredictionRequest

from app.services.inference_service import predict_hazards
from app.services.weather_sequence_service import build_weather_sequence
from app.services.weather_data_service import get_latest_weather_data
from app.services.alert_service import generate_alert, create_alerts_from_prediction


# ---------------------------------
# ROUTER CONFIGURATION
# ---------------------------------

router = APIRouter(
    prefix="/api",
    tags=["Predictions"]
)


# ---------------------------------
# EXISTING DASHBOARD PREDICTION
# ---------------------------------

@router.get(
    "/predictions",
    response_model=PredictionResponse
)
def get_predictions():

    return get_prediction()


# ---------------------------------
# MANUAL ML PREDICTION ENDPOINT
# ---------------------------------

@router.post("/predict")
def predict_weather_hazards(
    request: PredictionRequest
):

    try:

        weather_sequence = [
            [
                observation.iwv,
                observation.cape,
                observation.rainfall_mm,
                observation.cloud_top_temp,
                observation.wind_speed_kmh
            ]
            for observation in request.weather_sequence
        ]

        result = predict_hazards(
            weather_sequence
        )

        return {
            "status": "success",
            "prediction": result
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )


# ---------------------------------
# EASY BROWSER TEST ENDPOINT
# ---------------------------------

@router.get("/test-predict")
def test_predict():

    weather_sequence = [
        [42, 950, 2, -35, 15],
        [45, 1200, 3, -38, 18],
        [50, 1800, 5, -45, 22],
        [55, 2500, 15, -55, 30],
        [60, 3200, 40, -65, 40]
    ]

    try:

        result = predict_hazards(
            weather_sequence
        )

        return {
            "status": "success",
            "prediction": result
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ---------------------------------
# LIVE WEATHER PREDICTION + ALERTS
# ---------------------------------

@router.get("/predict/live")
def predict_live_weather_hazards(
    lat: float | None = Query(default=None, description="Latitude of target location"),
    lon: float | None = Query(default=None, description="Longitude of target location"),
    location_name: str | None = Query(default=None, description="Optional name of target location")
):

    try:
        # Fetch live observation for location
        weather_data = get_latest_weather_data(
            latitude=lat,
            longitude=lon
        )

        resolved_city = location_name or weather_data.get("city") or "Monitored Location"
        resolved_lat = weather_data.get("latitude")
        if resolved_lat is None:
            resolved_lat = lat if lat is not None else 12.9716

        resolved_lon = weather_data.get("longitude")
        if resolved_lon is None:
            resolved_lon = lon if lon is not None else 77.5946

        # Build location-aware 5 x 5 atmospheric sequence
        weather_sequence = build_weather_sequence(
            latitude=resolved_lat,
            longitude=resolved_lon,
            weather_data=weather_data
        )

        # Run ML inference
        result = predict_hazards(weather_sequence)

        # ---------------------------------
        # GENERATE LOCATION-AWARE ALERTS
        # ---------------------------------
        generated_alerts = create_alerts_from_prediction(
            prediction_result=result,
            location_name=resolved_city,
            latitude=float(resolved_lat),
            longitude=float(resolved_lon),
            lead_time_hours=1
        )

        # ---------------------------------
        # RETURN PREDICTION + ALERTS
        # ---------------------------------
        return {
            "status": "success",
            "source": "live-weather-pipeline",
            "location": {
                "city": resolved_city,
                "country": weather_data.get("country", "IN"),
                "latitude": float(resolved_lat),
                "longitude": float(resolved_lon)
            },
            "weather_sequence": weather_sequence,
            "prediction": result,
            "alerts": generated_alerts
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Live prediction failed: {str(error)}"
        )
from datetime import datetime, timezone

from app.services.prediction_service import get_prediction


# ---------------------------------
# RISK LEVEL
# ---------------------------------

def get_risk_level(probability: float) -> str:

    if probability >= 0.80:
        return "CRITICAL"

    elif probability >= 0.60:
        return "HIGH"

    elif probability >= 0.30:
        return "MODERATE"

    return "LOW"


# ---------------------------------
# CREATE GEOJSON RISK FEATURE
# ---------------------------------

def create_risk_feature(
    zone_id: str,
    zone_name: str,
    longitude: float,
    latitude: float,
    probability: float,
    hazard: str
):

    return {
        "type": "Feature",

        "properties": {
            "zone_id": zone_id,
            "zone_name": zone_name,
            "hazard": hazard.upper(),
            "probability": probability,
            "risk_level": get_risk_level(probability)
        },

        "geometry": {
            "type": "Point",

            "coordinates": [
                longitude,
                latitude
            ]
        }
    }


# ---------------------------------
# GET HAZARD PROBABILITY
# ---------------------------------

def get_hazard_probability(
    hazard: str,
    prediction
) -> float:

    hazard = hazard.lower()

    hazard_mapping = {
        "thunderstorm": prediction.thunderstorm,
        "cloudburst": prediction.cloudburst,
        "flash_flood": prediction.flash_flood
    }

    hazard_prediction = hazard_mapping.get(hazard)

    if hazard_prediction is None:
        return 0.0

    return float(
        hazard_prediction.probability
    )


# ---------------------------------
# GET RISK MAP
# ---------------------------------

def get_risk_map(
    hazard: str,
    latitude: float | None = None,
    longitude: float | None = None
):

    # Get prediction for target coordinates
    prediction = get_prediction(
        latitude=latitude,
        longitude=longitude
    )

    # Get probability for selected hazard
    probability = get_hazard_probability(
        hazard,
        prediction
    )

    hazard_name = hazard.upper()

    # Base location
    lat = prediction.latitude
    lon = prediction.longitude

    # Create nearby zones for visualization around target coordinates
    features = [

        create_risk_feature(
            "ZONE_001",
            f"Primary Risk Zone ({prediction.location_name})",
            lon,
            lat,
            probability,
            hazard_name
        ),

        create_risk_feature(
            "ZONE_002",
            "North-East Risk Zone",
            lon + 0.006,
            lat + 0.004,
            max(0.0, probability - 0.12),
            hazard_name
        ),

        create_risk_feature(
            "ZONE_003",
            "South-West Risk Zone",
            lon - 0.006,
            lat - 0.004,
            max(0.0, probability - 0.25),
            hazard_name
        )
    ]

    return {
        "type": "FeatureCollection",

        "metadata": {
            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),

            "lead_time_hours": prediction.lead_time_hours,

            "hazard": hazard_name,

            "location_name": prediction.location_name,
            "latitude": lat,
            "longitude": lon
        },

        "features": features
    }
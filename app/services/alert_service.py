import uuid

from datetime import datetime, timezone

from app.models.alert import AlertResponse
from app.services.prediction_service import get_prediction


# ---------------------------------
# RECOMMENDED ACTIONS
# ---------------------------------

def get_recommended_action(
    hazard: str,
    severity: str
) -> str:

    actions = {
        "THUNDERSTORM": {
            "CRITICAL": (
                "Seek safe indoor shelter immediately. "
                "Avoid open areas, trees, and electrical infrastructure."
            ),
            "HIGH": (
                "Monitor conditions and avoid unnecessary "
                "outdoor activity."
            ),
            "MODERATE": (
                "Stay alert and monitor further weather updates."
            ),
            "LOW": (
                "No immediate action required."
            )
        },

        "CLOUDBURST": {
            "CRITICAL": (
                "Move away from low-lying and flood-prone areas "
                "and follow emergency instructions."
            ),
            "HIGH": (
                "Prepare for intense rainfall and possible "
                "localized flooding."
            ),
            "MODERATE": (
                "Monitor rainfall conditions and remain prepared."
            ),
            "LOW": (
                "No immediate action required."
            )
        },

        "FLASH_FLOOD": {
            "CRITICAL": (
                "Move to safer higher ground immediately and "
                "avoid entering floodwater."
            ),
            "HIGH": (
                "Avoid flooded roads and move away from "
                "water channels."
            ),
            "MODERATE": (
                "Monitor local water levels and avoid "
                "low-lying areas."
            ),
            "LOW": (
                "No immediate action required."
            )
        }
    }

    return actions.get(
        hazard.upper(),
        {}
    ).get(
        severity.upper(),
        "Monitor weather conditions and follow official guidance."
    )


# ---------------------------------
# GENERATE SINGLE ALERT
# ---------------------------------

def generate_alert(
    hazard: str,
    probability: float,
    severity: str,
    location_name: str,
    latitude: float,
    longitude: float,
    lead_time_hours: int
) -> AlertResponse:

    severity = severity.upper()
    hazard = hazard.upper()

    message = (
        f"{severity} {hazard} risk detected "
        f"for {location_name}. "
        f"Potential impact within approximately "
        f"{lead_time_hours} hours."
    )

    return AlertResponse(
        alert_id=(
            f"ALERT-"
            f"{uuid.uuid4().hex[:8].upper()}"
        ),

        hazard=hazard,
        severity=severity,

        location_name=location_name,
        latitude=latitude,
        longitude=longitude,

        probability=probability,
        lead_time_hours=lead_time_hours,

        message=message,

        recommended_action=get_recommended_action(
            hazard,
            severity
        ),

        created_at=datetime.now(
            timezone.utc
        )
    )


# ---------------------------------
# GET ALERTS FROM DASHBOARD
# ---------------------------------

def get_alerts(
    latitude: float | None = None,
    longitude: float | None = None
):

    prediction = get_prediction(
        latitude=latitude,
        longitude=longitude
    )

    hazards = {
        "THUNDERSTORM": prediction.thunderstorm,
        "CLOUDBURST": prediction.cloudburst,
        "FLASH_FLOOD": prediction.flash_flood
    }

    generated_alerts = []

    for hazard_name, hazard_data in hazards.items():

        # Do not create alerts for LOW risk
        if hazard_data.risk_level.upper() == "LOW":
            continue

        alert = generate_alert(
            hazard=hazard_name,
            probability=hazard_data.probability,
            severity=hazard_data.risk_level,
            location_name=prediction.location_name,
            latitude=prediction.latitude,
            longitude=prediction.longitude,
            lead_time_hours=prediction.lead_time_hours
        )

        generated_alerts.append(alert)

    return generated_alerts


# ---------------------------------
# CREATE ALERTS FROM ML PREDICTION
# ---------------------------------

def create_alerts_from_prediction(
    prediction_result: dict,
    location_name: str = "Bengaluru",
    latitude: float = 12.9716,
    longitude: float = 77.5946,
    lead_time_hours: int = 1
):

    generated_alerts = []

    for hazard, prediction in prediction_result.items():

        probability = prediction["probability"]
        risk_level = prediction["risk_level"]

        # Skip LOW-risk hazards
        if risk_level.upper() == "LOW":
            continue

        alert = generate_alert(
            hazard=hazard,
            probability=probability,
            severity=risk_level,
            location_name=location_name,
            latitude=latitude,
            longitude=longitude,
            lead_time_hours=lead_time_hours
        )

        generated_alerts.append(
            alert.model_dump()
        )

    return generated_alerts
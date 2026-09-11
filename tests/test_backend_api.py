import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.main import health_check, system_status
from app.api.prediction import test_predict
from app.services.inference_service import predict_hazards, model
from app.services.risk_map_service import get_risk_map
from app.services.alert_service import generate_alert


def test_health_check():
    result = health_check()
    assert result["status"] == "healthy"
    assert result["service"] == "vajra-backend"
    assert result["components"]["api"] == "running"
    assert result["components"]["ml_model"] == "loaded"
    print("✓ test_health_check passed")


def test_system_status():
    result = system_status()
    assert result["status"] == "operational"
    assert result["components"]["ml_inference"] == "available"
    assert result["model_details"]["loaded"] is True
    assert "thunderstorm" in result["model_details"]["hazards"]
    print("✓ test_system_status passed")


def test_inference_pipeline():
    weather_sequence = [
        [42, 950, 2, -35, 15],
        [45, 1200, 3, -38, 18],
        [50, 1800, 5, -45, 22],
        [55, 2500, 15, -55, 30],
        [60, 3200, 40, -65, 40]
    ]
    predictions = predict_hazards(weather_sequence)
    assert "thunderstorm" in predictions
    assert "cloudburst" in predictions
    assert "flash_flood" in predictions

    for hazard in ["thunderstorm", "cloudburst", "flash_flood"]:
        assert 0.0 <= predictions[hazard]["probability"] <= 100.0
        assert predictions[hazard]["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    print("✓ test_inference_pipeline passed")


def test_test_predict_endpoint():
    response = test_predict()
    assert response["status"] == "success"
    assert "prediction" in response
    assert response["prediction"]["thunderstorm"]["probability"] > 0
    print("✓ test_test_predict_endpoint passed")


def test_risk_map_generation():
    risk_map = get_risk_map("thunderstorm")
    assert risk_map["type"] == "FeatureCollection"
    assert len(risk_map["features"]) >= 1
    properties = risk_map["features"][0]["properties"]
    assert "zone_name" in properties
    assert "risk_level" in properties
    assert "probability" in properties
    print("✓ test_risk_map_generation passed")


def test_alert_generation():
    alert = generate_alert(
        hazard="thunderstorm",
        probability=75.0,
        severity="HIGH",
        location_name="Zone Alpha",
        latitude=20.2961,
        longitude=85.8245,
        lead_time_hours=1
    )
    assert alert.hazard == "THUNDERSTORM"
    assert alert.severity in ["HIGH", "SEVERE", "CRITICAL", "WATCH"]
    assert alert.probability == 75.0
    print("✓ test_alert_generation passed")


if __name__ == "__main__":
    print("\nRunning Vajra Backend Integration Tests...")
    test_health_check()
    test_system_status()
    test_inference_pipeline()
    test_test_predict_endpoint()
    test_risk_map_generation()
    test_alert_generation()
    print("\nAll Backend Tests Passed Successfully! [OK]\n")

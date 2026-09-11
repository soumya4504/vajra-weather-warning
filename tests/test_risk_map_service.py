from app.services.risk_map_service import get_risk_map


def test_get_risk_map_returns_feature_collection():
    result = get_risk_map("thunderstorm")

    assert result["type"] == "FeatureCollection"
    assert result["metadata"]["hazard"] == "THUNDERSTORM"
    assert len(result["features"]) == 3
    assert result["features"][0]["properties"]["hazard"] == "THUNDERSTORM"

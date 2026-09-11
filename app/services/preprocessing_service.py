def min_max_scale(
    value: float,
    minimum: float,
    maximum: float
) -> float:

    if maximum == minimum:
        return 0.0

    scaled = (
        value - minimum
    ) / (
        maximum - minimum
    )

    return max(
        0.0,
        min(scaled, 1.0)
    )

FEATURE_RANGES = {
    "iwv": {
        "min": 0.0,
        "max": 100.0
    },

    "cape": {
        "min": 0.0,
        "max": 5000.0
    },

    "rainfall_mm": {
        "min": 0.0,
        "max": 200.0
    },

    "cloud_top_temp": {
        "min": -90.0,
        "max": 20.0
    },

    "wind_speed_kmh": {
        "min": 0.0,
        "max": 150.0
    }
}

def normalize_weather_record(record: dict) -> dict:

    normalized = {}

    for feature, limits in FEATURE_RANGES.items():

        if feature not in record:
            continue

        normalized[feature] = min_max_scale(
            value=float(record[feature]),
            minimum=limits["min"],
            maximum=limits["max"]
        )

    return normalized

def normalize_sequence(sequence: list[dict]) -> list[dict]:

    normalized_sequence = []

    for record in sequence:

        normalized_record = (
            normalize_weather_record(record)
        )

        normalized_sequence.append(
            normalized_record
        )

    return normalized_sequence
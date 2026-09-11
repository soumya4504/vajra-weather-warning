from pathlib import Path

import joblib
import numpy as np


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "baseline_weather_model.joblib"
)


HAZARD_NAMES = [
    "thunderstorm",
    "cloudburst",
    "flash_flood"
]


def load_model():
    """
    Load the trained baseline model.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at: {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)


model = load_model()


def predict_hazards(weather_sequence):
    """
    Predict hazard probabilities and risk levels
    from a weather sequence.

    Expected input:
    [
        [iwv, cape, rainfall_mm, cloud_top_temp, wind_speed_kmh],
        ...
    ]
    """

    sequence = np.array(
        weather_sequence,
        dtype=float
    )

    expected_shape = (5, 5)

    if sequence.shape != expected_shape:
        raise ValueError(
            "Invalid weather sequence shape. "
            f"Expected {expected_shape}, "
            f"received {sequence.shape}"
        )

    # Convert:
    # (5, 5)
    #
    # Into:
    # (1, 25)

    model_input = sequence.reshape(
        1,
        -1
    )

    # Get probabilities for each hazard

    probabilities = model.predict_proba(
        model_input
    )

    results = {}

    for hazard, probability_output in zip(
        HAZARD_NAMES,
        probabilities
    ):

        # Probability of the positive class (event = 1)
        probability = float(
            probability_output[0][1]
        )

        results[hazard] = {
            "probability": round(
                probability * 100,
                2
            ),
            "risk_level": get_risk_level(
                probability
            )
        }

    return results

def get_risk_level(probability: float):
    """
    Convert probability into a dashboard risk level.
    """

    if probability >= 0.80:
        return "CRITICAL"

    elif probability >= 0.60:
        return "HIGH"

    elif probability >= 0.30:
        return "MODERATE"

    return "LOW"
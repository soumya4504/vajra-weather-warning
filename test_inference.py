from app.services.inference_service import (
    predict_hazards
)


weather_sequence = [
    [42, 950, 2, -35, 15],
    [45, 1200, 3, -38, 18],
    [50, 1800, 5, -45, 22],
    [55, 2500, 15, -55, 30],
    [60, 3200, 40, -65, 40]
]


result = predict_hazards(
    weather_sequence
)


print("\nHazard Risk Prediction:\n")

for hazard, data in result.items():

    print(hazard.upper())

    print(
        f"Probability: "
        f"{data['probability']}%"
    )

    print(
        f"Risk Level: "
        f"{data['risk_level']}"
    )

    print()
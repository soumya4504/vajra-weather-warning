from pathlib import Path
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


np.random.seed(42)


OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "app"
    / "data"
    / "raw"
    / "weather_development_data.csv"
)


def generate_weather_data(
    total_hours: int = 1000
):
    start_time = datetime(
        2025,
        6,
        1,
        0,
        0
    )

    rows = []

    for i in range(total_hours):

        timestamp = (
            start_time
            + timedelta(hours=i)
        )

        # ---------------------------------
        # NORMAL WEATHER BASELINE
        # ---------------------------------

        iwv = np.random.normal(
            38,
            8
        )

        cape = np.random.normal(
            1000,
            500
        )

        rainfall = max(
            0,
            np.random.normal(
                3,
                5
            )
        )

        cloud_top_temp = np.random.normal(
            -35,
            8
        )

        wind_speed = max(
            0,
            np.random.normal(
                15,
                6
            )
        )

        # ---------------------------------
        # RANDOM SEVERE WEATHER SIGNAL
        # ---------------------------------

        severe_signal = np.random.random()

        thunderstorm = 0
        cloudburst = 0
        flash_flood = 0

        if severe_signal > 0.88:

            iwv += np.random.uniform(
                15,
                30
            )

            cape += np.random.uniform(
                1200,
                3000
            )

            rainfall += np.random.uniform(
                20,
                60
            )

            cloud_top_temp -= np.random.uniform(
                15,
                30
            )

            wind_speed += np.random.uniform(
                10,
                30
            )

            thunderstorm = 1

        if severe_signal > 0.94:

            iwv += np.random.uniform(
                10,
                25
            )

            rainfall += np.random.uniform(
                40,
                100
            )

            cloudburst = 1

        if severe_signal > 0.97:

            rainfall += np.random.uniform(
                30,
                80
            )

            flash_flood = 1

        rows.append(
            {
                "timestamp": timestamp.isoformat(),

                "latitude": 20.2961,

                "longitude": 85.8245,

                "temperature_c": np.random.normal(
                    29,
                    3
                ),

                "humidity_percent": np.random.uniform(
                    60,
                    95
                ),

                "wind_speed_kmh": round(
                    wind_speed,
                    2
                ),

                "rainfall_mm": round(
                    rainfall,
                    2
                ),

                "iwv": round(
                    iwv,
                    2
                ),

                "cape": round(
                    max(cape, 0),
                    2
                ),

                "cloud_top_temp": round(
                    cloud_top_temp,
                    2
                ),

                "thunderstorm_label": thunderstorm,

                "cloudburst_label": cloudburst,

                "flash_flood_label": flash_flood
            }
        )

    return pd.DataFrame(rows)


def main():

    df = generate_weather_data(
        total_hours=1000
    )

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(
        f"Development dataset created: "
        f"{OUTPUT_PATH}"
    )

    print(
        f"Total rows: {len(df)}"
    )

    print(
        "\nEvent counts:"
    )

    print(
        df[
            [
                "thunderstorm_label",
                "cloudburst_label",
                "flash_flood_label"
            ]
        ].sum()
    )


if __name__ == "__main__":
    main()
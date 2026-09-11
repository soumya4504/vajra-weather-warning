from app.services.data_service import (
    load_weather_data,
    get_weather_window
)

from app.services.preprocessing_service import (
    normalize_sequence
)

def calculate_iwv_change_rate(df):
    return df["iwv"].iloc[-1] - df["iwv"].iloc[-2]


def calculate_rainfall_change(df):
    return (
        df["rainfall_mm"].iloc[-1]
        - df["rainfall_mm"].iloc[-2]
    )


def calculate_cloud_top_temp_change(df):
    return (
        df["cloud_top_temp"].iloc[-1]
        - df["cloud_top_temp"].iloc[-2]
    )


def calculate_wind_speed_change(df):
    return (
        df["wind_speed_kmh"].iloc[-1]
        - df["wind_speed_kmh"].iloc[-2]
    )

def get_latest_cape(df):
    return float(df["cape"].iloc[-1])

def get_latest_features():

    df = load_weather_data()

    if len(df) < 2:
        raise ValueError(
            "At least 2 weather records are required"
        )

    features = {
        "iwv": float(df["iwv"].iloc[-1]),

        "iwv_change": float(
            calculate_iwv_change_rate(df)
        ),

        "cape": float(
            get_latest_cape(df)
        ),

        "rainfall": float(
            df["rainfall_mm"].iloc[-1]
        ),

        "rainfall_change": float(
            calculate_rainfall_change(df)
        ),

        "cloud_top_temp": float(
            df["cloud_top_temp"].iloc[-1]
        ),

        "cloud_top_temp_change": float(
            calculate_cloud_top_temp_change(df)
        ),

        "wind_speed": float(
            df["wind_speed_kmh"].iloc[-1]
        ),

        "wind_speed_change": float(
            calculate_wind_speed_change(df)
        )
    }

    return features

def get_weather_sequence(window_size: int = 5):

    df = get_weather_window(window_size)

    feature_columns = [
        "iwv",
        "cape",
        "rainfall_mm",
        "cloud_top_temp",
        "wind_speed_kmh"
    ]

    sequence = df[
        feature_columns
    ].to_dict(
        orient="records"
    )

    return sequence

def prepare_ml_sequence(window_size: int = 5):

    df = get_weather_window(window_size)

    feature_columns = [
        "iwv",
        "cape",
        "rainfall_mm",
        "cloud_top_temp",
        "wind_speed_kmh"
    ]

    sequence = df[
        feature_columns
    ].astype(float).values.tolist()

    return sequence

def get_normalized_weather_sequence(
    window_size: int = 5
):

    raw_sequence = get_weather_sequence(
        window_size
    )

    normalized_sequence = normalize_sequence(
        raw_sequence
    )

    return normalized_sequence
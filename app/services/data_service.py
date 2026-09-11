from pathlib import Path
import pandas as pd


DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "raw"
    / "weather_sample.csv"
)


def load_weather_data():
    df = pd.read_csv(DATA_PATH)

    return df


def get_latest_weather_record():
    df = load_weather_data()

    latest_record = df.iloc[-1]

    return latest_record.to_dict()

def get_weather_window(window_size: int = 5):
    df = load_weather_data()

    if len(df) < window_size:
        raise ValueError(
            f"Not enough weather records. "
            f"Need at least {window_size} records."
        )

    window = df.tail(window_size).copy()

    return window
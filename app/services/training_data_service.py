from pathlib import Path
import pandas as pd


TRAINING_DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "raw"
    / "weather_development_data.csv"
)


def load_training_data():

    df = pd.read_csv(
        TRAINING_DATA_PATH
    )

    return df

FEATURE_COLUMNS = [
    "iwv",
    "cape",
    "rainfall_mm",
    "cloud_top_temp",
    "wind_speed_kmh"
]


LABEL_COLUMNS = [
    "thunderstorm_label",
    "cloudburst_label",
    "flash_flood_label"
]

def prepare_training_data():

    df = load_training_data()

    X = df[
        FEATURE_COLUMNS
    ].astype(float)

    y = df[
        LABEL_COLUMNS
    ].astype(int)

    return X, y

def validate_training_data(df):

    required_columns = (
        FEATURE_COLUMNS
        + LABEL_COLUMNS
    )

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing columns: {missing_columns}"
        )

    if df.empty:
        raise ValueError(
            "Training dataset is empty"
        )

    return True

def prepare_training_data():

    df = load_training_data()

    validate_training_data(df)

    X = df[
        FEATURE_COLUMNS
    ].astype(float)

    y = df[
        LABEL_COLUMNS
    ].astype(int)

    return X, y

WINDOW_SIZE = 5

LEAD_TIME_STEPS = 2

FORECAST_WINDOW_STEPS = 4

def create_future_hazard_label(
    future_window
):
    """
    Creates one multi-hazard label.

    If an event occurs anywhere inside the
    future forecast window, the label becomes 1.
    """

    thunderstorm = int(
        future_window["thunderstorm_label"]
        .max()
    )

    cloudburst = int(
        future_window["cloudburst_label"]
        .max()
    )

    flash_flood = int(
        future_window["flash_flood_label"]
        .max()
    )

    return {
        "thunderstorm": thunderstorm,
        "cloudburst": cloudburst,
        "flash_flood": flash_flood
    }

def create_nowcasting_dataset():

    df = load_training_data()

    validate_training_data(df)

    X_sequences = []
    y_labels = []

    total_rows = len(df)

    last_valid_start = (
        total_rows
        - WINDOW_SIZE
        - LEAD_TIME_STEPS
        - FORECAST_WINDOW_STEPS
        + 1
    )

    for start_index in range(
        last_valid_start
    ):

        # -------------------------
        # INPUT WINDOW
        # -------------------------

        input_start = start_index

        input_end = (
            start_index
            + WINDOW_SIZE
        )

        input_window = df.iloc[
            input_start:input_end
        ]

        # -------------------------
        # FUTURE FORECAST WINDOW
        # -------------------------

        forecast_start = (
            input_end
            + LEAD_TIME_STEPS
        )

        forecast_end = (
            forecast_start
            + FORECAST_WINDOW_STEPS
        )

        future_window = df.iloc[
            forecast_start:forecast_end
        ]

        # -------------------------
        # INPUT FEATURES
        # -------------------------

        X = (
            input_window[
                FEATURE_COLUMNS
            ]
            .astype(float)
            .values
            .tolist()
        )

        # -------------------------
        # FUTURE LABEL
        # -------------------------

        y = create_future_hazard_label(
            future_window
        )

        X_sequences.append(X)

        y_labels.append(y)

    return X_sequences, y_labels
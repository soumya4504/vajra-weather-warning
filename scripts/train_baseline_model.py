import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import joblib
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.services.training_data_service import (
    create_nowcasting_dataset
)


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "app"
    / "models"
    / "baseline_weather_model.joblib"
)


def main():

    print("\nLoading nowcasting dataset...")

    X_sequences, y_labels = (
        create_nowcasting_dataset()
    )

    # -----------------------------
    # Convert sequences to NumPy
    # -----------------------------

    X = np.array(
        X_sequences,
        dtype=float
    )

    # Random Forest expects:
    # (samples, features)
    #
    # So flatten:
    # (samples, time_steps, features)
    #
    # into:
    # (samples, time_steps * features)

    X = X.reshape(
        X.shape[0],
        -1
    )

    # -----------------------------
    # Convert labels
    # -----------------------------

    y = np.array(
        [
            [
                label["thunderstorm"],
                label["cloudburst"],
                label["flash_flood"]
            ]
            for label in y_labels
        ]
    )

    print(f"Total samples: {len(X)}")
    print(f"Input shape: {X.shape}")
    print(f"Output shape: {y.shape}")

    # -----------------------------
    # Train / Test Split
    # -----------------------------

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42
        )
    )

    print(
        f"\nTraining samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    # -----------------------------
    # Baseline Model
    # -----------------------------

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight="balanced"
    )

    print("\nTraining model...")

    model.fit(
        X_train,
        y_train
    )

    # -----------------------------
    # Prediction
    # -----------------------------

    predictions = model.predict(
        X_test
    )

    # -----------------------------
    # Evaluation
    # -----------------------------

    hazard_names = [
        "Thunderstorm",
        "Cloudburst",
        "Flash Flood"
    ]

    for index, hazard in enumerate(
        hazard_names
    ):

        print("\n")
        print("=" * 40)
        print(hazard.upper())
        print("=" * 40)

        print(
            classification_report(
                y_test[:, index],
                predictions[:, index],
                zero_division=0
            )
        )

    # -----------------------------
    # Save Model
    # -----------------------------

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print(
        f"\nModel saved successfully:"
        f"\n{MODEL_PATH}"
    )


if __name__ == "__main__":
    main()
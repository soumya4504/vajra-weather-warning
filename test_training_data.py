from app.services.training_data_service import (
    create_nowcasting_dataset
)


X_sequences, y_labels = create_nowcasting_dataset()


print("\n==============================")
print("NOWCASTING DATASET TEST")
print("==============================")

print(f"\nTotal training samples: {len(X_sequences)}")


if len(X_sequences) > 0:

    print("\n--- First Input Sequence ---")

    for index, record in enumerate(X_sequences[0]):
        print(
            f"Time step {index + 1}: {record}"
        )


    print("\n--- Future Hazard Label ---")

    print(y_labels[0])


else:
    print(
        "\nNo training samples generated."
    )

print("\n--- Dataset Validation ---")

expected_window_size = 5
expected_feature_count = 5


invalid_samples = 0


for sequence in X_sequences:

    if len(sequence) != expected_window_size:
        invalid_samples += 1
        continue

    for row in sequence:

        if len(row) != expected_feature_count:
            invalid_samples += 1
            break


print(f"Invalid samples: {invalid_samples}")


if invalid_samples == 0:
    print(
        "Dataset structure is valid ✅"
    )
else:
    print(
        "Dataset structure has errors ❌"
    )

print("\n--- Hazard Distribution ---")

thunderstorms = sum(
    label["thunderstorm"]
    for label in y_labels
)

cloudbursts = sum(
    label["cloudburst"]
    for label in y_labels
)

flash_floods = sum(
    label["flash_flood"]
    for label in y_labels
)


print(
    f"Future thunderstorm samples: "
    f"{thunderstorms}"
)

print(
    f"Future cloudburst samples: "
    f"{cloudbursts}"
)

print(
    f"Future flash flood samples: "
    f"{flash_floods}"
)
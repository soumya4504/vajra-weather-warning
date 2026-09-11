from fastapi import APIRouter

from app.services.training_data_service import (
    create_nowcasting_dataset
)


router = APIRouter(
    prefix="/api",
    tags=["Training"]
)


@router.get("/training/dataset-preview")
def get_training_dataset_preview():

    X, y = create_nowcasting_dataset()

    return {
        "total_samples": len(X),
        "sample_input": X[0] if X else None,
        "sample_target": y[0] if y else None
    }
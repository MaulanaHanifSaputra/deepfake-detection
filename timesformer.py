import numpy as np


def analyze_with_transformer(frames):
    if not frames:
        return {"confidence": 0.0, "prediction": "skipped"}

    return {"confidence": 0.0, "prediction": "unknown"}

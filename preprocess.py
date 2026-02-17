from typing import Optional, Tuple

import cv2
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input


def preprocess_frame_for_cnn(
    frame_bgr: np.ndarray,
    img_size: int = 150,
) -> np.ndarray:
    """Return a batch tensor shaped (1, img_size, img_size, 3) in MobileNetV2 preprocessed space."""
    img = cv2.resize(frame_bgr, (img_size, img_size))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = np.expand_dims(img.astype(np.float32), axis=0)
    img = preprocess_input(img)
    return img


def blur_score(frame_bgr: np.ndarray) -> float:
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def normalize_video_prediction(p_real: float) -> Tuple[float, float]:
    p_real = float(p_real)
    p_real = max(0.0, min(1.0, p_real))
    return p_real, 1.0 - p_real


def percent(value_0_1: Optional[float]) -> float:
    if value_0_1 is None:
        return 0.0
    v = float(value_0_1)
    v = max(0.0, min(1.0, v))
    return v * 100.0

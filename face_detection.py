import os
from typing import Optional, Tuple

import cv2
import numpy as np


_FACE_CASCADE = None


def get_face_cascade() -> Optional[cv2.CascadeClassifier]:
    global _FACE_CASCADE
    if _FACE_CASCADE is not None:
        return _FACE_CASCADE

    try:
        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        if os.path.isfile(cascade_path):
            _FACE_CASCADE = cv2.CascadeClassifier(cascade_path)
        else:
            _FACE_CASCADE = None
    except Exception:
        _FACE_CASCADE = None

    return _FACE_CASCADE


def detect_largest_face_box(frame_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    cascade = get_face_cascade()
    if cascade is None or cascade.empty():
        return None

    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(faces) == 0:
        return None

    faces = sorted(faces, key=lambda b: int(b[2]) * int(b[3]), reverse=True)
    x, y, w, h = faces[0]
    return int(x), int(y), int(w), int(h)


def crop_face(frame_bgr: np.ndarray, pad_ratio: float = 0.15) -> Optional[np.ndarray]:
    box = detect_largest_face_box(frame_bgr)
    if box is None:
        return None

    x, y, w, h = box
    pad = int(pad_ratio * max(w, h))
    x0 = max(0, x - pad)
    y0 = max(0, y - pad)
    x1 = min(frame_bgr.shape[1], x + w + pad)
    y1 = min(frame_bgr.shape[0], y + h + pad)

    if x1 <= x0 or y1 <= y0:
        return None

    return frame_bgr[y0:y1, x0:x1]


def has_face(frame_bgr: np.ndarray) -> bool:
    cascade = get_face_cascade()
    if cascade is None or cascade.empty():
        return True
    return detect_largest_face_box(frame_bgr) is not None

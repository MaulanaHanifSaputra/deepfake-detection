import os
from typing import Callable, List, Optional, Tuple

import cv2
import numpy as np


IMG_EXTS = {".jpg", ".jpeg", ".png"}


def list_images(root_dir: str) -> List[str]:
    paths: List[str] = []
    for base, _, files in os.walk(root_dir):
        for f in files:
            _, ext = os.path.splitext(f)
            if ext.lower() in IMG_EXTS:
                paths.append(os.path.join(base, f))
    return sorted(paths)


def build_image_classification_index(dataset_dir: str) -> List[Tuple[str, int]]:
    """Return list of (path, label) with labels: real=1, fake=0."""
    real_dir = os.path.join(dataset_dir, "real")
    fake_dir = os.path.join(dataset_dir, "fake")

    if not os.path.isdir(real_dir) or not os.path.isdir(fake_dir):
        raise ValueError(f"Expected dataset_dir with subfolders real/ and fake/: {dataset_dir}")

    items: List[Tuple[str, int]] = []
    for p in list_images(fake_dir):
        items.append((p, 0))
    for p in list_images(real_dir):
        items.append((p, 1))

    return items


def load_image_rgb(path: str, img_size: int = 150) -> np.ndarray:
    bgr = cv2.imread(path)
    if bgr is None:
        raise ValueError(f"Cannot read image: {path}")
    bgr = cv2.resize(bgr, (img_size, img_size))
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return rgb


class SimpleImageDataset:
    """Minimal dataset class (framework-agnostic).

    - Use for quick experiments or to wrap into PyTorch/TensorFlow pipelines.
    - `transform` receives an RGB uint8 image array shaped (H,W,3) and must return a processed array.
    """

    def __init__(
        self,
        dataset_dir: str,
        img_size: int = 150,
        transform: Optional[Callable[[np.ndarray], np.ndarray]] = None,
    ):
        self.items = build_image_classification_index(dataset_dir)
        self.img_size = int(img_size)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int):
        path, label = self.items[int(idx)]
        img = load_image_rgb(path, img_size=self.img_size)
        if self.transform is not None:
            img = self.transform(img)
        return img, int(label)

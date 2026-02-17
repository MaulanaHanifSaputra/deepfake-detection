import cv2
import os
from typing import Iterator, List, Optional, Tuple


def iter_video_frames(
    video_path: str,
    sample_every: int = 5,
    max_frames: Optional[int] = None,
) -> Iterator[Tuple[int, "cv2.typing.MatLike"]]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap.release()
        raise ValueError(f"Cannot open video: {video_path}")

    idx = 0
    yielded = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if sample_every <= 1 or (idx % sample_every == 0):
                yield idx, frame
                yielded += 1
                if max_frames is not None and yielded >= int(max_frames):
                    break

            idx += 1
    finally:
        cap.release()


def extract_frames_to_dir(
    video_path: str,
    out_dir: str,
    sample_every: int = 5,
    max_frames: Optional[int] = None,
    prefix: str = "frame",
) -> List[str]:
    os.makedirs(out_dir, exist_ok=True)

    paths: List[str] = []
    for i, (frame_idx, frame) in enumerate(iter_video_frames(video_path, sample_every=sample_every, max_frames=max_frames)):
        filename = f"{prefix}_{i:04d}_idx{frame_idx}.jpg"
        path = os.path.join(out_dir, filename)
        ok = cv2.imwrite(path, frame)
        if ok:
            paths.append(path)

    return paths

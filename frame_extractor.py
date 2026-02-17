import cv2
import os

def extract_frames(video_path, num_frames=32):
    """Extract frames from video for analysis"""
    frames = []
    
    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}")
        return frames
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Cannot open video: {video_path}")
        return frames
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames == 0:
        print("No frames in video")
        cap.release()
        return frames
    
    # Extract frames evenly
    if total_frames <= 1:
        frame_indices = [0]
    else:
        frame_indices = [int(i * (total_frames - 1) / (num_frames - 1)) for i in range(num_frames)]
    frame_indices = [max(0, min(total_frames - 1, idx)) for idx in frame_indices]

    for frame_idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (112, 112))
            frames.append(frame)
        else:
            print(f"Failed to read frame {frame_idx}")
    
    cap.release()
    return frames

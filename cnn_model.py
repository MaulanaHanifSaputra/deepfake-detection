import numpy as np
import cv2
import tensorflow as tf

MODEL_PATH = "model/deepfake_model.h5"
IMG_SIZE = 224   # 🔥 WAJIB 224

print("Loading CNN model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("CNN Model loaded!")

def analyze_with_cnn(video_path):
    cap = cv2.VideoCapture(video_path)

    frames = []
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # ambil tiap 5 frame biar cepat
        if frame_count % 5 == 0:
            frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = frame / 255.0
            frames.append(frame)

        frame_count += 1

    cap.release()

    if len(frames) == 0:
        return {"result": "NO FACE", "confidence": 0}

    frames = np.array(frames)

    preds = model.predict(frames, verbose=0)
    mean_pred = np.mean(preds)

    if mean_pred > 0.5:
        label = "FAKE"
        confidence = float(mean_pred)
    else:
        label = "REAL"
        confidence = float(1 - mean_pred)

    return {
        "result": label,
        "confidence": confidence,
        "frames_analyzed": len(frames)
    }

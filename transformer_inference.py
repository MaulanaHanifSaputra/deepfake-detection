import cv2
import torch
import numpy as np
from transformers import TimesformerForVideoClassification, AutoImageProcessor

MODEL_DIR = "transformer_model"

print("Loading TimeSformer model...")
model = TimesformerForVideoClassification.from_pretrained(MODEL_DIR)
processor = AutoImageProcessor.from_pretrained(MODEL_DIR)
model.eval()
print("TimeSformer loaded!")


def extract_frames_from_array(frames, num_frames=16):
    n = len(frames)
    idxs = np.linspace(0, n - 1, num_frames).astype(int)
    return [frames[i] for i in idxs]


def analyze_with_transformer(frames):
    try:
        if len(frames) < 5:
            return {"prediction": "unknown", "confidence": 0}

        # ambil 16 frame evenly
        frames = extract_frames_from_array(frames, 16)

        # preprocess huggingface
        inputs = processor(frames, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=1)[0]

        real_score = float(probs[0])
        fake_score = float(probs[1])

        label = "REAL" if real_score > fake_score else "FAKE"
        confidence = max(real_score, fake_score) * 100

        return {
            "prediction": label.lower(),
            "confidence": round(confidence, 2),
            "real_score": real_score,
            "fake_score": fake_score
        }

    except Exception as e:
        print("Transformer error:", e)
        return {"prediction": "unknown", "confidence": 0}

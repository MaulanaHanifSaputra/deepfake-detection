import os
import torch
import cv2
import numpy as np
from transformers import TimesformerForVideoClassification, AutoImageProcessor


# ============================ 
# 1. LOAD FOLDER DATASET
# ============================ 
def load_video_dataset(root_dir):
    videos = []
    labels = []

    print(f"Loading video dataset from: {root_dir}")
    
    for label_name in ["real", "fake"]:
        folder = os.path.join(root_dir, label_name)
        class_id = 0 if label_name == "real" else 1
        
        if not os.path.exists(folder):
            print(f"WARNING: Folder not found: {folder}")
            continue
            
        video_files = [f for f in os.listdir(folder) if f.endswith(".mp4") or f.endswith(".avi")]
        print(f"{label_name}: {len(video_files)} videos")
        
        for file in video_files:
            videos.append(os.path.join(folder, file))
            labels.append(class_id)

    total = len(videos)
    print(f"Total dataset: {total} videos")
    
    if total == 0:
        print("ERROR: No videos found in dataset folders!")
        return []
    
    # Check class balance
    real_count = labels.count(0)
    fake_count = labels.count(1)
    print(f"Class distribution - Real: {real_count}, Fake: {fake_count}")
    
    items = list(zip(videos, labels))
    return items


# ============================ 
# 2. FRAME EXTRACTOR (STABIL)
# ============================ 
def extract_frames(video_path, num_frames=16):
    video_path = str(video_path)  # Fix OpenCV path bug

    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total <= 1:  # jika video corrupt
        cap.release()
        return []

    idxs = np.linspace(0, total - 1, num_frames).astype(int)

    frames = []
    for i in idxs:
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)

    cap.release()
    return frames


# ============================ 
# 3. MAIN TRAIN FUNCTION
# ============================ 
def train():

    items = load_video_dataset("dataset")
    
    # Check minimum dataset size
    if len(items) < 5:
        print("ERROR: Dataset terlalu kecil untuk training. Minimal butuh 5 video.")
        print(f"Current dataset size: {len(items)} videos")
        return
    
    processor = AutoImageProcessor.from_pretrained(
        "facebook/timesformer-base-finetuned-k400"
    )

    # ============================
    # LOAD MODEL FIX
    # ============================
    model = TimesformerForVideoClassification.from_pretrained(
        "facebook/timesformer-base-finetuned-k400",
        ignore_mismatched_sizes=True,
        num_labels=2
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    rng = np.random.default_rng(1337)
    idxs = np.arange(len(items))
    rng.shuffle(idxs)
    split = max(1, int(0.2 * len(items)))
    test_idxs = set(idxs[:split].tolist())
    train_items = [items[i] for i in idxs[split:]]
    test_items = [items[i] for i in idxs[:split]]

    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    criterion = torch.nn.CrossEntropyLoss()
    epochs = 1

    def _forward(video_path, label):
        frames = extract_frames(video_path)
        if len(frames) == 0:
            frames = [np.zeros((224, 224, 3), dtype=np.uint8)] * 16
        inputs = processor(frames, return_tensors="pt")
        pixel_values = inputs["pixel_values"].to(device)
        labels = torch.tensor([label], dtype=torch.long, device=device)
        outputs = model(pixel_values=pixel_values)
        logits = outputs.logits
        loss = criterion(logits, labels)
        return loss, logits

    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for step, (video_path, label) in enumerate(train_items, start=1):
            optimizer.zero_grad()
            loss, _ = _forward(video_path, label)
            loss.backward()
            optimizer.step()
            total_loss += float(loss.item())
            if step % 2 == 0:
                print(f"Epoch {epoch+1}/{epochs} step {step}/{len(train_items)} loss={total_loss/step:.4f}")

        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for video_path, label in test_items:
                _, logits = _forward(video_path, label)
                pred = int(torch.argmax(logits, dim=1).item())
                correct += 1 if pred == int(label) else 0
                total += 1
        acc = (correct / total * 100.0) if total else 0.0
        print(f"Eval accuracy: {acc:.2f}% ({correct}/{total})")

    # SIMPAN MODEL FINAL
    model.save_pretrained("transformer_model")
    processor.save_pretrained("transformer_model")

    print("\nTraining selesai -> model disimpan di transformer_model/")
    print("SUCCESS: Transformer model berhasil dilatih dan siap digunakan!")


if __name__ == "__main__":
    try:
        train()
        print("\nTraining process completed successfully!")
    except Exception as e:
        print(f"\nERROR: Training failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

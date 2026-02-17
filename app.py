from flask import Flask, request, jsonify, render_template, redirect, session, send_from_directory, url_for
from flask_cors import CORS
import os
import uuid
import threading
import subprocess
import time
import sys
import traceback
from werkzeug.utils import secure_filename

# ===============================
# APP CONFIG
# ===============================
app = Flask(__name__)
app.secret_key = "deepfake_secret_key"
CORS(app, supports_credentials=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024

DATASET_ROOT = os.path.join(BASE_DIR, "dataset")
CNN_DATASET_DIR = os.path.join(DATASET_ROOT, "train")
TRANSFORMER_DATASET_DIR = DATASET_ROOT

os.makedirs(os.path.join(CNN_DATASET_DIR, "real"), exist_ok=True)
os.makedirs(os.path.join(CNN_DATASET_DIR, "fake"), exist_ok=True)
os.makedirs(os.path.join(TRANSFORMER_DATASET_DIR, "real"), exist_ok=True)
os.makedirs(os.path.join(TRANSFORMER_DATASET_DIR, "fake"), exist_ok=True)

_training_lock = threading.Lock()
_training_state = {
    "image": {"running": False, "started_at": None, "ended_at": None, "last_error": None, "last_success": None, "last_stdout": None, "last_stderr": None},
    "video": {"running": False, "started_at": None, "ended_at": None, "last_error": None, "last_success": None, "last_stdout": None, "last_stderr": None},
}

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"}

def is_allowed_video_filename(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_VIDEO_EXTENSIONS

# ===============================
# DATABASE - MySQL with XAMPP
# ===============================
import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="deepfake_db"
    )

def _ensure_dataset_table():
    db = get_db()
    cur = db.cursor()
    
    # Create dataset_items table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dataset_items (
            id INT(11) NOT NULL AUTO_INCREMENT,
            filename VARCHAR(255) NOT NULL,
            filepath TEXT NOT NULL,
            label ENUM('real', 'fake') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    """)
    
    # Create users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT(11) NOT NULL AUTO_INCREMENT,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    """)
    
    # Create video_detections table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS video_detections (
            id INT(11) NOT NULL AUTO_INCREMENT,
            user_id INT(11) NOT NULL,
            video_name VARCHAR(255) NOT NULL,
            video_path TEXT NOT NULL,
            cnn_result ENUM('real', 'fake') NOT NULL,
            cnn_confidence DECIMAL(5,2) NOT NULL,
            transformer_result ENUM('real', 'fake') NOT NULL,
            transformer_confidence DECIMAL(5,2) NOT NULL,
            final_result ENUM('real', 'fake') NOT NULL,
            final_confidence DECIMAL(5,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Insert default admin user if not exists
    cur.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cur.fetchone():
        cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)", 
                   ('admin', 'admin', 'admin'))
    
    db.commit()
    db.close()


_ensure_dataset_table()

# ===============================
# MODELS
# ===============================
from cnn_model import analyze_with_cnn
from df_transformers.frame_extractor import extract_frames
from transformer_inference import analyze_with_transformer
from enhanced_routes import register_enhanced_routes



# ===============================
# ROUTES - WEB
# ===============================
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
    else:
        username = request.form.get("username")
        password = request.form.get("password")

    # Validate required fields
    if not username or not password:
        if request.is_json:
            return jsonify({"error": "Username and password are required"}), 400
        return render_template("login.html", error="Username and password are required")

    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT id, role FROM users WHERE username=%s AND password=%s",
        (username, password)
    )
    user = cur.fetchone()
    db.close()

    if user:
        session["user_id"] = user["id"]
        session["role"] = user["role"]
        if request.is_json:
            return jsonify({"message": "Login successful", "user_id": user["id"], "role": user["role"]}), 200
        return redirect("/dashboard")

    if request.is_json:
        return jsonify({"error": "Invalid credentials"}), 401
    return render_template("login.html", error="Login gagal")

@app.route("/verify-token")
def verify_token():
    if "user_id" in session:
        return jsonify({
            "authenticated": True,
            "user_id": session["user_id"],
            "role": session.get("role", "user")
        })
    return jsonify({"authenticated": False}), 401


@app.route("/user/stats", methods=["GET"])
def user_stats():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute(
        "SELECT COUNT(*) AS total FROM video_detections WHERE user_id = %s",
        (user_id,)
    )
    total_scans = int((cur.fetchone() or {}).get("total") or 0)

    cur.execute(
        "SELECT COUNT(*) AS total FROM video_detections WHERE user_id = %s AND final_result = 'fake'",
        (user_id,)
    )
    fake_found = int((cur.fetchone() or {}).get("total") or 0)

    cur.execute(
        "SELECT AVG(final_confidence) AS avg_conf FROM video_detections WHERE user_id = %s",
        (user_id,)
    )
    avg_confidence = float((cur.fetchone() or {}).get("avg_conf") or 0.0)

    cur.execute(
        """
        SELECT COUNT(*) AS total
        FROM video_detections
        WHERE user_id = %s
          AND DATE(created_at) = CURDATE()
        """,
        (user_id,)
    )
    today_scans = int((cur.fetchone() or {}).get("total") or 0)

    db.close()

    resp = jsonify({
        "totalScans": total_scans,
        "fakeFound": fake_found,
        "avgConfidence": round(avg_confidence, 2),
        "todayScans": today_scans,
    })
    resp.headers["Cache-Control"] = "no-store"
    return resp

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
    else:
        username = request.form.get("username")
        password = request.form.get("password")

    # Validate required fields
    if not username or not password:
        if request.is_json:
            return jsonify({"error": "Username and password are required"}), 400
        return render_template("register.html", error="Username and password are required")

    db = get_db()
    cur = db.cursor()
    
    # Check if user already exists
    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        db.close()
        if request.is_json:
            return jsonify({"error": "Username already exists"}), 400
        return render_template("register.html", error="Username already exists")
    
    # Create new user
    cur.execute(
        "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
        (username, password, "user")
    )
    db.commit()
    db.close()
    
    if request.is_json:
        return jsonify({"message": "User registered successfully"}), 201
    return redirect("/login")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect("/login")

    if session.get("role") == "admin":
        return render_template("admin_home.html")

    return render_template("user_home.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ===============================
# DETECT API
# ===============================
@app.route("/detect", methods=["POST"])
def detect():
    try:
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401

        if "video" not in request.files:
            return jsonify({"error": "No video uploaded"}), 400

        video = request.files["video"]
        original_filename = secure_filename(video.filename or "")

        if not original_filename:
            return jsonify({"error": "Invalid filename"}), 400

        if not is_allowed_video_filename(original_filename):
            return jsonify({"error": "Unsupported video format"}), 400

        # ===============================
        # SAVE VIDEO
        # ===============================
        _, ext = os.path.splitext(original_filename)
        stored_filename = f"{uuid.uuid4().hex}{ext}"
        video_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_filename)
        video.save(video_path)

        print("\n========== NEW DETECTION ==========")
        print("Video saved:", video_path)

        # ===============================
        # 1️⃣ EXTRACT FRAMES
        # ===============================
        print("Extracting frames...")
        frames = extract_frames(video_path, num_frames=32)
        print("Frames extracted:", len(frames))

        if len(frames) == 0:
            return jsonify({"error": "Failed to extract frames"}), 500

        # ===============================
        # 2️⃣ CNN ANALYSIS
        # ===============================
        print("Running CNN...")
        cnn_result = analyze_with_cnn(video_path)
        print("CNN RESULT:", cnn_result)

        # ===============================
        # 3️⃣ TRANSFORMER ANALYSIS
        # ===============================
        print("Running Transformer...")
        transformer_result = analyze_with_transformer(frames)
        print("TRANSFORMER RESULT:", transformer_result)

        # ===============================
        # NORMALIZE RESULT
        # ===============================
        cnn_label = str(cnn_result.get("result", "unknown")).lower()
        cnn_conf = float(cnn_result.get("confidence", 0))

        tr_label = str(transformer_result.get("prediction", "unknown")).lower()
        tr_conf = float(transformer_result.get("confidence", 0))

        # convert to percentage if needed
        if cnn_conf <= 1:
            cnn_conf *= 100
        if tr_conf <= 1:
            tr_conf *= 100

        cnn_conf = round(cnn_conf, 2)
        tr_conf = round(tr_conf, 2)

        # ===============================
        # 4️⃣ ENSEMBLE FINAL RESULT
        # ===============================
        if cnn_label == tr_label and cnn_label in ["real", "fake"]:
            final_result = cnn_label
            final_conf = (cnn_conf + tr_conf) / 2
        else:
            if tr_conf > cnn_conf:
                final_result = tr_label
                final_conf = tr_conf
            else:
                final_result = cnn_label
                final_conf = cnn_conf

        final_conf = round(final_conf, 2)

        print("FINAL RESULT:", final_result, final_conf)

        # ===============================
        # SAVE TO DATABASE
        # ===============================
        db = get_db()
        cur = db.cursor()
        cur.execute("""
            INSERT INTO video_detections
            (user_id, video_name, video_path,
             cnn_result, cnn_confidence,
             transformer_result, transformer_confidence,
             final_result, final_confidence)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            session["user_id"],
            original_filename,
            video_path,
            cnn_label,
            cnn_conf,
            tr_label,
            tr_conf,
            final_result,
            final_conf
        ))
        db.commit()
        db.close()

        video_url = url_for("uploaded_file", filename=stored_filename, _external=True)

        # ===============================
        # RESPONSE TO FRONTEND
        # ===============================
        return jsonify({
            "classification": final_result,
            "confidence": final_conf,
            "cnn_analysis": {
                "result": cnn_label,
                "confidence": cnn_conf
            },
            "transformer_analysis": {
                "result": tr_label,
                "confidence": tr_conf
            },
            "video_url": video_url
        })

    except Exception as e:
        print("\n❌ DETECT ERROR:")
        traceback.print_exc()
        return jsonify({"error": "Detection failed"}), 500



@app.route("/api/admin/dataset", methods=["GET"])
def api_admin_dataset_list():
    err = _require_admin()
    if err:
        return err

    dtype = (request.args.get("type") or "").strip().lower()
    label = (request.args.get("label") or "").strip().lower()
    if dtype not in {"", "image", "video"}:
        dtype = ""
    if label not in {"", "real", "fake"}:
        label = ""

    db = get_db()
    cur = db.cursor(dictionary=True)

    where = []
    params = []
    if dtype:
        where.append("type = %s")
        params.append(dtype)
    if label:
        where.append("label = %s")
        params.append(label)

    where_sql = "WHERE " + " AND ".join(where) if where else ""

    cur.execute(
        f"""
        SELECT id, type, label, filename, file_path, uploaded_by, created_at
        FROM dataset_items
        {where_sql}
        ORDER BY created_at DESC
        LIMIT 200
        """,
        tuple(params)
    )
    items = cur.fetchall() or []
    db.close()
    return jsonify({"items": items})


@app.route("/admin/dataset", methods=["GET"])
def admin_dataset_list():
    return api_admin_dataset_list()


@app.route("/api/admin/dataset/video", methods=["POST"])
def api_admin_dataset_upload_video():
    err = _require_admin()
    if err:
        return err

    label = (request.form.get("label") or "").strip().lower()
    if label not in {"real", "fake"}:
        return jsonify({"error": "Invalid label"}), 400

    if "video" not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    video = request.files["video"]
    original_filename = secure_filename(video.filename or "")
    if not original_filename:
        return jsonify({"error": "Invalid filename"}), 400
    if not is_allowed_video_filename(original_filename):
        return jsonify({"error": "Unsupported video format"}), 400

    _, ext = os.path.splitext(original_filename)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = os.path.join(TRANSFORMER_DATASET_DIR, label)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, stored_filename)
    video.save(dest_path)

    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO dataset_items (type, label, filename, file_path, uploaded_by) VALUES (%s,%s,%s,%s,%s)",
        ("video", label, original_filename, dest_path, session.get("user_id"))
    )
    db.commit()
    db.close()

    return jsonify({"message": "Video added to dataset", "path": dest_path})


@app.route("/admin/dataset/video", methods=["POST"])
def admin_dataset_upload_video():
    return api_admin_dataset_upload_video()


@app.route("/api/admin/dataset/image", methods=["POST"])
def api_admin_dataset_upload_image():
    err = _require_admin()
    if err:
        return err

    label = (request.form.get("label") or "").strip().lower()
    if label not in {"real", "fake"}:
        return jsonify({"error": "Invalid label"}), 400

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    original_filename = secure_filename(image.filename or "")
    if not original_filename:
        return jsonify({"error": "Invalid filename"}), 400

    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        return jsonify({"error": "Unsupported image format"}), 400

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = os.path.join(CNN_DATASET_DIR, label)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, stored_filename)
    image.save(dest_path)

    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO dataset_items (type, label, filename, file_path, uploaded_by) VALUES (%s,%s,%s,%s,%s)",
        ("image", label, original_filename, dest_path, session.get("user_id"))
    )
    db.commit()
    db.close()

    return jsonify({"message": "Image added to dataset", "path": dest_path})


@app.route("/admin/dataset/image", methods=["POST"])
def admin_dataset_upload_image():
    return api_admin_dataset_upload_image()


@app.route("/api/admin/train/status", methods=["GET"])
def api_admin_train_status():
    err = _require_admin()
    if err:
        return err

    with _training_lock:
        return jsonify({"status": _training_state})


@app.route("/admin/train/status", methods=["GET"])
def admin_train_status():
    return api_admin_train_status()


@app.route("/api/admin/train/image", methods=["POST"])
def api_admin_train_image():
    err = _require_admin()
    if err:
        return err

    with _training_lock:
        if _training_state["image"]["running"]:
            return jsonify({"message": "Training already running"}), 409

    t = threading.Thread(
        target=_run_training_job,
        args=("image", [sys.executable, "train_cnn.py"]),
        daemon=True
    )
    t.start()
    return jsonify({"message": "CNN training started"})


@app.route("/admin/train/image", methods=["POST"])
def admin_train_image():
    return api_admin_train_image()


@app.route("/api/admin/train/video", methods=["POST"])
def api_admin_train_video():
    err = _require_admin()
    if err:
        return err

    with _training_lock:
        if _training_state["video"]["running"]:
            return jsonify({"message": "Training already running"}), 409

    t = threading.Thread(
        target=_run_training_job,
        args=("video", [sys.executable, "train_transformer.py"]),
        daemon=True
    )
    t.start()
    return jsonify({"message": "Transformer training started"})


@app.route("/admin/train/video", methods=["POST"])
def admin_train_video():
    return api_admin_train_video()


@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
def admin_delete_user(user_id):
    return _delete_admin_user(user_id)


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
def api_admin_delete_user(user_id):
    return _delete_admin_user(user_id)

# ===============================
# REGISTER ENHANCED ROUTES
# ===============================
register_enhanced_routes(app)

# ===============================
# RUN
# ===============================
if __name__ == "__main__":
    app.run(port=5000, debug=True)

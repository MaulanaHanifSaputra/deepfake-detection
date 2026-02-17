import tensorflow as tf
from tensorflow.keras.optimizers import Adam
import os

# =========================
# CONFIG
# =========================
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20
DATASET_DIR = "dataset/train"
MODEL_DIR = "model"
MODEL_PATH = "model/deepfake_model.h5"

os.makedirs(MODEL_DIR, exist_ok=True)

def train_cnn():
    print("Starting CNN Training...")

    # =========================
    # LOAD DATASET
    # =========================
    seed = 1337

    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="training",
        seed=seed,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="binary",
        shuffle=True
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="validation",
        seed=seed,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="binary",
        shuffle=True
    )

    print("Classes:", train_ds.class_names)

    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

    # =========================
    # DATA AUGMENTATION (DEEPFAKE STYLE)
    # =========================
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.2),
        tf.keras.layers.RandomContrast(0.2),
        tf.keras.layers.RandomBrightness(0.2),
    ])

    def train_map(x, y):
        x = tf.cast(x, tf.float32)
        x = data_augmentation(x, training=True)
        x = preprocess_input(x)
        return x, y

    def val_map(x, y):
        x = tf.cast(x, tf.float32)
        x = preprocess_input(x)
        return x, y

    train_ds = train_ds.map(train_map, num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.map(val_map, num_parallel_calls=tf.data.AUTOTUNE)

    train_ds = train_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)

    # =========================
    # MODEL (TRANSFER LEARNING)
    # =========================
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
        pooling="avg"
    )
    base_model.trainable = False

    # 🔥 UPGRADED CNN HEAD
    x = base_model.output
    x = tf.keras.layers.BatchNormalization()(x)

    x = tf.keras.layers.Dense(512, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.5)(x)

    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)

    x = tf.keras.layers.Dense(64, activation="relu")(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)

    model = tf.keras.Model(inputs=base_model.input, outputs=outputs)

    # =========================
    # COMPILE PHASE 1
    # =========================
    model.compile(
        optimizer=Adam(learning_rate=1e-4),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc")
        ]
    )

    model.summary()

    # =========================
    # CALLBACKS
    # =========================
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=6,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_PATH,
            monitor="val_auc",
            save_best_only=True,
            mode="max"
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.3,
            patience=3,
            min_lr=1e-6
        )
    ]

    # =========================
    # TRAIN PHASE 1 (Frozen base)
    # =========================
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks
    )

    # =========================
    # FINE TUNING 🔥
    # =========================
    print("\nStarting Fine Tuning...")
    base_model.trainable = True

    for layer in base_model.layers[:-50]:
        layer.trainable = False

    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss="binary_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
            tf.keras.metrics.AUC(name="auc")
        ]
    )

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=10,
        callbacks=callbacks
    )

    print("\n✅ TRAINING SELESAI")
    print("Model saved to:", MODEL_PATH)

if __name__ == "__main__":
    train_cnn()

import os
from typing import Optional, Tuple

import numpy as np
import tensorflow as tf


def build_tf_image_dataset(
    dataset_dir: str,
    img_size: int = 150,
    batch_size: int = 32,
    validation_split: float = 0.2,
    seed: int = 1337,
) -> Tuple[tf.data.Dataset, tf.data.Dataset, list]:
    """Create train/val datasets from a folder structure:

    dataset_dir/
      real/
      fake/
    """
    if not os.path.isdir(dataset_dir):
        raise ValueError(f"Dataset directory not found: {dataset_dir}")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir,
        labels="inferred",
        label_mode="binary",
        validation_split=validation_split,
        subset="training",
        seed=seed,
        image_size=(img_size, img_size),
        batch_size=batch_size,
        shuffle=True,
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        dataset_dir,
        labels="inferred",
        label_mode="binary",
        validation_split=validation_split,
        subset="validation",
        seed=seed,
        image_size=(img_size, img_size),
        batch_size=batch_size,
        shuffle=True,
    )

    class_names = list(train_ds.class_names)

    preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

    data_augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.05),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomContrast(0.1),
        ]
    )

    def _train_map(x, y):
        x = tf.cast(x, tf.float32)
        x = data_augmentation(x, training=True)
        x = preprocess_input(x)
        return x, y

    def _val_map(x, y):
        x = tf.cast(x, tf.float32)
        x = preprocess_input(x)
        return x, y

    train_ds = train_ds.map(_train_map, num_parallel_calls=tf.data.AUTOTUNE)
    val_ds = val_ds.map(_val_map, num_parallel_calls=tf.data.AUTOTUNE)

    train_ds = train_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=tf.data.AUTOTUNE)

    return train_ds, val_ds, class_names


def compute_class_weight(real_count: int, fake_count: int) -> Optional[dict]:
    total = int(real_count) + int(fake_count)
    if total <= 0:
        return None

    # Keep consistent with keras binary labels inferred: order depends on directory names.
    # This utility assumes you will map the weights to the correct class index.
    return {
        0: float(total) / (2.0 * float(fake_count or 1)),
        1: float(total) / (2.0 * float(real_count or 1)),
    }

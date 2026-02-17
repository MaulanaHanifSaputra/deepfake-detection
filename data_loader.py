from typing import Callable, Optional, Tuple

import numpy as np

try:
    import torch
    from torch.utils.data import DataLoader, Dataset
except Exception:  # pragma: no cover
    torch = None
    DataLoader = None
    Dataset = object

from dataset import SimpleImageDataset


class TorchImageDataset(Dataset):
    def __init__(
        self,
        dataset_dir: str,
        img_size: int = 150,
        transform: Optional[Callable[[np.ndarray], np.ndarray]] = None,
    ):
        self.base = SimpleImageDataset(dataset_dir=dataset_dir, img_size=img_size, transform=transform)

    def __len__(self):
        return len(self.base)

    def __getitem__(self, idx):
        img, label = self.base[idx]
        # Convert HWC RGB -> CHW float32
        img = img.astype(np.float32) / 255.0
        img = np.transpose(img, (2, 0, 1))
        return img, int(label)


def build_torch_dataloaders(
    dataset_dir: str,
    img_size: int = 150,
    batch_size: int = 32,
    num_workers: int = 0,
    transform: Optional[Callable[[np.ndarray], np.ndarray]] = None,
) -> Tuple["DataLoader", "DataLoader"]:
    if torch is None:
        raise RuntimeError("PyTorch is not available. Install torch to use build_torch_dataloaders().")

    ds = TorchImageDataset(dataset_dir=dataset_dir, img_size=img_size, transform=transform)

    # Simple split (80/20)
    n = len(ds)
    n_train = int(0.8 * n)
    n_val = n - n_train
    train_ds, val_ds = torch.utils.data.random_split(ds, [n_train, n_val])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    return train_loader, val_loader

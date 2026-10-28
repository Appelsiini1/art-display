#!/usr/bin/env python3
"""
Run a WD14 (SmilingWolf v3) tagger over an image tree and store raw scores in SQLite.
Resumable: images already in the DB are skipped. Re-threshold later without rerunning.

Setup (inside the container):
    pip install timm pillow huggingface_hub safetensors numpy

Usage:
    python tag_images.py /images --model wd-eva02-large-tagger-v3 --device cuda
    python tag_images.py /images --limit 100            # quick benchmark / sanity check
    python tag_images.py /images --model joytag         # JoyTag (needs Models.py next to this script)

Output DB tables:
    tags(tag_id, name, category)      category: 0 general, 4 character, 9 rating
    images(id, path, ok)              ok=0 means the file could not be read
    scores(image_id, tag_id, score)   only scores >= --min-score are stored
"""
import argparse
import os
import sqlite3
import time
import csv

import numpy as np
import timm
import torch
from huggingface_hub import hf_hub_download
from PIL import Image
from torch.utils.data import DataLoader, Dataset

Image.MAX_IMAGE_PIXELS = None
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tif", ".tiff"}


class ImgDS(Dataset):
    def __init__(self, paths, transform, size, bgr=True):
        self.paths, self.transform, self.size, self.bgr = paths, transform, size, bgr

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, i):
        try:
            img = Image.open(self.paths[i])
            img.load()
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGBA")
                bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                bg.alpha_composite(img)
                img = bg
            img = img.convert("RGB")
            w, h = img.size
            s = max(w, h)
            canvas = Image.new("RGB", (s, s), (255, 255, 255))
            canvas.paste(img, ((s - w) // 2, (s - h) // 2))
            x = self.transform(canvas)
            if self.bgr:
                x = x[[2, 1, 0]]  # WD14 models expect BGR channel order (JoyTag expects RGB)
            return i, x, True
        except Exception:
            return i, torch.zeros(3, self.size, self.size), False


def find_images(root):
    out = []
    for dp, _, files in os.walk(root):
        for f in files:
            if os.path.splitext(f)[1].lower() in EXTS:
                out.append(os.path.join(dp, f))
    out.sort()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root")
    ap.add_argument("--model", default="wd-eva02-large-tagger-v3")
    ap.add_argument("--db", default=None)
    ap.add_argument("--device", default="cuda", choices=["cuda", "cpu"])
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--min-score", type=float, default=0.05)
    ap.add_argument("--limit", type=int, default=0, help="process only N new images")
    args = ap.parse_args()

    is_joytag = args.model.lower() == "joytag"
    repo = "fancyfeast/joytag" if is_joytag else f"SmilingWolf/{args.model}"
    db_path = args.db or f"scores_{args.model}.sqlite"
    use_cuda = args.device == "cuda" and torch.cuda.is_available()
    device = torch.device("cuda" if use_cuda else "cpu")
    print(f"model={repo} device={device} db={db_path}")

    # --- model + labels ---
    if is_joytag:
        import torchvision.transforms as T
        from huggingface_hub import snapshot_download
        # Models.py wraps its attention call in sdp_kernel(...) with the plain-PyTorch "math" backend disabled.
        # On this AMD GPU the fused kernels aren't available, which leaves no backend ("No available kernel").
        # Neutralize the context manager (before importing Models) so PyTorch may pick any backend.
        import contextlib

        torch.backends.cuda.sdp_kernel = lambda *a, **k: contextlib.nullcontext()
        from Models import VisionModel  # Models.py from github.com/fpgaminer/joytag, placed next to this script

        path = snapshot_download(repo)
        model = VisionModel.load_model(path).eval().to(device)
        size = model.image_size
        transform = T.Compose(
            [
                T.Resize((size, size), interpolation=T.InterpolationMode.BICUBIC),
                T.ToTensor(),
                T.Normalize(mean=[0.48145466, 0.4578275, 0.40821073], std=[0.26862954, 0.26130258, 0.27577711]),
            ]
        )
        with open(os.path.join(path, "top_tags.txt"), encoding="utf-8") as f:
            names = [line.strip() for line in f if line.strip()]
        cats = [9 if n.startswith("rating:") else 0 for n in names]  # JoyTag has no categories; all general
    else:
        model = timm.create_model("hf_hub:" + repo).eval()
        model.load_state_dict(timm.models.load_state_dict_from_hf(repo))
        model.to(device)
        if use_cuda:
            model.half()
        cfg = timm.data.resolve_data_config(model.pretrained_cfg, model=model)
        transform = timm.data.create_transform(**cfg)
        size = cfg["input_size"][1]
        with open(hf_hub_download(repo, "selected_tags.csv"), newline="", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        names = [r["name"] for r in rows]
        cats = [int(r["category"]) for r in rows]

    # --- db ---
    db = sqlite3.connect(db_path)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS tags(tag_id INTEGER PRIMARY KEY, name TEXT, category INT);
        CREATE TABLE IF NOT EXISTS images(id INTEGER PRIMARY KEY, path TEXT UNIQUE, ok INT);
        CREATE TABLE IF NOT EXISTS scores(image_id INT, tag_id INT, score REAL);
        CREATE INDEX IF NOT EXISTS idx_scores_image ON scores(image_id);
        CREATE INDEX IF NOT EXISTS idx_scores_tag ON scores(tag_id);
        """
    )
    db.executemany(
        "INSERT OR IGNORE INTO tags VALUES (?,?,?)",
        [(i, n, c) for i, (n, c) in enumerate(zip(names, cats))],
    )
    db.commit()

    # --- work list ---
    print("scanning files...")
    all_paths = find_images(args.root)
    done = {r[0] for r in db.execute("SELECT path FROM images")}
    todo = [p for p in all_paths if p not in done]
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(all_paths)} images found, {len(done)} already done, {len(todo)} to process")
    if not todo:
        return

    loader = DataLoader(
        ImgDS(todo, transform, size, bgr=not is_joytag),
        batch_size=args.batch_size,
        num_workers=args.workers,
        shuffle=False,
    )

    t0, n = time.time(), 0
    with torch.inference_mode():
        for idxs, x, oks in loader:
            x = x.to(device)
            if is_joytag:
                with torch.autocast(device.type, dtype=torch.float16, enabled=use_cuda):
                    logits = model({"image": x})["tags"]
            else:
                if use_cuda:
                    x = x.half()
                logits = model(x)
            probs = torch.sigmoid(logits.float()).cpu().numpy()
            if n == 0:
                assert probs.shape[1] == len(names), f"model outputs {probs.shape[1]} tags but label file has {len(names)}"

            for j in range(len(idxs)):
                path = todo[int(idxs[j])]
                ok = bool(oks[j])
                cur = db.execute("INSERT INTO images(path, ok) VALUES (?,?)", (path, int(ok)))
                if ok:
                    img_id = cur.lastrowid
                    hit = np.nonzero(probs[j] >= args.min_score)[0]
                    db.executemany(
                        "INSERT INTO scores VALUES (?,?,?)",
                        [(img_id, int(t), float(probs[j][t])) for t in hit],
                    )
            db.commit()  # commit per batch, so an interruption loses at most one batch
            n += len(idxs)
            if (n // args.batch_size) % 10 == 0:
                rate = n / (time.time() - t0)
                print(f"{n}/{len(todo)}  {rate:.1f} img/s  ETA {(len(todo) - n) / rate / 60:.0f} min")

    print(f"done: {n} images in {(time.time() - t0) / 60:.1f} min")


if __name__ == "__main__":
    main()

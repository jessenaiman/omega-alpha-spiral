"""Objective pixel measurements for the three motion plates.

Not a substitute for looking at the art: reports the cheap facts that can be
measured (dimensions, distinct colour count, mean brightness, left-third
brightness, frame-to-frame difference) so claims about "low pixel depth" and
"motion between frames" are grounded in numbers.
"""
import glob
import json
import os

import numpy as np
from PIL import Image

REPO = r"C:\SpiralDrive\omega-alpha-spiral"
MOTION = os.path.join(REPO, "assets", "intro", "background-motion")

report = {}
for folder in sorted(os.listdir(MOTION)):
    d = os.path.join(MOTION, folder)
    if not os.path.isdir(d):
        continue
    files = sorted(glob.glob(os.path.join(d, "motion-*.png")))
    if not files:
        continue
    entry = []
    arrs = []
    for f in files:
        im = Image.open(f).convert("RGB")
        arr = np.asarray(im, dtype=np.uint8)
        arrs.append(arr)
        q = (arr // 8).astype(np.uint16)
        keys = q[:, :, 0] * 1024 + q[:, :, 1] * 32 + q[:, :, 2]
        distinct = int(np.unique(keys).size)
        third = arr.shape[1] // 3
        entry.append({
            "file": os.path.basename(f),
            "w": im.width,
            "h": im.height,
            "distinct_colors_32step": distinct,
            "mean_luma": round(float(arr.mean()), 2),
            "left_third_mean_luma": round(float(arr[:, :third].mean()), 2),
        })
    diffs = []
    for a, b in zip(arrs, arrs[1:]):
        diffs.append(round(float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean()), 2))
    report[folder] = {"frames": entry, "frame_to_frame_mean_abs_diff": diffs}

print(json.dumps(report, indent=2))
out = os.path.join(REPO, "scratch", "t_baa526e5", "pixel-metrics.json")
with open(out, "w", encoding="utf-8") as fh:
    json.dump(report, fh, indent=2)
print("written", out)

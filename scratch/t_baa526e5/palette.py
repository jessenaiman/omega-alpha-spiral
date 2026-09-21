"""Strict palette census: how many distinct colours survive nearest-neighbour
rounding to a coarse grid, at review scale. Answers "is style B actually low
pixel depth?" with a number instead of an impression."""
import glob
import json
import os

import numpy as np
from PIL import Image

ROOT = r"C:\SpiralDrive\omega-alpha-spiral\assets\intro\background-motion"
out = {}
for folder in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, folder)
    if not os.path.isdir(d):
        continue
    per = []
    for f in sorted(glob.glob(os.path.join(d, "motion-*.png"))):
        im = Image.open(f).convert("RGB").resize((836, 470), Image.LANCZOS)
        a = np.asarray(im, dtype=np.int16)
        row = {"file": os.path.basename(f)}
        for levels in (4, 8, 16, 32):
            step = 256 // levels
            q = np.clip((a + step // 2) // step, 0, levels - 1)
            keys = q[:, :, 0] * levels * levels + q[:, :, 1] * levels + q[:, :, 2]
            row[f"distinct_at_{levels}_levels"] = int(np.unique(keys).size)
            row[f"occupied_fraction_{levels}"] = round(
                float(np.unique(keys).size) / (levels ** 3), 4)
        # local pixel-block structure: mean absolute difference between
        # horizontally adjacent pixels (low = flat blocks, high = fine detail)
        row["adjacent_pixel_diff"] = round(
            float(np.abs(a[:, 1:] - a[:, :-1]).mean()), 3)
        row["adjacent_row_diff"] = round(
            float(np.abs(a[1:, :] - a[:-1, :]).mean()), 3)
        per.append(row)
    out[folder] = per

print(json.dumps({k: v[0] for k, v in out.items()}, indent=2))
with open(r"C:\SpiralDrive\omega-alpha-spiral\scratch\t_baa526e5\palette-metrics.json",
          "w", encoding="utf-8") as fh:
    json.dump(out, fh, indent=2)
for folder, per in out.items():
    print(folder)
    for row in per:
        print("  ", row["file"], "adjX", row["adjacent_pixel_diff"],
              "adjY", row["adjacent_row_diff"],
              "col16", row["distinct_at_16_levels"],
              "col32", row["distinct_at_32_levels"])

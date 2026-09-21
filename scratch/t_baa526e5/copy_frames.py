"""Copy the verified Codex/OpenAI image_gen outputs into the tracking repo.

Copies (never moves) the native generated PNGs read from the Codex last-message
files, names them motion-<style>-NN.png in the matching style folder, and writes
a provenance manifest with sha256 + dimensions.
"""
import hashlib
import os
import re
import shutil
import struct

REPO = r"C:\SpiralDrive\omega-alpha-spiral"
SCRATCH = os.path.join(REPO, "scratch", "t_baa526e5")
MOTION = os.path.join(REPO, "assets", "intro", "background-motion")

STYLES = {
    "a": "style-a-live-plate",
    "b": "style-b-lowtech-pixel",
    "c": "style-c-max-tech",
}
LINE = re.compile(r"^\d+\.\s*.*?([A-Za-z]:\\[^\s]+\.png)\s*[—-]")


def png_size(path):
    with open(path, "rb") as fh:
        head = fh.read(33)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG: " + path)
    w, h = struct.unpack(">II", head[16:24])
    return w, h


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    rows = []
    for style, folder in STYLES.items():
        last = os.path.join(SCRATCH, f"codex-{style}-last.txt")
        if not os.path.exists(last):
            print(f"style {style}: no last-message file, skipped")
            continue
        srcs = []
        for raw in open(last, encoding="utf-8"):
            m = LINE.match(raw.strip())
            if m:
                srcs.append(m.group(1))
        dest_dir = os.path.join(MOTION, folder)
        os.makedirs(dest_dir, exist_ok=True)
        for i, src in enumerate(srcs, 1):
            src = os.path.normpath(src)
            if not os.path.exists(src):
                print(f"style {style}: MISSING source {src}")
                continue
            w, h = png_size(src)
            dest = os.path.join(dest_dir, f"motion-{style}-{i:02d}.png")
            shutil.copy2(src, dest)
            size = os.path.getsize(dest)
            digest = sha256(dest)
            print(f"{style.upper()} frame {i:02d}: {w}x{h} {size}B {digest[:16]}")
            rows.append((style, i, w, h, size, digest, os.path.relpath(dest, REPO).replace('\\', '/'), src))
    out = os.path.join(SCRATCH, "provenance.tsv")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("style\tframe\tw\th\tbytes\tsha256\tdest\tnative_source\n")
        for r in rows:
            fh.write("\t".join(str(x) for x in r) + "\n")
    print("frames copied:", len(rows))
    print("provenance:", out)


if __name__ == "__main__":
    main()

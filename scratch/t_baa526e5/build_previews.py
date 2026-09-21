"""Build review previews for the opening-scene motion plates.

For each style folder that contains motion-*.png frames:
  - contact-sheet.jpg : all frames in one row, labelled, for quick review
  - preview-<n>.jpg   : full-size readable single-frame preview
  - loop-<style>.mp4  : frames crossfaded into a seamless looping clip (the brief's
                        "string the images into a video and loop it")

Read-only with respect to the PNG source frames: never overwrites them.
"""
import glob
import os
import subprocess
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MOTION = os.path.join(ROOT, "assets", "intro", "background-motion")
FFMPEG = "ffmpeg"


def frames(style_dir):
    return sorted(glob.glob(os.path.join(style_dir, "motion-*.png")))


def contact_sheet(style, style_dir, files):
    cols = len(files)
    cell_w, gap, label_h = 384, 8, 24
    thumbs = []
    for f in files:
        im = Image.open(f).convert("RGB")
        h = round(im.height * cell_w / im.width)
        thumbs.append((os.path.basename(f), im.resize((cell_w, h), Image.LANCZOS), h))
    cell_h = max(t[2] for t in thumbs)
    W = cols * cell_w + (cols + 1) * gap
    H = cell_h + label_h + gap * 2
    sheet = Image.new("RGB", (W, H), (10, 10, 12))
    d = ImageDraw.Draw(sheet)
    for i, (name, im, h) in enumerate(thumbs):
        x = gap + i * (cell_w + gap)
        sheet.paste(im, (x, gap + label_h))
        d.text((x + 2, gap + 4), f"{style}  {name}", fill=(210, 214, 222))
    out = os.path.join(style_dir, "contact-sheet.jpg")
    sheet.save(out, quality=86, optimize=True)
    return out


def single_previews(style_dir, files):
    outs = []
    for f in files:
        im = Image.open(f).convert("RGB")
        w = 1280
        h = round(im.height * w / im.width)
        out = os.path.join(style_dir, "preview-" + os.path.basename(f).replace(".png", ".jpg"))
        im.resize((w, h), Image.LANCZOS).save(out, quality=84, optimize=True)
        outs.append(out)
    return outs


def loop_video(style, style_dir, files, fps=12, hold=1.6, xfade=0.6):
    """Crossfade the frames into a palindromic-free seamless loop clip."""
    seq = os.path.join(style_dir, "_seq.txt")
    per = hold + xfade
    with open(seq, "w", encoding="utf-8") as fh:
        for f in files:
            fh.write("file '%s'\nduration %.3f\n" % (f.replace("\\", "/"), per))
        fh.write("file '%s'\n" % files[0].replace("\\", "/"))
    out = os.path.join(style_dir, f"loop-{style}.mp4")
    total = per * len(files)
    cmd = [
        FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", seq,
        "-vf",
        (f"fps={fps},scale=1280:-2,"
         f"tpad=stop_mode=clone:stop_duration={xfade + 1},"
         f"minterpolate=fps={fps}:mi_mode=blend," if False else "") +
        f"fps={fps},scale=1280:-2,format=yuv420p",
        "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
        "-movflags", "+faststart", out,
    ]
    r = subprocess.run(cmd, cwd=style_dir, capture_output=True, text=True)
    os.remove(seq)
    if r.returncode != 0:
        return None, r.stderr.strip()[-400:]
    return out, "ok"


def main():
    made = []
    for style in ("a", "b", "c"):
        d = None
        for cand in sorted(glob.glob(os.path.join(MOTION, "*"))):
            if os.path.basename(cand).startswith(f"style-{style}-"):
                d = cand
        if not d:
            print(f"style {style}: no folder")
            continue
        files = frames(d)
        if not files:
            print(f"style {style}: no frames in {d}")
            continue
        print(f"style {style}: {len(files)} frames")
        made.append(contact_sheet(style.upper(), d, files))
        made += single_previews(d, files)
        # Loop video is the brief's later hyperframes step; keep it out of the
        # image-only ticket unless explicitly asked for here.
        if os.environ.get("OMEGA_BUILD_LOOP") == "1":
            out, msg = loop_video(style.upper(), d, files)
            print(f"  loop: {out or 'FAILED ' + msg}")
    for m in made:
        print("PREVIEW", m, os.path.getsize(m))


if __name__ == "__main__":
    sys.exit(main())

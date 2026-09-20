#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "pillow>=10.0.0",
# ]
# ///
"""
Generate images via the free Pollinations API (no key, no cost). This is the
no-credential path for concepts, backdrops, textures and references. It cannot
edit local images; use scripts/generate_image.py (Gemini) for edits when a key
is available.

Usage:
    uv run generate_image_pollinations.py --prompt "text" --filename output.png [--width W] [--height H]
    uv run generate_image_pollinations.py probe   # prints IMAGE_PROVIDER=...
"""

import argparse
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

POLLINATIONS_BASE = "https://gen.pollinations.ai/image"      # new-gen / token-gated
POLLINATIONS_LEGACY = "https://image.pollinations.ai/prompt"  # keyless fallback
MAX_DIM = 2048  # safe cap for the free tier


def cmd_probe() -> None:
    """Print the credential contract line used by skip rules and audits."""
    token = os.environ.get("POLLINATIONS_API_KEY")
    print("IMAGE_PROVIDER=pollinations")
    print(f"POLLINATIONS_API_KEY={'SET' if token else 'MISSING'} (optional — image gen works without one)")
    print("GEMINI_API_KEY=MISSING (not required for this provider)")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "probe":
        cmd_probe()
        return

    parser = argparse.ArgumentParser(
        description="Generate images via the free Pollinations API (no key)"
    )
    parser.add_argument("--prompt", "-p", required=True, help="Image description/prompt")
    parser.add_argument("--filename", "-f", required=True, help="Output filename")
    parser.add_argument("--width", "-W", type=int, default=1024, help="Output width (max 2048)")
    parser.add_argument("--height", "-H", type=int, default=1024, help="Output height (max 2048)")
    parser.add_argument("--model", "-m", default="dreamshaper-8-lcm",
                        help="Pollinations model (default: dreamshaper-8-lcm). Honored on the "
                             "token-gated endpoint; the keyless legacy endpoint may serve its "
                             "own default regardless of this value.")
    args = parser.parse_args()

    width = min(max(64, args.width), MAX_DIM)
    height = min(max(64, args.height), MAX_DIM)

    token = os.environ.get("POLLINATIONS_API_KEY")
    if token:
        base = POLLINATIONS_BASE
        print(f"Generating via gen.pollinations.ai (token-gated, model={args.model})...")
    else:
        base = POLLINATIONS_LEGACY
        print(f"Generating via image.pollinations.ai (keyless legacy, model={args.model} best-effort)...")

    query = urllib.parse.urlencode({
        "width": width,
        "height": height,
        "nologo": "true",
        "model": args.model,
    })
    url = f"{base}/{urllib.parse.quote(args.prompt, safe='')}?{query}"

    request = urllib.request.Request(url)
    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
    except Exception as error:  # noqa: BLE001
        print(f"Error generating via pollinations: {error}", file=sys.stderr)
        sys.exit(1)

    from io import BytesIO
    import PIL.Image as PILImage

    try:
        image = PILImage.open(BytesIO(data)).convert("RGB")
    except Exception as error:  # noqa: BLE001
        print(f"Pollinations returned unreadable bytes: {error}", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    suffix = output_path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        image.save(output_path, "JPEG", quality=92)
    else:
        image.save(output_path, "PNG")
    print(f"\nImage saved: {output_path.resolve()}")


if __name__ == "__main__":
    main()
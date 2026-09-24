#!/usr/bin/env python3
"""Local 2D-reference intake and Blender GLB export. No model service or API key."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import sys

VIEWS = {"concept", "front", "back", "left", "right", "top", "bottom"}
PNG_HEADER = b"\x89PNG\r\n\x1a\n"


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def named_value(raw: str) -> tuple[str, str]:
    name, separator, value = raw.partition("=")
    if not separator or name not in VIEWS or not value:
        raise argparse.ArgumentTypeError(
            f"Expected VIEW=VALUE; VIEW is one of {', '.join(sorted(VIEWS))}"
        )
    return name, value


def png_size(path: Path) -> tuple[int, int] | None:
    if path.suffix.lower() != ".png":
        return None
    with path.open("rb") as stream:
        header = stream.read(24)
    if len(header) < 24 or header[:8] != PNG_HEADER or header[12:16] != b"IHDR":
        raise ValueError(f"Invalid PNG: {path}")
    return struct.unpack(">II", header[16:24])


def prepare(args: argparse.Namespace, parser: argparse.ArgumentParser) -> int:
    views = dict(args.view)
    crops = dict(args.crop)
    if len(views) != len(args.view):
        parser.error("Each view may appear only once")
    if len(crops) != len(args.crop) or set(crops) - set(views):
        parser.error("Each crop needs one matching view and may appear only once")

    out_dir = args.out_dir.resolve()
    manifest = out_dir / "reference-views.json"
    prepared = []
    for name, raw in views.items():
        source = Path(raw).resolve()
        if not source.is_file():
            parser.error(f"Reference image does not exist: {source}")
        crop = None
        if name in crops:
            try:
                x, y, width, height = (int(part) for part in crops[name].split(","))
            except ValueError:
                parser.error(f"Crop for {name} must be x,y,width,height")
            if min(x, y) < 0 or min(width, height) <= 0:
                parser.error(f"Crop for {name} must have positive size and nonnegative origin")
            crop = [x, y, width, height]
        target = out_dir / f"{name}{'.png' if crop else source.suffix.lower()}"
        prepared.append((name, source, target, crop))

    if not args.overwrite:
        existing = [p for p in [manifest, *(item[2] for item in prepared)] if p.exists()]
        if existing:
            parser.error(f"Output already exists: {existing[0]}; use --overwrite intentionally")

    out_dir.mkdir(parents=True, exist_ok=True)
    records = []
    for name, source, target, crop in prepared:
        if crop:
            try:
                from PIL import Image
            except ImportError:
                parser.error("Cropping needs Pillow; install it or cut the view in Affinity")
            with Image.open(source) as image:
                x, y, width, height = crop
                if x + width > image.width or y + height > image.height:
                    parser.error(f"Crop for {name} extends outside {source}")
                image.crop((x, y, x + width, y + height)).convert("RGBA").save(target)
        elif source != target.resolve():
            shutil.copy2(source, target)
        records.append({
            "view": name,
            "source": str(source),
            "file": str(target),
            "crop": crop,
            "pixels": png_size(target),
            "sha256": hash_file(target),
        })

    manifest.write_text(
        json.dumps({"asset": args.name, "purpose": "Blender reference views",
                    "approved": False, "views": records}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(manifest)
    return 0


def export(args: argparse.Namespace, parser: argparse.ArgumentParser) -> int:
    try:
        import bpy
        from mathutils import Vector
    except ImportError:
        parser.error("Export must run inside Blender: blender -b asset.blend -P this_script -- export ...")

    collections = [bpy.data.collections.get(name) for name in args.collection]
    missing = [name for name, collection in zip(args.collection, collections) if collection is None]
    if missing:
        parser.error(f"Collection does not exist in the open .blend: {', '.join(missing)}")
    objects = list({obj.name: obj for collection in collections for obj in collection.all_objects
                    if obj.type in {"MESH", "ARMATURE"}}.values())
    meshes = [obj for obj in objects if obj.type == "MESH"]
    if not meshes:
        parser.error(f"Collections have no mesh: {', '.join(args.collection)}")

    output = args.glb.resolve()
    manifest = args.manifest.resolve()
    if not args.overwrite and (output.exists() or manifest.exists()):
        parser.error("GLB or manifest already exists; use --overwrite intentionally")
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", use_selection=True)

    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    bounds = {
        "min": [min(point[index] for point in points) for index in range(3)],
        "max": [max(point[index] for point in points) for index in range(3)],
    }
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)

    report = {
        "source_blend": bpy.data.filepath,
        "collections": args.collection,
        "glb": str(output),
        "bytes": output.stat().st_size,
        "sha256": hash_file(output),
        "objects": [obj.name for obj in objects],
        "triangles": triangles,
        "materials": sorted({slot.material.name for obj in meshes
                             for slot in obj.material_slots if slot.material}),
        "bounds_m": bounds,
    }
    manifest.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(manifest)
    return 0


def main() -> int:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    prep = sub.add_parser("prepare", help="Copy or crop reference views and record provenance")
    prep.add_argument("--name", required=True)
    prep.add_argument("--view", action="append", type=named_value, required=True)
    prep.add_argument("--crop", action="append", type=named_value, default=[],
                      help="VIEW=x,y,width,height; optional and requires Pillow")
    prep.add_argument("--out-dir", type=Path, required=True)
    prep.add_argument("--overwrite", action="store_true")

    out = sub.add_parser("export", help="Export an authored Blender collection as GLB")
    out.add_argument("--collection", action="append", required=True,
                     help="Blender collection to export; repeat to combine asset parts")
    out.add_argument("--glb", type=Path, required=True)
    out.add_argument("--manifest", type=Path, required=True)
    out.add_argument("--overwrite", action="store_true")

    args = parser.parse_args(argv)
    return prepare(args, parser) if args.command == "prepare" else export(args, parser)


if __name__ == "__main__":
    raise SystemExit(main())

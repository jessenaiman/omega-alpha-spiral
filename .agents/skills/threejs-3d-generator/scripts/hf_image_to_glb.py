#!/usr/bin/env python3
"""Keyless image-to-GLB driver for public Hugging Face Spaces via gradio_client.

Argument surface mirrors scripts/threejs_3d_asset.py in this skill (subcommands,
`eprint` [category] errors, exit code 1, plain output paths on stdout), so the
surrounding 3D-asset pipeline keeps its current shape. Anonymous access only -
no HF token, no .env change.

Subcommands:
    probe --space <url>                         reachability + function list
    image --space <url> --image <file> ...      one saved GLB per invocation

Provenance line printed for each saved GLB:
    <path>	space=<space>	api_name=<fn>	model=<backend>	timestamp=<ISO-8601>	sha256=<hex>
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import os
from pathlib import Path
import shutil
import sys
from typing import Any
from urllib import error, request

try:
    from gradio_client import Client, handle_file
except ImportError as exc:
    sys.stderr.write(
        "hf_image_to_glb.py: [missing_dependency] gradio_client is required: pip install gradio_client\n"
    )
    raise SystemExit(2) from exc


class SpaceError(RuntimeError):
    def __init__(self, message: str, category: str):
        super().__init__(message)
        self.category = category


def eprint(*parts: object) -> None:
    print(*parts, file=sys.stderr)


PARAM_KEYS = ("steps", "guidance", "seed", "octree", "chunks", "target_faces", "rembg", "randomize")
COMPLETION_ROUTES = (
    "completion routes for a failing Space: "
    "1) use a working Space (frogleo/Image-to-3D for small props, tencent/Hunyuan3D-2 for quality); "
    "2) run a local backend on the GTX 1660 (modly hunyuan-mini, or TripoSR/InstantMesh <=6 GB VRAM); "
    "3) run the Space in a browser and download the GLB manually."
)


def _canonical(space: str) -> str:
    for prefix in ("https://huggingface.co/spaces/", "https://huggingface.co/sp/", "https://hf.co/spaces/"):
        if space.startswith(prefix):
            return space[len(prefix):].strip("/")
    return space


def _slug(value: str) -> str:
    keep = []
    for char in value.lower():
        keep.append(char if char.isalnum() else "-")
    name = "".join(keep).strip("-")
    while "--" in name:
        name = name.replace("--", "-")
    return name or "asset"


def _iter_strings(node: Any):
    if isinstance(node, (list, tuple)):
        if len(node) == 2 and isinstance(node[0], str) and isinstance(node[1], str):
            yield node[0]
        for item in node:
            yield from _iter_strings(item)
    elif isinstance(node, dict):
        for key, value in node.items():
            if key in {"value", "path", "name"} and isinstance(value, str):
                yield value
            elif isinstance(value, (dict, list, tuple)):
                yield from _iter_strings(value)
    elif isinstance(node, str):
        yield node


def _candidate_paths(result: Any, host: str | None = None) -> list[str]:
    seen: list[str] = []
    for candidate in _iter_strings(result):
        if candidate.startswith("http://") or candidate.startswith("https://"):
            seen.append(candidate)
        elif candidate.startswith("/") and host:
            seen.append(host.rstrip("/") + candidate)
        elif Path(candidate).is_file():
            seen.append(candidate)
    return seen


def _glb_path(result: Any, host: str | None = None) -> str | None:
    candidates = _candidate_paths(result, host)
    for candidate in candidates:
        if candidate.lower().endswith(".glb"):
            return candidate
    return candidates[0] if candidates else None


def _summarize(result: Any, host: str | None = None) -> str:
    candidates = _candidate_paths(result, host)
    if candidates:
        return "file outputs: " + ", ".join(candidates[:5])
    return repr(result)[:400]


def _static_root(client: Client) -> str | None:
    config = getattr(client, "config", None)
    root = config.get("root") if isinstance(config, dict) else None
    return root if isinstance(root, str) else None


def _hunyuan_generate(client: Client, image: str, p: dict[str, Any]) -> Any:
    shape = client.predict(
        "",
        handle_file(image),
        None, None, None, None,
        p["steps"], p["guidance"], p["seed"], p["octree"],
        p["rembg"], p["chunks"], p["randomize"],
        api_name="/shape_generation",
    )
    host = _static_root(client)
    mesh = _glb_path(shape, host)
    if not mesh or mesh.startswith(("http://", "https://")):
        raise SpaceError(f"Hunyuan /shape_generation returned no usable mesh: {_summarize(shape, host)}", "invalid_artifact")
    return client.predict(
        handle_file(mesh), handle_file(mesh), "glb", False, False, 10000,
        api_name="/on_export_click",
    )


def _frogleo_generate(client: Client, image: str, p: dict[str, Any]) -> Any:
    return client.predict(
        handle_file(image),
        p["steps"], p["guidance"], p["seed"], p["octree"], p["chunks"],
        p["target_faces"], p["randomize"],
        api_name="/gen_shape",
    )


PROFILES: dict[str, dict[str, Any]] = {
    "tencent/Hunyuan3D-2": {
        "model": "Hunyuan3D-2",
        "function": "/shape_generation",
        "generate": _hunyuan_generate,
        "defaults": {"steps": 30, "guidance": 5.0, "seed": 1234, "octree": 256, "rembg": True, "chunks": 8000, "randomize": False},
    },
    "frogleo/Image-to-3D": {
        "model": "Hunyuan3D-2 (community small export)",
        "function": "/gen_shape",
        "generate": _frogleo_generate,
        "defaults": {"steps": 5, "guidance": 5.5, "seed": 1234, "octree": 256, "chunks": 8000, "target_faces": 10000, "randomize": False},
    },
}


def _download_to(url: str, dest: Path) -> None:
    try:
        with request.urlopen(url, timeout=300) as resp:
            content = resp.read()
    except (error.URLError, OSError) as exc:
        raise SpaceError(f"cannot download remote artifact {url}: {exc}", "transient") from exc
    dest.write_bytes(content)


def _unique(path: Path) -> Path:
    if not path.exists():
        return path
    index = 1
    while True:
        candidate = path.with_name(f"{path.stem}.{index:03d}{path.suffix}")
        if not candidate.exists():
            return candidate
        index += 1


def _save(path: str, out_dir: Path, base: str) -> Path:
    ext = Path(path.split("?")[0]).suffix.lower() or ".glb"
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = _unique(out_dir / f"{base}{ext}")
    if path.startswith(("http://", "https://")):
        _download_to(path, dest)
    else:
        shutil.copyfile(Path(path), dest)
    return dest


def _merged_params(args: argparse.Namespace, profile: dict[str, Any] | None) -> dict[str, Any]:
    params: dict[str, Any] = {}
    if profile is not None:
        params.update(profile["defaults"])
    for key in PARAM_KEYS:
        value = getattr(args, key, None)
        if value is not None:
            params[key] = value
    return params


def _parse_arg_value(token: str) -> Any:
    if token.lower() in {"true", "false"}:
        return token.lower() == "true"
    try:
        return int(token)
    except ValueError:
        pass
    try:
        return float(token)
    except ValueError:
        pass
    return token


def cmd_probe(args: argparse.Namespace) -> None:
    space = _canonical(args.space)
    client = Client(space)
    functions: list[str] = []
    try:
        api = client.view_api(return_format="dict")
        endpoints = api.get("named_endpoints", {})
        if isinstance(endpoints, dict):
            functions = sorted(endpoints.keys())
    except Exception:
        functions = []
    listed = ",".join(functions) if functions else "unknown"
    print(f"space={space} state=ok functions={listed}")


def cmd_image(args: argparse.Namespace) -> None:
    space = _canonical(args.space)
    image = Path(args.image).expanduser().resolve()
    if not image.is_file():
        raise SpaceError(f"Image not found: {image}", "invalid_input")
    profile = PROFILES.get(space)
    function = ("/" + args.function.lstrip("/")) if args.function else (profile["function"] if profile else None)
    if profile is None and function is None:
        raise SpaceError(
            f"Unknown Space {space}; pass --function (and, if needed, --arg KEY=VALUE in call order)",
            "invalid_input",
        )
    params = _merged_params(args, profile)

    try:
        client = Client(space)
    except Exception as exc:
        raise SpaceError(f"cannot reach space {space}: {exc}", "space_unavailable") from exc

    try:
        if profile is not None:
            result: Any = profile["generate"](client, str(image), params)
        else:
            positional = [_parse_arg_value(token) for token in args.arg]
            if args.image not in args.arg:
                positional.insert(0, handle_file(str(image)))
            result = client.predict(*positional, api_name=function)
    except SpaceError:
        raise
    except Exception as exc:
        raise SpaceError(f"{space} {function} predict failed: {exc}", "space_error") from exc

    path = _glb_path(result, _static_root(client))
    if not path:
        raise SpaceError(f"{space} {function} returned no GLB file. {_summarize(result, _static_root(client))}", "invalid_artifact")
    out_dir = Path(args.out_dir).expanduser().resolve()
    base = f"{image.stem}-{_slug(space)}-{_slug(function)}"
    dest = _save(path, out_dir, base)
    sha = hashlib.sha256(dest.read_bytes()).hexdigest()
    model = profile["model"] if profile is not None else "unknown"
    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"{dest}\tspace={space}\tapi_name={function}\tmodel={model}\ttimestamp={ts}\tsha256={sha}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Keyless image-to-GLB from a public HF Space (gradio_client)")
    sub = parser.add_subparsers(dest="command", required=True)

    probe = sub.add_parser("probe", help="print Space reachability and function list")
    probe.add_argument("--space", required=True)
    probe.set_defaults(func=cmd_probe)

    image = sub.add_parser("image", help="image-to-GLB one Space call per invocation; saves one GLB")
    image.add_argument("--space", required=True)
    image.add_argument("--image", required=True)
    image.add_argument("--function", help="gradio api_name (e.g. gen_shape or /gen_shape); defaults from the known-Space profile")
    image.add_argument("--out-dir", default="hf-assets")
    image.add_argument("--steps", type=int, help="diffusion steps")
    image.add_argument("--guidance", type=float, help="guidance scale")
    image.add_argument("--seed", type=int)
    image.add_argument("--octree", type=int, help="octree resolution (128-512)")
    image.add_argument("--chunks", type=int, help="export chunks")
    image.add_argument("--target-faces", type=int, help="frogleo target_face_num / simplify-on-export")
    image.add_argument("--rembg", action="store_true", default=None)
    image.add_argument("--no-rembg", dest="rembg", action="store_false")
    image.add_argument("--randomize", action="store_true", default=None)
    image.add_argument("--no-randomize", dest="randomize", action="store_false")
    image.add_argument("--arg", action="append", default=[], metavar="KEY=VALUE",
                       help="positional args for unknown Spaces, in call order (repeatable; values parse as int/float/bool/str)")
    image.set_defaults(func=cmd_image)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        args.func(args)
        return 0
    except SpaceError as exc:
        eprint(f"hf_image_to_glb.py: [{exc.category}] {exc}")
        if exc.category in {"space_unavailable", "space_error", "credentials"}:
            eprint(f"hf_image_to_glb.py: {COMPLETION_ROUTES}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
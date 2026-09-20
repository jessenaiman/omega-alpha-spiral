# Probe: HF Space image-to-3D — 2026-09-19

Probe input (same for every attempt): `input-floor-one-concept-2.png`
(`assets/concepts/floor-one-concept-2.png` copy).

## Result

One Space served the route today; it produced two downloadable GLBs for the input.

| Space | State today | Deliverable | Turnaround | GLB size | License |
|---|---|---|---|---|---|
| `tencent/Hunyuan3D-2` (`/shape_generation`) | **WORKING** | `hunyuan3d-2-shape.glb` (mesh, 2.1M faces / 533K verts) | 10-13s compute | 30.6 MB | Tencent Hunyuan community license - verify before shipping |
| `tencent/Hunyuan3D-2` (`/on_export_click`) | **WORKING** | `hunyuan-export.glb` (re-export of above) | +2s | 18.3 MB | same |
| `frogleo/Image-to-3D` (`/gen_shape`, steps=5, target_face=10000) | **WORKING** | `frogleo-floor-one-concept-2.glb` (Hunyuan-base, ~10K-face export) | ~32s | **0.30 MB** | depends on underlying weights (Hunyuan community) |
| `VAST-AI/TripoSG` | Broken - `/run_segmentation` raises `RuntimeError` | none | - | - | MIT |
| `stabilityai/stable-fast-3d` | Broken - `/run_button` raises AppError (also on the Space's own example image) | none | - | - | Stability Community |
| `stabilityai/TripoSR` | Down - Space state `RUNTIME_ERROR` | none | - | - | MIT |
| `microsoft/TRELLIS` | Down - Space state `CONFIG_ERROR` | none | - | - | MIT |
| `stabilityai/stable-point-aware-3d` | Down - Space state `BUILD_ERROR` | none | - | - | Stability Community |
| `jk12p/imageto3d` | Connect OK, predict fails - Space state `CONFIG_ERROR` | none | - | - | unknown |
| `mehdizz/Image-to-3D-Object-Generator`, `themanfrom/image-to-3d`, `vaibhavpandeyvpz/trellis-image-to-3d`, `merve/daggr-image-to-3d`, `hysts-daggr/daggr-text-to-image-to-3d`, `ColinJoyLobo/image-to-3d-studio` | All down (RUNTIME/BUILD/CONFIG errors) | none | - | - | - |

## Facts established

- Anonymous `gradio_client` access works without any HF token (`Client("tencent/Hunyuan3D-2")`, `Client("frogleo/Image-to-3D")`). No `.env` change needed.
- GPU-gated ZeroGPU Spaces are NOT rejecting anonymous users as a class - Hunyuan3D-2 and frogleo both worked. The broken Spaces are broken at the app level, not auth.
- gradio_client v2 returns File outputs as dicts whose usable path is under `["value"]`.
- **Small apps can match the target footprint.** `frogleo/Image-to-3D` exports the same Hunyuan backend decimated to ~10K faces -> 304 KB GLB, BETTER than any of the big Spaces' raw output for a low-poly dungeon kit. Its `/gen_shape` also exposes `target_face_num` control directly.
- **Backend concentration caveat:** the two working Spaces are both Hunyuan3D-family hosts (Tencent's and a community wrapper). The free route is effectively a Tencent-Hunyuan single-supplier dependency today; the other providers' Spaces are all erroring.
- The real problem: **the free hosted Space tier is unreliable.** 11 of the ~13 image-to-3D Spaces probed today are erroring. Tencent's duo carries the route.

## GitHub options found (2026-09-19 web audit, not run)

| Repo | What it is | Fit for this project |
|---|---|---|
| `lightningpixel/modly` (3.9K stars) | Desktop app (Win/Linux), image-to-3D via extensible local backends | `modly-hunyuan3d-mini-extension` (fits ~6 GB VRAM class GPUs) = a real OFFLINE path on the GTX 1660 without ComfyUI; Windows installer exists |
| `srivtx/img-to-3d` | Colab (free T4) FastAPI+InstantMesh server, GLB out | Free cloud-like option outside HF; needs the notebook running |
| `halldm2000/image-to-3d` | Local multi-backend pipeline (Hunyuan/TripoSR/TripoSG/SPAR3D/TRELLIS), browser viewer | TripoSR backend is <1s at 4-6 GB VRAM - another offline candidate; heavier to set up |
| `img2threejs/img2threejs` (13K stars) | Reference image -> procedural TypeScript THREE.Group (code-only, no mesh) | Different family - no GLB, but relevant later for animation-ready low-poly props |

## Blender-native option check (2026-09-19, same session)

Question asked: can a Blender addon skip the generation step entirely? Verified landscape:

| Addon | Backend | Free? | Net effect |
|---|---|---|---|
| `VAST-AI-Research/tripo-3d-for-blender` (official Tripo plugin, v0.7.3) | Tripo cloud API key | No (API credits) | Replaces Space route AND T2 CLI if Tripo credits are accepted |
| `Tencent-Hunyuan/Hunyuan3D-2 addon` (`blender_addon.py`, 1.0) | Local FastAPI server (mini needs ~6 GB VRAM min) | Yes (server keeps model weights free) | Thin client: still requires local GPU server; on GTX 1660 (6 GB, no tensor cores) full model won't fit |
| `jfranmatheu/Hunyuan3DBlenderBridge` (Hunyuan 2.5) | Hunyuan3D API key | No | Paid key required |
| Blender built-in Voxel Remesh + Decimate | - | Yes | Nothing to do with generation, but provides the pixelated/blocky look for free post-process |

Verdict recorded for T3: the generation step cannot be skipped (credits or GPU required either way); the addons convert the pipeline into a UX layer once a paid key or a stronger local/remote GPU exists. Until then, keyless HF Spaces remain the least-infra route. Pixel-look work (voxel remesh) is already native in Blender; put it in the T3 handoff plan.

## T2 driver verification (2026-09-20, issue #30)

Driver: `.agents/skills/threejs-3d-generator/scripts/hf_image_to_glb.py` (mirrors `threejs_3d_asset.py` surface: subcommands, `[category]` stderr errors, exit 1, plain path on stdout, no token).

`t2-driver/` holds the saved GLBs:

| Invocation | Result | Size |
|---|---|---|
| `image --space frogleo/Image-to-3D --function /gen_shape` | GLB in <1 min, provenance line printed | 167,468 B (164 KB) |
| `image --space tencent/Hunyuan3D-2` (shape + export) | GLB, two-step same-arg-shape | 19,193,296 B (18.3 MB) |
| `image --space VAST-AI/TripoSG --function /image_to_3d` (generic `--arg` pass-through) | `[space_error]` anonymous ZeroGPU quota: `You have exceeded your free ZeroGPU quota (90s requested vs. 0s left)` - exact blocker message, driver prints 3 completion routes | - |
| `image --space stabilityai/stable-fast-3d --function /run_button` (generic) | `[space_error]` upstream app exception (`show_error` not enabled) - same app-level failure class as T1 | - |
| `probe` on all three + stable-fast-3d | `state=ok` + endpoint lists; works even when inference blocks | - |

Findings added by the driver work:
- ZeroGPU quota is **per-Space**, not global: TripoSG blocked anonymously (90 s burst requested, 0 s left) while Tencent + frogleo still served the same anonymous client in the same minute.
- frogleo's `/gen_shape` returns four channels today: HTML, `download` (now an **OBJ**), `glb_path` (relative `/static/.../white_mesh.glb`), `obj_path`. The GLB is only reachable by absolutizing the relative URL against `client.config["root"]`; the driver now does that and prefers `.glb`. (T1 grabbed `download`, which then served a GLB - the Space flips what `download` serves.)
- Provenance line format: `<path>\tspace=...\tapi_name=...\tmodel=...\ttimestamp=<ISO-8601>\tsha256=...`.

## Recipe that worked (Hunyuan3D-2)

```python
from gradio_client import Client, handle_file

c = Client("tencent/Hunyuan3D-2")
shape = c.predict(
    "",                              # caption
    handle_file("input.png"), None, None, None, None,   # image, multi-view
    30, 5.0, 1234, 256, True, 8000, False,  # steps, cfg, seed, octree, rembg, chunks, rnd
    api_name="/shape_generation",
)
# shape[0]["value"] -> local cached path of white_mesh.glb
glb = c.predict(
    handle_file(g), handle_file(g), "glb", False, False, 10000,
    api_name="/on_export_click",
)
# glb[1]["value"] -> local cached path of exported .glb
```

Notable: `/generation_all` on the same Space raises `NameError` (broken ignoring `shape_generation`).

## Remaining risks / notes for the verdict

- Only one provider worked today; a "free Space" dependency is a single point of failure unless we gate on Space health and route around it.
- Output is untextured white mesh (2.1M faces - very heavy for a low-poly dungeon kit). Simplify-on-export (reduce_face) untested; HLOD/decimation expected at Blender handoff (T3).
- Turnaround measured 10-13s compute (ZeroGPU). Browser queue times not measured.
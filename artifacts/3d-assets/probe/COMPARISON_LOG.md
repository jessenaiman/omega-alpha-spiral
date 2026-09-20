# Probe: HF Space image-to-3D — 2026-09-19

Probe input (same for every attempt): `input-floor-one-concept-2.png`
(`assets/concepts/floor-one-concept-2.png` copy).

## Result

One Space served the route today; it produced two downloadable GLBs for the input.

| Space | State today | Deliverable | Turnaround | GLB size | License |
|---|---|---|---|---|---|
| `tencent/Hunyuan3D-2` (`/shape_generation`) | **WORKING** | `hunyuan3d-2-shape.glb` (mesh, 2.1M faces / 533K verts) | 10-13s compute | 30.6 MB | Tencent Hunyuan community license - verify before shipping |
| `tencent/Hunyuan3D-2` (`/on_export_click`) | **WORKING** | `hunyuan-export.glb` (re-export of above) | +2s | 18.3 MB | same |
| `VAST-AI/TripoSG` | Broken - `/run_segmentation` raises `RuntimeError` | none | - | - | MIT |
| `stabilityai/stable-fast-3d` | Broken - `/run_button` raises AppError (also on the Space's own example image) | none | - | - | Stability Community |
| `stabilityai/TripoSR` | Down - Space state `RUNTIME_ERROR` | none | - | - | MIT |
| `microsoft/TRELLIS` | Down - Space state `CONFIG_ERROR` | none | - | - | MIT |
| `stabilityai/stable-point-aware-3d` | Down - Space state `BUILD_ERROR` | none | - | - | Stability Community |

## Facts established

- Anonymous `gradio_client` access works without any HF token (`Client("tencent/Hunyuan3D-2")`). No `.env` change needed.
- GPU-gated ZeroGPU Spaces are NOT rejecting anonymous users as a class - Hunyuan3D-2 is GPU-gated and worked. The broken Spaces are broken at the app level, not auth.
- gradio_client v2 returns File outputs as dicts whose usable path is under `["value"]`.
- The real problem: **the free hosted Space tier is unreliable.** 5 of 6 prominent image-to-3D Spaces are erroring today. One provider (Tencent) carries the route.

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
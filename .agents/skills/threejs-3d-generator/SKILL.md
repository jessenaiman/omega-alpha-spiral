---
name: threejs-3d-generator
description: "Build authored Blender shapes for Three.js from drawn reference views and cutouts; export GLB, then enhance materials and motion in Three.js. The local workflow needs no model API or credential probe."
---

# Three.js 3D Generator

For the current game stages: draw front/side/back/top views → cut them in Affinity or with the local script → author simple Blender shapes → export GLB → amplify them with restrained Three.js lighting and shader effects. Use an existing authored .blend or GLB when it is the right starting point. Image cutouts are guides or flat planes, not 3D geometry. Do not run a model API or credential probe for this path. Tripo remains a possible later-finale choice only after separate design approval.

The entrypoint is `scripts/blender_asset_workflow.py`: `prepare` records the 2D views and optional crops; `export` packages an authored Blender collection as GLB with an intake manifest. The older Tripo and Hugging Face scripts remain in the repository for history and are not part of this workflow.

```powershell
python .agents/skills/threejs-3d-generator/scripts/blender_asset_workflow.py prepare --name door --view concept=path/to/door.png --out-dir path/to/door-views
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background path/to/door.blend --python .agents/skills/threejs-3d-generator/scripts/blender_asset_workflow.py -- export --collection Door --glb path/to/model.glb --manifest path/to/manifest.json
```

Run these from the project root, replace the example paths and collection with the actual asset, and review the manifest plus the in-game result. Neither command calls a model service.

## References

- references/image-generator-workflows.md: clean 2D input and Blender handoff.
- references/threejs-integration.md: GLTFLoader, AnimationMixer, asset intake, collision proxies, and runtime checks.

## Inputs And Asset Plan

Read the user's approved concept, existing model, level design card, target camera, and asset role. Prepare clear reference views and transparent cutouts with Affinity or `scripts/blender_asset_workflow.py prepare`; save them under assets/concepts/. In Blender, add each view as a reference image (Add → Image → Reference) or load it through bpy. Choose scale, pivot, silhouette, material zones, and polygon budget before modeling. A 2D image is never loaded as a model or substituted for game geometry.

## Blender MCP Workflow

1. Check Blender MCP addon status and current scene before changing anything. The client BLENDER_MCP_PORT must match the live addon port; do not assume a port from an old screenshot.
2. Preserve the user's open scene. Open or save a separate asset .blend for the task; do not overwrite the source model. In MCP calls, pass the user's actual request verbatim as user_prompt.
3. Inspect the existing model and reference. Use execute_blender_code in small steps; start Python with import bpy. Prefer Blender-native mesh and material operations for local asset generation. Use shader node types rather than localized node names.
4. After each meaningful edit, get a viewport screenshot and scene info. Compare silhouette, depth, fragment gaps, and material zones with the approved reference at the game's camera scale.
5. Save the .blend and export its named asset collection with `scripts/blender_asset_workflow.py export` or Blender MCP `export_scene` to assets/models/<asset>/model.glb. GLB/PBR is the runtime format. Apply modifiers for static meshes; preserve modifiers or shape keys as needed for rigs.
6. Inspect the exported asset in Three.js, not only in Blender. Use GLTFLoader, normalize its scale and pivot, keep detailed mesh visual-only, and build simple collision proxies that match the visible footprint. Use AnimationMixer and delta seconds for authored clips.
7. Record the .blend, GLB, reference image, export settings, scene screenshot, runtime screenshot, and remaining defects.

If MCP is unavailable, use the same local Blender application and an explicit Blender Python script in the project. GUI: blender.exe <file>.blend. Headless bridge: blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py. A successful MCP connection is not proof of a good model; inspect, edit, save, export, and view the result.

## Rigging And Animation

Build or import the rig in Blender. Verify bone chains, bind pose, weights, clip names, duration, root motion, and feet/contact in an unpaused viewport. Export animation in GLB when supported; use FBX only when interchange is necessary. Keep collision and gameplay movement separate from detailed skinned meshes.

## Budget And Quality

Use a high-detail model only where the player can read it. Reuse or instance repeated block kit pieces; keep materials and texture dimensions modest for browser/mobile budgets. Check model file size, triangles, meshes, materials, textures, dimensions, pivot, and animation clips before importing. After import, inspect lighting, motion, and renderer diagnostics in active play. A generated reference or exported GLB alone does not establish final visual quality.

## Report

State what was actually modeled, the source image and .blend, exported GLB path, Blender/MCP status, Three.js file changed, visible result, and limitations. Do not report a hosted image-to-GLB driver as local: the repo's historical comparison log shows that its Hugging Face Spaces route is remote and was unreliable.

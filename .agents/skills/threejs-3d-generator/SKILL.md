---
name: threejs-3d-generator
description: "Create and refine 3D assets for Three.js with local Blender and Blender MCP, using Codex-generated reference images when useful. Export GLB/PBR models, rig and animate in Blender, and verify them in the running game."
---

# Three.js 3D Generator

The production path is Codex image reference → local Blender model → GLB/PBR export → Three.js import. Use an existing authored .blend or GLB when it is the right starting point. Do not call Tripo, Hugging Face Spaces, or other hosted 3D generation services from this skill.

## References

- references/image-generator-workflows.md: clean 2D input and Blender handoff.
- references/threejs-integration.md: GLTFLoader, AnimationMixer, asset intake, collision proxies, and runtime checks. Provider-specific notes there are historical, not instructions for this local route.

## Inputs And Asset Plan

Read the user's approved concept, existing model, level design card, target camera, and asset role. Make one clean single-object reference through the sibling threejs-image-generator skill when the existing images are crowded scene studies. Save references under assets/concepts/. Choose scale, pivot, silhouette, material zones, and polygon budget before modeling. A 2D scene image is never loaded as a model or substituted for game geometry.

## Blender MCP Workflow

1. Check Blender MCP addon status and current scene before changing anything. The client BLENDER_MCP_PORT must match the live addon port; do not assume a port from an old screenshot.
2. Preserve the user's open scene. Open or save a separate asset .blend for the task; do not overwrite the source model. In MCP calls, pass the user's actual request verbatim as user_prompt.
3. Inspect the existing model and reference. Use execute_blender_code in small steps; start Python with import bpy. Prefer Blender-native mesh and material operations for local asset generation. Use shader node types rather than localized node names.
4. After each meaningful edit, get a viewport screenshot and scene info. Compare silhouette, depth, fragment gaps, and material zones with the approved reference at the game's camera scale.
5. Save the .blend and export the selected model to assets/models/<asset>/model.glb with Blender MCP export_scene. GLB/PBR is the runtime format. Apply modifiers for static meshes; preserve modifiers or shape keys as needed for rigs.
6. Inspect the exported asset in Three.js, not only in Blender. Use GLTFLoader, normalize its scale and pivot, keep detailed mesh visual-only, and build simple collision proxies that match the visible footprint. Use AnimationMixer and delta seconds for authored clips.
7. Record the .blend, GLB, reference image, export settings, scene screenshot, runtime screenshot, and remaining defects.

If MCP is unavailable, use the same local Blender application and an explicit Blender Python script in the project. GUI: blender.exe <file>.blend. Headless bridge: blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py. A successful MCP connection is not proof of a good model; inspect, edit, save, export, and view the result.

## Rigging And Animation

Build or import the rig in Blender. Verify bone chains, bind pose, weights, clip names, duration, root motion, and feet/contact in an unpaused viewport. Export animation in GLB when supported; use FBX only when interchange is necessary. Keep collision and gameplay movement separate from detailed skinned meshes.

## Budget And Quality

Use a high-detail model only where the player can read it. Reuse or instance repeated block kit pieces; keep materials and texture dimensions modest for browser/mobile budgets. Check model file size, triangles, meshes, materials, textures, dimensions, pivot, and animation clips before importing. After import, inspect lighting, motion, and renderer diagnostics in active play. A generated reference or exported GLB alone does not establish final visual quality.

## Report

State what was actually modeled, the source image and .blend, exported GLB path, Blender/MCP status, Three.js file changed, visible result, and limitations. Do not report a hosted image-to-GLB driver as local: the repo's historical comparison log shows that its Hugging Face Spaces route is remote and was unreliable.

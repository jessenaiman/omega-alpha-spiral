---
name: threejs-image-generator
description: "Generate and edit 2D image assets for Three.js games with the Codex image tool: concepts, image-to-3D references, textures, backdrops, decals, icons, and UI art."
---

# Three.js Image Generator

The 2D layer for Three.js games: concepts, textures, decals, UI art, and the source images that feed `threejs-3d-generator` for image-to-3D.

Resolve `<this-skill-dir>` from the actual loaded skill file. Resolve sibling skills beside it first, then use the runner's discovered paths. Do not mix installed versions or assume a particular home directory.

## When to use

- Image-to-3D references: characters, creatures, buildings, ships, cars, weapons, props, pickups, terrain modules.
- Texture and material references: terrain, road, rock, sand, metal, sci-fi panels, trim sheets, decals, hazard labels, signs.
- Environment plates: skies, backdrops, city horizons, nebulas, menu backgrounds, parallax layers.
- UI art: logos, faction marks, icons, item cards, ability badges, cockpit decals, GUI panels, title art.
- Editing an existing image: style variants, cleanup, palette alignment, concept refinement.

For premium graphics work with generation in scope, generate the high-value 2D surfaces rather than defaulting to hand-coded CSS and flat colors. Respect explicitly procedural art and external-service restrictions. Choose assets from the game's design, not a fixed quota of logos, skies, or icons.

## Codex Image Generation

Use the host's `image_gen.imagegen` tool through the user's Codex session for both new images and edits. For a new image, provide a detailed prompt and omit reference-image arguments. For an edit, first view each local source image, then pass all needed paths in `referenced_image_paths`; use recent conversation images only when a source has no local path. Display the generated result to the design owner. Preserve the tool's original output and copy the selected result into `assets/concepts/`, `assets/textures/`, `assets/decals/`, or `assets/ui/` as appropriate. Record the prompt, purpose, path, and whether the image is a proposal or approved asset.

This route does not use `GEMINI_API_KEY`, Pollinations, or a provider credential probe. Use the user's approved visual references; a scene study guides composition, while image-to-3D needs a separate complete, isolated object on a plain background. Do not present a generated image as a runtime screenshot. If the Codex image tool is unavailable, report the limitation instead of silently switching providers.

## Prompt patterns

Image-to-3D reference:

> Create a clean 3D-generation reference image of [asset]. Centered single object, full object visible, plain light background, readable silhouette, clear material zones, game-ready [genre/style], no motion blur, no cropped parts, no text.

Riggable character or creature:

> Create a full-body [T-pose / A-pose / side-view creature] reference for 3D rigging: [details]. Symmetric stance, visible hands/feet/limbs, plain background, readable costume and anatomy layers, no weapon fused to hands.

Texture or material:

> Create a seamless game texture reference for [surface]. Orthographic top-down, PBR-friendly albedo, clear material variation, no perspective, no baked strong shadows, [style details].

Logo, icon, or UI art:

> Create a crisp game UI [logo/icon/badge/panel] for [faction/item/ability]. Transparent-friendly silhouette, high contrast at small size, [genre styling], no tiny unreadable text.

Sky or background:

> Create a wide game background plate of [environment]. Layered depth, readable horizon, [time/weather/style], suitable behind a real-time Three.js scene, no foreground subject.

## Vision Review

View the actual source and generated output with the host's image viewer before dependent 3D work. Compare with the approved design reference and ask the owner about material changes in art direction. A generated concept is not an acceptance gate or proof of a running game.

## Integration

Save concepts and image-to-3D sources under `assets/concepts/`; textures, decals, icons, and GUI sources under `assets/textures/`, `assets/decals/`, or `assets/ui/`. A clean image-to-3D reference guides local Blender modeling and GLB export through `threejs-3d-generator`.

Convert PNGs to runtime formats deliberately: PNG where alpha matters (UI, icons, decals), JPG/WebP/KTX2 for larger opaque textures where the pipeline supports it. Image generation is a tooling step — never called from game code. Do not load a scene-study PNG as if it were a 3D model.

Inspect the image before spending on image-to-3D or dependent variants. Check how runtime images look in the game, not just that the file was written. Preserve useful existing images when the user changes requirements, and update the project note instead of regenerating everything.

## Recovery

Preserve successful output files and the chosen prompt when generation is interrupted. If a tool call fails, check whether it produced a local file before retrying. Do not claim a concept was created, approved, or used in the game until each step is visible. Continue independent game work while only the dependent image work is blocked.

## Report

Prompt and purpose, output path, resolution, whether it was used directly, edited further, or handed to `threejs-3d-generator`, and any remaining work such as compression, UV assignment, alpha cleanup, or atlas packing.

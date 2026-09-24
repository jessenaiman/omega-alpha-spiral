# Intro asset intake — 2026-09-23

## Existing Blender work, verified through live MCP

Live scene: `C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\intro-layer-study-v02.blend`, scene `IntroLayerStudy`, 49 objects. Queried scene/path/collections without modifying the document. First call lacked required user_prompt; corrected call succeeded.

Existing runtime exports inspected through Blender Python:

| File under public/assets/intro | Bytes | Meshes | Materials | Animation |
| --- | ---: | ---: | ---: | --- |
| void-background.glb | 110532 | 2 | 2 | None |
| dreamweaver-strands.glb | 45492 | 3 | 3 | None |
| intro-door-assemble.glb | 683416 | 136 | 7 | Door_Deconstruct_Reconstruct |
| intro-portal.glb | 77804 | 35 | 7 | None |
| intro-floor-glyph.glb | 13412 | 12 | 2 | None |

`SpatialBootScene` already loads these files. The background and strands were hidden at the first path choice; restored them there. Initial recorded boot stays dark; sparse Blender stars still wait until a choice is made. Door/portal remain finale layers. Existing runtime currently animates fragment transforms itself; finding an exported animation does not mean its clip is playing.

Direct browser observation: Begin starts recorded typing, Continue reveals the first three paths and Blender floor/filaments. Door motion and complete progression still require the focused bot pass. No new 3D generation, export or paid model job was needed.

## New menu art

- Provider: native OpenAI image generation, honoring the owner's Gemini replacement instruction.
- Source/output: `assets/ui/omega-menu-plate.png`, copied into the project from the tool's generated output; original preserved.
- Purpose: opaque background plate only. Existing logo and real HTML controls are separate layers.
- Prompt: almost-black terminal material suspended in emptiness; fine straight white-blue filament on left; angular dim amber and curved crimson on right; faint phosphor/scan traces at edges and transparent-looking floor grid at bottom; central 65 percent empty; no text, buttons, logo, galaxies, doors or characters.
- Generated result visually inspected before integration. No alpha or sprite-sheet claim; no API credentials used.

## Existing image review

Luna reviewed eleven exact images and prepared `image-asset-review.html` with recommendations in `image-sprite-review.md`. Most sources are opaque compositions. Proposed sprites require isolated redraw/alpha preparation; moving player, path, door and room geometry remain Three.js/Blender. No sprites have been cut or approved by this review.

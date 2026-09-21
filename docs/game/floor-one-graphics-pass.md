# Floor 1 — authored-forms pass (threejs-aaa-graphics-builder)

## What I'm building (all procedural, no external assets)

Following "authored forms first, then materials, then lighting, then effects":

### Hero — "the Echo"
Not a box stack. A small ghost-terminal avatar:
- Tapered torso (`LatheGeometry` profile), separate named head/joints (`head`, `shoulderL/R`, `hipL/R`), a hood crest, one emissive visor strip reading the camera.
- Material roles: fabric hood (sheen), armor trim (clearcoat), emissive visor (signal only).
- Collision proxy: capsule, separate group.
- State cues: walk bob via limb pivots (procedural), sprint lean, dodge flash via rim sprite.

### Exits (3 authored forms, not recolored cubes)
- **Exit door (Light builds this floor):** double monolith frame with a glowing threshold plane; pulse syncs to the door's answer prompt on approach.
- **Fight (Ambition-aligned monster):** spectral wolf — faceted body from custom BufferGeometry (tapered hull), sensor head with a glowing eye strip, locomotion bob, attack telegraph (eye strip flares red before its lunge timer expires).
- **Secret (Shadow-aligned chest):** giggling chest with hinge geometry that actually opens on interact; emissive seam leaks from inside; contents still authored text.

### World kit
- Boundary walls as code substrate posts instead of lone corner blocks: instanced glyph panels (procedural canvas texture of scrolling 0/1/glyph rows for the code/ASCII identity), low emissive scanline on the strongest wall.
- Floor gets traffic: procedural tile decals (script chalk) near each exit, plus contact shadow discs under hero/wolf/chest.
- Fog + gradient sky dome behind the walls tuned to Light's identity color, low intensity.

### Lighting/render
- RoomEnvironment IBL + ACESFilmic tone mapping + correct sRGB output colorspace.
- Key light (cool), fill (ambient), rim spot behind hero, emissive exits as practicals.
- Cheap post: Vignette only (skip bloom for the first pass; re-add per budget).

### Layout integration
- Layout jitter (seeded) moves walls/props 1–2 tiles per run while exits keep zones. Decals follow walls.

## Constraints
- Reduced motion: no rotation/shake/roll — cuts and static displacement only.
- No canvas-inspector metrics until a playable scene — UI/HUD integration stays.
- Score after: cite `inspect-threejs-canvas` metrics; goal = every category ≥ 2.

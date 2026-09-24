---
name: threejs-image-generator
description: "Generate and edit 2D image assets for Three.js games with Google's Gemini image API: concept sheets, image-to-3D inputs, texture and material references, sky and background plates, decals, logos, icons, GUI art, title and menu art, and marketing stills. Also use for direct image editing when the user supplies an image path."
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

[add codex image gen instructions]

Keys never go in skill files, game code, or reports. Prefer the free path; switch to Gemini
only when the prompt needs editing an existing local image or the operator approves the cost.
Keys defined only in a shell profile can be absent from the process env; if the plain probe
unexpectedly prints MISSING, use `threejs-game-director/scripts/probe_asset_credentials.sh`.

## Commands

Run from the game project so output lands in it:

```bash
uv run <this-skill-dir>/scripts/generate_image_pollinations.py \
  --prompt "your image description" --filename assets/concepts/output.png --width 1536 --height 1536

# Gemini only (needs a key; required for local image editing):
uv run <this-skill-dir>/scripts/generate_image.py \
  --prompt "your image description" --filename assets/concepts/output.png --resolution 2K

uv run <this-skill-dir>/scripts/generate_image.py \
  --input-image assets/concepts/ship.png \
  --prompt "battle-worn red racing livery with clearer material zones" \
  --filename assets/concepts/ship-red-livery.png --resolution 2K
```

Resolution: Pollinations takes explicit `--width`/`--height` (cap 2048). Gemini takes
`1K` for quick concepts, icons, and draft sheets · `2K` (the default) for production references,
image-to-3D, textures, backgrounds, UI panels · `4K` for hero splash art and large sky plates.

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

## Vision review via the installed Codex CLI

When the acting agent cannot view images, inspect/review them with the installed Codex CLI
(uses the operator's existing ChatGPT subscription — no extra cost):

```bash
codex exec -C <repo> -i <image.png> -m gpt-5.6-luna -s read-only \
  -- "Return one-sentence factual observations about this image: composition, palette, readability, placeholders."
```

Treat any model output as **unverified input, not authority**: cross-check it against measured
pixel metrics (`scripts/inspect-threejs-canvas.mjs`), the code that produced the image, and a
human look before spending on generation or shipping art. A vision model's verdict is a hint,
never an acceptance gate on its own.

## Integration

Save concepts and image-to-3D sources under `assets/concepts/`; textures, decals, icons, and GUI sources under `assets/textures/`, `assets/decals/`, or `assets/ui/`. Hand image-to-3D sources to `threejs-3d-generator` by path.

Convert PNGs to runtime formats deliberately: PNG where alpha matters (UI, icons, decals), JPG/WebP/KTX2 for larger opaque textures where the pipeline supports it. The API is a tooling step — never called from game code.

Inspect the image before spending on image-to-3D or dependent variants. Check how runtime images look in the game, not just that the file was written. Preserve useful existing images when the user changes requirements, and update the project note instead of regenerating everything.

## Recovery

For coordinated games use the director's `references/asset-recovery.md`. Missing credentials or exhausted credits permit an honest local alternative; a transient error does not. Distinguish invalid input and authentication from service failures. Do not blindly retry an uncertain paid generation: preserve existing files and reconcile the provider result first. This command has no Tripo-style task resume interface. Continue independent game work while only the dependent image work is blocked.

## Report

Prompt and purpose, output path, resolution, whether it was used directly, edited further, or handed to `threejs-3d-generator`, and any remaining work such as compression, UV assignment, alpha cleanup, or atlas packing.

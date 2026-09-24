# Three.js Image Generator Pairing

Use `threejs-image-generator` for the 2D reference and this skill's Blender workflow for the 3D asset. The sibling `threejs-image-generator/SKILL.md` is the single source for Codex image generation; do not duplicate provider instructions here. A generated PNG is a concept, texture, or UI asset, not a runtime 3D model.

## 2D To 3D Reference Images

Generate clean reference images before image-to-3D for:

- Characters: full-body T-pose or A-pose, neutral expression, visible hands/feet, no cropped limbs.
- Creatures: side/front silhouettes, clear limb count, readable anatomy.
- Vehicles: front/side/three-quarter concepts, clear wheels/thrusters/wings, material zones.
- Buildings: front elevation, roof silhouette, doors/windows, scale cues.
- Weapons/tools: side view, readable handle/blade/barrel proportions, material callouts.
- Props/pickups: centered object, plain background, strong silhouette, no text baked in unless wanted.
- Terrain/world modules: tileable rocks, cliffs, rails, gates, arena pieces, modular set dressing.

For the actual prompt wording (image-to-3D reference, riggable character/creature, texture/material, logo/icon/UI, sky/background), use the templates in `threejs-image-generator`'s SKILL.md under "Prompt Patterns" — that skill is the canonical source. The notes here cover only how those references pair into the 3D pipeline.

## Texture And Material References

Use `threejs-image-generator` for:

- Terrain albedo references: rock, sand, mud, snow, moss, cracked asphalt.
- Sci-fi trim sheets, panel lines, decals, hazard stripes, window bands.
- Metal, leather, fabric, glass, ceramic, wood, painted plastic, worn armor.
- Sky, clouds, nebula, city haze, horizon plates, menu backgrounds.
- Faction marks, logos, numbers, signs, pickup icons, hazard labels.

## UI And Logo Use Cases

Use `threejs-image-generator` directly, not 3D generation, for:

- Logos and faction marks.
- HUD icons, item icons, ability icons, pickup symbols.
- Menu backgrounds and loading illustrations.
- Button/icon textures, decals, title art, achievement badges.
- 2D sky/backdrop cards when a 3D model is unnecessary.

## Image Creation And 3D Handoff

After generating a 2D reference:

1. Choose the output first: a scene study, single-object 3D reference, texture, or final 2D UI asset. A scene study is for composition review, not a direct image-to-3D input.
2. Generate or edit through the Codex image tool as specified in the sibling image skill. Show the returned image to the design owner.
3. Preserve the tool's original output and copy the chosen result into the working project: usually `assets/concepts/` for studies and model references, or `assets/textures/`, `assets/decals/`, and `assets/ui/` for runtime 2D sources. Record the prompt, purpose, and approval status.
4. Inspect the result before 3D work. For a model input, require one complete object on a simple background, readable silhouette, material zones, scale cues, and little perspective. Request a new isolated reference if the image is a crowded scene.
5. Build or adapt the model in Blender with the reference visible. Use Blender MCP to inspect, edit, screenshot, and export the selected asset as GLB/PBR. Keep repeated code blocks and collision proxies simple in Three.js.
6. Import the 3D asset using `threejs-integration.md`: `GLTFLoader`, correct scale/pivot, simple collision proxy, and an in-game visual check. Keep scene-study PNGs out of the 3D model loader; they can guide geometry, materials, and layout.

## Avoid

- Crowded scene images for single-object 3D generation.
- Cropped limbs, hidden backs, extreme perspective, motion blur, or heavy depth of field.
- Tiny UI/logo text in 3D model textures unless text fidelity is noncritical.
- Using 3D generation for pure 2D UI assets.

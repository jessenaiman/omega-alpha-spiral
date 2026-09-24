# Three.js Image Generator Pairing

Use the owner's approved drawings or `threejs-image-generator` for 2D references, then author the 3D asset in Blender. The sibling image skill owns optional Codex image generation. A PNG is a reference, texture, or UI asset, never a runtime 3D model.

## 2D To 3D Reference Images

Prepare clean front, side, back, or top views before modeling:

- Characters: full-body T-pose or A-pose, neutral expression, visible hands/feet, no cropped limbs.
- Creatures: side/front silhouettes, clear limb count, readable anatomy.
- Vehicles: front/side/three-quarter concepts, clear wheels/thrusters/wings, material zones.
- Buildings: front elevation, roof silhouette, doors/windows, scale cues.
- Weapons/tools: side view, readable handle/blade/barrel proportions, material callouts.
- Props/pickups: centered object, plain background, strong silhouette, no text baked in unless wanted.
- Terrain/world modules: tileable rocks, cliffs, rails, gates, arena pieces, modular set dressing.

When a 2D view must be created rather than drawn, use the prompt patterns in `threejs-image-generator`'s SKILL.md. Review perspective and proportions before using any view as a Blender guide.

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

After drawing or generating a 2D reference:

1. Separate scene studies from orthographic object views. Scene studies set mood; front/side/back/top views set modeling proportions.
2. Cut views in Affinity or with `scripts/blender_asset_workflow.py prepare --crop VIEW=x,y,width,height`. Keep the original art and record view names, crop bounds, and approval in its manifest.
3. Place those views as Blender reference images. Match their scale and origin, then author the mesh from simple shapes; a cutout remains flat until geometry is modeled.
4. Use Blender MCP to inspect and revise the mesh, or use the local `export` command for a named Blender collection. Export GLB/PBR and inspect it at the game's camera scale.
5. Add restrained light and shader effects in Three.js. Keep repeated code blocks and collision proxies simple.
6. Import the 3D asset using `threejs-integration.md`: `GLTFLoader`, correct scale/pivot, simple collision proxy, and an in-game visual check. Keep scene-study PNGs out of the 3D model loader; they can guide geometry, materials, and layout.

## Avoid

- Crowded scene images as proportion guides for a single object.
- Cropped limbs, hidden backs, extreme perspective, motion blur, or heavy depth of field.
- Tiny UI/logo text in 3D model textures unless text fidelity is noncritical.
- Using 3D modeling for pure 2D UI assets.

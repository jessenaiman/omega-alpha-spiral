# Blender intro runtime map

| Source/export                                                         | Runtime asset                                 | Contribution                                                                                                                                     |
| --------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `artifacts/intro-threshold/intro-portal.glb`                          | `public/assets/intro/intro-portal.glb`        | Assembled portal threshold: paired leaves, runes, rails, pillars, lintel, sill, and void backing. Mesh nodes retain descriptive `Intro_*` names. |
| `artifacts/intro-threshold/intro-floor-glyph.glb`                     | `public/assets/intro/intro-floor-glyph.glb`   | Twelve ground-plane glyph pieces: four arcs, four diamonds, and four inner marks.                                                                |
| Existing `artifacts/intro-threshold/background-void.blend` export     | `public/assets/intro/void-background.glb`     | Void floor and star field, loaded through `BlenderIntroLayers`.                                                                                  |
| Existing `artifacts/intro-threshold/dreamweaver-strands.blend` export | `public/assets/intro/dreamweaver-strands.glb` | Three filaments for Ambition, Light, and Shadow, loaded through `BlenderIntroLayers`.                                                            |
| Existing `artifacts/intro-threshold/intro-door-assemble.glb`          | `public/assets/intro/intro-door-assemble.glb` | Fragment-assembled door and threshold frame used by `SpatialBootScene`.                                                                          |

`src/intro/IntroBlenderExtras.ts` loads the new portal and glyph groups asynchronously and adds both hidden groups to the supplied scene parent. Defaults place the portal at `(0, -1.82, -6.0)` with scale `0.65`; the glyph is at `(0, -1.79, -6.22)` with the same scale, aligning its center with the portal threshold line. The caller reveals them when the distant threshold is needed.

## Blender-only studies

These `.blend` files currently have no matching runtime export in `public/assets/intro` and are treated as authoring/reference studies: `door.blend`, `intro-art-direction.blend`, `intro-layer-study.blend`, `intro-layer-study-v02.blend`, and `intro-threshold.blend`. Their `.blend1` backups are not runtime assets. The v02 slow threshold study remains a Blender source file; no runtime export for it was added here.

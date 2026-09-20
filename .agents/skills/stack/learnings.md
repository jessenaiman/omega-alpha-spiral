# stack — learnings

Dated bullets: symptom → cause → fix. Verified on the pinned Three `0.186.0`.

- **2026-09-18** — Flat neon blobs, no dimension, everything unreadable: every
  body was `MeshBasicMaterial { toneMapped: false }` on a `NoToneMapping`
  renderer. Cause: the scene predated the lighting pass. Fix: `ACESFilmicToneMapping`
  + exposure on the renderer, a procedural PMREM env (`scene.environment` from a
  tiny ambient+cool-dir scene) so MeshStandard reflects something, key/fill/rim/
  ambient rig, and per-kind MeshStandard roughness/metalness + faint emissive so
  bloom still lifts the neon identity. In the `EffectComposer` pipeline the tone
  mapping rides the final `OutputPass` — no per-pass fiddling needed.
- **2026-09-18** — Inspector entropy/edge/contrast metrics are a real signal: on
  the lighting+material pass they moved with the art direction (entropy 3.51→2.93,
  edges 0.089→0.097, contrast 96→101, dominant share 0.244→0.55 from the new
  backdrop) instead of jumping on random noise.
- **Spatial opening glyph pass** — GPU-rendered type still looked like a flat questionnaire when its XYZ displacement and plane angle were barely visible. Use shared font atlases and batched glyph quads, but judge the actual frame: stronger perspective tilt and independent depth made the words read as scene objects. Settle the geometry for the untimed reading state; keep a clipped semantic DOM mirror rather than a second visible interface.
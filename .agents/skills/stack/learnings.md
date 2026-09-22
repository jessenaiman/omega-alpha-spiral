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
- **2026-09-21 — Chronicle payoff inherited search-state perspective and became unreadable:** format depth alone is not a state model. Treat waiting and final payoff frames as settled states, explicitly zero their disorder/rotation, and hide boot-only geometry instead of assuming a later format will remain legible.
- **2026-09-21 — Colored strands were not enough to identify three continuing observers:** keep each Dreamweaver's ring/pentagon/triangle silhouette visible at the strand head. The trail communicates motion and following; the silhouette communicates identity.
- **2026-09-21 — A literal dark-particle sheet left distracting holes and unreliable text contrast:** combine one GPU dark-particle swarm with one synchronized procedural density veil. The particles make assembly, breathing and disintegration legible; the veil guarantees a coherent black event-horizon surface without hiding the moving luminous field behind it.
- **2026-09-21 — Automatic ghostwriting looked active but remained silent:** the timeline advanced before a browser gesture could resume `AudioContext`, and an 18 ms oscillator at roughly 1.2% destination gain was effectively inaudible. Hold on a cursor-only frame until input, unlock inside that gesture, then start the timeline with a mechanical noise transient plus pitched body; keep type, erase, hesitation and correction as separate event cues.
- **2026-09-21 — Chronological typography read as arbitrary scrambling:** swapping the whole ribbon to the newest font erased the history Omega was supposed to be assembling. Define each recovered display generation as data, retain its glyph silhouette beneath later generations, composite those clean era layers first, and apply displacement/dropout only afterward as shared signal damage.
- **2026-09-21 — A mathematically authored backdrop still failed the scene:** the full-screen lemniscate was visually specific but read like a logo imposed on gameplay. For the first playable scene, use a neutral celestial depth field with protected reading space; reserve Dreamweaver colors and directional geometry for calls and traversal, and defer the actual title/logo composition.
- **2026-09-21 — Intro controls contradicted controller-first discovery:** a forward-only travel clamp and permanent WASD/number legend made the scene feel like a form. Reuse the shared intent controller, pass signed Y into deterministic travel physics, and keep hints empty until the player's first actual input identifies its modality.
- **2026-09-21 — Three colored targets still felt like free-roaming UI:** visual lines alone did not create authored travel. Give each voice its own sampled 3D route, project the visual player onto the nearest lane as forward progress increases, constrain between-question travel to the committed route, place answer text on the geometry, and use a moving practical light as the call rather than an arrow or HUD prompt.
- **2026-09-21 — Distinct prose still sounded templated when every response used one typing cadence and one audit suffix:** dramaturgy belongs in time as much as wording. Type responses line-by-line with owner-specific silence, omit routine audit text at middle thresholds, let a second observer speak only at selected transitions, and spatialize each procedural voice gesture without turning it into a choice confirmation.
- **2026-09-21 — “All three followed” was textual while the visual state contradicted it:** the final frame hid the player, removed route geometry, and cut immediately to the next scene. Keep the neutral accumulated player visible at the door, converge all three authored path grammars on its crossing point, spend the particle disintegration during that movement, and delay the scene handoff until the beat lands.
- **2026-09-22 — Controller-first copy lied about the accepted button:** the hint said `A`, but normal dialogue advance consumed only the shared west-face `act` intent while south-face `dash` worked only at the final door. Treat either face intent as contextual narrative action, and reveal the label only after the player has discovered an action input.

# Intro Creative Comparison

## Baseline — `93ec56b`

- One fixed official four-question sequence.
- Stable Light / Shadow / Ambition spatial choice order.
- Rapier-driven player movement, answer sensors, travel gates, and four-stage form.
- Dreamweaver responses type in owner color beneath owner symbols.

## Loop 1 — Three.js Gameplay Systems

### Intent

Turn the dialogue into reproducible discovery without weakening the learned
spatial language of the three choices.

### Changed

- Added three seeded candidates at every threshold: the official question plus
  two role-balanced alternatives.
- Kept Light, Shadow, and Ambition in fixed slots while the authored question set
  changes by the existing core seeded RNG.
- Passed the selected opening question through Omega's failed-word ghostwriting,
  so alternate openings inherit the same chronological typing struggle.
- Re-seeding through the debug contract rebuilds both the dialogue draw and boot
  transcription, making bot and screenshot runs reproducible.
- Added one role file per Dreamweaver so later creative feedback cannot blur their
  visual or narrative responsibilities.

### Dreamweaver review

- Light: reward a defensible visible line, not moral correctness.
- Shadow: expose motive and ambiguity, not a darker synonym.
- Ambition: test direction and cost, not status or domination.
- Resolved review defects: native pre-start labels now use the seeded first
  question; a runtime invariant protects owner order; reachable legacy Shadow
  and Ambition choices were rewritten to honor their locked personas; Light no
  longer labels its path more honest or correct than the alternatives.

### Deliberate limits

- Choice order is not randomized; learning the three spatial identities matters
  more than novelty.
- No generated dialogue at runtime; every selectable line is authored and reviewable.

## Loop 2 — Three.js Game UI Designer

### Intent

Make the speaker readable from the writing itself, not only from color, and keep
the interface diegetic instead of returning to a terminal panel.

### Changed

- Light writes on an exact baseline with zero glyph drift or skew.
- Shadow writes in hard five-character segments that abruptly change X/Y/Z
  direction, preserving straight strokes rather than a smooth wave.
- Ambition bends each line into a shallow forward arc.
- Responses switch to the selected Dreamweaver's historical pixel depth and
  remain anchored beneath that Dreamweaver's symbol.
- Diegetic speaker labels now name role as well as identity:
  `LIGHT // WITNESS`, `SHADOW // VEIL`, `AMBITION // VECTOR`.
- Accessible radio values and legend now describe the actual Dreamweaver choice,
  replacing stale fantasy/romance/horror semantics.
- Touch direction buttons gain a clear pressed state while retaining the same
  movement intent path as keyboard controls.
- Resolved role-review defects: Light's response anchor no longer drifts and its
  choice plane is unrotated; Light settles while speaking; all identity labels
  now emit beneath their symbols; Shadow's glyph backing is near-black rather
  than the shared blue-gray.

### Deliberate limits

- No new DOM panel or HUD was added; the 3D writing and symbols remain primary.
- No image asset was generated because the requested identity is procedural type
  and geometry, not a flat badge.

## Loop 3 — Three.js AAA Graphics Builder

### Intent

Restore dimensional authored form without turning the opening into a neon demo or
letting particles substitute for geometry.

### Changed

- Rebuilt the particle-built black surface as an elliptical event horizon rather
  than a rectangular text panel. It accumulates across the four questions and
  disintegrates at the final door.
- Added layered depth geometry and local practical light to each Dreamweaver mark:
  blue-white prismatic recession for Light, near-black depth behind Shadow's red,
  and a subordinate violet countertone behind Ambition's yellow spiral.
- Added a neutral environment reflection so the growing player object's metal and
  roughness hierarchy read as material rather than flat gray.
- The player now retains four small answer-memory rails; each answer adds visible
  substance in the responding Dreamweaver's color without selecting one final
  Dreamweaver.
- Replaced the final player-outline crown with an unfinished open threshold and
  fixed the fourth-stage draw range so the full authored form appears.

### Budget choices

- Kept one shared symbol geometry per Dreamweaver and added only one depth echo and
  one short-range practical light each.
- Skipped fullscreen bloom/post; additive symbol halos and authored geometry carry
  the read without a mobile render-target penalty.
- Existing particle counts remain unchanged; the event horizon reuses the current
  dark field and shader rather than adding a new system.

### Dreamweaver review

- Light: replaced the curved ingress with exact linear interpolation, settled the
  mark during speech, and kept Light memory rails unrotated.
- Shadow: replaced the duplicate-line-only depth with physical dark-red box
  segments whose opacity rises when Shadow speaks; its core now has a lit PBR
  material rather than an unlit square.
- Ambition: carried the subordinate violet countertone into a minority of its
  yellow strand particles and bends its player memories progressively.
- Changed the global rim from amber to cool neutral so it cannot recolor Light;
  Ambition keeps its own local yellow practical.
- Production desktop capture exposed the Rapier target proxy as a rectangular
  answer panel. The proxy is now fully transparent; symbol glow, text lift, and
  particle response provide the interaction feedback without restoring UI frames.
- Named-state capture initially froze during the Dreamweavers' entrance. Debug
  state setup now settles only that interpolation before acknowledging the state,
  making repeated screenshots honest and deterministic without changing play.

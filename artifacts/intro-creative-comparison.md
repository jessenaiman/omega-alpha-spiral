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

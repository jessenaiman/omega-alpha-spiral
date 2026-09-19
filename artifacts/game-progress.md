# Loop Lab — progress

A learning iteration on the existing repo, beside the other pages. Crude first pass on purpose:
like Omega, iteration one is meant to read like a bash script. No Blender, no glitch reveal yet.

## Current intent

- One authored NetHack-style floor, whole thing on screen, fixed camera, 2D low-res glyph sprites.
- Clunky early-PC keyboard movement: one tile per key.
- Three ways to leave Floor 1: `$` chest (secret), `M` fight, `?` Light's question.
- A process (`O`) hunts one step per player turn. HP 6; contact costs 1.
- Deterministic: seeded RNG from `src/core/random.ts` (`?seed=`).

## Where things live

- `lab.html` — entry, terminal HUD, log, question overlay.
- `src/lab/main.ts` — the whole floor: grid, render, turns, input.
- `artifacts/loop-lab/floor-1-brief.md` — design brief, core-loop contract, level plan.
- `vite.config.ts` — `lab` rollup input added.

## Done

- Floor 1 playable: grid, process hunt, three exits, death + same-seed restart.
- **Movement fix** — the real blocker: `paint()` redrew the 2D world canvas every turn but never set
  `worldTex.needsUpdate`, so the GPU kept the first frame forever — logic moved, the screen never did.
  `src/lab/main.ts` now flags the texture and exposes `textureVersion` in `__LOOP_LAB__.getState()`;
  `tests/browser/lab.spec.ts` asserts it increments on a step (proves visible redraw, not just state).
- Guard-fight browser test was pressing the wrong key (walked off after the opening bump); it now fights
  from the tile above `M` as the design intends.
- Slice gates green: typecheck, 101 unit, 14 browser (3 lab), production build.
- **Floor 1 visual pass (AAA scorecard)**: smaller pixels (CELL 10 → 8), faint `.` substrate glyphs,
  IBM/Mac-style **side log console** in `lab.html` (`[data-lab-console]`, map left / 320px rail right,
  stacks on mobile), and a DreamShaper 8 LCM backdrop plate (`assets/textures/lab-backdrop-plate.png`,
  keyless Pollinations, logo strands, procedural strands fallback in code). Render diagnostics on
  `__THREE_GAME_DIAGNOSTICS__` (calls/triangles/geometries/textures per frame). Evidence in
  `artifacts/loop-lab/score-after-{desktop,mobile}/`.
  - Measured at play: entropy 1.63 → 2.53, color buckets 6 → 74, contrast 28 → 40.5, dominant share
    0.564 → 0.375, non-background 0 → 0.625. Renderer 2 calls / 4 tris / 2 geoms / 3 textures —
    far under the mobile budget (150/300k/200/40).
  - `ponytail:` ceilings held for higher floors: bloom/env/ACES tone mapping, higher-res plate,
    per-state VFX. One effect per floor stands.
  - Image pipeline: `threejs-image-generator` now defaults to a free keyless Pollinations script
    (`generate_image_pollinations.py`, DreamShaper 8 LCM best-effort; token-gated new-gen endpoint
    when `POLLINATIONS_API_KEY` is set), Gemini edit path untouched behind `generate_image.py`,
    plus a Codex-CLI (`gpt-5.6-luna`) vision-review step that is input, never authority.

## Next

- **Floor 2**: bigger authored grid + exactly **one** new graphical effect, then floor 3 gains another —
  each floor adds one effect and advances, building toward the end-goal glitch/asset-swap reveal.
  Floor 2's effect choice is still open (candidate: 3D extrusion/depth, line-of-sight fog, terminal flicker).
- Later: asset-swap-to-floating-code glitch reveal; Blender-authored sprites (outer loop, `rogue-progress.md`).
- README prune (ponytail + caveman).

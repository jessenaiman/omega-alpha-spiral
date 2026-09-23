# Omega Spiral — Game Director Progress

Updated: 2026-09-22

## Session rule — 2026-09-22

**Read every instruction file in full before acting.** This session an agent
skipped one line of the 86-line `threejs-game-director/SKILL.md` (the
credential-probe requirement) and repeated a **deleted** skill's asset claim
as fact. Lesson: after a governing doc is deleted or superseded, re-derive
its rulings from the live instructions — never cite the ghost.

Asset verdict, confirmed by real probe output (`probe_asset_credentials.sh`):
TRIPO/GEMINI/ELEVENLABS keys all MISSING — but these are **not blockers**:
keyless Pollinations for images, VoiceStudio for voice, procedural WebAudio
for SFX, Blender + procedural Three.js for 3D. No high-res custom art needed.

## Current intent and constraints

- Current milestone: standalone Floor One modern NetHack/Rogue demo, as defined in `project-management/STATUS.md`.
- Last integrated playable entry: the four-question Chronicle Intro leading into Chapter Two.
- Each agent task uses one GitHub issue, one branch/worktree, one issue handoff, and one pull request.
- Visual evidence is declared before capture in `artifacts/evidence.json` and checked with `npm run verify:visual`.

## Decisions

- GitHub issues own executable scope and acceptance criteria.
- `project-management/BOARD.md` owns ideas and shaping.
- `project-management/Handoffs/<issue-id>.md` owns the current task checkpoint.
- This file owns cross-task Game Director continuity; it does not accumulate completed design history.

## Completed work

- Official real-input release bot: issue 39, PR 40.
- Pre-commit formatting, typecheck, and unit gate: issue 41, PR 42.
- Generic browser assertions removed; release bot isolated: issue 43, PR 44.
- Playwright discovery locked to the skill-defined bot: issue 45, PR 46.
- Director handoff and verified named-state capture set established: issue 47 (see `project-management/Handoffs/47.md`).
- Chronicle branch (this merge): Spiral Breaker archived to `experiments/`, intro ink order corrected to logo canon, session rule recorded, branch pushed at `6062a27`.

## Pending jobs

- Issue 47 is ready for review.
- Handoff: `project-management/Handoffs/47.md`.
- Verified capture directory: `artifacts/team-foundation-20260922/`.
- Controller feel / target hold / discovery clarity / audio mix / Chapter Two handoff remain owner-gated chronicle checks.

## Remaining defects

- Floor One does not yet have its own declared visual capture set.
- Owner visual and audio approval remains a human review step.

## Next actions

1. Merge issue 47 work (this conflict resolution is part of that).
2. At the next substantial Floor One task, replace the manifest with that task's declared states before capturing.

---

# Checkpoint archive (pre-handoff chronicle history)

Preserved from the pre-handoff continuity file. Ownership of current scope
lives in the sections above; this archive is history, not a work list.

## Layered display chronology checkpoint — September 21, 2026

- [x] Replaced single-era font swapping with a six-generation display composite:
      Atari 2600, IBM PC/CGA, Commodore 64, Macintosh, Amiga, then Nintendo.
- [x] Each generation supplies its own raster density, palette, bit depth,
      scanline strength, buried-layer persistence, and native signal damage.
- [x] Recovered generations remain faintly visible beneath the current one;
      newer technology accumulates instead of erasing the older display.
- [x] Scrambling is now a downstream signal-damage pass over the composited
      historical output, not the source of the typography.
- [x] Dreamweaver breach beats are separated in time. Earlier arrivals dim into
      witnesses while the newest strand and silhouette command attention.
- [x] Superseded the full-screen lemniscate with a neutral celestial depth field;
      Dreamweaver colors now belong to their calls and paths rather than the backdrop.
- [x] Added a procedural, slowly drifting nebula plane behind the 3D star volume;
      its shader deliberately clears the central reading corridor.
- [x] Scene One now owns this celestial world. Logo/title-introduction design is
      explicitly deferred instead of being implied by the first playable scene.

## Superseded procedural lemniscate checkpoint — September 21, 2026

- [x] Removed the three optical reference plates from the intro runtime.
- [x] Replaced them with one Bernoulli lemniscate rendered as moving GPU pixels
      plus three progressively drawn lines.
- [x] Gave the strands distinct construction grammar: Light is polygonal and
      exact, Shadow introduces angular kinks, Ambition stays continuously curved.
- [x] Darkness remains the initial frame; stars begin after the player wakes the
      script, while colored strands wait for Omega's question-writing breach.
- [x] Responsive scaling keeps the equation visible on narrow viewports without
      introducing a second background implementation.
- [x] Live desktop inspection confirms the equation and pixel circulation render.
- [x] Owner review rejected the equation as the first-scene background. It remains
      historical comparison evidence only and is removed from the runtime.
- [x] Add controller-first forward/back movement and diegetic control discovery.
- [x] Make each Dreamweaver call illuminate its path toward the player.

## Scene One celestial/controller checkpoint — September 21, 2026

- [x] Removed the rejected lemniscate particles and line meshes from runtime.
- [x] Added a procedural celestial volume: neutral temperature-varied stars,
      depth-banded reveal, slow parallax orbit, and a low-opacity nebula shader.
- [x] Preserved the center as negative space for questions; the final black
      particle threshold no longer forms behind ordinary question states.
- [x] Reused the shared input-intent controller for left-stick movement and
      controller action edges instead of adding intro-only gamepad polling.
- [x] Removed the travel-only forward clamp; backward movement now reaches the
      same deterministic physics step as forward movement.
- [x] Removed always-visible control instructions. The input hint appears only
      after the player first uses keyboard, touch, or controller input.

## Authored 3D calling paths checkpoint — September 21, 2026

- [x] Replaced the shared flat guide with three separately batched 3D routes.
- [x] Light uses an exact straight rail; Shadow uses discrete hard bends with a
      black echo; Ambition uses a cubic yellow arc with a violet counter-route.
- [x] During a breach, only the arriving Dreamweaver's route draws toward the
      player and carries a moving practical light.
- [x] During questions, horizontal movement selects a route and forward/back
      motion advances or retreats along it; lane pull increases with progress.
- [x] Between questions, the player is constrained to the committed route while
      retaining signed forward/back movement.
- [x] Answer words are spatially anchored on their routes, and question states
      pull the camera back to the center before movement resumes.

## Dialogue and audio dramaturgy checkpoint — September 21, 2026

- [x] Replaced uniform response typing with owner-specific line beats: measured
      Light pauses, longer Shadow silence, and faster forward-pulling Ambition cadence.
- [x] Limited machine audit lines to the first and final thresholds instead of
      appending the same status rhythm after every answer.
- [x] Added selective second-observer interjections only after questions one and
      three; they evaluate without claiming that the player chose a Dreamweaver.
- [x] Added distinct interjection gestures and spatial left/center/right panning
      while preserving procedural, portable Web Audio synthesis.
- [x] Separated narrative status from discovered control hints; keyboard or
      controller actions appear only after that modality has actually been used.

## Embodied threshold checkpoint — September 21, 2026

- [x] Replaced the instant cut into Chapter Two with a 2.8-second authored
      crossing beat; the next scene now starts only after the crossing completes.
- [x] Kept the neutral player visible at the open threshold and moved its fully
      accumulated form through the particle surface.
- [x] Extended all three procedural path grammars from their Dreamweaver marks
      to the moving player so Light, Shadow, and Ambition visibly follow together.
- [x] Moved the black-surface disintegration onto the actual crossing instead
      of spending the effect while the final text is still being written.
- [x] Accumulated answer colors in the player's neutral core and let prior
      answers strengthen later route echoes without implying allegiance.

## Controller-first tutorial acts checkpoint — September 22, 2026

- [x] Kept the first question as pure embodied discovery: walk into the answer.
- [x] Starting with question two, arriving at a word stages it and waits for a
      deliberate action press before recording the answer.
- [x] A staged answer gains the tiny blinking era cursor and a stronger player
      pulse, so the world signals readiness without opening a control panel.
- [x] Kept action labels hidden until the player has actually pressed an action;
      movement labels likewise remain a consequence of discovered input modality.
- [x] Made the controller's south-face action advance dialogue and answer staged
      words, matching the diegetic `A` label instead of listening only to the west
      face button.
- [x] Preserved DOM, pointer, and number-key commitment as accessibility mirrors;
      controller and keyboard play retain the authored embodied route.
- [x] Question three unlocks accumulated route resonance: the echo layers now
      reveal the prior two answers while a second observer can enter the exchange.
- [x] Exposed the current `movement`, `action`, or `resonance` act through the
      existing diagnostics and root dataset for bots and visual review.

## Active checklist

- [x] Small drifting bash-loader opening with failed invocations and input-gated success.
- [x] Deep star volume and three converging color strands.
- [x] Oversized player pixel that gains authored layers after each answer.
- [x] Diegetic three-lane answer approach and real steering input.
- [x] Distinct Light, Shadow, and Ambition silhouettes and spatial writing treatments.
- [x] First-question stall that becomes the visible Dreamweaver breach.
- [x] Player-controlled passages and changing Dreamweaver layouts between questions.
- [x] Final three-strand threshold preserved.
- [x] Release evidence: build, unit checks, browser checks, real-input bot,
      production captures, renderer and Rapier diagnostics.

## Implementation boundary

- Procedural Three.js only for this iteration; no external generation job.
- Rapier owns deterministic 1/60-second kinematic movement and four sensor lanes;
  the authored visual player remains independent of its collision proxy.
- Existing accessible DOM mirror and click/number shortcuts remain available while
  arrow/WASD becomes the default spatial interaction.

---

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

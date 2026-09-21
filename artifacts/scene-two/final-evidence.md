# Scene 2 — Echo Chamber · QA evidence (run `scene-two-pass-1`)

Scope: the smallest honest `threejs-qa-release` pass for the Scene 2 first-playable
worktree (`feature/t17-echo-chamber-first-playable`). Revision under test:
`68bd0b2` + uncommitted QA edits (see "Changed paths"). Nothing was committed or pushed.

Result: **the built scene boots, renders, and resolves through real keyboard input on
both desktop and mobile, with no console, page, or network errors.** One framing defect
and two evidence-honesty corrections are recorded below.

## Commands run (exact)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0, no diagnostics |
| `npm run build` | exit 0, 58 modules, `dist/` written, `scene-two.html` emitted |
| `npm run preview` (pid 4352) | serving `http://127.0.0.1:4188` |
| `node scripts/inspect-threejs-canvas.mjs --url http://127.0.0.1:4188/scene-two.html --out artifacts/scene-two/qa --state echo-chamber --seed 42 --run-id scene-two-pass-1` | exit 0, non-blank, 0 console/page errors |
| `node scripts/inspect-threejs-canvas.mjs` (same, `--mobile`) | exit 0, non-blank, 0 console/page errors |
| `npm run test:unit` | **104 pass, 0 fail** |
| `npm run test:browser` | **12 passed** (incl. `scene-two.spec.ts`), 40.8s |
| `python3 .agents/skills/threejs-game-director/scripts/check_evidence.py . --manifest artifacts/scene-two/evidence.json --report artifacts/scene-two/final-evidence.md` | exit 0 — see below |

## Capture manifest

`artifacts/scene-two/evidence.json`, run `scene-two-pass-1`, fresh run ID and fresh
report paths (no historical report relabelled):

| mode | state | report |
|---|---|---|
| desktop | `echo-chamber` | `artifacts/scene-two/qa/desktop-echo-chamber.json` |
| mobile | `echo-chamber` | `artifacts/scene-two/qa/mobile-echo-chamber.json` |

Both reports carry `requestedState` = `appliedState` = `state` = `echo-chamber` and the
declared `runId`. The inspector's `setState` acknowledgement contract is satisfied by
`src/scene-two/main.ts` (`setState` returns `{ state: states.apply(name) }`, unknown
states throw).

### Measured canvas evidence

| | desktop (1280×720) | mobile (390×664) |
|---|---|---|
| non-blank | yes (`ok: true`) | yes (`ok: true`) |
| colour entropy | 1.19 bits | 2.14 bits |
| luminance contrast | 70.4 (mean 14.1, p95 77.2) | 100.1 (mean 21.9, p95 105.9) |
| dominant-colour share | 0.853 | 0.69 |
| edge density | 0.084 | 0.146 |
| render calls / triangles | 34 / 684 | 29 / 624 |
| within starting budget | yes (all rows) | yes (all rows) |
| GPU | real (not SwiftShader) | `ANGLE (NVIDIA GeForce GTX 1660, D3D11)`, `softwareRendered: false` |

FPS was not claimed: headless desktop-GPU timing is not phone evidence and this pass did
not need it.

## Browser journey (existing suite, extended — not a new one)

`tests/browser/scene-two.spec.ts` drives real keyboard input (`ArrowRight/Left/Down`),
asserts each press settles the hero (`data-arrived` false → true), lands the outcome at
tile `(0,2)` = `monster` / `encounter`, checks diagnostics `checkpoint` and empty
`errors`, exercises restart, re-enters `echo-chamber` through the state hook, proves
reduced-motion hook, canvas focus, and a 390×664 layout fit. It writes
`artifacts/scene-two/first-playable-state.json` and `first-playable.png` (declared in the
manifest). Journey result this run: **8 real inputs, outcome on input 8.**

## Corrections made in this pass (evidence honesty)

1. **Removed fabricated journey metrics.** The spec previously wrote
   `distanceTravelled: inputsAttempted` (an alias, never measured) and
   `softlockWindows: 0` (hardcoded). Both are gone. The artifact now carries only what
   the journey actually measures: `inputsAttempted` and `firstOutcomeStep`.
   The per-input `data-arrived` false→true assertions are the real softlock evidence —
   a press that moved nothing would fail the loop instead of reporting a zero.
2. **Removed the fabricated bot playtest.** A second JSON report (written by the spec, and
   duplicated under the QA directory) claimed bot metrics that no bot produced. Both
   deleted — the paths are gone on purpose and are not cited here.
   **Bot playtest decision: skipped** — Scene
   2 exposes no player position or frame counter in diagnostics, so `distanceTravelled`,
   `framesAdvanced` and `softlockWindows` cannot be measured honestly here, and the
   scenarios in `references/playtest-bot.md` (fail/retry, difficulty tiers) do not exist
   in this scene. Revisit if diagnostics gain a position field.
3. **Visual baseline harness decision: deferred** — this scene is a 4×4 grid with three
   authored outcomes; a baseline would protect little and the inspector already proves
   non-blank pixels. Say the word if the chamber becomes a signature state.

## Defects

**D1 — mobile framing crops the chamber (open, needs the design owner).** At 390×664 the
`resize()` handler changes only `camera.aspect`; vertical FOV is fixed at 44°, so the
horizontal field narrows in proportion to aspect (1.78 → 0.59). At the start view on
mobile the hero avatar is **off-screen** and the door/portal is clipped at the right
edge. Measured from the desktop capture: hero at horizontal NDC ≈ −0.40, which maps to
≈ −1.21 on mobile — outside the frustum. The chamber therefore opens on mobile without
the player's own figure in view. Camera framing is creative territory; **not changed
here.** Options for the director: widen FOV on narrow viewports, dolly the camera back
on aspect change, or re-frame per breakpoint.

**D2 — monster reads flat in the frozen capture (cosmetic, informational).** In the
captures the magenta `CHOICE_Monster` presents as a flat polygon because the named
capture runs under the inspector's `setReducedMotion(true)`, which also freezes the
monster's idle rotation. Non-blocking; noted so nobody reads the stills as a modelling
fault.

**D3 — mobile object index collapses to letters only (informational).** The
`max-width: 700px` rule hides the door/monster/chest labels, leaving `D`/`M`/`C`.
Meaning is still carried by the letter and the list order, so this is not a
colour-alone violation; flagged only because it is a legibility judgement for the design
owner.

## Not done, deliberately

No second browser suite, no broad docs, no visual-baseline infrastructure, no
speculative gameplay states (no fail state, no second era, no combat), no final-game
assertions, no creative-canon edits, no commit, no push.

## Changed paths

| Path | Change |
|---|---|
| `tests/browser/scene-two.spec.ts` | journey metrics corrected to measured values; fabricated bot-playtest write removed |
| `artifacts/scene-two/first-playable-state.json` | regenerated by the journey with corrected `journey` block |
| `artifacts/scene-two/first-playable.png` | regenerated by the journey |
| `artifacts/scene-two/evidence.json` | **new** — run manifest |
| `artifacts/scene-two/qa/` | **new** — two inspector reports + two captures |
| `src/core/acceptance.ts`, `src/scene-two/main.ts` | pre-existing uncommitted work in this worktree (state-hook acknowledgement contract); untouched by this pass except as noted above |
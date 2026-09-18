# Spiral Breaker — final evidence

Run ID: **pass-3** (QA release pass) · Captured with the shared canvas inspector
against the dev server (`http://127.0.0.1:5188/spiral-breaker.html`), real GPU
(NVIDIA GTX 1660, `softwareRendered: false`). Manifest: `artifacts/evidence.json`.

## What shipped

**Spiral Breaker** — a one-stick spiral-arena arcade game, built beside the Ghost
Terminal scene on its own page so neither boot path can break the other.

- Steer the core with WASD / arrows / left stick; **dash** (Space / south) through
  inbound shards to destroy them. Dash-contact kills; a non-dash graze knocks you
  back. A shard that reaches the core costs integrity (3, then the run ends).
- **Shard kinds** give every wave a read: **splitters** crack into two fast minis,
  **hearts** heal a pip (and pay bonus points at full integrity) but breach like a
  shard, **shielded** shards deflect frontal dashes so you must flank them. Minis
  pop in freshly hatched (brief grace, then deadly fast).
- **Wave-6 gauntlet**: six waves, the last stops raining shards so the field can
  actually drain. Clear it and the integrity bonus banks a **victory** (restart
  dash-to-run again).
- The **ghost** plays the menu demo and takes the wheel after 4s of no input. It
  flanks shielded cones, targets hearts while hurt, cracks splitters at depth, and
  clears the gauntlet for the three watchable seeds (`spiral-42`, `42`,
  `watchable`) in simulation.

## Verification (commands run, real output)

| Check | Command | Result |
| --- | --- | --- |
| Types | `npm run typecheck` | clean |
| Unit | `npm run test:unit` | 96 pass, 0 fail (+11 pulsar tests) |
| Browser | `npm run test:browser` | 10 pass, 0 fail (+feed banner test) |
| Build (MPA) | `npm run build` | `dist/index.html` + `dist/spiral-breaker.html` built |
| Evidence | `check_evidence.py . --manifest artifacts/evidence.json` | 16 artifacts confirmed |
| Preview | built `dist/` served via `vite preview` (4188), both pages + live state | no console/page/network errors |

The unit suite covers rules determinism, dash/graze/breach/chain, splitter cap and
mini cracking, heart heal/bonus/breach, the shielded cone (flank beats frontal),
the autopilot's flank and heart targeting, the gauntlet (bonus, rollover, spawn
stop, restart), the ghost clearing the gauntlet for all three watchable seeds, and
the repo's `Math.random` guard. The **bot playtest** (`tests/unit/bot-playtest.test.ts`)
drives the rules with the ghost and with a reckless input driver and writes
`artifacts/qa/bot-playtest.json`:
ghost clears every seed at step 5400 with zero softlock windows and first score at
step 22; a reckless driver dies on 12 softlock windows, proving the pressure is
real; the game-over retry hands back a live run with restored integrity.

The browser suite adds a QA release spec (`tests/browser/qa-release.spec.ts`):
both pages and every capture state run free of console, page, and **network**
errors; real keyboard input takes control from the ghost and a failed run restarts
on a real start input; the HUD and overlays fit desktop (1280×720) and mobile
(390×664) viewports; the mute button toggles the procedural-audio master with no
errors. A new transient-feed test starts a run through real menu input (the only
path that emits `wave.start` on step 1 — `startActivePlay`'s warm-up calls
`resetForRun` directly and discards its events) and proves the feed banner shows
and hides.

## Slice A — game feel pass

Play now has moment-to-moment feel it previously lacked entirely. Rules stay
pure deterministic fixed-step; the feel layer sits in the host/presentation only.
pure deterministic fixed-step; the feel layer sits in the host/presentation only.

- **Hitstop** (`src/arcade/present/feel.ts`): the render delta is scaled by
  `feel.timeScale` (0.05 while frozen, capped 140ms) and audio ducks to 0.6 via
  `sfx.setDuck`. Map: destroy 35 / splitter 45 / shielded 55 / mini 30 / heart 20,
  blocked 45, core.heal 20, knockback 60, breach 90.
- **Squash & stretch** (`present/tween.ts`): a tween manager with
  easeInQuad/easeOutCubic/easeOutBack drives dash overshoot and destroy pop;
  knocked shards stay state-driven at 0.8; a red knock flash tints the hurt core.
- **Camera**: a small roll kick after `lookAt`, gated by reduced motion; exp
  field-of-view recovery decays smoothly.
- **VFX**: exponential decay on sparks/rings, a shielded "flare" and a gold
  victory flash.
- **Sound**: per-kind ±6% pitch variance (`sfx.vary`).
- **HUD**: `Element.animate` punches on score/heal/breach + a transient
  `[data-hud-feed]` message line — the level plan's missing "wave banner" —
  showing "WAVE 2" / "FINAL WAVE", "BLOCKED — FLANK IT", "+1 INTEGRITY".
- New checks: `tests/unit/spiral-breaker-feel.test.ts` (9 tests: hitstop map,
  reset, duels, tween lifecycle) and the feed browser test. Two test-side bugs
  (off-by-one tween index; wrong easing argument) were caught by the suite and
  fixed, and the feed spec's first form was flaky for a real reason — fixed by
  driving it via real input.

## Slice B — the pulsar

A seventh shard kind, chosen from the brainstorm (bounded → "Pulsar") and gated
on an approved short design. A **rhythm hazard, not a damage bomb**: exactly one
kind of pressure, expressed through the mechanic players already own.

- **Rules** (`rules.ts`, pure deterministic): a pulsar is a dashable shard
  carrying a 360° pulse ring on a fixed-step cooldown (1.5s). Anyone inside its
  reach (`pulseMaxRadius` 0.5) when the ring fires gets shoves outward —
  knockback + brief stun only, **no integrity loss, no splits**. A
  `pulseGraceSec` (0.22) window swallows follow-up bites, so never a stunlock
  chain. Contact resolution runs before `firePulses`, so **a dash that connects
  in the exact step the pulse expires wins** — dashing a pulsar is the counter,
  exactly like every other shard. Pulsars spawn from wave 3, max one on screen,
  low weight, excluded from drifters, standard points; a spawned pulsar's first
  ring is staggered 0.6–1.0× the cooldown so hazards never pulse in lockstep.
- **Ghost** (`autopilot.ts`): when a pulsar is charging and out of dash reach,
  the ghost holds at `standoffPoint` (just outside `pulseMaxRadius × 1.25`) and
  waits out the ring; a reachable or released pulsar is dashed like any shard. The
  bot-ghost gauntlet test feeds a fresh pulsar on a cadence and the ghost still
  clears the run.
- **Presentation**: a periwinkle icosahedron (`actors.ts`) with a charging ring
  that tightens and brightens as the pulse nears (reduced-motion shows it frozen
  mid-charge); the fired ring expands to the pulse's reach in `vfx.ts`; a rising
  whoop sweeps the same 360° in `sfx.ts`.
- **Bugs caught by verification, both honest**: `updateShards` counted down only
  while `pulseTimer >= ...` — a pulsar placed exactly at zero never fired (the
  0.6–1.0× spawn stagger hid it). The guard now fires any non-positive timer on
  the next step. And the first spawn-gating test sat an idle board into
  `maxShardsOnScreen` before wave 3, so no pulsar could hatch; the gating test
  now floods a cleared board at forced waves and the gauntlet test injects
  pulsars directly.
- New checks: `tests/unit/spiral-breaker-pulsar.test.ts` (11 tests: pulse timer
  countdown/reset, exactly-once per cooldown cycle, bite knockback, outside-
  reach immunity, grace window, dash beats pulse, same-step dash beats pulse,
  core breach, spawn gating, ghost standoff/strike ×3, gauntlet-with-pulsars).

## Captures

| State | Desktop | Mobile |
| --- | --- | --- |
| active-play | [png](<artifacts/pass-3/desktop-active-play.png>) · [json](artifacts/pass-3/desktop-active-play.json) | [png](<artifacts/pass-3/mobile-active-play.png>) · [json](artifacts/pass-3/mobile-active-play.json) |
| game-over | [png](<artifacts/pass-3/desktop-game-over.png>) · [json](artifacts/pass-3/desktop-game-over.json) | — |
| menu | [png](<artifacts/pass-3/desktop-menu.png>) · [json](artifacts/pass-3/desktop-menu.json) | — |
| victory | [png](<artifacts/pass-3/desktop-victory.png>) · [json](artifacts/pass-3/desktop-victory.json) | — |

All captures: `result.ok: true`, no console or page errors. **Renderer budgets are
real scene cost**, not post-processing leftovers — see the QA finding below. Live
active play measures 9-16 draw calls and ~4-5k triangles (limits 300 / 750k), and
the frozen captures agree (10 calls / 4,314 triangles). The victory capture's
diagnostics report `phase: "victory"` with the objective "Gauntlet cleared — dash
to run again". The mobile capture is the 390×664 viewport and stays non-blank
(`colorEntropyBits` 4.68).

## QA finding fixed this pass

`renderer.info.render` is reset at the start of **every** `renderer.render()`
call, and this game renders through an `EffectComposer` — so reading it after the
frame ever saw only the last pass (the OutputPass's single fullscreen triangle):
`calls: 1, triangles: 1` regardless of gameplay. The renderer now inserts a probe
pass between the `RenderPass` and the bloom pass (`src/arcade/present/renderer.ts`)
that snapshots the scene draw first, so the reported budget is the scene's true
cost. The budget was never actually at risk (≈10 calls vs a 300 limit), it was the
metric that was lying.

## Acceptance surfaces

`window.__THREE_GAME_TEST_HOOKS__` — `seed`, `setState` (`menu` / `active-play` /
`game-over` / `victory`, unknown states throw, ack is `{ state }`),
`setPausedForScreenshot` (stops simulation, keeps rendering),
`setReducedMotion`, `setDebugHidden` and the inspector's `hideDebugUi`.
`window.__THREE_GAME_DIAGNOSTICS__` is published live with phase, playerState,
objective, canvas, renderer, accessibility, and errors.

## Visual harness decision

**Skipped** (screenshot-baseline visual regression). This is a deterministic,
seeded procedural scene; the inspector's pixel metrics (color entropy, edge
density, dominant-color share) plus the console/page/network and state specs
already trip on a blank or mis-rendered frame. A pixel-diff harness would mostly
re-assert the same determinism and is not worth its maintenance here.

## Known limits / follow-ups

- Balance is tuned by simulation, not human play. The ghost clears a watched run
  for the watchable seeds; a human run will end when reaction time fails.
  Difficulty knobs live in `src/arcade/game/tuning.ts`.
- No touch controls (desktop keyboard/gamepad by design for this slice); on
  mobile the game is watchable, and the HUD fits the 390×664 safe area.
- Audio is fully procedural (no decode assets to error) and unlocks on the first
  gesture; captures are silent.
- The Ghost Terminal scene is untouched; `tests/browser/boot.spec.ts` still passes.
- Post-release enhancement roadmap (approved order, each slice its own
  brainstorm + design gate + commit): **C** boss encounter → **D** upgrade
  economy → **E** meta persistence. Touch/accessibility explicitly out of scope
  for these slices.
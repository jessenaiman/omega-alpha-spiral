# Spiral Breaker — build progress

A narrative of how the slice came together, for the next session.

## Concept

Chosen from the director skill's routing: **Spiral Breaker**, a one-stick
spiral-arena arcade game with dash-mechanics and a deterministic ghost. Selected
for the smallest loop that still teaches the stack end to end — deterministic
fixed-step rules, input intents, a procedural scene, a bloom pipeline, a DOM HUD,
procedural audio, and the project's acceptance surfaces — without needing any
external assets.

## Order of work

1. **Skills + design.** Loaded the threejs-* production skills; wrote
   `artifacts/design-brief.md`, `artifacts/core-loop-contract.md`, and
   `artifacts/level-encounter-plan.md`. Captured the initiative in Hindsight
   (`kp-291e65679a7340f1ab85d7f4aedfffe1`).
2. **Pure rules first.** `src/arcade/game/tuning.ts`, `rules.ts`, `autopilot.ts`,
   `index.ts`, then `tests/unit/spiral-breaker-rules.test.ts`. Rules carry no DOM,
   no clock, no unseeded randomness, so 20+ tests run in milliseconds.
3. **Host.** `src/arcade/host.ts` owns the fixed loop, input, settings,
   diagnostics, and the named capture states. Two bugs caught here and fixed:
   the ghost must steer whenever there is no human input (or the idle clock never
   runs), and the published diagnostics snapshot must refresh when state changes.
4. **Presentation.** `present/renderer.ts` (bloom pipeline), `scale.ts`, `arena.ts`
   (spiral shader + core), `actors.ts` (pooled player/shards), `vfx.ts` (pooled
   sparks and shockwave rings, trauma, FOV punch), `camera.ts`, `ui/hud.ts`,
   `audio/sfx.ts`.
5. **Shell.** `spiral-breaker.html`, `src/arcade/styles.css`, `src/arcade/main.ts`,
   and the second MPA entry in `vite.config.ts`.
6. **Prove it.** Browser spec, then evidence captured through the shared
   inspector at desktop and mobile; `artifacts/evidence.json` + `final-evidence.md`
   (pass-1: 4 states).
7. **Goals + encounters.** Shard kinds (splitter/heart/mini/shielded), armoring the
   ghost to clear them, a wave-6 gauntlet with a victory bonus, and presentation
   for each kind (geometry/materials in `actors.ts`, `vfx.ts`, `sfx.ts`, `hud.ts`).
   Two design bugs found by trace and fixed in `rules.ts`: fresh minis escaped
   forever because rotating their *bearing* missed the small core (they now spawn
   position-scattered around the parent and re-aim dead at the core), and the
   shielded block test used the post-move position so flank dashes were rejected
   (it now uses the pre-move approach point, captured before `updatePlayer`). Tuning
   then driven to make all three watchable seeds win the gauntlet in simulation.
8. **Re-prove.** Extended unit tests (75) and the browser two-phase check,
   then evidence pass-2: 5 states including **victory**, re-run the build, and
   `check_evidence.py --manifest`.
9. **QA release pass.** Loaded `threejs-qa-release`; added
   `tests/browser/qa-release.spec.ts` (console/page/**network** errors across
   both pages and all states, real keyboard input taking the wheel from the
   ghost, browser-level fail→retry, HUD fit on desktop + mobile, mute/unlock)
   and `tests/unit/bot-playtest.test.ts`, which drives the rules with the ghost
   and a reckless driver and writes `artifacts/qa/bot-playtest.json` (ghost
   clears all three seeds, zero softlocks; reckless dies — real pressure; retry
   restores play). **QA caught a lying metric**: the game renders through an
   `EffectComposer`, and three.js resets `renderer.info.render` per pass, so the
   reported budget was always "1 call / 1 triangle" (the OutputPass). A probe
   pass between RenderPass and bloom in `present/renderer.ts` now records the
   scene's true cost (9-16 calls, ~4-5k triangles live). Re-captured evidence as
pass-3, verified the production build on `vite preview` (both pages, no
    errors), and shipped.
10. **Slice A — feel pass (this slice).** Upgrading the moment-to-moment game feel
    toward "tasteful AAA": the game had **no hitstop** at all, so the core spend
    that pass was a host/presentation hitstop layer — rules stay pure
    deterministic fixed-step, `main.ts` scales the render delta by
    `feel.timeScale` (0.05 while frozen, capped 140ms) and ducks audio to 0.6 via
    `sfx.setDuck`. Per-event hitstop: destroy 35 / splitter 45 / shielded 55 /
    mini 30 / heart 20, blocked 45, core.heal 20, knockback 60, breach 90. Around
    it: squash-and-stretch on dash/destroy via a new `present/tween.ts` tween
    manager (dash is now a tween-owned overshoot instead of an instant scale,
    knocked shards stay state-driven at 0.8), a red knock flash tint, camera roll
    (reduced-motion gated), exponential decaying exp/fov recovery, shielded and
    victory flashes, ±6% sfx pitch variance per kind, HUD punches on
    score/heal/breach via the `Element.animate` WAAPI, and a transient
    `[data-hud-feed]` message line that completes the level plan's missing "wave
    banner" landmark ("WAVE 2", "FINAL WAVE", "BLOCKED — FLANK IT", "+1
    INTEGRITY"). **Two bugs found by verification**: the unit feel test had an
    off-by-one tween-index and a wrong easing argument (test-side, fixed), and a
    new browser assertion initially failed because `startActivePlay` calls
    `resetForRun` directly, discarding the first `wave.start` event — the feed
    test now starts via real Space input from the menu (the actual player path,
    which emits `wave.start` on step 1). New unit file
    `tests/unit/spiral-breaker-feel.test.ts` (9 tests) covers hitstop map,
    reset, and tween lifecycle.

## Verification

`npm run typecheck`, `npm run test:unit` (85 pass), `npm run test:browser`
(10 pass), `npm run build`, and the production preview check (both pages, game
starts from menu input, zero console/page/network errors) all pass. See
`artifacts/final-evidence.md`.

## Where things live

- Rules and tuning: `src/arcade/game/` (kind behavior, approach-based shield block,
  wave-6 gauntlet, ghost policy all live here)
- Runtime host and acceptance surfaces: `src/arcade/host.ts` (`presentVictory`
  named state steps the ghost to a real victory and throws if it cannot)
- Visuals: `src/arcade/present/`, HUD: `src/arcade/ui/hud.ts`, sound:
  `src/arcade/audio/sfx.ts`
- Entry: `spiral-breaker.html` → `src/arcade/main.ts`
- Tests: `tests/unit/spiral-breaker-rules.test.ts`,
  `tests/unit/bot-playtest.test.ts`, `tests/unit/spiral-breaker-feel.test.ts`,
  `tests/browser/spiral-breaker.spec.ts`, `tests/browser/qa-release.spec.ts`
- Feel layer: `src/arcade/present/feel.ts` (hitstop), `src/arcade/present/tween.ts`
  (squash/stretch/dash overshoot), plus `camera.ts` roll, `sfx.ts` setDuck/vary,
  `hud.ts` notify/feed/punches, `main.ts` wiring, `spiral-breaker.html` +
  `styles.css` feed/flash elements
- Evidence: `artifacts/pass-3/` (captures), `artifacts/qa/bot-playtest.json`,
  `artifacts/evidence.json`, `artifacts/final-evidence.md`

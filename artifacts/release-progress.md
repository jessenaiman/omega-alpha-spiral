# Cumulative release QA checkpoint

## Release 2 is not yet ready

Scope: Ghost Terminal plus Town Map. Keep releases cumulative; stages 3–6 follow only after delivery of this slice.

## Current evidence

- `npm run test:unit`: 29 tests passed (core state, lineage, input mapping, loop scheduling, terminal, exploration model).
- `npm run build`: passed; Vite production JS 574.13 kB, gzip 145.93 kB; CSS 6.32 kB. Build includes incomplete map integration and is not a release approval.
- `npx playwright test --config playwright.release.config.ts tests/browser/lifecycle.spec.ts tests/browser/terminal-layout.spec.ts tests/browser/ghost-terminal.spec.ts`: 4 tests passed against production preview on 4188.
- Persisted-page lifecycle regression observed RED (0 choices instead of 3), then GREEN after preserving subscribers/resources for persisted pagehide.
- Maximum-name layout regression observed RED, then GREEN after applying wrapping to completion identity text. 390×844 viewport; desktop-first gameplay, no mobile-controls claim.
- Earlier real terminal-to-map browser test failed: HUD constructed but count/target empty; no successful map gameplay release claim yet.

## Latest round: map now renders; short key press regression found

- Captain added a production-preview whole-town bot (`tests/browser/map-progression.spec.ts`) using real keyboard inputs and debug-gated read-only positions, not state teleportation. It will record frame/objective/renderer metrics only after reaching all three landmarks.
- Current run reached the rendered map and `0 / 3` HUD, then failed: a quick Escape press did not pause. Original Sol input implementer assigned diagnosis/repair; do not hide it with artificially long key presses.
- Actual 1280×720 map frame preserved as `artifacts/scene2/map-before-input-fix.png`. Captain inspected: landmarks readable and HUD outside play area; sparse authored glyph baseline, not a premium result.
- Sol gameplay specialist owns blackout teaching beat and analog-magnitude preservation in ExplorationPhase plus unit tests; additive snapshot contract pending. No captain edits to that lane while active.

## Delegated blockers

- Sol debugger reproduced Illegal invocation for a raw browser RAF function stored/called as an object method. Exact application reproduction pending.
- Sol coordinator owns original FixedLoop implementer's browser-receiver repair. Reentrant RAF ownership repair already committed 1f1a656.
- Next queued Sol task: TownMap glyph graphics only, preserving snapshot/API/layout. Captain has frozen that file until handoff.

## Operational resolution

- Managed dev job termination left orphan npm/cmd/Vite descendants holding 5188.
- Sol identified exact ancestry; captain revalidated identities and terminated only npm PID 154872 and descendants. Subsequent browser tests ran.
- Vite atomic editor temp-directory ignore is confirmed narrowly scoped, with real HMR observed.
- Production test config now owns independent preview port 4188, avoiding dev-probe contention.

## Remaining release gate

Fix map startup; verify real-input movement, all three unique restorations, pause/resume, terminal regression, and non-damaging blackout teaching beat; capture current active-play desktop evidence and renderer metrics; package a cumulative static build with known limits. No remote push/deployment performed.

Image creation: Sol only per latest user correction. Prior Terra attachment remains unapproved and not integrated; no regeneration for handoff recovery.

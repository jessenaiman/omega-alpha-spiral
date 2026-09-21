# Chronicle Intro — Release Evidence

## Outcome

The opening is a complete four-question playable chronicle. A first gesture
wakes Omega's failed bash startup and audible ghostwriting. The player then
steers a growing object into one of three spatial answers, receives a distinct
Dreamweaver response, walks the passage to the next question, and reaches a
final door followed by all three threads.

## Controls

- Start / continue: `Enter`, `Space`, or pointer gesture.
- Move: `WASD`, arrows, or the touch direction pad.
- Answer shortcuts: `1`, `2`, `3`, or pointer selection.
- Audio: first gesture unlocks Web Audio; the top-right control mutes/unmutes.
- Replay: `replay opening` returns to the cursor gate.

## Creative passes

1. `threejs-gameplay-systems`: seeded authored question pools, fixed owner slots,
   real Rapier movement, answer sensors, passage sensors, and player growth.
2. `threejs-game-ui-designer`: owner-specific spatial type, diegetic speaker
   labels, accessible owner semantics, and responsive touch intent.
3. `threejs-aaa-graphics-builder`: particle-built event horizon, authored
   Dreamweaver depth, player answer memories, PBR environment response, and
   final-door disintegration.

Detailed before/after decisions and role-review corrections are in
`artifacts/intro-creative-comparison.md`.

## Verified release checks

- Production build: PASS — 100 modules; `dist/intro.html` generated.
- TypeScript: PASS through the production build (`tsc --noEmit`).
- Unit tests: PASS — 18/18.
- Browser suite: PASS — 9/9, one Chromium worker, 2.5 minutes.
- Real-input bot: PASS — choices `[0,1,2,0]`, 961 frames advanced,
  25.23 world units travelled, 744 physics steps, 0 softlock windows,
  0 console errors.
- Production preview: PASS at `http://127.0.0.1:4188/intro.html?debug`.
- Named-state hooks: requested/applied state acknowledgements match; simulation
  freezes only after the Dreamweaver entrance interpolation is settled.
- Static hosting: Vite `base` is `./`; the deployable artifact is `dist/`.

## Current-run visual evidence

- Desktop question 4: `artifacts/intro-release/desktop-question-4-stable/desktop-question-4.png`
- Mobile question 2: `artifacts/intro-release/mobile-question-2-stable/mobile-question-2.png`
- Desktop completion: `artifacts/intro-release/desktop-complete-stable/desktop-complete.png`
- Bot motion recording: `test-results/browser-intro-bot-observab-29dd3--and-reaches-the-final-door/video.webm`

All inspector captures used seed `472` and run id
`intro-release-20260921-stable`. The GPU was the hardware NVIDIA GTX 1660
through D3D11; `softwareRendered` was false. No capture reported console or page
errors.

## Runtime budgets

| State | Calls | Triangles | Geometries | Textures | Tier result |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop question 4 | 69 | 3,096 | 39 | 10 | within budget |
| Mobile question 2 | 63 | 2,904 | 34 | 9 | within budget |
| Desktop complete | 32 | 2,004 | 23 | 7 | within budget |

Rapier question-state diagnostics: 5 bodies, 5 colliders, 4 sensors, 3 active
answer sensors, 0 CCD bodies, fixed timestep `1/60` second. DPR is capped at 2
desktop and 1.5 mobile. No fullscreen post-processing pass or shadow map is used.

## Visual scorecard

No honest pre-pass captures exist, so the before score is `not captured`.

| Category | After | Evidence |
| --- | ---: | --- |
| Art direction | 2 | Chronological type eras, fixed persona forms, shared strand language |
| Hero/player | 2 | Pixel-to-threshold silhouette plus four answer-memory rails |
| Choice roles | 2 | Straight Light, hard-turn Shadow, curved Ambition forms and writing |
| Interactables | 2 | Spatial answer text, symbol response, invisible collision proxies |
| World/environment | 1 | Layered strands/event horizon, but intentionally dominant black field |
| Materials | 2 | PBR player/core, persona backing inks, environment reflection |
| Lighting/render | 1 | Readable authored lights, but measured contrast remains deliberately low |
| VFX/motion | 2 | Choice pulses, growing horizon, trails, final disintegration |
| UI/HUD | 2 | Diegetic labels, accessible mirror, keyboard/touch parity |
| Performance evidence | 2 | Hardware-GPU captures and desktop/mobile diagnostics under budget |

Average: **1.8 / 3**. This is not labeled a premium scorecard pass. The release
is intentionally near-black: desktop question 4 measured entropy `0.57`,
dominant color share `0.95`, and luminance contrast `11`. Those values are a
known art-direction tradeoff and keep World/Lighting below the premium bar.

## Known risks

- The intro JavaScript chunk is 3,122.41 kB minified / 1,176.05 kB gzip because
  Rapier's compatibility WASM is bundled into the intro chunk. Vite reports its
  expected large-chunk warning. A later loading/performance pass should split or
  defer physics initialization if first-load measurements justify it.
- Chromium/D3D emits non-fatal shader precision warnings. There are no page
  errors, but the warnings remain visible in the dev server output.
- Automated checks verify Web Audio unlock and cue emission, not subjective
  loudness on the owner's speakers/headphones.
- Particle-heavy seeded captures are stored as evidence rather than strict pixel
  snapshots; deterministic hooks and canvas metrics protect state and rendering.

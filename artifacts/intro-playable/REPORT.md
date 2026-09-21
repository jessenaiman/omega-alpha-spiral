# Scene 1 — playable prototype evidence

**Result:** current runtime is traversable with automatic unseen exchanges. **Not creative-complete, not release-approved, and not merged.** The staged document contains conflicting versions; the runtime still uses its earlier JSON branch script. The owner has not answered the source-version/new-dialogue questions.

## Implemented in this pass

- Exported `threshold-study-v02-slow.blend` non-destructively to `assets/intro/threshold-runtime/threshold.glb`; the export script and provenance are alongside the GLB. Sampled model transforms, separate export scene, no source blend save. Blender MCP failed with `TraceFlags.RANDOM_TRACE_ID`; headless Blender was the working alternative. No MCP/profile configuration changes.
- Added `ThresholdScene.ts` loading and narrative-progress-driven animation. Replaced the artificial 300-second runtime wait with a final reveal after the script finishes. The 300000 formation field is a normalized study coordinate, NOT measured elapsed player time.
- Added automatic unseen text exchanges after answers. Three unchanged prototype asides live separately in `dreamweaver-asides.json`. Other voices speak first; the chosen affiliation speaks last. Glyph prefixes differentiate voices beyond color. These are repetitive provisional asides, **not new authored answer-specific debates** or approved canon.
- Preserved Omega's runtime dialogue and staged references. The choice-responsive layer does not replace authored responses. Replay clears answers, thread, formation and camera.

## Actual normal-speed journey

URL: `http://127.0.0.1:5188/intro.html?debug` — no pace override, no state injection.

Command: `node C:/Users/jesse/AppData/Local/hermes/profiles/omega-game-director/cache/scratch/play-intro-normal.cjs`

Headed Chromium, 1280×720, normal motion. Real inputs: Enter, 1, 2, 3, 1, W, then replay button. Observed four question gates and four three-turn exchanges. The camera crossed from z=10 to z=-4, reached `complete`, and replay returned to `cursor` with no answers. This is a single-trigger camera traversal, not free-roaming locomotion. Total run including captures/replay: **155.928 seconds**. Console/page/network error list: empty.

Evidence:
- `normal-speed/journey.json` — observations and actual inputs.
- `normal-speed/page@93623e556bfb2677a908f2ef5f9666e6.webm` — unpaused recording.
- `normal-speed/question-*.png`, `debate-*.png`, `doorway.png`, `crossing.png`, `through-door.png`.

The normal-speed journey is a dev-server run. A production build passed, but a separate production-preview journey was not performed.

## Branch option coverage

Command: `node C:/Users/jesse/AppData/Local/hermes/profiles/omega-game-director/cache/scratch/play-intro-branches.cjs`

Three additional real-input routes at debug pace 12: first option throughout, second option throughout, third option throughout. The second route used 390×664 and reduced motion. All reached `complete` at camera z=-4 with no console/page/network errors. These runs used keyboard answers; they do not establish mobile touch answer-picking coverage.

Programmatic inventory comparison: **12 individual scene/option pairs expected, 12 observed, none missing**. This covers all individual options in the CURRENT runtime, not every possible answer-history combination and not the omitted YAML/alternative-flow material. Report: `branch-sweep/journeys.json`.

## Checks

- Observed RED for automatic unseen exchange: browser stayed `writing`/`waiting`, never `debating`.
- After implementation: `npm run typecheck` passed.
- `npx playwright test tests/browser/intro-story.spec.ts tests/browser/intro.spec.ts --reporter=line`: **8 passed**, 49.1 seconds.
- `npm run test:unit`: **19 passed, 0 failed**.
- `npm run build`: passed; GLB emitted into dist and intro entry bundled.
- `git diff --check`: passed after removing trailing blank lines from the edited unit test.
- Tests protect mechanics, not exact dialogue, number of questions, branch outcomes, or creative pacing.
- Harness decision: retained focused browser captures and input tests; no artistic pixel baselines added.
- Generic bot metrics were not invented: there is no player-position/frame-counter acceptance surface for this isolated intro. Recorded cameraZ is camera traversal only, not distanceTravelled. No softlockWindows/FPS claim.

## Visual inspection

Actual captured desktop and mobile images were inspected:
- Desktop debate: all three lines readable, no overlap/clipping, symbolic prefixes distinguish voices.
- Mobile final question: question and all options fit; small type and tiny control hint remain weaknesses.
- Mobile doorway: frame fits horizontally. Desktop doorway: open center exists, but disconnected frame segments and busy background weaken its silhouette. No new portal design was silently substituted for the saved study.
- Crossing capture: side posts move to the edges and the center remains unobstructed.
- Mobile debate: all statements fit; an isolated cursor-like glyph near the bottom can read as stray content. This is not evidence of a missing fourth line.
- Button/hint contrast and size need a focused presentation pass. Reduced-motion formation uses static poses; the crossing camera still travels, so comprehensive reduced-motion certification is NOT claimed.

## Script coverage decisions still open

Reference: `project-management/scene-reviews/scene-01-ghost-terminal.md`.

| Material | Current handling / unresolved point |
| --- | --- |
| YAML lines 35–51 vs JSON 175–227 | Opening options and owner mappings differ. Runtime uses earlier JSON, retaining correction attempts. Do not silently map replies from fantasy/light onto fantasy/ambition. |
| YAML 53–60 / JSON 229–238 | Shared spiral-remembers connective passage is present. |
| YAML 62–83 | Role-choice options exist in JSON; YAML protocol introduction and role-crystallization passage differ from current runtime. |
| YAML 85–97 | Names-choice options exist in JSON; the explanatory lead-in is absent in that earlier version. |
| YAML 99–117 / JSON 342–352 | Symbols/secret exist, but the explicit first-fragment/five-fragments/reality-remembers passage is absent from runtime. |
| YAML 119–142 | Naming choices exist; the longer lost-name monologue is absent from runtime. |
| YAML 144–160 / JSON 399–417 | Final acknowledgment is in the runtime. Thread selection uses the plurality of prior chosen affiliations, with recent choices breaking ties (`ghostwriting.ts:77`); this mechanic still needs creative review rather than a fixed-outcome story test. |
| Subtext 459–481 | Three competing interpretations should be felt without exposition. Automatic asides now establish a provisional presence, not nuanced authored debate. |
| Alternative-flow appendix 485–569 | Distinct older flow; not concatenated into the main script or treated as extra mandatory questions. |

`game-dev` audit/proposal card: `t_0896aa1b` on `omega-spiral-demo`. Its first run timed out after 914 seconds without findings; the coverage analysis above is the director's own work, not a claimed independent review. New debate wording must be presented in chat, not silently canonized. The main scene remains open until the owner resolves source authority and reviews the actual presence/debate treatment.

No commits, pushes, merges, reference-file changes, or Scene 2 integration in this pass. The superseded Terra publication checklist must not restart itself after compaction.

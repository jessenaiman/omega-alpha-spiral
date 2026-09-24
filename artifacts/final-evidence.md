# Intro review evidence

## Current baseline — first question and its lead-in

✅ **Latest result:** lead ran the existing headed bot from real menu entry through Light's first path to the second question and personally inspected the motion frames. Functional slice passed; visual continuity failed review. [Findings, video, input report and repeat command](intro-direction/first-question-slice.md#lead-review-completed--entry-through-question-two). No gameplay-source changes in this review. Earlier missing-motion statements below describe the baseline before this run; canvas-inspector coverage remains pending.

✅ Review specification and exact skill references: [first-question baseline](intro-direction/first-question-slice.md). Target: `http://127.0.0.1:5191/intro.html`; branch `prototype/ghost-typing-voices`, with local uncommitted changes. Current declaration: [evidence.json](evidence.json), run `first-question-review-20260923-a`.

✅ Lead opened the actual intro and confirmed the overlapping Light/Shadow lettering visible in the [user's before image](first-question-review-20260923-a/user-before.png). Screenshot framing is 947×874; supplemental live observation was 971×910. These are visual observations, not matching regression captures.

❌ Current unpaused entry-to-contact recording and canvas/runtime report are missing. The manifest deliberately declares those outstanding artifacts; no checker success, complete gameplay, or approved visual baseline is claimed.

✅ Next review is bounded to boot → Omega question → three speaker turns → walking/start-stop → first contact/response. Lead demonstrates and inspects it before further delegation. Preserve failures, fix the owning module, restart and compare the same sequence. Existing bot updates are prepared but have not run.

✅ Production build/typecheck passed before this documentation update. Chromium executable existence was verified with browser-cache access; the earlier restricted-filesystem check was misleading. No further installation is needed for this baseline.

## Historical handoff — obsolete controls and previous revision below

The following sections are preserved history, including old number-key/path-button controls, earlier art assumptions and older verification results. They are not current instructions or certification. Original manifest: [previous-evidence.json](first-question-review-20260923-a/previous-evidence.json).

> Historical evidence below predates the current menu, movement and filament edits. Those changes are not release-verified. Current bounded visual iteration: [filament motion](intro-direction/filament-motion.md). No new bot/test pass was run; the rejected bot rewrite was removed.

Run: `intro-flow-20260923-c` · Page: `http://127.0.0.1:5188/intro.html` · Bot seed: `472`

**Current camera increment (5191, uncommitted):** choice movement now influences camera position; gaze interpolates across phases; avatar locomotion includes path choice. Page loaded without captured console errors and Begin was exercised. Sustained movement, contact and visual quality remain unverified. The historical results below do not certify these changes.

## What plays

The authored boot and four Omega path questions lead to three fine Dreamweaver routes at each question. Contact with a route commits the choice and presents that Dreamweaver's authored response. The avatar then continues from the reached strand into the next constructed station while the camera follows in depth; there is no second required walk. Prelude and response writing advance after a reading hold, and Enter can advance them sooner. Omega's fifth question asks for a typed name. W/up walks through the suspended words in the Blender doorway and starts Chapter Two.

The four path questions, their choices, Dreamweaver responses, and boot come from [ghost.json](<../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json>) through [chronicle.ts](../src/intro/chronicle.ts). The final name question and doorway phrase follow the owner's later direction. No unit tests were written. The repository pre-commit hook unexpectedly ran the existing unit suite once; it failed on a stale assertion expecting different authored finale text. The production build, real-input bot, and visual evidence checks above passed.

## Controls

- WASD/arrows: move toward a strand; contact commits it.
- 1/2/3 or the visible path buttons: guide the avatar to that strand, then commit on arrival.
- Enter: advance completed writing early. A reading hold advances it without a click.
- Type a name and press Enter at question five.
- W/up: walk through the doorway words. Enter can guide the avatar through.
- Replay opening resets the run.

## Visual and Blender layers

[Art staging with all three supplied reference images and current captures](intro-direction/next-conversation.md) is the starting point for the next creative review. The first question stays dark with a small character and thin shader paths. Technology-era linework grows across questions two through four. A faceless figure grows from the original pixel. The distant lemniscate, portal, floor glyph, and fragment door arrive at the finale. [Blender source/export map](intro-direction/blender-runtime-map.md) identifies the five runtime GLBs separately from editable Blender studies.

## Captures and motion

| Moment                | Desktop                                             | Mobile                                             |
| --------------------- | --------------------------------------------------- | -------------------------------------------------- |
| First question        | [PNG](intro-flow-20260923-c/desktop-question-1.png) | [PNG](intro-flow-20260923-c/mobile-question-1.png) |
| Question 2            | [PNG](intro-flow-20260923-c/desktop-question-2.png) | —                                                  |
| Question 3            | [PNG](intro-flow-20260923-c/desktop-question-3.png) | —                                                  |
| Question 4            | [PNG](intro-flow-20260923-c/desktop-question-4.png) | —                                                  |
| Omega asks for a name | [PNG](intro-flow-20260923-c/desktop-final-name.png) | [PNG](intro-flow-20260923-c/mobile-final-name.png) |
| Doorway crossing      | [PNG](intro-flow-20260923-c/desktop-final-door.png) | [PNG](intro-flow-20260923-c/mobile-final-door.png) |

Real-input motion: [full bot playthrough](intro-flow-20260923-c/bot-playthrough.webm), plus stills of [Light](intro-flow-20260923-c/intro-travel-1.png), [Shadow](intro-flow-20260923-c/intro-travel-2.png), and [Ambition](intro-flow-20260923-c/intro-travel-3.png) travel. The video includes locomotion, strand contact, station transitions, doorway crossing, Chapter Two play, and retry. The three travel stills were inspected; the character advances along the chosen filament as the camera moves into depth. The bot also asserts that contact-to-travel and travel-to-next-station position changes stay below 1.25 world units per sampled transition.

## Checks

- `npm.cmd run build`: TypeScript and Vite production build passed.
- `npm.cmd run test:bot`: one Chromium worker, one existing skill-style bot, passed. [Metrics](intro-bot-playtest-report.json): 1,347 frames; 83.69 units travelled; 7 objective steps; 0 softlock windows; 3 Chapter Two choices; retry verified; no console, page, or network errors. The intro has no fail state by design.
- The nine declared desktop/mobile canvas captures acknowledged their named states and were nonblank without console or page errors. The renderer was the hardware NVIDIA GTX 1660 D3D11, not a software fallback. [Manifest](evidence.json) checker passed all 30 declared/report artifacts.
- Desktop final doorway: 250 calls, 10,399 triangles, 240 geometries, 9 textures, within the desktop starting budget. Mobile final doorway: 250 calls and 240 geometries, above its 150-call/200-geometry starting budget because the fragment door remains individually animatable.

## Remaining visual decisions

The route camera now moves between questions, but the four station silhouettes still resemble one another. The faceless avatar grows but remains blocky. The portal interior is dark; the actual first playable stage is not yet legible through it. The next art pass should decide each station's constructed landmark, refine the figure and terminal materials, and make the level reveal readable without turning the early intro into a galaxy backdrop. The mobile door needs a static merged variant or another draw-call reduction before claiming the starting mobile budget. The typed name is stored by the intro; Chapter Two currently receives the last chosen thread.

## Active isolated ghost typing study — September 23, 2026

The sections above are historical intro evidence. The new study is separate: [current handoff](ghost-type-study/README.md), [Wayfinder map](https://github.com/jessenaiman/omega-alpha-spiral/issues/55).

- Starts at http://127.0.0.1:5191/intro-type-prototype.html with manuscript, fragments and passage layouts. Browser observations confirm readable world-space terminal text, selector/layout navigation, and the answer/reconsidering state. No full gameplay claim.
- TypeScript passed in the normal commit hook; 22/23 existing unit tests passed. The old intro finale assertion failed. Owner explicitly approved one commit skipping hooks with that failure documented. No additional tests were added.
- Visual review found fragment clipping and competing old-text traces; local adjustments move Light inward and fade traces. Phone controls were observed at a 390×844 override, then viewport restored. Motion captures, persistent screenshots, a complete mobile readability review and final human visual preference remain pending.
- Native OpenAI concept was delegated to Luna. Generated sheet is reference-only; it omitted Omega. Runtime lettering uses a deterministic canvas atlas with an instanced glyph shader.

### Shared scene era follow-up

Live browser showed Floor 1 owned by Light while Shadow spoke in DOS glyphs; switching to the smooth era visibly changed the same words and preserved Shadow's angled layout. No tests rerun. Shared configuration is reusable but actual floor integration remains pending; no new commit claimed.

## Omega Dialogue Studio checkpoint — September 23, 2026

- Canonical route: `/omega-dialogue-studio.html`; legacy study URL redirects with parameters preserved. Scene owner and shared eras are reusable configuration; actual game integration is pending.
- TypeScript/Vite production build passed. Requested QA skill captured desktop 1280×720 and mobile 390×664 on the hardware NVIDIA GPU. Both final reports have no console or page errors. Initial favicon 404 was fixed and its failed evidence retained.
- Three declared artifacts passed the evidence coverage checker. Real controls and Omega's post-answer revision were exercised; a short typing/revision recording is saved. No frame-time or complete gameplay claim.
- [Studio release notes and captures](omega-dialogue-studio/README.md), [manifest](omega-dialogue-studio/evidence.json). No additional unit tests. Next: commit/push, then design the gameplay integration before more studio features.

## Later studio opening slice — separate from the intro run above

See [opening block observations](omega-dialogue-studio/opening-block.md). Live loading and rendered text observed; export/import, build and motion capture remain unverified. No additional tests run.

- Later persistence controls (schema-backed presentation, undo/redo, JSON source) are implemented but not runtime-verified in this follow-up. Owner round-trip check pending; earlier visual evidence does not cover these controls.

## Current opening adapter — 2026-09-23

Owner reports saved studio era appears in the real intro and Continue works. Direct fresh-load observation confirms styled shader lettering with no captured browser errors. This does not establish the remaining five-question/name/door progression. No test suite ran this pass. Integration remains uncommitted. Detailed limits: omega-dialogue-studio/integration-check.md.

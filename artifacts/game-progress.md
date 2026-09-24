# Omega Spiral — Game Director Progress

<<<<<<< HEAD
Updated: 2026-09-23
=======

## Active small increment — 2026-09-23

- Full skill/setup audit: `artifacts/intro-direction/threejs-workflow-audit.md`. All nine skills/agent entries and declared npm packages present; Python helpers launch; Blender MCP live. Playwright Chromium missing; installation blocked by automatic approval review, specific permission requested. Existing bot also needs bounded updates for Begin, physical choices, forward travel and current port before a run.
- Luna gameplay delivered and lead inspected removal of the explicit avatar teleport in commitChoice. No motion verification yet. Luna graphics delivered source-grounded stationary depth-anchor recommendation; no graphics edits. Both worker tasks complete.

- Workflow correction: use actual packaged starters and specialist agents. Luna `opening_gameplay_piece` and `opening_spatial_review` each read one skill and asked three questions before work. Both are drafting read-only recommendations; parent owns shared integration. Contract: `artifacts/intro-direction/first-question-slice.md`. Starter CameraRig/InputController/Game and both agent entry YAML files inspected. Approved direction corrected for galaxy-first and three concurrent storylines.

- Owner rejected expanding or auditing the unfinished opening before its interaction feels right. Apply gameplay-systems in small pieces; current piece is first-question movement and camera follow only.
- Read gameplay-systems/SKILL.md and its game-feel reference. Fixed camera ignoring avatar position during path choice and instantaneous gaze changes between phases. Enabled avatar locomotion during choice/door movement as well as travel.
- Source inspected; current page loads with no captured console errors and Begin was clicked. Motion quality and choice-to-response continuity need owner gameplay review. No new tests or suite execution. Historical bot results do not cover this patch.
- Next: hold forward/back and steer at the first question, release to stop, observe the camera on contact. Resolve that result before expanding backgrounds, later encounters, or quantum companions.

Updated: 2026-09-22

> > > > > > > main

## Current task

- Set up the project for the full [Three.js Game Director](../.agents/skills/threejs-game-director/SKILL.md) workflow. Use the written non-API routes: keyless Pollinations images, local VoiceStudio voice, procedural Web Audio SFX, and Blender plus procedural Three.js for 3D.
- Current branch: codex/floor-one-director-setup. No current issue handoff was confirmed. GitHub issue access failed under the workspace network policy.
- The user reports broken opening gameplay. That report remains unresolved; a loaded page and one working choice do not prove the full loop.

## Verified this pass

- All eight sibling threejs-* skill entrypoints were read. The production skills cover gameplay, graphics, UI, debugging, and QA; generators cover 3D, images, and audio.
- npm ls --depth=0 --offline passed. Playwright full Chromium is installed. The Vite server started at http://127.0.0.1:5188/.
- The actual /intro.html page rendered in the browser. Key 1 selected the first strand. A later scripted real-input bot reached Chapter Two and retry, but the user's human-visible gameplay concern remains open.
- The director evidence checker, gameplay scaffold, QA inspector, 3D helper, and audio helper all returned help successfully. Both image helpers returned help when run with access to uv's user cache. No paid provider generation was attempted.
- The keyless Pollinations image helper produced one 768×768 sample without an API key. It was watermarked and generic, so it was inspected and discarded; no image asset was integrated.
- Blender MCP is live: Blender 5.2.1 LTS, addon 1.7, protocol 9, up to date. get_scene_info returned IntroLayerStudy with 49 objects and 18 materials.
- VoiceStudio 0.5.3 is registered and C:\VoiceStudio\app\omnivoice-studio.exe is running. Its documented http://127.0.0.1:3900/health endpoint refused connection. Voice output is not verified.
- The official VoiceStudio Electron 0.5.6 installer matched its published SHA-256 and installed a 0.5.6 executable under the user Programs directory. It has not been launched or connected to the old data. The official migration sequence requires closing the running Tauri app and backing up its data first.
- A ten-category baseline scorecard and four fresh desktop/mobile captures are in [final-evidence.md](final-evidence.md#visual-scorecard--2026-09-23-baseline-and-ui-pass). Baseline average: 1.25/3; premium fails. The compact choice UI pass raised UI/HUD from 1 to 1.5 and overall average to 1.30/3. Both after captures passed the evidence checker; production build passed. The hero, sparse dark question world, and mobile door budget remain failures.
- Floor One has a separate ten-category active-play baseline in [final-evidence.md](final-evidence.md#floor-one-active-play-scorecard--2026-09-23-baseline). Four current desktop/mobile entry and guard-contact captures passed the evidence checker. Average: 0.70/3; the visible stage is a sparse glyph texture on one plane, with no authored 3D dungeon presentation yet.
- Floor One now has an authored 3D scene with instanced tile/wall kit, modeled player and guard, interactables, lighting, event effects, smaller log, and procedural audio. The after score is 1.55/3 across all ten categories; four after captures passed the checker, all within renderer budgets. Premium remains open because every category must reach at least 2 and average at least 2.3.
- The current scripted real-input bot passed through intro, Chapter Two choices, and retry: 1,340 frames, 83.88 units, 7 objective steps, zero softlock windows or browser errors. This does not settle the user's broken-gameplay report; visual clarity and unscripted paths remain open.

## Existing Floor One checkpoint

<<<<<<< HEAD

- The September 22 Floor One rerun added inspector-compatible hooks, named capture states, and diagnostics in src/floor-one/capture-states.ts and src/floor-one/main.ts. That pass reported eight states, a clean typecheck, 23 unit checks, and inspector captures under artifacts/floor-one-hooks-20260922/. This is historical evidence, not a rerun today.
- Floor One has declared before/after capture sets. Its premium finish remains open.
  \=======

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

- **Slice 1 of the Floor One rerun — DONE (2026-09-22):** inspector-compatible
  hooks + named capture states + diagnostics for Floor One.
  Files: `src/floor-one/capture-states.ts` (drivers), `src/floor-one/main.ts`
  (hooks/freeze/diagnostics), probe `scratch/probe-floor-states.ts`.
  8 named states, each reached through real `stepFloor` rules:
  entry, pause, guard-intent, pickup-resolved, door-open (seed `door-1`),
  exit-ready, escaped, defeat. Defeat = the player moves on (retry), never a
  final ending — fight feedback is placeholder while assets still load.
  Verified: typecheck clean, 23/23 unit, inspector PASS on
  entry/pickup-resolved/door-open/exit-ready/escaped/defeat/pause
  (0 console/page errors, within budget) in
  `artifacts/floor-one-hooks-20260922/` run `hooks-1`.
- Next slice candidates: declare `artifacts/evidence.json` capture set for
  Floor One and run `verify:visual`; or unit tests for the rules (#20).
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

> > > > > > > main

## Next

1. After the running Tauri app can be closed safely, back up its data and verify Electron's storage, backend health, and a local test clip. Keep the old app/data until that passes.
2. Review unscripted intro choices and the Chapter Two handoff in the visible browser to locate the player's reported friction; the bot verifies only one path.
3. Continue authored opening and Floor One graphics until the ten-category scorecard reaches the premium threshold, then recapture. The baseline and narrow UI-pass manifests are separate from the earlier full-run evidence.json.

<<<<<<< HEAD
Older design and implementation checkpoints remain in Git history. This file keeps current state only.
=======

---

# Intro layer studies — progress (2026-09-22)

- Q1 Archive begins in darkness with Omega ghostwriting on a world-space terminal. Revealing the Dreamweavers' own questions loads the Blender void floor and three fine strands; their question words follow each strand.
- Blender source files are separate and editable: `artifacts/intro-threshold/door.blend`, `dreamweaver-strands.blend`, `background-void.blend`; `intro-layer-study.blend` previews their layering. The exported strand and background GLBs live in `public/assets/intro/`.
- Q2 Tide uses the celestial image plate; the final name question uses the threshold image plate and a fragment assembly study. The original `/intro.html` remains the current game opening.
- `intro-strands-shader.html` is an independent Three.js shader comparison using the same runtime question and ghostwriting frames. It presents the Dreamweavers' own questions; integration into `/intro.html` still needs the active question and writing state passed in and the selected owner/message returned.
- Basic checks: TypeScript typecheck passed; live Archive, Tide, Threshold, and shader pages opened; Archive reported its Blender layers loaded. Full intro gameplay and production evidence are still pending integration.
- Q1 Archive now writes the three Dreamweaver questions in order after Omega finishes. Shader-drawn glyph ribbons float above the paths with controlled Light, Shadow, and Ambition motion; the floor and Blender strands reveal after Ambition. TypeScript typecheck passed, and the live browser showed the three-path state. The Blender MCP showed `intro-layer-study.blend` with its void floor, fine strands, and doorway reference; the exported door remains a separate final-scene integration task.

## Canonical intro playable checkpoint — 2026-09-23

- `/intro.html` now makes approaching a strand the choice itself. Number keys and visible choice buttons guide the character to a strand before committing; the between-question route moves automatically with the camera.
- The intro uses a receding transparent substrate, restrained first-question darkness, smaller Dreamweaver marks, and the Blender fragment door at the threshold. Chapter Two receives the last chosen thread.
- The three supplied reference images and the design brief, core loop contract, and level plan are saved in `assets/references/` and `artifacts/intro-direction/` for the next art conversation.
- `artifacts/final-evidence.md` records the production build, skill-defined real-input bot, desktop/mobile captures, door capture, video, and current manifest check. No unit tests were written; the pre-commit hook unexpectedly ran the existing suite once and found a stale authored-text assertion.
- Remaining art review: physical Omega terminal, faceless character growth, door material/assembly, and how much of Chapter Two is visible through the portal.

## Intro flow and visual staging checkpoint — 2026-09-23

- The canonical `/intro.html` is the only target for this pass. The older layer-study notes above describe historical experiments; `ghost.json` and the latest playable scene govern the current opening.
- The player now continues from the contacted Dreamweaver into a depth-travel path. The camera follows and the next station is rebased around the arrival point. There is no reset to the bottom of the same frame and no second required walk after choosing. Completed writing advances after a reading hold; Enter remains optional.
- Four authored path questions lead to Omega's typed fifth name question. The name opens the Blender fragment door; walking through suspended Omega words enters playable Chapter Two. Blender runtime now loads void, strands, fragments, portal, and floor glyph as separate GLBs.
- [Next-conversation staging](intro-direction/next-conversation.md) pairs all three owner images with current captures, the present visual grammar, and remaining decisions. [Final evidence](final-evidence.md) records nine named desktop/mobile captures, the real-input bot/video, build, budget, and limitations. No unit tests were written; the pre-commit hook unexpectedly ran the existing suite once and found a stale authored-text assertion.
- Remaining: make the first stage legible through the portal; differentiate station silhouettes more; refine the blocky faceless avatar; reduce mobile final-door draw calls if the mobile target requires the starting budget. Preserve unrelated Floor One and source-study work already in the tree.

## Ghost typing visual study — September 23, 2026

- Active: [Distinctive ghost typing](https://github.com/jessenaiman/omega-alpha-spiral/issues/54); [Wayfinder map](https://github.com/jessenaiman/omega-alpha-spiral/issues/55) and its claimed visual-decision child keep orientation.
- Prototype: `intro-type-prototype.html`, manuscript/fragments/passage variants; per-speaker timing, mistakes and authored revisions. Original intro remains separate.
- Two Luna drafts delivered (profiles and OpenAI contact sheet). The contact sheet contains Dreamweavers plus comparison, not Omega; reference-only.
- Owner correction: no extra unit tests. Normal commit hook passed TypeScript and 22/23 existing tests; existing finale wording assertion blocked commit. Owner approved a single documented hook skip.
- Preview: http://127.0.0.1:5191/intro-type-prototype.html . Human visual choice remains open. See `artifacts/ghost-type-study/README.md` and `project-management/Handoffs/54.md`.

- Ghost typing follow-up: scene-owned universal era added in src/core/sceneTypography.ts. Opening/Omega, Floor 1/Light, Floor 2/Shadow, Floor 3/Ambition. All study voices inherit glyph era while preserving cadence and geometry. Floor-era assignments remain editable; live prototype only, game-scene integration pending. No tests run for this follow-up.

## Omega Dialogue Studio checkpoint — September 23, 2026

- Canonical route: `/omega-dialogue-studio.html`; legacy study URL redirects with parameters preserved. Scene owner and shared eras are reusable configuration; actual game integration is pending.
- TypeScript/Vite production build passed. Requested QA skill captured desktop 1280×720 and mobile 390×664 on the hardware NVIDIA GPU. Both final reports have no console or page errors. Initial favicon 404 was fixed and its failed evidence retained.
- Three declared artifacts passed the evidence coverage checker. Real controls and Omega's post-answer revision were exercised; a short typing/revision recording is saved. No frame-time or complete gameplay claim.
- [Studio release notes and captures](omega-dialogue-studio/README.md), [manifest](omega-dialogue-studio/evidence.json). No additional unit tests. Next: commit/push, then design the gameplay integration before more studio features.

## Studio authoring-model review — September 23, 2026

- Full studio expansion goal remains active; design is under review, not approved. Owner requested detailed Dialogic and existing Godot schema/dialogue review first.
- Located original schemas, NPC data, Dialogic timelines and character resources. Structural/execution findings and drift: [authoring review](omega-dialogue-studio/godot-authoring-review.md). [Era research prompt](omega-dialogue-studio/era-research-prompt.md) delivered. #53 lead ownership noted on GitHub.
- VoiceStudio subtask on hold at owner request; do not resume setup or generation until asked. Existing Codex CLI reports not logged in; desktop login status is not inferred. No model downloads, runtime changes or tests this pass.

## Omega Studio opening block

Owner requested adapting the authored Omega opening as the first editor iteration. Added dialogue JSON/schema, minimal sequential runner and edit/preview/import/export UI using existing lettering. Live studio reached before-choices; DOS glyph overlap corrected. No unit tests/build run. Evidence limits: artifacts/omega-dialogue-studio/opening-block.md.

- Studio persistence follow-up: schema validation via Ajv; scene/era/layout/cadence in the document; undo/redo and source view. Four existing era sketches now explain their rendering and historical limits. Owner asked to check export/reopen. No tests/build run. See omega-dialogue-studio/opening-block.md.

## Studio integration check — 2026-09-23

Owner confirmed Apply to game propagates the selected era and Continue reaches paths. Fresh studio/intro loaded without captured errors. Fixed save snapshot bookkeeping and selection restoration after rejected structural edits. Full later gameplay remains unverified. Contract: omega-dialogue-studio/gameplay-contract.md; report: omega-dialogue-studio/integration-check.md. Qwen editor assignment published as #57.

## Playable opening / asset return — 2026-09-23

New explicit Begin menu plus native OpenAI background plate, existing logo, and control instructions. Current authored direction: intro-direction/approved-design.md. Restored Blender floor/strands at first path reveal, and travel now obeys forward/back input. Live MCP asset intake: intro-direction/asset-intake.md. Luna image review: /image-asset-review.html. Bot random/repeat work pending; no full progression claim.

## Filament motion correction

Owner rejected the bot-test rewrite; its two files were restored without execution. Owner also rejected the three background-motion contact sheets. Gallery marks them rejected. Current work is live reusable shader line art, flat-to-spatial shapes, convergence, shatter/reform, with offscreen streams following the reference. Shared by menu and opening presences; review at /filament-study.html. Details and verification limits: intro-direction/filament-motion.md. No automated tests or release claim.

- First-question review baseline corrected: artifacts/intro-direction/first-question-slice.md links QA motion, debug reproduction and director evidence requirements. Current manifest now declares pending entry-to-contact evidence; old run archived without relabeling. Live overlap confirmed; lead demonstration precedes further delegation. Chromium verified installed; build passed; updated existing bot remains unrun.

- Lead demonstrated and reviewed first-question Light route to question two using existing headed bot's bounded review mode. Video, frame sequences and prioritized findings: artifacts/intro-direction/first-question-slice.md. Functional progression passes, visual continuity fails. No scene changes or new unit tests; canvas-inspector report remains pending.

> > > > > > > main

# Chronicle intro — playable visual handoff

Run: `intro-flow-20260923-c` · Page: `http://127.0.0.1:5188/intro.html` · Bot seed: `472`

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

## Visual scorecard — 2026-09-23 baseline and UI pass

This section scores the current source with the ten categories and calibration anchors in [visual-scorecard.md](../.agents/skills/threejs-aaa-graphics-builder/references/visual-scorecard.md). The preceding report records an earlier run; its counts and screenshots are not the current baseline. A comparable pre-change score was not captured. The baseline below was captured before the compact choice UI pass.

Genre equivalents: the hero is the growing figure; obstacles are route constraints and the doorway threshold; interactables are strands, choices, and the door. The active introduction has no enemies or loot to score.

| Category | Earlier | Baseline | Evidence and next pass |
| --- | ---: | ---: | --- |
| Art direction | Not captured | **1.5** | Cosmic terminal language is coherent, but the large choice card and sparse path do not read as one designed play surface. Integrate the choice interface with the world. |
| Hero/player | Not captured | **1** | The figure is a small, faceless block silhouette. Author its form and readable growth states. |
| Obstacles/enemies | Not captured | **1** | Route constraints and threshold are present, but their gameplay roles are hard to distinguish in the question view. Make their cues legible during movement. |
| Rewards/interactables | Not captured | **1.5** | Strands and door exist; choice/contact feedback is obscured by the overlay on mobile. Show world and UI feedback together. |
| World/environment | Not captured | **1.5** | The final portal is constructed, while question 1 is sparse; question-view color entropy is 0.58 desktop / 0.83 mobile and dominant color share is 0.948 / 0.912. Author readable route landmarks and depth. |
| Materials/textures | Not captured | **1** | Strands and figure rely on basic flat or emissive treatment. Establish material roles and surface detail that survive the dark composition. |
| Lighting/render | Not captured | **1** | Question-view luminance contrast is 11.5 desktop / 15.5 mobile, below the scorecard's ~60 advisory signal. Light the route and figure for readable separation. |
| VFX/motion | Not captured | **1.5** | Strands and particles are visible; these stills do not establish motion timing. Review unpaused contact and transition footage before a higher score. |
| UI/HUD | Not captured | **1** | The rectangular “CHOOSE A STRAND” panel covers the mobile path and competes with world text. Redesign the mobile choice and touch layout around the playable view. |
| Performance evidence | Not captured | **1.5** | Four fresh inspector reports and budget diagnostics exist. Mobile final door uses 163 draw calls against the 150-call starting budget; reduce or document the cost and recapture. |

**Baseline average: 1.25 / 3. Premium threshold: not met.** Every category must reach at least 2 and the average at least 2.3. Baseline automatic failures: primitive hero, UI overlap on mobile, and sparse/dark question framing without enough authored composition. The mobile door also exceeds the draw-call budget.

Fresh captures: [desktop question 1](scorecard-20260923-baseline/desktop-question-1.png), [mobile question 1](scorecard-20260923-baseline/mobile-question-1.png), [desktop final door](scorecard-20260923-baseline/desktop-final-door.png), [mobile final door](scorecard-20260923-baseline/mobile-final-door.png). [Declared manifest](evidence-scorecard-20260923-baseline.json) passed the director evidence checker for all four captures. Inspector reports with `metrics` and `renderBudget` are alongside the images.

### After the compact choice UI pass

**UI/HUD: 1 → 1.5. Overall average: 1.25 → 1.30 / 3. Premium still fails.** The route guide now shows short labels while retaining the full choice wording as accessible button labels. Desktop and mobile captures show the three buttons at the right edge, leaving the central player and strands visible. [Desktop after](scorecard-20260923-ui-pass/desktop-question-1.png) · [Mobile after](scorecard-20260923-ui-pass/mobile-question-1.png) · [After manifest](evidence-scorecard-20260923-ui-pass.json). No other category has been rescored; the primitive hero, dark sparse route, and mobile doorway budget remain below the premium bar. The after capture pair has zero console/page errors and 103 draw calls on each viewport. Production build passed.

## Floor One active-play scorecard — 2026-09-23 baseline

Floor One is the playable turn-based stage after the opening. Its genre equivalents are `@` for the player, `#` walls and the guard for obstacles, and glyphs for pickup, door, and stairs. The design brief calls for a low-poly dungeon on a code substrate; the current render maps a glyph canvas onto one Three.js plane. These scores evaluate the visible result, not the amount of rule code. No comparable earlier score was captured, and there is no after art pass yet.

| Category | Before | Current | Evidence and next pass |
| --- | ---: | ---: | --- |
| Art direction | Not captured | **1** | Retro terminal palette is consistent, but the stage reads as a sparse text view. Make the dungeon and code substrate a unified authored space. |
| Hero/player | Not captured | **1** | The player is an `@` glyph with color and no authored silhouette or state cues. Author the player presentation. |
| Obstacles/enemies | Not captured | **1** | Walls are repeated `#` glyphs and the guard is `G`; threat state is mostly in the HTML HUD. Give each role readable form and telegraph in play. |
| Rewards/interactables | Not captured | **1** | Pickup, door, and stairs use glyphs with little visible state feedback. Show their purpose and resolution on the board. |
| World/environment | Not captured | **0.5** | Both entry and guard-contact captures leave most of the viewport empty; fog of war does not yet have an authored surrounding composition. Build the floor kit and depth cues. |
| Materials/textures | Not captured | **0** | The only Three.js surface is a canvas texture on a plane; no authored material treatment is visible. Establish the intended surface language. |
| Lighting/render | Not captured | **0** | The plane uses `MeshBasicMaterial`, so no light shapes the dungeon. Add intentional lighting and readable contrast. |
| VFX/motion | Not captured | **0** | No contact, damage, or movement effect is visible in stills; motion evidence is absent. Add event feedback, then capture it in motion. |
| UI/HUD | Not captured | **1** | A full-height text log and keyboard legend frame a small glyph board. Move immediate state feedback near the action and reduce the page-like shell. |
| Performance evidence | Not captured | **1.5** | Four acknowledged inspector captures and renderer counts exist, with no console/page errors. One draw call and two triangles reflect the textured plane, not finished scene complexity; capture post-art metrics. |

**Average: 0.70 / 3. Premium threshold: not met.** Automatic failures: active play is dominated by placeholder glyphs and empty space; hero, challenge roles, and UI are not premium. The screenshot is nonblank and the rules advance to guard contact, but those checks do not prove finished gameplay presentation.

The desktop canvas metrics at entry → guard contact are color entropy **0.22 → 0.41**, dominant color share **0.98 → 0.95**, and luminance contrast **0 → 0**. Mobile metrics are entropy **0.09 → 0.22**, dominant share **0.99 → 0.98**, and contrast **0 → 0**. The inspector reports one draw call, two triangles, one geometry, and one texture in every capture. Mobile is a review layout; the current design brief does not promise touch gameplay.

Captures: [desktop entry](floor-one-scorecard-20260923/desktop-entry.png), [desktop guard contact](floor-one-scorecard-20260923/desktop-guard-intent.png), [mobile entry](floor-one-scorecard-20260923/mobile-entry.png), [mobile guard contact](floor-one-scorecard-20260923/mobile-guard-intent.png). [Declared manifest](evidence-floor-one-scorecard-20260923.json) and the four inspector reports record state acknowledgement, metrics, budget, and errors.

### After the authored Floor One scene pass

The new [FloorVisual.ts](../src/floor-one/FloorVisual.ts) draws instanced floor and wall kit, a glyph substrate, modeled player and guard, door, shard, stairs, lamps, state colors, and event effects. [FloorAudio.ts](../src/floor-one/FloorAudio.ts) adds procedural ambience and input/event cues. The turn rules and named capture hooks remain in place. Scores are based on the complete four-capture set below; mobile remains a review layout rather than a touch-play target.

| Category | Before → After | Evidence and remaining work |
| --- | ---: | --- |
| Art direction | **1 → 1.5** | Early-PC dungeon and live-code glyphs now share a palette and space. The gray tile field still lacks a distinct enough identity. |
| Hero/player | **1 → 1.5** | Player has an armored silhouette, visor and contact shape; it is small and has no demonstrated expressive motion or damage state. |
| Obstacles/enemies | **1 → 1.5** | Walls, guard, and door have separate 3D forms; guard disposition changes its signal. Anticipation and threat telegraphs need stronger world feedback. |
| Rewards/interactables | **1 → 1.5** | Shard, seal, and stairs have different forms and state visibility; interaction purpose needs to remain clearer during movement. |
| World/environment | **0.5 → 1.5** | Revealed floor has instanced slabs, caps, trim and lamps, with camera framing around visible tiles. Repetition and empty surrounding composition remain prominent. |
| Materials/textures | **0 → 1.5** | Shared stone, metal, cloth, signal, and glyph-substrate roles now exist. Most floor surfaces still read as flat gray boxes. |
| Lighting/render | **0 → 1.5** | ACES, ambient/key/fill lights and lit geometry improved measured contrast to 143–147. Contact and depth remain shallow in the active camera. |
| VFX/motion | **0 → 1.5** | A real H input produced a visible hit/damage ring and slash; pickup, door and exit have event geometry. Unpaused motion timing has not been captured. |
| UI/HUD | **1 → 1.5** | Event log is narrower, newest message appears first and stays visible on mobile. The interface still relies on a rectangular sidebar and long keyboard legend. |
| Performance evidence | **1.5 → 2** | Before/after desktop/mobile captures, diagnostics, a current build and budget results exist. Profile after the next visual pass; these counts are not a frame-time claim. |

**After average: 1.55 / 3 (before 0.70). Premium threshold: not met.** Every category still needs at least 2, and the average must reach 2.3. The remaining work is an authored material/world pass, more expressive player and guard feedback, clearer interactable states, and a more integrated HUD. A low-poly style is valid for this design; repeated basic slabs are still a visible quality limit.

After captures: [desktop entry](floor-one-scorecard-20260923-after/desktop-entry.png), [desktop guard contact](floor-one-scorecard-20260923-after/desktop-guard-intent.png), [mobile entry](floor-one-scorecard-20260923-after/mobile-entry.png), [mobile guard contact](floor-one-scorecard-20260923-after/mobile-guard-intent.png), [real-input hit effect](floor-one-scorecard-20260923-after/desktop-hit-vfx.png). The [after manifest](evidence-floor-one-scorecard-20260923-after.json) passed all four declared captures with zero console/page errors. Desktop entry → guard contact: entropy **2.39 → 3.60**, dominant color share **0.49 → 0.43**, contrast **144.7 → 146.7**. Mobile: entropy **2.39 → 3.37**, dominant share **0.40 → 0.32**, contrast **142.7 → 146.7**. Guard contact uses **52 draw calls, 6,712 triangles, 57 geometries, 3 textures**, within the inspector's desktop and mobile starting budgets. Build passed with the final audio integration.

The current `npm.cmd run test:bot` run passed on 2026-09-23: 1,340 frames advanced, 83.88 units travelled, 7 objective steps, 3 Chapter Two choices, retry verified, zero softlock windows, and zero console/page/network errors. This proves one scripted real-input route through the intro and retry; it does not erase the scorecard failures or prove every human-visible route is clear.

## Director tool setup — current checkpoint

| Status | Tool or instruction | Observed result |
| --- | --- | --- |
| ✅ Verified | [Three.js Game Director](../.agents/skills/threejs-game-director/SKILL.md) and all eight sibling `threejs-*` `SKILL.md` entrypoints | Read from this repository's `.agents/skills/` tree. Loaded phase references: UI patterns; visual scorecard, authoring recipes, technical art, shader cookbook; visual test harness; evidence manifest and asset recovery; audio workflows. |
| ✅ Verified | Project packages and browser | `npm.cmd ls --depth=0 --offline` passed; Playwright Chromium exists; Vite served the real intro at `http://127.0.0.1:5188/`; production build passed. |
| ✅ Verified | Blender MCP | Live addon status returned Blender 5.2.1 LTS, addon 1.7, protocol 9; live scene query returned `IntroLayerStudy`, 49 objects, 18 materials. |
| ✅ Verified | Local skill commands | Director evidence checker, gameplay scaffold, QA canvas inspector, 3D helper, audio helper, and both image helper `--help` commands completed. The image helpers' Python dependencies were installed through `uv`; no paid provider keys were used. |
| ✅ Verified | Keyless image workaround | The documented Pollinations helper returned a 768×768 guard concept without an API key. Inspection found a watermark and generic design, so the sample was discarded and not used in the game. |
| ✅ Verified | [VoiceStudio Electron installer](https://github.com/debpalash/VoiceStudio/releases/tag/v0.5.6) | Official v0.5.6 Windows installer SHA-256 matched the release digest; silent installer returned 0; installed `VoiceStudio.exe` reports version 0.5.6. |
| 🔍 Unverified | [VoiceStudio runtime and data migration](https://github.com/debpalash/VoiceStudio/blob/v0.5.6/docs/electron-migration.md) | The older Tauri v0.5.3 app remains running. Electron was not launched or pointed at that data. Official migration requires closing the old app, backing up data, then verifying voices/projects/history/models and a test clip. |
| ❌ Missing requirements | Premium presentation | Both opening and Floor One after scores fail the required ≥2 per category and ≥2.3 average. Further authored art, motion and UI work remains. |

The eight loaded sibling entrypoints were `threejs-gameplay-systems`, `threejs-aaa-graphics-builder`, `threejs-game-ui-designer`, `threejs-debug-profiler`, `threejs-qa-release`, `threejs-3d-generator`, `threejs-image-generator`, and `threejs-audio-generator`, all from this repository's `.agents/skills/` tree. Referenced phase documents actually loaded: [UI patterns](../.agents/skills/threejs-game-ui-designer/references/ui-patterns.md), [visual scorecard](../.agents/skills/threejs-aaa-graphics-builder/references/visual-scorecard.md), [authoring recipes](../.agents/skills/threejs-aaa-graphics-builder/references/authoring-recipes.md), [technical art](../.agents/skills/threejs-aaa-graphics-builder/references/technical-art.md), [shader cookbook](../.agents/skills/threejs-aaa-graphics-builder/references/shader-cookbook.md), [visual test harness](../.agents/skills/threejs-qa-release/references/visual-test-harness.md), [evidence manifest](../.agents/skills/threejs-game-director/references/evidence-manifest.md), [asset recovery](../.agents/skills/threejs-game-director/references/asset-recovery.md), and [audio workflows](../.agents/skills/threejs-audio-generator/references/audio-workflows.md).

# Director gap audit — paused 2026-09-23

This is a read-only assessment of the Omega intro, except for this handoff note. The exact skill requested for the assessment is `C:/Users/jesse/.agents/skills/threejs-game-director/SKILL.md`; use its sibling skills from that same directory. The repository copy of the director skill is separately modified in the working tree and is not the authority for this handoff.

## Starter script: what it actually provides

✅ `C:/Users/jesse/.agents/skills/threejs-gameplay-systems/scripts/create_threejs_game.py` copies a packaged Vite/Three.js arcade scaffold and rewrites the package name. Its template includes a `Game` class, input controller, loop, collision, audio tone helper, HUD, camera rig, seeded randomness, canvas inspector, and bot/visual test templates. It does **not** install a narrative event state machine, game-specific mechanics, Dreamweaver voice, or authored Omega content. The script rejects a nonempty target unless `--force` is used; `--force` copies over matching files. Do not run it over this existing project.

🔍 No run receipt for that script was checked, so this audit cannot prove whether it was ever invoked historically. The current `/intro.html` entrypoint constructs `BootScene`, not the template's `Game` class. The matching package scripts alone do not prove the scaffold was used.

## What is present now

✅ The committed intro on draft [PR #52](https://github.com/jessenaiman/omega-alpha-spiral/pull/52), local commit `4f571e9`, preserves the authored `ghost.json` boot and four Omega path questions through `src/intro/chronicle.ts`. Question five, the typed name, and the doorway phrase come from the owner's later direction. The path choice is made by physical contact; Rapier sensors, keyboard/gamepad intents, camera travel, automatic reading holds, and a Chapter Two crossing exist in `BootScene.ts`, `SpatialBootScene.ts`, and `IntroPhysics.ts`.

✅ `IntroAudio.ts` has a procedural Web Audio mixer with `ui`, `sfx`, `ambience`, and `voice` groups. `BootScene.ts` calls it for typing, Dreamweaver carriers, selection, travel, era, and threshold events, with gesture unlock and mute. Five Blender GLBs are mapped in [blender-runtime-map.md](blender-runtime-map.md); editable studies remain separate.

✅ The prior committed revision had a production build, real-input bot run through Chapter Two and retry, desktop/mobile named captures, and renderer diagnostics in [final-evidence.md](../final-evidence.md). Those checks do not cover the latest uncommitted preview work below.

## Gaps and misleading shortcuts to avoid

❌ **The live intro bypasses the existing scene architecture.** `src/core/host.ts`, `events.ts`, `loop.ts`, and `src/game/run-state.ts` contain a typed event bus, fixed-step host, and reducer, but `src/intro/main.ts` starts `BootScene` directly and imports only the core input controller. The intro advances a local `StoryMode` through assignments in a large `BootScene.ts`, and presentation/audio are called directly. There is no single event contract joining story rules, visuals, UI, and audio.

❌ **The existing reducer cannot simply be wired in.** `src/game/run-state.ts` describes one Omega opening question followed by three Dreamweaver question turns. The owner's current direction and `ghost.json` use four Omega-framed path questions; Dreamweavers offer paths/responses. Reconcile the reducer with the authored script before adopting the host. Copying its old sequence would erase the owner's creative decisions.

🔍 **Audio is functional but not a completed production pass.** The tone mixer is event-triggered, but no audio matrix, generated/recorded voice assets, Chapter Two event audio, or in-browser unlock/ambience/mute/retry audit was established in this assessment. The director's credential probe and the audio generator were not run in this pause pass. Do not imply that the starter script would supply those assets.

❌ **The game-design consequence is still thin.** The intro's routes can be reached and the bot can progress, but Chapter Two is a graybox. Its `thread` affects a final tie rule in `WalkField.ts`; the opening choice does not yet visibly reshape the first room or a meaningful early decision. The four later question stations have similar silhouettes. The avatar grows, but its final figure is a procedural blocky stand-in.

### Gameplay-systems skill check

✅ The three requested design artifacts exist: [design-brief.md](design-brief.md), [core-loop-contract.md](core-loop-contract.md), and [level-plan.md](level-plan.md). Their input/route/camera contract is partly implemented: the bot physically reaches strands, and Rapier's fixed-step kinematic body and active collision sensors detect contact. The opening deliberately has no death state; that alone is not a defect for a narrative choice sequence.

❌ The core-loop contract says the **first stage after the door owns pressure and failure**. `src/chapter-two/WalkField.ts` has no failure phase or cost/retry caused by play; its monster encounter auto-resolves after 1.2 seconds. The bot's retry verifies restart mechanics, not recovery from a meaningful setback. This is an explicit design-versus-runtime mismatch.

❌ The selected intro thread is carried into Chapter Two, but `WalkField.ts` only uses it to resolve a final score tie after three rooms. The player gets a visual imprint in the intro, yet their path choice does not presently alter the first room's layout, prompt, guide, objective, or risk. This weakens the skill's requirement that reward change state and that the space shape decisions.

🔍 The skill's feel criteria—visible input response within about 100 ms, contact timing, route readability in motion, camera keeping the next choice visible, and a human-readable first 30 seconds—have not been measured for the latest working tree. The prior bot and captures prove progression and some motion; they do not establish how the interaction feels to a person. Do not create unit tests as a substitute for that play check.

🔍 Determinism is partial. `IntroPhysics.ts` uses a 1/60-second Rapier step and the QA hooks seed named captures, but the intro's story progression and presentation still run in `BootScene`'s RAF path instead of the existing one-owner `createSceneHost` loop. Review the update order when aligning state/events; do not automatically replace authored story timing with the generic scaffold loop.

❌ **Visual/release bar remains unmet.** The last committed doorway does not show a legible next level; the mobile final doorway exceeded the skill's starting draw-call/geometry budget. No director 10-category premium scorecard or production-preview release check is in the committed evidence. The previous bot and manifest establish particular mechanics/captures, not aesthetic completion.

## Uncommitted doorway experiment at pause

🔍 Four implementation files are modified but **not committed or pushed**: `src/chapter-two/ChapterTwoScene.ts`, `src/intro/BootScene.ts`, `src/intro/IntroBlenderExtras.ts`, and `src/intro/SpatialBootScene.ts`. They render a still of the actual Chapter Two room onto a plane behind the Blender threshold, hide the portal's opaque backing/leaves, and start splitting the Blender door fragments sideways after the name is entered. The current working tree also has untracked `artifacts/intro-threshold-preview/` and `artifacts/intro-threshold-preview-2/` captures. A build passed before the last fragment-opening edit; no build, bot, mobile capture, or visual inspection was done after that edit. The preview captures before it still looked dim and hard to read. Treat this as an experiment to evaluate or revert, never as part of PR #52.

## Resume order for the next instance

1. Load the exact user-level director skill and affected sibling skills; read `ghost.json`, [next-conversation.md](next-conversation.md), and this audit. Preserve the already-working strand contact and authored text.
2. Inspect the uncommitted doorway experiment in a fresh browser view before retaining it. Make the actual next area legible through the opening, or revert the experiment cleanly. Keep the Blender source/export mapping intact.
3. Decide how to align `src/core/host.ts` and `src/game/run-state.ts` with the approved four Omega questions. Then give choice, travel, writing, audio, UI, and VFX one typed transition/event boundary; do not paste in the generic arcade scaffold.
4. Make a representative first playable area respond visibly to the selected thread. Refine station silhouettes and the faceless avatar at the actual gameplay camera scale.
5. Draw an audio-event matrix from those states and check whether procedural carriers, generated sounds, or recorded voices best serve the direction. Verify unlock, cue timing, ambience, pause, mute, and restart in the browser.
6. Follow the director/QA skills for the changed scope: production build, real-input bot progression/retry, affected desktop/mobile captures, renderer diagnostics, and motion inspection. Do not add or run unit tests without the owner's request. Update current-run evidence and the draft PR only after the result is reviewable.

The owner explicitly requested a pause for critical evaluation. Do not resume implementation until they ask.

# Omega Spiral — Game Director Progress

Updated: 2026-09-24

## Current task — Eight-floor era journey, issue #61

- Branch: `codex/omega-floor-arc` in an isolated worktree. This branch starts from the committed Floor One baseline; the separate issue #18 and #59 worktrees remain untouched.
- Owner direction: Floors 1–3 are Light, Shadow, and Ambition's three separately navigable Door/Monster/Chest choices; early combat death still advances. Floors 4–6 introduce telegraphed combat and basic Hit/Run, with victory or death advancing. Floor 7 is a varied-architecture town where the party gathers the Dreamweavers and faces garbage collectors. Floor 8 is the healing-core finale.
- The design manifest now links the new Floor 4 combat, Floors 5–6 combat-era, and Floor 7 varied-town concept studies. Those images are design targets, not captured game frames.
- Implemented in source so far: per-journey seeded physical exit slots across Floors 1–3 (`?seed=N` reproduces a layout); routes attach to safe physical slots; three physical exits per early floor; selected-exit crossing; early Monster `fallen` outcome; initial Three.js scene placement for Floors 2–3. Floor 4–8 layouts, combat/town state, procedural art kits, and scene handoffs are connected in source. Town paving now uses one flat Three.js texture with three era districts instead of hundreds of raised cobble cubes; the three party followers use non-cube silhouettes. The two-seed early-floor bot pass and repaired full intro-to-Floor-3 bot now verify real-input routes through the three early floors; Floors 4–8 remain unverified in live play.
- Verified this pass: `npm.cmd run build` and the documented `npm.cmd run test:bot` command passed (both bots); the focused run covered seeds 17 and 42 with zero recorded page, console, or network errors. [Report](qa-61/early-floor-bot-report.json), [video](qa-61/seeded-exit-bot.webm), and [declared capture set](qa-61/capture-set.md). The full bot also passed from Begin through intro questions, name, threshold, Floor 3 completion, and restart: 2,686 frames, 160.25 movement units, zero softlock windows. [Full-route report](intro-bot-playtest-report.json) and [video](qa-61/full-intro-to-floors-bot.webm). Shadow and Ambition action frames were inspected. Camera framing leaves large empty regions and can hide exit landmarks under the HUD.
- Next: review the actual Shadow and Ambition action frames with the owner, correct camera/readability against the approved study, then play Floors 4–8. The QA pass is mechanical coverage, not aesthetic approval or whole-game release verification.

## Earlier task — Floor One design integration, issue #18

- Branch: `codex/floor-one-design-integration-18` in the isolated `blender-reference-placement` worktree. OpenCode's issue #59 manifest/scorecard work remains separate.
- The approved [Stage 1 sparse visual](level-design/stage-1-atari-3d-starting-point.png) and [era progression sheet](level-design/era-progression-reference-draft.png) direct the current Light room and later floors. [Playable brief](level-design/floor-1-playable-brief.md) records the Three.js layout and visual continuation.
- The local Floor One page at `http://127.0.0.1:5210/` visibly loaded after the OML integration. The game build passed. The owner confirmed controller movement and the on-screen hint. The new authored choice writing and each matching physical exit are awaiting the owner's live walk-through; no full-game or aesthetic approval is claimed.
- Next: resolve that live result, review the frame against the approved art, and commit/push this isolated work. The sections below record older intro and setup work and are not certification of this Floor One pass.

## Historical setup task — 2026-09-23

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

- The September 22 Floor One rerun added inspector-compatible hooks, named capture states, and diagnostics in src/floor-one/capture-states.ts and src/floor-one/main.ts. That pass reported eight states, a clean typecheck, 23 unit checks, and inspector captures under artifacts/floor-one-hooks-20260922/. This is historical evidence, not a rerun today.
- Floor One has declared before/after capture sets. Its premium finish remains open.
  \

## Next

1. After the running Tauri app can be closed safely, back up its data and verify Electron's storage, backend health, and a local test clip. Keep the old app/data until that passes.
2. Review unscripted intro choices and the Chapter Two handoff in the visible browser to locate the player's reported friction; the bot verifies only one path.
3. Continue authored opening and Floor One graphics until the ten-category scorecard reaches the premium threshold, then recapture. The baseline and narrow UI-pass manifests are separate from the earlier full-run evidence.json.

Older design and implementation checkpoints remain in Git history. This file keeps current state only.

# Omega Spiral — Game Director Progress

Updated: 2026-09-23

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

- The September 22 Floor One rerun added inspector-compatible hooks, named capture states, and diagnostics in src/floor-one/capture-states.ts and src/floor-one/main.ts. That pass reported eight states, a clean typecheck, 23 unit checks, and inspector captures under artifacts/floor-one-hooks-20260922/. This is historical evidence, not a rerun today.
- Floor One has declared before/after capture sets. Its premium finish remains open.

## Next

1. After the running Tauri app can be closed safely, back up its data and verify Electron's storage, backend health, and a local test clip. Keep the old app/data until that passes.
2. Review unscripted intro choices and the Chapter Two handoff in the visible browser to locate the player's reported friction; the bot verifies only one path.
3. Continue authored opening and Floor One graphics until the ten-category scorecard reaches the premium threshold, then recapture. The baseline and narrow UI-pass manifests are separate from the earlier full-run evidence.json.

Older design and implementation checkpoints remain in Git history. This file keeps current state only.

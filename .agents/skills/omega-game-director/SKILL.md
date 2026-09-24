---
name: omega-game-director
description: "Entrypoint for building, upgrading, and finishing the omega-alpha-spiral Three.js game in this repo. Routes work to project skills and commands, honors the handoff gate, and verifies with browser evidence. Use for build, upgrade, polish, debug, QA, or release work here. Supersedes threejs-game-director for this repo."
---

# Omega Game Director

Own the outcome in this repo: handoff first, then a playable change, then browser evidence it works.

## 0. Handoff gate — before anything

1. Read `project-management/STATUS.md` and `project-management/BOARD.md`.
2. Match this branch to its issue; read `Handoffs/<issue-id>.md`.
3. Report task, branch, last result, next step; ask the user if it is current.
4. Read all five production skills below before a substantial build; read only the needed one for a narrow edit.

## 1. Scope

5. The user's own words set the bar: "premium / AAA / polished / high-fidelity / showcase / release-ready" means the full pipeline; a narrow edit stays narrow.
6. Honor prior decisions and constraints; `$ponytail full` per CONTEXT.md keeps the change minimal.

## 2. Route — `.agents/skills/<skill>/SKILL.md`

| Phase | Skill |
| --- | --- |
| loop, input, camera, physics, feel | `threejs-gameplay-systems` |
| materials, shaders, VFX, lighting, scorecard | `threejs-aaa-graphics-builder` |
| HUD, menus, overlays, touch UI | `threejs-game-ui-designer` |
| render/runtime bugs, mobile input, profiling | `threejs-debug-profiler` |
| QA, screenshots, canvas pixels, bot playtest, release | `threejs-qa-release` |
| models, rigs, animation | `threejs-3d-generator` |
| concepts, textures, skies, GUI art | `threejs-image-generator` |
| SFX, ambience, voice | `threejs-audio-generator` |
| scene discipline for this repo | `stack` |

For complete games and broad upgrades read all five production skills before implementing, plus generators whose trigger surfaces exist. Read each phase's required references at phase entry. A phase label is not a skill invocation — record what was actually loaded.

## 3. Build & run

7. `npm run dev` → open `http://127.0.0.1:5188/<page>.html?debug` (pages: `index`, `intro`, `floor-one`, `rogue`, `basic`, `lab`, `intro-strands-shader`, `intro-try3`).
8. `npm run typecheck` after each edit.
9. `npm run test:unit` after logic changes; `npm run test:bot` after gameplay/input changes (Playwright, `--workers=1`).

## 4. Assets

10. Keys probe: `bash .agents/skills/threejs-game-director/scripts/probe_asset_credentials.sh` → TRIPO/GEMINI/ELEVENLABS all MISSING (exit 0). Image generation ruling (Handoffs/32.md): ChatGPT/OpenAI (Sol or Luna — favor Luna), never Pollinations; image_gen happens outside these skills. Voice: VoiceStudio per AGENTS.md (replaces ElevenLabs). Procedural WebAudio is fine without keys.
11. Blender MCP is project-local (`opencode.json`, `BLENDER_MCP_PORT=9876`): GUI `blender.exe <file>.blend` (add-on autostarts ~1 s); headless `blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py`. Server port must equal client port.
12. Before external asset jobs read `threejs-game-director/references/asset-recovery.md`.

## 5. Continuity

13. Substantial work → maintain `artifacts/game-progress.md`: intent, decisions, done, pending jobs with task IDs, defects, next; re-read after interruption.

## 6. Evidence — mandatory for substantial work

14. Declare capture set in `artifacts/evidence.json` (schema in `threejs-game-director/references/evidence-manifest.md`).
15. `npm run inspect:canvas` → captures (`scripts/inspect-threejs-canvas.mjs`, `--url`, `--state`, `--mobile`).
16. `npm run verify:visual` → wrapped `check_evidence.py --manifest artifacts/evidence.json --report artifacts/final-evidence.md`.
17. Write `artifacts/final-evidence.md`; link assets/captures; report what ran and what was observed. A completion claim is not evidence.

## 7. Final response

18. Lead with outcome: what works, local URL, controls, limitations; link evidence.
19. Update `Handoffs/<issue-id>.md` before stopping.
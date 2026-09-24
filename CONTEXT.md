# Omega Spiral

**Story**: `C:\SpiralDrive\omega-docs\src\content\docs\storyboard`
**Creative**: /threejs-game-designer, /threejs-aaa-graphics-builder (research the latest ways to not rely on a 3d party and still deliver something creative)

Omega has a backstory you will never make up and exists in 

- Each dreamweaver represents the whole of Omega (a fact that the game does not, and must not reveal)
  Each scene the dreamweavers challenge the player and offer 3 choices that represent one of the 3.

## Game Design
You are building the demo of a larger game that comprises of 5 stages and multiple levels per stage.

You are fixing the past agents failure to follow /threejs-director or to carefully check and understand the game 

## Language

**THERE ARE THREE Dreamweaver**:
Light, Shadow, and Ambition: each competing to be the one that leads the player; never revealing their motivation to the player
_Avoid_: Echo, shard, persona, narrator, "echo of Light"

**Light**:
The Dreamweaver of order and lawfulness. Straight, purposeful lines; white-blue.
_Avoid_: Luminari, Luminary, LIGHT
Code id: `luminary`

**Shadow**:
The neutral and ambivalent Dreamweaver. Sharp, angular lines; yellow-gold.
_Avoid_: Mischief, Trickster, SHADOW
Code id: `shadow`

**Ambition**:
The Dreamweaver of opportunity, potential, and possible greed. Smooth, circular paths that turn back on themselves; crimson-red.
_Avoid_: Wrath, MISCHIEF, WRATH
Code id: `ambition`

The game context for this repository: a browser game in which a player answers a broken machine's questions, and the world those questions build collapses and restarts.

## Operator instructions

This is **Omega Spiral**, a Vite + TypeScript + Three.js browser game. Work on the game requested by the user; do not turn creative iteration into test, tooling, dependency, documentation, or project-management work.

### Agent tooling — threejs skills & Blender MCP

This project owns its agent skills and its Blender MCP config; neither depends on global installs.

- **Threejs skills (9) + `stack`** are git-tracked in `.agents/skills/`. Source is `majidmanzarpour/threejs-game-skills` (upstream unified 2026-09-05; this copy is current). OpenCode auto-discovers `.agents/skills` and the project copy overrides the global `~/.agents/skills` copy. Preserve local edits (`.agents/skills/threejs-game-director/SKILL.md`); refresh by re-copying from upstream, never by deleting tracked files.
- **Blender MCP** is wired project-local in `opencode.json` → client `C:\Users\jesse\.local\bin\blender-mcp.exe` (uv tool `blender-mcp` v1.0.3) with `BLENDER_MCP_PORT=9876`. The client port must equal the Blender add-on preference port (`bl_ext.user.default.mcp` v1.0.3, add-on archive `mcp-1.0.3.zip`, Auto Start on). Probe with `opencode mcp list`; a `Blender connection timed out at localhost:<port>` message means Blender is not running with the auto-started server.
- Launch Blender with the server: GUI `blender.exe <file>.blend` (add-on autostarts, ~1 s); headless `blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py`. The server port must equal the client's `BLENDER_MCP_PORT`.
- Other harnesses keep their own independent Blender entries: Claude Code (`~/.claude.json`, same exe) and Codex (`~/.codex/config.toml`, `uvx mcp-for-blender`). Each client must match the add-on port; they do not need to match each other.

### RULES

`AGENTS.md` and this file are supplied context. Before answering, or thinking about a solution:

1. ALL relevant `threejs-*` `SKILL.md` must be fully read and any missing instructions or features (not the API missing ever) must be addressed and the confusion cleared immediately

Ask before reading anything beyond the user skills. Ask the user for exact file paths; do not scan the repository; instead as the user 3 questions

### Skill invocation

Use these names in a Codex prompt:

- `$threejs-game-director` — route a game build or broad upgrade.
- `$threejs-gameplay-systems` — movement, input, choices, objectives, camera, game feel.
- `$threejs-aaa-graphics-builder` — geometry, materials, shaders, lighting, VFX.
- `$threejs-game-ui-designer` — HUD, menus, overlays, responsive game UI.
- `$threejs-audio-generator` — runtime audio and sound assets.
- `$threejs-debug-profiler` — only after a reproduced runtime/render/performance failure.
- `$threejs-qa-release` — only for the user-approved verification scope or a release.
- `$ponytail full` — keep the requested change minimal; do not optimize unrelated findings.

Read the named skill before acting. A skill label is not proof it was followed; cite the exact skill line that authorizes each QA, debug, dependency, or release action.


# Omega Spiral

The game context for this repository: a browser game in which a player answers a broken machine's questions, and the world those questions build collapses and restarts.

## Operator instructions

This is **Omega Spiral**, a Vite + TypeScript + Three.js browser game. Work on the game requested by the user; do not turn creative iteration into test, tooling, dependency, documentation, or project-management work.

### Agent tooling — threejs skills & Blender MCP

This project owns its agent skills and its Blender MCP config; neither depends on global installs.

- **Threejs skills (9) + `stack`** are git-tracked in `.agents/skills/`. Source is `majidmanzarpour/threejs-game-skills` (upstream unified 2026-09-05; this copy is current). OpenCode auto-discovers `.agents/skills` and the project copy overrides the global `~/.agents/skills` copy. Preserve local edits (`.agents/skills/threejs-game-director/SKILL.md`); refresh by re-copying from upstream, never by deleting tracked files.
- **Blender MCP** is wired project-local in `opencode.json` → client `C:\Users\jesse\.local\bin\blender-mcp.exe` (uv tool `blender-mcp` v1.0.3) with `BLENDER_MCP_PORT=9876`. The client port must equal the Blender add-on preference port (`bl_ext.user.default.mcp` v1.0.3, add-on archive `mcp-1.0.3.zip`, Auto Start on). Probe with `opencode mcp list`; a `Blender connection timed out at localhost:<port>` message means Blender is not running with the auto-started server.
- Launch Blender with the server: GUI `blender.exe <file>.blend` (add-on autostarts, ~1 s); headless `blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py`. The server port must equal the client's `BLENDER_MCP_PORT`.
- Other harnesses keep their own independent Blender entries: Claude Code (`~/.claude.json`, same exe) and Codex (`~/.codex/config.toml`, `uvx mcp-for-blender`). Each client must match the add-on port; they do not need to match each other.

### Read order — five files maximum

`AGENTS.md` and this file are supplied context. Before editing, read only:

1. `project-management/STATUS.md`
2. `project-management/BOARD.md`
3. the matching `Handoffs/<task-id>.md`
4. one relevant `threejs-*` `SKILL.md`
5. one reference explicitly required by that skill

Ask before reading anything else. Ask the user for exact file paths; do not scan the repository.

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

### Run the game

From `C:\SpiralDrive\omega-alpha-spiral`:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5188/intro.html?debug
```

To use the current alternate review port:

```powershell
npm run dev -- --port 5199
```

```text
http://127.0.0.1:5199/intro.html?debug
```

### Test commands

Basic intro browser check, visible Chromium:

```powershell
npm run test:browser -- tests/browser/intro.spec.ts --headed
```

Unit tests only:

```powershell
npm run test:unit
```

All existing tests — run only when the user explicitly requests the full suite:

```powershell
npm test
```

Current-view Three.js canvas inspection without named-state, bot, or visual-regression suites:

```powershell
npm run inspect:canvas -- --url http://127.0.0.1:5188/intro.html?debug --run-id manual-smoke
```

Agents run one smallest relevant existing test command once after changing the game. For intro/browser work, run only `npm run test:browser -- tests/browser/intro.spec.ts`; for pure logic, run only `npm run test:unit`. Stop at the first failure and report the command, exit code, failing test name, and first actionable error. Do not use watch mode, rerun unchanged failures, read entire logs, run `npm test` for a narrow change, repair unrelated failures, or add tests unless the user explicitly requests that exact work. Default acceptance remains: the URL responds, the page is visible, and the game starts.

## Demo Game Loop

Omega has managed to cobble together some game code from the earliest days of the computer and boots up a script that's been on a loop for a long time. The players are introduced to 3 unseen dreamweavers who pose existential and alignment questions

- Each dreamweaver represents the whole of Omega (a fact that the game does not, and must not reveal)
  Each scene the dreamweavers challenge the player and offer 3 choices that represent one of the 3.

## Language

**THERE ARE THREE Dreamweaver**:
Light, Shadow, and Ambition. Fragments of Omega's shattered soul, each believing itself the real guide, competing to be the one that leads the player.
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

**NOTE**

- Only one dreamweaver can eventually be bound to the players
- The dreamweavers are not bound during the beginning scenes

**Dreamweaver Rules**

- There are exactly three Dreamweavers.

**Identity colour**:
A Dreamweaver's canonical colour, taken from the logo's palette. Only these three carry identity. Any other colour is illumination or glow at low opacity, never identity.
_Avoid_: accent colour, theme colour, thread colour

**Ghost typing**:
Visible arrival, hesitation, correction, and revision of a speaker's words. Its rhythm and spatial arrangement convey the speaker before a face is shown.

**Authored revision**:
A deliberate replacement or retraction of words, distinct from an accidental character typo. A displayed revision does not itself establish that Omega is present or aware.

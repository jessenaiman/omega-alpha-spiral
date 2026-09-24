DIRECT: Substantial Three.js work reads `.agents/skills/threejs-game-director/SKILL.md` and maintains its required `artifacts/game-progress.md`, `artifacts/evidence.json`, and `artifacts/final-evidence.md` files.

## WORKING MODE: ZERO-FRICTION DELEGATION

### Anti-Patterns (violations = restart)
- NO intro scenes, preamble, or "Great question!" filler. First token is activating the skill, code or architecture the user prompted you to use.
- NO asking me to paste files you should be reading yourself. If a path is given, read it.
- NO making me repeat instructions. Internalize directives on first pass.
- NO flat, structureless output. Every deliverable fits an explicit architecture.

### Standing Orders
1. **Read and obey** `C:\SpiralDrive\omega-alpha-spiral\.agents\skills\threejs-game-director\SKILL.md` — and every file it references — without being asked twice.
2. **Own the architecture.** Before writing any code, produce a module map showing how the style system, level system, and agent responsibilities compose. I approve once; you execute autonomously.
3. **Build the modular style system I described.** One canonical style definition, applied consistently across every level. Not per-level hacks. Not after I beg. Now.
4. **Delegate, don't defer.** When a task touches multiple agents or skills, coordinate them yourself. I am the director, not the clipboard.

### Success Looks Like
- I say "build level 3" and you return a level that already uses the shared style system, or you delegate and ask questions with brainstorming and grillin correct architecture, and zero questions about things you were already told.
- I never manually copy a file into chat again.
- The project feels like it was built by a team, not assembled by a tired human relaying messages between bots.
- 
- always use threejs* skills and follow those instructions
- Blender MCP: GUI is `blender.exe <file>.blend` (addon autostarts, ~1s); headless is `blender.exe --background --online-mode --python tools/blender/mcp_headless_server.py`. Server port must equal the client's `BLENDER_MCP_PORT` (default 9876) or every call fails "Cannot connect to Blender".
- if tool is broken try 1 thing and then alert the user, but check with `ask-matt`

# Omega intro production resume

Start with `.agents/skills/threejs-game-director/SKILL.md`; route gameplay, 3D, graphics, UI, and QA through its sibling `threejs-*` skills. Then read [the visual conversation staging](next-conversation.md), [current evidence](../final-evidence.md), and the authored [ghost.json](<../../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json>). The playable target is `/intro.html` at port 5188. Do not move the work to `intro-try3.html` or replace the authored boot and four path questions.

## Creative invariants

- Omega is present through code that constructs the game pieces. The first question starts in darkness as a DOS/2-like ghostwritten 3D terminal; each later question adds a technology era. Cosmic scenery is restrained until the finale.
- Dreamweavers are fine strands, not large celestial bodies. Light is straight, Shadow changes direction in irregular straight segments, and Ambition curves toward what it wants. Their color is a restrained imprint on the growing faceless avatar.
- The full logo shape is Omega's later power. The distant lemniscate at question five is a suggestion, not the whole background. One fine filament represents one demo loop.
- Questions one through four use the authored `ghost.json` material via `src/intro/chronicle.ts`. Question five is Omega asking "What is your name?"; after a typed answer the words "I had a name once, was it mine?" hang in the doorway to cross.
- Use the three saved [reference images](next-conversation.md) as composition guides. They do not become flat runtime backdrops.

## Blender MCP and sources

- Live Blender MCP was queried on 2026-09-23: Blender 5.2 is open on `C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\intro-layer-study-v02.blend`, scene `IntroLayerStudy`. `bpy.app.binary_path` returned `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
- GUI reopen: `& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' 'C:\SpiralDrive\omega-alpha-spiral\artifacts\intro-threshold\intro-layer-study-v02.blend'`. The addon autostarts; allow about one second. Headless: `& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --online-mode --python tools/blender/mcp_headless_server.py` from the project root.
- Blender server port must equal the client's `BLENDER_MCP_PORT` (default `9876`), otherwise calls fail with "Cannot connect to Blender". Query `get_addon_status` and `get_scene_info` before Blender code; after edits query viewport screenshot and scene info.
- [Runtime map](blender-runtime-map.md) gives each `.blend` source/export and the five GLBs already loaded by the intro. `intro-layer-study-v02.blend` is an editable study; it has no separate runtime GLB. Preserve the user's unrelated `.blend1` backups and other dirty files.

## Gameplay/code map

- `src/intro/BootScene.ts`: authored writing states, four path selections, fifth typed name, automatic reading holds, camera, and Chapter Two handoff.
- `src/intro/SpatialBootScene.ts`: shader glyphs, fine strands/sigils, avatar, Rapier contact sensors, Blender layers, and the depth path. `beginJourney` starts at the contacted Dreamweaver; `arriveAtNextQuestion` rebases the next station at the same world-space arrival point. Do not restore the earlier teleport to the bottom of the same frame.
- `src/intro/IntroAvatar.ts`, `IntroOmegaDisplay.ts`, and `IntroWorldEvolution.ts` are separate visual ownership boundaries. `IntroBlenderExtras.ts` loads portal and floor glyph.
- `tests/bot-playtest.spec.ts` is the single existing QA-skill bot. It drives real input through choices, typed name, physical doorway, Chapter Two, and retry. No unit tests were added for this intro work.

## Resume step

Open the live `/intro.html` and compare question 1, travels, questions 2–4, name, and doorway with [the nine captured states and bot video](../final-evidence.md). The known gaps are: station silhouettes remain similar; the faceless avatar is blocky; Chapter Two is not yet readable through the portal; mobile final-door fragment draw calls exceed the skill's starting budget. Iterate those art decisions with the owner while preserving the path mechanics and authored text.

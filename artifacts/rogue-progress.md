# Rogue Descent — game progress

A **learning slice**: a small Nethack-style roguelike at `/rogue.html`, built to learn the `threejs-*` skill suite and a Blender-authored asset pipeline. It is a learning game, in the same family as Spiral Breaker — **not part of the main game** (Omega Spiral / Scene 1).

Owner: Jesse. Builder: agent. Started 2026-09-18.

## Skills actually loaded

| Skill | When | Notes |
|---|---|---|
| `threejs-game-director` | start | entrypoint / routing |
| `threejs-gameplay-systems` | start | core loop, entities, camera, feel |
| `stack` | start | this repo's Three `0.186.0` scene discipline, learnings.md |
| `brainstorming` | before build | classification + approval gate |
| `threejs-aaa-graphics-builder` | presentation | materials/lighting/scorecard |
| `threejs-game-ui-designer` | HUD | |
| `threejs-qa-release` | verify | build + canvas capture |

## Design brief

- **Player promise (one sentence):** step into a tiny procedurally-built dungeon and find the stairs before what waits in the dark finds you.
- **Target feeling:** deliberate, readable tension — the whole game is on screen at once, and every single step is a decision.
- **Primary verb:** step (move one tile).
- **Secondary verbs:** attack (step into a monster), descend (step onto the stairs), rest/wait (skip a turn).
- **Repeat every 5–30s:** reveal a new tile, or a monster takes its turn.
- **Changes across 1–5 min:** floor clears → stairs found → descend; each depth is larger and carries more monsters.
- **Lose / learn / restart:** HP reaches 0 → death log names what killed you → `R` restarts in well under a second.
- **Rewarded / risk:** reaching the stairs and a rising depth counter are the reward; monsters are the risk, and stepping is what triggers them.
- **Better player:** fights in corridors one at a time, never steps into open rooms with two adjacent monsters, baits monsters into chokepoints.
- **How the next decision is communicated:** the map itself (visible tiles, visible monsters), one HUD log line, and an HP readout.
- **Non-goals (this slice):** inventory, items beyond a heart pickup, ranged attacks, classes, character progression, save/load, more than one monster kind, fog of war.

## Core loop contract

> Player **steps one tile** to **explore the floor and find the stairs** while **every step lets each monster take a turn**, creating **the risk of being surrounded**; success **reveals the map and descends a level**, failure **costs HP and eventually ends the run**, which **restarts instantly with a new seed**.

Proof obligations (each must be true in code before the slice is "done"):

| Clause | How it is proven |
|---|---|
| verb is real input | WASD / arrows / numpad map to a single-step intent; one press = one turn |
| objective is visible | stairs tile is on the map; depth + "stairs N tiles away" in the HUD log |
| pressure inside the first minute | floor 1 spawns ≥1 monster near the player's room |
| reward changes state | descending increments `depth`, regenerates the floor, keeps HP |
| failure teaches | death log line names the killer and the final tile |
| restart is fast | `R` resets to a fresh seeded floor in one keypress |

## Level plan

- **Spatial format:** a fixed grid (21×15 base, +2 per depth, capped) of rooms joined by corridors. Tiles are `floor | wall | stairs`.
- **Camera:** fixed orthographic, angled top-down — the whole floor is always visible, so the only hidden information is what the next step reveals.
- **Start / first decision:** player spawns in the first room; the first decision is the first doorway.
- **First threat:** the nearest monster to the start room on floor 1.
- **First reward:** the stairs tile.
- **Landmarks:** rooms read as open light plates; corridors read as tight dark cuts; stairs pulse.
- **Escalation:** monsters per floor = `1 + depth`; each monster has fixed HP and melee damage.
- **Recovery beat:** a single heart pickup heals on contact (optional stretch).
- **Telegraphing:** monsters are always visible on their tile; adjacent monsters highlight.
- **Modular pieces:** every tile + actor is a named mesh in one Blender GLB.

## Architecture

Mirrors the Spiral Breaker split, on the shared `src/core/` scaffold.

```
rogue.html                    new entry -> src/rogue/main.ts
src/rogue/
  main.ts                     wire host + presentation
  host.ts                     input intents -> turn queue, diagnostics, acceptance
  game/                       pure, testable, no Three.js
    dungeon.ts                seed -> grid (rooms + corridors)
    rules.ts                  step(): player turn, then monster turns
    tuning.ts
    index.ts
  present/
    renderer.ts               one renderer + ortho camera
    tiles.ts                  GLB kit -> instanced dungeon
    actors.ts                 hero + monsters
  ui/hud.ts                   log + HP/depth
  styles.css
assets/rogue/dungeon-kit.glb  authored in Blender, exported headless
tools/blender/build_rogue_kit.py
```

Randomness routes through `src/core` `createRng(seed)` — no `Math.random`, so the deterministic acceptance hooks keep working.

## Progress log

- **2026-09-18** — approved the slice; loaded the skill suite; read repo conventions; started design artifacts.

## Next actions

1. Blender kit → `assets/rogue/dungeon-kit.glb`.
2. Scaffold `rogue.html` + vite input.
3. Pure dungeon + rules + unit tests.
4. Presentation, HUD, host.
5. Verify (typecheck / unit / browser capture / metrics) and record evidence.

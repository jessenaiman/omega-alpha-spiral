# Floor One — Design Brief

Scope source: GitHub #18 (spec) and slices #19–#26. Written 2026-09-22 as part of
a full Game Director rerun. Rules live in `src/game/floor-one.ts`.

## Player promise

Boot into one broken routine — a low-poly dungeon standing on a live code
substrate — and find one of three ways past the Threshold Guard before it
overwrites you.

## Target feeling

Cramped, deliberate, early-PC menace. The dungeon waits while you think; every
spent turn is a visible decision. Code and rendered world are one system, not
two visual modes.

## Primary verb

**Step** one tile (arrow/WASD). The dungeon is turn-based: your action spends
the turn, then the guard phase resolves.

## Secondary verbs

- **Talk** (`T`) — adjacent; changes guard disposition or opens the door.
- **Hit** (`H`) — adjacent; seeded hit/miss, damage, HP, death of the guard.
- **Run** (`Shift+dir`) — repeats turn-costing steps until threat, interest,
  or obstacle stops it.
- **Wait** (`Space`), **Inspect** (`I`, free), **Retry** (`Enter`),
  **New Run** (`N`).

## What the player repeats every 5–30 s

Read one log line, reveal one more region of the floor, spend a turn moving
toward a chosen exit while re-reading the guard's disposition.

## What changes across 1–5 minutes

The map becomes known (unknown → remembered → visible); the guard's
disposition walks neutral → friendly/suspicious → hostile; the door, pickup,
and stairs states resolve into one of the three endings.

## How they lose, learn, restart

HP reaches 0 → the log names what hit you → `Enter` retries the identical
seed, `N` starts a new seed. Failure teaches because every damage event has a
named cause and a turn count.

## Reward and risk

An exit opens the floor (stairs end the demo). Risk: every turn spent waiting
or exploring lets a hostile/suspicious guard close distance and strike.

## What a better player does differently

Reads distance to the three exits and picks talk vs. hit vs. the long way
round instead of wandering; spends turns only when the guard is neutral or out
of sight.

## How the next decision is communicated

Map state (glyph + low-poly + wireframe), one newest log line, HUD objective,
and the guard disposition readout — nothing overlaps the grid decision.

## Non-goals for this slice

Extra floors, hunger/inventory depth, Rapier/continuous physics (tile-based
only), touch gameplay (mobile is a review layout only), external 3D/image
generation (credential probe returned all keys MISSING; local procedural and
Blender routes only).

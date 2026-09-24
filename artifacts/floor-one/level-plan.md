# Floor One — Level Plan

Map: the one authored 21 × 12 grid in `src/game/floor-one.ts` (`FLOOR_ONE_MAP`).

## Spatial format and camera

- One authored ASCII grid rendered in three aligned forms: low-poly geometry,
  wireframe structure, and stable glyphs on the substrate plane.
- Fixed three-quarter camera; the whole floor stays readable. No orbit, no
  follow, no fog hiding the grid.

## Landmarks (glyph → form)

`@` player · `G` Threshold Guard · `#` wall · `.` floor · `+` sealed door ·
`*` echo shard (pickup) · `>` exit stairs.

## Route reading

- **Start:** (1,1) top-left, safe, sight radius 7.
- **First decision (first 30 s):** which way — down the left column toward the
  pickup alcove, or east toward the guard and sealed door.
- **Pickup alcove:** room at x4–6 / y4–6, entered from the y5 corridor at x7–8;
  reachable without passing the guard (safe reward).
- **First threat:** the guard at (9,5) in the door corridor, visible from boot.
- **Threshold:** the sealed `+` door at (10,5) — the chokepoint.
- **Three ways past:** Talk (disposition → friendly opens it), Hit (kill the
  guard, 4 HP, it opens), or the long way round (south corridor y9/y10 → east
  half → stairs), which the log explicitly names when the door blocks you.
- **Exit:** `>` stairs at (18,5).

## Escalation

Escalation is the guard's disposition ladder, not spawn waves: neutral
(watches) → suspicious (pursues, strikes) → hostile (pursues on sight), with
HP 6 and 1 damage per contact. Run resolves up to 8 steps and stops for
threat, interest, or obstacle.

## Recovery beats

The open south corridor keeps every route reachable; the echo shard heals 2 HP
once; waiting never advances the guard unless it already chases.

## Telegraphs

Guard glyph colored by disposition, one log line per event, HUD threat
readout, no hidden damage.

## Modular pieces

Grid, tiles, actors, exits, log, seeded RNG — all consumed through the single
`stepFloor` transition.

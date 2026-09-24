# Floor One — Core Loop Contract

> Player **steps one tile** to **reach the exit stairs** while **the Threshold
> Guard's disposition and turn-linked pursuit** create risk; success **opens
> the door or bypasses it and ends at the stairs**, failure **costs HP to 0 and
> ends the run**, which **retries the same seed instantly**.

## Proof clauses → code

| Clause                                           | Proof location                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Verb mapped to real input                        | `src/floor-one/main.ts` keydown → `Intent` (`move`/`run`/`talk`/`hit`/`wait`/`inspect`)              |
| Objective visible in world or HUD                | `>` stairs tile in world + `[data-objective]` in `floor-one.html`                                    |
| Pressure exists inside the first playable minute | Guard spawns visible from boot at (9,5); `guardPhase` strikes on adjacency (`src/game/floor-one.ts`) |
| Reward changes state, not only visuals           | Stairs set `outcome = 'escaped'`; pickup mutates `hp`; door mutates `doorOpen`                       |
| Failure teaches what happened                    | `resolveTerminal` names the cause: "The Threshold Guard ends you."                                   |
| Restart fast enough to invite another attempt    | `retry` intent rebuilds from the same seed in one keypress                                           |
| Information actions cost no turn                 | `inspect` returns before `spendTurn`                                                                 |
| Determinism                                      | All randomness through `createRng(seed)`; seed + input sequence replays                              |
| One transition seam                              | `stepFloor(state, intent) -> { state, events }` — presentation, UI, audio, VFX, tests consume it     |

## Turn order (fixed)

validate intent → player action → feedback events → guard phase → visibility /
memory recompute → terminal outcome → present.

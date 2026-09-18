---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral — Status

| Field | Value |
|---|---|
| Current release | **Scene 1 — Ghost Terminal** (the Alpha 0.1 / 0.2 split is retired; releases are scenes) |
| Gate | — (no gate set; see Gate history) |
| Doing | *(nothing creative in flight)* **Boot — wire the host into `src/main.ts`** · GitHub issue **#11** · Hermes card **`t_f1153b09`** → `omega-game-director`. Boot and wiring are integration work, which the director skill keeps with the lead |
| Done | **`t4` Scene 1 · Foundation** — commit `72e976c`, 17 files, 2155 insertions; **50/50 tests, typecheck and build clean, RED contract byte-identical**; pushed, draft **PR #10** open · **`t11`** Blender MCP installed and verified |
| Blocked | `t12` — blocked by **`omega-project-librarian`'s own dead OpenRouter credential** (verified `HTTP 401: User not found`), not by its work. `t5`–`t8` had their `t4` gate satisfied but wait on undecided design. `t9` on the scene tasks. `t10` and `t1` on the owner's rulings |
| Open with the owner | **A/B/C** console presentation · the **`t8`** audio source · the boot's four undecided details and the seven grill questions (all recorded, all unadopted) · the flagged **scoring contradiction** in `t4` · whether the PR gate's GitHub-issue requirement applies to creative work |
| Faults | Diagnosed and **closed**: the 401 cascade resolved to **five distinct faults** (`t_c0846019` → `buzz`, full root cause on the card). Two remain the **operator's**: refresh `omega-project-librarian`'s own credential; add a `fallback_model` so a dead key cannot kill a worker |
| Last evidence | 2026-09-18 — **the first push this repository has ever had.** `main` → `858e1f5`, foundation → `wt/t_baf85a0e`, **draft PR #10** open. Board, tickets, and cards reconciled to reality |
| Updated | 2026-09-18 |

## Pipeline

`t3` (the Scene 1 spec) is decomposed into `t4`–`t10`. Wave order is `t4` → (`t5` ∥ `t6`) → (`t7` ∥ `t8`) → `t9`, at most two workers at a time, with `t10` running on the owner's rulings whenever they land.

## Gate history

- **2026-09-16** — Tracker created under `Project Management\Omega Spiral\`. Carried no gate verdict forward: the prior `Projects\omega-spiral` tracker recorded `DESIGN BLOCKED` on 2026-09-15, but that tracker now sits inside read-only `Projects` and is format precedent only. Repo authority for the current gate is `docs\superpowers\specs\` and `docs\superpowers\plans\` in the repository.
- **2026-09-17** — **Scope change.** The Alpha 0.1 / Alpha 0.2 boundary was retired by the design owner. Releases are now one epic scene at a time; Blender is a live tool rather than a later milestone. The release tag vocabulary moved from `omega-spiral/alpha-01|02` to `omega-spiral/scene-NN`.

## How this file is maintained

Update the table when the active release, gate, or blocker changes. Add one line per gate change under Gate history. Never delete a history line — this is the record of what was decided and when. Keep the header table to one row per field.

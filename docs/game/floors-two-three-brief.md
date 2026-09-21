# Floors 2–3 — Echo Descent brief (graybox slice)

## Design brief

- **Player promise:** "Each floor Omega rewrites is more alive than the last — and it keeps handing me new ways to survive it."
- **Target feeling:** descending into a machine's improving memory; curiosity, then competence.
- **Primary verb:** move + interact (E). **Secondary verbs introduced per floor:** read the rewritten script (floor 2), **attack** (floor 2 script unlocks it; floor 3 demands it).
- **Repeated every 5–30s:** approach an object, choose/act, watch the floor rewrite.
- **Changes across the slice:** floor 1 combat is impossible (auto-defeat teaches loss); floor 2's rewrite text announces the attack action; floor 3 monsters require strikes. Visual clarity rises each floor while deliberate glitches remain (Omega's difficulty).
- **Lose/learn/restart:** defeat is never death — it resolves to a result that feeds the rewrite and advances the run. Restart (R) is instant.
- **Reward/risk:** attunement points accrue silently per choice; risk is spending the encounter on the wrong object while the monster closes.
- **Better player:** reads the script preview during rewrite, prioritizes the door, attacks promptly when unlocked.
- **Non-goals this slice:** Stage 3 content (awaiting direction), real health/inventory, touch controls, final art.

## Core loop contract

Player moves (WASD) to reach objects and presses E to interact, under a visible monster threat; interacting resolves to a result, continuing triggers the floor rewrite; success (or defeat) always advances the run — the rewrite preserves choices and applies the next script. Each clause maps to code: movement = `WalkField.update`, objective = object labels/HUD, pressure = proximity + fight timer, reward = choices/attunement accumulation, failure = defeat result (no death), restart = R/start().

## Encounter plan

| Floor | Owner | Objects | New capability | Visual step |
|---|---|---|---|---|
| 1 (exists) | Light | door / monster / chest | none — monster auto-defeats you | baseline graybox |
| 2 | Shadow | same kinds | **attack unlocked** (script says so); 1 strike wins | +pillars, warmer palette, emissive chest |
| 3 | Ambition | same kinds | attack now needs **2 strikes**; timer shorter | +crates/glow, brightest palette, scanline defect |

Landmarks are the labeled D/M/C props; hazards (monster) are always visible and labeled. Escalation is per-floor capability + timer, not maze complexity.

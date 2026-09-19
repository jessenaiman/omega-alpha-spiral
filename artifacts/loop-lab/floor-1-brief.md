# Loop Lab — Floor 1 (crude first pass)

Iteration on the existing repo, not a new scaffold. Runs beside the other pages.
No Blender in this delivery. No glitch/asset-swap reveal yet — that is the end goal.

## Design brief

- **Promise:** boot into one broken routine and find one of three ways out before it overwrites you.
- **Feeling:** cramped, crude, early-PC. A terminal that should not still be running.
- **Primary verb:** step (one tile). **Secondary verbs:** open, strike, answer.
- **Every 5–30s:** reveal a tile, read the log, pick a direction toward an exit.
- **Across 1–5 min:** the map becomes known; reach the chest, the fight, or the question.
- **Lose / learn / restart:** HP reaches 0 → the log names what hit you → `R` retries the same seed.
- **Reward / risk:** an exit opens the floor; the process closes in for every turn you spend.
- **Better player:** reads distance to the three exits and chooses fight vs flight instead of wandering.
- **Next decision shown by:** the map, one log line, and the three exit glyphs.
- **Non-goals:** Blender, glitch reveal, extra floors, inventory, audio, deep combat, touch, premium art.

## Core loop contract

> Player **steps one tile** to **reach one of three exits** while **a process hunts every turn** creates risk;
> success **escapes Floor 1**, failure **costs HP and ends the run**, which **restarts the same seed instantly**.

Proof clauses: verb is real input · exits are visible glyphs · the process exists at boot · an exit changes
state to cleared · death names the attacker · `R` resets in under a second · same seed replays the same run.

## Level plan

- **Spatial format:** one authored ASCII grid, 21 × 15, drawn to a low-res canvas texture and floated.
- **Camera:** fixed angle, always shows the whole floor. No orbit, no follow.
- **Start / first decision / first threat / first reward:** top-left; which exit to take; the process,
  visible from boot; any one of the three exits.
- **Landmarks:** `$` chest, `M` fight, `?` question — three orders of leaving, three readings.
- **Escalation:** the process closes by one step per player turn; HP 6, contact costs 1.
- **Recovery:** the open ring corridors keep every exit reachable.
- **Telegraph:** the process glyph and one log line per event; no hidden damage.
- **Modular pieces:** grid, tiles, actors, exits, log, seeded RNG.

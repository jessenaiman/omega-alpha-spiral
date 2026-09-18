# Spiral Breaker — Design Brief

A short, procedural, one-stick arcade game built on the `omega-alpha-spiral` stack to learn and exercise the Three.js scene discipline while a serious scene (Ghost Terminal) stays undisturbed in parallel.

## Player promise (one sentence)

You are the last breaker-mote of a collapsing spiral: steer through your own world's ruined arms and dash **through** the shards sliding toward the core, because the core is the only thing left worth saving.

## Target feeling

Weightless but decisive. Steering is silky; the dash is a click of doom. Destroying a shard should make the room feel it — hitstop, spark, shake — while the spiral keeps breathing underneath. Reading which shard to take next should be instant: bright, moving threats on a dark field.

## Primary verb

**Dash** (Space / south button) — a short, instrumental burst that shatters anything it crosses. It is both the attack and the dodge: there is no weapon, only timing and positioning.

## Secondary verbs

- **Steer** (WASD / arrows / stick) — friction-damped radial movement inside the arena; your position chooses which shards you can intercept.
- **Pause** (Escape / menu) — suspend pressure; shows controls and settings.
- **Take over from the ghost** (any input) — the attract/autopilot mode hands the wheel back the moment a human gives a real input.

## The rhythm (what the player repeats every 5–30 seconds)

Read the inbound shards → pick one whose line you can cross → steer into its path → dash through it → chain the next one before the counter dies → watch a breach-cooldown or the wave clock. Breaks are the wave-clear pause and the moment you steal the wheel from the ghost.

## What changes across 1–5 minutes

The gauntlet is six waves; clearing the sixth **wins**. One new decision arrives per wave, then mixes:

1. Wave 1 teaches one shard and the dash.
2. Wave 2 adds **splitters** — teal shards that crack into two fast minis when dashed. Breaking them is still the move, but doing it far from the core gives the minis room to die; popping them late buys chaos.
3. Wave 3 adds **drifters** — shards that wobble along their arm, so late commitment can whiff.
4. Wave 4 adds **hearts** — coral fragments of the core. Tagging one (or letting it reach the center) **heals one integrity pip**; if the core is already full it pays bonus points. Hearts never breach, so ignoring one is never a loss.
5. Wave 5 adds **shielded** shards — amber and armored, with a cone facing the core. A dash that contacts them from inside that cone bounces off (the only bounce in the game); you must hit from the flank.
6. Wave 6 is the **final push**: faster spawns, all kinds mixed, and the wave only clears when the field is empty when the clock runs out. Clear it → **GAUNTLET CLEARED**.

Every wave also raises inbound speed and tightens the rhythm, with the same max on-screen cap so it never reads as noise.

## Lose, learn, restart, win

- A shard reaching the inner core ring is a **breach**: one core-integrity pip lost, a heavy flash, and a message — "THE CORE WEAKENS" — so the cause is explicit. A shielded-shard bounce flashes "BLOCKED" so the flank lesson is legible.
- Grazing a shard **while not dashing** knocks the breaker back with a short stun and a sting; the shard survives. That teaches the dash-with-intent (either break it or be clear of the line).
- At zero integrity the core flashes out and the run ends on a results screen: score, waves cleared, best score. **Restart is one button (Enter/click)** and reads as an invitation, not a punishment.
- Clearing wave 6 ends the run in **victory**: the integrity left when the field clears is banked as a bonus (100 × pips) into the final score, and the results screen compares it against your best. Beating your best is the repeat loop.

## What is rewarded / what creates risk

- **Rewarded:** well-timed dashes, chain streaks (multiplier that climbs with consecutive shatters inside the chain window), reading each kind — flanking shields instead of brute-forcing, letting minis hatch clear of the core, steering hurt into an inbound heart, wave clears, keeping the core at full health to bank the victory bonus.
- **Risk:** dashing into open space (cooldown leaves you vulnerable), body-blocking a shard you meant to break, popping a splitter too close to the core, spending a dash against a shield for nothing, letting the core starve while you hunt a far shard.

## What a better player does differently

Prefers the shard whose line crosses the most other lines, waits for the chain window instead of scattering dashes, and holds position inside the ideal intercept band rather than chasing the rim.

## How the next decision is communicated

The next-best shard is never pointed at. Instead: shards are bright with obvious motion and a readable **kind** (tetra = dart, teal squashed = splitter, small bright = mini, coral pulsing sphere = heart, amber octahedron = shielded), the nearest inbound shard has a faint seam-pulse telegraph, the chain window draws as a shrinking arc, the core shows its remaining integrity as pips, and the HUD shows **wave N/6** so the end of the gauntlet is always in sight. The player reads the field, not a marker.

## Ghost / watchable mode

When no input has occurred for 4 seconds (or Watch Mode is toggled), a translucent **ghost mote** takes the wheel and plays the game itself — same rules, same seeded world, deterministic. Any real input instantly hands control back. This is the "fun to watch" half of the request: the machine plays beautifully, and taking over mid-motion is its own joy.

## Non-goals for this slice

No external assets, no music, no PBR/imported models, no level editor, no save/leaderboard, no mobile touch input (desktop + keyboard/stick only), no permanent wiring into the Ghost Terminal boot path. It is a standalone entry: `spiral-breaker.html`.
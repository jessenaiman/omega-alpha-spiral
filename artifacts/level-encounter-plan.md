# Spiral Breaker — Wave / Encounter Plan

## Spatial format

A flat radial arena framed by a four-arm beam spiral. Top-down camera, slight pitch. Everything the player needs is on screen at once; nothing is off-camera. The spiral arms rotate slowly and read as "the world", while shards are the only sharp, fast, bright objects — contrast is the readability strategy.

- **Outer rim** (radius 1.0): spawn ring for shards.
- **Inner core ring** (radius 0.16): a shard reaching this radius is a breach.
- **Intercept band** (radius ~0.35–0.6): where dashes feel best; the player learns to hold here.
- **Slow zone** (radius < 0.28): inbound shards decay their radial speed slightly, giving a half-second grace that makes late saves possible without trivializing them.

## Camera

Fixed top-down perspective (fov ~50, height ~8.5, ~14° pitch), critically damped follow toward the player's position (clamped so the arena never drifts off frame), FOV punch on dash, trauma shake on destroy/breach, hard cuts and static caps under reduced motion. No manual orbit.

## Player start, first decision, first threat

Player spawns at radius ~0.55, angle 0, at rest.
- **First decision (≤2s):** a single shard spawns inbound; the player decides steer-then-dash versus body-block-to-learn-the-sting.
- **First threat (≤3s):** the shard crosses the intercept band; dashboard HUD shows dash cooldown is ready.
- **First reward:** the first shatter pops a spark burst, chain×1, +10, a ~40ms hitstop and a small shake — the juice pipeline is introduced all at once at the lowest cost.

## Landmarks

- **The Core:** center octahedron, pulsing; integrity pips above it in HUD, emissive intensity scales with health.
- **The Spiral:** four arms, slow rotation, the only decorative motion that never collides dialog.
- **Wave banner:** brief "WAVE N" splash + arpeggio on each clear as the recovery beat.

## Escalation (per wave, every ~15s or when the pool empties)

| Wave | New thing | Concept introduced |
| --- | --- | --- |
| 1 | Straight shards | Dash-through contract + chain |
| 2 | Splitters (teal, crack into 2 fast minis on a dash kill) | Where to break it; minis spawn only with cap headroom |
| 3 | Drifters (sine wobble along their arm) | Late commitment can whiff |
| 4 | Hearts (coral; destroy OR arrival heals +1 integrity, full-core pays bonus) | Recovery decision + never a breach |
| 5 | Shielded (amber, frontal core-facing cone bounces a front dash) | Flank the hit — the one "no" in the game |
| 6 | Final push: all kinds, faster cadence, and the wave **only clears when the field is empty at the clock** | Clean up to win; integrity banks as bonus |

Every wave raises inbound speed (capped) and tightens the rhythm, with the same max on-screen cap so it never reads as noise. One new concept at a time per `genre-design.md`.

## Landmarks

- **The Core:** center octahedron, pulsing; integrity pips above it in HUD, emissive intensity scales with health; heals flash it green.
- **The Spiral:** four arms, slow rotation, the only decorative motion that never collides dialog.
- **Wave banner:** brief "WAVE N" splash + arpeggio on each clear as the recovery beat; wave 6 reads "FINAL WAVE".
- **GAUNTLET CLEARED:** victory overlay on the empty-field clear; the integrity bonus banks into the final score against your best.

## Recovery beats

Wave-clear banner (no spawning during the banner) is the breathing room between pressure spikes; hearts are the mid-wave recovery beat (a lane you *want* to intercept). Chain window (2.5s) is a soft momentum beat. Full pause via Escape.

## Telegraphs

- Shards: brightness, obvious motion, and a readable **kind signature** — tetra dart = standard, teal squashed tetra = splitter, small bright tetra = mini, coral pulsing sphere = heart, amber octahedron = shielded.
- Splitter: the teal keeps a tick pulse so "do not pop this near the core" is legible.
- Shielded: it is the only shard whose face stays dark toward the core (its cone), signaling where not to hit.
- Breach risk: shard crossing the slow zone flashes its color border sharply.
- Dash readiness: cooldown arc fills on the player; when full it glows white.
- Win progress: the HUD reads wave N/6 at all times.

## Modular/parameterized pieces

- Shard spawn: `{bearing, radialSpeed, driftPhase, kind}` drawn from `fork('shards')` — adding a kind is one clause plus its resolve behavior.
- Wave plan: a `waveFor(index)` table, not hard-coded level files.
- Autopilot policy: pure function `(world) => Intents` — swappable for a smarter ghost later; it already prioritizes hearts when hurt and flanks shields.

## Greybox before detail

Primitives-only pass first (grey circles/lines) to prove pacing, collision timing, and camera scale, then materials/light/spiral-plane/VFX on top. This matches `genre-design.md` (greybox → detail).
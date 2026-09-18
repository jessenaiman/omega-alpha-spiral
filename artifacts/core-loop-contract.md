# Spiral Breaker — Core Loop Contract

> The player **dashes through** the gauntlet's shards to **protect the core and clear the final wave** while shard pressure and the dash cooldown create risk; success grants **score + chain multiplier + a victory bonus**, failure costs **core integrity**, and at zero integrity (or at the wave-6 banner) the run ends and restarts instantly.

## Clause-by-clause proof

| Clause | Proof in code |
| --- | --- |
| The verb is mapped to real input | `dash` intent (Space / south button) is already the fixed contract in `src/core/input.ts`; `moveX/moveY` steer. The sign map is caught for parity with the existing loop contract. |
| The objective is visible | Core sits at arena center with integrity pips in HUD; the spiral arms define the field; the HUD reads **wave N/6** so the win state is always on screen. |
| Pressure exists in the first playable minute | First shard spawns within ~2 seconds of `play`; dash cooldown blocks panic-cancel; splitters arrive at wave 2. |
| Reward changes state, not only visuals | Score + chain multiplier live in run state; hearts heal integrity; clearing wave 6 banks an integrity bonus into the final score; wave clears change the world (new kinds + speed). |
| Failure teaches what happened | Breach emits `core.breach` with a the-cause message ("THE CORE WEAKENS"); a graze emits `player.knockback` with a stun readout; a front-ranged shield dash emits `shard.blocked` ("BLOCKED"), so the flank lesson is explicit. |
| Restart is fast enough | One button (Enter/click/R on results) re-seeds and re-enters `play` with the same seed unless a new one is chosen. |
| Winning is a bounded goal | The gauntlet is exactly `TUNING.gauntletWaves` (6) waves; the final wave ends in `victory` when the field is empty at the wave clock, banking `100 × integrity` bonus. |

## Fixed update order (host step, one per 16.6ms step)

1. Read intents (keyboard/stick → `Intents`).
2. If any edge intent arrived and the ghost is driving, hand control to the human (ghost ownership is a rules flag, not a presentation hack).
3. Autopilot synthesizes intents when nobody has input for 4s (deterministic policy, same seed reproducible). It prioritizes hearts when hurt and flanks shielded shards.
4. Advance the world: dash lifecycle → player motion → shard motion → collisions (kind-aware) → breaches/heals → spawn/wave clock → score/chain → victory check.
5. Emit typed events; presentation and audio react, never mutate rules.
6. Hand a frame (state + alpha) to the renderer.

## Rules invariants (test-guarded)

- Same seed + same intent sequence ⇒ byte-identical run trace (no `Math.random` anywhere in `src/arcade/game`).
- Collision resolves by **dash-overlap**: a shard crossed while `dash` is on-scene is destroyed; any other contact is a knockback + stun, never a destroy. Shields are the one exception: a shielded shard hit from inside its frontal cone instead emits `shard.blocked` and survives.
- A shard entering the inner core radius is a breach: integrity −1, shard removed, flash/sting; consecutive breaches never double-tick in one step. Hearts never breach — they heal on destroy or arrival.
- A splitter's minis spawn only while the on-screen cap has headroom; the cap never cracks.
- Dash has a fixed cooldown cap; the player cannot be knocked back while stunned (no stun-stacking).
- The gauntlet's final wave only clears when the field is empty at the wave clock.

## Gameplay events (single typed bus, same shape as `src/core/events.ts`)

`run.begin`, `run.over`, `wave.start`, `shard.spawn` (carries `kind`), `shard.destroy` (carries `kind`), `shard.blocked`, `core.heal`, `chain.reset`, `dash.start`, `player.knockback`, `core.breach`, `ghost.takeover`, `ghost.release`, `score.change`, `game.over` (carries `victory` + `bonus`).

## Acceptance hooks

`seed(value)` re-seeds the run; `setState(name)` reaches `menu` / `active-play` / `game-over` / `victory` through real state ownership; `setPausedForScreenshot` stops simulation while rendering keeps up; reduced-motion and debug-hide share the settings store the player uses. Named states ack `{state: name}` exactly.

## Non-goals

No lives, no inventory, no alternative attacks, no touch input, no persistence beyond session best, no narrative coupling to the Ghost Terminal scene.
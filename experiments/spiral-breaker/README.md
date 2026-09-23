# Spiral Breaker — archived workshop

**This is not Omega Spiral.** It is a one-stick dash arcade gauntlet that an
agent authored as a Three.js scene-discipline exercise, and it was wired into
the production build as a peer of the real game. It has been moved here so the
difference is visible.

## Why it is not the game

Omega Spiral is a classic RPG built on spiral storytelling: three parallel
Dreamweaver paths, only one walkable, with chapter-zero shipping the player
**unpaired** so all three exist at once. Its first playable is a modern
NetHack/Rogue-like. Its verbs are Talk, Hit, Run.

Spiral Breaker is none of those things. It is a top-down radial arena with six
waves, a dash that shatters shards, splitters/drifters/hearts/shields, core
integrity pips, a chain multiplier, and a 4-second-idle ghost autopilot. It
contains no Dreamweaver, no Omega, no VitaSynth, no Aetherion, no DISC, and no
question. Nothing in the read-only canon documents it.

Its invented brief, core-loop contract, and encounter plan live in
[`docs/`](./docs/). Those three files previously sat in `artifacts/` alongside
real evidence and read as though they described this project.

## Provenance

| Path                     | Was                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| `spiral-breaker.html`    | repo root                                                             |
| `src/arcade/` (16 files) | `src/arcade/`                                                         |
| `docs/*.md`              | `artifacts/{design-brief,core-loop-contract,level-encounter-plan}.md` |

Moved with `git mv`, so history is preserved. The `arcade` entry was removed
from `vite.config.ts`, and the six imports that escaped to `src/core` were
repointed at `../../../src/core` so the workshop still type-resolves if it is
revived.

## If you want to run it again

Re-add the build input to `vite.config.ts`:

```ts
arcade: fileURLToPath(new URL('./experiments/spiral-breaker/spiral-breaker.html', import.meta.url)),
```

Add the folder back to `tsconfig.json`'s `include` if you want it typechecked.

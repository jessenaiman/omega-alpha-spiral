# experiments/

Workshops, spikes, and throwaway builds. **Nothing in here is the game.**

Code under `experiments/` is not a Vite build input, is not covered by
`tsconfig.json` (`include: ["src", "tests", ...]`), and is not part of the
deployable `dist/`. It is kept for reference and for reviving an idea later.

If something here turns out to be real, it graduates into `src/` with a proper
brief, tests, and an entry in `vite.config.ts`. Until that happens, treat every
file here as a draft.

| Workshop                               | What it is                                                             |
| -------------------------------------- | ---------------------------------------------------------------------- |
| [`spiral-breaker/`](./spiral-breaker/) | A one-stick dash arcade gauntlet. Never part of Omega Spiral's design. |

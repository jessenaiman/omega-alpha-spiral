# Omega Dialogue Studio

The accepted ghost-typing study now has a permanent studio entry: `/omega-dialogue-studio.html`. The former `/intro-type-prototype.html` redirects here and preserves query parameters. Source remains in `src/intro/ghost-type-study/` to keep this checkpoint small.

## Run

```sh
npm run dev -- --port 5191
npm run build
npm run preview -- --port 4191
```

Open `/omega-dialogue-studio.html?variant=passage&speaker=shadow&scene=floor1&era=smooth`.

## Current boundary

- Shared scene typography: `src/core/sceneTypography.ts`. Opening/Omega, Floor 1/Light, Floor 2/Shadow, Floor 3/Ambition. Each scene owns one era; all speakers inherit it while keeping their cadence, corrections, color, and geometry.
- Four period-inspired presets: phosphor dots, DOS blocks, desktop bitmap, smooth screen. These are art presets, not historical emulators. Floor era assignments remain undecided and default to phosphor.
- Voice tuning is session-only. The URL retains active scene, era, speaker, and layout. This checkpoint does not persist edited profile values or publish them to gameplay.
- `WritingPlayback` sequences samples; `GhostLetters` renders them. Completion and typography-change events remain the integration boundary described in [the original study notes](../ghost-type-study/README.md).
- Samples are noncanonical. Actual game integration is next, coordinated with [dialogue runtime #53](https://github.com/jessenaiman/omega-alpha-spiral/issues/53), which was still open and unassigned when checked. No runtime implementation was verified.

## Focused release evidence — September 23, 2026

- Production TypeScript/Vite build passed. Both studio and legacy redirect are build entries; studio controls remain available in production.
- [Declared capture manifest](evidence.json): desktop 1280×720 and mobile 390×664 passage views. [Desktop](qa/final-desktop/desktop.png), [mobile](qa/final-mobile/mobile.png). This covers the changed studio entry and era controls, not every layout or full-game progression.
- Initial captures found a favicon 404. An inline empty icon fixes it; [initial manifest](evidence-initial.json) retains that failed pass. Final capture results are recorded alongside each image.
- Real browser input confirmed redirect/query preservation; choosing Shadow kept Floor 1 owned by Light; era changed independently; tuning controls opened in production.
- [Typing and post-answer revision recording](qa/motion/page@c07f8e968020acb440928f83563d3a2e.webm): Omega reached Revised after Answer, then replay/pause controls were exercised. This is studio motion, not locomotion evidence.
- Renderer: NVIDIA GTX 1660 / Direct3D11, hardware rendering. Canvas is nonblank. Detailed draw-call diagnostics and frame-time benchmarks are unavailable in this studio; no performance-budget claim.
- Existing large intro-bundle warning remains outside this change. The build includes the shared worktree's existing changes, not a clean isolated checkout.
- No new tests or regression harness. Existing unit tests run only through the requested commit hook. Prior checkpoint had a known unrelated intro-finale assertion failure (22/23 passed); current hook outcome is recorded in the handoff.

## Next design conversation

Integrate this visual language into authored gameplay before expanding the studio. Decide how a tuned preset becomes the version consumed by the game; preserve explicit authoring and scene ownership. Do not automatically equate question number with a technology upgrade.

Final pass: both captures passed with zero console/page errors. Evidence coverage checker passed three declared artifacts.

### Checkpoint hook outcome

The requested normal commit ran the existing hook. Typecheck passed; 22/23 unit tests passed. `tests/unit/intro-ghostwriting.test.ts:43` still expects `Dreamweaver threads following - 03`, while the current authored ending says `Dreamweaver thread selected - {{THREAD_NAME}}`. No studio file imports or edits that narrative.

The formatter also failed to restore the partially staged progress document after formatting. Its rollback preserved the original worktree, including the unrelated Floor One notes; the studio-only index remains staged. The recovery patch path printed by lint-staged no longer exists after rollback. No recovery patch was applied and no unrelated work was included. A fresh one-commit hook exception was requested because the earlier exception was already consumed.

Owner approved this checkpoint's documented hook exception and push. Hook bypass is limited to this commit.

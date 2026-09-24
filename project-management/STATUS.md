---
tags: [omega-spiral, omega-spiral/setup]
---

# Omega Spiral — Current Status

## Start here

- The canonical local checkout is `C:\SpiralDrive\omega-alpha-spiral` on `main`. Run the root game from this checkout; `/` loads the authored intro and then Chapter Two.
- GitHub issues own acceptance and status. A worktree or branch name is a history pointer, not the current ticket. Read the matching `project-management/Handoffs/<issue-id>.md` before continuing a specific issue.
- The connected journey is implemented on `main`, but the owner has not approved its visuals or completed a live playthrough of Floors 4–8. Do not call the eight-floor game finished on the strength of a build or bot report.

## Ticket map — verified 2026-09-24

| Issue                                                              | State  | Purpose                                                                                                                            |
| ------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| [#47](https://github.com/jessenaiman/omega-alpha-spiral/issues/47) | Closed | Three.js team foundation and evidence handoff. Historical; do not reopen it for new game work.                                     |
| [#11](https://github.com/jessenaiman/omega-alpha-spiral/issues/11) | Open   | Core host boot and acceptance surfaces in `src/main.ts`. Its scope needs reconciliation with the authored intro now served at `/`. |
| [#18](https://github.com/jessenaiman/omega-alpha-spiral/issues/18) | Open   | Earlier standalone Floor One modern roguelike specification. Keep its evidence; reconcile remaining work with #61.                 |
| [#58](https://github.com/jessenaiman/omega-alpha-spiral/issues/58) | Open   | Director-surface cleanup after dialogue-studio integration. Maintenance, separate from level design.                               |
| [#61](https://github.com/jessenaiman/omega-alpha-spiral/issues/61) | Open   | Connected eight-floor era journey: early Dreamweaver exits, combat, town, and finale. This is the current game-play review target. |

## Next check

Play the root game with real input through the intro and as far as the current build permits. Compare each floor with the [design manifest](../artifacts/level-design/design-manifest.md) and [scorecard](../artifacts/level-design/design-scorecard.md). Record the first concrete failure or mismatch in [handoff 61](Handoffs/61.md) before adding more art or closing #61.

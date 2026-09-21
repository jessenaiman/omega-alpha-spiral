# Removed on feature/scenes-2-3 — logged, not deleted everywhere

These are **not part of this branch's build**. A future cleanup PR may remove them
from the repository; until then they remain untouched in other worktrees/checkouts.

## Removed here (from the playable checkpoint composition)

| Path | Why removed here | Where it still exists |
|---|---|---|
| `src/chapter-two/rooms.ts` | Superseded by `src/chapter-two/floors.ts` (`DESCENT_FLOORS`); kept `WalkField`/scene but removed the dead module per the rebase wait | deleted in this branch's working tree only |
| `artifacts/scenes-2-3-bot/`, `-bot-green/`, `-bot-green2/`, `-own-server/` | Invalid bot-run evidence: every run executed against a foreign dev server on port 5188 serving the ROOT checkout, so results describe old code. Deleted, unrecorded by design | n/a (were untracked) |
| `artifacts/checkpoint-final-verify/`, `checkpoint-bot-green/`, `main-checkpoint-red/`, `main-checkpoint-rewrite-green/`, `chapter-zero-bot/`, `chapter-zero-delivery/`, `chapter-zero-final/`, `chapter-zero-pause-red/`, `chapter-zero-verified/`, `creative-test-audit/`, `floor-revision-red/`, `intro-hybrid/`, `intro-playable/`, `playable-entry-check/` | Cross-branch evidence trees living only in `wt/t_65b7c660` working tree; untracked by Git and **not merged to main**. Listed on the eventual cleanup PR's checklist | wt/t_65b7c660 |
| `assets/intro/background-motion/` study dirs, `export_threshold.py`, `create_door_only.py`, `door-only-report.json`, `export-report.json` | Study/experiment outputs not under version control in any worktree; also flagged for the cleanup PR | wt/t_65b7c660 |
| `.worktrees/alpha-0.1`, `floor-one-concept`, `floor-one-rules`, `scene-1-foundation`, `t17`, `t_8c395534`, `t_c710df60`, `t_f1153b09`, `C:/Users/jesse/.codex/worktrees/omega-intro-ui-gameplay` | Old merged worktrees/branches (Floor One, Echo Chamber, merge reconciliations) piling up in `.worktrees/`. Candidates for `git worktree remove` + branch delete in a later pass once their PRs are confirmed merged | global repo |

## Outcome expected from the eventual cleanup PR

- ` rooms.ts` deletion actually lands (currently only a working-tree deletion here).
- Untracked artifact dirs get `artifacts/` into `.gitignore` so evidence never leaks into the tree again.
- Stale worktrees + their one-off branches are pruned after merge confirmation.
- The `tests/` audit list (bot coordinate-steering, `timeout: 0` waits, `pace=` param) is applied from the audit handoff.

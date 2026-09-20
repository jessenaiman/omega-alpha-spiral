---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral Creative Notes

This folder holds creative source material: ideas, references, design exploration, owner notes, and unresolved questions.

It is not an issue tracker. GitHub Issues owns specifications, tickets, acceptance criteria, dependencies, and status.

## Create a note

1. Copy `../Templates/TASK.md` into this folder.
2. Give the file a descriptive name when practical.
3. Fill in the idea and owner notes.
4. List open questions as choices that can be answered.
5. Define observable conditions for **Ready for /to-spec**.
6. Add the note to the matching creative stage in `../BOARD.md`.

Legacy `t*.md` filenames can remain. Their execution fields are historical and must not be treated as current status.

## Creative stages

| Stage | Meaning |
|---|---|
| **Ideas** | Raw concept worth keeping |
| **Shaping** | Direction is being explored through notes, references, and alternatives |
| **Ready for /to-spec** | Creative questions are resolved enough to write an executable specification |
| **Published** | `/to-spec` created the GitHub specification and the note links to it |
| **Decisions Needed** | Progress in shaping requires an explicit owner choice |

These are creative stages, not implementation status.

## Promotion rule

Run `/to-spec` only after the note's ready-for-spec conditions are met. Record the resulting GitHub issue link in the note. If the published spec needs smaller executable tickets, run `/to-tickets`; keep those tickets in GitHub.

Do not copy acceptance criteria, blockers, assignees, branches, worktrees, test commands, or completion state back into this folder. Link to GitHub instead.

## Review rule

Keep subjective visual, audio, narrative, and interaction feedback here. When feedback becomes an actionable change, promote it to GitHub and retain only the link plus any creative rationale.

## Related

- [[../HUB|Creative hub]]
- [[../BOARD|Creative board]]
- [[UI-REVIEW|Floor One feedback inbox]]
- [GitHub Issues](https://github.com/jessenaiman/omega-alpha-spiral/issues)

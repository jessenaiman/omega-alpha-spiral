---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral — Tracker Hub

Issue tracker for the **game repository** at `C:\SpiralDrive\omega-alpha-spiral`.

| | |
|---|---|
| Tracker folder | `C:\obsidian\Project Management\Omega Spiral\` |
| Ticket notes | `Tasks\<id>.md` — one file per ticket |
| Repo-side config | `C:\SpiralDrive\omega-alpha-spiral\docs\agents\issue-tracker.md` |
| Format precedent | `C:\obsidian\Projects\omega-spiral\Tasks` — **read-only**, do not write to it |
| Task board | `~/.hermes/kanban.db` (DSH) — owns *current* work; this vault tracker owns *tickets and specs* |

## Releases

| Release | Meaning |
|---|---|
| **Scene 1 — Ghost Terminal** | The opening. A console that starts as a bare cursor on black; the machine builds a world out of the earliest code it found; the three Dreamweavers arrive as **dot → line → box → icon**; the scene ends on the name question and Omega's reply, then cuts. |
| **Scene 2 — Echo Chamber** | Three rogue chambers, one per Dreamweaver. Not yet spec'd. |

> **The Alpha 0.1 / Alpha 0.2 split is retired as of 2026-09-17.** Releases are now **one epic scene at a time**, built and iterated until the final scene. Blender is no longer reserved for a later milestone: it is a live tool, installed and headless-verified (`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`, 5.2.1 LTS), used wherever it fits a scene.

## Files in this tracker

| File | Holds |
|---|---|
| `ROLES.md` | **The role roster — authoritative.** Profiles, budget, lanes, and the open decisions |
| `STATUS.md` | Current release, gate, blockers |
| `BOARD.md` | Kanban board across the workflow lanes |
| `Tasks/README.md` | Ticket format — read before filing anything |
| `Templates/TASK.md` | Copy this to start a ticket |

## Tags — filter with these

Every note in this tracker carries YAML frontmatter `tags:`. Filter with the tag pane, the search bar (`tag:#omega-spiral`), or a Dataview query.

| Tag | Means |
|---|---|
| `omega-spiral` | Any note in this tracker |
| `omega-spiral/scene-01` | Scene 1 — Ghost Terminal |
| `omega-spiral/scene-02` | Scene 2 — Echo Chamber |
| `omega-spiral/setup` | Tracker, tooling, or coordination setup |
| `subsystem/<name>` | Which part of the scene the ticket touches |

`subsystem` values: `foundation`, `state`, `input`, `terminal`, `visual`, `audio`, `eras`, `exploration`, `action`, `rewind`, `party`, `fracture`, `threshold`, `release`.

> **Releases are scenes, not versions.** Use `omega-spiral/scene-01`, never `scene-1` or `alpha-01`. Numeric suffixes use two digits — Obsidian tags reject periods, so a tag written `alpha-0.1` would be silently dropped and filter nothing.

> **Status is deliberately not a tag.** Status lives in exactly one place: the `status` row of each ticket's header table, mirrored by the board columns. Putting it in tags too would create a second source of truth that can silently disagree — the failure the `label-vocabulary` ticket exists to prevent.

## Profiles — the real assignees

Ticket `owner` values must name a profile that **exists on this machine**. The dispatcher silently drops unknown assignees: a card assigned to a name that is not a real profile sits in `ready` forever and never runs.

| Profile | Model | Lane |
|---|---|---|
| `omega-game-director` | `stealth/union-alpha` | direction, integration, art lead |
| `game-dev` | `deepseek/deepseek-v4.1-flash` | Scene implementation |
| `design-dev` | `deepseek/deepseek-v4.1-flash` | art and visual design only |
| `reviewer` | `deepseek/deepseek-v4.1-flash` | read-only two-stage review |
| `omega-project-librarian` | `stealth/union-alpha` | creative text and documentation |
| `check-in-agent` | `stealth/union-alpha` | validates handoffs, returns findings |

Every dispatched card carries these skills: **`omega-spiral-environment`** plus the matching persona (`omega-spiral-game-dev`, `omega-spiral-design-dev`, `omega-spiral-reviewer`). They are sourced in the repo at `.agents/skills/` and deployed to the shared dir `~/.minions/skills/` so all profiles resolve them.

## Related

- Repo agent guide: `C:\SpiralDrive\omega-alpha-spiral\AGENTS.md`
- Role map: `docs\coordination\omega-production-wayfinder.md` in the repo
- Vault ledger: `C:\obsidian\VAULT-MAP.md`

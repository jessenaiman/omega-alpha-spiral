# Issue tracker: Obsidian

Issues and specs for this repo live as **ticket notes in the Obsidian vault**, not in GitHub Issues.

| | |
|---|---|
| Vault root | `C:\obsidian` |
| Tracker folder | `C:\SpiralDrive\omega-alpha-spiral\project-management\Tasks` |
| Tracker hub | `C:\SpiralDrive\omega-alpha-spiral\project-management\HUB.md` |
| Board | `C:\SpiralDrive\omega-alpha-spiral\project-management\BOARD.md` |
| Format precedent | `C:\obsidian\Projects\omega-spiral\Tasks` — **read-only** |
| Template | `C:\SpiralDrive\omega-alpha-spiral\project-management\Templates\TASK.md` |
| Vault ledger | `C:\obsidian\VAULT-MAP.md` |

The GitHub remote (`jessenaiman/omega-alpha-spiral`) exists for **code**, not for work tracking. Do not use `gh issue` for this repo's tickets.

## Vault layout and access

| Path | Access |
|---|---|
| `C:\obsidian\Project Management\` | **read + write** |
| `C:\obsidian\Projects\` | **READ-ONLY** — personal creative work. Do not revise or add to it. The old tracker at `Projects\omega-spiral\Tasks` is precedent only; never write to it |
| Anything else in the vault | read-only unless the user says otherwise |
| `C:\SpiralDrive\omega-alpha-spiral` | the application repo — stays **outside** the vault |

## Convention

**One file per ticket**, named `<id>.md`, starting with YAML frontmatter that carries **identity tags only**:

```yaml
---
tags: [omega-spiral, omega-spiral/alpha-01, subsystem/party]
---
```

Tag grammar:

| Tag | Means |
|---|---|
| `omega-spiral` | Any note in this tracker — always present |
| `omega-spiral/alpha-01` | Alpha 0.1 work |
| `omega-spiral/alpha-02` | Alpha 0.2 work |
| `omega-spiral/setup` | Tracker, tooling, or coordination setup |
| `subsystem/<name>` | Which part of the loop the ticket touches |

`subsystem` values: `foundation`, `state`, `input`, `town`, `eras`, `terminal`, `exploration`, `action`, `rewind`, `party`, `fracture`, `threshold`, `visual`, `audio`, `release`.

Two hard rules about tags:

- **Never put status in tags.** Status is a single field in the header table, mirrored by the board lanes. A second copy can silently disagree.
- **Use `alpha-01` / `alpha-02`, never `alpha-0.1`.** Obsidian rejects periods in tags, so the tag would be silently dropped and filter nothing.

Then a header table:

| Field | Value |
|---|---|
| id | t1 |
| status | needs-triage |
| owner | — |
| release | Alpha 0.1 |
| worktree | `.worktrees/<slug>` on branch `<type>/<slug>` |
| blocked by | none — can start immediately |
| dependencies | none |
| updated | 2026-09-16 |

Then these sections, in order:

| Section | Holds |
|---|---|
| `## Acceptance` | What must be true for this to be done |
| `## Verify` | How it gets checked — exact command or exact evidence |
| `## Output` | The result once produced |
| `## Blocker` | What is stopping it, or `none` |
| `## Notes` | Freeform |

## Operations

- **Create an issue**: `write_file` to `C:\SpiralDrive\omega-alpha-spiral\project-management\Tasks\<id>.md` using the frontmatter, header table, and sections above. Pick the next free `<id>`; `updated` is today's date. Add a row to `BOARD.md` in the lane matching the status.
- **Read an issue**: `read_file` on the ticket note.
- **List issues**: `search_files` with `target: "files"`, `pattern: "*.md"` under the tracker folder, then read each `status` row.
- **Find issues by state**: `search_files` with `target: "content"`, `pattern: "\| status \| <value> \|"`, `file_glob: "*.md"` under the tracker folder.
- **Find issues by tag**: `search_files` with `target: "content"`, `pattern: "omega-spiral/alpha-01"` or `"subsystem/<name>"`, `file_glob: "*.md"` under the tracker folder.
- **Comment on an issue**: `patch` to append under `## Notes`.
- **Apply / change a status**: `patch` the `status` row of the header table, then move the row in `BOARD.md`. If the two disagree, the header table wins.
- **Close**: set `status` to `done`.

## Status vocabulary

The five canonical triage roles, mapped in `docs/agents/triage-labels.md`:

`needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`

plus **`done`** — a terminal state, not a triage role, declared explicitly in `docs/agents/triage-labels.md`.

## Relationship to the DSH task board

Two trackers, two jobs — do not duplicate between them:

- **`~/.hermes/kanban.db` (DSH)** owns *current dispatched work*: what is running now, who is on it, and what is next.
- **This vault tracker** owns *tickets and specs*: the durable record of what the work is, why, and what "done" means.

A ticket that becomes active work gets a DSH card. The ticket note stays the authority on scope and acceptance.

## Vault governance

- The vault has a canonical location ledger at `C:\obsidian\VAULT-MAP.md`, governed by the `maintaining-vault-map` skill (read the map → preflight → change → postflight → append-only log record). Register any new folder or storage location there. The ledger is the only location map — never create a second one.
- Application repositories stay **outside** the vault.
- Structural edits under `C:\obsidian\Projects\` are forbidden — that tree is read-only.

## When a skill says "publish to the issue tracker"

Create a ticket note under `C:\SpiralDrive\omega-alpha-spiral\project-management\Tasks`.

## When a skill says "fetch the relevant ticket"

Read `C:\SpiralDrive\omega-alpha-spiral\project-management\Tasks\<id>.md`.

---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral Tickets

Issue tracker for the `omega-alpha-spiral` game repository at `C:\SpiralDrive\omega-alpha-spiral`.

**One file per ticket.** Format mirrors the established `Project Management\Tasks` (curriculum-api) convention, which in turn mirrors `Projects\omega-spiral\Tasks`.

## Three lanes — where a thing is filed decides where it lives

**Each kind of work has exactly one home. Do not duplicate between lanes.**

| Lane | Holds | Where |
|---|---|---|
| **GitHub Issues** | **Technical.** Bugs, backend dev details, installations, deployments, audits, linting — and technical necessities that would otherwise distract the build | `jessenaiman/omega-alpha-spiral` |
| **Obsidian** — this folder | **Creative.** Anything about what the game *is*: how it looks, sounds, reads, and plays | `Tasks/<id>.md` |
| **Hermes Kanban** | **Action items.** Work actually being executed now | board `omega-spiral-demo` |

This split was set by the design owner on 2026-09-17. It **replaces** an earlier attempt to mirror every creative ticket into GitHub, which duplicated the record and broke the *"do not duplicate between them"* rule already written in `docs/agents/issue-tracker.md`.

### Why creative work lives here and not in GitHub

GitHub owns the things that are *about the code*. A creative ticket — a scene's look, its copy, its pacing — is about the *game*, and its authority is the design owner, not the repository. Splitting it across two tools means neither copy stays complete, and the one an agent reads may not be the one that was decided.

### The link rule

A creative ticket that becomes dispatched work carries the id of its executor:

| Field | Value |
|---|---|
| hermes | `t_xxxxxxxx` — the Kanban card executing this ticket |
| github | a **related technical** issue, or `none` |
| spec | the spec this ticket implements |

A ticket that has been dispatched and still says `—` has lost its trail.

### Technical faults do not come here at all

A provider outage, a dispatcher misconfiguration, a broken auth path, a dangling config value, an audit failure — none of these is design work and none needs a spec. They go **straight to GitHub Issues**, and when they need executing, to a Hermes card assigned to `buzz`.

`buzz` is a **general systems expert and is deliberately not trained on this game.** The project context rides in the **card body** — repo path, board, symptom, and the evidence already gathered. Not a persona.

The direction agent must not chase these itself. That is the whole point: handing one to `buzz` with the evidence so far keeps direction on direction. See issue `#8` for the pattern.


## Filename

`<id>.md` — e.g. `t1.md`, `fracture-routes.md`. The `id` in the header table must equal the filename without `.md`.

## Frontmatter

Every ticket starts with YAML frontmatter carrying **identity tags only**:

```yaml
---
tags: [omega-spiral, omega-spiral/scene-01, subsystem/terminal]
---
```

- Always include the bare `omega-spiral` tag.
- Add exactly one release tag: `omega-spiral/scene-01`, `omega-spiral/scene-02`, … **Releases are scenes, not versions** — see `../HUB.md`.
- Add one or more `subsystem/<name>` tags. Values are listed in `../HUB.md`.
- **Never put status in tags.** Status is a single field in the header table below. One source of truth.

> Use `alpha-01`, not `alpha-0.1` — Obsidian rejects periods in tags, so `alpha-0.1` would silently not filter.

## Header table

| Field | Value |
|---|---|
| id | t1 |
| status | needs-triage |
| owner | `<a real profile>` — see the Profiles table in `../HUB.md` |
| skills | `omega-spiral-environment, omega-spiral-<persona>` |
| release | Scene 1 — Ghost Terminal |
| worktree | `.worktrees/<slug>` on branch `<type>/<slug>` |
| blocked by | none — can start immediately |
| dependencies | none |
| updated | 2026-09-16 |

> **`owner` must name a profile that exists on this machine.** The dispatcher silently drops unknown assignees — a card assigned to a name that is not a real profile sits in `ready` forever and never runs. The real roster is in `../HUB.md`.
>
> **`skills` are force-loaded into the dispatched worker.** Always include `omega-spiral-environment`; add the persona for the role.

## The LOAD FIRST block is mandatory

Every ticket opens with a `⚠ LOAD FIRST` block naming, in order:

1. `omega-spiral-environment` — the shared environment
2. the **persona** for the role (`game-dev`, `design-dev`, `reviewer`, `content`, `check-in`)
3. the **`threejs-*` skill** for the work

**Why this is a rule and not a nicety:** an agent that cannot tell what it is supposed to load and follow will invent its own assignment. That invented work then has to be unpicked by someone else. The block must be readable inside the **first ten lines**, before any acceptance criteria, or it may as well not be there.

**And the `skills` header row is the row that matters.** It is what gets force-loaded into the dispatched worker. Naming a skill in prose elsewhere in the ticket does **not** attach it — a worker whose ticket says "load `threejs-game-ui-designer`" in a section, but whose `skills` row omits it, never receives it. Every `threejs-*` skill belongs **in the `skills` row itself**.

## Files a ticket owns

Tickets run in parallel. Every ticket must declare a **file boundary** — the paths it may write — so two agents cannot collide. A ticket that does not declare one is not ready to dispatch.

## Sections

| Section | Holds |
|---|---|
| `## Acceptance` | What must be true for this to be done |
| `## Verify` | How it gets checked — the exact command or the exact evidence |
| `## Output` | The result once produced |
| `## Blocker` | What is stopping it, or `none` |
| `## Notes` | Freeform |

## Status values

The five canonical triage roles, mapped in the repository's `docs\agents\triage-labels.md`:

`needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`

plus **`done`** — a terminal state, not a triage role, used to close a ticket. See `docs\agents\triage-labels.md` for why `done` is declared explicitly here rather than left provisional.

## Board columns

`BOARD.md` lanes map to status like this:

| Board lane | Status it holds |
|---|---|
| Backlog | `needs-triage` |
| Ready | `ready-for-agent`, `ready-for-human` |
| Doing | `needs-triage` ticket actively being worked |
| Blocked | `needs-info`, or `blocked by` an open ticket |
| Review | done, awaiting the captain's or the user's verdict |
| Done | `done` |
| — | `wontfix` stays off the board; it is a closed verdict |

When a ticket's status and its board lane disagree, **the header table wins**. Fix the board.

## Preliminary tasks

Discovered mid-task, not the current goal. Stub only. Cap: under 5 minutes, max 3 turns. Log it, continue the goal, never chase.

| Field | Value |
|---|---|
| id | `<slug>` |
| status | needs-triage |
| origin | discovered while `<current ticket>` |
| updated | 2026-09-16 |

Body: one line describing what looked wrong. No analysis. No investigation.

## Related

- Repository config: `C:\SpiralDrive\omega-alpha-spiral\docs\agents\issue-tracker.md`
- Tracker hub and tag legend: `../HUB.md`
- Vault ledger: `C:\obsidian\VAULT-MAP.md`

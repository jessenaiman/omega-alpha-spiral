---
tags: [omega-spiral, omega-spiral/scene-NN, subsystem/CHANGEME]
---
# {{title}}

> ## ⚠ LOAD FIRST — before anything else in this ticket
>
> 1. **`omega-spiral-environment`** — the repo, stack, commands, authority order, vocabulary, and evidence rules. Load this first.
> 2. **`omega-spiral-<persona>`** — your role for this ticket (`game-dev`, `design-dev`, `reviewer`, `content`, `check-in`).
> 3. **`threejs-<skill>`** — the named skill for this work. Call it and **follow it completely**.
>
> **If you cannot tell, by the end of this block, exactly which skills you must load and follow — stop and ask. Do not invent work.** An agent that guesses at its own assignment produces work someone else has to unpick.

| Field | Value |
|---|---|
| id | {{id}} |
| status | needs-triage |
| owner | `<a real profile — see the Profiles table in ../HUB.md>` |
| skills | `omega-spiral-environment, omega-spiral-<persona>, threejs-<skill>` |
| release | Scene N — `<name>` |
| worktree | `.worktrees/{{id}}` on branch `{{type}}/{{id}}` |
| blocked by | none — can start immediately |
| dependencies | none |
| spec | `{{spec}}` — the spec this ticket implements |
| hermes | `{{hermes}}` — the Kanban card executing this, or `—` until dispatched |
| github | `{{github}}` — the issue or PR this relates to, or `none` |
| updated | {{date}} |

> **The three id rows are the audit trail and they are not optional.** This ticket is the record of *why* the work exists; the Hermes card is only the surface that executes it. `/to-spec` writes the `hermes` id back here **at dispatch time** — a ticket that has been dispatched and still says `—` has lost its trail, and nobody downstream can connect the code to the decision. Technical/infrastructure faults are the sole exception and skip Obsidian entirely (see `../Tasks/README.md`).

> **`skills` is not documentation.** It is the row that gets **force-loaded into the dispatched worker**. A skill named only in prose elsewhere is a skill the worker never receives. The `threejs-*` skill belongs **in this row**.

## Owns (file boundary)

Tickets run in parallel. Declare the paths this ticket may write, so two agents cannot collide. A ticket without a file boundary is not ready to dispatch.

- `src/.../**`

## Acceptance

- 

## Verify

- 

## Output

- 

## Blocker

none

## Notes

- 

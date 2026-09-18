# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Where these strings live

This repo's tracker is Obsidian, not a label service. Each string is the value of the `status` field in a ticket's header table, in `C:\obsidian\Project Management\Omega Spiral\Tasks\<id>.md`. The `BOARD.md` lanes mirror them. There is no separate label store to create — a "label" here is a status value.

## `done` — terminal state, not a triage role

`done` is **declared and supported** in this tracker, alongside the five roles above. It is the value used to close a ticket.

It is listed separately because it is not a triage role: nothing is ever *triaged into* `done`. A ticket reaches it by being finished, and the transition is recorded in the ticket's `## Output` section. The triage state machine in the `triage` skill does not produce it.

Both older trackers on this machine carried `done` as a **provisional** value inherited from the `Projects\omega-spiral\Tasks` precedent, with no definition. This file is the definition: **`done` means the ticket's `## Acceptance` criteria are met and its `## Verify` evidence has been produced.** A ticket with no evidence is not `done`.

## `wontfix` versus `done`

`wontfix` means the ticket was evaluated and will not be actioned. `done` means it was actioned. Superseded tickets are `wontfix`, with the superseding ticket named in `## Notes` — not `done`, and not deleted.

## Every ticket carries two roles

Exactly one **category** and one **state**, per the `triage` skill:

- Category: `bug` or `enhancement`
- State: one of the five roles above, or `done`

Category lives in the ticket's `## Notes` or its title prefix — this tracker has no category field, and adding one is a decision for the user, not an agent.

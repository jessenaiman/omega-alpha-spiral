---
kanban-plugin: board
tags: [omega-spiral, omega-spiral/setup]
---

## Backlog

- [[t14]] **SPEC — Design canon recovered from skills, agent souls, and stray files** *(needs-triage — the record that lets the canon be stripped out of nine files; not dispatchable. Also reports six agent-identity defects, incl. **`game-dev` carrying the Director's soul byte-identically**)*
- [[t1]] creative deconstruction of the logo design and style *(needs-triage — needs the owner's fourth-colour ruling)*

## Ready

- [[t13]] **SPEC — Scene 1 · Boot and Intro** — boot the game so the direction is visible and the evidence pass can start *(ready-for-agent, owner `game-dev`, boundary: the boot entry and its test; `github` #11; **no Hermes card yet — the card is created only after the agent brief exists**)*
- [[t3]] SPEC — Scene 1: the text, the journey, and the door *(the authority; decomposed into t4–t10)*

## Doing

_(nothing creative is in flight — `t4` landed and `t12` is blocked; the active work is technical and tracked off-board below)_

## Blocked

- [[t15]] **DECISION — the trio has two live canons and they disagree** *(needs-info — the owner's ruling. `AGENTS.md` + both souls say **LIGHT/MISCHIEF/WRATH**; `t3` + the environment skill + the landed `affinity` module say **Light/Shadow/Ambition**. Not just names — the mapping conflicts, and only Position B has colours. **Blocks [[t14]]** )*
- [[t12]] Scene 1 · Content — questions, authored mistakes, creative cards → card `t_c710df60` to `omega-project-librarian`. **Blocked by `omega-project-librarian`'s own dead OpenRouter credential**, not by its own work. Verified: the profile returns `HTTP 401: User not found` on its current model. Needs an operator credential refresh. First attempt `t_a7b87086` retired.
- [[t5]] Scene 1 · The console — ghostwritten text, choices, and name entry *(blocked by t4 — now satisfied; blocked in practice by the undecided A/B/C console presentation)*
- [[t6]] Scene 1 · The universe — cosmic background, the lemniscate journey, and the door *(blocked by t4)*
- [[t7]] Scene 1 · Dreamweaver presence — the ladder, identity in behaviour, sparks *(blocked by t4)*
- [[t8]] Scene 1 · Audio hooks — asking to speak, and a voice with no words yet *(blocked by t4, and by the undecided audio source — no ElevenLabs key exists)*
- [[t9]] Scene 1 · Evidence — the browser pass that proves it is real *(blocked by t5, t6, t7, t8)*
- [[t10]] Scene 1 · Design artifacts and copy cards — reconcile the written record *(needs-info — needs the owner's rulings)*

> **Off-board work — technical, so it lives in GitHub Issues, not here:**
>
> - **Boot — wire the host into the game so it runs** · issue **#11** · specced here as **`[[t13]]`** (`ready-for-agent`). **The card `t_f1153b09` was killed** — it was hand-written without `/to-tickets` or `/triage`, with no code exploration, no defined test, no commands, and unverifiable acceptance. Do not resurrect it. The replacement path is: `/triage` issue #11 → redundancy check, verify the claim → **agent brief as a comment** → only then a Hermes card. This is the immediate next build step.
> - **Process-config docs** · issue **#8** — the stale alpha vocabulary and the three-lane split, to resolve via `/grill-with-docs`.
> - **Minor technical issues ledger** · issue **#9** — the standing collector.
>
> **Diagnosed and closed:** the provider-401 crash cascade (`t_c0846019` → `buzz`) resolved to **five distinct faults**, not one. Full root cause is on that card. Two remain open and are the operator's: the dead `omega-project-librarian` credential, and the absence of a `fallback_model`.
>
> **Still true:** the board has **no `default_workdir`**, so a `workspace_kind=worktree` card created without an explicit path cannot spawn. Worked around by passing the path explicitly.

## Review

## Done

- [[t4]] Scene 1 · Foundation — scene host, typed events, seeded randomness, pure rules *(commit `72e976c` on `wt/t_baf85a0e`; 17 files, 2155 insertions; **50/50 tests, typecheck and build clean, RED contract byte-identical**; pushed, draft **PR #10** open)*
- [[t11]] Blender MCP — installed and verified *(bridge listening on 127.0.0.1:9876; 26 tools enabled in Hermes; export path still open)*

%% kanban:settings
```
{"kanban-plugin":"board"}
```
%%

# Omega Spiral Production Wayfinder

**Destination:** release **one epic scene at a time** until the final scene. The Alpha 0.1 / Alpha 0.2 split is retired.

**Authority:** the role roster lives in the tracker at `C:\SpiralDrive\omega-alpha-spiral\project-management\ROLES.md`. **This page mirrors it. If they disagree, `ROLES.md` wins.** The board owns current work; the Scene spec owns scene decisions.

> **This page previously listed invented role names — Captain, Sol, Terra, Modlens, Mimo, Nemo, DeepSeek 4.1.** None of those are profiles on this machine, so none could ever be assigned work. They are retired. Only the names below are assignable.

## The flow

```text
                    OPERATOR  (jesse)
        scope · taste · agent creation · push approval
                            |
                            v
        ROUTING  —  held by Direction (leader work)
        the board · cards · verified assignees · gates
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   DIRECTION             BUILD                WORDS
   omega-game-director   game-dev             omega-project-librarian
   creative + art lead   game source          copy, cards, docs
        |                   |                   |
        +---------+---------+---------+---------+
                  |                   |
                  v                   v
                ART                 CHECK
            design-dev              reviewer
         look · motion · VFX    spec first, quality second
                  |                   |
                  +---------+---------+
                            |
                            v
                    PUBLISH — check-in-agent
                    draft PRs · one exact SHA
                            |
                            v
                    OPERATOR REVIEWS THE BUILD
```

**Scouts, drawn on demand and assigned to no lane:** `buzz` (bounded research, cited) · `hermit-the-crab` (locate code, reproduce an issue, narrow audit).

## The roster

| Role | Profile | Owns | Returns |
|---|---|---|---|
| Operator | *(you)* | Scope, taste, **creating and configuring agents**, push and deploy approval | Approval or a concise correction |
| Routing | `omega-game-director` *(with Direction)* | The board: cards, verified assignees, `parents=[...]` gates, escalation, hygiene | Cards that end ready / running / blocked-with-reason / done |
| Direction | `omega-game-director` | Creative lead, art lead, integration, final visual call | Working build, limitations, the next decision |
| Build | `game-dev` | Game source — one ticket, one file boundary, TDD | Files, commands, real output, `CHECK-IN v1` |
| Art | `design-dev` | Look, motion, effects, the visual scorecard | Versioned candidate plus in-engine captures |
| Words | `omega-project-librarian` | Questions, copy, creative cards, the docs vault | Draft text plus named weakest lines |
| Check | `reviewer` | Independent verification — **spec compliance first, quality second** | Pass, or structured findings. Never edits |
| Publish | `check-in-agent` | GitHub checkpoints as draft PRs | One exact SHA, no merge |
| Scout | `buzz` | Bounded web/source research | Cited findings with uncertainty stated |

## Budget

**Four dedicated agents** (operator, 2026-09-17), protected from other projects. All four slots are filled: **Build** `game-dev` · **Art** `design-dev` · **Words** `omega-project-librarian` · **Check** `reviewer`.

Direction **and** Routing sit with `omega-game-director` — leader work does not consume a worker slot. The trade-off is accepted: the same agent that plans also routes, so **review independence matters more, not less.**

`check-in-agent`, `buzz`, and `hermit-the-crab` are used **on demand** and are never dedicated. `data-curriculum`, `mr-barnyard`, and `Big Brain` belong to other projects and take no Omega Spiral work.

## Work lanes

```text
LANE A  Foundation      core · game · state · input · tests          → game-dev
LANE B  Scene build     one scene at a time, terminal → the loop     → game-dev
LANE C  Visual          authored surfaces, capture, scorecard       → design-dev
LANE D  Words           questions · copy · creative cards            → omega-project-librarian
LANE E  Check           real-input browser pass · evidence           → reviewer
LANE F  Release         draft-PR checkpoint · operator review        → check-in-agent
LANE G  Blender         tooling · pipeline · asset export            → direction, with the operator
```

## Handoff rule

Every delegated card names **three skills** in its `skills` header row, in this order: `omega-spiral-environment`, the persona for the role, and the applicable `threejs-*` skill. **The row is what gets force-loaded — naming a skill in prose does not attach it.**

Every card also declares a **file boundary** so parallel agents cannot collide, and states its **acceptance** and **verify** explicitly. Raw logs stay in the worker's context; the lead receives changed files, observed evidence, decisions, risks, and a bounded handoff.

An agent that cannot tell what it was assigned will invent work someone else has to unpick. If the assignment is unclear, it stops and asks.

## Good-enough rule

Plan to the depth that lets work begin, then improve details when play, tests, screenshots, or the operator reveal a concrete problem. Do not add another preflight pass merely to make planning feel complete.

## Standing constraints (from the ANCHOR, still correct)

- Verify every assignee exists before creating a card — the dispatcher **silently drops** unknown names and the card sits in `ready` forever.
- Label claims **Verified / Inferred / Unknown**. Stop honestly when evidence is missing.
- **Facts are the agent's job. Decisions are the operator's.**
- A card needing a human decision blocks with `needs_input` and **stops**. Never spin. Alert the operator in one short message: what, blocked on what, what is needed.
- Draft PRs only. No merge, no push to `main`, without explicit authorization.
- Never retain credentials or tokens.

## Current route

1. Finish **Scene 1** through its gates: foundation → console, universe, presence, audio → evidence.
2. Prove the **Blender export path** end to end, and decide which surfaces Blender authors versus procedural Three.js.
3. Spec **Scene 2** from the Scene 1 result.
4. Clear the five open roster decisions in `ROLES.md` (reviewer scope, `check-in-agent`'s job, second-opinion review, orphaned cards, the stale ANCHOR).

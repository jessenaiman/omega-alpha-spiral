---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral — Roles

**One roster. If this file and any other disagree, this file wins and the other is corrected.**

Repo-side mirror: `docs/coordination/omega-production-wayfinder.md`.

## Why the roles were confusing — three overlapping vocabularies

| Vocabulary | Source | Status |
|---|---|---|
| **Anchor names** — Helix, `omega-gameplay-engineer`, `omega-tech-artist`, `omega-playtest-critic`, `omega-spiral-security-reviewer` | ANCHOR card `t_88fcdf78`, 2026-09-14 | **Five of the nine profiles no longer exist.** Retired names — do not assign work to them. |
| **Current profile names** — `game-dev`, `design-dev`, `reviewer` | created or repurposed 2026-09-17 | Live. |
| **Director-skill names** — lead, implementer, reviewer, "up to two workers" | `threejs-game-director`, `subagent-driven-development` | Live. Used for card *shape*, not for assignees. |

Nothing was wrong with any single list. The failure was that **the roster changed and no document changed**, so three descriptions of the team coexisted and the newest one was never written down.

## The roster — 4 dedicated agents, verified against `hermes profile list`, 2026-09-17

**Governing constraint (operator, 2026-09-17): this project gets up to FOUR dedicated Hermes agents, protected from other projects.** That replaces the ANCHOR's blanket *"no new agents."* Five former agents were deleted, so the budget is not overspent.

| # | Role | Profile | Owns | Status |
|---|---|---|---|---|
| 1 | **Direction + Routing** | `omega-game-director` | Creative lead, art lead, integration, final visual call **and** the board: cards, verified assignees, `parents=[...]` gates, escalation, hygiene | filled |
| 2 | **Build** | `game-dev` | Game source. One ticket, one file boundary, TDD | filled — slot 1/4 |
| 3 | **Art** | `design-dev` | Look, motion, effects, the visual scorecard | filled — slot 2/4 |
| 4 | **Words** | `omega-project-librarian` | Questions, copy, creative cards, the docs vault | filled — slot 3/4 |
| 5 | **Check** | `reviewer` | Independent verification — spec compliance **first**, quality second | filled — slot 4/4, **mis-scoped, see below** |

**Why routing sits with Direction:** the director skill puts planning, interfaces, and integration with the lead, and says to *"keep the immediate blocking integration work with the lead."* Routing is leader work, so it does not consume one of the four worker slots. The trade-off is real and accepted: the same agent that plans also routes, so **review independence matters more, not less.**

**Outside the four — used on demand, never dedicated:**

| Role | Profile | When |
|---|---|---|
| Publish | `check-in-agent` | Only to land a draft-PR checkpoint at one exact SHA. A checkpoint commit is an action, not a role. |
| Systems expert | `buzz` | **General** systems and infrastructure diagnosis — provider/auth faults, dispatcher and config behaviour, tooling. **Project-agnostic: never trained on Omega Spiral** — the project context rides in the card body. **Not an orchestrator.** |
| Recon | `hermit-the-crab` | Locate code, reproduce an issue, narrow audit. Occasional. |

**Not ours — other projects' profiles:** `data-curriculum` (education data), `mr-barnyard` (education), `Big Brain` (default). The operator keeps these out of Omega Spiral work.

## The problems this exposes

1. **Orphaned cards.** Four blocked cards are assigned to **deleted profiles** and can never dispatch: `t_ae97579c`, `t_64bc81db` (both Helix), `t_b1d4e198`, `t_c883f38e` (both `omega-gameplay-engineer`). They need retiring or reassigning.

2. **`reviewer` is scoped to the wrong domain.** Its description reads *"read-only code reviewer for **Next.js/React** changes… via **next-devtools** MCP… grounds performance findings in **Vercel's** published rules."* This project is **Three.js + Vite**. As written, it cannot review the right things. Its description must be rewritten before it is used for review.

3. **`check-in-agent` has two different jobs.** Its description says it *"reviews, validates, and returns actionable changes"* — a reviewer. The anchor assigned it *"GitHub checkpoint publisher"* — a publisher. Those are different roles and it cannot be both without ambiguity. It also holds the project's handoff-validation skill, which is a third thing.

4. **Two verdict roles collapsed into one.** The anchor had `omega-playtest-critic` (play experience) and `omega-spiral-security-reviewer` (security + accessibility) as *independent* reviewers. Both are deleted. `reviewer` now carries spec, quality, playtest, and a11y alone — which breaks the principle that independent verification should not be one opinion.

## Decisions still needed (operator)

1. **Rewrite `reviewer`'s description** for Three.js/Vite, or stop using the slot for review. As written it reviews Next.js/React via `next-devtools` and grounds findings in Vercel's rules — the wrong domain, so it cannot judge the right things.
2. **Pick `check-in-agent`'s single job:** publisher, validator, or both with explicitly separated duties. Its description (validate and return changes) and the ANCHOR's assignment (GitHub checkpoint publisher) describe different roles.
3. **Independent review is down to one opinion.** The ANCHOR had `omega-playtest-critic` (play experience) and `omega-spiral-security-reviewer` (security + accessibility) as separate independent reviewers. Both are deleted, so `reviewer` now carries spec, quality, playtest, and a11y. Reinstate a second opinion, or accept the risk knowingly.
4. **The four orphaned cards:** retire, or reassign to live profiles.
5. **Update or retire the ANCHOR.** It is the "read first" card and its roster is now 5/9 wrong — every new agent that follows it starts misinformed.

**Resolved 2026-09-17:** Routing is owned by Direction. Budget is 4 dedicated agents. Build, Art, Words, and Check occupy all four slots.

## Rules that still stand (from the ANCHOR, still correct)

- Board `omega-spiral-demo` is authority; `omega-spiral-game` is historical only.
- Verify every assignee exists before creating a card — the dispatcher **silently drops** unknown names and the card sits in `ready` forever.
- Label every claim **Verified / Inferred / Unknown**. Stop honestly when evidence is missing.
- **Facts are the agent's job. Decisions are the operator's.**
- Card needs a human decision → block with `needs_input` and **stop**; never spin. Alert the operator in one short message: what, blocked on what, what's needed.
- Draft PRs only. No merge, no push to `main`, without explicit authorization.
- Never retain credentials or tokens.

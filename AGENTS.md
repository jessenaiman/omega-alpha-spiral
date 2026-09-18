# Omega Spiral Agent Guide

## Authority
1. `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`
2. Current Alpha plan under `docs/superpowers/plans/`
3. `docs/game/` contract for the active subsystem
4. DSH task-board assignment

## Coordination
- Read `docs/coordination/omega-production-wayfinder.md` for roles and lanes.
- Captain builds and integrates each scene. Use normal subagents for small precise tasks.
- Every delegated prompt names the applicable `threejs-*` skill. Call it and follow it completely. Never invent evidence.

## Required Flows
- Feature or fix: load `test-driven-development`; observe RED before production code.
- Gameplay, art, UI, audio, or release: load `threejs-game-director` plus the matching sibling skill.
- **Blender:** load `blender-mcp`. Health check before touching any scene; GLTF exports go through the headless CLI, never MCP.

## Roles
- **The role roster is `docs/coordination/omega-production-wayfinder.md`.** It mirrors `ROLES.md` in the tracker, which wins on any disagreement.
- Roles are **real profile names** — `game-dev`, `design-dev`, `reviewer`, `omega-project-librarian`, `check-in-agent`, `buzz`, `hermit-the-crab`. Never invent an assignee: the dispatcher silently drops unknown names and the card sits in `ready` forever.
- **Routing** is held by `omega-game-director` (Direction), because the director skill puts planning, integration, and the blocking work with the lead.
- **Budget: four dedicated agents** — `game-dev` (Build), `design-dev` (Art), `omega-project-librarian` (Words), `reviewer` (Check). `check-in-agent`, `buzz`, and `hermit-the-crab` are drawn on demand and never dedicated.
- Retired names, none of which exist as profiles: Captain, Sol, Terra, Modlens, Mimo, Nemo, Helix, `omega-gameplay-engineer`, `omega-tech-artist`, `omega-playtest-critic`, `omega-spiral-security-reviewer`, `terra-sol-flash-design-loop`.
- Every card names its three skills in its `skills` header row — `omega-spiral-environment`, the persona, and the `threejs-*` skill. The row is what gets loaded; prose does not attach.

## Commands
`npm run typecheck` · `npm run test:unit` · `npm run test:browser` · `npm run build`

## Boundaries
Alpha 0.1 is the full playable loop. Alpha 0.2 owns Blender replacements. Captain owns installation and interactive Blender/Affinity work. Use npm only. Keep the reference repository read-only. Never push or deploy without explicit user approval.

## Agent skills

### Issue tracker

Tickets are Obsidian vault notes under `C:\obsidian\Project Management\Omega Spiral\Tasks` — not GitHub Issues. The GitHub remote is for code only. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, held as a ticket's `status` field, plus the terminal `done` state. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.

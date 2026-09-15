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
- Visual asset: load `terra-sol-flash-design-loop`; run Terra → Sol → approved Modlens → captain pixel review.
- Gameplay, art, UI, audio, or release: load `threejs-game-director` plus the matching sibling skill.

## Commands
`npm run typecheck` · `npm run test:unit` · `npm run test:browser` · `npm run build`

## Boundaries
Alpha 0.1 is the full playable loop. Alpha 0.2 owns Blender replacements. Captain owns installation and interactive Blender/Affinity work. Use npm only. Keep the reference repository read-only. Never push or deploy without explicit user approval.

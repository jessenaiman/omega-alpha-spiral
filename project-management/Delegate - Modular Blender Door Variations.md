---
tags: [omega-spiral, staging, delegation]
status: staging
---
# Delegate — Modular Blender door variations

Copy the prompt below to an asset agent. Do not auto-dispatch it. The director owns gameplay; this worker owns reviewable assets only.

## Agent prompt

Build ONE small variation of the modular doorway, show it, then wait for feedback. Jank is acceptable; do not spend a whole run polishing. Read `AGENTS.md`, the current status/board, and the relevant handoff first; confirm your branch. Use `blender-mcp` and `threejs-3d-generator` skills. Work in your own asset branch/worktree, never switch or modify the director's dirty `wt/t_65b7c660` checkout.

Read-only starting example:
- `C:/SpiralDrive/omega-alpha-spiral/.worktrees/t_65b7c660/assets/intro/threshold-runtime/threshold-door-only.blend`
- Its `create_door_only.py`, `export_threshold.py`, and `door-only-report.json` explain the verified pipeline.
- Creative authority: `project-management/official game docs (read-only)/chapter-zero-stages`; code there is pseudocode, not production code.

### Ownership and direction
- Blender owns modular door pieces only. No cosmic background, star field, text, portraits, game camera, or gameplay logic in exports.
- Three.js owns tiny starting primitives and stars. Your parts must accommodate a transition from small simple shapes into larger authored pieces, not appear full-sized immediately.
- Try one restrained variation in shape/material/era. The opening is not from a single technological era. Do not invent a new story, rewrite Omega, or select final canon.
- Use the existing silver/blue-white, gold-amber, crimson vocabulary. A readable silhouette matters more than extra glow.

### Output contract
- Save a new `.blend` and `.glb`; never overwrite the original study.
- State units, axes, origin, bounds, material count, triangle count, node names, and animation clip/duration. Keep pieces separately identifiable, and retain a clear opening the character can pass through.
- Export only explicitly allowed door geometry; reject preview-only objects, background textures, decorative sparkles, cameras, and lights from the runtime GLB.
- Reopen the saved blend, load the actual GLB, and provide a transparent-background still plus a short animation capture. Report missing files and actual command results.
- Read back the saved/exported files before claiming success. A worker message is not evidence.

### Recovery and stopping
Blender MCP previously failed with `TraceFlags.RANDOM_TRACE_ID`; **headless Blender, not live MCP, was verified**. Try one MCP health check. If it fails, report the exact error and use the installed headless executable with an absolute Windows path; do not repeatedly retry. Never claim live MCP is fixed without proving it.

Keep the first pass bounded to one candidate. Do not touch runtime code, run unrelated suites, commit, push, or merge. Return paths and observations to the director. The owner approves the art.

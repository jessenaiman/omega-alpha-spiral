---
tags: [omega-spiral, omega-spiral/setup]
---
# Omega Spiral — Creative Hub

This folder is the Obsidian workspace for creative brainstorming, shaping, decisions, and asynchronous review.

GitHub Issues is the only source of truth for specs, tickets, acceptance criteria, dependencies, and work status. Do not recreate that execution record here.

## Current milestone

**Floor One:** a standalone modern NetHack/Rogue demo. A low-poly world sits over a visible code/ASCII substrate. The first verbs are **Talk**, **Hit**, and **Run**, with desktop keyboard input first.

## Creative flow

1. Capture an idea in `Tasks/` with `Templates/TASK.md`.
2. Move the note through the creative stages in `BOARD.md`.
3. Resolve design questions until the note meets its ready-for-spec conditions.
4. Run `/to-spec` to publish the executable specification to GitHub Issues.
5. Add the resulting GitHub link to the note and move it to **Published**.
6. Use `/to-tickets` when a published GitHub spec needs decomposition.

After publication, GitHub owns acceptance and status. Obsidian can continue to hold sketches, references, owner notes, and review feedback without copying GitHub fields.

## Workspace map

| File | Purpose |
|---|---|
| `STATUS.md` | Current creative milestone and direction |
| `BOARD.md` | Creative-stage board |
| `Tasks/` | Idea and shaping notes, including useful legacy creative notes |
| `Templates/TASK.md` | New creative-note template |
| `UI-REVIEW.md` | Floor One asynchronous feedback inbox |
| `WORKFLOW PROCESS.md` | Promotion path from idea to GitHub |
| `ROLES.md` | Routing vocabulary; not an execution board |

## Existing notes

Older `t*.md` files remain useful source material. Their old ticket metadata is historical, not current work status. Link useful material from `BOARD.md`; create new technical work only in GitHub Issues.

## Links

- [GitHub Issues](https://github.com/jessenaiman/omega-alpha-spiral/issues)
- [[UI-REVIEW|Floor One feedback inbox]]

# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `domain-modeling` skill (reached via `grill-with-docs` and `improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo is **single-context**:

```
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## This repo's existing authority documents

`CONTEXT.md` and `docs/adr/` do not exist yet and are created lazily. Until they do, the domain authority for this repo is the document hierarchy in `AGENTS.md`:

1. `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`
2. The current Alpha plan under `docs/superpowers/plans/`
3. `docs/game/` — the contract for the active subsystem
4. The DSH task-board assignment

Read those before exploring, in that order. They outrank anything inferred from the code.

Player-facing vocabulary is fixed and must not drift. The three public choices are **Light**, **Shadow**, and **Ambition**; their code ids are `luminary`, `shadow`, `ambition`.

Identity colours are canon and come from the logo: **silver-white / blue-white (Light)**, **gold-amber (Shadow)**, **crimson (Ambition)**. Any file with different identity colours is wrong and must be corrected. Neon colour is allowed only as illumination or glow at low opacity — never as identity. Known violations to fix: `nethack.yaml` accents (Light `#c9ffdd` mint, Shadow `#f38bff` magenta, Ambition `#ff6868` salmon) and `ghost_design_document.md` (gives the Light thread a warm gold/amber tint).

Note: the source repository's stage 3 material uses `light` / `mischief` / `wrath` in its schema enum and dialogue. That is the older naming and is **superseded** — do not introduce `mischief`, `wrath`, or `trickster` into this repo's code, tickets, or copy.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

# Domain Docs

This is a single-context repository. Before exploring or changing domain behavior, read:

1. root `CONTEXT.md` for canonical terms and facts;
2. relevant ADRs under `docs/adr/` for durable decisions.

If `docs/adr/` or a relevant ADR does not exist, proceed without inventing one. Use `/domain-modeling` when a real terminology gap or durable decision needs a record.

Use glossary terms from `CONTEXT.md` in code, tests, issues, and documentation. Do not replace them with avoided synonyms. If proposed work conflicts with an ADR, name the conflict instead of silently overriding the decision.

Current Dreamweaver canon has exactly three identities: Light (`light`), Shadow (`shadow`), and Ambition (`ambition`). `CONTEXT.md` is the authority for their meanings, colours, and visual language.

# learnings

- Read STATUS.md + BOARD.md + the branch's Handoff BEFORE acting; report task/branch/last-result/next-step and confirm with the user. Skipping the handoff check cost a whole turn of mis-aimed work.
- When branches diverge, check `git log main..HEAD` / `git diff --stat main` FIRST — the dialog-editor looked "lost" but was simply on main; knowing that turned a hunt into a merge.
- Stash-pop over a merge creates `Updated upstream`/`Stashed changes` conflict markers, NOT `HEAD`/`=======` style pure conflicts — write the conflict resolver against all label variants.
- Sibling skill dirs legitimately live in BOTH `skills/` and `.claude/skills/`; resolving conflicts there is expected drift-repair, and each used skill needs `learnings.md` appended per skills/README.md contract.

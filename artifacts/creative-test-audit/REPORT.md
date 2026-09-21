# Creative-safe mechanics test audit

## Result

✅ The authorized test cleanup is complete. Creative draft assertions were removed or reduced to mechanics-only checks. Production source, HTML, CSS, manifests, shared config, creative source documents, `Handoffs/32.md`, and other worktrees were not edited.

## Test files changed in this pass

- `tests/browser/chapter-zero-bot.spec.ts`
- `tests/browser/intro-story.spec.ts`
- `tests/unit/chapter-two.test.ts`
- `tests/unit/intro-door-asset.test.ts`

The stale narrowing in `tests/unit/chapter-two.test.ts` was fixed without weakening its transition assertions.

## Creative locks removed

- Removed runtime JSON == reference-source JSON and exact question/option copy assertions.
- Removed assertions on authored revision numbers, guide/owner names, script fragments, and canonical encounter prose.
- Replaced the fixed three-room narrative loop with a completion-driven mechanical loop.
- Replaced display-label button lookups with stable DOM IDs.
- Removed GLB node-name checks that rejected preview/background/spark naming choices; retained valid glTF header, JSON chunk, node, and animation checks.
- Neutralized unit-test input text and thread identifiers where they were only draft wording.

## Mechanics retained

- Current offered choices are counted and driven with real keyboard input.
- Real movement advances frames and distance; encounter input is accepted only through the live UI.
- Pause holds player position, distance, answer text, and rewriting progress.
- Rewriting waits for input and retains prior choices.
- Completion, reset, replay, error capture, and empty-input rejection remain covered.
- Deterministic scoring/tie behavior remains checked without asserting a canonical guide name.
- Door asset format/animation validity and reversible formation behavior remain covered.

## Ponytail findings

✅ Ranked delete/shrink findings applied in the authorized test scope:

1. `delete` source/reference deep equality and copied prose assertions in `chapter-zero-bot.spec.ts`; they froze draft content without protecting a mechanic.
2. `shrink` fixed narrative room-count and revision/owner/script assertions into current-state completion, phase, choice-retention, and stable-control checks.
3. `delete` aesthetic GLB node-name exclusions in `intro-door-asset.test.ts`; retain asset validity checks only.

Measured tracked diff at report time: 35 insertions and 64 deletions across the tracked test diff (`git diff --numstat -- tests`). Untracked test files were already present in the worktree, so no invented baseline line count is reported for them.

## Verification

- ✅ `npm.cmd run typecheck` — passed (`tsc --noEmit`).
- ✅ `npm.cmd run test:unit` — passed, 26/26.
- ❌ Initial `npm run typecheck` invocation was blocked by PowerShell execution policy before npm ran; `npm.cmd` was the one narrow workaround.
- ⏸ Browser tests were not run because port 5188/UI stabilization is director-owned.

Affected browser suites for the director’s final stable-build run:

- `tests/browser/chapter-zero-bot.spec.ts`
- `tests/browser/intro-story.spec.ts`

## Remaining boundaries

❌ The requested Hermes skill paths were unavailable (permission denied/nonexistent). The available repository `ponytail-audit` and `ponytail` copies were read instead. `threejs-qa-release` was read successfully. The requested `coding-standards/index.md` was absent; available TypeScript standards were read.

❌ Hindsight search/read tools were not exposed in this session, so no Hindsight page lookup could be performed.

❌ No independent review, full browser verification, production build verification, or complete-game claim is made. The ChapterTwo rewrite UI remains director-owned.

Actual blocking questions: none.

# Ghost typing visual prototype

Promoted to [Omega Dialogue Studio](../omega-dialogue-studio/README.md). Use `/omega-dialogue-studio.html`; the former URL redirects. Notes below preserve the original study context.

## Destination and current decision

[Wayfinder map](https://github.com/jessenaiman/omega-alpha-spiral/issues/55) → [active visual decision](https://github.com/jessenaiman/omega-alpha-spiral/issues/56) → [approved implementation brief](https://github.com/jessenaiman/omega-alpha-spiral/issues/54).

The owner approved building. Choosing or combining the three treatments still requires the owner's visual feedback. Execution is included in the map by explicit request. No decision is closed by an agent's assessment.

## Run and compare

`npm run dev -- --port 5191`

- `/intro-type-prototype.html?variant=manuscript`: one voice in a stable spatial manuscript.
- `?variant=fragments`: four separated floating voices, selected voice emphasized.
- `?variant=passage`: words extend across depth; geometry follows the speaker's rule.
- Select a voice, replay/pause, or open **Tune voice**. Left/right arrows change layout except inside editable controls.
- **Same sample** compares rhythm/geometry without semantic revisions.
- **Answer, then watch** records Omega's original displayed sample and schedules its authored revision. It has no game consequence.
- **Scene owner** selects Opening/Omega, Floor 1/Light, Floor 2/Shadow, or Floor 3/Ambition. **Shared text era** changes every voice's lettering immediately; it never changes their individual typing rhythm or geometric rules. Reduced motion removes spatial drift.

Sample text is noncanonical. This is a disposable study beside the intro, not a replacement for it. No original narrative file is imported.

## Config and integration boundary

Speaker data is in `profiles.ts`: interval, offset, jitter, mistake frequency, correction/revision delay, sample and authored replacement pair. UI edits stay in memory. Replaying uses a fixed seed for comparisons.

Shared era presets and scene ownership live in `src/core/sceneTypography.ts`, independent of the study renderer. The current scene and era are encoded in the URL; edits for other scenes remain in memory during the session. All scenes initially use phosphor until an era is chosen: specific floor-era assignments have not been approved. These are period-inspired art presets, not historical hardware/font emulations.

Every speaker and its revision traces receive the same scene era. Speaker selection does not change scene ownership. `ghost-study:scene-typography-changed` reports scene, owner, and era for the future dialogue/scene adapter. Game-wide adoption beyond this prototype is pending integration.

`WritingPlayback` only sequences fixed sample text and edits. `GhostLetters` renders an instanced readable canvas glyph atlas through a shader; it does not branch dialogue. The study dispatches `ghost-study:line-complete` with speaker, text and completion phase. The owner of [the dialogue runner](https://github.com/jessenaiman/omega-alpha-spiral/issues/53) must agree the final adapter and scene acknowledgement contract before live integration.

## Character language

- **System output**: Omega's recorded writing in an era-specific display convention. Appearance of thinking does not establish live awareness.
- **Ghost typing**: visible arrival, hesitation, correction and revision of words in space.
- **Revision**: an authored word replacement or retraction; distinct from an accidental character typo.
- **Directional writing**: Light remains straight and organized; Shadow turns between straight segments; Ambition curves toward an intended target.

## UI inventory

Loading, writing, mistake, correcting, completed, reconsidering, retracting, revised, paused and replay. Settings are study-only controls. Fail/win, survival HUD, inventory, and mobile locomotion do not belong to this slice. Buttons retain focus/hover/pressed/disabled feedback; the completed text has an accessible DOM mirror.

## Assets and delegation

- Luna: `luna-profile-draft.md`; constants reviewed by lead. Runtime strips the noncanonical prefix because the study chrome carries it.
- Luna + native OpenAI imagegen: `assets/concepts/ghost-type-study/luna-visual-draft.png`; 1536×1024. Three Dreamweaver panels plus comparison. Requested Omega panel is absent, so this is not a complete four-voice concept.
- Runtime uses no generated text sprites: deterministic canvas glyphs preserve spelling. The image is reference-only.

## Loaded skills

Wayfinder; its grilling, domain-modeling and prototype/UI guidance; Three.js director; UI designer + UI patterns; graphics builder + shader cookbook/technical art; image generator (native OpenAI substitution); ponytail; caveman-commit for message format. No provider keys or Gemini/Pollinations calls used.

## Verification ownership

No extra unit tests. Existing tests run through normal focused commits per latest owner direction. Startup and visual observations are recorded separately from hook results. Captures are not yet a complete motion/viewport evidence set. Do not carry forward historical intro evidence as proof of this study.

### First commit gate, September 23

Normal commit hook ran Prettier, TypeScript, then the existing 23 unit tests. TypeScript passed; 22 tests passed and one existing intro test failed: `the runtime chronicle owns four questions, three answers each, and a plural ending`. It expects `Dreamweaver threads following - 03`, but the current narrative returns `Dreamweaver thread selected - {{THREAD_NAME}}`. No study file imports or edits that narrative. The owner explicitly approved committing this isolated prototype with the known failure documented and skipping the hook for that one commit. No extra tests were written and no repeat test run was made.

Live observation: the worktree's Vite server starts on port 5191 and the manuscript renders readable instanced text. Initial fragment review exposed left-edge clipping for Light; its placement was brought inward and the old-word trace now fades after revision. This remains a visual prototype awaiting the owner's choice, not approved final art.

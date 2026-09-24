# Opening integration check — 2026-09-23

## Direct browser observation

- With owner permission, reloaded the studio and opened the real intro at localhost:5191.
- Earlier intro tab had closed. Fresh intro rendered black spatial scene, distinct thin strands and DOS shader lettering. The previous unstyled page did not recur; root cause remains unknown.
- Browser error/warning capture returned empty arrays for both pages during this check. This is not a claim about all gameplay states.
- Studio displayed its ordered opening, selected instruction controls, shared era selector and Apply to game action.

## Owner verification

Requested check: change studio era → Apply to game → reload intro → Continue to paths.

Owner reply: **“Saved era appears and Continue works.”** This supports that specific authoring handoff. Full five-question progression, typed name, doorway and next-stage behavior have not been reverified with the new adapter.

## Code corrections this pass

- Save completion now records the actual submitted snapshot; newer edits are not falsely reported as saved.
- Failed sequence restructuring restores the previous selected index rather than leaving the editor pointed beyond its unchanged event list.
- These two error/race paths have source review only; no new tests or test suite ran this pass.

## Current status

Integration and these corrections remain local. Historical captures in the root manifest predate this work. Qwen assignment: #57. Current consumer boundary: [gameplay contract](gameplay-contract.md). VoiceStudio stays on hold.

# Omega Studio ↔ game: current integration contract

Status: opening adapter implemented locally; not yet included in checkpoint `544639d`. Owner confirmed saved era appears in the intro and Continue reaches the paths. This is the current interface, not the completed #53 contract. Qwen's extension work is tracked in #57.

## Load only what the consumer needs

- Data: `src/intro/ghost-type-study/opening.dialogue.json`.
- Validator/types/runner: `src/intro/ghost-type-study/DialogueTimeline.ts` and adjacent `dialogue.schema.json`.
- Opening adapter: `src/intro/StudioOpening.ts`.
- Presentation: `profiles.ts`, `WritingPlayback.ts`, `GhostLetters.ts` in the studio directory; shared era definitions in `src/core/sceneTypography.ts`.

The editor implementation and research reports are not prerequisites for a game consumer. Read this contract, the schema and the relevant dialogue/profile IDs.

## Data, ownership and supported behavior

UTF-8 `.dialogue.json`, `schemaVersion: 1`. `parseDialogue(raw)` validates the schema and unique event IDs. Documents carry a title, source provenance and ordered events. Presentation optionally selects scene, era, layout and voice timing overrides.

| Instruction | Runner advances when |
| --- | --- |
| `line` with explicit speaker and text | Host reports lettering finished |
| `wait` with duration in milliseconds | Host's unpaused clock reaches the duration |
| `continue` with prompt label | Host explicitly calls `proceed()` |

The runner never infers an answer, speaker or script call from the wording. No arbitrary script execution is supported. Current rendering accepts Omega, Light, Shadow and Ambition; arbitrary NPC rendering is still outstanding even though the schema allows speaker IDs.

Scene owner determines the shared era, independently of question number. Voice settings determine cadence, mistakes and corrections. The game owns input, movement, camera, world effects, player choices and stage transitions. The same `WritingPlayback` and `GhostLetters` implementation serves the editor and opening presentation.

## Current host API

`DialogueTimeline(document, onEnter)` reports each entered instruction, or `undefined` at the end. `start(index = 0)` starts/restarts at an instruction and clears its elapsed wait. `tick(deltaMs, lineFinished)` advances at most one event; callers supply their paused clock and the completion of the current line. `proceed()` advances only an explicit continue event.

`StudioOpening.advance(deltaMs, reducedMotion)` returns `{ text, speaker, awaiting, done }`. It drives the shared timeline and writing clock. `proceed()` releases an explicit continue. Construct a new adapter to restart the opening. The adapter imports the authored opening document and validates supported profiles at load time.

Current intro integration uses the last authored line as the first question and preserves the existing choices. Once the opening document ends, the existing game controller owns the subsequent question/response/travel/name/door flow. Those later story instructions are **not yet fully document-driven**. Do not interpret the first handoff as migration of the whole game.

## Editing and project persistence

The studio opens/exports JSON, edits the ordered document and previews it. `Apply to game` sends `{ base, document }` to the local Vite endpoint `POST /api/studio/opening`. The endpoint writes only the fixed opening file after schema/profile validation and comparison against the loaded base. It rejects stale writes with 409; export the draft and reload before reconciling it. Invalid data leaves the project file intact. The request's submitted snapshot, not subsequent edits, becomes the client's saved base.

Project saving currently requires the localhost development server. Static production builds can export files but do not provide this write endpoint. Reload the game to consume the saved document. There is no general multi-document project store or gameplay save/resume contract yet.

## Required extension boundary for #53 / #57

Still to implement and demonstrate: ordinary NPC profiles, calls/returns, choice/condition/state instructions, typed input, named scene cues and acknowledgements, stale callback protection, selected-word performance overrides and whole-opening migration.

Agree backward-compatible schema changes and shared-file ownership before implementation. Scene cues should name stable actions/assets and await game completion; editor simulations must be visibly labeled. Blender assets remain owned by the visual team. A future run ID or equivalent cancellation mechanism must prevent old acknowledgements from advancing a restarted scene.

Keep this consumer contract short as the implementation grows. Link detailed authoring and research documents rather than copying them into every gameplay task.

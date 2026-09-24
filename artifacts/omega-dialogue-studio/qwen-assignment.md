## Purpose

Build **Omega Dialogue Studio** into a Dialogic-style authoring tool that feels like an instrument Omega coded over successive technological eras. Writers should shape dialogue in a live Three.js space, save it, and use the same performance in the playable game. Keep the editor's internal design out of gameplay agents' working context through a small, versioned integration contract.

✅ Owner requested this Qwen assignment and will supply the prompt to their own Qwen access. No Qwen service is connected by this issue.
🔍 This is an implementation assignment, not a claim that Dialogic parity or game integration is complete.

## Related work and starting point

- Runtime scope: #53. Character visual direction: #54.
- Confirmed local HEAD and remote-tracking checkpoint: **544639d36fc61a3e948642a72e498f54dedbeb9b**, branch **prototype/ghost-typing-voices**.
- That checkpoint contains the existing shader typography studio, schema-backed opening document, sequential line/wait/continue runner, writing settings and editing/import/export foundation.
- Lead has later **uncommitted** work connecting the real intro and project save endpoint. It is not in that checkpoint. Last local reload lost styling; current end-to-end integration is not verified.
- Start from the published checkpoint in an isolated checkout. Coordinate a current base before integrating shared runtime changes. Do not assume main contains this work or overwrite the lead's changes.
- Read the existing studio design and Godot authoring review at that checkpoint. Legacy local Godot files may be unavailable to you: request the specific missing source if necessary; never invent its contents.
- Use the repository's **omega-spiral-logo-reference.png** as visual reference.

## Qwen assignment — paste this issue into your working context

You are implementing Omega Dialogue Studio for Omega Spiral. Study Dialogic deeply, then improve our existing editor in small, complete slices. Work from the existing Three.js implementation. The objective is an excellent usable editor and an explicit gameplay integration boundary.

### 1. Research before choosing architecture

Read official [getting started](https://docs.dialogic.pro/getting-started.html), [timeline syntax](https://docs.dialogic.pro/timeline-text-syntax.html), [characters and portraits](https://docs.dialogic.pro/characters-and-portraits.html), [text effects](https://docs.dialogic.pro/text-effects.html), [signals](https://docs.dialogic.pro/dialogic-signals.html), and the [Dialogic source](https://github.com/dialogic-godot/dialogic). Follow relevant official links for styles/layouts, variables, saves, localization and editor extension points. Record the upstream version/commit studied. Preserve applicable attribution when reusing code or assets.

Produce a concise capability matrix: documented Dialogic behavior → current studio support → game-specific adaptation → implement now/defer. Include four avenues identified in initial research for you to verify: conditional choices/state, reveal-position cues, actor choreography with completion waits, and glossary/localized terms. Consider these alongside the ordinary editing workflow, not as four mandatory new subsystems.

### 2. Preserve the author's world

- Omega is absent at system boot. The opening is a recorded repeating SOS script; loops can be recorded without Omega remembering them.
- The logo represents Omega's eventual full power. One demo loop is one fine filament. Use it for identity and restrained interface motifs; do not turn the opening into the complete logo or a vast galaxy.
- Era belongs to the scene owner: opening Omega; floor 1 Light; floor 2 Shadow; floor 3 Ambition. Era changes are independent of question count. Distinguish researched historical behavior from cinematic interpretation.
- Omega uses the era's natural system typography: uneven thinking, mistakes and explicitly authored later revisions, including revisions after an answer. Preserve the wording/version the player actually answered.
- Light: slow, deliberate, aligned straight arrangements, faint white-blue glow; revisions tend toward certainty.
- Shadow: fast, staggered straight segments with changing readable directions; quick mistakes/corrections.
- Ambition: intermediate cadence, curves reaching toward an explicit target/player; authored questionable words and retractions.
- Dreamweavers do not automatically answer Omega. Scripts explicitly identify who speaks, ask questions and call other scripts. Player choices are separate events.
- Any ordinary NPC must use the same system, with its own profile. These four characters are special configurations.
- Preserve authored dialogue. Do not invent lore, relationships or replacement prose. Keep original reference documents read-only.
- The opening has five questions; the last asks the player's name through text input and leads to the doorway. Actual traversal, camera and world design remain the gameplay/visual team's responsibility.

### 3. Build the authoring experience

Use the current shader lettering and writing playback. Make the studio feel like a usable tool built by Omega: a stable, readable working surface surrounding an expressive spatial preview. Keep essential controls discoverable and keyboard accessible. Decorative glitches must not corrupt editing or obscure errors.

Provide readable sequential script editing and source view over the same document; character/scene settings; a contextual performance inspector; play from start/selection, pause/restart, and a visible playhead explaining what it awaits. Support selecting words/spans to direct their performance with explicit inheritance and reset controls. Resolve stable span anchoring when text changes; never silently apply effects to the wrong word.

Allow ordinary NPCs and explicit script calls with return. Model choices, input, conditions and named scene cues as instructions. A timing strip directs a line's reveal/corrections; it must not run past a player decision as if the game were a movie.

Make invalid edits recoverable. Include undo, unsaved indication, readable validation errors, save/reopen and explicit Apply to game with stale-write conflict handling. Preserve unsupported future data safely or reject it clearly.

### 4. Make editor and gameplay independent

Retain a versioned JSON Schema and a single shared runner. Propose the smallest backward-compatible extension needed for the first slice.

Publish a concise **gameplay integration contract**, ideally at most two pages: load/start, next/choice/input, presentation-complete and scene-complete acknowledgements, cancellation/restart/dispose, state persistence policy, error behavior, supported version, one example. Document ownership of input while dialogue or traversal is active and protection against duplicate/stale acknowledgements.

The studio owns document authoring and performance configuration. The runner owns sequence and waits. Three.js renders and reports completion. The game owns movement, camera, levels and world effects. Blender resources are referenced by stable asset/animation IDs. Data must not execute arbitrary code.

Gameplay agents should need only this contract, the schema, profile/asset IDs and the relevant dialogue file. Put implementation detail, research and change history in linked documents outside that small context package.

### 5. Deliver in complete slices

1. Existing authored opening: edit a line/profile/era → preview → save/reopen → consume the same validated document through a minimal game adapter.
2. Ordinary NPC and script call: call → NPC line → explicit wait → return; preserve character-specific performance.
3. Player choice → state/condition → named scene cue → wait for acknowledgement → next line; include typed-name input and restart cancellation.
4. Selected-word performance controls and final interface polish, using feedback from the earlier slices.

Document the proposed contract and visual approach first. Ask for review only for genuinely unresolved creative choices or incompatible contract changes. Implement authorized slices in a dedicated branch; commit focused checkpoints and deliver a reviewable PR. Do not auto-merge or modify unrelated gameplay, shaders or Blender assets. Coordinate shared files with the lead before editing them. Do not expand into a plugin platform or reproduce every Dialogic subsystem without a demonstrated need.

### 6. Evidence and handoff

Use relevant repository Three.js skills and ponytail principles. Keep verification proportional. The owner permits minimal structural tests using synthetic text: schema validation, sequencing/waits, calls/returns, round-trip persistence and stale acknowledgements where implemented. Never assert actual creative wording or aesthetic choices. Respect local requirements for requesting test runs. Existing one-commit hook exceptions are consumed; do not reuse them.

Provide a short real-input walkthrough of editing, saving, reopening, applying and continuing gameplay, plus motion evidence for typography. Clearly separate preview-simulated scene acknowledgements from real game evidence. Report failures and unverified behavior. VoiceStudio remains on hold; do not add chat services, download models or spend API credits.

Finish with changed files/commit, working preview entry, evidence, remaining gaps and the small integration contract. A feature matrix or screenshot alone is not completion.

## Acceptance criteria

- [ ] Dialogic research is cited, versioned and mapped to current studio capabilities.
- [ ] Existing studio upgraded with the author's Omega identity and distinct character performance rules.
- [ ] Authored dialogue and presentation survive edit → preview → save → reopen → game consumption.
- [ ] Ordinary NPCs, calls/returns, choices, input and scene acknowledgement demonstrated through complete slices.
- [ ] Gameplay integration fits a small documented contract; no second divergent playback engine.
- [ ] Existing game remains available; shared integration changes are coordinated.
- [ ] Minimal structural verification and real interaction evidence supplied; creative approval stays with the owner.
- [ ] Reviewable implementation PR and concise handoff delivered.

## Blocked by

Research and isolated editor work: **none**. Integration into the active game requires coordination with the lead's uncommitted bridge and the shared contract work in #53; that does not block starting research or the isolated editor slice.


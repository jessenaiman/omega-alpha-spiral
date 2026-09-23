# Omega Studio — dialogue editor design

Status: revised proposal following the owner's narrowed goal. Supersedes the earlier five-part integration proposal. Editor implementation has not started. Existing visual baseline: `93ebb78`.

## Core question

How can writing, directing and previewing dialogue be as approachable as Dialogic, while making Omega Spiral's spatial typography a first-class authoring tool?

Success: open a dialogue file, change a speaker or word, see its actual 3D performance, play through explicit waits, and save the same document the game consumes.

## Current scope

- Dialogic-inspired Omega Studio editor and its schema-backed sequential runner, related to [issue #53](https://github.com/jessenaiman/omega-alpha-spiral/issues/53).
- Better style descriptions and chronological era selection. The [research prompt](era-research-prompt.md) is ready; historical findings and floor-era assignments remain pending.
- User and agent edit identifiable script events and formatting settings in the same files.
- Embedded chat infrastructure and local-model services are outside this narrowed delivery. VoiceStudio remains on explicit hold.

## Grounding

The [Godot authoring review](godot-authoring-review.md) records the existing schemas, narrative template, character resources and original/refactored Dialogic timelines. Preserve authored wording and useful vocabulary: opening lines, story blocks, prompts, choices and continuations. Legacy import must report differences rather than silently rewriting content.

Dialogic's [visual/text timelines](https://docs.dialogic.pro/timeline-text-syntax.html), [characters](https://docs.dialogic.pro/characters-and-portraits.html) and [reveal effects](https://docs.dialogic.pro/text-effects.html) inform the design. Feature parity and superiority have not been verified.

The current Three.js studio has era-aware shader lettering and character-specific writing playback. Its main module starts all four samples together and triggers Dreamweaver revisions in the render loop. The document and runner must own those narrative decisions; reuse the existing lettering and reveal engine.

## Recommended UI

**Readable screenplay + large live 3D preview + contextual inspector.** The script selection, visible words and inspector refer to the same stable IDs.

1. **Write:** ordered editable rows show speaker, dialogue and explicit instructions. Add, reorder, duplicate and edit. Player choices and name input are separate events. Select any NPC.
2. **Direct:** select a line or text span to edit cadence, delay, corrections, revisions and spatial arrangement. Show inherited character defaults versus overrides, with reset-to-inherited.
3. **Preview:** play from beginning or selected event, pause, replay and advance. Highlight the running row and name its wait: typing, continue, choice, input or scene acknowledgement. Scene acknowledgements are explicitly simulated in the editor; simulation is not game-integration evidence.
4. **Refine:** a selected-line timing strip exposes reveal, pauses, erasures and replacements. It complements logical script order; it cannot bypass player input through an absolute movie timeline.
5. **Save:** open/export validated documents, undo edits, show unsaved state and readable errors. Source view edits the same document. Invalid imports preserve the last valid document.

Alternatives considered: event cards as the primary surface are clear for commands but consume space for prose; a graph-first UI helps complex branches but adds navigation overhead to this sequential opening. Recommend screenplay rows with compact instructions.

## Schema and execution

Recommended format to lock: UTF-8 `.dialogue.json`, `schemaVersion: 1`, validated with JSON Schema. This follows the owner's existing schema workflow. Writers normally edit readable fields, not JSON punctuation.

Separate character profiles, scene typography and dialogue documents linked by stable IDs. NPC identity and writing style are separate. The four unique profiles use the same runtime as any NPC.

An entry script runs top to bottom. A line names its speaker explicitly. A call runs a named script and returns to the next instruction at its end. A wait states what must happen to continue. Character names never imply an answer or automatic script call.

Illustrative order, not proposed lore:

```text
Opening
  Line: Omega / authored text
  Wait: player continue
  Call: Light passage
  Call: Shadow passage
  Call: Ambition passage
  End
```

One runner owns script position, calls, waits and progression in both studio and game. The renderer displays lettering and reports completion. Restart cancels pending work; stale completions cannot advance a new run. Unknown speakers, missing scripts, duplicate IDs and unsupported instructions produce author-visible errors.

Selected-line audition is distinct from full playback: it previews typography without claiming preceding gameplay conditions occurred.

## Specific to this game

- Scene owner establishes the shared technology era, independently of question count. Describe visible effects and distinguish historical research from artistic approximation.
- Omega uses the era's system output, unstable wording and authored late revisions. Recorded boot speech does not imply live awareness. Preserve the text actually answered when later wording changes.
- Light: deliberate aligned straight paths, faint white-blue glow; authored revisions toward more absolute wording.
- Shadow: quick corrections, straight segments that change direction with readable orientation limits.
- Ambition: curved writing toward an explicit target, with authored retractions and replacements.
- Other NPCs: the same script and preview contract with their own profiles and no forced Dreamweaver behavior.

## First reviewable slice

Open a sample document; edit and reorder explicit Omega/Light/Shadow/Ambition lines; add an ordinary NPC; preview a line or sequence; encounter and release an explicit wait; change the shared era; undo; export and reopen. Use labeled existing sample copy until canonical source content is selected.

Keep the approved 3D lettering. Demonstrate the complete edit → preview → save → reopen loop. No extra unit tests. Ask the owner to run affected runtime checks under repository rules. Existing visual evidence predates this editor and proves none of its new capabilities.

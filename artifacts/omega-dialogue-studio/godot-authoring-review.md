# Existing Godot authoring model and Dialogic review

Reviewed read-only on September 23, 2026. No Godot files changed, no Godot runtime launched and no tests run. Paths below are relative to the owner-supplied Godot project `chapter-zero`, not the Three.js checkout.

## Located sources

| Purpose | Exact Godot-project path |
| --- | --- |
| Terminal story schema shown in the owner's screenshot | `source/data/schemas/narrative_terminal_schema.json` |
| More specific opening cinematic schema | `source/data/schemas/ghost_terminal_cinematic_schema.json` |
| Writer-facing narrative template | `source/data/schemas/narrative_script.schema.yaml` |
| NPC dialogue schema | `source/data/schemas/npc_dialogue_schema.json` |
| Example matching NPC data shape | `source/scenes/game_scene/levels/level_3_town/shopkeeper_dialogue.json` |
| Another NPC with awareness and memory pools | `source/scenes/game_scene/levels/level_3_town/strange_old_man_dialogue.json` |
| Opening timeline selected by the bridge | `source/scenes/game_scene/levels/level_1_ghost/ghost_terminal.dtl` |
| Alternate explicit-character timeline | `source/scenes/game_scene/levels/level_1_ghost/ghost_terminal_refactored.dtl` |
| Character resources | `source/scenes/game_scene/levels/level_1_ghost/characters/{omega,light,shadow,ambition}.dch` |
| Explanation of character/LLM design | `source/scenes/game_scene/levels/level_1_ghost/DIALOGIC_CHARACTER_GUIDE.md` |
| Story data for later encounters | `source/scenes/game_scene/levels/level_2_nethack/nethack.json` |
| Historical dungeon-layout schema | `source/data/schemas/scene2_nethack_schema.json` |

## How the authoring works

### 1. Narrative structure has meaning

`narrative_terminal_schema.json` describes a `narrative_terminal`: opening lines, an initial choice, then story blocks containing paragraphs and optional question/choices. Choices use `nextBlock`; name prompt, secret question and exit line have named places. It encodes a writer's narrative structure rather than requiring one tiny generic event per sentence.

`ghost_terminal_cinematic_schema.json` further specifies named sections: boot sequence, opening monologue, first choice, story fragment, secret question, name question and exit. It combines prose with intentional staging: glitch lines, fade-to-stable, cinematic timing, persistent reveal/journal metadata and Dreamweaver score changes. Many objects reject unknown properties. This is a concrete creative contract; the schema is more than editor autocomplete.

These two schemas describe different shapes. The screenshot is the general terminal schema. Neither should be assumed to validate the current `ghost.json` with its `scenes` array.

### 2. The YAML “schema” is a writing template

`narrative_script.schema.yaml` contains placeholder instructions and examples, not JSON Schema keywords defining validation. It introduces `moments` of type narrative, question or composite. Its vocabulary includes owner, setup, prompt, context, options, responses, continuation, visualPreset, timing and pause.

This is valuable editor vocabulary. A composite moment lets a writer handle setup, question and continuation as one coherent passage. Literal tab indentation also appears in this template; it must not be treated as a ready-to-parse valid YAML instance without checking the intended format. No parser or validation was run in this review.

### 3. NPC data already separates authored variations from state

The NPC schema and shopkeeper file have matching structural fields: identity, opening/additional lines, choices and dialogue indices. Choice data can carry affinity changes, flags and awareness changes. Separate arrays hold loop references, personality traits, liminal responses and memory fragments.

Those fields offer a stronger starting point for interstitial dialogue than unrestricted generation: the editor can show which authored pool or generated slot is active and why. This review establishes the schema/data shape, not that the Godot runtime validates or consumes every field.

### 4. Dialogic is the opening execution layer

The inspected path is:

```text
level_1_ghost.tscn → level_1_ghost.gd
  → GhostCinematicDirector.RunStageAsync()
  → ghost_dialogic_bridge.gd.start_ghost_timeline()
  → Dialogic.start("ghost_terminal")
  → registered ghost_terminal.dtl
  → timeline_completed with recorded choices
```

`project.godot` registers both timeline names. The bridge explicitly starts `ghost_terminal`, not `ghost_terminal_refactored`. The character guide lists replacing the original with the refactored file as future work. This is source-level evidence of the configured path, not a successful playthrough claim.

The `.dtl` holds prose, waits, choices, variable assignments, conditional branches and labels. It records the selected thread, story preference, role, name view and name story. The refactored file explicitly attributes lines to SYSTEM, Light, Shadow and Ambition. The original contains many unattributed lines, so importing it must not guess their speakers from nearby choice ownership.

### 5. Character resources anticipate AI-assisted writing

The inspected Omega and Light `.dch` resources contain display names, colors, style references, sound moods, portraits and `custom_info` with thread and personality. These are Godot resource values, including Color/Vector2/NodePath, not plain JSON despite their brace-based appearance.

The character guide proposes context injection, editable labelled LLM blocks and alternate narrations based on stored player choices. These sections are design/pseudocode, not proof that a local model is connected. They directly inform the new request for generated travel dialogue.

## What makes Dialogic relevant

| Verified Dialogic behavior | Consequence for Omega Studio |
| --- | --- |
| Visual event blocks and a writer-friendly text syntax edit timelines; the text editor offers autocomplete/highlighting and timeline preview. [Getting started](https://docs.dialogic.pro/getting-started), [syntax](https://docs.dialogic.pro/timeline-text-syntax.html) | Keep coherent writing passages editable. Raw JSON is useful for interchange and diagnosis, but does not supply the same writing experience. |
| Content modifiers run before reveal; text effects trigger at positions during reveal. [Modifiers](https://docs.dialogic.pro/text-modifiers.html), [effects](https://docs.dialogic.pro/text-effects.html) | Distinguish selecting variant wording from performing a hesitation/retraction. A random choice before reveal cannot implement Omega visibly changing an already written sentence. |
| Text supports scoped letter speed, multipliers, pauses, input boundaries, signals and temporary advance rules. [Effects](https://docs.dialogic.pro/text-effects.html) | Model timing at character, span and passage levels, including the ability to return to character defaults. |
| Characters own styles, sound moods and portrait resources with previews. [Characters](https://docs.dialogic.pro/characters-and-portraits.html) | Adapt the character editor to face-free strand/lettering presence, with distinct geometry, cadence and audio. Scene era remains a separate owner-level setting. |
| Styles combine a base layout with configurable layers and support inheritance. [Styles](https://docs.dialogic.pro/styles-and-layouts.html) | Author reusable layers for terminal surface, floating glyphs, revisions, paths and player choices. Define which properties inherit; speaker selection must not silently change the scene era. |
| A custom event defines its editor, stored representation and execution; explicit finish advances it. [Extensions](https://docs.dialogic.pro/creating-extensions.html) | A single registered event contract should power visual controls, file validation, agent actions and game playback. A movement event finishes on arrival, not a guessed timeout. |
| Signals connect timelines and individual text positions to game behavior. [Signals](https://docs.dialogic.pro/dialogic-signals.html) | A word can reveal a strand or cue a camera move at an authored moment; the scene acknowledges completion before progression. |
| Voice events attach audio to text; auto-advance can wait for voice completion. [Voice event](https://docs.dialogic.pro/classes/class_dialogicvoiceevent.html), [auto-advance](https://docs.dialogic.pro/auto-advance.html) | Keep typing sounds, full speech and ambience distinct. Audio/text revisions and progression must agree. VoiceStudio integration is currently on hold by owner request. |

This review used the official documentation and local project source. External reference image downloads were blocked by network permissions; no claim of interactive Dialogic editor inspection is made.

## Drift to surface before importing

- The historical dungeon schema uses `light`, `mischief`, `wrath` and expects maps/objects under `dungeons`. The inspected `nethack.json` uses `scenes` and `light`, `shadow`, `ambition`. They are not a matching validation pair merely because their filenames concern the same stage.
- The old cinematic name-question schema expects choice options; the current user decision is typed name input. Retain the old document as a source and make the change explicit in the new authored version.
- The older Omega character resource describes knowledge of previous iterations, whereas the user's current canon makes boot a recording and Omega unaware. Older character colors/personality descriptions also differ from the latest direction. Do not silently restore those older choices.
- The old `.dtl` includes syntax such as `=>` and bracketed conditions which should be interpreted against its installed Dialogic version. The current web docs alone do not prove that old file runs unchanged.
- JSON schemas describe constraints; their presence is not evidence that validation is connected to runtime. No schema validation call was found on the inspected opening execution path.

## Revised design recommendation — not yet approved

Preserve the owner's writing model: narrative/composite passages, explicit characters, choices and consequences, cinematic cues and designated variation pools. Let the studio present a readable script with contextual event controls and a live performance preview. Provide structured source access for the agent and author.

Before locking the new file contract, map existing fields to it and show what is preserved, deliberately changed or cannot be represented. Keep original Godot documents read-only; import into an explicitly selected editable copy. Preserve source identifiers and wording, expose ambiguous speaker attribution, and distinguish legacy lore from current canon.

The earlier generic timeline/JSON proposal is provisional. The next design should be demonstrated using a real passage from this existing authoring structure, with the owner choosing the authoritative version. A new schema alone is not completion of this review or the editor.

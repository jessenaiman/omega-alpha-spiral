# Omega Spiral — owner-approved opening direction

Authority: the owner's explicit decisions in this thread, consolidated 2026-09-23 at their request. This records approval of direction, not approval of every existing asset or implementation. Later owner corrections take precedence. Tickets and generated concepts cannot add lore.

## Playable journey

1. A real start menu precedes the game. Begin enters the opening intentionally.
2. The opening starts in darkness. A recorded script, accumulated over time, repeats like an SOS. Omega is not consciously present at system boot and knows nothing of the recorded loop.
3. A controllable oversized dot/pixel gradually becomes a recognizable faceless humanoid. Movement takes place over a transparent spatial floor. Camera follows the player.
4. Use five main questions: four regular stops along the journey, then the final name question. This retains the earlier explicit five-question approval within the latest request for four to five stops.
5. At each regular stop, Omega frames the question. Three distinct spatial word paths become available. The player selects one path, not all three in sequence, and moves toward its Dreamweaver. The camera centers the destination; that Dreamweaver delivers its own message before the next Omega question.
6. Dreamweavers are characters with their own questions/messages. They do not automatically answer Omega. Player choices, speaker lines and script calls are distinct instructions. Existing data that presents their lines as automatic answers requires authoring reconciliation, not silent rewriting.
7. Final question: Omega asks **“What is your name?”** The player types a name. The doorway shows the playable level beyond. **“I had a name once, was it mine?”** hangs in letters for the player to walk through. This finale breaks the ordinary three-path pattern.
8. The doorway leads into the first playable dungeon floor. Floor ownership: 1 Light, 2 Shadow, 3 Ambition. The town comes later, followed by the escape/final-stage direction the owner will iterate on when reached. Do not invent those stages' content here.

## Visual and performance rules

| Element | Approved direction |
| --- | --- |
| Space | Darkness first; ethereal, cosmic space emerging in layers. The world is built out of code and Omega's will. Large galaxies suggest too much power too early. |
| Logo | `assets/references/omega-spiral-logo-reference.png` is the identity reference and Omega's eventual full power. One demo loop corresponds to one fine filament. It is not the complete opening background. |
| Dreamweaver scale | Fine strands leading back toward the doorway; small distinctive presences, not giant celestial entities. |
| Light | Straight geometry; slow, deliberate, neatly aligned words, including in 3D; faint white-blue glow. Authored replacements make meaning more absolute. |
| Shadow | Straight segments with irregular changes in direction; slightly misaligned rows, readable orientation changes; fast typing and quick corrections. |
| Ambition | Curves toward what it wants, including player/target; medium cadence; questionable words and authored retractions of harsher wording. |
| Omega | Ordinary system typography appropriate to the selected technological era; frequent mistakes and revisions, potentially after an answer. Retain the version actually answered. |
| Era | Universal scene setting selected by scene owner. Opening Omega; floor 1 Light; floor 2 Shadow; floor 3 Ambition. Question count does not determine technological upgrades. |
| Main question | Floating flat terminal display occupying 3D space; large and centered initially, receding when path text is revealed. Ghost typing, not an instantly displayed prose card. |
| Spatial text | Letters float and shape paths differently at successive stops. Controls remain usable while presentation feels like manipulating reality. |
| Player | Starts as oversized dot/pixel, grows toward faceless humanoid across questions. Specific geometry between stages remains open to iteration. |
| Door | Blender work belongs to the door: small fragments deconstruct/reconstruct. Early distant formation can use shaders/Three.js, with Blender geometry appearing when large enough. |
| Layering | Door, Dreamweavers and background remain separate assets/modules and are composed together. Archive and Tide are approved directions for iteration, not interchangeable finished scenes. |

## Sources and working references

- Logo: `assets/references/omega-spiral-logo-reference.png`.
- Curated opening/composition references: `assets/references/intro-first-question.png`, `assets/references/intro-door-finale.png`, `assets/references/intro-strand-detail.png`. These inform framing; their large celestial objects are not a mandate to reproduce the entire image.
- Authored material: `project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json`, with the newer Godot opening reviewed in `artifacts/omega-dialogue-studio/godot-authoring-review.md`. Preserve originals.
- Runtime opening adaptation: `src/intro/ghost-type-study/opening.dialogue.json`. It is an adaptation with provenance, not permission to rewrite all legacy prose.
- Studio/runtime boundary: `artifacts/omega-dialogue-studio/gameplay-contract.md`; Qwen editor work: GitHub #57; runtime work: #53.

## Deliberately unresolved

- Exact dates/fonts for additional eras await the user's research; current four presets are broad visual approximations.
- Reconcile legacy question/choice wording against the newer Godot scripts with the owner; do not generate substitute prose.
- Final palette details, intermediate player forms, precise floor mechanics and later town/escape content require iteration. Geometry and cadence are already distinctive even without relying on color alone.
- Approval of a reference or direction does not certify a playable implementation. Current gaps and verification belong in progress/evidence reports.

## Collaboration rule

Game agents consume this reference, the small dialogue contract and relevant content files. Studio agents own authoring internals. Visual agents own assets, shaders and camera presentation. Agree shared interfaces before changing them. Keep VoiceStudio on hold. Tests may cover structural logic with synthetic content; never freeze authored wording into unit assertions.

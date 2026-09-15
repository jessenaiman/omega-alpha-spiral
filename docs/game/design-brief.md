# Omega Spiral — Design Brief

## Product statement

Omega Spiral is a single-player narrative exploration-and-action vignette. In one 15–20 minute run, the player watches one town become progressively more real across recognizable fictional technology eras. Words become places, movement, danger, companions, and an irreversible physical commitment.

The player remains the player. The game does not assign the avatar a backstory or inner monologue. Player imagination teaches Omega how a game becomes meaningful, while Luminary, Shadow, and Ambition act as competing narrators rather than all-powerful reality shapers.

## Player promise

In about 18 minutes, the player will:

- name themself and Omega;
- turn three early choices into visible world and party consequences;
- learn a small, consistent control set through play;
- restore a town while its presentation grows from a crude signal into a coherent world;
- recruit three companions from four distinct roles;
- survive fair, readable hazards with a local rewind instead of losing prior progress;
- choose between preserving memory and preserving bodies, while seeing another party enact the unchosen route;
- physically approach one Dreamweaver and carry an unanswered identity question across the final bridge;
- glimpse a coherent 1080p game before the world collapses into the next Ghost Terminal loop.

## Target feeling

The emotional progression is curiosity, recognition, competence, attachment, pressure, responsibility, and uncanny awe. Early choices should feel intriguing rather than obviously strategic. Later play should reveal that those choices shaped commentary and context without secretly deciding the ending. The town fracture should feel costly without declaring one route morally correct. The final question should remain unresolved after the screen collapses.

## Genre and format

- Single-player narrative exploration-and-action vignette.
- Landscape browser game for keyboard and standard gamepad.
- One complete 15–20 minute Alpha 0.1 run, targeting about 18 minutes.
- Static browser release built with local Three.js; no runtime network service is part of play.
- Full touch gameplay is outside scope.

## Controls

- **Move:** WASD, arrow keys, or left stick.
- **Dash:** Space or the south gamepad button.
- **Contextual Act:** E, Enter, or the west gamepad button.
- **Pause:** Escape or the gamepad menu button.
- **Mouse:** menus and settings only.
- The camera is directed by the game. There is no manual orbit camera.

The same action must mean the same thing throughout the run. The active target verb explains its local purpose, such as `STABILIZE`, `DISRUPT`, or `GUARD`, without adding another control.

## First-run arc

| Phase | Timing | Player experience | Completion trigger |
|---|---:|---|---|
| Ghost Terminal | 2–3 minutes | Read a crude monochrome signal, state a name, make three explicit choices, and name Omega. Dreamweaver influence remains latent. | Name, all three choices, and Omega’s name are committed. |
| Town Map | 2–3 minutes | Explore the same town as a glyph map. Learn Move and Contextual Act while restoring the Archive, civic refuge, and gate or bridge. | All three landmarks are restored. |
| Town Space | About 3 minutes | See the map extrude into low-density 2.5D. Learn Dash through three readable hazard encounters, ending with Archive Crossing. | Archive Crossing succeeds and its resident is safe. |
| Town Community | 3–4 minutes | Gain pixel color, portraits, sound layers, and more dimensional forms. Recruit three of four Echoes, then pass one party test. | Three companions are recruited and the party test is complete. |
| Town Fracture | 4–5 minutes | Commit physically to preserve memory or bodies. Complete three route objectives while a parallel party visibly performs the unchosen route. | All three objectives on the chosen route are complete. |
| Threshold and Collapse | About 2 minutes | Inspect three separated Dreamweavers, approach one, carry its question, cross the bridge, see the era-specific logo and coherent 1080p glimpse, then return to Ghost Terminal. | Bridge crossing resolves, the world collapses, and the next loop starts. |

## Echo party

The player recruits three of four Echoes:

- **Fighter:** guard and break.
- **Scribe:** preserve and reveal.
- **Thief:** bypass and reposition.
- **Weaver:** stabilize and redirect.

Any three-Echo party can complete either fracture route. The unchosen Echo joins the parallel party so the fourth role remains present in the world rather than being erased.

## Dreamweavers and final copy

The Dreamweavers have distinct philosophies and readable visual grammars even in monochrome:

- **Luminary:** hope and sacrifice; silver-white cold light; continuous arcs.
- **Shadow:** ambiguity and truth; gold-amber; broken or doubled traces.
- **Ambition:** will and change; red; angular filaments.

Hidden affinity may change authored commentary, but it never chooses the final pairing. Pairing occurs only when the player approaches one Dreamweaver and holds Contextual Act at the threshold.

The exact threshold questions are:

- Luminary — “If every version of you was sacrificed so this one could cross, which of you gets to call the crossing hope?”
- Shadow — “If the loop preserves every lie you needed to become yourself, which truth could you remove without becoming someone else?”
- Ambition — “If you escape only by becoming someone none of your former selves would recognize, who chose the change?”

The questions have no correct answers and receive no forced response.

## Display and camera progression

Presentation advances only when the current phase objective is complete, never because a timer expires.

| Phase | Display era | Camera |
|---|---|---|
| Ghost Terminal | Low-density monochrome, 4:3 | Fixed front plane. |
| Town Map | Denser limited color, 4:3 | Fixed north-up orthographic overview. |
| Town Space | Widening vector and faceted forms, 16:10 | North-up orthographic three-quarter view, 55° pitch, damped follow, no rotation. |
| Town Community | Pixel portraits becoming dimensional, 16:9 near 720p | 38° perspective, 50° pitch, short recruitment push-ins. |
| Town Fracture | Event-driven overlap of prior generations | 45° perspective, stable north axis, event rails, no gameplay roll. |
| Threshold and bridge | Wide choice frame followed by a momentary coherent 1920×1080 world | 35° perspective bridge rail and wide three-presence choice frame. |

The aspect ratio, color depth, geometry, motion, UI, and audio vocabulary accumulate rather than switching to unrelated scenes. Reduced motion replaces rotation, shake, roll, FOV punch, and rotated glitches. The supplied square logo is a creative reference: each era receives a new original three-strand logo variation for its aspect and color depth, never a crop or trace of the reference bitmap.

## Alpha boundary

### Alpha 0.1: complete gameplay delivery

Alpha 0.1 delivers the entire playable loop, deterministic state, all routes and pairings, keyboard and gamepad parity, accessible settings, event-driven synthesized or local audio, authored dialogue, procedural and custom gameplay surfaces, production build, static preview, and current-revision evidence. It claims gameplay completion, not premium art.

### Alpha 0.2: Blender and showcase delivery

Alpha 0.2 begins only after Alpha 0.1 passes. Blender 5.2.1 replaces hero surfaces for the player, four Echoes, Archive, refuge, threshold, bridge, and hero props. It adds production textures, materials, animation, lighting, VFX, audio, selected voices, and approved loop residue. Repeated town volume remains procedural and instanced. Every GLB receives a named export collection, manifest, clean-scene re-import, glTF Transform inspection, runtime camera check, collision proxy, and recorded counts.

## Non-goals

- Inventory.
- Loot economy.
- Skill trees.
- Procedural levels.
- A conventional boss.
- A separate attack combo system.
- Full touch gameplay.
- Backend services.
- Database persistence.
- Runtime LLM use.
- Python, FastAPI, Electron, or installer architecture.
- Alpha 0.2 cross-loop residue inside Alpha 0.1.

## Design acceptance

The design is realized only when a player can complete the full loop through real keyboard and gamepad input; recruit three Echoes; experience failure, rewind, retry, and restart; complete both town routes across runs; reach all three pairings; and see the reconstructed logo, coherent 1080p glimpse, collapse, and incremented loop. The game must also pass captions, focus, color-independent cues, 200% zoom, reduced motion, pause, audio settings, a production build, and a static preview with no remote runtime dependency.

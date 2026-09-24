# Omega Spiral level design manifest

Status: owner-approved visual direction and playable-level design draft, 2026-09-24. This is not a playable capture or an implementation claim. Project setup and game integration are active.

## Authority and story boundary

- Current user direction controls stage order, visual eras, and the hidden Dreamweaver premise. Older prose may retell uncertain history differently; no one version is presented to the player as the final truth.
- [Omega history](<../../project-management/official game docs (read-only)/omega-history.md>) says Omega leaves equations and shards but cannot build the game alone. The reusable code blocks are derived from those equations; Dreamweaver arrangement and human/player creativity complete the playable form.
- [Stage 4 story](<../../project-management/official game docs (read-only)/chapter-zero-stages/stage_4/stage-4-story.md>) identifies the Echo Vault and party recruitment. The adjacent Stage 4 town draft is older draft material. Current direction places the classic town at Stage 7.
- The Dreamweavers privately dispute whether guiding a player beyond the game's boundary is possible or worthwhile. Their private banter and the demo-boundary motive are subtext, not player exposition. Player-facing doubt or Light's optimism may color dialogue without revealing that argument.

## Visual continuity

Use one readable elevated 2.5D action-RPG camera and a grounded traversable space. The [existing Blender door](../intro-threshold/door.blend) is a starting reference for the repeating landmark; the owner expects a stronger final design. The door, threshold mark, floor blocks, bars/walls, pillars, and a few transition pieces form a small shared kit. Geometry, arrangement, display treatment, and restrained accent color change by Dreamweaver; the core kit stays recognizable. Keep character silhouette and walkable route clear through every effect.

| Segment            | Geometry and party                                                                                                              | Display and world treatment                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intro              | Separate opening                                                                                                                | Early PC game history.                                                                                                                                                                                                                                                               |
| Floor 1 · Light    | One character; straight lines and right angles shape routes to Door, Monster, and Chest choices. An exit follows the choice.    | Atari-era raster playfield logic extruded into sparse physical 3D. The [approved Stage 1 starting point](stage-1-atari-3d-starting-point.png) sets density.                                                                                                                          |
| Floor 2 · Shadow   | One character; erratic diagonals, oblique views, offset approach                                                                | Same blocks gain rotated/cut forms and a little more raster and palette detail.                                                                                                                                                                                                      |
| Floor 3 · Ambition | One character; curves visibly assembled from stepped code blocks                                                                | Same kit gains faceted depth and richer tile graphics, moving toward NES-era presentation. [Approved geometry study](dreamweaver-geometry-stages-1-3.png).                                                                                                                           |
| Floors 4–6         | Dreamweavers guide player choices for future party members; Stage 4 includes the Echo Vault                                     | NES-to-PlayStation capability grows without erasing earlier code layers. Exact choices and companion count per floor remain to be authored.                                                                                                                                          |
| Floor 7            | A party enters a classic town, searches for each Dreamweaver, faces garbage collectors, and weighs their different escape ideas | Town assets look misplaced. Individual objects simulate incompatible display proportions and pixel densities inside one Three.js view. Parts of the town recycle into memory and occasionally drop toward terminal-style output before rebuilding. Routes and party remain readable. |
| Later finale       | Party approaches the healing core                                                                                               | Modern 3D light, depth, and effects bring the three geometric languages together while old code remains visible. [Approved finale concept](omega-healing-core-final-stage-concept.png).                                                                                              |

The [six-frame progression reference](era-progression-reference-draft.png) is owner-approved as the era comparison. It is concept art, not a final in-game screenshot. Stage 7's per-object aspect mismatch and terminal restart still need a closer playable visual pass.

## First playable level contract

**Player promise.** A lone hero enters Omega's sparse three-dimensional old code, discovers three Dreamweaver-shaped routes, and chooses an exit. World discovery and an eventual four-hero adventure supply the Final Fantasy I feeling; the elevated 2.5D camera supplies the readable action-RPG composition.

**Repeatable decision.** The [official NetHack scene](<../../project-management/official game docs (read-only)/chapter-zero-stages/stage_2/nethack-scene.md>) describes three sequential Dreamweaver-owned rooms. Each offers Door, Monster, and Chest. The player approaches one object; hidden alignment changes the eventual guide result. The owner now wants geometry to change navigation and choices across these rooms. Whether each choice gets a separate physical exit or one shared exit remains to settle in the playable room.

**Floor 1 plan.** Start with clear hero silhouette and one safe sightline to the approved Blender door. Present Door, Monster, and Chest in three readable zones. Light's two straight raised bars split the entry into three approach lanes; their movement collision matches the visible blocks. The player can inspect the zones before committing to one object. The current guard and Talk/Hit/Run page is an older playable baseline, not approval of its layout for this design.

**Floors 2–3 plan.** Reuse the same Door, Monster, Chest, and level kit. Shadow's oblique diagonals alter approach, sightline, and choice timing. Ambition's stepped curves draw the hero around a visible target and back toward a consequential fork. Color and effects support those spatial differences. The older document's identical-room proposal yields to the owner's approved distinct geometry. Later obstacles must explain a route decision and match collision shape.

| Floor owner | Door aligns with | Monster aligns with | Chest aligns with |
| ----------- | ---------------- | ------------------- | ----------------- |
| Light       | Light            | Ambition            | Shadow            |
| Shadow      | Shadow           | Light               | Ambition          |
| Ambition    | Ambition         | Shadow              | Light             |

The official scene grants two hidden points when choice alignment matches the room owner, otherwise one point to the aligned Dreamweaver. After three rooms, the result selects a guide for the next scene; it does not recruit a party member. Keep points hidden and use authored dialogue without publishing the Dreamweavers' private motive.

**Pressure and failure.** The official scene's Monster triggers a basic automatic fight; Door asks a question, and Chest reveals a mystery item or message. Exact damage, loss, retry, and later obstacle rules still need gameplay review. Do not make the older guard or a visible score counter silently define them.

**Technical sequence.** Establish one visible route and true movement/collision first. Add authored kit forms and door state, then era-specific surfaces, lighting, and restrained CRT/code effects. Keep one camera and one state owner. The dialogue studio owns authored lines and timing; the game owns movement, level state, camera, and world reactions.

## Rendering and interaction intent

- The historical appearance is embodied in geometry and materials, then reinforced with selective screen treatment; it is more than a pixel filter over finished ruins.
- Retain earlier visual layers beneath later ones. Early scenes use sparse extruded blocks and limited shading; later scenes add texture detail, faceted depth, independent object display treatments, and finally rich light and particles.
- Stage 7 should simulate aspect differences per object or surface while keeping the actual gameplay canvas and camera stable. Recycled memory and terminal-like restarts should be local and legible. Whether a restart changes gameplay state is unresolved.
- Each Dreamweaver's arrangement must change navigation and player choices, not only silhouettes or color. Physical blockers must match visible pieces. Any moving or rebuilding block must preserve a readable traversable path. Specific movement, combat, and garbage-collector physics remain for the gameplay integration design.
- [Omega Dialogue Studio](../../omega-dialogue-studio.html) is the existing live authoring surface. Its [current v1 dialogue schema](../../src/intro/ghost-type-study/dialogue.schema.json) supports ordered `line`, `wait`, and `continue` events, authored rewrite cues such as `word|replacement`, and per-voice presentation settings for Omega, Light, Shadow, and Ambition. The desired level-design outcome is for Dreamweaver, NPC, and Omega output to carry timing, visuals, and effects through this editor and into the playable scene. NPC voice profiles and scene-effect cues are design and integration gaps; do not claim the v1 schema already supports them. Extend the existing authoring model with the design owner instead of creating a parallel dialogue format.

## Visual references

- [Stage 1 Atari-in-3D starting point](stage-1-atari-3d-starting-point.png): accepted starting direction.
- [Floors 1–3 geometry study](dreamweaver-geometry-stages-1-3.png): accepted straight, diagonal, curved identities.
- [Six-frame progression reference](era-progression-reference-draft.png): owner-approved era comparison; still concept art.
- [Healing-core finale concept](omega-healing-core-final-stage-concept.png): saved approved endpoint.

Next review: compare the approved reference with a playable Floor 1, then tune Floor 2 diagonals and Stage 7's mixed display proportions in play. Use the existing studio and v1 schema for the smallest scene-effect and NPC extension with the owner.

## Project setup and game entry

- The current root `index.html` is a verified core boot surface, but it is not the game. The canonical game entry must move the authored intro into the root and continue into the NetHack-style Door/Monster/Chest rooms. Keep the core boot as a recoverable experiment when that migration is complete.
- The current playable opening is `intro.html`, whose Chapter Two scene already reaches the NetHack-style rooms. The separate `floor-one.html` guard/Talk/Hit/Run page is an older experiment, not the target game. Preserve old links until the root game path passes a real-input handoff check.
- Keep `omega-dialogue-studio.html` as the separate authoring tool. Put study pages and alternate games under `experiments/` only after the unified game entry works and a recovery commit exists.
- The isolated starter under `scratch/director-starter-20260924/` teaches the director's Game, Loop, collision, and bot pattern. It is not the Omega game and must not replace the authored intro-to-room journey.
- The existing door is a Blender-authored GLB loaded through Three.js `GLTFLoader`, not imported video. The intro uses a rendered texture of the next room through the threshold. Use the local Blender MCP, Codex, and procedural Three.js for asset iteration; the 3D generator's external Tripo calls are outside this project pass.
- The director's local sequence is dependency install, core boot, one representative playable room, active-play inspection, then integration and release checks. External API services are outside this setup pass. A green build or nonblank canvas alone does not prove the design.

## Open design inputs

- 🔍 The official NetHack scene specifies three choices per room and movement onward, while the owner also described exits. Decide in a live Floor 1 review whether each choice has a separate physical exit or the room opens one shared exit.
- 🔍 Exact outcome of each exit, initial obstacle set, failure/retry rule, and later garbage-collector physics. Assign these after the source and first playable room are reviewed.
- 🔍 Dialogue studio extension for ordinary NPC profiles and named scene effects. Version 1 already supports line, wait, continue, and four named voices; keep future syntax out of this manifest until the editor contract is agreed.

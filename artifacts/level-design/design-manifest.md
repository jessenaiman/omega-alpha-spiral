# Omega Spiral level design manifest

Status: owner-approved visual direction and playable-level design draft, 2026-09-24. This is not a playable capture or an implementation claim. Project setup and game integration are active.

## Authority and story boundary

- Current user direction controls stage order, visual eras, and the hidden Dreamweaver premise. Older prose may retell uncertain history differently; no one version is presented to the player as the final truth.
- [Omega history](<../../project-management/official game docs (read-only)/omega-history.md>) says Omega leaves equations and shards but cannot build the game alone. The reusable code blocks are derived from those equations; Dreamweaver arrangement and human/player creativity complete the playable form.
- [Stage 4 story](<../../project-management/official game docs (read-only)/chapter-zero-stages/stage_4/stage-4-story.md>) identifies the Echo Vault and party recruitment. The adjacent Stage 4 town draft is older draft material. Current direction places the classic town at Stage 7.
- The Dreamweavers privately dispute whether guiding a player beyond the game's boundary is possible or worthwhile. Their private banter and the demo-boundary motive are subtext, not player exposition. Player-facing doubt or Light's optimism may color dialogue without revealing that argument.

## Visual continuity

Use one readable elevated 2.5D action-RPG camera and a grounded traversable space. The [approved Blender door](../intro-threshold/door.blend) is the repeating landmark. The door, threshold mark, floor blocks, bars/walls, pillars, and a few transition pieces form a small shared kit. Geometry, arrangement, display treatment, and restrained accent color change by Dreamweaver; the core kit stays recognizable. Keep character silhouette and walkable route clear through every effect.

| Segment            | Geometry and party                                                                                                                                                                     | Display and world treatment                                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intro              | Separate opening                                                                                                                                                                       | Early PC game history.                                                                                                                                                                                                                                                               |
| Floor 1 · Light    | One character; straight lines and right angles shape the route. Three Dreamweaver choices and exits follow the owner's `nethack.md` level description once its exact path is provided. | Atari-era raster playfield logic extruded into sparse physical 3D. The [approved Stage 1 starting point](stage-1-atari-3d-starting-point.png) sets density.                                                                                                                          |
| Floor 2 · Shadow   | One character; erratic diagonals, oblique views, offset approach                                                                                                                       | Same blocks gain rotated/cut forms and a little more raster and palette detail.                                                                                                                                                                                                      |
| Floor 3 · Ambition | One character; curves visibly assembled from stepped code blocks                                                                                                                       | Same kit gains faceted depth and richer tile graphics, moving toward NES-era presentation. [Approved geometry study](dreamweaver-geometry-stages-1-3.png).                                                                                                                           |
| Floors 4–6         | Dreamweavers guide player choices for future party members; Stage 4 includes the Echo Vault                                                                                            | NES-to-PlayStation capability grows without erasing earlier code layers. Exact choices and companion count per floor remain to be authored.                                                                                                                                          |
| Floor 7            | A party enters a classic town, searches for each Dreamweaver, faces garbage collectors, and weighs their different escape ideas                                                        | Town assets look misplaced. Individual objects simulate incompatible display proportions and pixel densities inside one Three.js view. Parts of the town recycle into memory and occasionally drop toward terminal-style output before rebuilding. Routes and party remain readable. |
| Later finale       | Party approaches the healing core                                                                                                                                                      | Modern 3D light, depth, and effects bring the three geometric languages together while old code remains visible. [Approved finale concept](omega-healing-core-final-stage-concept.png).                                                                                              |

The [six-frame progression reference](era-progression-reference-draft.png) is owner-approved as the era comparison. It is concept art, not a final in-game screenshot. Stage 7's per-object aspect mismatch and terminal restart still need a closer playable visual pass.

## First playable level contract

**Player promise.** A lone hero enters Omega's sparse three-dimensional old code, discovers three Dreamweaver-shaped routes, and chooses an exit. World discovery and an eventual four-hero adventure supply the Final Fantasy I feeling; the elevated 2.5D camera supplies the readable action-RPG composition.

**Repeatable decision.** Look ahead, move through a route, read a Dreamweaver's offer, then commit to one of three exits. The choice must change recorded game state or the next route, not merely recolor the same result. The exact choices, wording, placement, and consequences must come from the owner's `nethack.md`; its path remains unconfirmed. Do not invent those details.

**Stage 1 plan.** Start with clear hero silhouette and one safe sightline to the approved door. Present three discoverable Dreamweaver choices and exits through the shared block kit. Light's straight arrangement makes the first traversal legible. An exit decision is visible before commitment. The current Floor One guard and Talk/Hit/Run page is a playable older baseline, not approval of its layout for this design.

**Stages 2–3 plan.** Reuse the same kit. Shadow's oblique diagonals alter approach, sightline, and choice timing. Ambition's stepped curves draw the hero around a visible target and back toward a consequential fork. Color and effects support those spatial differences. Obstacles can be authored later; each must explain a route decision and match its collision shape.

**Pressure and failure.** The first three-floor route must remain easy to read. Exact hazard, combat, loss, retry, and reward rules are pending the named level source and gameplay review. Do not make concept art, a guard, or a score counter silently define them.

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

- The current root `index.html` is the core boot surface. Its `src/main.ts` must construct the host, pass a frame callback, render a live frame, and expose real diagnostics before any entry-page move.
- The current playable opening is `intro.html`; the current Floor One is `floor-one.html`. Keep both available while their scenes are integrated into one game flow. Their present visuals are runtime baselines, not this manifest's final design.
- Keep `omega-dialogue-studio.html` as the separate authoring tool. Put study pages and alternate games under `experiments/` only after the unified game entry works and a recovery commit exists.
- The isolated starter under `scratch/director-starter-20260924/` teaches the director's Game, Loop, collision, and bot pattern. It is not the Omega game and must not replace `src/core` or `src/main.ts`.
- The director's local sequence is dependency install, core boot, one representative playable room, active-play inspection, then integration and release checks. External API services are outside this setup pass. A green build or nonblank canvas alone does not prove the design.

## Open design inputs

- ❌ Exact path and content of the owner's `nethack.md` level description. Its three choices and exits control Floor 1; this draft does not replace that source.
- 🔍 Exact outcome of each exit, initial obstacle set, failure/retry rule, and later garbage-collector physics. Assign these after the source and first playable room are reviewed.
- 🔍 Dialogue studio extension for ordinary NPC profiles and named scene effects. Version 1 already supports line, wait, continue, and four named voices; keep future syntax out of this manifest until the editor contract is agreed.

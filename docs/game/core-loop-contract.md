# Omega Spiral — Core Loop Contract

## Purpose

This contract defines what the player repeatedly does, what creates pressure, what changes after success, how failure recovers, and what must be externally observable for acceptance. It governs the complete 15–20 minute Alpha 0.1 run.

## Core micro-loop

Every playable beat follows the same six steps:

1. Observe a signal, target, hazard tell, or authored choice.
2. Move or choose.
3. Commit with Contextual Act or Dash.
4. Receive immediate visual, audio, and state feedback.
5. Change the world, party, route, or available path.
6. Repeat with one harder combination of known actions.

The player is never asked to guess an undocumented control. The objective, target verb, and world response make the next meaningful action legible without solving the encounter for the player.

## Input contract

- **Move:** WASD, arrow keys, or left stick.
- **Dash:** Space or the south gamepad button.
- **Contextual Act:** E, Enter, or the west gamepad button.
- **Pause:** Escape or the gamepad menu button.
- **Mouse:** menus and settings only.
- **Camera:** directed by the game; no manual orbit.
- **Touch:** full touch gameplay is not supported in Alpha 0.1.

Keyboard and standard gamepad must reach the same outcomes. Input produces intentions; it does not directly mutate presentation, audio, or narrative state.

## Session cadence

The first completion lasts 15–20 minutes and targets about 18 minutes:

- Ghost Terminal: 2–3 minutes.
- Town Map: 2–3 minutes.
- Town Space: about 3 minutes.
- Town Community: 3–4 minutes.
- Town Fracture: 4–5 minutes.
- Threshold and Collapse: about 2 minutes.

Reading and captions never have a countdown. Timing pressure appears only inside clearly telegraphed playable hazards.

## Phase micro-loops

| Phase | Repeated action | Escalation | Exit condition |
|---|---|---|---|
| Ghost Terminal | Read a prompt, make one explicit choice, receive one authored response. | Three choice-and-response beats make influence visible only through tone and signal grammar. | The player has stated a name, committed three choices, and named Omega. |
| Town Map | Find a landmark, move into context, hold or press Act, observe restoration. | Archive, civic refuge, and gate or bridge each require clearer spatial reading. | All three landmarks are restored. |
| Town Space | Read a hazard trace, enter a safe window, commit Move, Dash, or Act, recover. | Three encounters combine known actions; Archive Crossing is the representative capstone. | Archive Crossing is complete and the resident is safe. |
| Town Community | Meet an Echo, understand the role through action, recruit, see party response. | Three recruitments are followed by one party test that accepts any composition. | Three of four Echoes are recruited and the party test is complete. |
| Town Fracture | Read a simultaneous need, send or use a role, complete one route objective, see the parallel consequence. | Three objectives make memory and bodies increasingly impossible to preserve together. | The chosen route has three completed objectives. |
| Threshold | Inspect three presences, approach one, hold Act to carry its question, then cross. | The cost is exclusion: one pairing is carried and two close for this run. | Bridge, logo, world glimpse, collapse, and next loop resolve in order. |

## Pressure

Pressure comes from:

- signal sweeps with visible traces before contact;
- instability shards that remove safe space until disrupted;
- spatial loss that narrows or breaks routes;
- simultaneous town needs during the fracture;
- the knowledge that committing to one route or pairing closes alternatives.

Pressure does not come from timed reading, surprise damage without a tell, hidden affinity selecting the ending, or replaying completed phases after a local mistake.

## Reward

Each success provides an immediate local reward and an accumulating run reward:

- greater visual fidelity and a wider display era;
- another layer of Omega’s audio motif;
- a restored landmark or opened path;
- a learned capability or clearer target verb;
- a recruited relationship and visible party tool;
- a route consequence that remains visible;
- the final logo and coherent world glimpse.

Rewards must be perceivable through more than color. Geometry, motion, sound, label, and state change reinforce important outcomes.

## Cost and consequence

Committing closes possibilities without deleting the player’s progress:

- terminal choices close alternate replies;
- recruiting three Echoes closes one party slot, while the fourth Echo remains visible with the parallel party;
- choosing memory or bodies closes the other route for this run, while the other party performs it;
- carrying one Dreamweaver question closes the other two pairings for this run.

Neither fracture route is morally correct. Hidden affinity changes authored commentary only; the player’s physical threshold approach determines the pairing.

## Failure, retry, and softlock prevention

- Contact with a hazard or loss of the protected resident starts a 1.25-second Echo rewind.
- The rewind restores the current encounter snapshot only.
- Earlier phases and completed encounters remain intact.
- A trace of the failed path may guide the retry, but it disappears after success and never persists into another phase or run.
- `Retry Encounter` is always available from the pause flow.
- Leaving traversable space returns the player to the last safe tile.
- After 30 seconds without progress, the next valid affordance pulses through shape, motion, label, and sound.
- Wide Timing assist enlarges hazard windows without changing the required actions or story outcome.
- Pause suspends gameplay pressure and exposes controls, captions, volume groups, reduced motion, Wide Timing, text speed, and Retry Encounter.
- WebGL or required-asset failure enters an explicit error state rather than a blank or permanently loading screen.
- The final collapse is a successful ending beat, not a failure.

No failure may erase a recruitment, landmark, route objective completed before the current encounter snapshot, or terminal choice. No recovery path may require reloading the page.

## Era transition triggers

Display eras advance only after verified objective completion:

1. Completing name entry, three choices, and Omega naming reveals the denser 4:3 Town Map.
2. Restoring all three landmarks extrudes the map into the widening 16:10 Town Space.
3. Completing Archive Crossing introduces the 16:9 Town Community with portraits and fuller sound.
4. Recruiting three Echoes and passing the party test begins the generationally layered Town Fracture.
5. Completing three objectives on the chosen route opens the threshold.
6. Carrying one Dreamweaver question enables the bridge crossing and momentary coherent 1920×1080 world.
7. Completing the bridge beat resolves the era-specific logo, collapses the world, increments the loop, and returns to Ghost Terminal.

An era transition adds capabilities and motifs; it does not replace the town with an unrelated environment.

## State and reset rules

One seeded run state owns instance, loop, phase, checkpoint, player and Omega names, hidden affinity, party, route, pairing, and era.

- A fresh browser session selects one seeded three-digit base instance.
- The same tab preserves instance and loop through session storage.
- A full collapse increments only the loop number.
- Names, choices, affinity, party, route, pairing, phase, and checkpoints reset for the next loop.
- Accessibility and volume settings may persist separately.
- Dialogue is authored; no runtime model or API supplies it.
- One fixed update order and seeded randomness make the same seed and inputs reproducible.

## Gameplay events

The run must emit typed, observable events for presentation rather than duplicating rules inside UI, audio, or VFX. Alpha 0.1 requires:

`ui.confirm`, `step`, `dash.start`, `act.commit`, `threat.tell`, `threat.contact`, `landmark.restore`, `companion.recruit`, `rewind.begin`, `rewind.end`, `era.advance`, `route.commit`, `pair.carry`, `bridge.cross`, `logo.resolve`, and `loop.collapse`.

Each required event produces immediate feedback. Pause, retry, and restart must stop or release transient audio and VFX so effects do not stack across snapshots.

## Acceptance hooks

The browser acceptance surface must expose the real game, not a parallel mock:

- `window.__THREE_GAME_TEST_HOOKS__` exposes deterministic seed selection, named state preparation, immediate simulation pause while rendering continues, reduced-motion control, and player-facing debug hiding.
- `seed(value)` applies the requested deterministic seed.
- `setState(name)` reaches a declared capture state through real state ownership, rejects unknown names, and reports the applied state.
- `setPausedForScreenshot(true)` stops simulation immediately but keeps the scene renderable.
- Reduced-motion and debug-hide operations change the same settings used by players and release captures.
- `window.__THREE_GAME_DIAGNOSTICS__` reports current run ID, instance, loop, phase, checkpoint, objective, target verb, player state, party, route, pairing, era, pause and accessibility state, audio-unlock state, canvas dimensions, renderer calls, triangles, geometries, textures, and captured runtime errors.

Required named states are `ghost-terminal`, `exploration-active`, `archive-crossing`, `formation-party`, `fracture-memory`, `fracture-bodies`, `threshold-luminary`, `threshold-shadow`, `threshold-ambition`, `bridge-logo`, `loop-restart`, `pause-settings`, and `reduced-motion-fracture`.

A single-worker browser run must prove one complete loop through real input, both fracture routes across runs, all three pairings, one deliberate failure, Echo rewind, retry, and restart. Screenshots support visual review but never substitute for input proof. Current-revision evidence must also show an empty browser console, page-error list, and failed-network list in the production static preview.

## Non-goals

The loop does not include inventory, loot economy, skill trees, procedural levels, a conventional boss, a separate attack combo system, full touch gameplay, backend services, database persistence, a runtime LLM, Python or FastAPI runtime architecture, Electron, installers, or Alpha 0.2 cross-loop residue.

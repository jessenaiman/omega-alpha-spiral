# Floor One Core Loop Contract

## Contract

The player explores a remembered grid and uses Talk, Hit, and Run to reach the exit while turn-linked actors and finite-HP pressure make actions consequential; success advances the visual era, while failure ends the attempt and teaches through the message history and immediate retry.

## Turn Contract

Floor One is a discrete, deterministic, turn-based grid. The world waits while the player thinks. Movement, Wait, Talk, Hit, pickup use, and door interaction spend turns when they change world state. Inspect, help, message review, and other information actions spend no turn.

Each elapsed turn resolves in this order:

1. Read one input intent.
2. Validate the intent against current grid and actor state.
3. Resolve the player action.
4. Emit feedback events and message entries.
5. Resolve the monster phase.
6. Apply turn-linked pressure.
7. Recompute field of view and remembered terrain.
8. Resolve death or exit success.
9. Present the resulting state.

Invalid input and information-only actions do not advance this sequence beyond validation and presentation. Seeded rules must produce the same result from the same seed and input sequence.

## World Contract

The grid owns walls, floor, a stateful door, a useful pickup, exit stairs, the player, and actors. Tile occupancy and collision determine movement; Floor One uses no Rapier or continuous physics.

Visibility has three states:

- Unknown tiles reveal no terrain or entities.
- Remembered tiles show previously seen terrain without stale entity positions.
- Currently visible tiles show current terrain, items, and actors.

A short message history records movement blockers, disposition changes, attacks, hit or miss, damage, HP changes, pickup effects, pursuit, death, and exit outcomes.

## Verb Contract

**Talk** addresses an adjacent Threshold Guard. A real Talk result can change disposition, access, or both; it is not flavor text alone.

**Hit** uses bump melee or an explicit adjacent melee action. Resolution includes a seeded hit or miss result, damage on a hit, and visible HP consequences. Actors cannot share occupied tiles.

**Run** performs source-faithful committed repeated grid movement. Each traversed tile costs and resolves one turn. Run stops before or on rules-defined interest, threat, or obstacle conditions, and it must support tactical retreat rather than functioning as cosmetic speed.

No verb permanently belongs to one Dreamweaver. Dreamweaver differences may affect framing or approach, not remove Talk, Hit, or Run from the common action set.

## Pressure and Outcome

At least the Threshold Guard acts only when turns elapse. It pursues or otherwise advances its threat during the monster phase according to current disposition and visibility rules. Finite player HP and pursuit create Floor One pressure; no hunger system is present.

Death ends the attempt. Immediate retry reconstructs the same authored topology and seed-driven variation. Starting a new run may choose a new seed. Reaching the exit stairs ends the demo and indicates the next visual era.

Floor topology is authored. Actor and item variation may change only through seeded randomness. All hit checks, damage variation, placement variation, and behavior choices use the seeded random source.

## Controls

- Arrow keys or WASD: cardinal movement
- Optional diagonal keys: eight-direction movement
- Space or period: Wait
- T: Talk to an adjacent actor
- H or hostile bump: Hit an adjacent actor
- Shift plus a direction: Run
- Inspect/help/message controls: information only, no turn
- Enter after death: retry the same seed
- New Run from a terminal screen: choose a new seed

## Acceptance Observations

- The first 30 seconds contain a visible route or approach decision.
- The player can trigger Talk, Hit, and Run through real desktop input.
- Talk changes Threshold Guard disposition or access in the observed state.
- Hit visibly resolves hit or miss, damage, and HP.
- Run repeats tile movement and stops for an obstacle, threat, or point of interest.
- Waiting advances the Threshold Guard; inspecting does not.
- Unknown, remembered, and currently visible states are visually distinguishable.
- A pursuing enemy and finite HP create pressure during the first playable minute.
- The useful pickup changes play state rather than only presentation.
- Death states why the attempt ended and same-seed retry reconstructs the same setup.
- Exit stairs end the demo and indicate a new visual era without loading another floor.
- Repeating one seed with one input sequence produces the same outcomes.

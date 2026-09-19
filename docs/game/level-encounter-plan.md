# Floor One Level and Encounter Plan

## Spatial Plan

Floor One uses one compact authored topology with seeded actor and item variation. It contains:

- A sheltered starting cell that teaches movement and visibility.
- An early fork that offers a direct threshold route and a longer side route.
- A side alcove containing one useful pickup.
- A central threshold controlled by one stateful door and one Threshold Guard.
- A retreat loop or alternate corridor that makes pursuit and Run tactically meaningful.
- Exit stairs beyond the threshold.

Walls, floor, door, pickup, stairs, player, and actors occupy grid tiles. Collision and occupancy are tile-based. The authored shape must create line-of-sight breaks, a chokepoint, and at least one route for disengagement; decoration must not replace these decisions.

## Camera and Visibility

Use a fixed elevated grid-readable camera at the representative gameplay scale. The camera may follow or frame the active area, but it must not reveal unknown tiles or hide adjacent tactical choices.

Field of view distinguishes unknown space, remembered terrain, and current visibility. Remembered terrain stays subdued and stable. Entities and item state appear only when currently visible. Door state, player HP, and the short message history remain readable without camera movement.

## Encounter Sequence

**Player start:** The player begins in safety with enough visible floor to test cardinal movement, Wait, and a free information action.

**First decision:** Within 30 seconds, the fork asks whether to approach the obvious threshold or explore the longer side route. The message history and visible geometry communicate both choices without exposition.

**First threat:** The Threshold Guard becomes visible near the stateful door. It acts only after elapsed turns. Its posture, movement, and messages telegraph whether it is neutral, suspicious, or hostile before unavoidable damage.

**First reward:** The side alcove reveals the useful pickup. The pickup changes survivability, access, information, or another concrete play state. It cannot be presentation-only.

**Representative encounter:** The same Threshold Guard must support three complete approaches:

- Talk can change its disposition, open or permit access, or create a safer passage.
- Hit can resolve the encounter through bump or explicit melee with seeded hit/miss, damage, and HP.
- Run can commit movement through known space, stop when danger or interest appears, and enable retreat around the loop.

The three Dreamweavers can frame or favor these approaches differently, but every Dreamweaver retains every verb.

**Exit:** Reaching the stairs ends Floor One. Presentation signals entry into the next visual era, but no next floor or narrative scene loads in this milestone.

## Escalation and Recovery

The opening is safe enough to learn grid movement. Pressure starts when the player spends turns near the Threshold Guard or changes its disposition. Pursuit through the chokepoint then tests terrain reading, Wait timing, finite HP, and tactical Run.

The side route provides a recovery beat: space to break line of sight, collect the pickup, read messages, and choose a new approach. Difficulty rises through route compression, door state, and pursuit, not additional enemy families or hidden meters.

Threats use visible posture, clear movement, door state, HP changes, and concise messages as telegraphs. No failure should occur before the player can identify its cause.

## Seeded Variation

The floor shape and required landmarks do not move. A seed may vary the Threshold Guard's valid starting tile within its encounter zone, the pickup's valid alcove tile, and combat results or approved behavior choices. All variation must preserve the first decision, all three approaches, retreat route, pickup access, and exit path.

Immediate retry uses the same seed. A new run may select another seed.

## Modular Pieces

Keep these pieces independently testable and parameterized only where this slice needs variation:

- Authored grid and tile occupancy
- Field of view and terrain memory
- Stateful door
- Useful pickup
- Threshold Guard disposition, pursuit, and HP
- Talk, Hit, Run, movement, and Wait intents
- Seeded random source
- Feedback events and short message history
- Death, same-seed retry, new-run seed, and exit states

Build and validate this encounter before adding more rooms, actors, items, dialogue, or floors.

## Control and Layout Review

Desktop keyboard is the playable target: arrow keys or WASD for cardinal movement, optional diagonal keys, Space or period to Wait, T to Talk, H or hostile bump to Hit, and Shift plus direction to Run. Information controls do not spend turns.

Review the mobile layout only for legibility, safe spacing, and whether future controls could fit without covering the grid or message history. Touch input is not part of Floor One acceptance.

## Acceptance Observations

- The authored floor exposes a real decision within 30 seconds.
- The camera and field of view keep the next local decision readable without leaking unknown space.
- Talk, Hit, and Run each provide a viable observed response to the Threshold Guard.
- The Threshold Guard advances only on elapsed turns and can pursue the player.
- The door, pickup, chokepoint, and retreat loop each change a decision.
- The pickup creates a measurable state change.
- Escalation leaves at least one readable recovery route.
- Message history explains blocked movement, disposition, combat, pursuit, pickup, death, and exit.
- Same-seed retry reconstructs the same layout and variation; a new seed can vary approved placements and outcomes.
- Exit stairs end the standalone demo and indicate the next visual era.

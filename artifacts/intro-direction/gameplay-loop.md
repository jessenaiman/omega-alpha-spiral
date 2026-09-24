# Opening gameplay brief and loop

Owner direction: [approved design](approved-design.md). Current iteration restores an intentional beginning and player-controlled travel before the first dungeon floor.

## Design brief

- Promise: move through a world being written into existence, choose a strand and grow into a character before entering the dungeon.
- Primary verb: walk. At a stop: read, choose a destination, approach and listen. At the final doorway: type a name and cross.
- Rhythm: a question pauses travel; three routes become available; the player approaches one Dreamweaver; its message is delivered; forward/back movement follows the selected strand to the next stop.
- Growth: the oversized pixel gains a faceless body over the four regular choices. Camera follows traversal. The final name gate is distinct from earlier stops.
- Retry: existing Replay restarts the opening. Begin on a fresh load prevents the story running before the player chooses to enter.
- Stakes: this opening establishes choices and identity. Do not invent combat, a fail timer or punitive answer scoring to satisfy a generic gameplay rubric. Dungeon threat/reward mechanics belong to the first-floor iteration.

## Core loop contract

Player input moves the character toward one of three readable strands. Arrival commits exactly one choice and stops movement for the Dreamweaver's authored message. Forward input then advances along that strand; releasing stops and back input retreats. The next station's sensor advances to the next question. Four committed choices lead to Omega's typed-name gate, doorway traversal and the existing first playable scene.

Guided approach remains an alternate input via route buttons/number keys. Manual keyboard, touch or controller movement must be able to take control. No scene completion may be inferred from a timer when a movement sensor is required.

## Level plan for this slice

| Place | Player action | Gate |
| --- | --- | --- |
| Menu | Begin | Explicit activation |
| Recorded opening | Read; Continue | Shared dialogue runner |
| Stops 1–4 | Approach one of three strands | Choice sensor; one commit |
| Between stops | Forward/back along chosen path | Next-station sensor |
| Final doorway | Type name; walk through suspended words | Nonempty name then doorway sensor |
| First playable scene | Existing movement/interaction | Current ChapterTwoScene / WalkField |

The destination is currently an Echo Chamber graybox with existing room progression. It is not yet proof of the full approved Light-led NetHack floor design. Keep first-floor refinement separate from repairing the opening route.

## Focused verification plan

- Browser: menu layout and Begin, first path reveal with Blender floor/strands.
- Bot: seeded random selections; two full opening→door→playable-scene runs, restart between runs, real input and no mid-route state teleporting. Capture route/seed, progress, held-input movement and errors.
- Preserve a movement recording from the bot; compare actual forward travel with stationary release behavior where exercised.
- Build/typecheck and the bot must be reported separately. No new unit tests or creative-text assertions. Legacy root captures are not current proof.

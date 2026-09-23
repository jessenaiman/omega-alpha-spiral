# Chronicle Intro — playable flow evidence

Run: `intro-playable-20260923` · Source: `intro.html` · Seed: `472`

## Result

The opening now plays from the authored boot through all four Omega questions, spatial Dreamweaver choices, automatic camera travel between questions, the visible Blender fragment doorway, and Chapter Two. The [authored opening dialogue](<../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json>) remains in [chronicle.ts](../src/intro/chronicle.ts); the added text only explains controls. No unit tests were written or run.

The art is an interactive staging pass. The first question is darker and the floor/path recedes in 3D. The Dreamweaver marks are smaller and the finale shows a portal outline and the assembled Blender GLB. The door's structural material remains intentionally dark behind the brighter outline; its final color, fragment timing, and view into the next level need the owner's art review.

## Controls and progression

- WASD/arrows: approach one of three strands. Arrival commits the answer.
- 1/2/3 or a visible choice button: send the character toward that strand; the answer commits on arrival.
- Enter or Continue: leave a completed Dreamweaver response or Omega prelude.
- The selected strand carries the player and camera to the next question without an extra mandatory walk.
- Enter or Step through: cross the final doorway into Chapter Two. The last selected thread is passed to that stage.

## Captures and motion

| State | Capture | Observation |
| --- | --- | --- |
| Desktop question 1 | [PNG](intro-playable-20260923/desktop-question-1.png) | Authored question, thin 3D routes, small marks, avatar and readable choices. |
| Mobile question 1 | [PNG](intro-playable-20260923/mobile-question-1.png) | Question wraps at words; route buttons and movement controls fit without covering the avatar. |
| Desktop final door | [PNG](intro-playable-20260923/desktop-final-door.png) | Blender geometry and luminous portal outline appear at the threshold. |

[Full bot playthrough with locomotion, scene transitions, door and Chapter Two](intro-playable-20260923/bot-playthrough.webm) · [Bot metrics JSON](intro-bot-playtest-report.json) · [Declared capture set](evidence.json)

The three named canvas captures had no console or page errors, used the hardware NVIDIA GTX 1660 D3D11 renderer, and were within the skill's starting draw budgets. Draw calls: 90 for the first question and 177 for the door. The manifest checker passed all three viewport/state pairs and required artifacts. Its pass establishes coverage, not aesthetic approval.

## Skill-defined QA bot

`npm.cmd run test:bot` used Playwright Chromium with one worker, seeded the game, then drove a numeric guided choice, later physical walking choices, the four responses, the automatic travels, doorway entry, all three Chapter Two rooms and retry. Report: 7 objective steps, 1,322 frames, 73.81 units travelled, 0 softlock windows, 3 Chapter Two choices, retry verified, and 0 console/page/network errors. The intro has no fail state by design; Chapter Two owns risk. `npm.cmd run build` passed TypeScript and the Vite production build.

## Creative handoff

[Art direction and reference images](intro-direction/design-brief.md) · [Core loop contract](intro-direction/core-loop-contract.md) · [Level and camera plan](intro-direction/level-plan.md)

Compare the saved first-question, strand-detail, and door-finale reference images with these captures in the next art conversation. The remaining visual decisions are Omega's evolving terminal form, the character's body growth, and how much of Chapter Two becomes visible inside the portal.

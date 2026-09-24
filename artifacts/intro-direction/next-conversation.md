# Intro visual staging for the next conversation

Open the playable scene at `http://127.0.0.1:5188/intro.html`. The official text source is `project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json`; `src/intro/chronicle.ts` loads the authored four path questions and replies. The fifth question and doorway line are the owner's later instructions: "What is your name?" and "I had a name once, was it mine?".

## Compare these pairs in order

| Moment                                      | User reference                                                                                   | Current playable capture                                                                                                                                                                    | Art question                                                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First question, Archive                     | [dark point, fine strands, transparent ground](../../assets/references/intro-first-question.png) | [desktop question 1](../intro-flow-20260923-c/desktop-question-1.png), [mobile question 1](../intro-flow-20260923-c/mobile-question-1.png)                                                  | Reduce the top Dreamweaver marks and floating terminal panel until the small character and dark center dominate? Keep Omega's DOS/2-like ghostwritten text legible.                                                   |
| Strand symbols                              | [cropped glyph and path detail](../../assets/references/intro-strand-detail.png)                 | [travel along Light](../intro-flow-20260923-c/intro-travel-1.png), [Shadow](../intro-flow-20260923-c/intro-travel-2.png), [Ambition](../intro-flow-20260923-c/intro-travel-3.png)           | Preserve the fine shader symbols, but tune how strongly words sit on the chosen path versus floating beside it. Light stays straight, Shadow changes direction in straight segments, Ambition curves toward its goal. |
| Later questions, Tide and technology growth | The first-question image's lower path language, with more depth over time                        | [question 2](../intro-flow-20260923-c/desktop-question-2.png), [question 3](../intro-flow-20260923-c/desktop-question-3.png), [question 4](../intro-flow-20260923-c/desktop-question-4.png) | The avatar and terminal eras advance, but station silhouettes are still too similar. Decide a distinct constructed landmark per question while keeping the reading corridor dark.                                     |
| Final Omega question                        | [door finale composition](../../assets/references/intro-door-finale.png)                         | [name question](../intro-flow-20260923-c/desktop-final-name.png), [mobile](../intro-flow-20260923-c/mobile-final-name.png)                                                                  | Keep the lemniscate distant and suggestive; its complete form is Omega's later power, not the opening backdrop. The Blender portal currently reads dark.                                                              |
| Crossing                                    | Same door finale reference                                                                       | [doorway words](../intro-flow-20260923-c/desktop-final-door.png), [mobile](../intro-flow-20260923-c/mobile-final-door.png)                                                                  | The phrase is suspended inside the doorway and can be walked through. The first stage is not yet legible through the opening; decide the reveal with the actual Chapter Two art.                                      |

## Playable flow now

Boot begins without a click. Omega writes each question. The player uses WASD/arrows to walk to a fine strand, or 1/2/3 to guide the avatar to one. Contact commits the route; the Dreamweaver speaks. Completed writing advances after a reading hold, and Enter can advance sooner. The selected filament then carries the avatar from the reached Dreamweaver into depth while the camera follows. After four route questions, Omega asks for a typed name. The player walks forward through Omega's words and the door to Chapter Two. [Full bot playthrough](../intro-flow-20260923-c/bot-playthrough.webm) records real input, movement, crossing, stage play, and retry.

## Asset layers

- Shader/Three.js: Omega glyphs, path words, lore sigils, three filament rules, sparse particles, transparent substrate, faceless avatar growth, camera movement, and technology-era scaffolding.
- Blender runtime: void background, three strand meshes, fragment door, portal, and floor glyph. [Exact source/export map](blender-runtime-map.md).
- User image references are direction and composition guides; they are not static game backdrops.

## Remaining visual gaps

- The portal interior does not yet show a readable view of Chapter Two. The final screenshot is a dark doorway and needs art direction for the level reveal.
- The four stations still use a similar silhouette even though the route camera travels and their technology detail changes.
- The faceless avatar is visibly blocky. Its growth works, but the final material and proportions remain open.
- Mobile final doorway measured 250 draw calls and 240 geometries against the skill's starting budgets of 150 and 200. This is driven by the individually animated Blender door fragments; a mobile static merged variant is a later optimization if the device target demands it.

These are art decisions and technical gaps to review using the captures, not invitations to replace the authored script or the chosen strand grammar.

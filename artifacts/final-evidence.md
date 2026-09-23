# Chronicle Intro — Current Evidence Example

## Outcome

The Game Director evidence workflow has one declared current run. The manifest, reports, screenshots, and verifier agree on run ID `team-foundation-20260922`.

## Declared captures

| Mode    | State        | Calls | Triangles | Geometries |                                                                  Textures | Visual observation                                                             |
| ------- | ------------ | ----: | --------: | ---------: | ------------------------------------------------------------------------: | ------------------------------------------------------------------------------ |
| Desktop | `question-4` |    54 |     1,638 |         39 |                                                                         8 | Centered question, three authored routes, player and Dreamweaver marks visible |
| Mobile  | `question-2` |    50 |     1,530 |         36 | Question, routes, player, and touch controls visible in the narrow layout |
| Desktop | `complete`   |    36 |     1,064 |         28 |                   Completion copy and all three following threads visible |

All three captures were nonblank, within the skill's starting render budgets, and recorded no console or page errors. Chromium reported the hardware NVIDIA GTX 1660 through D3D11; `softwareRendered` was false.

## Files

- Manifest: `artifacts/evidence.json`
- Desktop question 4: `artifacts/team-foundation-20260922/desktop-question-4.png`
- Mobile question 2: `artifacts/team-foundation-20260922/mobile-question-2.png`
- Desktop completion: `artifacts/team-foundation-20260922/desktop-complete.png`

## Verification

```text
npm run verify:visual
Evidence check passed: 3 artifact(s) confirmed.
```

## Limits

This evidence proves declared capture coverage, nonblank rendering, matching states, error-free capture, and render-budget compliance. It does not replace real-input bot verification, subjective visual approval, audio review, or Floor One evidence.

## Intro layer studies — live check (2026-09-22)

The separate study at `/intro-try3.html?variant=archive` opened on the running local server. Its first frame showed darkness, a pixel player, and Omega ghostwriting on the terminal. After Reveal, the three fine paths, answer words, floor, and receding terminal appeared; the page reported `data-blender-layers="loaded"`. Tide and Threshold opened with their assigned plates. `/intro-strands-shader.html` opened and revealed its independent path study. `npm.cmd run typecheck` passed.

These are basic live page checks for the isolated studies. The existing `artifacts/evidence.json` still describes the earlier `team-foundation-20260922` capture run; it does not claim production coverage for these new studies.

## Intro lettering correction — live check (2026-09-23)

The Archive study at `http://127.0.0.1:5188/intro-try3.html?variant=archive` opened, showed Omega's ghostwritten question, and revealed three shader-drawn Dreamweaver questions hovering over the fine Blender strands. The Blender MCP showed `intro-layer-study.blend` with the void floor, fine strands, and doorway reference. `npm.cmd run typecheck` passed. No unit tests were run for this visual check; the subsequent Git commit hook ran 23 unit tests, and all passed. This is a visual study check, not a full gameplay or release pass.

# First question: review baseline

## Lead review completed — entry through question two

✅ Executed the existing headed real-input bot in a bounded review mode myself, then inspected its recorded frames. No specialist performed this review. [Video](../first-question-review-20260923-a/play/bot-playtest-bot-playtest--0b5ea--retries-the-playable-route/video.webm) · [state/input report](../first-question-review-20260923-a/play/bot-playtest-bot-playtest--0b5ea--retries-the-playable-route/first-question-review.json).

✅ Actual menu Begin → authored boot/question/revisions → sequential Light/Shadow/Ambition turns → forward/release/steer into Light → response → held-forward travel → second question and its choices. Normal motion, 947×874, DPR 1, no forced state, no authored-text assertions. The bounded run passed in 1.9 minutes. No page, console, or HTTP-error responses were captured. Both release/stop samples have exactly the same player coordinates. The route counter advanced 0→1; route helpers measured 7.74 world units and zero stationary-input windows (that distance excludes the initial 650 ms forward demonstration). This proves one route, not the other two or the full game.

❌ **Visual continuity fails review despite functional progression.** Priority findings:

| Priority | Observed defect                                                                                                                                                                                                 | Evidence / smallest next investigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1        | Arrival reconstructs the floor/landmarks around the player instead of preserving a continuous destination. Camera movement alone does not hide it.                                                              | [Arrival sequence](../first-question-review-20260923-a/arrival-detail.jpg), especially frames 025–029. Source confirms `arriveAtNextQuestion()` moves the shared scene root by −6.52: [SpatialBootScene.ts](../../src/intro/SpatialBootScene.ts:925). Keep world references continuous across arrival before changing background detail.                                                                                                                                                                                                               |
| 2        | At contact, Omega and all choice lettering disappear, stars become more prominent, and Light stays upper-left while its response writes near the avatar. This does not deliver the approved centered encounter. | [Contact sequence](../first-question-review-20260923-a/contact-detail.jpg), frames 027–029; [response overview](../first-question-review-20260923-a/motion-overview-3.jpg). The response does appear; it is not permanently missing. Camera aims relative to player rather than selected speaker: [BootScene.ts](../../src/intro/BootScene.ts:798). Preserve a visible route anchor and frame the selected speaker through the handoff.                                                                                                                |
| 3        | Light/Shadow lines overlap at both questions. Route guides/floor appear abruptly at input readiness; the words were presented before the walkable route had spatial context.                                    | [Question one](../first-question-review-20260923-a/play/bot-playtest-bot-playtest--0b5ea--retries-the-playable-route/question-1-ready.png), [question two](../first-question-review-20260923-a/play/bot-playtest-bot-playtest--0b5ea--retries-the-playable-route/question-2-ready.png), contact-detail frames 013–015. Column anchors use shared widths while speaker layouts displace glyphs: [SpatialBootScene.ts](../../src/intro/SpatialBootScene.ts:2057). Measure actual projected text bounds and retain a spatial floor cue during the reveal. |

🔍 Play feel: the short approach reads mostly as a cube climbing the display; travel then moves the camera, but the large terminal, overhead marks and shifting floor provide weak evidence of approaching a destination. This is the lead's visual judgment from the sequence, not a measured renderer defect. Light's contact-to-travel position is preserved and the existing per-sample continuity assertion passed; those numerical checks do not establish world continuity.

✅ Keep: visible word revisions, sequential character turns, distinct white/blue straight / yellow jagged / red curved language, responsive movement and stopping. No new art direction or dialogue was substituted.

✅ Demonstrated repeat command (existing bot, narrow mode):

```powershell
$env:INTRO_REVIEW='first-question'
node node_modules/playwright/cli.js test tests/bot-playtest.spec.ts --headed --workers=1 --reporter=line --output=artifacts/first-question-review-20260923-a/play
```

Use a **new output directory/run ID** for a changed revision; the command above identifies this recorded run. The review mode leaves the existing full-route test path available, but does not execute it. Sampled overviews cover the whole unpaused recording; closer contact/arrival sequences sample five frames per second. Overview time labels are approximate and affected by resampling; use named checkpoints and the source video for correspondence, not those labels as exact event timestamps.

❌ No gameplay-source fix was made during this review. No visual approval, GPU-performance measurement, canvas-inspector pass, other-strand coverage or full release claim. The following initial baseline remains the procedure/history; its missing-motion notes are superseded by this review and links.

---

✅ Scope: the user's first-question screenshot and the transition immediately before it, at `http://127.0.0.1:5191/intro.html`. This is a defect baseline, not an approved visual regression snapshot or a claim that the game plays through.

## Skill authority — fact-check links

- [QA/release — QA pass](../../.agents/skills/threejs-qa-release/SKILL.md#qa-pass), lines 22–35: select affected behavior/viewports; exercise real input; inspect text fit and unpaused motion. Screenshots alone do not cover gameplay.
- [Visual harness — Motion Evidence](../../.agents/skills/threejs-qa-release/references/visual-test-harness.md#motion-evidence), lines 55–61: inspect an unpaused sequence at the gameplay camera, including start/stop and contact. File existence is insufficient.
- [Debug/profiler — Debug](../../.agents/skills/threejs-debug-profiler/SKILL.md#debug), lines 18–25: reproduce the user's URL, inspect camera/transforms/input/physics, fix the owning module, retest the exact broken path.
- [Debug playbook — Triage order](../../.agents/skills/threejs-debug-profiler/references/debug-playbook.md#triage-order), lines 9–15: verify the served target and inspect camera/projection/materials before guessing at a fix.
- [Director — current-run evidence](../../.agents/skills/threejs-game-director/references/evidence-manifest.md#declare-the-capture-set), lines 5–31: declare scope first, use a fresh run, retain failed slots; never relabel historical evidence.
- [Gameplay — Game Feel](../../.agents/skills/threejs-gameplay-systems/references/game-feel.md), lines 3–15: inspect input response before embellishment; feedback must clarify the next decision.

## Before evidence and missing coverage

✅ [User-supplied before image](../first-question-review-20260923-a/user-before.png): 947×874 pixels. Lead also opened the real 5191 intro and visually confirmed the same first-question composition at 971×910. Neither observation proves the preceding animation or contact works.

| Observation                                                                                               | Status / consequence                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Light's first line and Shadow's first line occupy overlapping screen space                                | ✅ Seen in the supplied image and lead's live view; readability defect to reproduce through the reveal and movement. |
| Omega's terminal fills much of the upper center; a red strand crosses it                                  | ✅ Visible; whether the terminal recedes appropriately is not established by this still.                             |
| Three routes converge at the pixel avatar; straight, jagged yellow and curving red treatments are present | ✅ Visible form distinction; destinations and perceived travel still need input review.                              |
| Boot → Omega writing/revisions → speaker turns → choice readiness                                         | ❌ No current continuous motion baseline inspected for this sequence.                                                |
| Walk, steer, release to stop, contact and selected-speaker response                                       | ❌ Not demonstrated by this baseline yet.                                                                            |
| Camera snap, movement depth and visual/physics alignment                                                  | 🔍 Suspected from user feedback and source review; record the moment before calling a root cause verified.           |

## One bounded review route

Desktop first: use the supplied 947×874 framing for the repeatable capture. Record actual browser viewport, DPR, URL, code revision plus local changes, and saved studio document/era selection; do not silently clear the user's studio settings. The live 971×910 observation is supplemental, not a pixel-comparison match.

| Moment              | What the lead must observe                                                              | Evidence                                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Before question     | Begin/replay into authored boot, then Omega's question writing and word replacements    | Unpaused recording from entry; no forced `question-1` hook as a substitute for this sequence.                           |
| Handoff to speakers | Omega finishes; Light, Shadow, Ambition take turns; terminal moves back with continuity | Same recording; mark each speaker's start and the instant input becomes available.                                      |
| Supplied screen     | All three lines legible, distinct routes and pixel visible                              | Still at the actual reached moment, with viewport and runtime/canvas diagnostics.                                       |
| First decision      | Hold forward, steer, release, resume and reach one route; selected speaker begins       | Same recording plus real-input observations; no number-key selection or teleport. Stop this review after that response. |

❌ Planned evidence is declared in [current manifest](../evidence.json); missing reports and motion remain failures/pending. The old full-route manifest is preserved as [historical evidence](../first-question-review-20260923-a/previous-evidence.json). Its old controls, port, and results do not certify this revision.

## Review → fix → repeat

1. Lead performs the bounded route personally and inspects its recording before delegating another iteration. This is the **user's additional workflow requirement**, not a quotation from the skills.
2. Record an observable defect with its frame/time, expected behavior, owning module and smallest correction. Separate readability, movement, camera and dialogue timing.
3. Use debug/profiler to establish the cause; gameplay-systems for control/camera response, UI-designer for text hierarchy, graphics-builder for spatial presentation as needed. Preserve authored wording and character rules.
4. Fix one observed problem, restart from entry with normal motion, and review the same route at the same viewport. Preserve the failed recording; use a new run ID after code/assets change.
5. Delegate only a bounded repeat/improvement with a link to the lead's actual recording, findings and demonstrated procedure. Do not call a planned procedure a demonstration.

✅ Harness decision: extend the existing real-input bot for replay when this lead review has demonstrated the route. Defer approved screenshot snapshots while the composition is visibly defective and still being designed ([harness guidance](../../.agents/skills/threejs-qa-release/references/visual-test-harness.md), lines 3–7). No new unit or creative-text tests. The full five-question/chapter/retry sweep is later coverage, not this narrow baseline.

---

## Existing approved increment

Authority: [approved direction](approved-design.md), including the owner's latest corrections. Scope is first-question approach/contact, not the whole opening.

## Design brief

Player promise: walk through a world being written into existence and physically approach the voice you choose.
Primary verb: walk and steer; release to stop. Target feeling: depth, agency and continuity. Existing dialogue remains authored in the studio. No added combat, timers or invented narrative pressure.

## Core loop contract

Omega finishes writing; three Dreamweavers take turns. The player walks one spatial word path to contact its destination. Contact records that choice and starts the selected speaker's existing message. Walking must visibly change spatial relationships; the camera keeps following through contact.
First review: start moving, steer, stop, approach, contact. Require legible destinations and continuous camera framing. A state counter advancing alone is insufficient.

## Level plan

Start with the existing pixel character at the common origin. Keep all three destinations readable. One line develops into distinct straight Light, jagged yellow Shadow and goal-directed curved Ambition routes. Place text in world space and preserve perspective through approach. Nearby references must move differently from distant scenery. The cosmic background and technological pieces have separate roles.

## Earlier specialist input

- Director: shared contract, integration, review evidence. Existing scene ownership stays intact while drafts are reviewed.
- Luna `opening_gameplay_piece`: only gameplay-systems skill; read-only draft grounded in packaged `src/systems/CameraRig.ts`, `src/game/Game.ts`, and relevant Player/InputController code. Three questions answered before source review.
- Luna `opening_spatial_review`: only aaa-graphics-builder skill; read-only review using its recipes and the approved reference images. Three questions answered before review.
- Both return exact resources used, concrete defects and the smallest next piece. No new tests, generation jobs or whole-project scaffolding. Existing files are not overwritten with `--force`.
- Gameplay draft first; integrate one piece, review actual movement/contact, then proceed to the smallest supporting spatial piece. Current camera patch remains unverified and is not a quality baseline.

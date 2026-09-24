# Omega Spiral level design scorecard

Status: design review, 2026-09-24. The broad era arc and shape grammar are approved; the per-floor rendering vocabulary and town inheritance are proposals awaiting owner review. Scores here are not runtime quality measurements.

| Outcome | Evidence | Current assessment |
| --- | --- | --- |
| One recurring door and reusable geometric kit | [Blender door](../intro-threshold/door.blend), [manifest](design-manifest.md) | ✅ Starting reference; 🔍 stronger final door and full asset atlas pending |
| Floor 1 reads as sparse Atari-inspired 3D | [approved starting point](stage-1-atari-3d-starting-point.png) | ✅ Direction approved; 🔍 playable translation still needs visual review |
| Light, Shadow, Ambition alter geometry and navigation | [approved geometry study](dreamweaver-geometry-stages-1-3.png), [two-seed bot report](../qa-61/early-floor-bot-report.json) | ✅ Shape grammar approved and route mechanics reached exits; 🔍 camera and live aesthetic review pending |
| Intro and Floors 1–3 establish early PC → Atari → NES | [six-frame broad reference](era-progression-reference-draft.png), [per-floor proposal](era-progression-floors-1-6-proposal.png) | ✅ Broad arc approved; 🔍 late-Atari Floor 2 and early-NES Floor 3 treatments await owner decision |
| Floor 4 is a visibly late-NES Echo Vault, not a return to Floor 1 void | [focused era study](floors-4-6-era-vocabulary-proposal.png), [Floor 4 combat concept](floor-4-echo-vault-combat-concept.png) | 🔍 Proposed art rule; ❌ no owner-approved asset vocabulary or representative live frame |
| Floor 5 is visibly 16-bit through repeatable shelf fronts and parallax | [focused era study](floors-4-6-era-vocabulary-proposal.png), [earlier Floors 5–6 study](floors-5-6-combat-era-study.png) | 🔍 Proposed art rule; ❌ no owner-approved reusable archive kit or representative live frame |
| Floor 6 is visibly early-polygon through faceting, dither, and fog | [focused era study](floors-4-6-era-vocabulary-proposal.png), [earlier Floors 5–6 study](floors-5-6-combat-era-study.png) | 🔍 Proposed art rule; ❌ no owner-approved observatory kit or representative live frame |
| Floor 7 town recycles traceable earlier assets within a classic-town anchor | [town concept](floor-7-town-varied-architecture-concept.png), [manifest lineage rule](design-manifest.md) | 🔍 16-bit anchor proposed; ❌ source-stage asset lineage and live town approval missing |
| Floor 8 healing core gathers previous visual languages into modern WebGL | [approved finale concept](omega-healing-core-final-stage-concept.png) | ✅ Endpoint concept approved; 🔍 playable translation pending |
| One hero becomes four by Floor 7 | [manifest](design-manifest.md), [Stage 4 source](<../../project-management/official game docs (read-only)/chapter-zero-stages/stage_4/stage-4-story.md>) | ✅ Current story direction; 🔍 companion presentation in play pending |
| Floors 4–6 teach telegraphed Hit/Run combat | [Floor 4 study](floor-4-echo-vault-combat-concept.png), [manifest](design-manifest.md) | ✅ Encounter models authored; 🔍 owner play review pending |
| Early Monster defeat can advance the story | [bot report](../qa-61/early-floor-bot-report.json) | ✅ Shadow Monster recorded fallen and progressed for tested seeds; 🔍 authored scene feedback pending |
| Dialogue effects derive from the existing studio | [studio](../../omega-dialogue-studio.html), [schema](../../src/intro/ghost-type-study/dialogue.schema.json) | ✅ line/wait/continue exists; ❌ NPC voices and scene-effect cues need an agreed extension |
| Current game is visible | [existing isolated capture](runtime-check-20260924/desktop.png) | ✅ Nonblank baseline; 🔍 not evidence of the newly proposed era art |
Owner's cross-image assessment: even the least successful concept shown in this discussion was **7/10 or better**. This is one overall threshold, not a score for each image. Do not present these concept frames as screenshots of a running game.

## Static art-kit audit — 2026-09-24

This audit reads [Floors 4–6 art source](../../src/chapter-two/floors/MiddleFloorArtKit.ts) and [Floor 7 art source](../../src/chapter-two/floors/LateFloorArtKit.ts). It does not establish what a live frame looks like; effects may also be created outside these two files.

| Floor | Verified in the inspected art source | Gap against the proposed era rule |
| --- | --- | --- |
| 4 | Hard-edged bars and raster caps, 13 isolated floor tiles, digit columns, sentinel. | The inspected kit has no broad repeatable vault tile field or clear echo-plinth form. |
| 5 | Shelf carcasses, book spines, page/leaf sprites and leaf clusters. | No banner, lamp-front, or explicit parallax construction appears in this kit; foliage may dominate the era cue in play. |
| 6 | Six-sided piers, rails, torus arches/dials, and octahedral shards. | Low-poly geometry exists, but vertex-color treatment, low-resolution mapped motifs, dither, and fog are not explicit in this kit. |
| 7 | Several distinct building forms and per-object aspect/pixel-density textures. | The inspected kit has no explicit source-floor asset provenance; mixed texture density alone cannot show that town objects are recycled memories. |

The next implementation pass should start with the Floor 4 tile/plinth kit, then make Floor 5 sprite-front layers and Floor 6 early-polygon display treatment unmistakable in active play. Only after source-floor motifs are reviewed should Floor 7 transform and reuse them.
## Current early-floor runtime review

The [seeded-exit bot report](../qa-61/early-floor-bot-report.json) and [gameplay video](../qa-61/seeded-exit-bot.webm) establish a narrow mechanical pass for seeds 17 and 42. [Shadow action frames](../qa-61/shadow-action-seed-17.png) and [Ambition action frames](../qa-61/ambition-action-seed-17.png) show their distinct authored geometry. The camera still leaves large empty black regions and can hide exit landmarks beneath the HUD or outside the top edge. This fails the current readability target; the owner has not scored or approved these running visuals.

## Runtime visual scoring

The director's [ten-category rubric](../../.agents/skills/threejs-aaa-graphics-builder/references/visual-scorecard.md) applies to active play. This concept scorecard does not invent per-category runtime scores. The isolated current-view inspector measured color entropy 0.22 bits, edge density 0.027, and dominant-color share 0.977; it saw no browser console or page errors. These measurements describe the old sparse glyph baseline, not the approved Stage 1 scene.

## Next visible review

First resolve the proposed per-floor technology ladder with the owner: compare the [approved sparse Floor 1](stage-1-atari-3d-starting-point.png), [six-floor layout proposal](era-progression-floors-1-6-proposal.png), and [focused Floors 4–6 era study](floors-4-6-era-vocabulary-proposal.png). Then capture one representative playable state per floor and judge whether its geometry, asset treatment, legibility, and two effects actually match the agreed era. Floor 7 cannot pass its mixed-era score until inherited assets can be identified from those earlier live floors. The existing nonblank page and bot results are only narrow boot and route evidence.

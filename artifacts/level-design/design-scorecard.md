# Omega Spiral level design scorecard

Status: design review, 2026-09-24. The broad era arc and shape grammar are approved; the per-floor rendering vocabulary and town inheritance are proposals awaiting owner review. Scores here are not runtime quality measurements.

| Outcome | Evidence | Current assessment |
| --- | --- | --- |
| One recurring door and reusable geometric kit | [Blender door](../intro-threshold/door.blend), [manifest](design-manifest.md) | ✅ Starting reference; 🔍 stronger final door and full asset atlas pending |
| Floor 1 reads as sparse Atari-inspired 3D | [approved starting point](stage-1-atari-3d-starting-point.png) | ✅ Direction approved; 🔍 playable translation still needs visual review |
| Light, Shadow, Ambition alter geometry and navigation | [approved geometry study](dreamweaver-geometry-stages-1-3.png), [two-seed bot report](../qa-61/early-floor-bot-report.json) | ✅ Shape grammar approved and route mechanics reached exits; 🔍 camera and live aesthetic review pending |
| Intro and Floors 1–3 establish early PC → Atari → NES | [six-frame broad reference](era-progression-reference-draft.png), [per-floor proposal](era-progression-floors-1-6-proposal.png) | ✅ Broad arc approved; 🔍 late-Atari Floor 2 and early-NES Floor 3 treatments await owner decision |
| Floor 4 is a visibly late-NES Echo Vault, not a return to Floor 1 void | [focused era study](floors-4-6-era-vocabulary-proposal.png), [Floor 4 art source](../../src/chapter-two/floors/MiddleFloorArtKit.ts) | ✅ repeated tile field and echo plinth authored in source; 🔍 owner visual review and town reuse pending |
| Floor 5 is visibly 16-bit through repeatable shelf fronts and parallax | [six-part asset proposal](floor-5-moving-archive-asset-kit-proposal.png), [Floor 5 art source](../../src/chapter-two/floors/MiddleFloorArtKit.ts) | ✅ shared nearest-filter shelf fronts, banners, lamps, and silhouette layers authored in source; 🔍 owner visual review and town reuse pending |
| Floor 6 is visibly early-polygon through faceting, dither, and fog | [focused era study](floors-4-6-era-vocabulary-proposal.png), [Floor 6 art source](../../src/chapter-two/floors/MiddleFloorArtKit.ts), [scene fog transition](../../src/chapter-two/ChapterTwoScene.ts) | ✅ faceted arch, low-resolution motif, and distance fog authored in source; 🔍 owner visual review and town reuse pending |
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
| 4 | Hard-edged bars and sentinel remain; a bounded instanced repeat-tile field and reusable echo plinths were added after the first audit. | Build passes; live appearance, sprite-echo readability, and town reuse remain unreviewed. |
| 5 | Repeated shelf fronts now share four low-resolution CanvasTextures; banner/lamp forms and two shallow silhouette layers are present. Excess leaf clusters were removed. | The source is closer to the 16-bit kit; live camera composition, apparent parallax, and reusable town translation remain unreviewed. |
| 6 | Four arches now share one faceted vertex-color geometry; a 32×32 nearest-filter dithered floor motif is present, and ChapterTwoScene applies Floor-6-only distance fog. | This is a source and build pass, not a live proof of era readability, path contrast, or town inheritance. |
| 7 | Several distinct building forms and per-object aspect/pixel-density textures. | The inspected kit has no explicit source-floor asset provenance; mixed texture density alone cannot show that town objects are recycled memories. |

The Floor 4 tile/plinth source pass is now present. The next art review should confirm Floor 5 sprite-front layers in active play; Floor 6 now has early-polygon source treatment; its effect on the actual playable view remains unreviewed. Only after source-floor motifs are reviewed should Floor 7 transform and reuse them.
## Current early-floor runtime review

The [seeded-exit bot report](../qa-61/early-floor-bot-report.json) and [gameplay video](../qa-61/seeded-exit-bot.webm) establish a narrow mechanical pass for seeds 17 and 42. [Shadow action frames](../qa-61/shadow-action-seed-17.png) and [Ambition action frames](../qa-61/ambition-action-seed-17.png) show their distinct authored geometry. The camera still leaves large empty black regions and can hide exit landmarks beneath the HUD or outside the top edge. This fails the current readability target; the owner has not scored or approved these running visuals.

## Runtime visual scoring

The director's [ten-category rubric](../../.agents/skills/threejs-aaa-graphics-builder/references/visual-scorecard.md) applies to active play. This concept scorecard does not invent per-category runtime scores. The isolated current-view inspector measured color entropy 0.22 bits, edge density 0.027, and dominant-color share 0.977; it saw no browser console or page errors. These measurements describe the old sparse glyph baseline, not the approved Stage 1 scene.

## Next visible review

First resolve the proposed per-floor technology ladder with the owner: compare the [approved sparse Floor 1](stage-1-atari-3d-starting-point.png), [six-floor layout proposal](era-progression-floors-1-6-proposal.png), and [focused Floors 4–6 era study](floors-4-6-era-vocabulary-proposal.png). Then capture one representative playable state per floor and judge whether its geometry, asset treatment, legibility, and two effects actually match the agreed era. Floor 7 cannot pass its mixed-era score until inherited assets can be identified from those earlier live floors. The existing nonblank page and bot results are only narrow boot and route evidence.

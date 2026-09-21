**Verified:**✅ Source docs and `Handoffs/32.md` were read read-only. Hindsight lookup was unavailable in this session.

### 1) Stage 2 immediate playable slice

- **Verbs:** walk/approach, inspect/interact with one object, answer its prompt; monster interaction triggers an automatic narrative fight. No combat math. (`stage_2/nethack-scene.md:121-135`, `290-295`)
- **Objects:** Door = cryptic question; Monster = auto-fight; Chest = mystery item/message. Each secretly aligns with Light, Shadow, or Ambition. (`stage_2/nethack-scene.md:123-128`)
- **Layout:** three sequential Rogue-style rooms, one owned by each Dreamweaver. Objects occupy left/middle/right zones; layouts may shift slightly while relative object zones remain stable. (`stage_2/nethack-scene.md:46-52`, `141-152`)
- **Feedback/outcome:** the aligned Dreamweaver comments on the selected object; owner-aligned choices award 2 points, cross-aligned choices 1 point. Keep scores hidden. (`stage_2/nethack-scene.md:48-52`, `92-100`, `129-133`)
- **Exit:** after all three rooms, tally alignment and return the selected Dreamweaver plus structured choice data; that Dreamweaver escorts the player onward. (`stage_2/nethack-scene.md:139-152`)

### 2) Stages 1–6

- **Stage 1 — Ghost Terminal:** four existential questions establish role, identity, names, and commitment; answers resonate with Dreamweavers and end in recognition/disorientation. (`chapter-zero-story-index.md:25-36`; `stage_1_opening/stage-1-story.md:3-9`)
- **Stage 2 — Echo Chamber:** three Dreamweaver-owned mirror dungeons use symbolic objects and hidden affinity scoring to determine who claims the player. (`chapter-zero-story-index.md:40-52`)
- **Stage 3 — Liminal Township:** free exploration of a looping JRPG village reveals plural visitors, era-flickering signs, and environmental seams. (`chapter-zero-story-index.md:56-68`; `stage_3/stage-3-story.md:3-20`)
- **Stage 4 — Echo Vault:** recruit from nine iteration echoes; party-size warnings and Sweeper interference expose self-multiplication. (`chapter-zero-story-index.md:72-84`; `stage_4/stage-4-story.md:3-20`)
- **Stage 5 — Fractured Escape:** the town breaks apart, three philosophies become escape routes, and the routes converge at a bridge where three parties briefly appear. (`chapter-zero-story-index.md:88-101`; `stage_5/stage-5-story.md:15-25`, `60-81`, `106-135`)
- **Stage 6 — Epilogue:** an archive reveals simultaneous escapes; Dreamweavers react with shock, denial, and refusal to merge. (`stage_6_epilog/stage-6-story.md:3-7`, `11-25`, `39-44`)

### 3) Creative requirements vs pseudocode

**Verified creative requirements:** preserve mystery and metaphor; avoid explaining multiplicity; make each Dreamweaver’s voice distinct; use symbolic Door/Monster/Chest agency; keep scoring invisible; retain incremental era mixing and moving celestial opening; Three.js owns stars/primitives, Blender owns modular door art without baked backgrounds. (`stage_2/nethack-scene.md:3-10`, `104-115`; `Handoffs/32.md:33-35`, `73-79`)

**Inferred ❌ pseudocode only:** ASCII maps, JSON/YAML content schemas, Python scoring, stdout result examples, and embedded React code are design sketches—not implementation instructions. (`stage_2/nethack-scene.md:156-281`; `stage_1_opening/App.tsx`)

### 4) Contradictions / owner decisions

- **Stage count:** index says five stages, while Stage 6 exists. Decide whether Stage 6 is part of Chapter Zero or a post-chapter epilogue. (`chapter-zero-story-index.md:23-24`; `stage_6_epilog/stage-6-story.md:1-5`)
- **Stage 2 sequencing:** “three chambers exist simultaneously” conflicts with the corrected sequential flow. (`stage_2/stage-2-story.md:15-21`; `stage_2/nethack-scene.md:119-152`)
- **Opening authority:** `ghost.json` is authoritative reference, but runtime content must be a separate authored copy; current handoff calls direct import unresolved. (`Handoffs/32.md:46`, `57`)
- **Later wording/version:** earlier JSON and newer YAML diverge; owner must select the canonical Stage 2 script before narrative integration. (`Handoffs/32.md:73-76`)

### 5) Smallest compatible Three.js graybox

**Verified:** build one large flat floor, low-fi block player, three block rooms/lanes, and three primitive objects per room. Keyboard movement approaches objects; proximity/interact triggers neutral placeholder feedback, one auto-fight pause, or item text. Track hidden scores, advance Light → Shadow → Ambition, then show the chosen Dreamweaver and a simple exit doorway. Keep stars/primitive space in Three.js; defer modular door art to Blender. This satisfies the documented traversal, interaction, scoring, and exit loop without waiting for final art. (`stage_2/nethack-scene.md:121-152`; `Handoffs/32.md:73-79`)
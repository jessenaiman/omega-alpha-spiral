---
tags: [omega-spiral, creative-review, stage-3]
status: awaiting-owner-direction
---
# Stage 3 — one review, two competing stories

**This is a comparison, not an approved script.** Originals remain untouched in `official game docs (read-only)/chapter-zero-stages/stage_3/`. Luna compared all eight files, a second Luna reviewed the actual comparison with those same sources, and the director checked material findings below.

## The decision before rewriting

**Township:** the player explores a familiar but wrong JRPG village. NPCs loop, speak about other visitors, and appear in inconsistent places. Signs flicker between visual eras. The Dreamweavers mistake the glitches for ordinary corruption rather than evidence of simultaneous parties. Source: `stage-3-story.md:5-38`.

**Never Go Alone:** the player selects reflections as companions, tests an inadequate party in combat, is pulled back, and recruits again. The fuller draft alternates three recruitment beats with three combat beats; its final battle moves onward whether won, lost or interrupted. Sources: `never-go-alone-purpose-flow.md:5-49`; `never_go_alone.json`, `stage_beats` and `:161-187`.

These are different player experiences. Do not merge them or assume either is canonical merely because it is called Stage 3.

## Which files to open

| File | Role in this review | Handling |
|---|---|---|
| `stage-3-story.md` | Short township story and subtext | Read for town premise; not the party script. |
| `never-go-alone-purpose-flow.md` | Human-readable party-building purpose and beat flow | Best starting point for discussing party intent; ends mid-description at line 49. |
| `never_go_alone.json` | Parseable party script with six beats, Stage 2 modifiers and persistence notes | Reference for detailed dialogue/outcomes, not approval or production code. |
| `never-go-alone-design.md` | Proposed party data structure, mirrors and combats | Technical/design reference; not another required story chapter. |
| `state-3-draft.md` | Party narrative draft in a Markdown code block | Compare wording only when needed; does not contain the JSON's final Stage 2 modifiers/persistence blocks. Preserve its exact filename. |
| `never-go-alone-script.json` | Incomplete party-script variant | Invalid JSON at line 101, column 27; do not import or treat as a complete script. |
| `never_go_alone_schema.json` | Companion/escape-sequence schema | Not the schema of `never_go_alone.json`. |
| `party-customize-scene.md` | Empty placeholder | No story or implementation authority. |

## Verified conflicts and reviewer corrections

- **Names:** current project names remain Light / Shadow / Ambition. Old party drafts use Light / Mischief / Wrath. The reviewer incorrectly proposed making the old names canonical. Reject that recommendation; leave original identifiers untouched and adapt an approved copy later.
- **Party growth:** the purpose document describes solo → pair → trio → full party (`:10`), but later permits the final two choices sequentially or simultaneously (`:41-45`). The JSON explicitly goes from a two-member test to selection of the final two (`:126-156`). This is an unresolved pacing choice, not proof that a separate three-member battle is required.
- **Three offered options:** the party draft presents Fighter / Wizard / Thief / Scribe (`never_go_alone.json:151-156`). It does not already implement the owner's rule of one offer per Dreamweaver. Three offers and total eventual party size are separate concepts.
- **Schema mismatch:** the schema requires `type`, `title`, `companions`, and `escapeSequence` (`:5`); the parseable party script has none of these keys. Python checked those required keys directly. This is not a claim that full schema validation was run.
- **Different endings:** these documents point beyond Stage 3 toward later stages. The current demo's attunement/crash/restart endpoint is an owner-directed adaptation, not something already implemented by the JSON.
- **Legacy code references:** `GameState.PlayerParty.AddMember()` and `PartySaveData.cs` (`never_go_alone.json:211-215`) are pseudocode/reference notes, not existing Three.js APIs to import.

## Current owner constraints, regardless of chosen storyline

- Preserve the supplied opening `ghost.json`.
- Reuse the NetHack-style backend; layer changed objects, assets and visuals over it. The eventual town expands the map rather than requiring another engine.
- Each floor has a Dreamweaver Dungeon Master; all three still offer a player option.
- A floor ends or crashes, then visibly loads/rebuilds before advancing. No seamless swap. New revisions gain visual clarity and modernity while exhibiting more defects as Omega struggles.
- Text decisions offer three aligned answers; scores remain hidden. No permanent death.
- Final demo crash restarts the whole demo. Exact Stage 3 ordering and party scope remain to be settled before declaring the five-scene route final.

## Recommended next discussion

Start with the **human-readable story**, not the JSON. Because the owner recalled party expansion, use `never-go-alone-purpose-flow.md` to discuss that intent alongside the short township summary above. Decide whether party-building replaces, precedes or happens inside the town segment. Only then choose party-growth pacing and draft the first beat together.

Keep this note as the single review entry point. Do not delete, rename or move originals, and do not promote any draft to canon without the owner's decision.

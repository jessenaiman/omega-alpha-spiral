# Opening block — first studio adaptation

- Source: Godot `level_1_ghost/ghost_terminal.dtl`, opening before first choices. Original source is unchanged.
- Data: `src/intro/ghost-type-study/opening.dialogue.json`; contract: `dialogue.schema.json`. Runtime uses explicit v1 boundary checks, not a general JSON Schema engine.
- Sequence: restart transmission → 2000 ms wait (sum of original waits) → opening question → explicit Continue boundary. Color tags removed; pipe alternatives retained literally. No alternatives resolver, added character dialogue or player-choice implementation in this slice.
- Studio controls: editable selected line, Apply & preview, Play opening, pause/replay, JSON import/export. Editing pauses playback. Export includes applied edits only. Import rejects unsupported profiles and preserves the current document on validation failure.
- Shared runner is renderer-independent; this slice is connected to studio only. Game integration, arbitrary NPC profile loading and script calls remain future work.
- Live observation: existing port 5191 studio loaded the new document and reached the before-choices wait. Browser accessibility state showed the complete question. Screenshot showed actual 3D DOS glyphs; overlapping glyph quads were narrowed and a subsequent screenshot showed separated lettering during reveal.
- Responsive behavior: below 1000 px, script controls are below the preview with a scroll instruction. Desktop uses a side panel.
- No new unit tests or existing test suite run. Export/import round trip, production build and recorded-motion evidence have not been verified in this pass. The old root evidence run is unrelated to this editor.
- Review URL: http://127.0.0.1:5191/omega-dialogue-studio.html?variant=passage&speaker=omega&scene=opening&era=dos

## Editor persistence follow-up

- Dialogue validation now compiles `dialogue.schema.json` through Ajv; the original handwritten v1 checks were replaced. Duplicate event IDs remain a semantic check.
- Optional `presentation` data contains scene, era, layout and cadence settings keyed by the currently supported character profiles. Imports without this optional field remain accepted. The starting opening file selects Opening/Omega, DOS and passage.
- Existing scene/era/layout/voice controls update this document. Reopening and previewing restores those settings. The renderer's code remains separate from the data.
- Added undo/redo for applied document and formatting changes, retained per-line text drafts while switching instructions, and a shared editable JSON source view. Export applies valid pending text drafts; invalid text is reported without exporting it.
- Era descriptions explain the actual implementation and explicitly label the four presets as artistic approximations. The historical research prompt is available inside the editor under Research more text eras.
- Ajv installation initially failed because sandbox networking was blocked; an escalated retry succeeded. No tests, production build, new browser checks or log scans were run in this follow-up. Owner asked to exercise text/settings export and reopen; response pending.
- Issue #53 updated with the narrowed scope, local progress and outstanding requirements. Full timeline authoring, script calls, arbitrary NPC profiles, choice/input/scene acknowledgement and game integration remain unfinished.

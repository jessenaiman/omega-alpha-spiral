# Research prompt: historical computer lettering for Omega Dialogue Studio

Copy the prompt below into your preferred research tool. Return the report and source links; the studio will use its chronology to replace the current four broad art presets.

---

Research a historically grounded, visually distinctive chronology of computer text presentation for an interactive 3D game, Omega Spiral. Cover the earliest relevant machine output through modern screens. This is a research task, not a request to invent lore or build the game.

## Context

Omega's surviving code accumulated over a long fictional history. At system boot, a recorded script is repeating; Omega is not consciously present. Technological styles can suggest age and accumulated layers without implying that answering a question advances technology. The universe is dark and spatial; letters may float in 3D while still obeying their original display's typographic constraints.

One scene owner selects the base text era for everyone in that scene: Opening = Omega; Floor 1 = Light; Floor 2 = Shadow; Floor 3 = Ambition. These mappings do not assign historical dates. Omega follows the era's ordinary system output. Light organizes text along straight lines, Shadow changes direction along straight segments, and Ambition curves toward a target. Their cadence, mistakes and revisions remain individual character settings.

## Research requirements

1. Produce a chronological table of roughly 15–25 meaningfully different display/output traditions. Include dates of introduction and common use separately; show overlap and parallel traditions instead of forcing a single linear evolution.
2. Investigate mechanical/printed output, teletypes, early CRT and vector systems, character terminals, home computers, DOS-era displays, OS/2, early graphical desktops, workstation interfaces, and later font rasterization. Select entries based on evidence and visual differences, not brand coverage.
3. Distinguish programming language from operating system, physical display, character encoding, terminal protocol, font, and rendering technique. In particular, explain what assembly language, DOS and OS/2 do and do not determine about appearance. Flag ambiguous labels rather than silently conflating them.
4. For each entry give: stable slug, short name, dates, platform/device, specific font or glyph reference, character-cell dimensions, raster/vector/printed method, resolution or character grid, color/phosphor, stroke and pixel geometry, spacing, cursor, scrolling/reveal behavior, supported writing directions/characters, and one immediately recognizable visual trait.
5. Separate historically evidenced behavior from optional cinematic treatment. Do not attribute thinking pauses, arbitrary typos, flicker, glitches or scan lines to every historical system. Explain which effects are physically justified and which are game art choices.
6. Provide one useful screenshot or specimen link per entry, preferably manufacturer manuals, museums, archives, original software documentation or font sources. Date each source and include specific supporting page/section. Say unknown where evidence is absent.
7. Identify legally reusable fonts or glyph assets, including license and source. Distinguish a reference image from an asset we may redistribute. Offer an approximate open alternative when an authentic asset cannot be shipped.
8. Provide concise writer-facing descriptions (one sentence) and designer-facing descriptions (three sentences). Explain how each tradition could remain recognizable when its letters float in Three.js space. Preserve readability; do not turn every style into neon.
9. Recommend an initial set of 6–8 contrasting presets and explain each selection. Include comparison specimens using the SAME neutral sample: `The signal remains. Is anyone listening?` Show upper/lowercase and punctuation limits honestly.
10. End with a machine-readable JSON array using fields: `id`, `label`, `introduced`, `commonUse`, `parallelTraditions`, `description`, `device`, `font`, `fontLicense`, `cellPixels`, `renderMethod`, `palette`, `cursor`, `reveal`, `constraints`, `spatialAdaptation`, `historicalEffects`, `optionalEffects`, `sources`, `confidence`. Use null for unknown values; do not fabricate exact numbers.

## Output

Start with the chronological table, then detailed entries, recommended presets, source/licensing notes and JSON. Clearly label verified facts, disputed dates and creative adaptations. The research should support art decisions; it must not choose the game's floor-era assignments or rewrite character identities.

# Filament motion iteration

Owner requested live line-art filaments acquiring depth, small constellations, convergence into the reference logo and reformation. The reference's open diagonal edge streams are essential: the mark forms within strands extending beyond the crop. Later correction replaces confetti-like breakup with a cosmic dissolve and travel through space into the game.

## Current implementation

- `src/intro/filaments/FilamentForm.ts`: reusable geometry with straight Light, angular Shadow and reaching Ambition. Batched line segments plus sparse luminous nodes; separate flat/spatial positions and logo targets.
- `src/intro/filaments/shaders.ts`: moving highlights, depth, convergence and dissolve along sight lines. CosmicPassage adds parallax stars and depth streaks. No videos or generated sprite sheets.
- `FilamentView.ts`: menu/review lifecycle, 22-second cycle, capped DPR, reduced-motion static logo, renderer disposal after the Begin transition. SpatialBootScene uses its existing renderer for the same forms at the Dreamweaver positions.
- `/filament-study.html`: live review, pause and scrub controls. `/intro.html`: menu uses the same effect; small opening presences gain depth on reveal.
- A procedural interpretation of the reference, not a pixel-exact logo replacement. User approval of this rendition is pending. Start-to-first-question was exercised; the later route remains unverified.

## Evidence limits

Opened the live study and inspected the logo frame in the browser. It rendered visible open tails beyond the crop. At the owner's later request, a browser bot clicked the real Begin control: 36 unpaused screencast frames covered approximately 3.915 seconds of menu convergence, zoom/dissolve and arrival at the recorded terminal. Frames were inspected in the conversation; no video file exported. Captured browser warnings/errors were empty. The bot then clicked Continue and reached the first question's three selectable paths.

That first-question view exposed filament forms overlapping the terminal. Moved them from path sigils into the existing Dreamweaver positions and removed the old basic marks. Their world trails now also follow straight Light / jagged yellow Shadow / curving Ambition. A second real Begin/Continue traversal reached the first question; the screenshot showed all three forms above the terminal, with no captured browser warnings/errors. No test suite, Playwright harness, build, or typecheck was run. This verifies the observed start route only, not a complete game or release.

## Rejected source material

All three `assets/intro/background-motion/style-*/contact-sheet.jpg` studies were rejected by the owner because they did not convey motion or converging spiral strands. The gallery now labels them rejected. Do not reuse their earlier sprite/background proposals.

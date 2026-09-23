# Intro: playable art direction

## Promise

The player wakes as a point in darkness. Omega's old code writes a question into space. Three fine Dreamweaver strands offer distinct routes; choosing one gives it a voice, changes the growing character, and carries the player toward the next question. The fourth choice reveals the assembled doorway and the first playable stage.

## Visual sequence

1. **Darkness / boot.** Keep the authored `./omega` and bash opening. Only code, a cursor, a few distant particles and the first pixel exist. Omega is present through the writing and construction, never a giant cosmic body.
2. **First question / Archive.** The question is the hero: a floating early terminal surface at the center. It recedes when three small strands and their sigils become legible. The player stands on a transparent substrate with visible depth. Reference: [first question](../../assets/references/intro-first-question.png) and [strand detail](../../assets/references/intro-strand-detail.png).
3. **Travel / Tide.** Movement follows the chosen strand through a 3D void. The camera follows enough to prove distance; lettering hangs at different depths rather than being a full-screen card. Each question adds a newer display generation over traces of the old one. The cosmic volume grows gradually and leaves the reading corridor dark.
4. **Final threshold.** The door's Blender fragments assemble only after the four authored choices. The first level is visible beyond it. Use [door finale](../../assets/references/intro-door-finale.png) for scale and energy, with less galaxy density in the first three questions.

## Shape grammar

- Light: a fine, straight filament and exact symbols.
- Shadow: irregular straight segments that change direction.
- Ambition: a continuous curve that bends toward its destination.
- One filament represents one demo loop. The complete Omega logo is a future power, not a background shown in full here.
- The growing player moves from oversized point to faceless humanoid. Dreamweaver color leaves a restrained imprint instead of repainting the whole world.

## Layer ownership

- **2D:** the three supplied images are optical references, not runtime backdrops; texture/density maps may modulate atmosphere.
- **Blender 3D:** void details, strand models, and fragmenting door remain separately editable; export to GLB.
- **Three.js / shaders:** era lettering, playable filament paths and symbols, transparent substrate, particles, camera, selection feedback, and character growth.

## Current visual review

The prior straight-on framing made a 3D scene read as a flat illustration. The oversized top marks and a single visible answer also hid the spatial decision. This pass adds a receding floor/path and an oblique camera, makes approach to a strand commit the answer, carries the player through the otherwise empty interval between questions, keeps the authored choices readable in a restrained edge guide, and reveals the Blender fragment door at the finale. Final art tuning still needs a user review of motion, scale, and timing in the live page.

## Resume the creative conversation here

Review [the first-question image](../../assets/references/intro-first-question.png) beside a live first-question capture: the image's small character, fine sigils and dark center are the target; its galaxy forms are too strong for the opening. Review [the strand crop](../../assets/references/intro-strand-detail.png) for the symbol spacing and transparent ground. Reserve [the door image](../../assets/references/intro-door-finale.png) for the last question, where the Blender fragments and the first level finally become substantial. The next art decisions are the physical shape of Omega's evolving terminal, how the character gains a faceless body across four questions, and how much of the level is visible through the door.

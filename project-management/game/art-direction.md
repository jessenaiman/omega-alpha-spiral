# Floor One Art Direction

## Intent

Floor One is a premium vertical slice of an authored low-poly dungeon. It must look deliberately built, not assembled from generic primitives, and must remain readable without darkness, fog, bloom, or glitch effects hiding missing geometry.

Every rendered surface grows from a real code and roguelike substrate. Each world entity has one stable representation in both views:

| Entity | Glyph | Wireframe reading |
| --- | --- | --- |
| Player | `@` | Upright converging-strand silhouette |
| Threshold Guard | `G` | Broad forward brace with an open center gap |
| Wall | `#` | Dense cell frame with a blocked center |
| Floor | `.` | Low crossed tile frame |
| Door | `+` | Four-part frame whose center records door state |
| Pickup | `*` | Radial faceted star |
| Exit stairs | `>` | Descending directional steps |

Code reveals always show the current world state at the same position and scale as its 3D counterpart. They are semantic glimpses, never random decorative static.

## Floor Progression

Each later dungeon floor advances one era of game UI and rendering while retaining the visual grammar already introduced. Floor One is the first era: terminal glyphs and wireframes extrude into faceted low-poly 3D. Later floors may add richer raster, vector, material, or interface treatments, but the glyph identity, spatial mapping, and state truth remain visible underneath.

## Camera And Scale

- Use a fixed three-quarter perspective camera with a 32-degree vertical FOV, 48-degree pitch, and 45-degree yaw. Keep world north stable and disable manual orbit.
- One grid cell is 1 world unit. The player is about 0.72 units wide and 1.15 units tall. Walls rise 1.8 units above the floor.
- Frame about 11 by 8 cells on desktop. Keep the player near the lower-middle third while preserving the next decision and one landmark.
- On narrow mobile layouts, frame about 9 by 9 cells and move the log below the playfield. Do not shrink the player below 36 CSS pixels or crop the current objective.
- Camera movement follows resolved grid steps with a short, critically damped settle. No roll, auto-orbit, motion blur, or decorative shake.

## Authored Asset Set

All hero and interaction assets require actual authored geometry, clear profiles, purposeful bevels, and visible construction from their glyph or wireframe base.

- **Player:** A compact three-strand figure built around the `@` loop. A faceted mantle, offset core, and grounded feet create a readable front, side, and rear silhouette. Idle, move, interact, hurt, and choice states change stance or strand arrangement rather than only color.
- **Threshold Guard:** A broad `G`-derived guardian with a forward brace and deliberate negative-space center. Alert, committed, staggered, and resolved states have distinct silhouettes and telegraphs.
- **Walls, floors, and corners:** A modular kit of straight walls, inner corners, outer corners, caps, thresholds, floor plates, broken plates, and elevation trims. Stone planes should be irregularly faceted, with designed seams and edge wear. Repetition may be instanced, but room composition must be authored.
- **Stateful door:** A heavy four-part `+` mechanism with closed, available, locked, opening, and open geometry states. The center seam, brace angle, glyph, and profile must communicate state without hue.
- **Pickup:** A small `*` relic with radial blades around a protected center. Available, targeted, collected, and spent states alter its geometry or world mark.
- **Exit stairs:** A clear `>` silhouette made from descending wedge steps and a terminal wireframe at the landing. The route must read from the room entrance.
- **Landmarks:** Give the representative chamber at least three composed anchors: a terminal plinth, a collapsed glyph arch, and a strand-carved well or dais. Each must differ in height, outline, and gameplay meaning.

No hero asset may remain a plain cube, sphere, capsule, cone, or text sprite with glow. Primitive geometry may be a construction input, but not the final visible form.

## Shape Language And Identity

The supplied logo is style authority for convergence, tension, spacing, and the relationship among three strands. It is not a bitmap to crop, trace, texture onto geometry, or ship as runtime art.

- **Light:** Order and lawfulness. White-blue surfaces use straight, purposeful lines, aligned planes, measured spacing, and clean termination.
- **Shadow:** Neutrality and ambivalence. Yellow-gold surfaces use sharp angular lines, offsets, forks, and unresolved directional tension.
- **Ambition:** Opportunity, potential, and possible greed. Crimson-red surfaces use smooth circular forms that curl back toward themselves.

The three identities must remain legible in silhouette and line behavior without color. No fixed verb belongs to a Dreamweaver. Actions derive from the current entity, context, and player choice, never from identity shorthand.

## Materials And Lighting

- Use a shared material kit: matte charcoal stone, pale chipped edges, dark recessed seams, Light white-blue, Shadow yellow-gold, Ambition crimson-red, and low-intensity neutral signal emission.
- Prefer vertex color, small shared trim or wear maps, and geometry-led facets over unique high-resolution textures. World and HUD signal colors use the same palette.
- Most surfaces use rough `MeshStandardMaterial`. Reserve emissive response for active runes, state seams, and brief event accents. Glow must never define missing form.
- Light the chamber with one cool directional key, broad neutral ambient or hemisphere fill, and localized baked-looking pools from authored fixtures. Keep one shadow-casting light on mobile and no more than two on desktop.
- Contact shadows ground the player, Threshold Guard, door, and major landmarks. Small repeated props use cheap blob or contact meshes.
- Maintain readable midtones and visible wall, floor, corner, and stair geometry in active play. Darkness and fog may shape depth, but never conceal an empty room.
- Use intentional tone mapping and restrained exposure. No motion blur, depth of field, or screen-space reflections. Any bloom must be subtle, selective, and nonessential.

## Code Reveals

The substrate can surface during state transitions, uncertainty, and direct inspection:

- A resolved player step briefly exposes the destination `.` and the moving `@` beneath the model.
- Threshold Guard anticipation reveals `G`, its occupied cell, and its current reachable or threatened cells.
- Door inspection or state change reveals the `+` and exact blocking state.
- Pickup focus and collection reveal `*` before the 3D shell separates or clears.
- Exit activation reveals `>` down the stair path.
- Damage, contradiction, or a failed action may cut a narrow region from shaded geometry to aligned wireframes and glyphs.

Reveals use the live board state and current transforms. They must not invent glyphs, displace cells, show stale occupancy, or add unrelated noise. A reveal returns cleanly to the same authored surface.

## Event-Driven VFX

- **Move:** A short edge trace joins origin and destination; no persistent trail.
- **Threshold Guard intent:** Its brace opens toward the affected cell, followed by an aligned angular telegraph and `G` reveal.
- **Impact or blocked action:** Use a compact facet break, contact flash, and brief static wireframe cut at the collision cell.
- **Door state:** Braces physically unlock or resist before the center seam changes. The `+` appears at the mechanism, not full screen.
- **Pickup:** Radial blades fold inward, the `*` flashes at the exact cell, and a concise log entry confirms the result.
- **Exit ready:** Stair edges resolve in descending sequence and the `>` holds at the landing.
- **Choice influence:** Light uses straight converging traces, Shadow uses angular split traces, and Ambition uses circular traces that turn inward.

Effects are pooled, short, and tied to rules events. They clarify actors, targets, collision cells, and outcomes. They never run as ambient visual noise.

## HUD And Message Log

The HUD is a restrained terminal layer integrated with the dungeon, not a stack of generic stat cards.

- Keep objective and immediate action near a safe screen edge, outside the play path.
- Use stable glyphs beside entity names and prompts so world and interface share one vocabulary.
- Show only current resources and actionable state during play. Secondary detail belongs in the message log.
- The message log uses concise monospace lines for observed state changes, choices, failed actions, and consequences. New lines may echo the relevant glyph, but must not assign a fixed verb to any Dreamweaver.
- Door, pickup, Threshold Guard, and exit prompts must fit at 200 percent text zoom without clipping or obscuring the controlled cell.
- Use shape, text, value, and silhouette backups for every color-coded identity or state.

## Responsive And Reduced Motion

- Desktop uses an unobstructed landscape playfield with the log in a narrow side rail or lower strip.
- Mobile uses a portrait-safe review composition with the objective above the canvas and the log below it. Reserve safe space for possible future controls without adding touch gameplay in Floor One.
- At reduced motion, replace camera settles, jitter, pulses, sequential reveals, and moving traces with immediate cuts, held wireframe overlays, static state outlines, and single-frame contact accents.
- Reduced motion retains all telegraphs, timing information, glyphs, outcomes, and interaction states. It never removes critical information.

## Asset And Runtime Boundaries

- Authored player, Threshold Guard, door, stairs, and landmark meshes may come from Blender or equivalent source files, exported as reviewed GLB assets with scale, pivot, bounds, material, triangle, texture, and collision checks.
- Modular floors, walls, corners, trims, glyph planes, collision proxies, and repeated room details may be procedural or instanced at runtime.
- Keep collision and grid occupancy in gameplay state, separate from visual mesh complexity. Rendering consumes stable entity IDs, cell positions, facing, and state; it does not infer rules from animation.
- Generate glyph, wireframe, and shaded forms from the same entity mapping. One authoritative world snapshot drives all three representations.
- Reuse shared materials, geometry, VFX pools, settings, diagnostics, and named acceptance states. Avoid per-frame allocation and one-off materials.
- Imported assets must survive the gameplay camera, mobile framing, and in-game lighting. Model-viewer beauty shots do not count as acceptance.

## Renderer Budgets

Measure the worst active-play chamber, not an empty room.

| Metric | Desktop | Mobile |
| --- | ---: | ---: |
| Draw calls | Under 300 | Under 150 |
| Triangles | Under 750,000 | Under 300,000 |
| Textures | Under 60 | Under 40 |
| DPR cap | 2 | 1.5 |

Share material roles and instance repeated floor, wall, trim, and prop modules. Spend triangles on player, Threshold Guard, door, stairs, landmarks, and nearby silhouettes. Report calls, triangles, geometries, textures, materials, post passes, shadow settings, DPR, and the current bottleneck after the graphics pass.

## Evidence States

Capture active play at desktop and mobile target viewports with renderer diagnostics attached:

- `floor-one-entry`: full chamber composition, player, route, and all three landmarks readable.
- `threshold-guard-intent`: Threshold Guard silhouette, telegraph, target cell, and aligned `G` reveal visible.
- `door-locked` and `door-open`: geometry, glyph, prompt, and blocking state agree.
- `pickup-resolved`: pickup world state, `*` reveal, event VFX, and message-log result agree.
- `exit-ready`: stairs and `>` clearly identify the route to the next floor.
- `semantic-reveal`: a wider code reveal proves glyphs and wireframes match current occupancy.
- `reduced-motion-active`: the same encounter uses static cuts and overlays with no jitter.
- `mobile-active`: portrait-safe framing with readable player, objective, and log, plus unobstructed reserved space for possible future controls.

Motion evidence must show a complete move, Threshold Guard telegraph and resolution, door transition, pickup resolution, and exit activation. Real input must reach each state. Still captures do not prove timing or contact quality.

## Quality Gate

Score the complete active-play evidence against the ten-category visual scorecard: art direction, hero/player, obstacles/enemies, rewards/interactables, world/environment, materials/textures, lighting/render, VFX/motion, UI/HUD, and performance evidence. Floor One targets premium vertical-slice quality: no category below 2, average at least 2.3, no automatic failure, and actual authored geometry visible across every major surface.

# Floor One playable design brief

Source: [NetHack scene](<../../project-management/official%20game%20docs%20(read-only)/chapter-zero-stages/stage_2/nethack-scene.md>), the approved [sparse Stage 1 image](stage-1-atari-3d-starting-point.png), and the owner's live map-size review.

## Design brief

- **Promise:** A lone hero explores Light's early-code dungeon, following straight passages to one of three symbolic exits.
- **Feeling:** Sparse Atari-in-3D discovery, with a clear hero and walkable route over an old-code substrate.
- **Verbs:** Move, read the room, choose one object, then cross its corresponding threshold. Dash shortens travel.
- **Repeat:** Every 5–30 seconds the camera reveals another room, opening, line of code debris, or landmark.
- **Risk and reward:** Walls cause detours; the Monster choice pauses for an automatic fight. The selected route records a hidden alignment and unlocks only its physical exit. No authored failure state exists in this slice.
- **Better play:** Recognize the straight passage language, locate all three objects, and deliberately select a route rather than following the first visible light.
- **Non-goals:** Inventing overt Dreamweaver subtext, a full combat system, or a final procedural generator for later floors.

## Core loop contract

The player **explores connected rooms** to reach Door, Monster, or Chest while **shifted walls and passages** change the route; selecting one **unlocks its own exit and records hidden alignment**. The Monster triggers the existing brief auto-fight. R restarts with a new deterministic layout seed.

## Level plan

- **Spatial format:** Five by five connected rooms, each about 12 world units across, within visible perimeter walls. The playable wall footprint is about 60 × 60 units; the floor extends beyond it to avoid the starter demo's hard plane edge. The previous demo clamp was 22 × 14 units.
- **Camera:** Elevated 2.5D follow view sees the current room and adjacent openings; the three exit landmarks become visible as the player approaches the far end.
- **Start and decisions:** Hero enters the south-center room. Door stays center north; Monster and Chest stay left and right north. Their relative zones do not change.
- **Generation:** Light moves straight wall openings and small block arrangements by a seeded 1–2 tile shift. Every neighboring room retains a walkable connection. Thin door-fragment pieces rotate onto the floor as debris, distinct from collision walls.
- **Collision:** Visible wall footprints and still-locked gates block motion. No invisible rectangular player clamp. One chosen gate opens after its interaction resolves.
- **Review gate:** Compare the live camera and navigation with the approved image, then ask the owner to judge the route, density, and three exits.

## Current playable implementation

- Light's floor stays sparse and straight. The floor is uninterrupted navy; raised code walls have stacked horizontal marks, amber-slit pillars, and small rotated fragments from the authored Blender door. The [six-frame era sheet](era-progression-reference-draft.png) remains the comparison for Floors 1–3 and later stages.
- Door, Monster, and Chest sit in different north zones and each owns a distinct physical gate. A chosen gate loses its blocker and opaque aperture, brightens, and receives a short code trail. Distant slim locator marks belong to the world geometry. The Door keeps the Blender fragment landmark.
- One arrival line and the three choice scripts are editable OML files under `game/omega-spiral/src/content/`. The game uses the existing Dialogue Studio OML parser, `.omd` persona profiles, `WritingPlayback`, and Three.js `GhostLetters`. The lines adapt the official NetHack scene while keeping the Dreamweavers' private dispute off screen.
- The live gate check is pending the owner's walk-through: reach any object, choose it, observe writing and the matching open exit, then cross its threshold. A successful build and visible entry room alone do not establish that interaction.

## Floors 2–3 visual continuation

- **Shadow:** Reuse the door, wall, pillar, and fragment kit. Rotate wall runs into erratic diagonals and offset openings so the player must read changing sightlines. Add only a little more raster/tile detail than Light; keep the hero and traversable path dominant.
- **Ambition:** Assemble the same straight modules into stepped arcs around a central decision, using a warmer accent and richer NES-ward tile treatment. Curves must alter the route to Door, Monster, and Chest, not merely decorate it.
- Each floor keeps three symbolic choices and physical exits. The shared era sheet is a visual reference; Floors 2–3 are not yet implemented by the current Floor One slice.

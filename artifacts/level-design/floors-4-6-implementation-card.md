# Floors 4–6 implementation card

**Status:** authored typed content modules for integration; not a playable capture.

## Player experience

Move through three readable traversal spaces that carry the visual language from an 8-bit Nintendo style vault, through a richer 16-bit archive, into early polygonal 3D. Each floor has one clear forward route, one required but recoverable combat encounter, optional discovery spurs, three quiet future-offer markers, and one obvious exit. The three offers hint at later party choices without resolving them here or exposing the buried premise. Floor 7 remains the town; Floor 8 remains the finale.

## Integration contract

- Import `createMiddleFloor4`, `createMiddleFloor5`, and `createMiddleFloor6` from their `middle-floor-*.ts` modules. Each accepts an integer seed and returns a `MiddleFloorLayout` from `middle-types.ts`.
- Coordinates use the existing chapter-two X/Z convention. The route polyline is a centerline; `width` is the intended readable corridor width. Exit and spawn positions are explicit.
- Collision uses rect and circle data variants. Convert rectangles to the current axis-aligned block representation where possible. These layouts currently declare rectangular blockers only; offer landmarks and route centerlines are not blockers.
- Each layout has one required encounter with inspectable enemy spawn, role, health, attack range, windup, cooldown, damage, telegraph, arena, checkpoint, and recovery zones. `Hit` damages the nearest in-range enemy; `Run` repositions beyond threat range. The runtime action adapter owns actual controls, hit resolution, and health. No global player-health value is specified here.
- Both encounter outcomes (`won` and `fallen`) unlock the exit and persist as an echo/choice state. A fall returns to the encounter checkpoint, retains floor discovery/progression, and cannot hard-lock the journey. Exit unlock occurs after encounter resolution; these floors do not add a bypass route.
- `effects` has exactly two cues per floor. Each cue pairs one low-strength, time-bounded visual treatment with a gameplay read response and a local Web Audio synthesis recipe. The runtime must schedule audio after its normal user-gesture unlock and enforce a cooldown per cue.
- Seed variation affects only presentation surface and accent. It never changes collision, route, exit, landmarks, or trigger behavior. The hash is stable across runs and does not call ambient randomness.

## Effect intent

| Floor | Cue                     | Purpose                                                                                                                     |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 4     | Sentinel charge tell    | Teach one slow, single-enemy charge. Keep its attack lane clear and telegraph the full windup so the player can Hit or Run. |
| 4     | Sentinel outcome mark   | Store the win/fallen result, keep it legible as an echo state, and unlock the exit either way.                              |
| 5     | Slinger aim bands       | Add a ranged aimed-tile tell alongside the known charge lane; the full windup gives time to move.                           |
| 5     | Crossfire outcome mark  | Store the win/fallen result, retain discovery, and unlock the exit either way.                                              |
| 6     | Charger lane            | Recombine familiar tells in a larger arena with recovery zones and room to reposition.                                      |
| 6     | Depth outcome threshold | Store the win/fallen result and open the Floor 7 handoff either way.                                                        |

## Era and readability rules

- Keep the same elevated 2.5D camera and the player, route, and next decision visible.
- Make historical display treatment part of the forms and shared geometry. Floor 4 uses strong tile silhouettes and a limited palette; Floor 5 adds layered bands and parallax; Floor 6 adds faceted depth and restrained distance treatment.
- Blockers sit outside route centerlines with room for the configured route width. Effects do not move blockers or cover the hero, exit, or next decision.
- Use future-offer silhouettes as quiet environment landmarks. Dialogue Studio owns all character prose; this data has no dialogue or narrative reveal text.
- Combat is real-time and continuous with movement. Avoid pause menus or unavoidable overlapping telegraphs. Floor 4 introduces the charge read; Floor 5 adds a ranged pattern; Floor 6 recombines those known patterns with recovery space.
- All sound recipes are procedural oscillator cues. No external generation, API, downloaded assets, or authored voice files are required.

## Known integration choices

- `WalkField` currently consumes room objects and axis-aligned `RoomBlock`s, not floor-layout modules. The lead owns a small adapter/scene integration and should preserve the existing movement state owner.
- The existing game has no shared floor-layout schema or real-time action/encounter adapter in the files reviewed. The lead owns continuous Hit/Run resolution, health integration, encounter outcome persistence, route/landmark triggers, and routing `effects` through its effect/audio owner.
- This card describes data and intended responses only. It does not claim that the modules are wired into the scene or visually verified.

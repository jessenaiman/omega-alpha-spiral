# Floors Two and Three implementation card

Status: layout and cue data authored for lead integration. No runtime behavior or playable evidence is claimed.

## Sources and fixed direction

- Floor Two follows the owner-approved Shadow card: preserve the sparse inherited Atari-like kit, arrange three unequal but reachable exits, and use deterministic small shifts while keeping the exit identities fixed.
- Floor Three follows the approved floor manifest: one hero, stepped curves assembled from code blocks, and a richer tile treatment that begins the NES-era progression.
- Both floors preserve the official Door, Monster, and Chest alignment data owned by `rooms.ts`. Exit geometry references object kind; it does not duplicate alignment or authored dialogue.
- One elevated readable view, stable traversal lanes, no full-screen pixel filter, and effect cues attached to route or choice events.

## Data contract

`src/chapter-two/floors/early-layout.ts` exports the shared `EarlyFloorLayout`, `EarlyFloorExit`, `EarlyFloorCollisionBlock`, `EarlyFloorEffectCue`, point, floor ID, and deterministic seed mapping. Each floor module exports a frozen-seed default layout and a factory accepting a numeric seed. The factory varies collision-block placement only; the hero start, route exits, and choice identities stay stable.

Shadow's exits are Chest northwest, Door north, and Monster northeast. Diagonal bars, a short telegraphed seam, and guardian cover create distinct approach reads. Its cues are `shadow-syntax-ash` at code joins and `shadow-route-splice` at the seam.

Ambition's exits preserve the same three choice identities. Three stepped code-block curves bend the approach and leave lanes to each exit. Its cues are `ambition-step-trace` on entry and `ambition-exit-commit` when an exit is crossed.

## Integration notes

- Match each `EarlyFloorExit.kind` with the corresponding room object and place both at `position`; the layout deliberately does not own hidden alignment, text, scoring, or progression.
- Render each collision block with its authored center, dimensions, and XZ rotation; collision should use the same rotated footprint. Axis-aligned collision would diverge from Shadow's visible diagonal bars.
- Use the route point arrays as navigation/visibility guides. They do not imply a forced path or auto-movement.
- The cues are typed design data; the dialogue schema and runtime do not yet consume them. Lead owns the shared scene-effect integration.
- Do not change active-game state when the seam warns. Its data describes a short route signal; any future moving collider must preserve the visible bypass and be reviewed in play.

## Review still required

No tests or logs were run or inspected. The lead should integrate the data, then review all three physical exit paths and the rotated collision in the live unified runtime before claiming traversal is verified. The owner should compare the result with the approved geometry references.

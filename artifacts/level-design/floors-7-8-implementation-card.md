# Floors 7–8 implementation card

Status: **Verified:**✅ issue #61 and the owner direction establish Floor 7 as the classic town and Floor 8 as the modern healing-core finale. These files are declarative content; scene integration and runtime rendering remain with the lead.

## Floor 7 — displaced classic town

- **Verified:**✅ Stage 3 supplies comfortable unease, repeated visitors, era flicker, and hints of simultaneous parties. Stage 5 supplies the broken-town pressure, three escape ideas (Boulevard, Alleys, Core), garbage collector, and convergence motifs. Those drafts inform visual clues and route shape; they do not authorize dialogue here.
- **Verified:**✅ Owner direction puts the classic town second-last, groups the party there, asks the player to find all three Dreamweavers, then choose an escape idea.
- **Inferred:**🔍 A compact plaza connects three Dreamweaver gathering points and three exits. Distinct route widths and bends make the ideas legible from the junction.
- **Verified:**✅ Asset display aspect and pixel density are per landmark so incompatible eras can share a stable camera and gameplay canvas.
- **Verified:**✅ Building forms now mix camera-facing sprite facades, curved plaster, timber gables, woven market tent, organic root house, and a faceted low-poly archive. Each profile carries its own aspect and pixel density; its X/Y mismatch is warped into its local texture so world geometry remains inside its authored footprint.
- **Verified:**✅ Two NPC encounter markers have different loop/duplication behaviors. Two collector types use different movement roles and visible floor tells. None requires authored dialogue.
- **Verified:**✅ Boulevard stays wide and direct, alleys turn through a narrow route, and Core bends toward the low-poly archive before its exit. The plaza retains the three party gathering points and open central decision space.
- **Verified:**✅ Four effect cues cover asset drift, recycled memory, terminal-like local restart, and collector sweep. The local restart is visual only and does not reset traversal progress.
- **Missing Requirements:**❌ Runtime asset appearance, collector behavior/collision, party recruitment implementation, and visible route selection need scene integration and review.

## Floor 8 — modern healing-core walk

- **Verified:**✅ Owner direction calls for a simpler movement floor with modern-era effects. The level uses one broad route to the core and boundary, with earlier Light/Shadow/Ambition forms visible within a modern space.
- **Verified:**✅ Architecture is a prismatic vault, open halo, suspended alloy ribbon, and soft-emissive lightwell ring, with legacy motifs embedded selectively.
- **Inferred:**🔍 Four cues progress from era convergence at the threshold through a quiet memory echo to a healing pulse and a lighted way forward.
- **Missing Requirements:**❌ The healing outcome, chapter boundary behavior, and any final player choice are not established by these layout files.

## Integration contract

- `late-floor-7-town.ts` exports `FLOOR_7_TOWN` and typed layouts, landmarks, routes, exits, collision rectangles, and effects.
- `late-floor-8-finale.ts` exports `FLOOR_8_FINALE` and typed route, landmarks, exit, collision rectangles, and effects.
- `LateFloorState.ts` exports a side-effect-free state module with an imperative class API: `start(7 | 8)`, `update(delta, { x, z })`, `interact(targetId?)`, `player`, `floor`, `status`, and `consumeTransitionSignal()`. Interactions use `dw-light|dw-shadow|dw-ambition`, `exit-boulevard|exit-alleys|exit-core`, and `healing-core` IDs. Status exposes the current phase; read-only getters expose party size, gathered guides, selected route, collector phases/pressure, and local memory recycle count.
- `LateFloorArtKit.ts` exports `createFloor7TownArt(data)` and `createFloor8FinaleArt(data)`. Each returns `{ group: THREE.Group, dispose(): void }` and accepts the corresponding layout type.
- Floor 7 factories build the sprite facade, curved plaster, timber gable, tent, root-grown form, faceted PS1 form, hanging sign, local NPCs, and distinct collector silhouettes. Canvas textures use each structure's aspect and pixel density locally; they do not resize the renderer or gameplay canvas.
- Floor 8 factories build the prismatic vault, open halo, alloy ribbon, lightwell ring, core crystal, and selective legacy detail in a modern material palette.
- Both use x/z coordinates consistent with `WalkField`; collision stays explicit and separate from display geometry.
- The flat inn facade has a 0.16 world-unit depth proxy. Volumetric Floor 7 props stay within their matching collision footprints. The PS1 archive sits at the outer east edge, clear of the Core route. Floor 8 vault collision rectangles now match the prismatic shell and halo extents; both sit outside the central walk lane. Per-object width and height distortion is applied only inside each local surface texture, leaving collision footprints fixed.
- No dialogue, audio files, external service calls, gameplay runtime hooks, or shared-interface edits are included.
- Audio generator skill was reviewed. These declarative plans do not add audio; event-to-audio mapping belongs to the integration owner.
- The art kit creates decorative meshes only. Adapters must continue to consume collision from the layout data; this factory does not animate the periodic cues, implement encounter behavior, or render/resize the main canvas. Factory execution and visual output have not been verified in the browser.
- The state module clamps movement to each floor's bounds and resolves circle-versus-rectangle static collision with axis-separated movement. Collector telegraphs raise pressure and can increment local memory recycling; party, route, and floor progress persist. Crossing the selected exit returns transition signal `8`; approaching the Floor 8 core returns `complete`. The module does not own input listeners, collision meshes, rendering, damage, or dialogue.

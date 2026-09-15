# Art Direction — Omega Spiral Alpha 0.1 and 0.2

## Authority

This document implements `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`. It specifies visual, camera, lighting, material, post-processing, logo, reduced-motion, scorecard, and renderer-budget rules for Alpha 0.1 (complete gameplay) and Alpha 0.2 (Blender showcase production). Changes require explicit approval and matching updates to the design spec.

---

## 1. Display Evolution and Aspect Ladder

The game plays in landscape orientation throughout. The signal aperture widens as the player progresses, reflecting increasing world fidelity.

| Phase | Aspect | Approximate Resolution | Pixel Style |
|-------|--------|----------------------|-------------|
| Ghost Terminal | 4:3 | 480x360 | Low-density monochrome glyphs on dark field |
| Town Map | 4:3 | 640x480 | Denser limited-color glyph map |
| Town Space | 16:10 | 960x600 | Vector-contour / faceted 2.5D |
| Town Community | 16:9 | 1280x720 | Pixel portraits with dimensional volume |
| Town Fracture | 16:9 | 1280x720 | Event-driven generation overlap |
| Bridge Glimpse | 16:9 | 1920x1080 | Momentary coherent PBR-quality render |
| Collapse Restart | 4:3 | 480x360 | Returns to Ghost Terminal monochrome |

Normal play stays landscape. No phase rotates the canvas. Reduced motion replaces rotation, shake, roll, FOV punch, and rotated glitches with static or linear-pull alternatives.

---

## 2. Color Ladder

Each phase adds color depth. The progression is cumulative: later phases retain access to earlier palettes.

| Phase | Color Mode | Palette Rule |
|-------|-----------|-------------|
| Ghost Terminal | 1-bit monochrome | Single warm-white (#E8DCC8) on near-black (#0A0A0F). Glyphs only. |
| Town Map | Limited indexed | Warm-white base plus three accent slots reserved for Dreamweaver presence indicators. Maximum 8 simultaneous on-screen hues. |
| Town Space | Expanded indexed | Up to 32 on-screen hues. Desaturated environmental palette; Dreamweaver accents remain saturated for readability. |
| Town Community | Full indexed with dithering | Up to 64 on-screen hues. Pixel dithering for gradients. Portraits use 16-color sprites. |
| Town Fracture | Overlapping palettes | Two or three era palettes simultaneously visible during fracture events. |
| Bridge Glimpse | Full RGB | Unrestricted color for the momentary 1080p coherent render. |

### Dreamweaver Canonical Colors

| Dreamweaver | Display Color | Hex (sRGB) | Non-Color Grammar |
|------------|--------------|------------|-------------------|
| Luminary | Silver-white cold light | #C8D8E8 | Continuous arc -- unbroken curved strokes, steady luminance |
| Shadow | Gold-amber | #D4A843 | Broken or doubled trace -- split lines, offset echoes, flicker cadence |
| Ambition | Red | #D43D3D | Angular filament -- sharp edges, wedge shapes, aggressive taper |

Monochrome eras distinguish Dreamweavers through geometry, stroke rhythm, and motion alone, without color. When color is available, the three accent hues above are the only Dreamweaver-associated colors permitted on screen.

---

## 3. Authored Surfaces — Alpha 0.1

Alpha 0.1 delivers complete gameplay with procedural and code-drawn assets. The following surfaces are authored (custom geometry, shaders, or canvas-drawn, not generic primitives):

### Player

- Custom procedural player silhouette with four discrete visual states: idle, Dash, Act, and fail/rewind.
- Player silhouette is readable against all era backgrounds at minimum 32px height.
- No imported 3D model; all geometry is code-generated.

### Echoes (4)

- Fighter: broad-shouldered silhouette, shield-like mass, upright stance.
- Scribe: tall thin silhouette, extended arm holding visible tablet/scroll form.
- Thief: narrow angular silhouette, low stance, offset weight.
- Weaver: symmetric flowing silhouette, visible thread/line motif.
- Each Echo has a unique silhouette distinguishable at 48px height without color.

### Dreamweavers (3)

- Luminary: three-dimensional arc or halo form, continuous smooth geometry.
- Shadow: fragmented or doubled form, visible offset between primary and echo shape.
- Ambition: angular wedge or blade form, sharp taper to point.
- Each is distinguishable by silhouette alone in monochrome.

### World Kit

- Archive: distinctive tower or archive-shape with visible stacked forms.
- Civic refuge: rounded shelter silhouette with internal warm glow zone.
- Gate and bridge: arch or span form, clearly passable.
- Resident (NPC): small humanoid silhouette, distinct from Echoes.
- Hazard (sweep): visible telegraph line or arc before contact.
- Interactable nodes: labeled glyph icons that pulse when in-range.

### Instanced Modular Detail

- Background buildings and town volume use instanced procedural geometry.
- Repeated forms are seeded and variation comes from scale jitter, rotation, and material tint.
- Background detail does not compete with gameplay-readable surfaces for silhouette attention.

### Icons, Portraits, and Logo

- Canvas or SVG icons for UI verbs (Move, Dash, Act), party glyphs, and status indicators.
- Four Echo portraits drawn in the pixel era style during Phase 4.
- New original three-strand logo family with a distinct variation per era (see Section 9).

---

## 4. Blender Replacements — Alpha 0.2

Alpha 0.2 replaces specific procedural surfaces with Blender-authored GLB models. Repeated town volume remains procedural and instanced.

| Surface | Alpha 0.1 | Alpha 0.2 Replacement |
|---------|-----------|----------------------|
| Player | Procedural silhouette | Blender character with rig, idle/Dash/Act/fail animation |
| Fighter | Procedural silhouette | Blender character with weapon and shield props |
| Scribe | Procedural silhouette | Blender character with tablet accessory |
| Thief | Procedural silhouette | Blender character with cloak and blade |
| Weaver | Procedural silhouette | Blender character with thread spool motif |
| Luminary | Code-drawn arc form | Blender emissive arc with material animation |
| Shadow | Code-drawn fragmented form | Blender fractured double-form with offset animation |
| Ambition | Code-drawn wedge | Blender angular blade with filament glow |
| Archive building | Procedural tower kit | Blender hero building with interior detail |
| Civic refuge | Procedural shelter | Blender hero shelter with warm interior lighting |
| Gate and bridge | Procedural arch | Blender hero gate/bridge with material wear |
| Landmark props | Procedural shapes | Blender hero props per landmark |

Every GLB export requires: named export collection, JSON manifest entry, clean-scene reimport verification, glTF Transform inspection, runtime camera acceptance test, collision proxy, and recorded polygon/texture counts.

---

## 5. Landmark, Hero, Hazard, and Readability Rules

### Landmark Readability

- Each landmark is visible from at least two adjacent grid tiles at the phase camera distance.
- Landmarks use silhouette height at least 1.5x the player height.
- Landmarks have a unique outline that does not match any other landmark or hazard.

### Hero Readability

- Player silhouette is never the same hue as the current era background.
- Player occupies at least 32 screen pixels in height in every required capture and stays readable during active play.
- Dash and Act animations produce visible silhouette changes within 2 frames (33ms at 60fps).

### Hazard Telegraph

- Every hazard displays a visible warning zone or trace before contact; Archive Crossing uses the contract's exact 700ms tell and 550ms active sweep.
- Telegraph uses a distinct visual treatment not shared with interactables (e.g., dashed arc vs. solid pulse).
- Contact produces a brief screen-space color flash (red-shift 0.1s) that is replaced by a static border flash in reduced motion.

### Interaction Readability

- Contextual Act target label appears within 40px of the interactable.
- Label uses the current phase font at readable size (minimum 14px at 720p).
- In-range state pulses at 2Hz; out-of-range state is dim and static.

---

## 6. Camera Values

All camera values are locked per phase. The camera is authored and phase-aware; there is no manual orbit during gameplay.

| Phase | Camera Type | FOV / View | Pitch | Follow | Rotation |
|-------|------------|-----------|-------|--------|----------|
| Ghost Terminal | Fixed front plane | Orthographic, 4:3 frame | 0 deg (flat) | None (static) | None |
| Town Map | Fixed orthographic | North-up, 4:3 frame | 90 deg (top-down) | None (static pan on move) | None |
| Town Space | Orthographic three-quarter | North-up, 16:10 frame, 55 deg pitch | 55 deg | Critically damped follow, 0.18s response | None (no rotation) |
| Town Community | Perspective | 38 deg horizontal, 16:9 frame, 50 deg pitch | 50 deg | Critically damped follow, 0.18s response | None |
| Town Fracture | Perspective | 45 deg horizontal, 16:9 frame | Variable (event rails) | Event-driven rails | Stable north axis, no gameplay roll |
| Threshold | Perspective | 35 deg horizontal, 16:9 frame | Variable | Bridge rail and three-presence frame | None |

### Camera Transitions

- Phase-to-phase transitions use a 1.5-second lerp on position, target, and FOV.
- Reduced motion replaces lerp with an immediate cut or a 0.5-second linear pull.
- Bridge glimpse uses an authored camera path (spline or keyframed) that resolves to the 1080p frame in 2 seconds.

---

## 7. Lighting, Material, and Post-Processing Boundaries

### Lighting

- Ghost Terminal: no scene lighting; glyph emission only.
- Town Map: single ambient constant matching era palette.
- Town Space: directional key from north-east, ambient fill, no dynamic shadows.
- Town Community: directional key plus point lights at landmark interiors, no shadow maps.
- Town Fracture: event-driven light bursts tied to fracture events, capped at 4 simultaneous point lights.
- Bridge Glimpse: full three-point lighting (key, fill, rim) with soft shadow map for the single coherent frame.

### Materials

- Alpha 0.1 uses MeshBasicMaterial and MeshStandardMaterial only.
- Emissive materials use toneMapped: false for Dreamweaver accents to preserve hue under ACES.
- No custom shader passes in Alpha 0.1 except the era post-processing filter.
- Alpha 0.2 adds PBR textures, normal maps, and roughness variation on Blender assets.

### Post-Processing

- Alpha 0.1: one era-appropriate full-screen filter pass (monochrome tint, limited-color quantize, or pixel dither) plus optional subtle bloom on Dreamweaver accents.
- Alpha 0.2: adds production bloom, optional ambient occlusion, and the Bridge Glimpse cinematic pass.
- Maximum 2 added post passes in Alpha 0.2 (per renderer budget).
- No motion blur, no depth of field, no screen-space reflections in Alpha 0.1.

---

## 8. Reduced-Motion Replacements

When prefers-reduced-motion: reduce is active or the user enables Reduced Motion in settings:

| Normal Effect | Reduced-Motion Replacement |
|--------------|--------------------------|
| Camera rotation / auto-orbit | Static camera, no rotation |
| Screen shake on hazard contact | Static border flash (white, 0.3s) |
| Rolling glitch text | Static text with no animation |
| FOV punch on event | No FOV change; event indicated by color shift only |
| Particle drift on ash / era elements | Static particle positions, no motion |
| Bloom pulse on Dreamweaver presence | Constant bloom at reduced fixed value |
| Era transition wipe | Instant era swap, no transition animation |
| Bridge camera spline | Linear pull to final position, no easing |
| Echo rewind visual rewind | Instant position reset with static REWIND label for 0.5s |

Reduced motion never removes gameplay-critical information. Telegraphs, labels, and interaction states remain fully visible.

---

## 9. Original Logo Family and Variations

The canonical reference is `assets/references/omega-spiral-logo-reference.png`, SHA-256 `cd25e0c1cc510ebfebc1ed0f2249ac5b0371f157ed2cedaad4fadf1e6907c660`. It is an important creative reference, not a runtime bitmap. Produce a new Omega logo family and variations in which three interlocking strands represent Luminary (silver-white), Shadow (gold-amber), and Ambition (red).

- Do not crop, trace, or ship the reference bitmap.
- Explore multiple original compositions before choosing the family construction.
- Each era gets its own related variation at that era's color depth and resolution:
  - Ghost Terminal: 1-bit monochrome line construction.
  - Town Map: limited-color indexed construction.
  - Town Space: expanded-color contour construction.
  - Town Community: pixel-art variation with full dithering.
  - Bridge Glimpse: full RGB PBR-quality rendered variation.
- A compact related mark appears in the threshold HUD; the complete logo resolves full-screen during the bridge moment.
- Three strands remain visible and distinguishable regardless of era color depth, but their trajectories do not need to duplicate the reference.

---

## 10. Scorecard Floors

### Alpha 0.1 Floors

Alpha 0.1 claims gameplay completion, not premium art. The following floors apply:

| Category | Minimum Score | Notes |
|----------|--------------|-------|
| Art direction | 2 | Theme drives forms, materials, UI, world, feedback |
| Hero/player | 2 | Authored silhouette with state cues |
| Obstacles/enemies | 2 | Gameplay roles distinguishable (hazards vs. interactables) |
| Rewards/interactables | 2 | Important interactions have immediate world, VFX, UI, and audio feedback |
| World/environment | 1 | Themed, not sparse |
| Materials/textures | 1 | Shared material roles across era |
| Lighting/render | 1 | Intentional era-appropriate treatment |
| VFX/motion | 2 | Event-driven VFX: rewind, dash, act, threat, era advance |
| UI/HUD | 2 | Genre-specific states, readable text, responsive layout |
| Performance evidence | 2 | Renderer counts, build/browser QA, target-viewport shots |

- No category scores 0.
- Art direction, interactables, hazards, VFX, UI, and performance score at least 2.
- Overall visual score averages at least 1.8.
- No automatic scorecard failure is accepted.
- Alpha 0.1 claims gameplay completion, not premium art.

### Alpha 0.2 Floors (Showcase)

- Every scorecard category at least 2.
- At least six categories at 3.
- Average at least 2.7.
- Before and after performance evidence required.

---

## 11. Renderer Budgets

### Alpha 0.1

| Metric | Budget | Measurement Method |
|--------|--------|--------------------|
| Draw calls | 300 or fewer | renderer.info.render.calls |
| Triangles | 500k or fewer | renderer.info.render.triangles |
| Textures | 30 or fewer | renderer.info.memory.textures |
| Added post passes | 1 or fewer | EffectComposer pass count beyond the base render |
| DPR cap | 2.0 | Math.min(devicePixelRatio, 2.0) |
| Target FPS | 60 sustained | Frame time 16.67ms or less median over 10s active play |

### Alpha 0.2

| Metric | Budget | Measurement Method |
|--------|--------|--------------------|
| Draw calls | 300 or fewer | renderer.info.render.calls |
| Triangles | 750k or fewer | renderer.info.render.triangles |
| Textures | 60 or fewer | Texture memory audit |
| Post passes | 2 or fewer | EffectComposer pass count |
| DPR cap | 2.0 | Math.min(devicePixelRatio, 2.0) |
| Target FPS | 60 sustained or documented tradeoff | Frame time measurement with bottleneck notes |

### Measurement Protocol

- Capture renderer.info at the midpoint of the Archive Crossing representative encounter.
- Capture renderer.info during bridge glimpse (peak load frame).
- Log both sets in artifacts/game-progress.md and the final evidence manifest.
- If any metric exceeds budget, document the tradeoff and the specific visual that requires it.

---

## 12. Evidence Capture Requirements

### Desktop Stills (1920x1080 unless noted)

| Label | Phase | State |
|-------|-------|-------|
| ghost-terminal | Ghost Terminal | All three choice-points complete, name entered |
| exploration-active | Town Map | Player at second landmark, Move active |
| archive-crossing | Town Space | Mid-encounter, Act label visible, hazard telegraphed |
| formation-party | Town Community | Three Echoes recruited, party visible |
| fracture-memory | Town Fracture | Memory route committed, parallel party visible |
| fracture-bodies | Town Fracture | Bodies route committed, parallel party visible |
| threshold-luminary | Threshold | Player approaching Luminary, question visible |
| threshold-shadow | Threshold | Player approaching Shadow, question visible |
| threshold-ambition | Threshold | Player approaching Ambition, question visible |
| bridge-logo | Bridge Glimpse | Logo resolved, 1080p coherent frame |
| loop-restart | Ghost Terminal | Instance N+1 loaded (1280x720) |
| pause-settings | Settings | 200% zoom active (1280x720) |
| reduced-motion-fracture | Town Fracture | Reduced motion active, static camera (1280x720) |

### Motion Captures

| Label | Content |
|-------|---------|
| archive-crossing-motion.webm | Full Archive Crossing encounter: approach, telegraph, anchor, disrupt, dash, guard, success |
| finale-motion.webm | Threshold through bridge: approach Dreamweaver, carry question, cross bridge, logo resolve, glimpse, collapse |

### Bot Verification

- One complete loop via bot input proving all phases reachable.
- Both town routes (memory and bodies) proven across two runs.
- All three Dreamweaver pairings proven across three runs.
- Deliberate failure, rewind, retry, and restart proven in one run.
- Screenshots never substitute for input proof.

# Omega Spiral Alpha 0.1–0.2 Design

**Status:** Approved design; implementation blocked until companion design artifacts and implementation plans exist  
**Approval session:** `session-d89006c4-6ae1-4ce4-8716-8a834418181c`  
**Decision backup:** `C:\obsidian\omega-spiral\OMEGA-SPIRAL-PLAN.md`  
**Target repository:** `C:\SpiralDrive\omega-alpha-spiral`  
**Remote:** `https://github.com/jessenaiman/omega-alpha-spiral.git`

## 1. Product Thesis

Omega Spiral is a 15–20 minute Three.js prologue about a real player teaching a broken game how worlds become meaningful. Choices begin as terminal responses and mature into movement, risk, companionship, and unprompted physical commitment. One town becomes progressively real as Omega learns new visual, interface, and audio capabilities.

The player remains the player. The avatar receives no fictional backstory or internal monologue. Luminary, Shadow, and Ambition are three competing narrators; none solely controls reality.

Target emotional sequence: curiosity, authorship, competence, attachment, moral uncertainty, awe, then entrapment.

## 2. Release Contract

### Alpha 0.1: gameplay complete

Deliver one complete browser game from Ghost Terminal through loop collapse. Every phase, route, party choice, Dreamweaver pairing, retry path, accessibility control, and release gate must work. Procedural authored art and synthesized/local audio may retain documented rough edges. Alpha 0.1 makes no premium-art claim.

### Alpha 0.2: production complete

Replace signature procedural surfaces with validated Blender assets. Add production animation, materials, lighting, VFX, audio, selected voices, visual regression, measured optimization, and approved cross-loop residue. Reach the showcase scorecard target without rewriting the Alpha 0.1 gameplay loop.

## 3. Player-facing Arc

| Phase | Time | Representation | Required progression |
|---|---:|---|---|
| Ghost Terminal | 2–3 min | Low-density monochrome landscape 4:3 | Player names themself, makes three choices, then names Omega |
| Town Map | 2–3 min | Denser limited-color glyph map | Restore Archive, civic refuge, and gate/bridge landmarks |
| Town Space | ~3 min | Widening vector/faceted 2.5D | Clear three action encounters; learn Dash through visible timing |
| Town Community | 3–4 min | Pixel portraits becoming dimensional 16:9 | Recruit three Echoes and complete one party test |
| Town Fracture | 4–5 min | Stable play view with event-driven era overlap | Complete three memory or bodies objectives while parallel party completes other route |
| Threshold | ~2 min | Three presences, bridge, title, momentary 1080p | Carry one impossible question, pair, cross, see logo/world, collapse, restart at `N+1` |

The same town topology, silhouettes, landmarks, and symbol grammar persist across every phase.

## 4. Gameplay Contract

### Controls

- Move: WASD, arrow keys, or left stick.
- Dash: Space or south gamepad button.
- Contextual Act: E, Enter, or west gamepad button.
- Pause: Escape or gamepad menu button.
- Mouse supports menus and settings.
- Camera rotation and full touch gameplay are outside scope.

### Shared micro-loop

1. Observe a signal.
2. Move or choose.
3. Commit with Act or Dash.
4. Receive immediate synchronized feedback.
5. Change the world or party.
6. Repeat with one harder combination.

### Pressure, reward, cost, retry

- Reading is never timed.
- Pressure comes from telegraphed signal sweeps, instability shards, spatial loss, and simultaneous town needs.
- Rewards are increased fidelity, motif layers, restored landmarks, new capabilities, relationships, route consequences, and final world glimpse.
- Costs close alternate terminal replies, one Echo slot, one town route, and two Dreamweaver pairings.
- Encounter failure restores an explicit snapshot through a 1.25-second Echo rewind.
- Rewind restores player, hazards, targets, camera, and failed encounter affinity while preserving prior phases.
- Failed-path trace ends on success and never persists across phase or run.
- Retry Encounter always works.
- Stuck detection returns the player to the last safe tile.
- The next affordance pulses after 30 seconds without progress.
- Wide Timing assist is available from settings.

## 5. Representative Encounter: Archive Crossing

Archive Crossing is the Alpha 0.1 vertical slice and first integrated quality target.

- Fixed three-quarter camera frames the Archive, a stranded resident, two anchor nodes, and the sweep origin.
- Shape, motion, floor trace, and sound telegraph each sweep before contact.
- Player stabilizes both nodes during safe windows.
- Player may disrupt one instability shard during recovery.
- Player Dashes through the final gap.
- Player holds Act to guard the resident through the last sweep.
- Context label changes between `STABILIZE`, `DISRUPT`, and `GUARD` before commitment.
- Success restores color and volume, adds one motif layer, frees the resident, and opens formation.
- Contact or resident loss performs Echo rewind.

This encounter must prove Move, Dash, Act, pressure, reward, cost, failure, retry, UI, audio, VFX, camera, accessibility, and era transition before content expands.

## 6. Echo Party

Player recruits three of four mirrored candidates:

- Fighter: guard and break.
- Scribe: preserve and reveal.
- Thief: bypass and reposition.
- Weaver: stabilize and redirect.

Each companion modifies Contextual Act instead of adding controls. Any three-person selection can complete either town route. The unchosen Echo joins a parallel party and remains visible later.

## 7. Town Commitment

Player physically commits toward one need:

- Memory route preserves names, testimony, symbols, and identity through the Archive.
- Bodies route protects residents and opens escape through the civic refuge.

Neither is morally correct. A parallel party performs the unchosen route across visible fractures. Both parties converge before the threshold.

## 8. Dreamweaver Threshold

Three manifestations occupy separate locations. Player may inspect all three, approaches one, hears its question, and holds Contextual Act to carry the question unanswered. Pairing occurs only then.

- Luminary: “If every version of you was sacrificed so this one could cross, which of you gets to call the crossing hope?”
- Shadow: “If the loop preserves every lie you needed to become yourself, which truth could you remove without becoming someone else?”
- Ambition: “If you escape only by becoming someone none of your former selves would recognize, who chose the change?”

Puzzle resolution has no correct answer. Willingness to carry one unresolved question opens the bridge.

## 9. Visual and Display Direction

### Display lineage

- Ghost Terminal: low-density monochrome 4:3.
- Exploration: denser limited-color 4:3.
- Action: widening vector/faceted 16:10.
- Formation: pixel portraits becoming dimensional 16:9 near 720p.
- Fracture: event-driven overlap between prior generations.
- Bridge: momentary coherent 1920×1080 before failure.

Normal play remains landscape. Reduced motion replaces camera shake, roll, FOV punch, rotation, and rotated glitches with cuts, wipes, opacity splits, and static displacement.

### Dreamweaver language

- Luminary: silver-white cold light; continuous arc and sustained motion.
- Shadow: gold-amber; broken or doubled trace and elusive motion.
- Ambition: red; angular filament and decisive motion.

Monochrome stages preserve identity through geometry, stroke rhythm, and movement rather than hue.

### Authored surfaces

Alpha 0.1 requires a custom procedural player, four distinct Echo silhouettes/tools, three Dreamweaver geometries, Archive, refuge, gate, bridge, resident, hazards, interactables, instanced building kit, glyphs, portraits, and logo variants. Raw primitive placeholders plus glow are not accepted.

Alpha 0.2 replaces player, Echoes, landmark heroes, threshold, bridge, and selected props with Blender-authored GLBs. Repeated town volume stays procedural and instanced.

### Logo

The supplied square logo is the canonical creative reference at `assets/references/omega-spiral-logo-reference.png` (SHA-256 `cd25e0c1cc510ebfebc1ed0f2249ac5b0371f157ed2cedaad4fadf1e6907c660`). Alpha 0.1 and 0.2 create new three-strand logos and era/aspect variations inspired by its language; they do not ship the reference bitmap as a runtime asset.

## 10. Camera Contract

- Terminal: fixed front plane.
- Exploration: fixed north-up orthographic overview.
- Action: north-up orthographic three-quarter camera, 55° pitch, damped follow, no rotation.
- Formation: 38° perspective, 50° pitch, short recruitment push-ins.
- Fracture: 45° perspective, stable north axis, event rails, no gameplay roll.
- Threshold: 35° perspective bridge rail and wide three-presence choice frame.

## 11. UI Contract

Required states:

- Loading.
- Audio unlock and name entry.
- Terminal choice.
- Exploration.
- Action.
- Formation.
- Fracture.
- Threshold.
- Rewind.
- Pause.
- Settings.
- WebGL error.
- Required-asset error.
- Collapse and restart.

Active HUD shows only objective, instance, target verb, and relevant party glyphs. UI never covers player, threat, interactable, or next decision. Settings expose audio groups, captions, reduced motion, Wide Timing, and text speed. All essential cues combine shape, value, icon, motion, and sound; color alone never carries meaning.

## 12. Audio Contract

One Omega motif accumulates relay clicks, one-bit tones, FM voices, tracker rhythm, samples, then spatial cinematic layers.

Required events:

`ui.confirm`, `step`, `dash.start`, `act.commit`, `threat.tell`, `threat.contact`, `landmark.restore`, `companion.recruit`, `rewind.begin`, `rewind.end`, `era.advance`, `route.commit`, `pair.carry`, `bridge.cross`, `logo.resolve`, `loop.collapse`.

Alpha 0.1 uses event-driven synthesized or local audio and nonverbal narrator signatures. Alpha 0.2 adds production assets and selected voiced lines. Every important line remains captioned. Audio must unlock from user gesture, stop on teardown, pause with game/page state, avoid stacked loops, expose volume groups, and surface decode failure.

## 13. State and Data Flow

One seeded `RunState` owns:

- Base instance and loop count.
- Phase and checkpoint.
- Player and Omega names.
- Hidden Luminary, Shadow, and Ambition affinity.
- Party selection.
- Town route.
- Final pairing.
- Era profile.

Fresh browser session chooses one seeded three-digit base instance. Same tab preserves instance lineage through `sessionStorage`. Full collapse increments only loop number; all narrative and gameplay state resets. Accessibility and volume settings may persist separately.

Terminal choices, spatial decisions, risks, recruitment, route, and pairing emit typed choice events. Hidden affinity changes commentary, never final pairing. All dialogue is authored. No runtime AI or API interprets the player.

## 14. Technical Architecture

Use exact, npm-locked TypeScript, Vite, local Three.js, native Web Audio, Playwright, `pngjs`, and glTF Transform. Output a static `dist/`. Do not use CDN runtime imports, backend services, databases, Python runtime, Electron, or runtime LLMs.

Ownership boundaries:

- `src/core`: host, fixed-step loop, seeded RNG, input intents, events.
- `src/game`: run state, affinity, party, routes, collapse.
- `src/phases`: six phase controllers.
- `src/entities`: player, Echoes, residents, hazards, Dreamweaver presence.
- `src/systems`: interaction, camera, era render, audio, VFX, Echo rewind.
- `src/assets`: manifests, loaders, materials, factories.
- `src/content`: canonical copy, questions, symbols.
- `src/ui`: terminal, HUD, prompts, pause, settings, errors.
- `tests`: state, phase, interaction, input, bot, and visual tests.

Input emits intents. UI reads immutable snapshots. Systems react to typed events. Gameplay variation uses seeded randomness and one fixed update order. Development diagnostics and test hooks are gated from production UI.

## 15. Era Transition Gates

1. Three terminal choices plus reciprocal naming.
2. Three restored landmarks.
3. Three cleared action encounters.
4. Three recruited Echoes plus party test.
5. Three completed fracture objectives.
6. Pairing hold plus bridge crossing.

Unknown or invalid phase transitions fail to a diagnostic terminal rather than continuing corrupted state.

## 16. Blender Intake Gate for Alpha 0.2

Blender 5.2.1 is installed and usable. Supplied starter scenes are teaching samples. `spacecraft.glb` is rejected because it contains an unintended `Cube` and fifth material.

Every production asset requires:

1. Versioned `.blend` source under `art-src/blender/<asset>/`.
2. Explicit named export collection.
3. JSON intake manifest with Blender/exporter versions, settings, units, axes, pivot, bounds, nodes, triangles, materials, textures, clips, collision proxy, and SHA-256.
4. GLB export to `public/assets/models/<asset>/`.
5. glTF Transform inspection before optimization.
6. Optimization of a copy only.
7. Clean Blender re-import.
8. GLTFLoader validation under real game camera and lighting.
9. Runtime diagnostics and motion evidence.

## 17. Quality Gates

### Alpha 0.1 visual floor

- No scorecard category scores 0.
- Art direction, hazards, interactables, VFX, UI, and performance score at least 2.
- Average reaches at least 1.8.
- No automatic scorecard failure remains.
- No premium or showcase claim.

### Alpha 0.2 showcase target

- Every scorecard category scores at least 2.
- At least six categories score 3.
- Average reaches at least 2.7.
- Desktop active-play target: at most 300 draw calls, 750k triangles, 60 textures, 2 added post passes, DPR cap 2, and measured 60 FPS or documented tradeoff.

## 18. Alpha 0.1 Verification

Required behavior:

- Complete 15–20 minute loop through real input.
- Keyboard and standard gamepad parity.
- Recruit three Echoes.
- Trigger failure, Echo rewind, retry, and restart.
- Complete both town routes across runs.
- Reach all three Dreamweaver pairings.
- See generational logo, 1080p failure, and instance `N+1` restart.
- Pass 200% zoom, keyboard focus, captions, color-independent cues, reduced motion, pause, settings, and audio cleanup.
- Pass production build and static preview with no remote runtime dependency.
- Produce no console, page, or network errors.

Evidence captures:

- 1920×1080: `ghost-terminal`, `exploration-active`, `archive-crossing`, `formation-party`, `fracture-memory`, `fracture-bodies`, `threshold-luminary`, `threshold-shadow`, `threshold-ambition`, `bridge-logo`.
- 1280×720: `loop-restart`, `pause-settings` at 200% zoom, `reduced-motion-fracture`.
- Unpaused: `archive-crossing-motion.webm`, `finale-motion.webm`.

Bot tests prove one full loop, both routes, all pairings, deliberate failure, rewind, retry, and restart. Screenshots never substitute for input proof.

## 19. Repository and Authority Migration

New repository bootstrap is part of the Alpha 0.1 implementation plan:

```powershell
New-Item -ItemType Directory -Force C:\SpiralDrive\omega-alpha-spiral
Set-Location C:\SpiralDrive\omega-alpha-spiral
echo "# omega-alpha-spiral" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/jessenaiman/omega-alpha-spiral.git
git push -u origin main
```

After initial commit, ignore `.worktrees/`, commit that rule, and create isolated feature worktree `feat/alpha-0.1-complete-loop` before implementation.

Active authority receives new `AGENTS.md`, `IDEA.md`, approved design artifacts, plans, and progress/evidence records. Old `omega-spiral-astra` remains read-only reference. Its Python/backend plan, old `whispering-ruins.html`, repo-local `.agents`, legacy user stories, styleframes, and historical `review/` outputs never become active authority. Live reference audit used commit `a53d88c`; older memory claiming `176c50d` is not authoritative.

## 20. Team and Check-in Protocol

- Captain owns interfaces, integration, browser playthrough, evidence, release decisions, permitted software installs, and all interactive Blender/Affinity/computer-use work.
- Small precise tasks use normal subagents by default; AgentTeams is reserved for shared dependency graphs.
- Every worker must call and fully follow the exact applicable `threejs-*` skill named in its prompt, inspect real files/tool output, and never invent evidence.
- Sol handles architecture-sensitive setup, core systems, scripts, manifests, or recovery; it may prepare Blender automation but cannot claim interactive Blender/Affinity results.
- Terra drafts visual assets; Sol polishes; the explicitly approved Modlens route critiques actual pixels; captain makes the final visual decision.
- At most two workers run beside captain.
- Unavailable requested model routes block those assignments; no silent substitution.

Every delegated task ends with a valid `CHECK-IN v1` block. The DSH task board is the live task authority; after each completed or blocked task, captain records factual evidence in `artifacts/game-progress.md`. Each integration wave ends with fresh verification and a Conventional Commit. No deployment or remote push occurs without the user’s explicit command or confirmation in that execution turn.

## 21. Non-goals

- Inventory or loot economy.
- Skill trees.
- Procedural levels.
- Conventional boss.
- Separate attack combo system.
- Full touch gameplay.
- Backend, database, Electron, or runtime LLM.
- Cross-loop residue beyond instance number in Alpha 0.1.
- Blender assets as an Alpha 0.1 blocker.

## 22. Required Companion Artifacts

- `docs/game/design-brief.md`
- `docs/game/core-loop-contract.md`
- `docs/game/level-encounter-plan.md`
- `docs/game/art-direction.md`
- `docs/game/audio-matrix.md`
- `artifacts/game-progress.md`
- `docs/superpowers/plans/2026-09-15-omega-spiral-alpha-0-1.md`
- `docs/superpowers/plans/2026-09-15-omega-spiral-alpha-0-2.md`

Implementation remains blocked until these files exist, agree with this specification, and contain no placeholders.

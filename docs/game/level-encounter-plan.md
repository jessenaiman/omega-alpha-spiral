# Omega Spiral — Level and Encounter Plan

## Level purpose

The level is one town seen repeatedly at increasing fidelity. It must feel like the same geography acquiring new meaning, not six disconnected scenes. Each phase teaches or recombines one small action set, advances the display era after a clear objective, and leaves the player with a visible consequence.

A first completion lasts 15–20 minutes and targets about 18 minutes. Timing ranges are pacing goals, not countdowns imposed on reading or exploration.

## Town anchors

Three landmarks remain recognizable in every era:

- **Archive:** preservation, records, the representative action encounter, and the memory side of the fracture.
- **Civic refuge:** residents, recruitment context, and the bodies side of the fracture.
- **Gate and bridge:** route orientation, threshold approach, and final crossing.

Landmark silhouettes, paths, and relative positions persist while geometry, color, sound, interface, and depth accumulate. Important routes remain readable through shape and motion without relying on color alone.

## Phase plan

### 1. Ghost Terminal — 2–3 minutes

**Camera:** fixed front plane inside a low-density monochrome 4:3 signal.

**Micro-loop:** read one authored prompt, make one explicit choice, receive one authored response. Repeat for three choice-and-response beats.

**Player actions:** unlock audio if desired, state a name, make three choices, and name Omega. Mouse may operate menus, but keyboard and gamepad can complete the flow.

**Pressure:** none while reading. Signal instability provides atmosphere but never shortens the response window.

**Reward:** the town signal gains structure, Omega gains a name, and the three Dreamweaver grammars appear without revealing affinity as a score.

**Era trigger:** the name, all three choices, and Omega’s name are committed.

### 2. Town Map — 2–3 minutes

**Camera:** fixed north-up orthographic overview in a denser limited-color 4:3 frame.

**Micro-loop:** identify a landmark, Move to its context, use Contextual Act, then read the restoration through geometry, label, sound, and route change. Repeat for Archive, civic refuge, and gate or bridge.

**Player teaching:** Move is taught first; Contextual Act is taught through one unambiguous nearby target before it is used at greater distance.

**Pressure:** no damage. The challenge is spatial recognition and choosing an order.

**Reward:** each landmark becomes legible, adds one motif layer, and opens a path toward the low-density town space.

**Era trigger:** all three landmarks are restored.

### 3. Town Space — about 3 minutes

**Camera:** north-up orthographic three-quarter view with a 55° pitch, damped follow, and no rotation. The display widens toward 16:10 as vector and faceted depth appear.

**Micro-loop:** read a hazard trace, enter the safe window, commit Move, Dash, or Act, then recover. Three encounters recombine known actions. The first isolates sweep timing, the second adds an instability shard and narrowing space, and Archive Crossing combines the full set.

**Player teaching:** Dash is introduced against a visible, repeatable tell. A failed attempt rewinds only the current encounter.

**Reward:** safe routes, fuller geometry and sound, an open Archive, and a freed resident.

**Era trigger:** Archive Crossing succeeds.

### 4. Town Community — 3–4 minutes

**Camera:** 38° perspective with a 50° pitch. Short recruitment push-ins may frame an Echo, but control and north-axis comprehension return immediately afterward. The display reaches 16:9 near 720p with pixel color, portraits, and dimensional forms.

**Micro-loop:** meet an Echo, see the role solve a concrete local problem, recruit, and receive party feedback. Repeat three times, then complete one party test.

**Party roles:** Fighter guards and breaks; Scribe preserves and reveals; Thief bypasses and repositions; Weaver stabilizes and redirects.

The player recruits three. The fourth joins a visible parallel party. No role is a trap choice, and any three-Echo party can pass the party test and complete either fracture route.

**Reward:** a visible three-companion party, role glyphs, portraits, a thicker motif, and access to the fracture.

**Era trigger:** three Echoes are recruited and the party test is complete.

### 5. Town Fracture — 4–5 minutes

**Camera:** 45° perspective with a stable north axis and authored event rails. There is no gameplay roll. Presentation overlaps earlier generations rather than replacing them.

**Micro-loop:** read two simultaneous needs, use movement and available party roles, commit one route objective, then witness the parallel party advance the alternative. Repeat for three objectives.

**Choice:** preserve memory or preserve bodies. Neither is identified as correct. The player’s route is physically enacted; it is not a dialogue-only selection. The parallel party remains visible performing the unchosen route, including the Echo not recruited by the player.

**Pressure:** simultaneous needs, instability shards, path loss, and the permanent closing of the other route for this run.

**Reward:** concrete survival or preservation, authored companion response, a visible parallel consequence, and access to all three Dreamweavers.

**Era trigger:** all three objectives on the chosen route are complete.

### 6. Threshold and Collapse — about 2 minutes

**Camera:** 35° perspective on a bridge rail, opening to a wide frame that shows all three separated Dreamweaver presences.

**Micro-loop:** inspect, approach, hold Contextual Act to carry one question, then cross. Hidden affinity may alter authored commentary but cannot choose or block a presence.

The exact threshold copy is:

- Luminary — “If every version of you was sacrificed so this one could cross, which of you gets to call the crossing hope?”
- Shadow — “If the loop preserves every lie you needed to become yourself, which truth could you remove without becoming someone else?”
- Ambition — “If you escape only by becoming someone none of your former selves would recognize, who chose the change?”

The selected question remains unanswered. Carrying it closes the other two pairings for this run.

**Final sequence:** cross the bridge; enter the prologue or title moment; resolve the era-specific three-strand logo; reveal a brief coherent 1920×1080 game world; glitch and collapse; return to Ghost Terminal with the loop number incremented. Narrative and gameplay state reset while accessibility and volume settings may persist.

## Representative encounter: Archive Crossing

### Design job

Archive Crossing is the Alpha 0.1 representative playable scene. It must prove Move, Dash, Contextual Act, fair pressure, visible reward, local failure, Echo rewind, retry, objective UI, audio, VFX, camera discipline, and an era transition in one coherent encounter.

### Required frame

A fixed three-quarter camera keeps all essential information in view:

- the Archive destination;
- the resident at risk;
- two anchor nodes;
- the sweep origin and its trace;
- the final gap;
- any active instability shard;
- the last safe tile and current target.

No damaging sweep may begin off-screen. The trace must reveal origin, path, direction, and contact time before it becomes dangerous.

### Expected beat sequence

1. **Read the field.** The objective names the Archive and the first target shows `STABILIZE`. One complete harmless trace establishes the sweep rhythm.
2. **Anchor the first node.** The player crosses a short safe window and commits Contextual Act. Success changes node geometry and sound, not color alone.
3. **Anchor the second node.** The route requires a longer movement decision. During recovery, the player may use `DISRUPT` on one instability shard to restore space, but disruption is not a hidden requirement.
4. **Cross the final gap.** The target moves across the gap. The trace makes a Dash window legible before the player commits.
5. **Guard the resident.** The target label changes to `GUARD`. The player holds Contextual Act through the last sweep while remaining positioned at the resident.
6. **Resolve.** Color and volume return, another Omega motif layer enters, the resident is freed, the Archive opens, and the display advances into the formation era.

The encounter should occupy roughly 90–120 seconds of the three-minute Town Space phase for a first-time player. The range is a pacing expectation only; there is no encounter countdown.

### Failure and recovery

Hazard contact or resident loss immediately starts a 1.25-second Echo rewind to the encounter snapshot. Earlier landmark and encounter progress remains intact. A short failed-path trace may remain during the retry, then disappears on success and never persists beyond the encounter.

The pause flow always offers `Retry Encounter`. Falling or leaving valid navigation returns the player to the last safe tile. After 30 seconds without progress, the next valid node, shard, gap, or resident affordance pulses through shape, motion, label, and sound. Wide Timing increases safe windows while preserving the same sequence and outcome.

### Feedback contract

- `threat.tell` begins with the sweep trace.
- `threat.contact` begins failure feedback.
- `act.commit` confirms an anchor, disruption, or guard action.
- `dash.start` confirms the crossing commitment.
- `rewind.begin` and `rewind.end` bracket the local recovery.
- `landmark.restore` confirms the Archive result.
- `era.advance` begins only after the resident is safe and both anchors are stable.

The active HUD contains only objective, instance, target verb, and relevant party glyphs. Captions cover important lines and nonverbal narrator signatures. Pause, retry, and rewind stop transient effects so duplicate sound or VFX cannot accumulate.

## Camera and accessibility rules

- Camera movement may frame a reward but must not conceal the next threat or reverse the north axis.
- There is no manual orbit, gameplay roll, or surprise FOV punch.
- Reduced motion replaces rotation, shake, roll, FOV punch, and rotated glitch treatments with opacity, value, line, and cut-based alternatives.
- All targets remain understandable through geometry, stroke rhythm, label, and motion in monochrome and under color-vision deficiency.
- HUD and settings remain usable at 200% zoom without covering active play or clipping essential text.

## Acceptance coverage

The real game state and renderer must be observable through `window.__THREE_GAME_TEST_HOOKS__` and `window.__THREE_GAME_DIAGNOSTICS__`.

At minimum, automated evidence must prepare and capture `archive-crossing`, `formation-party`, both fracture routes, all three threshold choices, the bridge logo, loop restart, pause settings at 200% zoom, and reduced-motion fracture. Named capture preparation must use the same state owner and settings as play, pause simulation immediately while rendering continues, and reject unknown states.

A real-input bot run must:

- complete the full 15–20 minute loop;
- recruit three Echoes;
- deliberately fail Archive Crossing once;
- observe rewind and retry;
- succeed at Archive Crossing;
- prove both fracture routes across runs;
- reach all three pairings across runs;
- cross the bridge and observe the incremented loop.

Unpaused `archive-crossing-motion.webm` and `finale-motion.webm` must show readable motion, not frozen capture states. Production static-preview evidence must contain no browser console errors, page errors, failed network requests, remote runtime modules, debug overlays, or test-only shortcuts visible to the player.

## Alpha handoff

Alpha 0.1 uses custom procedural gameplay surfaces, instanced town volume, event-driven synthesized or local audio, and the complete encounter behavior above. Alpha 0.2 may replace hero visuals and audio without changing the encounter contract. Blender-authored player, Echoes, Archive, refuge, threshold, bridge, and props must each pass named-collection export, manifest, clean-scene re-import, glTF Transform inspection, runtime camera review, collision-proxy review, and recorded budget counts before replacing an Alpha 0.1 surface.

# Audio Matrix — Omega Spiral Alpha 0.1 and 0.2

## Authority

This document implements `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`. It specifies every approved audio event with its exact trigger, source/timbre, duration/loop policy, runtime group, phase availability, concurrency/cooldown rule, Alpha 0.1 source method, and Alpha 0.2 upgrade path. Group assignments and durations match the implementation plan's AUDIO_CUES exactly. Changes require explicit approval and matching updates to the design spec.

---

## 1. Runtime Audio Architecture

### Audio Context

- Single Web Audio AudioContext, created on user gesture (audio unlock screen).
- Context state managed through the UI audio unlock state.
- Context resumes on unlock; suspends on pause when user-requested.
- On AudioContext creation failure: raise one nonblocking audio status indicator in the UI (same policy as decode failure); game continues silently with captions active.

### Runtime Groups (Bus Structure)

#### Alpha 0.1 — Five buses

| Group | Purpose | Default Volume | Mute Behavior |
|-------|---------|---------------|---------------|
| master | Final output | 0.8 | Mutes all groups |
| music | Omega motif layers, landmark restore, companion recruit, route commit, pair carry, bridge cross, logo resolve, loop collapse | 0.6 | Independent of SFX |
| ambience | Town signal, air, relays, relay clicks, and spatial beds | 0.6 | Independent of music and SFX |
| sfx | Gameplay events (step, dash, act, hazard, rewind, era advance) | 0.7 | Independent of music |
| ui | Interface feedback (confirm, pause, settings) | 0.5 | Independent of music and SFX |

Note: The `ambience` bus is owned by persistent motif/town-bed layers, including relay clicks; it is intentionally absent from the discrete AUDIO_CUES event map.

#### Alpha 0.2 — Conditional sixth bus

A `voice` bus is added only when selected voiced assets ship (Dreamweaver dialogue, Omega narration, or character lines). When absent, all narration falls back to captions with no audio channel. When present:

| Group | Purpose | Default Volume | Mute Behavior |
|-------|---------|---------------|---------------|
| voice | Dreamweaver dialogue, Omega narration, selected character lines | 0.8 | Independent; caption display is always on regardless of voice mute or gain |

The voice bus gain controls playback volume only. Captions are never gated by voice mute state, voice gain, or voice bus errors.

### Volume Persistence

- master, music, ambience, sfx, and ui volumes persist in localStorage under a settings key.
- "Default Volume" in the bus table above is the initial state; the settings store is the runtime authority for current volume.
- When the voice bus ships in Alpha 0.2, its volume persists alongside the others.
- Volumes are restored on page load before audio context creation.
- Mute state per group persists independently.
- Reduced motion does not change volume defaults.

---

## 2. Omega Motif Accumulation

One Omega motif accumulates layers across the game. Each layer adds during its assigned phase and remains audible in subsequent phases.

| Layer | Source / Timbre | Phase Added | Loop Policy | Group | Description |
|-------|----------------|-------------|-------------|-------|-------------|
| Relay clicks | Short noise burst, 2ms decay, seeded pitch variation from 200-400Hz | Ghost Terminal | Loop, 0.8s interval | ambience | Mechanical relay pattern, sparse |
| One-bit tones | Square wave, 440Hz fundamental, 0.1s duration | Town Map | Loop, 1.2s interval | music | Simple melodic fragment, two-note |
| FM voices | FM synthesis pair, carrier 330Hz, modulator 440Hz, ratio 1:1.33 | Town Space | Loop, 0.6s interval | music | Warmer tonal pad, slight vibrato |
| Tracker rhythm | Four-on-the-floor kick pattern, 120 BPM, filtered noise | Town Community | Loop, 4-beat pattern | music | Rhythmic backbone, driving pulse |
| Samples | Recorded hits and textures, layered | Town Fracture | Loop, varies | music | Dense textural bed |
| Spatial cinematic | Reverb-processed pad, stereo spread, low-pass sweep | Threshold / Bridge | Loop, 8s cycle | music | Full spatial presence |

Layer volume mix: relay 0.3, one-bit 0.25, FM 0.35, tracker 0.4, samples 0.3, spatial 0.5. Final mix normalized to prevent clipping.

---

## 3. Event Matrix

Each row is one approved event. All fields are concrete and non-placeholder. Group assignments and durations match the implementation plan AUDIO_CUES exactly. Gameplay ownership rules: audio never drives domain state transitions; gameplay state drives audio. Every Duration/Loop value is a fixed ceiling; synthesis envelopes are designed to fit within the declared duration.

### ui.confirm

| Field | Value |
|-------|-------|
| Trigger | Player presses Contextual Act on a valid target, or confirms a menu selection |
| Source / Timbre | Short sine chirp, 880Hz to 1320Hz sweep within 0.08s, no reverb |
| Duration / Loop | One-shot, 0.08s |
| Runtime Group | ui |
| Phase Availability | All phases |
| Concurrency / Cooldown | Max 1 simultaneous; 40ms cooldown between repeats |
| Alpha 0.1 Source | Web Audio oscillator, chirp synthesizer |
| Alpha 0.2 Upgrade | Replace with authored UI confirm sample (short metallic ping) |

### step

| Field | Value |
|-------|-------|
| Trigger | Player travels another 0.8 world units while grounded; the Town Map quantizes this cadence to its glyph grid |
| Source / Timbre | Filtered noise burst, decay fitted within 0.06s, low-pass at 800Hz, slight seeded pitch variation per surface type |
| Duration / Loop | One-shot, 0.06s |
| Runtime Group | sfx |
| Phase Availability | Town Map, Town Space, Town Community, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 90ms cooldown (tied to movement speed) |
| Alpha 0.1 Source | Web Audio noise generator with filter envelope |
| Alpha 0.2 Upgrade | Replace with footstep samples (3 variations per surface type: stone, wood, metal) |

### dash.start

| Field | Value |
|-------|-------|
| Trigger | Player initiates Dash input |
| Source / Timbre | Rising whoosh: filtered noise sweep from 200Hz to 2kHz, attack and decay fitted within 0.18s, stereo pan follows movement direction |
| Duration / Loop | One-shot, 0.18s |
| Runtime Group | sfx |
| Phase Availability | Town Space, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 150ms cooldown (dash gameplay cooldown) |
| Alpha 0.1 Source | Web Audio noise sweep with stereo panner |
| Alpha 0.2 Upgrade | Replace with authored whoosh sample with directional pan |

### act.commit

| Field | Value |
|-------|-------|
| Trigger | A Contextual Act press or hold completes on a valid target |
| Source / Timbre | Bright chime cluster, three notes (C5, E5, G5) with stagger fitted within 0.22s, slight reverb |
| Duration / Loop | One-shot, 0.22s |
| Runtime Group | sfx |
| Phase Availability | Town Map, Town Space, Town Community, Town Fracture, Threshold |
| Concurrency / Cooldown | Max 1 simultaneous; 80ms cooldown |
| Alpha 0.1 Source | Web Audio oscillator chord with delay-and-filter reverb network |
| Alpha 0.2 Upgrade | Replace completion chime with recorded bell or metallic hit sample |

Note: The previous two-part envelope (hold initiation + completion) is removed. The plan's AUDIO_CUES defines a single `act.commit` event at 0.22s with no separate initiation event. If a hold-initiation sound is desired, it requires a new `act.initiate` FeedbackEvent approved in the spec and plan.

### threat.tell

| Field | Value |
|-------|-------|
| Trigger | Hazard telegraph zone appears or becomes visible to player |
| Source / Timbre | Low warning drone: sawtooth wave at 110Hz, volume ramp fitted within 0.45s, slight tremolo |
| Duration / Loop | One-shot, 0.45s |
| Runtime Group | sfx |
| Phase Availability | Town Space, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 450ms cooldown |
| Alpha 0.1 Source | Web Audio oscillator with gain envelope |
| Alpha 0.2 Upgrade | Replace with authored warning stinger sample |

### threat.contact

| Field | Value |
|-------|-------|
| Trigger | Player or resident collides with active hazard |
| Source / Timbre | Impact hit: noise burst with sharp attack (2ms), decay fitted within 0.35s, low-pass sweep down |
| Duration / Loop | One-shot, 0.35s |
| Runtime Group | sfx |
| Phase Availability | Town Space, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 200ms cooldown; initiates gameplay rewind sequence (gameplay state drives the rewind, not the sound) |
| Alpha 0.1 Source | Web Audio noise burst with filter sweep |
| Alpha 0.2 Upgrade | Replace with authored impact sample with reverb tail |

### landmark.restore

| Field | Value |
|-------|-------|
| Trigger | Player completes Act on a landmark and it transitions from degraded to restored state |
| Source / Timbre | Ascending tone cluster: three notes (C4, E4, G4) with stagger fitted within 1.2s, sine wave, slight reverb |
| Duration / Loop | One-shot, 1.2s |
| Runtime Group | music |
| Phase Availability | Town Map, Town Space |
| Concurrency / Cooldown | Max 1 simultaneous; 500ms cooldown between landmark restores |
| Alpha 0.1 Source | Web Audio oscillator cluster with reverb |
| Alpha 0.2 Upgrade | Replace with recorded chime or crystalline hit sample |

### companion.recruit

| Field | Value |
|-------|-------|
| Trigger | Player completes Act on an Echo and it joins the party (formation phase, Town Community) |
| Source / Timbre | Brief melodic phrase: four-note ascending pattern (D4, F4, A4, D5) fitted within 1.5s, sine wave with slight chorus |
| Duration / Loop | One-shot, 1.5s |
| Runtime Group | music |
| Phase Availability | Town Community |
| Concurrency / Cooldown | Max 1 simultaneous; 500ms cooldown |
| Alpha 0.1 Source | Web Audio oscillator with chorus effect |
| Alpha 0.2 Upgrade | Replace with recorded melodic sample unique per Echo type |

Note: Fires in the formation phase (Town Community) when the player's Physical Act selects an Echo candidate. The fracture phase handles route commitment, not recruitment.

### rewind.begin

| Field | Value |
|-------|-------|
| Trigger | Gameplay state enters rewind (hazard contact or resident loss triggers the encounter snapshot restore) |
| Source / Timbre | Reverse-reverb swell: white noise fitted within 0.6s, pitch-down sweep from 1kHz to 200Hz |
| Duration / Loop | One-shot, 0.6s |
| Runtime Group | sfx |
| Phase Availability | Town Space, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 600ms cooldown; gameplay state blocks player input for the 1.25s rewind duration; this sound does not govern input resumption |
| Alpha 0.1 Source | Web Audio noise with reverse gain envelope and pitch automation |
| Alpha 0.2 Upgrade | Replace with authored rewind sample |

### rewind.end

| Field | Value |
|-------|-------|
| Trigger | Gameplay state completes the 1.25s rewind and restores the encounter snapshot; this sound fires as a nonblocking consequence of that state transition |
| Source / Timbre | Soft landing tone: sine wave at 440Hz fitted within 0.24s, slight reverb, paired with subtle bass thud at 80Hz |
| Duration / Loop | One-shot, 0.24s |
| Runtime Group | sfx |
| Phase Availability | Town Space, Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 200ms cooldown; input resumes when the gameplay state transition completes, independent of this sound's duration |
| Alpha 0.1 Source | Web Audio sine oscillator with gain envelope |
| Alpha 0.2 Upgrade | Replace with recorded landing or resolution sample |

### era.advance

| Field | Value |
|-------|-------|
| Trigger | Gameplay state accepts a completed phase objective and advances the era; this sound is a nonblocking presentation consequence |
| Source / Timbre | Layered sweep: filtered noise rising fitted within 1.8s, plus the next Omega motif layer fading in, plus a brief tonal resolution chord |
| Duration / Loop | One-shot, 1.8s |
| Runtime Group | sfx |
| Phase Availability | All phase transitions |
| Concurrency / Cooldown | Max 1 simultaneous; 1.8s cooldown; the era transition is gameplay-driven and does not wait for this sound to complete before advancing |
| Alpha 0.1 Source | Web Audio noise sweep with crossfade between motif layers |
| Alpha 0.2 Upgrade | Replace with produced transition stinger with full orchestration |

### route.commit

| Field | Value |
|-------|-------|
| Trigger | Player physically commits to memory or bodies route in Town Fracture |
| Source / Timbre | Deep resonant strike: bass drum hit at 60Hz fitted within 2.0s, reverb tail, harmonic overtone sweep |
| Duration / Loop | One-shot, 2.0s |
| Runtime Group | music |
| Phase Availability | Town Fracture |
| Concurrency / Cooldown | Max 1 simultaneous; 2.0s cooldown; one-way commitment (no undo) |
| Alpha 0.1 Source | Web Audio oscillator with low-frequency sine and reverb |
| Alpha 0.2 Upgrade | Replace with recorded cinematic drum hit |

### pair.carry

| Field | Value |
|-------|-------|
| Trigger | Player holds Contextual Act on chosen Dreamweaver and carries its identity question |
| Source / Timbre | Dreamweaver-specific pitch (Luminary 523Hz/C5, Shadow 392Hz/G4, Ambition 330Hz/E4), sine wave with slow tremolo, envelope fitted within 2.2s |
| Duration / Loop | One-shot, 2.2s |
| Runtime Group | music |
| Phase Availability | Threshold |
| Concurrency / Cooldown | Max 1 simultaneous; 2.2s cooldown; only one Dreamweaver can be carried |
| Alpha 0.1 Source | Web Audio oscillator with tremolo LFO and gain envelope |
| Alpha 0.2 Upgrade | Replace with produced Dreamweaver voice motif sample |

### bridge.cross

| Field | Value |
|-------|-------|
| Trigger | Player crosses the bridge after pairing via real Move input; camera follows a scripted rail but player movement input remains active throughout the crossing |
| Source / Timbre | Ascending pad: filtered noise sweep from 200Hz to 4kHz fitted within 1.5s, stereo widening, plus brief chime at midpoint |
| Duration / Loop | One-shot, 1.5s |
| Runtime Group | music |
| Phase Availability | Threshold / Bridge |
| Concurrency / Cooldown | Max 1 simultaneous; 1.0s cooldown; Move input stays active on the bridge rail; camera tracks the rail path but does not lock input |
| Alpha 0.1 Source | Web Audio noise sweep with stereo panner and oscillator chime |
| Alpha 0.2 Upgrade | Replace with produced cinematic bridge stinger |

### logo.resolve

| Field | Value |
|-------|-------|
| Trigger | Three-strand logo resolves full-screen during bridge moment |
| Source / Timbre | Crystalline chord: stacked sine waves at C5, E5, G5, C6 fitted within 2.4s, 0.3s attack, sustain and release within budget, subtle shimmer |
| Duration / Loop | One-shot, 2.4s |
| Runtime Group | music |
| Phase Availability | Bridge Glimpse |
| Concurrency / Cooldown | Max 1 simultaneous; 2.4s cooldown; visual and audio resolve together |
| Alpha 0.1 Source | Web Audio oscillator stack with reverb |
| Alpha 0.2 Upgrade | Replace with produced logo resolve sample |

### loop.collapse

| Field | Value |
|-------|-------|
| Trigger | Presentation-only FeedbackEvent: begins the 1.5-second visual/audio collapse beat; fires at the start of the collapse sequence, before loop.reset |
| Source / Timbre | Distorted noise burst: white noise through waveshaper distortion, envelope totaling exactly 1.5s (0.2s attack, 0.8s sustain with pitch-down, 0.5s release to silence), plus brief relay click echo (callback to Ghost Terminal) |
| Duration / Loop | One-shot, 1.5s |
| Runtime Group | music |
| Phase Availability | Bridge Glimpse / Collapse |
| Concurrency / Cooldown | Max 1 simultaneous; this sound is presentation-only and never triggers domain state; after the 1.5s beat completes, stop and disconnect all remaining sources, then dispatch `loop.reset` |
| Alpha 0.1 Source | Web Audio noise with waveshaper and pitch automation |
| Alpha 0.2 Upgrade | Replace with produced collapse stinger |

---

## 4. Nonverbal Dreamweaver Signatures

Nonverbal audio signatures identify each Dreamweaver without spoken words. Used during pairing and threshold scenes. These use the music group (no narrator or voice group exists in the Alpha 0.1 implementation).

| Dreamweaver | Signature Timbre | Duration | Phase | Group |
|------------|-----------------|----------|-------|-------|
| Luminary | Sustained high sine (523Hz), clean, slight reverb, no tremolo | 2.0s loop | Threshold | music |
| Shadow | Mid sine (392Hz), tremolo at 4Hz, offset doubled (5ms delay), slight distortion | 2.0s loop | Threshold | music |
| Ambition | Low sine (330Hz), angular amplitude envelope (square-ish), slight overdrive | 2.0s loop | Threshold | music |

Each signature plays when the player is within interaction range of its Dreamweaver. Only one signature plays at a time; proximity determines which.

---

## 5. Phase Availability Summary

Derived from explicit phase emissions in the master spec and level-encounter-plan. Each event is available only where its triggering action or gameplay state actually occurs.

| Event | Terminal | Map | Space | Community | Fracture | Threshold | Bridge |
|-------|----------|-----|-------|-----------|----------|-----------|--------|
| ui.confirm | Y | Y | Y | Y | Y | Y | Y |
| step | - | Y | Y | Y | Y | - | - |
| dash.start | - | - | Y | - | Y | - | - |
| act.commit | - | Y | Y | Y | Y | Y | - |
| threat.tell | - | - | Y | - | Y | - | - |
| threat.contact | - | - | Y | - | Y | - | - |
| landmark.restore | - | Y | Y | - | - | - | - |
| companion.recruit | - | - | - | Y | - | - | - |
| rewind.begin | - | - | Y | - | Y | - | - |
| rewind.end | - | - | Y | - | Y | - | - |
| era.advance | - | Y | Y | Y | Y | Y | - |
| route.commit | - | - | - | - | Y | - | - |
| pair.carry | - | - | - | - | - | Y | - |
| bridge.cross | - | - | - | - | - | - | Y |
| logo.resolve | - | - | - | - | - | - | Y |
| loop.collapse | - | - | - | - | - | - | Y |

---

## 6. Concurrency Rules

- Maximum 8 simultaneous sounds.
- Music group layers are mixed down to a single bus before output; individual layer volume is set at phase transition, not per-frame.
- All event cues are max 1 simultaneous with stated cooldowns.
- Rewind: gameplay state blocks player input for the 1.25s rewind duration; audio effects are nonblocking consequences of the state transition and do not govern input timing.
- Era transition: gameplay state drives the era advance when the phase objective is accepted; audio sweep plays as a nonblocking presentation layer.
- Pause and retry stop transient effects so duplicate sound or VFX cannot accumulate across snapshots.

---

## 7. Lifecycle: Unlock, Pause, Visibility, Restart, Mute, Teardown, and Decode-Error Acceptance

### Audio Unlock

- AudioContext starts in suspended state.
- Player must interact (click or press any key) on the audio unlock screen before any sound plays.
- Unlock screen displays: "Press any key or click to enable audio."
- After unlock, context resumes and all sounds play normally.
- If unlock is not completed, no audio plays and no audio errors are shown.

### Pause

- On pause: all group gains ramp to 0 over 0.2s (no click/pop).
- On unpause: all group gains ramp back to previous values over 0.3s.
- The motif scheduler freezes on pause and resumes phase-aligned on unpause; no hidden clock advance occurs during the paused state.
- Sustained sounds (pair.carry, Dreamweaver signatures) are cut immediately on pause (no partial playback).

### Page Visibility

- When the page becomes hidden (tab switch, minimize): freeze the motif scheduler and suspend active event sources (same as pause).
- When the page becomes visible again: resume the motif scheduler phase-aligned and restore event source playback (same as unpause).
- This prevents clock drift during backgrounded tabs without requiring user interaction.

### Restart (Loop Collapse)

- `loop.collapse` is a presentation-only FeedbackEvent that begins the 1.5-second visual/audio collapse beat; it fires first and never changes domain state.
- During the 1.5s beat: the loop.collapse source plays for its full duration; pre-collapse sources (motif layers, ambient beds) fade to 0 over the first 0.5s of the beat.
- After the 1.5s beat completes: stop and disconnect every remaining audio source; then dispatch `loop.reset` (the GameAction that increments lineage and boots Ghost Terminal).
- On Ghost Terminal restart (after loop.reset): audio context remains open; no new unlock required.
- Motif layers reset to relay clicks only.
- All event cooldowns clear.

### Teardown (Dispose)

- On full game dispose (page unload, error boundary, or explicit teardown): stop and disconnect every audio source; close the AudioContext.
- On restart (loop.reset): retain the AudioContext; stop and disconnect all sources; reset motif layers and cooldowns; do not close the context.

### Mute

- Per-group mute toggles gain to 0 without changing the stored volume value.
- Unmute restores the stored volume value.
- Master mute overrides all groups.
- Mute state persists in localStorage.

### Decode-Error Handling

Applies to every loaded audio buffer independently of whether the optional voice bus ships:

- If any audio buffer fails to decode:
  - Raise one nonblocking audio status indicator in the UI (a brief, dismissible status line such as "Audio: some samples unavailable").
  - Log the failed buffer name to console with `[AUDIO DECODE ERROR]` prefix.
  - Skip the failed buffer; do not play it.
  - Continue all other audio normally.
  - If the failed buffer is a voice line, display its caption text without audio.
- Alpha 0.1 uses only synthesized audio (oscillators and noise); decode errors are not expected in 0.1 but the handler remains in place for robustness.
- Maximum 3 decode errors logged per session before stopping retry attempts for that buffer.

---

## 8. Caption Integration

- Important lines (Dreamweaver dialogue, Omega narration, system messages) are always captioned regardless of audio settings.
- Captions are driven by the authored dialogue/presentation timeline, not by audio playback state. Failed, muted, or unavailable audio cannot gate caption display.
- Captions display in the current phase font at readable size.
- Caption timing is tied to the authored presentation timeline, not estimated audio durations.
- If audio is muted, captions still display at their scheduled times.
- Caption visibility is independent of all audio bus mute states, including the voice bus when it ships in Alpha 0.2.

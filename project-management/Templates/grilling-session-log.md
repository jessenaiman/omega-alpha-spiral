---
tags: [omega-spiral, tasklist, grilling-session]
updated: 2026-09-20
---
# Outstanding Questions & Best-Attempt Log — for the grilling session

Run log for the autonomous pass: floors 4–6 → stages 3–6 playable. Every questionable
decision I made without the owner is logged here with my reasoning. Review as one big
grilling session tonight.

## Status snapshot
- Floors 1–6 committed (6e34a9e). Unit 37/43 (6 = pre-existing RED sprint/dodge/health/listen stubs). Bot suite 3/3 after floors 4–6.
- Self-audit (in lieu of failed reviewer agent): dead import removed, unused field removed, `as any` replaced with typed loader call, reduced-motion gates both VFX instances, whisper placement already deterministic via seeded Whispers class. Scorecard (threejs-aaa-graphics-builder): authored forms 8, materials 7, lighting 6, effects 7, score 7/10 — lighting pass and floor variety (per-floor palette/geometry deltas beyond color) remain the weakest rows.
- DELEGATION FAILURE: both subagents (deepseek-v4-flash via opencode-go) died at 30s/2API-calls, twice with different tasks. Autonomous work is being done directly instead. Grill whether to move delegation to a different provider model.

## Questionable actions taken (BEST-ATTEMPT rulings — grill each)

1. **Stage 3 per owner = "more floors, not a township"** — owner said explicitly
   ("Stage 3 isn't a town, it's more floors…"). The *script* says Liminal Township with
   NPCs/mural/signpost. My ruling: implement the NPC dialogue/lore as whisper lines and
   standing NPC props on floors 7–9, NOT a free-roam town. Grill: does that drop too
   much of the township's "first true agency / free exploration"?

2. **Flattened the story order.** Source index order: Stage2 (3 floors) → Stage3 Township
   → Stage4 Echo Vault → Stage5 Fractured Escape → Stage6 Epilogue. But the owner's
   floor-plan message wanted floors 4–6 to follow `stage_3` docs (never-go-alone:
   mirrors/party). I built floors 4–6 from the never-go-alone beaats (mirror choose
   → combat → mirror → combat) interpreted as floor exits (door=fight exit, chest=recruit,
   monster=test). Grill: correct flattening, or should floors 4–6 be Township-flavored
   and mirrors pushed to floors 7–9?

3. **Dreamweaver names in script data:** never-go-alone JSON uses mischief/wrath/
   (superseded vocabulary). I mapped mischief→Shadow, wrath→Ambition per CONTEXT.md.
   Grill: confirm.

4. **Combat in floors 4–6:** script says turn-based → timed turns → real-time
   leader+follower. I staged it as: floor 5 = turn-menu + 8s turn timer
   (`turnTimerSeconds`), floor 6 = leader + follower real-time. Floor 4 keeps the
   existing action mechanics (attacksAllowed). Grill: too big a jump per floor?

5. **Party roster:** Fighter/Wizard/Thief/Scribe 1-2-4 with remapped allegiances
   (fighter=Light, wizard=Ambition, thief=Shadow, scribe=Light) — per owner's earlier
   "roster 1-2-4" note. Grill.

6. **Stage 5/6 compressed:** Fractured Escape and Epilogue are largely narration-scale
   beats (town shatters, three routes, archive playback). My best attempt: build them as
   2 final floors with heavier cutscene-style stitching (Omega logs, "two other
   signatures persist"), ending the chapter with refusal, not reunion. Grill.

7. **Test policy:** no new unit tests while floors are fresh (owner instruction); bot
   browser tests only verify loading (scene/canvas/audio) YES/NO, not word choices.

## Deferred / not done
- Sprint/dodge/health player-mechanics tests are still RED stubs (`tests/unit/player-mechanics.test.ts`) — unimplemented, awaiting owner scope ruling.
- Audio: monster/login/bgm still stubs — modem-load pass + VoiceStudio replacement is delegated but audio creds are MISSING per omega-spiral-environment; only procedural WebAudio is allowed. Grill whether to leave stubbed.

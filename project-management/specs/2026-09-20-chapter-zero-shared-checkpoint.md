# Chapter Zero — shared checkpoint, creative-safe tests, and independent audio

## Problem Statement

The playable opening lives in a dirty working branch, so continuing the game and adding audio risk interfering with each other. An unfinished floor-rewrite transition blocks a trustworthy checkpoint. Some tests assert draft dialogue, scene counts, or art choices instead of proving the game works. Agents can spend their budget rediscovering decisions rather than shipping bounded, independently checked changes.

This specification records the owner's September 20, 2026 direction. It does not claim the whole demo or the audio pass is complete.

## Solution

Publish a mechanically verified opening-to-gameplay checkpoint to main. Complete the existing advancing-floor rewrite, remove creative-locking assertions without hiding real defects, and preserve the existing authored content. Continue game development from that shared checkpoint while audio is implemented and independently debugged in isolated worktrees. Keep technical correctness automated and creative acceptance in human review.

## User Stories

1. As the owner, I want a usable main checkpoint so development can continue without waiting for intro polish.
2. As a player, I want the opening to accept input and display the currently authored choices without crashes.
3. As a player, I want reading and existential questions to remain untimed.
4. As a player, I want to cross the formed door and control the character in the next scene.
5. As a player, I want movement, interaction, pause, and restart to work without stale input.
6. As a player, I want a visible interruption between floors rather than an unexplained seamless swap.
7. As a player, I want the next script to apply only when I continue, retaining my current-run decisions.
8. As the owner, I want changing prose, scene content, art, or sound design not to break tests merely because the draft changed.
9. As a developer, I want asset loading and rendering failures to fail tests even when creative assertions are removed.
10. As a developer, I want bot tests to use real input and current content, not teleportation or hardcoded story outcomes.
11. As the owner, I want a Luna test audit to make the suite smaller and more mechanical, not introduce a new testing framework.
12. As a player, I want modem sounds to evolve through broken synthetic speech into clearer Omega speech near the doorway.
13. As a player, I want a restrained background music/ambience layer that does not obscure voices.
14. As the owner, I want Omega and the existing provisional Dreamweaver asides voiced without rewriting them or exposing identities.
15. As the owner, I want VoiceStudio used instead of ElevenLabs for local voice generation.
16. As the owner, I want missing local dependencies/free models installed where permitted, with no paid service or administrator changes.
17. As a player, I want mute, volume, pause, visibility changes, replay, and scene teardown to affect all audio consistently.
18. As a developer, I want an independent debugger to reproduce playback and lifecycle failures instead of trusting the implementer's report.
19. As the director, I want each worker to have explicit ownership, supplied alignment answers, and permission to return up to three blocking questions before wasting time scanning.
20. As the owner, I want verified changes committed and pushed without sweeping in unrelated assets, secrets, recordings, or another worker's unfinished changes.
21. As the owner, I want the remaining five-scene/three-stage direction retained without treating unresolved Stage 3 drafts as approved canon.

## Implementation Decisions

- The director owns completing the existing floor-rewrite runtime and publishing the shared checkpoint. An independent Luna worker owns the creative-locking test audit and narrowly scoped test edits. No simultaneous writes to the same files.
- A rewrite is a real intermediate state: movement and encounter input stop, current progress stays intact, a visible script/loading presentation appears, and explicit continuation applies the next floor. Text is displayed, never evaluated as code.
- Preserve existing narrative content. This task does not authorize a rewrite of Omega's lines, new Dreamweaver dialogue, portraits, identity exposition, or a new art direction.
- Automated tests protect behavior, not the draft: input gates, loading/decoding, render availability, actual traversal, valid state transitions, pause/reset, error handling, and audio playback/lifecycle. Use neutral fixtures for core rules; derive navigation from current runtime data where appropriate.
- Remove assertions requiring exact prose, canonical JSON equality, fixed story/scene/question counts, specific colours or art styles, exact asset hierarchies, or artistic screenshot baselines. Screenshots and recordings remain diagnostic evidence, not creative approval gates.
- VoiceStudio's installed executable is the specified provider entrypoint. Inspect installed capabilities and documented local interfaces; do not guess an API or silently switch back to ElevenLabs. Use fictional/synthetic voices, not impersonation.
- Approved audio evolution: modem signals, broken synthetic speech, then clear Omega near the door. Include existing provisional Dreamweaver asides; voicing them does not make their wording final canon.
- Local dependencies and needed free models are authorized; paid services, administrator changes, secret handling, profile changes, and unrelated system reconfiguration are not. Record actual setup/downloads and license/provenance. Report unsupported sound/music generation honestly; distinguish local synthesis from VoiceStudio output.
- GPT-5.3-Codex was rejected by this login. GPT-5.5 medium was successfully probed as the implementation fallback. A separate Luna medium worker owns independent debug/profiling and a concrete list of what the director still must install, fix, or test.
- Audio begins from the published shared checkpoint in an isolated worktree; the debugger examines stable snapshots, not moving production files. Use separate loopback ports and output directories. Never reuse a different worktree's running server as evidence.
- Prefer existing audio/settings/input/test infrastructure and native Web Audio. No speculative abstraction layer or additional dependency without a demonstrated need.
- Main publication requires clean mechanical verification and independent review. Respect remote divergence and branch protection; no force push, admin bypass, deployment, or unrelated changes. Read back the exact remote commit before claiming publication.

## Testing Decisions

The primary integration seam is the existing browser opening-to-door-to-playable-scene journey. Pure state-machine tests cover neutral mechanics beneath it. No new testing framework is needed.

- Unit checks: valid input, finite movement, boundaries, reset, deterministic generic rules, and preservation of decisions through an advancing rewrite. Do not assert a named Dreamweaver's draft dialogue or freeze a provisional narrative scoring outcome.
- Browser checks: real keyboard/button input; assets load without network/decode errors; scene renders; door traversal enters controllable gameplay; rewrite visibly interrupts play and waits for input; pause prevents actions; continue changes the playable state; restart clears run state.
- Audio checks after implementation: a real gesture unlocks the context; decoded/generated audio reaches the runtime playback path; pause/mute/teardown stop or silence it; replay does not stack loops; missing assets fail visibly. Do not treat a boolean stub or a successful HTTP fetch alone as proof of playback. Artistic voice/music quality remains human audition.
- Exercise desktop keyboard and a narrow viewport without implying touch/mobile certification. Reduced motion must preserve usable transitions.
- Exact repository gates: `npm run typecheck`, `npm run test:unit`, `npm run build`, focused Playwright tests, and `git diff --check`. No invented lint command. Save actual failures as well as successes.
- Fresh baseline observations: unit suite passed, typecheck failed on stale test narrowing, and the floor browser path failed because rewrite diagnostics/UI were incomplete. These are real blockers, not creative-test locks.

## Execution Contract and Acceptance

Owning workflow: threejs-game-director, with threejs-debug-profiler for the director's rewrite fix, ponytail-audit followed by the explicitly authorized test cleanup for Luna, threejs-audio-generator for audio, and threejs-qa-release for verification.

Required references: current task handoff and project status/board; the Ghost Terminal runtime and source material; Chapter Zero stage documents as creative pseudocode; existing opening/door tests and diagnostics; relevant skill references. Related GitHub issues: #32 and #34; this spec does not close them.

Exclusive ownership: director — production opening/post-door runtime and publication; audit worker — tests and its audit evidence only; audio implementer — audio runtime/assets and minimal trigger integration on its isolated branch; debugger — its own verification artifacts/tests against a stable audio snapshot, never concurrent production edits.

- [ ] Unfinished floor rewrite works end to end and preserves progress until explicit continuation.
- [ ] Luna's test audit removes creative locks while retaining meaningful mechanical failures.
- [ ] Runtime checks, typecheck, units, build, and independent review pass for the exact publication candidate.
- [ ] Verified checkpoint is on remote main, confirmed by reading back the commit.
- [ ] Audio branch starts from that shared checkpoint and does not block further gameplay work.
- [ ] Real VoiceStudio setup/generation evidence, audio integration, and asset provenance are delivered.
- [ ] Independent audio debugging reports reproduced results and remaining installation/testing gaps.

Dependencies: checkpoint publication is blocked by rewrite repair, mechanics-test cleanup, and verification. Audio integration is based on that checkpoint. Final audio review depends on a stable implementation snapshot; baseline/debug preparation can run independently. Later gameplay development does not depend on audio completion.

## Out of Scope

Completing the entire five-scene demo in this checkpoint; choosing between conflicting Stage 3 scripts; redesigning combat, scoring, dialogue, art, or the door; migrating the renderer; paid services; administrator changes; broad dependency refactors; deployment. Do not reopen completed merge work or restart timed-out workers without a new bounded assignment.

## Further Notes

Continuation direction: one intact opening, three Dreamweaver-owned NetHack-style floors, and a later Stage 3 scene across three stages. Every text decision is intended to offer Dreamweaver-aligned choices with invisible attunement; intermediate reboots advance Omega's rewritten script; initial combat is impossible and later revisions introduce attack; final attunement leads to an in-world crash and a clean demo restart. These are future creative/gameplay requirements, not claims of current completion or excuses to freeze draft words in tests.

Stage 3 still contains competing township and party-building drafts. Resolve that creative decision before authorizing its implementation. Further slices need fresh alignment before adding mechanics. The opening audio alignment answers are settled above and should not be repeatedly re-asked.

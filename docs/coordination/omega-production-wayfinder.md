# Omega Spiral Production Wayfinder

**Destination:** Ship the complete Alpha 0.1 loop, let the user review it, then build the Blender-led Alpha 0.2 showcase pass.

**Live authority:** The DSH task board owns current work. This page is the shared role map. The master design spec owns product decisions.

```text
                         USER / DESIGN OWNER
             scope · taste · budget · push/deploy approval
                                  |
                                  v
                         CAPTAIN / INTEGRATOR
              plan · interfaces · decisions · final review
              gameplay integration · Blender/Affinity work
                                  |
              +-------------------+-------------------+
              |                   |                   |
              v                   v                   v
        SETUP + CODE         VISUAL ASSETS          QA / REVIEW
        Sol worker           Terra draft            Sol verifier
        Git/toolchain             |                 browser evidence
        focused modules           v                 contract checks
                              Sol polish
                                  |
                                  v
                         Modlens vision review
                                  |
                                  v
                         Captain pixel review
                                  |
                      accept or repeat (max 3)
              +-------------------+-------------------+
                                  |
                                  v
                       CAPTAIN INTEGRATES + VERIFIES
                                  |
                                  v
                         USER REVIEWS THE BUILD
```

## Roles

| Role | Owns | Returns |
|---|---|---|
| User / Design Owner | Product direction, taste calls, scope changes, remote push and deployment | Approval or a concise correction |
| Captain / Integrator | Plans, interfaces, integration, browser playthrough, final visual judgment, release evidence | Working build, limitations, next decision |
| Captain / Blender Operator | Install/access software allowed by `threejs-game-director`; interactive Blender, Affinity, computer-use tools, exports, target-camera checks | Saved source, export, hashes, captures |
| Sol Setup/Builder | Git/toolchain setup, architecture-sensitive code, scripts, manifests, focused implementation | Files, commands, tests, `CHECK-IN v1` |
| Terra | First visual draft for one locked asset brief | Immutable draft plus prompt/construction record |
| Sol Asset Polish | Convert Terra direction into procedural/code/2D/Blender-support candidate; interactive Blender stays with captain | Versioned candidate and in-engine captures |
| Modlens Critic | Independent pixel-based visual critique using `modlens-openrouter/xiaomi/mimo-v2.5-pro` | Pass/revise evidence; no edits |
| Mimo | Documentation, task clarity, focused general work | Bounded edits or ranked findings |
| Sol Verifier | Independent contract and evidence review | Pass or structured findings |
| Nemo | Exact-location installs only when its route becomes available | Currently unavailable; never silently replaced |
| DeepSeek 4.1 | Long creative build only when its route becomes available and approved docs were fact-checked | Currently unavailable; never silently replaced |

## Work Lanes

```text
LANE A  Foundation
        Git → npm lock → Vite/TypeScript/Three.js → tests → worktree

LANE B  Complete Alpha 0.1
        state/input → town/eras → terminal/exploration → action/rewind
        → party → fracture routes → threshold/bridge/collapse

LANE C  Visual Loop
        Terra → Sol → in-engine capture → Modlens → captain
        repeat only when the captain rejects visible evidence

LANE D  Release
        real-input bot → human pacing run → production build
        → screenshots/motion/renderer evidence → user review

LANE E  Alpha 0.2
        captain Blender production → validated GLBs → audiovisual polish
        → optimization → showcase evidence
```

## Handoff Rule

Small, precise, independent tasks use normal subagents by default; AgentTeams is reserved for work that genuinely needs a shared roster and dependency graph. Every delegated prompt names the exact applicable `threejs-*` skill, requires the worker to call and fully follow it, supplies exact source documents, writable paths, completion criteria, and verification commands, and forbids invented paths, capabilities, or evidence. Raw logs remain in worker context. The captain receives changed files, observed evidence, decisions, risks, and a bounded handoff.

## Good-Enough Rule

The plans are executable starting maps, not permanent law. Begin building once the required files exist. Improve details when play, tests, screenshots, or the user reveal a concrete problem. Do not add another preflight pass merely to make planning feel complete.

## How to Talk About This Map

Use role or lane names:

- “Move Foundation forward.”
- “Send the player asset through the Visual Loop again.”
- “Captain takes Blender now.”
- “Accept this Alpha 0.1 rough edge; promote it to Alpha 0.2.”
- “Pause Release until I review the build.”
- “Replace Modlens only with this exact approved reviewer route.”

## Current Route

1. Finish the two Alpha plans at good-enough execution depth.
2. Delegate Foundation setup.
3. Build the complete Alpha 0.1 loop in vertical slices.
4. Use the Visual Loop on representative authored surfaces, not every trivial prop.
5. Captain integrates, plays, and captures evidence.
6. User reviews Alpha 0.1 while Alpha 0.2 Blender work begins.

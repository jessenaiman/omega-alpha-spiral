# Omega Spiral Alpha 0.2 Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Alpha 0.1 signature visuals and synthesized presentation with validated Blender assets, production rendering, authored UI, production audio, selected voiced lines, and fresh evidence while preserving the complete Alpha 0.1 game.

**Architecture:** Keep `Game`, `RunState`, the six phase controllers, fixed update order, four input intents, collision semantics, and typed gameplay events unchanged. Deepen the existing `GameVisual` seam so the Alpha 0.1 procedural adapter and the Alpha 0.2 manifest-backed GLB adapter produce the same runtime object; preload accepted immutable assets before gameplay and fail visibly rather than silently downgrading. Rendering, UI, audio, and VFX remain event-driven presentation modules, and only captain-accepted asset versions enter the static release manifest.

**Tech Stack:** Node 24.20.0, npm 12.0.2, TypeScript 7.0.2, Vite 8.3.0, Three.js 0.186.0, Playwright 1.63.0, `tsx` 4.23.13, `pngjs` 7.0.0, glTF Transform 4.5.0, Blender 5.2.1 LTS, FFmpeg 8.1.1, native Web Audio.

**Spec:** `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`; `docs/game/design-brief.md`; `docs/game/core-loop-contract.md`; `docs/game/level-encounter-plan.md`; `docs/game/art-direction.md`; `docs/game/audio-matrix.md`; `docs/superpowers/plans/2026-09-15-omega-spiral-alpha-0-1.md`.

## Global Constraints

- Target repository: `C:\SpiralDrive\omega-alpha-spiral`.
- Captain owns all software installation, interactive Blender/Affinity/computer-use work, saved-source validation, and final pixel decisions. The user authorizes installing/accessing software required by `threejs-game-director`. Agents may prepare exact briefs, scripts, manifests, code, and reviews; they never claim interactive tool results. Captain's pre-engine inspection and DCC operation are technical handoff work, not early asset approval; the final accept/reject decision remains after fresh Modlens review.
- Every delegated prompt names the exact applicable `threejs-*` skill, requires the worker to call and fully follow it, and forbids invented paths, capabilities, or evidence. Use normal subagents for small precise tasks.
- Execution starts only after Alpha 0.1 Task 16 passes, its release commit is approved, and the working tree is clean. Alpha 0.1 remains independently playable and reviewable.
- Do not rewrite gameplay rules, phase gates, timing, controls, town coordinates, collision outcomes, affinity, party selection, routes, pairing, collapse, seeded randomness, or the fixed update order.
- Controls remain Move, Dash, Contextual Act, and Pause. Desktop keyboard and standard gamepad remain the supported gameplay targets; full touch gameplay remains out of scope.
- Static browser release only. Do not add a backend, database, Electron shell, Python runtime, CDN runtime import, network gameplay dependency, or runtime AI.
- Use npm and the existing lockfile. Do not add a package when Node, browser, Blender, FFmpeg, Three.js, or the already-installed dependencies cover the requirement.
- Blender production sources use Blender 5.2.1 LTS, metric units, one meter per unit, explicit named export collections, intentional pivots, and immutable versioned `.blend` files.
- The supplied `spacecraft.glb` remains teaching material only. Its unintended `Cube` and fifth material disqualify it from the production manifest.
- Repeated town volume stays procedural and instanced. Blender is reserved for the player, four Echoes, three Dreamweavers, Archive, refuge, threshold platform, gate/bridge, and hero props inside those landmark files.
- Runtime motion remains simulation-driven. Character clips are in-place; imported horizontal root motion cannot move gameplay bodies or double-apply displacement. If an optional provider supplies root motion, never request `animate_in_place`; neutralize only horizontal X/Z values on the top root position track, preserve vertical motion and twist-bone tracks, then validate the final Blender/GLB clips.
- Every visual asset follows `LOCKED BRIEF -> TERRA DRAFT -> SOL POLISH -> IN-ENGINE PROOF -> VISION REVIEW -> CAPTAIN REVIEW`. The exact routes are `openai-codex/gpt-5.6-terra`, `openai-codex/gpt-5.6-sol`, and the user-approved Modlens critic `modlens-openrouter/xiaomi/mimo-v2.5-pro`. Record Modlens under its real identity; never call it Flash.
- Re-run route discovery before Round 1. If an exact route is unavailable, do not substitute. Preserve existing outputs, mark the asset provisional, omit it from the accepted manifest, and continue unrelated work.
- Terra, Sol, and Modlens never approve their own work. Captain must inspect source pixels and target-use captures after Modlens. Reviewer prose alone is not approval.
- Lock and approve Archive as the representative Blender asset before expanding to the asset family. Maximum three complete rounds per brief; a fourth requires a new captain check-in.
- Never overwrite a Terra draft, Sol candidate, `.blend`, raw GLB, optimized GLB, capture, review, or decision. Rejection starts a new complete round with targeted in-scope findings.
- Manual Blender authoring is the sufficient default 3D path. External image-to-3D or rigging is optional and cannot become a hidden release dependency.
- Affinity 3.2.3.4646 is installed at `C:\Program Files\WindowsApps\Canva.Affinity_3.2.3.4646_x64__8a0j1tnjnt4a4` and is optional for 2D cleanup only. Installation is not automation. Claim an Affinity edit only after a controllable workflow produces a saved export that is reopened and captured as evidence; otherwise Sol creates standards-compliant SVG/PNG/WebP for an honest human round-trip. Affinity availability never blocks Blender work, Alpha 0.1, or the non-Affinity Alpha 0.2 path.
- No potentially chargeable provider submission occurs without explicit generation authorization in that asset brief. An approved Tripo path first runs `python "C:\Users\jesse\.agents\skills\threejs-3d-generator\scripts\threejs_3d_asset.py" probe`, uses one immutable checkpoint per asset/stage, stops after the model for pixel/mesh inspection, validates a rig before retargeting, and resumes the existing checkpoint. Ambiguous submissions require task-history reconciliation; never issue a duplicate paid request. Provider output still passes Blender named-collection export, optimization-copy, clean re-import, runtime-camera, motion, Modlens, and captain gates.
- Accepted runtime GLBs are local, versioned, hash-pinned, and referenced by `public/assets/showcase-manifest.json`. Development review copies never enter `dist/`.
- Missing or invalid required production assets show the required-asset error state. Production never silently selects the procedural adapter.
- The Three.js graphics reference targets an earlier revision in places; validate every addon import, renderer setting, shader, and disposal path against locked Three.js 0.186.0 rather than downgrading.
- Alpha 0.2 showcase floor: all ten visual-scorecard categories are at least 2, at least six are 3, average is at least 2.7, and no automatic failure remains.
- Desktop active-play hard budgets: at most 300 draw calls, 750,000 triangles, 300 geometries, 60 textures, 256 MiB estimated decoded texture memory, two shadow-casting lights, 2048 maximum shadow-map dimension, DPR cap 2, and two added post passes. Target 60 FPS; any frame-time tradeoff must be measured, classified, and accepted explicitly.
- Mobile is not a gameplay target. A non-shipping mobile reference profile may be measured at at most 150 calls, 300,000 triangles, 200 geometries, 40 textures, 128 MiB estimated texture memory, one shadow light, 1024 maps, DPR 1.5–2, and zero or one added post pass; it cannot replace desktop proof.
- Before/after comparisons use the same revision-labelled run conditions, seed 42, state, camera, viewport, DPR, quality profile, and production-preview server. Animation evidence is unpaused.
- Every code behavior follows RED, GREEN, REFACTOR. Record the observed RED output before production changes and the observed GREEN output after the minimum implementation.
- Every task ends with focused verification, one `CHECK-IN v1`, and one focused Conventional Commit. A skipped optional task records a decision instead of creating a code commit.
- No remote push or deployment occurs without explicit user confirmation during the execution turn.

## Stable Asset Set and Per-Asset Budgets

| Asset ID | Named Blender collection | Required production role | Maximum triangles | Maximum materials | Maximum texture images | Required motion |
|---|---|---|---:|---:|---:|---|
| `archive` | `EXPORT_archive` | stacked hero Archive, interior records, restore state, embedded hero props | 110,000 | 6 | 8 at 2048px | static restore state |
| `player` | `EXPORT_player` | 32px-readable asymmetric mantle and Omega aperture | 45,000 | 4 | 4 at 2048px | `idle`, `move`, `dash`, `act`, `fail` |
| `echo-fighter` | `EXPORT_echo-fighter` | shield wedge, guard and break readability | 35,000 | 4 | 4 at 2048px | `idle`, `move`, `act` |
| `echo-scribe` | `EXPORT_echo-scribe` | tablet/ribbon silhouette, preserve and reveal | 35,000 | 4 | 4 at 2048px | `idle`, `move`, `act` |
| `echo-thief` | `EXPORT_echo-thief` | low split cloak, hooks/blade, bypass and reposition | 35,000 | 4 | 4 at 2048px | `idle`, `move`, `act` |
| `echo-weaver` | `EXPORT_echo-weaver` | forked staff/thread spool, stabilize and redirect | 35,000 | 4 | 4 at 2048px | `idle`, `move`, `act` |
| `dreamweaver-luminary` | `EXPORT_dreamweaver-luminary` | continuous silver-white arc | 20,000 | 2 | 2 at 2048px | runtime material/transform motion |
| `dreamweaver-shadow` | `EXPORT_dreamweaver-shadow` | doubled amber fractured trace | 20,000 | 2 | 2 at 2048px | runtime material/transform motion |
| `dreamweaver-ambition` | `EXPORT_dreamweaver-ambition` | angular red filament blade | 20,000 | 2 | 2 at 2048px | runtime material/transform motion |
| `refuge` | `EXPORT_refuge` | rounded shelter, warm interior, evacuation readability, embedded hero props | 70,000 | 5 | 6 at 2048px | static protect/restore state |
| `threshold-platform` | `EXPORT_threshold-platform` | three distinct approach locations and hold zones | 55,000 | 4 | 4 at 2048px | static carry state |
| `gate-bridge` | `EXPORT_gate-bridge` | passable gate, worn bridge, coherent-glimpse hero span, embedded hero props | 90,000 | 6 | 8 at 2048px | static crossed/resolved state |

These per-asset ceilings are intake limits, not permission to reach every maximum simultaneously. Start non-hero maps at 1024px, pack roughness/metalness/AO into one linear ORM image, share approved atlases across Echoes/landmarks, and raise a map to 2048px only when the real camera proves a visible need. The integrated renderer and 256 MiB decoded-texture budgets remain authoritative.

## Asset Acceptance Record

The representative Archive owns this exact Round 1 record:

```text
artifacts/assets/archive/brief-v001.md
artifacts/assets/archive/ledger.json
artifacts/assets/archive/prompts/terra-r001.txt
artifacts/assets/archive/prompts/sol-r001.txt
artifacts/assets/archive/reviews/modlens-r001.json
artifacts/assets/archive/decisions/captain-r001.md
artifacts/assets/archive/captures/source-r001.png
artifacts/assets/archive/captures/runtime-r001.png
artifacts/assets/archive/captures/silhouette-r001.png
artifacts/assets/archive/captures/turntable-r001.webm
artifacts/assets/archive/intake-r001.json
artifacts/assets/archive/exports/archive-r001-raw.glb
artifacts/assets/archive/exports/archive-r001-opt.glb
artifacts/assets/archive/reports/archive-r001-raw-inspect.txt
artifacts/assets/archive/reports/archive-r001-opt-inspect.txt
artifacts/assets/archive/reports/archive-r001-reimport.json
assets/concepts/archive/terra-r001.png
assets/concepts/archive/sol-r001.png
art-src/blender/archive/archive_v001.blend
public/assets/models/archive/archive-r001.glb
```

The remaining Round 1 roots and immutable binary paths are exact:

| ID | Artifact root | Blender source | Raw and optimized evidence | Accepted runtime GLB |
|---|---|---|---|---|
| `player` | `artifacts/assets/player/` | `art-src/blender/player/player_v001.blend` | `exports/player-r001-raw.glb`, `exports/player-r001-opt.glb` | `public/assets/models/player/player-r001.glb` |
| `echo-fighter` | `artifacts/assets/echo-fighter/` | `art-src/blender/echo-fighter/echo-fighter_v001.blend` | `exports/echo-fighter-r001-raw.glb`, `exports/echo-fighter-r001-opt.glb` | `public/assets/models/echo-fighter/echo-fighter-r001.glb` |
| `echo-scribe` | `artifacts/assets/echo-scribe/` | `art-src/blender/echo-scribe/echo-scribe_v001.blend` | `exports/echo-scribe-r001-raw.glb`, `exports/echo-scribe-r001-opt.glb` | `public/assets/models/echo-scribe/echo-scribe-r001.glb` |
| `echo-thief` | `artifacts/assets/echo-thief/` | `art-src/blender/echo-thief/echo-thief_v001.blend` | `exports/echo-thief-r001-raw.glb`, `exports/echo-thief-r001-opt.glb` | `public/assets/models/echo-thief/echo-thief-r001.glb` |
| `echo-weaver` | `artifacts/assets/echo-weaver/` | `art-src/blender/echo-weaver/echo-weaver_v001.blend` | `exports/echo-weaver-r001-raw.glb`, `exports/echo-weaver-r001-opt.glb` | `public/assets/models/echo-weaver/echo-weaver-r001.glb` |
| `dreamweaver-luminary` | `artifacts/assets/dreamweaver-luminary/` | `art-src/blender/dreamweaver-luminary/dreamweaver-luminary_v001.blend` | `exports/dreamweaver-luminary-r001-raw.glb`, `exports/dreamweaver-luminary-r001-opt.glb` | `public/assets/models/dreamweaver-luminary/dreamweaver-luminary-r001.glb` |
| `dreamweaver-shadow` | `artifacts/assets/dreamweaver-shadow/` | `art-src/blender/dreamweaver-shadow/dreamweaver-shadow_v001.blend` | `exports/dreamweaver-shadow-r001-raw.glb`, `exports/dreamweaver-shadow-r001-opt.glb` | `public/assets/models/dreamweaver-shadow/dreamweaver-shadow-r001.glb` |
| `dreamweaver-ambition` | `artifacts/assets/dreamweaver-ambition/` | `art-src/blender/dreamweaver-ambition/dreamweaver-ambition_v001.blend` | `exports/dreamweaver-ambition-r001-raw.glb`, `exports/dreamweaver-ambition-r001-opt.glb` | `public/assets/models/dreamweaver-ambition/dreamweaver-ambition-r001.glb` |
| `refuge` | `artifacts/assets/refuge/` | `art-src/blender/refuge/refuge_v001.blend` | `exports/refuge-r001-raw.glb`, `exports/refuge-r001-opt.glb` | `public/assets/models/refuge/refuge-r001.glb` |
| `threshold-platform` | `artifacts/assets/threshold-platform/` | `art-src/blender/threshold-platform/threshold-platform_v001.blend` | `exports/threshold-platform-r001-raw.glb`, `exports/threshold-platform-r001-opt.glb` | `public/assets/models/threshold-platform/threshold-platform-r001.glb` |
| `gate-bridge` | `artifacts/assets/gate-bridge/` | `art-src/blender/gate-bridge/gate-bridge_v001.blend` | `exports/gate-bridge-r001-raw.glb`, `exports/gate-bridge-r001-opt.glb` | `public/assets/models/gate-bridge/gate-bridge-r001.glb` |

Every artifact root contains the exact Round 1 leaves `brief-v001.md`, `ledger.json`, `prompts/terra-r001.txt`, `prompts/sol-r001.txt`, `reviews/modlens-r001.json`, `decisions/captain-r001.md`, `captures/source-r001.png`, `captures/runtime-r001.png`, `captures/silhouette-r001.png`, `captures/turntable-r001.webm`, `intake-r001.json`, `reports/asset-r001-source.json`, `reports/asset-r001-raw-inspect.txt`, `reports/asset-r001-opt-inspect.txt`, and `reports/asset-r001-reimport.json`, where the report filename's `asset` token is the ID in that row. The ledger records actual dimensions, hashes, model routes, paths, job IDs, and provider checkpoints only after they are observed. An attachment label is never recorded as a path.

The six-criterion Modlens rubric is `briefFidelity`, `silhouetteReadability`, `compositionAndValue`, `authoredDetail`, `technicalCleanliness`, and `runtimeFit`. Pass requires every score at least 2, average at least 2.3, no blocker or high finding, and every technical acceptance check passing. Captain acceptance is a separate recorded decision.

---

### Task 1: Open the Alpha 0.2 Worktree and Freeze Comparable Alpha 0.1 Evidence

**Files:**
- Create: `.worktrees/alpha-0.2-showcase/` from the approved Alpha 0.1 release commit
- Create: `artifacts/alpha-0-2-before-1/evidence.json`
- Create: `artifacts/alpha-0-2-before-1/scorecard.md`
- Create: `artifacts/alpha-0-2-before-1/archive-crossing-motion.webm`
- Create: `artifacts/alpha-0-2-before-1/finale-motion.webm`
- Create: `artifacts/alpha-0-2-comparison.md`
- Modify: `artifacts/game-progress.md`

**Consumes:** approved Alpha 0.1 release commit, Alpha 0.1 `window.__THREE_GAME_TEST_HOOKS__`, diagnostics, production build, evidence states.

**Produces:** isolated `feat/alpha-0.2-showcase` worktree; immutable performance and visual baseline at seed 42; recorded base commit hash and capture conditions.

- [ ] **Step 1: Verify the prerequisite instead of repairing Alpha 0.1 here**

```powershell
Set-Location C:\SpiralDrive\omega-alpha-spiral
git status --short
git log -1 --format='%H %s'
npm ci
npm run typecheck
npm run test:unit
npm run test:browser
npm run build
python "C:\Users\jesse\.agents\skills\threejs-game-director\scripts\check_evidence.py" . --manifest artifacts/evidence.json --report artifacts/final-evidence.md
```

Expected gate: the working tree is clean, the last approved commit is the Alpha 0.1 release basis, every command exits 0, and `dist/` is current. If any condition fails, stop this plan and return the failure to the Alpha 0.1 owner; do not fold gameplay repair into Alpha 0.2.

- [ ] **Step 2: Create the isolated worktree**

Use the `using-git-worktrees` skill. Confirm `.worktrees/` is ignored before creation.

```powershell
git check-ignore -q .worktrees
if ($LASTEXITCODE -ne 0) { throw '.worktrees is not ignored' }
git worktree add .worktrees/alpha-0.2-showcase -b feat/alpha-0.2-showcase HEAD
Set-Location C:\SpiralDrive\omega-alpha-spiral\.worktrees\alpha-0.2-showcase
npm ci
git status --short
```

Expected: a clean branch at the exact approved Alpha 0.1 hash.

- [ ] **Step 3: Capture the unchanged production-preview baseline**

Build, then start `npm run preview` as a managed background job at `http://127.0.0.1:4188/`. Confirm the served commit in diagnostics before capture.

```powershell
npm run build
$states = @(
  'ghost-terminal','exploration-active','archive-crossing','formation-party',
  'fracture-memory','fracture-bodies','threshold-luminary','threshold-shadow',
  'threshold-ambition','bridge-logo','loop-restart','pause-settings',
  'reduced-motion-fracture'
)
foreach ($state in $states) {
  node "C:\Users\jesse\.agents\skills\threejs-qa-release\scripts\inspect-threejs-canvas.mjs" --url http://127.0.0.1:4188/ --out artifacts/alpha-0-2-before-1 --state $state --seed 42 --run-id alpha-0-2-before-1
  if ($LASTEXITCODE -ne 0) { throw "Baseline capture failed: $state" }
}
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state archive-crossing --seed 42 --duration 18 --out artifacts/alpha-0-2-before-1/archive-crossing-motion.webm
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state threshold-luminary --seed 42 --duration 16 --out artifacts/alpha-0-2-before-1/finale-motion.webm
```

Expected: thirteen fresh nonblank inspector reports use its fixed 1280x720 desktop viewport, share run ID `alpha-0-2-before-1`, seed 42, and the same production-preview URL; two unpaused videos finalize after the browser context closes. These fixed reports are the direct before/after comparison set; Task 12 separately captures the spec-required final 1920x1080 and 1280x720 stills. Software-rendered reports remain valid for pixels and counts but not FPS. Stop the managed preview job after both videos finalize.

- [ ] **Step 4: Record the baseline scorecard and conditions**

`artifacts/alpha-0-2-before-1/evidence.json` declares the thirteen state/report pairs plus both motion files. `scorecard.md` records all ten category scores with a path and one evidence sentence per score. `artifacts/alpha-0-2-comparison.md` records base commit, viewport, DPR, browser channel/GPU, seed, state names, quality profile, renderer counts at Archive Crossing and bridge, and leaves the final section absent until Task 11. Do not infer missing measurements.

- [ ] **Step 5: Verify and commit the baseline**

```powershell
python "C:\Users\jesse\.agents\skills\threejs-game-director\scripts\check_evidence.py" . --manifest artifacts/alpha-0-2-before-1/evidence.json
npm run build
git add artifacts/alpha-0-2-before-1 artifacts/alpha-0-2-comparison.md artifacts/game-progress.md
git commit -m "chore: freeze Alpha 0.2 showcase baseline"
```

Expected GREEN: evidence validation passes and the commit contains no runtime code changes.

---

### Task 2: Deepen the Existing GameVisual Seam and Add a Fail-Closed Asset Registry

**Files:**
- Create: `src/assets/showcase-manifest.ts`
- Create: `src/assets/VisualRegistry.ts`
- Create: `src/assets/ShowcaseAssetRegistry.ts`
- Create: `src/assets/ReviewVisualRegistry.ts`
- Create: `src/assets/AnimationController.ts`
- Create: `public/assets/showcase-manifest.json`
- Modify: `src/visual/factories.ts`
- Modify: `src/world/TownWorld.ts`
- Modify: `src/game/Game.ts`
- Modify: `src/main.ts`
- Modify: `src/vite-env.d.ts`
- Create: `tests/unit/showcase-manifest.test.ts`
- Create: `tests/unit/showcase-registry.test.ts`
- Create: `tests/browser/required-asset-error.spec.ts`

**Consumes:** Alpha 0.1 `GameVisual`, `VisualState`, procedural factories, `TownWorld`, `Game`, fixed loop, renderer, required-asset UI state.

**Produces:** one real seam with two source adapters: existing procedural visuals and manifest-backed GLBs. A development-only composite uses selected GLBs plus procedural peers so one representative can be judged before family expansion. Public interface: `preload(ids)`, `create(id)`, `getDiagnostics()`, `dispose()`.

- [ ] **Step 1: Write RED manifest and registry tests**

Use these exact runtime IDs and assertions:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SHOWCASE_ASSET_IDS,
  parseShowcaseManifest,
} from '../../src/assets/showcase-manifest.js';

const UNPINNED_ARCHIVE = {
  url: 'models/archive/archive-r001.glb',
  sha256: '',
  sourceBlend: 'art-src/blender/archive/archive_v001.blend',
  exportCollection: 'EXPORT_archive',
  metersPerUnit: 1,
  up: '+Y',
  forward: '-Z',
  pivot: 'world-authored',
  bounds: { min: [-2, 0, -2], max: [2, 8, 2] },
  triangles: 1,
  meshes: 1,
  materials: 1,
  textures: [],
  clips: [],
  collisionProxy: { kind: 'compound-boxes', values: [0, 1, 0, 4, 2, 4] },
  nodes: ['ROOT_archive', 'COLLISION_archive'],
  ledger: 'artifacts/assets/archive/ledger.json',
  acceptedVersion: 'r001',
};

test('showcase asset IDs are the locked production set', () => {
  assert.deepEqual(SHOWCASE_ASSET_IDS, [
    'archive',
    'player',
    'echo-fighter',
    'echo-scribe',
    'echo-thief',
    'echo-weaver',
    'dreamweaver-luminary',
    'dreamweaver-shadow',
    'dreamweaver-ambition',
    'refuge',
    'threshold-platform',
    'gate-bridge',
  ]);
});

test('manifest parser rejects an unpinned GLB', () => {
  assert.throws(
    () => parseShowcaseManifest({
      version: 1,
      release: 'alpha-0.2',
      assets: { archive: UNPINNED_ARCHIVE },
    }),
    /archive.*sha256/i,
  );
});
```

The registry test owns an in-memory fetch adapter behind a test-only constructor; it does not enlarge the production interface. Add a browser test that opens `/?assetMode=showcase`, serves a manifest without `archive`, and asserts the visible required-asset error names `archive`, gameplay never starts, and no procedural player or town appears.

Run:

```powershell
npm run test:unit -- tests/unit/showcase-manifest.test.ts tests/unit/showcase-registry.test.ts
npx playwright test tests/browser/required-asset-error.spec.ts
```

Expected RED: parser, registry, and required-asset error behavior do not exist.

- [ ] **Step 2: Define the narrow interface and full manifest contract**

Put `GameVisual`, `VisualState`, and `VisualRegistry` in `src/assets/VisualRegistry.ts`; put asset IDs and JSON-only records in `src/assets/showcase-manifest.ts`. Move the Alpha 0.1 visual types without changing their meanings and add only frame update for animation:

```ts
import type * as THREE from 'three';

export const SHOWCASE_ASSET_IDS = [
  'archive', 'player', 'echo-fighter', 'echo-scribe', 'echo-thief', 'echo-weaver',
  'dreamweaver-luminary', 'dreamweaver-shadow', 'dreamweaver-ambition',
  'refuge', 'threshold-platform', 'gate-bridge',
] as const;

export type ShowcaseAssetId = (typeof SHOWCASE_ASSET_IDS)[number];
export type VisualState = 'idle' | 'move' | 'dash' | 'act' | 'danger' | 'fail';

export interface GameVisual {
  readonly group: THREE.Group;
  readonly collision: { readonly radius: number; readonly offsetY: number };
  setState(state: VisualState): void;
  update(dtSeconds: number): void;
  dispose(): void;
}

export interface RuntimeAssetRecord {
  readonly url: string;
  readonly sha256: string;
  readonly sourceBlend: string;
  readonly exportCollection: string;
  readonly metersPerUnit: 1;
  readonly up: '+Y';
  readonly forward: '-Z';
  readonly pivot: 'ground-center' | 'world-authored';
  readonly bounds: { readonly min: readonly [number, number, number]; readonly max: readonly [number, number, number] };
  readonly triangles: number;
  readonly meshes: number;
  readonly materials: number;
  readonly textures: ReadonlyArray<{ readonly name: string; readonly width: number; readonly height: number; readonly colorSpace: 'srgb' | 'linear' }>;
  readonly clips: ReadonlyArray<{ readonly name: string; readonly duration: number; readonly rootMotion: 'in-place' }>;
  readonly collisionProxy: { readonly kind: 'capsule' | 'box' | 'compound-boxes'; readonly values: readonly number[] };
  readonly nodes: readonly string[];
  readonly ledger: string;
  readonly acceptedVersion: string;
}

export interface ShowcaseManifest {
  readonly version: 1;
  readonly release: 'alpha-0.2';
  readonly assets: Partial<Record<ShowcaseAssetId, RuntimeAssetRecord>>;
}

export interface ShowcaseDiagnostics {
  readonly required: readonly ShowcaseAssetId[];
  readonly loaded: readonly ShowcaseAssetId[];
  readonly failures: ReadonlyArray<{ readonly id: ShowcaseAssetId; readonly message: string }>;
  readonly triangles: number;
  readonly geometries: number;
  readonly textures: number;
  readonly estimatedTextureBytes: number;
  readonly clips: Readonly<Record<string, readonly string[]>>;
}

export interface VisualRegistry {
  preload(ids: readonly ShowcaseAssetId[]): Promise<void>;
  create(id: ShowcaseAssetId): GameVisual;
  getDiagnostics(): ShowcaseDiagnostics;
  dispose(): void;
}
```

`parseShowcaseManifest(value)` accepts unknown input and validates every field, finite number, allowed enum, lower-case 64-character SHA-256, relative local `.glb` URL, source path, ledger path, unique node/clip/texture names, positive bounds, and intake ceilings. It rejects absolute URLs, schemes, traversal, `review/`, generic Blender names matching `Cube`, `Sphere`, `Cylinder`, or `Material` with optional numeric suffixes, non-GLB files, and unknown asset IDs.

- [ ] **Step 3: Implement the manifest-backed adapter with no production fallback**

`ShowcaseAssetRegistry` owns one `THREE.LoadingManager`, one `GLTFLoader`, the loaded templates, shared GPU resources, and all mixers. Configure Meshopt exactly once:

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader(loadingManager);
loader.setMeshoptDecoder(MeshoptDecoder);

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}
```

For each record, resolve `record.url` relative to the manifest URL, fetch once, require an OK response and `model/gltf-binary` or octet-stream-compatible MIME, hash the bytes before parse, then call `loader.parseAsync(bytes, new URL('.', resolvedUrl).href)`. Validate node names, clip names, clip durations, bounds within 1 millimeter of the manifest, texture dimensions, and meter scale. Use `SkeletonUtils.clone` only for skinned instances. Static landmarks share one template and shared materials. Registry owns final disposal; individual instances remove their groups and mixers without disposing shared resources.

`AnimationController` maps `VisualState` to exact clip names, crossfades over 0.12 seconds, advances mixers only from `GameVisual.update(dtSeconds)`, and keeps gameplay movement authoritative. Missing required clips fail intake rather than choosing clip index zero.

- [ ] **Step 4: Preserve the Alpha 0.1 caller contract**

Add no-op `update()` to procedural visuals. `TownWorld` receives one `VisualRegistry`, creates visuals by stable asset ID, calls `update` during its existing presentation update, and retains Alpha 0.1 collision proxies and interactable IDs. `Game` receives the selected adapter before construction. `main.ts` routes `RequiredAssetError` into the existing required-asset UI.

`ReviewVisualRegistry` is compiled only behind `import.meta.env.DEV`. It reads `public/assets/review/manifest.json`; `?assetReview=archive` loads that local review GLB and delegates every other ID to procedural factories; a comma-separated list reviews a cast or landmark set. `?assetMode=showcase` forces full-manifest preload in development for the required-asset error test. Development with no query remains procedural until all twelve assets exist. The review composite preserves the exact same collision and gameplay interfaces and reports which IDs are imported. Vite dead-code elimination must remove both query paths and the review adapter from the production bundle.

Production selection is unconditional:

```ts
const manifestUrl = new URL(`${import.meta.env.BASE_URL}assets/showcase-manifest.json`, document.baseURI);
const registry = await ShowcaseAssetRegistry.load(manifestUrl);
await registry.preload(SHOWCASE_ASSET_IDS);
const game = new Game({ canvas, registry });
game.start();
```

A development-only procedural switch must be guarded by `import.meta.env.DEV`; the emitted production bundle cannot contain a URL/query path that activates it.

- [ ] **Step 5: Extend diagnostics without exposing live Three.js objects**

Publish only owned scalar arrays and counts under `diagnostics.assets`. Add loaded IDs, failure messages, counts, clip names, total estimated decoded texture bytes, and manifest release/version. Do not serialize loaders, scenes, meshes, textures, materials, mixers, or renderer objects.

- [ ] **Step 6: Observe GREEN and commit**

```powershell
npm run test:unit -- tests/unit/showcase-manifest.test.ts tests/unit/showcase-registry.test.ts
npx playwright test tests/browser/required-asset-error.spec.ts
npm run typecheck
npm run build
git add src/assets src/visual/factories.ts src/world/TownWorld.ts src/game/Game.ts src/main.ts src/vite-env.d.ts public/assets/showcase-manifest.json tests/unit tests/browser/required-asset-error.spec.ts
git commit -m "feat: add validated showcase asset registry"
```

Expected GREEN: the pure tests pass, a missing required asset visibly stops startup, procedural tests still satisfy `GameVisual`, typecheck/build pass, and gameplay source files contain no changed domain constants.

---

### Task 3: Build the Blender 5.2 Named-Collection, Manifest, Optimization, and Clean-Reimport Gate

**Files:**
- Create: `scripts/blender/export_named_collection.py`
- Create: `scripts/blender/inspect_clean_reimport.py`
- Create: `scripts/validate-showcase-assets.ts`
- Create: `tests/fixtures/showcase-manifest-empty.json`
- Create: `tests/fixtures/showcase-manifest-valid.json`
- Create: `tests/fixtures/showcase-manifest-invalid.json`
- Create: `tests/unit/showcase-asset-validator.test.ts`
- Modify: `package.json`

**Consumes:** Blender 5.2.1 `bpy`, the twelve exact named collections in the budget table, raw/optimized GLBs, intake JSON, acceptance ledgers, glTF Transform 4.5.0.

**Produces:** reproducible raw export, inspection text, optimization copy, clean-scene re-import report, SHA/count verification, and release-level accepted-set validation.

- [ ] **Step 1: Write RED validation tests**

The valid fixture contains one `archive` record with a 64-character test hash and all required intake fields. The invalid fixture includes an absolute provider URL, an unapproved ledger state, an unintended `Cube`, and a hash mismatch. Assert that development validation accepts an empty but structurally valid runtime manifest, normal validation validates present records, and release validation requires all twelve locked IDs.

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAssetFiles } from '../../scripts/validate-showcase-assets.js';

test('release validation requires the complete accepted set', async () => {
  const result = await validateAssetFiles({
    projectRoot: process.cwd(),
    manifestPath: 'tests/fixtures/showcase-manifest-empty.json',
    release: true,
    verifyFiles: false,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Missing required asset: archive/);
});

test('invalid provider URL, generic node, ledger state, and hash all fail', async () => {
  const result = await validateAssetFiles({
    projectRoot: process.cwd(),
    manifestPath: 'tests/fixtures/showcase-manifest-invalid.json',
    release: false,
    verifyFiles: false,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /absolute URL|Cube|captain|SHA-256/i);
});
```

Run: `npm run test:unit -- tests/unit/showcase-asset-validator.test.ts`.

Expected RED: the validator module is absent.

- [ ] **Step 2: Implement one Node validator instead of duplicating manifest rules**

`validate-showcase-assets.ts` exports `validateAssetFiles({ projectRoot, manifestPath, release, verifyFiles })`, defaults `manifestPath` to `public/assets/showcase-manifest.json`, imports `parseShowcaseManifest`, uses Node `fs/promises` and `crypto`, and verifies:

1. every present asset has a real runtime GLB, intake JSON, ledger, captain decision, and clean-reimport report;
2. the GLB SHA-256 equals runtime manifest, intake manifest, and accepted ledger version;
3. `sourceBlend`, `exportCollection`, Blender version `5.2.1`, exporter version, unit/axis/pivot/bounds, nodes, raw and optimized counts, texture dimensions/color spaces, clips, collision proxy, and both GLB hashes exist;
4. optimized and raw paths differ and the raw file still matches its recorded hash;
5. Modlens route equals `modlens-openrouter/xiaomi/mimo-v2.5-pro`, its verdict passes the six-score gate, and captain decision is `ACCEPT`;
6. no accepted path points into a review directory or to a remote URL;
7. `--release` requires exactly the twelve locked IDs and rejects any additional ID.

Add scripts:

```json
{
  "scripts": {
    "asset:validate": "tsx scripts/validate-showcase-assets.ts",
    "asset:validate:release": "tsx scripts/validate-showcase-assets.ts --release",
    "test:showcase": "npm run asset:validate && tsx --test tests/unit/showcase-*.test.ts && playwright test tests/browser/showcase-*.spec.ts"
  }
}
```

Merge these entries into the existing `scripts` object; retain every Alpha 0.1 script.

- [ ] **Step 3: Implement the exact Blender export gate**

`export_named_collection.py` parses arguments only after `--`. Required arguments are `--asset-id`, `--collection`, `--out`, and `--report`. It exits nonzero unless Blender is exactly 5.2.1, the scene uses Metric units with scale length 1.0, the named collection exists exactly once, every exported mesh has applied scale `(1,1,1)`, the top-level asset origin follows its declared pivot, no exported object/material has a generic default name, and the collection contains its exact `COLLISION_` proxy (`COLLISION_archive`, `COLLISION_player`, `COLLISION_echo-fighter`, `COLLISION_echo-scribe`, `COLLISION_echo-thief`, `COLLISION_echo-weaver`, `COLLISION_dreamweaver-luminary`, `COLLISION_dreamweaver-shadow`, `COLLISION_dreamweaver-ambition`, `COLLISION_refuge`, `COLLISION_threshold-platform`, or `COLLISION_gate-bridge`) plus every socket declared by intake.

Use Blender's verified collection argument, not scene selection:

```py
result = bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format='GLB',
    collection=collection_name,
    use_active_scene=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_force_sampling=True,
    export_apply=True,
    export_yup=True,
)
if result != {'FINISHED'}:
    raise RuntimeError(f'glTF export failed: {sorted(result)}')
```

The script writes a JSON source report containing Blender/version, blend path, collection, export settings, units, source axes, target axes, objects, nodes, mesh/triangle/material/image/action counts, action durations, bounds, and raw SHA-256. Use `mesh.calc_loop_triangles()` for evaluated triangle counts and `hashlib.sha256()` for the file hash.

- [ ] **Step 4: Implement clean Blender re-import**

`inspect_clean_reimport.py` starts with `bpy.ops.wm.read_factory_settings(use_empty=True)`, imports exactly one optimized GLB, evaluates world-space bounds and triangles, enumerates meshes/materials/images/actions/nodes, checks expected clip names and in-place horizontal root translation, and compares the results to the intake JSON. It must reject generic names, missing collision/socket nodes, dimensions outside 1 millimeter tolerance, unbounded/NaN geometry, texture dimensions above the intake ceiling, and unexpected clips.

The report has `status: "pass"` only when every check passes and includes the optimized SHA-256. On failure it writes `status: "fail"`, a nonempty errors array, and exits 1.

- [ ] **Step 5: Prove the scripts fail safely before a source asset exists**

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/export_named_collection.py -- --asset-id archive --collection EXPORT_archive --out artifacts/assets/archive/exports/archive-r001-raw.glb --report artifacts/assets/archive/reports/archive-r001-source.json
```

Expected RED: nonzero exit naming the missing `EXPORT_archive` collection; no GLB is created.

Then run parser help paths and the Node fixture suite:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/export_named_collection.py -- --help
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/inspect_clean_reimport.py -- --help
npm run test:unit -- tests/unit/showcase-asset-validator.test.ts
npm run asset:validate
npm run typecheck
```

Expected GREEN: both help invocations exit 0, invalid fixtures fail for the asserted reasons, the structurally empty development manifest passes, and no production asset is falsely accepted.

- [ ] **Step 6: Commit the pipeline before using it**

```powershell
git add scripts/blender scripts/validate-showcase-assets.ts tests/fixtures tests/unit/showcase-asset-validator.test.ts package.json package-lock.json
git commit -m "build: validate Blender collection exports"
```

---

### Task 4: Pass the Complete Asset Loop for the Archive Representative

**Files:**
- Create: `artifacts/assets/archive/brief-v001.md`
- Create: `artifacts/assets/archive/ledger.json`
- Create: `artifacts/assets/archive/prompts/terra-r001.txt`
- Create: `artifacts/assets/archive/prompts/sol-r001.txt`
- Create: `assets/concepts/archive/terra-r001.png`
- Create: `assets/concepts/archive/sol-r001.png`
- Create: `art-src/blender/archive/archive_v001.blend`
- Create: `artifacts/assets/archive/intake-r001.json`
- Create: `artifacts/assets/archive/exports/archive-r001-raw.glb`
- Create: `artifacts/assets/archive/exports/archive-r001-opt.glb`
- Create: `artifacts/assets/archive/reports/archive-r001-source.json`
- Create: `artifacts/assets/archive/reports/archive-r001-raw-inspect.txt`
- Create: `artifacts/assets/archive/reports/archive-r001-opt-inspect.txt`
- Create: `artifacts/assets/archive/reports/archive-r001-reimport.json`
- Create: `artifacts/assets/archive/captures/source-r001.png`
- Create: `artifacts/assets/archive/captures/runtime-r001.png`
- Create: `artifacts/assets/archive/captures/silhouette-r001.png`
- Create: `artifacts/assets/archive/captures/turntable-r001.webm`
- Create: `artifacts/assets/archive/reviews/modlens-r001.json`
- Create: `artifacts/assets/archive/decisions/captain-r001.md`
- Create temporarily, then remove: `public/assets/review/archive-r001.glb`
- Create temporarily, then remove: `public/assets/review/manifest.json`
- Create after acceptance: `public/assets/models/archive/archive-r001.glb`
- Modify after acceptance: `public/assets/showcase-manifest.json`
- Create: `tests/browser/showcase-archive.spec.ts`

**Consumes:** locked Archive role/readability rules, `EXPORT_archive` pipeline, development review staging, `archive-crossing` test state, exact Terra/Sol/Modlens routes.

**Produces:** first captain-accepted Blender GLB and proof that the complete loop works before family expansion.

- [ ] **Step 1: Write the RED in-engine acceptance test**

The test opens `/?assetReview=archive`, enters `archive-crossing`, and asserts only Archive uses the manifest-backed bytes while its peers use the explicit development procedural adapter. It asserts `diagnostics.assets.loaded` contains `archive`, manifest hash equals the served GLB hash, the named root and `COLLISION_archive` exist, Archive is at `TOWN_LAYOUT.archive`, its silhouette height is at least 1.5 times player height, it is visible from both adjacent approach tiles, and the target verb remains `STABILIZE`, `DISRUPT`, or `GUARD` according to encounter state.

Run: `npx playwright test tests/browser/showcase-archive.spec.ts`.

Expected RED: `Required asset missing: archive`.

- [ ] **Step 2: Lock the Archive brief and ledger**

The brief fixes: stacked preservation silhouette; readable at the Town Space 55-degree orthographic camera; height at least 1.5 player heights; ground-centered world-authored pivot at `(-8,0,1)` placement; cold record strata with a controlled restored interior warmth; degraded and restored material states; hero props inside the same collection; no text baked into textures; no shape that resembles the sweep hazard; 110,000 triangles, 6 materials, 8 texture images at 2048px; one compound-box collision proxy; no cameras/lights; three rounds; paid calls only as explicitly approved.

Write this exact Terra construction prompt to `prompts/terra-r001.txt`:

```text
Create one original three-quarter game-camera concept for the Omega Spiral Archive hero landmark. Show a tall asymmetrical stack of preserved record strata, visible internal archive shelves, a ground-level resident-safe alcove, two readable anchor nodes, and one unmistakable restoration seam. The silhouette must remain distinct at gameplay size and at least 1.5 times the player height. Use cold desaturated preservation surfaces with restrained silver-white signal traces and a warm restored interior; do not use text, a square logo, generic sci-fi towers, circular sweep-hazard shapes, fog as structure, or bloom as structure. Frame the complete building at the locked Town Space 55-degree north-up camera with a 32-pixel player scale reference and clear walkable ground.
```

Initialize the ledger with the three exact routes, `state: "brief_locked"`, `maxRounds: 3`, actual authorization, empty versions, and `acceptedVersion: null`.

- [ ] **Step 3: Run Terra, then Sol, without role collapse**

Re-query `list_subagent_models(provider='openai-codex')` and `list_subagent_models(provider='modlens-openrouter')`; require the three exact model IDs pinned in Global Constraints. Terra receives only the locked brief and approved references, creates one immutable original, records its exact prompt/dimensions/type/provenance, and hands off actual pixels. If the returned original is not accessible at a real path, set `terra_pixels_inaccessible` and stop dependent stages.

Sol inspects Terra's actual full-size and target-size pixels, creates the polished concept/candidate, and records bounded Blender construction guidance in `prompts/sol-r001.txt`. Captain inspects those pixels, authors and saves `archive_v001.blend` interactively in Blender 5.2.1, and records the actual tool result. The blend has scene units Metric/1.0 and this hierarchy:

```text
EXPORT_archive
  RENDER_archive
  PROPS_archive
  SOCKETS_archive
    SOCKET_archive_restore
    SOCKET_archive_resident
    SOCKET_archive_anchor_a
    SOCKET_archive_anchor_b
  COLLISION_archive
```

Every object and material receives a role name. No default-named object/material remains. The source blend is never modified after its round ends.

- [ ] **Step 4: Export raw, inspect, optimize a copy, and cleanly re-import**

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec art-src/blender/archive/archive_v001.blend --python scripts/blender/export_named_collection.py -- --asset-id archive --collection EXPORT_archive --out artifacts/assets/archive/exports/archive-r001-raw.glb --report artifacts/assets/archive/reports/archive-r001-source.json
npx gltf-transform inspect artifacts/assets/archive/exports/archive-r001-raw.glb | Tee-Object artifacts/assets/archive/reports/archive-r001-raw-inspect.txt
npx gltf-transform optimize artifacts/assets/archive/exports/archive-r001-raw.glb artifacts/assets/archive/exports/archive-r001-opt.glb --compress meshopt --texture-compress webp --texture-size 2048
npx gltf-transform inspect artifacts/assets/archive/exports/archive-r001-opt.glb | Tee-Object artifacts/assets/archive/reports/archive-r001-opt-inspect.txt
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/inspect_clean_reimport.py -- --asset-id archive --glb artifacts/assets/archive/exports/archive-r001-opt.glb --manifest artifacts/assets/archive/intake-r001.json --report artifacts/assets/archive/reports/archive-r001-reimport.json
```

Expected GREEN: raw and optimized files have different paths and recorded hashes; both inspect commands exit 0; clean re-import starts empty, finds only intentional nodes, reports `status: "pass"`, and the optimized asset stays within its intake ceiling. Update the intake JSON from observed data before the final re-import command; never invent counts.

- [ ] **Step 5: Stage only for development review and capture real use**

Copy the optimized file to `public/assets/review/archive-r001.glb`, point the development-only review record at it, run the existing development server at `http://127.0.0.1:5188/?assetReview=archive`, and capture source, silhouette, real `archive-crossing`, and an unpaused turntable. Runtime proof includes nearby player, resident, anchor nodes, telegraphed hazard, HUD verb, actual camera/lighting, manifest hash, and renderer counts. Remove `public/assets/review/` after the decision. Full production preload is intentionally deferred until Task 6 has all twelve accepted assets.

- [ ] **Step 6: Run fresh Modlens review, then captain pixel review**

Start a fresh read-only reviewer on `modlens-openrouter/xiaomi/mimo-v2.5-pro`. Give it the brief, source pixels, runtime capture, silhouette capture, turntable path, intake/reimport reports, and renderer counts; exclude Terra/Sol self-ratings. Require the six-score JSON contract.

If Modlens returns `revise`/`blocked`, or any score below 2, average below 2.3, high/blocker finding, or technical failure, record exact evidence and required fixes. Captain inspects the same pixels and either rejects or accepts. Rejection creates Round 2 with `archive_v002.blend`, `terra-r002`, `sol-r002`, and new proof; do not patch Round 1 in place.

- [ ] **Step 7: Promote only the accepted bytes and observe GREEN**

After a Modlens pass and captain `ACCEPT`, copy the accepted optimized bytes to `public/assets/models/archive/archive-r001.glb`, add the exact hash/metadata/ledger to the runtime manifest, and confirm the promoted hash equals the reviewed hash.

```powershell
npm run asset:validate
npx playwright test tests/browser/showcase-archive.spec.ts
npm run typecheck
npm run build
if (Test-Path public/assets/review) { throw 'Development review assets remain' }
```

Expected GREEN: Archive test passes under the real camera, loader diagnostics name the accepted version, renderer counts stay within integrated budgets, review staging is absent, and the Alpha 0.1 encounter behavior tests remain green.

- [ ] **Step 8: Commit the accepted representative**

```powershell
git add art-src/blender/archive assets/concepts/archive artifacts/assets/archive public/assets/models/archive public/assets/showcase-manifest.json tests/browser/showcase-archive.spec.ts artifacts/game-progress.md
git commit -m "feat: replace Archive with accepted showcase asset"
```

Do not begin Task 5 until this commit exists.

---

### Task 5: Replace the Player and Four Echoes with In-Place Animated Assets

**Files:**
- Create: `art-src/blender/player/player_v001.blend`
- Create: `art-src/blender/echo-fighter/echo-fighter_v001.blend`
- Create: `art-src/blender/echo-scribe/echo-scribe_v001.blend`
- Create: `art-src/blender/echo-thief/echo-thief_v001.blend`
- Create: `art-src/blender/echo-weaver/echo-weaver_v001.blend`
- Create: `artifacts/assets/player/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/echo-fighter/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/echo-scribe/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/echo-thief/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/echo-weaver/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create after acceptance: `public/assets/models/player/player-r001.glb`
- Create after acceptance: `public/assets/models/echo-fighter/echo-fighter-r001.glb`
- Create after acceptance: `public/assets/models/echo-scribe/echo-scribe-r001.glb`
- Create after acceptance: `public/assets/models/echo-thief/echo-thief-r001.glb`
- Create after acceptance: `public/assets/models/echo-weaver/echo-weaver-r001.glb`
- Modify: `src/assets/AnimationController.ts`
- Modify: `src/world/TownWorld.ts`
- Modify: `public/assets/showcase-manifest.json`
- Create: `tests/unit/showcase-animation.test.ts`
- Create: `tests/browser/showcase-cast.spec.ts`
- Create: `artifacts/alpha-0-2-cast-motion.webm`

**Consumes:** accepted Archive pipeline, simulation-owned transforms, `VisualState`, party roles, formation state, role actions, collision radii.

**Produces:** five accepted animated character assets with named clips, readable silhouettes, stable collision, mixer lifecycle, and unpaused motion proof.

- [ ] **Step 1: Write RED clip, collision, and cast tests**

Assert exact required clips per budget table, every duration is finite/positive, horizontal root displacement per clip is at most 0.001 meters, each `VisualState` transition crossfades once, restart leaves zero stale mixers, player collision remains byte-for-byte equal to Alpha 0.1 values, and missing clips reject preload. Browser test opens `/?assetReview=player%2Cecho-fighter%2Cecho-scribe%2Cecho-thief%2Cecho-weaver`, enters `formation-party`, verifies three selected Echoes plus the unchosen parallel-party Echo are visible, all four silhouettes are distinguishable under a monochrome capture, player is at least 32px tall, Echoes are distinguishable at 48px, and party glyph/role behavior is unchanged.

```powershell
npm run test:unit -- tests/unit/showcase-animation.test.ts
npx playwright test tests/browser/showcase-cast.spec.ts
```

Expected RED: the runtime manifest lacks five cast assets and no imported clips exist.

- [ ] **Step 2: Lock five independent briefs**

Every brief uses the common material language, 32px player/48px Echo target sizes, real phase cameras, monochrome silhouette proof, in-place motion, `+Y` up/`-Z` forward, ground-center pivot, one capsule proxy, maximum three rounds, and exact routes. Asset-specific brief facts are:

| ID | Silhouette and prop lock | Required sockets | Active-play proof |
|---|---|---|---|
| `player` | tapered body, asymmetric signal mantle, central Omega aperture; never a primitive body plus glow | `SOCKET_vfx_dash`, `SOCKET_vfx_act`, `SOCKET_vfx_rewind` | Archive approach, Dash, Act, fail/rewind |
| `echo-fighter` | broad shield wedge and visible break tool | `SOCKET_tool_shield`, `SOCKET_vfx_guard` | formation and guard/break role beat |
| `echo-scribe` | tall ribbon/quill line and tablet | `SOCKET_tool_tablet`, `SOCKET_vfx_reveal` | formation and preserve/reveal beat |
| `echo-thief` | low split cloak, hooks/blade, offset stance | `SOCKET_tool_hook`, `SOCKET_vfx_bypass` | formation and bypass/reposition beat |
| `echo-weaver` | forked resonance staff and thread spool | `SOCKET_tool_staff`, `SOCKET_vfx_thread` | formation and stabilize/redirect beat |

No color carries the role alone. None resembles resident, hazard, or Dreamweaver silhouettes.

- [ ] **Step 3: Run five complete Terra/Sol/Modlens/captain loops**

Process one brief at a time. Terra produces one original gameplay-frame draft per asset. Sol inspects actual pixels and produces the polished concept plus bounded construction guidance. Captain authors each immutable Blender source, creates intentional UVs/PBR material roles and exact actions, then exports/captures through the validated scripts. Use these exact child groups: `EXPORT_player/{RENDER_player,ARMATURE_player,SOCKETS_player,COLLISION_player}`; `EXPORT_echo-fighter/{RENDER_echo-fighter,ARMATURE_echo-fighter,SOCKETS_echo-fighter,COLLISION_echo-fighter}`; `EXPORT_echo-scribe/{RENDER_echo-scribe,ARMATURE_echo-scribe,SOCKETS_echo-scribe,COLLISION_echo-scribe}`; `EXPORT_echo-thief/{RENDER_echo-thief,ARMATURE_echo-thief,SOCKETS_echo-thief,COLLISION_echo-thief}`; and `EXPORT_echo-weaver/{RENDER_echo-weaver,ARMATURE_echo-weaver,SOCKETS_echo-weaver,COLLISION_echo-weaver}`.

For every candidate run this command sequence using the concrete five IDs:

```powershell
$ids = @('player','echo-fighter','echo-scribe','echo-thief','echo-weaver')
foreach ($id in $ids) {
  $blend = "art-src/blender/$id/${id}_v001.blend"
  $base = "artifacts/assets/$id"
  & 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec $blend --python scripts/blender/export_named_collection.py -- --asset-id $id --collection "EXPORT_$id" --out "$base/exports/$id-r001-raw.glb" --report "$base/reports/$id-r001-source.json"
  if ($LASTEXITCODE -ne 0) { throw "Export failed: $id" }
  npx gltf-transform inspect "$base/exports/$id-r001-raw.glb" | Tee-Object "$base/reports/$id-r001-raw-inspect.txt"
  npx gltf-transform optimize "$base/exports/$id-r001-raw.glb" "$base/exports/$id-r001-opt.glb" --compress meshopt --texture-compress webp --texture-size 2048
  npx gltf-transform inspect "$base/exports/$id-r001-opt.glb" | Tee-Object "$base/reports/$id-r001-opt-inspect.txt"
  & 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/inspect_clean_reimport.py -- --asset-id $id --glb "$base/exports/$id-r001-opt.glb" --manifest "$base/intake-r001.json" --report "$base/reports/$id-r001-reimport.json"
  if ($LASTEXITCODE -ne 0) { throw "Clean re-import failed: $id" }
}
```

For each asset, stage a development review copy, capture source/target/silhouette/turntable/active input motion, run fresh Modlens review, then captain pixel review. Never batch reviews into one family verdict. An accepted version promotes exact reviewed bytes; a rejected version stays out of the manifest and starts a new complete round.

- [ ] **Step 4: Implement named action mapping and lifecycle**

`AnimationController` accepts the loaded clip map and a fixed state-to-clip map, starts `idle`, crossfades without re-starting the same action, stops all actions on fail/dispose, and reports active action/clip time as owned scalars. Player mapping is `idle -> idle`, `move -> move`, `dash -> dash`, `act -> act`, `fail -> fail`, and `danger -> idle` plus material danger state. Each Echo maps `idle`, `move`, and `act` to those exact three clips; the asset's tool and pose make its role-specific behavior readable while gameplay continues to own guard/break, preserve/reveal, bypass/reposition, or stabilize/redirect outcomes.

Mixer advancement occurs once per fixed-frame presentation update. Pause freezes mixers. Screenshot pause freezes mixers while rendering remains active. Restart/dispose removes every mixer and listener.

- [ ] **Step 5: Capture active-input motion and inspect it**

```powershell
node tools/capture-motion.mjs --url "http://127.0.0.1:5188/?assetReview=player%2Cecho-fighter%2Cecho-scribe%2Cecho-thief%2Cecho-weaver" --state formation-party --seed 42 --duration 20 --out artifacts/alpha-0-2-cast-motion.webm
```

Exercise real Move, Dash, Act, role action, interruption, fail, rewind, and resume. Inspect the full video for frozen rigs, limb collapse/stretch, foot sliding, double root motion, snapping crossfades, looping one-shots, wrong contact timing, and stale actions. Record clip names, durations, transition times, and findings in each ledger.

- [ ] **Step 6: Observe GREEN and commit accepted cast**

```powershell
npm run asset:validate
npm run test:unit -- tests/unit/showcase-animation.test.ts
npx playwright test tests/browser/showcase-cast.spec.ts
npm run test:unit
npm run typecheck
npm run build
if (Test-Path public/assets/review) { throw 'Development review assets remain' }
git add art-src/blender assets/concepts artifacts/assets/player artifacts/assets/echo-fighter artifacts/assets/echo-scribe artifacts/assets/echo-thief artifacts/assets/echo-weaver public/assets/models public/assets/showcase-manifest.json src/assets/AnimationController.ts src/world/TownWorld.ts tests artifacts/alpha-0-2-cast-motion.webm artifacts/game-progress.md
git commit -m "feat: replace player and Echo cast"
```

Expected GREEN: all five hashes and ledgers validate, clip/collision/restart tests pass, real-input video shows healthy motion, and Alpha 0.1 gameplay tests remain unchanged and green.

---

### Task 6: Replace Dreamweavers, Refuge, Threshold, and Gate/Bridge Heroes

**Files:**
- Create: `art-src/blender/dreamweaver-luminary/dreamweaver-luminary_v001.blend`
- Create: `art-src/blender/dreamweaver-shadow/dreamweaver-shadow_v001.blend`
- Create: `art-src/blender/dreamweaver-ambition/dreamweaver-ambition_v001.blend`
- Create: `art-src/blender/refuge/refuge_v001.blend`
- Create: `art-src/blender/threshold-platform/threshold-platform_v001.blend`
- Create: `art-src/blender/gate-bridge/gate-bridge_v001.blend`
- Create: `artifacts/assets/dreamweaver-luminary/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/dreamweaver-shadow/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/dreamweaver-ambition/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/refuge/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/threshold-platform/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create: `artifacts/assets/gate-bridge/` immutable brief, ledger, prompts, exports, reports, captures, review, and decision
- Create after acceptance: `public/assets/models/dreamweaver-luminary/dreamweaver-luminary-r001.glb`
- Create after acceptance: `public/assets/models/dreamweaver-shadow/dreamweaver-shadow-r001.glb`
- Create after acceptance: `public/assets/models/dreamweaver-ambition/dreamweaver-ambition-r001.glb`
- Create after acceptance: `public/assets/models/refuge/refuge-r001.glb`
- Create after acceptance: `public/assets/models/threshold-platform/threshold-platform-r001.glb`
- Create after acceptance: `public/assets/models/gate-bridge/gate-bridge-r001.glb`
- Create: `src/visual/DreamweaverMaterialAnimator.ts`
- Modify: `src/visual/OmegaLogo.ts`
- Modify: `src/world/TownWorld.ts`
- Modify: `public/assets/showcase-manifest.json`
- Create: `tests/unit/dreamweaver-material.test.ts`
- Create: `tests/browser/showcase-landmarks.spec.ts`
- Create: `tests/browser/showcase-threshold.spec.ts`

**Consumes:** landmark coordinates, both fracture routes, three threshold questions/approach zones, bridge trigger, era material roles, accepted asset loop.

**Produces:** six accepted static/material-animated heroes while retaining procedural instanced town volume and original gameplay geometry.

- [ ] **Step 1: Write RED world and threshold acceptance tests**

Tests open `/?assetMode=showcase` and assert all twelve IDs are loaded; Archive/refuge/gate keep exact `TOWN_LAYOUT` coordinates; the threshold has three separate 2.5-unit inspection zones; all three presences stay visible before commitment; silhouette alone distinguishes continuous arc, doubled broken trace, and angular filament; hold still requires 1.4 seconds; bridge completion still requires real Move; landmark replacement does not alter route or collision outcomes.

```powershell
npm run test:unit -- tests/unit/dreamweaver-material.test.ts
npx playwright test tests/browser/showcase-landmarks.spec.ts tests/browser/showcase-threshold.spec.ts
```

Expected RED: six runtime manifest records and material animator are absent.

- [ ] **Step 2: Lock six asset-specific briefs**

Use the common collection/intake/budget rules plus:

| ID | Shape/material lock | Required runtime states |
|---|---|---|
| `dreamweaver-luminary` | continuous arc/halo; silver-white cold emission; sustained motion | distant, near, carried, dimmed |
| `dreamweaver-shadow` | primary fractured form plus unmistakable offset echo; gold-amber; elusive broken motion | distant, near, carried, dimmed |
| `dreamweaver-ambition` | angular wedge/blade with red filament; decisive motion | distant, near, carried, dimmed |
| `refuge` | rounded shelter, protected residents, warm interior, readable evacuation line; hero props embedded | threatened, protected, restored |
| `threshold-platform` | three separate approach locations and one forward bridge line; no circular menu arrangement | inspect, carrying, open |
| `gate-bridge` | clearly passable worn arch/span, walkable path, coherent 1080p silhouette; hero props embedded | closed, open, crossed, collapse |

Dreamweaver identities must survive monochrome. Threshold and bridge must not become menus disguised as geometry. The unchosen route and unchosen Dreamweavers remain visible as required.

- [ ] **Step 3: Run six complete immutable visual loops**

For each exact ID, Terra creates one original target-camera concept, Sol creates the polished concept and bounded construction guidance, captain authors the Blender source and runtime candidate, Task 3 validates/exports/optimizes/reimports, the game captures actual fracture/threshold/bridge use, fresh Modlens returns structured evidence, and captain inspects the same pixels. Use one decision per asset. Preserve rejected versions and begin a new round rather than editing them.

The three Dreamweaver collections include `SOCKET_presence_origin` and `SOCKET_question` plus `COLLISION_dreamweaver-luminary`, `COLLISION_dreamweaver-shadow`, or `COLLISION_dreamweaver-ambition`. Landmark collections include their declared interaction/VFX sockets plus `COLLISION_refuge`, `COLLISION_threshold-platform`, or `COLLISION_gate-bridge`. Keep lights/cameras out of GLBs.

- [ ] **Step 4: Add bounded runtime material motion rather than unstable material clip tricks**

`DreamweaverMaterialAnimator` receives the three accepted root groups and time from the presentation update. It adjusts only emissive intensity, child transform offsets, and line continuity masks through shared material uniforms/properties. It emits no gameplay events and allocates nothing per frame. `setMode('distant' | 'near' | 'carried' | 'dimmed')` is the entire caller interface.

Luminary motion is continuous; Shadow uses a doubled offset with broken cadence; Ambition uses stepped angular emphasis. Reduced motion fixes positions and emission to readable constants. `toneMapped = false` applies only to identity accents; physical surfaces remain tone-mapped.

- [ ] **Step 5: Validate all six GLBs and active-use proof**

Export, inspect, optimize only a copy, cleanly re-import, and validate these six concrete IDs:

```powershell
$ids = @('dreamweaver-luminary','dreamweaver-shadow','dreamweaver-ambition','refuge','threshold-platform','gate-bridge')
foreach ($id in $ids) {
  $blend = "art-src/blender/$id/${id}_v001.blend"
  $base = "artifacts/assets/$id"
  & 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec $blend --python scripts/blender/export_named_collection.py -- --asset-id $id --collection "EXPORT_$id" --out "$base/exports/$id-r001-raw.glb" --report "$base/reports/$id-r001-source.json"
  if ($LASTEXITCODE -ne 0) { throw "Export failed: $id" }
  npx gltf-transform inspect "$base/exports/$id-r001-raw.glb" | Tee-Object "$base/reports/$id-r001-raw-inspect.txt"
  npx gltf-transform optimize "$base/exports/$id-r001-raw.glb" "$base/exports/$id-r001-opt.glb" --compress meshopt --texture-compress webp --texture-size 2048
  npx gltf-transform inspect "$base/exports/$id-r001-opt.glb" | Tee-Object "$base/reports/$id-r001-opt-inspect.txt"
  & 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/blender/inspect_clean_reimport.py -- --asset-id $id --glb "$base/exports/$id-r001-opt.glb" --manifest "$base/intake-r001.json" --report "$base/reports/$id-r001-reimport.json"
  if ($LASTEXITCODE -ne 0) { throw "Clean re-import failed: $id" }
  npm run asset:validate
  if ($LASTEXITCODE -ne 0) { throw "Asset validation failed: $id" }
}
npm run asset:validate:release
npm run build
npx playwright test tests/browser/showcase-landmarks.spec.ts tests/browser/showcase-threshold.spec.ts
```

Start the production preview at `http://127.0.0.1:4188/` only after `asset:validate:release` passes. Capture `fracture-memory`, `fracture-bodies`, all three threshold states, and `bridge-logo`; inspect real-input crossing and the full collapse. Expected GREEN: every asset hash/ledger/reimport passes, the production adapter preloads all twelve accepted assets with no procedural peer, each silhouette reads at target camera, and all phase and route assertions remain green.

- [ ] **Step 6: Commit accepted world heroes**

```powershell
npm run test:unit
npm run typecheck
npm run build
if (Test-Path public/assets/review) { throw 'Development review assets remain' }
git add art-src/blender assets/concepts artifacts/assets public/assets/models public/assets/showcase-manifest.json src/visual/DreamweaverMaterialAnimator.ts src/visual/OmegaLogo.ts src/world/TownWorld.ts tests artifacts/game-progress.md
git commit -m "feat: replace threshold and landmark heroes"
```

---

### Task 7: Add Production Material, Lighting, Render, and Event-VFX Treatment

**Files:**
- Create: `src/visual/MaterialLibrary.ts`
- Create: `src/visual/LightingRig.ts`
- Create: `src/visual/RenderPipeline.ts`
- Modify: `src/visual/EraDirector.ts`
- Modify: `src/visual/VfxDirector.ts`
- Modify: `src/visual/SceneContext.ts`
- Modify: `src/game/Game.ts`
- Create: `tests/unit/material-library.test.ts`
- Create: `tests/unit/lighting-rig.test.ts`
- Create: `tests/unit/render-pipeline.test.ts`
- Create: `tests/unit/vfx-director.test.ts`
- Create: `tests/browser/showcase-render.spec.ts`

**Consumes:** accepted PBR assets, era profiles, `FeedbackEvent`, reduced-motion setting, renderer diagnostics.

**Produces:** shared material roles, phase-owned lighting, at most two added post passes, pooled VFX, reversible lifecycle, and renderer-owned diagnostics.

- [ ] **Step 1: Write RED ownership and budget tests**

Assert one material instance per shared role unless a documented per-asset texture requires another; `LightingRig.apply(phase)` produces the locked phase lights; only bridge may create a shadow map; fracture has at most four simultaneous non-shadow point lights; render pipeline has at most two added passes; resize updates renderer/composer/targets once; reduced motion zeros shake/pulse/drift without hiding telegraphs; VFX pools return to zero active entries after restart/dispose. The browser test opens `/?assetMode=showcase` so every render assertion uses accepted GLBs.

```powershell
npm run test:unit -- tests/unit/material-library.test.ts tests/unit/lighting-rig.test.ts tests/unit/render-pipeline.test.ts tests/unit/vfx-director.test.ts
npx playwright test tests/browser/showcase-render.spec.ts
```

Expected RED: ownership modules and production render diagnostics do not exist.

- [ ] **Step 2: Implement shared material roles and color-space rules**

`MaterialLibrary` owns named roles `player-shell`, `echo-shell`, `archive-stone`, `refuge-shell`, `bridge-metal`, `interactable`, `hazard`, and the three Dreamweaver accents. It configures base-color textures as sRGB; normal/roughness/metalness/AO as linear; packed ORM channels consistently; anisotropy only where the measured camera needs it; `alphaTest` instead of transparent blending for cutouts; no double-sided material without visible need. It records material and texture ownership and disposes once.

Preserve Alpha 0.1 silhouette/value hierarchy before adding normal detail or emission. No glow-only geometry is accepted.

- [ ] **Step 3: Implement the locked lighting rig**

Use no scene lights in Ghost Terminal, one ambient constant in Town Map, directional key plus ambient fill and no shadows in Town Space, directional key plus landmark point lights and no shadows in Town Community, at most four event point lights with no shadows in Fracture, and key/fill/rim with one soft shadow-casting key in Bridge Glimpse. Maximum shadow map is 2048; all non-bridge phases release shadow targets.

Create one PMREM environment from Three.js `RoomEnvironment` or a local accepted HDR only if provenance is recorded. Generate once, reuse, and dispose on game teardown. Do not fetch remote environment maps.

- [ ] **Step 4: Keep the post chain to two added passes**

`RenderPipeline` owns one base `RenderPass`, one existing era composite pass, one selective Unreal bloom pass, and `OutputPass`. Count only era composite and bloom as added passes. Fold Bridge Glimpse grading into era composite uniforms instead of adding a third pass. Use baked or texture AO; do not add SSAO while era composite and bloom are active. No motion blur, depth of field, or screen-space reflections.

```ts
export interface RenderDiagnostics {
  readonly addedPostPasses: number;
  readonly activePasses: readonly string[];
  readonly dpr: number;
  readonly shadowLights: number;
  readonly maxShadowMapSize: number;
  readonly renderTargets: number;
}
```

Validate custom shader chunks against Three.js 0.186.0 by compiling every named state in Chromium; include program-cache keys for material shader variants.

- [ ] **Step 5: Replace VFX event by event using pools**

`VfxDirector` remains subscribed only to `FeedbackEvent`. Implement exact cues for `dash.start`, `act.commit`, `threat.tell`, `threat.contact`, `landmark.restore`, `companion.recruit`, `rewind.begin`, `rewind.end`, `era.advance`, `route.commit`, `pair.carry`, `bridge.cross`, `logo.resolve`, and `loop.collapse`. Reuse fixed pools for trails, rings, fragments, glyphs, and light bursts. Hazard tells remain visible for the exact 700ms tell and 550ms active window; contact red-shift lasts 0.1 seconds. Interactable pulses remain visually distinct at 2Hz.

Reduced motion uses static border flash, static displacement, fixed particles, constant bloom, immediate era swap, linear bridge pull, and static rewind label. Gameplay-critical cues remain visible.

- [ ] **Step 6: Observe GREEN in real states and commit**

```powershell
npm run test:unit -- tests/unit/material-library.test.ts tests/unit/lighting-rig.test.ts tests/unit/render-pipeline.test.ts tests/unit/vfx-director.test.ts
npx playwright test tests/browser/showcase-render.spec.ts tests/browser/archive-crossing.spec.ts
npm run typecheck
npm run build
git add src/visual src/game/Game.ts tests artifacts/game-progress.md
git commit -m "feat: add production rendering and VFX"
```

Expected GREEN: shader compilation and lifecycle tests pass; no state exceeds two added passes, two shadow lights, 2048 maps, or DPR 2; Archive tell/contact and reduced-motion behavior remain correct.

---

### Task 8: Finish the Genre-Specific UI, Glyphs, Portraits, and Logo

**Files:**
- Create: `artifacts/assets/ui-glyph-set/brief-v001.md`
- Create: `artifacts/assets/ui-glyph-set/ledger.json`
- Create: `artifacts/assets/ui-glyph-set/` immutable prompts, captures, Modlens review, and captain decision
- Create only when a controllable Affinity cleanup is actually used: `artifacts/assets/ui-glyph-set/captures/affinity-reopen-r001.png`
- Create: `artifacts/assets/omega-logo/brief-v001.md`
- Create: `artifacts/assets/omega-logo/ledger.json`
- Create: `artifacts/assets/omega-logo/` immutable prompts, captures, Modlens review, and captain decision
- Create after acceptance: `public/assets/ui/showcase-glyphs.svg`
- Create after acceptance: `public/assets/ui/echo-portraits.webp`
- Create after acceptance: `public/assets/ui/manifest.json`
- Modify: `scripts/validate-showcase-assets.ts`
- Create: `src/ui/UiAssetRegistry.ts`
- Modify: `src/ui/GameUi.ts`
- Modify: `src/visual/OmegaLogo.ts`
- Modify: `src/styles.css`
- Modify: `src/debug/diagnostics.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `index.html`
- Create: `tests/unit/ui-assets.test.ts`
- Create: `tests/browser/showcase-ui.spec.ts`
- Modify: `tests/accessibility.spec.ts`
- Modify: `tests/visual-regression.spec.ts`

**Consumes:** immutable UI snapshots, four input intents, phase/era state, exact questions/captions, reconstructed three-strand logo, existing focus/settings/error behavior.

**Produces:** accepted original glyph/portrait/logo treatments, stable game HUD, complete overlays, 200%-zoom proof, and world/UI visual cohesion.

- [ ] **Step 1: Write RED UI asset and layout tests**

Open browser cases with `/?assetMode=showcase`. Assert local UI assets have accepted ledgers/hashes; Move/Dash/Act/pause and four party roles have non-color-only glyphs; numeric containers do not shift; active HUD exposes only objective, instance, target verb, and relevant party glyphs; every interactive control has focus/hover/pressed/disabled states; loading, unlock/name, terminal, exploration, action, formation, fracture, threshold, rewind, pause, settings, WebGL error, required-asset error, and collapse/restart states remain reachable.

At 1920x1080, 1280x720, and 1280x720 browser zoom 200%, assert HUD rectangles do not intersect player/threat/interactable/next-decision rectangles published as owned scalar diagnostics, all text fits, and menus remain keyboard reachable. No generic stat card, nested card stack, debug panel, or centered marketing layout appears.

```powershell
npm run test:unit -- tests/unit/ui-assets.test.ts
npx playwright test tests/browser/showcase-ui.spec.ts tests/accessibility.spec.ts
```

Expected RED: accepted assets and production layout assertions are absent.

- [ ] **Step 2: Lock and run the `ui-glyph-set` visual loop**

Brief one original SVG atlas with Move/Dash/Act/pause, Fighter/Scribe/Thief/Weaver, danger/reward/objective/disabled marks, and four pixel-era Echo portraits. It must use the world's record-strata, split-trace, and Omega-aperture geometry, work in monochrome, remain legible at 14px labels/24px icons, use sRGB, and contain no embedded remote font/raster/provider metadata. Terra drafts; Sol rebuilds clean SVG/WebP and integrates; source, target-size, monochrome, active-play captures go to fresh Modlens; captain inspects and decides. If captain elects a controllable Affinity cleanup, the ledger records version `3.2.3.4646`, the real input/output paths, and `captures/affinity-reopen-r001.png` proving the saved export reopens; without that evidence, record the SVG/PNG/WebP workflow honestly and make no Affinity claim.

- [ ] **Step 3: Lock and run the `omega-logo` visual loop**

Use the canonical creative reference at `assets/references/omega-spiral-logo-reference.png` (SHA-256 `cd25e0c1cc510ebfebc1ed0f2249ac5b0371f157ed2cedaad4fadf1e6907c660`). It is important source direction, not a provenance blocker or shipped runtime bitmap. Terra creates multiple new three-trajectory logo compositions and era variations from its strand language. Sol polishes the selected family and translates it into three independent `CatmullRomCurve3` runtime paths plus era-specific segment/material settings. Capture 4:3 monochrome, 16:10, 16:9, HUD threshold, and full 1920x1080 bridge use. Fresh Modlens and captain separately approve the actual pixels before any accepted ledger state.

- [ ] **Step 4: Implement one UI asset registry and state-driven layout**

`public/assets/ui/manifest.json` hash-pins runtime files `showcase-glyphs.svg` and `echo-portraits.webp`, records `src/visual/OmegaLogo.ts` as a build-only source/hash, and points each entry to its accepted ledger/version. `UiAssetRegistry` fetches only runtime entries. Extend `asset:validate:release` to require `ui-glyph-set` and `omega-logo`, verify Modlens/captain decisions, compare all three file hashes on disk, and reject remote URLs/provider metadata. `UiAssetRegistry` validates the local UI manifest, returns semantic icon/portrait coordinates, and exposes `dispose`; it does not duplicate the GLB registry. `GameUi` continues reading immutable snapshots and emitting intents. Use fixed icon tracks, fixed-width instance/progress numerals, CSS `clamp()` for text/spacing, landscape safe regions, and one short banner maximum. Keep objective top-left, instance/pause top-right, context near its world target, and party glyphs in a compact edge cluster.

Publish only testable rectangle scalars:

```ts
export interface ScreenRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface UiLayoutDiagnostics {
  readonly hud: Readonly<Record<string, ScreenRect>>;
  readonly gameplay: Readonly<Record<'player' | 'threat' | 'interactable' | 'nextDecision', ScreenRect | null>>;
}
```

Captions remain independent of mute/voice settings. Required-asset and decode-error status are nonblocking where specified and keyboard dismissible. Debug UI remains behind the existing development gate.

- [ ] **Step 5: Observe GREEN and accept intentional visual baselines**

```powershell
npm run test:unit -- tests/unit/ui-assets.test.ts
npx playwright test tests/browser/showcase-ui.spec.ts tests/accessibility.spec.ts
npx playwright test tests/visual-regression.spec.ts
npm run typecheck
npm run build
```

Expected GREEN: UI assets and ledgers validate, all states fit at both viewports and 200% zoom, keyboard focus is visible, gameplay rects do not overlap HUD, logo safe-frame tests pass, and visual diffs reflect only captain-accepted changes. Make the development visual suite open `/?assetMode=showcase`; production preview ignores the development switch and loads the same complete accepted manifest. Update reference snapshots only after reviewing every diff.

- [ ] **Step 6: Commit the accepted interface pass**

```powershell
git add artifacts/assets/ui-glyph-set artifacts/assets/omega-logo public/assets/ui scripts/validate-showcase-assets.ts src/ui src/visual/OmegaLogo.ts src/styles.css src/debug/diagnostics.ts src/vite-env.d.ts index.html tests artifacts/game-progress.md
git commit -m "feat: finish showcase game interface"
```

---

### Task 9: Replace Synthesized Presentation with Production Audio and Selected Voices

**Files:**
- Create: `art-src/audio/source-ledger.json`
- Create: `art-src/audio/masters/` with one `.wav` at the same group/name path as every `.ogg` below
- Create: `public/assets/audio/manifest.json`
- Create: `public/assets/audio/ui/ui-confirm.ogg`
- Create: `public/assets/audio/sfx/step-stone-01.ogg`
- Create: `public/assets/audio/sfx/step-stone-02.ogg`
- Create: `public/assets/audio/sfx/step-stone-03.ogg`
- Create: `public/assets/audio/sfx/step-wood-01.ogg`
- Create: `public/assets/audio/sfx/step-wood-02.ogg`
- Create: `public/assets/audio/sfx/step-wood-03.ogg`
- Create: `public/assets/audio/sfx/step-metal-01.ogg`
- Create: `public/assets/audio/sfx/step-metal-02.ogg`
- Create: `public/assets/audio/sfx/step-metal-03.ogg`
- Create: `public/assets/audio/sfx/dash-start.ogg`
- Create: `public/assets/audio/sfx/act-commit.ogg`
- Create: `public/assets/audio/sfx/threat-tell.ogg`
- Create: `public/assets/audio/sfx/threat-contact.ogg`
- Create: `public/assets/audio/music/landmark-restore.ogg`
- Create: `public/assets/audio/music/companion-recruit-fighter.ogg`
- Create: `public/assets/audio/music/companion-recruit-scribe.ogg`
- Create: `public/assets/audio/music/companion-recruit-thief.ogg`
- Create: `public/assets/audio/music/companion-recruit-weaver.ogg`
- Create: `public/assets/audio/sfx/rewind-begin.ogg`
- Create: `public/assets/audio/sfx/rewind-end.ogg`
- Create: `public/assets/audio/sfx/era-advance.ogg`
- Create: `public/assets/audio/ambience/relay-loop.ogg`
- Create: `public/assets/audio/music/one-bit-loop.ogg`
- Create: `public/assets/audio/music/fm-loop.ogg`
- Create: `public/assets/audio/music/tracker-loop.ogg`
- Create: `public/assets/audio/music/fracture-samples-loop.ogg`
- Create: `public/assets/audio/music/spatial-cinematic-loop.ogg`
- Create: `public/assets/audio/music/route-commit.ogg`
- Create: `public/assets/audio/music/pair-luminary-loop.ogg`
- Create: `public/assets/audio/music/pair-shadow-loop.ogg`
- Create: `public/assets/audio/music/pair-ambition-loop.ogg`
- Create: `public/assets/audio/music/bridge-cross.ogg`
- Create: `public/assets/audio/music/logo-resolve.ogg`
- Create: `public/assets/audio/music/loop-collapse.ogg`
- Create: `public/assets/audio/ambience/terminal-loop.ogg`
- Create: `public/assets/audio/ambience/town-loop.ogg`
- Create: `public/assets/audio/ambience/fracture-loop.ogg`
- Create: `public/assets/audio/ambience/threshold-loop.ogg`
- Create: `public/assets/audio/voice/luminary-question.ogg`
- Create: `public/assets/audio/voice/shadow-question.ogg`
- Create: `public/assets/audio/voice/ambition-question.ogg`
- Create: `src/audio/AudioAssetManifest.ts`
- Create: `src/audio/SampleBank.ts`
- Modify: `src/audio/AudioDirector.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/session-store.ts`
- Modify: `src/ui/GameUi.ts`
- Create: `tests/unit/audio-manifest.test.ts`
- Modify: `tests/unit/audio-director.test.ts`
- Create: `tests/browser/showcase-audio.spec.ts`
- Create: `artifacts/alpha-0-2-audio-review.md`

**Consumes:** sixteen locked feedback events, one AudioContext, Alpha 0.1 bus/state lifecycle, exact threshold questions, user gesture unlock, captions.

**Produces:** local hash/provenance-pinned sample manifest, production motif layers/SFX/ambience, three selected voiced questions, decode-error behavior, and listening evidence. Audio never drives game state.

- [ ] **Step 1: Write RED manifest, bus, and lifecycle tests**

Open browser cases with `/?assetMode=showcase`. Define production groups `music`, `ambience`, `sfx`, `ui`, and new `voice` under `master`. Assert every locked event maps to a local manifest entry, `step` has exactly three variations for stone/wood/metal, `companion.recruit` selects one distinct motif for each Echo role, `pair.carry` selects the correct Dreamweaver loop, captions use exact approved question text, voice mute never hides captions, a decode failure logs at most three times and raises one dismissible status, pause/retry/visibility/dispose leave no stacked loop/source, and total simultaneous sounds never exceeds eight.

```powershell
npm run test:unit -- tests/unit/audio-manifest.test.ts tests/unit/audio-director.test.ts
npx playwright test tests/browser/showcase-audio.spec.ts
```

Expected RED: sample manifest, voice bus, sample bank, and production files do not exist.

- [ ] **Step 2: Acquire only approved source audio with provenance**

For every master record source, license/authorization, creator/provider, task/job ID when returned, exact prompt or recording notes, sample rate/channels/duration, and SHA-256 in `source-ledger.json`. Keep generation offline from the shipped runtime.

If ElevenLabs is authorized, probe without printing credentials:

```powershell
python "C:\Users\jesse\.agents\skills\threejs-audio-generator\scripts\threejs_audio_asset.py" probe
```

A genuine missing credential is not permission to use another provider. Continue locally authored/licensed sounds and recorded fictional voices; mark only the dependent voice files blocked if no approved source exists. Authentication, credits, invalid input, transient status/download, and uncertain submission outcomes follow the asset-recovery classifications. Resume/status/download an existing task rather than submitting a duplicate.

The three voice masters speak exactly the approved Luminary, Shadow, and Ambition questions. Do not imitate a real private person. Captain approves the fictional voice direction and actual listening files.

- [ ] **Step 3: Normalize and encode reproducibly**

Keep lossless masters immutable under the same group/name tree. Encode all concrete assets locally with FFmpeg:

```powershell
$monoOneShots = @(
  'ui/ui-confirm',
  'sfx/step-stone-01','sfx/step-stone-02','sfx/step-stone-03',
  'sfx/step-wood-01','sfx/step-wood-02','sfx/step-wood-03',
  'sfx/step-metal-01','sfx/step-metal-02','sfx/step-metal-03',
  'sfx/dash-start','sfx/act-commit','sfx/threat-tell','sfx/threat-contact',
  'music/landmark-restore','music/companion-recruit-fighter',
  'music/companion-recruit-scribe','music/companion-recruit-thief',
  'music/companion-recruit-weaver','sfx/rewind-begin','sfx/rewind-end','sfx/era-advance'
)
$stereo = @(
  'ambience/relay-loop','music/one-bit-loop','music/fm-loop','music/tracker-loop',
  'music/fracture-samples-loop','music/spatial-cinematic-loop','music/route-commit',
  'music/pair-luminary-loop','music/pair-shadow-loop','music/pair-ambition-loop',
  'music/bridge-cross','music/logo-resolve','music/loop-collapse',
  'ambience/terminal-loop','ambience/town-loop','ambience/fracture-loop','ambience/threshold-loop'
)
$voices = @('voice/luminary-question','voice/shadow-question','voice/ambition-question')
foreach ($stem in $monoOneShots) {
  ffmpeg -hide_banner -y -i "art-src/audio/masters/$stem.wav" -af "loudnorm=I=-18:TP=-1.5:LRA=7" -ar 48000 -ac 1 -c:a libvorbis -q:a 5 "public/assets/audio/$stem.ogg"
  if ($LASTEXITCODE -ne 0) { throw "Audio encode failed: $stem" }
}
foreach ($stem in $stereo) {
  ffmpeg -hide_banner -y -i "art-src/audio/masters/$stem.wav" -af "loudnorm=I=-20:TP=-2:LRA=9" -ar 48000 -ac 2 -c:a libvorbis -q:a 5 "public/assets/audio/$stem.ogg"
  if ($LASTEXITCODE -ne 0) { throw "Audio encode failed: $stem" }
}
foreach ($stem in $voices) {
  ffmpeg -hide_banner -y -i "art-src/audio/masters/$stem.wav" -af "loudnorm=I=-18:TP=-1.5:LRA=7" -ar 48000 -ac 1 -c:a libvorbis -q:a 5 "public/assets/audio/$stem.ogg"
  if ($LASTEXITCODE -ne 0) { throw "Voice encode failed: $stem" }
}
Get-ChildItem public/assets/audio -Recurse -Filter *.ogg | ForEach-Object {
  ffprobe -v error -show_entries format=duration:stream=codec_name,sample_rate,channels -of json $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Audio probe failed: $($_.FullName)" }
}
```

Listen to every loop across at least three seams and record defects; file existence cannot pass the audio gate.

- [ ] **Step 4: Implement the manifest and one SampleBank**

```ts
export type AudioGroup = 'music' | 'ambience' | 'sfx' | 'ui' | 'voice';

export interface AudioAssetRecord {
  readonly id: string;
  readonly url: string;
  readonly sha256: string;
  readonly group: AudioGroup;
  readonly loop: boolean;
  readonly gain: number;
  readonly cooldownMs: number;
  readonly maxVoices: number;
  readonly caption?: string;
}

export interface AudioAssetManifest {
  readonly version: 1;
  readonly release: 'alpha-0.2';
  readonly assets: readonly AudioAssetRecord[];
}
```

`parseAudioAssetManifest(unknown)` rejects unknown/duplicate IDs, absolute URLs, schemes, traversal, non-OGG files, malformed SHA-256, invalid gains/cooldowns/concurrency, a loop/cue mismatch, missing event variants, voice without exact caption copy, and files absent from the source ledger. The unit test hashes every shipped file and compares manifest and source-ledger records.

`SampleBank.loadAfterUnlock()` fetches local files only after the user gesture, validates hashes, decodes through the existing one `AudioContext`, exposes `play`, `startLoop`, `stop`, `pause`, `resume`, diagnostics, and `dispose`, and owns all nodes. High-frequency step variation uses the injected seeded RNG. It does not create another AudioContext.

`AudioDirector.handle(event)` retains all Alpha 0.1 cue durations, cooldowns, max concurrency, bus ownership, motif layer volumes, and nonblocking semantics from `audio-matrix.md`; it routes to samples when decoded and surfaces the specified status on failure. A failed voice plays no substitute speech and still shows its caption. Add the `voice` group to persisted settings without changing existing defaults.

- [ ] **Step 5: Perform browser, pause, restart, and listening proof**

Use real unlock input, then exercise one complete Archive encounter, recruit, route, each Dreamweaver carry, bridge, collapse, restart, pause/resume, tab visibility, all mute controls, one injected decode error, and captions with voice muted. Diagnostics must show source counts return to expected levels and no duplicated ambience/motif after every resume/restart.

Record in `artifacts/alpha-0-2-audio-review.md`: exact build hash, output device, browser, files heard, loop-seam result, mix/readability notes under active gameplay, caption timing, decode fallback, three approved voice decisions, and unresolved defects. Captain listens before acceptance; visual Modlens is not used to claim audio quality.

- [ ] **Step 6: Observe GREEN and commit**

```powershell
npm run test:unit -- tests/unit/audio-manifest.test.ts tests/unit/audio-director.test.ts
npx playwright test tests/browser/showcase-audio.spec.ts tests/accessibility.spec.ts
npm run typecheck
npm run build
git add art-src/audio public/assets/audio src/audio src/game/types.ts src/game/session-store.ts src/ui/GameUi.ts tests artifacts/alpha-0-2-audio-review.md artifacts/game-progress.md
git commit -m "feat: integrate production audio and voices"
```

Expected GREEN: local manifests/hashes/provenance validate, unlock/decode/caption/mute/pause/restart tests pass, no source stacks, and captain's listening record accepts each shipped voice and production mix.

---

### Task 10: Optional One-Loop Cosmetic Residue, Isolated from Alpha 0.1

**Files only if explicitly approved:**
- Create: `src/game/loop-residue.ts`
- Modify: `src/game/session-store.ts`
- Modify: `src/phases/GhostTerminalPhase.ts`
- Modify: `src/visual/VfxDirector.ts`
- Modify: `src/audio/AudioDirector.ts`
- Create: `tests/unit/loop-residue.test.ts`
- Create: `tests/browser/loop-residue.spec.ts`
- Modify: `artifacts/game-progress.md`

**Consumes:** explicit user approval, completed-loop route/pairing, Ghost Terminal presentation. It does not consume affinity, names, encounter state, or phase gates.

**Produces if approved:** one bounded cosmetic residue from only the immediately previous loop. If declined, produces only a recorded skip decision and Alpha 0.2 release continues.

- [ ] **Step 1: Request a separate scope decision before writing a test or source file**

Present this exact proposal: after a completed loop, the next Ghost Terminal may display one noninteractive route glyph until the first terminal choice and play one 250ms pairing timbre after audio unlock. The glyph/timbre has no text, choice, score, ability, affinity, collision, objective, timing, or unlock effect. It is cleared on the first accepted terminal choice, overwritten by the next completed loop, and never survives the browser session.

If not explicitly approved, write `Cross-loop residue: declined; no runtime files changed` in `artifacts/game-progress.md`, check off this task's skip path, and continue to Task 11. This optional decision cannot block Alpha 0.1 or the Alpha 0.2 audiovisual release.

- [ ] **Step 2: If approved, write RED boundedness tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearResidueOnFirstChoice,
  decodeResidue,
  encodeResidue,
} from '../../src/game/loop-residue.js';

const residue = { version: 1 as const, route: 'memory' as const, pairing: 'shadow' as const };

test('residue stores only one route and pairing without names', () => {
  const encoded = encodeResidue(residue);
  assert.equal(encoded.includes('playerName'), false);
  assert.equal(encoded.includes('omegaName'), false);
  assert.deepEqual(decodeResidue(encoded), residue);
});

test('first accepted terminal choice clears residue', () => {
  assert.equal(clearResidueOnFirstChoice(residue), null);
});
```

Browser test compares enabled/disabled runs with the same seed and real input, asserting identical phase, checkpoint, position, objective, affinity, party, route availability, and completion time within one fixed tick. Expected RED: residue module is absent.

- [ ] **Step 3: Implement the smallest isolated record**

```ts
export interface LoopResidueV1 {
  readonly version: 1;
  readonly route: 'memory' | 'bodies';
  readonly pairing: 'luminary' | 'shadow' | 'ambition';
}

export const LOOP_RESIDUE_KEY = 'omega-spiral.residue.v1';
```

Validate unknown storage data, discard malformed values, and store only after accepted `bridge.completed`/collapse state. Read only in Ghost Terminal presentation. Clear after the first accepted terminal choice and on explicit lineage reset. The visual/audio modules receive a read-only presentation value and emit no domain action. Do not add feature-flag infrastructure; the accepted commit itself is the decision.

- [ ] **Step 4: Observe GREEN and commit only the approved behavior**

```powershell
npm run test:unit -- tests/unit/loop-residue.test.ts
npx playwright test tests/browser/loop-residue.spec.ts tests/bot-playtest.spec.ts
npm run typecheck
npm run build
git add src/game/loop-residue.ts src/game/session-store.ts src/phases/GhostTerminalPhase.ts src/visual/VfxDirector.ts src/audio/AudioDirector.ts tests artifacts/game-progress.md
git commit -m "feat: add bounded one-loop residue"
```

Expected GREEN: residue is cosmetic, session-scoped, one-loop, cleared deterministically, contains no names, and bot metrics/gameplay state match the disabled comparison.

---

### Task 11: Profile, Optimize, and Pass the Showcase Scorecard with Comparable Evidence

**Files:**
- Modify: `src/debug/diagnostics.ts`
- Modify: `src/debug/test-hooks.ts`
- Create: `tests/unit/showcase-budget.test.ts`
- Create: `tests/browser/showcase-performance.spec.ts`
- Create: `artifacts/alpha-0-2-after-1/evidence.json`
- Create: `artifacts/alpha-0-2-after-1/scorecard.md`
- Create: `artifacts/alpha-0-2-after-1/archive-crossing-motion.webm`
- Create: `artifacts/alpha-0-2-after-1/finale-motion.webm`
- Modify: `artifacts/alpha-0-2-comparison.md`
- Modify: `artifacts/game-progress.md`

**Consumes:** accepted asset/UI/audio/VFX revision, production preview, seed 42, Archive midpoint, bridge peak frame, Alpha 0.1 before evidence, ten-category scorecard.

**Produces:** repeatable performance assertions, classified bottleneck measurements, before/after evidence, complete scorecard, and bounded optimizations that preserve readability.

- [ ] **Step 1: Write RED budget tests with synthetic over-budget proof**

Use one locked constant in `src/debug/diagnostics.ts`:

```ts
export const SHOWCASE_DESKTOP_BUDGET = {
  calls: 300,
  triangles: 750_000,
  geometries: 300,
  textures: 60,
  estimatedTextureBytes: 256 * 1024 * 1024,
  shadowLights: 2,
  maxShadowMapSize: 2048,
  maxDpr: 2,
  addedPostPasses: 2,
} as const;
```

The pure budget checker must reject a synthetic report with 301 calls, 750001 triangles, 301 geometries, 61 textures, 268435457 estimated texture bytes, three shadow lights, 4096 maps, DPR 2.01, or three added passes. Estimate each unique 2D RGBA8 texture as `width * height * 4 * 4 / 3` bytes including mipmaps and each cubemap as six faces; report render-target memory separately. Browser tests open `/?assetMode=showcase`, enter `archive-crossing` and `bridge-logo`, wait for active gameplay/peak frame, then assert each hard desktop ceiling. They also record frame-time median/p95, renderer/vendor/software-rendered status, programs/materials/render targets, bundle bytes, largest asset bytes, active mixers/audio/VFX, and JS heap where available.

```powershell
npm run test:unit -- tests/unit/showcase-budget.test.ts
npx playwright test tests/browser/showcase-performance.spec.ts
```

Expected RED: diagnostics lack the full measurements or the integrated scene exceeds a ceiling.

- [ ] **Step 2: Establish one fixed production measurement scenario**

Use production preview at `http://127.0.0.1:4188/`, Chromium channel, workers 1, the inspector's fixed 1280x720 desktop viewport for direct Task 1 comparison, DPR cap 2, seed 42, identical `archive-crossing` midpoint and `bridge-logo` peak state, ten measured seconds, debug UI hidden, reduced motion off, and no competing browser contexts. Run the release budget browser test separately at 1920x1080 under the same seed/states. Verify the GPU block before reporting FPS. Software rendering invalidates FPS but not functional/pixel/count evidence.

- [ ] **Step 3: Classify before changing one variable**

Classify each failure as CPU simulation/allocation/mixers/UI, GPU draw/material switches, GPU fragment/overdraw/post/DPR/transparency, GPU vertex/triangles/shadows, memory/textures/targets/disposal, or network/bundle. Record the evidence and one proposed change. Do not change multiple systems before remeasurement.

Apply optimizations in this order and stop once gates pass: instance repeated town detail; share geometry/material/texture; pool VFX; cull by frustum/distance; add LOD to background props; cap DPR/adaptive quality; remove shadow casters/lower map; remove or replace one post pass; resize/atlas/compress textures; remove per-frame allocations/layout reads; dispose leaks. Cut post/shadow cost before reducing hero silhouette/readability.

After each change rerun the identical state and record before/after numbers plus visual/playability regression result.

- [ ] **Step 4: Capture the complete after set**

After the build, start `npm run preview` as one managed background job at port 4188 and keep it alive through the inspector and motion commands.

```powershell
npm run build
$states = @(
  'ghost-terminal','exploration-active','archive-crossing','formation-party',
  'fracture-memory','fracture-bodies','threshold-luminary','threshold-shadow',
  'threshold-ambition','bridge-logo','loop-restart','pause-settings',
  'reduced-motion-fracture'
)
foreach ($state in $states) {
  node "C:\Users\jesse\.agents\skills\threejs-qa-release\scripts\inspect-threejs-canvas.mjs" --url http://127.0.0.1:4188/ --out artifacts/alpha-0-2-after-1 --state $state --seed 42 --run-id alpha-0-2-after-1
  if ($LASTEXITCODE -ne 0) { throw "After capture failed: $state" }
}
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state archive-crossing --seed 42 --duration 18 --out artifacts/alpha-0-2-after-1/archive-crossing-motion.webm
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state threshold-luminary --seed 42 --duration 16 --out artifacts/alpha-0-2-after-1/finale-motion.webm
```

Expected GREEN: all fresh reports use run ID `alpha-0-2-after-1`; same-state/camera/seed/viewport conditions match Task 1; motion captures are unpaused and exercise real input.

- [ ] **Step 5: Inspect every image/video and score all ten categories**

Score art direction, hero/player, obstacles/enemies, rewards/interactables, world/environment, materials/textures, lighting/render, VFX/motion, UI/HUD, and performance evidence. Each row records score 0–3, exact after evidence path, exact before evidence path, and one visible/measured justification.

Automatic failure if any of these remain: generic/raw asset dominance; primitive hero plus glow; dashboard HUD; fog/bloom replacing geometry; UI covering gameplay; key interactions without world/VFX/UI/audio response; imported assets lacking camera/scale/pivot/collision/motion proof; capture without active real input; stale evidence; missing post-change diagnostics.

Fresh Modlens may critique the final capture set, but the captain must inspect the actual pixels/videos and own the scorecard. Any category below 2, fewer than six scores of 3, average below 2.7, or automatic failure sends the responsible visual asset through a new full locked-brief round. Do not raise a score by prose.

- [ ] **Step 6: Complete the comparison and observe GREEN**

`artifacts/alpha-0-2-comparison.md` pairs the same thirteen states and both motions, lists base/final hashes and identical conditions, compares Archive/bridge renderer metrics, explains each optimization, and records visual changes. `after-1/evidence.json` declares all reports/videos.

```powershell
npm run asset:validate:release
npm run test:unit
npx playwright test tests/browser/showcase-performance.spec.ts
python "C:\Users\jesse\.agents\skills\threejs-game-director\scripts\check_evidence.py" . --manifest artifacts/alpha-0-2-after-1/evidence.json
npm run typecheck
npm run build
```

Expected GREEN: all hard desktop budgets pass at Archive and bridge; FPS is valid 60 evidence or an explicit measured/accepted tradeoff; every scorecard category is at least 2, six or more are 3, average is at least 2.7, and no automatic failure remains.

- [ ] **Step 7: Commit the measured optimization pass**

```powershell
git add src/debug src/visual src/assets tests/unit/showcase-budget.test.ts tests/browser/showcase-performance.spec.ts artifacts/alpha-0-2-after-1 artifacts/alpha-0-2-comparison.md artifacts/game-progress.md
git commit -m "perf: fit Alpha 0.2 showcase budgets"
```

---

### Task 12: Verify the Static Release, Capture Current-Run Evidence, and Stop

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/visual-regression.spec.ts`
- Modify: `tests/bot-playtest.spec.ts`
- Modify: `tools/capture-motion.mjs`
- Modify: `artifacts/evidence.json`
- Modify: `artifacts/final-evidence.md`
- Modify: `artifacts/game-progress.md`
- Modify: `README.md`
- Produce: `artifacts/alpha-0-2-release-1/` current-run reports, screenshots, bot JSON, and motion files
- Produce: `dist/` static release

**Consumes:** accepted manifest, all ledgers, release scorecard, full real-input game, production preview, static `base: './'`.

**Produces:** one current static build with no review assets, remote provider dependencies, secrets, debug UI, console/page/network errors, or missing evidence.

- [ ] **Step 1: Make production-preview test selection explicit**

Keep normal tests on port 5188 and add one environment-controlled preview path without another config file:

```ts
const usePreview = process.env.PLAYWRIGHT_PREVIEW === '1';
const serverURL = usePreview ? 'http://127.0.0.1:4188' : 'http://127.0.0.1:5188';
const serverCommand = usePreview ? 'npm run preview' : 'npm run dev';
const reuseExistingServer = usePreview;
```

Use these in `baseURL`, `webServer.command`, `webServer.url`, and `webServer.reuseExistingServer`; keep `workers: 1`, `channel: 'chromium'`, strict ports, and existing timeouts. Browser assertions must confirm the expected app/release hash, not merely a nonblank canvas.

- [ ] **Step 2: Run the full RED release gate before final evidence**

```powershell
npm ci
npm run asset:validate:release
npm run typecheck
npm run test:unit
npm run test:browser
npm run test:showcase
npm run build
$env:PLAYWRIGHT_PREVIEW = '1'
npx playwright test tests/visual-regression.spec.ts tests/game-flow.spec.ts tests/accessibility.spec.ts tests/browser/showcase-performance.spec.ts
Remove-Item Env:PLAYWRIGHT_PREVIEW
```

Expected RED when release-only defects remain: stale snapshots, missing accepted assets, static-base asset failures, debug leakage, visual budget failure, or browser errors. Fix the owning module, rerun the narrow failed command, then rerun this full gate.

- [ ] **Step 3: Audit the built artifact**

```powershell
if (Test-Path dist/assets/review) { throw 'Review assets shipped' }
$secretPatterns = @('TRIPO_API_KEY','ELEVENLABS_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY','api.tripo3d.ai','api.elevenlabs.io','assetReview','assetMode=showcase','/assets/review/')
$distFiles = Get-ChildItem dist -Recurse -File
$secretHits = Select-String -Path $distFiles.FullName -Pattern $secretPatterns -SimpleMatch
if ($secretHits) { $secretHits | Format-Table; throw 'Provider secret or endpoint marker found in dist' }
Get-ChildItem dist -Recurse -File | Sort-Object Length -Descending | Select-Object -First 25 FullName,Length
```

Open the production preview from `dist/`, verify all manifest/model/audio/UI requests use local relative URLs and successful MIME/status, and verify a hard refresh on nested/static-hosting paths. Debug overlays, test shortcuts, source/provider URLs, rejected candidates, and verbose logs remain absent from player UI/build.

- [ ] **Step 4: Capture release-run stills, motion, and real-input bot proof**

Start `npm run preview` as one managed background job at port 4188 and keep that exact job alive through every command below. Use run ID `alpha-0-2-release-1` and seed 42. `tests/visual-regression.spec.ts` writes the first ten required stills at 1920x1080, `loop-restart` and the two accessibility stills at 1280x720, and applies 200% browser zoom to `pause-settings`. The inspector separately writes its fixed 1280x720 JSON/PNG pairs for all thirteen states in the same run directory. Capture unpaused motion and close each browser context to finalize video.

```powershell
$env:PLAYWRIGHT_PREVIEW = '1'
npx playwright test tests/visual-regression.spec.ts
Remove-Item Env:PLAYWRIGHT_PREVIEW
$states = @(
  'ghost-terminal','exploration-active','archive-crossing','formation-party',
  'fracture-memory','fracture-bodies','threshold-luminary','threshold-shadow',
  'threshold-ambition','bridge-logo','loop-restart','pause-settings',
  'reduced-motion-fracture'
)
foreach ($state in $states) {
  node "C:\Users\jesse\.agents\skills\threejs-qa-release\scripts\inspect-threejs-canvas.mjs" --url http://127.0.0.1:4188/ --out artifacts/alpha-0-2-release-1 --state $state --seed 42 --run-id alpha-0-2-release-1
  if ($LASTEXITCODE -ne 0) { throw "Release capture failed: $state" }
}
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state archive-crossing --seed 42 --duration 18 --out artifacts/alpha-0-2-release-1/archive-crossing-motion.webm
node tools/capture-motion.mjs --url http://127.0.0.1:4188/ --state threshold-luminary --seed 42 --duration 16 --out artifacts/alpha-0-2-release-1/finale-motion.webm
$env:PLAYWRIGHT_PREVIEW = '1'
npx playwright test tests/bot-playtest.spec.ts
Remove-Item Env:PLAYWRIGHT_PREVIEW
```

The bot writes `artifacts/alpha-0-2-release-1/bot-playtest.json` and proves one complete loop, both routes, all three pairings, deliberate failure, rewind, retry, and restart through real input. Hooks may set initial states but cannot substitute for control input. Capture errors, frames, distance, progress, softlock windows, fail/retry, seed, and assertions. Stop the managed preview job only after all reports and videos are finalized.

- [ ] **Step 5: Write and validate the current-run evidence manifest**

`artifacts/evidence.json` uses `version: 1`, `runId: "alpha-0-2-release-1"`, distinct mode/state/report pairs, and declares only the current release's accepted GLBs, UI/audio manifests, two motion videos, bot JSON, after scorecard, and comparison file. Historical Alpha 0.1 and pre-optimization reports stay available but are not relabelled as current.

`artifacts/final-evidence.md` records:

- release/base commit hashes and exact commands;
- all behavior, input, route, pairing, failure/rewind/retry/restart results;
- every visual capture and motion inspection finding;
- the ten-category showcase scorecard and automatic-failure audit;
- Archive and bridge performance, GPU validity, DPR/post/shadow settings, asset counts and payloads;
- Blender version, every accepted collection/source/GLB/hash/intake/reimport/ledger;
- audio source/provenance/listening/decode/caption result;
- UI zoom/focus/overlap/reduced-motion result;
- optional residue decision and boundedness proof when approved;
- static build path, browser support assumptions, known tradeoffs, and local review command.

```powershell
python "C:\Users\jesse\.agents\skills\threejs-game-director\scripts\check_evidence.py" . --manifest artifacts/evidence.json --report artifacts/final-evidence.md
```

Expected GREEN: checker reads only `alpha-0-2-release-1` reports, all declared files are nontrivial/current, state acknowledgments and run IDs match, and no browser errors are recorded.

- [ ] **Step 6: Run the final clean-room verification**

```powershell
npm ci
npm run asset:validate:release
npm run typecheck
npm run test:unit
npm run test:browser
npm run test:showcase
npm run build
$env:PLAYWRIGHT_PREVIEW = '1'
npx playwright test
Remove-Item Env:PLAYWRIGHT_PREVIEW
python "C:\Users\jesse\.agents\skills\threejs-game-director\scripts\check_evidence.py" . --manifest artifacts/evidence.json --report artifacts/final-evidence.md
git status --short
```

Expected GREEN: every command exits 0; production preview is the tested server; GPU caveat is handled honestly; accepted manifest contains exactly twelve production IDs; renderer/UI/audio/motion/static-host gates pass; only intended final evidence/README changes remain.

- [ ] **Step 7: Commit the release**

```powershell
git add README.md playwright.config.ts tools tests artifacts public src art-src package.json package-lock.json
git commit -m "release: deliver Omega Spiral Alpha 0.2"
git status --short
git log -1 --format='%H %s'
```

Expected: clean working tree and one release commit whose hash is recorded in `artifacts/final-evidence.md`.

- [ ] **Step 8: Check in for remote push or deployment**

Send one validated `CHECK-IN v1` with `status: APPROVE`, release commit hash, full verification commands, exact `dist/` path, scorecard, Archive/bridge budget numbers, reviewer/captain asset acceptance summary, optional-residue decision, known tradeoffs, and a request to push `feat/alpha-0.2-showcase`. Push or deploy only after explicit user confirmation in that turn.

---

## Stop Condition

Stop Alpha 0.2 when Task 12 passes and the local release commit exists. Deliver `dist/`, current-run evidence, accepted immutable asset ledgers/sources, before/after comparison, and local review commands. Do not expand into inventory, loot, combat, new controls, extra phases, new town geometry, additional persistence, backend work, mobile gameplay, or another run-state system. Preserve rejected asset rounds as evidence, keep them out of the runtime manifest and `dist/`, and leave remote push/deployment to a separately approved action.

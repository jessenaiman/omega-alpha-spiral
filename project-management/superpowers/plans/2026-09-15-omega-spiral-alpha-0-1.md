# Omega Spiral Alpha 0.1 Complete Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and release a complete 15–20 minute static Three.js game from Ghost Terminal through instance `N+1` collapse.

**Architecture:** A deterministic `Game` module owns `RunState`, six phase modules, and one fixed update loop. Input emits four intents; domain events update state and drive separate world, era, camera, UI, audio, and VFX modules. Alpha 0.1 uses authored procedural geometry so Alpha 0.2 can replace signature assets through stable factory interfaces.

**Tech Stack:** Node 24.20.0, npm 12.0.2, TypeScript 7.0.2, Vite 8.3.0, Three.js 0.186.0, native Web Audio, Playwright 1.63.0, `tsx` 4.23.13, `pngjs` 7.0.0, glTF Transform 4.5.0.

**Spec:** `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`

## Global Constraints

- Target repository: `C:\SpiralDrive\omega-alpha-spiral`.
- Remote: `https://github.com/jessenaiman/omega-alpha-spiral.git`.
- Static browser release only; no backend, database, Electron, Python runtime, runtime LLM, or CDN module.
- Desktop keyboard/mouse and standard gamepad; no full touch gameplay.
- Controls remain Move, Dash, Contextual Act, and Pause.
- First completion lasts 15–20 minutes; test hooks may enter named states directly.
- Same town layout and landmark identity persist across all phases.
- Alpha 0.1 stores only base instance and loop count in `sessionStorage`; settings use separate storage.
- Reading and naming have no timer.
- All gameplay randomness uses one injected seeded generator.
- Every production behavior follows RED, GREEN, REFACTOR. Record each observed RED failure in task check-in.
- Keep at most two workers active beside captain. Use normal subagents for small precise tasks; reserve AgentTeams for genuinely shared dependency graphs.
- Every delegated prompt names the exact applicable `threejs-*` skill and requires the worker to call and fully follow it, inspect real sources/tool output, and never invent evidence.
- Every delegated task ends with one bounded evidence handoff and one focused Conventional Commit when it changes code.
- The DSH task board is the live task authority. After every completed or blocked task, update `artifacts/game-progress.md` with evidence, not duplicated planning prose.
- Visual-asset tasks load `terra-sol-flash-design-loop` and use the user-approved reviewer route `modlens-openrouter/xiaomi/mimo-v2.5-pro` under its real identity.
- Remote push and deployment require explicit user confirmation during execution.

---

## File Map

```text
README.md                         Run, controls, support, evidence links
AGENTS.md                         Authority, scope, commands, check-in rules
IDEA.md                           Product thesis and Alpha boundaries
package.json                      Exact toolchain and commands
package-lock.json                 npm lock
vite.config.ts                    Static base, dev and preview ports
playwright.config.ts              One-worker real Chromium browser tests
tsconfig.json                     Strict browser TypeScript
index.html                        Accessible application shell
src/main.ts                       Boot and fatal-error boundary
src/styles.css                    Layout, era-safe HUD, zoom and reduced motion
src/core/EventBus.ts              Typed event subscription and disposal
src/core/FixedLoop.ts             Clamped fixed-step update and render
src/core/InputController.ts       Keyboard and gamepad intent edges
src/core/random.ts                Seeded RNG
src/game/types.ts                 Domain types and event union
src/game/run-state.ts             Pure state creation and reduction
src/game/session-store.ts         Instance lineage and settings persistence
src/game/Game.ts                  Deep orchestration module
src/phases/PhaseController.ts     Six-phase seam
src/phases/PhaseDirector.ts       Phase lifecycle and test-state entry
src/phases/GhostTerminalPhase.ts  Naming and three terminal choices
src/phases/ExplorationPhase.ts    Three landmark restoration beats
src/phases/ActionPhase.ts         Three action encounters
src/phases/FormationPhase.ts      Echo recruitment and party test
src/phases/FracturePhase.ts       Memory/bodies route and parallel party
src/phases/ThresholdPhase.ts      Pairing, bridge, logo, collapse
src/world/layout.ts               Stable town coordinates and bounds
src/world/collision.ts            Circle/AABB and sweep collision
src/world/TownWorld.ts            Scene objects, interactables, state views
src/world/ArchiveCrossing.ts      Representative encounter state machine
src/world/EchoRewind.ts           Encounter snapshots and rewind playback
src/visual/EraDirector.ts         Resolution, palette, materials, transition rules
src/visual/CameraDirector.ts      Bounded camera profiles
src/visual/factories.ts           Procedural player, Echo, NPC, landmark, hazard forms
src/visual/OmegaLogo.ts           Original three-strand era variations
src/visual/VfxDirector.ts         Pooled event feedback and reduced-motion variants
src/audio/AudioDirector.ts        Unlock, groups, motif, event cues, cleanup
src/content/script.ts             Approved authored copy and threshold questions
src/ui/GameUi.ts                  HUD, terminal, pause, settings, errors
src/vite-env.d.ts                 Diagnostics and test-hook browser types
tests/unit/*.test.ts              Pure state, input, collision, phase, audio tests
tests/browser/*.spec.ts           Real-input progression and accessibility
tests/bot-playtest.spec.ts        Full route, failure, retry, restart proof
tests/visual-regression.spec.ts   Named deterministic captures
tools/capture-motion.mjs          Unpaused evidence video capture
scripts/inspect-threejs-canvas.mjs Canvas diagnostics tool
assets/references/omega-spiral-logo-reference.png Canonical visual reference, never loaded at runtime
artifacts/evidence.json           Current-run manifest
artifacts/final-evidence.md        Release evidence and scorecard
```

---

### Task 1: Initialize Repository and Runnable Toolchain

**Files:**
- Create: `README.md`
- Create: `AGENTS.md`
- Create: `IDEA.md`
- Create: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/styles.css`
- Create: `tests/browser/boot.spec.ts`
- Create: `scripts/inspect-threejs-canvas.mjs`
- Commit existing: `docs/**`, `artifacts/game-progress.md`, `assets/references/omega-spiral-logo-reference.png`

**Interfaces:**
- Consumes: approved spec and game documents.
- Produces: `npm run dev`, `npm run typecheck`, `npm run test:unit`, `npm run test:browser`, `npm run build`, `npm run preview`, `npm run inspect:canvas`.

- [ ] **Step 1: Create initial Git commit on `main`**

```powershell
New-Item -ItemType Directory -Force C:\SpiralDrive\omega-alpha-spiral | Out-Null
Set-Location C:\SpiralDrive\omega-alpha-spiral
if (-not (Test-Path README.md)) { "# omega-alpha-spiral" | Set-Content README.md }
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/jessenaiman/omega-alpha-spiral.git
git remote -v
git status --short
```

Expected: branch `main`, one commit, remote fetch/push URL matches exactly, design files remain untracked.

- [ ] **Step 2: Check in before first remote push**

Send `CHECK-IN v1` with `status: APPROVE`, exact remote, current commit hash, and request to run:

```powershell
git push -u origin main
```

Run only after explicit approval. Expected: remote `main` tracks `origin/main`.

- [ ] **Step 3: Write exact package manifest**

```json
{
  "name": "omega-alpha-spiral",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "typecheck": "tsc --noEmit",
    "test:unit": "tsx --test tests/unit/*.test.ts",
    "test:browser": "playwright test",
    "test": "npm run test:unit && npm run test:browser",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "inspect:canvas": "node scripts/inspect-threejs-canvas.mjs"
  },
  "dependencies": {
    "lil-gui": "0.21.0",
    "three": "0.186.0"
  },
  "devDependencies": {
    "@gltf-transform/cli": "4.5.0",
    "@playwright/test": "1.63.0",
    "@types/node": "24.13.4",
    "@types/pngjs": "6.0.5",
    "@types/three": "0.186.0",
    "pngjs": "7.0.0",
    "tsx": "4.23.13",
    "typescript": "7.0.2",
    "vite": "8.3.0"
  }
}
```

- [ ] **Step 4: Install exact dependencies and browser**

```powershell
npm install --save-exact three@0.186.0 lil-gui@0.21.0
npm install --save-dev --save-exact vite@8.3.0 typescript@7.0.2 tsx@4.23.13 @types/three@0.186.0 @types/node@24.13.4 @playwright/test@1.63.0 pngjs@7.0.0 @types/pngjs@6.0.5 @gltf-transform/cli@4.5.0
npx playwright install chromium
npm ls --depth=0
```

Expected: exact versions, one `package-lock.json`, no pnpm lock.

- [ ] **Step 5: Write strict static configuration**

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5188, strictPort: true },
  preview: { host: '127.0.0.1', port: 4188, strictPort: true },
  build: { sourcemap: true, chunkSizeWarningLimit: 900 },
});
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "node"],
    "skipLibCheck": true
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:5188',
    channel: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5188',
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
```

- [ ] **Step 6: Write compact agent authority files**

`AGENTS.md` contains only execution-critical pointers and commands:

```md
# Omega Spiral Agent Guide

## Authority
1. `docs/superpowers/specs/2026-09-15-omega-spiral-alpha-design.md`
2. Current Alpha implementation plan under `docs/superpowers/plans/`
3. `docs/game/` contracts for the active subsystem
4. DSH task board assignment

## Coordination
- When role ownership, handoff order, or work lanes are unclear, read `docs/coordination/omega-production-wayfinder.md`.

## Required flows
- Feature or fix: load `test-driven-development`; observe RED before production code.
- Visual asset: load `terra-sol-flash-design-loop`; run Terra → Sol → approved Modlens review → captain pixel review.
- Three.js gameplay, art, UI, audio, or release: load the matching `threejs-*` skill.
- Delegated handoff: end with one validated `CHECK-IN v1`.

## Commands
`npm run typecheck` · `npm run test:unit` · `npm run test:browser` · `npm run build`

## Boundaries
Alpha 0.1 is the full playable loop. Blender replacements and cross-loop residue belong to Alpha 0.2. Use npm only. Keep the reference repository read-only. Never push or deploy without the user's explicit approval.
```

`IDEA.md` states the product thesis, player promise, 15–20 minute loop, Alpha 0.1/0.2 boundary, and one sentence pointing to the master spec instead of repeating its detailed tables. Completion criterion: neither file copies the obsolete prototype architecture or uses Obsidian as task authority.

- [ ] **Step 7: Write RED browser boot test**

```ts
// tests/browser/boot.spec.ts
import { expect, test } from '@playwright/test';

test('boots the Omega Spiral canvas without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();
  await expect(page.locator('[data-game-status]')).toContainText('GHOST TERMINAL');
  expect(errors).toEqual([]);
});
```

Run: `npx playwright test tests/browser/boot.spec.ts`  
Expected RED: canvas or status element missing.

- [ ] **Step 8: Create minimal accessible boot shell**

`index.html` contains one `main`, one game canvas, one live status region, one loading/error region, and module script `/src/main.ts`. `src/main.ts` sets status to `GHOST TERMINAL · INITIALIZING`, creates one Three.js renderer, draws one nonblank frame, handles resize, and renders fatal errors into the live error region. `src/styles.css` makes canvas fill a landscape frame without page scroll.

```ts
import * as THREE from 'three';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('[data-game-canvas]');
const status = document.querySelector<HTMLElement>('[data-game-status]');
if (!canvas || !status) throw new Error('Game shell is incomplete.');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0x070908, 1);
renderer.render(new THREE.Scene(), new THREE.PerspectiveCamera());
status.textContent = 'GHOST TERMINAL · INITIALIZING';
```

- [ ] **Step 9: Copy inspector and verify toolchain**

```powershell
$inspector = "$env:USERPROFILE\.agents\skills\threejs-qa-release\scripts\inspect-threejs-canvas.mjs"
if (-not (Test-Path $inspector)) { throw "Required inspector not found: $inspector" }
Copy-Item $inspector scripts\inspect-threejs-canvas.mjs
npm run typecheck
npx playwright test tests/browser/boot.spec.ts
npm run build
```

Expected GREEN: typecheck, browser boot, and production build pass.

- [ ] **Step 10: Commit authority and setup**

```powershell
git add .gitignore AGENTS.md IDEA.md README.md package.json package-lock.json tsconfig.json vite.config.ts playwright.config.ts index.html src tests scripts docs artifacts assets/references/omega-spiral-logo-reference.png
git commit -m "chore: establish Omega Spiral game workspace"
git status --short
```

Add `.worktrees/`, `node_modules/`, `dist/`, `.test-dist/`, `test-results/`, `playwright-report/`, and `artifacts/pass-*/` to `.gitignore` before commit.

- [ ] **Step 11: Create isolated implementation worktree**

```powershell
git check-ignore -q .worktrees
if ($LASTEXITCODE -ne 0) { throw '.worktrees must be ignored' }
git worktree add .worktrees\alpha-0.1 -b feat/alpha-0.1-complete-loop
```

Expected: later tasks run from `C:\SpiralDrive\omega-alpha-spiral\.worktrees\alpha-0.1`.

---

### Task 2: Deterministic Run State and Session Lineage

**Files:**
- Create: `src/core/random.ts`
- Create: `src/game/types.ts`
- Create: `src/game/run-state.ts`
- Create: `src/game/session-store.ts`
- Create: `tests/unit/run-state.test.ts`
- Create: `tests/unit/session-store.test.ts`

**Interfaces:**
- Consumes: browser `Storage`, injected `() => number` random source.
- Produces: `createRunState(seed, lineage)`, `reduceRun(state, action)`, `loadLineage(storage, random)`, `saveLineage(storage, lineage)`, state-changing `GameAction`, presentation-only `FeedbackEvent`.

- [ ] **Step 1: Write RED state tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRunState, reduceRun } from '../../src/game/run-state.js';

test('three choices and both names advance Ghost Terminal', () => {
  let state = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  state = reduceRun(state, { type: 'player.named', name: 'Jesse' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'role', dreamweaver: 'shadow' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'name', dreamweaver: 'ambition' });
  state = reduceRun(state, { type: 'omega.named', name: 'Omega' });
  assert.equal(state.phase, 'exploration');
  assert.deepEqual(state.affinity, { luminary: 1, shadow: 1, ambition: 1 });
});

test('a terminal question cannot be counted twice', () => {
  const initial = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  const answered = reduceRun(initial, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' });
  assert.throws(
    () => reduceRun(answered, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'shadow' }),
    /Question story already answered/,
  );
  assert.deepEqual(answered.affinity, { luminary: 1, shadow: 0, ambition: 0 });
});

test('collapse resets narrative state and only increments loop', () => {
  const initial = createRunState(42, { baseInstanceId: 472, loopCount: 7 });
  const paired = { ...initial, phase: 'collapse' as const, playerName: 'Jesse', party: ['fighter' as const] };
  const next = reduceRun(paired, { type: 'loop.reset' });
  assert.equal(next.loopCount, 8);
  assert.equal(next.displayInstance, 480);
  assert.equal(next.phase, 'ghost');
  assert.equal(next.playerName, '');
  assert.deepEqual(next.party, []);
});
```

Run: `npm run test:unit`  
Expected RED: modules do not exist.

- [ ] **Step 2: Define exact domain interface**

```ts
export type PhaseId = 'ghost' | 'exploration' | 'action' | 'formation' | 'fracture' | 'threshold' | 'collapse';
export type EraId = PhaseId;
export type DreamweaverId = 'luminary' | 'shadow' | 'ambition';
export type EchoRole = 'fighter' | 'scribe' | 'thief' | 'weaver';
export type TownRoute = 'memory' | 'bodies';
export type LandmarkId = 'archive' | 'refuge' | 'gate';
export type EncounterId = 'first-sweep' | 'shard-route' | 'archive-crossing';
export type TerminalQuestionId = 'story' | 'role' | 'name';

export interface Lineage { baseInstanceId: number; loopCount: number; }
export interface RunState {
  seed: number;
  baseInstanceId: number;
  loopCount: number;
  displayInstance: number;
  phase: PhaseId;
  era: EraId;
  checkpoint: string;
  playerName: string;
  omegaName: string;
  affinity: Record<DreamweaverId, number>;
  party: EchoRole[];
  partyTested: boolean;
  route: TownRoute | null;
  pairedDreamweaver: DreamweaverId | null;
  progress: {
    terminalAnswers: Partial<Record<TerminalQuestionId, DreamweaverId>>;
    landmarks: LandmarkId[];
    encounters: EncounterId[];
    fractureObjectives: number;
  };
}

export type GameAction =
  | { type: 'player.named'; name: string }
  | { type: 'terminal.choice.recorded'; question: TerminalQuestionId; dreamweaver: DreamweaverId }
  | { type: 'omega.named'; name: string }
  | { type: 'landmark.completed'; landmark: LandmarkId }
  | { type: 'encounter.completed'; encounter: EncounterId }
  | { type: 'companion.added'; role: EchoRole }
  | { type: 'party.test.completed' }
  | { type: 'route.committed'; route: TownRoute }
  | { type: 'fracture.objective.completed' }
  | { type: 'dreamweaver.paired'; dreamweaver: DreamweaverId }
  | { type: 'bridge.completed' }
  | { type: 'loop.reset' };

export const FEEDBACK_EVENT_TYPES = [
  'ui.confirm', 'step', 'dash.start', 'act.commit', 'threat.tell', 'threat.contact',
  'landmark.restore', 'companion.recruit', 'rewind.begin', 'rewind.end', 'era.advance',
  'route.commit', 'pair.carry', 'bridge.cross', 'logo.resolve', 'loop.collapse',
] as const;
export type FeedbackEventName = (typeof FEEDBACK_EVENT_TYPES)[number];
export interface FeedbackEvent {
  type: FeedbackEventName;
  sourceId?: string;
  dreamweaver?: DreamweaverId;
  value?: number;
}
```

- [ ] **Step 3: Write pure reducer**

Use immutable copies, reject a second answer for the same terminal question, increment affinity once per accepted answer, insert landmarks/encounters/party roles uniquely, cap the party at three, validate actions against the current phase, and apply these gates:

```ts
const phaseFor = (state: RunState): PhaseId => {
  if (state.phase === 'ghost' && state.playerName && state.omegaName && Object.keys(state.progress.terminalAnswers).length === 3) return 'exploration';
  if (state.phase === 'exploration' && state.progress.landmarks.length === 3) return 'action';
  if (state.phase === 'action' && state.progress.encounters.length === 3) return 'formation';
  if (state.phase === 'formation' && state.party.length === 3 && state.partyTested) return 'fracture';
  if (state.phase === 'fracture' && state.route && state.progress.fractureObjectives === 3) return 'threshold';
  if (state.phase === 'threshold' && state.pairedDreamweaver) return state.phase;
  return state.phase;
};
```

`bridge.completed` requires threshold plus pairing and sets `collapse`. After the 1.5-second presentation beat, `loop.reset` calls `createRunState` with unchanged seed/base and incremented loop. `FeedbackEvent` never enters the reducer. Invalid phase actions throw `Invalid action <type> during <phase>`.

- [ ] **Step 4: Write RED session tests and storage implementation**

```ts
test('lineage uses one three-digit base and preserves loop count', () => {
  const storage = new MapStorage();
  const first = loadLineage(storage, () => 0.413);
  assert.deepEqual(first, { baseInstanceId: 471, loopCount: 0 });
  saveLineage(storage, { baseInstanceId: 471, loopCount: 2 });
  assert.deepEqual(loadLineage(storage, () => 0.999), { baseInstanceId: 471, loopCount: 2 });
});
```

Use key `omega-spiral.lineage.v1`. Compute base as `100 + Math.floor(random() * 900)`. Reject malformed/out-of-range stored values and replace them with a fresh lineage. Keep settings under another key.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit
npm run typecheck
git add src/core/random.ts src/game tests/unit
git commit -m "feat: define deterministic Omega run state"
```

Expected: all unit tests pass; no `Math.random` exists in `src/`.

---

### Task 3: Fixed Loop and Keyboard/Gamepad Intents

**Files:**
- Create: `src/core/FixedLoop.ts`
- Create: `src/core/InputController.ts`
- Create: `tests/unit/input.test.ts`
- Create: `tests/unit/fixed-loop.test.ts`

**Interfaces:**
- Consumes: `requestAnimationFrame`, keyboard events, `navigator.getGamepads`.
- Produces: `InputFrame`, `InputController.sample()`, `InputController.dispose()`, `FixedLoop.start()`, `FixedLoop.stop()`.

- [ ] **Step 1: Write RED input mapping tests**

```ts
test('keyboard maps Move, Dash, Act, and Pause with pressed edges', () => {
  const state = mapInput(new Set(['KeyW', 'KeyD', 'Space', 'KeyE', 'Escape']), null, EMPTY_BUTTONS);
  assert.ok(Math.abs(state.move.x - Math.SQRT1_2) < 0.001);
  assert.ok(Math.abs(state.move.y + Math.SQRT1_2) < 0.001);
  assert.equal(state.dashPressed, true);
  assert.equal(state.actPressed, true);
  assert.equal(state.pausePressed, true);
});

test('standard gamepad uses left stick, south Dash, west Act, menu Pause', () => {
  const pad = fakePad([0.5, -1], { 0: true, 2: true, 9: true });
  const state = mapInput(new Set(), pad, EMPTY_BUTTONS);
  assert.deepEqual(state.move, { x: 0.4472135954999579, y: -0.8944271909999159 });
  assert.equal(state.dashPressed, true);
  assert.equal(state.actPressed, true);
  assert.equal(state.pausePressed, true);
});

test('clamps noisy and out-of-range gamepad axes', () => {
  assert.deepEqual(mapInput(new Set(), fakePad([0.1, -0.1], {}), EMPTY_BUTTONS).move, { x: 0, y: 0 });
  assert.deepEqual(mapInput(new Set(), fakePad([2, 0], {}), EMPTY_BUTTONS).move, { x: 1, y: 0 });
});
```

Run: `npm run test:unit`  
Expected RED: `mapInput` is missing.

- [ ] **Step 2: Implement intent frame and edge detection**

```ts
export interface InputFrame {
  move: Readonly<{ x: number; y: number }>;
  dashPressed: boolean;
  actPressed: boolean;
  pausePressed: boolean;
}

export function mapInput(keys: ReadonlySet<string>, pad: Gamepad | null, previous: ButtonState): InputFrame {
  const rawX = Math.max(-1, Math.min(1, pad?.axes[0] ?? 0));
  const rawY = Math.max(-1, Math.min(1, pad?.axes[1] ?? 0));
  const axisX = Math.abs(rawX) >= 0.18 ? rawX : 0;
  const axisY = Math.abs(rawY) >= 0.18 ? rawY : 0;
  const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + axisX;
  const y = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + axisY;
  const length = Math.hypot(x, y);
  const move = length > 1 ? { x: x / length, y: y / length } : { x, y };
  const current = {
    dash: keys.has('Space') || Boolean(pad?.buttons[0]?.pressed),
    act: keys.has('KeyE') || keys.has('Enter') || Boolean(pad?.buttons[2]?.pressed),
    pause: keys.has('Escape') || Boolean(pad?.buttons[9]?.pressed),
  };
  return {
    move,
    dashPressed: current.dash && !previous.dash,
    actPressed: current.act && !previous.act,
    pausePressed: current.pause && !previous.pause,
  };
}
```

`InputController.sample()` updates previous button state after mapping. Blur and visibility loss clear held keys. Prevent default only for gameplay keys while canvas owns focus.

- [ ] **Step 3: Write RED fixed-loop test**

Use injected frame scheduler. Advance one 100 ms frame and assert five 1/60-second updates maximum plus one render. Assert tab-resume delta clamps to 100 ms.

- [ ] **Step 4: Implement fixed-step loop**

```ts
const STEP = 1 / 60;
const MAX_FRAME = 0.1;
const MAX_STEPS = 5;

export class FixedLoop {
  private accumulator = 0;
  private running = false;
  private lastMs = 0;
  constructor(private readonly update: (dt: number) => void, private readonly render: (alpha: number) => void) {}
  tick(nowMs: number): void {
    const frame = Math.min(Math.max((nowMs - this.lastMs) / 1000, 0), MAX_FRAME);
    this.lastMs = nowMs;
    this.accumulator += frame;
    let steps = 0;
    while (this.accumulator >= STEP && steps < MAX_STEPS) {
      this.update(STEP);
      this.accumulator -= STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS) this.accumulator = 0;
    this.render(this.accumulator / STEP);
  }
}
```

`start()` owns one RAF chain. `stop()` cancels it. No other module calls RAF.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit
npm run typecheck
git add src/core tests/unit
git commit -m "feat: add deterministic input and fixed loop"
```

---

### Task 4: Typed Events, Phase Seam, and Game Orchestrator

**Files:**
- Create: `src/core/EventBus.ts`
- Create: `src/phases/PhaseController.ts`
- Create: `src/phases/PhaseDirector.ts`
- Create: `src/game/Game.ts`
- Modify: `src/main.ts`
- Create: `tests/unit/event-bus.test.ts`
- Create: `tests/unit/phase-director.test.ts`

**Interfaces:**
- Consumes: `RunState`, `GameAction`, `FeedbackEvent`, `InputFrame`, phase module map.
- Produces: `EventBus.emit/subscribe`, `PhaseController`, `PhaseDirector.update`, `Game.start/dispose/commit/emit/setTestState`.

- [ ] **Step 1: Write RED event and lifecycle tests**

Test that subscription receives one typed feedback event, disposer stops delivery, entering a new phase calls old `exit()` before new `enter()`, threshold-to-collapse retains the same `ThresholdPhase` instance, and `dispose()` exits current phase once.

- [ ] **Step 2: Implement deep event module**

```ts
export class EventBus {
  private readonly listeners = new Set<(event: FeedbackEvent) => void>();
  emit(event: FeedbackEvent): void { for (const listener of this.listeners) listener(event); }
  subscribe(listener: (event: FeedbackEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  clear(): void { this.listeners.clear(); }
}
```

- [ ] **Step 3: Define phase interface**

```ts
export interface PhaseContext {
  getState(): Readonly<RunState>;
  commit(action: GameAction, feedback?: readonly FeedbackEvent[]): void;
  emit(event: FeedbackEvent): void;
  setObjective(text: string): void;
  setTargetVerb(text: string | null): void;
}

export interface PhaseController {
  readonly id: PhaseId;
  enter(context: PhaseContext): void;
  update(dt: number, input: InputFrame): void;
  exit(): void;
  setTestState(name: string): boolean;
}
```

`PhaseDirector` owns exactly one active controller. The `collapse` state intentionally remains owned by `ThresholdPhase` until `loop.reset`; all other phase changes exit the old controller before entering the new one. Unknown named states throw. State transition changes controller only after the reducer accepts an action.

- [ ] **Step 4: Write `Game` orchestration shell**

`reduceRun(state, action)` remains the pure domain function from Task 2. `Game.commit(action, feedback)` is its transactional runtime wrapper: it runs `reduceRun`, persists lineage only after `loop.reset`, emits the supplied presentation events after the action is accepted, then asks `PhaseDirector` to synchronize phase. `Game.emit(feedback)` handles movement, tells, VFX, and audio that do not change run state. Audio and VFX subscribe only to `FeedbackEvent`; they cannot dispatch `GameAction`. A reducer or transition invariant error stops simulation and renders the diagnostic terminal through `GameUi.showError`; the game never continues with partial state. `update` samples input once, toggles pause on edge, updates active phase when unpaused, then publishes diagnostics. `dispose` stops loop, phase, input, event subscriptions, renderer, audio, and browser hooks.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit
npm run typecheck
npm run build
git add src tests/unit
git commit -m "feat: establish phase and event orchestration"
```

---

### Task 5: Era Renderer and Bounded Camera

**Files:**
- Create: `src/visual/EraDirector.ts`
- Create: `src/visual/CameraDirector.ts`
- Create: `src/world/layout.ts`
- Create: `tests/unit/era-director.test.ts`
- Create: `tests/unit/camera-director.test.ts`

**Interfaces:**
- Consumes: `PhaseId`, viewport size, player position, reduced-motion setting.
- Produces: `ERA_PROFILES`, `EraDirector.apply(phase)`, `CameraDirector.apply(phase)`, stable `TOWN_LAYOUT`.

- [ ] **Step 1: Write RED era profile test**

```ts
assert.deepEqual(ERA_PROFILES.ghost.internalSize, [480, 360]);
assert.equal(ERA_PROFILES.ghost.aspect, 4 / 3);
assert.deepEqual(ERA_PROFILES.exploration.internalSize, [640, 480]);
assert.deepEqual(ERA_PROFILES.action.internalSize, [960, 600]);
assert.deepEqual(ERA_PROFILES.formation.internalSize, [1280, 720]);
assert.deepEqual(ERA_PROFILES.threshold.internalSize, [1920, 1080]);
assert.equal(ERA_PROFILES.fracture.allowRotatedGlitch, false);
```

Define profiles for all seven state phases. `collapse` reuses threshold resolution during collapse, then ghost after state reset.

- [ ] **Step 2: Implement profile application**

Each profile defines internal size, aspect, color depth, nearest/linear filtering, material mode, motif layer count, scanline strength, and allowed post effects. `EraDirector` letterboxes within landscape CSS frame, caps DPR at 2, disposes replaced render targets, and never changes renderer size per frame.

- [ ] **Step 3: Write RED camera test**

Assert exact profile values: exploration orthographic north-up; action orthographic 55° pitch; formation perspective FOV 38 and pitch 50°; fracture perspective FOV 45 and no roll; threshold FOV 35. Reduced motion sets shake, roll, and FOV impulse multipliers to zero.

- [ ] **Step 4: Implement camera module and town constants**

```ts
export const TOWN_LAYOUT = {
  square: { x: 0, z: 0 },
  archive: { x: -8, z: 1 },
  refuge: { x: 8, z: 1 },
  gate: { x: 0, z: 10 },
  bridgeEnd: { x: 0, z: 18 },
  bounds: { minX: -13, maxX: 13, minZ: -8, maxZ: 20 },
} as const;
```

Camera follow uses critically damped position easing with 0.18-second response. No input path mutates yaw.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit
npm run typecheck
npm run build
git add src/visual src/world/layout.ts tests/unit
git commit -m "feat: define display eras and camera grammar"
```

---

### Task 6: Accessible UI, Settings, and Error States

**Files:**
- Create: `src/ui/GameUi.ts`
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `src/game/session-store.ts`
- Create: `tests/browser/ui.spec.ts`
- Create: `tests/unit/settings-store.test.ts`

**Interfaces:**
- Consumes: immutable `UiView`, user menu intents.
- Produces: `GameUi.render(view)`, `GameUi.showError`, `GameUi.onIntent`, `GameSettings`.

- [ ] **Step 1: Write RED browser UI tests**

Test keyboard focus through name input, three choice buttons, pause, settings, resume, captions toggle, reduced motion, Wide Timing, text speed, and volume fields. Set browser zoom to 200% with CDP or CSS emulation and assert HUD rectangles do not overlap canvas center or each other.

- [ ] **Step 2: Define UI interface**

```ts
export interface UiView {
  mode: 'loading' | 'name-entry' | 'terminal-choice' | 'play' | 'rewind' | 'pause' | 'settings' | 'error' | 'collapse';
  instanceLabel: string;
  objective: string;
  targetVerb: string | null;
  party: readonly EchoRole[];
  prompt: string | null;
  options: readonly { id: string; label: string }[];
  caption: string | null;
}
```

`GameUi` owns DOM only. It emits `name.submit`, `choice.select`, `pause.toggle`, `settings.change`, `retry.encounter`, and `restart.run` UI intents. It never mutates `RunState`.

- [ ] **Step 3: Build exact state surfaces**

Use one top-left objective, fixed-width top-right instance, near-target verb, bottom party glyph strip, terminal choice list, pause menu, settings panel, and live caption region. Buttons expose focus, hover, pressed, and disabled states. Error surface names WebGL or required asset failure and offers Reload. Debug UI remains absent unless URL has `?debug=1`.

- [ ] **Step 4: Store settings separately**

Use key `omega-spiral.settings.v1`. Persist `{ captions: true, reducedMotion: mediaQueryDefault, wideTiming: false, textSpeed: 1, master: 0.8, music: 0.6, ambience: 0.6, sfx: 0.7, ui: 0.5 }`. The audio-matrix values are initialization defaults; after load, this validated settings snapshot is the runtime authority for current gain and mute. Validate all volume values in `[0,1]`; text speed accepts `0.5`, `1`, or `1.5`. Alpha 0.2 adds a separate voice bus only if selected voiced assets ship.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:unit
npx playwright test tests/browser/ui.spec.ts
npm run build
git add index.html src tests
git commit -m "feat: add accessible game interface and settings"
```

---

### Task 7: Event-driven Audio and VFX Foundations

**Files:**
- Create: `src/audio/AudioDirector.ts`
- Create: `src/visual/VfxDirector.ts`
- Create: `tests/unit/audio-cues.test.ts`
- Create: `tests/browser/audio.spec.ts`

**Interfaces:**
- Consumes: presentation-only `FeedbackEvent`, `EraId`, settings, reduced-motion flag.
- Produces: `AudioDirector.unlock/handle/pause/dispose`, `VfxDirector.handle/update/dispose`.

- [ ] **Step 1: Write RED cue-map tests**

Assert all required event types map to one cue definition, `step` has 90 ms cooldown, `threat.tell` cannot overlap itself, `loop.collapse` stops motif layers, and reduced motion replaces camera impulse with opacity/ring feedback.

- [ ] **Step 2: Implement exact cue map**

```ts
type AudioBus = 'music' | 'ambience' | 'sfx' | 'ui';
interface CueDefinition { group: AudioBus; duration: number; cooldown: number; }

export const AUDIO_CUES = {
  'ui.confirm': { group: 'ui', duration: 0.08, cooldown: 0.04 },
  step: { group: 'sfx', duration: 0.06, cooldown: 0.09 },
  'dash.start': { group: 'sfx', duration: 0.18, cooldown: 0.15 },
  'act.commit': { group: 'sfx', duration: 0.22, cooldown: 0.08 },
  'threat.tell': { group: 'sfx', duration: 0.45, cooldown: 0.45 },
  'threat.contact': { group: 'sfx', duration: 0.35, cooldown: 0.2 },
  'landmark.restore': { group: 'music', duration: 1.2, cooldown: 0.5 },
  'companion.recruit': { group: 'music', duration: 1.5, cooldown: 0.5 },
  'rewind.begin': { group: 'sfx', duration: 0.6, cooldown: 0.6 },
  'rewind.end': { group: 'sfx', duration: 0.24, cooldown: 0.2 },
  'era.advance': { group: 'sfx', duration: 1.8, cooldown: 1.8 },
  'route.commit': { group: 'music', duration: 2.0, cooldown: 2.0 },
  'pair.carry': { group: 'music', duration: 2.2, cooldown: 2.2 },
  'bridge.cross': { group: 'music', duration: 1.5, cooldown: 1.0 },
  'logo.resolve': { group: 'music', duration: 2.4, cooldown: 2.4 },
  'loop.collapse': { group: 'music', duration: 1.5, cooldown: 1.5 },
} as const;
```

The `ambience` bus is owned by persistent motif/town-bed layers, including relay clicks; it is intentionally absent from the discrete `AUDIO_CUES` event map.

- [ ] **Step 3: Build native Web Audio module**

Create AudioContext only from first user gesture. Create `master`, `music`, `ambience`, `sfx`, and `ui` gains. Synthesize event cues from oscillators, filtered noise buffers, gain envelopes, and era-dependent waveforms. Maintain one motif scheduler. Pause on game pause or page hidden. Stop and disconnect every source on restart/dispose. Show one non-blocking status if context creation or decode fails.

- [ ] **Step 4: Build pooled VFX module**

Pool rings, traces, shards, and textless target pulses. Map events to contact flash, Dash trail, Act ring, sweep tell, rewind trace, recruit glyph, route split, pairing strand, and collapse fracture. Keep each effect clear of collision volume and next target. Reduced motion uses opacity/scale with no shake, strobe, or rapid displacement.

- [ ] **Step 5: Verify browser lifecycle and commit**

Browser test clicks unlock, triggers two events, pauses, resumes, restarts, hides/restores page, and asserts diagnostics show one motif scheduler and zero duplicate loops.

```powershell
npm run test:unit
npx playwright test tests/browser/audio.spec.ts
npm run build
git add src/audio src/visual tests
git commit -m "feat: add event audio and feedback directors"
```

---

### Task 8: Procedural Town and Readable Character Kit

**Files:**
- Create: `src/world/collision.ts`
- Create: `src/world/TownWorld.ts`
- Create: `src/visual/factories.ts`
- Create: `tests/unit/collision.test.ts`
- Create: `tests/browser/world.spec.ts`

**Interfaces:**
- Consumes: `TOWN_LAYOUT`, era material roles, `RunState`.
- Produces: `TownWorld.enterPhase/update/getNearestActTarget/snapshot/restore/dispose`, procedural visual factories.

- [ ] **Step 1: Pass one representative visual kit through the design team**

Load `terra-sol-flash-design-loop`. Create immutable brief and ledger under `artifacts/assets/alpha01-visual-language/`. Terra (`openai-codex/gpt-5.6-terra`) creates one town/player/Archive gameplay-frame draft from the locked art-direction rules. Sol (`openai-codex/gpt-5.6-sol`) converts the selected language into a procedural in-engine candidate at the Town Space camera. The user-approved critic route `modlens-openrouter/xiaomi/mimo-v2.5-pro` reviews actual source, target-size, silhouette, and active-play captures under its real Modlens identity. Captain views the same pixels and accepts or starts another complete round, capped at three. If that exact reviewer route is unavailable, preserve the provisional candidate, continue Tasks 8–14 behind the procedural factory seam, and keep it out of the accepted manifest; retry the gate before Task 15 rather than substituting another model. Completion criterion: one accepted visual-language version/hash exists before visual propagation in Task 15.

- [ ] **Step 2: Write RED collision tests**

Test circle/AABB separation at town bounds, sweep-sector contact, last-safe position, target proximity ordering, and no collision against visual-only instanced detail.

- [ ] **Step 3: Build role-readable factories**

Each factory returns `{ group, collision, setState, dispose }`.

```ts
export type VisualState = 'idle' | 'move' | 'dash' | 'act' | 'danger' | 'fail';
export interface GameVisual {
  group: THREE.Group;
  collision: { radius: number; offsetY: number };
  setState(state: VisualState): void;
  dispose(): void;
}
```

Player uses tapered torso, split shoulder/arm groups, leg pivots, asymmetric signal mantle, central Omega aperture, ground contact, and three named VFX sockets. Echoes preserve body grammar but add distinct tool and silhouette: Fighter shield wedge, Scribe ribbon/quill, Thief split cloak/hooks, Weaver forked resonance staff. Dreamweavers use continuous arc, doubled broken trace, or angular filament geometry. No role relies on hue alone.

- [ ] **Step 4: Build persistent town kit**

Create custom Archive, refuge, gate, bridge, resident, anchor node, instability shard, and sweep origin. Build repeated homes, windows, lamps, rails, debris, and paving through shared geometry/materials and `InstancedMesh`. Preserve landmark coordinates through every phase; era changes materials/detail visibility, not topology.

- [ ] **Step 5: Integrate town state views**

`TownWorld` owns scene groups and collision proxies. It provides phase-specific visibility, interactable registry, safe-tile tracking, and deterministic snapshots. One target-selection function returns verb and target ID before Act.

- [ ] **Step 6: Verify active-play readability and commit**

Browser test enters a named world state, asserts player and three landmarks fall within camera frustum, verifies nearest target verb, and checks renderer diagnostics below Alpha budget.

```powershell
npm run test:unit
npx playwright test tests/browser/world.spec.ts
npm run build
git add src/world src/visual/factories.ts tests artifacts/assets/alpha01-visual-language assets/concepts/alpha01-visual-language
git commit -m "feat: author persistent procedural town kit"
```

---

### Task 9: Ghost Terminal and Exploration Phases

**Files:**
- Create: `src/content/script.ts`
- Create: `src/phases/GhostTerminalPhase.ts`
- Create: `src/phases/ExplorationPhase.ts`
- Create: `tests/unit/ghost-phase.test.ts`
- Create: `tests/unit/exploration-phase.test.ts`
- Create: `tests/browser/opening.spec.ts`

**Interfaces:**
- Consumes: phase context, UI intents, town targets.
- Produces: name/choice/landmark events and transition into action.

- [ ] **Step 1: Write RED Ghost Terminal test**

Drive name entry, three choices with owners Luminary/Shadow/Ambition, reciprocal Omega naming, and assert exactly one transition to exploration. Assert no timer changes selected option or advances copy.

- [ ] **Step 2: Write approved content data**

Use the approved master design and these locked motifs: “The spiral remembers all stories. But it begins with yours.”, “Do names define us or deceive us?”, `∞ ◊ Ω ≋ ※`, and “Welcome to the game that chose you.” Assign the silver-white continuous-arc option to `luminary`; never select a Dreamweaver escort here. Include three choice groups, one response per owner, player-name validation of 1–24 visible characters, and Omega-name validation of 1–24 visible characters.

- [ ] **Step 3: Build terminal phase**

Render instance line, player-name input, three choice groups, symbol reveal, Omega-name input, and shutdown. Emit one event per accepted action. Block double submission during teletype response. Reduced motion renders complete lines without character-by-character flicker.

- [ ] **Step 4: Write RED exploration test**

Move to Archive, refuge, and gate targets in any order. Assert duplicate Acts do not increment progress, first landmark has no hazard, each success emits restoration feedback, and third restoration advances to action.

- [ ] **Step 5: Build exploration phase**

Use orthographic north-up map. Move player icon at 4.8 world units/second. Target radius is 1.1 units. Act restores landmark and reveals next fidelity layer. After first restoration, introduce non-damaging blackout strips that pause movement for 250 ms and teach anticipation without failure.

- [ ] **Step 6: Verify real opening and commit**

```powershell
npm run test:unit
npx playwright test tests/browser/opening.spec.ts
npm run build
git add src/content src/phases tests
git commit -m "feat: build terminal and town exploration"
```

---

### Task 10: Action Encounters and Echo Rewind

**Files:**
- Create: `src/world/ArchiveCrossing.ts`
- Create: `src/world/EchoRewind.ts`
- Create: `src/phases/ActionPhase.ts`
- Create: `tests/unit/archive-crossing.test.ts`
- Create: `tests/unit/echo-rewind.test.ts`
- Create: `tests/browser/action.spec.ts`

**Interfaces:**
- Consumes: input frames, town collision, settings.
- Produces: encounter clear/fail events, deterministic snapshot restore, action objective view.

- [ ] **Step 1: Write RED encounter state-machine tests**

Test states `intro`, `anchor-left`, `anchor-right`, `cross`, `guard`, `complete`, `rewinding`. Assert sweep tell lasts 700 ms, active sweep lasts 550 ms, base safe interval lasts 900 ms, Wide Timing safe interval lasts 1,350 ms, both anchors precede crossing, and guard requires 1,200 ms held Act.

- [ ] **Step 2: Implement collision and encounter timing**

Represent sweep as origin, start angle, angular width, radius, tell/active phase. During active phase, contact with player or unguarded resident fails. Instability shard is vulnerable only during recovery. Context verb resolves by nearest valid target: node `STABILIZE`, shard `DISRUPT`, resident `GUARD`.

- [ ] **Step 3: Write RED rewind tests**

Capture snapshot at encounter entry. On fail, assert the gameplay rewind state ignores input for exactly 1.25 seconds per `docs/game/core-loop-contract.md`; audio and VFX are nonblocking consequences. Assert snapshot restores player/hazard/target/camera/encounter affinity, prior phase state remains, failed path samples remain visible only until next success, and Retry Encounter restores immediately.

- [ ] **Step 4: Implement snapshot rewind**

```ts
export interface EncounterSnapshot {
  player: { x: number; z: number; facing: number };
  hazardClock: number;
  targetStates: Readonly<Record<string, string>>;
  encounterAffinity: Record<DreamweaverId, number>;
}
```

Store at encounter start. Record at most 120 path samples. Playback samples backward during rewind, then restore snapshot atomically. Stuck detector returns player after 1 second without displacement while input magnitude exceeds 0.5. Objective hint pulses at 30 seconds.

- [ ] **Step 5: Add first and combined encounters**

First Sweep teaches Dash with one lane and no Act target. Shard Route adds one optional instability shard and narrowing safe space. Archive Crossing is the 90–120 second capstone and proves the full read–move–commit–feedback loop through the exact six beats in `docs/game/level-encounter-plan.md`. Each encounter has a breathing-space exit and distinct restoration reward.

- [ ] **Step 6: Verify real failure/retry and commit**

```powershell
npm run test:unit
npx playwright test tests/browser/action.spec.ts
npm run build
git add src/world src/phases tests
git commit -m "feat: add action encounters and Echo rewind"
```

---

### Task 11: Echo Formation and Contextual Act Modifiers

**Files:**
- Create: `src/phases/FormationPhase.ts`
- Create: `src/game/act-modifiers.ts`
- Create: `tests/unit/formation-phase.test.ts`
- Create: `tests/unit/act-modifiers.test.ts`
- Create: `tests/browser/formation.spec.ts`

**Interfaces:**
- Consumes: `EchoRole[]`, base Act target.
- Produces: `resolveContextualAct(base, party)`, recruitment events, party-test event.

- [ ] **Step 1: Write RED role tests**

Assert Fighter converts guarded barrier into `BREAK`; Scribe converts hidden record into `REVEAL`; Thief converts blocked passage into `BYPASS`; Weaver converts unstable beam into `REDIRECT`. Assert modifiers never change a friendly target into an attack and priority follows nearest explicit target, then role order in current party.

- [ ] **Step 2: Implement one pure resolver**

```ts
export type BaseAct = 'INSPECT' | 'GUARD' | 'STABILIZE' | 'DISRUPT';
export type ResolvedAct = BaseAct | 'BREAK' | 'REVEAL' | 'BYPASS' | 'REDIRECT';
export function resolveContextualAct(base: BaseAct, traits: readonly string[], party: readonly EchoRole[]): ResolvedAct;
```

Use one table keyed by role and required target trait. Return base action when no role applies.

- [ ] **Step 3: Write RED recruitment test**

Recruit any three unique candidates. Assert fourth candidate becomes `parallelPartyEcho`, fourth direct recruitment is rejected, each recruit triggers a safe micro-test, and formation advances only after three recruits plus shared party test.

- [ ] **Step 4: Build formation phase**

Place four candidates around civic square. Each has one 20–30 second dilemma and one role target. Physical Act selects candidate. Display portrait/glyph and one-line role effect. Final party test presents four simultaneous target traits but requires only the three selected roles; missing role gets a slower base-action route so no composition softlocks.

- [ ] **Step 5: Verify all four omissions and commit**

Run unit permutations for omitted Fighter, Scribe, Thief, and Weaver. Browser test recruits one concrete party through real movement and Act.

```powershell
npm run test:unit
npx playwright test tests/browser/formation.spec.ts
npm run build
git add src/game src/phases tests
git commit -m "feat: build Echo party formation"
```

---

### Task 12: Town Fracture and Parallel Route

**Files:**
- Create: `src/phases/FracturePhase.ts`
- Create: `src/game/fracture-objectives.ts`
- Create: `tests/unit/fracture-phase.test.ts`
- Create: `tests/browser/fracture.spec.ts`

**Interfaces:**
- Consumes: party, route choice, town targets.
- Produces: route commit, three objective events, parallel-party progress view, threshold transition.

- [ ] **Step 1: Write RED route tests**

Test memory and bodies routes separately. Assert first physical Act at Archive/refuge commits route, chosen route exposes exactly three player objectives, parallel party receives three complementary objectives, both finish before threshold, and all four party omissions remain completable.

- [ ] **Step 2: Define exact objective data**

Memory objectives: preserve resident names at Archive index, carry testimony core through one sweep, seal identity ledger at gate. Bodies objectives: shield evacuation line, clear two collapsing passages, hold refuge gate through final sweep. Parallel party progress advances on each player objective and stays visible across town fracture.

- [ ] **Step 3: Build fracture phase**

Start in stable 45° camera. Place Archive and refuge calls at equal distance. Commit only when player holds Act for 800 ms inside one zone. Use known sweep/shard/role rules in three escalating combinations. No dialogue timer. Show parallel party as distant silhouettes performing complementary animation and restoring the opposite half of town.

- [ ] **Step 4: Verify both routes and commit**

```powershell
npm run test:unit
npx playwright test tests/browser/fracture.spec.ts
npm run build
git add src/game src/phases tests
git commit -m "feat: add town fracture route commitment"
```

---

### Task 13: Threshold, Logo, Bridge, Collapse

**Files:**
- Create: `src/phases/ThresholdPhase.ts`
- Create: `src/visual/OmegaLogo.ts`
- Create: `assets/concepts/omega-logo/**`
- Create: `artifacts/assets/omega-logo/**`
- Modify: `src/content/script.ts`
- Create: `tests/unit/threshold-phase.test.ts`
- Create: `tests/unit/omega-logo.test.ts`
- Create: `tests/browser/finale.spec.ts`

**Interfaces:**
- Consumes: final state, Dreamweaver approach zones, Act hold.
- Produces: paired Dreamweaver, bridge crossing, new era-specific Omega logo variation, collapse, lineage increment.

- [ ] **Step 1: Write RED pairing tests**

Approach each Dreamweaver. Assert question appears only within 2.5 units, leaving clears hold progress, hold requires 1.4 seconds, pairing locks only after hold, other presences remain visible until commitment, and no affinity value overrides selected presence.

- [ ] **Step 2: Add exact question copy**

```ts
export const THRESHOLD_QUESTIONS = {
  luminary: 'If every version of you was sacrificed so this one could cross, which of you gets to call the crossing hope?',
  shadow: 'If the loop preserves every lie you needed to become yourself, which truth could you remove without becoming someone else?',
  ambition: 'If you escape only by becoming someone none of your former selves would recognize, who chose the change?',
} as const;
```

- [ ] **Step 3: Build three-presence choice and bridge**

Use wide fixed frame for inspection. After pairing, shift to the 35° bridge rail. Require player to cross through real Move input. Emit `bridge.cross` when the player first enters the bridge lane. At the far trigger, commit `bridge.completed`; `PhaseDirector` keeps `ThresholdPhase` alive as the owner of the `collapse` continuation. Then show authored prologue copy, emit `logo.resolve`, and hold the coherent 1920×1080 profile for 2.0 seconds. Emit presentation-only `loop.collapse`, play the 1.5-second collapse, then commit `loop.reset` with no audio-owned state transition and boot terminal at instance `N+1`; this order is the Restart contract in `docs/game/audio-matrix.md` Section 7.

- [ ] **Step 4: Reconstruct three-strand logo**

Build three independent `THREE.CatmullRomCurve3` paths and `TubeGeometry` strands. Profiles change segment count, stroke continuity, color depth, and motion rhythm. Luminary stays continuous, Shadow uses doubled broken segments, Ambition uses angular control points. Test bounding box fits each 4:3, 16:10, and 16:9 safe frame without cropping.

- [ ] **Step 5: Verify all pairings and restart**

```powershell
npm run test:unit
npx playwright test tests/browser/finale.spec.ts
npm run build
git add src/content src/phases src/visual tests
git commit -m "feat: complete threshold and loop collapse"
```

---

### Task 14: Integrate Game, Diagnostics, Test Hooks, and Bot Runs

**Files:**
- Modify: `src/game/Game.ts`
- Modify: `src/main.ts`
- Create: `src/vite-env.d.ts`
- Create: `tests/bot-playtest.spec.ts`
- Create: `tests/visual-regression.spec.ts`
- Create: `tools/capture-motion.mjs`

**Interfaces:**
- Consumes: all phase and presentation modules.
- Produces: full real-input game, `window.__THREE_GAME_DIAGNOSTICS__`, `window.__THREE_GAME_TEST_HOOKS__`.

- [ ] **Step 1: Write RED diagnostics browser test**

Assert diagnostics publish run ID, frame, elapsed, instance, loop, phase, checkpoint, objective, target verb, complete/fail, player position/speed, party, route, pairing, era, pause/accessibility/audio state, canvas dimensions, active audio sources, renderer calls/triangles/geometries/textures, captured runtime errors, browser console errors, page errors, and failed network requests. Assert frames advance under play and stop changing simulation state under screenshot pause.

- [ ] **Step 2: Install exact test-hook contract**

```ts
window.__THREE_GAME_TEST_HOOKS__ = {
  seed: value => game.seed(value),
  setState: async name => game.setTestState(name),
  setPausedForScreenshot: paused => game.setPausedForScreenshot(paused),
  setReducedMotion: enabled => game.setReducedMotion(enabled),
  hideDebugUi: hidden => game.hideDebugUi(hidden),
};
```

Supported names: `ghost-terminal`, `exploration-active`, `archive-crossing`, `formation-party`, `fracture-memory`, `fracture-bodies`, `threshold-luminary`, `threshold-shadow`, `threshold-ambition`, `bridge-logo`, `loop-restart`, `pause-settings`, `reduced-motion-fracture`, `fail-rewind`. Unknown names throw. Every state returns `{ state: name }` only after assets, camera, UI, and render frame are ready. For deterministic capture, `loop-restart` prepares a lineage snapshot by exercising the same `loop.reset` reducer path; the full bot run separately proves that real bridge play reaches that action.

- [ ] **Step 3: Write two real-input bot runs**

Memory bot chooses one terminal path, restores landmarks, clears all encounters, recruits Fighter/Scribe/Thief, completes memory route, pairs Luminary, crosses bridge, and observes loop increment. Bodies bot recruits Fighter/Thief/Weaver, deliberately fails Archive Crossing once, verifies rewind/retry, completes bodies route, pairs Shadow, crosses, and observes loop increment. A targeted threshold test reaches Ambition through real movement and Act.

Record frame advance, distance, phase progression, softlock windows, first failure, retry recovery, console/page errors, and final loop value.

- [ ] **Step 4: Add deterministic visual and motion tests**

Visual test seeds `42`, enters each supported evidence state, freezes simulation, waits for fonts and two frames, hides debug UI, and captures at required viewport. Motion script records unpaused Archive Crossing failure/success and finale pairing/collapse, then closes browser context to finalize WebM.

- [ ] **Step 5: Run integrated proof and commit**

```powershell
npm run test:unit
npm run test:browser
npm run build
git add src tests tools
git commit -m "test: prove complete Omega Spiral loop"
```

Expected: both bots finish, Ambition reachable, deliberate failure recovers, no softlock or browser error.

---

### Task 15: Alpha 0.1 Art, Feel, and Accessibility Pass

**Files:**
- Modify: `src/visual/factories.ts`
- Modify: `src/visual/EraDirector.ts`
- Modify: `src/visual/CameraDirector.ts`
- Modify: `src/visual/VfxDirector.ts`
- Modify: `src/audio/AudioDirector.ts`
- Modify: `src/ui/GameUi.ts`
- Modify: `src/styles.css`
- Modify: `tests/visual-regression.spec.ts`

**Interfaces:**
- Consumes: integrated event stream and named test states.
- Produces: Alpha 0.1 visual floor, synchronized feel, stable accessible layouts.

- [ ] **Step 1: Capture unscored baseline**

Run production preview and capture active Archive Crossing, formation, fracture, and threshold states. Record renderer diagnostics, GPU renderer/vendor/software flag, color entropy, edge density, luminance contrast, and current scorecard rows as `not captured` before first pass where no comparable image exists.

- [ ] **Step 2: Refine one representative scene first**

Raise Archive Crossing to required floor: authored player silhouette, readable sweep/shard/node/resident forms, foreground/midground/background town layers, shared material roles, grounded contact, key/fill/rim, event VFX, genre UI, synchronized cue timing. Keep target and next safe gap visible during motion.

- [ ] **Step 3: Propagate approved visual language**

Apply shared shapes, decals, materials, glyphs, and motif animation to remaining phases. Do not add loot, enemies, particles, or props without gameplay purpose. Use instancing for repeated architecture and pool transient VFX.

- [ ] **Step 4: Verify accessibility and motion**

Check 200% zoom, keyboard-only menus, standard gamepad, captions, all three non-color Dreamweaver grammars, Wide Timing, reduced-motion fracture/collapse, focus recovery after pause, and no flash sequence above three per second.

- [ ] **Step 5: Measure and commit**

`alpha01-art` labels this disposable art-pass diagnostic only; Task 16 always creates a different fresh release run ID.

```powershell
npm run test
npm run build
npm run inspect:canvas -- --url http://127.0.0.1:4188 --out artifacts/pass-art --state archive-crossing --seed 42 --run-id alpha01-art
```

Score all ten categories. Pass requires no category 0; art direction, hazards, interactables, VFX, UI, and performance at least 2; average at least 1.8; no automatic failure.

```powershell
git add src tests artifacts/game-progress.md
git commit -m "feat: finish Alpha 0.1 presentation pass"
```

---

### Task 16: Production Evidence and Static Release

**Files:**
- Create: `artifacts/evidence.json`
- Create: `artifacts/final-evidence.md`
- Modify: `README.md`
- Modify: `artifacts/game-progress.md`

**Interfaces:**
- Consumes: production `dist/`, named state hooks, bot and motion scripts.
- Produces: current-run release evidence and user-reviewable Alpha 0.1 build.

- [ ] **Step 1: Run clean production gate**

```powershell
npm ci
npm run typecheck
npm run test:unit
npm run test:browser
npm run build
```

Start `npm run preview` as a managed background job. Verify exact `http://127.0.0.1:4188/`, not the dev server. Time one unassisted first-run-equivalent playthrough without test hooks; pass at 15–20 minutes and record phase split times. Automated bot speed does not satisfy the pacing gate.

- [ ] **Step 2: Capture current-run inspector reports**

Create a fresh run ID for this exact production build, write it to `artifacts/current-run-id.txt`, and never reuse it after code or assets change. Run the packaged inspector for every named state at its fixed 1280×720 desktop viewport. Check each report acknowledges the requested state, is nonblank, has no browser errors, and records real GPU before using FPS.

```powershell
$runId = 'alpha-0-1-release-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$runId | Set-Content artifacts/current-run-id.txt
node scripts/inspect-threejs-canvas.mjs --url http://127.0.0.1:4188 --out "artifacts/$runId" --state archive-crossing --seed 42 --run-id $runId
```

Repeat with exact state names from Task 14 and the same current run ID. Playwright visual tests supply required 1920×1080 stills; inspector reports supply measured metrics.

- [ ] **Step 3: Capture unpaused motion**

```powershell
$runId = Get-Content artifacts/current-run-id.txt
node tools/capture-motion.mjs --url http://127.0.0.1:4188 --out "artifacts/$runId"
```

Inspect `archive-crossing-motion.webm` for movement, Dash, Act, tell, contact, rewind, and success. Inspect `finale-motion.webm` for route convergence, approach, hold, bridge, logo, coherent glimpse, collapse, and restart.

- [ ] **Step 4: Write and validate evidence manifest**

Declare one report for every state and both motion files plus 1920×1080 stills. Read the single run ID from `artifacts/current-run-id.txt`; every evidence entry must use it and current build/hash.

```powershell
$checker = "$env:USERPROFILE\.agents\skills\threejs-game-director\scripts\check_evidence.py"
if (-not (Test-Path $checker)) { throw "Required evidence checker not found: $checker" }
python $checker . --manifest artifacts/evidence.json --report artifacts/final-evidence.md
```

Expected: exit 0. Inspect images and videos manually after checker; file existence is not quality proof.

- [ ] **Step 5: Write final evidence and README**

`artifacts/final-evidence.md` records revision, commands, bot seeds, real-input paths, captures, motion findings, audio lifecycle, accessibility, renderer metrics, GPU, static-base check, scorecard, known rough edges, and exact Alpha 0.2 handoff. `README.md` documents controls, local production run, static `dist/`, browser assumptions, evidence links, and Alpha 0.1/0.2 boundary.

- [ ] **Step 6: Final verification and commit**

```powershell
npm ci
npm run typecheck
npm run test
npm run build
$checker = "$env:USERPROFILE\.agents\skills\threejs-game-director\scripts\check_evidence.py"
if (-not (Test-Path $checker)) { throw "Required evidence checker not found: $checker" }
python $checker . --manifest artifacts/evidence.json --report artifacts/final-evidence.md
git status --short
git add README.md artifacts tests src
git commit -m "release: deliver Omega Spiral Alpha 0.1"
```

- [ ] **Step 7: Check in for remote push**

Send `CHECK-IN v1` with `status: APPROVE`, commit hash, verification commands, exact build path, scorecard, known rough edges, and request to push `feat/alpha-0.1-complete-loop`. Push only after explicit approval.

---

## Stop Condition

Stop Alpha 0.1 when Task 16 passes. Deliver production `dist/`, evidence, known rough edges, and local review command. Start Alpha 0.2 planning/execution while user reviews Alpha 0.1; do not expand Alpha 0.1 with Blender assets, persistent run residue, inventory, loot, extra controls, or backend work.

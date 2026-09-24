/**
 * Floor One — Rogue-look Three.js presentation.
 *
 * The rules stay in `src/game/floor-one.ts`; presentation consumes the
 * authoritative state and forwards keyboard intents.
 */

import * as THREE from 'three';
import type { DiagnosticsSnapshot } from '../core/acceptance';
import { createFloor, stepFloor, type Dir, type FloorState, type Intent } from '../game/floor-one';
import { applyCaptureState, CAPTURE_STATE_NAMES, isCaptureState } from './capture-states';
import { FloorVisual } from './FloorVisual';
import { FloorAudio } from './FloorAudio';

const GUARD_COLOR: Record<string, string> = {
  neutral: '#8fd694',
  friendly: '#7cf0ff',
  suspicious: '#ffd166',
  hostile: '#ff5566',
};

/** Inspector-facing hooks (contract: scripts/inspect-threejs-canvas.mjs). */
interface FloorOneTestHooks {
  seed(value: string | number): { seed: string };
  setState(name: string): { state: string };
  setPausedForScreenshot(value: boolean): boolean;
  setReducedMotion(value: boolean): boolean;
}

/**
 * Bot-playtest contract (threejs-qa-release/references/playtest-bot.md):
 * `frame`, `score`, `complete`, and `player.position` on every update, plus
 * the renderer counts the canvas inspector reads.
 */
interface FloorOneDiagnostics {
  frame: number;
  score: number;
  complete: boolean;
  player: { position: { x: number; z: number } };
  renderer: { calls: number; triangles: number; geometries: number; textures: number };
  errors: string[];
}

const canvas = document.querySelector<HTMLCanvasElement>('[data-game-canvas]');
const logEl = document.querySelector<HTMLElement>('[data-message-log]');
const pipsEl = document.querySelector<HTMLElement>('[data-pips]');
const turnEl = document.querySelector<HTMLElement>('[data-turn]');
const threatEl = document.querySelector<HTMLElement>('[data-threat]');
const overlayEl = document.querySelector<HTMLElement>('[data-overlay]');
const overlayTitleEl = document.querySelector<HTMLElement>('[data-overlay-title]');
const overlayBodyEl = document.querySelector<HTMLElement>('[data-overlay-body]');
const overlayActionsEl = document.querySelector<HTMLElement>('[data-overlay-actions]');

try {
  if (!canvas || !logEl || !pipsEl || !turnEl || !threatEl || !overlayEl || !overlayTitleEl || !overlayBodyEl || !overlayActionsEl) {
    throw new Error('Floor One shell is incomplete.');
  }

  const params = new URLSearchParams(globalThis.location.search);
  let state: FloorState = createFloor(params.get('seed') ?? 'floor-1');
  let paused = false;
  let captureFrozen = false;
  let reducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const runtimeErrors: string[] = [];
  globalThis.addEventListener('error', (event: ErrorEvent) => runtimeErrors.push(event.message));
  globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
    runtimeErrors.push(String(event.reason)),
  );
  const acceptance = globalThis as unknown as {
    __THREE_GAME_TEST_HOOKS__?: FloorOneTestHooks;
    __THREE_GAME_DIAGNOSTICS__?: DiagnosticsSnapshot;
  };

  // Debug/gated capture states (?state=pause|dead|escaped); no effect on normal play.
  const forced = params.get('state');
  if (forced === 'dead') {
    state.outcome = 'dead';
    state.messages.push('The Threshold Guard ended you.');
  } else if (forced === 'escaped') {
    state.outcome = 'escaped';
    state.messages.push('You take the stairs. Floor One ends.');
  } else if (forced === 'pause') {
    paused = true;
  }

  const paintLog = (): void => {
    logEl.replaceChildren();
    for (const text of state.messages.slice(-6)) {
      const line = document.createElement('li');
      line.textContent = text;
      logEl.append(line);
    }
  };

  const renderHud = (): void => {
    const hpColor = state.hp > 4 ? '#8fd694' : state.hp > 2 ? '#ffd166' : '#ff5566';
    pipsEl.textContent = `${'♥'.repeat(Math.max(0, state.hp))}${'♡'.repeat(Math.max(0, state.maxHp - state.hp))}`;
    pipsEl.style.color = hpColor;
    turnEl.textContent = String(state.turns);
    const guard = state.guard;
    if (!guard) {
      threatEl.textContent = 'threshold clear';
      threatEl.style.color = '#8fd694';
    } else {
      threatEl.textContent = `guard ${guard.disposition}`;
      threatEl.style.color = GUARD_COLOR[guard.disposition] ?? '#8fd694';
    }
    if (paused) {
      overlayEl.hidden = false;
      overlayTitleEl.textContent = 'PAUSED';
      overlayTitleEl.style.color = '#7cf0ff';
      overlayBodyEl.textContent = 'The loop waits.';
      overlayActionsEl.innerHTML = '<kbd>Esc</kbd> resume';
      return;
    }
    if (state.outcome === 'ongoing') {
      overlayEl.hidden = true;
      return;
    }
    overlayEl.hidden = false;
    if (state.outcome === 'dead') {
      overlayTitleEl.textContent = 'YOU DIED';
      overlayTitleEl.style.color = '#ff5566';
      overlayBodyEl.textContent = 'The Threshold Guard ended you. The floor rebuilds on retry.';
      overlayActionsEl.innerHTML = '<kbd>Enter</kbd> retry same seed &nbsp;·&nbsp; <kbd>N</kbd> new run';
    } else {
      overlayTitleEl.textContent = 'FLOOR ONE CLEARED';
      overlayTitleEl.style.color = '#7cf0ff';
      overlayBodyEl.textContent = 'You take the stairs. The next era waits.';
      overlayActionsEl.innerHTML = '<kbd>N</kbd> new run';
    }
  };

  // --- Three.js shell ------------------------------------------------------

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const visual = new FloorVisual(state);
  const audio = new FloorAudio();

  const resize = (): void => {
    const width = canvas.clientWidth || globalThis.innerWidth;
    const height = canvas.clientHeight || globalThis.innerHeight;
    visual.resize(width, height);
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, width < 700 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    renderer.render(visual.scene, visual.camera);
  };

  const publishDiagnostics = (): void => {
    const info = renderer.info;
    const guard = state.guard;
    const distance = guard
      ? Math.abs(guard.pos.x - state.player.x) + Math.abs(guard.pos.y - state.player.y)
      : Number.POSITIVE_INFINITY;
    acceptance.__THREE_GAME_DIAGNOSTICS__ = {
      runId: `floor-one:${state.seed}`,
      instance: null,
      loop: 0,
      phase: state.outcome,
      checkpoint: null,
      objective: 'Reach the stairs',
      targetVerb: distance === 1 ? 'talk/hit/run' : 'move',
      playerState: `hp ${state.hp}/${state.maxHp}`,
      party: [],
      route: null,
      pairing: null,
      era: 'floor-one',
      paused: captureFrozen || paused,
      accessibility: { reducedMotion, debugHidden: false },
      audio: { unlocked: audio.unlocked },
      canvas: { width: canvas.width, height: canvas.height, pixelRatio: renderer.getPixelRatio() },
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      errors: runtimeErrors,
    };
  };

  const present = (): void => {
    visual.update(state);
    paintLog();
    renderHud();
    renderer.render(visual.scene, visual.camera);
    publishDiagnostics();
  };

  let effectFrame = 0;
  const animateEffects = (now: number): void => {
    effectFrame = 0;
    if (captureFrozen) { visual.clearEffects(); return; }
    const active = visual.advance(now, reducedMotion);
    renderer.render(visual.scene, visual.camera);
    publishDiagnostics();
    if (active) effectFrame = requestAnimationFrame(animateEffects);
  };

  // --- input ---------------------------------------------------------------

  const DIR_KEYS: Record<string, Dir> = {
    ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e',
    w: 'n', s: 's', a: 'w', d: 'e',
  };

  const dispatch = (intent: Intent): void => {
    const transition = stepFloor(state, intent);
    state = transition.state;
    if (intent.kind === 'retry' || intent.kind === 'new-run') paused = false;
    audio.play(transition.events);
    if (intent.kind === 'retry' || intent.kind === 'new-run') audio.ui('retry');
    if (intent.kind === 'inspect') audio.ui('inspect');
    if (intent.kind === 'retry' || intent.kind === 'new-run') visual.clearEffects();
    else visual.play(transition.events, state);
    present();
    if (effectFrame === 0) effectFrame = requestAnimationFrame(animateEffects);
  };

  globalThis.addEventListener('keydown', (event) => {
    if (captureFrozen) return; // capture freeze: keep the frame, ignore input
    const key = event.key;
    if (paused && key !== 'Escape') return;
    void audio.unlock();
    if (key === 'Escape') {
      event.preventDefault();
      paused = !paused;
      audio.ui('pause');
      if (paused) void audio.suspend();
      else void audio.resume();
      present();
      return;
    }
    if (paused) return;
    const dir = DIR_KEYS[key] ?? DIR_KEYS[key.toLowerCase()];
    if (dir) {
      event.preventDefault();
      dispatch(event.shiftKey ? { kind: 'run', dir } : { kind: 'move', dir });
      return;
    }
    if (key === ' ' || key === '.') {
      event.preventDefault();
      dispatch({ kind: 'wait' });
      return;
    }
    if (key === 't' || key === 'T') { dispatch({ kind: 'talk' }); return; }
    if (key === 'h' || key === 'H') { dispatch({ kind: 'hit' }); return; }
    if (key === 'i' || key === 'I') { dispatch({ kind: 'inspect' }); return; }
    if (key === 'Enter' && state.outcome !== 'ongoing') { dispatch({ kind: 'retry' }); return; }
    if ((key === 'n' || key === 'N') && state.outcome !== 'ongoing') dispatch({ kind: 'new-run' });
  });

  globalThis.addEventListener('resize', resize);
  globalThis.addEventListener('pagehide', () => audio.destroy());

  const hooks: FloorOneTestHooks = {
    seed(value) {
      state = createFloor(value);
      paused = false;
      visual.clearEffects();
      present();
      return { seed: state.seed };
    },
    setState(name) {
      if (!isCaptureState(name)) {
        throw new Error(
          `unknown capture state "${name}"; this scene declares: ${CAPTURE_STATE_NAMES.join(', ')}`,
        );
      }
      const capture = applyCaptureState(name, state);
      state = capture.state;
      paused = capture.paused;
      visual.clearEffects();
      present();
      return { state: name };
    },
    setPausedForScreenshot(value) {
      captureFrozen = value;
      if (value) visual.clearEffects();
      present();
      return captureFrozen;
    },
    setReducedMotion(value) {
      reducedMotion = value;
      present();
      return reducedMotion;
    },
  };
  acceptance.__THREE_GAME_TEST_HOOKS__ = hooks;

  present();
  resize();
} catch (error) {
  console.error(error);
  throw error;
}

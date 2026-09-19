/**
 * Floor One — Rogue-look Three.js presentation.
 *
 * The rules stay in `src/game/floor-one.ts`; this file only draws the
 * authoritative state and forwards keyboard intents. The floor is one canvas
 * texture (authentic terminal glyphs) mapped to a plane under a fixed
 * three-quarter camera, so unknown space is genuinely blank, remembered
 * terrain is dim, and current light is full color. Entities draw only where
 * they are currently visible, never from memory.
 */

import * as THREE from 'three';
import { createFloor, stepFloor, type Dir, type FloorState, type Intent, type Tile } from '../game/floor-one';

const CELL = 16;

const COLORS = {
  bg: '#04060b',
  wall: '#415681',
  floor: '#22303f',
  door: '#ffd166',
  pickup: '#ffd166',
  stairs: '#cfe6ff',
  player: '#7cf0ff',
} as const;

const GUARD_COLOR: Record<string, string> = {
  neutral: '#8fd694',
  friendly: '#7cf0ff',
  suspicious: '#ffd166',
  hostile: '#ff5566',
};

const GLYPH: Record<Tile, string> = { wall: '#', floor: '.', door: '+', pickup: '*', stairs: '>' };

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

  // --- surface -------------------------------------------------------------

  const worldCanvas = document.createElement('canvas');
  worldCanvas.width = state.cols * CELL;
  worldCanvas.height = state.rows * CELL;
  const ctx = worldCanvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable.');
  ctx.imageSmoothingEnabled = false;

  const paint = (): void => {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, worldCanvas.width, worldCanvas.height);
    ctx.font = `${CELL}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < state.rows; y += 1) {
      for (let x = 0; x < state.cols; x += 1) {
        const index = y * state.cols + x;
        if (!state.seen[index]) continue;
        const visible = state.visible[index];
        const tile = state.tiles[index] ?? 'wall';
        ctx.globalAlpha = visible ? 1 : 0.42;
        ctx.fillStyle = COLORS[tile];
        ctx.fillText(GLYPH[tile], x * CELL + CELL / 2, y * CELL + CELL / 2);
      }
    }

    ctx.globalAlpha = 1;
    const guard = state.guard;
    if (guard && state.visible[guard.pos.y * state.cols + guard.pos.x]) {
      ctx.fillStyle = GUARD_COLOR[guard.disposition] ?? GUARD_COLOR.neutral ?? '#8fd694';
      ctx.fillText('G', guard.pos.x * CELL + CELL / 2, guard.pos.y * CELL + CELL / 2);
    }
    if (state.visible[state.player.y * state.cols + state.player.x]) {
      ctx.fillStyle = COLORS.player;
      ctx.fillText('@', state.player.x * CELL + CELL / 2, state.player.y * CELL + CELL / 2);
    }

    worldTex.needsUpdate = true;
  };

  const paintLog = (): void => {
    logEl.replaceChildren();
    for (const text of state.messages.slice(-12)) {
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

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const worldTex = new THREE.CanvasTexture(worldCanvas);
  worldTex.magFilter = THREE.NearestFilter;
  worldTex.minFilter = THREE.NearestFilter;
  worldTex.colorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Mesh(
    new THREE.PlaneGeometry(state.cols, state.rows),
    new THREE.MeshBasicMaterial({ map: worldTex }),
  );
  scene.add(world);

  const resize = (): void => {
    const width = canvas.clientWidth || globalThis.innerWidth;
    const height = canvas.clientHeight || globalThis.innerHeight;
    const aspect = width / height;
    const pad = 1.06;
    let halfH = (state.rows / 2) * pad;
    let halfW = halfH * aspect;
    if (halfW < (state.cols / 2) * pad) {
      halfW = (state.cols / 2) * pad;
      halfH = halfW / aspect;
    }
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const present = (): void => {
    paint();
    paintLog();
    renderHud();
    renderer.render(scene, camera);
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
    present();
  };

  globalThis.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key === 'Escape') {
      event.preventDefault();
      paused = !paused;
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

  present();
  resize();
} catch (error) {
  console.error(error);
  throw error;
}

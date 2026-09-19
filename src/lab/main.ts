/**
 * Loop Lab — Floor 1.
 *
 * Crude first pass, deliberately: one authored ASCII grid drawn to a low-res
 * canvas texture, floated in dark space under a fixed camera. The whole game is
 * on screen at once. Step one tile per key; a process hunts every turn; three
 * ways out — the chest, the fight, or Light's question.
 *
 * No Blender, no glitch reveal, no second floor. Those come later.
 */

import * as THREE from 'three';
import { createRng } from '../core/random';

const LEVEL: readonly string[] = [
  '#####################',
  '#@..................#',
  '#...................#',
  '#.....##....##......#',
  '#.....##....##......#',
  '#..........O........#',
  '#...................#',
  '#.....##....##......#',
  '#.....##....##......#',
  '#........M..........#',
  '#...................#',
  '#.....##....##......#',
  '#.....##....##......#',
  '#........?.....$....#',
  '#...................#',
  '#####################',
];

const CELL = 8;
const COLS = (LEVEL[0] ?? '').length;
const ROWS = LEVEL.length;

const COLOR = {
  bg: '#04060b',
  wall: '#171f2b',
  wallEdge: '#26364a',
  floor: '#070c14',
  floorGlyph: 'rgba(124, 240, 255, 0.06)',
  player: '#7cf0ff',
  process: '#ff5566',
  chest: '#ffd166',
  fight: '#ff8f6b',
  question: '#b48cff',
} as const;

const QUESTIONS: readonly string[] = [
  'If I remember you, and you forget me, which of us is the loop?',
  'You have taken eleven steps. Which one was yours?',
  'I built this room to hold a question. Are you the question, or the room?',
  'When the script ends, does the answer stay, or only the asking?',
];

const MAX_HP = 6;
const PROCESS_HP = 3;
const GUARD_HP = 4;

type Phase = 'play' | 'question' | 'dead' | 'escaped';

const playEl = document.querySelector<HTMLElement>('[data-lab-play]');
const canvas = document.querySelector<HTMLCanvasElement>('[data-lab-canvas]');
const hpEl = document.querySelector<HTMLElement>('[data-lab-hp]');
const turnEl = document.querySelector<HTMLElement>('[data-lab-turn]');
const seedEl = document.querySelector<HTMLElement>('[data-lab-seed]');
const logEl = document.querySelector<HTMLElement>('[data-lab-log]');
const hintEl = document.querySelector<HTMLElement>('[data-lab-hint]');
const promptEl = document.querySelector<HTMLElement>('[data-lab-prompt]');
const questionEl = document.querySelector<HTMLElement>('[data-lab-question]');
const errorEl = document.querySelector<HTMLElement>('[data-lab-error]');

try {
  if (!playEl || !canvas || !hpEl || !turnEl || !seedEl || !logEl || !hintEl || !promptEl || !questionEl) {
    throw new Error('Loop Lab shell is incomplete.');
  }

  const seed = new URLSearchParams(globalThis.location.search).get('seed') ?? 'loop-1';
  const rng = createRng(seed);
  const combatRng = rng.fork('combat');
  const questionRng = rng.fork('questions');

  // --- World state ---------------------------------------------------------

  const walls: boolean[] = [];
  const exits: { kind: 'chest' | 'fight' | 'question'; x: number; y: number }[] = [];
  let start = { x: 1, y: 1 };

  for (let y = 0; y < ROWS; y += 1) {
    const row = LEVEL[y] ?? '';
    for (let x = 0; x < COLS; x += 1) {
      const ch = row[x] ?? '#';
      walls[y * COLS + x] = ch === '#';
      if (ch === '@') start = { x, y };
      if (ch === '$') exits.push({ kind: 'chest', x, y });
      if (ch === 'M') exits.push({ kind: 'fight', x, y });
      if (ch === '?') exits.push({ kind: 'question', x, y });
    }
  }

  let player = { ...start };
  let processAt = { x: 0, y: 0 };
  for (let y = 0; y < ROWS; y += 1) {
    const row = LEVEL[y] ?? '';
    for (let x = 0; x < COLS; x += 1) if (row[x] === 'O') processAt = { x, y };
  }

  let hp = MAX_HP;
  let processHp = PROCESS_HP;
  let guardHp = GUARD_HP;
  let turn = 0;
  let phase: Phase = 'play';
  let currentQuestion = '';

  const isWall = (x: number, y: number): boolean =>
    x < 0 || y < 0 || x >= COLS || y >= ROWS || (walls[y * COLS + x] ?? true);

  const exitAt = (x: number, y: number) => exits.find(e => e.x === x && e.y === y);

  const log = (text: string): void => {
    const line = document.createElement('li');
    line.textContent = text;
    logEl.prepend(line);
    while (logEl.childElementCount > 6) logEl.lastElementChild?.remove();
  };

  // --- Render surface ------------------------------------------------------

  const worldCanvas = document.createElement('canvas');
  worldCanvas.width = COLS * CELL;
  worldCanvas.height = ROWS * CELL;
  const ctx = worldCanvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable.');
  ctx.imageSmoothingEnabled = false;

  const paint = (): void => {
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, worldCanvas.width, worldCanvas.height);
    ctx.font = `${CELL}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cx = x * CELL + CELL / 2;
        const cy = y * CELL + CELL / 2;
        if (walls[y * COLS + x]) {
          ctx.fillStyle = COLOR.wall;
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          ctx.fillStyle = COLOR.wallEdge;
          ctx.fillRect(x * CELL, y * CELL, CELL, 1);
        } else {
          ctx.fillStyle = COLOR.floor;
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          ctx.fillStyle = COLOR.floorGlyph;
          ctx.fillText('.', cx, cy);
        }
      }
    }

    for (const exit of exits) {
      const glyph = exit.kind === 'chest' ? '$' : exit.kind === 'fight' ? 'M' : '?';
      ctx.fillStyle = exit.kind === 'chest' ? COLOR.chest : exit.kind === 'fight' ? COLOR.fight : COLOR.question;
      ctx.fillText(glyph, exit.x * CELL + CELL / 2, exit.y * CELL + CELL / 2);
    }

    if (processHp > 0) {
      ctx.fillStyle = COLOR.process;
      ctx.fillText('O', processAt.x * CELL + CELL / 2, processAt.y * CELL + CELL / 2);
    }

    if (phase !== 'dead' && phase !== 'escaped') {
      ctx.fillStyle = COLOR.player;
      ctx.fillText('@', player.x * CELL + CELL / 2, player.y * CELL + CELL / 2);
    }

    worldTex.needsUpdate = true;
  };

  // --- Three.js shell ------------------------------------------------------

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR.bg);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.6, 10);
  camera.lookAt(0, 0, 0);

  const planeW = COLS * 0.34;
  const planeH = ROWS * 0.34;

  const worldTex = new THREE.CanvasTexture(worldCanvas);
  worldTex.magFilter = THREE.NearestFilter;
  worldTex.minFilter = THREE.NearestFilter;
  worldTex.colorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({ map: worldTex }),
  );

  const makeProceduralBackdrop = (): THREE.CanvasTexture => {
    const backdropCanvas = document.createElement('canvas');
    backdropCanvas.width = 512;
    backdropCanvas.height = 512;
    const bctx = backdropCanvas.getContext('2d');
    if (!bctx) throw new Error('2D context unavailable for backdrop.');
    bctx.fillStyle = '#05070d';
    bctx.fillRect(0, 0, 512, 512);

    // Three faint strands in the logo language: Light white-blue, Shadow pale
    // gold, Ambition muted crimson. Woven, never the logo bitmap itself.
    const strands: Array<[string, number, number]> = [
      ['rgba(124, 240, 255, 0.10)', 60, 300],
      ['rgba(255, 209, 102, 0.08)', 250, 200],
      ['rgba(255, 85, 102, 0.08)', 420, 360],
    ];
    for (const [color, ox, oy] of strands) {
      bctx.strokeStyle = color;
      bctx.lineWidth = 2;
      bctx.beginPath();
      bctx.moveTo(ox - 120, oy + 40);
      bctx.bezierCurveTo(ox - 40, oy - 140, ox + 40, oy + 140, ox + 120, oy - 40);
      bctx.stroke();
    }

    bctx.strokeStyle = 'rgba(124, 240, 255, 0.05)';
    for (let i = 0; i < 512; i += 16) {
      bctx.beginPath();
      bctx.moveTo(0, i);
      bctx.lineTo(512, i);
      bctx.stroke();
    }
    const noise = rng.fork('backdrop');
    for (let i = 0; i < 420; i += 1) {
      const ch = String.fromCharCode(33 + noise.int(93));
      bctx.fillStyle = `rgba(124, 240, 255, ${0.03 + noise.next() * 0.06})`;
      bctx.fillText(ch, noise.int(512), noise.int(512));
    }
    const tex = new THREE.CanvasTexture(backdropCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const backdropTex = makeProceduralBackdrop();
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW * 2.8, planeH * 2.8),
    new THREE.MeshBasicMaterial({ map: backdropTex, transparent: true, opacity: 0.6, depthWrite: false }),
  );
  backdrop.position.z = -1.6;

  // Optional logo-toned plate when present; procedural strands stay as fallback.
  const plateUrl = new URL('../../assets/textures/lab-backdrop-plate.png', import.meta.url).href;
  new THREE.TextureLoader().load(
    plateUrl,
    (plate) => {
      plate.colorSpace = THREE.SRGBColorSpace;
      plate.anisotropy = 4;
      const material = backdrop.material as THREE.MeshBasicMaterial;
      material.map = plate;
      material.opacity = 0.75;
      material.needsUpdate = true;
    },
    undefined,
    () => undefined,
  );

  const rig = new THREE.Group();
  rig.add(backdrop, world);
  scene.add(rig);

  // --- Turn resolution -----------------------------------------------------

  const updateHud = (): void => {
    hpEl.textContent = String(Math.max(0, hp));
    turnEl.textContent = String(turn);
    seedEl.textContent = seed;
  };

  const endRun = (kind: 'dead' | 'escaped', text: string): void => {
    phase = kind;
    log(text);
    hintEl.innerHTML = '<div><b>R</b> restart the loop</div>';
    paint();
  };

  const stepProcess = (): void => {
    if (processHp <= 0) return;
    const dx = Math.sign(player.x - processAt.x);
    const dy = Math.sign(player.y - processAt.y);
    const tries: Array<[number, number]> = Math.abs(player.x - processAt.x) >= Math.abs(player.y - processAt.y)
      ? [[dx, 0], [0, dy]]
      : [[0, dy], [dx, 0]];
    for (const [sx, sy] of tries) {
      const nx = processAt.x + sx;
      const ny = processAt.y + sy;
      if (nx === player.x && ny === player.y) {
        hp -= 1;
        log(`The process reaches you. HP ${Math.max(0, hp)}.`);
        if (hp <= 0) endRun('dead', 'The loop overwrote you.');
        return;
      }
      if (sx === 0 && sy === 0) continue;
      if (!isWall(nx, ny)) {
        processAt = { x: nx, y: ny };
        return;
      }
    }
  };

  const resolveTurn = (): void => {
    turn += 1;
    // The process runs every other turn, so the floor is a race you can win.
    if (turn % 2 === 0) stepProcess();
    updateHud();
    paint();
  };

  const tryMove = (dx: number, dy: number): void => {
    if (phase !== 'play') return;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (processHp > 0 && nx === processAt.x && ny === processAt.y) {
      const hit = combatRng.next() > 0.28;
      if (hit) {
        processHp -= 1;
        log(processHp > 0 ? `You strike the process. It has ${processHp} left.` : 'The process shatters into glyphs.');
      } else {
        log('You swing through empty code.');
      }
      resolveTurn();
      return;
    }

    if (isWall(nx, ny)) {
      log('A wall of old output.');
      return;
    }

    const exit = exitAt(nx, ny);
    if (exit?.kind === 'question') {
      player = { x: nx, y: ny };
      currentQuestion = questionRng.pick(QUESTIONS);
      questionEl.textContent = currentQuestion;
      promptEl.dataset.open = 'true';
      phase = 'question';
      updateHud();
      paint();
      return;
    }

    if (exit?.kind === 'chest') {
      player = { x: nx, y: ny };
      resolveTurn();
      endRun('escaped', 'You pry the chest open. Cold air from outside the loop.');
      return;
    }

    if (exit?.kind === 'fight') {
      // The M is a guard, not a door. Trade blows until one routine ends.
      const playerHit = combatRng.next() > 0.25;
      if (playerHit) {
        guardHp -= 1;
        log(guardHp > 0 ? `You hit the guard. ${guardHp} left.` : 'The guard routine ends.');
      } else {
        log('The guard parries.');
      }
      if (guardHp <= 0) {
        resolveTurn();
        endRun('escaped', 'You break the guard routine and step past it.');
        return;
      }
      const guardHit = combatRng.next() > 0.5;
      if (guardHit) {
        hp -= 1;
        log(`The guard strikes back. HP ${Math.max(0, hp)}.`);
        if (hp <= 0) {
          resolveTurn();
          endRun('dead', 'The guard routine ended you.');
          return;
        }
      } else {
        log('You slip the guard strike.');
      }
      resolveTurn();
      return;
    }

    player = { x: nx, y: ny };
    log(`Step ${turn + 1}.`);
    resolveTurn();
  };

  const answerQuestion = (answer: 'yes' | 'no'): void => {
    promptEl.dataset.open = 'false';
    if (answer === 'yes') {
      endRun('escaped', 'Light accepts the answer. The room lets you out.');
    } else {
      endRun('escaped', 'Light accepts the refusal. The room lets you out anyway.');
    }
  };

  const restart = (): void => {
    player = { ...start };
    processAt = { x: 0, y: 0 };
    for (let y = 0; y < ROWS; y += 1) {
      const row = LEVEL[y] ?? '';
      for (let x = 0; x < COLS; x += 1) if (row[x] === 'O') processAt = { x, y };
    }
    hp = MAX_HP;
    processHp = PROCESS_HP;
    guardHp = GUARD_HP;
    turn = 0;
    phase = 'play';
    promptEl.dataset.open = 'false';
    hintEl.innerHTML = '<div><b>Arrows / WASD</b> step</div><div><b>Bump</b> to fight · <b>R</b> restart</div>';
    logEl.replaceChildren();
    log('The loop restarts.');
    updateHud();
    paint();
  };

  // --- Input ---------------------------------------------------------------

  const DIRS: Record<string, [number, number]> = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  };

  globalThis.addEventListener('keydown', (event) => {
    const key = event.key;
    if (phase === 'question') {
      if (key === 'y' || key === 'Y') { answerQuestion('yes'); return; }
      if (key === 'n' || key === 'N') { answerQuestion('no'); return; }
      if (key === 'Escape') { promptEl.dataset.open = 'false'; phase = 'play'; }
      return;
    }
    if (key === 'r' || key === 'R') { restart(); return; }
    if (phase !== 'play') return;
    const dir = DIRS[key];
    if (!dir) return;
    event.preventDefault();
    tryMove(dir[0], dir[1]);
  });

  // --- Frame loop ----------------------------------------------------------

  let elapsed = 0;
  let last = performance.now();

  const resize = (): void => {
    const w = playEl.clientWidth || globalThis.innerWidth;
    const h = playEl.clientHeight || globalThis.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const frame = (now: number): void => {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    elapsed += dt;
    rig.position.y = Math.sin(elapsed * 0.6) * 0.08;
    rig.rotation.x = Math.sin(elapsed * 0.4) * 0.02;
    rig.rotation.y = Math.sin(elapsed * 0.3) * 0.03;

    const existing = (globalThis as unknown as { __THREE_GAME_DIAGNOSTICS__?: Record<string, unknown> })
      .__THREE_GAME_DIAGNOSTICS__;
    const diag = existing ?? {};
    (globalThis as unknown as { __THREE_GAME_DIAGNOSTICS__?: Record<string, unknown> })
      .__THREE_GAME_DIAGNOSTICS__ = diag;
    diag.state = phase;
    diag.game = {
      renderer: {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      },
    };

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };

  globalThis.addEventListener('resize', resize);

  log('You boot into Floor 1. Three ways out: $ chest, M fight, ? question.');
  updateHud();
  paint();
  resize();
  requestAnimationFrame(frame);

  (globalThis as unknown as { __LOOP_LAB__?: unknown }).__LOOP_LAB__ = {
    getState: () => ({
      seed,
      phase,
      hp,
      processHp,
      guardHp,
      turn,
      player: { ...player },
      process: { ...processAt },
      textureVersion: worldTex.version,
      exits: exits.map(e => ({ ...e })),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    }),
  };
} catch (error) {
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = error instanceof Error ? error.message : 'Loop Lab could not start.';
  }
  throw error;
}

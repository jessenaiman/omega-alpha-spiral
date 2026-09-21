import * as THREE from 'three';
import { createRunState, reduceRun } from './game/run-state.js';
import { loadLineage } from './game/session-store.js';
import { GhostTerminalPhase } from './phases/GhostTerminalPhase.js';
import './styles.css';
import { GameUi } from './ui/GameUi.js';
import { MapHud } from './ui/MapHud.js';
import { ExplorationPhase } from './phases/ExplorationPhase.js';
import { TownMap } from './world/TownMap.js';
import { InputController } from './core/InputController.js';
import { FixedLoop } from './core/FixedLoop.js';

const canvas = document.querySelector<HTMLCanvasElement>('[data-game-canvas]');
const status = document.querySelector<HTMLElement>('[data-game-status]');
const errorBox = document.querySelector<HTMLElement>('[data-game-error]');
const shell = document.querySelector<HTMLElement>('.game-shell');

try {
  if (!canvas || !status || !errorBox || !shell) throw new Error('Game shell is incomplete.');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(480, 360, false);
  renderer.setClearColor(0x050605, 1);

  const scene = createGhostSignalScene();
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 10);
  camera.position.z = 4;
  renderer.render(scene, camera);

  const randomWord = crypto.getRandomValues(new Uint32Array(1))[0];
  const lineage = loadLineage(sessionStorage, () => randomWord / 4_294_967_296);
  let runState = createRunState((lineage.baseInstanceId * 2_654_435_761 + lineage.loopCount) >>> 0, lineage);
  const phase = new GhostTerminalPhase(runState.displayInstance, action => {
    runState = reduceRun(runState, action);
  });
  let disposeMap = () => {};
  let activeExploration: ExplorationPhase | null = null;
  let frameCount = 0;
  if (new URLSearchParams(location.search).has('debug')) {
    Object.assign(window, { __THREE_GAME_DIAGNOSTICS__: {
      renderer: renderer.info,
      get state() {
        const map = activeExploration?.snapshot();
        return { phase: runState.phase, frame: frameCount, player: map?.player ?? null,
          restored: map?.restored.length ?? 0, complete: map?.complete ?? false };
      },
    } });
  }
  const ui = new GameUi(shell, phase, () => {
    if (runState.phase !== 'exploration') return;
    shell.querySelector('[data-ghost-terminal]')?.remove();
    shell.classList.add('map-mode');
    renderer.setSize(640, 480, false);
    const town = new TownMap();
    const hud = new MapHud(shell);
    const exploration = new ExplorationPhase(action => {
      runState = reduceRun(runState, action);
    }, event => { status.textContent = `${event.type} · ${event.sourceId ?? ''}`; });
    activeExploration = exploration;
    const input = new InputController(canvas);
    let paused = false;
    const loop = new FixedLoop(dt => {
      frameCount++;
      const frame = input.sample();
      if (frame.pausePressed) paused = !paused;
      if (!paused) {
        exploration.update(dt, { x: frame.move.x, z: frame.move.y });
        if (frame.actPressed) exploration.act();
      }
    }, () => {
      const snapshot = exploration.snapshot();
      town.update(snapshot);
      hud.update(snapshot, paused);
      renderer.render(town.scene, town.camera);
    });
    canvas.focus();
    loop.start();
    disposeMap = () => { loop.stop(); input.dispose(); hud.dispose(); town.dispose(); };
  });
  status.textContent = 'GHOST TERMINAL · READY';

  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposeMap();
    ui.dispose();
    renderer.dispose();
  });
} catch (error) {
  if (errorBox) {
    errorBox.hidden = false;
    errorBox.textContent = error instanceof Error ? error.message : 'Omega Spiral could not start.';
  }
  throw error;
}

function createGhostSignalScene(): THREE.Scene {
  const scene = new THREE.Scene();
  const signal = 0xe8dcc8;
  const gridMaterial = new THREE.LineBasicMaterial({ color: signal, transparent: true, opacity: 0.075 });
  const grid: number[] = [];
  for (let x = -4; x <= 4; x += 0.5) grid.push(x, -3, 0, x, 3, 0);
  for (let y = -3; y <= 3; y += 0.5) grid.push(-4, y, 0, 4, y, 0);
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  scene.add(new THREE.LineSegments(gridGeometry, gridMaterial));

  const aperture = new THREE.EllipseCurve(0, 0, 2.65, 2.05, 0, Math.PI * 2, false, 0);
  const aperturePoints = aperture.getPoints(96).map(point => new THREE.Vector3(point.x, point.y, 0.02));
  const apertureMaterial = new THREE.LineBasicMaterial({ color: signal, transparent: true, opacity: 0.16 });
  scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(aperturePoints), apertureMaterial));

  const rays: number[] = [];
  for (let index = 0; index < 36; index += 1) {
    const angle = (index / 36) * Math.PI * 2;
    const inner = 0.28 + ((index * 13) % 9) * 0.018;
    const outer = 2.18 + ((index * 7) % 11) * 0.035;
    rays.push(
      Math.cos(angle) * inner, Math.sin(angle) * inner * 0.78, 0.01,
      Math.cos(angle) * outer, Math.sin(angle) * outer * 0.78, 0.01,
    );
  }
  scene.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(rays, 3)),
    new THREE.LineBasicMaterial({ color: signal, transparent: true, opacity: 0.09 }),
  ));

  const motes: number[] = [];
  for (let index = 0; index < 54; index += 1) {
    const x = (((index * 43) % 101) / 100) * 7.4 - 3.7;
    const y = (((index * 67) % 97) / 96) * 5.4 - 2.7;
    motes.push(x, y, 0.03);
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.Float32BufferAttribute(motes, 3));
  scene.add(new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: signal, size: 0.025 })));

  return scene;
}

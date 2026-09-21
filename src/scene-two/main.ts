import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from '../../assets/basic/demo-kit.glb?url';
import {
  captureRuntimeErrors,
  createDiagnostics,
  createSettings,
  createStateRegistry,
  type SceneTestHooks,
} from '../core';
import { createChamberRun, LIGHT_CHAMBER_OBJECTS, type ChamberObjectId } from './game';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-two-canvas]');
const story = document.querySelector<HTMLElement>('[data-story]');
const speaker = document.querySelector<HTMLElement>('[data-speaker]');
const objective = document.querySelector<HTMLElement>('[data-objective]');
const restartButton = document.querySelector<HTMLButtonElement>('[data-restart]');
const transmission = document.querySelector<HTMLElement>('[data-transmission]');
if (!canvas || !story || !speaker || !objective || !restartButton || !transmission) {
  throw new Error('Echo Chamber shell is incomplete');
}

const GRID_SIZE = 4;
const INTRO = story.textContent?.trim() ?? '';
const objects = LIGHT_CHAMBER_OBJECTS;
const run = createChamberRun(objects);
const diagnostics = createDiagnostics({
  runId: 'scene-two:light-chamber',
  phase: 'loading',
  objective: 'Approach an object',
  targetVerb: 'approach',
  playerState: 'entering',
});
const settings = createSettings();
const states = createStateRegistry();
captureRuntimeErrors(diagnostics, window);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a);
scene.fog = new THREE.FogExp2(0x05070a, 0.065);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

scene.add(new THREE.HemisphereLight(0xb8dcff, 0x11131a, 1.4));
const keyLight = new THREE.DirectionalLight(0xe6f3ff, 2.2);
keyLight.position.set(-2, 7, -1);
scene.add(keyLight);

let hero: THREE.Object3D | undefined;
let loaded = false;
let paused = false;
let seed = 'scene-two';
let zStep = -1;
let tile = { x: 0, z: 0 };
const smoothedTile = new THREE.Vector2();
const heroHome = new THREE.Vector3();
const boundsSize = new THREE.Vector3();

const makeMaterial = (color: number, emissive: number): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 1.7, roughness: 0.38, metalness: 0.15 });

const makeMonster = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'CHOICE_Monster';
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 1), makeMaterial(0x3c163b, 0xb52aa8));
  body.scale.set(1, 1.35, 1);
  body.name = 'CHOICE_MonsterBody';
  group.add(body);
  for (const x of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), makeMaterial(0xe7f5ff, 0xe7f5ff));
    eye.position.set(x, 0.07, 0.25);
    group.add(eye);
  }
  return group;
};

const makeChest = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'CHOICE_Chest';
  const material = makeMaterial(0x5a3b16, 0xb67828);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.36), material);
  base.position.y = 0.13;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.38), material);
  lid.position.y = 0.34;
  group.add(base, lid);
  return group;
};

const worldPositionFor = (x: number, z: number): THREE.Vector3 =>
  new THREE.Vector3(heroHome.x + x, heroHome.y, heroHome.z + z * zStep);

const hasArrived = (): boolean =>
  Math.abs(smoothedTile.x - tile.x) < 0.025 && Math.abs(smoothedTile.y - tile.z) < 0.025;

const updateDiagnostics = (): void => {
  diagnostics.update({
    runId: `scene-two:${seed}`,
    phase: run.outcome ? 'resolved' : loaded ? 'exploring' : 'loading',
    checkpoint: run.outcome?.objectId ?? null,
    objective: run.outcome ? 'Reflection recorded' : 'Approach an object',
    targetVerb: run.outcome ? null : 'approach',
    playerState: run.outcome ? 'listening' : loaded ? 'exploring' : 'entering',
    paused,
    accessibility: {
      reducedMotion: settings.value.reducedMotion,
      debugHidden: settings.value.debugHidden,
    },
    canvas: { width: canvas.width, height: canvas.height, pixelRatio: renderer.getPixelRatio() },
    renderer: {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    },
  });
  window.__THREE_GAME_DIAGNOSTICS__ = diagnostics.snapshot();
};

const setActiveObject = (id: ChamberObjectId | null): void => {
  document.querySelectorAll<HTMLElement>('[data-chamber-object]').forEach(element => {
    element.dataset.active = String(element.dataset.chamberObject === id);
  });
};

const activateAtTile = (): void => {
  if (run.outcome) return;
  const object = objects.find(candidate => candidate.tile.x === tile.x && candidate.tile.z === tile.z);
  if (!object) return;
  const outcome = run.activate(object.id);
  if (!outcome) return;
  setActiveObject(outcome.objectId);
  speaker.textContent = `LIGHT / ${object.label.toUpperCase()}`;
  story.textContent = outcome.story;
  transmission.dataset.outcomeObject = outcome.objectId;
  transmission.dataset.actionKind = outcome.action.kind;
  objective.textContent = 'The chamber has answered.';
  restartButton.hidden = false;
  updateDiagnostics();
};

const restart = (): void => {
  run.restart();
  tile = { x: 0, z: 0 };
  smoothedTile.set(0, 0);
  if (hero) hero.position.copy(heroHome);
  setActiveObject(null);
  speaker.textContent = 'LIGHT / ECHO';
  story.textContent = INTRO;
  delete transmission.dataset.outcomeObject;
  delete transmission.dataset.actionKind;
  objective.textContent = 'Approach what calls to you.';
  restartButton.hidden = true;
  updateDiagnostics();
};

const directions: Record<string, { x: number; z: number }> = {
  ArrowUp: { x: 0, z: -1 },
  ArrowDown: { x: 0, z: 1 },
  ArrowLeft: { x: -1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
  KeyW: { x: 0, z: -1 },
  KeyS: { x: 0, z: 1 },
  KeyA: { x: -1, z: 0 },
  KeyD: { x: 1, z: 0 },
};

window.addEventListener('keydown', event => {
  if (event.repeat) return;
  if (event.code === 'KeyR') {
    restart();
    return;
  }
  const direction = directions[event.code];
  if (!direction || paused || run.outcome || !hasArrived()) return;
  event.preventDefault();
  tile = {
    x: THREE.MathUtils.clamp(tile.x + direction.x, 0, GRID_SIZE - 1),
    z: THREE.MathUtils.clamp(tile.z + direction.z, 0, GRID_SIZE - 1),
  };
});
restartButton.addEventListener('click', restart);

new GLTFLoader().load(
  modelUrl,
  gltf => {
    hero = gltf.scene.getObjectByName('ACT_HeroRoot');
    const portal = gltf.scene.getObjectByName('EXIT_PortalRoot');
    const gem = gltf.scene.getObjectByName('PICKUP_Gem');
    if (!hero || !portal || !gem) throw new Error('Blender room contract nodes are missing');
    heroHome.copy(hero.position);
    zStep = Math.sign(gem.position.z - heroHome.z) || -1;
    portal.name = 'CHOICE_Door';
    gem.visible = false;
    scene.add(gltf.scene);

    const monster = makeMonster();
    monster.position.copy(worldPositionFor(0, 2)).add(new THREE.Vector3(-0.22, 0.48, -0.16));
    scene.add(monster);

    const chest = makeChest();
    chest.position.copy(worldPositionFor(2, 2)).add(new THREE.Vector3(0.2, 0, 0.14));
    scene.add(chest);

    const runtimeNames: Record<ChamberObjectId, string> = {
      door: 'CHOICE_Door',
      monster: 'CHOICE_Monster',
      chest: 'CHOICE_Chest',
    };
    for (const object of objects) {
      if (!scene.getObjectByName(runtimeNames[object.id])) {
        throw new Error(`Scene object ${object.id} is missing`);
      }
      const marker = document.querySelector<HTMLElement>(`[data-chamber-object="${object.id}"]`);
      if (!marker) throw new Error(`Object marker ${object.id} is missing`);
      marker.dataset.ready = 'true';
    }

    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    bounds.getSize(boundsSize);
    const span = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);
    camera.position.set(center.x + span * 0.82, center.y + span * 1.16, center.z + span * 1.18);
    camera.lookAt(center.x, center.y + 0.1, center.z);
    loaded = true;
    updateDiagnostics();
  },
  undefined,
  error => diagnostics.recordError(error),
);

states.register('echo-chamber', () => {
  paused = false;
  restart();
  return 'echo-chamber';
});

const hooks: SceneTestHooks = {
  seed(value): string {
    seed = String(value);
    restart();
    return seed;
  },
  setState(name): { state: string } {
    return { state: states.apply(name) };
  },
  setPausedForScreenshot(value): boolean {
    paused = value;
    updateDiagnostics();
    return paused;
  },
  setReducedMotion(enabled): boolean {
    settings.set({ reducedMotion: enabled });
    updateDiagnostics();
    return settings.value.reducedMotion;
  },
  setDebugHidden(hidden): boolean {
    settings.set({ debugHidden: hidden });
    document.body.dataset.debugHidden = String(hidden);
    updateDiagnostics();
    return settings.value.debugHidden;
  },
};

window.__THREE_GAME_TEST_HOOKS__ = hooks;

const resize = (): void => {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
window.addEventListener('resize', resize);
resize();

let previousFrame = performance.now();
const render = (now: number): void => {
  requestAnimationFrame(render);
  const delta = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (loaded && hero && !paused) {
    const speed = settings.value.reducedMotion ? 1 : 1 - Math.exp(-12 * delta);
    smoothedTile.lerp(new THREE.Vector2(tile.x, tile.z), speed);
    const position = worldPositionFor(smoothedTile.x, smoothedTile.y);
    hero.position.set(position.x, heroHome.y, position.z);
    if (hasArrived()) activateAtTile();
    const monster = scene.getObjectByName('CHOICE_Monster');
    if (monster && !settings.value.reducedMotion) monster.rotation.y += delta * 0.65;
  }
  canvas.dataset.arrived = String(loaded && hasArrived());
  renderer.render(scene, camera);
  updateDiagnostics();
};
requestAnimationFrame(render);

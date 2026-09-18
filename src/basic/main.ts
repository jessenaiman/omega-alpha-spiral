import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import modelUrl from '../../assets/basic/demo-kit.glb?url';

const canvas = document.querySelector<HTMLCanvasElement>('[data-basic-canvas]');
const stepsEl = document.querySelector<HTMLElement>('[data-basic-steps]');
const gemsEl = document.querySelector<HTMLElement>('[data-basic-gems]');
const statusEl = document.querySelector<HTMLElement>('[data-basic-status]');
if (!canvas || !stepsEl || !gemsEl || !statusEl) {
  throw new Error('basic page markers missing');
}

const GRID = 4;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e16);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight(0xbcd8ff, 0x20242e, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(3, 6, 2);
scene.add(sun);

let heroRoot: THREE.Object3D | undefined;
let gem: THREE.Object3D | undefined;
let portal: THREE.Object3D | undefined;
let loaded = false;
let zStep = -1;
const heroHome = new THREE.Vector3();
const meshNames: string[] = [];
const boundsSize = new THREE.Vector3();

new GLTFLoader().load(
  modelUrl,
  (gltf) => {
    heroRoot = gltf.scene.getObjectByName('ACT_HeroRoot');
    gem = gltf.scene.getObjectByName('PICKUP_Gem');
    portal = gltf.scene.getObjectByName('EXIT_PortalRoot');
    if (!heroRoot || !gem || !portal) throw new Error('Runtime contract nodes missing from demo-kit.glb');
    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) meshNames.push(node.name);
    });
    heroHome.copy(heroRoot.position);
    zStep = Math.sign(gem.position.z - heroHome.z) || -1;
    scene.add(gltf.scene);

    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    const center = bounds.getCenter(new THREE.Vector3());
    bounds.getSize(boundsSize);
    const span = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);
    camera.position.set(center.x + span * 0.8, center.y + span * 1.05, center.z + span * 1.2);
    camera.lookAt(center);
    loaded = true;
    statusEl.textContent = 'loaded Blender MCP room';
  },
  undefined,
  (err) => {
    statusEl.textContent = 'GLB load failed';
    console.error(err);
  },
);

let tile = { x: 0, z: 0 };
let pos = { x: 0, z: 0 };
let steps = 0;
let gems = 0;
let exitReached = false;

const DIRS: Record<string, { x: number; z: number }> = {
  ArrowUp: { x: 0, z: -1 },
  ArrowDown: { x: 0, z: 1 },
  ArrowLeft: { x: -1, z: 0 },
  ArrowRight: { x: 1, z: 0 },
  w: { x: 0, z: -1 },
  s: { x: 0, z: 1 },
  a: { x: -1, z: 0 },
  d: { x: 1, z: 0 },
};

window.addEventListener('keydown', (ev) => {
  const dir = DIRS[ev.key];
  if (!dir) return;
  ev.preventDefault();
  const nx = tile.x + dir.x;
  const nz = tile.z + dir.z;
  if (nx < 0 || nz < 0 || nx >= GRID || nz >= GRID) return;
  tile = { x: nx, z: nz };
  steps += 1;
  stepsEl.textContent = String(steps);
});

const render = (): void => {
  requestAnimationFrame(render);
  if (loaded) {
    if (!heroRoot) throw new Error('Hero root lost after load');
    pos.x += (tile.x - pos.x) * 0.18;
    pos.z += (tile.z - pos.z) * 0.18;
    heroRoot.position.x = heroHome.x + pos.x;
    heroRoot.position.z = heroHome.z + pos.z * zStep;
    const arrived = Math.abs(tile.x - pos.x) < 0.02 && Math.abs(tile.z - pos.z) < 0.02;
    if (gem && gem.visible && arrived && tile.x === 2 && tile.z === 2) {
      gem.visible = false;
      gems += 1;
      gemsEl.textContent = String(gems);
      statusEl.textContent = 'gem collected';
    }
    if (!exitReached && gems > 0 && arrived && tile.x === 3 && tile.z === 3) {
      exitReached = true;
      statusEl.textContent = 'room complete';
    }
  }
  renderer.render(scene, camera);
};

window.__BLENDER_MCP_DEMO__ = {
  getState: () => ({
    loaded,
    tile: { ...tile },
    steps,
    gems,
    exitReached,
    meshNames: [...meshNames],
    bounds: boundsSize.toArray(),
    heroPosition: heroRoot?.position.toArray() ?? null,
    gemVisible: gem?.visible ?? null,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  }),
};

const resize = (): void => {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
};
window.addEventListener('resize', resize);
resize();
render();

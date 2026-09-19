/**
 * Rogue Descent — Three.js presentation. Instances the Blender kit
 * (`assets/rogue/dungeon-kit.glb`) for the grid and clones its actor parts.
 * It owns only drawing: it reads the rules state and never changes it.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { RogueState } from '../game';

const KIT_URL = new URL('../../../assets/rogue/dungeon-kit.glb', import.meta.url).href;

const HERO_PARTS = ['HeroBody', 'HeroHead', 'HeroVisor'] as const;
const MONSTER_PARTS = ['MonsterBody', 'MonsterEyeL', 'MonsterEyeR'] as const;
const STAIRS_PARTS = ['StairsBase', 'StairsStep0', 'StairsStep1', 'StairsStep2'] as const;

export interface RogueScene {
  sync(state: RogueState): void;
  resize(): void;
  render(): void;
}

export async function createScene(canvas: HTMLCanvasElement): Promise<RogueScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060b);
  scene.fog = new THREE.Fog(0x04060b, 28, 60);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  camera.position.set(0, 18, 12);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x93a7c8, 0.65));
  const key = new THREE.DirectionalLight(0xdfe9ff, 1.5);
  key.position.set(6, 16, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4d6bff, 0.5);
  rim.position.set(-8, 6, -10);
  scene.add(rim);

  const gltf = await new GLTFLoader().loadAsync(KIT_URL);
  const find = (name: string): THREE.Object3D => {
    const node = gltf.scene.getObjectByName(name);
    if (!node) throw new Error(`dungeon-kit is missing ${name}`);
    return node;
  };
  const findMesh = (name: string): THREE.Mesh => {
    const node = find(name);
    if (!(node instanceof THREE.Mesh)) throw new Error(`dungeon-kit ${name} is not a mesh`);
    return node;
  };

  const world = new THREE.Group();
  scene.add(world);
  const actors = new THREE.Group();
  scene.add(actors);

  const dummy = new THREE.Object3D();
  const toWorld = (state: RogueState, x: number, y: number): THREE.Vector3 =>
    new THREE.Vector3(x - (state.cols - 1) / 2, 0, y - (state.rows - 1) / 2);

  const instance = (name: string, tile: THREE.Vector3): THREE.Mesh => {
    const part = findMesh(name);
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, 1);
    dummy.position.set(tile.x + part.position.x, tile.y + part.position.y, tile.z + part.position.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(0, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  };

  const clear = (group: THREE.Group): void => {
    for (const child of [...group.children]) {
      group.remove(child);
      if (child instanceof THREE.InstancedMesh) child.dispose();
    }
  };

  const cloneGroup = (names: readonly string[], at: THREE.Vector3): THREE.Group => {
    const group = new THREE.Group();
    for (const name of names) group.add(find(name).clone(true));
    group.position.copy(at);
    group.traverse(child => {
      if (child instanceof THREE.Mesh) child.castShadow = false;
    });
    return group;
  };

  const sync = (state: RogueState): void => {
    clear(world);
    clear(actors);

    const floorGeo = findMesh('TileFloor');
    const wallCount = state.tiles.filter(tile => tile === 'wall').length;
    const floorCount = state.tiles.filter(tile => tile === 'floor').length;
    const floorMesh = new THREE.InstancedMesh(floorGeo.geometry, floorGeo.material, Math.max(1, floorCount));
    let fi = 0;
    for (let y = 0; y < state.rows; y += 1) {
      for (let x = 0; x < state.cols; x += 1) {
        if (state.tiles[y * state.cols + x] !== 'floor') continue;
        const at = toWorld(state, x, y);
        dummy.position.set(at.x + floorGeo.position.x, at.y + floorGeo.position.y, at.z + floorGeo.position.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        floorMesh.setMatrixAt(fi, dummy.matrix);
        fi += 1;
      }
    }
    floorMesh.count = fi;
    floorMesh.instanceMatrix.needsUpdate = true;
    world.add(floorMesh);

    const wallMesh = new THREE.InstancedMesh(findMesh('TileWall').geometry, findMesh('TileWall').material, Math.max(1, wallCount));
    const capMesh = new THREE.InstancedMesh(findMesh('WallCap').geometry, findMesh('WallCap').material, Math.max(1, wallCount));
    let wi = 0;
    for (let y = 0; y < state.rows; y += 1) {
      for (let x = 0; x < state.cols; x += 1) {
        if (state.tiles[y * state.cols + x] !== 'wall') continue;
        const at = toWorld(state, x, y);
        dummy.position.set(at.x, 0, at.z);
        dummy.updateMatrix();
        wallMesh.setMatrixAt(wi, dummy.matrix);
        capMesh.setMatrixAt(wi, dummy.matrix);
        wi += 1;
      }
    }
    wallMesh.count = wi;
    capMesh.count = wi;
    wallMesh.instanceMatrix.needsUpdate = true;
    capMesh.instanceMatrix.needsUpdate = true;
    world.add(wallMesh, capMesh);

    for (let y = 0; y < state.rows; y += 1) {
      for (let x = 0; x < state.cols; x += 1) {
        if (state.tiles[y * state.cols + x] !== 'stairs') continue;
        const at = toWorld(state, x, y);
        for (const name of STAIRS_PARTS) world.add(instance(name, at));
      }
    }

    for (const heart of state.hearts) actors.add(cloneGroup(['ItemHeart'], toWorld(state, heart.x, heart.y)));
    for (const monster of state.monsters) actors.add(cloneGroup(MONSTER_PARTS, toWorld(state, monster.pos.x, monster.pos.y)));
    actors.add(cloneGroup(HERO_PARTS, toWorld(state, state.player.x, state.player.y)));
  };

  const resize = (): void => {
    const width = canvas.clientWidth || globalThis.innerWidth;
    const height = canvas.clientHeight || globalThis.innerHeight;
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    let halfH = Math.max(7.5, 16 * 0.62);
    let halfW = halfH * aspect;
    if (halfW < 16 * 0.62) {
      halfW = 16 * 0.62;
      halfH = halfW / aspect;
    }
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  return {
    sync,
    resize,
    render: () => renderer.render(scene, camera),
  };
}

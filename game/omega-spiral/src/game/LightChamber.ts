import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createSeededRandom } from "../utils/random";

type WallBounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type ChamberChoice = {
  id: "door" | "monster" | "chest";
  alignedTo: "Light" | "Shadow" | "Ambition";
  position: THREE.Vector3;
  label: string;
  outcome: string;
};

const ROOM = 12;
const ROOM_CENTERS = [-24, -12, 0, 12, 24];
const EXIT_X = { monster: -24, door: 0, chest: 24 } as const;

/** Light shifts straight room openings by seed, keeping every neighboring room connected. */
export class LightChamber {
  readonly group = new THREE.Group();
  readonly choices: ReadonlyArray<ChamberChoice>;
  walls: ReadonlyArray<WallBounds> = [];

  private readonly layoutGroup = new THREE.Group();
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly layoutGeometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly signals: THREE.MeshStandardMaterial[] = [];
  private readonly gateLights = new Map<ChamberChoice["id"], THREE.PointLight>();
  private readonly gateApertures = new Map<ChamberChoice["id"], THREE.Mesh>();
  private readonly exitRoutes = new Map<ChamberChoice["id"], THREE.Group>();
  private readonly gateBounds = new Map<ChamberChoice["id"], WallBounds>();
  private readonly perimeterWalls: WallBounds[] = [];
  private generatedWalls: WallBounds[] = [];
  private readonly stone: THREE.MeshStandardMaterial;
  private readonly edge: THREE.MeshStandardMaterial;
  private readonly pale: THREE.MeshStandardMaterial;
  private readonly amber: THREE.MeshStandardMaterial;
  private readonly groundMaterials: THREE.MeshStandardMaterial[];
  private doorAsset: THREE.Group | null = null;
  private doorShader: THREE.ShaderMaterial | null = null;
  private doorFragments: THREE.Mesh[] = [];
  private sourceFragments: THREE.Mesh[] = [];
  private monsterGroup = new THREE.Group();
  private chestGroup = new THREE.Group();
  private selected: ChamberChoice["id"] | null = null;
  private layoutSeed = 472;
  private disposed = false;

  constructor() {
    this.group.name = "LightChamber";
    this.layoutGroup.name = "SeededStraightRooms";
    this.group.add(this.layoutGroup);

    this.stone = this.material("#183047", 0x061524);
    this.stone.map = this.createCodeStackTexture();
    this.edge = this.material("#477d9f", 0x103353);
    this.edge.emissiveIntensity = 0.16;
    this.pale = this.material("#b7dfff", 0x3a7ea9);
    this.amber = this.material("#d98b4d", 0x63311b);
    this.groundMaterials = ["#70b7d8", "#d39362", "#9bb3bf"].map((color) => {
      const material = this.material(color, 0x163049);
      material.emissiveIntensity = 0.12;
      return material;
    });
    const deep = this.material("#07182b", 0x020a14);
    const wolf = this.material("#8d4d58", 0x492138);
    const violet = this.material("#887096", 0x3e2f57);

    this.choices = Object.freeze([
      { id: "monster", alignedTo: "Ambition", position: new THREE.Vector3(-24, 0, -27.5), label: "Monster", outcome: "A spectral wolf appears. The fight begins." },
      { id: "door", alignedTo: "Light", position: new THREE.Vector3(0, 0, -27.5), label: "Door", outcome: "What is the first story you ever loved?" },
      { id: "chest", alignedTo: "Shadow", position: new THREE.Vector3(24, 0, -27.5), label: "Chest", outcome: "Inside the chest: a broken compass." },
    ]);

    // A visible perimeter replaces the starter demo's invisible position clamp.
    this.perimeterWalls.push(this.wall(0, 30, 60, 0.7, this.group));
    this.perimeterWalls.push(this.wall(-30, 0, 0.7, 60, this.group));
    this.perimeterWalls.push(this.wall(30, 0, 0.7, 60, this.group));
    for (const [start, end] of [[-30, -25.4], [-22.6, -1.6], [1.6, 22.6], [25.4, 30]] as const) {
      this.perimeterWalls.push(this.wall((start + end) / 2, -30, end - start, 0.7, this.group));
    }
    for (const id of ["monster", "door", "chest"] as const) {
      const x = EXIT_X[id];
      const width = id === "door" ? 3.2 : 2.8;
      this.gateBounds.set(id, Object.freeze({ minX: x - width / 2, maxX: x + width / 2, minZ: -30.35, maxZ: -29.65 }));
    }

    this.makeGate(-24, -31, "monster", deep, this.amber);
    this.makeDoor(0, -31, deep);
    this.makeGate(24, -31, "chest", deep, violet);
    this.makeExitLocator("monster", this.amber);
    this.makeExitLocator("door", this.pale);
    this.makeExitLocator("chest", violet);
    this.makeWolf(-24, -27.5, wolf, this.amber);
    this.makeChest(24, -27.5, violet, this.pale);
    this.makeExitRoute("monster", this.amber);
    this.makeExitRoute("door", this.pale);
    this.makeExitRoute("chest", violet);
    this.regenerate(this.layoutSeed);
  }

  /** A 1-2 tile shift changes openings while all room-to-room connections remain open. */
  regenerate(seed: number): void {
    this.layoutSeed = seed;
    this.layoutGroup.clear();
    for (const geometry of this.layoutGeometries) geometry.dispose();
    this.layoutGeometries.length = 0;
    const rng = createSeededRandom(seed);
    const walls: WallBounds[] = [];

    // 5 x 5 rooms. Each wall that exists has a traversable opening; some are omitted.
    for (const x of [-18, -6, 6, 18]) {
      for (const z of ROOM_CENTERS) {
        if (rng() < 0.55) continue;
        const shift = (Math.floor(rng() * 5) - 2) * 1.2;
        const gap = 3.3;
        const low = z - ROOM / 2;
        const high = z + ROOM / 2;
        const opening = z + shift;
        this.addVerticalSegment(walls, x, low, opening - gap / 2);
        this.addVerticalSegment(walls, x, opening + gap / 2, high);
      }
    }
    for (const z of [-18, -6, 6, 18]) {
      for (const x of ROOM_CENTERS) {
        if (rng() < 0.55) continue;
        const shift = (Math.floor(rng() * 5) - 2) * 1.2;
        const gap = 3.3;
        const low = x - ROOM / 2;
        const high = x + ROOM / 2;
        const opening = x + shift;
        this.addHorizontalSegment(walls, z, low, opening - gap / 2);
        this.addHorizontalSegment(walls, z, opening + gap / 2, high);
      }
    }

    // Small fragments punctuate the rooms without hiding the traversable openings.
    for (let i = 0; i < 24; i += 1) {
      const x = -27 + rng() * 54;
      const z = -27 + rng() * 54;
      if (Math.abs(x) < 2.5 && z > 22) continue;
      this.box("loose code bit", x, 0.035, z, 0.22, 0.045, 0.22, i % 6 === 0 ? this.amber : this.pale, this.layoutGroup);
    }
    for (const [x, z] of [[-4.7, 24], [4.7, 24], [-22, 2], [22, -10], [-7, -23], [8, -17]] as const) {
      walls.push(this.pillar(x, z, this.layoutGroup));
    }
    this.generatedWalls = walls;
    this.placeGroundFragments();
    this.refreshColliders();
  }

  update(elapsed: number, reducedMotion: boolean): void {
    if (this.doorShader) this.doorShader.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
    for (const signal of this.signals) signal.emissiveIntensity = reducedMotion ? 0.75 : 0.73 + Math.sin(elapsed * 1.4) * 0.14;
  }

  resolveChoice(id: ChamberChoice["id"]): void {
    this.selected = id;
    if (id === "monster") this.monsterGroup.visible = false;
    if (id === "chest") this.chestGroup.rotation.x = -0.12;
    if (id === "door") for (const fragment of this.doorFragments) fragment.visible = false;
    for (const [gate, light] of this.gateLights) light.intensity = gate === id ? 2.2 : 0.15;
    for (const [gate, aperture] of this.gateApertures) aperture.visible = gate !== id;
    for (const [gate, route] of this.exitRoutes) route.visible = gate === id;
    this.refreshColliders();
  }

  reset(): void {
    this.selected = null;
    this.monsterGroup.visible = true;
    this.chestGroup.rotation.x = 0;
    for (const fragment of this.doorFragments) fragment.visible = true;
    for (const light of this.gateLights.values()) light.intensity = 0.48;
    for (const aperture of this.gateApertures.values()) aperture.visible = true;
    for (const route of this.exitRoutes.values()) route.visible = false;
    this.refreshColliders();
  }

  reachedExit(id: ChamberChoice["id"], position: THREE.Vector3): boolean {
    return Math.abs(position.x - EXIT_X[id]) < 1.3 && position.z < -31.8;
  }

  dispose(): void {
    this.disposed = true;
    this.doorAsset?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    for (const geometry of [...this.geometries, ...this.layoutGeometries]) geometry.dispose();
    for (const texture of this.textures) texture.dispose();
    for (const material of this.materials) material.dispose();
    this.group.clear();
  }

  private refreshColliders(): void {
    const gates = [...this.gateBounds].filter(([id]) => id !== this.selected).map(([, bounds]) => bounds);
    this.walls = Object.freeze([...this.perimeterWalls, ...this.generatedWalls, ...gates]);
  }

  private addVerticalSegment(walls: WallBounds[], x: number, start: number, end: number): void {
    if (end - start > 0.8) walls.push(this.wall(x, (start + end) / 2, 0.58, end - start, this.layoutGroup));
  }

  private addHorizontalSegment(walls: WallBounds[], z: number, start: number, end: number): void {
    if (end - start > 0.8) walls.push(this.wall((start + end) / 2, z, end - start, 0.58, this.layoutGroup));
  }

  private material(color: string, emissive: number): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.32, metalness: 0.16, roughness: 0.74, flatShading: true });
    this.materials.push(material);
    return material;
  }

  private createCodeStackTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create code stack texture.");
    context.fillStyle = "#d2e2ed";
    context.fillRect(0, 0, 32, 64);
    for (let y = 5; y < 64; y += 9) {
      context.fillStyle = "#53728b";
      context.fillRect(0, y, 32, 2);
      context.fillStyle = "#96b5c8";
      context.fillRect(0, y + 2, 32, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    this.textures.push(texture);
    return texture;
  }

  private box(name: string, x: number, y: number, z: number, width: number, height: number, depth: number, material: THREE.Material, parent: THREE.Group = this.group): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    if (parent === this.layoutGroup) this.layoutGeometries.push(geometry);
    else this.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = height > 0.1;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private wall(x: number, z: number, width: number, depth: number, parent: THREE.Group): WallBounds {
    this.box("Light straight wall", x, 0.39, z, width, 0.78, depth, this.stone, parent);
    if (width > depth) {
      this.box("Light edge line", x, 0.79, z + depth / 2 - 0.07, width, 0.04, 0.14, this.edge, parent);
    } else {
      this.box("Light edge line", x + width / 2 - 0.07, 0.79, z, 0.14, 0.04, depth, this.edge, parent);
    }
    return Object.freeze({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
  }

  private pillar(x: number, z: number, parent: THREE.Group): WallBounds {
    this.box("Light code pillar", x, 0.84, z, 0.78, 1.68, 0.78, this.stone, parent);
    this.box("Light pillar top", x, 1.7, z, 0.9, 0.08, 0.9, this.edge, parent);
    this.box("amber slit", x, 0.93, z + 0.41, 0.065, 0.88, 0.03, this.amber, parent);
    return Object.freeze({ minX: x - 0.39, maxX: x + 0.39, minZ: z - 0.39, maxZ: z + 0.39 });
  }

  private makeGate(x: number, z: number, id: "monster" | "chest", dark: THREE.Material, signal: THREE.MeshStandardMaterial): void {
    this.gateApertures.set(id, this.box(id + " exit aperture", x, 1.06, z, 1.42, 2.1, 0.1, dark));
    this.box(id + " exit left", x - 0.8, 1.12, z, 0.22, 2.3, 0.42, this.stone);
    this.box(id + " exit right", x + 0.8, 1.12, z, 0.22, 2.3, 0.42, this.stone);
    this.box(id + " exit lintel", x, 2.31, z, 1.82, 0.22, 0.42, this.stone);
    this.box(id + " signal left", x - 0.8, 1.12, z + 0.23, 0.045, 1.5, 0.04, signal);
    this.box(id + " signal right", x + 0.8, 1.12, z + 0.23, 0.045, 1.5, 0.04, signal);
    this.box(id + " exit code", x, 2.33, z + 0.23, 0.96, 0.045, 0.05, signal);
    this.box(id + " threshold", x, 0.025, z + 0.7, 1.62, 0.03, 0.18, signal);
    const light = new THREE.PointLight(signal.color, 0.48, 3.2);
    light.position.set(x, 1.5, z + 0.5);
    this.gateLights.set(id, light);
    this.group.add(light);
    this.signals.push(signal);
  }

  private makeExitRoute(id: ChamberChoice["id"], signal: THREE.Material): void {
    const route = new THREE.Group();
    route.name = `${id} selected exit route`;
    route.visible = false;
    const x = EXIT_X[id];
    for (let index = 0; index < 6; index += 1) {
      this.box(`${id} exit code step`, x, 0.028, -28.1 - index * 0.55, 0.18, 0.045, 0.18, signal, route);
    }
    this.box(`${id} open threshold`, x, 0.035, -30.7, 1.48, 0.06, 0.16, signal, route);
    this.exitRoutes.set(id, route);
    this.group.add(route);
  }

  private makeExitLocator(id: ChamberChoice["id"], signal: THREE.Material): void {
    const x = EXIT_X[id];
    this.box(`${id} distant code locator`, x, 4.48, -31.3, 0.055, 3.3, 0.055, signal);
    this.box(`${id} locator head`, x, 6.15, -31.3, 0.3, 0.055, 0.3, signal);
  }

  private makeDoor(x: number, z: number, dark: THREE.Material): void {
    const fallback = new THREE.Group();
    this.box("door fallback aperture", x, 1.1, z, 1.42, 2.2, 0.13, dark, fallback);
    this.box("door fallback left", x - 0.79, 1.15, z, 0.22, 2.3, 0.45, this.stone, fallback);
    this.box("door fallback right", x + 0.79, 1.15, z, 0.22, 2.3, 0.45, this.stone, fallback);
    this.box("door fallback lintel", x, 2.37, z, 1.8, 0.22, 0.45, this.stone, fallback);
    this.group.add(fallback);
    const light = new THREE.PointLight(0x80c8ef, 0.48, 4);
    light.position.set(x, 1.8, z + 0.9);
    this.gateLights.set("door", light);
    this.group.add(light);

    const url = new URL("../../assets/models/floor-one-door/model.glb", import.meta.url).href;
    new GLTFLoader().load(url, (gltf) => {
      if (this.disposed) return;
      const door = gltf.scene;
      door.name = "FloorOneAuthoredDoor";
      door.position.set(x, 0, z);
      door.scale.setScalar(0.84);
      door.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.name.startsWith("DoorFragment")) {
          this.doorFragments.push(object);
          this.sourceFragments.push(object);
        }
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          if (!/cyan|amber|glow/i.test(material.name)) continue;
          material.emissive = new THREE.Color(/amber/i.test(material.name) ? 0xff9c49 : 0x66d7ff);
          this.signals.push(material);
        }
      });
      this.addDoorVeil(door);
      this.doorAsset = door;
      this.group.add(door);
      fallback.visible = false;
      this.placeGroundFragments();
    }, undefined, (error) => console.warn("Floor One door GLB failed; block fallback remains", error));
  }

  private placeGroundFragments(): void {
    for (const child of [...this.layoutGroup.children]) {
      if (child.name === "GroundDoorFragments") this.layoutGroup.remove(child);
    }
    if (!this.sourceFragments.length) return;
    const rng = createSeededRandom(this.layoutSeed + 991);
    const transform = new THREE.Object3D();
    for (let group = 0; group < this.groundMaterials.length; group += 1) {
      const source = this.sourceFragments[group * 31 % this.sourceFragments.length];
      const fragments = new THREE.InstancedMesh(source.geometry, this.groundMaterials[group], 12);
      fragments.name = "GroundDoorFragments";
      fragments.receiveShadow = true;
      for (let index = 0; index < 12; index += 1) {
        const roomX = ROOM_CENTERS[(index * 3 + group) % ROOM_CENTERS.length];
        const roomZ = ROOM_CENTERS[(Math.floor(index / 5) + group) % ROOM_CENTERS.length];
        const x = roomX + (rng() - 0.5) * 8;
        const z = roomZ + (rng() - 0.5) * 8;
        transform.position.set(x, 0.085, z);
        transform.rotation.set(Math.PI / 2 + rng() * 0.35, rng() * Math.PI, rng() * Math.PI * 2);
        transform.scale.setScalar(0.16 + rng() * 0.18);
        transform.updateMatrix();
        fragments.setMatrixAt(index, transform.matrix);
      }
      fragments.instanceMatrix.needsUpdate = true;
      this.layoutGroup.add(fragments);
    }
  }

  private addDoorVeil(door: THREE.Group): void {
    const shader = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main() {
          float scan = step(0.9, fract(vUv.y * 25.0 - uTime * 0.5));
          float code = step(0.96, fract(vUv.x * 11.0 + floor(vUv.y * 12.0) * 0.37));
          gl_FragColor = vec4(0.16, 0.64, 0.9, 0.045 + scan * 0.045 + code * 0.07);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const geometry = new THREE.PlaneGeometry(1.45, 1.85);
    this.geometries.push(geometry);
    const veil = new THREE.Mesh(geometry, shader);
    veil.name = "DoorCodeVeil";
    veil.position.set(0, 1.16, 0.18);
    door.add(veil);
    this.doorShader = shader;
  }

  private makeWolf(x: number, z: number, body: THREE.Material, eye: THREE.Material): void {
    this.monsterGroup.name = "MonsterChoice";
    this.group.add(this.monsterGroup);
    this.box("wolf body", x, 0.61, z, 0.98, 0.48, 0.58, body, this.monsterGroup);
    this.box("wolf head", x, 0.95, z + 0.31, 0.62, 0.5, 0.5, body, this.monsterGroup);
    for (const side of [-1, 1]) {
      this.box("wolf ear", x + side * 0.22, 1.31, z + 0.35, 0.14, 0.24, 0.15, body, this.monsterGroup);
      this.box("wolf eye", x + side * 0.16, 1.02, z + 0.57, 0.07, 0.06, 0.025, eye, this.monsterGroup);
      this.box("wolf leg", x + side * 0.29, 0.24, z + 0.2, 0.16, 0.45, 0.16, body, this.monsterGroup);
    }
  }

  private makeChest(x: number, z: number, body: THREE.Material, trim: THREE.Material): void {
    this.chestGroup.name = "ChestChoice";
    this.group.add(this.chestGroup);
    this.box("chest body", x, 0.44, z, 1.05, 0.67, 0.68, body, this.chestGroup);
    this.box("chest lid", x, 0.81, z, 1.15, 0.14, 0.75, trim, this.chestGroup);
    this.box("chest lock", x, 0.49, z + 0.36, 0.16, 0.2, 0.05, trim, this.chestGroup);
  }
}

import * as THREE from 'three';
import type { FloorEvent, FloorState, Tile } from '../game/floor-one';

/** Authored, instanced scenery for the one deterministic Floor One map. */
export class FloorVisual {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 100);
  private readonly floor: THREE.InstancedMesh;
  private readonly inset: THREE.InstancedMesh;
  private readonly walls: THREE.InstancedMesh;
  private readonly caps: THREE.InstancedMesh;
  private readonly wallWire: THREE.InstancedMesh;
  private readonly player: THREE.Group;
  private readonly guard: THREE.Group;
  private readonly guardSignal: THREE.Mesh;
  private readonly door: THREE.Group;
  private readonly doorSeal: THREE.Group;
  private readonly pickup: THREE.Group;
  private readonly stairs: THREE.Group;
  private readonly glyphCanvas: HTMLCanvasElement;
  private readonly glyphTexture: THREE.CanvasTexture;
  private readonly wallGlyphCanvas: HTMLCanvasElement;
  private readonly wallGlyphTexture: THREE.CanvasTexture;
  private readonly lampGroups: THREE.Group[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly floorSlots: number[] = [];
  private readonly wallSlots: number[] = [];
  private readonly floorBase = new THREE.Color();
  private readonly wallBase = new THREE.Color();
  private readonly effects: { root: THREE.Group; start: number; duration: number; material: THREE.MeshBasicMaterial }[] = [];
  private readonly cols: number;
  private readonly rows: number;

  constructor(state: FloorState) {
    this.cols = state.cols;
    this.rows = state.rows;
    this.scene.background = new THREE.Color(0x050912);
    this.camera.position.set(0, 23, 20);
    this.camera.lookAt(0, 0, 0);

    const stone = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.03 });
    const insetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.12 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.14 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.19 });
    const floorCount = state.tiles.filter(tile => tile !== 'wall').length;
    const wallCount = state.tiles.length - floorCount;
    this.floor = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 0.13, 0.98), stone, floorCount);
    this.inset = new THREE.InstancedMesh(new THREE.BoxGeometry(0.79, 0.018, 0.79), insetMat, floorCount);
    this.walls = new THREE.InstancedMesh(new THREE.BoxGeometry(0.91, 0.77, 0.91), wallMat, wallCount);
    this.caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.11, 1), capMat, wallCount);
    this.wallWire = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.94, 0.8, 0.94),
      new THREE.MeshBasicMaterial({ color: 0x8daeba, wireframe: true, transparent: true, opacity: 0.2, depthWrite: false }),
      wallCount,
    );
    for (const mesh of [this.floor, this.inset, this.walls, this.caps, this.wallWire]) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
    let fi = 0;
    let wi = 0;
    for (let i = 0; i < state.tiles.length; i += 1) {
      const x = i % this.cols;
      const y = Math.floor(i / this.cols);
      const tile = state.tiles[i];
      if (tile === 'wall') {
        this.wallSlots[i] = wi;
        this.setInstance(this.walls, wi, x, y, 0.39, 1);
        this.setInstance(this.caps, wi, x, y, 0.82, 1);
        this.setInstance(this.wallWire, wi, x, y, 0.39, 1);
        wi += 1;
      } else {
        this.floorSlots[i] = fi;
        this.setInstance(this.floor, fi, x, y, -0.015, 1);
        this.setInstance(this.inset, fi, x, y, 0.064, 1);
        fi += 1;
      }
    }

    // The substrate keeps the original roguelike glyph read over the floor kit.
    this.glyphCanvas = document.createElement('canvas');
    this.glyphCanvas.width = this.cols * 48;
    this.glyphCanvas.height = this.rows * 48;
    this.glyphTexture = new THREE.CanvasTexture(this.glyphCanvas);
    this.glyphTexture.colorSpace = THREE.SRGBColorSpace;
    this.glyphTexture.magFilter = THREE.NearestFilter;
    const glyphPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cols, this.rows),
      new THREE.MeshBasicMaterial({ map: this.glyphTexture, transparent: true, opacity: 0.94, depthWrite: false }),
    );
    glyphPlane.rotation.x = -Math.PI / 2;
    glyphPlane.position.y = 0.087;
    glyphPlane.renderOrder = 4;
    this.scene.add(glyphPlane);
    this.wallGlyphCanvas = document.createElement('canvas');
    this.wallGlyphCanvas.width = this.cols * 48;
    this.wallGlyphCanvas.height = this.rows * 48;
    this.wallGlyphTexture = new THREE.CanvasTexture(this.wallGlyphCanvas);
    this.wallGlyphTexture.colorSpace = THREE.SRGBColorSpace;
    this.wallGlyphTexture.magFilter = THREE.NearestFilter;
    const wallGlyphPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cols, this.rows),
      new THREE.MeshBasicMaterial({ map: this.wallGlyphTexture, transparent: true, opacity: 0.8, depthWrite: false }),
    );
    wallGlyphPlane.rotation.x = -Math.PI / 2;
    wallGlyphPlane.position.y = 0.89;
    wallGlyphPlane.renderOrder = 5;
    this.scene.add(wallGlyphPlane);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(this.cols + 0.5, 0.18, this.rows + 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111c2c, roughness: 0.78, metalness: 0.26 }),
    );
    plinth.position.y = -0.19;
    this.scene.add(plinth);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x64758a, roughness: 0.62, metalness: 0.55 });
    for (const [width, depth, px, pz] of [
      [this.cols + 0.62, 0.055, 0, -this.rows / 2 - 0.24],
      [this.cols + 0.62, 0.055, 0, this.rows / 2 + 0.24],
      [0.055, this.rows + 0.62, -this.cols / 2 - 0.24, 0],
      [0.055, this.rows + 0.62, this.cols / 2 + 0.24, 0],
    ]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), rimMat);
      rail.position.set(px, -0.09, pz);
      this.scene.add(rail);
    }

    this.player = this.makePlayer();
    this.guard = this.makeGuard();
    this.guardSignal = this.guard.getObjectByName('guardSignal') as THREE.Mesh;
    this.scene.add(this.player, this.guard);
    this.door = this.makeDoor();
    this.doorSeal = this.door.getObjectByName('doorSeal') as THREE.Group;
    this.pickup = this.makePickup();
    this.stairs = this.makeStairs();
    this.scene.add(this.door, this.pickup, this.stairs);
    this.door.position.copy(this.at(10, 5));
    this.pickup.position.copy(this.at(5, 5));
    this.stairs.position.copy(this.at(18, 5));
    for (const [x, y] of [[1, 1], [8, 5], [12, 5], [18, 5]]) {
      const lamp = this.makeLamp();
      lamp.position.copy(this.at(x, y));
      lamp.userData.mapX = x;
      lamp.userData.mapY = y;
      this.lampGroups.push(lamp);
      this.scene.add(lamp);
    }

    this.scene.add(new THREE.AmbientLight(0xb5c8e4, 0.85));
    const key = new THREE.DirectionalLight(0xffd9a8, 1.55);
    key.position.set(-7, 14, 10);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x77a9d9, 0.85);
    fill.position.set(9, 8, -7);
    this.scene.add(fill);
    this.update(state);
  }

  private at(x: number, y: number): THREE.Vector3 {
    return new THREE.Vector3(x + 0.5 - this.cols / 2, 0, y + 0.5 - this.rows / 2);
  }

  private setInstance(mesh: THREE.InstancedMesh, slot: number, x: number, y: number, height: number, scale: number): void {
    this.dummy.position.copy(this.at(x, y));
    this.dummy.position.y = height;
    this.dummy.scale.setScalar(scale);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(slot, this.dummy.matrix);
  }

  private material(color: number, metalness = 0.15, roughness = 0.66): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness });
  }

  private part(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  private makePlayer(): THREE.Group {
    const root = new THREE.Group();
    const cloth = this.material(0x1c5265, 0.08, 0.92);
    const armor = this.material(0x8daebc, 0.55, 0.4);
    const dark = this.material(0x111b29, 0.2, 0.83);
    const light = new THREE.MeshStandardMaterial({ color: 0x74e5ee, emissive: 0x1a7788, emissiveIntensity: 0.65, roughness: 0.35 });
    this.part(root, new THREE.CylinderGeometry(0.19, 0.25, 0.42, 5), cloth, 0, 0.39, 0);
    this.part(root, new THREE.BoxGeometry(0.42, 0.1, 0.27), armor, 0, 0.58, 0);
    this.part(root, new THREE.DodecahedronGeometry(0.17, 0), armor, 0, 0.78, 0);
    this.part(root, new THREE.BoxGeometry(0.25, 0.065, 0.045), light, 0, 0.78, 0.158);
    const crest = this.part(root, new THREE.ConeGeometry(0.105, 0.25, 4), cloth, 0, 0.98, 0);
    crest.rotation.y = Math.PI / 4;
    for (const side of [-1, 1]) {
      const shoulder = this.part(root, new THREE.BoxGeometry(0.17, 0.12, 0.27), armor, side * 0.3, 0.58, 0);
      shoulder.rotation.z = side * 0.22;
      this.part(root, new THREE.CylinderGeometry(0.07, 0.095, 0.31, 5), cloth, side * 0.31, 0.38, 0.02);
      this.part(root, new THREE.BoxGeometry(0.13, 0.3, 0.17), dark, side * 0.13, 0.14, 0.015);
      this.part(root, new THREE.BoxGeometry(0.16, 0.07, 0.24), armor, side * 0.13, 0.035, 0.06);
    }
    this.part(root, new THREE.BoxGeometry(0.29, 0.31, 0.11), dark, 0, 0.44, -0.19);
    this.part(root, new THREE.BoxGeometry(0.18, 0.12, 0.14), light, 0, 0.48, -0.26);
    const contact = this.part(root, new THREE.CylinderGeometry(0.36, 0.36, 0.012, 16), this.material(0x142d37, 0, 1), 0, 0.011, 0);
    contact.renderOrder = 0;
    return root;
  }

  private makeGuard(): THREE.Group {
    const root = new THREE.Group();
    const armor = this.material(0x776b62, 0.55, 0.55);
    const dark = this.material(0x24262f, 0.17, 0.88);
    const brass = this.material(0xb8a177, 0.7, 0.42);
    const signal = new THREE.MeshStandardMaterial({ color: 0xffcc76, emissive: 0x7a3614, emissiveIntensity: 0.7, roughness: 0.35 });
    const torso = this.part(root, new THREE.CylinderGeometry(0.27, 0.35, 0.55, 6), armor, 0, 0.47, 0);
    torso.rotation.y = Math.PI / 6;
    this.part(root, new THREE.ConeGeometry(0.21, 0.33, 5), dark, 0, 0.94, 0);
    this.part(root, new THREE.BoxGeometry(0.28, 0.075, 0.08), signal, 0, 0.86, 0.2).name = 'guardSignal';
    this.part(root, new THREE.BoxGeometry(0.58, 0.09, 0.33), brass, 0, 0.73, 0);
    for (const side of [-1, 1]) {
      this.part(root, new THREE.BoxGeometry(0.16, 0.43, 0.18), armor, side * 0.32, 0.41, 0);
      this.part(root, new THREE.BoxGeometry(0.17, 0.31, 0.2), dark, side * 0.14, 0.15, 0);
    }
    this.part(root, new THREE.BoxGeometry(0.1, 0.94, 0.1), brass, 0.46, 0.58, 0.07);
    const blade = this.part(root, new THREE.ConeGeometry(0.16, 0.35, 4), armor, 0.46, 1.18, 0.07);
    blade.rotation.y = Math.PI / 4;
    this.part(root, new THREE.BoxGeometry(0.35, 0.46, 0.09), armor, -0.4, 0.51, 0.18).rotation.z = -0.17;
    this.part(root, new THREE.BoxGeometry(0.25, 0.04, 0.1), brass, -0.4, 0.51, 0.24);
    return root;
  }

  private makeDoor(): THREE.Group {
    const root = new THREE.Group();
    const frame = this.material(0x8493a5, 0.63, 0.45);
    const seal = new THREE.MeshStandardMaterial({ color: 0xc9863a, emissive: 0x613009, emissiveIntensity: 0.7, metalness: 0.48 });
    for (const side of [-1, 1]) {
      this.part(root, new THREE.BoxGeometry(0.18, 1.25, 0.34), frame, side * 0.4, 0.61, 0);
      this.part(root, new THREE.BoxGeometry(0.24, 0.18, 0.41), frame, side * 0.4, 1.27, 0);
    }
    this.part(root, new THREE.BoxGeometry(0.99, 0.16, 0.42), frame, 0, 1.27, 0);
    const shutter = new THREE.Group();
    shutter.name = 'doorSeal';
    root.add(shutter);
    this.part(shutter, new THREE.BoxGeometry(0.66, 0.77, 0.08), seal, 0, 0.6, 0.02);
    for (const side of [-1, 1]) this.part(shutter, new THREE.BoxGeometry(0.08, 0.62, 0.12), frame, side * 0.19, 0.58, 0.1);
    this.part(shutter, new THREE.BoxGeometry(0.45, 0.07, 0.14), frame, 0, 0.61, 0.12);
    return root;
  }

  private makePickup(): THREE.Group {
    const root = new THREE.Group();
    const brass = this.material(0xb69656, 0.62, 0.38);
    const crystal = new THREE.MeshStandardMaterial({ color: 0xffda79, emissive: 0xd48b28, emissiveIntensity: 0.95, roughness: 0.24, metalness: 0.18 });
    this.part(root, new THREE.CylinderGeometry(0.3, 0.38, 0.12, 6), brass, 0, 0.13, 0);
    this.part(root, new THREE.OctahedronGeometry(0.28), crystal, 0, 0.48, 0);
    const ring = this.part(root, new THREE.TorusGeometry(0.33, 0.025, 5, 16), brass, 0, 0.45, 0);
    ring.rotation.x = Math.PI / 2.6;
    return root;
  }

  private makeStairs(): THREE.Group {
    const root = new THREE.Group();
    const stone = this.material(0x9db6c8, 0.28, 0.65);
    const light = new THREE.MeshStandardMaterial({ color: 0xb8f2ff, emissive: 0x3d93bd, emissiveIntensity: 0.9 });
    for (let i = 0; i < 3; i += 1) {
      this.part(root, new THREE.BoxGeometry(0.83 - i * 0.11, 0.1, 0.3), stone, 0, 0.14 + i * 0.14, 0.28 - i * 0.27);
    }
    for (const side of [-1, 1]) this.part(root, new THREE.BoxGeometry(0.1, 0.9, 0.13), stone, side * 0.33, 0.66, -0.35);
    this.part(root, new THREE.BoxGeometry(0.8, 0.1, 0.15), stone, 0, 1.13, -0.35);
    this.part(root, new THREE.BoxGeometry(0.44, 0.09, 0.06), light, 0, 0.98, -0.26);
    return root;
  }

  private makeLamp(): THREE.Group {
    const root = new THREE.Group();
    const metal = this.material(0x516b77, 0.48, 0.56);
    const glow = new THREE.MeshStandardMaterial({ color: 0x8bc8dc, emissive: 0x286e84, emissiveIntensity: 0.6 });
    this.part(root, new THREE.CylinderGeometry(0.13, 0.2, 0.12, 6), metal, -0.37, 0.1, -0.35);
    this.part(root, new THREE.CylinderGeometry(0.065, 0.09, 0.67, 6), metal, -0.37, 0.46, -0.35);
    this.part(root, new THREE.OctahedronGeometry(0.15), glow, -0.37, 0.88, -0.35);
    this.part(root, new THREE.ConeGeometry(0.18, 0.14, 5), metal, -0.37, 1.04, -0.35);
    return root;
  }

  update(state: FloorState): void {
    const ctx = this.glyphCanvas.getContext('2d');
    const wallCtx = this.wallGlyphCanvas.getContext('2d');
    if (!ctx || !wallCtx) return;
    ctx.clearRect(0, 0, this.glyphCanvas.width, this.glyphCanvas.height);
    wallCtx.clearRect(0, 0, this.wallGlyphCanvas.width, this.wallGlyphCanvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 19px ui-monospace, monospace';
    wallCtx.textAlign = 'center';
    wallCtx.textBaseline = 'middle';
    wallCtx.font = 'bold 17px ui-monospace, monospace';
    for (let i = 0; i < state.tiles.length; i += 1) {
      const x = i % this.cols;
      const y = Math.floor(i / this.cols);
      const seen = state.seen[i] ?? false;
      const visible = state.visible[i] ?? false;
      const scale = seen ? 1 : 0.0001;
      const tile = state.tiles[i] as Tile;
      const noise = ((x * 17 + y * 37) % 9) / 90;
      if (tile === 'wall') {
        const slot = this.wallSlots[i];
        if (slot === undefined) continue;
        this.setInstance(this.walls, slot, x, y, 0.39, scale);
        this.setInstance(this.caps, slot, x, y, 0.82, scale);
        this.setInstance(this.wallWire, slot, x, y, 0.39, scale);
        this.wallBase.setHSL(0.59, 0.18, (visible ? 0.37 : 0.135) + noise);
        this.walls.setColorAt(slot, this.wallBase);
        this.caps.setColorAt(slot, this.wallBase.clone().multiplyScalar(1.45));
        if (seen) {
          wallCtx.globalAlpha = visible ? 0.55 : 0.18;
          wallCtx.fillStyle = '#a2c6d0';
          wallCtx.fillText('#', x * 48 + 24, y * 48 + 25);
        }
      } else {
        const slot = this.floorSlots[i];
        if (slot === undefined) continue;
        this.setInstance(this.floor, slot, x, y, -0.015, scale);
        this.setInstance(this.inset, slot, x, y, 0.064, scale);
        this.floorBase.setHSL(0.59, 0.16, (visible ? 0.26 : 0.10) + noise);
        this.floor.setColorAt(slot, this.floorBase);
        this.inset.setColorAt(slot, this.floorBase.clone().multiplyScalar(1.32));
        if (seen) {
          ctx.globalAlpha = visible ? 0.76 : 0.24;
          ctx.fillStyle = tile === 'stairs' ? '#d7f5ff' : tile === 'pickup' ? '#ffe4a6' : tile === 'door' ? '#ffc57b' : '#83adbd';
          const glyph = tile === 'stairs' ? '>' : tile === 'pickup' && !state.pickupTaken ? '*' : tile === 'door' ? '+' : '·';
          ctx.fillText(glyph, x * 48 + 24, y * 48 + 25);
        }
      }
    }
    ctx.globalAlpha = 1;
    this.glyphTexture.needsUpdate = true;
    wallCtx.globalAlpha = 1;
    this.wallGlyphTexture.needsUpdate = true;
    for (const mesh of [this.floor, this.inset, this.walls, this.caps, this.wallWire]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.player.position.copy(this.at(state.player.x, state.player.y));
    this.player.visible = state.visible[state.player.y * this.cols + state.player.x] ?? true;
    if (state.guard) {
      this.guard.position.copy(this.at(state.guard.pos.x, state.guard.pos.y));
      this.guard.visible = state.visible[state.guard.pos.y * this.cols + state.guard.pos.x] ?? false;
      const signal = this.guardSignal.material as THREE.MeshStandardMaterial;
      signal.color.set(state.guard.disposition === 'friendly' ? 0x8af5e3 : state.guard.disposition === 'hostile' ? 0xff6470 : state.guard.disposition === 'suspicious' ? 0xffbb60 : 0xe6d49f);
      signal.emissive.copy(signal.color).multiplyScalar(0.5);
    } else this.guard.visible = false;
    this.door.visible = state.seen[5 * this.cols + 10] ?? false;
    this.doorSeal.visible = !state.doorOpen;
    this.pickup.visible = !state.pickupTaken && (state.visible[5 * this.cols + 5] ?? false);
    this.stairs.visible = state.seen[5 * this.cols + 18] ?? false;
    for (const lamp of this.lampGroups) {
      lamp.visible = state.visible[(lamp.userData.mapY as number) * this.cols + (lamp.userData.mapX as number)] ?? false;
    }
    // Follow the currently revealed neighborhood; unseen tiles remain absent.
    let minX = this.cols;
    let maxX = 0;
    let minY = this.rows;
    let maxY = 0;
    for (let i = 0; i < state.visible.length; i += 1) {
      if (!state.visible[i]) continue;
      const x = i % this.cols;
      const y = Math.floor(i / this.cols);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const focus = this.at((minX + maxX) / 2, (minY + maxY) / 2);
    this.camera.position.set(focus.x, 23, focus.z + 20);
    this.camera.lookAt(focus.x, 0, focus.z);
  }

  play(events: readonly FloorEvent[], state: FloorState): boolean {
    for (const event of events) {
      let kind: 'hit' | 'damage' | 'pickup' | 'door' | 'exit' | null = null;
      let x = state.player.x;
      let y = state.player.y;
      if (event.type === 'hit' || event.type === 'miss') {
        kind = 'hit';
        x = state.guard?.pos.x ?? 9;
        y = state.guard?.pos.y ?? 5;
      } else if (event.type === 'damage') kind = 'damage';
      else if (event.type === 'pickup') kind = 'pickup';
      else if (event.type === 'door' && event.open) { kind = 'door'; x = 10; y = 5; }
      else if (event.type === 'exit') { kind = 'exit'; x = 18; y = 5; }
      if (!kind) continue;
      const color = kind === 'hit' || kind === 'damage' ? 0xff6574 : kind === 'pickup' ? 0xffd166 : kind === 'door' ? 0xffa65a : 0x7cf0ff;
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
      const root = new THREE.Group();
      root.position.copy(this.at(x, y));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 4, 20), material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.13;
      root.add(ring);
      if (kind === 'hit' || kind === 'damage') {
        for (const side of [-1, 1]) {
          const slash = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.52, 0.06), material);
          slash.position.set(side * 0.09, 0.74, 0.25);
          slash.rotation.z = side * 0.62;
          root.add(slash);
        }
      } else if (kind === 'pickup' || kind === 'exit') {
        for (const side of [-1, 1]) {
          const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), material);
          shard.position.set(side * 0.27, 0.45, 0);
          root.add(shard);
        }
      } else {
        for (const side of [-1, 1]) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.68, 0.05), material);
          bar.position.set(side * 0.28, 0.58, 0.19);
          root.add(bar);
        }
      }
      this.scene.add(root);
      this.effects.push({ root, start: performance.now(), duration: 1000, material });
    }
    return this.effects.length > 0;
  }

  advance(now: number, reducedMotion: boolean): boolean {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      const effect = this.effects[i];
      if (!effect) continue;
      const progress = Math.min(1, (now - effect.start) / effect.duration);
      effect.root.scale.setScalar(reducedMotion ? 1 : 0.72 + progress * 0.7);
      effect.material.opacity = (1 - progress) * 0.9;
      if (progress >= 1) {
        this.scene.remove(effect.root);
        effect.root.traverse(object => {
          if (object instanceof THREE.Mesh) object.geometry.dispose();
        });
        effect.material.dispose();
        this.effects.splice(i, 1);
      }
    }
    return this.effects.length > 0;
  }

  clearEffects(): void {
    this.advance(Number.POSITIVE_INFINITY, true);
  }

  resize(width: number, height: number): void {
    const aspect = width / height;
    const halfW = aspect >= 1 ? Math.max(7.35, 4.95 * aspect) : Math.max(5.65, 6.4 * aspect);
    const frameH = halfW / aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = frameH;
    this.camera.bottom = -frameH;
    this.camera.updateProjectionMatrix();
  }
}

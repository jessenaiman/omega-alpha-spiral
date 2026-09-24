import * as THREE from "three";
import type { EncounterEnemy, FloorPoint, MiddleFloorLayout } from "./middle-types";

export interface MiddleFloorArtResult {
  root: THREE.Group;
  /** Aim the event-bound telegraph before making its effect socket visible. */
  aimTelegraph(enemyId: string, target: FloorPoint): boolean;
  /** Releases geometries and materials owned by this kit. */
  dispose(): void;
}

type Palette = {
  ground: number;
  route: number;
  structure: number;
  shadow: number;
  trim: number;
  glow: number;
  warning: number;
  leaf: number;
};

const ACCENTS: Record<string, number> = {
  amber: 0xffa52d,
  mint: 0x63e6c0,
  coral: 0xff725c,
  cobalt: 0x39a8ff,
  lime: 0xbbe747,
  violet: 0xc883ff,
  ultraviolet: 0x9b79ff,
  teal: 0x42e4d3,
  copper: 0xff995e,
};

/**
 * Builds authored, floor-specific world art. Effect groups start hidden; the
 * scene root owns activation by looking up `effect:<cue-id>` in the returned
 * group and setting `visible` when the corresponding layout event fires.
 */
export function createMiddleFloorArtKit(layout: MiddleFloorLayout): MiddleFloorArtResult {
  const root = new THREE.Group();
  root.name = `middle-floor-${layout.floor}-art`;
  root.userData.floor = layout.floor;
  root.userData.era = layout.era;
  const palette = paletteFor(layout);
  const mats = makeMaterials(palette);
  const telegraphAimers = new Map<string, (target: FloorPoint) => void>();

  addGround(root, layout, mats.ground);
  addRouteRibbon(root, layout, mats.route, mats.routeSpur);
  addCollisionArchitecture(root, layout, mats, palette);
  addLandmarks(root, layout, mats, palette);
  addEraSetDressing(root, layout, mats, palette);
  addEncounterRecoveryZones(root, layout, mats);
  addEncounterFigures(root, layout, mats, palette);
  addEffectSockets(root, layout, mats, telegraphAimers);

  return {
    root,
    aimTelegraph(enemyId: string, target: FloorPoint): boolean {
      const aim = telegraphAimers.get(enemyId);
      if (!aim || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return false;
      aim(target);
      return true;
    },
    dispose(): void {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      root.traverse((object: THREE.Object3D): void => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        const collectMaterial = (material: THREE.Material): void => {
          materials.add(material);
          const map = (material as THREE.Material & { map?: THREE.Texture }).map;
          if (map) textures.add(map);
        };
        if (Array.isArray(mesh.material)) mesh.material.forEach(collectMaterial);
        else if (mesh.material) collectMaterial(mesh.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      root.clear();
    },
  };
}

function paletteFor(layout: MiddleFloorLayout): Palette {
  const accent = ACCENTS[layout.variation.accent] ?? 0x64d8ff;
  if (layout.floor === 4) return {
    ground: 0x071528, route: 0x31baff, structure: 0x153554,
    shadow: 0x081321, trim: 0x74dfff, glow: accent, warning: 0xff9e32, leaf: 0x284d5d,
  };
  if (layout.floor === 5) return {
    ground: 0x183338, route: 0xffb54e, structure: 0x49352d,
    shadow: 0x142529, trim: 0xd3975a, glow: accent, warning: 0xf85e62, leaf: 0x338b69,
  };
  return {
    ground: 0x111a32, route: 0x55c7ff, structure: 0x333652,
    shadow: 0x101427, trim: 0xd0ae71, glow: accent, warning: 0xffae53, leaf: 0x3b786f,
  };
}

function makeMaterials(p: Palette): Record<string, THREE.MeshStandardMaterial> {
  const material = (color: number, roughness = 0.82, emissive = 0): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12, emissive, emissiveIntensity: emissive ? 0.8 : 0 });
  return {
    ground: material(p.ground), route: material(p.route, 0.72, p.route),
    routeSpur: new THREE.MeshStandardMaterial({ color: p.route, emissive: p.route, emissiveIntensity: 0.18, transparent: true, opacity: 0.34, depthWrite: false, roughness: 0.8 }),
    structure: material(p.structure), shadow: material(p.shadow), trim: material(p.trim, 0.55),
    glow: material(p.glow, 0.48, p.glow), warning: material(p.warning, 0.45, p.warning),
    leaf: material(p.leaf, 0.9), white: material(0xe3edff, 0.65),
    red: material(0xd95050, 0.66), black: material(0x10151b, 0.75),
  };
}

function addGround(root: THREE.Group, layout: MiddleFloorLayout, mat: THREE.Material): void {
  const width = layout.bounds.maxX - layout.bounds.minX;
  const depth = layout.bounds.maxZ - layout.bounds.minZ;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  ground.name = "floor-ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((layout.bounds.minX + layout.bounds.maxX) / 2, -0.08, (layout.bounds.minZ + layout.bounds.maxZ) / 2);
  ground.receiveShadow = true;
  root.add(ground);
}

function addRouteRibbon(root: THREE.Group, layout: MiddleFloorLayout, primaryMat: THREE.Material, secondaryMat: THREE.Material): void {
  for (const [index, route] of layout.routes.entries()) {
    if (route.points.length < 2) continue;
    const half = route.width * 0.5;
    const vertices: number[] = [];
    for (let i = 0; i < route.points.length - 1; i += 1) {
      const a = route.points[i]!;
      const b = route.points[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.hypot(dx, dz) || 1;
      const ox = (-dz / length) * half;
      const oz = (dx / length) * half;
      const al = [a.x + ox, 0.015, a.z + oz];
      const ar = [a.x - ox, 0.015, a.z - oz];
      const bl = [b.x + ox, 0.015, b.z + oz];
      const br = [b.x - ox, 0.015, b.z - oz];
      vertices.push(...al, ...bl, ...ar, ...ar, ...bl, ...br);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    const ribbon = new THREE.Mesh(geometry, index === 0 ? primaryMat : secondaryMat);
    ribbon.name = `route:${route.id}`;
    root.add(ribbon);
  }
}

function addCollisionArchitecture(
  root: THREE.Group,
  layout: MiddleFloorLayout,
  mats: Record<string, THREE.MeshStandardMaterial>,
  p: Palette
): void {
  for (const [index, shape] of layout.collision.entries()) {
    if (shape.kind !== "rect") continue;
    const width = shape.width;
    const depth = shape.depth;
    const height = layout.floor === 4 ? 1.35 : layout.floor === 5 ? 2.2 : 2.8;
    const group = new THREE.Group();
    group.name = `collision-landmark:${index}`;
    group.position.set(shape.center.x, 0, shape.center.z);

    if (layout.floor === 4) {
      // Sparse NES data banks: hard-edged bars with one bright raster cap.
      const bar = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mats.structure);
      bar.position.y = height / 2;
      group.add(bar);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(width * 1.08, 0.12, depth * 1.08), mats.trim);
      cap.position.y = height + 0.04;
      group.add(cap);
      const slit = new THREE.Mesh(new THREE.BoxGeometry(Math.min(width, depth) * 0.24, height * 0.58, 0.04), mats.glow);
      slit.position.set(0, height * 0.58, depth / 2 + 0.025);
      group.add(slit);
    } else if (layout.floor === 5) {
      // Barrier collision is visible as a continuous waist-high shelf/planter.
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mats.structure);
      shelf.position.y = height / 2;
      group.add(shelf);
      const top = new THREE.Mesh(new THREE.BoxGeometry(width * 1.05, 0.14, depth * 1.05), mats.trim);
      top.position.y = height + 0.06;
      group.add(top);
      addBookSpines(group, width, depth, mats);
    } else {
      // Early-3D blockers read as stone observatory rails and faceted piers.
      const horizontal = width >= depth;
      const length = Math.max(width, depth);
      const pierCount = Math.max(2, Math.floor(length / 3));
      const rail = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? length : 0.42, 0.55, horizontal ? 0.42 : length), mats.structure);
      rail.position.y = 0.44;
      group.add(rail);
      for (let i = 0; i < pierCount; i += 1) {
        const t = pierCount === 1 ? 0.5 : i / (pierCount - 1);
        const along = (t - 0.5) * length;
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, height, 6), mats.structure);
        pier.position.set(horizontal ? along : 0, height / 2, horizontal ? 0 : along);
        group.add(pier);
      }
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? length : 0.6, 0.12, horizontal ? 0.6 : length), mats.trim);
      railTop.position.y = height + 0.04;
      group.add(railTop);
    }
    root.add(group);
  }
}

function addLandmarks(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  for (const landmark of layout.landmarks) {
    const group = new THREE.Group();
    group.name = `landmark:${landmark.id}`;
    group.position.set(landmark.position.x, 0, landmark.position.z);
    group.userData.role = landmark.role;
    group.userData.reach = landmark.reach;
    if (landmark.role === "exit") addExitLandmark(group, layout, mats, p);
    else if (landmark.role === "offer") addOfferLandmark(group, layout, mats, p);
    else if (landmark.role === "discovery") addDiscoveryLandmark(group, layout, mats, p);
    else addOrientationLandmark(group, layout, mats);
    root.add(group);
  }
}

function addOrientationLandmark(group: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>): void {
  const arrow = makeArrowGeometry(1.35, 1.9);
  const mesh = new THREE.Mesh(arrow, mats.route);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.04;
  group.add(mesh);
  if (layout.floor === 4) {
    for (let i = -1; i <= 1; i += 1) {
      const bit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), i === 0 ? mats.glow : mats.trim);
      bit.position.set(i * 0.42, 0.04, 0.9);
      group.add(bit);
    }
  } else if (layout.floor === 5) {
    const page = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.7), mats.trim);
    page.position.set(0, 0.1, 1.35);
    group.add(page);
  } else {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 5, 16), mats.trim);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);
  }
}

function addDiscoveryLandmark(group: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  if (layout.floor === 4) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.15, 0.24), mats.shadow);
    panel.position.y = 0.66;
    group.add(panel);
    for (let i = 0; i < 3; i += 1) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.1), i === 1 ? mats.warning : mats.glow);
      tile.position.set((i - 1) * 0.42, 0.72 + (i % 2) * 0.24, 0.18);
      group.add(tile);
    }
  } else if (layout.floor === 5) {
    addPageSprite(group, mats.trim, 0, 1.1, 0, 1.2, 1.65, -0.22);
    addPageSprite(group, mats.glow, 0.42, 0.9, 0.12, 0.75, 1.05, 0.12);
  } else {
    addPrism(group, mats.glow, 0, 1.25, 0, 0.82);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 5, 12), mats.trim);
    halo.position.y = 1.25;
    group.add(halo);
  }
}

function addOfferLandmark(group: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  const colors = [mats.glow, mats.trim, mats.warning];
  for (let i = 0; i < 3; i += 1) {
    const marker = new THREE.Group();
    marker.position.set((i - 1) * 1.3, 0, 0);
    if (layout.floor === 4) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.35, 0.18), mats.structure);
      frame.position.y = 0.68;
      marker.add(frame);
      const inset = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.08), colors[i]!);
      inset.position.set(0, 0.72, 0.13);
      marker.add(inset);
    } else if (layout.floor === 5) {
      addPageSprite(marker, colors[i]!, 0, 1.15, 0, 0.78, 1.1, (i - 1) * 0.12);
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 4), mats.white);
      pin.position.set(0, 1.75, 0);
      marker.add(pin);
    } else {
      addPrism(marker, colors[i]!, 0, 1.1 + (i === 1 ? 0.25 : 0), 0, 0.55);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 5, 10), mats.trim);
      ring.position.y = 1.1;
      marker.add(ring);
    }
    group.add(marker);
  }
}

function addExitLandmark(group: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  if (layout.floor === 4) {
    const sideGeometry = new THREE.BoxGeometry(0.5, 3.3, 0.65);
    for (const x of [-2.2, 2.2]) {
      const pier = new THREE.Mesh(sideGeometry, mats.structure);
      pier.position.set(x, 1.65, 0);
      group.add(pier);
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.65, 0.08), mats.warning);
      light.position.set(x, 1.7, 0.36);
      group.add(light);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5, 0.48, 0.6), mats.trim);
    lintel.position.y = 3.2;
    group.add(lintel);
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.06, 1.7), mats.glow);
    threshold.position.set(0, 0.05, 0.5);
    group.add(threshold);
  } else if (layout.floor === 5) {
    const frame = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.22, 6, 14), mats.trim);
    frame.position.y = 1.6;
    group.add(frame);
    const center = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.1), mats.glow);
    center.position.set(0, 1.58, 0.04);
    group.add(center);
    addArchiveBanner(group, mats, 0, 4.1, -0.2, 2.2, 1.05);
  } else {
    for (const x of [-2.2, 2.2]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.58, 3.5, 6), mats.structure);
      pier.position.set(x, 1.75, 0);
      group.add(pier);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.28, 6, 12, Math.PI), mats.trim);
    arch.position.set(0, 1.72, 0);
    group.add(arch);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 1.8), mats.glow);
    strip.position.set(0, 0.07, 0.45);
    group.add(strip);
  }
}

function addEraSetDressing(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  if (layout.floor === 4) {
    // Late-NES vault: a finite, low-contrast tile grid beneath the route art.
    addVaultTileField(root, layout);
    addEchoPlinths(root, layout, mats);
  } else if (layout.floor === 5) {
    // 16-bit archive: repeated sprite-front shelves, simple signage and two
    // reduced shelf silhouettes set behind the traversable route.
    const shelfFaceMaterials = Array.from({ length: 4 }, (_, variant) => makeArchiveShelfMaterial(variant));
    const shelfFaceGeometry = new THREE.PlaneGeometry(2.7, 4.2);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i += 1) {
        const shelf = new THREE.Group();
        shelf.position.set(side * (17 + (i % 2)), 0, 15 - i * 9);
        addArchiveShelfFront(shelf, shelfFaceGeometry, shelfFaceMaterials[i % shelfFaceMaterials.length]!, 4.2);
        if (i === 0) addArchiveBanner(shelf, mats, 0, 4.55, 0.42, 1.8, 0.92);
        if (i === 2) addArchiveLamp(shelf, mats, side * -1.12, 2.95, 0.5);
        root.add(shelf);
      }
    }
    addArchiveShelfSilhouettes(root, layout);
    for (let i = 0; i < 8; i += 1) {
      const sprite = new THREE.Group();
      sprite.position.set(-15 + ((i * 5) % 30), 1.2 + (i % 3) * 0.48, 12 - ((i * 7) % 25));
      addPageSprite(sprite, i % 3 ? mats.trim : mats.warning, 0, 0, 0, 0.42 + (i % 2) * 0.22, 0.72, (i % 4) * 0.11);
      sprite.name = `archive-index-sprite:${i}`;
      root.add(sprite);
    }
  } else {
    // Early PS1 observatory: perspective hoops and distant orbital fragments.
    for (const z of [-17, -7, 4, 15]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(12 + (z % 3), 0.18, 5, 18, Math.PI), mats.structure);
      arch.position.set(0, 4.3 + (z % 2) * 0.4, z);
      root.add(arch);
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), mats.glow);
      marker.position.set(z % 2 ? -15 : 15, 2.8, z);
      root.add(marker);
    }
    const dial = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.08, 5, 18), mats.trim);
    dial.position.set(-15, 0.08, 4);
    dial.rotation.x = Math.PI / 2;
    root.add(dial);
    const innerDial = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.06, 5, 14), mats.glow);
    innerDial.position.set(-15, 0.09, 4);
    innerDial.rotation.x = Math.PI / 2;
    root.add(innerDial);
    for (let i = 0; i < 9; i += 1) {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.32 + (i % 3) * 0.12, 0), i % 2 ? mats.trim : mats.glow);
      shard.position.set(-18 + ((i * 9) % 36), 3.2 + (i % 3), -15 + ((i * 11) % 30));
      root.add(shard);
    }
  }
}

/** Small 16-bit façade module shared by the archive's repeated shelves. */
function addArchiveShelfFront(group: THREE.Group, geometry: THREE.PlaneGeometry, material: THREE.MeshBasicMaterial, height: number): void {
  const face = new THREE.Mesh(geometry, material);
  face.position.set(0, height / 2, 0.34);
  face.name = "archive-sprite-front";
  group.add(face);
}

function makeArchiveShelfMaterial(variant: number): THREE.MeshBasicMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable for Floor 5 archive art");
  const palettes = [
    ["#302735", "#725037", "#db9650", "#3ca59a"],
    ["#302735", "#68423b", "#d6a05b", "#5576c2"],
    ["#302735", "#604a3f", "#c77b57", "#61a66d"],
    ["#302735", "#74513e", "#e1ae59", "#8b67bd"],
  ][variant % 4]!;
  ctx.fillStyle = palettes[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rowHeight = 47;
  for (let row = 0; row < 4; row += 1) {
    const top = row * rowHeight;
    ctx.fillStyle = row % 2 ? "#604735" : "#795638";
    ctx.fillRect(0, top + 38, 128, 8);
    for (let i = 0; i < 10; i += 1) {
      const x = 5 + i * 12;
      const bookHeight = 22 + ((i + row + variant) % 3) * 5;
      ctx.fillStyle = (i + row + variant) % 5 === 0 ? palettes[2] : palettes[3];
      ctx.fillRect(x, top + 36 - bookHeight, 8, bookHeight);
      ctx.fillStyle = palettes[1];
      ctx.fillRect(x + 1, top + 36 - bookHeight, 1, bookHeight);
      if ((i + row) % 3 === 0) {
        ctx.fillStyle = "#eed39a";
        ctx.fillRect(x + 2, top + 25, 4, 2);
      }
    }
    ctx.fillStyle = "#d3975a";
    ctx.fillRect(0, top, 128, 2);
  }
  return makePixelMaterial(canvas);
}

function makeArchiveSilhouetteMaterial(): THREE.MeshBasicMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable for Floor 5 archive silhouette");
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = "#142529";
  ctx.fillRect(0, 45, 256, 7);
  for (let i = 0; i < 22; i += 1) {
    const h = 19 + (i % 4) * 6;
    ctx.fillStyle = i % 4 === 0 ? "#183338" : "#142529";
    ctx.fillRect(i * 12, 45 - h, 9, h);
  }
  return makePixelMaterial(canvas, true);
}

function makePixelMaterial(canvas: HTMLCanvasElement, transparent = false): THREE.MeshBasicMaterial {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent, opacity: transparent ? 0.82 : 1, depthWrite: !transparent, side: THREE.DoubleSide });
}

function addArchiveBanner(group: THREE.Group, mats: Record<string, THREE.MeshStandardMaterial>, x: number, y: number, z: number, width: number, height: number): void {
  const pole = new THREE.Mesh(new THREE.BoxGeometry(width + 0.28, 0.12, 0.12), mats.trim);
  pole.position.set(x, y + height / 2 + 0.1, z);
  group.add(pole);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.08), mats.structure);
  cloth.position.set(x, y, z + 0.04);
  group.add(cloth);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.32, height * 0.42, 0.06), mats.warning);
  mark.position.set(x, y + 0.04, z + 0.095);
  group.add(mark);
  const hem = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.1, 0.07), mats.trim);
  hem.position.set(x, y - height / 2 + 0.14, z + 0.095);
  group.add(hem);
}

function addArchiveLamp(group: THREE.Group, mats: Record<string, THREE.MeshStandardMaterial>, x: number, y: number, z: number): void {
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.16), mats.trim);
  mount.position.set(x, y + 0.5, z);
  group.add(mount);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.4), mats.structure);
  hood.position.set(x, y + 0.22, z + 0.1);
  group.add(hood);
  const light = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.24), mats.warning);
  light.position.set(x, y - 0.04, z + 0.12);
  group.add(light);
  const pixel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.08), mats.white);
  pixel.position.set(x, y - 0.04, z + 0.26);
  group.add(pixel);
}

function addArchiveShelfSilhouettes(root: THREE.Group, layout: MiddleFloorLayout): void {
  const width = layout.bounds.maxX - layout.bounds.minX;
  const centerX = (layout.bounds.maxX + layout.bounds.minX) / 2;
  const backZ = layout.bounds.minZ + 0.18;
  const span = Math.min(width * 0.92, 42);
  const geometry = new THREE.PlaneGeometry(span, 1.6);
  const material = makeArchiveSilhouetteMaterial();
  for (let layer = 0; layer < 2; layer += 1) {
    const group = new THREE.Group();
    group.name = `archive-shelf-silhouette:${layer}`;
    group.position.set(centerX + (layer ? 0.65 : -0.45), 0, backZ + layer * 0.42);
    const shelfY = layer ? 4.2 : 2.45;
    const silhouette = new THREE.Mesh(geometry, material);
    silhouette.position.set(0, shelfY + 0.8, 0);
    group.add(silhouette);
    root.add(group);
  }
}

function addVaultTileField(root: THREE.Group, layout: MiddleFloorLayout): void {
  const { minX, maxX, minZ, maxZ } = layout.bounds;
  const tileSize = 1.42;
  const pitch = 1.62;
  const columns = Math.max(1, Math.ceil((maxX - minX) / pitch));
  const rows = Math.max(1, Math.ceil((maxZ - minZ) / pitch));
  const geometry = new THREE.BoxGeometry(tileSize, 0.026, tileSize);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0 });
  const tiles = new THREE.InstancedMesh(geometry, material, columns * rows);
  tiles.name = "echo-vault-repeat-tile-field";
  tiles.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy = new THREE.Object3D();
  const colorA = new THREE.Color(0x122b42);
  const colorB = new THREE.Color(0x0d2135);
  let index = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = minX + pitch * (column + 0.5);
      const z = minZ + pitch * (row + 0.5);
      // Keep each tile fully inside the finite room bounds.
      if (x + tileSize * 0.5 > maxX || z + tileSize * 0.5 > maxZ) continue;
      dummy.position.set(x, -0.047, z);
      dummy.updateMatrix();
      tiles.setMatrixAt(index, dummy.matrix);
      tiles.setColorAt(index, (row + column) % 2 ? colorA : colorB);
      index += 1;
    }
  }
  tiles.count = index;
  tiles.instanceMatrix.needsUpdate = true;
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  root.add(tiles);
}

function addEchoPlinths(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>): void {
  const form = makeEchoPlinth(mats);
  const { minX, maxX, minZ, maxZ } = layout.bounds;
  const candidates = [
    { x: minX + 2.4, z: minZ + 2.4 }, { x: maxX - 2.4, z: minZ + 2.4 },
    { x: minX + 2.4, z: maxZ - 2.4 }, { x: maxX - 2.4, z: maxZ - 2.4 },
  ];
  let index = 0;
  for (const point of candidates) {
    if (point.x < minX + 0.65 || point.x > maxX - 0.65 || point.z < minZ + 0.65 || point.z > maxZ - 0.65) continue;
    const overlapsEnemy = layout.encounter.enemies.some((enemy) => Math.hypot(point.x - enemy.spawn.x, point.z - enemy.spawn.z) < 2.4);
    if (overlapsEnemy || isNearVaultRoute(point, layout, 2.4) || isInsideCollision(point, layout, 1.25)) continue;
    const plinth = form.clone(true);
    plinth.position.set(point.x, 0, point.z);
    plinth.name = `echo-plinth:${index++}`;
    root.add(plinth);
  }
}

function makeEchoPlinth(mats: Record<string, THREE.MeshStandardMaterial>): THREE.Group {
  const plinth = new THREE.Group();
  plinth.name = "echo-plinth-form";
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 1.05), mats.structure);
  base.position.y = 0.12;
  plinth.add(base);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.76), mats.shadow);
  inset.position.y = 0.28;
  plinth.add(inset);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.09, 0.58), mats.trim);
  cap.position.y = 0.37;
  plinth.add(cap);
  // Flat pixel glyph gives the repeatable prop a distinct echo read at distance.
  for (const [x, y, width] of [[-0.2, 0.7, 0.2], [0, 0.82, 0.2], [0.2, 0.7, 0.2]] as const) {
    const pixel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.06), mats.glow);
    pixel.position.set(x, y, -0.12);
    plinth.add(pixel);
  }
  return plinth;
}

function isNearVaultRoute(point: FloorPoint, layout: MiddleFloorLayout, clearance: number): boolean {
  for (const route of layout.routes) {
    for (let i = 0; i < route.points.length - 1; i += 1) {
      const a = route.points[i]!;
      const b = route.points[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const lengthSq = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSq));
      const distance = Math.hypot(point.x - (a.x + t * dx), point.z - (a.z + t * dz));
      if (distance < clearance + route.width * 0.5) return true;
    }
  }
  return false;
}

function isInsideCollision(point: FloorPoint, layout: MiddleFloorLayout, clearance: number): boolean {
  return layout.collision.some((shape) => shape.kind === "rect" &&
    Math.abs(point.x - shape.center.x) < shape.width * 0.5 + clearance &&
    Math.abs(point.z - shape.center.z) < shape.depth * 0.5 + clearance);
}

function addEncounterFigures(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, p: Palette): void {
  for (const enemy of layout.encounter.enemies) {
    const group = new THREE.Group();
    group.name = `enemy-art:${enemy.id}`;
    group.userData.enemyId = enemy.id;
    group.userData.role = enemy.role;
    group.position.set(enemy.spawn.x, 0, enemy.spawn.z);
    if (layout.floor === 4) addVaultSentinel(group, mats);
    else if (layout.floor === 5) addLibraryEnemy(group, enemy, mats);
    else addObservatoryEnemy(group, enemy, mats);
    root.add(group);
  }
}

function addEncounterRecoveryZones(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>): void {
  if (layout.floor !== 6) return;
  for (const [index, zone] of layout.encounter.arena.recoveryZones.entries()) {
    const marker = new THREE.Group();
    marker.name = `recovery-zone:${layout.encounter.id}:${index}`;
    marker.position.set(zone.center.x, 0, zone.center.z);
    marker.userData.radius = zone.radius;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(zone.radius, 0.045, 5, 16, Math.PI * 1.6), mats.route);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.045;
    marker.add(ring);
    for (let i = 0; i < 3; i += 1) {
      const markerTile = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.28), mats.trim);
      const angle = (i / 3) * Math.PI * 2 + 0.3;
      markerTile.position.set(Math.cos(angle) * zone.radius * 0.72, 0.03, Math.sin(angle) * zone.radius * 0.72);
      marker.add(markerTile);
    }
    root.add(marker);
  }
}

function addVaultSentinel(group: THREE.Group, mats: Record<string, THREE.MeshStandardMaterial>): void {
  // Articulated, low-slung prism crawler. No cube body; the faceted silhouette
  // echoes the crab-like sentinel in the approved Echo Vault study.
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), mats.black);
  body.scale.set(1.05, 0.66, 0.85);
  body.position.y = 0.95;
  group.add(body);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), mats.warning);
  core.position.set(0, 1.02, -0.55);
  group.add(core);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.04), mats.white);
  eye.position.set(0, 1.18, -0.78);
  group.add(eye);
  for (let i = 0; i < 4; i += 1) {
    const side = i < 2 ? -1 : 1;
    const fore = i % 2 === 0 ? -1 : 1;
    addLimb(group, { x: side * 0.54, z: fore * 0.28 }, { x: side * 1.04, z: fore * 0.68 }, mats.black, mats.warning, 0.12);
  }
  const chargeBlade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 4), mats.warning);
  chargeBlade.rotation.x = Math.PI / 2;
  chargeBlade.position.set(0, 0.62, -0.95);
  group.add(chargeBlade);
}

function addLibraryEnemy(group: THREE.Group, enemy: EncounterEnemy, mats: Record<string, THREE.MeshStandardMaterial>): void {
  if (enemy.role === "charger") {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 5), mats.leaf);
    shell.scale.set(1.05, 0.68, 1.25);
    shell.position.y = 0.9;
    group.add(shell);
    const cover = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.75, 5), mats.trim);
    cover.rotation.x = Math.PI / 2;
    cover.position.set(0, 0.8, -0.7);
    group.add(cover);
    for (let i = 0; i < 6; i += 1) {
      const side = i < 3 ? -1 : 1;
      const z = -0.48 + (i % 3) * 0.48;
      addLimb(group, { x: side * 0.42, z }, { x: side * 0.86, z: z + 0.22 }, mats.black, mats.warning, 0.1);
    }
    const spine = new THREE.Mesh(new THREE.OctahedronGeometry(0.19, 0), mats.warning);
    spine.position.set(0, 1.34, 0.18);
    group.add(spine);
  } else {
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 1), mats.shadow);
    orb.scale.set(0.74, 1.15, 0.35);
    orb.position.y = 1.2;
    group.add(orb);
    addPageSprite(group, mats.warning, 0, 1.2, 0.08, 0.58, 0.9, 0);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.045, 4, 12), mats.glow);
    halo.position.y = 1.2;
    halo.rotation.x = 0.65;
    group.add(halo);
    for (const x of [-0.78, 0.78]) {
      const pageWing = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.9), mats.trim);
      pageWing.position.set(x, 1.15, 0.05);
      pageWing.rotation.y = x < 0 ? -0.48 : 0.48;
      group.add(pageWing);
    }
  }
}

function addObservatoryEnemy(group: THREE.Group, enemy: EncounterEnemy, mats: Record<string, THREE.MeshStandardMaterial>): void {
  if (enemy.role === "charger") {
    const shell = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 0), mats.structure);
    shell.scale.set(1.05, 0.7, 0.95);
    shell.position.y = 1.02;
    group.add(shell);
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.72, 5), mats.warning);
    brow.rotation.x = Math.PI / 2;
    brow.position.set(0, 1.02, -0.74);
    group.add(brow);
    for (let i = 0; i < 4; i += 1) {
      const side = i < 2 ? -1 : 1;
      const fore = i % 2 === 0 ? -1 : 1;
      addLimb(group, { x: side * 0.5, z: fore * 0.3 }, { x: side * 0.88, z: fore * 0.66 }, mats.shadow, mats.trim, 0.14);
    }
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.08), mats.glow);
    marker.position.set(0, 1.42, -0.4);
    group.add(marker);
  } else {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.73, 0), mats.glow);
    crystal.scale.set(0.68, 1.32, 0.68);
    crystal.position.y = 1.25;
    group.add(crystal);
    const rings = [0.85, 1.12].map((radius, index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 5, 12), index ? mats.trim : mats.warning);
      ring.position.y = 1.2;
      ring.rotation.x = index ? 1.05 : 0.55;
      ring.rotation.z = index ? -0.4 : 0.4;
      group.add(ring);
      return ring;
    });
    void rings;
    for (const x of [-1.05, 1.05]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.68, 4), mats.structure);
      fin.position.set(x, 0.75, 0);
      fin.rotation.z = x < 0 ? 0.8 : -0.8;
      group.add(fin);
    }
  }
}

function addEffectSockets(root: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>, telegraphAimers: Map<string, (target: FloorPoint) => void>): void {
  for (const cue of layout.effects) {
    const socket = new THREE.Group();
    socket.name = `effect:${cue.id}`;
    socket.userData.cueId = cue.id;
    socket.userData.trigger = cue.trigger;
    socket.userData.activationOwner = "scene-root";
    socket.visible = false;

    if (cue.trigger === "enemy-telegraph") {
      const enemy = layout.encounter.enemies.find((candidate) => candidate.id === cue.enemyId);
      if (enemy) telegraphAimers.set(enemy.id, addTelegraph(socket, enemy, mats));
    } else if (cue.trigger === "encounter-resolved") {
      addOutcomeSocket(socket, layout, mats);
    }
    root.add(socket);
  }
}

function addTelegraph(socket: THREE.Group, enemy: EncounterEnemy, mats: Record<string, THREE.MeshStandardMaterial>): (target: FloorPoint) => void {
  if (enemy.role === "ranged") {
    const targetGroup = new THREE.Group();
    targetGroup.name = `telegraph-target:${enemy.id}`;
    const tile = new THREE.Mesh(new THREE.CircleGeometry(0.82, 4), mats.warning);
    tile.rotation.x = -Math.PI / 2;
    tile.position.y = 0.035;
    targetGroup.add(tile);
    const inner = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.08, 4), mats.glow);
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.045;
    targetGroup.add(inner);
    socket.add(targetGroup);
    socket.userData.targetGroup = targetGroup.name;
    return (target: FloorPoint): void => { targetGroup.position.set(target.x, 0, target.z); };
  } else {
    const length = Math.min(enemy.attackRange + 1.5, 4.5);
    const laneGroup = new THREE.Group();
    laneGroup.name = `telegraph-target:${enemy.id}`;
    laneGroup.position.set(enemy.spawn.x, 0, enemy.spawn.z);
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, length), mats.warning);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.025, -length / 2);
    laneGroup.add(lane);
    const arrow = new THREE.Mesh(makeArrowGeometry(0.82, 1.12), mats.glow);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(0, 0.04, -length * 0.73);
    laneGroup.add(arrow);
    socket.add(laneGroup);
    socket.userData.targetGroup = laneGroup.name;
    return (target: FloorPoint): void => {
      const dx = target.x - enemy.spawn.x;
      const dz = target.z - enemy.spawn.z;
      if (Math.hypot(dx, dz) < 0.001) return;
      laneGroup.rotation.y = Math.atan2(-dx, -dz);
    };
  }
}

function addOutcomeSocket(socket: THREE.Group, layout: MiddleFloorLayout, mats: Record<string, THREE.MeshStandardMaterial>): void {
  const exit = layout.exit;
  socket.position.set(exit.x, 0, exit.z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.075, 5, 14), mats.glow);
  ring.position.y = 0.12;
  ring.rotation.x = Math.PI / 2;
  socket.add(ring);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), mats.warning);
  marker.position.y = 1.1;
  socket.add(marker);
}

function addBookSpines(group: THREE.Group, width: number, depth: number, mats: Record<string, THREE.MeshStandardMaterial>): void {
  const horizontal = width >= depth;
  const length = horizontal ? width : depth;
  const count = Math.max(2, Math.floor(length / 1.4));
  for (let i = 0; i < count; i += 1) {
    const spine = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 0.18 : 0.3, 0.72, horizontal ? 0.3 : 0.18), i % 2 ? mats.trim : mats.glow);
    const along = (i / Math.max(count - 1, 1) - 0.5) * length * 0.82;
    spine.position.set(horizontal ? along : 0, 1.62 + (i % 2) * 0.18, horizontal ? 0 : along);
    group.add(spine);
  }
}

function addLeafCluster(
  group: THREE.Group,
  width: number,
  depth: number,
  _leafColor: number,
  count: number,
  mat: THREE.Material,
  centerX = 0,
  y = 0.65,
  centerZ = 0
): void {
  for (let i = 0; i < count; i += 1) {
    const leaf = new THREE.Mesh(makeLeafGeometry(), mat);
    leaf.position.set(centerX + (((i * 7) % 11) / 10 - 0.5) * width, y + (i % 3) * 0.13, centerZ + (((i * 5) % 9) / 8 - 0.5) * depth);
    leaf.rotation.set((i % 2) * 0.18, (i * 0.73) % (Math.PI * 2), ((i % 3) - 1) * 0.34);
    leaf.scale.set(0.72 + (i % 2) * 0.26, 0.95, 0.55);
    group.add(leaf);
  }
}

function addPageSprite(group: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, width: number, height: number, rotation: number): void {
  const page = new THREE.Mesh(new THREE.ShapeGeometry(makePageShape(width, height)), mat);
  page.position.set(x, y, z);
  page.rotation.y = rotation;
  group.add(page);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.62, 0.055), mat);
  band.position.set(x, y, z + 0.012);
  band.rotation.y = rotation;
  group.add(band);
}

function addPrism(group: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, scale: number): void {
  const prism = new THREE.Mesh(new THREE.OctahedronGeometry(scale, 0), mat);
  prism.position.set(x, y, z);
  group.add(prism);
  const lower = new THREE.Mesh(new THREE.TetrahedronGeometry(scale * 0.42, 0), mat);
  lower.position.set(x, y - scale * 0.82, z);
  group.add(lower);
}

function addLimb(group: THREE.Group, from: FloorPoint, to: FloorPoint, upperMaterial: THREE.Material, footMaterial: THREE.Material, radius: number): void {
  const start = new THREE.Vector3(from.x, 0.86, from.z);
  const end = new THREE.Vector3(to.x, 0.12, to.z);
  addCylinderBetween(group, start, end, radius, upperMaterial, 5);
  const foot = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.2, 0.3, 4), footMaterial);
  foot.position.copy(end);
  foot.rotation.x = Math.PI / 2;
  group.add(foot);
}

function addCylinderBetween(group: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material, segments = 6): void {
  const delta = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.7, radius, delta.length(), segments), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  group.add(mesh);
}

function makeArrowGeometry(width: number, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.27, -length * 0.5);
  shape.lineTo(width * 0.27, -length * 0.5);
  shape.lineTo(width * 0.27, length * 0.03);
  shape.lineTo(width * 0.5, length * 0.03);
  shape.lineTo(0, length * 0.5);
  shape.lineTo(-width * 0.5, length * 0.03);
  shape.lineTo(-width * 0.27, length * 0.03);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function makeLeafGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.6);
  shape.quadraticCurveTo(0.52, -0.22, 0, 0.7);
  shape.quadraticCurveTo(-0.5, -0.2, 0, -0.6);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function makePageShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2 - height * 0.12);
  shape.lineTo(width * 0.28, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  return shape;
}

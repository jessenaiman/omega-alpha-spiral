import * as THREE from "three";
import type { Floor7Town, LateFloorPoint, TownRoute } from "./late-floor-7-town";

export interface TownStreetscapeResult {
  group: THREE.Group;
  dispose(): void;
}

type TownMaterials = {
  bed: THREE.MeshStandardMaterial;
  paving: THREE.MeshStandardMaterial;
  route: THREE.MeshBasicMaterial;
  routeSecondary: THREE.MeshBasicMaterial;
  stone: THREE.MeshStandardMaterial;
  darkStone: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  roofBlue: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  windowGlow: THREE.MeshBasicMaterial;
  leaf: THREE.MeshStandardMaterial;
  leafLight: THREE.MeshStandardMaterial;
  flower: THREE.MeshStandardMaterial;
  canvasRed: THREE.MeshStandardMaterial;
  canvasGold: THREE.MeshStandardMaterial;
  lantern: THREE.MeshBasicMaterial;
};

type FacadeStyle = "gable" | "roundhouse" | "market" | "tower" | "root-cottage";

const EDGE_CANDIDATES: readonly { x: number; z: number; style: FacadeStyle; scale: number }[] = [
  { x: -21.5, z: 18, style: "gable", scale: 0.88 },
  { x: 21.5, z: 18, style: "roundhouse", scale: 0.82 },
  { x: -24, z: 2, style: "tower", scale: 0.92 },
  { x: 24, z: 3, style: "market", scale: 0.82 },
  { x: -23.6, z: -16.8, style: "root-cottage", scale: 0.88 },
  { x: 23.8, z: -15.8, style: "gable", scale: 0.82 },
  { x: -11, z: 19, style: "market", scale: 0.78 },
  { x: 11, z: 19, style: "gable", scale: 0.8 },
];

/** Add visual paving, route traces, and decorative street depth only. */
export function createTownStreetscape(data: Floor7Town): TownStreetscapeResult {
  const resources = ownResources();
  const group = new THREE.Group();
  group.name = "floor-7-town-streetscape";
  const mats = makeTownMaterials(resources);

  addPavedGround(group, data, mats, resources);
  addPlazaMosaic(group, data, mats, resources);
  addTownRoutes(group, data, mats, resources);
  addPerimeterFacades(group, data, mats, resources);
  addStreetGreenery(group, data, mats, resources);
  addStreetFixtures(group, data, mats, resources);

  return { group, dispose: resources.dispose };
}

function ownResources() {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  return {
    geometry<T extends THREE.BufferGeometry>(geometry: T): T { geometries.add(geometry); return geometry; },
    material<T extends THREE.Material>(material: T): T { materials.add(material); return material; },
    texture<T extends THREE.Texture>(texture: T): T { textures.add(texture); return texture; },
    dispose(): void {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      geometries.clear();
      materials.clear();
      textures.clear();
    },
  };
}

function makeTownMaterials(owner: ReturnType<typeof ownResources>): TownMaterials {
  const standard = (color: number, roughness = 0.88, metalness = 0): THREE.MeshStandardMaterial =>
    owner.material(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  return {
    bed: standard(0x343744, 1),
    paving: owner.material(new THREE.MeshStandardMaterial({ map: createPavingTexture(owner), color: 0xffffff, roughness: 0.96, metalness: 0 })),
    route: owner.material(new THREE.MeshBasicMaterial({ color: 0x66d8ed, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide })),
    routeSecondary: owner.material(new THREE.MeshBasicMaterial({ color: 0x5ec5df, transparent: true, opacity: 0.17, depthWrite: false, side: THREE.DoubleSide })),
    stone: standard(0x85828a),
    darkStone: standard(0x444654),
    timber: standard(0x4d332a),
    plaster: standard(0xb9a17d),
    roof: standard(0x323b54),
    roofBlue: standard(0x3d5575),
    glass: standard(0x403b40, 0.35, 0.1),
    windowGlow: owner.material(new THREE.MeshBasicMaterial({ color: 0xffc66c })),
    leaf: standard(0x285845),
    leafLight: standard(0x5d8856),
    flower: standard(0xd96961, 0.75),
    canvasRed: standard(0x9f4344, 0.92),
    canvasGold: standard(0xe2c68e, 0.92),
    lantern: owner.material(new THREE.MeshBasicMaterial({ color: 0xffb85c })),
  };
}

function addPavedGround(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  const width = data.bounds.width;
  const depth = data.bounds.depth;
  const bed = mesh(owner, new THREE.PlaneGeometry(width, depth), mats.bed, "town-stone-bed");
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(data.bounds.x, -0.17, data.bounds.z);
  group.add(bed);

  // One flush surface carries three era-specific districts; no raised cobbles interrupt navigation.
  const paving = mesh(owner, new THREE.PlaneGeometry(width, depth), mats.paving, "town-era-paving");
  paving.rotation.x = -Math.PI / 2;
  // Shared chapter slab ends at y=-0.05; this texture sits just above it.
  paving.position.set(data.bounds.x, 0.003, data.bounds.z);
  paving.receiveShadow = true;
  group.add(paving);

  // A thin floor-level outline finishes the town edge without forming a curb or obstacle.
  const x0 = data.bounds.x - width / 2 + 0.35;
  const x1 = data.bounds.x + width / 2 - 0.35;
  const z0 = data.bounds.z - depth / 2 + 0.35;
  const z1 = data.bounds.z + depth / 2 - 0.35;
  const border = new THREE.BufferGeometry();
  border.setFromPoints([
    new THREE.Vector3(x0, 0.006, z0), new THREE.Vector3(x1, 0.006, z0),
    new THREE.Vector3(x1, 0.006, z0), new THREE.Vector3(x1, 0.006, z1),
    new THREE.Vector3(x1, 0.006, z1), new THREE.Vector3(x0, 0.006, z1),
    new THREE.Vector3(x0, 0.006, z1), new THREE.Vector3(x0, 0.006, z0),
  ]);
  owner.geometry(border);
  const outline = new THREE.LineSegments(border, owner.material(new THREE.LineBasicMaterial({ color: 0x77737d, transparent: true, opacity: 0.38 })));
  outline.name = "town-flat-perimeter-outline";
  group.add(outline);
}

function createPavingTexture(owner: ReturnType<typeof ownResources>): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Town paving texture requires a 2D canvas context.");

  // The western quarter reads as crisp 8-bit paving, the middle as a warm 16-bit plaza district,
  // and the eastern half as early-3D triangular stone. All motifs stay in the floor UVs.
  context.fillStyle = "#383b4a";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const splitA = 250;
  const splitB = 510;
  context.fillStyle = "#414961";
  context.fillRect(0, 0, splitA, canvas.height);
  context.fillStyle = "#514d55";
  context.fillRect(splitA, 0, splitB - splitA, canvas.height);
  context.fillStyle = "#343b4e";
  context.fillRect(splitB, 0, canvas.width - splitB, canvas.height);

  // 8-bit ward: orthogonal, offset tile courses with pixel-scale chips.
  for (let row = 0; row < 16; row += 1) {
    const y = row * 32;
    context.strokeStyle = row % 2 ? "#626982" : "#555f79";
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(0, y); context.lineTo(splitA, y); context.stroke();
    for (let column = 0; column < 8; column += 1) {
      const x = column * 32 + (row % 2) * 16;
      if (x > splitA) continue;
      context.strokeStyle = "#59637c";
      context.beginPath(); context.moveTo(x, y); context.lineTo(x, y + 32); context.stroke();
      context.fillStyle = (row + column) % 3 ? "rgba(170,190,219,.08)" : "rgba(20,25,40,.12)";
      context.fillRect(x + 5, y + 6, 7, 4);
      context.fillRect(x + 20, y + 21, 4, 5);
    }
  }

  // 16-bit ward: interlocking diamonds and small warm highlights around the plaza section.
  context.save();
  context.beginPath(); context.rect(splitA, 0, splitB - splitA, canvas.height); context.clip();
  for (let row = -1; row < 18; row += 1) {
    for (let column = -1; column < 10; column += 1) {
      const x = splitA + column * 32 + (row % 2) * 16;
      const y = row * 32;
      context.beginPath();
      context.moveTo(x + 16, y + 3); context.lineTo(x + 29, y + 16);
      context.lineTo(x + 16, y + 29); context.lineTo(x + 3, y + 16); context.closePath();
      context.fillStyle = (row + column) % 4 === 0 ? "rgba(225,190,127,.17)" : "rgba(206,171,138,.07)";
      context.fill();
      context.strokeStyle = "rgba(218,193,157,.12)"; context.lineWidth = 1; context.stroke();
    }
  }
  context.restore();

  // Early-3D ward: faceted triangular courses with alternating low-poly slate tones.
  context.save();
  context.beginPath(); context.rect(splitB, 0, canvas.width - splitB, canvas.height); context.clip();
  for (let row = -1; row < 18; row += 1) {
    for (let column = -1; column < 10; column += 1) {
      const x = splitB + column * 30 + (row % 2) * 15;
      const y = row * 30;
      context.beginPath(); context.moveTo(x, y); context.lineTo(x + 30, y + 5); context.lineTo(x + 8, y + 30); context.closePath();
      context.fillStyle = (row * 3 + column) % 2 ? "rgba(136,157,188,.11)" : "rgba(151,127,163,.1)";
      context.fill();
      context.beginPath(); context.moveTo(x + 30, y + 5); context.lineTo(x + 30, y + 30); context.lineTo(x + 8, y + 30); context.closePath();
      context.fillStyle = (row + column) % 3 ? "rgba(20,28,44,.12)" : "rgba(164,181,198,.09)";
      context.fill();
    }
  }
  context.restore();

  // The two neighborhood seams stay subtle, acting as district changes rather than route marks.
  context.fillStyle = "rgba(214,194,154,.18)";
  context.fillRect(splitA - 1, 0, 2, canvas.height);
  context.fillRect(splitB - 1, 0, 2, canvas.height);

  const texture = owner.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function addPlazaMosaic(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  const plaza = data.landmarks.find((landmark) => landmark.kind === "plaza");
  if (!plaza) return;
  const disk = mesh(owner, new THREE.CircleGeometry(7.7, 40), mats.stone, "town-plaza-cobble-medallion");
  disk.rotation.x = -Math.PI / 2;
    disk.position.set(plaza.position.x, 0.052, plaza.position.z);
  group.add(disk);
  for (const radius of [4.4, 6.9]) {
    const ring = mesh(owner, new THREE.TorusGeometry(radius, 0.08, 5, 40), mats.darkStone, "plaza-ring-course");
    ring.rotation.x = Math.PI / 2;
    ring.position.set(plaza.position.x, 0.075, plaza.position.z);
    group.add(ring);
  }
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const tile = mesh(owner, new THREE.ShapeGeometry(diamondShape(0.42)), i % 2 ? mats.darkStone : mats.plaster, "plaza-compass-inlay");
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(plaza.position.x + Math.cos(angle) * 5.55, 0.08, plaza.position.z + Math.sin(angle) * 5.55);
    tile.rotation.y = angle;
    group.add(tile);
  }
}

function addTownRoutes(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  for (const route of data.routes) {
    const points = [route.from, ...route.waypoints, route.to];
    const primary = route.id === "boulevard";
    const strip = townRouteGeometry(points, route.width);
    const routeMesh = mesh(owner, strip, primary ? mats.route : mats.routeSecondary, `town-route:${route.id}`);
    routeMesh.position.y = 0.06;
    group.add(routeMesh);

    // Small etched wayfinding marks, centered on segments and not raised as blockers.
    for (let i = 1; i < points.length - 1; i += 1) {
      const point = points[i]!;
      const marker = mesh(owner, new THREE.ShapeGeometry(diamondShape(primary ? 0.56 : 0.38)), mats.route, `route-mark:${route.id}:${i}`);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(point.x, 0.08, point.z);
      marker.material = primary ? mats.route : mats.routeSecondary;
      group.add(marker);
    }
  }
}

function addPerimeterFacades(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  for (let index = 0; index < EDGE_CANDIDATES.length; index += 1) {
    const candidate = EDGE_CANDIDATES[index]!;
    const dimensions = facadeDimensions(candidate.style, candidate.scale);
    if (!isDecorativePocketClear(data, candidate.x, candidate.z, Math.max(dimensions.width, dimensions.depth) * 0.55 + 0.8)) continue;
    const facade = buildFacade(candidate.style, dimensions.width, dimensions.depth, dimensions.height, mats, owner, index);
    facade.name = `streetscape-facade:${index}:${candidate.style}`;
    facade.position.set(candidate.x, 0, candidate.z);
    // Facades face inward from the perimeter but remain decoration without collision.
    if (candidate.x < 0) facade.rotation.y = Math.PI / 2;
    else if (candidate.x > 0) facade.rotation.y = -Math.PI / 2;
    group.add(facade);
  }
}

function facadeDimensions(style: FacadeStyle, scale: number): { width: number; depth: number; height: number } {
  const sizes: Record<FacadeStyle, { width: number; depth: number; height: number }> = {
    gable: { width: 5.2, depth: 4.2, height: 6.2 },
    roundhouse: { width: 4.8, depth: 4.2, height: 6.4 },
    market: { width: 5.4, depth: 4.6, height: 4.2 },
    tower: { width: 4, depth: 4, height: 7.1 },
    "root-cottage": { width: 5.1, depth: 4.6, height: 5.3 },
  };
  const size = sizes[style];
  return { width: size.width * scale, depth: size.depth * scale, height: size.height * scale };
}

function buildFacade(style: FacadeStyle, width: number, depth: number, height: number, mats: TownMaterials, owner: ReturnType<typeof ownResources>, variant: number): THREE.Group {
  const group = new THREE.Group();
  if (style === "gable") {
    const walls = mesh(owner, new THREE.BoxGeometry(width, height * 0.66, depth), mats.plaster, "timber-rowhouse-wall");
    walls.position.y = height * 0.33;
    group.add(walls);
    const gable = new THREE.Shape();
    gable.moveTo(-width / 2, 0); gable.lineTo(width / 2, 0); gable.lineTo(0, height * 0.37); gable.closePath();
    const peak = mesh(owner, new THREE.ExtrudeGeometry(gable, { depth, bevelEnabled: false }), mats.plaster, "gable-end");
    peak.position.set(0, height * 0.66, -depth / 2);
    group.add(peak);
    addGabledRoof(group, width, depth, height, mats, owner, variant);
    addTimberGrid(group, width, height * 0.66, depth, mats, owner);
    addWarmWindows(group, width, height, depth, mats, owner, 2);
    addDoorway(group, width, depth, height, mats, owner);
  } else if (style === "roundhouse") {
    const body = mesh(owner, new THREE.CylinderGeometry(width * 0.42, width * 0.47, height * 0.65, 12), mats.plaster, "curved-plaster-shop");
    body.position.y = height * 0.325; body.scale.z = depth / width; group.add(body);
    const roof = mesh(owner, new THREE.ConeGeometry(width * 0.56, height * 0.39, 10), mats.roofBlue, "roundhouse-conical-roof");
    roof.position.y = height * 0.83; roof.scale.z = depth / width; group.add(roof);
    addWarmWindows(group, width * 0.78, height, depth, mats, owner, 3);
    const belt = mesh(owner, new THREE.TorusGeometry(width * 0.42, 0.075, 5, 16), mats.timber, "roundhouse-timber-belt");
    belt.position.y = height * 0.42; belt.scale.z = depth / width; group.add(belt);
    addDoorway(group, width, depth, height, mats, owner);
  } else if (style === "market") {
    const counter = mesh(owner, new THREE.BoxGeometry(width * 0.8, height * 0.24, depth * 0.34), mats.timber, "market-counter");
    counter.position.set(0, height * 0.12, depth * 0.36); group.add(counter);
    for (let i = 0; i < 5; i += 1) {
      const post = mesh(owner, new THREE.CylinderGeometry(0.07, 0.09, height * 0.78, 6), mats.timber, "awning-post");
      post.position.set((i - 2) * width * 0.19, height * 0.39, depth * 0.36); group.add(post);
    }
    for (let i = 0; i < 6; i += 1) {
      const stripe = mesh(owner, new THREE.PlaneGeometry(width / 6 + 0.015, depth * 0.56), i % 2 ? mats.canvasGold : mats.canvasRed, "striped-market-awning");
      stripe.position.set((i - 2.5) * width / 6, height * 0.76, depth * 0.1);
      stripe.rotation.x = -0.16;
      group.add(stripe);
      const ware = mesh(owner, new THREE.SphereGeometry(0.18 + (i % 2) * 0.035, 6, 4), i % 3 ? mats.flower : mats.leafLight, "market-wares");
      ware.position.set((i - 2.5) * width * 0.12, height * 0.3, depth * 0.54); group.add(ware);
    }
    const rear = mesh(owner, new THREE.BoxGeometry(width * 0.84, height * 0.32, 0.3), mats.plaster, "market-back-wall");
    rear.position.set(0, height * 0.51, -depth * 0.25); group.add(rear);
  } else if (style === "tower") {
    const lower = mesh(owner, new THREE.CylinderGeometry(width * 0.38, width * 0.46, height * 0.7, 8), mats.darkStone, "watchtower-lower-storey");
    lower.position.y = height * 0.35; lower.scale.z = depth / width; group.add(lower);
    const upper = mesh(owner, new THREE.CylinderGeometry(width * 0.31, width * 0.36, height * 0.42, 8), mats.plaster, "watchtower-upper-storey");
    upper.position.y = height * 0.83; upper.scale.z = depth / width; group.add(upper);
    const cap = mesh(owner, new THREE.ConeGeometry(width * 0.48, height * 0.34, 8), mats.roof, "watchtower-cap");
    cap.position.y = height * 1.17; cap.scale.z = depth / width; group.add(cap);
    addWarmWindows(group, width * 0.9, height, depth, mats, owner, 3);
  } else {
    const body = mesh(owner, new THREE.IcosahedronGeometry(1, 1), mats.plaster, "root-cottage-volume");
    body.position.y = height * 0.48; body.scale.set(width * 0.48, height * 0.48, depth * 0.46); group.add(body);
    const roof = mesh(owner, new THREE.ConeGeometry(width * 0.52, height * 0.38, 7), mats.roofBlue, "root-cottage-roof");
    roof.position.y = height * 0.88; roof.rotation.y = 0.2; group.add(roof);
    for (let i = 0; i < 7; i += 1) {
      const angle = i * Math.PI * 2 / 7;
      const vine = mesh(owner, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * width * 0.17, height * 0.35, Math.sin(angle) * depth * 0.17),
        new THREE.Vector3(Math.cos(angle + 0.16) * width * 0.34, height * 0.18, Math.sin(angle + 0.16) * depth * 0.34),
        new THREE.Vector3(Math.cos(angle + 0.1) * width * 0.45, 0.08, Math.sin(angle + 0.1) * depth * 0.45),
      ]), 8, 0.06, 5, false), mats.timber, "root-house-splayed-vine");
      group.add(vine);
    }
    addWarmWindows(group, width * 0.72, height, depth, mats, owner, 2);
  }
  return group;
}

function addGabledRoof(group: THREE.Group, width: number, depth: number, height: number, mats: TownMaterials, owner: ReturnType<typeof ownResources>, variant: number): void {
  const roofColor = variant % 2 ? mats.roofBlue : mats.roof;
  for (const side of [-1, 1]) {
    const roof = mesh(owner, new THREE.BoxGeometry(width * 0.63, 0.18, depth * 1.14), roofColor, "slate-gable-roof-plane");
    roof.position.set(side * width * 0.2, height * 0.82, 0);
    roof.rotation.z = side * -0.56;
    group.add(roof);
    for (let row = 0; row < 3; row += 1) {
      const course = mesh(owner, new THREE.BoxGeometry(width * 0.66, 0.055, depth * 1.16), row % 2 ? mats.roofBlue : roofColor, "roof-shingle-course");
      course.position.set(side * (width * 0.2 + row * width * 0.055), height * 0.91 - row * height * 0.035, 0);
      course.rotation.z = side * -0.56;
      group.add(course);
    }
  }
  const ridge = mesh(owner, new THREE.CylinderGeometry(0.12, 0.12, depth * 1.22, 6), mats.timber, "roof-ridge-beam");
  ridge.rotation.x = Math.PI / 2;
  ridge.position.y = height * 0.97;
  group.add(ridge);
}

function addTimberGrid(group: THREE.Group, width: number, wallHeight: number, depth: number, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  for (const x of [-1, 1]) {
    const post = mesh(owner, new THREE.BoxGeometry(0.16, wallHeight, 0.18), mats.timber, "timber-facade-post");
    post.position.set(x * width * 0.38, wallHeight / 2, depth / 2 + 0.06); group.add(post);
  }
  const cross = mesh(owner, new THREE.BoxGeometry(width * 0.92, 0.15, 0.19), mats.timber, "timber-facade-crossbeam");
  cross.position.set(0, wallHeight * 0.45, depth / 2 + 0.06); group.add(cross);
  for (const side of [-1, 1]) {
    const brace = mesh(owner, new THREE.BoxGeometry(0.11, wallHeight * 0.42, 0.16), mats.timber, "timber-gable-brace");
    brace.position.set(side * width * 0.25, wallHeight * 0.74, depth / 2 + 0.08);
    brace.rotation.z = side * -0.56; group.add(brace);
  }
}

function addWarmWindows(group: THREE.Group, width: number, height: number, depth: number, mats: TownMaterials, owner: ReturnType<typeof ownResources>, count: number): void {
  const span = width * 0.66;
  for (let i = 0; i < count; i += 1) {
    const x = count === 1 ? 0 : (i / (count - 1) - 0.5) * span;
    const y = height * (i % 2 ? 0.54 : 0.46);
    const frame = mesh(owner, new THREE.BoxGeometry(0.72, 0.95, 0.14), mats.timber, "deep-window-frame");
    frame.position.set(x, y, depth * 0.47); group.add(frame);
    const pane = mesh(owner, new THREE.PlaneGeometry(0.49, 0.7), mats.windowGlow, "warm-window-pane");
    pane.position.set(x, y, depth * 0.55); group.add(pane);
    const mullion = mesh(owner, new THREE.BoxGeometry(0.07, 0.72, 0.08), mats.darkStone, "window-mullion");
    mullion.position.set(x, y, depth * 0.57); group.add(mullion);
    const sill = mesh(owner, new THREE.BoxGeometry(0.88, 0.11, 0.24), mats.stone, "stone-window-sill");
    sill.position.set(x, y - 0.53, depth * 0.52); group.add(sill);
  }
}

function addDoorway(group: THREE.Group, width: number, depth: number, height: number, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  const door = mesh(owner, new THREE.BoxGeometry(width * 0.2, height * 0.34, 0.16), mats.timber, "deep-set-shop-door");
  door.position.set(0, height * 0.17, depth / 2 + 0.09); group.add(door);
  const arch = mesh(owner, new THREE.TorusGeometry(width * 0.12, 0.07, 5, 12, Math.PI), mats.stone, "door-stone-arch");
  arch.position.set(0, height * 0.34, depth / 2 + 0.1); group.add(arch);
  const lamp = mesh(owner, new THREE.SphereGeometry(0.15, 6, 4), mats.lantern, "door-lantern");
  lamp.position.set(width * 0.17, height * 0.42, depth / 2 + 0.14); group.add(lamp);
}

function addStreetGreenery(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  const candidates = [
    [-11, 1], [11, 1], [-10, -18], [10, -18], [-11, 18], [11, 18],
    [-21, 17], [21, 18], [-24, -3], [24, -2], [-12, 11], [12, 11],
  ];
  let index = 0;
  for (const [x, z] of candidates) {
    if (!isDecorativePocketClear(data, x, z, 2.1)) continue;
    const planter = mesh(owner, new THREE.CylinderGeometry(0.85, 0.72, 0.42, 9), index % 2 ? mats.stone : mats.darkStone, "low-stone-planter");
    planter.position.set(x, 0.18, z); group.add(planter);
    for (let leafIndex = 0; leafIndex < 7; leafIndex += 1) {
      const angle = leafIndex * Math.PI * 2 / 7;
      const shrub = mesh(owner, new THREE.IcosahedronGeometry(0.52 + (leafIndex % 3) * 0.08, 0), leafIndex % 3 ? mats.leaf : mats.leafLight, "planter-foliage-clump");
      shrub.position.set(x + Math.cos(angle) * 0.45, 0.64 + (leafIndex % 2) * 0.12, z + Math.sin(angle) * 0.45);
      shrub.scale.set(1, 0.82 + (leafIndex % 3) * 0.08, 0.85);
      group.add(shrub);
    }
    for (let bloom = 0; bloom < 3; bloom += 1) {
      const flower = mesh(owner, new THREE.SphereGeometry(0.12, 6, 4), mats.flower, "planter-flower");
      flower.position.set(x + (bloom - 1) * 0.28, 1.02 + (bloom % 2) * 0.08, z + 0.1);
      group.add(flower);
    }
    index += 1;
  }
}

function addStreetFixtures(group: THREE.Group, data: Floor7Town, mats: TownMaterials, owner: ReturnType<typeof ownResources>): void {
  const candidates = [[-13, -2], [13, -2], [-13, 11], [13, 11], [-20, -17], [20, -17], [-5, 20], [5, 20]];
  let index = 0;
  for (const [x, z] of candidates) {
    if (!isDecorativePocketClear(data, x, z, 1.2)) continue;
    const pole = mesh(owner, new THREE.CylinderGeometry(0.09, 0.15, 3.5, 7), mats.timber, "street-lamp-post");
    pole.position.set(x, 1.75, z); group.add(pole);
    const arm = mesh(owner, new THREE.CylinderGeometry(0.045, 0.055, 0.72, 6), mats.timber, "curved-lantern-arm");
    arm.position.set(x + 0.26, 3.42, z); arm.rotation.z = Math.PI / 2; group.add(arm);
    const shade = mesh(owner, new THREE.CylinderGeometry(0.22, 0.32, 0.36, 6), mats.darkStone, "lantern-cap");
    shade.position.set(x + 0.55, 3.2, z); group.add(shade);
    const light = mesh(owner, new THREE.SphereGeometry(0.18, 8, 6), mats.lantern, "warm-lantern-glass");
    light.position.set(x + 0.55, 2.98, z); group.add(light);
    index += 1;
  }
}

function isDecorativePocketClear(data: Floor7Town, x: number, z: number, radius: number): boolean {
  const halfWidth = data.bounds.width / 2;
  const halfDepth = data.bounds.depth / 2;
  if (Math.abs(x - data.bounds.x) + radius > halfWidth - 0.4 || Math.abs(z - data.bounds.z) + radius > halfDepth - 0.4) return false;
  for (const route of data.routes) {
    const points = [route.from, ...route.waypoints, route.to];
    for (let i = 0; i < points.length - 1; i += 1) {
      if (distanceToSegment({ x, z }, points[i]!, points[i + 1]!) < route.width / 2 + radius + 0.8) return false;
    }
  }
  for (const block of data.collision) {
    const dx = Math.max(Math.abs(x - block.x) - block.width / 2, 0);
    const dz = Math.max(Math.abs(z - block.z) - block.depth / 2, 0);
    if (Math.hypot(dx, dz) < radius + 0.9) return false;
  }
  for (const encounter of data.encounters) {
    const dx = Math.max(Math.abs(x - encounter.collision.x) - encounter.collision.width / 2, 0);
    const dz = Math.max(Math.abs(z - encounter.collision.z) - encounter.collision.depth / 2, 0);
    if (Math.hypot(dx, dz) < radius + 1) return false;
  }
  for (const landmark of data.landmarks) {
    if (Math.hypot(x - landmark.position.x, z - landmark.position.z) < radius + 1.8) return false;
  }
  return true;
}

function distanceToSegment(point: LateFloorPoint, a: LateFloorPoint, b: LateFloorPoint): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared > 0 ? THREE.MathUtils.clamp(((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared, 0, 1) : 0;
  return Math.hypot(point.x - (a.x + t * dx), point.z - (a.z + t * dz));
}

function townRouteGeometry(points: readonly LateFloorPoint[], width: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz) || 1;
    const ox = (-dz / length) * width * 0.5;
    const oz = (dx / length) * width * 0.5;
    const al = [a.x + ox, 0, a.z + oz];
    const ar = [a.x - ox, 0, a.z - oz];
    const bl = [b.x + ox, 0, b.z + oz];
    const br = [b.x - ox, 0, b.z - oz];
    vertices.push(...al, ...bl, ...ar, ...ar, ...bl, ...br);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function diamondShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, -radius); shape.lineTo(radius * 0.72, 0); shape.lineTo(0, radius); shape.lineTo(-radius * 0.72, 0); shape.closePath();
  return shape;
}

function mesh(owner: ReturnType<typeof ownResources>, geometry: THREE.BufferGeometry, material: THREE.Material, name: string): THREE.Mesh {
  const result = new THREE.Mesh(owner.geometry(geometry), material);
  result.name = name;
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

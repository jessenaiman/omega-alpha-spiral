import * as THREE from "three";
import type { Floor7Town, LateFloorPoint } from "./late-floor-7-town";
import type { Floor8Finale } from "./late-floor-8-finale";

export interface LateFloorArtResult {
  readonly group: THREE.Group;
  /** Releases all geometries, materials, and locally generated textures owned by this group. */
  readonly dispose: () => void;
}

type Surface = Floor7Town["structures"][number]["surface"];
type TownForm = Floor7Town["structures"][number]["form"];
type FinaleForm = Floor8Finale["structures"][number]["form"];

const materialColors: Record<Surface, string> = {
  "painted-card": "#d5b77e",
  "lime-plaster": "#d9c9a2",
  "weathered-wood": "#795238",
  "woven-canvas": "#bd6453",
  "bark-and-vine": "#53684a",
  "faceted-low-poly": "#69778d",
  "pixel-art": "#d6b04d",
};

const finaleColors: Record<Floor8Finale["structures"][number]["material"], string> = {
  "translucent-ceramic": "#c3dcdf",
  "refractive-glass": "#70a5b6",
  "soft-emissive-membrane": "#8ce4da",
  "brushed-alloy": "#8b9caf",
};

/** Build Floor 7's intentionally inconsistent town props; collision remains in the layout data. */
export function createFloor7TownArt(data: Floor7Town): LateFloorArtResult {
  const owner = resources();
  const group = new THREE.Group();
  group.name = data.id + "-art";

  for (const structure of data.structures) {
    const prop = townStructure(structure.form, structure.surface, structure.height, structure.footprint.width, structure.footprint.depth, structure.display.aspectRatio, structure.display.pixelDensity, structure.display.scaleX, structure.display.scaleY, owner);
    prop.name = structure.id;
    prop.position.set(structure.position.x, 0, structure.position.z);
    group.add(prop);
  }

  for (const landmark of data.landmarks) {
    const marker = landmarkArt(landmark.kind, landmark.display.era, owner);
    marker.name = landmark.id;
    marker.position.set(landmark.position.x, 0, landmark.position.z);
    group.add(marker);
  }

  for (const encounter of data.encounters) {
    const actor = encounterArt(encounter.kind, encounter.role, owner);
    actor.name = encounter.id;
    actor.position.set(encounter.position.x, 0, encounter.position.z);
    group.add(actor);
  }

  return { group, dispose: owner.dispose };
}

/** Build Floor 8's open modern architecture with restrained, embedded legacy motifs. */
export function createFloor8FinaleArt(data: Floor8Finale): LateFloorArtResult {
  const owner = resources();
  const group = new THREE.Group();
  group.name = data.id + "-art";

  for (const structure of data.structures) {
    const prop = finaleStructure(structure.form, structure.material, structure.legacyDetail, owner);
    prop.name = structure.id;
    prop.position.set(structure.position.x, 0, structure.position.z);
    prop.scale.set(structure.scale.x, structure.scale.y, structure.scale.z);
    group.add(prop);
  }

  for (const landmark of data.landmarks) {
    const marker = finaleLandmarkArt(landmark.kind, landmark.eraLayers.length, owner);
    marker.name = landmark.id;
    marker.position.set(landmark.position.x, 0, landmark.position.z);
    group.add(marker);
  }

  return { group, dispose: owner.dispose };
}

function resources() {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  return {
    geometry<T extends THREE.BufferGeometry>(value: T): T { geometries.add(value); return value; },
    material<T extends THREE.Material>(value: T): T { materials.add(value); return value; },
    texture<T extends THREE.Texture>(value: T): T { textures.add(value); return value; },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      geometries.clear(); materials.clear(); textures.clear();
    },
  };
}

function surfaceTexture(surface: Surface, aspectRatio: number, pixelDensity: number, scaleX: number, scaleY: number, owner: ReturnType<typeof resources>): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const density = THREE.MathUtils.clamp(pixelDensity, 0.45, 2.2);
  canvas.width = Math.max(32, Math.round(128 * density * THREE.MathUtils.clamp(aspectRatio, 0.5, 2.5)));
  canvas.height = Math.max(48, Math.round(160 * density));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is required for late-floor surface textures.");
  const base = materialColors[surface];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Per-object display mismatch lives in this texture only, leaving the world footprint intact.
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(THREE.MathUtils.clamp(scaleX, 0.55, 1.55), THREE.MathUtils.clamp(scaleY, 0.55, 1.55));
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  if (surface === "painted-card" || surface === "pixel-art") {
    const block = Math.max(3, Math.round(12 / density));
    ctx.fillStyle = surface === "pixel-art" ? "#4d586d" : "#aa654e";
    ctx.fillRect(canvas.width * 0.12, canvas.height * 0.1, canvas.width * 0.76, canvas.height * 0.16);
    for (let y = canvas.height * 0.38; y < canvas.height * 0.78; y += block * 2) {
      for (let x = canvas.width * 0.12; x < canvas.width * 0.88; x += block * 2) {
        ctx.fillStyle = (Math.floor(x / block) + Math.floor(y / block)) % 2 ? "#e8d4a4" : "#58677a";
        ctx.fillRect(x, y, block, block);
      }
    }
  } else if (surface === "weathered-wood") {
    ctx.strokeStyle = "#432f29"; ctx.lineWidth = Math.max(1, density * 2);
    for (let y = 8; y < canvas.height; y += 22 * density) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y + 5 * density); ctx.stroke(); }
    ctx.fillStyle = "#bf9a63"; ctx.fillRect(canvas.width * 0.1, canvas.height * 0.18, canvas.width * 0.8, 5 * density);
  } else if (surface === "woven-canvas") {
    ctx.strokeStyle = "#e2c68c"; ctx.lineWidth = Math.max(1, density * 3);
    for (let x = 0; x < canvas.width; x += 18 * density) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  } else if (surface === "bark-and-vine") {
    ctx.strokeStyle = "#b0b779"; ctx.lineWidth = Math.max(1, density * 2);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(i * canvas.width / 5, canvas.height); ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.4, canvas.width * (0.15 + i / 6), 0); ctx.stroke(); }
  } else if (surface === "faceted-low-poly") {
    ctx.fillStyle = "#8f9cad";
    for (let i = 0; i < 12; i++) {
      const x = (i % 4) * canvas.width / 4, y = Math.floor(i / 4) * canvas.height / 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + canvas.width / 4, y + canvas.height / 6); ctx.lineTo(x + canvas.width / 8, y + canvas.height / 3); ctx.closePath(); ctx.fill();
    }
  } else {
    ctx.fillStyle = "#b7a785";
    for (let y = canvas.height * 0.3; y < canvas.height * 0.8; y += canvas.height * 0.18) { ctx.fillRect(canvas.width * 0.18, y, canvas.width * 0.22, canvas.height * 0.08); ctx.fillRect(canvas.width * 0.58, y, canvas.width * 0.22, canvas.height * 0.08); }
  }

  const texture = owner.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = density < 0.9 ? THREE.NearestFilter : THREE.LinearFilter;
  texture.minFilter = density < 0.9 ? THREE.NearestMipmapNearestFilter : THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function standard(owner: ReturnType<typeof resources>, color: THREE.ColorRepresentation, roughness = 0.82, metalness = 0): THREE.MeshStandardMaterial {
  return owner.material(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
}

function textured(owner: ReturnType<typeof resources>, surface: Surface, aspect: number, density: number, scaleX: number, scaleY: number, color = "#ffffff"): THREE.MeshStandardMaterial {
  return owner.material(new THREE.MeshStandardMaterial({ color, map: surfaceTexture(surface, aspect, density, scaleX, scaleY, owner), roughness: 0.88, side: THREE.DoubleSide }));
}

function part(owner: ReturnType<typeof resources>, geometry: THREE.BufferGeometry, material: THREE.Material, name?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(owner.geometry(geometry), material);
  mesh.name = name ?? "decorative-part";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function townStructure(form: TownForm, surface: Surface, height: number, width: number, depth: number, aspect: number, density: number, scaleX: number, scaleY: number, owner: ReturnType<typeof resources>): THREE.Group {
  const group = new THREE.Group();
  const shell = textured(owner, surface, aspect, density, scaleX, scaleY);
  const trim = standard(owner, "#493d39", 0.74);
  const warm = standard(owner, "#c99a54", 0.76);

  if (form === "sprite-flat-facade") {
    const card = part(owner, new THREE.PlaneGeometry(width, height), shell, "flat-painted-facade");
    card.position.y = height / 2;
    group.add(card);
    const roof = new THREE.Shape();
    roof.moveTo(-width * 0.48, 0); roof.lineTo(0, height * 0.2); roof.lineTo(width * 0.48, 0); roof.closePath();
    const cap = part(owner, new THREE.ShapeGeometry(roof), warm, "offset-card-roof");
    cap.position.set(0, height, 0.015);
    group.add(cap);
  } else if (form === "curved-plaster") {
    const body = part(owner, new THREE.CylinderGeometry(width * 0.43, width * 0.52, height * 0.76, 14, 1), shell, "curved-plaster-body");
    body.position.y = height * 0.4; body.scale.z = depth / width; group.add(body);
    const dome = part(owner, new THREE.SphereGeometry(width * 0.49, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), warm, "rounded-plaster-roof");
    dome.position.y = height * 0.78; dome.scale.z = depth / width; group.add(dome);
    addDoor(group, owner, trim, 0, 0, depth * 0.51, height * 0.38);
  } else if (form === "timber-gable") {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(width / 2, height * 0.64); shape.lineTo(0, height); shape.lineTo(-width / 2, height * 0.64); shape.closePath();
    const house = part(owner, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), shell, "timber-gable-shell");
    house.position.z = -depth / 2; group.add(house);
    for (const side of [-1, 1]) {
      const brace = part(owner, new THREE.BoxGeometry(0.12, height * 0.67, 0.14), trim, "gable-timber-brace");
      brace.position.set(side * width * 0.32, height * 0.31, depth / 2 - 0.07); group.add(brace);
    }
  } else if (form === "market-tent") {
    const canopy = part(owner, new THREE.ConeGeometry(Math.max(width, depth) * 0.47, height, 8, 1, true), shell, "open-sided-tent-canopy");
    canopy.position.y = height * 0.55; canopy.scale.z = depth / width; group.add(canopy);
    const postMaterial = standard(owner, "#e7d1a2", 0.9);
    for (const x of [-width * 0.4, width * 0.4]) for (const z of [-depth * 0.38, depth * 0.38]) {
      const post = part(owner, new THREE.CylinderGeometry(0.07, 0.1, height * 0.95, 6), postMaterial, "tent-pole");
      post.position.set(x, height * 0.48, z); group.add(post);
    }
  } else if (form === "organic-root-house") {
    const body = part(owner, new THREE.IcosahedronGeometry(1, 1), shell, "root-grown-dwelling");
    body.position.y = height * 0.48; body.scale.set(width * 0.47, height * 0.48, depth * 0.47); group.add(body);
    const rootMaterial = standard(owner, "#554738");
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 0.4;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * width * 0.2, height * 0.22, Math.sin(angle) * depth * 0.2),
        new THREE.Vector3(Math.cos(angle) * width * 0.34, height * 0.12, Math.sin(angle) * depth * 0.34),
        new THREE.Vector3(Math.cos(angle + 0.2) * width * 0.42, 0.06, Math.sin(angle + 0.2) * depth * 0.42),
      ]);
      group.add(part(owner, new THREE.TubeGeometry(curve, 8, 0.055, 5, false), rootMaterial, "splayed-root"));
    }
  } else if (form === "low-poly-console") {
    const base = part(owner, new THREE.CylinderGeometry(width * 0.46, width * 0.46, height * 0.18, 7, 1), trim, "faceted-stepped-foundation");
    base.position.y = height * 0.1; base.scale.z = depth / width; group.add(base);
    const mass = part(owner, new THREE.IcosahedronGeometry(1, 0), shell, "ps1-era-faceted-volume");
    mass.position.y = height * 0.57; mass.scale.set(width * 0.46, height * 0.45, depth * 0.46); group.add(mass);
    const fin = part(owner, new THREE.ConeGeometry(width * 0.22, height * 0.65, 5), warm, "asymmetric-console-fin");
    fin.position.set(width * 0.27, height * 0.74, depth * 0.04); group.add(fin);
  } else {
    const sign = part(owner, new THREE.PlaneGeometry(width, height * 0.55), shell, "hanging-pixel-sign");
    sign.position.y = height * 0.55; group.add(sign);
    const hanger = part(owner, new THREE.CylinderGeometry(0.04, 0.04, height * 0.45, 6), trim, "sign-hanger");
    hanger.position.y = height * 0.84; group.add(hanger);
  }
  return group;
}

function addDoor(group: THREE.Group, owner: ReturnType<typeof resources>, material: THREE.Material, x: number, y: number, z: number, height: number) {
  const door = part(owner, new THREE.CylinderGeometry(0.55, 0.55, height, 12, 1, false, 0, Math.PI), material, "arched-door");
  door.position.set(x, y + height / 2, z); door.rotation.y = Math.PI;
  group.add(door);
}

function landmarkArt(kind: Floor7Town["landmarks"][number]["kind"], era: string, owner: ReturnType<typeof resources>): THREE.Group {
  const group = new THREE.Group();
  const accent = standard(owner, era === "modern" ? "#71e1db" : era === "32-bit" ? "#93a9df" : "#efcf72", 0.38, 0.15);
  const dark = standard(owner, "#353941", 0.9);
  if (kind === "dreamweaver") {
    const glyph = part(owner, new THREE.OctahedronGeometry(0.65, 0), accent, "dw-arrival-glyph");
    glyph.position.y = 1.3; glyph.scale.y = 1.7; group.add(glyph);
    const ring = part(owner, new THREE.TorusGeometry(0.9, 0.045, 5, 20), accent, "dw-ground-ring");
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; group.add(ring);
  } else if (kind === "terminal") {
    const casing = part(owner, new THREE.ExtrudeGeometry(panelShape(1.1, 1.5), { depth: 0.42, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.08, bevelSegments: 2 }), dark, "terminal-casing");
    casing.position.y = 0.1; group.add(casing);
    const screen = part(owner, new THREE.PlaneGeometry(0.82, 0.78), accent, "terminal-screen");
    screen.position.set(0, 0.98, 0.44); group.add(screen);
  } else if (kind === "memory") {
    const well = part(owner, new THREE.TorusGeometry(1.05, 0.18, 7, 18), accent, "memory-well-rim");
    well.rotation.x = Math.PI / 2; well.position.y = 0.28; group.add(well);
    for (let i = 0; i < 4; i++) {
      const shard = part(owner, new THREE.OctahedronGeometry(0.22, 0), accent, "memory-fragment");
      shard.position.set(Math.cos(i * Math.PI / 2) * 0.55, 0.72 + (i % 2) * 0.18, Math.sin(i * Math.PI / 2) * 0.55); group.add(shard);
    }
  } else if (kind === "collector") {
    const marker = part(owner, new THREE.TorusGeometry(0.75, 0.06, 5, 18), accent, "collector-sweep-marker");
    marker.rotation.x = Math.PI / 2; marker.position.y = 0.06; group.add(marker);
  } else if (kind === "route") {
    const beacon = part(owner, new THREE.ConeGeometry(0.35, 1.2, 5), accent, "exit-beacon");
    beacon.position.y = 0.8; group.add(beacon);
  } else if (kind === "plaza") {
    const bowl = part(owner, new THREE.CylinderGeometry(1.08, 1.22, 0.42, 10), standard(owner, "#958b7d", 0.92), "town-fountain-bowl");
    bowl.position.y = 0.22; group.add(bowl);
    const water = part(owner, new THREE.CircleGeometry(0.92, 12), standard(owner, "#76aeb5", 0.25, 0.18), "quiet-fountain-water");
    water.rotation.x = -Math.PI / 2; water.position.y = 0.45; group.add(water);
  }
  return group;
}

function panelShape(width: number, height: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(width / 2, height); shape.lineTo(-width / 2, height); shape.closePath();
  return shape;
}

function encounterArt(kind: "npc" | "collector", role: string, owner: ReturnType<typeof resources>): THREE.Group {
  const group = new THREE.Group();
  if (kind === "npc") {
    const robe = standard(owner, role === "duplicated-wanderer" ? "#8792a6" : "#987355");
    const face = standard(owner, "#dec9a7");
    const body = part(owner, new THREE.CapsuleGeometry(0.34, 0.75, 3, 6), robe, "npc-cloaked-silhouette");
    body.position.y = 0.68; group.add(body);
    const head = part(owner, new THREE.IcosahedronGeometry(0.28, 1), face, "npc-head");
    head.position.y = 1.42; group.add(head);
    if (role === "duplicated-wanderer") {
      const echo = part(owner, new THREE.CapsuleGeometry(0.34, 0.75, 2, 5), owner.material(new THREE.MeshBasicMaterial({ color: "#a7c9e8", transparent: true, opacity: 0.22, depthWrite: false })), "delayed-duplicate-silhouette");
      echo.position.set(-0.55, 0.68, -0.18); group.add(echo);
    }
  } else if (role === "sweeper") {
    const shell = standard(owner, "#8b9897", 0.56, 0.35);
    const eye = owner.material(new THREE.MeshStandardMaterial({ color: "#ffb84c", emissive: "#d97927", emissiveIntensity: 0.65, roughness: 0.36 }));
    const body = part(owner, new THREE.CylinderGeometry(0.48, 0.72, 0.42, 8), shell, "sweeper-disc-body"); body.position.y = 0.55; group.add(body);
    const sensor = part(owner, new THREE.SphereGeometry(0.17, 8, 6), eye, "amber-scan-sensor"); sensor.position.set(0, 0.88, 0.22); group.add(sensor);
    const fan = part(owner, new THREE.CircleGeometry(1.15, 12, -0.7, 1.4), owner.material(new THREE.MeshBasicMaterial({ color: "#ffb84c", transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })), "forward-scan-fan");
    fan.rotation.x = -Math.PI / 2; fan.position.set(0, 0.04, 0.9); group.add(fan);
  } else {
    const body = part(owner, new THREE.ConeGeometry(0.42, 1.35, 3), standard(owner, "#6c8790", 0.46, 0.4), "skimmer-tri-body");
    body.position.y = 0.68; body.rotation.x = Math.PI / 2; group.add(body);
    const ring = part(owner, new THREE.TorusGeometry(0.7, 0.035, 5, 18), standard(owner, "#6be0de", 0.4, 0.2), "cyan-leading-ring");
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; group.add(ring);
  }
  return group;
}

function finaleStructure(form: FinaleForm, materialRole: Floor8Finale["structures"][number]["material"], legacy: Floor8Finale["structures"][number]["legacyDetail"], owner: ReturnType<typeof resources>): THREE.Group {
  const group = new THREE.Group();
  const color = finaleColors[materialRole];
  const glass = owner.material(new THREE.MeshPhysicalMaterial({ color, roughness: 0.24, metalness: materialRole === "brushed-alloy" ? 0.65 : 0.12, transmission: materialRole === "refractive-glass" ? 0.24 : 0.04, transparent: materialRole !== "brushed-alloy", opacity: materialRole === "soft-emissive-membrane" ? 0.58 : 0.84, side: THREE.DoubleSide, emissive: materialRole === "soft-emissive-membrane" ? "#2cb5aa" : "#000000", emissiveIntensity: 0.24 }));
  const trim = standard(owner, "#d9f4ef", 0.3, 0.7);

  if (form === "prismatic-vault") {
    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0); shape.lineTo(-1, 0.35); shape.lineTo(-0.82, 0.76); shape.lineTo(-0.48, 1); shape.lineTo(0, 1.08); shape.lineTo(0.55, 0.9); shape.lineTo(0.88, 0.52); shape.lineTo(0.66, 0); shape.closePath();
    const vault = part(owner, new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false }), glass, "faceted-prismatic-vault");
    vault.position.set(0, 0, -0.11); group.add(vault);
    const seam = part(owner, new THREE.TorusGeometry(0.8, 0.018, 4, 24, Math.PI), trim, "vault-refractive-seam"); seam.position.set(0, 0.72, 0.24); group.add(seam);
  } else if (form === "open-halo") {
    const hoop = part(owner, new THREE.TorusGeometry(0.72, 0.08, 8, 32), glass, "tilted-open-halo");
    hoop.position.y = 0.94; hoop.rotation.set(0.3, 0.2, -0.48); group.add(hoop);
    for (let i = 0; i < 3; i++) {
      const rib = part(owner, new THREE.CylinderGeometry(0.025, 0.05, 1.2, 6), trim, "halo-support-rib");
      rib.position.set((i - 1) * 0.36, 0.62, 0); rib.rotation.z = (i - 1) * -0.23; group.add(rib);
    }
  } else if (form === "suspended-ribbon") {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0.2, -0.2), new THREE.Vector3(-0.5, 0.72, 0), new THREE.Vector3(0.35, 0.55, 0.12), new THREE.Vector3(1.2, 1.15, 0.25),
    ]);
    const ribbon = part(owner, new THREE.TubeGeometry(curve, 36, 0.085, 8, false), glass, "sweeping-suspended-ribbon"); group.add(ribbon);
    const socket = part(owner, new THREE.TorusGeometry(0.17, 0.025, 5, 16), trim, "ribbon-anchor"); socket.position.set(-1.2, 0.2, -0.2); group.add(socket);
  } else {
    const ring = part(owner, new THREE.TorusGeometry(1, 0.095, 8, 40), glass, "core-lightwell-ring");
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.9; group.add(ring);
    const coreMaterial = owner.material(new THREE.MeshPhysicalMaterial({ color: "#fff0bf", emissive: "#ffbd63", emissiveIntensity: 1.1, roughness: 0.18, metalness: 0.05, transmission: 0.25 }));
    const core = part(owner, new THREE.IcosahedronGeometry(0.55, 1), coreMaterial, "healing-core-crystal"); core.position.y = 1.15; group.add(core);
    for (let i = 0; i < 3; i++) {
      const shard = part(owner, new THREE.OctahedronGeometry(0.15, 0), trim, "legacy-pixel-shard");
      shard.position.set(Math.cos(i * Math.PI * 2 / 3) * 1.28, 0.22, Math.sin(i * Math.PI * 2 / 3) * 1.28); group.add(shard);
    }
  }

  addLegacyDetail(group, legacy, trim, owner);
  return group;
}

function addLegacyDetail(group: THREE.Group, detail: Floor8Finale["structures"][number]["legacyDetail"], material: THREE.Material, owner: ReturnType<typeof resources>) {
  if (detail === "none") return;
  if (detail === "embedded-pixel-mosaic") {
    const plate = part(owner, new THREE.PlaneGeometry(0.72, 0.36), material, "legacy-pixel-mosaic");
    plate.position.set(0.18, 1.42, 0.08); group.add(plate);
  } else if (detail === "faceted-linework") {
    for (let i = 0; i < 3; i++) {
      const line = part(owner, new THREE.CylinderGeometry(0.012, 0.012, 1.35, 4), material, "faceted-era-line");
      line.position.set((i - 1) * 0.3, 0.55, 0.19); line.rotation.z = (i - 1) * 0.32; group.add(line);
    }
  } else {
    const step = part(owner, new THREE.TorusGeometry(0.52, 0.02, 4, 20, Math.PI * 1.25), material, "stepped-curve-trace");
    step.position.set(0, 0.56, 0.2); step.rotation.z = Math.PI; group.add(step);
  }
}

function finaleLandmarkArt(kind: Floor8Finale["landmarks"][number]["kind"], eraLayerCount: number, owner: ReturnType<typeof resources>): THREE.Group {
  const group = new THREE.Group();
  if (kind === "threshold") {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.8, 0, 0), new THREE.Vector3(-2, 2.4, 0), new THREE.Vector3(0, 3.1, 0), new THREE.Vector3(2, 2.4, 0), new THREE.Vector3(2.8, 0, 0)]);
    const arch = part(owner, new THREE.TubeGeometry(curve, 32, 0.075, 8, false), standard(owner, "#a9cfdb", 0.32, 0.38), "threshold-light-arch"); group.add(arch);
  } else if (kind === "memory") {
    const material = owner.material(new THREE.MeshBasicMaterial({ color: "#96bdd3", transparent: true, opacity: 0.5, depthWrite: false }));
    for (let i = 0; i < Math.min(eraLayerCount, 3); i++) {
      const slab = part(owner, new THREE.PlaneGeometry(1.8, 2.6), material, "memory-glass-slab");
      slab.position.set((i - 1) * 0.9, 1.25, (i - 1) * -0.12); slab.rotation.y = (i - 1) * 0.13; group.add(slab);
    }
  } else if (kind === "core") {
    const beacon = part(owner, new THREE.IcosahedronGeometry(0.9, 1), owner.material(new THREE.MeshPhysicalMaterial({ color: "#fff0c6", emissive: "#ffc36f", emissiveIntensity: 1.1, roughness: 0.16, transmission: 0.22 })), "core-landmark-crystal");
    beacon.position.y = 1.3; group.add(beacon);
    const orbit = part(owner, new THREE.TorusGeometry(1.2, 0.035, 5, 32), standard(owner, "#a7e6df", 0.3, 0.4), "core-landmark-orbit"); orbit.position.y = 1.3; orbit.rotation.set(0.45, 0.2, 0); group.add(orbit);
  } else {
    const gate = part(owner, new THREE.TorusGeometry(1.25, 0.055, 5, 24), standard(owner, "#e0edf0", 0.4, 0.25), "modern-boundary-loop");
    gate.position.y = 1.5; group.add(gate);
  }
  return group;
}

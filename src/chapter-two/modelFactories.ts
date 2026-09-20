import * as THREE from 'three';
import { LatheGeometry, ExtrudeGeometry, BufferGeometry, Float32BufferAttribute, Shape } from 'three';

export interface ModelFactoryResult {
  root: THREE.Group;
  collision?: THREE.Object3D;
  bounds?: THREE.Box3;
  diagnostics: { meshes: number; materials: number; geometries: number; triangles: number };
}

function count(root: THREE.Object3D): ModelFactoryResult['diagnostics'] {
  let meshes = 0, materials = new Set<THREE.Material>(), geometries = 0, triangles = 0;
  root.traverse((object): void => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes += 1;
    const geo: THREE.BufferGeometry = object.geometry;
    geometries += 1;
    const position = geo.getAttribute('position');
    if (position) triangles += (geo.index ? geo.index!.count : position.count) / 3;
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const m of mats) materials.add(m);
  });
  return { meshes, materials: materials.size, geometries, triangles: Math.round(triangles) };
}

/** Hero avatar. Tapered hood + torso, named joints, emissive visor; collision proxy separate. */
export function createEcho(): ModelFactoryResult {
  const root = new THREE.Group();

  // Hood fabric — sheen reads as soft cloth without metal reflection.
  const fabric = new THREE.MeshPhysicalMaterial({ color: 0x40507a, metalness: 0, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0x8899bb), envMapIntensity: 0.4 });
  const armor = new THREE.MeshPhysicalMaterial({ color: 0x9aa8b8, metalness: 0, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.8 });
  const visorMaterial = new THREE.MeshStandardMaterial({ color: 0x101418, emissive: 0x8fd0ff, emissiveIntensity: 2.2, roughness: 0.3 });

  // Torso via lathe profile: wide shoulders tapering to a narrow base.
  const torsoProfile: THREE.Vector2[] = [new THREE.Vector2(0.06, 0), new THREE.Vector2(0.42, 0.08), new THREE.Vector2(0.4, 0.5), new THREE.Vector2(0.3, 0.96), new THREE.Vector2(0.16, 1.06)];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 14), fabric);
  torso.name = 'torso';
  root.add(torso);

  // Head/helm sits on top; visor strip is the identity signal.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), armor);
  head.name = 'head';
  head.position.y = 1.24;
  root.add(head);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.03), visorMaterial);
  visor.position.set(0, 1.27, -0.22);
  root.add(visor);

  // Shoulder pauldrons (asymmetric mass adds authored silhouette).
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.08, 4, 10), armor);
    shoulder.name = side < 0 ? 'shoulderL' : 'shoulderR';
    shoulder.position.set(side * 0.42, 0.94, 0);
    shoulder.rotation.z = side * 0.5;
    root.add(shoulder);
  }
  // Hip pivots so procedural walk can programme whole-leg motion.
  for (const side of [-1, 1]) {
    const hip = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), fabric);
    hip.name = side < 0 ? 'hipL' : 'hipR';
    hip.position.set(side * 0.16, 0.5, 0);
    root.add(hip);
  }

  const collision = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 8), new THREE.MeshBasicMaterial({ visible: false }));
  collision.name = 'collisionProxy';
  collision.position.y = 0.6;
  root.add(collision);

  return { root, collision, diagnostics: count(root) };
}

/** Spectral wolf: faceted hull, glowing sensor head, attack telegraph socket. */
export function createWolf(): ModelFactoryResult {
  const root = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x42324a, roughness: 0.85, envMapIntensity: 0.4 });
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x101010, emissive: 0xff3524, emissiveIntensity: 2.6, roughness: 0.3 });

  // Tapered hull body from a custom buffer (long nose, low shoulders).
  const hull = new BufferGeometry();
  const verts = new Float32Array([
    // wide back (4), narrow nose (2); collapsed to two triangles each level
    -0.55, 0.0, 0.28, 0.55, 0.0, 0.28, 0.55, 0.0, -0.28, -0.55, 0.0, -0.28, // base
    -0.18, 0.55, 0.18, 0.1, 0.55, 0.18, 0.1, 0.55, -0.18, -0.18, 0.55, -0.18, // spine
  ]);
  hull.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  hull.setAttribute('normal', new Float32BufferAttribute(new Float32Array(12 * 3), 3));
  hull.computeVertexNormals();
  hull.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 0, 1, 5, 7, 1, 2, 6, 4, 7, 6]);
  const body = new THREE.Mesh(hull, fur);
  body.name = 'wolfBody';
  body.position.y = 0.42;
  root.add(body);

  const sensor = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.44, 8), fur);
  sensor.name = 'wolfSensorHead';
  sensor.position.set(0.55, 0.55, 0);
  sensor.rotation.z = -Math.PI / 2;
  root.add(sensor);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.22), eyeMaterial);
  eye.name = 'attackTelegraph';
  eye.position.set(0.68, 0.58, 0);
  root.add(eye);

  // Four legs. Named locomotion pivots, procedural bob drives them in-scene.
  for (const [side, front] of [[-1, 1], [1, 1], [-1, -1], [1, -1]] as const) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 4, 8), fur);
    leg.name = `leg${front > 0 ? 'Front' : 'Back'}${side < 0 ? 'L' : 'R'}`;
    leg.position.set(front * 0.4, 0.18, side * 0.2);
    root.add(leg);
  }

  const collision = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.7, 4, 10), new THREE.MeshBasicMaterial({ visible: false }));
  collision.name = 'collisionProxy';
  collision.position.y = 0.5;
  root.add(collision);
  return { root, collision, diagnostics: count(root) };
}

/** Giggle chest: real hinge lid that opens; emissive seam inside. */
export function createGiggleChest(): ModelFactoryResult {
  const root = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4526, roughness: 0.75, envMapIntensity: 0.5 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x8a6b3a, metalness: 0.6, roughness: 0.35, envMapIntensity: 0.9 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x101010, emissive: 0xffd27a, emissiveIntensity: 2.4, roughness: 0.4 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.0), wood);
  base.position.y = 0.35;
  root.add(base);
  const lid = new THREE.Group();
  lid.name = 'lidPivot';
  lid.position.set(0, 0.7, 0.5);
  const lidShape = new Shape();
  lidShape.moveTo(-0.75, 0); lidShape.lineTo(0.75, 0); lidShape.quadraticCurveTo(0.75, 0.28, 0.45, 0.28); lidShape.lineTo(-0.45, 0.28); lidShape.quadraticCurveTo(-0.75, 0.28, -0.75, 0);
  const lidPanel = new THREE.Mesh(new ExtrudeGeometry(lidShape, { depth: 1.0, bevelEnabled: false }), wood);
  lidPanel.position.z = -0.5;
  lid.add(lidPanel);
  root.add(lid);

  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.5), glow);
  seam.name = 'secretSeam';
  seam.position.y = 0.71;
  root.add(seam);

  // Corner trim: 4 bolts = 4 real brackets (authored detail, shared geometry).
  const bracketGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
  for (const [x, z] of [[-0.68, -0.44], [0.68, -0.44], [-0.68, 0.44], [0.68, 0.44]]) {
    const bracket = new THREE.Mesh(bracketGeo, trim);
    bracket.position.set(x, 0.35, z);
    root.add(bracket);
  }
  return { root, diagnostics: count(root) };
}

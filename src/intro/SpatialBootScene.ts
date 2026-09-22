import {
  AdditiveBlending, AmbientLight, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, DirectionalLight, DoubleSide,
  Group, Line, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, NearestFilter, PerspectiveCamera, PointLight, Raycaster,
  Scene, ShaderMaterial, SRGBColorSpace, Vector2, Vector3,
} from 'three';

import { BOOT_OPTIONS, BOOT_SYMBOLS, type BootFrame } from './ghostwriting';
import { getIntroEra, INTRO_ERAS, type IntroEraDesign } from './IntroEraDesign';
import { IntroParticleField } from './IntroParticleField';
import { INTRO_JOURNEY_SENSOR_INDEX, IntroPhysics, type IntroPhysicsDiagnostics, type IntroPhysicsPosition, type IntroPhysicsStep } from './IntroPhysics';

// Recorded first draw (seed 472): UI pixel-font-step .619, gameplay depth-drift
// .472, stack plane-skew .716. Deliberately independent, bounded experiments.
export const BOOT_EFFECTS = { pixelStep: 0.619, depthDrift: 0.472, planeSkew: 0.716 };
const GLYPHS: string = Array.from({ length: 95 }, (_: unknown, index: number): string => String.fromCharCode(index + 32)).join('') + '∞◊Ω≋※—↑↓↵';
const ATLAS_COLUMNS: number = 16;
const ATLAS_ROWS: number = 7;
const GLYPH_CAPACITY: number = 256;
// Owner order follows chronicle.ts: Light, Shadow, Ambition.
const INK: number[] = [0xdcefff, 0xd44854, 0xe7b45a];
const BACK_INK: number[] = [0x395057, 0x050103, 0x4a3510];
const VOICE_NAMES: string[] = ['LIGHT // WITNESS', 'SHADOW // VEIL', 'AMBITION // VECTOR'];
const ASIDES: string[] = ["They've already tried that.", 'Still looking for the beginning.', 'Let them try.'];
const CURSOR_PERIOD_MS: number = 1150;
const ASIDE_HOLD_MS: number = 4300;
const VOICE_COOLDOWN_MS: number = 2500;
const PATH_VERTEX_CAPACITY: number = 96;

const GLYPH_VERTEX: string = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLYPH_FRAGMENT: string = `
  uniform sampler2D uMap0;
  uniform sampler2D uMap1;
  uniform sampler2D uMap2;
  uniform sampler2D uMap3;
  uniform sampler2D uMap4;
  uniform sampler2D uMap5;
  uniform vec3 uColor;
  uniform vec3 uInk0;
  uniform vec3 uInk1;
  uniform vec3 uInk2;
  uniform vec3 uInk3;
  uniform vec3 uInk4;
  uniform vec3 uInk5;
  uniform float uKeep0;
  uniform float uKeep1;
  uniform float uKeep2;
  uniform float uKeep3;
  uniform float uKeep4;
  uniform float uKeep5;
  uniform float uUseOverride;
  uniform float uEra;
  uniform float uTime;
  uniform float uScanline;
  uniform float uDamage;
  uniform float uBitDepth;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float isCurrent(float era) {
    return 1.0 - step(0.49, abs(uEra - era));
  }

  float isReached(float era) {
    return step(era - 0.01, uEra);
  }

  void main() {
    // Damage is deliberately downstream: first reconstruct every display era,
    // then let Omega's unstable signal injure the resulting composite.
    float damageBand = step(0.92, hash21(vec2(floor(gl_FragCoord.y * 0.22), floor(uTime * 7.0))));
    vec2 damagedUv = vUv;
    damagedUv.x += (hash21(vec2(floor(uTime * 9.0), gl_FragCoord.y)) - 0.5) * uDamage * damageBand * 0.018;

    vec4 s0 = texture2D(uMap0, damagedUv);
    vec4 s1 = texture2D(uMap1, damagedUv);
    vec4 s2 = texture2D(uMap2, damagedUv);
    vec4 s3 = texture2D(uMap3, damagedUv);
    vec4 s4 = texture2D(uMap4, damagedUv);
    vec4 s5 = texture2D(uMap5, damagedUv);
    float w0 = isReached(0.0) * mix(uKeep0, 1.0, isCurrent(0.0));
    float w1 = isReached(1.0) * mix(uKeep1, 1.0, isCurrent(1.0));
    float w2 = isReached(2.0) * mix(uKeep2, 1.0, isCurrent(2.0));
    float w3 = isReached(3.0) * mix(uKeep3, 1.0, isCurrent(3.0));
    float w4 = isReached(4.0) * mix(uKeep4, 1.0, isCurrent(4.0));
    float w5 = isReached(5.0) * mix(uKeep5, 1.0, isCurrent(5.0));
    float a0 = s0.a * w0;
    float a1 = s1.a * w1;
    float a2 = s2.a * w2;
    float a3 = s3.a * w3;
    float a4 = s4.a * w4;
    float a5 = s5.a * w5;
    float energy = a0 + a1 + a2 + a3 + a4 + a5;
    float alpha = 1.0 - (1.0 - a0) * (1.0 - a1) * (1.0 - a2) * (1.0 - a3) * (1.0 - a4) * (1.0 - a5);
    vec3 layeredColor = (uInk0 * a0 + uInk1 * a1 + uInk2 * a2 + uInk3 * a3 + uInk4 * a4 + uInk5 * a5) / max(energy, 0.001);
    vec3 ink = mix(layeredColor, uColor, uUseOverride);
    float paletteLevels = max(2.0, exp2(min(6.0, uBitDepth)));
    ink = floor(ink * paletteLevels + 0.5) / paletteLevels;
    float row = fract(gl_FragCoord.y * mix(0.5, 0.24, step(3.5, uEra)));
    float scan = 1.0 - uScanline * step(0.5, row);
    float dropout = step(0.08 + uDamage * 0.2, hash21(vec2(floor(gl_FragCoord.x * 0.18), floor(uTime * 5.0) + gl_FragCoord.y)));
    float unstable = mix(1.0, dropout, uDamage * damageBand);
    float atari = isCurrent(0.0);
    float dither = step(0.34, fract(gl_FragCoord.x * 0.25) + fract(gl_FragCoord.y * 0.25));
    alpha *= scan * unstable * mix(1.0, dither, atari * 0.22);
    if (alpha < 0.035) discard;
    gl_FragColor = vec4(ink * mix(0.82, 1.0, scan), alpha);
    #include <colorspace_fragment>
  }
`;

type VoiceMaterial = LineBasicMaterial | MeshBasicMaterial | MeshStandardMaterial;

interface DreamweaverMark {
  root: Group;
  materials: VoiceMaterial[];
}

function createDreamweaverMark(owner: number): DreamweaverMark {
  const root: Group = new Group();
  const geometry: BufferGeometry = new BufferGeometry();
  const points: Vector3[] = [];
  if (owner === 0) {
    const segments: number[][] = [
      [-0.32, 0, 0, 0.32, 0, 0], [0, -0.32, 0, 0, 0.32, 0],
      [-0.23, -0.23, 0, 0.23, 0.23, 0], [-0.23, 0.23, 0, 0.23, -0.23, 0],
    ];
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(segments.flat()), 3));
  } else if (owner === 1) {
    points.push(
      new Vector3(-0.34, 0.28, 0), new Vector3(-0.04, 0.12, 0),
      new Vector3(-0.27, -0.03, 0), new Vector3(0.08, -0.13, 0),
      new Vector3(-0.03, -0.34, 0), new Vector3(0.34, -0.19, 0),
    );
    geometry.setFromPoints(points);
  } else {
    for (let index: number = 0; index < 56; index += 1) {
      const t: number = index / 55;
      const angle: number = t * Math.PI * 3.8;
      const radius: number = 0.035 + t * 0.3;
      points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    geometry.setFromPoints(points);
  }
  const main: LineBasicMaterial = new LineBasicMaterial({ color: INK[owner], transparent: true, opacity: 0.96, toneMapped: false });
  const halo: LineBasicMaterial = new LineBasicMaterial({ color: INK[owner], transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const line: Line | LineSegments = owner === 0 ? new LineSegments(geometry, main) : new Line(geometry, main);
  const glow: Line | LineSegments = owner === 0 ? new LineSegments(geometry, halo) : new Line(geometry, halo);
  glow.scale.setScalar(1.22);
  glow.position.z = -0.035;
  const coreMaterial: MeshStandardMaterial = new MeshStandardMaterial({
    color: 0x11171b, emissive: INK[owner], emissiveIntensity: 0.78,
    metalness: 0.56, roughness: 0.3, transparent: true, opacity: 0.9,
  });
  const core: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(new BoxGeometry(0.085, 0.085, 0.11), coreMaterial);
  const depthColor: number[] = [0x5b8ca8, 0x050103, 0x3f2a78];
  const depthMaterial: LineBasicMaterial = new LineBasicMaterial({
    color: depthColor[owner], transparent: true, opacity: 0.38, depthWrite: false, toneMapped: false,
  });
  const depthLine: Line | LineSegments = owner === 0 ? new LineSegments(geometry, depthMaterial) : new Line(geometry, depthMaterial);
  depthLine.position.set(owner === 1 ? -0.08 : 0, owner === 2 ? 0.04 : 0, -0.18);
  depthLine.scale.setScalar(owner === 0 ? 0.72 : owner === 1 ? 1.12 : 0.78);
  const practical: PointLight = new PointLight(INK[owner], owner === 1 ? 2.6 : 3.4, 2.8, 2);
  practical.position.z = 0.32;
  const materials: VoiceMaterial[] = [main, halo, coreMaterial, depthMaterial];
  root.add(depthLine, glow, line, core, practical);
  if (owner === 1) {
    const shadowSurface: MeshStandardMaterial = new MeshStandardMaterial({
      color: 0x050103, emissive: 0x5c0710, emissiveIntensity: 0.42,
      metalness: 0.34, roughness: 0.72, transparent: true, opacity: 0.2,
    });
    for (let index: number = 1; index < points.length; index += 1) {
      const from: Vector3 = points[index - 1];
      const to: Vector3 = points[index];
      const dx: number = to.x - from.x;
      const dy: number = to.y - from.y;
      const segment: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(new BoxGeometry(Math.hypot(dx, dy), 0.048, 0.13), shadowSurface);
      segment.position.set((from.x + to.x) * 0.5, (from.y + to.y) * 0.5, -0.11);
      segment.rotation.z = Math.atan2(dy, dx);
      root.add(segment);
    }
    materials.push(shadowSurface);
  }
  return { root, materials };
}

/** One reusable glyph atlas per historical font, never a texture per letter. */
function createAtlas(format: number): CanvasTexture {
  const era: IntroEraDesign = getIntroEra(format);
  const cell: number = Math.max(10, Math.round(era.cell * (format === 0 ? BOOT_EFFECTS.pixelStep : 1)));
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = ATLAS_COLUMNS * cell;
  canvas.height = ATLAS_ROWS * cell;
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!context) throw new Error('Cannot create glyph assets');
  context.imageSmoothingEnabled = false;
  context.font = `${era.weight} ${Math.floor(cell * 0.77)}px ${era.font}`;
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let index: number = 0; index < GLYPHS.length; index += 1) {
    context.fillText(GLYPHS[index], (index % ATLAS_COLUMNS + 0.5) * cell, (Math.floor(index / ATLAS_COLUMNS) + 0.5) * cell, cell);
  }
  const texture: CanvasTexture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/** Batched physical glyph quads; letters have independent XYZ and skew. */
class GlyphRibbon {
  public readonly root: Group = new Group();
  private _geometry: BufferGeometry = new BufferGeometry();
  private _positions: Float32Array = new Float32Array(GLYPH_CAPACITY * 12);
  private _uvs: Float32Array = new Float32Array(GLYPH_CAPACITY * 8);
  private _front: ShaderMaterial;
  private _back: ShaderMaterial;
  private _text: string = '';
  private _columns: number = 40;
  private _format: number = 0;
  private _ownerStyle: number = -1;
  private _atlases: CanvasTexture[];

  constructor(atlases: CanvasTexture[]) {
    this._atlases = atlases;
    const era: IntroEraDesign = getIntroEra(0);
    const uniforms = {
      uMap0: { value: atlases[0] }, uMap1: { value: atlases[1] }, uMap2: { value: atlases[2] },
      uMap3: { value: atlases[3] }, uMap4: { value: atlases[4] }, uMap5: { value: atlases[5] },
      uColor: { value: new Color(era.ink) },
      uInk0: { value: new Color(INTRO_ERAS[0].ink) }, uInk1: { value: new Color(INTRO_ERAS[1].ink) },
      uInk2: { value: new Color(INTRO_ERAS[2].ink) }, uInk3: { value: new Color(INTRO_ERAS[3].ink) },
      uInk4: { value: new Color(INTRO_ERAS[4].ink) }, uInk5: { value: new Color(INTRO_ERAS[5].ink) },
      uKeep0: { value: INTRO_ERAS[0].retention }, uKeep1: { value: INTRO_ERAS[1].retention },
      uKeep2: { value: INTRO_ERAS[2].retention }, uKeep3: { value: INTRO_ERAS[3].retention },
      uKeep4: { value: INTRO_ERAS[4].retention }, uKeep5: { value: INTRO_ERAS[5].retention },
      uUseOverride: { value: 0 }, uEra: { value: 0 }, uTime: { value: 0 },
      uScanline: { value: era.scanline }, uDamage: { value: era.damage }, uBitDepth: { value: era.bitDepth },
    };
    this._front = new ShaderMaterial({
      uniforms,
      vertexShader: GLYPH_VERTEX, fragmentShader: GLYPH_FRAGMENT,
      transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false,
    });
    this._back = this._front.clone();
    this._back.uniforms.uColor.value = new Color(era.echo);
    this._back.uniforms.uUseOverride.value = 1;
  }

  public init(): void {
    const indices: number[] = [];
    for (let index: number = 0; index < GLYPH_CAPACITY; index += 1) {
      const vertex: number = index * 4;
      indices.push(vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3);
    }
    this._geometry.setAttribute('position', new BufferAttribute(this._positions, 3));
    this._geometry.setAttribute('uv', new BufferAttribute(this._uvs, 2));
    this._geometry.setIndex(indices);
    this._geometry.setDrawRange(0, 0);
    const front: Mesh = new Mesh(this._geometry, this._front);
    const back: Mesh = new Mesh(this._geometry, this._back);
    front.frustumCulled = false;
    back.frustumCulled = false;
    back.position.set(0.045, -0.025, -0.08);
    this.root.add(back, front);
  }

  public setText(text: string, format: number, columns: number, color?: number, ownerStyle: number = -1): void {
    format = Math.max(0, Math.min(this._atlases.length - 1, format));
    const era: IntroEraDesign = getIntroEra(format);
    this._front.uniforms.uColor.value.setHex(color ?? era.ink);
    this._front.uniforms.uUseOverride.value = color !== undefined || ownerStyle >= 0 ? 1 : 0;
    this._back.uniforms.uColor.value.setHex(ownerStyle >= 0 ? BACK_INK[ownerStyle] : era.echo);
    if (this._text === text && this._format === format && this._columns === columns && this._ownerStyle === ownerStyle) return;
    this._text = text;
    this._format = format;
    this._columns = columns;
    this._ownerStyle = ownerStyle;
    this._front.uniforms.uEra.value = format;
    this._back.uniforms.uEra.value = format;
    this._front.uniforms.uScanline.value = era.scanline;
    this._back.uniforms.uScanline.value = era.scanline;
    this._front.uniforms.uBitDepth.value = era.bitDepth;
    this._back.uniforms.uBitDepth.value = era.bitDepth;
    let glyph: number = 0;
    for (const letter of text) {
      if (letter === '\n' || glyph >= GLYPH_CAPACITY) continue;
      const index: number = Math.max(0, GLYPHS.indexOf(letter));
      const x: number = index % ATLAS_COLUMNS / ATLAS_COLUMNS;
      const y: number = 1 - (Math.floor(index / ATLAS_COLUMNS) + 1) / ATLAS_ROWS;
      this._uvs.set([x, y, x + 1 / ATLAS_COLUMNS, y, x + 1 / ATLAS_COLUMNS, y + 1 / ATLAS_ROWS, x, y + 1 / ATLAS_ROWS], glyph * 8);
      glyph += 1;
    }
    this._geometry.attributes.uv.needsUpdate = true;
    this._geometry.setDrawRange(0, glyph * 6);
  }

  public update(seconds: number, disorder: number): void {
    this._front.uniforms.uTime.value = seconds;
    this._back.uniforms.uTime.value = seconds;
    const era: IntroEraDesign = getIntroEra(this._format);
    const damage: number = Math.min(1, era.damage + disorder * 0.58);
    this._front.uniforms.uDamage.value = damage;
    this._back.uniforms.uDamage.value = damage * 0.72;
    let column: number = 0;
    let row: number = 0;
    let glyph: number = 0;
    for (const letter of this._text) {
      if (letter === '\n') { row += 1; column = 0; continue; }
      if (glyph >= GLYPH_CAPACITY) break;
      if (column >= this._columns) { row += 1; column = 0; }
      const snap: number = 0.018 + era.pixelSnap * 0.075;
      let x: number = Math.round(column * 0.64 / snap) * snap;
      let y: number = Math.round(-row * 1.35 / snap) * snap;
      const ownerStyle: number = this._ownerStyle;
      const authoredDisorder: number = ownerStyle >= 0 ? disorder * 0.28 : 0;
      const drift: number = ownerStyle === 0 ? 0 : Math.sin(seconds * 0.32 + glyph * 0.21) * authoredDisorder;
      let z: number = ownerStyle === 0 ? 0 : Math.sin(glyph * 0.71 + seconds * 0.2) * (ownerStyle >= 0 ? authoredDisorder * 0.6 : era.depth);
      let skew: number = ownerStyle === 0 ? 0 : Math.cos(glyph * 0.37) * authoredDisorder * 0.18;
      if (ownerStyle === 1) {
        const segment: number = Math.floor(column / 5) % 3;
        x += (segment - 1) * 0.24;
        y += segment === 1 ? 0.08 : -0.04;
        z = (segment - 1) * disorder * 0.22;
        skew = segment === 1 ? -0.12 : 0.12;
      }
      if (ownerStyle === 2) {
        const arc: number = Math.sin(Math.min(1, column / Math.max(1, this._columns - 1)) * Math.PI);
        x += arc * 0.2;
        y += arc * (0.32 + disorder * 0.2);
        z += arc * 0.24;
        skew += arc * 0.08;
      }
      this._positions.set([x, y + drift, z, x + 1, y + drift, z, x + 1 + skew, y + 1 + drift, z, x + skew, y + 1 + drift, z], glyph * 12);
      column += 1;
      glyph += 1;
    }
    this._geometry.attributes.position.needsUpdate = true;
  }

  public destroy(): void {
    this.root.removeFromParent();
    this._geometry.dispose();
    this._front.dispose();
    this._back.dispose();
  }
}

export class SpatialBootScene {
  private _root: Group = new Group();
  private _atlases: CanvasTexture[] = [];
  private _ribbons: GlyphRibbon[] = [];
  private _cursor: Mesh<BoxGeometry, MeshBasicMaterial> | null = null;
  private _particles: IntroParticleField = new IntroParticleField();
  private _physics: IntroPhysics = new IntroPhysics();
  private _voices: Group[] = [];
  private _voiceMaterials: VoiceMaterial[][] = [];
  private _trails: Line<BufferGeometry, LineBasicMaterial>[] = [];
  private _voiceAppearedAt: number[] = [-1, -1, -1];
  private _targets: Mesh<BoxGeometry, MeshBasicMaterial>[] = [];
  private _player: Group = new Group();
  private _playerCore: Mesh<BoxGeometry, MeshStandardMaterial> | null = null;
  private _playerOutline: LineSegments<BufferGeometry, LineBasicMaterial> | null = null;
  private _playerMemories: Array<Mesh<BoxGeometry, MeshStandardMaterial>> = [];
  private _playerStage: number = 0;
  private _choiceHistory: number[] = [];
  private _paths: Array<LineSegments<BufferGeometry, LineBasicMaterial>> = [];
  private _pathEchoes: Array<LineSegments<BufferGeometry, LineBasicMaterial>> = [];
  private _pathPositions: Float32Array[] = [];
  private _pathLights: PointLight[] = [];
  private _pathFrom: Vector3 = new Vector3();
  private _pathGoal: Vector3 = new Vector3();
  private _pathPrevious: Vector3 = new Vector3();
  private _pathCurrent: Vector3 = new Vector3();
  private _movement: Vector2 = new Vector2();
  private _lastUpdateMs: number = 0;
  private _lastPhase: BootFrame['phase'] | '' = '';
  private _backgroundStartedAt: number = -1;
  private _journeyActive: boolean = false;
  private _journeyComplete: boolean = false;
  private _choiceArmed: boolean = false;
  private _frame: BootFrame | null = null;
  private _width: number = 8;
  private _isNarrow: boolean = false;
  private _voice: number = -1;
  private _asideAt: number = -10000;
  private _aside: string = '';
  private _selected: number = -1;
  private _hovered: number = -1;
  private _pointer: Vector2 = new Vector2();
  private _raycaster: Raycaster = new Raycaster();
  private _fossils: Array<{ text: string; era: number; color: number; owner: number }> = [];
  private _voiceStarts: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  private _voiceResting: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  private _trailPoint: Vector3 = new Vector3();
  private _physicsTargets: IntroPhysicsPosition[] = [
    { x: 0, y: 0, z: 0.18 }, { x: 0, y: 0, z: 0.18 }, { x: 0, y: 0, z: 0.18 },
  ];

  public init(scene: Scene): Promise<void> {
    this._atlases = INTRO_ERAS.map((era: IntroEraDesign): CanvasTexture => createAtlas(era.id));
    this._particles.init(this._root);
    // command, three boot slots, archive, question, symbols, aside, three choices,
    // three fossils, and three diegetic speaker names.
    for (let index: number = 0; index < 17; index += 1) {
      const ribbon: GlyphRibbon = new GlyphRibbon(this._atlases);
      ribbon.init();
      this._ribbons.push(ribbon);
      this._root.add(ribbon.root);
    }
    this._cursor = new Mesh(new BoxGeometry(0.13, 0.24, 0.09), new MeshBasicMaterial({ color: INK[0] }));
    this._root.add(this._cursor);
    for (let index: number = 0; index < 3; index += 1) {
      const mark: DreamweaverMark = createDreamweaverMark(index);
      this._voices.push(mark.root);
      this._voiceMaterials.push(mark.materials);
      this._root.add(mark.root);
      const trailGeometry: BufferGeometry = new BufferGeometry();
      trailGeometry.setAttribute('position', new BufferAttribute(new Float32Array(72 * 3), 3));
      const trailMaterial: LineBasicMaterial = new LineBasicMaterial({
        color: INK[index], transparent: true, opacity: 0.42, blending: AdditiveBlending, depthWrite: false, toneMapped: false,
      });
      const trail: Line<BufferGeometry, LineBasicMaterial> = new Line(trailGeometry, trailMaterial);
      trail.frustumCulled = false;
      this._trails.push(trail);
      this._root.add(trail);
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = new Mesh(new BoxGeometry(1, 1, 0.03), new MeshBasicMaterial({ color: INK[index], transparent: true, opacity: 0.04, depthWrite: false }));
      target.name = String(index);
      this._targets.push(target);
      this._root.add(target);
      this._ribbons[14 + index].setText(`[ ${VOICE_NAMES[index]} ]`, index + 1, 24, INK[index], index);
    }
    this._createPlayer();
    this._createPath();
    const ambient: AmbientLight = new AmbientLight(0x7893a3, 0.62);
    const key: DirectionalLight = new DirectionalLight(0xe7f5ff, 2.4);
    key.position.set(-3.5, 4.5, 5.5);
    const rim: PointLight = new PointLight(0x7088a8, 8, 9, 2);
    rim.position.set(2.8, -1.4, 2.5);
    this._root.add(ambient, key, rim);
    scene.add(this._root);
    return this._physics.init();
  }

  private _createPlayer(): void {
    const coreMaterial: MeshStandardMaterial = new MeshStandardMaterial({
      color: 0xbfd5df, emissive: 0x223a46, emissiveIntensity: 0.7, metalness: 0.72, roughness: 0.28,
    });
    this._playerCore = new Mesh(new BoxGeometry(0.18, 0.18, 0.18), coreMaterial);
    const layerSegments: number[] = [
      // Stage 1: cursor rails.
      -0.13, -0.31, 0, -0.13, 0.31, 0, 0.13, -0.31, 0, 0.13, 0.31, 0,
      -0.13, 0.31, 0, 0.13, 0.31, 0, -0.13, -0.31, 0, 0.13, -0.31, 0,
      // Stage 2: a decision diamond.
      0, 0.43, 0, 0.3, 0, 0, 0.3, 0, 0, 0, -0.43, 0,
      0, -0.43, 0, -0.3, 0, 0, -0.3, 0, 0, 0, 0.43, 0,
      // Stage 3: depth rails.
      -0.3, 0, 0, -0.2, 0, 0.24, 0.3, 0, 0, 0.2, 0, 0.24,
      0, 0.43, 0, 0, 0.28, 0.24, 0, -0.43, 0, 0, -0.28, 0.24,
      // Stage 4: an open threshold, deliberately missing its lower edge.
      -0.34, -0.34, 0.04, -0.34, 0.48, 0.04, -0.34, 0.48, 0.04, 0.34, 0.48, 0.04,
      0.34, 0.48, 0.04, 0.34, -0.34, 0.04, -0.2, 0.32, 0.04, 0.2, 0.32, 0.04,
      -0.2, 0.12, 0.04, 0.2, 0.12, 0.04, -0.2, -0.08, 0.04, 0.2, -0.08, 0.04,
    ];
    const outlineGeometry: BufferGeometry = new BufferGeometry();
    outlineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(layerSegments), 3));
    outlineGeometry.setDrawRange(0, 0);
    const outlineMaterial: LineBasicMaterial = new LineBasicMaterial({ color: 0xc9edff, transparent: true, opacity: 0.78, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    this._playerOutline = new LineSegments(outlineGeometry, outlineMaterial);
    this._player.add(this._playerOutline, this._playerCore);
    const memoryPositions: readonly [number, number, number][] = [
      [-0.25, 0.25, 0.08], [0.25, 0.25, 0.08], [-0.25, -0.25, 0.08], [0.25, -0.25, 0.08],
    ];
    for (let index: number = 0; index < memoryPositions.length; index += 1) {
      const memory: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(
        new BoxGeometry(0.16, 0.045, 0.07),
        new MeshStandardMaterial({ color: 0x70838c, emissive: 0x101b20, emissiveIntensity: 1.2, metalness: 0.5, roughness: 0.34 }),
      );
      memory.position.set(...memoryPositions[index]);
      memory.rotation.z = index % 2 === 0 ? Math.PI * 0.25 : -Math.PI * 0.25;
      memory.visible = false;
      this._playerMemories.push(memory);
      this._player.add(memory);
    }
    this._player.position.set(0, -2.55, 0.52);
    this._root.add(this._player);
  }

  private _createPath(): void {
    const echoColors: readonly number[] = [0x36576a, 0x030102, 0x60428f];
    for (let owner: number = 0; owner < 3; owner += 1) {
      const positions: Float32Array = new Float32Array(PATH_VERTEX_CAPACITY * 3);
      const geometry: BufferGeometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 0);
      const material: LineBasicMaterial = new LineBasicMaterial({
        color: INK[owner], transparent: true, opacity: 0,
        blending: AdditiveBlending, depthWrite: false, toneMapped: false,
      });
      const line: LineSegments<BufferGeometry, LineBasicMaterial> = new LineSegments(geometry, material);
      line.frustumCulled = false;
      const echoMaterial: LineBasicMaterial = new LineBasicMaterial({
        color: echoColors[owner], transparent: true, opacity: 0,
        blending: AdditiveBlending, depthWrite: false, toneMapped: false,
      });
      const echo: LineSegments<BufferGeometry, LineBasicMaterial> = new LineSegments(geometry, echoMaterial);
      echo.frustumCulled = false;
      echo.position.set(owner === 2 ? 0.11 : owner === 1 ? -0.055 : 0, 0, owner === 2 ? -0.1 : -0.055);
      const light: PointLight = new PointLight(INK[owner], 0, 2.4, 2);
      light.visible = false;
      this._pathPositions.push(positions);
      this._paths.push(line);
      this._pathEchoes.push(echo);
      this._pathLights.push(light);
      this._root.add(echo, line, light);
    }
  }

  public setMovement(x: number, y: number): void {
    this._movement.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  }

  public beginJourney(): void {
    this._journeyActive = true;
    this._journeyComplete = false;
    this._choiceArmed = false;
    this._player.position.set((this._selected - 1) * this._width * 0.16, -2.45, 0.58);
    this._physics.activateJourney(
      { x: this._player.position.x, y: this._player.position.y, z: this._player.position.z },
      { x: 0, y: 2.5, z: 0.26 },
    );
  }

  public setPlayerStage(stage: number): void {
    this._playerStage = Math.max(0, Math.min(4, Math.floor(stage)));
    const drawCount: number[] = [0, 8, 16, 24, 36];
    this._playerOutline?.geometry.setDrawRange(0, drawCount[this._playerStage]);
    if (this._playerCore) this._playerCore.scale.setScalar(0.72 + this._playerStage * 0.1);
    this._playerMemories.forEach((memory: Mesh<BoxGeometry, MeshStandardMaterial>, index: number): void => {
      memory.visible = index < this._playerStage;
    });
  }

  public resize(aspect: number): void {
    this._isNarrow = aspect < 1;
    this._width = Math.min(8, 5.5 * aspect);
    this._particles.setFieldWidth(this._width);
    if (this._frame) this.setFrame(this._frame);
  }

  public setFrame(frame: BootFrame): void {
    this._frame = frame;
    const columns: number = frame.phase === 'final' || frame.phase === 'complete' ? (this._isNarrow ? 32 : 52) : this._isNarrow ? 29 : 42;
    const transcriptLines: string[] = frame.transcript.split('\n');
    this._ribbons[0].setText(frame.phase === 'command' || frame.phase === 'cursor' ? frame.transcript : transcriptLines.filter((line: string): boolean => !line.startsWith('dreamweaver[')).join('\n'), frame.format, columns);
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[index + 1].setText(transcriptLines.find((line: string): boolean => line.startsWith(`dreamweaver[0${index + 1}]`)) ?? '', index, columns, INK[index], index);
    }
    this._ribbons[4].setText(frame.prelude, 0, this._isNarrow ? 40 : 78, 0x7e9399);
    const speakingOwner: number = frame.phase === 'response' ? Math.max(0, frame.speaker ?? this._selected) : -1;
    const responseColor: number = speakingOwner >= 0 ? INK[speakingOwner] : INK[0];
    const questionColumns: number = frame.phase === 'response' ? (this._isNarrow ? 20 : 27) : columns;
    const responseOwner: number = speakingOwner;
    this._ribbons[5].setText(frame.question, responseOwner >= 0 ? responseOwner + 1 : frame.format, questionColumns, responseColor, responseOwner);
    this._ribbons[6].setText(BOOT_SYMBOLS, 2, columns, 0x9ca5a8);
    const asideText: string = frame.hint ?? this._aside;
    const asideVoice: number = frame.hint ? Math.max(0, Math.min(5, frame.format)) : Math.max(this._voice, 0);
    this._ribbons[7].setText(asideText, asideVoice, this._isNarrow ? 30 : 42, frame.hint ? 0x9ca5a8 : INK[Math.max(this._voice, 0)]);
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[8 + index].setText(`${index + 1}  ${frame.choices[index] ?? BOOT_OPTIONS[index]}`, index + 1, this._isNarrow ? 14 : 18, INK[index], index);
    }
    for (let index: number = 0; index < 3; index += 1) {
      const fossil = this._fossils[index];
      this._ribbons[11 + index].setText(fossil?.text ?? '', fossil?.era ?? 0, this._isNarrow ? 34 : 62, fossil?.color ?? INK[index], fossil?.owner ?? index);
    }
  }

  public interrupt(elapsedMs: number): string | null {
    if (!this._frame || this._frame.phase === 'waiting' || elapsedMs - this._asideAt < VOICE_COOLDOWN_MS) return null;
    this._voice = (this._voice + 1) % 3;
    this._asideAt = elapsedMs;
    this._aside = ASIDES[this._voice];
    this.setFrame(this._frame);
    return this._aside;
  }

  public getVoice(): number { return this._voice; }

  public getPlayerPosition(): { x: number; y: number; z: number } {
    const position: Vector3 = this._player.position;
    return { x: position.x, y: position.y, z: position.z };
  }

  public getChoiceTargets(): Array<{ x: number; y: number; z: number }> {
    return this._targets.map((target: Mesh<BoxGeometry, MeshBasicMaterial>): { x: number; y: number; z: number } => ({
      x: target.position.x, y: target.position.y - 0.46, z: target.position.z,
    }));
  }

  public select(index: number): void {
    if (index >= 0 && index !== this._selected) this._particles.pulse(index);
    this._selected = index;
  }

  public getParticleDiagnostics(): { lightParticles: number; darkParticles: number; drawCalls: number; surfaceFormation: number } {
    return this._particles.getDiagnostics();
  }

  public getPhysicsDiagnostics(): IntroPhysicsDiagnostics { return this._physics.getDiagnostics(); }

  public settleForTestState(elapsedMs: number): void {
    this._voiceAppearedAt = [elapsedMs - 3200, elapsedMs - 3200, elapsedMs - 3200];
  }

  public archive(text: string, era: number, owner: number): void {
    this._fossils.unshift({ text, era, color: INK[Math.max(0, Math.min(2, owner))], owner });
    this._fossils.length = Math.min(this._fossils.length, 3);
    if (this._frame) this.setFrame(this._frame);
  }

  public pick(clientX: number, clientY: number, camera: PerspectiveCamera): number {
    if (this._frame?.phase !== 'waiting') return -1;
    this._pointer.set(clientX / window.innerWidth * 2 - 1, 1 - clientY / window.innerHeight * 2);
    this._raycaster.setFromCamera(this._pointer, camera);
    const hit = this._raycaster.intersectObjects(this._targets, false)[0];
    return hit ? Number(hit.object.name) : -1;
  }

  public hover(index: number): void { this._hovered = index; }

  public reset(): void {
    this._voice = -1;
    this._aside = '';
    this._asideAt = -10000;
    this._selected = -1;
    this._hovered = -1;
    this._voiceAppearedAt = [-1, -1, -1];
    this._fossils = [];
    this._choiceHistory = [];
    this._movement.set(0, 0);
    this._lastUpdateMs = 0;
    this._lastPhase = '';
    this._backgroundStartedAt = -1;
    this._journeyActive = false;
    this._journeyComplete = false;
    this._choiceArmed = false;
    this._player.position.set(0, -2.55, 0.52);
    this.setPlayerStage(0);
    this._retunePlayer();
    this._particles.reset();
    this._physics.reset();
  }

  public commitChoice(index: number): void {
    const target: Mesh<BoxGeometry, MeshBasicMaterial> | undefined = this._targets[index];
    if (target) this._player.position.set(target.position.x, target.position.y - 0.46, 0.56);
    this._choiceHistory.push(Math.max(0, Math.min(2, index)));
    const memory: Mesh<BoxGeometry, MeshStandardMaterial> | undefined = this._playerMemories[Math.min(this._playerStage, this._playerMemories.length - 1)];
    if (memory) {
      memory.material.color.setHex(INK[Math.max(0, Math.min(2, index))]);
      memory.material.emissive.setHex(INK[Math.max(0, Math.min(2, index))]);
      memory.material.emissiveIntensity = 0.72;
      memory.rotation.z = index === 0 ? 0 : index === 1 ? (this._playerStage % 2 === 0 ? 0.62 : -0.82) : 0.34 + this._playerStage * 0.38;
      memory.visible = true;
    }
    this._retunePlayer();
    this._choiceArmed = false;
    this._physics.deactivate();
  }

  private _retunePlayer(): void {
    if (!this._playerCore) return;
    const neutral: Color = new Color(0xbfd5df);
    const imprint: Color = new Color(0, 0, 0);
    this._choiceHistory.forEach((owner: number): void => { imprint.add(new Color(INK[owner])); });
    if (this._choiceHistory.length > 0) imprint.multiplyScalar(1 / this._choiceHistory.length);
    else imprint.copy(neutral);
    this._playerCore.material.color.copy(neutral).lerp(imprint, 0.38);
    this._playerCore.material.emissive.copy(imprint).multiplyScalar(0.32);
    this._playerCore.material.emissiveIntensity = 0.7 + this._choiceHistory.length * 0.13;
  }

  private _setVoiceResting(target: Vector3, index: number, era: number, seconds: number, still: boolean): void {
    const lane: number = this._width * 0.3;
    const breath: number = still ? 0 : Math.sin(seconds * (0.24 + index * 0.025) + index) * 0.22;
    if (era <= 1) {
      target.set((index - 1) * lane, 2.12 + breath, 0.12 + index * 0.16);
      return;
    }
    if (era === 2) {
      const order: number = index === 0 ? -1 : index === 1 ? 1 : 0;
      target.set(order * lane, 1.96 + (index === 2 ? 0.58 : 0) + breath, 0.18 + (2 - index) * 0.13);
      return;
    }
    if (era === 3) {
      const order: number = index === 0 ? 0 : index === 1 ? -1 : 1;
      target.set(order * lane, index === 0 ? 2.58 : 1.82 + breath, 0.1 + index * 0.15);
      return;
    }
    const order: number = index === 0 ? 1 : index === 1 ? -1 : 0;
    target.set(order * lane * 0.82, index === 2 ? 2.55 : 1.88 + breath, 0.12 + (index === 2 ? 0 : 0.2));
  }

  private _writePathSegment(owner: number, vertex: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
    const offset: number = vertex * 3;
    const positions: Float32Array = this._pathPositions[owner];
    positions[offset] = ax;
    positions[offset + 1] = ay;
    positions[offset + 2] = az;
    positions[offset + 3] = bx;
    positions[offset + 4] = by;
    positions[offset + 5] = bz;
    return vertex + 2;
  }

  private _samplePath(owner: number, t: number, from: Vector3, goal: Vector3, seconds: number, out: Vector3): Vector3 {
    const y: number = from.y + (goal.y - from.y) * t;
    if (owner === 0) {
      return out.set(from.x + (goal.x - from.x) * t, y, from.z + (goal.z - from.z) * t);
    }
    if (owner === 1) {
      const segment: number = Math.min(2, Math.floor(t * 3));
      const local: number = Math.min(1, t * 3 - segment);
      const x1: number = from.x - this._width * 0.055;
      const x2: number = goal.x + this._width * 0.045;
      const x: number = segment === 0
        ? from.x + (x1 - from.x) * local
        : segment === 1 ? x1 + (x2 - x1) * local : x2 + (goal.x - x2) * local;
      const steppedZ: number = from.z + (goal.z - from.z) * t - Math.floor(t * 4) * 0.035;
      return out.set(x, y, steppedZ);
    }
    const inverse: number = 1 - t;
    const direction: number = goal.x === from.x ? 1 : Math.sign(goal.x - from.x);
    const control1X: number = from.x + direction * this._width * 0.14;
    const control2X: number = goal.x - direction * this._width * 0.1;
    const x: number = inverse * inverse * inverse * from.x
      + 3 * inverse * inverse * t * control1X
      + 3 * inverse * t * t * control2X
      + t * t * t * goal.x;
    const desire: number = Math.sin(t * Math.PI) * (0.3 + Math.sin(seconds * 0.25) * 0.035);
    return out.set(x, y + desire * 0.18, from.z + (goal.z - from.z) * t + desire);
  }

  private _updatePath(isWaiting: boolean, isTravel: boolean, isThreshold: boolean, crossingProgress: number, seconds: number, callingVoice: number): void {
    const elapsedMs: number = seconds * 1000;
    for (let owner: number = 0; owner < 3; owner += 1) {
      const path: LineSegments<BufferGeometry, LineBasicMaterial> = this._paths[owner];
      const echo: LineSegments<BufferGeometry, LineBasicMaterial> = this._pathEchoes[owner];
      const activeTravel: boolean = isTravel && this._selected === owner;
      const activeCall: boolean = callingVoice === owner;
      const visible: boolean = activeCall || isWaiting || activeTravel || isThreshold;
      path.visible = visible;
      echo.visible = visible;
      this._pathLights[owner].visible = visible;
      if (!visible) {
        this._pathLights[owner].intensity = 0;
        continue;
      }
      if (isThreshold) {
        this._pathFrom.copy(this._voices[owner].position);
        this._pathGoal.set(0, -2.45 + crossingProgress * 2.58, 0.34 - crossingProgress * 3.28);
      } else {
        this._pathFrom.set(
          activeTravel ? (owner - 1) * this._width * 0.16 : 0,
          activeTravel ? -2.45 : -2.62,
          activeTravel ? 0.4 : 0.14,
        );
      }
      if (activeTravel) this._pathGoal.set(0, 2.62, -0.72);
      else {
        if (!isThreshold) {
          const target: Vector3 = this._targets[owner].position;
          this._pathGoal.set(target.x, target.y - 0.48, target.z - 0.58);
        }
      }
      const samples: number = owner === 0 ? 16 : owner === 1 ? 15 : 26;
      let vertex: number = 0;
      this._samplePath(owner, 0, this._pathFrom, this._pathGoal, seconds, this._pathPrevious);
      for (let sample: number = 1; sample <= samples; sample += 1) {
        const t: number = sample / samples;
        this._samplePath(owner, t, this._pathFrom, this._pathGoal, seconds, this._pathCurrent);
        vertex = this._writePathSegment(owner, vertex,
          this._pathPrevious.x, this._pathPrevious.y, this._pathPrevious.z,
          this._pathCurrent.x, this._pathCurrent.y, this._pathCurrent.z);
        if (sample % (owner === 1 ? 3 : 4) === 0 && vertex + 2 <= PATH_VERTEX_CAPACITY) {
          const dx: number = this._pathCurrent.x - this._pathPrevious.x;
          const dy: number = this._pathCurrent.y - this._pathPrevious.y;
          const length: number = Math.max(0.001, Math.hypot(dx, dy));
          const width: number = owner === 0 ? 0.11 : owner === 1 ? 0.075 : 0.095 + Math.sin(t * Math.PI) * 0.045;
          const px: number = -dy / length * width;
          const py: number = dx / length * width;
          vertex = this._writePathSegment(owner, vertex,
            this._pathCurrent.x - px, this._pathCurrent.y - py, this._pathCurrent.z,
            this._pathCurrent.x + px, this._pathCurrent.y + py, this._pathCurrent.z);
        }
        this._pathPrevious.copy(this._pathCurrent);
      }
      const appearedAt: number = this._voiceAppearedAt[owner];
      const callProgress: number = !activeCall || appearedAt < 0 ? 1 : Math.min(1, Math.max(0, (elapsedMs - appearedAt) / 2500));
      const revealedVertices: number = Math.max(0, Math.floor(vertex * callProgress / 2) * 2);
      const attribute: BufferAttribute = path.geometry.getAttribute('position') as BufferAttribute;
      attribute.needsUpdate = true;
      path.geometry.setDrawRange(0, revealedVertices);
      const hovered: boolean = isWaiting && this._hovered === owner;
      const resonance: number = this._choiceHistory.length === 0
        ? 0
        : this._choiceHistory.filter((choice: number): boolean => choice === owner).length / this._choiceHistory.length;
      const emphasis: number = activeCall || activeTravel || isThreshold ? 1 : hovered ? 0.78 : 0.34;
      path.material.opacity = ((0.16 + emphasis * 0.42) + resonance * 0.1) * (owner === 1 ? 0.82 : 1);
      echo.material.opacity = emphasis * (owner === 2 ? 0.34 : owner === 1 ? 0.22 : 0.12) + resonance * 0.16;
      const lightProgress: number = isThreshold
        ? Math.min(1, 0.22 + crossingProgress * 0.78)
        : activeCall ? callProgress : hovered || activeTravel ? (Math.sin(seconds * 0.72) * 0.5 + 0.5) : 0;
      this._samplePath(owner, lightProgress, this._pathFrom, this._pathGoal, seconds, this._pathCurrent);
      this._pathLights[owner].position.copy(this._pathCurrent);
      this._pathLights[owner].position.z += 0.36;
      this._pathLights[owner].intensity = emphasis * (isThreshold ? 6.4 : activeCall ? 7.5 : hovered || activeTravel ? 4.2 : 0.45);
    }
  }

  public update(elapsedMs: number, isReduced: boolean): number {
    const frame: BootFrame | null = this._frame;
    if (!frame || !this._cursor) return -1;
    const seconds: number = elapsedMs / 1000;
    const delta: number = this._lastUpdateMs === 0 ? 0 : Math.min(0.1, Math.max(0, (elapsedMs - this._lastUpdateMs) / 1000));
    this._lastUpdateMs = elapsedMs;
    const isWaiting: boolean = frame.phase === 'waiting';
    const isBoot: boolean = frame.phase === 'cursor' || frame.phase === 'command';
    const isTravel: boolean = frame.phase === 'travel';
    const isStory: boolean = frame.phase !== 'cursor' && frame.phase !== 'command' && frame.phase !== 'loading' && frame.phase !== 'writing';
    const isThreshold: boolean = frame.phase === 'final' || frame.phase === 'doorway' || frame.phase === 'complete';
    const isCrossing: boolean = frame.phase === 'complete';
    const crossingProgress: number = isCrossing ? Math.min(1, Math.max(0, (frame.phaseElapsedMs ?? 0) / 2800)) : 0;
    const isSettled: boolean = isWaiting || isThreshold;
    const phaseChanged: boolean = frame.phase !== this._lastPhase;
    if (phaseChanged) {
      if (frame.phase === 'command' && this._backgroundStartedAt < 0) this._backgroundStartedAt = elapsedMs;
      if (isWaiting) {
        this._player.position.set(0, -2.55, 0.52);
        this._choiceArmed = true;
        this._journeyActive = false;
        this._selected = -1;
      }
      if (frame.phase === 'doorway') this._player.position.set(0, -2.45, 0.52);
      if (isTravel && !this._journeyActive) this.beginJourney();
      this._lastPhase = frame.phase;
    }
    const disorder: number = isReduced || isSettled ? 0 : frame.isCorrupt ? 1.2 : 0.18;
    const left: number = -this._width * 0.47;
    const scale: number = this._width / (this._isNarrow ? 24 : 32);
    const panelX: number = isSettled ? 0 : left * 0.22;
    const panelY: number = isThreshold ? -0.15 : 0.15;
    const panelWidth: number = this._width * (isSettled ? 1.06 : 0.76) * 0.5;
    const panelHeight: number = (isThreshold ? 6.25 : isWaiting ? 5.3 : frame.phase === 'loading' ? 2.4 : 4.3) * 0.5;
    const panelRx: number = isReduced || isSettled ? 0 : 0.2;
    const panelRy: number = isReduced || isSettled ? 0 : (frame.format - 1) * 0.32;
    const panelRz: number = isReduced || isSettled ? 0 : -0.055;
    this._particles.setPanelTransform(panelX, panelY, -0.45, panelWidth, panelHeight, panelRx, panelRy, panelRz);
    // Ordinary questions live directly in the celestial volume. The black
    // particle surface belongs only to the final threshold payoff.
    const formation: number = isThreshold ? 1 : 0;
    const disintegrate: number = isCrossing ? crossingProgress : frame.phase === 'doorway' ? 0.06 : 0;
    const starReveal: number = isStory || isWaiting
      ? 1
      : this._backgroundStartedAt < 0 ? 0 : isReduced ? 1 : Math.min(1, (elapsedMs - this._backgroundStartedAt) / 5200);
    this._particles.update(elapsedMs, { formation, disintegrate, era: frame.format, starReveal, reduced: isReduced });
    for (let index: number = 0; index < this._ribbons.length; index += 1) {
      const ribbon: GlyphRibbon = this._ribbons[index];
      ribbon.root.visible = true;
      ribbon.root.rotation.set(0, 0, 0);
      ribbon.root.scale.setScalar(scale);
      ribbon.root.position.set(left, 1.8 - index * 0.4, 0.15);
      ribbon.update(seconds, index === 5 || index === 0 ? disorder : disorder * 0.25);
    }
    const command: Group = this._ribbons[0].root;
    command.visible = frame.phase === 'cursor' || frame.phase === 'command' || frame.phase === 'loading' || frame.phase === 'writing';
    command.position.set(isBoot ? -this._width * 0.18 : left, isBoot ? 0.42 : 2.35, isBoot ? 1.18 : 0);
    command.scale.setScalar(scale * (isBoot ? 0.48 : 0.62));
    if (!isReduced && !isWaiting) {
      command.position.x += Math.sin(seconds * 0.19) * (isBoot ? 0.22 : 0.08);
      command.position.y += Math.sin(seconds * 0.31) * (isBoot ? 0.16 : 0.08);
      command.position.z += Math.cos(seconds * 0.23) * (isBoot ? 0.16 : 0.04);
      command.rotation.y = Math.sin(seconds * 0.23) * BOOT_EFFECTS.planeSkew * (isBoot ? 0.48 : 0.18);
      command.rotation.z = Math.sin(seconds * 0.17) * (isBoot ? 0.025 : 0.008);
    }
    this._voiceStarts[0].set(-this._width * 0.82, 3.25, -0.7);
    this._voiceStarts[1].set(this._width * 0.9, 2.75, -0.3);
    this._voiceStarts[2].set(-this._width * 0.9, -2.7, -0.5);
    const loadedVoices: boolean[] = [0, 1, 2].map((index: number): boolean => frame.transcript.includes(`dreamweaver[0${index + 1}]`));
    const newestVoice: number = loadedVoices.lastIndexOf(true);
    for (let index: number = 0; index < 3; index += 1) {
      const slot: Group = this._ribbons[index + 1].root;
      const isLoaded: boolean = loadedVoices[index];
      slot.visible = (frame.phase === 'loading' || frame.phase === 'writing') && isLoaded;
      slot.scale.setScalar(scale * 0.55);
      slot.position.set(left + 0.35 + (isReduced ? 0 : index * 0.22), 1.5 - index * 0.4, isReduced ? 0 : index * 0.3);
      if (!isReduced) slot.rotation.y = (index - 1) * 0.24;
      const voice: Group = this._voices[index];
      const trail: Line<BufferGeometry, LineBasicMaterial> = this._trails[index];
      const breach: boolean = frame.phase === 'loading' && isLoaded;
      const voiceVisible: boolean = breach || isStory || this._voice === index;
      const trailVisible: boolean = breach || isStory || this._voice === index;
      if (voiceVisible && this._voiceAppearedAt[index] < 0) this._voiceAppearedAt[index] = elapsedMs;
      voice.visible = voiceVisible;
      trail.visible = trailVisible;
      const entrance: number = isReduced ? 1 : Math.min(Math.max((elapsedMs - this._voiceAppearedAt[index]) / 2800, 0), 1);
      const smoothEntrance: number = entrance * entrance * (3 - 2 * entrance);
      const start: Vector3 = this._voiceStarts[index];
      const resting: Vector3 = this._voiceResting[index];
      const isSpeaking: boolean = (frame.phase === 'response' && (frame.speaker ?? this._selected) === index) || (this._voice === index && elapsedMs - this._asideAt < ASIDE_HOLD_MS);
      const isNewestArrival: boolean = frame.phase === 'loading' && newestVoice === index;
      this._setVoiceResting(resting, index, frame.format, seconds, isReduced || isWaiting || (isSpeaking && index === 0));
      const finalProgress: number = frame.phase === 'final'
        ? Math.min(Math.max((frame.phaseElapsedMs ?? 0) / 9200, 0), 1)
        : frame.phase === 'doorway' || frame.phase === 'complete' ? 1 : 0;
      if (isThreshold) {
        resting.x *= 1 - finalProgress;
        resting.y = resting.y * (1 - finalProgress) + 0.12 * finalProgress;
        resting.z -= finalProgress * 2.4;
      }
      if (isReduced) voice.position.copy(resting);
      else if (smoothEntrance < 0.999) voice.position.copy(start).lerp(resting, smoothEntrance);
      else voice.position.lerp(resting, Math.min(1, delta * (isTravel ? 0.78 : 1.45)));
      if (index === 0) voice.rotation.set(0, 0, isReduced || isWaiting || isSpeaking ? 0 : Math.sin(seconds * 0.2) * 0.025);
      if (index === 1) voice.rotation.set(0, 0, isReduced || isWaiting ? -0.12 : (Math.floor(seconds * 0.6) % 5 - 2) * 0.08);
      if (index === 2) voice.rotation.set(0, 0, isReduced || isWaiting ? 0.08 : seconds * 0.16);
      const speakingPulse: number = isReduced ? 1 : 1 + Math.sin(seconds * 5.4) * 0.1;
      voice.scale.setScalar(isSpeaking ? 1.45 * speakingPulse : isNewestArrival ? 1.12 * speakingPulse : 1);
      if (isThreshold) voice.scale.multiplyScalar(1 - finalProgress * 0.74);
      const observerFade: number = frame.phase === 'loading' && index < newestVoice ? 0.42 : 1;
      this._voiceMaterials[index][0].opacity = (isSpeaking ? 1 : 0.88) * observerFade;
      this._voiceMaterials[index][1].opacity = (isSpeaking ? 0.48 : 0.16) * observerFade;
      this._voiceMaterials[index][2].opacity = (isSpeaking ? 1 : 0.72) * observerFade;
      this._voiceMaterials[index][3].opacity = (isSpeaking ? 0.58 : index === 1 ? 0.08 : 0.28) * observerFade;
      if (this._voiceMaterials[index][4]) this._voiceMaterials[index][4].opacity = isSpeaking ? 0.82 : 0.18;
      const trailPositions: BufferAttribute = trail.geometry.getAttribute('position') as BufferAttribute;
      for (let pointIndex: number = 0; pointIndex < 72; pointIndex += 1) {
        const t: number = pointIndex / 71;
        const point: Vector3 = this._trailPoint.copy(start).lerp(voice.position, t);
        if (index === 0) {
          point.z -= (1 - t) * 0.35;
        } else {
          const breath: number = Math.sin(t * Math.PI * (2.4 + index * 0.4) + seconds * (0.18 + index * 0.035) + index * 1.7);
          point.y += breath * (1 - t) * (0.34 + index * 0.08);
          point.x += Math.cos(t * 8 + seconds * 0.11 + index) * (1 - t) * 0.18;
          point.z -= (1 - t) * 0.35 + Math.sin(t * 5 + index) * 0.08;
        }
        trailPositions.setXYZ(pointIndex, point.x, point.y, point.z);
      }
      trailPositions.needsUpdate = true;
      trail.material.opacity = (0.12 + smoothEntrance * (isNewestArrival ? 0.48 : 0.24)) * observerFade * (isThreshold ? 1 - finalProgress * 0.55 : 1);
    }
    this._ribbons[4].root.visible = !isBoot && !isThreshold && !isTravel;
    this._ribbons[4].root.scale.setScalar(scale * 0.37);
    this._ribbons[4].root.position.set(left, 1.65, -0.05);
    const question: Group = this._ribbons[5].root;
    question.visible = frame.question.length > 0;
    const responseOwner: number = frame.phase === 'response' ? Math.max(0, frame.speaker ?? this._selected) : -1;
    const responseAnchor: Vector3 | null = responseOwner >= 0 ? this._voices[responseOwner].position : null;
    question.position.set(
      responseAnchor ? responseAnchor.x - this._width * (this._isNarrow ? 0.16 : 0.19) : left,
      isThreshold ? 2.55 : responseAnchor ? responseAnchor.y - 0.96 : isWaiting ? 0.68 : -0.8 + Math.min(Math.max((seconds - 13) / 16, 0), 1) * 1.45,
      responseAnchor ? responseAnchor.z + 0.14 : 0.25,
    );
    question.scale.setScalar(isThreshold ? scale * (this._isNarrow ? 0.62 : 0.68) : responseAnchor ? scale * 0.52 : scale);
    if (responseOwner === 0) question.rotation.set(0, 0, 0);
    if (responseOwner === 1) question.rotation.set(-0.08, -0.14, 0.025);
    if (responseOwner === 2) question.rotation.set(-0.16, 0.18, -0.035);
    if (!isReduced && !isSettled && responseOwner !== 0) {
      question.position.x += Math.sin(seconds * 0.16) * 0.3;
      question.position.z += Math.sin(seconds * 0.25) * BOOT_EFFECTS.depthDrift * 2.5;
      if (responseOwner < 0) question.rotation.set(-0.3, (frame.format - 1) * BOOT_EFFECTS.planeSkew * 0.65 + Math.sin(seconds * 0.2) * 0.15, (frame.format - 1) * 0.055);
    }
    const symbols: Group = this._ribbons[6].root;
    symbols.visible = frame.prelude.includes(BOOT_SYMBOLS) && !isThreshold;
    symbols.position.set(left, -2.35, 0);
    symbols.scale.setScalar(scale * 1.05);
    const aside: Group = this._ribbons[7].root;
    aside.visible = Boolean(frame.hint) || (this._voice >= 0 && !isWaiting && elapsedMs - this._asideAt < ASIDE_HOLD_MS);
    aside.position.set(left + this._width * 0.04, -1.85, 0.5);
    aside.scale.setScalar(scale * 0.72);
    aside.rotation.z = isReduced ? 0 : (this._voice - 1) * 0.025;
    for (let index: number = 0; index < 3; index += 1) {
      const choice: Group = this._ribbons[index + 8].root;
      choice.visible = isWaiting;
      const voicePosition: Vector3 = this._voices[index].position;
      choice.scale.setScalar(scale * (this._isNarrow ? 0.37 : 0.39));
      if (index === 0) choice.rotation.set(0, 0, 0);
      else choice.rotation.set(index === 1 ? -0.18 : -0.28, (index - 1) * 0.16, (index - 1) * 0.018);
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = this._targets[index];
      target.visible = isWaiting;
      target.position.set(voicePosition.x, voicePosition.y - 1.22, 0.18);
      target.scale.set(this._width * 0.29, 1.12, 1);
      target.material.opacity = 0;
      this._pathFrom.set(0, -2.62, 0.14);
      this._pathGoal.set(target.position.x, target.position.y - 0.48, target.position.z - 0.58);
      this._samplePath(index, 0.64, this._pathFrom, this._pathGoal, seconds, this._pathCurrent);
      choice.position.set(
        this._pathCurrent.x - this._width * (this._isNarrow ? 0.1 : 0.13),
        this._pathCurrent.y + 0.12,
        this._pathCurrent.z + 0.22,
      );
      if (this._hovered === index) choice.position.y += scale * 0.12;
      const speaker: Group = this._ribbons[14 + index].root;
      speaker.visible = isWaiting || (frame.phase === 'response' && (frame.speaker ?? this._selected) === index);
      speaker.position.set(voicePosition.x - 0.48, voicePosition.y - 0.46, voicePosition.z + 0.04);
      speaker.scale.setScalar(scale * 0.28);
      speaker.rotation.set(0, 0, index === 1 ? -0.04 : index === 2 ? 0.04 : 0);
      this._physicsTargets[index].x = target.position.x;
      this._physicsTargets[index].y = target.position.y - 0.46;
      this._physicsTargets[index].z = 0.18;
    }
    if (isWaiting) {
      if (phaseChanged) this._physics.activateAnswers(this._physicsTargets, { x: 0, y: -2.55, z: 0.52 });
      else this._physics.syncAnswerTargets(this._physicsTargets);
    }
    for (let index: number = 0; index < 3; index += 1) {
      const fossil: Group = this._ribbons[11 + index].root;
      fossil.visible = isStory && !isThreshold && Boolean(this._fossils[index]);
      if (isTravel) {
        fossil.position.set(-this._width * 0.18 + index * this._width * 0.12, -1.48 + index * 0.72, -0.08 - index * 0.16);
        fossil.scale.setScalar(scale * (0.31 - index * 0.035));
        fossil.rotation.set(-0.62 - index * 0.06, (index - 1) * 0.14, (index - 1) * 0.02);
      } else {
        fossil.position.set(left + 0.18 * index, -2.55 - index * 0.26, -0.75 - index * 0.34);
        fossil.scale.setScalar(scale * (0.34 - index * 0.045));
        fossil.rotation.set(-0.1 - index * 0.05, (index - 1) * 0.12, (index - 1) * 0.012);
      }
      fossil.updateMatrix();
    }
    this._updatePath(isWaiting, isTravel, isThreshold, crossingProgress, seconds, frame.phase === 'loading' ? newestVoice : -1);
    this._player.visible = isStory && frame.phase !== 'final';
    let spatialEvent: number = -1;
    if (this._player.visible) {
      if (!isReduced) {
        this._player.rotation.y = Math.sin(seconds * 0.6) * (0.12 + this._playerStage * 0.025);
        this._player.rotation.z = Math.sin(seconds * 0.43) * 0.035;
      } else {
        this._player.rotation.set(0, 0, 0);
      }
      if (isWaiting) {
        const speed: number = 1.75 + this._playerStage * 0.12;
        const physicsStep: IntroPhysicsStep = this._physics.step(delta, this._movement.x, this._movement.y, speed, {
          minX: -this._width * 0.43, maxX: this._width * 0.43, minY: -2.65, maxY: 1.62,
        });
        let nearest: number = 0;
        let nearestDistance: number = Number.POSITIVE_INFINITY;
        for (let index: number = 0; index < 3; index += 1) {
          const dx: number = Math.abs(physicsStep.position.x - this._targets[index].position.x);
          if (dx < nearestDistance) { nearest = index; nearestDistance = dx; }
        }
        this._hovered = nearest;
        const target: Vector3 = this._targets[nearest].position;
        const progress: number = Math.min(1, Math.max(0, (physicsStep.position.y + 2.65) / 4.27));
        const lockRaw: number = Math.min(1, Math.max(0, (progress - 0.08) / 0.42));
        const laneLock: number = lockRaw * lockRaw * (3 - 2 * lockRaw);
        this._pathFrom.set(0, -2.65, 0.34);
        this._pathGoal.set(target.x, target.y - 0.48, target.z - 0.58);
        this._samplePath(nearest, progress, this._pathFrom, this._pathGoal, seconds, this._pathCurrent);
        this._player.position.set(
          physicsStep.position.x * (1 - laneLock) + this._pathCurrent.x * laneLock,
          physicsStep.position.y,
          physicsStep.position.z * (1 - laneLock) + (this._pathCurrent.z + 0.18) * laneLock,
        );
        if (this._choiceArmed && physicsStep.sensor >= 0 && physicsStep.sensor < 3) {
          this._choiceArmed = false;
          spatialEvent = physicsStep.sensor;
        }
      } else if (isTravel) {
        const travelSpeed: number = 1.82 + this._playerStage * 0.14;
        const physicsStep: IntroPhysicsStep = this._physics.step(delta, 0, this._movement.y, travelSpeed, {
          minX: -this._width * 0.28, maxX: this._width * 0.28, minY: -2.45, maxY: 2.62,
        });
        const progress: number = Math.min(1, Math.max(0, (physicsStep.position.y + 2.45) / 5.07));
        this._pathFrom.set((this._selected - 1) * this._width * 0.16, -2.45, 0.4);
        this._pathGoal.set(0, 2.62, -0.72);
        this._samplePath(Math.max(0, this._selected), progress, this._pathFrom, this._pathGoal, seconds, this._pathCurrent);
        this._player.position.copy(this._pathCurrent);
        this._player.position.z += 0.18;
        if (!this._journeyComplete && physicsStep.sensor === INTRO_JOURNEY_SENSOR_INDEX) {
          this._journeyComplete = true;
          spatialEvent = -2;
        }
      } else if (frame.phase === 'doorway') {
        this._player.position.set(0, -2.45, 0.52);
      } else if (isCrossing) {
        const eased: number = crossingProgress * crossingProgress * (3 - 2 * crossingProgress);
        this._player.position.set(0, -2.45 + eased * 2.58, 0.52 - eased * 3.46);
      }
      const pulse: number = (isReduced ? 1 : 1 + Math.sin(seconds * 4.2) * 0.045) * (isCrossing ? 1 - crossingProgress * 0.72 : 1);
      this._player.scale.setScalar(pulse);
    }
    this._cursor.visible = !isWaiting && frame.phase !== 'complete' && (isReduced || elapsedMs % CURSOR_PERIOD_MS < 690);
    this._cursor.position.copy(isBoot ? command.position : question.visible ? question.position : this._ribbons[3].root.position);
    const cursorLines: string[] = (isBoot ? frame.transcript : frame.question).split('\n');
    const lastLine: string = cursorLines.at(-1) ?? '';
    this._cursor.position.x += Math.min(lastLine.length, this._isNarrow ? 28 : 41) * 0.64 * scale * (isBoot ? 0.48 : responseAnchor ? 0.52 : 1);
    this._cursor.position.y += scale * 0.45;
    this._cursor.position.y -= Math.max(0, cursorLines.length - 1) * scale * 1.35 * (isBoot ? 0.48 : responseAnchor ? 0.52 : 1);
    this._cursor.position.z += 0.1;
    this._cursor.rotation.set(0, isReduced ? 0 : Math.sin(seconds * 0.45) * 0.55, isReduced ? 0 : Math.sin(seconds * 0.3) * 0.1);
    const cursorScale: number = isBoot ? 0.48 : responseAnchor ? 0.58 : 1;
    this._cursor.scale.set((frame.format === 1 ? 0.14 : 1) * cursorScale, (frame.format === 2 ? 0.14 : 1) * cursorScale, cursorScale);
    this._cursor.material.color.setHex(responseOwner >= 0 ? INK[responseOwner] : INK[0]);
    return spatialEvent;
  }

  public destroy(): void {
    this._root.removeFromParent();
    this._ribbons.forEach((ribbon: GlyphRibbon): void => ribbon.destroy());
    this._atlases.forEach((texture: CanvasTexture): void => texture.dispose());
    this._particles.destroy();
    this._physics.destroy();
    this._cursor?.geometry.dispose();
    this._cursor?.material.dispose();
    this._targets.forEach((mesh: Mesh<BoxGeometry, MeshBasicMaterial>): void => { mesh.geometry.dispose(); mesh.material.dispose(); });
    this._voices.forEach((voice: Group): void => {
      voice.traverse((child): void => {
        if (!(child instanceof Line) && !(child instanceof Mesh)) return;
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) material.forEach((entry): void => entry.dispose());
        else material.dispose();
      });
    });
    this._playerCore?.geometry.dispose();
    this._playerCore?.material.dispose();
    this._playerOutline?.geometry.dispose();
    this._playerOutline?.material.dispose();
    this._playerMemories.forEach((memory: Mesh<BoxGeometry, MeshStandardMaterial>): void => {
      memory.geometry.dispose();
      memory.material.dispose();
    });
    this._paths.forEach((path: LineSegments<BufferGeometry, LineBasicMaterial>): void => {
      path.geometry.dispose();
      path.material.dispose();
    });
    this._pathEchoes.forEach((echo: LineSegments<BufferGeometry, LineBasicMaterial>): void => echo.material.dispose());
    this._trails.forEach((trail: Line<BufferGeometry, LineBasicMaterial>): void => {
      trail.geometry.dispose();
      trail.material.dispose();
    });
  }
}

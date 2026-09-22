import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";

import { BOOT_OPTIONS, BOOT_SYMBOLS, type BootFrame } from "./ghostwriting";
import { IntroParticleField } from "./IntroParticleField";

// Recorded first draw (seed 472): UI pixel-font-step .619, gameplay depth-drift
// .472, stack plane-skew .716. Deliberately independent, bounded experiments.
export const BOOT_EFFECTS = {
  pixelStep: 0.619,
  depthDrift: 0.472,
  planeSkew: 0.716,
};
const GLYPHS: string =
  Array.from({ length: 95 }, (_: unknown, index: number): string =>
    String.fromCharCode(index + 32)
  ).join("") + "∞◊Ω≋※—↑↓↵";
const ATLAS_COLUMNS: number = 16;
const ATLAS_ROWS: number = 7;
const GLYPH_CAPACITY: number = 256;
const INK: number[] = [0xdce7e8, 0xd7bb85, 0xcc606b];
const ASIDES: string[] = [
  "They've already tried that.",
  "Still looking for the beginning.",
  "Let them try.",
];
const CURSOR_PERIOD_MS: number = 1150;
const ASIDE_HOLD_MS: number = 4300;
const VOICE_COOLDOWN_MS: number = 2500;

/** One reusable glyph atlas per historical font, never a texture per letter. */
function createAtlas(format: number): CanvasTexture {
  const cellSizes: number[] = [
    Math.round(24 * BOOT_EFFECTS.pixelStep),
    24,
    36,
    48,
    64,
  ];
  const cell: number = cellSizes[format];
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = ATLAS_COLUMNS * cell;
  canvas.height = ATLAS_ROWS * cell;
  const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  if (!context) throw new Error("Cannot create glyph assets");
  const families: string[] = [
    "monospace",
    '"Lucida Console", monospace',
    '"Courier New", monospace',
    "Consolas, monospace",
    "ui-monospace, monospace",
  ];
  context.font = `${format === 2 ? 700 : 400} ${Math.floor(cell * 0.77)}px ${families[format]}`;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let index: number = 0; index < GLYPHS.length; index += 1) {
    context.fillText(
      GLYPHS[index],
      ((index % ATLAS_COLUMNS) + 0.5) * cell,
      (Math.floor(index / ATLAS_COLUMNS) + 0.5) * cell,
      cell
    );
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
  private _front: MeshBasicMaterial;
  private _back: MeshBasicMaterial;
  private _text: string = "";
  private _columns: number = 40;
  private _format: number = 0;
  private _atlases: CanvasTexture[];

  constructor(atlases: CanvasTexture[]) {
    this._atlases = atlases;
    this._front = new MeshBasicMaterial({
      map: atlases[0],
      color: INK[0],
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      side: DoubleSide,
    });
    this._back = this._front.clone();
    this._back.color.setHex(0x395057);
  }

  public init(): void {
    const indices: number[] = [];
    for (let index: number = 0; index < GLYPH_CAPACITY; index += 1) {
      const vertex: number = index * 4;
      indices.push(
        vertex,
        vertex + 1,
        vertex + 2,
        vertex,
        vertex + 2,
        vertex + 3
      );
    }
    this._geometry.setAttribute(
      "position",
      new BufferAttribute(this._positions, 3)
    );
    this._geometry.setAttribute("uv", new BufferAttribute(this._uvs, 2));
    this._geometry.setIndex(indices);
    this._geometry.setDrawRange(0, 0);
    const front: Mesh = new Mesh(this._geometry, this._front);
    const back: Mesh = new Mesh(this._geometry, this._back);
    front.frustumCulled = false;
    back.frustumCulled = false;
    back.position.set(0.045, -0.025, -0.08);
    this.root.add(back, front);
  }

  public setText(
    text: string,
    format: number,
    columns: number,
    color: number = INK[0]
  ): void {
    format = Math.max(0, Math.min(this._atlases.length - 1, format));
    this._front.color.setHex(color);
    if (
      this._text === text &&
      this._format === format &&
      this._columns === columns
    )
      return;
    this._text = text;
    this._format = format;
    this._columns = columns;
    this._front.map = this._atlases[format];
    this._back.map = this._atlases[format];
    let glyph: number = 0;
    for (const letter of text) {
      if (letter === "\n" || glyph >= GLYPH_CAPACITY) continue;
      const index: number = Math.max(0, GLYPHS.indexOf(letter));
      const x: number = (index % ATLAS_COLUMNS) / ATLAS_COLUMNS;
      const y: number =
        1 - (Math.floor(index / ATLAS_COLUMNS) + 1) / ATLAS_ROWS;
      this._uvs.set(
        [
          x,
          y,
          x + 1 / ATLAS_COLUMNS,
          y,
          x + 1 / ATLAS_COLUMNS,
          y + 1 / ATLAS_ROWS,
          x,
          y + 1 / ATLAS_ROWS,
        ],
        glyph * 8
      );
      glyph += 1;
    }
    this._geometry.attributes.uv.needsUpdate = true;
    this._geometry.setDrawRange(0, glyph * 6);
  }

  public update(seconds: number, disorder: number): void {
    let column: number = 0;
    let row: number = 0;
    let glyph: number = 0;
    for (const letter of this._text) {
      if (letter === "\n") {
        row += 1;
        column = 0;
        continue;
      }
      if (glyph >= GLYPH_CAPACITY) break;
      if (column >= this._columns) {
        row += 1;
        column = 0;
      }
      const x: number = column * 0.64;
      const y: number = -row * 1.35;
      const drift: number = Math.sin(seconds * 0.32 + glyph * 0.21) * disorder;
      const eraDepth: number[] = [0.5, 0.8, 1.25, 1.8, 2.6];
      const z: number =
        Math.sin(glyph * 0.71 + seconds * 0.2) *
        disorder *
        BOOT_EFFECTS.depthDrift *
        3 *
        eraDepth[this._format];
      const skew: number =
        Math.cos(glyph * 0.37) * disorder * BOOT_EFFECTS.planeSkew;
      this._positions.set(
        [
          x,
          y + drift,
          z,
          x + 1,
          y + drift,
          z,
          x + 1 + skew,
          y + 1 + drift,
          z,
          x + skew,
          y + 1 + drift,
          z,
        ],
        glyph * 12
      );
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
  private _voices: Mesh<TorusGeometry, MeshBasicMaterial>[] = [];
  private _trails: Line<BufferGeometry, LineBasicMaterial>[] = [];
  private _voiceAppearedAt: number[] = [-1, -1, -1];
  private _targets: Mesh<BoxGeometry, MeshBasicMaterial>[] = [];
  private _frame: BootFrame | null = null;
  private _width: number = 8;
  private _isNarrow: boolean = false;
  private _voice: number = -1;
  private _asideAt: number = -10000;
  private _aside: string = "";
  private _selected: number = -1;
  private _hovered: number = -1;
  private _pointer: Vector2 = new Vector2();
  private _raycaster: Raycaster = new Raycaster();
  private _fossils: Array<{ text: string; era: number; color: number }> = [];

  public init(scene: Scene): void {
    this._atlases = [0, 1, 2, 3, 4].map(createAtlas);
    this._particles.init(this._root);
    // command, three boot slots, archive, question, symbols, aside, three choices, three fossils
    for (let index: number = 0; index < 14; index += 1) {
      const ribbon: GlyphRibbon = new GlyphRibbon(this._atlases);
      ribbon.init();
      this._ribbons.push(ribbon);
      this._root.add(ribbon.root);
    }
    this._cursor = new Mesh(
      new BoxGeometry(0.13, 0.24, 0.09),
      new MeshBasicMaterial({ color: INK[0] })
    );
    this._root.add(this._cursor);
    for (let index: number = 0; index < 3; index += 1) {
      const voice: Mesh<TorusGeometry, MeshBasicMaterial> = new Mesh(
        new TorusGeometry(
          0.27,
          0.025,
          4,
          index === 2 ? 3 : index === 1 ? 5 : 32
        ),
        new MeshBasicMaterial({
          color: INK[index],
          transparent: true,
          opacity: 0.9,
          toneMapped: false,
        })
      );
      this._voices.push(voice);
      this._root.add(voice);
      const trailGeometry: BufferGeometry = new BufferGeometry();
      trailGeometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(72 * 3), 3)
      );
      const trailMaterial: LineBasicMaterial = new LineBasicMaterial({
        color: INK[index],
        transparent: true,
        opacity: 0.42,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const trail: Line<BufferGeometry, LineBasicMaterial> = new Line(
        trailGeometry,
        trailMaterial
      );
      trail.frustumCulled = false;
      this._trails.push(trail);
      this._root.add(trail);
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = new Mesh(
        new BoxGeometry(1, 1, 0.03),
        new MeshBasicMaterial({
          color: INK[index],
          transparent: true,
          opacity: 0.04,
          depthWrite: false,
        })
      );
      target.name = String(index);
      this._targets.push(target);
      this._root.add(target);
    }
    scene.add(this._root);
  }

  public resize(aspect: number): void {
    this._isNarrow = aspect < 1;
    this._width = Math.min(8, 5.5 * aspect);
    if (this._frame) this.setFrame(this._frame);
  }

  public setFrame(frame: BootFrame): void {
    this._frame = frame;
    const columns: number =
      frame.phase === "final" || frame.phase === "complete"
        ? this._isNarrow
          ? 32
          : 52
        : this._isNarrow
          ? 29
          : 42;
    this._ribbons[0].setText(
      frame.transcript.split("\n")[0],
      frame.format,
      columns
    );
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[index + 1].setText(
        frame.transcript.split("\n")[index + 1] ?? "",
        index,
        columns,
        INK[index]
      );
    }
    this._ribbons[4].setText(
      frame.prelude,
      0,
      this._isNarrow ? 40 : 78,
      0x7e9399
    );
    this._ribbons[5].setText(frame.question, frame.format, columns);
    this._ribbons[6].setText(BOOT_SYMBOLS, 2, columns, 0x9ca5a8);
    const asideText: string = frame.hint ?? this._aside;
    const asideVoice: number = frame.hint
      ? Math.max(0, Math.min(4, frame.format))
      : Math.max(this._voice, 0);
    this._ribbons[7].setText(
      asideText,
      asideVoice,
      this._isNarrow ? 30 : 42,
      frame.hint ? 0x9ca5a8 : INK[Math.max(this._voice, 0)]
    );
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[8 + index].setText(
        `${index + 1}  ${frame.choices[index] ?? BOOT_OPTIONS[index]}`,
        Math.max(index, frame.format - 1),
        this._isNarrow ? 34 : 62,
        INK[index]
      );
    }
    for (let index: number = 0; index < 3; index += 1) {
      const fossil = this._fossils[index];
      this._ribbons[11 + index].setText(
        fossil?.text ?? "",
        fossil?.era ?? 0,
        this._isNarrow ? 34 : 62,
        fossil?.color ?? INK[index]
      );
    }
  }

  public interrupt(elapsedMs: number): string | null {
    if (
      !this._frame ||
      this._frame.phase === "waiting" ||
      elapsedMs - this._asideAt < VOICE_COOLDOWN_MS
    )
      return null;
    this._voice = (this._voice + 1) % 3;
    this._asideAt = elapsedMs;
    this._aside = ASIDES[this._voice];
    this.setFrame(this._frame);
    return this._aside;
  }

  public getVoice(): number {
    return this._voice;
  }

  public getPlayerPosition(index: number = this._selected): {
    x: number;
    y: number;
    z: number;
  } {
    const selectedTarget: Mesh<BoxGeometry, MeshBasicMaterial> | undefined =
      index >= 0 ? this._targets[index] : undefined;
    const position: Vector3 | undefined =
      selectedTarget?.position ?? this._cursor?.position;
    return position
      ? { x: position.x, y: position.y, z: position.z }
      : { x: 0, y: 0, z: 0 };
  }

  public select(index: number): void {
    if (index >= 0 && index !== this._selected) this._particles.pulse(index);
    this._selected = index;
  }

  public getParticleDiagnostics(): {
    lightParticles: number;
    darkParticles: number;
    drawCalls: number;
    surfaceFormation: number;
  } {
    return this._particles.getDiagnostics();
  }

  public archive(text: string, era: number, owner: number): void {
    this._fossils.unshift({
      text,
      era,
      color: INK[Math.max(0, Math.min(2, owner))],
    });
    this._fossils.length = Math.min(this._fossils.length, 3);
    if (this._frame) this.setFrame(this._frame);
  }

  public pick(
    clientX: number,
    clientY: number,
    camera: PerspectiveCamera
  ): number {
    if (this._frame?.phase !== "waiting") return -1;
    this._pointer.set(
      (clientX / window.innerWidth) * 2 - 1,
      1 - (clientY / window.innerHeight) * 2
    );
    this._raycaster.setFromCamera(this._pointer, camera);
    const hit = this._raycaster.intersectObjects(this._targets, false)[0];
    return hit ? Number(hit.object.name) : -1;
  }

  public hover(index: number): void {
    this._hovered = index;
  }

  public reset(): void {
    this._voice = -1;
    this._aside = "";
    this._asideAt = -10000;
    this._selected = -1;
    this._hovered = -1;
    this._voiceAppearedAt = [-1, -1, -1];
    this._fossils = [];
    this._particles.reset();
  }

  public update(elapsedMs: number, isReduced: boolean): void {
    const frame: BootFrame | null = this._frame;
    if (!frame || !this._cursor) return;
    const seconds: number = elapsedMs / 1000;
    const isWaiting: boolean = frame.phase === "waiting";
    const isBoot: boolean =
      frame.phase === "cursor" || frame.phase === "command";
    const isStory: boolean = [
      "waiting",
      "prelude",
      "response",
      "final",
      "complete",
    ].includes(frame.phase);
    const isFinal: boolean =
      frame.phase === "final" || frame.phase === "complete";
    const isSettled: boolean = isWaiting || isFinal;
    const disorder: number =
      isReduced || isSettled ? 0 : frame.isCorrupt ? 1.2 : 0.65;
    const left: number = -this._width * 0.47;
    const scale: number = this._width / (this._isNarrow ? 24 : 32);
    const panelX: number = isSettled ? 0 : left * 0.22;
    const panelY: number = isFinal ? -0.15 : 0.15;
    const panelWidth: number = this._width * (isSettled ? 1.06 : 0.76) * 0.5;
    const panelHeight: number =
      (isFinal
        ? 6.25
        : isWaiting
          ? 5.3
          : frame.phase === "loading"
            ? 2.4
            : 4.3) * 0.5;
    const panelRx: number = isReduced || isSettled ? 0 : 0.2;
    const panelRy: number =
      isReduced || isSettled ? 0 : (frame.format - 1) * 0.32;
    const panelRz: number = isReduced || isSettled ? 0 : -0.055;
    this._particles.setPanelTransform(
      panelX,
      panelY,
      -0.45,
      panelWidth,
      panelHeight,
      panelRx,
      panelRy,
      panelRz
    );
    const formation: number = 0;
    const disintegrate: number = isFinal
      ? Math.min(1, Math.max(0, ((frame.phaseElapsedMs ?? 0) - 5600) / 6800))
      : 0;
    this._particles.update(elapsedMs, {
      formation,
      disintegrate,
      era: frame.format,
      reduced: isReduced,
    });
    for (let index: number = 0; index < this._ribbons.length; index += 1) {
      const ribbon: GlyphRibbon = this._ribbons[index];
      ribbon.root.visible = true;
      ribbon.root.rotation.set(0, 0, 0);
      ribbon.root.scale.setScalar(scale);
      ribbon.root.position.set(left, 1.8 - index * 0.4, 0.15);
      ribbon.update(
        seconds,
        index === 5 || index === 0 ? disorder : disorder * 0.25
      );
    }
    const command: Group = this._ribbons[0].root;
    command.visible = !isFinal;
    command.position.set(
      isBoot ? -this._width * 0.21 : left,
      isBoot ? 0.25 : 2.35,
      isBoot ? 0.7 : 0
    );
    command.scale.setScalar(scale * (isBoot ? 1.2 : 0.75));
    if (!isReduced && !isWaiting) {
      command.position.y += Math.sin(seconds * 0.45) * 0.12;
      command.rotation.y =
        Math.sin(seconds * 0.23) * BOOT_EFFECTS.planeSkew * 0.22;
    }
    for (let index: number = 0; index < 3; index += 1) {
      const slot: Group = this._ribbons[index + 1].root;
      const isLoaded: boolean = frame.transcript.includes(
        `dreamweaver[0${index + 1}]`
      );
      slot.visible =
        (frame.phase === "loading" || frame.phase === "writing") && isLoaded;
      slot.scale.setScalar(scale * 0.55);
      slot.position.set(
        left + 0.35 + (isReduced ? 0 : index * 0.22),
        1.5 - index * 0.4,
        isReduced ? 0 : index * 0.3
      );
      if (!isReduced) slot.rotation.y = (index - 1) * 0.24;
      const voice: Mesh<TorusGeometry, MeshBasicMaterial> = this._voices[index];
      const trail: Line<BufferGeometry, LineBasicMaterial> =
        this._trails[index];
      const visible: boolean = isLoaded || isStory || this._voice === index;
      if (visible && this._voiceAppearedAt[index] < 0)
        this._voiceAppearedAt[index] = elapsedMs;
      voice.visible = visible;
      trail.visible = visible;
      const entrance: number = isReduced
        ? 1
        : Math.min(
            Math.max((elapsedMs - this._voiceAppearedAt[index]) / 2800, 0),
            1
          );
      const smoothEntrance: number = entrance * entrance * (3 - 2 * entrance);
      const starts: Vector3[] = [
        new Vector3(-this._width * 0.82, 3.25, -0.7),
        new Vector3(-this._width * 0.9, -2.7, -0.3),
        new Vector3(this._width * 0.88, 2.75, -0.5),
      ];
      const resting: Vector3 = new Vector3(
        left + (this._width * (index + 0.5)) / 3,
        2.0 +
          (isWaiting || isReduced
            ? 0
            : Math.sin(seconds * (0.24 + index * 0.025) + index) * 0.3),
        0.15 + (isWaiting || isReduced ? 0 : index * 0.28)
      );
      const finalProgress: number = isFinal
        ? Math.min(Math.max((frame.phaseElapsedMs ?? 0) / 9200, 0), 1)
        : 0;
      if (isFinal) {
        resting.x *= 1 - finalProgress;
        resting.y = resting.y * (1 - finalProgress) + 0.12 * finalProgress;
        resting.z -= finalProgress * 2.4;
      }
      voice.position.copy(starts[index]).lerp(resting, smoothEntrance);
      voice.rotation.set(
        isReduced || isWaiting ? 0 : seconds * 0.08,
        0,
        isReduced || isWaiting ? 0 : seconds * 0.12 + index
      );
      voice.scale.setScalar(
        this._voice === index && elapsedMs - this._asideAt < ASIDE_HOLD_MS
          ? 1.6
          : 1
      );
      if (isFinal) voice.scale.multiplyScalar(1 - finalProgress * 0.74);
      const trailPositions: BufferAttribute = trail.geometry.getAttribute(
        "position"
      ) as BufferAttribute;
      for (let pointIndex: number = 0; pointIndex < 72; pointIndex += 1) {
        const t: number = pointIndex / 71;
        const point: Vector3 = starts[index].clone().lerp(voice.position, t);
        const breath: number = Math.sin(
          t * Math.PI * (2.4 + index * 0.4) +
            seconds * (0.18 + index * 0.035) +
            index * 1.7
        );
        point.y += breath * (1 - t) * (0.34 + index * 0.08);
        point.x += Math.cos(t * 8 + seconds * 0.11 + index) * (1 - t) * 0.18;
        point.z -= (1 - t) * 0.35 + Math.sin(t * 5 + index) * 0.08;
        trailPositions.setXYZ(pointIndex, point.x, point.y, point.z);
      }
      trailPositions.needsUpdate = true;
      trail.material.opacity =
        (0.2 + smoothEntrance * 0.34) *
        (isFinal ? 1 - finalProgress * 0.55 : 1);
    }
    this._ribbons[4].root.visible = !isBoot && !isFinal;
    this._ribbons[4].root.scale.setScalar(scale * 0.37);
    this._ribbons[4].root.position.set(left, 1.65, -0.05);
    const question: Group = this._ribbons[5].root;
    question.visible = frame.question.length > 0;
    question.position.set(
      left,
      isFinal
        ? 2.55
        : isWaiting
          ? 0.65
          : -0.8 + Math.min(Math.max((seconds - 13) / 16, 0), 1) * 1.45,
      0.25
    );
    question.scale.setScalar(
      isFinal ? scale * (this._isNarrow ? 0.62 : 0.68) : scale
    );
    if (!isReduced && !isSettled) {
      question.position.x += Math.sin(seconds * 0.16) * 0.3;
      question.position.z +=
        Math.sin(seconds * 0.25) * BOOT_EFFECTS.depthDrift * 2.5;
      question.rotation.set(
        -0.3,
        (frame.format - 1) * BOOT_EFFECTS.planeSkew * 0.65 +
          Math.sin(seconds * 0.2) * 0.15,
        (frame.format - 1) * 0.055
      );
    }
    const symbols: Group = this._ribbons[6].root;
    symbols.visible = frame.prelude.includes(BOOT_SYMBOLS) && !isFinal;
    symbols.position.set(left, -2.35, 0);
    symbols.scale.setScalar(scale * 1.05);
    const aside: Group = this._ribbons[7].root;
    aside.visible =
      Boolean(frame.hint) ||
      (this._voice >= 0 &&
        !isWaiting &&
        elapsedMs - this._asideAt < ASIDE_HOLD_MS);
    aside.position.set(left + this._width * 0.04, -1.85, 0.5);
    aside.scale.setScalar(scale * 0.72);
    aside.rotation.z = isReduced ? 0 : (this._voice - 1) * 0.025;
    for (let index: number = 0; index < 3; index += 1) {
      const choice: Group = this._ribbons[index + 8].root;
      choice.visible = isWaiting;
      choice.position.set(left, -0.65 - index * 0.57, 0.2);
      choice.scale.setScalar(scale * (this._isNarrow ? 0.64 : 0.59));
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = this._targets[index];
      target.visible = isWaiting;
      target.position.set(0, choice.position.y + 0.01, 0.05);
      target.scale.set(this._width, 0.5, 1);
      target.material.opacity =
        this._selected === index ? 0.19 : this._hovered === index ? 0.1 : 0.02;
      if (this._selected === index) choice.position.x += scale * 0.3;
    }
    for (let index: number = 0; index < 3; index += 1) {
      const fossil: Group = this._ribbons[11 + index].root;
      fossil.visible = isStory && !isFinal && Boolean(this._fossils[index]);
      fossil.position.set(
        left + 0.18 * index,
        -2.55 - index * 0.26,
        -0.75 - index * 0.34
      );
      fossil.scale.setScalar(scale * (0.34 - index * 0.045));
      fossil.rotation.set(
        -0.1 - index * 0.05,
        (index - 1) * 0.12,
        (index - 1) * 0.012
      );
      fossil.updateMatrix();
    }
    this._cursor.visible =
      !isWaiting &&
      frame.phase !== "complete" &&
      (isReduced || elapsedMs % CURSOR_PERIOD_MS < 690);
    this._cursor.position.copy(
      isBoot
        ? command.position
        : question.visible
          ? question.position
          : this._ribbons[3].root.position
    );
    const lastLine: string =
      (isBoot ? frame.transcript : frame.question).split("\n").at(-1) ?? "";
    this._cursor.position.x +=
      Math.min(lastLine.length, this._isNarrow ? 28 : 41) *
      0.64 *
      scale *
      (isBoot ? 1.2 : 1);
    this._cursor.position.y += scale * 0.45;
    if (!isBoot && frame.question.includes("\n"))
      this._cursor.position.y -= scale * 1.35;
    this._cursor.position.z += 0.1;
    this._cursor.rotation.set(
      0,
      isReduced ? 0 : Math.sin(seconds * 0.45) * 0.55,
      isReduced ? 0 : Math.sin(seconds * 0.3) * 0.1
    );
    this._cursor.scale.set(
      frame.format === 1 ? 0.14 : 1,
      frame.format === 2 ? 0.14 : 1,
      1
    );
  }

  public destroy(): void {
    this._root.removeFromParent();
    this._ribbons.forEach((ribbon: GlyphRibbon): void => ribbon.destroy());
    this._atlases.forEach((texture: CanvasTexture): void => texture.dispose());
    this._particles.destroy();
    for (const mesh of [this._cursor, ...this._voices, ...this._targets]) {
      mesh?.geometry.dispose();
      mesh?.material.dispose();
    }
    this._trails.forEach(
      (trail: Line<BufferGeometry, LineBasicMaterial>): void => {
        trail.geometry.dispose();
        trail.material.dispose();
      }
    );
  }
}

import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide,
  Group, Mesh, MeshBasicMaterial, NearestFilter, PerspectiveCamera, Raycaster,
  Scene, SRGBColorSpace, TorusGeometry, Vector2,
} from 'three';

import { BOOT_SYMBOLS, wrapText, type BootFrame } from './ghostwriting';
import asides from './dreamweaver-asides.json';

// Recorded first draw (seed 472): UI pixel-font-step .619, gameplay depth-drift
// .472, stack plane-skew .716. Deliberately independent, bounded experiments.
export const BOOT_EFFECTS = { pixelStep: 0.619, depthDrift: 0.472, planeSkew: 0.716 };
const GLYPHS: string = Array.from({ length: 95 }, (_: unknown, index: number): string => String.fromCharCode(index + 32)).join('') + '∞◊Ω≋※—↑↓↵';
const ATLAS_COLUMNS: number = 16;
const ATLAS_ROWS: number = 7;
const GLYPH_CAPACITY: number = 768;
const INK: number[] = [0xdce7e8, 0xd7bb85, 0xcc606b];
const ASIDES: string[] = asides.voices.map((voice): string => voice.text);
const DEBATE_RIBBONS: number[] = [7, 11, 12];
const VOICE_MARKS: string[] = ['|', '>', '~'];
const CURSOR_PERIOD_MS: number = 1150;
const ASIDE_HOLD_MS: number = 4300;
const VOICE_COOLDOWN_MS: number = 2500;

/** One reusable glyph atlas per historical font, never a texture per letter. */
function createAtlas(format: number): CanvasTexture {
  const cell: number = format === 0 ? Math.round(24 * BOOT_EFFECTS.pixelStep) : 48;
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = ATLAS_COLUMNS * cell;
  canvas.height = ATLAS_ROWS * cell;
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (!context) throw new Error('Cannot create glyph assets');
  const families: string[] = ['monospace', '"Lucida Console", monospace', '"Courier New", monospace'];
  context.font = `${format === 2 ? 700 : 400} ${Math.floor(cell * 0.77)}px ${families[format]}`;
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
  private _front: MeshBasicMaterial;
  private _back: MeshBasicMaterial;
  private _text: string = '';
  private _columns: number = 40;
  private _format: number = 0;
  private _atlases: CanvasTexture[];

  constructor(atlases: CanvasTexture[]) {
    this._atlases = atlases;
    this._front = new MeshBasicMaterial({ map: atlases[0], color: INK[0], transparent: true, alphaTest: 0.08, depthWrite: false, side: DoubleSide });
    this._back = this._front.clone();
    this._back.color.setHex(0x395057);
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

  public setText(text: string, format: number, columns: number, color: number = INK[0]): void {
    text = wrapText(text, columns);
    this._front.color.setHex(color);
    if (this._text === text && this._format === format && this._columns === columns) return;
    this._text = text;
    this._format = format;
    this._columns = columns;
    this._front.map = this._atlases[format];
    this._back.map = this._atlases[format];
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
    let column: number = 0;
    let row: number = 0;
    let glyph: number = 0;
    for (const letter of this._text) {
      if (letter === '\n') { row += 1; column = 0; continue; }
      if (glyph >= GLYPH_CAPACITY) break;
      if (column >= this._columns) { row += 1; column = 0; }
      const x: number = column * 0.64;
      const y: number = -row * 1.35;
      const drift: number = Math.sin(seconds * 0.32 + glyph * 0.21) * disorder;
      const z: number = Math.sin(glyph * 0.71 + seconds * 0.2) * disorder * BOOT_EFFECTS.depthDrift * 3;
      const skew: number = Math.cos(glyph * 0.37) * disorder * BOOT_EFFECTS.planeSkew;
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
  private _panel: Mesh<BoxGeometry, MeshBasicMaterial> | null = null;
  private _voices: Mesh<TorusGeometry, MeshBasicMaterial>[] = [];
  private _targets: Mesh<BoxGeometry, MeshBasicMaterial>[] = [];
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

  public init(scene: Scene): void {
    this._atlases = [0, 1, 2].map(createAtlas);
    // command, three boot slots, archive, question, symbols, aside, three choices
    for (let index: number = 0; index < 13; index += 1) {
      const ribbon: GlyphRibbon = new GlyphRibbon(this._atlases);
      ribbon.init();
      this._ribbons.push(ribbon);
      this._root.add(ribbon.root);
    }
    this._cursor = new Mesh(new BoxGeometry(0.13, 0.24, 0.09), new MeshBasicMaterial({ color: INK[0] }));
    this._panel = new Mesh(new BoxGeometry(1, 1, 0.03), new MeshBasicMaterial({ color: 0x020607, transparent: true, opacity: 0.92 }));
    this._root.add(this._cursor, this._panel);
    for (let index: number = 0; index < 3; index += 1) {
      const voice: Mesh<TorusGeometry, MeshBasicMaterial> = new Mesh(new TorusGeometry(0.15, 0.012, 4, index === 2 ? 3 : index === 1 ? 5 : 32), new MeshBasicMaterial({ color: INK[index] }));
      this._voices.push(voice);
      this._root.add(voice);
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = new Mesh(new BoxGeometry(1, 1, 0.03), new MeshBasicMaterial({ color: INK[index], transparent: true, opacity: 0.04, depthWrite: false }));
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
    const columns: number = this._isNarrow ? 29 : 42;
    this._ribbons[0].setText(frame.transcript.split('\n')[0], frame.format, columns);
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[index + 1].setText(frame.transcript.split('\n')[index + 1] ?? '', index, columns, INK[index]);
    }
    this._ribbons[4].setText(frame.prelude, 0, this._isNarrow ? 40 : 62, frame.transcript ? 0x7e9399 : INK[0]);
    this._ribbons[5].setText(frame.question, frame.format, columns);
    this._ribbons[6].setText(BOOT_SYMBOLS, 2, columns, 0x9ca5a8);
    this._ribbons[7].setText(this._aside, Math.max(this._voice, 0), this._isNarrow ? 30 : 42, INK[Math.max(this._voice, 0)]);
    if (frame.debate?.length) {
      this._voice = frame.debate[frame.debate.length - 1].voice;
      for (const line of frame.debate) {
        this._ribbons[DEBATE_RIBBONS[line.voice]].setText(`${VOICE_MARKS[line.voice]} ${line.text}`, line.voice, this._isNarrow ? 30 : 42, INK[line.voice]);
      }
    }
    for (let index: number = 0; index < 3; index += 1) {
      this._ribbons[8 + index].setText(`${index + 1}  ${frame.options[index] ?? ''}`, index, this._isNarrow ? 34 : 62, INK[index]);
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
  public getCursorPosition(): number[] { return this._cursor?.position.toArray() ?? []; }
  public select(index: number): void { this._selected = index; }

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
  }

  public update(elapsedMs: number, isReduced: boolean): void {
    const frame: BootFrame | null = this._frame;
    if (!frame || !this._cursor || !this._panel) return;
    this._root.visible = !['doorway', 'crossing', 'complete'].includes(frame.phase);
    const seconds: number = elapsedMs / 1000;
    const isWaiting: boolean = frame.phase === 'waiting';
    const isDebating: boolean = frame.phase === 'debating';
    const isBoot: boolean = frame.phase === 'cursor' || frame.phase === 'command';
    const isNarrating: boolean = !isBoot && frame.transcript === '';
    const disorder: number = isReduced || isWaiting ? 0 : frame.isCorrupt ? 1.2 : 0.65;
    const left: number = -this._width * 0.47;
    const scale: number = this._width / (this._isNarrow ? 24 : 32);
    this._panel.visible = !isBoot;
    this._panel.position.set(isWaiting || isNarrating ? 0 : left * 0.22, 0.15, -0.45);
    this._panel.scale.set(this._width * (isWaiting || isNarrating ? 1.06 : 0.76), isWaiting || isNarrating ? 5.3 : frame.phase === 'loading' ? 2.4 : 4.3, 1);
    this._panel.rotation.set(isReduced || isWaiting || isNarrating ? 0 : 0.2, isReduced || isWaiting || isNarrating ? 0 : (frame.format - 1) * 0.32, isReduced || isWaiting || isNarrating ? 0 : -0.055);
    if (isDebating) this._panel.scale.y = 2.8;
    for (let index: number = 0; index < this._ribbons.length; index += 1) {
      const ribbon: GlyphRibbon = this._ribbons[index];
      ribbon.root.visible = true;
      ribbon.root.rotation.set(0, 0, 0);
      ribbon.root.scale.setScalar(scale);
      ribbon.root.position.set(left, 1.8 - index * 0.4, 0.15);
      ribbon.update(seconds, index === 5 || index === 0 ? disorder : disorder * 0.25);
    }
    const command: Group = this._ribbons[0].root;
    command.visible = !isDebating;
    command.position.set(isBoot ? -this._width * 0.21 : left, isBoot ? 0.25 : 2.35, isBoot ? 0.7 : 0);
    command.scale.setScalar(scale * (isBoot ? 1.2 : 0.75));
    if (!isReduced && !isWaiting) {
      command.position.y += Math.sin(seconds * 0.12) * 0.12;
      command.rotation.y = Math.sin(seconds * 0.23) * BOOT_EFFECTS.planeSkew * 0.22;
    }
    for (let index: number = 0; index < 3; index += 1) {
      const slot: Group = this._ribbons[index + 1].root;
      const isLoaded: boolean = frame.transcript.includes(`dreamweaver[0${index + 1}]`);
      slot.visible = !isBoot && !isWaiting && isLoaded;
      slot.scale.setScalar(scale * 0.55);
      slot.position.set(left + 0.35 + (isReduced ? 0 : index * 0.22), 1.5 - index * 0.4, isReduced ? 0 : index * 0.3);
      if (!isReduced) slot.rotation.y = (index - 1) * 0.24;
      const voice: Mesh<TorusGeometry, MeshBasicMaterial> = this._voices[index];
      voice.visible = isLoaded || this._voice === index;
      voice.position.set(left + this._width * (index + 0.5) / 3, 2.0 + (isWaiting || isReduced ? 0 : Math.sin(seconds * 0.3 + index) * 0.28), 0.2 + (isWaiting || isReduced ? 0 : index * 0.3));
      voice.rotation.set(isReduced || isWaiting ? 0 : seconds * 0.08, 0, isReduced || isWaiting ? 0 : seconds * 0.12 + index);
      voice.scale.setScalar(this._voice === index && elapsedMs - this._asideAt < ASIDE_HOLD_MS ? 1.6 : 1);
    }
    this._ribbons[4].root.visible = !isBoot && !isDebating && frame.question === '';
    this._ribbons[4].root.scale.setScalar(scale * (frame.transcript ? 0.37 : 0.65));
    this._ribbons[4].root.position.set(left, 1.65, -0.05);
    const question: Group = this._ribbons[5].root;
    question.visible = frame.question.length > 0;
    question.position.set(left, isWaiting ? 0.65 : -0.8 + Math.min(Math.max((seconds - 13) / 16, 0), 1) * 1.45, 0.25);
    if (!isReduced && !isWaiting) {
      question.position.x += Math.sin(seconds * 0.16) * 0.3;
      question.position.z += Math.sin(seconds * 0.25) * BOOT_EFFECTS.depthDrift * 2.5;
      question.rotation.set(-0.3, (frame.format - 1) * BOOT_EFFECTS.planeSkew * 0.65 + Math.sin(seconds * 0.2) * 0.15, (frame.format - 1) * 0.055);
    }
    const symbols: Group = this._ribbons[6].root;
    symbols.visible = frame.showSymbols;
    symbols.position.set(left, -2.35, 0);
    symbols.scale.setScalar(scale * 1.05);
    const aside: Group = this._ribbons[7].root;
    aside.visible = this._voice >= 0 && !isWaiting && elapsedMs - this._asideAt < ASIDE_HOLD_MS;
    aside.position.set(left + this._width * 0.04, -1.85, 0.5);
    aside.scale.setScalar(scale * 0.72);
    aside.rotation.z = isReduced ? 0 : (this._voice - 1) * 0.025;
    this._ribbons[11].root.visible = false;
    this._ribbons[12].root.visible = false;
    if (isDebating) {
      aside.visible = false;
      for (const [index, line] of (frame.debate ?? []).entries()) {
        const ribbon: Group = this._ribbons[DEBATE_RIBBONS[line.voice]].root;
        ribbon.visible = true;
        ribbon.position.set(left + scale, 0.9 - index * 0.85, 0.5);
        ribbon.scale.setScalar(scale * 0.7);
        ribbon.rotation.set(0, 0, 0);
      }
    }
    for (let index: number = 0; index < 3; index += 1) {
      const choice: Group = this._ribbons[index + 8].root;
      choice.visible = isWaiting;
      choice.position.set(left, -0.65 - index * 0.57, 0.2);
      choice.scale.setScalar(scale * (this._isNarrow ? 0.64 : 0.59));
      const target: Mesh<BoxGeometry, MeshBasicMaterial> = this._targets[index];
      target.visible = isWaiting;
      target.position.set(0, choice.position.y + 0.01, 0.05);
      target.scale.set(this._width, 0.5, 1);
      target.material.opacity = this._selected === index ? 0.19 : this._hovered === index ? 0.1 : 0.02;
      if (this._selected === index) choice.position.x += scale * 0.3;
    }
    this._cursor.visible = !isWaiting && !isNarrating && (isReduced || elapsedMs % CURSOR_PERIOD_MS < 690);
    this._cursor.position.copy(isBoot ? command.position : question.visible ? question.position : this._ribbons[3].root.position);
    const lastLine: string = (isBoot ? frame.transcript : frame.question).split('\n').at(-1) ?? '';
    this._cursor.position.x += Math.min(lastLine.length, this._isNarrow ? 28 : 41) * 0.64 * scale * (isBoot ? 1.2 : 1);
    this._cursor.position.y += scale * 0.45;
    if (!isBoot && frame.question.includes('\n')) this._cursor.position.y -= scale * 1.35;
    this._cursor.position.z += 0.1;
    this._cursor.rotation.set(0, isReduced ? 0 : Math.sin(seconds * 0.12) * 0.35, isReduced ? 0 : Math.sin(seconds * 0.08) * 0.07);
    this._cursor.scale.set(frame.format === 1 ? 0.14 : 1, frame.format === 2 ? 0.14 : 1, 1);
  }

  public destroy(): void {
    this._root.removeFromParent();
    this._ribbons.forEach((ribbon: GlyphRibbon): void => ribbon.destroy());
    this._atlases.forEach((texture: CanvasTexture): void => texture.dispose());
    for (const mesh of [this._cursor, this._panel, ...this._voices, ...this._targets]) {
      mesh?.geometry.dispose();
      mesh?.material.dispose();
    }
  }
}

import { AmbientLight, BoxGeometry, CanvasTexture, Color, DirectionalLight, GridHelper, Group, Mesh, MeshStandardMaterial, OrthographicCamera, Scene, Sprite, SpriteMaterial, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { WalkField } from './WalkField';
import { ECHO_ROOMS } from './rooms';
import './styles.css';

const FIELD_SIZE: number = 48;
const PALETTE: number[] = [0xc9dce5, 0xd4aa66, 0xb85c60];

/** Intentionally rough presentation. No asset loading blocks movement. */
export class ChapterTwoScene {
  public active: boolean = false;
  private _world: WalkField = new WalkField();
  private _scene: Scene = new Scene();
  private _camera: OrthographicCamera = new OrthographicCamera(-20, 20, 12, -12, 0.1, 120);
  private _hero: Group = new Group();
  private _monster: Group = new Group();
  private _marker: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(new BoxGeometry(2.9, 0.06, 2.9), new MeshStandardMaterial({ color: 0xe8d393, emissive: 0x493512 }));
  private _keys: Set<string> = new Set();
  private _abort: AbortController = new AbortController();
  private _hud: HTMLElement | null = null;
  private _root: HTMLElement | null = null;
  private _paused: boolean = false;
  private _lastUi: string = '';
  private _questionLabel: Sprite | null = null;
  private _textures: CanvasTexture[] = [];
  private _target: Vector3 = new Vector3();
  private _labelPosition: Vector3 = new Vector3();
  private _floorMaterial: MeshStandardMaterial = new MeshStandardMaterial({ color: 0x242a32, roughness: 1 });

  public init(root: HTMLElement, debug: boolean): void {
    this._root = root;
    this._scene.background = new Color(0x10151e);
    this._scene.add(new AmbientLight(0xc1d3e6, 2));
    const light: DirectionalLight = new DirectionalLight(0xffe4b9, 3);
    light.position.set(-8, 18, 10);
    this._scene.add(light);
    const floor: Mesh = new Mesh(new BoxGeometry(FIELD_SIZE, 0.3, FIELD_SIZE), this._floorMaterial);
    floor.position.y = -0.2;
    this._scene.add(floor, new GridHelper(FIELD_SIZE, FIELD_SIZE, 0x647081, 0x38424f));
    this._box(this._hero, 0, 0.8, 0, 0.7, 1, 0.45, 0xcbd7df);
    this._box(this._hero, 0, 1.6, 0, 0.5, 0.5, 0.5, 0xebd6b3);
    this._box(this._hero, -0.21, 0.2, 0, 0.24, 0.4, 0.3, 0x6b7c91);
    this._box(this._hero, 0.21, 0.2, 0, 0.24, 0.4, 0.3, 0x6b7c91);
    this._scene.add(this._hero);
    const door: Group = new Group();
    door.position.x = -8;
    this._box(door, -1, 1.8, 0, 0.45, 3.6, 0.6, 0xa7b8c4);
    this._box(door, 1, 1.8, 0, 0.45, 3.6, 0.6, 0xa7b8c4);
    this._box(door, 0, 3.4, 0, 2.5, 0.45, 0.6, 0xa7b8c4);
    door.add(this._label('D  DOOR', 0, 3.8, 0, 4));
    this._scene.add(door);
    this._box(this._monster, 0, 0.8, 0, 1.7, 1.5, 1.2, 0xb06565);
    this._box(this._monster, -0.5, 1.8, 0, 0.3, 0.8, 0.35, 0xd7c4b0);
    this._box(this._monster, 0.5, 1.8, 0, 0.3, 0.8, 0.35, 0xd7c4b0);
    this._monster.add(this._label('M  MONSTER', 0, 4.6, 0, 4));
    this._scene.add(this._monster);
    const chest: Group = new Group();
    chest.position.x = 8;
    this._box(chest, 0, 0.6, 0, 2, 1.2, 1.5, 0x947951);
    this._box(chest, 0, 1.3, 0, 2.1, 0.28, 1.6, 0xd4b275);
    chest.add(this._label('C  CHEST', 0, 4.6, 0, 4));
    this._scene.add(chest, this._marker);
    // Landmarks, not a maze: keep the first slice open and easy to bot-navigate.
    for (const x of [-23, 23]) for (const z of [-20, -10, 0, 10, 20]) this._box(this._scene, x, 0.5, z, 1, 1, 1, 0x424d59);
    this._hud = document.createElement('section');
    this._hud.className = 'echo-hud';
    this._hud.hidden = true;
    this._hud.setAttribute('aria-label', 'Echo chamber gameplay');
    this._hud.innerHTML = `<header><strong id="echo-title"></strong><span>WASD / arrows · E interact · Esc pause · R restart</span><button id="echo-pause" type="button">Pause</button><button id="echo-restart" type="button">Restart rooms</button></header><section class="echo-prompt"><p id="echo-copy" aria-live="polite"></p><pre id="echo-script" aria-label="Next floor script" hidden></pre><form id="echo-form" hidden><label for="echo-answer">Your answer</label><input id="echo-answer" name="answer" required maxlength="240" autocomplete="off"><button type="submit">Answer</button></form><button id="echo-interact" type="button">E · Interact</button><button id="echo-next" type="button" hidden>Continue</button></section>`;
    root.append(this._hud);
    const signal: AbortSignal = this._abort.signal;
    this._element('echo-interact').addEventListener('click', (): void => { if (!this.active || this._paused) return; this._world.interact(); this._keys.clear(); }, { signal });
    this._element('echo-next').addEventListener('click', (): void => { if (!this.active || this._paused) return; this._world.continue(); this._keys.clear(); }, { signal });
    this._element('echo-pause').addEventListener('click', (): void => { this._paused = !this._paused; this._keys.clear(); }, { signal });
    this._element('echo-restart').addEventListener('click', (): void => this.start(this._world.thread), { signal });
    this._element('echo-form').addEventListener('submit', (event: Event): void => {
      event.preventDefault();
      if (!this.active || this._paused) return;
      const input: HTMLInputElement = this._input();
      if (this._world.answer(input.value)) { input.value = ''; input.blur(); }
    }, { signal });
    window.addEventListener('keydown', this._onKey, { signal });
    window.addEventListener('keyup', (event: KeyboardEvent): void => { this._keys.delete(event.key.toLowerCase()); }, { signal });
    window.addEventListener('blur', (): void => { this._keys.clear(); }, { signal });
    document.addEventListener('visibilitychange', (): void => { this._keys.clear(); }, { signal });
    if (debug) Object.assign(window, { __CHAPTER_TWO_DIAGNOSTICS__: { getState: (): object => ({ active: this.active, phase: this._world.phase, roomIndex: this._world.roomIndex, scriptRevision: this._world.scriptRevision, player: { ...this._world.player }, framesAdvanced: this._world.framesAdvanced, distanceTravelled: this._world.distanceTravelled, thread: this._world.thread, guide: this._world.guide, choices: this._world.choices.map(choice => ({ ...choice })), paused: this._paused }) } });
  }

  private _element(id: string): HTMLElement {
    const node: Element | null | undefined = this._hud?.querySelector(`#${id}`);
    if (!(node instanceof HTMLElement)) throw new Error(`Missing gameplay control: ${id}`);
    return node;
  }
  private _input(): HTMLInputElement {
    const node: HTMLElement = this._element('echo-answer');
    if (!(node instanceof HTMLInputElement)) throw new Error('Missing answer input');
    return node;
  }

  public start(thread: string): void {
    this._world.start(thread);
    this.active = true;
    this._paused = false;
    this._keys.clear();
    this._lastUi = '';
    this._input().value = '';
    if (this._hud) this._hud.hidden = false;
    if (this._root) this._root.dataset.chapter = '2';
  }

  public stop(): void {
    this.active = false;
    this._keys.clear();
    if (this._hud) this._hud.hidden = true;
    if (this._root) this._root.dataset.chapter = '1';
  }

  private _onKey = (event: KeyboardEvent): void => {
    if (!this.active || event.ctrlKey || event.metaKey || event.altKey) return;
    const key: string = event.key.toLowerCase();
    // Escape remains global while typing; movement/restart must not eat answers.
    if (key === 'escape') {
      event.preventDefault();
      if (!event.repeat) { this._paused = !this._paused; this._keys.clear(); }
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) { event.preventDefault(); this._keys.add(key); }
    if (event.repeat) return;
    if (key === 'r') this.start(this._world.thread);
    if (key === 'e' && !this._paused) {
      event.preventDefault();
      if (this._world.phase === 'result' || this._world.phase === 'rewriting') this._world.continue(); else this._world.interact();
      this._keys.clear();
    }
  };

  public update(delta: number, renderer: WebGLRenderer, reduced: boolean): void {
    const axis = (positive: string[], negative: string[]): number => Number(positive.some(key => this._keys.has(key))) - Number(negative.some(key => this._keys.has(key)));
    if (!this._paused) this._world.update(delta, axis(['d', 'arrowright'], ['a', 'arrowleft']), axis(['s', 'arrowdown'], ['w', 'arrowup']));
    this._hero.position.set(this._world.player.x, 0, this._world.player.z);
    const moving: boolean = this._keys.size > 0 && this._world.phase === 'exploring' && !this._paused && !reduced;
    this._hero.rotation.z = moving ? Math.sin(this._world.distanceTravelled * 4) * 0.055 : 0;
    this._monster.rotation.z = !reduced && this._world.phase === 'fighting' ? Math.sin(this._world.framesAdvanced * 0.6) * 0.13 : 0;
    this._marker.visible = this._world.phase === 'exploring' && this._world.nearest !== null;
    if (this._world.nearest) this._marker.position.set(this._world.nearest.x, 0.02, this._world.nearest.z);
    const aspect: number = innerWidth / innerHeight;
    const halfHeight: number = Math.max(11, 14 / aspect);
    this._camera.left = -halfHeight * aspect; this._camera.right = halfHeight * aspect;
    this._camera.top = halfHeight; this._camera.bottom = -halfHeight;
    // Keep the controlled character above the bottom prompt instead of letting
    // it disappear under UI when walking toward the near edge of the field.
    this._target.set(this._world.player.x * 0.6, 0, this._world.player.z - 3);
    this._camera.position.set(this._target.x, 23, this._target.z + 23);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
    this._refreshUi();
    // Reveal world labels when they clear the HUD, rather than clipping words
    // across the top of the screen during the initial approach.
    this._camera.updateMatrixWorld();
    const headerBottom: number = this._hud?.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    this._scene.traverse((object): void => {
      if (!(object instanceof Sprite)) return;
      object.getWorldPosition(this._labelPosition).project(this._camera);
      const top: number = (1 - this._labelPosition.y) * innerHeight / 2 - object.scale.y * innerHeight / (halfHeight * 4);
      object.visible = top > headerBottom + 8;
    });
    // Cut away from the old floor while its replacement script awaits input.
    this._scene.visible = this._world.phase !== 'rewriting';
    renderer.render(this._scene, this._camera);
  }

  private _refreshUi(): void {
    const world: WalkField = this._world;
    const key: string = `${world.roomIndex}:${world.phase}:${world.nearest?.kind}:${this._paused}`;
    if (key === this._lastUi) return;
    const roomChanged: boolean = this._lastUi.split(':')[0] !== String(world.roomIndex);
    this._lastUi = key;
    this._element('echo-title').textContent = `ECHO CHAMBER / ${world.roomIndex + 1} — GRAYBOX`;
    this._element('echo-copy').textContent = this._paused ? 'Paused' : world.phase === 'rewriting' ? 'Floor ended. Next script ready.' : world.phase === 'complete' ? `${world.guide}: “I’m coming with you. Don’t lose me this time.”` : world.selected?.text ?? (world.nearest ? `E · ${world.nearest.kind}` : 'Approach a door, monster, or chest. Choose one path through this room.');
    const script: HTMLElement = this._element('echo-script');
    script.hidden = world.phase !== 'rewriting' || this._paused;
    script.textContent = world.phase === 'rewriting' ? world.scriptPreview : '';
    this._element('echo-form').hidden = world.phase !== 'prompt' || this._paused;
    this._element('echo-next').hidden = !['result', 'rewriting'].includes(world.phase) || this._paused;
    this._element('echo-next').textContent = world.phase === 'rewriting' ? 'Reboot into next floor' : 'Continue';
    this._element('echo-interact').hidden = world.phase !== 'exploring' || this._paused || !world.nearest;
    const interact: HTMLElement = this._element('echo-interact');
    if (interact instanceof HTMLButtonElement) interact.disabled = !world.nearest;
    this._element('echo-pause').textContent = this._paused ? 'Resume' : 'Pause';
    if (world.phase === 'prompt' && !this._paused) this._input().focus();
    if (roomChanged) {
      this._floorMaterial.color.setHex(PALETTE[world.roomIndex]).multiplyScalar(0.2);
      if (this._questionLabel) {
        this._scene.remove(this._questionLabel);
        const oldTexture = this._questionLabel.material.map;
        oldTexture?.dispose();
        this._textures = this._textures.filter(texture => texture !== oldTexture);
        this._questionLabel.material.dispose();
      }
      this._questionLabel = this._label(ECHO_ROOMS[world.roomIndex].objects[0].text, -8, 5.8, 0, 7);
      this._scene.add(this._questionLabel);
    }
  }

  private _box(parent: Group | Scene, x: number, y: number, z: number, width: number, height: number, depth: number, color: number): void {
    const mesh: Mesh = new Mesh(new BoxGeometry(width, height, depth), new MeshStandardMaterial({ color, roughness: 0.95 }));
    mesh.position.set(x, y, z); parent.add(mesh);
  }

  private _label(text: string, x: number, y: number, z: number, width: number): Sprite {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = 640; canvas.height = 150;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create world label');
    ctx.fillStyle = '#121923'; ctx.fillRect(0, 0, 640, 150);
    ctx.strokeStyle = '#9aabbc'; ctx.strokeRect(2, 2, 636, 146);
    ctx.fillStyle = '#eee8db'; ctx.font = '28px monospace'; ctx.textAlign = 'center';
    const lines: string[] = [''];
    for (const word of text.split(' ')) {
      const last: number = lines.length - 1;
      if ((lines[last] + word).length > 32) lines.push(word + ' '); else lines[last] += word + ' ';
    }
    lines.forEach((line: string, index: number): void => ctx.fillText(line.trim(), 320, 57 + index * 35));
    const texture: CanvasTexture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this._textures.push(texture);
    const label: Sprite = new Sprite(new SpriteMaterial({ map: texture, depthTest: false }));
    label.position.set(x, y, z); label.scale.set(width, width * 150 / 640, 1); return label;
  }

  public destroy(): void {
    this.stop(); this._abort.abort(); this._hud?.remove();
    this._scene.traverse((object): void => {
      if (object instanceof Mesh) { object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); }
      if (object instanceof Sprite) object.material.dispose();
      if (object instanceof GridHelper) { object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); }
    });
    this._textures.forEach(texture => texture.dispose());
  }
}

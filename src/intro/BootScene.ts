import { loadVfxExportBundle } from 'nixie-fx/export';
import GUI from 'lil-gui';
import { ThreeVfxRenderer, type ThreeVfxEffectInstance } from 'nixie-fx/three';
import { Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2, WebGLRenderer } from 'three';

import distantUrl from '../../assets/intro/optical-variations/optical-a-distant.webp';
import foldUrl from '../../assets/intro/optical-variations/optical-b-fold.webp';
import thresholdUrl from '../../assets/intro/optical-variations/optical-c-threshold.webp';
import { BOOT_OPTIONS, type BootFrame } from './ghostwriting';
import { BOOT_EFFECTS, SpatialBootScene } from './SpatialBootScene';
import { FORMATION_DURATION_MS, StoryController } from './StoryController';
import { ThresholdScene } from './ThresholdScene';
import { Starfield } from './Starfield';
import { ChapterTwoScene } from '../chapter-two/ChapterTwoScene';
import dustBundle from './vfx/boot-dust.bundle.json';

const SEED: number = 472;
const MAX_DELTA_SECONDS: number = 0.1;
const PLATE_URLS: string[] = [distantUrl, foldUrl, thresholdUrl];
const FIRST_DISSOLVE_MS: number = 3500;
const SECOND_DISSOLVE_MS: number = 8500;
const DISSOLVE_DURATION_MS: number = 2500;
const ZOOM_DURATION_MS: number = 16000;
const VIEW_HEIGHT: number = 6.4;
const VERTEX_SHADER: string = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAGMENT_SHADER: string = `
  uniform sampler2D distantImage;
  uniform sampler2D foldImage;
  uniform sampler2D thresholdImage;
  uniform float firstMix;
  uniform float secondMix;
  uniform float zoom;
  uniform float viewAspect;
  uniform float imageAspect;
  uniform float reveal;
  uniform vec2 drift;
  varying vec2 vUv;
  void main() {
    vec2 cover = vec2(min(viewAspect / imageAspect, 1.0), min(imageAspect / viewAspect, 1.0)) / zoom;
    vec2 center = clamp(vec2(0.65, 0.55), cover * 0.5, 1.0 - cover * 0.5);
    vec2 uv = clamp((vUv - 0.5) * cover + center + drift, 0.001, 0.999);
    // The imperfect double contours are intentional: the script is trying alternatives.
    vec3 ink = mix(texture2D(distantImage, uv).rgb, texture2D(foldImage, uv).rgb, smoothstep(0.0, 1.0, firstMix));
    ink = mix(ink, texture2D(thresholdImage, uv).rgb, smoothstep(0.0, 1.0, secondMix));
    gl_FragColor = vec4(ink * reveal, 1.0);
    #include <colorspace_fragment>
  }
`;

function getElement<T extends HTMLElement>(selector: string, kind: { new(): T }): T {
  const element: Element | null = document.querySelector(selector);
  if (!(element instanceof kind)) throw new Error(`Missing boot element: ${selector}`);
  return element;
}

export class BootScene {
  private _renderer: WebGLRenderer | null = null;
  private _scene: Scene | null = null;
  private _camera: PerspectiveCamera | null = null;
  private _spatial: SpatialBootScene = new SpatialBootScene();
  private _threshold: ThresholdScene = new ThresholdScene();
  private _stars: Starfield = new Starfield();
  private _chapterTwo: ChapterTwoScene = new ChapterTwoScene();
  private _visualMs: number = 0;
  private _artControls: GUI | null = null;
  private _activeChoice: number = 0;
  private _plate: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
  private _textures: Texture[] = [];
  private _vfx: ThreeVfxRenderer | null = null;
  private _dust: ThreeVfxEffectInstance | null = null;
  private _abort: AbortController = new AbortController();
  private _story: StoryController = new StoryController(String(SEED));
  private _lastFrame: BootFrame | null = null;
  private _pace: number = 1;
  private _previousMs: number = 0;
  private _raf: number = 0;
  private _isReduced: boolean = false;
  private _isDestroyed: boolean = false;
  private _root: HTMLElement | null = null;
  private _prelude: HTMLElement | null = null;
  private _feed: HTMLElement | null = null;
  private _transcript: HTMLElement | null = null;
  private _question: HTMLElement | null = null;
  private _accessibleQuestion: HTMLElement | null = null;
  private _choices: HTMLFieldSetElement | null = null;

  public init(): void {
    this._root = getElement('main', HTMLElement);
    this._prelude = getElement('#os-prelude-ts', HTMLElement);
    this._feed = getElement('#os-feed-ts', HTMLElement);
    this._transcript = getElement('#os-transcript-ts', HTMLElement);
    this._question = getElement('#os-question-ts', HTMLElement);
    this._accessibleQuestion = getElement('#os-accessible-question-ts', HTMLElement);
    this._choices = getElement('#os-choices-ts', HTMLFieldSetElement);
    document.querySelectorAll<HTMLElement>('.os-choice-copy').forEach((element: HTMLElement, index: number): void => { element.textContent = BOOT_OPTIONS[index]; });
    const canvas: HTMLCanvasElement = getElement('#os-canvas-ts', HTMLCanvasElement);
    const motion: MediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');
    this._isReduced = motion.matches;
    const signal: AbortSignal = this._abort.signal;
    const params: URLSearchParams = new URLSearchParams(location.search);
    this._chapterTwo.init(this._root, params.has('debug'));
    const pace: number = Number(params.get('pace') ?? 1);
    this._pace = params.has('debug') && Number.isFinite(pace) ? Math.min(Math.max(pace, 1), 20) : 1;
    motion.addEventListener('change', () => { this._isReduced = motion.matches; }, { signal });
    getElement('#os-begin-ts', HTMLButtonElement).addEventListener('click', () => this._start(), { signal });
    getElement('#os-enter-ts', HTMLButtonElement).addEventListener('click', () => this._enterDoor(), { signal });
    getElement('#os-replay-ts', HTMLButtonElement).addEventListener('click', () => this._reset(), { signal });
    window.addEventListener('resize', () => this._resize(), { signal });
    window.addEventListener('keydown', this._onKeyDown, { signal });
    window.addEventListener('pointermove', (event: PointerEvent): void => {
      if (this._camera) this._spatial.hover(this._spatial.pick(event.clientX, event.clientY, this._camera));
    }, { signal });
    window.addEventListener('pointerup', (event: PointerEvent): void => {
      if (!this._camera || (event.target instanceof Element && event.target.closest('button'))) return;
      if (!this._story.isStarted) { this._start(); return; }
      const index: number = this._spatial.pick(event.clientX, event.clientY, this._camera);
      if (index >= 0) this._answerChoice(index);
    }, { signal });
    this._choices.addEventListener('change', (): void => {
      const inputs: HTMLInputElement[] = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="story"]'));
      this._activeChoice = inputs.findIndex((input: HTMLInputElement): boolean => input.checked);
      this._spatial.select(this._activeChoice);
    }, { signal });
    window.addEventListener('pagehide', (event: PageTransitionEvent) => {
      if (!event.persisted) this.destroy();
    }, { signal });
    // A BFCache resume is not elapsed story time.
    window.addEventListener('pageshow', (event: PageTransitionEvent) => {
      if (event.persisted) this._previousMs = performance.now();
    }, { signal });
    canvas.addEventListener('webglcontextlost', (event: Event) => {
      event.preventDefault();
      this._showError('The picture was interrupted. Reload to try again.');
    }, { signal });
    try {
      this._renderer = new WebGLRenderer({ canvas, alpha: false, antialias: true });
      this._renderer.setClearColor(0x000000);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this._scene = new Scene();
      this._camera = new PerspectiveCamera(36, 1, 0.1, 40);
      this._camera.position.z = 10;
      this._spatial.init(this._scene);
      this._stars.init(this._scene, SEED);
      if (params.has('debug') && params.has('art')) {
        this._artControls = new GUI({ title: 'Three.js stars — live study' });
        this._artControls.add(this._stars.settings, 'speed', 0, 1.5, 0.01);
        this._artControls.add(this._stars.settings, 'intensity', 0, 1, 0.01);
        this._artControls.add(this._stars.settings, 'size', 1, 5, 0.1);
        this._artControls.add(this._stars.settings, 'count', 0, 360, 1);
      }
      this._threshold.init(this._scene, (): void => {
        if (this._root) this._root.dataset.osDoorTs = 'ready';
        this._applyFrame(this._story.frame);
      }, (): void => this._showError('The doorway could not load. Reload to try again.'));
      const bundle = loadVfxExportBundle(dustBundle, { requiredBackend: 'three3d', requiredEffectIds: ['boot-dust'], requireEveryAsset: true });
      const effect = bundle.effectsById.get('boot-dust');
      if (!effect) throw new Error('Boot dust is missing');
      this._vfx = new ThreeVfxRenderer({ scene: this._scene, camera: this._camera });
      this._dust = this._vfx.createEffect(effect, { seed: SEED, autoStart: false });
      let loaded: number = 0;
      const loader: TextureLoader = new TextureLoader();
      this._textures = PLATE_URLS.map((url: string): Texture => {
        const texture: Texture = loader.load(url, (image: Texture): void => {
          if (this._isDestroyed) { image.dispose(); return; }
          loaded += 1;
          if (loaded !== PLATE_URLS.length || !this._plate || !this._root) return;
          if (!(image.image instanceof HTMLImageElement)) {
            this._showError('The opening image could not decode. Reload to try again.');
            return;
          }
          this._plate.material.uniforms.imageAspect.value = image.image.width / image.image.height;
          this._root.dataset.osArtTs = 'ready';
          this._previousMs = performance.now();
          this._raf = requestAnimationFrame(this._update);
        }, undefined, () => this._showError('The opening image could not load. Reload to try again.'));
        texture.colorSpace = SRGBColorSpace;
        return texture;
      });
      const material: ShaderMaterial = new ShaderMaterial({
        uniforms: {
          distantImage: { value: this._textures[0] }, foldImage: { value: this._textures[1] }, thresholdImage: { value: this._textures[2] },
          firstMix: { value: 0 }, secondMix: { value: 0 }, zoom: { value: 1 }, viewAspect: { value: 1 }, imageAspect: { value: 1 },
          reveal: { value: 0 }, drift: { value: new Vector2() },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        depthWrite: false,
      });
      this._plate = new Mesh(new PlaneGeometry(2, 2), material);
      this._plate.position.z = -1;
      this._scene.add(this._plate);
      this._resize();
      if (new URLSearchParams(location.search).has('debug')) {
        Object.assign(window, { __INTRO_DIAGNOSTICS__: {
          renderer: this._renderer.info,
          effects: BOOT_EFFECTS,
          getState: (): object => ({ phase: this._story.frame.phase, elapsedMs: this._story.elapsedMs, ambientMs: this._story.ambientMs, formationMs: this._story.formationMs, sceneIndex: this._story.sceneIndex, answers: [...this._story.answers], thread: this._story.thread, cameraZ: this._story.cameraZ, door: this._threshold.getState(), cursor: this._spatial.getCursorPosition(), voice: this._spatial.getVoice(), text: 'batched-glyph-assets',
            background: { time: this._isReduced ? 0 : this._visualMs, drift: this._plate?.material.uniforms.drift.value.toArray(), zoom: this._plate?.material.uniforms.zoom.value }, stars: this._stars.getState() }),
        } });
      }
    } catch (error: unknown) {
      this._showError(error instanceof Error ? `The opening could not start. ${error.message}` : 'The opening could not start. Reload to try again.');
    }
  }

  private _resize(): void {
    if (!this._renderer || !this._camera || !this._plate || !this._dust) return;
    const width: number = window.innerWidth;
    const height: number = window.innerHeight;
    const halfHeight: number = Math.tan(this._camera.fov * Math.PI / 360) * 11;
    const halfWidth: number = halfHeight * width / height;
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._plate.scale.set(halfWidth, halfHeight, 1);
    this._spatial.resize(width / height);
    this._plate.material.uniforms.viewAspect.value = width / height;
    this._dust.root.position.set(halfWidth * 0.3, VIEW_HEIGHT * 0.05, 0);
  }

  private _reset(): void {
    this._chapterTwo.stop();
    this._story.reset();
    this._visualMs = 0;
    this._lastFrame = null;
    this._previousMs = performance.now();
    this._spatial.reset();
    this._activeChoice = 0;
    getElement('#os-aside-ts', HTMLElement).textContent = '';
    if (this._root) this._root.dataset.osVoiceTs = '-1';
    this._applyFrame(this._story.frame);
    this._dust?.stop();
    this._dust?.restart();
    this._dust?.pause();
    document.querySelectorAll<HTMLInputElement>('input[name="story"]').forEach((input) => { input.checked = false; });
  }

  private _update = (now: number): void => {
    if (this._isDestroyed || !this._renderer || !this._scene || !this._camera || !this._plate) return;
    const delta: number = Math.min(Math.max((now - this._previousMs) / 1000, 0), MAX_DELTA_SECONDS);
    this._previousMs = now;
    if (!document.hidden) {
      this._story.advance(delta * 1000 * this._pace);
      const displayMs: number = this._story.elapsedMs;
      const frame: BootFrame = this._story.frame;
      if (frame.phase === 'complete') {
        if (!this._chapterTwo.active) {
          this._applyFrame(frame);
          this._artControls?.hide();
          this._chapterTwo.start(this._story.thread);
        }
        this._chapterTwo.update(delta, this._renderer, this._isReduced);
        this._raf = requestAnimationFrame(this._update);
        return;
      }
      // Ambient travel never advances a question or the door's formation pose.
      // It also stays at real speed when the debug story clock is accelerated.
      if (this._story.isStarted) this._visualMs += delta * 1000;
      if (frame !== this._lastFrame) {
        this._lastFrame = frame;
        this._applyFrame(frame);
      }
      const firstMix: number = this._isReduced ? 0 : Math.min(Math.max((displayMs - FIRST_DISSOLVE_MS) / DISSOLVE_DURATION_MS, 0), 1);
      const secondMix: number = this._isReduced ? 0 : Math.min(Math.max((displayMs - SECOND_DISSOLVE_MS) / DISSOLVE_DURATION_MS, 0), 1);
      this._plate.material.uniforms.firstMix.value = firstMix;
      this._plate.material.uniforms.secondMix.value = secondMix;
      this._plate.material.uniforms.zoom.value = this._isReduced ? 1 : 1.035 + Math.min(this._visualMs / ZOOM_DURATION_MS, 1) * 0.025 + (1 - Math.cos(this._visualMs / 27000)) * 0.025;
      this._plate.material.uniforms.reveal.value = this._isReduced ? (displayMs > 4400 ? 0.7 : 0) : Math.min(Math.max((displayMs - 4400) / 1600, 0), 0.85);
      this._plate.material.uniforms.drift.value.set(this._isReduced ? 0 : Math.sin(this._visualMs / 13000) * 0.012, this._isReduced ? 0 : Math.sin(this._visualMs / 19000) * 0.01);
      this._spatial.update(this._story.ambientMs, this._isReduced);
      this._threshold.update(this._story.formationMs / FORMATION_DURATION_MS, displayMs > FIRST_DISSOLVE_MS, this._isReduced);
      this._camera.position.z = this._story.cameraZ;
      this._stars.update(this._visualMs / 1000, displayMs > FIRST_DISSOLVE_MS, this._isReduced, this._story.cameraZ);
      this._plate.position.z = this._camera.position.z - 11;
      if (this._root) this._root.dataset.osPlateTs = secondMix === 1 ? '2' : firstMix === 1 ? '1' : '0';
      const isDustVisible: boolean = !this._isReduced && displayMs > FIRST_DISSOLVE_MS && frame.phase !== 'waiting';
      if (isDustVisible) {
        this._dust?.play();
        this._vfx?.update(delta);
      }
      if (this._vfx) this._vfx.root.visible = isDustVisible;
      this._renderer.render(this._scene, this._camera);
    }
    this._raf = requestAnimationFrame(this._update);
  };

  private _applyFrame(frame: BootFrame): void {
    if (!this._root || !this._prelude || !this._question || !this._choices || !this._accessibleQuestion || !this._transcript || !this._feed) return;
    if (this._isReduced && frame.isCorrupt) return;
    this._root.dataset.osPhaseTs = frame.phase;
    this._root.dataset.osStartedTs = String(this._story.isStarted);
    this._root.dataset.osSceneTs = String(this._story.sceneIndex);
    this._root.dataset.osCorruptTs = frame.isCorrupt ? 'true' : 'false';
    this._root.dataset.osFormatTs = frame.phase === 'waiting' ? 'settled' : String(frame.format);
    this._root.dataset.osTextTs = 'three';
    this._spatial.setFrame(frame);
    if (frame.phase === 'debating') {
      getElement('#os-aside-ts', HTMLElement).textContent = (frame.debate ?? []).map((line): string => line.text).join('\n');
      this._root.dataset.osVoiceTs = String(this._spatial.getVoice());
    }
    this._prelude.textContent = frame.prelude;
    this._transcript.textContent = frame.transcript;
    this._question.textContent = frame.question;
    // Discrete line-feed jumps, not a smooth page scroll; only while output is changing.
    this._feed.scrollTop = this._feed.scrollHeight;
    this._choices.disabled = frame.phase !== 'waiting';
    document.querySelectorAll<HTMLElement>('.os-choice-copy').forEach((element: HTMLElement, index: number): void => { element.textContent = frame.options[index] ?? ''; });
    getElement('#os-begin-ts', HTMLButtonElement).disabled = this._story.isStarted;
    getElement('#os-enter-ts', HTMLButtonElement).disabled = frame.phase !== 'doorway' || !this._threshold.isReady;
    getElement('#os-hint-ts', HTMLElement).textContent = frame.phase === 'cursor' ? 'Enter · touch to begin' : frame.phase === 'waiting' ? '1 2 3 · ↑ ↓ then Enter · click an answer' : frame.phase === 'doorway' ? 'Enter · W · step through' : frame.phase === 'complete' ? 'Scene 1 complete' : '';
    // Screen readers hear the complete question once, not a stream of corrected letters.
    this._accessibleQuestion.textContent = frame.phase === 'waiting' ? frame.question : '';
  }

  private _selectChoice(index: number): void {
    const inputs: NodeListOf<HTMLInputElement> = document.querySelectorAll<HTMLInputElement>('input[name="story"]');
    if (this._story.frame.phase !== 'waiting' || !inputs[index]) return;
    this._activeChoice = index;
    inputs[index].checked = true;
    this._spatial.select(index);
  }

  private _start(): void {
    if (this._root?.dataset.osArtTs !== 'ready') return;
    this._story.start();
    this._applyFrame(this._story.frame);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  private _enterDoor(): void {
    if (this._threshold.isReady) this._story.enterDoor();
  }

  private _answerChoice(index: number): void {
    if (!this._story.choose(index)) return;
    this._activeChoice = 0;
    this._spatial.select(-1);
    document.querySelectorAll<HTMLInputElement>('input[name="story"]').forEach((input: HTMLInputElement): void => { input.checked = false; });
    this._applyFrame(this._story.frame);
    if (document.activeElement instanceof HTMLInputElement) document.activeElement.blur();
  }

  private _onKeyDown = (event: KeyboardEvent): void => {
    if (this._chapterTwo.active) return;
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    if (!this._story.isStarted) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this._start(); }
      return;
    }
    if (this._story.frame.phase === 'doorway' && ['Enter', ' ', 'w', 'W', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      this._enterDoor();
      return;
    }
    if (this._story.frame.phase === 'debating') return;
    if (this._story.frame.phase !== 'waiting') {
      const aside: string | null = this._spatial.interrupt(this._story.ambientMs);
      if (aside) {
        getElement('#os-aside-ts', HTMLElement).textContent = aside;
        if (this._root) this._root.dataset.osVoiceTs = String(this._spatial.getVoice());
      }
      return;
    }
    if (event.target instanceof HTMLInputElement && event.key !== 'Enter') return;
    if (['ArrowDown', 'ArrowUp', ' ', 'Enter', '1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowDown') this._activeChoice = (this._activeChoice + 1) % 3;
      if (event.key === 'ArrowUp') this._activeChoice = (this._activeChoice + 2) % 3;
      if (['1', '2', '3'].includes(event.key)) this._activeChoice = Number(event.key) - 1;
      this._selectChoice(this._activeChoice);
      if (['1', '2', '3', 'Enter', ' '].includes(event.key)) this._answerChoice(this._activeChoice);
    }
  };

  private _showError(message: string): void {
    const error: HTMLElement = getElement('#os-error-ts', HTMLElement);
    error.textContent = message;
    if (this._root) this._root.dataset.osArtTs = 'error';
    this.destroy();
  }

  public destroy(): void {
    this._isDestroyed = true;
    cancelAnimationFrame(this._raf);
    this._abort.abort();
    this._vfx?.destroy();
    this._spatial.destroy();
    this._threshold.destroy();
    this._chapterTwo.destroy();
    this._stars.destroy();
    this._artControls?.destroy();
    this._plate?.geometry.dispose();
    this._plate?.material.dispose();
    this._textures.forEach((texture: Texture): void => texture.dispose());
    this._renderer?.dispose();
  }
}

import { loadVfxExportBundle } from 'nixie-fx/export';
import { ThreeVfxRenderer, type ThreeVfxEffectInstance } from 'nixie-fx/three';
import { ACESFilmicToneMapping, Mesh, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader, Vector2, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import distantUrl from '../../assets/intro/optical-variations/optical-a-distant.webp';
import foldUrl from '../../assets/intro/optical-variations/optical-b-fold.webp';
import thresholdUrl from '../../assets/intro/optical-variations/optical-c-threshold.webp';
import { CHRONICLE_FINAL, CHRONICLE_FINAL_DRAFT, createChronicleQuestions, type ChronicleQuestion } from './chronicle';
import { createBootFrames, type BootFrame } from './ghostwriting';
import { IntroAudio } from './IntroAudio';
import type { IntroPhysicsDiagnostics } from './IntroPhysics';
import { BOOT_EFFECTS, SpatialBootScene } from './SpatialBootScene';
import dustBundle from './vfx/boot-dust.bundle.json';

const SEED: number = 472;
const MAX_DELTA_SECONDS: number = 0.1;
const PLATE_URLS: string[] = [distantUrl, foldUrl, thresholdUrl];
const FIRST_DISSOLVE_MS: number = 3500;
const DISSOLVE_DURATION_MS: number = 2500;
const ZOOM_DURATION_MS: number = 16000;
const VIEW_HEIGHT: number = 6.4;
const TEST_STATE_NAMES = ['boot-cursor', 'question-1', 'question-2', 'question-3', 'question-4', 'final-door', 'complete'] as const;
type TestStateName = typeof TEST_STATE_NAMES[number];
type StoryMode = 'boot' | 'waiting' | 'prelude' | 'question' | 'response' | 'travel' | 'final' | 'complete';

interface IntroDiagnosticState {
  frame: number;
  phase: BootFrame['phase'];
  storyMode: StoryMode;
  questionIndex: number;
  objective: string;
  objectiveProgress: number;
  complete: boolean;
  failed: boolean;
  canContinue: boolean;
  selectedChoice: number;
  playerPosition: { x: number; y: number; z: number };
  choiceTargets: Array<{ x: number; y: number; z: number }>;
  seed: string;
  audio: { unlocked: boolean; muted: boolean; cueCount: number };
  physics: IntroPhysicsDiagnostics;
  viewport: { width: number; height: number; dpr: number };
  activeLoops: number;
  pausedForScreenshot: boolean;
  debugUiHidden: boolean;
}

interface IntroTestHooks {
  seed(value: string | number): Promise<{ seed: string }>;
  setState(name: string): Promise<{ state: TestStateName }>;
  setPausedForScreenshot(paused?: boolean): void;
  setReducedMotion(reduced: boolean): void;
  hideDebugUi(hidden?: boolean): void;
}

type IntroTestWindow = {
  __THREE_GAME_DIAGNOSTICS__?: {
    readonly renderer: { readonly calls: number; readonly triangles: number; readonly geometries: number; readonly textures: number };
    readonly state: IntroDiagnosticState;
  };
  __THREE_GAME_TEST_HOOKS__?: IntroTestHooks;
};
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
  private _spatialReady: Promise<void> = Promise.resolve();
  private _audio: IntroAudio = new IntroAudio();
  private _activeChoice: number = 0;
  private _plate: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
  private _textures: Texture[] = [];
  private _environment: Texture | null = null;
  private _vfx: ThreeVfxRenderer | null = null;
  private _dust: ThreeVfxEffectInstance | null = null;
  private _abort: AbortController = new AbortController();
  private _questions: readonly ChronicleQuestion[] = createChronicleQuestions(SEED);
  private _frames: BootFrame[] = createBootFrames(String(SEED), this._questions[0]);
  private _frameIndex: number = -1;
  private _elapsedMs: number = 0;
  private _motionMs: number = 0;
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
  private _storyMode: StoryMode = 'boot';
  private _questionIndex: number = 0;
  private _storyStartedAt: number = 0;
  private _canContinue: boolean = false;
  private _selectedChoice: number = -1;
  private _lastAudioText: string = '';
  private _lastAudioFormat: number = 0;
  private _lastAudioPhase: BootFrame['phase'] = 'cursor';
  private _lastAudioCorrupt: boolean = false;
  private _secondMix: number = 0;
  private _isDebug: boolean = false;
  private _diagnosticFrame: number = 0;
  private _frameNumber: number = 0;
  private _hasStarted: boolean = false;
  private _simulationPaused: boolean = false;
  private _seed: string = String(SEED);
  private _answersCommitted: number = 0;
  private _debugUiHidden: boolean = false;
  private _movementKeys: Set<string> = new Set();
  private _currentFrame: BootFrame | null = null;

  public init(): void {
    this._root = getElement('main', HTMLElement);
    this._prelude = getElement('#os-prelude-ts', HTMLElement);
    this._feed = getElement('#os-feed-ts', HTMLElement);
    this._transcript = getElement('#os-transcript-ts', HTMLElement);
    this._question = getElement('#os-question-ts', HTMLElement);
    this._accessibleQuestion = getElement('#os-accessible-question-ts', HTMLElement);
    this._choices = getElement('#os-choices-ts', HTMLFieldSetElement);
    this._isDebug = new URLSearchParams(location.search).has('debug');
    document.querySelectorAll<HTMLElement>('.os-choice-copy').forEach((element: HTMLElement, index: number): void => {
      element.textContent = this._questions[0].choices[index]?.text ?? '';
    });
    const canvas: HTMLCanvasElement = getElement('#os-canvas-ts', HTMLCanvasElement);
    const motion: MediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');
    this._isReduced = motion.matches;
    const signal: AbortSignal = this._abort.signal;
    motion.addEventListener('change', () => { this._isReduced = motion.matches; }, { signal });
    getElement('#os-replay-ts', HTMLButtonElement).addEventListener('click', () => this._reset(), { signal });
    getElement('#os-sound-ts', HTMLButtonElement).addEventListener('click', () => {
      if (!this._hasStarted) void this._beginBootFromGesture();
      else if (!this._audio.unlocked) void this._unlockAudio();
      else {
        this._audio.setMuted(!this._audio.muted);
        this._syncAudioLabel();
      }
    }, { signal });
    window.addEventListener('resize', () => this._resize(), { signal });
    window.addEventListener('keydown', this._onKeyDown, { signal });
    window.addEventListener('keyup', this._onKeyUp, { signal });
    window.addEventListener('blur', () => this._clearMovement(), { signal });
    window.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('#os-sound-ts')) return;
      if (!this._hasStarted) void this._beginBootFromGesture();
      else void this._unlockAudio();
    }, { signal, capture: true });
    window.addEventListener('pointermove', (event: PointerEvent): void => {
      if (this._camera) this._spatial.hover(this._spatial.pick(event.clientX, event.clientY, this._camera));
    }, { signal });
    window.addEventListener('pointerup', (event: PointerEvent): void => {
      if (!this._camera || (event.target instanceof Element && event.target.closest('button'))) return;
      const index: number = this._spatial.pick(event.clientX, event.clientY, this._camera);
      if (index >= 0) this._commitChoice(index);
      else if (this._canContinue) this._advanceStory();
    }, { signal });
    this._choices.addEventListener('change', (): void => {
      const inputs: HTMLInputElement[] = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="story"]'));
      this._activeChoice = inputs.findIndex((input: HTMLInputElement): boolean => input.checked);
      this._spatial.select(this._activeChoice);
      if (this._activeChoice >= 0 && this._storyMode === 'waiting') this._commitChoice(this._activeChoice);
    }, { signal });
    this._bindTouchControls(signal);
    window.addEventListener('pagehide', (event: PageTransitionEvent) => {
      if (!event.persisted) this.destroy();
    }, { signal });
    // A BFCache resume is not elapsed story time.
    window.addEventListener('pageshow', (event: PageTransitionEvent) => {
      if (event.persisted) this._previousMs = performance.now();
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._clearMovement();
        void this._audio.suspend();
      }
      else void this._audio.resume();
    }, { signal });
    canvas.addEventListener('webglcontextlost', (event: Event) => {
      event.preventDefault();
      this._showError('The picture was interrupted. Reload to try again.');
    }, { signal });
    try {
      this._renderer = new WebGLRenderer({ canvas, alpha: false, antialias: true });
      this._renderer.setClearColor(0x000000);
      this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.5 : 2));
      this._renderer.outputColorSpace = SRGBColorSpace;
      this._renderer.toneMapping = ACESFilmicToneMapping;
      this._renderer.toneMappingExposure = 1.08;
      this._scene = new Scene();
      const pmrem: PMREMGenerator = new PMREMGenerator(this._renderer);
      this._environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this._scene.environment = this._environment;
      pmrem.dispose();
      this._camera = new PerspectiveCamera(36, 1, 0.1, 40);
      this._camera.position.z = 10;
      if (this._root) this._root.dataset.osPhysicsTs = 'loading';
      this._spatialReady = this._spatial.init(this._scene).then((): void => {
        if (this._root) this._root.dataset.osPhysicsTs = 'ready';
      }).catch((error: unknown): void => {
        this._showError(error instanceof Error ? `The movement system could not start. ${error.message}` : 'The movement system could not start.');
      });
      const particleDiagnostics = this._spatial.getParticleDiagnostics();
      if (this._root) {
        this._root.dataset.osParticlesTs = String(particleDiagnostics.lightParticles + particleDiagnostics.darkParticles);
        this._root.dataset.osParticleDrawsTs = String(particleDiagnostics.drawCalls);
      }
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
      if (this._isDebug) this._installTestContracts();
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
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 760 ? 1.5 : 2));
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._plate.scale.set(halfWidth, halfHeight, 1);
    this._spatial.resize(width / height);
    this._plate.material.uniforms.viewAspect.value = width / height;
    this._dust.root.position.set(halfWidth * 0.3, VIEW_HEIGHT * 0.05, 0);
  }

  private _reset(): void {
    this._elapsedMs = 0;
    this._motionMs = 0;
    this._frameIndex = -1;
    this._previousMs = performance.now();
    this._storyMode = 'boot';
    this._hasStarted = false;
    this._questionIndex = 0;
    this._storyStartedAt = 0;
    this._canContinue = false;
    this._selectedChoice = -1;
    this._lastAudioText = '';
    this._lastAudioFormat = 0;
    this._lastAudioPhase = 'cursor';
    this._lastAudioCorrupt = false;
    this._secondMix = 0;
    this._simulationPaused = false;
    this._answersCommitted = 0;
    this._clearMovement();
    this._spatial.reset();
    this._activeChoice = 0;
    getElement('#os-aside-ts', HTMLElement).textContent = '';
    if (this._root) {
      this._root.dataset.osVoiceTs = '-1';
      this._root.dataset.osStartedTs = 'false';
    }
    this._applyFrame(this._frames[0], true);
    this._dust?.stop();
    this._dust?.restart();
    this._dust?.pause();
    document.querySelectorAll<HTMLInputElement>('input[name="story"]').forEach((input) => { input.checked = false; });
  }

  private _update = (now: number): void => {
    if (this._isDestroyed || !this._renderer || !this._scene || !this._camera || !this._plate) return;
    const delta: number = Math.min(Math.max((now - this._previousMs) / 1000, 0), MAX_DELTA_SECONDS);
    this._previousMs = now;
    this._frameNumber += 1;
    if (this._simulationPaused) {
      this._renderer.render(this._scene, this._camera);
      this._raf = requestAnimationFrame(this._update);
      return;
    }
    if (!document.hidden) {
      this._motionMs += delta * 1000;
      const endMs: number = this._frames[this._frames.length - 1].at;
      if (this._storyMode === 'boot' && this._hasStarted) this._elapsedMs = this._isReduced ? endMs : Math.min(this._elapsedMs + delta * 1000, endMs);
      const displayMs: number = this._elapsedMs;
      let next: number = this._frameIndex;
      if (this._storyMode === 'boot') {
        while (next + 1 < this._frames.length && this._frames[next + 1].at <= displayMs) next += 1;
        if (next !== this._frameIndex) {
          this._frameIndex = next;
          this._applyFrame(this._frames[next], true);
        }
      }
      const firstMix: number = this._isReduced ? 0 : Math.min(Math.max((displayMs - FIRST_DISSOLVE_MS) / DISSOLVE_DURATION_MS, 0), 1);
      const targetSecondMix: number = this._storyMode === 'boot' ? 0 : this._storyMode === 'final' || this._storyMode === 'complete' ? 1 : this._questionIndex / Math.max(1, this._questions.length - 1);
      this._secondMix += (targetSecondMix - this._secondMix) * Math.min(1, delta * (this._isReduced ? 60 : 0.42));
      this._plate.material.uniforms.firstMix.value = firstMix;
      this._plate.material.uniforms.secondMix.value = this._secondMix;
      this._plate.material.uniforms.zoom.value = this._isReduced ? 1 : 1 + Math.min(this._motionMs / ZOOM_DURATION_MS, 1) * 0.06 + this._questionIndex * 0.009;
      this._plate.material.uniforms.reveal.value = this._isReduced ? 0.7 : Math.min(Math.max((displayMs - 4400) / 1600, 0), 0.85);
      this._plate.material.uniforms.drift.value.set(this._isReduced ? 0 : Math.sin(this._motionMs / 13000) * 0.019, this._isReduced ? 0 : Math.cos(this._motionMs / 19000) * 0.013);
      if (this._storyMode !== 'boot' && this._storyMode !== 'waiting' && this._storyMode !== 'complete') this._updateStory(now);
      const spatialEvent: number = this._spatial.update(this._motionMs, this._isReduced);
      if ((this._storyMode === 'waiting' || this._storyMode === 'travel') && this._movementKeys.size > 0) this._audio.move(this._answersCommitted);
      if (spatialEvent >= 0 && this._storyMode === 'waiting') this._commitChoice(spatialEvent);
      else if (spatialEvent === -2 && this._storyMode === 'travel') this._beginPrelude(this._questionIndex);
      if (this._root) this._root.dataset.osPlateTs = this._secondMix > 0.98 ? '2' : firstMix === 1 ? '1' : '0';
      const isDustVisible: boolean = !this._isReduced && displayMs > FIRST_DISSOLVE_MS && displayMs < endMs;
      if (isDustVisible) {
        this._dust?.play();
        this._vfx?.update(delta);
      }
      if (this._vfx) this._vfx.root.visible = isDustVisible;
      this._renderer.render(this._scene, this._camera);
      if (this._isDebug && this._root && this._diagnosticFrame++ % 60 === 0) {
        const particleDiagnostics = this._spatial.getParticleDiagnostics();
        this._root.dataset.osDrawCallsTs = String(this._renderer.info.render.calls);
        this._root.dataset.osTrianglesTs = String(this._renderer.info.render.triangles);
        this._root.dataset.osGeometriesTs = String(this._renderer.info.memory.geometries);
        this._root.dataset.osTexturesTs = String(this._renderer.info.memory.textures);
        this._root.dataset.osParticleSurfaceTs = particleDiagnostics.surfaceFormation > 0.002 ? 'formed' : 'open';
        this._root.dataset.osParticleDrawsTs = String(particleDiagnostics.drawCalls);
        const physicsDiagnostics: IntroPhysicsDiagnostics = this._spatial.getPhysicsDiagnostics();
        this._root.dataset.osPhysicsBodiesTs = String(physicsDiagnostics.bodies);
        this._root.dataset.osPhysicsCollidersTs = String(physicsDiagnostics.colliders);
        this._root.dataset.osPhysicsSensorsTs = String(physicsDiagnostics.activeSensors);
        this._root.dataset.osPhysicsStepsTs = String(physicsDiagnostics.steps);
      }
    }
    this._raf = requestAnimationFrame(this._update);
  };

  private _applyFrame(frame: BootFrame, fromBoot: boolean = false): void {
    if (!this._root || !this._prelude || !this._question || !this._choices || !this._accessibleQuestion || !this._transcript || !this._feed) return;
    if (this._isReduced && frame.isCorrupt) return;
    this._currentFrame = frame;
    if (fromBoot && frame.phase === 'waiting') {
      this._storyMode = 'waiting';
      this._questionIndex = 0;
      this._canContinue = false;
    }
    this._root.dataset.osPhaseTs = frame.phase;
    this._root.dataset.osStoryModeTs = this._storyMode;
    this._root.dataset.osCorruptTs = frame.isCorrupt ? 'true' : 'false';
    this._root.dataset.osFormatTs = frame.phase === 'waiting' ? 'settled' : String(frame.format);
    this._root.dataset.osTextTs = 'three';
    this._root.dataset.osQuestionTs = String(this._questionIndex);
    this._root.dataset.osCanContinueTs = String(this._canContinue);
    this._spatial.setFrame(frame);
    this._prelude.textContent = frame.prelude;
    this._transcript.textContent = frame.transcript;
    this._question.textContent = frame.question;
    document.querySelectorAll<HTMLElement>('.os-choice-copy').forEach((element: HTMLElement, index: number): void => {
      element.textContent = frame.choices[index] ?? '';
    });
    // Discrete line-feed jumps, not a smooth page scroll; only while output is changing.
    this._feed.scrollTop = this._feed.scrollHeight;
    this._choices.disabled = frame.phase !== 'waiting';
    // Screen readers hear the complete question once, not a stream of corrected letters.
    this._accessibleQuestion.textContent = frame.phase === 'waiting' || frame.phase === 'complete' ? frame.question : '';
    this._soundFrame(frame);
  }

  private _highlightChoice(index: number): void {
    const inputs: NodeListOf<HTMLInputElement> = document.querySelectorAll<HTMLInputElement>('input[name="story"]');
    if (!inputs[index] || inputs[index].disabled) return;
    this._activeChoice = index;
    inputs[index].checked = true;
    this._spatial.select(index);
  }

  private _commitChoice(index: number): void {
    if (this._storyMode !== 'waiting') return;
    this._highlightChoice(index);
    this._selectedChoice = index;
    this._answersCommitted += 1;
    const question: ChronicleQuestion = this._questions[this._questionIndex];
    this._spatial.commitChoice(index);
    this._spatial.setPlayerStage(this._answersCommitted);
    this._spatial.archive(question.choices[index].text, question.era, index);
    this._audio.choose(index);
    this._audio.dreamweaver(index);
    this._storyMode = 'response';
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._setChoicesEnabled(false);
    this._clearMovement();
  }

  private _beginPrelude(index: number): void {
    this._questionIndex = index;
    this._storyMode = 'prelude';
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._selectedChoice = -1;
    this._activeChoice = 0;
    this._spatial.select(-1);
    this._clearNativeChoices();
    this._audio.transition();
    this._clearMovement();
  }

  private _beginTravel(index: number): void {
    this._questionIndex = index;
    this._storyMode = 'travel';
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._spatial.beginJourney();
    this._applyFrame(this._storyFrame('', 'travel', this._questions[index].era, 'W / ↑  //  WALK UNTIL IT ASKS', 0));
  }

  private _beginQuestion(): void {
    this._storyMode = 'question';
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._audio.era(this._questions[this._questionIndex].era);
  }

  private _beginFinal(): void {
    this._storyMode = 'final';
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._selectedChoice = -1;
    this._spatial.select(-1);
    this._clearNativeChoices();
    this._audio.threshold();
  }

  private _advanceStory(): void {
    if (!this._canContinue) return;
    if (this._storyMode === 'prelude') {
      this._beginQuestion();
      return;
    }
    if (this._storyMode === 'response') {
      if (this._questionIndex >= this._questions.length - 1) this._beginFinal();
      else this._beginTravel(this._questionIndex + 1);
    }
  }

  private _updateStory(now: number): void {
    const elapsedMs: number = Math.max(0, now - this._storyStartedAt);
    const question: ChronicleQuestion = this._questions[Math.min(this._questionIndex, this._questions.length - 1)];
    if (this._storyMode === 'prelude') {
      const text: string = this._typed(question.prelude, elapsedMs, 44);
      const complete: boolean = text.length >= question.prelude.length;
      this._canContinue = complete;
      this._applyFrame(this._storyFrame(text, 'prelude', question.era, complete ? 'ENTER  //  LET IT ASK' : undefined, elapsedMs));
      return;
    }
    if (this._storyMode === 'question') {
      const speed: number[] = [80, 65, 50, 38];
      let text: string = this._typed(question.question, elapsedMs, speed[this._questionIndex]);
      const completeAt: number = this._isReduced ? 0 : question.question.length * speed[this._questionIndex];
      const complete: boolean = this._isReduced || elapsedMs >= completeAt;
      if (!complete && text.length > 4 && Math.floor(elapsedMs / 230) % 17 === 0) text += ['_', '?', '/', '#'][Math.floor(elapsedMs / 130) % 4];
      if (complete && elapsedMs >= completeAt + (this._isReduced ? 0 : 850)) {
        this._storyMode = 'waiting';
        this._canContinue = false;
        this._applyFrame(this._storyFrame(question.question, 'waiting', question.era, undefined, elapsedMs));
      } else {
        this._applyFrame(this._storyFrame(text, 'question', question.era, undefined, elapsedMs, !complete && text.endsWith('#')));
      }
      return;
    }
    if (this._storyMode === 'response' && this._selectedChoice >= 0) {
      const response: string = question.choices[this._selectedChoice].response;
      const speed: number[] = [43, 39, 35, 32];
      const typed: string = this._typed(response, elapsedMs, speed[this._questionIndex]);
      const complete: boolean = typed.length >= response.length;
      const display: string = this._dreamweaverWriting(typed, elapsedMs, this._selectedChoice, complete);
      this._canContinue = complete;
      this._applyFrame(this._storyFrame(display, 'response', question.era, complete ? (this._questionIndex < this._questions.length - 1 ? 'ENTER  //  WALK ON' : 'ENTER  //  OPEN THE THRESHOLD') : undefined, elapsedMs));
      return;
    }
    if (this._storyMode === 'final') {
      const text: string = this._finalText(elapsedMs);
      const complete: boolean = text.length >= CHRONICLE_FINAL.length;
      if (complete) this._storyMode = 'complete';
      this._applyFrame(this._storyFrame(text, complete ? 'complete' : 'final', 4, complete ? 'ALL THREE FOLLOWED' : undefined, elapsedMs));
    }
  }

  private _storyFrame(text: string, phase: BootFrame['phase'], format: number, hint: string | undefined, phaseElapsedMs: number, isCorrupt: boolean = false): BootFrame {
    const question: ChronicleQuestion = this._questions[Math.min(this._questionIndex, this._questions.length - 1)];
    return {
      at: this._motionMs,
      prelude: phase === 'question' || phase === 'waiting' ? question.prelude : phase === 'final' || phase === 'complete' ? question.prelude : '',
      question: text,
      transcript: this._frames.at(-1)?.transcript ?? '',
      choices: question.choices.map((choice): string => choice.text),
      isCorrupt,
      phase,
      format,
      phaseElapsedMs,
      hint,
    };
  }

  private _typed(text: string, elapsedMs: number, millisecondsPerCharacter: number): string {
    if (this._isReduced) return text;
    return text.slice(0, Math.min(text.length, Math.floor(elapsedMs / millisecondsPerCharacter)));
  }

  private _dreamweaverWriting(text: string, elapsedMs: number, owner: number, complete: boolean): string {
    if (complete || this._isReduced || text.length < 4) return text;
    if (owner === 0 && Math.floor(elapsedMs / 410) % 11 === 0) return `${text}\n${text.slice(Math.max(0, text.lastIndexOf('\n') + 1), -1)}`;
    if (owner === 1 && Math.floor(elapsedMs / 290) % 13 === 0) return `${text.slice(0, -Math.min(3, text.length))}___`;
    if (owner === 2 && Math.floor(elapsedMs / 180) % 17 === 0) return `${text}>`;
    return text;
  }

  private _finalText(elapsedMs: number): string {
    if (this._isReduced) return CHRONICLE_FINAL;
    if (elapsedMs < 3200) return CHRONICLE_FINAL_DRAFT.slice(0, Math.floor(elapsedMs / 55));
    if (elapsedMs < 4400) return CHRONICLE_FINAL_DRAFT;
    if (elapsedMs < 4800) return '[SYSTEM: Dreamweaver thread sele_ted - {{THREAD_NAME}}]';
    if (elapsedMs < 5200) return '[SYSTEM: Dreamweaver thread ________ - {{THREAD_NAME}}]';
    if (elapsedMs < 5800) return '[SYSTEM: Dreamweaver threads following - 03]';
    const firstLine: string = '[SYSTEM: Dreamweaver threads following - 03]';
    return firstLine + CHRONICLE_FINAL.slice(firstLine.length, firstLine.length + Math.floor((elapsedMs - 5800) / 34));
  }

  private _setChoicesEnabled(enabled: boolean): void {
    if (this._choices) this._choices.disabled = !enabled;
  }

  private _clearNativeChoices(): void {
    document.querySelectorAll<HTMLInputElement>('input[name="story"]').forEach((input: HTMLInputElement): void => { input.checked = false; });
  }

  private _soundFrame(frame: BootFrame): void {
    const text: string = frame.question || frame.transcript;
    const phaseChanged: boolean = frame.phase !== this._lastAudioPhase;
    const correctionStarted: boolean = frame.isCorrupt && !this._lastAudioCorrupt;
    if (phaseChanged) this._audio.hesitate(frame.format);
    if (frame.format !== this._lastAudioFormat || correctionStarted) this._audio.correct(frame.format);
    if (text !== this._lastAudioText) {
      if (text.length < this._lastAudioText.length) this._audio.erase(frame.format);
      else this._audio.type(frame.format);
      this._lastAudioText = text;
    }
    this._lastAudioFormat = frame.format;
    this._lastAudioPhase = frame.phase;
    this._lastAudioCorrupt = frame.isCorrupt;
    this._syncAudioDiagnostics();
  }

  private _syncAudioDiagnostics(): void {
    if (!this._root) return;
    const cues = this._audio.cueCounts;
    this._root.dataset.osAudioCuesTs = String(this._audio.cueCount);
    this._root.dataset.osAudioTypesTs = String(cues.type);
    this._root.dataset.osAudioErasesTs = String(cues.erase);
    this._root.dataset.osAudioHesitationsTs = String(cues.hesitation);
    this._root.dataset.osAudioCorrectionsTs = String(cues.correction);
  }

  private async _beginBootFromGesture(): Promise<void> {
    if (this._hasStarted) return;
    const [unlocked] = await Promise.all([this._audio.unlock(), this._spatialReady]);
    if (!unlocked) {
      if (this._root) this._root.dataset.osAudioTs = 'unavailable';
      this._syncAudioLabel();
      return;
    }
    this._hasStarted = true;
    this._audio.begin();
    if (this._root) {
      this._root.dataset.osAudioTs = 'awake';
      this._root.dataset.osStartedTs = 'true';
    }
    this._syncAudioDiagnostics();
    this._previousMs = performance.now();
    this._syncAudioLabel();
  }

  private async _unlockAudio(): Promise<void> {
    const unlocked: boolean = await this._audio.unlock();
    if (this._root) this._root.dataset.osAudioTs = unlocked ? 'awake' : 'unavailable';
    this._syncAudioLabel();
  }

  private _syncAudioLabel(): void {
    const button: HTMLButtonElement = getElement('#os-sound-ts', HTMLButtonElement);
    button.textContent = !this._audio.unlocked ? 'wake sound' : this._audio.muted ? 'sound muted' : 'sound awake';
    button.setAttribute('aria-pressed', String(this._audio.unlocked && !this._audio.muted));
  }

  private _syncMovement(): void {
    const left: number = this._movementKeys.has('ArrowLeft') || this._movementKeys.has('a') || this._movementKeys.has('touch-left') ? 1 : 0;
    const right: number = this._movementKeys.has('ArrowRight') || this._movementKeys.has('d') || this._movementKeys.has('touch-right') ? 1 : 0;
    const down: number = this._movementKeys.has('ArrowDown') || this._movementKeys.has('s') || this._movementKeys.has('touch-down') ? 1 : 0;
    const up: number = this._movementKeys.has('ArrowUp') || this._movementKeys.has('w') || this._movementKeys.has('touch-up') ? 1 : 0;
    this._spatial.setMovement(right - left, up - down);
  }

  private _bindTouchControls(signal: AbortSignal): void {
    document.querySelectorAll<HTMLButtonElement>('[data-os-move]').forEach((button: HTMLButtonElement): void => {
      const direction: string = button.dataset.osMove ?? '';
      const key: string = `touch-${direction}`;
      const release = (): void => {
        button.dataset.osActive = 'false';
        this._movementKeys.delete(key);
        this._syncMovement();
      };
      button.addEventListener('pointerdown', (event: PointerEvent): void => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        button.dataset.osActive = 'true';
        this._movementKeys.add(key);
        this._syncMovement();
      }, { signal });
      button.addEventListener('pointerup', release, { signal });
      button.addEventListener('pointercancel', release, { signal });
      button.addEventListener('lostpointercapture', release, { signal });
    });
  }

  private _clearMovement(): void {
    this._movementKeys.clear();
    this._spatial.setMovement(0, 0);
    document.querySelectorAll<HTMLButtonElement>('[data-os-move]').forEach((button: HTMLButtonElement): void => { button.dataset.osActive = 'false'; });
  }

  private _onKeyUp = (event: KeyboardEvent): void => {
    const key: string = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!this._movementKeys.delete(key)) return;
    this._syncMovement();
  };

  private _onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest('button, input')) return;
    if (!this._hasStarted) {
      void this._beginBootFromGesture();
      return;
    }
    void this._unlockAudio();
    const key: string = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if ((this._storyMode === 'waiting' || this._storyMode === 'travel') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault();
      this._movementKeys.add(key);
      this._syncMovement();
      return;
    }
    if (this._storyMode === 'boot') {
      const aside: string | null = this._spatial.interrupt(this._motionMs);
      if (aside) {
        getElement('#os-aside-ts', HTMLElement).textContent = aside;
        const voice: number = this._spatial.getVoice();
        this._audio.dreamweaver(voice);
        if (this._root) this._root.dataset.osVoiceTs = String(voice);
      }
      return;
    }
    if (this._canContinue && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this._advanceStory();
      return;
    }
    if (this._storyMode === 'waiting' && [' ', 'Enter', '1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      if (['1', '2', '3'].includes(event.key)) {
        this._activeChoice = Number(event.key) - 1;
        this._commitChoice(this._activeChoice);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') this._commitChoice(this._activeChoice);
      else this._highlightChoice(this._activeChoice);
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
    this._plate?.geometry.dispose();
    this._plate?.material.dispose();
    this._textures.forEach((texture: Texture): void => texture.dispose());
    this._environment?.dispose();
    this._audio.destroy();
    this._renderer?.dispose();
    const testWindow = window as unknown as IntroTestWindow;
    delete testWindow.__THREE_GAME_DIAGNOSTICS__;
    delete testWindow.__THREE_GAME_TEST_HOOKS__;
  }

  private _installTestContracts(): void {
    if (!this._renderer) return;
    const scene: BootScene = this;
    const testWindow = window as unknown as IntroTestWindow;
    testWindow.__THREE_GAME_DIAGNOSTICS__ = {
      renderer: {
        get calls(): number { return scene._renderer?.info.render.calls ?? 0; },
        get triangles(): number { return scene._renderer?.info.render.triangles ?? 0; },
        get geometries(): number { return scene._renderer?.info.memory.geometries ?? 0; },
        get textures(): number { return scene._renderer?.info.memory.textures ?? 0; },
      },
      get state(): IntroDiagnosticState { return scene._getDiagnosticState(); },
    };
    testWindow.__THREE_GAME_TEST_HOOKS__ = {
      seed: async (value: string | number): Promise<{ seed: string }> => {
        await this._spatialReady;
        this._seed = String(value);
        this._questions = createChronicleQuestions(this._seed);
        this._frames = createBootFrames(this._seed, this._questions[0]);
        this._reset();
        return { seed: this._seed };
      },
      setState: async (name: string): Promise<{ state: TestStateName }> => {
        await this._spatialReady;
        if (!TEST_STATE_NAMES.includes(name as TestStateName)) throw new Error(`Unknown test state: ${name}`);
        const state: TestStateName = name as TestStateName;
        this._applyTestState(state);
        return { state };
      },
      setPausedForScreenshot: (paused: boolean = true): void => {
        this._simulationPaused = paused;
        this._previousMs = performance.now();
      },
      setReducedMotion: (reduced: boolean): void => {
        this._isReduced = reduced;
        if (this._root) this._root.dataset.osReducedMotionTs = String(reduced);
        this._refreshStaticFrame();
      },
      hideDebugUi: (hidden: boolean = true): void => {
        this._debugUiHidden = hidden;
        if (this._root) this._root.dataset.osDebugUiHiddenTs = String(hidden);
      },
    };
  }

  private _applyTestState(name: TestStateName): void {
    if (!this._root) throw new Error('Intro test state requested before initialization');
    if (name === 'boot-cursor') {
      this._reset();
      return;
    }
    this._hasStarted = true;
    this._root.dataset.osStartedTs = 'true';
    this._elapsedMs = this._frames.at(-1)?.at ?? 0;
    this._frameIndex = this._frames.length - 1;
    this._selectedChoice = -1;
    this._activeChoice = 0;
    this._canContinue = false;
    this._spatial.select(-1);
    this._clearNativeChoices();
    if (name.startsWith('question-')) {
      const questionIndex: number = Number(name.slice(-1)) - 1;
      const question: ChronicleQuestion | undefined = this._questions[questionIndex];
      if (!question) throw new Error(`Unknown test state: ${name}`);
      this._questionIndex = questionIndex;
      this._answersCommitted = questionIndex;
      this._spatial.setPlayerStage(questionIndex);
      this._storyMode = 'waiting';
      this._storyStartedAt = performance.now();
      this._applyFrame(this._storyFrame(question.question, 'waiting', question.era, undefined, 0));
      this._refreshStaticFrame();
      return;
    }
    this._questionIndex = this._questions.length - 1;
    this._storyStartedAt = performance.now();
    if (name === 'final-door') {
      this._storyMode = 'final';
      this._applyFrame(this._storyFrame(CHRONICLE_FINAL_DRAFT, 'final', 4, undefined, 4400));
      this._refreshStaticFrame();
      return;
    }
    this._storyMode = 'complete';
    this._applyFrame(this._storyFrame(CHRONICLE_FINAL, 'complete', 4, 'ALL THREE FOLLOWED', 12000));
    this._refreshStaticFrame();
  }

  private _refreshStaticFrame(): void {
    if (!this._renderer || !this._scene || !this._camera || !this._currentFrame) return;
    this._spatial.update(this._motionMs, this._isReduced);
    this._renderer.render(this._scene, this._camera);
  }

  private _getDiagnosticState(): IntroDiagnosticState {
    const phase: BootFrame['phase'] = (this._root?.dataset.osPhaseTs as BootFrame['phase'] | undefined) ?? 'cursor';
    const questionNumber: number = Math.min(this._questionIndex + 1, this._questions.length);
    const objective: string = this._storyMode === 'complete'
      ? 'opening-complete'
      : this._storyMode === 'final'
        ? 'reach-final-door'
        : this._storyMode === 'travel'
          ? `walk-to-question-${questionNumber}`
        : this._storyMode === 'waiting'
          ? `answer-question-${questionNumber}`
          : `advance-${this._storyMode}`;
    return {
      frame: this._frameNumber,
      phase,
      storyMode: this._storyMode,
      questionIndex: this._questionIndex,
      objective,
      objectiveProgress: this._answersCommitted,
      complete: this._storyMode === 'complete',
      failed: false,
      canContinue: this._canContinue,
      selectedChoice: this._selectedChoice >= 0 ? this._selectedChoice : this._activeChoice,
      playerPosition: this._spatial.getPlayerPosition(),
      choiceTargets: this._spatial.getChoiceTargets(),
      seed: this._seed,
      audio: { unlocked: this._audio.unlocked, muted: this._audio.muted, cueCount: this._audio.cueCount },
      physics: this._spatial.getPhysicsDiagnostics(),
      viewport: { width: window.innerWidth, height: window.innerHeight, dpr: this._renderer?.getPixelRatio() ?? 1 },
      activeLoops: this._isDestroyed || !this._raf ? 0 : 1,
      pausedForScreenshot: this._simulationPaused,
      debugUiHidden: this._debugUiHidden,
    };
  }
}

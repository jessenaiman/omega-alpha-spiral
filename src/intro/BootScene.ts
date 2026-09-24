import { loadVfxExportBundle } from "nixie-fx/export";
import { ThreeVfxRenderer, type ThreeVfxEffectInstance } from "nixie-fx/three";
import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import {
  createInputController,
  type InputController,
  type Intents,
} from "../core/input";
import type { GhostInterlude, GhostQuestion } from "../dialogue/ghost";
import {
  GHOST_FINAL,
  createGhostQuestions,
  getGhostInterlude,
} from "../dialogue/ghost-vite";
import { DialogueState, type DialogueStateSnapshot } from "../dialogue/state";
import { createBootFrames, type BootFrame } from "./ghostwriting";
import { getIntroEra } from "./IntroEraDesign";
import { IntroAudio } from "./IntroAudio";
import type { IntroPhysicsDiagnostics } from "./IntroPhysics";
import { BOOT_EFFECTS, SpatialBootScene } from "./SpatialBootScene";
import { ChapterTwoScene } from "../chapter-two/ChapterTwoScene";
import { StudioOpening, studioOpeningDocuments } from "./StudioOpening";
import { WritingPlayback } from "../dialogue/writing";
import { PROFILES, SPEAKERS } from "../dialogue/personas";
import { applyEraShaderCss } from "../era-shaders";
import dustBundle from "./vfx/boot-dust.bundle.json";

const SEED: number = 472;
const MAX_DELTA_SECONDS: number = 0.1;
const FIRST_DISSOLVE_MS: number = 3500;
const VIEW_HEIGHT: number = 6.4;
const TEST_STATE_NAMES = [
  "boot-cursor",
  "question-1",
  "question-2",
  "question-3",
  "question-4",
  "final-name",
  "final-door",
  "complete",
] as const;
type TestStateName = (typeof TEST_STATE_NAMES)[number];
type StoryMode =
  | "boot"
  | "waiting"
  | "prelude"
  | "question"
  | "response"
  | "commentary"
  | "travel"
  | "final"
  | "name"
  | "doorway"
  | "complete";
const OMEGA_NAME_QUESTION = "What is your name?";
const OMEGA_DOOR_WORDS = "I had a name once,\nwas it mine?";

interface IntroDiagnosticState {
  frame: number;
  phase: BootFrame["phase"];
  storyMode: StoryMode;
  questionIndex: number;
  objective: string;
  objectiveProgress: number;
  complete: boolean;
  failed: boolean;
  canContinue: boolean;
  selectedChoice: number;
  pendingChoice: number;
  actionDiscovered: boolean;
  tutorialAct: "movement" | "action" | "resonance";
  playerPosition: { x: number; y: number; z: number };
  choiceTargets: Array<{ x: number; y: number; z: number }>;
  seed: string;
  audio: { unlocked: boolean; muted: boolean; cueCount: number };
  physics: IntroPhysicsDiagnostics;
  viewport: { width: number; height: number; dpr: number };
  activeLoops: number;
  pausedForScreenshot: boolean;
  debugUiHidden: boolean;
  dialogue: {
    levelId: string;
    eraShaderId: string;
    event: string;
    nextLevel: string;
    values: DialogueStateSnapshot;
  };
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
    readonly renderer: {
      readonly calls: number;
      readonly triangles: number;
      readonly geometries: number;
      readonly textures: number;
    };
    readonly state: IntroDiagnosticState;
  };
  __THREE_GAME_TEST_HOOKS__?: IntroTestHooks;
};
function getElement<T extends HTMLElement>(
  selector: string,
  kind: { new (): T }
): T {
  const element: Element | null = document.querySelector(selector);
  if (!(element instanceof kind))
    throw new Error(`Missing boot element: ${selector}`);
  return element;
}

export class BootScene {
  private _renderer: WebGLRenderer | null = null;
  private _scene: Scene | null = null;
  private _camera: PerspectiveCamera | null = null;
  private _cameraLook: Vector3 = new Vector3();
  private _spatial: SpatialBootScene = new SpatialBootScene();
  private _chapterTwo: ChapterTwoScene = new ChapterTwoScene();
  private _spatialReady: Promise<void> = Promise.resolve();
  private _audio: IntroAudio = new IntroAudio();
  private _activeChoice: number = 0;
  private _environment: Texture | null = null;
  private _vfx: ThreeVfxRenderer | null = null;
  private _dust: ThreeVfxEffectInstance | null = null;
  private _abort: AbortController = new AbortController();
  private _questions: readonly GhostQuestion[] = createGhostQuestions(SEED);
  private _studioOpening = new StudioOpening(studioOpeningDocuments[0]);
  private _typing = new WritingPlayback();
  private _typingKey = "";
  private _typingElapsed = 0;
  private _typingComplete = false;
  private _typingCompleteAt = 0;
  private _frames: BootFrame[] = createBootFrames(
    String(SEED),
    this._questions[0]
  );
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
  private _storyMode: StoryMode = "boot";
  private _questionIndex: number = 0;
  private _storyStartedAt: number = 0;
  private _canContinue: boolean = false;
  private _selectedChoice: number = -1;
  private _lastThreadName: string = "Light";
  private _playerName: string = "";
  private _lastAudioText: string = "";
  private _lastAudioFormat: number = 0;
  private _lastAudioPhase: BootFrame["phase"] = "cursor";
  private _lastAudioCorrupt: boolean = false;
  private _isDebug: boolean = false;
  private _diagnosticFrame: number = 0;
  private _frameNumber: number = 0;
  private _hasStarted: boolean = false;
  private _isStarting: boolean = false;
  private _simulationPaused: boolean = false;
  private _seed: string = String(SEED);
  private _answersCommitted: number = 0;
  private _chapterTwoStarted: boolean = false;
  private _debugUiHidden: boolean = false;
  private _movementKeys: Set<string> = new Set();
  private _input: InputController = createInputController();
  private _gamepadMoveX: number = 0;
  private _gamepadMoveY: number = 0;
  private _controlsDiscovered: boolean = false;
  private _lastInputMode: "controller" | "keyboard" | "touch" = "keyboard";
  private _actionDiscovered: boolean = false;
  private _pendingChoice: number = -1;
  private _interlude: GhostInterlude | null = null;
  private _currentFrame: BootFrame | null = null;
  private _dialogueState = new DialogueState();
  private _dialogueEvent = "";
  private _nextLevel = "";
  private get _finalEra(): number {
    return this._questions.at(-1)?.era ?? 0;
  }

  public init(): void {
    this._spatial.setStudioPresentation(studioOpeningDocuments[0].presentation);
    this._questions = this._questions.map((question, index) =>
      new StudioOpening(studioOpeningDocuments[index]).applyTo(question)
    );
    this._root = getElement("main", HTMLElement);
    this._prelude = getElement("#os-prelude-ts", HTMLElement);
    this._feed = getElement("#os-feed-ts", HTMLElement);
    this._transcript = getElement("#os-transcript-ts", HTMLElement);
    this._question = getElement("#os-question-ts", HTMLElement);
    this._accessibleQuestion = getElement(
      "#os-accessible-question-ts",
      HTMLElement
    );
    this._choices = getElement("#os-choices-ts", HTMLFieldSetElement);
    applyEraShaderCss(this._root, this._questions[0].eraShaderId);
    document
      .querySelectorAll<HTMLElement>(".os-choice")
      .forEach((element, index) => {
        const speaker = SPEAKERS[index + 1];
        if (speaker) applyEraShaderCss(element, PROFILES[speaker].eraShaderId);
      });
    this._isDebug = new URLSearchParams(location.search).has("debug");
    this._chapterTwo.init(this._root, this._isDebug);
    document
      .querySelectorAll<HTMLElement>(".os-choice-copy")
      .forEach((element: HTMLElement, index: number): void => {
        const choice = this._questions[0].choices[index];
        element.textContent = choice?.text ?? "";
      });
    const canvas: HTMLCanvasElement = getElement(
      "#os-canvas-ts",
      HTMLCanvasElement
    );
    const motion: MediaQueryList = matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    this._isReduced = motion.matches;
    const signal: AbortSignal = this._abort.signal;
    motion.addEventListener(
      "change",
      () => {
        this._isReduced = motion.matches;
      },
      { signal }
    );
    getElement("#os-replay-ts", HTMLButtonElement).addEventListener(
      "click",
      () => this._reset(),
      { signal }
    );
    getElement("#os-enter-ts", HTMLButtonElement).addEventListener(
      "click",
      () => {
        if (this._storyMode === "doorway") this._spatial.guideThroughDoor();
        else this._advanceStory();
        getElement("#os-enter-ts", HTMLButtonElement).blur();
      },
      { signal }
    );
    getElement("#os-name-entry-ts", HTMLFormElement).addEventListener(
      "submit",
      (event: SubmitEvent): void => {
        event.preventDefault();
        this._acceptName();
      },
      { signal }
    );
    getElement("#os-name-input-ts", HTMLInputElement).addEventListener(
      "input",
      (event: Event): void => {
        (event.target as HTMLInputElement).setCustomValidity("");
      },
      { signal }
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-os-route]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            this._stageChoice(Number(button.dataset.osRoute));
            button.blur();
          },
          { signal }
        );
        button.addEventListener(
          "pointerenter",
          () => this._spatial.hover(Number(button.dataset.osRoute)),
          { signal }
        );
        button.addEventListener("pointerleave", () => this._spatial.hover(-1), {
          signal,
        });
      });
    getElement("#os-sound-ts", HTMLButtonElement).addEventListener(
      "click",
      () => {
        if (!this._hasStarted) void this._beginBootFromGesture();
        else if (!this._audio.unlocked) void this._unlockAudio();
        else {
          this._audio.setMuted(!this._audio.muted);
          this._syncAudioLabel();
        }
      },
      { signal }
    );
    window.addEventListener("resize", () => this._resize(), { signal });
    window.addEventListener("keydown", this._onKeyDown, { signal });
    window.addEventListener("keyup", this._onKeyUp, { signal });
    window.addEventListener("blur", () => this._clearMovement(), { signal });
    window.addEventListener(
      "pointerdown",
      (event: PointerEvent) => {
        if (
          event.target instanceof Element &&
          event.target.closest("#os-sound-ts")
        )
          return;
        if (!this._hasStarted) void this._beginBootFromGesture();
        else void this._unlockAudio();
      },
      { signal, capture: true }
    );
    // Begin is a user gesture; unlock audio before asynchronous scene loading.
    void this._unlockAudio();
    window.addEventListener(
      "keydown",
      (): void => {
        if (this._hasStarted) void this._unlockAudio();
      },
      { signal, capture: true }
    );
    window.addEventListener(
      "pointermove",
      (event: PointerEvent): void => {
        if (this._camera)
          this._spatial.hover(
            this._spatial.pick(event.clientX, event.clientY, this._camera)
          );
      },
      { signal }
    );
    window.addEventListener(
      "pointerup",
      (event: PointerEvent): void => {
        if (
          !this._camera ||
          (event.target instanceof Element && event.target.closest("button"))
        )
          return;
        const index: number = this._spatial.pick(
          event.clientX,
          event.clientY,
          this._camera
        );
        if (index >= 0) this._stageChoice(index);
        else if (this._canContinue) this._advanceStory();
      },
      { signal }
    );
    this._choices.addEventListener(
      "change",
      (): void => {
        const inputs: HTMLInputElement[] = Array.from(
          document.querySelectorAll<HTMLInputElement>('input[name="story"]')
        );
        this._activeChoice = inputs.findIndex(
          (input: HTMLInputElement): boolean => input.checked
        );
        this._spatial.select(this._activeChoice);
        if (this._activeChoice >= 0 && this._storyMode === "waiting")
          this._stageChoice(this._activeChoice);
      },
      { signal }
    );
    this._bindTouchControls(signal);
    window.addEventListener(
      "pagehide",
      (event: PageTransitionEvent) => {
        if (!event.persisted) this.destroy();
      },
      { signal }
    );
    // A BFCache resume is not elapsed story time.
    window.addEventListener(
      "pageshow",
      (event: PageTransitionEvent) => {
        if (event.persisted) this._previousMs = performance.now();
      },
      { signal }
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this._clearMovement();
          void this._audio.suspend();
        } else void this._audio.resume();
      },
      { signal }
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event: Event) => {
        event.preventDefault();
        this._showError("The picture was interrupted. Reload to try again.");
      },
      { signal }
    );
    try {
      this._renderer = new WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
      });
      this._renderer.setClearColor(0x000000);
      this._renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.5 : 2)
      );
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
      this._spatial.setThresholdPreview(
        this._chapterTwo.renderThresholdPreview(this._renderer).texture
      );
      if (this._root) this._root.dataset.osPhysicsTs = "loading";
      this._spatialReady = this._spatial
        .init(this._scene)
        .then((): void => {
          if (this._root) this._root.dataset.osPhysicsTs = "ready";
        })
        .catch((error: unknown): void => {
          this._showError(
            error instanceof Error
              ? `The movement system could not start. ${error.message}`
              : "The movement system could not start."
          );
        });
      const particleDiagnostics = this._spatial.getParticleDiagnostics();
      if (this._root) {
        this._root.dataset.osParticlesTs = String(
          particleDiagnostics.lightParticles + particleDiagnostics.darkParticles
        );
        this._root.dataset.osParticleDrawsTs = String(
          particleDiagnostics.drawCalls
        );
      }
      const bundle = loadVfxExportBundle(dustBundle, {
        requiredBackend: "three3d",
        requiredEffectIds: ["boot-dust"],
        requireEveryAsset: true,
      });
      const effect = bundle.effectsById.get("boot-dust");
      if (!effect) throw new Error("Boot dust is missing");
      this._vfx = new ThreeVfxRenderer({
        scene: this._scene,
        camera: this._camera,
      });
      this._dust = this._vfx.createEffect(effect, {
        seed: SEED,
        autoStart: false,
      });
      this._resize();
      if (this._isDebug) this._installTestContracts();
      if (this._root) this._root.dataset.osArtTs = "ready";
      this._previousMs = performance.now();
      this._raf = requestAnimationFrame(this._update);
      // Wait for the actual spatial initialization promise before the first line.
      void this._beginBootFromGesture(true);
    } catch (error: unknown) {
      this._showError(
        error instanceof Error
          ? `The opening could not start. ${error.message}`
          : "The opening could not start. Reload to try again."
      );
    }
  }

  private _resize(): void {
    if (!this._renderer || !this._camera || !this._dust) return;
    const width: number = window.innerWidth;
    const height: number = window.innerHeight;
    const halfHeight: number =
      Math.tan((this._camera.fov * Math.PI) / 360) * 11;
    const halfWidth: number = (halfHeight * width) / height;
    this._renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, width < 760 ? 1.5 : 2)
    );
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
    this._spatial.resize(width / height);
    this._dust.root.position.set(halfWidth * 0.3, VIEW_HEIGHT * 0.05, 0);
  }

  private _reset(): void {
    this._dialogueState.reset();
    this._dialogueEvent = "";
    this._nextLevel = "";
    this._typingKey = "";
    this._studioOpening = new StudioOpening(studioOpeningDocuments[0]);
    this._questions = this._questions.map((question, index) =>
      new StudioOpening(studioOpeningDocuments[index]).applyTo(question)
    );
    this._chapterTwo.stop();
    this._elapsedMs = 0;
    this._motionMs = 0;
    this._frameIndex = -1;
    this._previousMs = performance.now();
    this._storyMode = "boot";
    this._hasStarted = false;
    this._isStarting = false;
    this._questionIndex = 0;
    this._storyStartedAt = 0;
    this._canContinue = false;
    this._selectedChoice = -1;
    this._lastThreadName = "Light";
    this._playerName = "";
    this._lastAudioText = "";
    this._lastAudioFormat = 0;
    this._lastAudioPhase = "cursor";
    this._lastAudioCorrupt = false;
    this._input.releaseAll();
    this._gamepadMoveX = 0;
    this._gamepadMoveY = 0;
    this._controlsDiscovered = false;
    this._lastInputMode = "keyboard";
    this._actionDiscovered = false;
    this._pendingChoice = -1;
    this._interlude = null;
    this._simulationPaused = false;
    this._answersCommitted = 0;
    this._chapterTwoStarted = false;
    this._clearMovement();
    this._spatial.reset();
    this._activeChoice = 0;
    getElement("#os-aside-ts", HTMLElement).textContent = "";
    getElement("#os-name-input-ts", HTMLInputElement).value = "";
    if (this._root) {
      this._root.dataset.osVoiceTs = "-1";
      this._root.dataset.osStartedTs = "false";
      this._root.dataset.osDoorTs = "forming";
    }
    this._applyFrame(this._frames[0], true);
    this._dust?.stop();
    this._dust?.restart();
    this._dust?.pause();
    document
      .querySelectorAll<HTMLInputElement>('input[name="story"]')
      .forEach((input) => {
        input.checked = false;
      });
    void this._beginBootFromGesture(true);
  }

  private _update = (now: number): void => {
    if (this._isDestroyed || !this._renderer || !this._scene || !this._camera)
      return;
    const delta: number = Math.min(
      Math.max((now - this._previousMs) / 1000, 0),
      MAX_DELTA_SECONDS
    );
    this._previousMs = now;
    this._frameNumber += 1;
    if (this._simulationPaused) {
      this._renderer.render(this._scene, this._camera);
      this._raf = requestAnimationFrame(this._update);
      return;
    }
    if (this._chapterTwo.active) {
      if (!document.hidden)
        this._chapterTwo.update(delta, this._renderer, this._isReduced);
      this._raf = requestAnimationFrame(this._update);
      return;
    }
    if (!document.hidden) {
      this._pollController();
      this._motionMs += delta * 1000;
      const endMs: number = this._frames[this._frames.length - 1].at;
      if (this._storyMode === "boot" && this._hasStarted) {
        const opening = this._studioOpening.advance(
          delta * 1000,
          this._isReduced
        );
        this._canContinue = opening.awaiting;
        const promptReady = opening.awaiting || opening.done;
        const frame = this._storyFrame(
          promptReady ? this._questions[0].question : opening.text,
          opening.done ? "waiting" : "prelude",
          0,
          opening.awaiting ? "Continue to the three paths" : undefined,
          this._motionMs
        );
        frame.studioSpeaker = promptReady ? "omega" : opening.speaker;
        this._applyFrame(frame, opening.done);
      }
      const displayMs: number = this._elapsedMs;
      if (!["boot", "waiting", "doorway"].includes(this._storyMode))
        this._updateStory(now);
      const spatialEvent: number = this._spatial.update(
        this._motionMs,
        this._isReduced
      );
      this._updateCamera(delta);
      if (
        (this._storyMode === "waiting" ||
          this._storyMode === "travel" ||
          this._storyMode === "doorway") &&
        (this._movementKeys.size > 0 ||
          this._gamepadMoveX !== 0 ||
          this._gamepadMoveY !== 0 ||
          this._storyMode === "travel" ||
          this._pendingChoice >= 0)
      )
        this._audio.move(this._answersCommitted);
      if (spatialEvent >= 0 && this._storyMode === "waiting") {
        this._commitChoice(spatialEvent);
      } else if (spatialEvent === -2 && this._storyMode === "travel") {
        this._spatial.arriveAtNextQuestion();
        this._beginPrelude(this._questionIndex);
      } else if (spatialEvent === -3 && this._storyMode === "doorway")
        this._enterDoor();
      if (this._root)
        this._root.dataset.osBackgroundTs = "celestial-depth-field";
      const isDustVisible: boolean =
        !this._isReduced && displayMs > FIRST_DISSOLVE_MS && displayMs < endMs;
      if (isDustVisible) {
        this._dust?.play();
        this._vfx?.update(delta);
      }
      if (this._vfx) this._vfx.root.visible = isDustVisible;
      this._renderer.render(this._scene, this._camera);
      if (this._isDebug && this._root && this._diagnosticFrame++ % 60 === 0) {
        const particleDiagnostics = this._spatial.getParticleDiagnostics();
        this._root.dataset.osDrawCallsTs = String(
          this._renderer.info.render.calls
        );
        this._root.dataset.osTrianglesTs = String(
          this._renderer.info.render.triangles
        );
        this._root.dataset.osGeometriesTs = String(
          this._renderer.info.memory.geometries
        );
        this._root.dataset.osTexturesTs = String(
          this._renderer.info.memory.textures
        );
        this._root.dataset.osParticleSurfaceTs =
          particleDiagnostics.surfaceFormation > 0.002 ? "formed" : "open";
        this._root.dataset.osParticleDrawsTs = String(
          particleDiagnostics.drawCalls
        );
        const physicsDiagnostics: IntroPhysicsDiagnostics =
          this._spatial.getPhysicsDiagnostics();
        this._root.dataset.osPhysicsBodiesTs = String(
          physicsDiagnostics.bodies
        );
        this._root.dataset.osPhysicsCollidersTs = String(
          physicsDiagnostics.colliders
        );
        this._root.dataset.osPhysicsSensorsTs = String(
          physicsDiagnostics.activeSensors
        );
        this._root.dataset.osPhysicsStepsTs = String(physicsDiagnostics.steps);
      }
    }
    this._raf = requestAnimationFrame(this._update);
  };

  private _applyFrame(frame: BootFrame, fromBoot: boolean = false): void {
    if (
      !this._root ||
      !this._prelude ||
      !this._question ||
      !this._choices ||
      !this._accessibleQuestion ||
      !this._transcript ||
      !this._feed
    )
      return;
    if (this._isReduced && frame.isCorrupt) return;
    this._currentFrame = frame;
    if (fromBoot && frame.phase === "waiting") {
      this._storyMode = "waiting";
      this._questionIndex = 0;
      this._canContinue = false;
    }
    this._root.dataset.osPhaseTs = frame.phase;
    this._root.dataset.osStoryModeTs = this._storyMode;
    this._root.dataset.osCorruptTs = frame.isCorrupt ? "true" : "false";
    this._root.dataset.osFormatTs =
      frame.phase === "waiting" ? "settled" : String(frame.format);
    this._root.dataset.osEraTs = getIntroEra(frame.format).label;
    this._root.dataset.osTextTs = "three";
    this._root.dataset.osQuestionTs = String(this._questionIndex);
    this._root.dataset.osTutorialActTs = this._tutorialAct();
    this._root.dataset.osCanContinueTs = String(this._canContinue);
    const enter: HTMLButtonElement = getElement(
      "#os-enter-ts",
      HTMLButtonElement
    );
    enter.hidden = this._storyMode !== "doorway" && !this._canContinue;
    enter.disabled = enter.hidden;
    enter.textContent =
      this._storyMode === "doorway" ? "guide through ↵" : "continue ↵";
    getElement("#os-name-entry-ts", HTMLFormElement).hidden =
      this._storyMode !== "name";
    this._root.dataset.osDoorTs =
      this._storyMode === "doorway"
        ? "ready"
        : this._storyMode === "complete"
          ? "crossed"
          : "forming";
    getElement("#os-hint-ts", HTMLElement).textContent =
      this._controlHint() || frame.hint || "";
    getElement("#os-progress-ts", HTMLElement).textContent = [
      "name",
      "doorway",
      "final",
    ].includes(this._storyMode)
      ? `PASSAGE ${this._questions.length} / ${this._questions.length} · THRESHOLD`
      : `PASSAGE ${Math.min(this._questionIndex + 1, this._questions.length)} / ${this._questions.length}`;
    const guide = getElement("#os-route-guide-ts", HTMLElement);
    guide.hidden = this._storyMode !== "waiting";
    guide
      .querySelectorAll<HTMLButtonElement>("[data-os-route]")
      .forEach((button, index) => {
        const route = ["LIGHT", "SHADOW", "AMBITION"][index];
        button.textContent = `${index + 1}  ${route}`;
        button.setAttribute(
          "aria-label",
          `${route}: ${this._questions[this._questionIndex].choices[index].text}`
        );
      });
    this._spatial.setFrame(frame);
    this._prelude.textContent = frame.prelude;
    this._transcript.textContent = frame.transcript;
    this._question.textContent = frame.question;
    document
      .querySelectorAll<HTMLElement>(".os-choice-copy")
      .forEach((element: HTMLElement, index: number): void => {
        element.textContent = frame.choices[index] ?? "";
      });
    // Discrete line-feed jumps, not a smooth page scroll; only while output is changing.
    this._feed.scrollTop = this._feed.scrollHeight;
    this._choices.disabled = frame.phase !== "waiting";
    // Screen readers hear the complete question once, not a stream of corrected letters.
    this._accessibleQuestion.textContent =
      frame.phase === "waiting" ||
      frame.phase === "complete" ||
      this._canContinue
        ? frame.question
        : "";
    this._soundFrame(frame);
  }

  private _updateCamera(delta: number): void {
    if (!this._camera) return;
    const player = this._spatial.getPlayerPosition();
    const stationDepth: number = this._spatial.getWorldDepth();
    const isQuestion: boolean =
      this._storyMode === "waiting" || this._storyMode === "question";
    const isTravel: boolean = this._storyMode === "travel";
    const isResponse: boolean =
      this._storyMode === "response" || this._storyMode === "commentary";
    const isThreshold: boolean =
      this._storyMode === "name" ||
      this._storyMode === "doorway" ||
      this._storyMode === "complete";
    const isDoorway: boolean = this._storyMode === "doorway";
    const spatialView: boolean = isQuestion || isTravel;
    const viewFov: number = spatialView ? 48 : 36;
    if (Math.abs(this._camera.fov - viewFov) > 0.01) {
      this._camera.fov = viewFov;
      this._camera.updateProjectionMatrix();
    }
    const targetX: number = spatialView
      ? player.x * 0.55 + (window.innerWidth < 760 ? 0.15 : 0.32)
      : isResponse
        ? 0.68 + player.x * 0.24
        : 0;
    const targetY: number = isTravel
      ? player.y - 0.9
      : isResponse
        ? player.y * 0.48
        : isDoorway
          ? player.y * 0.22
          : spatialView
            ? player.y - 0.82
            : isThreshold
              ? 0.12
              : 0;
    const targetZ: number = isTravel
      ? player.z + 3.45
      : stationDepth +
        (isQuestion
          ? player.z - stationDepth + 3.6
          : isThreshold
            ? 8.35
            : this._storyMode === "boot"
              ? 10.25
              : 9.6);
    const blend: number = this._isReduced
      ? 1
      : 1 -
        Math.exp(
          -Math.max(0, delta) * (isQuestion ? 2.6 : isThreshold ? 2.2 : 1.6)
        );
    this._camera.position.x += (targetX - this._camera.position.x) * blend;
    this._camera.position.y += (targetY - this._camera.position.y) * blend;
    this._camera.position.z += (targetZ - this._camera.position.z) * blend;
    this._cameraLook.set(
      spatialView ? player.x * 0.38 : 0,
      isTravel
        ? player.y + 1.12
        : isResponse
          ? player.y * 0.4
          : isDoorway
            ? player.y * 0.2
            : spatialView
              ? player.y + 1.05
              : 0,
      spatialView ? player.z - 1.35 : stationDepth
    );
    this._camera.lookAt(this._cameraLook);
  }

  private _highlightChoice(index: number): void {
    const inputs: NodeListOf<HTMLInputElement> =
      document.querySelectorAll<HTMLInputElement>('input[name="story"]');
    if (!inputs[index] || inputs[index].disabled) return;
    this._activeChoice = index;
    inputs[index].checked = true;
    this._spatial.select(index);
  }

  private _commitChoice(index: number): void {
    if (this._storyMode !== "waiting") return;
    this._highlightChoice(index);
    this._selectedChoice = index;
    this._pendingChoice = -1;
    this._answersCommitted += 1;
    const question: GhostQuestion = this._questions[this._questionIndex];
    const choice = question.choices[index];
    this._dialogueState.apply(choice.effects);
    this._dialogueEvent = choice.emit;
    this._nextLevel = choice.transition;
    if (this._root) {
      this._root.dataset.osDialogueEventTs = choice.emit;
      this._root.dataset.osNextLevelTs = choice.transition;
    }
    if (choice.emit)
      window.dispatchEvent(
        new CustomEvent(choice.emit, {
          detail: {
            levelId: question.levelId,
            owner: choice.owner,
            state: this._dialogueState.snapshot(),
            transition: choice.transition,
          },
        })
      );
    this._lastThreadName = ["Light", "Shadow", "Ambition"][index] ?? "Light";
    this._spatial.commitChoice(index);
    this._spatial.setPlayerStage(this._answersCommitted);
    this._spatial.archive(question.choices[index].text, question.era, index);
    this._audio.choose(index);
    this._audio.dreamweaver(index);
    this._storyMode = "response";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._setChoicesEnabled(false);
    this._clearMovement();
  }

  private _stageChoice(index: number): void {
    if (this._storyMode !== "waiting") return;
    this._pendingChoice = index;
    this._highlightChoice(index);
    this._spatial.guideToChoice(index);
    this._clearMovement();
    getElement("#os-hint-ts", HTMLElement).textContent = this._controlHint();
  }

  private _beginPrelude(index: number): void {
    this._questionIndex = index;
    this._spatial.setStudioPresentation(studioOpeningDocuments[index].presentation);
    if (this._root)
      applyEraShaderCss(this._root, this._questions[index].eraShaderId);
    this._storyMode = "prelude";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._selectedChoice = -1;
    this._pendingChoice = -1;
    this._activeChoice = 0;
    this._spatial.select(-1);
    this._clearNativeChoices();
    this._audio.transition();
    this._clearMovement();
  }

  private _beginTravel(index: number): void {
    this._questionIndex = index;
    this._storyMode = "travel";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._spatial.beginJourney();
    this._applyFrame(
      this._storyFrame("", "travel", this._questions[index].era, undefined, 0)
    );
  }

  private _beginCommentary(interlude: GhostInterlude): void {
    this._interlude = interlude;
    this._storyMode = "commentary";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._audio.commentary(interlude.ownerIndex);
  }

  private _continueAfterResponse(): void {
    this._interlude = null;
    if (this._questionIndex >= this._questions.length - 1) this._beginFinal();
    else this._beginTravel(this._questionIndex + 1);
  }

  private _beginQuestion(): void {
    this._storyMode = "question";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._audio.era(this._questions[this._questionIndex].era);
  }

  private _beginFinal(): void {
    this._storyMode = "final";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._selectedChoice = -1;
    this._spatial.select(-1);
    this._clearNativeChoices();
    this._audio.threshold();
  }

  private _beginNaming(): void {
    this._storyMode = "name";
    this._storyStartedAt = performance.now();
    this._canContinue = false;
    this._applyFrame(
      this._storyFrame(OMEGA_NAME_QUESTION, "name", this._finalEra, "Type a name", 0)
    );
    requestAnimationFrame((): void => {
      getElement("#os-name-input-ts", HTMLInputElement).focus();
    });
  }

  private _acceptName(): void {
    if (this._storyMode !== "name") return;
    const input = getElement("#os-name-input-ts", HTMLInputElement);
    const name = input.value.trim().slice(0, 32);
    if (!name) {
      input.setCustomValidity("Give the character a name to open the way.");
      input.reportValidity();
      return;
    }
    this._playerName = name;
    if (this._root) this._root.dataset.osPlayerNameTs = name;
    this._storyMode = "doorway";
    this._storyStartedAt = performance.now();
    this._spatial.beginDoorway(name);
    this._applyFrame(
      this._storyFrame(OMEGA_DOOR_WORDS, "doorway", this._finalEra, "Walk forward", 0)
    );
    input.blur();
  }

  private _advanceStory(): void {
    if (!this._canContinue) return;
    if (this._storyMode === "boot") {
      this._studioOpening.proceed();
      this._canContinue = false;
      return;
    }
    if (this._storyMode === "prelude") {
      this._beginQuestion();
      return;
    }
    if (this._storyMode === "response") {
      const interlude: GhostInterlude | null = getGhostInterlude(
        this._questionIndex,
        this._selectedChoice
      );
      if (interlude) this._beginCommentary(interlude);
      else this._continueAfterResponse();
      return;
    }
    if (this._storyMode === "commentary") {
      this._continueAfterResponse();
    }
  }

  private _enterDoor(): void {
    if (this._storyMode !== "doorway") return;
    this._storyMode = "complete";
    this._storyStartedAt = performance.now();
    this._chapterTwoStarted = false;
    this._canContinue = false;
    this._clearMovement();
    this._applyFrame(
      this._storyFrame(OMEGA_DOOR_WORDS, "complete", this._finalEra, "Entering", 0)
    );
  }

  private _updateStory(now: number): void {
    const elapsedMs: number = Math.max(0, now - this._storyStartedAt);
    const question: GhostQuestion =
      this._questions[
        Math.min(this._questionIndex, this._questions.length - 1)
      ];
    if (this._storyMode === "prelude") {
      const text: string = this._typed(question.prelude, elapsedMs, 44);
      const complete: boolean = this._isReduced || this._typingComplete;
      this._canContinue = complete;
      if (
        complete &&
        elapsedMs >= this._typingCompleteAt + (this._isReduced ? 0 : 1700)
      ) {
        this._advanceStory();
        return;
      }
      this._applyFrame(
        this._storyFrame(
          text,
          "prelude",
          question.era,
          complete ? "Continue" : undefined,
          elapsedMs
        )
      );
      return;
    }
    if (this._storyMode === "question") {
      const speed: number[] = [80, 65, 50, 38];
      let text: string = this._typed(
        question.question,
        elapsedMs,
        speed[this._questionIndex]
      );
      const completeAt: number = this._typingCompleteAt;
      const complete: boolean = this._isReduced || this._typingComplete;
      if (
        !studioOpeningDocuments[this._questionIndex].presentation &&
        !complete &&
        text.length > 4 &&
        Math.floor(elapsedMs / 230) % 17 === 0
      )
        text += ["_", "?", "/", "#"][Math.floor(elapsedMs / 130) % 4];
      if (complete && elapsedMs >= completeAt + (this._isReduced ? 0 : 850)) {
        this._storyMode = "waiting";
        this._canContinue = false;
        this._applyFrame(
          this._storyFrame(
            question.question,
            "waiting",
            question.era,
            undefined,
            elapsedMs
          )
        );
      } else {
        this._applyFrame(
          this._storyFrame(
            text,
            "question",
            question.era,
            undefined,
            elapsedMs,
            !complete && text.endsWith("#")
          )
        );
      }
      return;
    }
    if (this._storyMode === "response" && this._selectedChoice >= 0) {
      const response: string = question.choices[this._selectedChoice].response;
      const beat = this._responseBeat(
        response,
        elapsedMs,
        this._selectedChoice
      );
      const display: string = this._dreamweaverWriting(
        beat.text,
        elapsedMs,
        this._selectedChoice,
        beat.complete
      );
      const complete: boolean = beat.complete;
      this._canContinue = complete;
      const responseEnd: number = studioOpeningDocuments[this._questionIndex].presentation
        ? this._typingCompleteAt
        : this._isReduced
          ? 0
          : [280, 920, 480][this._selectedChoice] +
            response.length * [42, 48, 34][this._selectedChoice] +
            520;
      if (
        complete &&
        elapsedMs >= responseEnd + Math.min(4200, 1800 + response.length * 18)
      ) {
        this._advanceStory();
        return;
      }
      this._applyFrame(
        this._storyFrame(
          display,
          "response",
          question.era,
          complete ? "Continue" : undefined,
          elapsedMs,
          false,
          this._selectedChoice
        )
      );
      return;
    }
    if (this._storyMode === "commentary" && this._interlude) {
      const silenceMs: number[] = [650, 1250, 480];
      const speedMs: number[] = [38, 48, 32];
      const writingMs: number = Math.max(
        0,
        elapsedMs - silenceMs[this._interlude.ownerIndex]
      );
      const typed: string = this._typed(
        this._interlude.text,
        writingMs,
        speedMs[this._interlude.ownerIndex]
      );
      const complete: boolean = typed.length >= this._interlude.text.length;
      this._canContinue = complete;
      if (
        complete &&
        elapsedMs >=
          (this._isReduced
            ? 0
            : silenceMs[this._interlude.ownerIndex] +
              this._interlude.text.length *
                speedMs[this._interlude.ownerIndex]) +
            Math.min(4200, 1800 + this._interlude.text.length * 18)
      ) {
        this._advanceStory();
        return;
      }
      this._applyFrame(
        this._storyFrame(
          typed,
          "response",
          question.era,
          complete ? "Continue" : undefined,
          elapsedMs,
          false,
          this._interlude.ownerIndex
        )
      );
      return;
    }
    if (this._storyMode === "final") {
      const text: string = this._finalText(elapsedMs);
      const complete: boolean = this._isReduced || this._typingComplete;
      if (
        complete &&
        elapsedMs >= this._typingCompleteAt + (this._isReduced ? 0 : 1900)
      ) {
        this._beginNaming();
        return;
      }
      this._applyFrame(
        this._storyFrame(text, "final", this._finalEra, undefined, elapsedMs)
      );
      return;
    }
    if (this._storyMode === "complete") {
      const crossingMs: number = this._isReduced ? 0 : 2800;
      this._applyFrame(
        this._storyFrame(OMEGA_DOOR_WORDS, "complete", this._finalEra, undefined, elapsedMs)
      );
      if (!this._chapterTwoStarted && elapsedMs >= crossingMs) {
        this._chapterTwoStarted = true;
        this._chapterTwo.start(this._lastThreadName);
      }
    }
  }

  private _storyFrame(
    text: string,
    phase: BootFrame["phase"],
    format: number,
    hint: string | undefined,
    phaseElapsedMs: number,
    isCorrupt: boolean = false,
    speaker?: number
  ): BootFrame {
    const question: GhostQuestion =
      this._questions[
        Math.min(this._questionIndex, this._questions.length - 1)
      ];
    return {
      at: this._motionMs,
      prelude:
        phase === "question" || phase === "waiting"
          ? question.prelude
          : phase === "final" || phase === "complete"
            ? question.prelude
            : "",
      question: text,
      transcript: this._frames.at(-1)?.transcript ?? "",
      choices: question.choices.map((choice) => choice.text),
      choiceLines:
        phase === "waiting"
          ? question.choices.map((choice) => choice.text)
          : undefined,
      isCorrupt,
      phase,
      format,
      phaseElapsedMs,
      hint,
      speaker,
    };
  }

  private _typed(
    text: string,
    elapsedMs: number,
    millisecondsPerCharacter: number
  ): string {
    if (this._isReduced) {
      this._typingComplete = true;
      this._typingCompleteAt = 0;
      return text;
    }
    const presentation = studioOpeningDocuments[this._questionIndex].presentation;
    if (presentation) {
      const speaker =
        this._storyMode === "response" && this._selectedChoice >= 0
          ? SPEAKERS[this._selectedChoice + 1]
          : "omega";
      const key = `${this._storyMode}:${this._questionIndex}:${speaker}:${text}`;
      if (key !== this._typingKey || elapsedMs < this._typingElapsed) {
        this._typingKey = key;
        this._typingElapsed = 0;
        this._typingComplete = false;
        this._typingCompleteAt = 0;
        this._typing.restart(
          {
            ...PROFILES[speaker],
            ...presentation.voices[speaker],
          },
          text
        );
      }
      const frame = this._typing.advance(
        Math.max(0, elapsedMs - this._typingElapsed)
      );
      this._typingElapsed = elapsedMs;
      if (frame.done && !this._typingComplete)
        this._typingCompleteAt = elapsedMs;
      this._typingComplete = frame.done;
      return frame.text;
    }
    this._typingComplete = elapsedMs >= text.length * millisecondsPerCharacter;
    this._typingCompleteAt = text.length * millisecondsPerCharacter;
    return text.slice(
      0,
      Math.min(text.length, Math.floor(elapsedMs / millisecondsPerCharacter))
    );
  }

  private _responseBeat(
    response: string,
    elapsedMs: number,
    owner: number
  ): { text: string; complete: boolean } {
    if (this._isReduced) return { text: response, complete: true };
    if (studioOpeningDocuments[this._questionIndex].presentation) {
      const text = this._typed(response, elapsedMs, 0);
      return { text, complete: this._typingComplete };
    }
    const speeds: number[] = [42, 48, 34];
    const openingSilence: number[] = [280, 920, 480];
    const writingMs: number = Math.max(0, elapsedMs - openingSilence[owner]);
    const visible: string = this._typed(response, writingMs, speeds[owner]);
    return {
      text: visible,
      complete:
        visible.length === response.length &&
        writingMs >= response.length * speeds[owner] + 520,
    };
  }

  private _dreamweaverWriting(
    text: string,
    elapsedMs: number,
    owner: number,
    complete: boolean
  ): string {
    if (studioOpeningDocuments[this._questionIndex].presentation) return text;
    if (complete || this._isReduced || text.length < 4) return text;
    if (owner === 0 && Math.floor(elapsedMs / 410) % 11 === 0)
      return `${text}\n${text.slice(Math.max(0, text.lastIndexOf("\n") + 1), -1)}`;
    if (owner === 1 && Math.floor(elapsedMs / 290) % 13 === 0)
      return `${text.slice(0, -Math.min(3, text.length))}___`;
    if (owner === 2 && Math.floor(elapsedMs / 180) % 17 === 0)
      return `${text}>`;
    return text;
  }

  private _finalScript(): string {
    return GHOST_FINAL.replace("{{THREAD_NAME}}", this._lastThreadName);
  }

  private _finalText(elapsedMs: number): string {
    return this._typed(this._finalScript(), elapsedMs, 34);
  }

  private _setChoicesEnabled(enabled: boolean): void {
    if (this._choices) this._choices.disabled = !enabled;
  }

  private _clearNativeChoices(): void {
    document
      .querySelectorAll<HTMLInputElement>('input[name="story"]')
      .forEach((input: HTMLInputElement): void => {
        input.checked = false;
      });
  }

  private _soundFrame(frame: BootFrame): void {
    const text: string = frame.question || frame.transcript;
    const phaseChanged: boolean = frame.phase !== this._lastAudioPhase;
    const correctionStarted: boolean =
      frame.isCorrupt && !this._lastAudioCorrupt;
    if (phaseChanged) this._audio.hesitate(frame.format);
    if (frame.format !== this._lastAudioFormat || correctionStarted)
      this._audio.correct(frame.format);
    if (text !== this._lastAudioText) {
      if (text.length < this._lastAudioText.length)
        this._audio.erase(frame.format);
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

  private async _beginBootFromGesture(
    allowSilentStart: boolean = false
  ): Promise<void> {
    if (this._hasStarted || this._isStarting) return;
    this._isStarting = true;
    await this._spatialReady;
    const unlocked: boolean = allowSilentStart
      ? false
      : await this._audio.unlock();
    if (!unlocked && !allowSilentStart) {
      if (this._root) this._root.dataset.osAudioTs = "unavailable";
      this._syncAudioLabel();
      this._isStarting = false;
      return;
    }
    this._hasStarted = true;
    this._audio.begin();
    if (this._root) {
      this._root.dataset.osAudioTs = "awake";
      this._root.dataset.osStartedTs = "true";
    }
    this._syncAudioDiagnostics();
    this._previousMs = performance.now();
    this._syncAudioLabel();
    this._isStarting = false;
  }

  private async _unlockAudio(): Promise<void> {
    const unlocked: boolean = await this._audio.unlock();
    if (this._root)
      this._root.dataset.osAudioTs = unlocked ? "awake" : "unavailable";
    this._syncAudioLabel();
  }

  private _syncAudioLabel(): void {
    const button: HTMLButtonElement = getElement(
      "#os-sound-ts",
      HTMLButtonElement
    );
    button.textContent = !this._audio.unlocked
      ? "sound on"
      : this._audio.muted
        ? "sound muted"
        : "sound awake";
    button.setAttribute(
      "aria-pressed",
      String(this._audio.unlocked && !this._audio.muted)
    );
  }

  private _syncMovement(): void {
    const left: number =
      this._movementKeys.has("ArrowLeft") ||
      this._movementKeys.has("a") ||
      this._movementKeys.has("touch-left")
        ? 1
        : 0;
    const right: number =
      this._movementKeys.has("ArrowRight") ||
      this._movementKeys.has("d") ||
      this._movementKeys.has("touch-right")
        ? 1
        : 0;
    const down: number =
      this._movementKeys.has("ArrowDown") ||
      this._movementKeys.has("s") ||
      this._movementKeys.has("touch-down")
        ? 1
        : 0;
    const up: number =
      this._movementKeys.has("ArrowUp") ||
      this._movementKeys.has("w") ||
      this._movementKeys.has("touch-up")
        ? 1
        : 0;
    const moveX: number = Math.max(
      -1,
      Math.min(1, right - left + this._gamepadMoveX)
    );
    const moveY: number = Math.max(
      -1,
      Math.min(1, up - down + this._gamepadMoveY)
    );
    if (this._pendingChoice >= 0 && (moveX !== 0 || moveY !== 0)) {
      this._pendingChoice = -1;
      this._spatial.guideToChoice(-1);
    }
    this._spatial.setMovement(moveX, moveY);
  }

  private _controlHint(): string {
    if (this._storyMode === "travel")
      return this._lastInputMode === "controller"
        ? "stick forward / back · follow your strand · release to stop"
        : "W / ↑ forward · S / ↓ back · release to stop";
    if (this._storyMode === "doorway")
      return this._lastInputMode === "controller"
        ? "stick forward · walk through the words · A guides"
        : "W / ↑ · walk through the words · Enter guides";
    if (this._storyMode === "name") return "Type your name and press Enter";
    if (this._storyMode === "boot" && this._canContinue)
      return this._lastInputMode === "controller"
        ? "A · continue to the three paths"
        : "Enter · continue to the three paths";
    if (this._canContinue)
      return this._lastInputMode === "controller"
        ? "A · continue now · otherwise the story continues"
        : "Enter · continue now · otherwise the story continues";
    if (this._storyMode === "question" || this._storyMode === "prelude")
      return "Omega is writing…";
    if (this._storyMode === "final") return "The threshold is forming…";
    if (this._storyMode === "response" || this._storyMode === "commentary")
      return "A Dreamweaver is writing…";
    if (this._storyMode !== "waiting") return "";
    if (this._pendingChoice >= 0) {
      return "Approaching the chosen strand · WASD / arrows to steer";
    }
    if (this._lastInputMode === "controller")
      return "left stick · walk to a strand · A choose";
    if (this._lastInputMode === "touch")
      return "arrows · walk to a strand · tap a choice";
    return "WASD / arrows · walk to a strand · 1 / 2 / 3 choose";
  }

  private _tutorialAct(): "movement" | "action" | "resonance" {
    if (this._questionIndex === 0) return "movement";
    if (this._questionIndex === 1) return "action";
    return "resonance";
  }

  private _discoverControls(mode: "controller" | "keyboard" | "touch"): void {
    this._controlsDiscovered = true;
    this._lastInputMode = mode;
    if (this._root) this._root.dataset.osControlsTs = mode;
    getElement("#os-hint-ts", HTMLElement).textContent = this._controlHint();
  }

  private _pollController(): void {
    const intents: Intents = this._input.readIntents();
    this._gamepadMoveX = intents.moveX;
    this._gamepadMoveY = intents.moveY;
    const usedController: boolean =
      intents.moveX !== 0 ||
      intents.moveY !== 0 ||
      intents.act ||
      intents.dash ||
      intents.pause;
    if (usedController) this._discoverControls("controller");
    if (intents.act || intents.dash) this._actionDiscovered = true;
    if (!this._hasStarted && usedController) {
      // Gamepad polling is not consistently recognized as browser activation.
      // Start the visual timeline, then let the next recognized gesture wake audio.
      void this._beginBootFromGesture(true);
      return;
    }
    if (
      this._storyMode === "waiting" ||
      this._storyMode === "travel" ||
      this._storyMode === "doorway"
    )
      this._syncMovement();
    else if (this._gamepadMoveX !== 0 || this._gamepadMoveY !== 0)
      this._spatial.setMovement(0, 0);
    if (this._storyMode === "doorway" && (intents.act || intents.dash)) {
      this._spatial.guideThroughDoor();
      return;
    }
    if (this._canContinue && (intents.act || intents.dash))
      this._advanceStory();
  }

  private _bindTouchControls(signal: AbortSignal): void {
    document
      .querySelectorAll<HTMLButtonElement>("[data-os-move]")
      .forEach((button: HTMLButtonElement): void => {
        const direction: string = button.dataset.osMove ?? "";
        const key: string = `touch-${direction}`;
        const release = (): void => {
          button.dataset.osActive = "false";
          this._movementKeys.delete(key);
          this._syncMovement();
          button.blur();
        };
        button.addEventListener(
          "pointerdown",
          (event: PointerEvent): void => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            button.dataset.osActive = "true";
            this._movementKeys.add(key);
            this._discoverControls("touch");
            this._syncMovement();
          },
          { signal }
        );
        button.addEventListener("pointerup", release, { signal });
        button.addEventListener("pointercancel", release, { signal });
        button.addEventListener("lostpointercapture", release, { signal });
      });
  }

  private _clearMovement(): void {
    this._movementKeys.clear();
    this._gamepadMoveX = 0;
    this._gamepadMoveY = 0;
    this._spatial.setMovement(0, 0);
    document
      .querySelectorAll<HTMLButtonElement>("[data-os-move]")
      .forEach((button: HTMLButtonElement): void => {
        button.dataset.osActive = "false";
      });
  }

  private _onKeyUp = (event: KeyboardEvent): void => {
    const key: string =
      event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!this._movementKeys.delete(key)) return;
    this._syncMovement();
  };

  private _onKeyDown = (event: KeyboardEvent): void => {
    if (this._chapterTwo.active) return;
    if (
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      ["Tab", "Shift", "Control", "Alt", "Meta", "Escape"].includes(event.key)
    )
      return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, input")
    )
      return;
    if (!this._hasStarted) {
      void this._beginBootFromGesture();
      return;
    }
    void this._unlockAudio();
    const key: string =
      event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const isAction: boolean = event.key === "Enter" || event.key === " ";
    if (isAction) {
      this._actionDiscovered = true;
      this._discoverControls("keyboard");
    }
    if (this._storyMode === "doorway" && ["Enter", " "].includes(key)) {
      event.preventDefault();
      this._spatial.guideThroughDoor();
      return;
    }
    if (
      (this._storyMode === "waiting" ||
        this._storyMode === "travel" ||
        this._storyMode === "doorway") &&
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "w",
        "a",
        "s",
        "d",
      ].includes(key)
    ) {
      event.preventDefault();
      if (this._storyMode === "waiting" && this._pendingChoice >= 0) {
        this._pendingChoice = -1;
        this._spatial.guideToChoice(-1);
      }
      this._movementKeys.add(key);
      this._discoverControls("keyboard");
      this._syncMovement();
      return;
    }
    if (this._storyMode === "boot") {
      if (this._canContinue && isAction) {
        event.preventDefault();
        this._advanceStory();
        return;
      }
      const aside: string | null = this._spatial.interrupt(this._motionMs);
      if (aside) {
        getElement("#os-aside-ts", HTMLElement).textContent = aside;
        const voice: number = this._spatial.getVoice();
        this._audio.dreamweaver(voice);
        if (this._root) this._root.dataset.osVoiceTs = String(voice);
      }
      return;
    }
    if (this._canContinue && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this._advanceStory();
      return;
    }
    if (
      this._storyMode === "waiting" &&
      [" ", "Enter", "1", "2", "3"].includes(event.key)
    ) {
      event.preventDefault();
      if (["1", "2", "3"].includes(event.key)) {
        this._activeChoice = Number(event.key) - 1;
        this._stageChoice(this._activeChoice);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        this._stageChoice(this._activeChoice);
      } else this._highlightChoice(this._activeChoice);
    }
  };

  private _showError(message: string): void {
    const error: HTMLElement = getElement("#os-error-ts", HTMLElement);
    error.textContent = message;
    if (this._root) this._root.dataset.osArtTs = "error";
    this.destroy();
  }

  public destroy(): void {
    this._isDestroyed = true;
    cancelAnimationFrame(this._raf);
    this._abort.abort();
    this._vfx?.destroy();
    this._input.dispose();
    this._spatial.destroy();
    this._chapterTwo.destroy();
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
        get calls(): number {
          return scene._renderer?.info.render.calls ?? 0;
        },
        get triangles(): number {
          return scene._renderer?.info.render.triangles ?? 0;
        },
        get geometries(): number {
          return scene._renderer?.info.memory.geometries ?? 0;
        },
        get textures(): number {
          return scene._renderer?.info.memory.textures ?? 0;
        },
      },
      get state(): IntroDiagnosticState {
        return scene._getDiagnosticState();
      },
    };
    testWindow.__THREE_GAME_TEST_HOOKS__ = {
      seed: async (value: string | number): Promise<{ seed: string }> => {
        await this._spatialReady;
        this._seed = String(value);
        this._questions = createGhostQuestions(this._seed);
        this._frames = createBootFrames(this._seed, this._questions[0]);
        this._reset();
        return { seed: this._seed };
      },
      setState: async (name: string): Promise<{ state: TestStateName }> => {
        await this._spatialReady;
        if (!TEST_STATE_NAMES.includes(name as TestStateName))
          throw new Error(`Unknown test state: ${name}`);
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
    if (!this._root)
      throw new Error("Intro test state requested before initialization");
    if (name === "boot-cursor") {
      this._reset();
      return;
    }
    this._hasStarted = true;
    this._root.dataset.osStartedTs = "true";
    this._elapsedMs = this._frames.at(-1)?.at ?? 0;
    this._frameIndex = this._frames.length - 1;
    this._selectedChoice = -1;
    this._pendingChoice = -1;
    this._activeChoice = 0;
    this._canContinue = false;
    this._spatial.select(-1);
    this._clearNativeChoices();
    if (name.startsWith("question-")) {
      const questionIndex: number = Number(name.slice(-1)) - 1;
      const question: GhostQuestion | undefined =
        this._questions[questionIndex];
      if (!question) throw new Error(`Unknown test state: ${name}`);
      this._questionIndex = questionIndex;
      this._answersCommitted = questionIndex;
      this._spatial.setStoryProgressForTest(questionIndex);
      this._storyMode = "waiting";
      this._storyStartedAt = performance.now();
      this._applyFrame(
        this._storyFrame(
          question.question,
          "waiting",
          question.era,
          undefined,
          0
        )
      );
      this._spatial.settleForTestState(this._motionMs);
      this._updateCamera(100);
      this._refreshStaticFrame();
      return;
    }
    this._questionIndex = this._questions.length - 1;
    this._storyStartedAt = performance.now();
    this._answersCommitted = this._questions.length;
    this._spatial.setStoryProgressForTest(4);
    if (name === "final-name") {
      this._storyMode = "name";
      this._applyFrame(
        this._storyFrame(OMEGA_NAME_QUESTION, "name", this._finalEra, "Type a name", 0)
      );
      this._spatial.settleForTestState(this._motionMs);
      this._updateCamera(100);
      this._refreshStaticFrame();
      return;
    }
    this._playerName = "Traveler";
    this._root.dataset.osPlayerNameTs = this._playerName;
    if (name === "final-door") {
      this._storyMode = "doorway";
      this._spatial.beginDoorway(this._playerName);
      this._applyFrame(
        this._storyFrame(OMEGA_DOOR_WORDS, "doorway", this._finalEra, "Walk forward", 12000)
      );
      this._spatial.settleForTestState(this._motionMs);
      this._updateCamera(100);
      this._refreshStaticFrame();
      return;
    }
    this._storyMode = "complete";
    this._applyFrame(
      this._storyFrame(OMEGA_DOOR_WORDS, "complete", this._finalEra, undefined, 12000)
    );
    this._spatial.settleForTestState(this._motionMs);
    this._updateCamera(100);
    this._refreshStaticFrame();
  }

  private _refreshStaticFrame(): void {
    if (!this._renderer || !this._scene || !this._camera || !this._currentFrame)
      return;
    this._spatial.update(this._motionMs, this._isReduced);
    this._renderer.render(this._scene, this._camera);
  }

  private _getDiagnosticState(): IntroDiagnosticState {
    const phase: BootFrame["phase"] =
      (this._root?.dataset.osPhaseTs as BootFrame["phase"] | undefined) ??
      "cursor";
    const questionNumber: number = Math.min(
      this._questionIndex + 1,
      this._questions.length
    );
    const objective: string =
      this._storyMode === "complete"
        ? "opening-complete"
        : this._storyMode === "doorway"
          ? "walk-through-omega-words"
          : this._storyMode === "name"
            ? "answer-final-name-question"
            : this._storyMode === "final"
              ? "reach-final-door"
              : this._storyMode === "travel"
                ? `walk-to-question-${questionNumber}`
                : this._storyMode === "waiting"
                  ? `answer-question-${questionNumber}`
                  : `advance-${this._storyMode}`;
    return {
      frame: this._frameNumber,
      phase,
      storyMode: this._storyMode,
      questionIndex: this._questionIndex,
      objective,
      objectiveProgress: this._answersCommitted,
      complete: this._storyMode === "complete",
      failed: false,
      canContinue: this._canContinue,
      selectedChoice:
        this._selectedChoice >= 0 ? this._selectedChoice : this._activeChoice,
      pendingChoice: this._pendingChoice,
      actionDiscovered: this._actionDiscovered,
      tutorialAct: this._tutorialAct(),
      playerPosition: this._spatial.getPlayerPosition(),
      choiceTargets: this._spatial.getChoiceTargets(),
      seed: this._seed,
      audio: {
        unlocked: this._audio.unlocked,
        muted: this._audio.muted,
        cueCount: this._audio.cueCount,
      },
      physics: this._spatial.getPhysicsDiagnostics(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: this._renderer?.getPixelRatio() ?? 1,
      },
      activeLoops: this._isDestroyed || !this._raf ? 0 : 1,
      pausedForScreenshot: this._simulationPaused,
      debugUiHidden: this._debugUiHidden,
      dialogue: {
        levelId: this._questions[this._questionIndex]?.levelId ?? "",
        eraShaderId: this._questions[this._questionIndex]?.eraShaderId ?? "",
        event: this._dialogueEvent,
        nextLevel: this._nextLevel,
        values: this._dialogueState.snapshot(),
      },
    };
  }
}

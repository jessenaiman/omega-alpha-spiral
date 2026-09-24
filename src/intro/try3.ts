import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CubicBezierCurve3,
  Curve,
  CurvePath,
  DirectionalLight,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineCurve3,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { createGhostQuestions } from "../dialogue/ghost-vite";
import { createBootFrames } from "./ghostwriting";
import { getIntroEra } from "./IntroEraDesign";
import { createAtlas, GlyphRibbon } from "./SpatialBootScene";
import { StrandSigils } from "./StrandSigils";
import {
  loadBlenderIntroLayers,
  type BlenderIntroLayers,
} from "./BlenderIntroLayers";

type Variant = "tide" | "archive" | "current";
type Route = {
  curve: Curve<Vector3>;
  line: Mesh<TubeGeometry, MeshBasicMaterial>;
  words: GlyphRibbon[];
  sigils: StrandSigils;
  mark: Group;
};

const params = new URLSearchParams(location.search);
const requested = params.get("variant");
const variant: Variant =
  requested === "archive" || requested === "current" ? requested : "tide";
const isFinal = params.get("phase") === "final";
const mode = { tide: 0, archive: 1, current: 2 }[variant];
const titles = {
  tide: "Question 2 · Gravitational tide",
  archive: "Question 1 · Living code archive",
  current: "Question 3 · Celestial current",
};
const palette = [0xe5eff5, 0xe5af61, 0xd85a68];
const question =
  createGhostQuestions(472)[
    variant === "archive" ? 0 : variant === "tide" ? 1 : 2
  ];
const dreamweaverQuestions = question.choices.map((choice) => {
  const line = choice.response
    .split("\n")
    .reverse()
    .find((part) => part.trim().endsWith("?"));
  if (!line) throw new Error(`${choice.owner} needs a question`);
  return line.trim();
});
const dreamweaverMessages = question.choices.map((choice) =>
  choice.response.split("\n\n")[0].split("\n").slice(1).join("\n")
);
const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const titleElement = document.querySelector<HTMLElement>("#label");
const questionElement = document.querySelector<HTMLElement>("#question");
const statusElement = document.querySelector<HTMLElement>("#status");
if (!canvas || !titleElement || !questionElement || !statusElement || !question)
  throw new Error("Missing Try Three scene elements");
const stageCanvas: HTMLCanvasElement = canvas;
const status: HTMLElement = statusElement;
titleElement.textContent = isFinal
  ? "Omega · Final threshold"
  : titles[variant];
questionElement.textContent = isFinal
  ? "What is your name?"
  : question.question;
document.body.classList.toggle("final", isFinal);
document
  .querySelectorAll<HTMLAnchorElement>("[data-variant]")
  .forEach((link) => {
    if (!isFinal && link.dataset.variant === variant)
      link.setAttribute("aria-current", "page");
  });
if (isFinal)
  document.querySelector("#final-link")?.setAttribute("aria-current", "page");

let seed = 472;
const random = (): number => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const scene = new Scene();
scene.background = new Color(0x010309);
if (variant === "tide" || isFinal) {
  new TextureLoader().load(
    isFinal
      ? "/assets/intro/try3/final-question-threshold.png"
      : "/assets/intro/try3/first-question-celestial.png",
    (texture) => {
      texture.colorSpace = SRGBColorSpace;
      scene.background = texture;
    }
  );
}
const camera = new PerspectiveCamera(61, 1, 0.1, 240);
const renderer = new WebGLRenderer({
  canvas: stageCanvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));

// The original intro owns the spelling, erasures, and pauses. The scene study
// presents those frames on a world-space display instead of inventing new copy.
const writingFrames = isFinal
  ? []
  : createBootFrames(`472-${variant}`, question).filter(
      (frame) => frame.phase === "writing"
    );
const writingStart = writingFrames[0]?.at ?? 0;
const writingEnd = writingFrames[writingFrames.length - 1]?.at ?? 0;
let writingIndex = 0;
let writingDone = isFinal;
const terminalEra = getIntroEra(
  variant === "archive" ? 1 : variant === "tide" ? 3 : 4
);
const terminalColor = isFinal
  ? "#e9eef1"
  : `#${terminalEra.ink.toString(16).padStart(6, "0")}`;
const terminalCanvas = document.createElement("canvas");
terminalCanvas.width = 1024;
terminalCanvas.height = 340;
const terminalContext = terminalCanvas.getContext("2d");
if (!terminalContext) throw new Error("Terminal canvas unavailable");
const terminalTexture = new CanvasTexture(terminalCanvas);
terminalTexture.colorSpace = SRGBColorSpace;
const terminalGroup = new Group();
const terminalBack = new Mesh(
  new BoxGeometry(8.1, 2.95, 0.09),
  new MeshBasicMaterial({
    color: variant === "archive" ? 0x020d09 : 0x071018,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  })
);
terminalGroup.add(terminalBack);
const terminalScreen = new Mesh(
  new PlaneGeometry(7.88, 2.72),
  new MeshBasicMaterial({
    map: terminalTexture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
);
terminalScreen.position.z = 0.052;
terminalGroup.add(terminalScreen);
terminalGroup.position.set(0, 3.15, -2.2);
scene.add(terminalGroup);
let lastTerminalText = "";
const drawTerminal = (written: string): void => {
  if (written === lastTerminalText) return;
  lastTerminalText = written;
  terminalContext.fillStyle = variant === "archive" ? "#020b08" : "#050b12";
  terminalContext.fillRect(0, 0, 1024, 340);
  terminalContext.fillStyle = terminalColor;
  terminalContext.globalAlpha = 0.72;
  terminalContext.font = `28px ${terminalEra.font}`;
  terminalContext.fillText(
    isFinal
      ? "OMEGA  /  IDENTITY REQUEST"
      : variant === "archive"
        ? "C:\\> GHOSTWRITE /QUESTION"
        : `OMEGA  /  GHOSTWRITE  /  ${terminalEra.label}`,
    58,
    62
  );
  terminalContext.globalAlpha = 0.18;
  for (let y = 0; y < 340; y += 5) terminalContext.fillRect(0, y, 1024, 1);
  terminalContext.globalAlpha = 1;
  terminalContext.font = `${terminalEra.weight} 43px ${terminalEra.font}`;
  const lines = written.split("\n").flatMap((line) => {
    const words = line.split(" ");
    const wrapped: string[] = [];
    let row = "";
    words.forEach((word) => {
      if (`${row} ${word}`.trim().length > 38) {
        wrapped.push(row);
        row = word;
      } else row = `${row} ${word}`.trim();
    });
    wrapped.push(row);
    return wrapped;
  });
  lines
    .slice(0, 3)
    .forEach((line, index) =>
      terminalContext.fillText(line, 58, 142 + index * 61)
    );
  terminalContext.fillText(
    "▌",
    58 + terminalContext.measureText(lines[lines.length - 1] ?? "").width,
    142 + (Math.min(lines.length, 3) - 1) * 61
  );
  terminalTexture.needsUpdate = true;
};
drawTerminal(isFinal ? "What is your name?" : "");

const nebula = new Mesh(
  new PlaneGeometry(190, 120),
  new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStyle: { value: mode } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
    uniform float uTime; uniform float uStyle; varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+6.1;a*=.5;}return v;}
    void main(){vec2 p=vUv-.5; float r=length(p*vec2(1.65,1.)); float t=uTime*.006;
      float cloud=fbm(p*3.2+vec2(t,-t*.6));
      float alpha=0.; vec3 ink=vec3(.13,.19,.25);
      if(uStyle<.5){float lens=exp(-pow((r-.35)*7.,2.));alpha=(cloud*.12+lens*.045)*smoothstep(.88,.12,r); ink=vec3(.16,.20,.27);}
      else if(uStyle<1.5){float strata=sin(p.y*30.+cloud*9.)*.5+.5;alpha=(cloud*.43+strata*.11)*smoothstep(.95,.12,r);ink=mix(vec3(.08,.37,.29),vec3(.25,.23,.34),vUv.x);}
      else {float shear=exp(-pow((p.y-.12*sin(p.x*5.+t*8.))*3.5,2.));alpha=(cloud*.38+shear*.24)*smoothstep(1.,.1,r);ink=mix(vec3(.12,.31,.48),vec3(.46,.24,.31),vUv.x);}
      gl_FragColor=vec4(ink,clamp(alpha,0.,.55));
    }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
);
nebula.position.set(0, 10, -95);
scene.add(nebula);
nebula.visible = variant === "current" && !isFinal;

const starCount = [1150, 820, 1520][mode];
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (random() - 0.5) * 125;
  starPositions[i * 3 + 1] = (random() - 0.5) * 70 + 8;
  starPositions[i * 3 + 2] = -random() * 110 + 6;
}
const starGeometry = new BufferGeometry();
starGeometry.setAttribute("position", new BufferAttribute(starPositions, 3));
const stars = new Points(
  starGeometry,
  new PointsMaterial({
    color: 0xbacbdc,
    size: 0.1,
    transparent: true,
    opacity: mode === 1 ? 0.55 : 0.72,
    sizeAttenuation: true,
    depthWrite: false,
  })
);
scene.add(stars);

const floorOpacity = isFinal ? 0.07 : [0.044, 0.095, 0.045][mode];
const floor = new Mesh(
  new PlaneGeometry(42, 84),
  new MeshBasicMaterial({
    color: mode === 1 ? 0x8ab5ae : 0x9badbe,
    transparent: true,
    opacity: floorOpacity,
    side: DoubleSide,
    depthWrite: false,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -0.05, -31);
scene.add(floor);
const gridVertices: number[] = [];
for (let x = -18; x <= 18; x += mode === 1 ? 3 : 6)
  gridVertices.push(x, 0.005, 8, x, 0.005, -64);
for (let z = 6; z >= -64; z -= mode === 1 ? 3 : 8)
  gridVertices.push(-18, 0.005, z, 18, 0.005, z);
const gridGeometry = new BufferGeometry();
gridGeometry.setAttribute(
  "position",
  new BufferAttribute(new Float32Array(gridVertices), 3)
);
const grid = new LineSegments(
  gridGeometry,
  new LineBasicMaterial({
    color: mode === 1 ? 0x74b3a1 : 0x8499ad,
    transparent: true,
    opacity: isFinal ? 0.08 : [0.13, 0.25, 0.1][mode],
    depthWrite: false,
  })
);
scene.add(grid);
const glyphAtlases = Array.from({ length: 6 }, (_, format) =>
  createAtlas(format)
);

const drawWord = (text: string, color: number): Sprite => {
  const image = document.createElement("canvas");
  image.width = 512;
  image.height = 96;
  const ctx = image.getContext("2d");
  if (!ctx) throw new Error("Canvas text unavailable");
  ctx.clearRect(0, 0, 512, 96);
  ctx.font = "34px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = `#${color.toString(16).padStart(6, "0")}`;
  ctx.shadowBlur = mode === 2 ? 16 : 8;
  ctx.fillStyle = "#e9f0f2";
  ctx.fillText(text, 256, 48, 500);
  const texture = new CanvasTexture(image);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(
    new SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    })
  );
  sprite.scale.set(3.8, 0.72, 1);
  return sprite;
};

const pathCurve = (index: number): Curve<Vector3> => {
  if (index === 0)
    return new LineCurve3(
      new Vector3(-3, 0.05, 1.5),
      new Vector3(-0.73, 0.05, -18)
    );
  if (index === 1) {
    const corners = [
      new Vector3(-0.05, 0.05, 1.5),
      new Vector3(-0.7, 0.05, -3),
      new Vector3(0.38, 0.05, -6.5),
      new Vector3(-0.9, 0.05, -10),
      new Vector3(0.35, 0.05, -13.7),
      new Vector3(0, 0.05, -18),
    ];
    const route = new CurvePath<Vector3>();
    for (let i = 1; i < corners.length; i++)
      route.add(new LineCurve3(corners[i - 1], corners[i]));
    return route;
  }
  return new CubicBezierCurve3(
    new Vector3(3.05, 0.05, 1.5),
    new Vector3(3.45, 0.05, -3.84),
    new Vector3(1.8, 0.05, -12.86),
    new Vector3(0.73, 0.05, -18)
  );
};

const floatingHeight = (
  owner: number,
  index: number,
  count: number
): number => {
  if (owner === 0) return 1.78 + index * 0.1;
  if (owner === 1) return 2.72 + (index % 2) * 0.26;
  return 2.12 + Math.sin((index / Math.max(1, count - 1)) * Math.PI) * 0.42;
};

const routes: Route[] = [];
for (let i = 0; i < 3; i++) {
  const curve = pathCurve(i);
  const line = new Mesh(
    new TubeGeometry(curve, 80, 0.014, 4, false),
    new MeshBasicMaterial({
      color: palette[i],
      transparent: true,
      opacity: [0.24, 0.21, 0.31][mode],
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  scene.add(line);
  const words: GlyphRibbon[] = [];
  const sigils = new StrandSigils(
    curve,
    i,
    palette[i],
    glyphAtlases,
    terminalEra.id
  );
  scene.add(sigils.root);
  const tokens = dreamweaverQuestions[i]
    .replace(/[—.,!]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const phraseCount = Math.ceil(tokens.length / 3);
  for (let groupIndex = 0; groupIndex < phraseCount; groupIndex++) {
    const phrase = tokens.slice(groupIndex * 3, groupIndex * 3 + 3).join(" ");
    const glyph = new GlyphRibbon(glyphAtlases);
    glyph.init();
    glyph.setText(phrase, terminalEra.id, phrase.length, palette[i], i);
    glyph.root.scale.setScalar(0.31);
    const t = 0.12 + (groupIndex / Math.max(1, phraseCount - 1)) * 0.66;
    const point = curve.getPoint(t);
    glyph.root.position.set(
      point.x - phrase.length * 0.64 * 0.155 + [-0.65, 0, 0.65][i],
      floatingHeight(i, groupIndex, phraseCount),
      point.z
    );
    words.push(glyph);
    scene.add(glyph.root);
  }
  const mark = new Group();
  const endpoint = curve.getPoint(1);
  mark.position.set(endpoint.x, 1.55, endpoint.z);
  mark.add(
    new Mesh(
      new IcosahedronGeometry(0.055, 0),
      new MeshBasicMaterial({ color: palette[i] })
    )
  );
  scene.add(mark);
  routes.push({ curve, line, words, sigils, mark });
}

const player = new Group();
const bodyMat = new MeshPhysicalMaterial({
  color: 0xb8d2e0,
  transparent: true,
  opacity: 0.56,
  metalness: 0.1,
  roughness: 0.27,
  depthWrite: false,
});
const core = new Mesh(
  new BoxGeometry(0.34, 0.34, 0.34),
  new MeshBasicMaterial({ color: 0xf3f8ff })
);
core.position.y = 1.15;
player.add(core);
const torso = new Mesh(new IcosahedronGeometry(0.37, 1), bodyMat);
torso.position.y = 1.13;
torso.scale.set(0.9, 1.25, 0.48);
player.add(torso);
const head = new Mesh(new SphereGeometry(0.22, 16, 12), bodyMat);
head.position.y = 1.73;
player.add(head);
const limbs: Mesh[] = [];
for (const side of [-1, 1]) {
  const leg = new Mesh(new BoxGeometry(0.13, 0.67, 0.16), bodyMat);
  leg.position.set(side * 0.17, 0.43, 0);
  player.add(leg);
  limbs.push(leg);
  const arm = new Mesh(new BoxGeometry(0.1, 0.63, 0.12), bodyMat);
  arm.position.set(side * 0.46, 1.1, 0);
  player.add(arm);
  limbs.push(arm);
}
const footGlow = new Mesh(
  new PlaneGeometry(0.72, 0.72),
  new MeshBasicMaterial({
    color: 0xdce9f2,
    transparent: true,
    opacity: 0.17,
    side: DoubleSide,
    depthWrite: false,
    blending: AdditiveBlending,
  })
);
footGlow.rotation.x = -Math.PI / 2;
footGlow.position.y = 0.018;
player.add(footGlow);
scene.add(player);
const setForm = (stage: number): void => {
  torso.visible = stage >= 2;
  head.visible = stage >= 3;
  limbs.forEach((limb, i) => {
    limb.visible = i % 2 === 0 ? stage >= 1 : stage >= 3;
  });
  core.scale.setScalar(stage >= 3 ? 0.7 : stage === 2 ? 0.85 : 1.2);
};

const archiveGroup = new Group();
if (variant === "archive") {
  for (let bank = -1; bank <= 1; bank++) {
    const x = bank * 8.8;
    const z = bank === 0 ? -28 : -15;
    const panel = new Mesh(
      new PlaneGeometry(bank === 0 ? 6.3 : 5.1, bank === 0 ? 8.8 : 9.8),
      new MeshBasicMaterial({
        color: 0x345a56,
        transparent: true,
        opacity: bank === 0 ? 0.14 : 0.21,
        side: DoubleSide,
        depthWrite: false,
      })
    );
    panel.position.set(x, 5.3, z);
    panel.rotation.y = bank * -0.24;
    archiveGroup.add(panel);
    const edges = new LineSegments(
      new BufferGeometry().setAttribute(
        "position",
        new BufferAttribute(
          new Float32Array([
            x - 2.5,
            0.4,
            z,
            x - 2.5,
            10.2,
            z,
            x + 2.5,
            0.4,
            z,
            x + 2.5,
            10.2,
            z,
            x - 2.5,
            10.2,
            z,
            x + 2.5,
            10.2,
            z,
          ]),
          3
        )
      ),
      new LineBasicMaterial({
        color: 0x8ec2aa,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    archiveGroup.add(edges);
    for (let row = 0; row < 10; row++) {
      const code = drawWord(
        ["MOV AX, 0x", "INT 21H", "CALL ECHO", "0110 1001", "JMP 472"][row % 5],
        0x8dc9aa
      );
      code.material.opacity = 0.28 + (row % 3) * 0.08;
      code.scale.set(bank === 0 ? 3.1 : 2.65, 0.42, 1);
      code.position.set(x, 1.3 + row * 0.84, z + 0.06);
      archiveGroup.add(code);
    }
  }
}
scene.add(archiveGroup);
const currentGroup = new Group();
if (variant === "current") {
  for (let i = 0; i < 25; i++) {
    const z = -6 - i * 2.1;
    const curve = new CatmullRomCurve3([
      new Vector3(-13, 4 + random() * 4, z + 4),
      new Vector3(-3, 5 + random() * 4, z),
      new Vector3(5, 3 + random() * 5, z - 4),
      new Vector3(13, 5 + random() * 4, z - 8),
    ]);
    const positions = curve.getPoints(46).flatMap((p) => [p.x, p.y, p.z]);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3)
    );
    currentGroup.add(
      new Line(
        geometry,
        new LineBasicMaterial({
          color: i % 3 === 0 ? 0xc2ad98 : i % 3 === 1 ? 0x77b7d3 : 0xb68bbd,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          blending: AdditiveBlending,
        })
      )
    );
  }
  scene.add(currentGroup);
}

let nameEntered = false;
let givenName = "";
let doorAssembly = 0;
const doorPieces: {
  mesh: Mesh<BoxGeometry, MeshBasicMaterial>;
  start: Vector3;
  target: Vector3;
}[] = [];
const doorwayWords = drawWord("I had a name once. Was it mine?", 0xe8eff2);
doorwayWords.scale.set(6.7, 0.67, 1);
doorwayWords.position.set(0, 3.6, -17.7);
doorwayWords.material.opacity = 0;
if (isFinal) {
  for (let i = 0; i < 48; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const y = 0.25 + row * 0.22;
    const target = new Vector3(
      side * (1.62 + Math.sin(row * 0.69) * 0.12),
      y,
      -18
    );
    const start = new Vector3(
      side * (2.1 + random() * 5),
      y + (random() - 0.5) * 5,
      -18 + (random() - 0.5) * 8
    );
    const mesh = new Mesh(
      new BoxGeometry(0.13 + random() * 0.16, 0.15 + random() * 0.22, 0.16),
      new MeshBasicMaterial({
        color: i % 5 === 0 ? 0xcda677 : 0xc9d9df,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    );
    mesh.position.copy(start);
    mesh.visible = false;
    scene.add(mesh);
    doorPieces.push({ mesh, start, target });
  }
  scene.add(doorwayWords);
  routes.forEach((route) => {
    route.line.visible = false;
    route.sigils.root.visible = false;
    route.words.forEach((word) => {
      word.root.visible = false;
    });
    route.mark.visible = false;
  });
}

scene.add(new AmbientLight(0x9bb5c7, 0.75));
const light = new DirectionalLight(0xe6f1ff, 1.65);
light.position.set(-3, 8, 5);
scene.add(light);

const filamentPositions = new Float32Array(480 * 3);
const filamentGeometry = new BufferGeometry();
filamentGeometry.setAttribute(
  "position",
  new BufferAttribute(filamentPositions, 3)
);
filamentGeometry.setDrawRange(0, 0);
const filamentMaterial = new LineBasicMaterial({
  color: 0xe3eef3,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
  blending: AdditiveBlending,
});
const filament = new Line(filamentGeometry, filamentMaterial);
filament.frustumCulled = false;
scene.add(filament);
let filamentCount = 0;
let lastFilament = new Vector3(100, 100, 100);
const appendFilament = (): void => {
  if (filamentCount >= 480 || player.position.distanceTo(lastFilament) < 0.17)
    return;
  const n = filamentCount * 3;
  filamentPositions[n] = player.position.x;
  filamentPositions[n + 1] = 0.08;
  filamentPositions[n + 2] = player.position.z;
  filamentCount++;
  filamentGeometry.setDrawRange(0, filamentCount);
  filamentGeometry.attributes.position.needsUpdate = true;
  lastFilament.copy(player.position);
};

const keys = new Set<string>();
let selected = -1;
let progress = 0;
let arrived = false;
let form = isFinal ? 4 : variant === "archive" ? 0 : variant === "tide" ? 1 : 2;
let tapSeconds = 0;
let choicesRevealed = false;
let choicesWriting = false;
let choicesWritingAt = 0;
let activeWriter = -1;
let previewOwner = 1;
let writingOrigin = performance.now();
let blenderLayers: BlenderIntroLayers | null = null;
let blenderLayerError = false;
const syncArchiveVisuals = (): void => {
  if (variant !== "archive" || isFinal) return;
  const show = choicesRevealed;
  const useBlender = blenderLayers !== null;
  stars.visible = show && !useBlender;
  floor.visible = show && !useBlender;
  grid.visible = show && !useBlender;
  archiveGroup.visible = show;
  if (blenderLayers) {
    blenderLayers.background.visible = show;
    blenderLayers.strands.visible = show;
    routes.forEach((route) => {
      route.line.visible = false;
    });
  }
};
const revealButton =
  document.querySelector<HTMLButtonElement>("#reveal-choices");
const revealChoices = (): void => {
  if (isFinal || !writingDone || choicesWriting || choicesRevealed) return;
  choicesWriting = true;
  choicesWritingAt = performance.now();
  activeWriter = 0;
  if (revealButton) revealButton.hidden = true;
  updateStatus();
};
const updateStatus = (): void => {
  status.classList.toggle(
    "question-focus",
    !isFinal && (choicesWriting || choicesRevealed) && !arrived
  );
  const focused =
    selected >= 0 ? selected : choicesWriting ? activeWriter : previewOwner;
  status.style.setProperty(
    "--question-color",
    `#${palette[Math.max(0, focused)].toString(16).padStart(6, "0")}`
  );
  if (isFinal) {
    status.textContent = arrived
      ? `${givenName} · the threshold remembers your crossing.`
      : nameEntered
        ? `The door is assembling for ${givenName}. Walk forward through the words.`
        : "Omega asks for a name. The final answer assembles a threshold instead of offering three paths.";
  } else if (arrived && selected >= 0) {
    status.textContent = `${["LIGHT", "SHADOW", "AMBITION"][selected]} · the Dreamweaver is centered.\n${dreamweaverMessages[selected]}\nR replays this same question.`;
  } else if (selected >= 0) {
    status.textContent = `${["LIGHT", "SHADOW", "AMBITION"][selected]} ASKS\n${dreamweaverQuestions[selected]}\nWalk the strand to hear them.`;
  } else if (choicesWriting) {
    status.textContent = `${["LIGHT", "SHADOW", "AMBITION"][activeWriter]} ASKS\n${dreamweaverQuestions[activeWriter]}`;
  } else if (!choicesRevealed) {
    status.textContent = writingDone
      ? "Omega has finished the question. Let the Dreamweavers ask theirs."
      : "Omega is ghostwriting the question. Watch the old terminal correct itself.";
  } else {
    status.textContent = `${["LIGHT", "SHADOW", "AMBITION"][previewOwner]} ASKS\n${dreamweaverQuestions[previewOwner]}\nA / D previews a strand · W follows it.`;
  }
};
const reset = (): void => {
  player.position.set(0, 0, 5);
  player.rotation.set(0, 0, 0);
  selected = -1;
  progress = 0;
  arrived = false;
  form = isFinal ? 4 : variant === "archive" ? 0 : variant === "tide" ? 1 : 2;
  setForm(form);
  tapSeconds = 0;
  nameEntered = false;
  givenName = "";
  doorAssembly = 0;
  doorwayWords.material.opacity = 0;
  choicesRevealed = false;
  choicesWriting = false;
  choicesWritingAt = 0;
  activeWriter = -1;
  previewOwner = 1;
  writingDone = isFinal;
  writingIndex = 0;
  writingOrigin = performance.now();
  if (revealButton) revealButton.hidden = true;
  drawTerminal(isFinal ? "What is your name?" : "");
  const nameField =
    document.querySelector<HTMLInputElement>("#name-entry input");
  if (nameField) nameField.value = "";
  filamentCount = 0;
  filamentGeometry.setDrawRange(0, 0);
  lastFilament.set(100, 100, 100);
  filamentMaterial.color.setHex(0xe3eef3);
  routes.forEach((route) => {
    route.line.material.opacity = [0.24, 0.21, 0.31][mode];
    route.line.visible = false;
    route.sigils.root.visible = false;
    route.mark.visible = false;
    route.words.forEach((word) => {
      word.root.scale.setScalar(0.31);
      word.root.visible = false;
    });
  });
  syncArchiveVisuals();
  updateStatus();
};
reset();
if (variant === "archive" && !isFinal) {
  void loadBlenderIntroLayers(scene)
    .then((layers) => {
      blenderLayers = layers;
      document.body.dataset.blenderLayers = "loaded";
      syncArchiveVisuals();
    })
    .catch((error: unknown) => {
      blenderLayerError = true;
      document.body.dataset.blenderLayers = "fallback";
      console.warn(
        "Blender intro layers unavailable; using scene geometry",
        error
      );
    });
}
revealButton?.addEventListener("click", revealChoices);
document
  .querySelector<HTMLFormElement>("#name-entry")
  ?.addEventListener("submit", (event) => {
    event.preventDefault();
    const field = document.querySelector<HTMLInputElement>("#name-entry input");
    const value = field?.value.trim();
    if (!value) return;
    givenName = value;
    nameEntered = true;
    field?.blur();
    updateStatus();
  });
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowleft", "arrowright", " ", "enter"].includes(key))
    event.preventDefault();
  if (!isFinal && (key === "enter" || key === " ")) {
    revealChoices();
    return;
  }
  if (key === "r") reset();
  else keys.add(key);
});
window.addEventListener("keyup", (event) =>
  keys.delete(event.key.toLowerCase())
);
window.addEventListener("blur", () => keys.clear());
document.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((button) => {
  const key = button.dataset.key ?? "";
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(key);
  });
  button.addEventListener("pointerup", () => keys.delete(key));
  button.addEventListener("pointercancel", () => keys.delete(key));
  button.addEventListener("click", () => {
    if (key === "w") tapSeconds += 0.65;
    if (key === "a" || key === "d")
      player.position.x = Math.max(
        -3.5,
        Math.min(3.5, player.position.x + (key === "a" ? -0.72 : 0.72))
      );
  });
});

const resize = (): void => {
  const width = innerWidth,
    height = innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);
resize();
camera.position.set(0, 2.9, 11.4);
camera.lookAt(0, 1.05, -0.7);
const cameraPosition = new Vector3();
const cameraTarget = new Vector3();
const previous = { at: performance.now() };
const frame = (at: number): void => {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (at - previous.at) / 1000);
  previous.at = at;
  nebula.material.uniforms.uTime.value = at * 0.001;
  stars.rotation.y = Math.sin(at * 0.00003) * 0.013;
  currentGroup.position.x = Math.sin(at * 0.00016) * 0.35;
  routes.forEach((route, i) => {
    route.mark.rotation.y += dt * (0.08 + i * 0.025);
    route.mark.rotation.z += dt * 0.025;
  });
  if (!isFinal && !writingDone && writingFrames.length > 0) {
    const writingAt = writingStart + (at - writingOrigin) * 1.55;
    while (
      writingIndex < writingFrames.length - 1 &&
      writingFrames[writingIndex + 1].at <= writingAt
    )
      writingIndex++;
    drawTerminal(writingFrames[writingIndex].question);
    if (writingAt >= writingEnd) {
      writingDone = true;
      if (revealButton) revealButton.hidden = false;
      updateStatus();
    }
  }
  if (choicesWriting && !choicesRevealed) {
    const secondsPerQuestion = 1.45;
    const elapsed = (at - choicesWritingAt) / 1000;
    const writer = Math.min(2, Math.floor(elapsed / secondsPerQuestion));
    if (writer !== activeWriter) {
      activeWriter = writer;
      updateStatus();
    }
    routes.forEach((route, index) => {
      const local = Math.max(0, elapsed - index * secondsPerQuestion);
      const visibleWords = Math.min(
        route.words.length,
        Math.ceil((local / secondsPerQuestion) * route.words.length)
      );
      route.words.forEach((word, wordIndex) => {
        word.root.visible = index === writer && wordIndex < visibleWords;
      });
    });
    if (elapsed >= routes.length * secondsPerQuestion) {
      choicesWriting = false;
      choicesRevealed = true;
      routes.forEach((route) => {
        route.line.visible = true;
        route.mark.visible = true;
        route.sigils.root.visible = true;
        route.words.forEach((word) => {
          word.root.visible = false;
        });
      });
      syncArchiveVisuals();
      updateStatus();
    }
  }
  const forward = keys.has("w") || keys.has("arrowup") || tapSeconds > 0;
  tapSeconds = Math.max(0, tapSeconds - dt);
  if (isFinal) {
    doorAssembly +=
      ((nameEntered ? 1 : 0) - doorAssembly) * (1 - Math.exp(-dt * 1.6));
    doorPieces.forEach(({ mesh, start, target }) => {
      mesh.visible = doorAssembly > 0.04;
      mesh.position.lerpVectors(start, target, doorAssembly);
      mesh.rotation.z = (1 - doorAssembly) * 0.8;
    });
    doorwayWords.material.opacity = Math.min(0.92, doorAssembly * 1.3);
    if (nameEntered && forward && !arrived) {
      player.position.z = Math.max(-17.5, player.position.z - dt * 3.1);
      appendFilament();
      if (player.position.z <= -17.5) {
        arrived = true;
        updateStatus();
      }
    }
  } else if (choicesRevealed && !arrived) {
    if (selected < 0) {
      const lateral =
        Number(keys.has("d") || keys.has("arrowright")) -
        Number(keys.has("a") || keys.has("arrowleft"));
      player.position.x = Math.max(
        -3.5,
        Math.min(3.5, player.position.x + lateral * dt * 3.1)
      );
      const nextPreview =
        player.position.x < -1.2 ? 0 : player.position.x > 1.2 ? 2 : 1;
      if (nextPreview !== previewOwner) {
        previewOwner = nextPreview;
        updateStatus();
      }
      if (forward)
        player.position.z = Math.max(1.45, player.position.z - dt * 3.1);
      if (forward && player.position.z <= 1.45) {
        selected =
          player.position.x < -1.2 ? 0 : player.position.x > 1.2 ? 2 : 1;
        routes.forEach((route, i) => {
          route.line.material.opacity = i === selected ? 0.65 : 0.05;
          route.words.forEach((word) => {
            word.root.scale.setScalar(i === selected ? 0.34 : 0.26);
          });
        });
        filamentMaterial.color
          .copy(new Color(0xe3eef3))
          .lerp(new Color(palette[selected]), 0.22);
        updateStatus();
      }
    } else if (forward) {
      progress = Math.min(1, progress + dt * 0.16);
      const position = routes[selected].curve.getPoint(progress);
      player.position.set(position.x, 0, position.z);
      const tangent = routes[selected].curve.getTangent(progress);
      player.rotation.y = Math.atan2(-tangent.x, -tangent.z);
      if (progress >= 1) {
        arrived = true;
        form = Math.min(3, form + 1);
        setForm(form);
        updateStatus();
      }
    }
    if (forward) appendFilament();
  }
  const walking = forward && !arrived;
  core.rotation.y += dt * 0.45;
  core.rotation.z += dt * 0.18;
  player.position.y = walking ? Math.sin(at * 0.008) * 0.025 : 0;
  footGlow.material.opacity = walking
    ? 0.22 + Math.sin(at * 0.017) * 0.06
    : 0.11;
  const terminalRecedes = isFinal ? nameEntered : choicesRevealed;
  const terminalTarget = terminalRecedes
    ? new Vector3(0, 5.7, -12)
    : new Vector3(0, 3.15, -2.2);
  terminalGroup.position.lerp(terminalTarget, 1 - Math.exp(-dt * 1.45));
  const terminalScale = terminalRecedes ? 0.63 : 1;
  terminalGroup.scale.setScalar(
    terminalGroup.scale.x +
      (terminalScale - terminalGroup.scale.x) * (1 - Math.exp(-dt * 1.45))
  );
  terminalGroup.rotation.y = Math.sin(at * 0.00036) * 0.025;
  terminalBack.material.opacity = arrived ? 0.28 : 0.9;
  terminalScreen.material.opacity = arrived ? 0.35 : 1;
  if (arrived && selected >= 0) {
    const mark = routes[selected].mark.position;
    cameraPosition.set(mark.x + 1.3, 2.5, mark.z + 4.4);
    cameraTarget.set(mark.x, 1.55, mark.z);
  } else if (isFinal && arrived) {
    cameraPosition.set(1.3, 3.5, -12.8);
    cameraTarget.set(0, 3.1, -18);
  } else {
    cameraPosition.set(player.position.x * 0.7, 2.9, player.position.z + 6.4);
    cameraTarget.set(player.position.x * 0.65, 1.05, player.position.z - 5.7);
  }
  camera.position.lerp(cameraPosition, 1 - Math.exp(-dt * 3.6));
  camera.lookAt(cameraTarget);
  routes.forEach((route, owner) => {
    route.sigils.update(at * 0.001, camera.quaternion);
    route.words.forEach((word, wordIndex) => {
      word.update(at * 0.001, [0, 0.25, 0.16][owner]);
      word.root.position.y =
        floatingHeight(owner, wordIndex, route.words.length) +
        Math.sin(at * 0.00075 + wordIndex * 1.23 + owner * 0.8) *
          [0.08, 0.14, 0.2][owner];
      word.root.quaternion.copy(camera.quaternion);
      if (choicesRevealed && !arrived) {
        const wordT =
          0.12 + (wordIndex / Math.max(1, route.words.length - 1)) * 0.66;
        word.root.visible =
          owner === selected &&
          wordT >= progress - 0.08 &&
          wordT <= progress + 0.32;
      }
    });
  });
  renderer.render(scene, camera);
  Reflect.set(window, "__THREE_GAME_DIAGNOSTICS__", {
    renderer: {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    },
    state: {
      variant,
      phase: isFinal ? "final" : "question",
      choicesRevealed,
      choicesWriting,
      activeWriter,
      selectedChoice: selected,
      nameEntered,
      arrived,
      playerStage: form,
      progress,
      blenderLayersLoaded: blenderLayers !== null,
      blenderLayerError,
      playerPosition: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
      },
    },
  });
};
requestAnimationFrame(frame);

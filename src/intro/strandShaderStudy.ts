import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineCurve3,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { createGhostQuestions } from "../dialogue/ghost-vite";
import { createBootFrames } from "./ghostwriting";

const question = createGhostQuestions(472)[0];
const canvas = document.querySelector<HTMLCanvasElement>("#stage");
const status = document.querySelector<HTMLElement>("#status");
const revealButton =
  document.querySelector<HTMLButtonElement>("#reveal-choices");
if (!canvas || !status || !revealButton || !question)
  throw new Error("Missing strand study elements");

const scene = new Scene();
scene.background = new Color(0x03050a);
const camera = new PerspectiveCamera(57, 1, 0.1, 160);
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

// A deliberately sparse field keeps the path silhouettes legible.
let seed = 472;
const random = (): number => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const starPositions = new Float32Array(240 * 3);
for (let i = 0; i < 240; i++) {
  starPositions[i * 3] = (random() - 0.5) * 100;
  starPositions[i * 3 + 1] = random() * 42 + 2;
  starPositions[i * 3 + 2] = -random() * 105 - 8;
}
const starGeometry = new BufferGeometry();
starGeometry.setAttribute("position", new BufferAttribute(starPositions, 3));
scene.add(
  new Points(
    starGeometry,
    new PointsMaterial({
      color: 0x9baab8,
      size: 0.075,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  )
);

// Faint ground marks imply a floor without creating a solid platform.
const floorGeometry = new BufferGeometry();
const floorPoints: number[] = [];
for (let x = -12; x <= 12; x += 3)
  floorPoints.push(x, -0.015, 4, x, -0.015, -48);
for (let z = 4; z >= -48; z -= 6)
  floorPoints.push(-12, -0.015, z, 12, -0.015, z);
floorGeometry.setAttribute(
  "position",
  new BufferAttribute(new Float32Array(floorPoints), 3)
);
const floor = new Mesh(
  new PlaneGeometry(24, 52),
  new MeshBasicMaterial({
    color: 0x92a5b6,
    transparent: true,
    opacity: 0.022,
    side: DoubleSide,
    depthWrite: false,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -0.02, -22);
scene.add(floor);
// Draw only widely spaced, nearly invisible floor axes.
const floorLines = new LineSegments(
  floorGeometry,
  new LineBasicMaterial({
    color: 0x8fa2b2,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
  })
);
scene.add(floorLines);

const palette = [0xdce5ea, 0xd79a55, 0xc94a57];
const strandMaterial = (color: number): ShaderMaterial =>
  new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uReveal: { value: 0 },
      uSelected: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
    uniform float uTime; uniform float uReveal; uniform float uSelected; uniform vec3 uColor; varying vec2 vUv;
    void main(){
      float edge=1.0-smoothstep(.18,.5,abs(vUv.y-.5));
      float pulse=.78+.22*sin(vUv.x*18.0-uTime*2.4);
      float traveling=1.0-smoothstep(.0,.13,abs(fract(uTime*.12)-vUv.x));
      float body=(.32+.42*pulse+.22*traveling)*edge;
      float alpha=body*uReveal*(mix(.68,1.0,uSelected));
      gl_FragColor=vec4(uColor*(.72+.28*pulse),alpha);
    }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });

type Strand = {
  pieces: Mesh[];
  material: ShaderMaterial;
  label: Mesh<PlaneGeometry, MeshBasicMaterial>;
  end: Vector3;
  pointAt: (t: number) => Vector3;
};
const makeLabel = (
  text: string,
  color: number
): Mesh<PlaneGeometry, MeshBasicMaterial> => {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 96;
  const ctx = labelCanvas.getContext("2d");
  if (!ctx) throw new Error("Label canvas unavailable");
  ctx.clearRect(0, 0, 512, 96);
  ctx.font = "30px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillText(text, 256, 48, 500);
  const texture = new CanvasTexture(labelCanvas);
  const label = new Mesh<PlaneGeometry, MeshBasicMaterial>(
    new PlaneGeometry(3.5, 0.66),
    new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
  );
  return label;
};
const makePiece = (
  a: Vector3,
  b: Vector3,
  material: ShaderMaterial,
  radius = 0.025
): Mesh => {
  const curve = new LineCurve3(a, b);
  return new Mesh(new TubeGeometry(curve, 14, radius, 5, false), material);
};
const lanes = [-3.2, 0, 3.2];
const goal = new Vector3(0, 0.06, -35);
const strands: Strand[] = question.choices.map((choice, index) => {
  const material = strandMaterial(palette[index]);
  const start = new Vector3(lanes[index], 0.06, -1.5);
  let pieces: Mesh[];
  let end = new Vector3(lanes[index] * 0.22, 0.06, -32);
  let pointAt: (t: number) => Vector3;
  if (index === 0) {
    // Light remains one exact straight line from the player's decision point.
    pieces = [makePiece(start, end, material, 0.021)];
    pointAt = (t) => start.clone().lerp(end, t);
  } else if (index === 1) {
    // Shadow is made of straight runs with abrupt, readable changes of heading.
    const points = [
      start,
      new Vector3(-0.2, 0.06, -8),
      new Vector3(2.1, 0.06, -14),
      new Vector3(-1.5, 0.06, -21),
      new Vector3(0.8, 0.06, -27),
      end,
    ];
    pieces = points
      .slice(1)
      .map((point, pieceIndex) =>
        makePiece(points[pieceIndex], point, material, 0.024)
      );
    pointAt = (t) => {
      const segment = Math.min(
        points.length - 2,
        Math.floor(t * (points.length - 1))
      );
      return points[segment]
        .clone()
        .lerp(points[segment + 1], t * (points.length - 1) - segment);
    };
  } else {
    // Ambition bends continuously inward, keeping its goal in sight.
    const curve = new CatmullRomCurve3(
      [
        start,
        new Vector3(4.7, 0.06, -7),
        new Vector3(3.8, 0.06, -15),
        new Vector3(1.2, 0.06, -23),
        end,
      ],
      false,
      "centripetal"
    );
    pieces = [
      new Mesh(new TubeGeometry(curve, 112, 0.026, 6, false), material),
    ];
    pointAt = (t) => curve.getPoint(t);
  }
  pieces.forEach((piece) => scene.add(piece));
  const questionLine = choice.response
    .split("\n")
    .find((line) => line.trim().endsWith("?"));
  if (!questionLine) throw new Error(`${choice.owner} needs a question`);
  const label = makeLabel(
    `${choice.owner.toUpperCase()}  /  ${questionLine.trim()}`,
    palette[index]
  );
  label.position.set(end.x, 0.62, end.z - 1.3);
  scene.add(label);
  return { pieces, material, label, end, pointAt };
});

// A vague convergence point suggests a future doorway without drawing one.
const goalThreads = new BufferGeometry();
goalThreads.setAttribute(
  "position",
  new BufferAttribute(
    new Float32Array([
      -1.15, 0.06, -38, -0.35, 0.06, -34, 0.35, 0.06, -34, 1.15, 0.06, -38,
    ]),
    3
  )
);
const goalLines = new LineSegments(
  goalThreads,
  new LineBasicMaterial({
    color: 0x9daab4,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
  })
);
scene.add(goalLines);

// The oversized pixel is the player for this visual study.
const player = new Mesh(
  new BoxGeometry(0.72, 0.72, 0.72),
  new MeshBasicMaterial({ color: 0xe6edf0 })
);
player.position.set(0, 0.48, 3.8);
scene.add(player);
const playerInner = new Mesh(
  new BoxGeometry(0.27, 0.27, 0.27),
  new MeshBasicMaterial({ color: 0x273441 })
);
player.add(playerInner);
playerInner.position.set(0, 0, 0.37);

// The 3D terminal uses the runtime's timed corrections and original question text.
const terminalFrames = createBootFrames("472-archive-strands", question).filter(
  (frame) => frame.phase === "writing"
);
const writingStart = terminalFrames[0]?.at ?? 0;
const writingEnd = terminalFrames.at(-1)?.at ?? 0;
let writingIndex = 0;
let writingDone = false;
let writingOrigin = performance.now();
const terminalCanvas = document.createElement("canvas");
terminalCanvas.width = 1024;
terminalCanvas.height = 420;
const terminalContext = terminalCanvas.getContext("2d");
if (!terminalContext) throw new Error("Terminal canvas unavailable");
const terminalTexture = new CanvasTexture(terminalCanvas);
const terminal = new Group();
const terminalBack = new Mesh(
  new BoxGeometry(9.4, 3.9, 0.12),
  new MeshBasicMaterial({
    color: 0x020907,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  })
);
terminal.add(terminalBack);
const terminalScreen = new Mesh(
  new PlaneGeometry(9.12, 3.63),
  new MeshBasicMaterial({
    map: terminalTexture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })
);
terminalScreen.position.z = 0.071;
terminal.add(terminalScreen);
terminal.position.set(0, 3.3, -2.5);
scene.add(terminal);
let lastWritten = "";
const drawTerminal = (written: string): void => {
  if (lastWritten === written) return;
  lastWritten = written;
  terminalContext.fillStyle = "#020a08";
  terminalContext.fillRect(0, 0, 1024, 420);
  terminalContext.fillStyle = "#9fcab0";
  terminalContext.globalAlpha = 0.78;
  terminalContext.font = "27px Courier New, monospace";
  terminalContext.fillText("C:\\> GHOSTWRITE / QUESTION 01", 50, 54);
  terminalContext.globalAlpha = 0.17;
  for (let y = 0; y < 420; y += 5) terminalContext.fillRect(0, y, 1024, 1);
  terminalContext.globalAlpha = 1;
  terminalContext.font = "43px Courier New, monospace";
  const lines = written.split("\n");
  lines
    .slice(0, 4)
    .forEach((line, i) => terminalContext.fillText(line, 50, 142 + i * 62));
  terminalContext.fillText(
    "▌",
    50 + terminalContext.measureText(lines.at(-1) ?? "").width,
    142 + (Math.min(lines.length, 4) - 1) * 62
  );
  terminalTexture.needsUpdate = true;
};
drawTerminal("");

let revealed = false;
let selected = 1;
let committed = false;
let progress = 0;
let arrived = false;
let responseShown = false;
const keys = new Set<string>();
const reveal = (): void => {
  if (!writingDone || revealed) return;
  revealed = true;
  revealButton.hidden = true;
  status.textContent =
    "Choose a strand with A / D. W walks forward and commits to the nearest path.";
};
revealButton.addEventListener("click", reveal);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["enter", "arrowup", "arrowleft", "arrowright", " "].includes(key))
    event.preventDefault();
  if (key === "enter" || key === " ") {
    reveal();
    return;
  }
  keys.add(key);
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
    if (!revealed) return;
    if (key === "a") selected = Math.max(0, selected - 1);
    if (key === "d") selected = Math.min(2, selected + 1);
  });
});

const resize = (): void => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);
resize();
camera.position.set(0, 3.25, 12);
camera.lookAt(0, 1.6, -7);
let previous = performance.now();
const frame = (now: number): void => {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  if (!writingDone && terminalFrames.length) {
    const writingAt = writingStart + (now - writingOrigin) * 1.5;
    while (
      writingIndex < terminalFrames.length - 1 &&
      terminalFrames[writingIndex + 1].at <= writingAt
    )
      writingIndex++;
    drawTerminal(terminalFrames[writingIndex].question);
    if (writingAt >= writingEnd) {
      writingDone = true;
      revealButton.hidden = false;
      status.textContent =
        "Omega has finished the question. Reveal the Dreamweaver questions.";
    }
  }
  const lateral =
    Number(keys.has("d") || keys.has("arrowright")) -
    Number(keys.has("a") || keys.has("arrowleft"));
  if (revealed && !committed) {
    player.position.x = Math.max(
      -3.5,
      Math.min(3.5, player.position.x + lateral * dt * 3.2)
    );
    selected = player.position.x < -1.1 ? 0 : player.position.x > 1.1 ? 2 : 1;
    if (keys.has("w") || keys.has("arrowup")) {
      committed = true;
      progress = 0;
      status.textContent = `Following ${question.choices[selected].owner}'s question toward the threshold.`;
    }
  }
  if (committed && !arrived && (keys.has("w") || keys.has("arrowup"))) {
    progress = Math.min(1, progress + dt * 0.115);
    player.position.copy(strands[selected].pointAt(progress));
    if (progress >= 1) {
      arrived = true;
      responseShown = true;
      status.textContent = question.choices[selected].response
        .split("\n\n")[0]
        .split("\n")
        .slice(1)
        .join("\n");
    }
  }
  const terminalTarget = revealed
    ? new Vector3(0, 6.1, -13)
    : new Vector3(0, 3.3, -2.5);
  terminal.position.lerp(terminalTarget, 1 - Math.exp(-dt * 1.25));
  terminal.scale.setScalar(
    terminal.scale.x +
      ((revealed ? 0.55 : 1) - terminal.scale.x) * (1 - Math.exp(-dt * 1.25))
  );
  terminal.rotation.y = Math.sin(now * 0.00035) * 0.018;
  terminalBack.material.opacity = revealed ? 0.25 : 0.96;
  terminalScreen.material.opacity = revealed ? 0.27 : 1;
  strands.forEach((strand, index) => {
    strand.material.uniforms.uTime.value = now * 0.001;
    strand.material.uniforms.uSelected.value = index === selected ? 1 : 0;
    strand.material.uniforms.uReveal.value +=
      ((revealed ? 1 : 0) - strand.material.uniforms.uReveal.value) *
      (1 - Math.exp(-dt * 2.6));
    strand.label.material.opacity = revealed
      ? index === selected
        ? 0.92
        : 0.5
      : 0;
    strand.pieces.forEach((piece) => {
      piece.visible = revealed;
    });
  });
  player.rotation.y += dt * (committed && !arrived ? 0.22 : 0.08);
  if (!responseShown) {
    const desiredX = arrived
      ? strands[selected].end.x
      : player.position.x * 0.48;
    camera.position.x +=
      (desiredX - camera.position.x) * (1 - Math.exp(-dt * 2.5));
    camera.position.z +=
      (player.position.z + 8.4 - camera.position.z) * (1 - Math.exp(-dt * 2.5));
    camera.lookAt(player.position.x * 0.35, 1.25, player.position.z - 5.5);
  } else {
    camera.position.lerp(
      new Vector3(
        strands[selected].end.x + 1.2,
        2.8,
        strands[selected].end.z + 6
      ),
      1 - Math.exp(-dt * 2)
    );
    camera.lookAt(strands[selected].end.x, 0.3, strands[selected].end.z - 1);
  }
  renderer.render(scene, camera);
  Reflect.set(window, "__STRAND_SHADER_STUDY__", {
    revealed,
    selectedChoice: question.choices[selected].owner,
    committed,
    arrived,
    progress,
    player: { x: player.position.x, z: player.position.z },
  });
};
requestAnimationFrame(frame);

// Throwaway visual prototype: manuscript / fragments / passage. No game progression.
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GhostLetters, type Era, type Layout } from "./GhostLetters";
import { WritingPlayback } from "./WritingPlayback";
import {
  PROFILES,
  SPEAKERS,
  type SpeakerId,
  type SpeakerProfile,
} from "./profiles";
import "./study.css";

const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const layouts: Layout[] = ["manuscript", "fragments", "passage"];
const layoutNames = [
  "Spatial manuscript",
  "Floating fragments",
  "Into the passage",
];
const layoutDescriptions = [
  "One voice at reading distance. Watch its certainty change.",
  "Four voices suspended apart. Select one to listen to its rhythm.",
  "Writing becomes a route. Each voice gives the words a different direction.",
];
const params = new URLSearchParams(location.search);
let layout: Layout =
  layouts.find((x) => x === params.get("variant")) ?? "manuscript";
let selected: SpeakerId =
  SPEAKERS.find((x) => x === params.get("speaker")) ?? "omega";
let era: Era = "phosphor";
let paused = false,
  common = false,
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let age = 0,
  last = performance.now(),
  notified = "",
  answerRecord = "";
const settings: Record<SpeakerId, SpeakerProfile> = structuredClone(PROFILES);
// Labels belong to study chrome rather than cluttering every rendered sample.
for (const p of Object.values(settings))
  p.sample = p.sample.replace("NONCANONICAL · ", "");
const cleanSamples = Object.fromEntries(
  SPEAKERS.map((id) => [id, settings[id].sample])
) as Record<SpeakerId, string>;
const commonSample = "The signal is still here.\nFollow the words.";
const scene = new Scene();
scene.background = new Color("#030507");
const camera = new PerspectiveCamera(42, 1, 0.1, 120);
camera.position.set(0, 1, 17);
const renderer = new WebGLRenderer({
  canvas: el<HTMLCanvasElement>("ghost-stage"),
  antialias: true,
  alpha: false,
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
const world = new Group();
scene.add(world);
const letters = Object.fromEntries(
  SPEAKERS.map((id) => [id, new GhostLetters(id, settings[id].color)])
) as Record<SpeakerId, GhostLetters>;
const ghosts = Object.fromEntries(
  SPEAKERS.map((id) => [id, new GhostLetters(id, settings[id].color)])
) as Record<SpeakerId, GhostLetters>;
const playbacks = Object.fromEntries(
  SPEAKERS.map((id) => [id, new WritingPlayback()])
) as Record<SpeakerId, WritingPlayback>;
for (const id of SPEAKERS) {
  world.add(letters[id].root, ghosts[id].root);
  ghosts[id].opacity = 0.14;
}
const stageMarks = new Group();
world.add(stageMarks);
const linesMaterial = new LineBasicMaterial({
  color: "#8599a7",
  transparent: true,
  opacity: 0.13,
});
const frameGeometry = new BufferGeometry().setFromPoints([
  new Vector3(-4.55, 1.12, 0),
  new Vector3(4.55, 1.12, 0),
  new Vector3(4.55, -1.3, 0),
  new Vector3(-4.55, -1.3, 0),
  new Vector3(-4.55, 1.12, 0),
]);
const terminal = new Group();
terminal.add(new Line(frameGeometry, linesMaterial));
const glassGeometry = new PlaneGeometry(9.1, 2.42),
  glassMaterial = new MeshBasicMaterial({
    color: "#355849",
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
  });
const glass = new Mesh(glassGeometry, glassMaterial);
glass.position.set(0, -0.09, -0.05);
terminal.add(glass);
world.add(terminal);
const depthGeometry = new BufferGeometry();
const grid: number[] = [];
for (let x = -12; x <= 12; x += 4) grid.push(x, -3, 6, x, -3, -36);
for (let z = 6; z >= -36; z -= 6) grid.push(-12, -3, z, 12, -3, z);
depthGeometry.setAttribute("position", new Float32BufferAttribute(grid, 3));
const depthLines = new LineSegments(
  depthGeometry,
  new LineBasicMaterial({ color: "#617581", transparent: true, opacity: 0.055 })
);
world.add(depthLines);
const targetGeometry = new BufferGeometry().setFromPoints([
  new Vector3(-0.15, 0, 0),
  new Vector3(0.15, 0, 0),
  new Vector3(0, 0, 0),
  new Vector3(0, 0.15, 0),
  new Vector3(0, -0.15, 0),
]);
const target = new Line(
  targetGeometry,
  new LineBasicMaterial({ color: "#f18787", transparent: true, opacity: 0.38 })
);
target.position.set(3.3, -0.6, 3.2);
world.add(target);

function textFor(id: SpeakerId) {
  return common ? commonSample : settings[id].sample;
}
function updateUrl() {
  const p = new URLSearchParams(location.search);
  p.set("variant", layout);
  p.set("speaker", selected);
  history.replaceState(null, "", `${location.pathname}?${p}`);
}
function restart() {
  for (const id of SPEAKERS) {
    playbacks[id].restart(settings[id], textFor(id));
    letters[id].setText("");
    ghosts[id].setText("");
    ghosts[id].opacity = 0.14;
  }
  age = 0;
  notified = "";
  el("accessible-line").textContent = "";
  answerRecord = "";
  el("answer-record").textContent = "";
  el<HTMLButtonElement>("answer").disabled = true;
  paused = false;
  el("pause").textContent = "Pause";
  el("pause").setAttribute("aria-pressed", "false");
}
function compose() {
  const positions: Record<SpeakerId, [number, number, number]> = {
    omega: [0, 2.9, -4],
    light: [-2.7, 0.6, -1],
    shadow: [2.9, -0.2, -3],
    ambition: [0.6, -1.9, 1],
  };
  for (const id of SPEAKERS) {
    const l = letters[id],
      g = ghosts[id];
    const active = id === selected;
    l.root.visible = layout === "fragments" || active;
    g.root.visible = l.root.visible;
    l.opacity = active ? 1 : 0.55;
    if (layout === "fragments") {
      l.root.position.set(...positions[id]);
      l.root.scale.setScalar(active ? 0.68 : 0.58);
    } else {
      l.root.position.set(
        0,
        layout === "passage" ? 1 : 0.8,
        layout === "passage" ? -1 : 0
      );
      l.root.scale.setScalar(1);
    }
    g.root.position.copy(l.root.position).add(new Vector3(0, 0.2, -0.35));
    g.root.scale.copy(l.root.scale);
  }
  terminal.visible = selected === "omega" || layout === "fragments";
  terminal.position.copy(letters.omega.root.position);
  terminal.scale.copy(letters.omega.root.scale);
  target.visible = selected === "ambition";
  depthLines.visible = layout === "passage";
  document.documentElement.style.setProperty(
    "--voice",
    settings[selected].color
  );
  el("voice-label").textContent = PROFILES[selected].label.toUpperCase();
  el("description").textContent = layoutDescriptions[layouts.indexOf(layout)];
  el("variant-number").textContent =
    `${layouts.indexOf(layout) + 1} / 3 · LAYOUT`;
  el("variant-name").textContent = layoutNames[layouts.indexOf(layout)];
  el("voice-note").textContent = settings[selected].note;
  el<HTMLSelectElement>("era").disabled = selected !== "omega";
  el("answer").hidden = selected !== "omega" || common;
  for (const b of el("speakers").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.speaker === selected));
  updateUrl();
  resize();
}
function choose(id: SpeakerId) {
  selected = id;
  compose();
  makeSliders();
  restart();
}
for (const id of SPEAKERS) {
  const b = document.createElement("button");
  b.textContent = PROFILES[id].label;
  b.dataset.speaker = id;
  b.onclick = () => choose(id);
  el("speakers").append(b);
}
type NumericKey =
  | "intervalMs"
  | "startDelayMs"
  | "jitter"
  | "mistakeFrequency"
  | "correctionDelayMs"
  | "revisionDelayMs";
const controls: [NumericKey, string, number, number, number][] = [
  ["intervalMs", "Character interval", 15, 200, 5],
  ["startDelayMs", "Delay offset", 0, 2000, 50],
  ["jitter", "Timing variation", 0, 1, 0.05],
  ["mistakeFrequency", "Mistake frequency", 0, 0.35, 0.01],
  ["correctionDelayMs", "Correction delay", 50, 1500, 50],
  ["revisionDelayMs", "Late revision delay", 0, 3000, 100],
];
function makeSliders() {
  el("sliders").replaceChildren();
  for (const [key, label, min, max, step] of controls) {
    const row = document.createElement("label"),
      out = document.createElement("output"),
      input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(settings[selected][key]);
    input.setAttribute("aria-label", label);
    const valueLabel = () =>
      key.endsWith("Ms")
        ? `${input.value} ms`
        : `${Math.round(Number(input.value) * 100)}%`;
    out.textContent = valueLabel();
    row.append(label, out, input);
    el("sliders").append(row);
    input.oninput = () => {
      settings[selected][key] = Number(input.value);
      out.textContent = valueLabel();
    };
    input.onchange = restart;
  }
}
function changeLayout(delta: number) {
  layout =
    layouts[
      (layouts.indexOf(layout) + delta + layouts.length) % layouts.length
    ];
  compose();
  restart();
}
el("previous").onclick = () => changeLayout(-1);
el("next").onclick = () => changeLayout(1);
el("tune").onclick = () => {
  const panel = el("settings");
  panel.hidden = !panel.hidden;
  el("tune").setAttribute("aria-expanded", String(!panel.hidden));
};
el("replay").onclick = restart;
el("pause").onclick = () => {
  paused = !paused;
  el("pause").textContent = paused ? "Resume" : "Pause";
  el("pause").setAttribute("aria-pressed", String(paused));
};
el("reset").onclick = () => {
  settings[selected] = structuredClone(PROFILES[selected]);
  settings[selected].sample = cleanSamples[selected];
  makeSliders();
  restart();
};
el<HTMLSelectElement>("era").onchange = (e) => {
  era = (e.target as HTMLSelectElement).value as Era;
  letters.omega.setEra(era);
  ghosts.omega.setEra(era);
  glassMaterial.opacity = era === "gui" ? 0.18 : 0.075;
  restart();
};
el<HTMLInputElement>("motion").checked = reduced;
el<HTMLInputElement>("motion").onchange = (e) => {
  reduced = (e.target as HTMLInputElement).checked;
};
el<HTMLInputElement>("common").onchange = (e) => {
  common = (e.target as HTMLInputElement).checked;
  compose();
  restart();
};
el("answer").onclick = () => {
  answerRecord = `Answered version: “${textFor("omega").replaceAll("\n", " ")}”`;
  el("answer-record").textContent = answerRecord;
  playbacks.omega.revise(settings.omega);
  el<HTMLButtonElement>("answer").disabled = true;
};
function keydown(e: KeyboardEvent) {
  if (
    (e.target as HTMLElement).closest("input,textarea,select,[contenteditable]")
  )
    return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    changeLayout(e.key === "ArrowLeft" ? -1 : 1);
  }
  if (e.key === "Escape") {
    el("settings").hidden = true;
    el("tune").setAttribute("aria-expanded", "false");
  }
}
document.addEventListener("keydown", keydown);
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.position.z = innerWidth < 720 ? 29 : 17;
  camera.fov = innerWidth < 720 ? 48 : 42;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
let pointerX = 0,
  pointerY = 0;
function pointer(e: PointerEvent) {
  pointerX = (e.clientX / innerWidth - 0.5) * 0.45;
  pointerY = (e.clientY / innerHeight - 0.5) * 0.25;
}
addEventListener("pointermove", pointer);
function render(now: number) {
  const dt = Math.min(now - last, 80);
  last = now;
  if (!paused) age += dt;
  for (const id of SPEAKERS) {
    const frame = playbacks[id].advance(paused ? 0 : dt);
    if (id !== "omega" && frame.phase === "Complete" && !common)
      playbacks[id].revise(settings[id]);
    letters[id].setText(
      frame.text + (frame.done || Math.floor(age / 500) % 2 ? "" : "_")
    );
    ghosts[id].setText(frame.oldText);
    if (frame.phase === "Revised" && !paused)
      ghosts[id].opacity = Math.max(0, ghosts[id].opacity - dt * 0.000055);
    letters[id].update(age / 1000, layout, reduced);
    ghosts[id].update(age / 1000, layout, true);
    if (id === selected) {
      const state = `${paused ? "Paused · " : ""}${frame.phase} · ${era} · ${layout} · ${settings[id].intervalMs} ms`;
      if (el("status").textContent !== state) el("status").textContent = state;
      el<HTMLButtonElement>("answer").disabled = !(
        id === "omega" &&
        frame.phase === "Complete" &&
        !answerRecord
      );
      if (frame.done && notified !== frame.text) {
        notified = frame.text;
        el("accessible-line").textContent = frame.text;
        window.dispatchEvent(
          new CustomEvent("ghost-study:line-complete", {
            detail: { speaker: id, text: frame.text, phase: frame.phase },
          })
        );
      }
    }
  }
  camera.position.x += ((reduced ? 0 : pointerX) - camera.position.x) * 0.04;
  camera.position.y +=
    ((reduced ? 1 : 1 + pointerY) - camera.position.y) * 0.04;
  camera.lookAt(0, 0.35, 0);
  renderer.render(scene, camera);
}
el("status").textContent = "Ready";
makeSliders();
compose();
restart();
if (!import.meta.env.DEV) el("previous").parentElement!.hidden = true;
renderer.setAnimationLoop(render);
function dispose() {
  renderer.setAnimationLoop(null);
  removeEventListener("resize", resize);
  removeEventListener("pointermove", pointer);
  document.removeEventListener("keydown", keydown);
  for (const id of SPEAKERS) {
    letters[id].dispose();
    ghosts[id].dispose();
  }
  frameGeometry.dispose();
  glassGeometry.dispose();
  glassMaterial.dispose();
  depthGeometry.dispose();
  (depthLines.material as LineBasicMaterial).dispose();
  targetGeometry.dispose();
  (target.material as LineBasicMaterial).dispose();
  linesMaterial.dispose();
  renderer.dispose();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);

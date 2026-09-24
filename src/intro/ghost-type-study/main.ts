// Omega Dialogue Studio: manuscript / fragments / passage. No game progression.
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
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GhostLetters, type Layout } from "./GhostLetters";
import {
  SCENES,
  type Era,
  type TypographyScene,
} from "../../core/sceneTypography";
import {
  TRADITIONS,
  isBuilt,
  resolveTradition,
} from "../../core/lettering/traditions";
import { WritingPlayback } from "./WritingPlayback";
import { createDialogueEditor } from "./DialogueEditor";
import type {
  DialogueDocument,
  DialoguePresentation,
  WritingSettings,
} from "./DialogueTimeline";
import { createScriptEditor } from "./script-view";
import { parseOml } from "../../core/oml";
import {
  PROFILES,
  SPEAKERS,
  SCRIPT_TEXT,
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
const sceneProfiles = structuredClone(SCENES);
let sceneId: TypographyScene =
  (Object.keys(SCENES) as TypographyScene[]).find(
    (id) => id === params.get("scene")
  ) ?? "opening";
let era: Era = resolveTradition(
  params.get("era") ?? sceneProfiles[sceneId].era
).id;
let selectedFileEra: string | null = null;
sceneProfiles[sceneId].era = era;
let paused = false,
  common = false,
  honorCasing = true,
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
let scriptMode = false;
let scriptText = "";
let restoringPresentation = false;
let tab: "stage" | "script" = "stage";
let scriptDoc: DialogueDocument | null = null;
let scriptEditor: {
  setText(text: string): void;
  getText(): string;
  focus(): void;
} | null = null;
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
// Native three bloom — no extra dependency. Threshold is high so only glyph cores glow.
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.5, 0.65, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());
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

/** Historical casing is a display choice; authored text in saved files is untouched. */
function cased(text: string) {
  const t = resolveTradition(era);
  return honorCasing && t.casePolicy === "upper" ? text.toUpperCase() : text;
}
function textFor(id: SpeakerId) {
  if (scriptMode && id === selected) return cased(scriptText);
  return cased(common ? commonSample : settings[id].sample);
}
// Wrap only the displayed text; the authored file retains its original line breaks.
// `columns` is historical metadata for the inspector — the panel is what constrains the wrap.
function displayedText(text: string) {
  const columns = Math.max(
    12,
    Math.floor(9.1 / resolveTradition(era).tracking)
  );
  return text
    .split("\n")
    .flatMap((line) => {
      const rows: string[] = [];
      while (line.length > columns) {
        const space = line.lastIndexOf(" ", columns);
        const cut = space > 0 ? space : columns;
        rows.push(line.slice(0, cut));
        line = line.slice(cut + (space > 0 ? 1 : 0));
      }
      return [...rows, line];
    })
    .join("\n");
}
function updateUrl() {
  const p = new URLSearchParams(location.search);
  p.set("variant", layout);
  p.set("speaker", selected);
  p.set("scene", sceneId);
  p.set("era", era);
  history.replaceState(null, "", `${location.pathname}?${p}`);
}
function restart() {
  for (const id of SPEAKERS) {
    playbacks[id].restart(
      settings[id],
      scriptMode ? displayedText(textFor(id)) : textFor(id)
    );
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
    l.root.visible = scriptMode ? active : layout === "fragments" || active;
    g.root.visible = l.root.visible;
    l.opacity = active ? 1 : 0.55;
    if (layout === "fragments" && !scriptMode) {
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
  el("description").textContent = scriptMode
    ? "Recorded opening · authored text from your Godot dialogue"
    : layoutDescriptions[layouts.indexOf(layout)];
  el("variant-number").textContent =
    `${layouts.indexOf(layout) + 1} / 3 · LAYOUT`;
  el("variant-name").textContent = layoutNames[layouts.indexOf(layout)];
  el("voice-note").textContent = settings[selected].note;
  el("answer").hidden = scriptMode || selected !== "omega" || common;
  document.body.classList.toggle("script-mode", scriptMode);
  el("replay").textContent = scriptMode ? "Replay opening" : "Replay writing";
  document.querySelector(".study-label")!.textContent = scriptMode
    ? "OPENING BLOCK · GODOT ADAPTATION"
    : "STUDIO · SAMPLE COPY, NOT GAME DIALOGUE";
  for (const b of el("speakers").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.speaker === selected));
  updateUrl();
  resize();
}
function choose(id: SpeakerId) {
  scriptMode = false;
  dialogue.deactivate();
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
  ["revisionDelayMs", "Late revision delay", 0, 3000, 50],
];
function makeSliders() {
  el("sliders").replaceChildren();
  const profile = settings[selected];

  const colourRow = document.createElement("label");
  const colourOut = document.createElement("output");
  const colour = document.createElement("input");
  colour.type = "color";
  colour.value = profile.color;
  colour.setAttribute("aria-label", "Identity colour");
  colourOut.textContent = profile.color;
  colourRow.append("Identity colour", colourOut, colour);
  el("sliders").append(colourRow);
  colour.oninput = () => {
    profile.color = colour.value;
    colourOut.textContent = colour.value;
    applyVoiceColour(selected);
  };
  colour.onchange = () => {};

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
    input.onchange = () => {
      savePresentation();
      restart();
    };
  }
}
function applyVoiceColour(id: SpeakerId) {
  letters[id].setColor(settings[id].color);
  ghosts[id].setColor(settings[id].color);
  if (id === selected) {
    document.documentElement.style.setProperty("--voice", settings[id].color);
    el("voice-label").textContent = settings[id].label.toUpperCase();
  }
}

function changeLayout(delta: number) {
  layout =
    layouts[
      (layouts.indexOf(layout) + delta + layouts.length) % layouts.length
    ];
  compose();
  savePresentation();
  restart();
}
el("previous").onclick = () => changeLayout(-1);
el("next").onclick = () => changeLayout(1);
el("tune").onclick = () => {
  const panel = el("settings");
  panel.hidden = !panel.hidden;
  el("tune").setAttribute("aria-expanded", String(!panel.hidden));
};
el("replay").onclick = () => (scriptMode ? dialogue.start() : restart());
el("pause").onclick = () => {
  paused = !paused;
  el("pause").textContent = paused ? "Resume" : "Pause";
  el("pause").setAttribute("aria-pressed", String(paused));
};
el("reset").onclick = () => {
  settings[selected] = structuredClone(PROFILES[selected]);
  settings[selected].sample = cleanSamples[selected];
  savePresentation();
  makeSliders();
  restart();
};
for (const [id, profile] of Object.entries(SCENES)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = `${profile.label} · ${PROFILES[profile.owner].label}`;
  el("scene-owner").append(option);
}
// All 18 traditions are listed; unbuilt render paths are disabled, never hidden.
function letteringOptions() {
  const fragment = document.createDocumentFragment();
  for (const built of [true, false]) {
    const group = document.createElement("optgroup");
    group.label = built ? "Reconstruction ladder" : "Render path pending";
    for (const tr of TRADITIONS.filter((x) => isBuilt(x) === built)) {
      const option = document.createElement("option");
      option.value = tr.id;
      option.textContent = `${tr.introduced} · ${tr.label}`;
      option.title = `${tr.designIntent} ${tr.sources[0] ?? ""}`;
      option.disabled = !built;
      group.append(option);
    }
    fragment.append(group);
  }
  return fragment;
}
el("era").append(letteringOptions());
function applySceneTypography() {
  const tr = resolveTradition(era);
  era = tr.id;
  for (const id of SPEAKERS) {
    letters[id].setEra(tr.id);
    ghosts[id].setEra(tr.id);
  }
  const flat =
    tr.renderMethod === "bitmap-gui" ||
    tr.renderMethod === "outline" ||
    tr.renderMethod === "subpixel";
  glassMaterial.opacity = flat ? 0.03 : 0.075;
  sceneProfiles[sceneId].era = tr.id;
  el<HTMLSelectElement>("scene-owner").value = sceneId;
  el<HTMLSelectElement>("era").value = tr.id;
  el("era-description").textContent =
    `Selected display method: ${tr.renderMethod} · ${isBuilt(tr) ? "built preview" : "render path pending"}. ${tr.designIntent} ${tr.recognizableTrait} — ${tr.introduced}, ${tr.commonUse}; ${tr.confidence} confidence.`;
  el("era").title =
    `${tr.device}. ${tr.spatialAdaptation} ${tr.sources[0] ?? ""}`;
  document.documentElement.dataset.sceneOwner = sceneProfiles[sceneId].owner;
  document.documentElement.dataset.textEra = tr.id;
  updateUrl();
  window.dispatchEvent(
    new CustomEvent("ghost-study:scene-typography-changed", {
      detail: { scene: sceneId, owner: sceneProfiles[sceneId].owner, era },
    })
  );
}
el<HTMLSelectElement>("era").onchange = (e) => {
  era = (e.target as HTMLSelectElement).value as Era;
  selectedFileEra = era;
  for (const id of SPEAKERS) settings[id].era = era;
  applySceneTypography();
  savePresentation();
};
el<HTMLSelectElement>("scene-owner").onchange = (e) => {
  sceneId = (e.target as HTMLSelectElement).value as TypographyScene;
  era = sceneProfiles[sceneId].era;
  applySceneTypography();
  savePresentation();
  if (!scriptMode) choose(sceneProfiles[sceneId].owner);
};
el<HTMLInputElement>("motion").checked = reduced;
el<HTMLInputElement>("motion").onchange = (e) => {
  reduced = (e.target as HTMLInputElement).checked;
};
el<HTMLInputElement>("casing").checked = honorCasing;
el<HTMLInputElement>("casing").onchange = (e) => {
  honorCasing = (e.target as HTMLInputElement).checked;
  restart();
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
  composer.setSize(innerWidth, innerHeight);
  const inset = scriptMode && innerWidth >= 1000 ? 340 : 0;
  renderer.setViewport(inset, 0, innerWidth - inset, innerHeight);
  camera.aspect = (innerWidth - inset) / innerHeight;
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
    if (scriptMode && id !== selected) continue;
    const frame = playbacks[id].advance(paused ? 0 : dt);
    if (!scriptMode && id !== "omega" && frame.phase === "Complete" && !common)
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
      const state = `${paused ? "Paused · " : ""}${frame.phase} · ${SCENES[sceneId].label} / ${PROFILES[SCENES[sceneId].owner].label} · ${era} · ${settings[id].intervalMs} ms`;
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
  if (scriptMode && !paused)
    dialogue.tick(dt, playbacks[selected].advance(0).done);
  camera.position.x += ((reduced ? 0 : pointerX) - camera.position.x) * 0.04;
  camera.position.y +=
    ((reduced ? 1 : 1 + pointerY) - camera.position.y) * 0.04;
  camera.lookAt(0, 0.35, 0);
  composer.render();
}
el("status").textContent = "Ready";
function presentation(): DialoguePresentation {
  const voices: DialoguePresentation["voices"] = {};
  for (const id of SPEAKERS) {
    const voice = {} as WritingSettings;
    for (const [key] of controls) voice[key] = settings[id][key];
    voices[id] = voice;
  }
  return { scene: sceneId, era, layout, voices };
}
function savePresentation() {
  if (scriptMode && !restoringPresentation)
    dialogue.setPresentation(presentation());
}
const dialogue = createDialogueEditor({
  presentation,
  restore(value) {
    restoringPresentation = true;
    sceneId = value.scene;
    era = selectedFileEra ?? value.era;
    layout = value.layout;
    for (const id of SPEAKERS)
      for (const [key] of controls)
        settings[id][key] = value.voices[id]?.[key] ?? PROFILES[id][key];
    applySceneTypography();
    compose();
    makeSliders();
    restoringPresentation = false;
  },
  supports: (speaker) => SPEAKERS.includes(speaker as SpeakerId),
  line(speaker, text) {
    scriptMode = true;
    selected = speaker as SpeakerId;
    scriptText = text;
    common = false;
    el<HTMLInputElement>("common").checked = false;
    compose();
    makeSliders();
    restart();
  },
  samples() {
    choose(selected);
  },
  resume() {
    scriptMode = true;
    paused = false;
    el("pause").textContent = "Pause";
    el("pause").setAttribute("aria-pressed", "false");
    compose();
  },
  pause() {
    paused = true;
    el("pause").textContent = "Resume";
    el("pause").setAttribute("aria-pressed", "true");
  },
  script(doc) {
    scriptDoc = doc;
  },
});
let currentFile = "scene1.oml";
const validFile = (name: string) =>
  /^[a-z0-9][a-z0-9_-]*\.(oml|omd|oms)$/i.test(name);
const fileState = el("scene-state");
function setFileState(state: "info" | "pending" | "success" | "error", message: string) {
  fileState.dataset.state = state;
  fileState.textContent = message;
}
scriptEditor = createScriptEditor(el("script-lines"), (text) => {
  if (currentFile.toLowerCase().endsWith(".oml")) dialogue.loadText(text);
  setFileState("pending", `Unsaved changes in ${currentFile}. Save to project when ready.`);
});
scriptEditor.setText(SCRIPT_TEXT);
dialogue.loadText(SCRIPT_TEXT);

// The studio writes files locally; the game imports the files, not the studio.
let fileLoadRequest = 0;
function showFile(name: string, text: string) {
  currentFile = name;
  scriptEditor?.setText(text);
  if (name.toLowerCase().endsWith(".oml")) {
    const parsed = parseOml(text);
    dialogue.loadText(text);
    selectedFileEra = resolveTradition(
      parsed.scene.era ?? SCENES[sceneId].era
    ).id;
    era = selectedFileEra;
    applySceneTypography();
  }
  const picker = el<HTMLSelectElement>("scene-pick");
  if (!Array.from(picker.options).some((option) => option.value === name)) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    picker.add(option);
  }
  picker.value = name;
}
async function loadFile(name: string) {
  const request = ++fileLoadRequest;
  if (!validFile(name)) {
    setFileState("error", "Choose an .oml, .omd, or .oms file.");
    return;
  }
  setFileState("info", `Opening ${name}…`);
  try {
    const response = await fetch(`/api/studio/files?name=${encodeURIComponent(name)}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not open file.");
    if (request !== fileLoadRequest) return;
    showFile(name, String(body.text));
    setFileState("info", `Editing ${name}. Import opens a local file; Save writes it to the project.`);
  } catch (error) {
    if (request !== fileLoadRequest) return;
    setFileState("error", `Could not open ${name}: ${(error as Error).message}`);
  }
}
async function listFiles(preferred = currentFile) {
  try {
    const response = await fetch("/api/studio/files");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not list files.");
    const files: string[] = body.files ?? [];
    el<HTMLSelectElement>("scene-pick").replaceChildren(...files.map((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      return option;
    }));
    const picker = el<HTMLSelectElement>("scene-pick");
    picker.value = files.includes(preferred) ? preferred : files[0] ?? "";
    picker.onchange = () => void loadFile(picker.value);
    if (picker.value) await loadFile(picker.value);
  } catch (error) {
    setFileState("error", `Local file service unavailable: ${(error as Error).message}`);
  }
}
el<HTMLButtonElement>("scene-import").onclick = () =>
  el<HTMLInputElement>("scene-import-file").click();
el<HTMLInputElement>("scene-import-file").onchange = async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!validFile(file.name)) {
    setFileState("error", "Import an .oml, .omd, or .oms file.");
    return;
  }
  showFile(file.name, await file.text());
  setFileState("pending", `Imported ${file.name} into the editor. Review it, then Save to project.`);
  input.value = "";
};
el<HTMLButtonElement>("scene-export").onclick = () => {
  const text = scriptEditor?.getText() ?? "";
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = currentFile;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setFileState("success", `Downloaded a copy of ${currentFile}. The project file is unchanged.`);
};
el<HTMLButtonElement>("scene-save").onclick = async () => {
  setFileState("info", `Saving ${currentFile} to the project…`);
  try {
    const response = await fetch("/api/studio/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: currentFile,
        text: scriptEditor?.getText(),
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Save failed.");
    await listFiles(body.name);
    setFileState("success", `Saved ${body.name} to the project. The game reads this file directly.`);
  } catch (error) {
    setFileState("error", `Could not save ${currentFile}: ${(error as Error).message}`);
  }
};
listFiles();
function applyTab() {
  document.body.dataset.tab = tab;
  el("script-view").hidden = tab !== "script";
  el("tab-stage").setAttribute("aria-pressed", String(tab === "stage"));
  el("tab-script").setAttribute("aria-pressed", String(tab === "script"));
  if (tab === "script") {
    scriptEditor?.focus();
  }
}
for (const button of document.querySelectorAll<HTMLButtonElement>(
  ".tabs button"
))
  button.onclick = () => {
    tab = button.dataset.tab === "script" ? "script" : "stage";
    applyTab();
  };
const openingButton = document.createElement("button");
openingButton.textContent = "Opening script";
openingButton.onclick = () => dialogue.start();
el("speakers").append(openingButton);
makeSliders();
applySceneTypography();
compose();
restart();
tab = params.get("tab") === "script" ? "script" : "stage";
applyTab();
if (params.get("mode") !== "samples") {
  era = params.get("scene") === "opening" ? era : "dos";
  sceneId = "opening";
  applySceneTypography();
  dialogue.start();
} else dialogue.deactivate();
// These controls are the studio's authoring UI, including in its standalone build.
renderer.setAnimationLoop(render);
function dispose() {
  dialogue.dispose();
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
  composer.dispose();
  renderer.dispose();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);

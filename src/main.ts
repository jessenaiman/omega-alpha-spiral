/**
 * Boot — the one place the scene is constructed and started.
 *
 * Creates the host (`src/core`), feeds it Scene 1's authored questions, starts
 * the fixed-step loop off real frames, and installs the acceptance surfaces on
 * the page so the run can be inspected without a mock. Presentation here stays
 * minimal: the loop contract's first playable state is the ghost terminal
 * asking its question, not decided art.
 */

import * as THREE from "three";
import { createSceneHost, type HostFrame, type SceneHost } from "./core";
import {
  GHOST_QUESTIONS,
  getDreamweaverQuestion,
} from "./dialogue/ghost-vite";
import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("[data-game-canvas]");
const status = document.querySelector<HTMLElement>("[data-game-status]");
const errorBox = document.querySelector<HTMLElement>("[data-game-error]");

try {
  if (!canvas || !status || !errorBox)
    throw new Error("Game shell is incomplete.");

  const host: SceneHost = createSceneHost({
    seed: "ghost-472",
    openingQuestion: GHOST_QUESTIONS[0]!.question,
    closingQuestion:
      GHOST_QUESTIONS[GHOST_QUESTIONS.length - 1]!.question,
    dreamweaverQuestions: GHOST_QUESTIONS[0]!.choices.map(
      getDreamweaverQuestion
    ),
  });

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 2;

  // The one live object: a seeded spiral marker that turns with the loop, so
  // the page visibly advances instead of rendering an empty scene.
  const seedText = String(host.state.seed);
  const seedValue = [...seedText].reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );
  const marker = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.08, 12, 64),
    new THREE.MeshBasicMaterial({ color: 0xdce9e8 })
  );
  marker.rotation.x = seedValue * 0.01;
  scene.add(marker);

  const resize = (): void => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setClearColor(0x070908, 1);
    renderer.render(scene, camera);
  };

  // The host owns the update order; presentation only draws what it reduced.
  const drawFrame = (frame: HostFrame): void => {
    marker.rotation.z += frame.paused ? 0 : 0.01 + frame.alpha * 0.001;
    const question = frame.state.question ?? "";
    status.textContent = `GHOST TERMINAL · ${frame.state.speaker.toUpperCase()} · ${question}`;
    renderer.render(scene, camera);
  };
  host.installAcceptanceSurfaces();
  host.start();
  resize();
  window.addEventListener("resize", resize);
} catch (error) {
  if (errorBox) {
    errorBox.hidden = false;
    errorBox.textContent =
      error instanceof Error ? error.message : "Omega Spiral could not start.";
  }
  throw error;
}

import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { FilamentForm } from "./FilamentForm";
import { CosmicPassage } from "./CosmicPassage";

export const FILAMENT_CYCLE = 22;
const ease = (a: number, b: number, time: number): number => {
  const t = Math.max(0, Math.min(1, (time - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function filamentPhase(time: number): {
  depth: number;
  convergence: number;
  shatter: number;
  label: string;
} {
  const t = time % FILAMENT_CYCLE;
  return {
    depth: ease(2, 6, t),
    convergence: ease(6, 10, t) * (1 - ease(20, 22, t)),
    shatter: ease(12, 14, t) * (1 - ease(15, 18, t)),
    label:
      t < 2
        ? "Line art"
        : t < 6
          ? "Acquiring depth"
          : t < 10
            ? "Converging"
            : t < 12
              ? "Lemniscate"
              : t < 15
                ? "Into the universe"
                : t < 18
                  ? "Reforming"
                  : t < 20
                    ? "Remembered shape"
                    : "Returning to strands",
  };
}

/** Dedicated canvas only for menu/art review. Gameplay reuses FilamentForm in its renderer. */
export function mountFilamentView(
  host: HTMLElement,
  onFrame?: (time: number, label: string) => void
) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 60);
  const form = new FilamentForm(undefined, 32);
  const passage = new CosmicPassage();
  scene.add(form.root, passage.root);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let time = reducedMotion.matches ? 11 : 0;
  let playing = !reducedMotion.matches;
  let previous = performance.now();
  let frame = 0;
  let entry = -1;
  let entryStart = 0;
  const resize = new ResizeObserver(() => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.z = Math.max(
      7.8,
      4.3 / camera.aspect / Math.tan((19 * Math.PI) / 180)
    );
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  const loop = (now: number): void => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!document.hidden) {
      if (playing && entry < 0) time = (time + delta) % FILAMENT_CYCLE;
      const phase = filamentPhase(time);
      if (entry >= 0) {
        entry = Math.min(1, entry + delta / 2.2);
        phase.convergence =
          entryStart + (1 - entryStart) * ease(0, 0.35, entry);
        phase.depth = 1;
        phase.shatter = reducedMotion.matches ? 0 : ease(0.25, 1, entry);
      }
      form.update(time, phase.depth, phase.convergence, phase.shatter);
      passage.update(playing || entry >= 0 ? delta : 0, phase.shatter);
      form.root.rotation.y = reducedMotion.matches
        ? 0
        : Math.sin(time * 0.23) * 0.17 * phase.depth;
      renderer.render(scene, camera);
      onFrame?.(time, phase.label);
    }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  return {
    seek(value: number): void {
      time = Math.max(0, Math.min(FILAMENT_CYCLE - 0.001, value));
    },
    setPlaying(value: boolean): void {
      playing = value;
    },
    get playing(): boolean {
      return playing;
    },
    enter(): void {
      entryStart = filamentPhase(time).convergence;
      entry = 0;
    },
    dispose(): void {
      cancelAnimationFrame(frame);
      resize.disconnect();
      form.dispose();
      passage.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

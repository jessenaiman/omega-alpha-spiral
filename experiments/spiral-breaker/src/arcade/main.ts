/**
 * Spiral Breaker — the entry point.
 *
 * Wires the host to the presentation: one render context, one camera rig, the
 * arena, the actors, the effects, the HUD, and the sound. A separate page from
 * the Ghost Terminal scene, so neither boot path can break the other.
 */

import "./styles.css";
import { createArcadeHost } from "./host";
import { createArenaCamera } from "./present/camera";
import { createActors } from "./present/actors";
import { createArena } from "./present/arena";
import { createFeel } from "./present/feel";
import { createArcadeRenderContext } from "./present/renderer";
import { createVfx } from "./present/vfx";
import { createHud } from "./ui/hud";
import { createSfx } from "./audio/sfx";

const canvas = document.querySelector<HTMLCanvasElement>("[data-game-canvas]");
const hudRoot = document.querySelector<HTMLElement>("[data-arcade-hud]");
const errorBox = document.querySelector<HTMLElement>("[data-game-error]");
const muteButton = document.querySelector<HTMLElement>("[data-hud-mute]");

try {
  if (!canvas || !hudRoot)
    throw new Error("Spiral Breaker shell is incomplete.");

  const seedParam = new URLSearchParams(globalThis.location.search).get("seed");
  const seed = seedParam ?? "spiral-42";

  const render = createArcadeRenderContext(canvas);
  const arena = createArena();
  const actors = createActors();
  const vfx = createVfx();
  const feel = createFeel();
  const cameraRig = createArenaCamera(render.camera);
  const hud = createHud(hudRoot);
  const sfx = createSfx();

  render.scene.add(arena.group);
  render.scene.add(actors.group);
  render.scene.add(vfx.group);

  let elapsedSec = 0;
  let frame = 0;

  const host = createArcadeHost({
    seed,
    inputTarget: globalThis,
    reducedMotion: undefined,
    onStep(events, world) {
      feel.observe(events);
      vfx.handle(events, world);
      sfx.handle(events);
      actors.handle(events);
      hud.notify(events);
      hud.update(world);
    },
    onFrame({ dtMs, paused }) {
      const dtSec = paused ? 0 : dtMs / 1000;
      if (!paused) elapsedSec += dtSec;
      const reducedMotion = host.settings.value.reducedMotion;

      vfx.update(dtSec, reducedMotion);
      actors.update(host.world, elapsedSec, dtSec, reducedMotion);
      arena.update({
        timeSec: elapsedSec,
        reducedMotion,
        integrity: host.world.integrity,
        maxIntegrity: 3,
        breachFlash: vfx.breachFlash,
        healFlash: vfx.healFlash,
        chain: host.world.chain,
      });
      cameraRig.update(
        host.world,
        dtSec,
        vfx.trauma,
        vfx.fovPunch,
        reducedMotion
      );
      render.render();

      frame += 1;
      if (frame % 12 === 0) {
        host.reportRender({
          canvas: render.canvasSize(),
          renderer: render.metrics(),
        });
      }
    },
  });

  host.settings.subscribe((value) => {
    hud.setDebugHidden(value.debugHidden);
  });
  hud.setDebugHidden(host.settings.value.debugHidden);
  hud.update(host.world);

  const unlockAudio = (): void => {
    sfx.unlock();
  };
  globalThis.addEventListener("pointerdown", unlockAudio, { once: true });
  globalThis.addEventListener("keydown", unlockAudio, { once: true });

  if (muteButton) {
    muteButton.addEventListener("click", () => {
      sfx.unlock();
      hud.setMuted(sfx.setMuted(!sfx.muted));
    });
    hud.setMuted(sfx.muted);
  }

  globalThis.addEventListener("resize", () => render.resize());

  host.installAcceptanceSurfaces(
    globalThis as unknown as Parameters<
      typeof host.installAcceptanceSurfaces
    >[0]
  );

  render.resize();
  const flash = document.querySelector<HTMLElement>("[data-game-flash]");
  let last = performance.now();
  const tick = (now: number): void => {
    const delta = now - last;
    last = now;
    const dtSec = Math.min(delta, 50) / 1000;
    feel.decay(dtSec);
    sfx.setDuck(feel.duck);
    host.update(delta * feel.timeScale);
    if (flash && !host.settings.value.reducedMotion) {
      const kind = vfx.flashKind;
      flash.dataset.flash = kind ?? "";
      flash.style.opacity = kind ? String(vfx.flash) : "0";
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
} catch (error) {
  if (errorBox) {
    errorBox.hidden = false;
    errorBox.textContent =
      error instanceof Error
        ? error.message
        : "Spiral Breaker could not start.";
  }
  throw error;
}

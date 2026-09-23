/**
 * Spiral Breaker — the camera rig.
 *
 * A top-down perspective camera that leans a little toward the player and
 * takes the dash's shake and FOV punch from the effects layer. Reduced motion
 * removes both, and the lean snaps instead of easing.
 */

import * as THREE from "three";
import type { WorldState } from "../game";
import { sceneX, sceneZ } from "./scale";

export interface ArenaCamera {
  update(
    world: WorldState,
    dtSec: number,
    trauma: number,
    fovPunch: number,
    reducedMotion: boolean
  ): void;
  dispose(): void;
}

const BASE_HEIGHT = 9.4;
const BASE_Z = 2.3;
const BASE_FOV = 46;
const LEAN = 0.32;

export function createArenaCamera(
  camera: THREE.PerspectiveCamera
): ArenaCamera {
  camera.position.set(0, BASE_HEIGHT, BASE_Z);
  camera.lookAt(0, 0, 0);
  let shakeTime = 0;
  let currentFov = BASE_FOV;

  return {
    update(world, dtSec, trauma, fovPunch, reducedMotion): void {
      shakeTime += dtSec;
      const px = sceneX(world.player.pos.x);
      const pz = sceneZ(world.player.pos.y);

      const desiredX = px * LEAN;
      const desiredZ = BASE_Z + pz * LEAN;
      const ease = reducedMotion ? 1 : 1 - Math.exp(-dtSec * 5.5);
      camera.position.x += (desiredX - camera.position.x) * ease;
      camera.position.z += (desiredZ - camera.position.z) * ease;
      camera.position.y = BASE_HEIGHT;

      if (!reducedMotion && trauma > 0) {
        const amp = trauma * trauma * 0.32;
        camera.position.x += Math.sin(shakeTime * 39.0) * amp;
        camera.position.y += Math.cos(shakeTime * 47.0) * amp;
        camera.position.z += Math.sin(shakeTime * 29.0) * amp * 0.5;
      }

      camera.lookAt(px * LEAN * 1.4, 0, pz * LEAN * 1.4);

      // Roll around the view axis on heavy trauma; lookAt already set the pose,
      // so rotateZ is a pure twist and cannot fight the pitch.
      if (!reducedMotion && trauma > 0) {
        const roll = trauma * trauma * 0.03 * Math.sin(shakeTime * 41.0 + 1.7);
        camera.rotateZ(roll);
      }

      const targetFov = BASE_FOV - (reducedMotion ? 0 : fovPunch * 3.2);
      if (Math.abs(targetFov - currentFov) > 0.005) {
        currentFov = targetFov;
        camera.fov = currentFov;
        camera.updateProjectionMatrix();
      }
    },
    dispose(): void {
      // The camera has nothing to release; the renderer owns its lifetime.
    },
  };
}

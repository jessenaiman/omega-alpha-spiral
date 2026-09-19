/**
 * The acceptance surfaces the loop contract requires on `window`.
 *
 * Declared here so `src/ui`, `src/systems`, and the browser specs in
 * `tests/browser` can read them without a cast. See
 * `docs/game/core-loop-contract.md`, "Acceptance hooks".
 */

import type { DiagnosticsSnapshot, SceneTestHooks } from './acceptance';

declare global {
  interface Window {
    __BLENDER_MCP_DEMO__?: {
      getState(): {
        loaded: boolean;
        tile: { x: number; z: number };
        steps: number;
        gems: number;
        exitReached: boolean;
        meshNames: string[];
        bounds: number[];
        heroPosition: number[] | null;
        gemVisible: boolean | null;
        drawCalls: number;
        triangles: number;
      };
    };
    __LOOP_LAB__?: {
      getState(): {
        seed: string;
        phase: 'play' | 'question' | 'dead' | 'escaped';
        hp: number;
        processHp: number;
        guardHp: number;
        turn: number;
        player: { x: number; y: number };
        process: { x: number; y: number };
        exits: { kind: string; x: number; y: number }[];
        drawCalls: number;
        triangles: number;
        textureVersion: number;
      };
    };
    __THREE_GAME_TEST_HOOKS__?: SceneTestHooks;
    __THREE_GAME_DIAGNOSTICS__?: DiagnosticsSnapshot;
  }
}

export {};

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
    __THREE_GAME_TEST_HOOKS__?: SceneTestHooks;
    __THREE_GAME_DIAGNOSTICS__?: DiagnosticsSnapshot;
  }
}

export {};

/**
 * Spiral Breaker — the heads-up display.
 *
 * Reads the world, writes DOM text. It owns no game state; every number it
 * shows comes straight from the rules. Overlays are driven by phase so a
 * capture of "menu" or "game-over" is the same overlay a player sees.
 */

import { TUNING, type WorldState } from '../game';

export interface Hud {
  update(world: WorldState): void;
  setMuted(muted: boolean): void;
  setDebugHidden(hidden: boolean): void;
}

export function createHud(root: HTMLElement): Hud {
  const score = root.querySelector<HTMLElement>('[data-hud-score]');
  const best = root.querySelector<HTMLElement>('[data-hud-best]');
  const wave = root.querySelector<HTMLElement>('[data-hud-wave]');
  const chain = root.querySelector<HTMLElement>('[data-hud-chain]');
  const integrity = root.querySelector<HTMLElement>('[data-hud-integrity]');
  const badge = root.querySelector<HTMLElement>('[data-hud-badge]');
  const overlay = root.querySelector<HTMLElement>('[data-hud-overlay]');
  const overlayTitle = root.querySelector<HTMLElement>('[data-hud-overlay-title]');
  const overlayBody = root.querySelector<HTMLElement>('[data-hud-overlay-body]');
  const status = root.querySelector<HTMLElement>('[data-hud-status]');
  const mute = root.querySelector<HTMLElement>('[data-hud-mute]');

  const setText = (element: HTMLElement | null, value: string): void => {
    if (element && element.textContent !== value) element.textContent = value;
  };

  return {
    update(world: WorldState): void {
      root.dataset.state = world.phase;
      root.dataset.ghost = world.ghostDriving ? 'true' : 'false';

      setText(score, String(world.score));
      setText(best, String(world.best));
      setText(wave, String(world.wave));

      const showChain = world.chain > 1 && world.chainWindow > 0;
      setText(chain, showChain ? `x${world.chain}` : '');
      if (chain) chain.hidden = !showChain;

      if (integrity) {
        const filled = '◆'.repeat(Math.max(0, world.integrity));
        const empty = '◇'.repeat(Math.max(0, TUNING.maxIntegrity - world.integrity));
        setText(integrity, filled + empty);
        integrity.dataset.low = world.integrity <= 1 ? 'true' : 'false';
      }

      if (badge) {
        const ghost = world.ghostDriving && world.phase === 'play';
        badge.hidden = !ghost;
        setText(badge, 'GHOST PLAYING');
      }

      if (overlay && overlayTitle && overlayBody) {
        if (world.phase === 'menu') {
          overlay.hidden = false;
          setText(overlayTitle, 'SPIRAL BREAKER');
          setText(overlayBody, 'Steer the core. Dash through every shard. Survive six waves.');
        } else if (world.phase === 'game-over') {
          overlay.hidden = false;
          setText(overlayTitle, 'RUN OVER');
          setText(overlayBody, `Score ${world.score} · Best ${world.best} · Wave ${world.wave}`);
        } else if (world.phase === 'victory') {
          overlay.hidden = false;
          setText(overlayTitle, 'GAUNTLET CLEARED');
          setText(overlayBody, `Final ${world.score} · Best ${world.best} · Wave ${world.wave}`);
        } else {
          overlay.hidden = true;
        }
      }

      if (status) {
        const mode =
          world.phase === 'menu'
            ? 'Standby'
            : world.phase === 'game-over'
              ? 'Run over'
              : world.phase === 'victory'
                ? 'Gauntlet cleared'
                : world.ghostDriving
                  ? 'Ghost playing'
                  : 'Manual';
        const waveLabel =
          world.phase === 'play' ? `${world.wave}/${TUNING.gauntletWaves}` : String(world.wave);
        setText(
          status,
          `${mode} · score ${world.score} · integrity ${world.integrity}/${TUNING.maxIntegrity} · wave ${waveLabel}`,
        );
      }
    },
    setMuted(muted: boolean): void {
      if (mute) {
        mute.dataset.muted = muted ? 'true' : 'false';
        setText(mute, muted ? 'SOUND OFF' : 'SOUND ON');
      }
    },
    setDebugHidden(hidden: boolean): void {
      root.dataset.debugHidden = hidden ? 'true' : 'false';
    },
  };
}

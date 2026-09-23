/**
 * Spiral Breaker — the heads-up display.
 *
 * Reads the world, writes DOM text. It owns no game state; every number it
 * shows comes straight from the rules. Overlays are driven by phase so a
 * capture of "menu" or "game-over" is the same overlay a player sees.
 */

import { TUNING, type ArcadeEvent, type WorldState } from "../game";

export interface Hud {
  update(world: WorldState): void;
  notify(events: readonly ArcadeEvent[]): void;
  setMuted(muted: boolean): void;
  setDebugHidden(hidden: boolean): void;
}

/** Fraction of the dash wait already elapsed: 0 = cooling, 1 = ready. */
export function dashCharge(
  cooldownSec: number,
  cooldownDurationSec: number
): number {
  if (cooldownDurationSec <= 0) return 1;
  const remaining = Math.max(0, Math.min(cooldownDurationSec, cooldownSec));
  return 1 - remaining / cooldownDurationSec;
}

export function createHud(root: HTMLElement): Hud {
  const score = root.querySelector<HTMLElement>("[data-hud-score]");
  const best = root.querySelector<HTMLElement>("[data-hud-best]");
  const wave = root.querySelector<HTMLElement>("[data-hud-wave]");
  const chain = root.querySelector<HTMLElement>("[data-hud-chain]");
  const integrity = root.querySelector<HTMLElement>("[data-hud-integrity]");
  const badge = root.querySelector<HTMLElement>("[data-hud-badge]");
  const overlay = root.querySelector<HTMLElement>("[data-hud-overlay]");
  const overlayTitle = root.querySelector<HTMLElement>(
    "[data-hud-overlay-title]"
  );
  const overlayBody = root.querySelector<HTMLElement>(
    "[data-hud-overlay-body]"
  );
  const status = root.querySelector<HTMLElement>("[data-hud-status]");
  const mute = root.querySelector<HTMLElement>("[data-hud-mute]");
  const feed = root.querySelector<HTMLElement>("[data-hud-feed]");
  const dash = root.querySelector<HTMLElement>("[data-hud-dash]");
  const dashFill = root.querySelector<HTMLElement>("[data-hud-dash-fill]");
  const waveDots = root.querySelector<HTMLElement>("[data-hud-wave-dots]");

  // The integrity and wave meters are authored once as cells so the HUD shows
  // status at a glance: gold when healing, red at one pip, cyan live dots for
  // the wave climb.
  const integrityPips: HTMLElement[] = [];
  if (integrity) {
    for (let index = 0; index < TUNING.maxIntegrity; index += 1) {
      const pip = document.createElement("span");
      pip.className = "integrity-pip";
      pip.setAttribute("aria-hidden", "true");
      integrity.appendChild(pip);
      integrityPips.push(pip);
    }
  }

  const waveDotEls: HTMLElement[] = [];
  if (waveDots) {
    for (let index = 0; index < TUNING.gauntletWaves; index += 1) {
      const dot = document.createElement("span");
      dot.className = "wave-dot";
      waveDots.appendChild(dot);
      waveDotEls.push(dot);
    }
  }

  const setText = (element: HTMLElement | null, value: string): void => {
    if (element && element.textContent !== value) element.textContent = value;
  };

  const punch = (element: HTMLElement | null, scale = 1.25): void => {
    if (!element || typeof element.animate !== "function") return;
    element.animate(
      [{ transform: `scale(${scale})` }, { transform: "scale(1)" }],
      { duration: 130, easing: "ease-out" }
    );
  };

  const feedMessage = (message: string, kind: string): void => {
    if (!feed) return;
    feed.dataset.kind = kind;
    feed.textContent = message;
    feed.hidden = false;
    try {
      feed.getAnimations().forEach((animation) => animation.cancel());
      const animation = feed.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-6px)" },
        ],
        { duration: 1400, easing: "ease-out" }
      );
      void animation.finished.then(() => {
        feed.hidden = true;
      });
    } catch {
      feed.hidden = true;
    }
  };

  return {
    update(world: WorldState): void {
      root.dataset.state = world.phase;
      root.dataset.ghost = world.ghostDriving ? "true" : "false";

      setText(score, String(world.score));
      setText(best, String(world.best));
      setText(wave, String(world.wave));

      const showChain = world.chain > 1 && world.chainWindow > 0;
      setText(chain, showChain ? `x${world.chain}` : "");
      if (chain) chain.hidden = !showChain;

      if (integrity) {
        integrityPips.forEach((pip, index) => {
          const filled = index < world.integrity;
          if (pip.dataset.filled !== String(filled))
            pip.dataset.filled = String(filled);
        });
        integrity.dataset.low = world.integrity <= 1 ? "true" : "false";
      }

      waveDotEls.forEach((dot, index) => {
        const active = index < world.wave;
        if (dot.dataset.active !== String(active))
          dot.dataset.active = String(active);
      });

      if (dash && dashFill) {
        const charge = dashCharge(
          world.player.dashCooldown,
          TUNING.dashCooldownSec
        );
        dashFill.style.transform = `scaleX(${charge})`;
        const ready = charge >= 1;
        dash.dataset.ready = ready ? "true" : "false";
      }

      if (badge) {
        const ghost = world.ghostDriving && world.phase === "play";
        badge.hidden = !ghost;
        setText(badge, "GHOST PLAYING");
      }

      if (overlay && overlayTitle && overlayBody) {
        if (world.phase === "menu") {
          overlay.hidden = false;
          setText(overlayTitle, "SPIRAL BREAKER");
          setText(
            overlayBody,
            "Steer the core. Dash through every shard. Survive six waves."
          );
        } else if (world.phase === "game-over") {
          overlay.hidden = false;
          setText(overlayTitle, "RUN OVER");
          setText(
            overlayBody,
            `Score ${world.score} · Best ${world.best} · Wave ${world.wave}`
          );
        } else if (world.phase === "victory") {
          overlay.hidden = false;
          setText(overlayTitle, "GAUNTLET CLEARED");
          setText(
            overlayBody,
            `Final ${world.score} · Best ${world.best} · Wave ${world.wave}`
          );
        } else {
          overlay.hidden = true;
        }
      }

      if (status) {
        const mode =
          world.phase === "menu"
            ? "Standby"
            : world.phase === "game-over"
              ? "Run over"
              : world.phase === "victory"
                ? "Gauntlet cleared"
                : world.ghostDriving
                  ? "Ghost playing"
                  : "Manual";
        const waveLabel =
          world.phase === "play"
            ? `${world.wave}/${TUNING.gauntletWaves}`
            : String(world.wave);
        setText(
          status,
          `${mode} · score ${world.score} · integrity ${world.integrity}/${TUNING.maxIntegrity} · wave ${waveLabel}`
        );
      }
    },
    notify(events: readonly ArcadeEvent[]): void {
      for (const event of events) {
        switch (event.type) {
          case "score.change":
            if (event.gained > 0) {
              punch(score);
              if (event.chain >= 3) punch(chain, 1.3);
            }
            break;
          case "wave.start":
            feedMessage(
              event.wave === TUNING.gauntletWaves
                ? "FINAL WAVE"
                : `WAVE ${event.wave}`,
              "wave"
            );
            break;
          case "shard.blocked":
            feedMessage("BLOCKED — FLANK IT", "blocked");
            break;
          case "core.heal":
            feedMessage("+1 INTEGRITY", "heal");
            punch(integrity, 1.3);
            break;
          case "core.breach":
            feedMessage("THE CORE WEAKENS", "breach");
            punch(integrity, 1.15);
            break;
          default:
            break;
        }
      }
    },
    setMuted(muted: boolean): void {
      if (mute) {
        mute.dataset.muted = muted ? "true" : "false";
        setText(mute, muted ? "SOUND OFF" : "SOUND ON");
      }
    },
    setDebugHidden(hidden: boolean): void {
      root.dataset.debugHidden = hidden ? "true" : "false";
    },
  };
}

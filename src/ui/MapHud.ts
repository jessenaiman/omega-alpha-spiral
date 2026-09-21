import type { ExplorationPhase } from '../phases/ExplorationPhase.js';

export class MapHud {
  private readonly root = document.createElement('section');
  private readonly count = document.createElement('span');
  private readonly target = document.createElement('p');
  private readonly strip = document.createElement('div');

  constructor(shell: HTMLElement) {
    this.root.className = 'map-hud';
    this.root.dataset.mapHud = '';
    this.root.setAttribute('aria-label', 'Town restoration');
    const top = document.createElement('header');
    const objective = document.createElement('p');
    objective.textContent = 'TOWN MAP / RESTORE ITS THREE LANDMARKS';
    this.count.className = 'map-count';
    top.append(objective, this.count);
    const bottom = document.createElement('footer');
    this.target.dataset.mapTarget = '';
    this.target.setAttribute('role', 'status');
    const controls = document.createElement('p');
    controls.textContent = 'WASD / ARROWS  MOVE · E / ENTER  ACT · ESC  PAUSE';
    controls.className = 'map-controls';
    bottom.append(this.target, controls);
    this.strip.className = 'blackout-strip';
    this.strip.hidden = true;
    this.strip.setAttribute('aria-hidden', 'true');
    this.root.append(this.strip, top, bottom);
    shell.append(this.root);
  }

  update(state: ReturnType<ExplorationPhase['snapshot']>, paused: boolean): void {
    const strip = state.blackoutStrip;
    this.strip.hidden = !strip || state.complete;
    if (strip) {
      this.strip.dataset.phase = strip.phase;
      this.strip.style.left = `${(strip.x - strip.width / 2 + 20) / 40 * 100}%`;
      this.strip.style.top = `${(strip.z - strip.depth / 2 + 9) / 30 * 100}%`;
      this.strip.style.width = `${strip.width / 40 * 100}%`;
      this.strip.style.height = `${strip.depth / 30 * 100}%`;
    }
    this.count.textContent = `${state.restored.length} / 3`;
    const text = paused ? 'PAUSED · ESC TO RESUME'
      : state.complete ? 'TOWN RESTORED · NEXT ERA NOT YET CONNECTED'
      : state.freezeRemaining > 0 ? 'SIGNAL LOST · RECOVERING — NO PROGRESS LOST'
      : state.target ? `E / ENTER — RESTORE ${state.target.toUpperCase()}`
      : strip?.phase === 'tell' ? 'DASHED STRIP: BLACKOUT APPROACHING · STEP CLEAR'
      : 'FOLLOW THE PATHS · APPROACH A ? LANDMARK';
    if (this.target.textContent !== text) this.target.textContent = text;
  }

  dispose(): void { this.root.remove(); }
}

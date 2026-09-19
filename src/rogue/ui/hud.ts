import type { RogueState } from '../game';

export interface HudRefs {
  hp: HTMLElement;
  depth: HTMLElement;
  log: HTMLElement;
  overlay: HTMLElement;
}

export function renderHud(refs: HudRefs, state: RogueState): void {
  refs.hp.textContent = `${Math.max(0, state.hp)}/${state.maxHp}`;
  refs.depth.textContent = String(state.depth);
  refs.log.replaceChildren();
  for (const text of state.messages.slice(-14)) {
    const line = document.createElement('li');
    line.textContent = text;
    refs.log.append(line);
  }
  refs.overlay.hidden = state.outcome !== 'dead';
}

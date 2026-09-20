import { createRun, stepRogue, type Dir, type Intent } from './game';
import { createScene } from './present/scene';
import { renderHud } from './ui/hud';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('[data-rogue-canvas]');
const hpEl = document.querySelector<HTMLElement>('[data-rogue-hp]');
const depthEl = document.querySelector<HTMLElement>('[data-rogue-depth]');
const logEl = document.querySelector<HTMLElement>('[data-rogue-log]');
const overlayEl = document.querySelector<HTMLElement>('[data-rogue-overlay]');
const errorEl = document.querySelector<HTMLElement>('[data-rogue-error]');

const DIR_KEYS: Record<string, Dir> = {
  ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e',
  w: 'n', s: 's', a: 'w', d: 'e',
};

async function main(): Promise<void> {
  if (!canvas || !hpEl || !depthEl || !logEl || !overlayEl) throw new Error('Rogue shell is incomplete.');

  const params = new URLSearchParams(globalThis.location.search);
  let state = createRun(params.get('seed') ?? 'rogue-1');

  const scene = await createScene(canvas);
  const refs = { hp: hpEl, depth: depthEl, log: logEl, overlay: overlayEl };

  const present = (): void => {
    scene.sync(state);
    renderHud(refs, state);
    scene.render();
  };

  const dispatch = (intent: Intent): void => {
    state = stepRogue(state, intent).state;
    present();
  };

  globalThis.addEventListener('keydown', (event) => {
    const dir = DIR_KEYS[event.key] ?? DIR_KEYS[event.key.toLowerCase()];
    if (dir) {
      event.preventDefault();
      dispatch({ kind: 'move', dir });
      return;
    }
    if (event.key === ' ' || event.key === '.') {
      event.preventDefault();
      dispatch({ kind: 'wait' });
      return;
    }
    if (event.key === 'r' || event.key === 'R') { dispatch({ kind: 'restart' }); return; }
    if (event.key === 'n' || event.key === 'N') { dispatch({ kind: 'new-run' }); return; }
    if (event.key === 'Enter' && state.outcome !== 'ongoing') dispatch({ kind: 'restart' });
  });

  globalThis.addEventListener('resize', () => scene.resize());

  present();
  scene.resize();
}

main().catch((error: unknown) => {
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = error instanceof Error ? error.message : 'Rogue Descent could not start.';
  }
  console.error(error);
});

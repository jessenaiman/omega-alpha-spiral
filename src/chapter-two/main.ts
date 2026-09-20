import { ChapterTwoScene } from './ChapterTwoScene';
import { PerspectiveCamera, WebGLRenderer } from 'three';
import './styles.css';

/**
 * Direct entry into Stage 2/Echo Descent for iteration play.
 * The shipped intro (intro.html) still crosses the door first; this page
 * exists so floor work can be played immediately without the full opening.
 *
 * ChapterTwoScene is a driven sub-scene: BootScene supplies the renderer,
 * camera and rAF loop when stage 2 runs after the intro. A direct entry
 * has to provide its own canvas + loop. One loop, one owner.
 */
const root: HTMLElement = document.querySelector('main')!;
const params: URLSearchParams = new URLSearchParams(location.search);
const debug: boolean = params.has('debug');

// Hidden debug pass runs the real WebGLRenderer constructor against the
// canvas it expects inside init(); the visible canvas is created here.
const canvas: HTMLCanvasElement = document.createElement('canvas');
canvas.id = 'descent-canvas';
canvas.style.position = 'fixed';
canvas.style.inset = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
root.append(canvas);

const renderer = new WebGLRenderer({ canvas, alpha: false, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
const camera = new PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);

const chapterTwo: ChapterTwoScene = new ChapterTwoScene();
chapterTwo.init(root, debug);
chapterTwo.start('');

const resize = (): void => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
addEventListener('resize', resize);
resize();

let previous: number = performance.now();
const frame = (now: number): void => {
  const delta = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  if (!document.hidden && chapterTwo.active) chapterTwo.update(delta, renderer, matchMedia('(prefers-reduced-motion: reduce)').matches);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

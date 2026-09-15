import * as THREE from 'three';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('[data-game-canvas]');
const status = document.querySelector<HTMLElement>('[data-game-status]');
const errorBox = document.querySelector<HTMLElement>('[data-game-error]');

try {
  if (!canvas || !status || !errorBox) throw new Error('Game shell is incomplete.');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 2;

  const resize = (): void => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setClearColor(0x070908, 1);
    renderer.render(scene, camera);
  };

  resize();
  window.addEventListener('resize', resize);
  status.textContent = 'GHOST TERMINAL · INITIALIZING';
} catch (error) {
  if (errorBox) {
    errorBox.hidden = false;
    errorBox.textContent = error instanceof Error ? error.message : 'Omega Spiral could not start.';
  }
  throw error;
}

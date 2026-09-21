import * as THREE from 'three';
import { TOWN_LAYOUT } from './layout.js';
import type { ExplorationPhase } from '../phases/ExplorationPhase.js';

export class TownMap {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 60);
  private readonly surface = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private readonly player: THREE.Mesh;
  private restoredKey = '';

  constructor() {
    this.camera.position.set(0, -6, 30);
    this.surface.width = 640;
    this.surface.height = 480;
    this.texture = new THREE.CanvasTexture(this.surface);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const map = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: this.texture }));
    map.position.y = -6;
    this.scene.add(map);
    const silhouette = new THREE.Shape();
    silhouette.moveTo(0, 0.6);
    silhouette.lineTo(0.4, 0);
    silhouette.lineTo(0.18, -0.5);
    silhouette.lineTo(0, -0.3);
    silhouette.lineTo(-0.18, -0.5);
    silhouette.lineTo(-0.4, 0);
    silhouette.closePath();
    this.player = new THREE.Mesh(new THREE.ShapeGeometry(silhouette), new THREE.MeshBasicMaterial({ color: 0xe8dcc8 }));
    this.player.position.z = 0.2;
    this.scene.add(this.player);
    this.paint([]);
  }

  update(state: ReturnType<ExplorationPhase['snapshot']>): void {
    this.player.position.x = state.player.x;
    this.player.position.y = -state.player.z;
    const key = state.restored.join(',');
    if (key !== this.restoredKey) {
      this.restoredKey = key;
      this.paint(state.restored);
    }
  }

  dispose(): void {
    this.texture.dispose();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
  }

  private paint(restored: readonly string[]): void {
    const c = this.surface.getContext('2d');
    if (!c) throw new Error('Town map drawing context unavailable.');
    const px = (x: number) => (x + 20) * 16;
    const py = (z: number) => (z + 9) * 16;
    c.fillStyle = '#0a0a0f'; c.fillRect(0, 0, 640, 480);
    c.strokeStyle = '#302f33'; c.lineWidth = 1;
    for (let x = 32; x < 640; x += 16) {
      for (let y = 32; y < 460; y += 16) {
        c.fillStyle = '#302f33'; c.fillRect(x, y, 1, 1);
      }
    }
    c.strokeStyle = '#817c71'; c.setLineDash([2, 5]);
    c.beginPath(); c.moveTo(px(-8), py(1)); c.lineTo(px(8), py(1));
    c.moveTo(px(0), py(-4)); c.lineTo(px(0), py(18)); c.stroke(); c.setLineDash([]);
    c.font = '14px monospace'; c.textAlign = 'center';
    for (let i = 0; i < 18; i++) {
      const x = (i % 6 - 2.5) * 3.5;
      const z = Math.floor(i / 6) * 5 + 4;
      if (Math.abs(x) < 2.5) continue;
      c.strokeStyle = '#514e49';
      c.strokeRect(px(x) - 8, py(z) - 7, 16, 14);
      c.fillStyle = '#817c71'; c.fillRect(px(x) - 1, py(z) - 1, 2, 2);
    }
    for (const id of ['archive', 'refuge', 'gate'] as const) {
      const point = TOWN_LAYOUT[id]; const x = px(point.x), y = py(point.z);
      const done = restored.includes(id);
      c.fillStyle = '#0a0a0f'; c.fillRect(x - 49, y - 38, 98, 69);
      c.strokeStyle = done ? '#e8dcc8' : '#817c71'; c.lineWidth = done ? 2 : 1;
      if (id === 'archive') {
        for (let n = 0; n < 3; n++) c.strokeRect(x - 14 + n * 3, y - 18 + n * 6, 28 - n * 6, 8);
      } else if (id === 'refuge') {
        c.beginPath(); c.moveTo(x - 16, y + 4); c.lineTo(x - 16, y - 6);
        c.lineTo(x, y - 20); c.lineTo(x + 16, y - 6); c.lineTo(x + 16, y + 4); c.closePath(); c.stroke();
      } else {
        c.strokeRect(x - 18, y - 18, 7, 25); c.strokeRect(x + 11, y - 18, 7, 25);
        c.beginPath(); c.moveTo(x - 11, y - 15); c.lineTo(x + 11, y - 15); c.stroke();
      }
      c.fillStyle = done ? '#e8dcc8' : '#817c71';
      c.fillText(`${done ? '+' : '?'} ${id.toUpperCase()}`, x, y + 26);
    }
    this.texture.needsUpdate = true;
  }
}

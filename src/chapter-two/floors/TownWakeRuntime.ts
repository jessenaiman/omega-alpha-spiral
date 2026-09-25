import * as THREE from "three";
import type { OmlEvent } from "../../core/oml";
import { CHAPTER_ZERO_LEVELS_BY_ID } from "../../dialogue/chapter-zero-vite";

const scene = CHAPTER_ZERO_LEVELS_BY_ID.get("amnesia-town");
if (!scene) throw new Error("Missing authored OML scene: amnesia-town");

export interface TownWakeStatus {
  readonly sceneId: "amnesia-town";
  readonly eraShaderId: string;
  readonly title: "Amnesia: Classic Town";
  readonly text: string;
  readonly complete: boolean;
}

/** The authored stopping scene: a quiet bedroom in town, with no party present. */
export class TownWakeRuntime {
  public readonly group = new THREE.Group();
  private readonly _geometries: THREE.BufferGeometry[] = [];
  private readonly _materials: THREE.Material[] = [];
  private readonly _events: readonly OmlEvent[] = scene.events;
  private readonly _lines: string[] = [];
  private _eventIndex = 0;
  private _waitRemainingMs = 0;
  private _disposed = false;

  public constructor() {
    this.group.name = "amnesia-town-bedroom";
    const plaster = this._material(0xd8c69f, 0.95);
    const wood = this._material(0x71492f, 0.88);
    const linen = this._material(0xe8dfc7, 0.96);
    const blanket = this._material(0x865c70, 0.9);
    const warmGlass = this._material(0xeab96a, 0.42, 0.32);

    this._box("bed-frame", 0, 0.45, 0, 4.6, 0.55, 7, wood);
    this._box("mattress", 0, 0.9, 0, 4.2, 0.5, 6.5, linen);
    this._box("pillow", 0, 1.25, -2.15, 2.6, 0.35, 1.25, linen);
    this._box("blanket", 0, 1.2, 0.9, 4, 0.12, 3.7, blanket);
    this._box("floor", 0, -0.18, 0, 18, 0.3, 18, wood);
    this._box("north-wall", 0, 4, -8.7, 18, 8, 0.35, plaster);
    this._box("west-wall", -8.7, 4, 0, 0.35, 8, 18, plaster);
    this._box("bedside-table", 3.1, 0.8, -1.8, 1.5, 1.6, 1.5, wood);
    this._box("window-light", 3.8, 4.2, -8.45, 4.4, 3.2, 0.12, warmGlass);

    const rugGeometry = new THREE.CircleGeometry(3.1, 16);
    const rugMaterial = this._material(0x6f7f70, 0.98);
    const rug = new THREE.Mesh(rugGeometry, rugMaterial);
    rug.name = "bedroom-rug";
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-4, 0.01, 3.4);
    this._geometries.push(rugGeometry);
    this.group.add(rug);
  }

  public get status(): TownWakeStatus {
    return {
      sceneId: "amnesia-town",
      eraShaderId: scene.scene.era_shader ?? "apple-macintosh-quickdraw",
      title: "Amnesia: Classic Town",
      text: this._lines.join("\n\n"),
      complete: this._eventIndex >= this._events.length,
    };
  }

  public update(deltaMs: number): void {
    if (this._disposed || !Number.isFinite(deltaMs) || deltaMs < 0) return;
    let remaining = deltaMs;
    while (this._eventIndex < this._events.length) {
      if (this._waitRemainingMs > 0) {
        const elapsed = Math.min(remaining, this._waitRemainingMs);
        this._waitRemainingMs -= elapsed;
        remaining -= elapsed;
        if (this._waitRemainingMs > 0 || remaining <= 0) return;
      }
      const event = this._events[this._eventIndex++];
      if (event.type === "line") this._lines.push(event.text);
      else if (event.type === "wait") this._waitRemainingMs = event.durationMs;
      if (remaining <= 0 && event.type === "wait") return;
    }
  }

  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const geometry of this._geometries) geometry.dispose();
    for (const material of this._materials) material.dispose();
    this.group.clear();
  }

  private _material(
    color: number,
    roughness: number,
    emissiveIntensity = 0
  ): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      emissive: emissiveIntensity > 0 ? color : 0x000000,
      emissiveIntensity,
    });
    this._materials.push(material);
    return material;
  }

  private _box(
    name: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    material: THREE.Material
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this._geometries.push(geometry);
    this.group.add(mesh);
    return mesh;
  }
}

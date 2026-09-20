import { Box3, BoxGeometry, Group, Material, MathUtils, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';

const HANDOFF_START: number = 0.72;
const HANDOFF_END: number = 0.94;
const SEED_SCALE: number = 0.012;
const SEED_GROWTH: number = 0.02;
interface SeedPiece { source: Object3D; seed: Mesh<BoxGeometry, MeshBasicMaterial>; size: Vector3; center: Vector3 }
interface SurfaceState { surface: Material; opacity: number; transparent: boolean; depthWrite: boolean }

/** Small Three.js boxes grow into aligned Blender surfaces, without rebaking art. */
export class DoorFormation {
  private _pieces: SeedPiece[] = [];
  private _meshes: Mesh[] = [];
  private _surfaces: SurfaceState[] = [];
  private _geometry: BoxGeometry | null = null;
  private _material: MeshBasicMaterial | null = null;
  private _offset: Vector3 = new Vector3();
  private _scale: Vector3 = new Vector3();
  private _blend: number = 0;

  public init(model: Group): void {
    this._geometry = new BoxGeometry(1, 1, 1);
    this._material = new MeshBasicMaterial({ color: 0xabc8d5, transparent: true, depthWrite: false });
    const materials: Set<Material> = new Set();
    // Exported objects with multiple surfaces are Groups of identity-transform
    // primitives. The animation targets the named parent, not its material splits.
    for (const node of [...model.children]) {
      const bounds: Box3 = new Box3();
      node.traverse((object: Object3D): void => {
        if (!(object instanceof Mesh)) return;
        this._meshes.push(object);
        object.geometry.computeBoundingBox();
        if (object.geometry.boundingBox) bounds.union(object.geometry.boundingBox);
        const surfaces: Material[] = Array.isArray(object.material) ? object.material : [object.material];
        for (const surface of surfaces) materials.add(surface);
      });
      // An inset is part of its bar, never another independently materializing seed.
      if (bounds.isEmpty() || node.name.includes('phosphor_inset')) continue;
      const seed: Mesh<BoxGeometry, MeshBasicMaterial> = new Mesh(this._geometry, this._material);
      seed.name = `Primitive_${node.name}`;
      this._pieces.push({ source: node, seed, size: bounds.getSize(new Vector3()), center: bounds.getCenter(new Vector3()) });
      model.add(seed);
    }
    this._surfaces = [...materials].map((surface: Material): SurfaceState => {
      const state: SurfaceState = { surface, opacity: surface.opacity, transparent: surface.transparent, depthWrite: surface.depthWrite };
      surface.transparent = true;
      return state;
    });
    this.update(0);
  }

  public update(progress: number): void {
    const pose: number = Number.isFinite(progress) ? MathUtils.clamp(progress, 0, 1) : 0;
    this._blend = MathUtils.smoothstep(pose, HANDOFF_START, HANDOFF_END);
    const smallScale: number = SEED_SCALE + SEED_GROWTH * Math.min(pose / HANDOFF_START, 1);
    if (this._material) this._material.opacity = 1 - this._blend;
    for (const state of this._surfaces) {
      state.surface.opacity = state.opacity * this._blend;
      state.surface.depthWrite = this._blend === 1 && state.depthWrite;
    }
    for (const mesh of this._meshes) mesh.visible = this._blend > 0;
    for (const piece of this._pieces) {
      piece.seed.visible = this._blend < 1;
      this._offset.copy(piece.center).multiply(piece.source.scale).applyQuaternion(piece.source.quaternion);
      piece.seed.position.copy(piece.source.position).add(this._offset);
      piece.seed.quaternion.copy(piece.source.quaternion);
      this._scale.setScalar(smallScale).lerp(piece.source.scale, this._blend);
      piece.seed.scale.copy(piece.size).multiply(this._scale);
    }
  }

  public getState(): { blend: number; visibleSeeds: number; visibleSurfaces: number } {
    return { blend: this._blend, visibleSeeds: this._pieces.filter((piece: SeedPiece): boolean => piece.seed.visible).length,
      visibleSurfaces: this._meshes.filter((mesh: Mesh): boolean => mesh.visible).length };
  }

  public destroy(): void {
    for (const piece of this._pieces) piece.seed.removeFromParent();
    for (const state of this._surfaces) {
      state.surface.opacity = state.opacity;
      state.surface.transparent = state.transparent;
      state.surface.depthWrite = state.depthWrite;
    }
    for (const mesh of this._meshes) mesh.visible = true;
    this._pieces = []; this._meshes = []; this._surfaces = [];
    this._geometry?.dispose(); this._material?.dispose();
    this._geometry = null; this._material = null;
  }
}

import { AnimationAction, AnimationMixer, DirectionalLight, Group, HemisphereLight, LoopOnce, Mesh, Scene } from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

import thresholdUrl from '../../assets/intro/threshold-runtime/threshold.glb?url';
import { DoorFormation } from './DoorFormation';

/** Saved Blender study, sampled by narrative progress rather than wall time. */
export class ThresholdScene {
  private _root: Group = new Group();
  private _model: Group | null = null;
  private _mixer: AnimationMixer | null = null;
  private _actions: AnimationAction[] = [];
  private _formation: DoorFormation = new DoorFormation();
  private _isDestroyed: boolean = false;
  public isReady: boolean = false;

  public init(scene: Scene, onReady: () => void, onError: () => void): void {
    this._root.position.y = -2.4;
    this._root.visible = false;
    const ambient: HemisphereLight = new HemisphereLight(0xb9dbff, 0x171120, 1.6);
    const key: DirectionalLight = new DirectionalLight(0xa8d4ff, 3.5);
    key.position.set(-3, 5, 6);
    const rim: DirectionalLight = new DirectionalLight(0xffaa60, 2.5);
    rim.position.set(4, 2, -3);
    this._root.add(ambient, key, rim);
    scene.add(this._root);
    new GLTFLoader().load(thresholdUrl, (gltf: GLTF): void => {
      this._model = gltf.scene;
      if (this._isDestroyed) { this._disposeModel(); return; }
      if (!gltf.animations.length) { this._disposeModel(); onError(); return; }
      this._root.add(gltf.scene);
      this._mixer = new AnimationMixer(gltf.scene);
      this._actions = gltf.animations.map((clip): AnimationAction => {
        const action: AnimationAction = this._mixer!.clipAction(clip);
        action.setLoop(LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();
        action.paused = true;
        return action;
      });
      this._formation.init(gltf.scene);
      this.isReady = true;
      onReady();
    }, undefined, (): void => { if (!this._isDestroyed) onError(); });
  }

  public update(progress: number, isVisible: boolean, isReduced: boolean): void {
    this._root.visible = this.isReady && isVisible;
    // Reduced motion uses discrete formation poses, not rotating fragments.
    const pose: number = isReduced ? (progress >= 1 ? 1 : 0) : Math.min(Math.max(progress, 0), 1);
    for (const action of this._actions) action.time = pose * action.getClip().duration;
    this._mixer?.update(0);
    this._formation.update(pose);
  }

  public getState(): object {
    return { ready: this.isReady, visible: this._root.visible, clipTimes: this._actions.map((action): number => action.time), representation: this._formation.getState() };
  }

  private _disposeModel(): void {
    this._formation.destroy();
    this._model?.traverse((object): void => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material): void => material.dispose());
    });
    this._model?.removeFromParent();
    this._model = null;
  }

  public destroy(): void {
    this._isDestroyed = true;
    this.isReady = false;
    this._mixer?.stopAllAction();
    if (this._model) this._mixer?.uncacheRoot(this._model);
    this._actions = [];
    this._mixer = null;
    this._disposeModel();
    this._root.removeFromParent();
  }
}

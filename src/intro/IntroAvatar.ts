import {
  Color,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

type BodyPart = Mesh<BoxGeometry, MeshStandardMaterial>;

/** The first player pixel accumulates a deliberately coarse body with each choice. */
export class IntroAvatar {
  public readonly root = new Group();
  private readonly _form = new Group();
  private readonly _parts: BodyPart[] = [];
  private readonly _head: BodyPart;
  private readonly _torso: BodyPart;
  private readonly _arms: BodyPart[] = [];
  private readonly _legs: BodyPart[] = [];
  private readonly _fragments: BodyPart[] = [];
  private _stage = 0;
  private _growth = 0;

  public constructor() {
    this.root.position.y = 0.42;
    this.root.add(this._form);
    const material = (opacity: number): MeshStandardMaterial =>
      new MeshStandardMaterial({
        color: 0xd5f3ff,
        emissive: 0x789db5,
        emissiveIntensity: 1.35,
        metalness: 0.08,
        roughness: 0.72,
        transparent: true,
        opacity,
        depthWrite: false,
      });
    this._torso = new Mesh(
      new BoxGeometry(0.32, 0.38, 0.22),
      material(0)
    );
    this._torso.position.y = 0.02;
    this._form.add(this._torso);
    this._head = new Mesh(new BoxGeometry(0.31, 0.31, 0.27), material(0));
    this._head.position.y = 0.39;
    this._form.add(this._head);
    for (const side of [-1, 1]) {
      const arm = new Mesh(
        new BoxGeometry(0.13, 0.32, 0.17),
        material(0)
      );
      arm.position.set(side * 0.285, -0.02, 0);
      this._form.add(arm);
      this._arms.push(arm);
      const leg = new Mesh(
        new BoxGeometry(0.14, 0.31, 0.18),
        material(0)
      );
      leg.position.set(side * 0.09, -0.31, 0);
      this._form.add(leg);
      this._legs.push(leg);
    }
    for (const [x, y, z] of [
      [-0.36, 0.34, -0.13],
      [0.39, 0.18, -0.17],
      [-0.29, -0.38, 0.08],
      [0.31, -0.45, 0.1],
    ]) {
      const fragment = new Mesh(new BoxGeometry(0.12, 0.12, 0.12), material(0));
      fragment.position.set(x, y, z);
      this._form.add(fragment);
      this._fragments.push(fragment);
    }
    this._form.traverse((node): void => {
      if (node instanceof Mesh) this._parts.push(node as BodyPart);
    });
    this.setStage(0);
  }

  public setStage(stage: number): void {
    this._stage = Math.max(0, Math.min(4, Math.floor(stage)));
  }

  public settle(): void {
    this._growth = [0, 0.8, 0.94, 1.04, 1.12][this._stage];
    this.update(0, 0, false);
  }

  public setImprint(color: Color): void {
    this._parts.forEach((part): void => {
      part.material.color.set(0xd5f3ff).lerp(color, 0.78);
      part.material.emissive.set(0x789db5).lerp(color, 0.58);
    });
  }

  public update(delta: number, seconds: number, travelling: boolean): void {
    const goal = [0, 0.8, 0.94, 1.04, 1.12][this._stage];
    this._growth += (goal - this._growth) * (1 - Math.exp(-delta * 2.4));
    this._form.scale.setScalar(Math.max(0.001, this._growth));
    const torso = [0, 0.9, 0.95, 1, 1][this._stage];
    const head = [0, 0, 0.92, 0.96, 1][this._stage];
    const limb = [0, 0, 0.2, 0.92, 1][this._stage];
    this._torso.material.opacity = torso;
    this._head.material.opacity = head;
    this._arms.forEach((arm, index): void => {
      arm.material.opacity = limb;
      arm.rotation.x = travelling
        ? Math.sin(seconds * 5.2 + index * Math.PI) * 0.25
        : Math.sin(seconds * 1.1 + index) * 0.045;
    });
    this._legs.forEach((leg, index): void => {
      leg.material.opacity = limb;
      leg.rotation.x = travelling
        ? Math.sin(seconds * 5.2 + index * Math.PI + Math.PI) * 0.25
        : 0;
    });
    this._fragments.forEach((fragment, index): void => {
      fragment.material.opacity = this._stage >= index + 1 ? 0.85 : 0;
      fragment.position.z = (index < 2 ? -0.13 : 0.1) +
        (travelling ? Math.sin(seconds * 4 + index) * 0.035 : 0);
    });
    this._parts
      .filter(
        (part): boolean =>
          part !== this._head &&
          part !== this._torso &&
          !this._arms.includes(part) &&
          !this._legs.includes(part) &&
          !this._fragments.includes(part)
      )
      .forEach((part): void => {
        part.material.opacity = limb * 0.65;
      });
  }

  public dispose(): void {
    this._parts.forEach((part): void => {
      part.geometry.dispose();
      part.material.dispose();
    });
  }
}

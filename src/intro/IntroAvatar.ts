import {
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";

type BodyPart = Mesh<
  CylinderGeometry | IcosahedronGeometry | SphereGeometry,
  MeshStandardMaterial
>;

/** A point of light acquires a faceless body as the four choices are made. */
export class IntroAvatar {
  public readonly root = new Group();
  private readonly _form = new Group();
  private readonly _parts: BodyPart[] = [];
  private readonly _head: BodyPart;
  private readonly _torso: BodyPart;
  private readonly _arms: BodyPart[] = [];
  private readonly _legs: BodyPart[] = [];
  private _stage = 0;
  private _growth = 0;

  public constructor() {
    this.root.position.y = 0.55;
    this.root.add(this._form);
    const material = (opacity: number): MeshStandardMaterial =>
      new MeshStandardMaterial({
        color: 0xc7e6ef,
        emissive: 0x547c91,
        emissiveIntensity: 1.15,
        metalness: 0.25,
        roughness: 0.36,
        transparent: true,
        opacity,
        depthWrite: false,
      });
    this._torso = new Mesh(
      new CylinderGeometry(0.16, 0.115, 0.48, 7),
      material(0)
    );
    this._torso.position.y = 0.03;
    this._form.add(this._torso);
    this._head = new Mesh(new IcosahedronGeometry(0.135, 1), material(0));
    this._head.position.y = 0.43;
    this._head.scale.set(0.92, 1.12, 0.78);
    this._form.add(this._head);
    for (const side of [-1, 1]) {
      const shoulder = new Mesh(new SphereGeometry(0.07, 7, 5), material(0));
      shoulder.position.set(side * 0.205, 0.2, 0);
      this._form.add(shoulder);
      const arm = new Mesh(
        new CylinderGeometry(0.047, 0.034, 0.43, 6),
        material(0)
      );
      arm.position.set(side * 0.25, -0.065, 0);
      arm.rotation.z = side * 0.1;
      this._form.add(arm);
      this._arms.push(arm);
      const leg = new Mesh(
        new CylinderGeometry(0.067, 0.044, 0.49, 6),
        material(0)
      );
      leg.position.set(side * 0.09, -0.44, 0);
      leg.rotation.z = side * 0.04;
      this._form.add(leg);
      this._legs.push(leg);
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
    this._growth = [0, 0.43, 0.66, 0.83, 1][this._stage];
    this.update(0, 0, false);
  }

  public setImprint(color: Color): void {
    this._parts.forEach((part): void => {
      part.material.color.set(0xc7e6ef).lerp(color, 0.26);
      part.material.emissive.set(0x547c91).lerp(color, 0.34);
    });
  }

  public update(delta: number, seconds: number, travelling: boolean): void {
    const goal = [0, 0.43, 0.66, 0.83, 1][this._stage];
    this._growth += (goal - this._growth) * (1 - Math.exp(-delta * 2.4));
    this._form.scale.setScalar(Math.max(0.001, this._growth));
    const torso = [0, 0.25, 0.4, 0.58, 0.78][this._stage];
    const head = [0, 0, 0.42, 0.6, 0.82][this._stage];
    const limb = [0, 0, 0.08, 0.37, 0.74][this._stage];
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
    this._parts
      .filter(
        (part): boolean =>
          part !== this._head &&
          part !== this._torso &&
          !this._arms.includes(part) &&
          !this._legs.includes(part)
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

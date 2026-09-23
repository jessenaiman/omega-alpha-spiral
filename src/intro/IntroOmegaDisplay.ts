import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from "three";
import type { BootFrame } from "./ghostwriting";
import { getIntroEra } from "./IntroEraDesign";

/** Physical display behind Omega's existing shader-drawn glyph ribbon. */
export class IntroOmegaDisplay {
  public readonly root = new Group();
  private readonly _face: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly _echo: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly _border: LineSegments<BufferGeometry, LineBasicMaterial>;
  private readonly _rails: Array<Mesh<BoxGeometry, MeshBasicMaterial>> = [];

  public constructor() {
    const faceMaterial = new MeshBasicMaterial({
      color: 0x06151b,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      toneMapped: false,
    });
    this._face = new Mesh(new PlaneGeometry(1, 1), faceMaterial);
    this._face.position.z = -0.04;
    this.root.add(this._face);
    this._echo = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        color: 0x28424c,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this._echo.position.set(0.04, -0.045, -0.2);
    this.root.add(this._echo);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          -0.5, -0.5, 0.02, -0.5, 0.5, 0.02, -0.5, 0.5, 0.02, 0.5, 0.5, 0.02,
          0.5, 0.5, 0.02, 0.5, -0.5, 0.02, 0.5, -0.5, 0.02, -0.5, -0.5, 0.02,
          -0.47, 0.43, 0.035, -0.37, 0.43, 0.035, 0.38, -0.43, 0.035, 0.47,
          -0.43, 0.035,
        ],
        3
      )
    );
    this._border = new LineSegments(
      geometry,
      new LineBasicMaterial({
        color: 0x84cfce,
        transparent: true,
        opacity: 0.46,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this.root.add(this._border);
    for (const side of [-1, 1]) {
      const rail = new Mesh(
        new BoxGeometry(0.012, 0.9, 0.085),
        new MeshBasicMaterial({
          color: 0x367c8b,
          transparent: true,
          opacity: 0.3,
          toneMapped: false,
        })
      );
      rail.position.set(side * 0.5, 0, -0.03);
      this.root.add(rail);
      this._rails.push(rail);
    }
    this.root.visible = false;
  }

  public update(
    frame: BootFrame,
    questionPosition: Vector3,
    width: number,
    recede: number,
    seconds: number,
    reduced: boolean
  ): void {
    const naming = frame.phase === "name";
    const shown =
      frame.phase === "prelude" ||
      frame.phase === "question" ||
      frame.phase === "waiting" ||
      naming;
    this.root.visible = shown && frame.question.length > 0;
    if (!this.root.visible) return;
    const era = getIntroEra(frame.format);
    const span = width * (naming ? 0.64 : 0.86);
    this.root.position.set(
      questionPosition.x + span * (naming ? 0.5 : 0.46),
      questionPosition.y - (naming ? 0.04 : 0.13),
      questionPosition.z - 0.22
    );
    this.root.scale.set(span, naming ? 1.42 : 1.55, 1);
    this.root.rotation.set(-0.035, naming ? 0.03 : -0.065 - recede * 0.025, 0);
    if (!reduced) this.root.position.y += Math.sin(seconds * 0.45) * 0.035;
    const ink = new Color(era.ink);
    this._border.material.color.copy(ink).multiplyScalar(naming ? 0.85 : 0.55);
    this._border.material.opacity =
      (naming ? 0.74 : 0.35 + Math.min(1, frame.format / 5) * 0.13) *
      (1 - recede * 0.14);
    this._face.material.opacity = naming ? 0.4 : 0.5 - recede * 0.12;
    this._echo.material.opacity = frame.format >= 3 ? 0.17 : 0.08;
    this._rails.forEach((rail): void => {
      rail.material.color.copy(ink).multiplyScalar(0.38);
      rail.material.opacity = naming ? 0.32 : 0.22;
    });
  }

  public dispose(): void {
    this._face.geometry.dispose();
    this._face.material.dispose();
    this._echo.geometry.dispose();
    this._echo.material.dispose();
    this._border.geometry.dispose();
    this._border.material.dispose();
    this._rails.forEach((rail): void => {
      rail.geometry.dispose();
      rail.material.dispose();
    });
  }
}

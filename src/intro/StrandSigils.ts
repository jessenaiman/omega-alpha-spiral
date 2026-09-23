import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Curve,
  Group,
  LineBasicMaterial,
  LineSegments,
  Points,
  PointsMaterial,
  Quaternion,
  Vector3,
} from "three";
import { GlyphRibbon } from "./SpatialBootScene";

const SYMBOLS = [
  ["◊", "↑", "∞", "◊", "↑", "◊"],
  ["※", "≋", "↓", "※", "↵", "≋"],
  ["Ω", "↑", "◊", "Ω", "↑", "∞"],
];

export class StrandSigils {
  readonly root = new Group();
  private readonly glyphs: GlyphRibbon[] = [];
  private readonly anchors: Vector3[] = [];
  private readonly point = new Vector3();
  private readonly stemPositions: Float32Array;
  private readonly starPositions: Float32Array;
  private readonly stems: LineSegments<BufferGeometry, LineBasicMaterial>;
  private readonly stars: Points<BufferGeometry, PointsMaterial>;
  private readonly owner: number;
  private readonly color: number;

  constructor(
    curve: Curve<Vector3> | null,
    owner: number,
    color: number,
    atlases: CanvasTexture[],
    era: number
  ) {
    this.owner = owner;
    this.color = color;
    this.stemPositions = new Float32Array(SYMBOLS[owner].length * 4 * 6);
    this.starPositions = new Float32Array(SYMBOLS[owner].length * 3);
    SYMBOLS[owner].forEach((symbol, index) => {
      const glyph = new GlyphRibbon(atlases);
      glyph.init();
      glyph.setText(symbol, era, 1, color, owner);
      glyph.root.scale.setScalar(index % 3 === 0 ? 0.4 : 0.33);
      this.glyphs.push(glyph);
      this.anchors.push(new Vector3());
      this.root.add(glyph.root);
    });
    const stems = new BufferGeometry();
    stems.setAttribute(
      "position",
      new BufferAttribute(this.stemPositions, 3)
    );
    this.stems = new LineSegments(
      stems,
      new LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    );
    this.root.add(this.stems);
    const stars = new BufferGeometry();
    stars.setAttribute(
      "position",
      new BufferAttribute(this.starPositions, 3)
    );
    this.stars = new Points(
      stars,
      new PointsMaterial({
        color,
        size: 0.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    );
    this.root.add(this.stars);
    if (curve)
      this.placeAlong((t, out) => out.copy(curve.getPoint(t)));
    this.root.visible = false;
  }

  setEra(era: number): void {
    SYMBOLS[this.owner].forEach((symbol, index) =>
      this.glyphs[index].setText(symbol, era, 1, this.color, this.owner)
    );
  }

  setSize(factor: number): void {
    this.glyphs.forEach((glyph, index) =>
      glyph.root.scale.setScalar((index % 3 === 0 ? 0.4 : 0.33) * factor)
    );
  }

  placeAlong(
    sample: (t: number, out: Vector3) => void,
    stemLength = 0.56,
    variation = 0.14,
    zOffset = 0
  ): void {
    this.glyphs.forEach((_, index) => {
      sample(0.12 + index * 0.13, this.point);
      const height = this.point.y + stemLength + (index % 3) * variation;
      this.anchors[index].set(this.point.x, height, this.point.z + zOffset);
      const startY = this.point.y + 0.03;
      for (let dash = 0; dash < 4; dash++) {
        const y = startY + dash * (height - startY) / 4;
        const offset = (index * 4 + dash) * 6;
        this.stemPositions.set(
          [this.point.x, y, this.point.z + zOffset,
            this.point.x, y + Math.min(0.055, stemLength * 0.18), this.point.z + zOffset],
          offset
        );
      }
      this.starPositions.set(
        [this.point.x, height + 0.11, this.point.z + zOffset],
        index * 3
      );
    });
    this.stems.geometry.attributes.position.needsUpdate = true;
    this.stars.geometry.attributes.position.needsUpdate = true;
  }

  update(seconds: number, cameraQuaternion?: Quaternion): void {
    this.glyphs.forEach((glyph, index) => {
      glyph.update(seconds, 0);
      glyph.root.position.copy(this.anchors[index]);
      glyph.root.position.y += Math.sin(seconds * 0.8 + index * 1.7) * 0.035;
      if (cameraQuaternion) glyph.root.quaternion.copy(cameraQuaternion);
    });
  }

  destroy(): void {
    this.root.removeFromParent();
    this.glyphs.forEach((glyph) => glyph.destroy());
    this.stems.geometry.dispose();
    this.stems.material.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
  }
}

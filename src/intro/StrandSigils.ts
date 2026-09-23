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
  private readonly heights: number[] = [];

  constructor(
    curve: Curve<Vector3>,
    owner: number,
    color: number,
    atlases: CanvasTexture[],
    era: number
  ) {
    const stemPositions: number[] = [];
    const starPositions: number[] = [];
    SYMBOLS[owner].forEach((symbol, index) => {
      const t = 0.12 + index * 0.13;
      const point = curve.getPoint(t);
      const height = 0.62 + (index % 3) * 0.14;
      const glyph = new GlyphRibbon(atlases);
      glyph.init();
      glyph.setText(symbol, era, 1, color, owner);
      glyph.root.scale.setScalar(index % 3 === 0 ? 0.4 : 0.33);
      glyph.root.position.set(point.x, height, point.z);
      this.glyphs.push(glyph);
      this.heights.push(height);
      this.root.add(glyph.root);

      for (let dash = 0; dash < 4; dash++) {
        const y = 0.08 + dash * (height - 0.16) / 4;
        stemPositions.push(point.x, y, point.z, point.x, y + 0.055, point.z);
      }
      starPositions.push(point.x, height + 0.11, point.z);
    });
    const stems = new BufferGeometry();
    stems.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(stemPositions), 3)
    );
    this.root.add(
      new LineSegments(
        stems,
        new LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          blending: AdditiveBlending,
        })
      )
    );
    const stars = new BufferGeometry();
    stars.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(starPositions), 3)
    );
    this.root.add(
      new Points(
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
      )
    );
    this.root.visible = false;
  }

  update(seconds: number, cameraQuaternion: Group["quaternion"]): void {
    this.glyphs.forEach((glyph, index) => {
      glyph.update(seconds, 0);
      glyph.root.position.y =
        this.heights[index] + Math.sin(seconds * 0.8 + index * 1.7) * 0.035;
      glyph.root.quaternion.copy(cameraQuaternion);
    });
  }
}

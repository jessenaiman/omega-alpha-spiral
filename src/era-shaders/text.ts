import {
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  type CanvasTexture,
} from "three";
import type { SpeakerId } from "../dialogue/personas";
import { GLYPHS, makeAtlas } from "../core/lettering/generate";
import {
  applyEraTextMaterial,
  createEraTextMaterial,
  resolveEraShader,
  type EraShaderDefinition,
  type EraShaderSurface,
} from ".";

export type Layout = "manuscript" | "fragments" | "passage";
const CAPACITY = 256;

export class GhostLetters {
  readonly root = new Group();
  private atlas: CanvasTexture;
  private eraShader: EraShaderDefinition;
  private geometry = new PlaneGeometry(1, 1);
  private glyphs = new InstancedBufferAttribute(new Float32Array(CAPACITY), 1);
  private material: ShaderMaterial;
  private mesh: InstancedMesh;
  private surface: EraShaderSurface;
  private dummy = new Object3D();
  private text = "";
  opacity = 1;

  constructor(
    readonly speaker: SpeakerId,
    color: string,
    eraShaderId = "dec-vt100-ascii-terminal",
    surface: EraShaderSurface = "dialogue"
  ) {
    this.surface = surface;
    this.eraShader = resolveEraShader(eraShaderId);
    this.atlas = makeAtlas(this.eraShader);
    this.geometry.setAttribute("aGlyph", this.glyphs);
    this.material = createEraTextMaterial(
      { id: this.eraShader.id, surface: this.surface },
      this.atlas,
      color
    );
    this.mesh = new InstancedMesh(this.geometry, this.material, CAPACITY);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.root.add(this.mesh);
  }

  setColor(color: string) {
    (this.material.uniforms.uColor.value as Color).set(color);
  }

  /** Accepts a canonical era-shader id. */
  setEra(id: string) {
    if (this.eraShader.id === id) return;
    const next = resolveEraShader(id);
    if (next.id === this.eraShader.id) return;
    this.eraShader = next;
    this.atlas.dispose();
    this.atlas = makeAtlas(next);
    applyEraTextMaterial(
      this.material,
      { id: next.id, surface: this.surface },
      this.atlas
    );
  }

  setText(text: string) {
    this.text = text.slice(0, CAPACITY);
    this.mesh.count = this.text.length;
    for (let i = 0; i < this.text.length; i++)
      this.glyphs.setX(i, Math.max(0, GLYPHS.indexOf(this.text[i])));
    this.glyphs.needsUpdate = true;
  }

  update(time: number, layout: Layout, reduced: boolean) {
    let row = 0,
      col = 0,
      word = 0;
    const step = this.eraShader.tracking;
    for (let i = 0; i < this.text.length; i++) {
      const ch = this.text[i];
      if (ch === "\n") {
        row++;
        col = 0;
        word++;
      }
      let x = (col - 12) * step,
        y = 0.5 - row * 0.7,
        z = 0,
        rz = 0,
        ry = 0;
      const isSystem = this.speaker === "omega";
      if (!isSystem) {
        if (this.speaker === "shadow") {
          const angle = [-0.055, 0.09, -0.07, 0.065][row % 4];
          x += row % 2 === 0 ? -0.3 : 0.55;
          y += x * Math.tan(angle);
          rz = angle;
        }
        if (this.speaker === "ambition") {
          const t = Math.min(col / 25, 1);
          y += 0.26 * Math.sin(t * Math.PI);
          z = t * t * 1.8;
          rz = 0.055 * Math.cos(t * Math.PI);
          ry = -t * 0.17;
        }
        if (layout === "fragments") {
          if (this.speaker === "light") {
            z += col * 0.04 + row * 0.4;
          } else {
            x += word * 0.11;
            y += Math.floor(word / 3) * 0.12;
            z += word * 0.32;
          }
        }
        if (layout === "passage") {
          z -= row * 2.4;
          y -= row * 0.04;
          if (this.speaker === "light") {
            x += row * 0.55;
          }
          if (this.speaker === "shadow") {
            x += row % 2 === 0 ? -1.1 : 0.8;
          }
          if (this.speaker === "ambition") {
            x += Math.sin(row * 0.8) * 1.1;
            z += col * 0.07;
          }
        }
        if (!reduced) {
          y += Math.sin(time * 0.6 + row * 0.5) * 0.045;
          z += Math.sin(time * 0.4 + word * 0.3) * 0.08;
        }
      }
      if (ch === " ") word++;
      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(0, ry, rz);
      const visible = ch !== "\n" && ch !== " ";
      // Keep glyph quads inside their advance so DOS blocks do not overlap.
      this.dummy.scale.set(visible ? step * 0.98 : 0, visible ? 0.68 : 0, 1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      if (ch !== "\n") col++;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.material.uniforms.uTime.value = reduced ? 0 : time;
    this.material.uniforms.uOpacity.value = this.opacity;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.atlas.dispose();
  }
}

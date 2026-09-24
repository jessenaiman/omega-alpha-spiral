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
import type { SpeakerId } from "./profiles";
import { GLYPHS, makeAtlas } from "../../core/lettering/generate";
import { resolveTradition, type Tradition } from "../../core/lettering/traditions";

export type Layout = "manuscript" | "fragments" | "passage";
const CAPACITY = 256;

export class GhostLetters {
  readonly root = new Group();
  private atlas: CanvasTexture;
  private tradition: Tradition;
  private geometry = new PlaneGeometry(1, 1);
  private glyphs = new InstancedBufferAttribute(new Float32Array(CAPACITY), 1);
  private material: ShaderMaterial;
  private mesh: InstancedMesh;
  private dummy = new Object3D();
  private text = "";
  opacity = 1;

  constructor(
    readonly speaker: SpeakerId,
    color: string,
    traditionId = "dec-vt100-ascii-terminal"
  ) {
    this.tradition = resolveTradition(traditionId);
    this.atlas = makeAtlas(this.tradition);
    this.geometry.setAttribute("aGlyph", this.glyphs);
    this.material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uAtlas: { value: this.atlas },
        uColor: { value: new Color(color) },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uScan: { value: this.tradition.effects.scan },
        uDots: { value: this.tradition.effects.dots },
        uHalo: { value: this.tradition.effects.halo },
        uCell: { value: [...this.tradition.cell] },
      },
      vertexShader: `attribute float aGlyph; varying vec2 vUv; varying float vGlyph;
        void main(){vUv=uv; vGlyph=aGlyph; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform sampler2D uAtlas; uniform vec3 uColor; uniform vec2 uCell; uniform float uTime,uOpacity,uScan,uDots,uHalo; varying vec2 vUv; varying float vGlyph;
        void main(){
          vec2 cell=vec2(mod(vGlyph,16.0),6.0-floor(vGlyph/16.0));
          vec2 p=(cell+vUv)/vec2(16.0,7.0);
          float a=texture2D(uAtlas,p).a;
          vec2 d=vec2(1.0)/(uCell*vec2(16.0,7.0));
          float halo=(texture2D(uAtlas,p+d).a+texture2D(uAtlas,p-d).a+texture2D(uAtlas,p+vec2(d.x,-d.y)).a+texture2D(uAtlas,p+vec2(-d.x,d.y)).a)*uHalo;
          vec2 dotPosition=fract(vUv*uCell)-.5;
          a*=mix(1.0,1.0-smoothstep(.32,.52,length(dotPosition)),uDots);
          float scan=1.0-uScan*(.5+.5*sin(vUv.y*170.0-uTime*.4));
          float alpha=(a+halo)*uOpacity*scan;
          if(alpha<.008) discard;
          gl_FragColor=vec4(uColor,alpha);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new InstancedMesh(this.geometry, this.material, CAPACITY);
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.root.add(this.mesh);
  }

  setColor(color: string) {
    (this.material.uniforms.uColor.value as Color).set(color);
  }

  /** Accepts a tradition id or a retired era id; both resolve. */
  setEra(id: string) {    if (this.tradition.id === id) return;
    const next = resolveTradition(id);
    if (next.id === this.tradition.id) return;
    this.tradition = next;
    this.atlas.dispose();
    this.atlas = makeAtlas(next);
    this.material.uniforms.uAtlas.value = this.atlas;
    this.material.uniforms.uScan.value = next.effects.scan;
    this.material.uniforms.uDots.value = next.effects.dots;
    this.material.uniforms.uHalo.value = next.effects.halo;
    this.material.uniforms.uCell.value = [...next.cell];
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
    const step = this.tradition.tracking;
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

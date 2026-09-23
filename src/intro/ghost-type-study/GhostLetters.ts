import {
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import type { SpeakerId } from "./profiles";

export type Layout = "manuscript" | "fragments" | "passage";
export type Era = "phosphor" | "dos" | "gui";
const CAPACITY = 256;

// Exact readable glyphs are generated locally; image concepts never supply alphabet pixels.
function makeAtlas(era: Era): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${era === "dos" ? "bold " : ""}72px ${era === "gui" ? "Consolas" : "Courier New"}, monospace`;
  for (let i = 0; i < 96; i++)
    ctx.fillText(
      String.fromCharCode(i + 32),
      (i % 16) * 64 + 32,
      Math.floor(i / 16) * 128 + 65
    );
  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export class GhostLetters {
  readonly root = new Group();
  private atlas: CanvasTexture;
  private geometry = new PlaneGeometry(1, 1);
  private glyphs = new InstancedBufferAttribute(new Float32Array(CAPACITY), 1);
  private material: ShaderMaterial;
  private mesh: InstancedMesh;
  private dummy = new Object3D();
  private text = "";
  private era: Era = "phosphor";
  opacity = 1;

  constructor(
    readonly speaker: SpeakerId,
    color: string
  ) {
    this.atlas = makeAtlas("phosphor");
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
        uScan: { value: speaker === "omega" ? 0.2 : 0.025 },
      },
      vertexShader: `attribute float aGlyph; varying vec2 vUv; varying float vGlyph;
        void main(){vUv=uv; vGlyph=aGlyph; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform sampler2D uAtlas; uniform vec3 uColor; uniform float uTime,uOpacity,uScan; varying vec2 vUv; varying float vGlyph;
        void main(){
          vec2 cell=vec2(mod(vGlyph,16.0),5.0-floor(vGlyph/16.0));
          vec2 p=(cell+vUv)/vec2(16.0,6.0);
          float a=texture2D(uAtlas,p).a;
          vec2 d=vec2(1.0/1024.0,1.0/768.0);
          float halo=(texture2D(uAtlas,p+d).a+texture2D(uAtlas,p-d).a+texture2D(uAtlas,p+vec2(d.x,-d.y)).a+texture2D(uAtlas,p+vec2(-d.x,d.y)).a)*.035;
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

  setEra(era: Era) {
    if (this.speaker !== "omega" || this.era === era) return;
    this.era = era;
    this.atlas.dispose();
    this.atlas = makeAtlas(era);
    this.material.uniforms.uAtlas.value = this.atlas;
    this.material.uniforms.uScan.value =
      era === "phosphor" ? 0.2 : era === "dos" ? 0.05 : 0;
    this.material.uniforms.uColor.value.set(
      era === "phosphor" ? "#9ec9b2" : "#d5e8f2"
    );
  }

  setText(text: string) {
    this.text = text.slice(0, CAPACITY);
    this.mesh.count = this.text.length;
    for (let i = 0; i < this.text.length; i++)
      this.glyphs.setX(
        i,
        Math.max(0, Math.min(95, this.text.charCodeAt(i) - 32))
      );
    this.glyphs.needsUpdate = true;
  }

  update(time: number, layout: Layout, reduced: boolean) {
    let row = 0,
      col = 0,
      word = 0;
    const step = 0.32;
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
      this.dummy.scale.set(visible ? 0.46 : 0, visible ? 0.68 : 0, 1);
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

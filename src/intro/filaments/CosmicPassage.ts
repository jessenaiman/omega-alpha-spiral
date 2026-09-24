import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
} from "three";

const vertex = /* glsl */ `
  attribute float tail;
  uniform float uDistance;
  uniform float uTravel;
  varying float vFade;
  void main() {
    vec3 p = position;
    p.z = mod(position.z + uDistance, 48.0) - 40.0;
    p.z -= tail * (0.1 + uTravel * 2.4);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(20.0 / max(1.0, -view.z), 1.0, 4.0);
    vFade = (1.0 - smoothstep(8.0, 48.0, -view.z)) * (1.0 - tail * 0.9);
  }
`;
const fragment = /* glsl */ `
  uniform float uTravel;
  varying float vFade;
  void main() {
    float alpha = vFade * uTravel;
    #ifdef STAR_POINTS
      alpha *= exp(-dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5) * 20.0);
    #endif
    gl_FragColor = vec4(vec3(0.55, 0.71, 0.86), alpha * 0.65);
    #include <colorspace_fragment>
  }
`;

/** Quiet parallax points and depth streaks, used only while passing into space. */
export class CosmicPassage {
  readonly root = new Group();
  private readonly stars: Points<BufferGeometry, ShaderMaterial>;
  private readonly traces: LineSegments<BufferGeometry, ShaderMaterial>;
  private readonly uniforms = {
    uDistance: { value: 0 },
    uTravel: { value: 0 },
  };
  constructor() {
    const points: number[] = [],
      lines: number[] = [],
      tails: number[] = [];
    for (let i = 0; i < 240; i++) {
      const angle = i * 2.399963;
      const radius = 1.1 + (i % 31) * 0.43;
      const p = [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -((i * 7.13) % 48),
      ];
      points.push(...p);
      lines.push(...p, ...p);
      tails.push(0, 1);
    }
    const g = (p: number[], t: number[]): BufferGeometry =>
      new BufferGeometry()
        .setAttribute("position", new Float32BufferAttribute(p, 3))
        .setAttribute("tail", new Float32BufferAttribute(t, 1));
    const m = (points: boolean): ShaderMaterial =>
      new ShaderMaterial({
        uniforms: this.uniforms,
        defines: points ? { STAR_POINTS: 1 } : {},
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
    this.stars = new Points(g(points, Array(240).fill(0)), m(true));
    this.traces = new LineSegments(g(lines, tails), m(false));
    this.stars.frustumCulled = this.traces.frustumCulled = false;
    this.root.add(this.stars, this.traces);
  }
  update(delta: number, travel: number): void {
    this.uniforms.uTravel.value = travel;
    this.uniforms.uDistance.value += delta * (0.8 + travel * 15);
    this.root.visible = travel > 0.001;
  }
  dispose(): void {
    this.root.removeFromParent();
    for (const object of [this.stars, this.traces]) {
      object.geometry.dispose();
      object.material.dispose();
    }
  }
}

import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, Scene, ShaderMaterial } from 'three';

import { createRng, type SeededRng } from '../core/random';

const CAPACITY: number = 360;
const VERTEX: string = `
  attribute vec2 sparkle;
  uniform float time;
  uniform float speed;
  uniform float size;
  varying float brightness;
  void main() {
    float depth = 3.0 + mod(position.z - time * speed, 30.0);
    vec3 point = vec3(position.xy, -depth);
    vec4 view = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(size * sparkle.y * 32.0 / depth, 1.0, 12.0);
    brightness = smoothstep(3.0, 6.0, depth) * (1.0 - smoothstep(27.0, 33.0, depth));
    brightness *= .2 + .8 * pow(.5 + .5 * sin(time * .65 + sparkle.x), 6.0);
  }
`;
const FRAGMENT: string = `
  uniform float intensity;
  varying float brightness;
  void main() {
    vec2 p = (gl_PointCoord - .5) * 2.0;
    float radius = length(p);
    float core = pow(max(0.0, 1.0 - radius), 3.0);
    float cross = exp(-abs(p.x) * 22.0) * exp(-abs(p.y) * 4.0)
                + exp(-abs(p.y) * 22.0) * exp(-abs(p.x) * 4.0);
    float alpha = (core + cross * .22) * brightness * intensity;
    gl_FragColor = vec4(.76, .86, 1.0, alpha);
    #include <colorspace_fragment>
  }
`;

/** One seeded particle draw, independent of the plate and the narrative clock. */
export class Starfield {
  public readonly settings: { speed: number; intensity: number; size: number; count: number } = { speed: 0.36, intensity: 0.7, size: 2.4, count: CAPACITY };
  private _points: Points<BufferGeometry, ShaderMaterial> | null = null;

  public init(scene: Scene, seed: number): void {
    const rng: SeededRng = createRng(seed).fork('intro-starfield');
    const positions: number[] = [];
    const sparkles: number[] = [];
    for (let i: number = 0; i < CAPACITY; i += 1) {
      positions.push((rng.next() - 0.5) * 36, (rng.next() - 0.5) * 22, rng.next() * 30);
      sparkles.push(rng.next() * Math.PI * 2, 0.65 + rng.next());
    }
    const geometry: BufferGeometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('sparkle', new Float32BufferAttribute(sparkles, 2));
    const material: ShaderMaterial = new ShaderMaterial({
      uniforms: { time: { value: 0 }, speed: { value: this.settings.speed }, intensity: { value: this.settings.intensity }, size: { value: this.settings.size } },
      vertexShader: VERTEX, fragmentShader: FRAGMENT,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    this._points = new Points(geometry, material);
    this._points.name = 'Runtime_Starfield';
    this._points.frustumCulled = false;
    this._points.renderOrder = -10;
    this._points.visible = false;
    scene.add(this._points);
  }

  public update(seconds: number, isVisible: boolean, isReduced: boolean, cameraZ: number): void {
    if (!this._points) return;
    this._points.position.z = cameraZ;
    this._points.visible = isVisible && !isReduced;
    const uniforms = this._points.material.uniforms;
    uniforms.time.value = isReduced ? 0 : seconds;
    uniforms.speed.value = this.settings.speed;
    uniforms.intensity.value = this.settings.intensity;
    uniforms.size.value = this.settings.size;
    this._points.geometry.setDrawRange(0, Math.max(0, Math.min(CAPACITY, Math.floor(this.settings.count))));
  }

  public getState(): object {
    return { time: this._points?.material.uniforms.time.value ?? 0, visible: this._points?.visible ?? false, count: this._points?.geometry.drawRange.count ?? 0 };
  }

  public destroy(): void {
    this._points?.geometry.dispose();
    this._points?.material.dispose();
    this._points?.removeFromParent();
    this._points = null;
  }
}

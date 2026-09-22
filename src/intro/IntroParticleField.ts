import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, NormalBlending,
  PlaneGeometry, Points, ShaderMaterial,
} from 'three';

const TAU: number = Math.PI * 2;
const DESKTOP_LIGHT_PARTICLES: number = 11000;
const DESKTOP_DARK_PARTICLES: number = 9000;
const MOBILE_LIGHT_PARTICLES: number = 5200;
const MOBILE_DARK_PARTICLES: number = 4300;

const NEBULA_VERTEX: string = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT: string = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uEra;
  uniform float uReduced;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int octave = 0; octave < 4; octave++) {
      value += noise21(p) * amplitude;
      p = mat2(1.62, 1.18, -1.18, 1.62) * p + 0.17;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 p = (vUv * 2.0 - 1.0) * vec2(1.7, 1.0);
    float time = uTime * mix(1.0, 0.0, uReduced);
    vec2 drift = vec2(time * 0.006, -time * 0.004);
    float broad = fbm(p * 1.18 + drift);
    float thread = fbm(p * 2.7 - drift * 1.6 + broad * 0.42);
    float cloud = smoothstep(0.48, 0.82, broad * 0.66 + thread * 0.56);
    float readingCorridor = smoothstep(0.12, 0.72, length(p * vec2(0.72, 1.18)));
    float vignette = 1.0 - smoothstep(0.82, 1.9, length(p));
    float capability = 0.64 + min(uEra, 5.0) * 0.055;
    float alpha = cloud * mix(0.22, 1.0, readingCorridor) * vignette * uReveal * capability * 0.2;
    vec3 cold = vec3(0.055, 0.11, 0.23);
    vec3 warm = vec3(0.22, 0.11, 0.075);
    vec3 color = mix(cold, warm, smoothstep(0.54, 0.78, thread));
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const LIGHT_VERTEX: string = `
  attribute float aSeed;
  attribute float aKind;
  attribute float aProgress;
  attribute float aSize;
  uniform float uTime;
  uniform float uEra;
  uniform float uPulse;
  uniform float uOwner;
  uniform float uStarReveal;
  uniform float uDisintegrate;
  uniform float uReduced;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vTemperature;

  void main() {
    vec3 p = position;
    float time = uTime * mix(1.0, 0.0, uReduced);
    float phase = aSeed * 6.2831853;
    float drift = time * (0.018 + aSeed * 0.014);
    float depth = smoothstep(-1.8, 4.8, p.z);
    float orbit = drift * (0.16 + depth * 0.22);
    mat2 rotation = mat2(cos(orbit), -sin(orbit), sin(orbit), cos(orbit));
    p.xy = rotation * p.xy;
    p.x += sin(phase + drift + p.y * 0.16) * (0.035 + aSeed * 0.12) * (0.7 + depth);
    p.y += cos(phase * 1.31 - drift * 0.73 + p.x * 0.12) * (0.028 + aSeed * 0.09) * (0.72 + depth);
    p.z += sin(phase * 2.1 + drift) * 0.12;

    float ownerDirection = (uOwner - 1.0) * 0.08;
    p.x += ownerDirection * uPulse * (0.4 + depth);
    p.xy *= 1.0 + uPulse * (0.025 + 0.025 * sin(phase));
    p.xy = mix(p.xy, p.xy * 0.16, uDisintegrate);
    p.z -= uDisintegrate * (1.4 + aSeed * 3.2);

    float cold = 1.0 - step(0.5, aKind);
    float warm = step(0.5, aKind) * (1.0 - step(1.5, aKind));
    float distant = step(1.5, aKind);
    vColor = cold * vec3(0.68, 0.82, 1.0)
      + warm * vec3(1.0, 0.82, 0.56)
      + distant * vec3(0.5, 0.62, 0.82);
    vTemperature = aKind;
    float depthBand = aProgress * 0.74;
    float reveal = smoothstep(depthBand, depthBand + 0.18, uStarReveal);
    float eraCapability = 0.56 + min(uEra, 5.0) * 0.07;
    vAlpha = mix(0.16, 0.74, fract(aSeed * 31.7)) * reveal * eraCapability * (1.0 - uDisintegrate * 0.38);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (150.0 / max(1.0, -mvPosition.z)), 0.7, 4.8);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LIGHT_FRAGMENT: string = `
  uniform float uEra;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vTemperature;
  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float core = 1.0 - smoothstep(0.04, 0.5, radius);
    float spark = 1.0 - smoothstep(0.0, 0.48, max(abs(point.x), abs(point.y)));
    float pixel = step(max(abs(point.x), abs(point.y)), 0.42);
    float modern = smoothstep(2.0, 5.0, uEra);
    float starShape = mix(pixel, max(core, spark * 0.34), modern);
    float twinkle = 0.92 + 0.08 * sin(vTemperature * 2.4 + gl_FragCoord.x * 0.013 + gl_FragCoord.y * 0.009);
    float alpha = starShape * vAlpha * twinkle;
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(vColor * (0.7 + core * 0.8), alpha);
    #include <colorspace_fragment>
  }
`;

const DARK_VERTEX: string = `
  attribute vec3 aTarget;
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uFormation;
  uniform float uDisintegrate;
  uniform float uPulse;
  uniform float uOwner;
  uniform float uReduced;
  varying float vAlpha;

  void main() {
    float time = uTime * mix(1.0, 0.0, uReduced);
    float phase = aSeed * 6.2831853;
    vec3 freePosition = position;
    freePosition.x += sin(phase + time * 0.13 + position.y * 0.4) * 0.42;
    freePosition.y += cos(phase * 1.7 - time * 0.09 + position.x * 0.31) * 0.34;
    freePosition.z += sin(phase * 2.4 + time * 0.08) * 0.28;

    float settle = smoothstep(0.0, 1.0, uFormation);
    vec3 held = aTarget;
    float edge = max(abs(aTarget.x), abs(aTarget.y));
    held.xy += vec2(sin(phase + time * 0.2), cos(phase * 1.3 - time * 0.17)) * (0.012 + edge * 0.025) * (1.0 - uReduced);
    vec3 p = mix(freePosition, held, settle);

    float ownerBias = (uOwner - 1.0) * 0.22;
    float pulseWave = sin(phase * 3.0 + uPulse * 5.0);
    p.x += ownerBias * uPulse * pulseWave;
    p.y += uPulse * 0.07 * cos(phase * 2.0);

    vec2 away = normalize(aTarget.xy + vec2(0.0001));
    p.xy += away * uDisintegrate * (0.8 + aSeed * 3.2);
    p.x += sin(phase + uDisintegrate * 4.0) * uDisintegrate * 0.65;
    p.z -= uDisintegrate * (1.4 + aSeed * 3.8);

    vAlpha = settle * (0.3 + aSeed * 0.58) * (1.0 - uDisintegrate * 0.72);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (145.0 / max(1.0, -mvPosition.z)), 1.0, 7.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const DARK_FRAGMENT: string = `
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.12, 0.5, radius)) * vAlpha;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(0.001, 0.003, 0.005, alpha);
  }
`;

const VEIL_VERTEX: string = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VEIL_FRAGMENT: string = `
  uniform float uTime;
  uniform float uFormation;
  uniform float uDisintegrate;
  uniform float uRipple;
  uniform float uReduced;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float time = uTime * mix(1.0, 0.0, uReduced);
    float grain = noise21(p * 8.0 + vec2(time * 0.035, -time * 0.024));
    float coarse = noise21(p * 2.7 - vec2(time * 0.018, time * 0.012));
    float eventRadius = length(vec2(p.x, p.y / 0.78));
    float breathingEdge = (grain - 0.5) * 0.075 + sin(time * 0.22 + p.y * 5.0) * 0.008;
    float inside = 1.0 - smoothstep(0.86, 0.98, eventRadius + breathingEdge);
    float rim = 1.0 - smoothstep(0.018, 0.085, abs(eventRadius - 0.9 - breathingEdge));

    float gathering = smoothstep(coarse * 0.58 - 0.18, coarse * 0.58 + 0.18, uFormation);
    float pinholes = smoothstep(0.12, 0.48, grain + uFormation * 0.45);
    float rippleRadius = (1.0 - uRipple) * 1.35;
    float rippleRing = 1.0 - smoothstep(0.025, 0.095, abs(length(p) - rippleRadius));
    float disintegrated = mix(1.0, 0.16 + grain * 0.24, uDisintegrate);
    float alpha = inside * gathering * pinholes * disintegrated * (0.78 + uFormation * 0.16);
    alpha = max(alpha, rim * uFormation * 0.26 * (1.0 - uDisintegrate));
    alpha *= 1.0 - rippleRing * uRipple * 0.28;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(vec3(0.002, 0.006, 0.008), alpha);
  }
`;

export interface ParticleFieldState {
  formation: number;
  disintegrate: number;
  era: number;
  starReveal: number;
  reduced: boolean;
}

export class IntroParticleField {
  public readonly root: Group = new Group();
  private readonly _fieldRoot: Group = new Group();
  private readonly _panelRoot: Group = new Group();
  private _lightGeometry: BufferGeometry | null = null;
  private _nebulaGeometry: PlaneGeometry | null = null;
  private _darkGeometry: BufferGeometry | null = null;
  private _veilGeometry: PlaneGeometry | null = null;
  private _lightMaterial: ShaderMaterial | null = null;
  private _nebulaMaterial: ShaderMaterial | null = null;
  private _darkMaterial: ShaderMaterial | null = null;
  private _veilMaterial: ShaderMaterial | null = null;
  private _lightCount: number = 0;
  private _darkCount: number = 0;
  private _pulse: number = 0;
  private _owner: number = 1;
  private _lastSeconds: number = 0;
  private _formation: number = 0;

  public init(parent: Group): void {
    const isMobile: boolean = window.innerWidth < 760;
    this._lightCount = isMobile ? MOBILE_LIGHT_PARTICLES : DESKTOP_LIGHT_PARTICLES;
    this._darkCount = isMobile ? MOBILE_DARK_PARTICLES : DESKTOP_DARK_PARTICLES;
    this._createNebula();
    this._createLightField(this._lightCount);
    this._createDarkField(this._darkCount);
    this._createVeil();
    this.root.add(this._fieldRoot, this._panelRoot);
    parent.add(this.root);
  }

  public setFieldWidth(width: number): void {
    this._fieldRoot.scale.x = Math.max(0.48, Math.min(1, width / 8));
  }

  public setPanelTransform(x: number, y: number, z: number, width: number, height: number, rx: number, ry: number, rz: number): void {
    this._panelRoot.position.set(x, y, z);
    this._panelRoot.scale.set(width, height, 1);
    this._panelRoot.rotation.set(rx, ry, rz);
  }

  public pulse(owner: number): void {
    this._owner = Math.max(0, Math.min(2, owner));
    this._pulse = 1;
  }

  public reset(): void {
    this._pulse = 0;
    this._owner = 1;
    this._lastSeconds = 0;
  }

  public update(elapsedMs: number, state: ParticleFieldState): void {
    if (!this._lightMaterial || !this._darkMaterial || !this._veilMaterial) return;
    const seconds: number = elapsedMs / 1000;
    const delta: number = this._lastSeconds === 0 ? 0 : Math.min(0.1, Math.max(0, seconds - this._lastSeconds));
    this._lastSeconds = seconds;
    this._pulse = Math.max(0, this._pulse - delta * 0.72);
    const disintegrate: number = state.reduced ? 0 : Math.max(0, Math.min(1, state.disintegrate));
    const formation: number = Math.max(0, Math.min(1, state.formation));
    const starReveal: number = Math.max(0, Math.min(1, state.starReveal));
    this._formation = formation;
    for (const material of [this._lightMaterial, this._darkMaterial, this._veilMaterial]) {
      material.uniforms.uTime.value = seconds;
      material.uniforms.uPulse.value = this._pulse;
      material.uniforms.uReduced.value = state.reduced ? 1 : 0;
      material.uniforms.uDisintegrate.value = disintegrate;
    }
    this._lightMaterial.uniforms.uEra.value = Math.max(0, Math.min(5, state.era));
    this._lightMaterial.uniforms.uOwner.value = this._owner;
    this._lightMaterial.uniforms.uStarReveal.value = starReveal;
    if (this._nebulaMaterial) {
      this._nebulaMaterial.uniforms.uTime.value = seconds;
      this._nebulaMaterial.uniforms.uReveal.value = starReveal;
      this._nebulaMaterial.uniforms.uEra.value = Math.max(0, Math.min(5, state.era));
      this._nebulaMaterial.uniforms.uReduced.value = state.reduced ? 1 : 0;
    }
    this._darkMaterial.uniforms.uFormation.value = formation;
    this._darkMaterial.uniforms.uOwner.value = this._owner;
    this._veilMaterial.uniforms.uFormation.value = formation;
    this._veilMaterial.uniforms.uRipple.value = this._pulse;
    this._panelRoot.visible = formation > 0.002 || disintegrate > 0;
  }

  public getDiagnostics(): { lightParticles: number; darkParticles: number; drawCalls: number; surfaceFormation: number } {
    return { lightParticles: this._lightCount, darkParticles: this._darkCount, drawCalls: 2 + (this._formation > 0.002 ? 2 : 0), surfaceFormation: this._formation };
  }

  public destroy(): void {
    this.root.removeFromParent();
    this._lightGeometry?.dispose();
    this._nebulaGeometry?.dispose();
    this._darkGeometry?.dispose();
    this._veilGeometry?.dispose();
    this._lightMaterial?.dispose();
    this._nebulaMaterial?.dispose();
    this._darkMaterial?.dispose();
    this._veilMaterial?.dispose();
  }

  private _createNebula(): void {
    this._nebulaGeometry = new PlaneGeometry(24, 15);
    this._nebulaMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uReveal: { value: 0 }, uEra: { value: 0 }, uReduced: { value: 0 },
      },
      vertexShader: NEBULA_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    });
    const nebula: Mesh<PlaneGeometry, ShaderMaterial> = new Mesh(this._nebulaGeometry, this._nebulaMaterial);
    nebula.position.z = -4.6;
    nebula.renderOrder = -40;
    this._fieldRoot.add(nebula);
  }

  private _createLightField(count: number): void {
    const positions: Float32Array = new Float32Array(count * 3);
    const seeds: Float32Array = new Float32Array(count);
    const kinds: Float32Array = new Float32Array(count);
    const progresses: Float32Array = new Float32Array(count);
    const sizes: Float32Array = new Float32Array(count);
    const random = this._random(472);
    for (let index: number = 0; index < count; index += 1) {
      const kind: number = Math.floor(random() * 3);
      const seed: number = random();
      const angle: number = random() * TAU;
      const radius: number = 3.1 + Math.pow(random(), 0.68) * 13.8;
      positions[index * 3] = Math.cos(angle) * radius * (1.04 + random() * 0.42);
      positions[index * 3 + 1] = Math.sin(angle) * radius * (0.52 + random() * 0.2);
      positions[index * 3 + 2] = -3.8 + random() * 10.4;
      progresses[index] = Math.min(1, Math.max(0, (positions[index * 3 + 2] + 3.8) / 10.4 * 0.65 + random() * 0.35));
      seeds[index] = seed;
      kinds[index] = kind;
      sizes[index] = 0.45 + random() * (kind === 2 ? 1.1 : 1.8);
    }
    this._lightGeometry = new BufferGeometry();
    this._lightGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    this._lightGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    this._lightGeometry.setAttribute('aKind', new BufferAttribute(kinds, 1));
    this._lightGeometry.setAttribute('aProgress', new BufferAttribute(progresses, 1));
    this._lightGeometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
    this._lightMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uEra: { value: 0 }, uPulse: { value: 0 },
        uOwner: { value: 1 }, uStarReveal: { value: 0 },
        uDisintegrate: { value: 0 }, uReduced: { value: 0 },
      },
      vertexShader: LIGHT_VERTEX,
      fragmentShader: LIGHT_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    });
    const points: Points<BufferGeometry, ShaderMaterial> = new Points(this._lightGeometry, this._lightMaterial);
    points.frustumCulled = false;
    points.renderOrder = -30;
    this._fieldRoot.add(points);
  }

  private _createDarkField(count: number): void {
    const positions: Float32Array = new Float32Array(count * 3);
    const targets: Float32Array = new Float32Array(count * 3);
    const seeds: Float32Array = new Float32Array(count);
    const sizes: Float32Array = new Float32Array(count);
    const random = this._random(9472);
    for (let index: number = 0; index < count; index += 1) {
      const seed: number = random();
      const angle: number = random() * TAU;
      const radius: number = 1.4 + random() * 5.6;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[index * 3 + 2] = -0.08 + random() * 0.12;
      const targetAngle: number = random() * TAU;
      const targetRadius: number = Math.sqrt(random()) * 0.94;
      targets[index * 3] = Math.cos(targetAngle) * targetRadius;
      targets[index * 3 + 1] = Math.sin(targetAngle) * targetRadius * 0.78;
      targets[index * 3 + 2] = 0.015 + random() * 0.035;
      seeds[index] = seed;
      sizes[index] = 0.8 + random() * 2.4;
    }
    this._darkGeometry = new BufferGeometry();
    this._darkGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    this._darkGeometry.setAttribute('aTarget', new BufferAttribute(targets, 3));
    this._darkGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    this._darkGeometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
    this._darkMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uFormation: { value: 0 }, uDisintegrate: { value: 0 },
        uPulse: { value: 0 }, uOwner: { value: 1 }, uReduced: { value: 0 },
      },
      vertexShader: DARK_VERTEX,
      fragmentShader: DARK_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: NormalBlending,
      toneMapped: false,
    });
    const points: Points<BufferGeometry, ShaderMaterial> = new Points(this._darkGeometry, this._darkMaterial);
    points.frustumCulled = false;
    points.renderOrder = -20;
    this._panelRoot.add(points);
  }

  private _createVeil(): void {
    this._veilGeometry = new PlaneGeometry(2, 2);
    this._veilMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uFormation: { value: 0 }, uDisintegrate: { value: 0 },
        uRipple: { value: 0 }, uPulse: { value: 0 }, uReduced: { value: 0 },
      },
      vertexShader: VEIL_VERTEX,
      fragmentShader: VEIL_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: NormalBlending,
      toneMapped: false,
    });
    const veil: Mesh<PlaneGeometry, ShaderMaterial> = new Mesh(this._veilGeometry, this._veilMaterial);
    veil.position.z = -0.035;
    veil.renderOrder = -10;
    this._panelRoot.add(veil);
  }

  private _random(seed: number): () => number {
    let state: number = seed >>> 0;
    return (): number => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
}

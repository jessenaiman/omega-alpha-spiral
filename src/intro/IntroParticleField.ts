import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Group, Mesh, NormalBlending,
  Line, LineBasicMaterial, PlaneGeometry, Points, ShaderMaterial,
} from 'three';

const TAU: number = Math.PI * 2;
const DESKTOP_LIGHT_PARTICLES: number = 11000;
const DESKTOP_DARK_PARTICLES: number = 9000;
const MOBILE_LIGHT_PARTICLES: number = 5200;
const MOBILE_DARK_PARTICLES: number = 4300;
const STRAND_STARTS: readonly number[] = [0, 0.28, 0.56];
const STRAND_DURATION: number = 0.44;
const STRAND_SEGMENTS: readonly number[] = [72, 44, 240];

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
  uniform float uStrandReveal;
  uniform float uDisintegrate;
  uniform float uReduced;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float time = uTime * mix(1.0, 0.0, uReduced);
    float phase = aSeed * 6.2831853;
    float drift = time * (0.055 + aSeed * 0.025);
    float eraOrder = uEra * 0.035;
    float strand = 1.0 - step(2.5, aKind);
    float star = step(2.5, aKind);
    float light = 1.0 - step(0.5, aKind);
    float shadow = step(0.5, aKind) * (1.0 - step(1.5, aKind));
    float ambition = step(1.5, aKind) * (1.0 - step(2.5, aKind));

    // Bernoulli lemniscate: three historical renderers discover the same path.
    float movingProgress = fract(aProgress + time * (0.0024 + aKind * 0.0007));
    float steps = light * 72.0 + shadow * 44.0 + ambition * 240.0;
    float sampledProgress = mix(floor(movingProgress * steps) / steps, movingProgress, ambition);
    float theta = sampledProgress * 6.2831853;
    float sine = sin(theta);
    float cosine = cos(theta);
    float denominator = 1.0 + sine * sine;
    vec3 curve = vec3(cosine / denominator * 6.25, sine * cosine / denominator * 7.1, -1.35);
    curve.xy += vec2(-sine, cosine) * (aKind - 1.0) * 0.055;
    curve.y += shadow * sign(sin(theta * 6.0)) * 0.075;
    curve.z += sin(theta * 2.0 + aKind * 1.7) * (0.22 + ambition * 0.18) + aKind * 0.12;
    p = mix(p, curve, strand);

    float depth = smoothstep(-1.8, 4.8, p.z);
    p.x += sin(phase + drift + p.y * 0.21) * (0.035 + star * (0.17 + aSeed * 0.2 - eraOrder)) * (0.7 + depth * 1.2);
    p.y += cos(phase * 1.31 - drift * 0.73 + p.x * 0.16) * (0.028 + star * (0.12 + aSeed * 0.16 - eraOrder * 0.6)) * (0.72 + depth);
    p.z += sin(phase * 2.1 + drift) * mix(0.055, 0.22, star);

    float chosen = 1.0 - step(0.45, abs(aKind - uOwner));
    p.xy *= 1.0 + chosen * uPulse * (0.08 + 0.04 * sin(phase));
    p.xy = mix(p.xy, p.xy * 0.12, uDisintegrate);
    p.z -= uDisintegrate * (2.0 + aSeed * 4.0);

    float silver = light;
    float ambitionCounter = step(0.72, fract(aSeed * 19.7));
    vColor = silver * vec3(0.78, 0.90, 0.98)
      + shadow * vec3(0.96, 0.08, 0.14)
      + ambition * mix(vec3(1.0, 0.72, 0.12), vec3(0.25, 0.12, 0.52), ambitionCounter * 0.48)
      + star * vec3(0.72, 0.80, 0.88);
    float strandStart = aKind * 0.28;
    float strandHead = clamp((uStrandReveal - strandStart) / 0.44, 0.0, 1.0);
    float painted = 1.0 - smoothstep(strandHead - 0.035, strandHead + 0.012, aProgress);
    float strandReveal = painted * smoothstep(0.0, 0.06, strandHead);
    float reveal = star * uStarReveal + strand * strandReveal;
    vAlpha = mix(0.2, 0.78, fract(aSeed * 31.7)) * reveal * (1.0 - uDisintegrate * 0.45);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (150.0 / max(1.0, -mvPosition.z)), 0.75, 5.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const LIGHT_FRAGMENT: string = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float core = 1.0 - smoothstep(0.04, 0.5, radius);
    float spark = 1.0 - smoothstep(0.0, 0.48, max(abs(point.x), abs(point.y)));
    float alpha = max(core, spark * 0.32) * vAlpha;
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
  strandReveal: number;
  reduced: boolean;
}

export class IntroParticleField {
  public readonly root: Group = new Group();
  private readonly _fieldRoot: Group = new Group();
  private readonly _panelRoot: Group = new Group();
  private _lightGeometry: BufferGeometry | null = null;
  private _darkGeometry: BufferGeometry | null = null;
  private _veilGeometry: PlaneGeometry | null = null;
  private _lightMaterial: ShaderMaterial | null = null;
  private _darkMaterial: ShaderMaterial | null = null;
  private _veilMaterial: ShaderMaterial | null = null;
  private _strandGeometries: BufferGeometry[] = [];
  private _strandMaterials: LineBasicMaterial[] = [];
  private _lightCount: number = 0;
  private _darkCount: number = 0;
  private _pulse: number = 0;
  private _owner: number = 1;
  private _lastSeconds: number = 0;
  private _formation: number = 0;
  private _strandReveal: number = 0;

  public init(parent: Group): void {
    const isMobile: boolean = window.innerWidth < 760;
    this._lightCount = isMobile ? MOBILE_LIGHT_PARTICLES : DESKTOP_LIGHT_PARTICLES;
    this._darkCount = isMobile ? MOBILE_DARK_PARTICLES : DESKTOP_DARK_PARTICLES;
    this._createLightField(this._lightCount);
    this._createStrandLines();
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
    this._strandReveal = 0;
    this._strandGeometries.forEach((geometry: BufferGeometry): void => geometry.setDrawRange(0, 0));
    this._strandMaterials.forEach((material: LineBasicMaterial): void => { material.opacity = 0; });
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
    const strandReveal: number = Math.max(0, Math.min(1, state.strandReveal));
    this._formation = formation;
    this._strandReveal = strandReveal;
    for (const material of [this._lightMaterial, this._darkMaterial, this._veilMaterial]) {
      material.uniforms.uTime.value = seconds;
      material.uniforms.uPulse.value = this._pulse;
      material.uniforms.uReduced.value = state.reduced ? 1 : 0;
      material.uniforms.uDisintegrate.value = disintegrate;
    }
    this._lightMaterial.uniforms.uEra.value = Math.max(0, Math.min(4, state.era));
    this._lightMaterial.uniforms.uOwner.value = this._owner;
    this._lightMaterial.uniforms.uStarReveal.value = starReveal;
    this._lightMaterial.uniforms.uStrandReveal.value = strandReveal;
    this._darkMaterial.uniforms.uFormation.value = formation;
    this._darkMaterial.uniforms.uOwner.value = this._owner;
    this._veilMaterial.uniforms.uFormation.value = formation;
    this._veilMaterial.uniforms.uRipple.value = this._pulse;
    this._strandGeometries.forEach((geometry: BufferGeometry, owner: number): void => {
      const count: number = (geometry.getAttribute('position')?.count ?? 0);
      const localReveal: number = Math.max(0, Math.min(1, (strandReveal - STRAND_STARTS[owner]) / STRAND_DURATION));
      geometry.setDrawRange(0, Math.max(0, Math.floor(count * localReveal)));
      this._strandMaterials[owner].opacity = localReveal <= 0 ? 0 : 0.1 + localReveal * 0.17;
    });
    this._panelRoot.visible = formation > 0.002 || disintegrate > 0;
  }

  public getDiagnostics(): { lightParticles: number; darkParticles: number; drawCalls: number; surfaceFormation: number } {
    const strandDraws: number = STRAND_STARTS.filter((start: number): boolean => this._strandReveal > start).length;
    return { lightParticles: this._lightCount, darkParticles: this._darkCount, drawCalls: 1 + strandDraws + (this._formation > 0.002 ? 2 : 0), surfaceFormation: this._formation };
  }

  public destroy(): void {
    this.root.removeFromParent();
    this._lightGeometry?.dispose();
    this._darkGeometry?.dispose();
    this._veilGeometry?.dispose();
    this._strandGeometries.forEach((geometry: BufferGeometry): void => geometry.dispose());
    this._lightMaterial?.dispose();
    this._darkMaterial?.dispose();
    this._veilMaterial?.dispose();
    this._strandMaterials.forEach((material: LineBasicMaterial): void => material.dispose());
  }

  private _createLightField(count: number): void {
    const positions: Float32Array = new Float32Array(count * 3);
    const seeds: Float32Array = new Float32Array(count);
    const kinds: Float32Array = new Float32Array(count);
    const progresses: Float32Array = new Float32Array(count);
    const sizes: Float32Array = new Float32Array(count);
    const random = this._random(472);
    for (let index: number = 0; index < count; index += 1) {
      const kind: number = index % 8 < 3 ? index % 3 : 3;
      const seed: number = random();
      if (kind < 3) {
        const progress: number = random();
        const point: readonly [number, number, number] = this._lemniscatePoint(progress, kind);
        positions[index * 3] = point[0];
        positions[index * 3 + 1] = point[1];
        positions[index * 3 + 2] = point[2];
        progresses[index] = progress;
      } else {
        const angle: number = random() * TAU;
        const radius: number = 2.2 + Math.pow(random(), 0.72) * 12.5;
        positions[index * 3] = Math.cos(angle) * radius * (1.06 + random() * 0.38);
        positions[index * 3 + 1] = Math.sin(angle) * radius * 0.66;
        positions[index * 3 + 2] = -0.88 + random() * 5.7;
        progresses[index] = random();
      }
      seeds[index] = seed;
      kinds[index] = kind;
      sizes[index] = kind === 3 ? 0.5 + random() * 1.35 : 1.15 + random() * 2.2;
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
        uOwner: { value: 1 }, uStarReveal: { value: 0 }, uStrandReveal: { value: 0 },
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

  private _createStrandLines(): void {
    const colors: readonly number[] = [0xbfe8ff, 0xcb2334, 0xe8b34c];
    STRAND_SEGMENTS.forEach((segments: number, owner: number): void => {
      const positions: Float32Array = new Float32Array((segments + 1) * 3);
      for (let index: number = 0; index <= segments; index += 1) {
        const point: readonly [number, number, number] = this._lemniscatePoint(index / segments, owner);
        positions.set(point, index * 3);
      }
      const geometry: BufferGeometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 0);
      const material: LineBasicMaterial = new LineBasicMaterial({
        color: colors[owner], transparent: true, opacity: 0,
        blending: AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false,
      });
      const line: Line<BufferGeometry, LineBasicMaterial> = new Line(geometry, material);
      line.frustumCulled = false;
      line.renderOrder = -31 + owner;
      this._strandGeometries.push(geometry);
      this._strandMaterials.push(material);
      this._fieldRoot.add(line);
    });
  }

  private _lemniscatePoint(progress: number, owner: number): readonly [number, number, number] {
    const segments: number = STRAND_SEGMENTS[owner];
    const sampled: number = owner === 2 ? progress : Math.floor(progress * segments) / segments;
    const theta: number = sampled * TAU;
    const sine: number = Math.sin(theta);
    const cosine: number = Math.cos(theta);
    const denominator: number = 1 + sine * sine;
    const normalX: number = -sine;
    const normalY: number = cosine;
    const offset: number = (owner - 1) * 0.055;
    const shadowKink: number = owner === 1 ? Math.sign(Math.sin(theta * 6)) * 0.075 : 0;
    return [
      cosine / denominator * 6.25 + normalX * offset,
      sine * cosine / denominator * 7.1 + normalY * offset + shadowKink,
      -1.35 + Math.sin(theta * 2 + owner * 1.7) * (owner === 2 ? 0.4 : 0.22) + owner * 0.12,
    ];
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

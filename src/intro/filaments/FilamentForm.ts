import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { filamentFragment, filamentVertex } from "./shaders";

export type FilamentOwner = 0 | 1 | 2;
export const FILAMENT_INK = [0xdcefff, 0xe7b45a, 0xff6478] as const;
const TAU = Math.PI * 2;

function hash(n: number): number {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function polyline(points: number[][], t: number): Vector3 {
  const f = t * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f));
  return new Vector3(...(points[i] as [number, number, number])).lerp(
    new Vector3(...(points[i + 1] as [number, number, number])),
    f - i
  );
}

// Personality is in geometry. Even without colour the forms stay distinct.
function presence(owner: FilamentOwner, t: number, strand: number): Vector3 {
  if (owner === 0)
    return polyline(
      [
        [-0.45, -1, 0],
        [0, -0.2, 0],
        [0, 1.15, 0],
        [0.45, 0.35, 0],
        [0, -0.2, 0],
        [0, -1.15, 0],
      ],
      t
    );
  if (owner === 1)
    return polyline(
      [
        [-0.55, -1, 0],
        [0.1, -0.55, 0],
        [-0.42, -0.08, 0.2],
        [0.48, 0.17, -0.15],
        [-0.16, 0.6, 0.1],
        [0.3, 1.1, 0],
      ],
      t
    );
  const angle = t * Math.PI * 1.75;
  const reach = 0.12 + t * 0.7;
  return new Vector3(
    Math.sin(angle) * reach + t * 0.24,
    -0.9 + t * 1.5 + Math.cos(angle) * reach * 0.48,
    Math.sin(t * Math.PI) * (0.22 + strand * 0.003)
  );
}

function smoothEmblem(
  owner: FilamentOwner,
  t: number,
  strand: number
): Vector3 {
  // Match the reference's upper white crown, amber left loop and red right loop.
  // Outer arc filaments braid into the small lemniscate at the bright crossing.
  if (owner === 0) {
    const a = Math.PI * (0.04 + t * 1.12);
    return new Vector3(
      Math.cos(a) * 1.9,
      Math.sin(a) * 1.9 - 0.12,
      Math.sin(a * 2) * 0.18
    );
  }
  if (strand % 4 === 0) {
    const a = Math.PI * (0.96 + t * 1.02);
    return new Vector3(
      Math.cos(a) * 1.9,
      Math.sin(a) * 1.8 - 0.12,
      Math.cos(a) * 0.16
    );
  }
  const a = t * Math.PI;
  const side = owner === 1 ? -1 : 1;
  const denominator = 1 + 0.45 * Math.cos(a) ** 2;
  const x = (side * Math.sin(a) * 1.85) / denominator;
  const y = (Math.sin(a * 2) * 0.9) / denominator;
  return new Vector3(x, y, Math.sin(a) * side * 0.22);
}

function emblemCore(owner: FilamentOwner, t: number, strand: number): Vector3 {
  if (owner === 2) return smoothEmblem(owner, t, strand);
  const count = owner === 0 ? 10 + (strand % 5) : 17;
  const f = t * count;
  const index = Math.min(count - 1, Math.floor(f));
  const point = (i: number): Vector3 => {
    const p = smoothEmblem(owner, i / count, strand);
    if (owner === 1 && i > 0 && i < count) {
      p.x += (hash(i * 13 + strand) - 0.5) * 0.23;
      p.y += (hash(i * 37 + strand) - 0.5) * 0.23;
    }
    return p;
  };
  return point(index).lerp(point(index + 1), f - index);
}

function emblem(owner: FilamentOwner, t: number, strand: number): Vector3 {
  const start = 0.2;
  const end = 0.8;
  if (t >= start && t <= end)
    return emblemCore(owner, (t - start) / (end - start), strand);
  const entering = t < start;
  const join = emblemCore(owner, entering ? 0 : 1, strand);
  const distance = entering ? (start - t) / start : (t - end) / (1 - end);
  // Open tails are continuous with the core and extend well past the camera crop.
  const tangent = entering
    ? join.clone().sub(emblemCore(owner, 0.015, strand))
    : join.clone().sub(emblemCore(owner, 0.985, strand));
  tangent.normalize();
  const side = owner === 1 ? -1 : owner === 2 ? 1 : entering ? 1 : -1;
  const destination = new Vector3(
    side * (10 + (strand % 5) * 0.7),
    side * (3.4 + (strand % 7) * 0.24),
    ((strand % 3) - 1) * 1.3
  );
  if (owner === 0) return join.clone().lerp(destination, distance);
  if (owner === 1)
    return polyline(
      [
        join.toArray(),
        join
          .clone()
          .lerp(destination, 0.25)
          .add(new Vector3(0, 0.4, 0))
          .toArray(),
        join
          .clone()
          .lerp(destination, 0.48)
          .add(new Vector3(0, -0.3, 0))
          .toArray(),
        join
          .clone()
          .lerp(destination, 0.73)
          .add(new Vector3(0, 0.22, 0))
          .toArray(),
        destination.toArray(),
      ],
      distance
    );
  // Quadratic continuation preserves the joining direction and spreads offscreen ends.
  return join
    .clone()
    .multiplyScalar((1 - distance) ** 2)
    .addScaledVector(
      join.clone().addScaledVector(tangent, 2.3),
      2 * distance * (1 - distance)
    )
    .addScaledVector(destination, distance * distance);
}

/** Two batched draws, no textures/physics, externally controlled lifecycle. */
export class FilamentForm {
  readonly root = new Group();
  private readonly lines: LineSegments<BufferGeometry, ShaderMaterial>;
  private readonly nodes: Points<BufferGeometry, ShaderMaterial>;
  private readonly uniforms = {
    uTime: { value: 0 },
    uDepth: { value: 0 },
    uConverge: { value: 0 },
    uShatter: { value: 0 },
    uOpacity: { value: 1 },
    uPointScale: { value: 28 },
  };

  constructor(owner?: FilamentOwner, strands = 22) {
    const owners: FilamentOwner[] = owner === undefined ? [0, 1, 2] : [owner];
    const lineData: Record<string, number[]> = {
      position: [],
      logoPosition: [],
      ink: [],
      emblemInk: [],
      trace: [],
    };
    const nodeData: Record<string, number[]> = {
      position: [],
      logoPosition: [],
      ink: [],
      emblemInk: [],
      trace: [],
    };
    const segments = 112;
    for (const voice of owners) {
      const color = new Color(FILAMENT_INK[voice]);
      const emblemColor = new Color([0xe5f3ff, 0xffb900, 0xee3814][voice]);
      for (let strand = 0; strand < strands; strand++) {
        const seed = voice * 997 + strand * 17;
        const offset = new Vector3(
          (hash(seed) - 0.5) * 0.2,
          (hash(seed + 1) - 0.5) * 0.12,
          (hash(seed + 2) - 0.5) * 0.6
        );
        for (let segment = 0; segment < segments; segment++) {
          for (let endpoint = 0; endpoint < 2; endpoint++) {
            const t = (segment + endpoint) / segments;
            const p = presence(voice, t, strand).add(offset);
            if (owner === undefined) p.x += (voice - 1) * 2.65;
            const target = emblem(voice, t, strand);
            // Unequal density and crossing wisps give the bundle a swept silhouette.
            const spread = 0.65 + Math.sin(t * Math.PI) * 1.3;
            target.addScaledVector(offset, spread);
            target.z += Math.sin(t * TAU * 2 + seed) * 0.07;
            const attributes = {
              position: p.toArray(),
              logoPosition: target.toArray(),
              ink: color.toArray(),
              emblemInk: emblemColor.toArray(),
              trace: [t, hash(seed + 4)],
            };
            for (const key of Object.keys(
              attributes
            ) as (keyof typeof attributes)[]) {
              lineData[key].push(...attributes[key]);
              if (endpoint === 0 && segment % 14 === 0 && strand % 3 === 0)
                nodeData[key].push(...attributes[key]);
            }
          }
        }
      }
    }
    const geometry = (data: Record<string, number[]>): BufferGeometry => {
      const g = new BufferGeometry();
      for (const [key, values] of Object.entries(data))
        g.setAttribute(
          key,
          new Float32BufferAttribute(values, key === "trace" ? 2 : 3)
        );
      return g;
    };
    const material = (points: boolean): ShaderMaterial =>
      new ShaderMaterial({
        uniforms: this.uniforms,
        defines: points ? { FILAMENT_POINTS: 1 } : {},
        vertexShader: filamentVertex,
        fragmentShader: filamentFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      });
    this.lines = new LineSegments(geometry(lineData), material(false));
    this.nodes = new Points(geometry(nodeData), material(true));
    this.lines.frustumCulled = this.nodes.frustumCulled = false;
    this.root.add(this.lines, this.nodes);
  }

  update(
    seconds: number,
    depth = 1,
    convergence = 0,
    shatter = 0,
    opacity = 1
  ): void {
    const clamp = (value: number): number => Math.max(0, Math.min(1, value));
    this.uniforms.uTime.value = seconds;
    this.uniforms.uDepth.value = clamp(depth);
    this.uniforms.uConverge.value = clamp(convergence);
    this.uniforms.uShatter.value = clamp(shatter);
    this.uniforms.uOpacity.value = clamp(opacity);
  }

  dispose(): void {
    this.root.removeFromParent();
    for (const object of [this.lines, this.nodes]) {
      object.geometry.dispose();
      object.material.dispose();
    }
  }
}

import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineSegments,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from "three";

type EraLine = LineSegments<BufferGeometry, LineBasicMaterial>;

function linework(coords: number[], color: number, opacity: number): EraLine {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(coords, 3));
  return new LineSegments(
    geometry,
    new LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
}

/** Earlier display technologies accumulate as sparse structures in the void. */
export class IntroWorldEvolution {
  public readonly root = new Group();
  private readonly _eras: Group[] = [
    new Group(),
    new Group(),
    new Group(),
    new Group(),
  ];
  private readonly _lines: EraLine[] = [];
  private readonly _infinity = new Group();
  private readonly _tubes: Array<Mesh<TubeGeometry, MeshBasicMaterial>> = [];
  private readonly _center: Mesh<IcosahedronGeometry, MeshBasicMaterial>;
  private readonly _reveal = [0, 0, 0, 0];

  public constructor() {
    this._eras.forEach((era): void => {
      this.root.add(era);
    });
    const bitCells: number[] = [];
    for (const side of [-1, 1])
      for (let row = 0; row < 13; row += 1) {
        const x = side * (4.35 + (row % 3) * 0.16);
        const y = -1.8 + row * 0.34;
        const z = -5.1 - (row % 4) * 0.5;
        bitCells.push(
          x,
          y,
          z,
          x + side * 0.12,
          y,
          z,
          x + side * 0.12,
          y,
          z,
          x + side * 0.12,
          y + 0.12,
          z
        );
      }
    this._addLine(0, bitCells, 0x72bfc4, 0.16);
    const raster: number[] = [];
    for (let row = 0; row < 7; row += 1) {
      const y = -2 + row * 0.67;
      raster.push(-6.2, y, -7.4, -4.2, y, -6.3, 4.2, y, -6.3, 6.2, y, -7.4);
    }
    this._addLine(1, raster, 0x9087c8, 0.18);
    const windows: number[] = [];
    for (const side of [-1, 1])
      for (let panel = 0; panel < 3; panel += 1) {
        const x = side * (4.7 + panel * 0.52);
        const y = 0.6 + panel * 0.24;
        const z = -8.5 - panel * 0.65;
        windows.push(
          x - 0.48,
          y - 0.62,
          z,
          x - 0.48,
          y + 0.62,
          z,
          x - 0.48,
          y + 0.62,
          z,
          x + 0.48,
          y + 0.62,
          z,
          x + 0.48,
          y + 0.62,
          z,
          x + 0.48,
          y - 0.62,
          z,
          x + 0.48,
          y - 0.62,
          z,
          x - 0.48,
          y - 0.62,
          z
        );
      }
    this._addLine(2, windows, 0xb8d7dc, 0.24);
    const memory: number[] = [];
    for (const side of [-1, 1])
      for (let index = 0; index < 9; index += 1) {
        const x = side * (3.35 + index * 0.31);
        const y = -1.8 + index * 0.37;
        const z = -8.5 - index * 0.35;
        memory.push(x, y, z, x + side * 0.22, y + 0.17, z - 0.15);
      }
    this._addLine(3, memory, 0xe7bd93, 0.28);
    for (const [start, end, color] of [
      [0, Math.PI, 0xf07d73],
      [Math.PI, 2 * Math.PI, 0xf5cb85],
    ] as const) {
      const points: Vector3[] = [];
      for (let i = 0; i <= 64; i += 1) {
        const t = start + ((end - start) * i) / 64;
        points.push(new Vector3(Math.sin(t) * 1.55, Math.sin(2 * t) * 0.72, 0));
      }
      const curve = new CatmullRomCurve3(points);
      for (const [radius, opacity] of [
        [0.032, 0.92],
        [0.115, 0.095],
      ]) {
        const mesh = new Mesh(
          new TubeGeometry(curve, 100, radius, 6, false),
          new MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          })
        );
        this._infinity.add(mesh);
        this._tubes.push(mesh);
      }
    }
    this._center = new Mesh(
      new IcosahedronGeometry(0.1, 1),
      new MeshBasicMaterial({
        color: 0xfff7e4,
        transparent: true,
        opacity: 0.9,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this._infinity.add(this._center);
    this._infinity.position.set(0, 2.45, -7.3);
    this._infinity.visible = false;
    this.root.add(this._infinity);
  }

  private _addLine(
    index: number,
    coords: number[],
    color: number,
    opacity: number
  ): void {
    const line = linework(coords, color, opacity);
    this._eras[index].add(line);
    this._lines.push(line);
  }

  public update(
    choicesMade: number,
    seconds: number,
    threshold: boolean,
    reduced: boolean
  ): void {
    this._eras.forEach((era, index): void => {
      const goal = choicesMade > index ? 1 : 0;
      this._reveal[index] += (goal - this._reveal[index]) * 0.04;
      era.visible = this._reveal[index] > 0.015;
      if (!reduced)
        era.position.y =
          Math.sin(seconds * (0.1 + index * 0.035) + index) * 0.08;
      const line = era.children[0] as EraLine;
      line.material.opacity =
        [0.16, 0.18, 0.24, 0.28][index] * this._reveal[index];
    });
    this._infinity.visible = threshold;
    if (threshold && !reduced) {
      this._infinity.rotation.y = Math.sin(seconds * 0.16) * 0.08;
      this._infinity.position.y = 2.45 + Math.sin(seconds * 0.31) * 0.06;
      this._center.scale.setScalar(1 + Math.sin(seconds * 1.9) * 0.12);
    }
  }

  public reset(): void {
    this._reveal.fill(0);
    this._eras.forEach((era): void => {
      era.visible = false;
    });
    this._infinity.visible = false;
  }

  public settle(choicesMade: number): void {
    this._reveal.forEach((_, index): void => {
      this._reveal[index] = choicesMade > index ? 1 : 0;
    });
  }

  public dispose(): void {
    this._lines.forEach((line): void => {
      line.geometry.dispose();
      line.material.dispose();
    });
    this._tubes.forEach((tube): void => {
      tube.geometry.dispose();
      tube.material.dispose();
    });
    this._center.geometry.dispose();
    this._center.material.dispose();
  }
}

import * as THREE from "three";
import { createSeededRandom } from "../utils/random";

/** Distant code substrate. It never overlaps the walkable floor. */
export class CosmicCodeBackdrop {
  readonly group = new THREE.Group();

  private readonly stars: THREE.Points;
  private readonly nebula: THREE.Mesh;
  private readonly nebulaTexture: THREE.CanvasTexture;
  private readonly code: THREE.Mesh;
  private readonly codeTexture: THREE.CanvasTexture;

  constructor(farEdge: number) {
    const random = createSeededRandom(472);
    const nebulaCanvas = document.createElement("canvas");
    nebulaCanvas.width = 1024;
    nebulaCanvas.height = 512;
    const nebulaContext = nebulaCanvas.getContext("2d");
    if (!nebulaContext) throw new Error("Cosmic backdrop canvas is unavailable");
    nebulaContext.fillStyle = "#030914";
    nebulaContext.fillRect(0, 0, 1024, 512);
    const clouds: Array<[number, number, number, string]> = [
      [270, 250, 410, "rgba(31, 89, 135, 0.78)"],
      [760, 160, 370, "rgba(89, 54, 120, 0.62)"],
      [590, 380, 240, "rgba(24, 102, 110, 0.46)"],
    ];
    clouds.forEach(([x, y, radius, color]) => {
      const glow = nebulaContext.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(3, 9, 20, 0)");
      nebulaContext.fillStyle = glow;
      nebulaContext.fillRect(0, 0, 1024, 512);
    });
    this.nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);
    this.nebulaTexture.colorSpace = THREE.SRGBColorSpace;
    this.nebula = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 66),
      new THREE.MeshBasicMaterial({
        map: this.nebulaTexture,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this.nebula.rotation.x = -Math.PI / 2;
    this.nebula.position.set(0, -0.54, -farEdge - 35);
    this.nebula.name = "CosmicVoidUnderCode";
    this.group.add(this.nebula);

    const positions = new Float32Array(320 * 3);
    const colors = new Float32Array(320 * 3);
    const cold = new THREE.Color(0x8dc4df);
    const warm = new THREE.Color(0xe7b45a);
    const pale = new THREE.Color(0xdcefff);

    for (let index = 0; index < 320; index += 1) {
      const offset = index * 3;
      positions[offset] = (random() - 0.5) * 78;
      positions[offset + 1] = -0.16 + random() * 0.24;
      positions[offset + 2] = -farEdge - 2 - random() * 52;
      const color = random() < 0.09 ? warm : random() < 0.55 ? cold : pale;
      const intensity = 0.45 + random() * 0.55;
      colors[offset] = color.r * intensity;
      colors[offset + 1] = color.g * intensity;
      colors[offset + 2] = color.b * intensity;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.24,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    this.stars.name = "DistantCodeStars";
    this.group.add(this.stars);

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Code backdrop canvas is unavailable");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '27px "Courier New", monospace';
    context.textBaseline = "middle";
    const rows = [
      "010010  //  Ω  //  001101  <>  0010  1101  //  0",
      "  __  0110  SHARD_472  1001  ||  0101  __",
      "001  <>  010101  //  MEMORY  0110  //  001",
      "   1010  [    ]  0011  <>  1010  0001",
      "010010  //  001101  1110  <>  0010  1101",
    ];
    rows.forEach((row, index) => {
      context.fillStyle = index % 2 === 0 ? "#7a9cab" : "#e7b45a";
      context.globalAlpha = index % 2 === 0 ? 0.8 : 0.58;
      context.fillText(row, 18 + (index % 2) * 42, 25 + index * 47);
    });
    context.globalAlpha = 1;
    this.codeTexture = new THREE.CanvasTexture(canvas);
    this.codeTexture.colorSpace = THREE.SRGBColorSpace;
    this.code = new THREE.Mesh(
      new THREE.PlaneGeometry(29, 10),
      new THREE.MeshBasicMaterial({
        map: this.codeTexture,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    this.code.rotation.x = -Math.PI / 2;
    this.code.position.set(0, -0.23, -farEdge - 8);
    this.code.name = "CodeBreakdownBeyondFloor";
    this.group.add(this.code);

    // The last solid edge breaks into a few floating pixel blocks. They stay
    // outside the arena, so the player never mistakes them for colliders.
    const blockGeometry = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    const blockMaterial = new THREE.MeshBasicMaterial({
      color: 0x7a9cab,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    const blocks = new THREE.InstancedMesh(blockGeometry, blockMaterial, 64);
    const transform = new THREE.Object3D();
    for (let index = 0; index < 64; index += 1) {
      transform.position.set(
        (random() - 0.5) * 23,
        -0.08 + random() * 0.3,
        -farEdge - 3 - random() * 9
      );
      transform.rotation.y = Math.round(random() * 3) * (Math.PI / 2);
      transform.scale.setScalar(0.5 + random() * 1.4);
      transform.updateMatrix();
      blocks.setMatrixAt(index, transform.matrix);
    }
    blocks.instanceMatrix.needsUpdate = true;
    blocks.name = "FloorPixelsDissolvingToCode";
    this.group.add(blocks);
  }

  update(elapsed: number, reducedMotion: boolean): void {
    const material = this.code.material as THREE.MeshBasicMaterial;
    material.opacity = reducedMotion ? 0.26 : 0.24 + Math.sin(elapsed * 0.65) * 0.035;
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.codeTexture.dispose();
    this.nebulaTexture.dispose();
  }
}

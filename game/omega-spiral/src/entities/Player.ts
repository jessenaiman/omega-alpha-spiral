import * as THREE from "three";
import type { InputController } from "../core/InputController";

export type PlayerTuning = {
  speed: number;
  dashMultiplier: number;
  acceleration: number;
};

/** One readable, early-code adventurer. The movement body stays a 0.38-radius proxy. */
export class Player {
  readonly group = new THREE.Group();
  readonly velocity = new THREE.Vector3();

  private readonly move = new THREE.Vector2();
  private readonly targetVelocity = new THREE.Vector3();
  private readonly geometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials = [
    new THREE.MeshStandardMaterial({ color: "#e5f2f5", flatShading: true, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: "#f07b38", flatShading: true, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: "#23578a", flatShading: true, roughness: 0.83 }),
    new THREE.MeshStandardMaterial({ color: "#09192d", flatShading: true, roughness: 0.9 }),
  ];
  private readonly leftArm: THREE.Mesh;
  private readonly rightArm: THREE.Mesh;
  private readonly leftLeg: THREE.Mesh;
  private readonly rightLeg: THREE.Mesh;

  constructor() {
    this.group.name = "LoneHero";
    this.block("head", 0, 1.35, 0, 0.42, 0.42, 0.42, 0);
    this.block("face", 0, 1.34, -0.22, 0.3, 0.16, 0.02, 3);
    this.block("torso", 0, 0.84, 0, 0.55, 0.62, 0.3, 1);
    this.block("belt", 0, 0.51, 0, 0.55, 0.1, 0.31, 3);
    this.leftArm = this.block("left arm", -0.39, 0.82, 0, 0.2, 0.56, 0.23, 0);
    this.rightArm = this.block("right arm", 0.39, 0.82, 0, 0.2, 0.56, 0.23, 0);
    this.leftLeg = this.block("left leg", -0.16, 0.21, 0, 0.22, 0.4, 0.25, 2);
    this.rightLeg = this.block("right leg", 0.16, 0.21, 0, 0.22, 0.4, 0.25, 2);
  }

  update(delta: number, elapsed: number, input: InputController, tuning: PlayerTuning): void {
    input.readMovement(this.move);
    const dash = input.isDashHeld() ? tuning.dashMultiplier : 1;
    this.targetVelocity.set(this.move.x, 0, this.move.y).multiplyScalar(tuning.speed * dash);
    const smoothing = 1 - Math.exp(-tuning.acceleration * delta);
    this.velocity.lerp(this.targetVelocity, smoothing);
    this.group.position.addScaledVector(this.velocity, delta);
    if (this.velocity.lengthSq() > 0.001) this.group.rotation.y = Math.atan2(this.velocity.x, -this.velocity.z);

    const stride = Math.sin(elapsed * 10) * Math.min(this.velocity.length() / 8, 0.45);
    this.leftArm.rotation.x = stride;
    this.rightArm.rotation.x = -stride;
    this.leftLeg.rotation.x = -stride;
    this.rightLeg.rotation.x = stride;
    this.group.position.y = 0.03 + Math.abs(stride) * 0.035;
  }

  reset(): void {
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.move.set(0, 0);
    this.targetVelocity.set(0, 0, 0);
    this.stabilizeVisuals();
  }

  stabilizeVisuals(): void {
    this.group.position.y = 0.03;
    for (const limb of [this.leftArm, this.rightArm, this.leftLeg, this.rightLeg]) limb.rotation.x = 0;
  }

  dispose(): void {
    this.geometry.dispose();
    for (const material of this.materials) material.dispose();
  }

  private block(name: string, x: number, y: number, z: number, width: number, height: number, depth: number, material: number): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geometry, this.materials[material]);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }
}

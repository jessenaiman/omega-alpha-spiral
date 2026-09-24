import * as THREE from "three";
import type { Pickup } from "../entities/Pickup";

type WallBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export class CollisionSystem {
  private readonly delta = new THREE.Vector3();

  collectPickups(
    playerPosition: THREE.Vector3,
    pickups: Pickup[],
    playerRadius: number
  ): Pickup[] {
    const collected: Pickup[] = [];

    for (const pickup of pickups) {
      if (!pickup.active) continue;
      this.delta.copy(playerPosition).sub(pickup.group.position);
      this.delta.y = 0;
      const radius = playerRadius + pickup.radius;
      if (this.delta.lengthSq() <= radius * radius) {
        pickup.collect();
        collected.push(pickup);
      }
    }

    return collected;
  }

  /** Move against the visible wall footprints, one axis at a time to allow sliding. */
  resolveWalls(
    position: THREE.Vector3,
    previous: THREE.Vector3,
    velocity: THREE.Vector3,
    walls: ReadonlyArray<WallBounds>,
    radius: number
  ): void {
    for (const wall of walls) {
      if (previous.z < wall.minZ - radius || previous.z > wall.maxZ + radius)
        continue;
      if (previous.x + radius <= wall.minX && position.x + radius > wall.minX) {
        position.x = wall.minX - radius;
        velocity.x = 0;
      } else if (
        previous.x - radius >= wall.maxX &&
        position.x - radius < wall.maxX
      ) {
        position.x = wall.maxX + radius;
        velocity.x = 0;
      }
    }
    for (const wall of walls) {
      if (position.x < wall.minX - radius || position.x > wall.maxX + radius)
        continue;
      if (previous.z + radius <= wall.minZ && position.z + radius > wall.minZ) {
        position.z = wall.minZ - radius;
        velocity.z = 0;
      } else if (
        previous.z - radius >= wall.maxZ &&
        position.z - radius < wall.maxZ
      ) {
        position.z = wall.maxZ + radius;
        velocity.z = 0;
      }
    }
  }
}

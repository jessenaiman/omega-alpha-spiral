import RAPIER, {
  ActiveCollisionTypes,
  ActiveEvents,
  Collider,
  ColliderDesc,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
  type ColliderHandle,
  type Vector,
} from '@dimforge/rapier3d-compat';

const FIXED_TIMESTEP: number = 1 / 60;
const PLAYER_COLLISION_GROUP: number = 0x00010002;
const SENSOR_COLLISION_GROUP: number = 0x00020001;
const ANSWER_SENSOR_COUNT: number = 3;
export const INTRO_JOURNEY_SENSOR_INDEX: number = 3;

export interface IntroPhysicsPosition {
  x: number;
  y: number;
  z: number;
}

export interface IntroPhysicsBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface IntroPhysicsStep {
  position: IntroPhysicsPosition;
  sensor: number;
}

export interface IntroPhysicsDiagnostics {
  ready: boolean;
  bodies: number;
  colliders: number;
  sensors: number;
  activeSensors: number;
  ccdBodies: number;
  fixedTimestep: number;
  steps: number;
}

/** Owns the intro's deterministic kinematic body and narrative sensors. */
export class IntroPhysics {
  private _world: World | null = null;
  private _events: EventQueue | null = null;
  private _playerBody: RigidBody | null = null;
  private _playerCollider: Collider | null = null;
  private _sensorBodies: RigidBody[] = [];
  private _sensors: Collider[] = [];
  private _accumulator: number = 0;
  private _ready: boolean = false;
  private _destroyed: boolean = false;
  private _steps: number = 0;
  private _activeSensors: number = 0;
  private _triggeredSensor: number = -1;
  private _translation: IntroPhysicsPosition = { x: 0, y: -2.55, z: 0.52 };
  private _nextTranslation: IntroPhysicsPosition = { x: 0, y: -2.55, z: 0.52 };

  public async init(): Promise<void> {
    await RAPIER.init();
    if (this._destroyed) return;
    this._world = new World({ x: 0, y: 0, z: 0 });
    this._world.timestep = FIXED_TIMESTEP;
    this._events = new EventQueue(true);
    this._playerBody = this._world.createRigidBody(
      RigidBodyDesc.kinematicPositionBased().setTranslation(this._translation.x, this._translation.y, this._translation.z),
    );
    this._playerCollider = this._world.createCollider(
      ColliderDesc.cuboid(0.16, 0.2, 0.16)
        .setCollisionGroups(PLAYER_COLLISION_GROUP)
        .setActiveCollisionTypes(ActiveCollisionTypes.KINEMATIC_FIXED)
        .setActiveEvents(ActiveEvents.COLLISION_EVENTS),
      this._playerBody,
    );
    for (let index: number = 0; index < ANSWER_SENSOR_COUNT + 1; index += 1) {
      const body: RigidBody = this._world.createRigidBody(RigidBodyDesc.fixed().setTranslation(0, 0, 0));
      const collider: Collider = this._world.createCollider(
        ColliderDesc.cuboid(index === INTRO_JOURNEY_SENSOR_INDEX ? 0.62 : 0.56, index === INTRO_JOURNEY_SENSOR_INDEX ? 0.18 : 0.42, 0.36)
          .setSensor(true)
          .setCollisionGroups(SENSOR_COLLISION_GROUP)
          .setActiveCollisionTypes(ActiveCollisionTypes.KINEMATIC_FIXED)
          .setActiveEvents(ActiveEvents.COLLISION_EVENTS),
        body,
      );
      collider.setEnabled(false);
      this._sensorBodies.push(body);
      this._sensors.push(collider);
    }
    this._ready = true;
  }

  public activateAnswers(targets: readonly IntroPhysicsPosition[], player: IntroPhysicsPosition): void {
    if (!this._ready || !this._world || !this._playerBody) return;
    this._resetPlayer(player);
    for (let index: number = 0; index < ANSWER_SENSOR_COUNT; index += 1) {
      const target: IntroPhysicsPosition = targets[index] ?? player;
      this._sensorBodies[index].setTranslation(target, false);
      this._sensors[index].setEnabled(true);
    }
    this._sensors[INTRO_JOURNEY_SENSOR_INDEX].setEnabled(false);
    this._activeSensors = ANSWER_SENSOR_COUNT;
    this._world.propagateModifiedBodyPositionsToColliders();
  }

  public syncAnswerTargets(targets: readonly IntroPhysicsPosition[]): void {
    if (!this._ready || !this._world || this._activeSensors !== ANSWER_SENSOR_COUNT) return;
    for (let index: number = 0; index < ANSWER_SENSOR_COUNT; index += 1) {
      const target: IntroPhysicsPosition | undefined = targets[index];
      if (target) this._sensorBodies[index].setTranslation(target, false);
    }
    this._world.propagateModifiedBodyPositionsToColliders();
  }

  public activateJourney(player: IntroPhysicsPosition, destination: IntroPhysicsPosition): void {
    if (!this._ready || !this._world || !this._playerBody) return;
    this._resetPlayer(player);
    for (let index: number = 0; index < ANSWER_SENSOR_COUNT; index += 1) this._sensors[index].setEnabled(false);
    this._sensorBodies[INTRO_JOURNEY_SENSOR_INDEX].setTranslation(destination, false);
    this._sensors[INTRO_JOURNEY_SENSOR_INDEX].setEnabled(true);
    this._activeSensors = 1;
    this._world.propagateModifiedBodyPositionsToColliders();
  }

  public deactivate(): void {
    if (!this._ready) return;
    this._sensors.forEach((sensor: Collider): void => sensor.setEnabled(false));
    this._activeSensors = 0;
    this._triggeredSensor = -1;
    this._events?.clear();
  }

  public step(delta: number, intentX: number, intentY: number, speed: number, bounds: IntroPhysicsBounds): IntroPhysicsStep {
    if (!this._ready || !this._world || !this._events || !this._playerBody) {
      return { position: this._translation, sensor: -1 };
    }
    this._accumulator += Math.min(Math.max(delta, 0), 0.1);
    while (this._accumulator >= FIXED_TIMESTEP) {
      const current: Vector = this._playerBody.translation(this._translation);
      this._nextTranslation.x = Math.max(bounds.minX, Math.min(bounds.maxX, current.x + intentX * speed * FIXED_TIMESTEP));
      this._nextTranslation.y = Math.max(bounds.minY, Math.min(bounds.maxY, current.y + intentY * speed * FIXED_TIMESTEP));
      this._nextTranslation.z = current.z;
      this._playerBody.setNextKinematicTranslation(this._nextTranslation);
      this._world.step(this._events);
      this._events.drainCollisionEvents((handle1: ColliderHandle, handle2: ColliderHandle, started: boolean): void => {
        if (!started || !this._playerCollider) return;
        const other: ColliderHandle = handle1 === this._playerCollider.handle ? handle2 : handle2 === this._playerCollider.handle ? handle1 : -1;
        if (other < 0) return;
        const sensorIndex: number = this._sensors.findIndex((sensor: Collider): boolean => sensor.handle === other);
        if (sensorIndex >= 0 && this._sensors[sensorIndex].isEnabled()) this._triggeredSensor = sensorIndex;
      });
      this._accumulator -= FIXED_TIMESTEP;
      this._steps += 1;
    }
    this._playerBody.translation(this._translation);
    const sensor: number = this._triggeredSensor;
    this._triggeredSensor = -1;
    return { position: this._translation, sensor };
  }

  public reset(): void {
    this.deactivate();
    if (this._playerBody) this._resetPlayer({ x: 0, y: -2.55, z: 0.52 });
    this._steps = 0;
  }

  public getDiagnostics(): IntroPhysicsDiagnostics {
    return {
      ready: this._ready,
      bodies: this._world?.bodies.len() ?? 0,
      colliders: this._world?.colliders.len() ?? 0,
      sensors: this._sensors.length,
      activeSensors: this._activeSensors,
      ccdBodies: 0,
      fixedTimestep: FIXED_TIMESTEP,
      steps: this._steps,
    };
  }

  public destroy(): void {
    this._destroyed = true;
    this._ready = false;
    this._events?.free();
    this._world?.free();
    this._events = null;
    this._world = null;
    this._playerBody = null;
    this._playerCollider = null;
    this._sensorBodies = [];
    this._sensors = [];
  }

  private _resetPlayer(position: IntroPhysicsPosition): void {
    if (!this._playerBody) return;
    this._translation.x = position.x;
    this._translation.y = position.y;
    this._translation.z = position.z;
    this._nextTranslation.x = position.x;
    this._nextTranslation.y = position.y;
    this._nextTranslation.z = position.z;
    this._playerBody.setTranslation(this._translation, false);
    this._playerBody.setNextKinematicTranslation(this._nextTranslation);
    this._accumulator = 0;
    this._triggeredSensor = -1;
    this._events?.clear();
  }
}

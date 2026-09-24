import * as THREE from "three";

type PointerState = {
  active: boolean;
  id: number | null;
  centerX: number;
  centerY: number;
  radius: number;
};

export class InputController {
  private readonly keys = new Set<string>();
  private readonly pointer = new THREE.Vector2();
  private readonly keyVector = new THREE.Vector2();
  private readonly gamepadVector = new THREE.Vector2();
  private readonly pointerState: PointerState = {
    active: false,
    id: null,
    centerX: 0,
    centerY: 0,
    radius: 1,
  };

  private dashDown = false;
  private gamepadDashDown = false;
  private gamepadPresent = false;
  private gamepadInteractHeld = false;
  private gamepadRestartHeld = false;
  private interactQueued = false;
  private restartQueued = false;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);
    if (!event.repeat && (event.code === "KeyE" || event.code === "Enter"))
      this.interactQueued = true;
    if (!event.repeat && event.code === "KeyR") this.restartQueued = true;
    if (event.code.startsWith("Arrow") || event.code === "Space")
      event.preventDefault();
    if (
      event.code === "Space" ||
      event.code === "ShiftLeft" ||
      event.code === "ShiftRight"
    ) {
      this.dashDown = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
    if (
      event.code === "Space" ||
      event.code === "ShiftLeft" ||
      event.code === "ShiftRight"
    ) {
      this.dashDown = false;
    }
  };

  private readonly onStickDown = (event: PointerEvent) => {
    event.preventDefault();
    const rect = this.stick.getBoundingClientRect();
    this.pointerState.active = true;
    this.pointerState.id = event.pointerId;
    this.pointerState.centerX = rect.left + rect.width / 2;
    this.pointerState.centerY = rect.top + rect.height / 2;
    this.pointerState.radius = rect.width * 0.42;
    try {
      this.stick.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic test events do not always have a capturable pointer id.
    }
    this.updatePointer(event.clientX, event.clientY);
  };

  private readonly onStickMove = (event: PointerEvent) => {
    if (!this.pointerState.active || event.pointerId !== this.pointerState.id)
      return;
    event.preventDefault();
    this.updatePointer(event.clientX, event.clientY);
  };

  private readonly onStickUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerState.id) return;
    event.preventDefault();
    this.pointerState.active = false;
    this.pointerState.id = null;
    this.pointer.set(0, 0);
    this.updateKnob();
  };

  private readonly onDashDown = (event: PointerEvent) => {
    event.preventDefault();
    this.dashDown = true;
  };

  private readonly onDashUp = (event: PointerEvent) => {
    event.preventDefault();
    this.dashDown = false;
  };

  private readonly onInteractDown = (event: PointerEvent) => {
    event.preventDefault();
    this.interactQueued = true;
  };

  constructor(
    private readonly stick: HTMLElement,
    private readonly knob: HTMLElement,
    private readonly dashButton: HTMLElement,
    private readonly interactButton: HTMLElement
  ) {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.stick.addEventListener("pointerdown", this.onStickDown);
    this.stick.addEventListener("pointermove", this.onStickMove);
    this.stick.addEventListener("pointerup", this.onStickUp);
    this.stick.addEventListener("pointercancel", this.onStickUp);
    this.dashButton.addEventListener("pointerdown", this.onDashDown);
    this.dashButton.addEventListener("pointerup", this.onDashUp);
    this.dashButton.addEventListener("pointercancel", this.onDashUp);
    this.dashButton.addEventListener("pointerleave", this.onDashUp);
    this.interactButton.addEventListener("pointerdown", this.onInteractDown);
  }

  readMovement(target: THREE.Vector2): THREE.Vector2 {
    this.keyVector.set(0, 0);
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft"))
      this.keyVector.x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight"))
      this.keyVector.x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp"))
      this.keyVector.y -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown"))
      this.keyVector.y += 1;

    target.copy(this.keyVector).add(this.pointer).add(this.gamepadVector);
    if (target.lengthSq() > 1) target.normalize();
    return target;
  }

  isDashHeld(): boolean {
    return this.dashDown || this.gamepadDashDown;
  }

  /** Poll just before movement each frame, as required by the browser Gamepad API. */
  pollGamepad(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = Array.from(pads).find((candidate): candidate is Gamepad => candidate?.connected === true);
    this.gamepadPresent = !!pad;
    if (!pad) {
      this.gamepadVector.set(0, 0);
      this.gamepadDashDown = false;
      this.gamepadInteractHeld = false;
      this.gamepadRestartHeld = false;
      return;
    }

    let x = pad.axes[0] ?? 0;
    let y = pad.axes[1] ?? 0;
    if (pad.buttons[14]?.pressed) x = -1;
    if (pad.buttons[15]?.pressed) x = 1;
    if (pad.buttons[12]?.pressed) y = -1;
    if (pad.buttons[13]?.pressed) y = 1;
    const length = Math.hypot(x, y);
    const deadzone = 0.18;
    if (length <= deadzone) this.gamepadVector.set(0, 0);
    else this.gamepadVector.set(x, y).multiplyScalar(Math.min(1, (length - deadzone) / (1 - deadzone)) / length);

    const interact = pad.buttons[0]?.pressed === true;
    if (interact && !this.gamepadInteractHeld) this.interactQueued = true;
    this.gamepadInteractHeld = interact;
    const restart = pad.buttons[9]?.pressed === true;
    if (restart && !this.gamepadRestartHeld) this.restartQueued = true;
    this.gamepadRestartHeld = restart;
    this.gamepadDashDown = !!(pad.buttons[1]?.pressed || pad.buttons[5]?.pressed || pad.buttons[7]?.pressed);
  }

  hasGamepad(): boolean {
    return this.gamepadPresent;
  }

  consumeInteract(): boolean {
    const queued = this.interactQueued;
    this.interactQueued = false;
    return queued;
  }

  consumeRestart(): boolean {
    const queued = this.restartQueued;
    this.restartQueued = false;
    return queued;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.stick.removeEventListener("pointerdown", this.onStickDown);
    this.stick.removeEventListener("pointermove", this.onStickMove);
    this.stick.removeEventListener("pointerup", this.onStickUp);
    this.stick.removeEventListener("pointercancel", this.onStickUp);
    this.dashButton.removeEventListener("pointerdown", this.onDashDown);
    this.dashButton.removeEventListener("pointerup", this.onDashUp);
    this.dashButton.removeEventListener("pointercancel", this.onDashUp);
    this.dashButton.removeEventListener("pointerleave", this.onDashUp);
    this.interactButton.removeEventListener("pointerdown", this.onInteractDown);
  }

  private updatePointer(clientX: number, clientY: number): void {
    const dx = clientX - this.pointerState.centerX;
    const dy = clientY - this.pointerState.centerY;
    this.pointer.set(
      dx / this.pointerState.radius,
      dy / this.pointerState.radius
    );
    if (this.pointer.lengthSq() > 1) this.pointer.normalize();
    this.updateKnob();
  }

  private updateKnob(): void {
    const distance = 38;
    this.knob.style.transform = `translate(calc(-50% + ${this.pointer.x * distance}px), calc(-50% + ${this.pointer.y * distance}px))`;
  }
}

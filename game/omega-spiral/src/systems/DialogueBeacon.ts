import * as THREE from "three";
import { GhostLetters } from "../../../../src/intro/ghost-type-study/GhostLetters";
import { WritingPlayback } from "../../../../src/intro/ghost-type-study/WritingPlayback";
import { PROFILES, type SpeakerId } from "../../../../src/intro/ghost-type-study/profiles";
import { parseOml, type OmlEvent } from "../../../../src/core/oml";
import doorScript from "../content/floor1-door.oml?raw";
import monsterScript from "../content/floor1-monster.oml?raw";
import chestScript from "../content/floor1-chest.oml?raw";
import entryScript from "../content/floor1-entry.oml?raw";

type ScriptId = "entry" | "door" | "monster" | "chest";

const scripts: Record<ScriptId, OmlEvent[]> = {
  entry: parseOml(entryScript).events,
  door: parseOml(doorScript).events,
  monster: parseOml(monsterScript).events,
  chest: parseOml(chestScript).events,
};

/** The game's world-space view of the same OML and `.omd` voices used by Dialogue Studio. */
export class DialogueBeacon {
  readonly group = new THREE.Group();
  private readonly letters = new Map<SpeakerId, GhostLetters>();
  private readonly playback = new WritingPlayback();
  private events: OmlEvent[] = [];
  private index = 0;
  private speaker: SpeakerId | null = null;
  private waitMs = 0;
  private lingerMs = 0;

  constructor() {
    this.group.name = "FloorOneDialogueBeacon";
    this.group.visible = false;
    this.group.scale.setScalar(0.65);
    for (const id of ["omega", "light", "shadow", "ambition"] as const) {
      const profile = PROFILES[id];
      const letters = new GhostLetters(id, profile.color, profile.era);
      letters.root.visible = false;
      this.letters.set(id, letters);
      this.group.add(letters.root);
    }
  }

  play(script: ScriptId, position: THREE.Vector3): void {
    this.events = scripts[script];
    this.index = 0;
    this.waitMs = 0;
    this.lingerMs = 0;
    this.group.position.set(position.x, 3.25, position.z + 0.7);
    this.group.visible = true;
    this.nextEvent();
  }

  update(delta: number, elapsed: number, reduced: boolean, camera: THREE.Camera): void {
    if (!this.group.visible) return;
    this.group.quaternion.copy(camera.quaternion);
    if (this.waitMs > 0) {
      this.waitMs -= delta * 1000;
      if (this.waitMs <= 0) this.nextEvent();
      return;
    }
    if (!this.speaker) return;
    const frame = this.playback.advance(delta * 1000);
    const letters = this.letters.get(this.speaker);
    if (!letters) return;
    letters.setText(frame.text);
    letters.update(elapsed, "manuscript", reduced);
    if (frame.done) {
      this.lingerMs += delta * 1000;
      if (this.lingerMs > 1250 && this.index < this.events.length) this.nextEvent();
    }
  }

  clear(): void {
    this.group.visible = false;
    this.speaker = null;
    this.events = [];
    for (const letters of this.letters.values()) letters.root.visible = false;
  }

  dispose(): void {
    for (const letters of this.letters.values()) letters.dispose();
    this.group.clear();
  }

  private nextEvent(): void {
    const event = this.events[this.index++];
    if (!event) return;
    if (event.type === "wait") {
      this.waitMs = event.durationMs ?? 0;
      return;
    }
    if (event.type !== "line") return;
    const id = event.speaker?.toLowerCase() as SpeakerId;
    if (!this.letters.has(id)) return;
    this.speaker = id;
    this.lingerMs = 0;
    for (const [speaker, letters] of this.letters) letters.root.visible = speaker === id;
    this.playback.restart(PROFILES[id], this.wrap(event.text ?? ""));
  }

  private wrap(text: string): string {
    const words = text.split(/\s+/);
    const lines: string[] = [""];
    for (const word of words) {
      const line = lines[lines.length - 1];
      if (line && `${line} ${word}`.length > 38) lines.push(word);
      else lines[lines.length - 1] = line ? `${line} ${word}` : word;
    }
    return lines.join("\n");
  }
}

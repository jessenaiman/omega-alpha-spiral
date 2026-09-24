import Ajv from "ajv";
import schema from "./dialogue.schema.json" with { type: "json" };
import type { Era, TypographyScene } from "../../core/sceneTypography";
import type { SpeakerId, SpeakerProfile } from "./profiles";
import type { Layout } from "./GhostLetters";

export type WritingSettings = Pick<
  SpeakerProfile,
  | "intervalMs"
  | "startDelayMs"
  | "jitter"
  | "mistakeFrequency"
  | "correctionDelayMs"
  | "revisionDelayMs"
>;
export type DialoguePresentation = {
  scene: TypographyScene;
  era: Era;
  layout: Layout;
  voices: Partial<Record<SpeakerId, Partial<WritingSettings>>>;
};

export type DialogueEvent =
  | { id: string; type: "line"; speaker: string; text: string }
  | { id: string; type: "wait"; durationMs: number }
  | { id: string; type: "continue"; label: string };
export type DialogueDocument = {
  $schema?: string;
  schemaVersion: 1;
  title: string;
  source: string;
  events: DialogueEvent[];
  presentation?: DialoguePresentation;
};

const validate = new Ajv({ allErrors: true }).compile(schema);

export function parseDialogue(raw: string): DialogueDocument {
  const doc: unknown = JSON.parse(raw);
  if (!validate(doc))
    throw new Error(
      validate.errors
        ?.slice(0, 4)
        .map((error) => `${error.instancePath || "Document"}: ${error.message}`)
        .join("\n") || "Invalid dialogue document."
    );
  const document = doc as DialogueDocument;
  const ids = new Set<string>();
  for (const [index, event] of document.events.entries()) {
    if (ids.has(event.id))
      throw new Error(`Event ${index + 1}: provide a unique id.`);
    ids.add(event.id);
  }
  return document;
}

// Renderer-independent order and waits. All time comes from the host's paused clock.
export class DialogueTimeline {
  index = -1;
  private elapsed = 0;
  constructor(
    readonly document: DialogueDocument,
    private enter: (event: DialogueEvent | undefined) => void
  ) {}
  get current() {
    return this.document.events[this.index];
  }
  start(index = 0) {
    this.index = index;
    this.elapsed = 0;
    this.enter(this.current);
  }
  tick(ms: number, lineFinished: boolean) {
    const event = this.current;
    if (!event) return;
    if (event.type === "wait") this.elapsed += ms;
    if (
      (event.type === "line" && lineFinished) ||
      (event.type === "wait" && this.elapsed >= event.durationMs)
    )
      this.start(this.index + 1);
  }
  proceed() {
    if (this.current?.type === "continue") this.start(this.index + 1);
  }
}

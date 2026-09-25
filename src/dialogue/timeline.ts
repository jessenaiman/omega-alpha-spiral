import type { Oml, OmlEvent, OmlStateEffect } from "../core/oml";
import type { Layout } from "../era-shaders/text";
import type { SpeakerId, SpeakerProfile } from "./personas";

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
  levelId: string;
  eraShaderId: string;
  layout: Layout;
  voices: Partial<Record<SpeakerId, Partial<WritingSettings>>>;
};

export type DialogueEvent =
  | { id: string; type: "line"; speaker: string; text: string }
  | { id: string; type: "question"; text: string }
  | {
      id: string;
      type: "choice";
      choiceId: string;
      speaker: string;
      text: string;
      responses: string[];
      effects: OmlStateEffect[];
      emit?: string;
      transition?: string;
    }
  | { id: string; type: "wait"; durationMs: number }
  | { id: string; type: "continue"; label: string }
  | ({ id: string; type: "set-state" } & OmlStateEffect)
  | { id: string; type: "emit"; name: string }
  | { id: string; type: "transition"; level: string };

export type DialogueDocument = {
  schemaVersion: 1;
  title: string;
  source: string;
  events: DialogueEvent[];
  completion?: DialogueEvent[];
  presentation?: DialoguePresentation;
};

const eventForTimeline = (
  level: Oml,
  event: OmlEvent,
  index: number,
  prefix: "script" | "completion"
): DialogueEvent => {
  const id = `${prefix}-${index + 1}`;
  if (event.type === "line")
    return { id, type: "line", speaker: event.speaker, text: event.text };
  if (event.type === "wait")
    return { id, type: "wait", durationMs: event.durationMs };
  if (event.type === "continue")
    return { id, type: "continue", label: event.label };
  if (event.type === "show-question")
    return { id, type: "question", text: level.question.text ?? "" };
  if (event.type === "show-choice") {
    const choice = level.choices.find((candidate) => candidate.id === event.id);
    if (!choice)
      throw new Error(
        `${level.scene.id ?? "Dialogue level"} references unknown choice ${event.id}.`
      );
    return {
      id,
      type: "choice",
      choiceId: choice.id,
      speaker: choice.owner,
      text: choice.text,
      responses: [...choice.responses],
      effects: choice.effects.map((effect) => ({ ...effect })),
      emit: choice.emit,
      transition: choice.transition,
    };
  }
  if (event.type === "set-state") return { id, ...event };
  if (event.type === "emit") return { id, ...event };
  return { id, ...event };
};

/** Converts the validated OML resource into the renderer-independent clock input. */
export function dialogueDocumentFromOml(
  level: Oml,
  source: string,
  presentation?: DialoguePresentation
): DialogueDocument {
  const events = level.events.map((event, index) =>
    eventForTimeline(level, event, index, "script")
  );
  const completion = level.completion.map((event, index) =>
    eventForTimeline(level, event, index, "completion")
  );
  return validateDialogueDocument({
    schemaVersion: 1,
    title: level.scene.id ?? "Omega dialogue",
    source,
    events,
    completion,
    presentation,
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateDialogueDocument(value: unknown): DialogueDocument {
  if (!isRecord(value)) throw new Error("Dialogue timeline must be an object.");
  if (value.schemaVersion !== 1)
    throw new Error("Dialogue timeline schemaVersion must be 1.");
  if (typeof value.title !== "string" || !value.title)
    throw new Error("Dialogue timeline needs a title.");
  if (typeof value.source !== "string")
    throw new Error("Dialogue timeline needs a source path.");
  if (!Array.isArray(value.events) || !value.events.length)
    throw new Error("Dialogue timeline needs at least one event.");

  const ids = new Set<string>();
  for (const [index, unknownEvent] of [
    ...value.events,
    ...(Array.isArray(value.completion) ? value.completion : []),
  ].entries()) {
    if (!isRecord(unknownEvent))
      throw new Error(`Event ${index + 1} must be an object.`);
    if (typeof unknownEvent.id !== "string" || !unknownEvent.id)
      throw new Error(`Event ${index + 1} needs an id.`);
    if (ids.has(unknownEvent.id))
      throw new Error(`Event ${index + 1}: provide a unique id.`);
    ids.add(unknownEvent.id);
    if (unknownEvent.type === "line") {
      if (
        typeof unknownEvent.speaker !== "string" ||
        typeof unknownEvent.text !== "string"
      )
        throw new Error(`Line event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "question") {
      if (typeof unknownEvent.text !== "string")
        throw new Error(`Question event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "choice") {
      if (
        typeof unknownEvent.choiceId !== "string" ||
        typeof unknownEvent.speaker !== "string" ||
        typeof unknownEvent.text !== "string" ||
        !Array.isArray(unknownEvent.responses) ||
        !unknownEvent.responses.every((response) => typeof response === "string") ||
        !Array.isArray(unknownEvent.effects)
      )
        throw new Error(`Choice event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "set-state") {
      if (
        (unknownEvent.operation !== "set" && unknownEvent.operation !== "increment") ||
        typeof unknownEvent.path !== "string" ||
        !(typeof unknownEvent.value === "string" || typeof unknownEvent.value === "number" || typeof unknownEvent.value === "boolean")
      )
        throw new Error(`State event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "emit") {
      if (typeof unknownEvent.name !== "string")
        throw new Error(`Emit event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "transition") {
      if (typeof unknownEvent.level !== "string")
        throw new Error(`Transition event ${unknownEvent.id} is incomplete.`);
    } else if (unknownEvent.type === "wait") {
      if (
        typeof unknownEvent.durationMs !== "number" ||
        unknownEvent.durationMs < 0
      )
        throw new Error(
          `Wait event ${unknownEvent.id} has an invalid duration.`
        );
    } else if (unknownEvent.type === "continue") {
      if (typeof unknownEvent.label !== "string" || !unknownEvent.label)
        throw new Error(`Continue event ${unknownEvent.id} needs a label.`);
    } else throw new Error(`Event ${unknownEvent.id} has an unknown type.`);
  }
  if (value.completion !== undefined && !Array.isArray(value.completion))
    throw new Error("Dialogue timeline completion must be an event list.");
  return value as DialogueDocument;
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
      ((event.type === "line" || event.type === "question" || event.type === "choice") && lineFinished) ||
      (event.type === "wait" && this.elapsed >= event.durationMs)
    )
      this.start(this.index + 1);
    else if (
      event.type === "set-state" ||
      event.type === "emit" ||
      event.type === "transition"
    )
      this.start(this.index + 1);
  }

  proceed() {
    if (this.current?.type === "continue") this.start(this.index + 1);
  }
}

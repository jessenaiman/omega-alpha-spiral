import {
  DialogueTimeline,
  dialogueDocumentFromOml,
  type DialogueDocument,
  type DialogueEvent,
} from "../dialogue/timeline";
import { WritingPlayback, resolveWritingText } from "../dialogue/writing";
import type { GhostQuestion } from "../dialogue/ghost";
import { GHOST_LEVELS } from "../dialogue/ghost-vite";
import { PROFILES, SPEAKERS, type SpeakerId } from "../dialogue/personas";
import type { Layout } from "../era-shaders/text";

const layouts: readonly Layout[] = ["manuscript", "fragments", "passage"];

// The four authored files are gameplay's source as well as the studio's source:
// https://github.com/jessenaiman/omega-alpha-spiral/tree/main/src/dialogue
export const studioOpeningDocuments: readonly DialogueDocument[] = GHOST_LEVELS.map(
  (script, index) => {
    const layout = layouts.includes(script.scene.layout as Layout)
      ? (script.scene.layout as Layout)
      : "passage";
    const document = dialogueDocumentFromOml(
      script,
      `src/dialogue/ghost-floor-0${index + 1}.oml`,
      {
        levelId: script.scene.id ?? `ghost-floor-0${index + 1}`,
        eraShaderId: script.scene.era_shader ?? "",
        layout,
        voices: {},
      }
    );
    for (const event of [
      ...document.events,
      ...(document.completion ?? []),
    ])
      if (event.type === "line" && !SPEAKERS.includes(event.speaker as SpeakerId))
        throw new Error(
          `Opening references an unsupported writing profile: ${event.speaker}`
        );
    return document;
  }
);
export const studioOpeningDocument = studioOpeningDocuments[0];
export const ghostFloor04Script = GHOST_LEVELS[3];
export const ghostFloor04Document = studioOpeningDocuments[3];

/** Same ordered runner and glyph reveal as the studio; gameplay owns the handoff. */
export class StudioOpening {
  private writing = new WritingPlayback();
  private started = false;
  private text = "";
  private speaker: SpeakerId = "omega";
  private questionText = "";
  private revealed = ["", "", ""];
  private timeline: DialogueTimeline;
  constructor(private document: DialogueDocument = studioOpeningDocument) {
    this.timeline = new DialogueTimeline(document, (event) => {
      if (
        event?.type === "line" ||
        event?.type === "question" ||
        event?.type === "choice" ||
        event?.type === "input" ||
        event?.type === "cue"
      ) {
        this.speaker =
          event.type === "question" ||
          event.type === "input" ||
          event.type === "cue"
            ? "omega"
            : (event.speaker as SpeakerId);
        const text = event.type === "input" ? event.prompt : event.text;
        this.writing.restart(
          {
            ...PROFILES[this.speaker],
            ...document.presentation?.voices[this.speaker],
          },
          text
        );
        this.text = "";
      }
    });
  }
  get choices(): string[] {
    return this.script.choices.map((choice) =>
      resolveWritingText(choice.text)
    );
  }
  get questionPrompt(): string {
    return resolveWritingText(this.script.question.text ?? "");
  }
  private get script() {
    const script = GHOST_LEVELS.find(
      (level) => level.scene.id === this.document.presentation?.levelId
    );
    if (!script) throw new Error(`Unknown opening floor: ${this.document.presentation?.levelId}`);
    return script;
  }
  applyTo(question: GhostQuestion): GhostQuestion {
    const choice = (index: 0 | 1 | 2) => {
      const authored = this.script.choices[index];
      return {
        ...question.choices[index],
        text: resolveWritingText(authored.text),
        response: authored.responses.join("\n"),
        effects: authored.effects,
        emit: authored.emit ?? "",
        transition: authored.transition ?? "",
      };
    };
    return {
      ...question,
      question: this.questionPrompt,
      choices: [choice(0), choice(1), choice(2)],
    };
  }
  advance(ms: number, reduced: boolean) {
    if (!this.started) {
      this.started = true;
      this.timeline.start();
    }
    const event = this.timeline.current;
    let finished = false;
    if (
      event?.type === "line" ||
      event?.type === "question" ||
      event?.type === "choice" ||
      event?.type === "input" ||
      event?.type === "cue"
    ) {
      const frame = this.writing.advance(reduced ? 1e9 : ms);
      this.text = frame.text;
      if (event.type === "question" || this.speaker === "omega")
        this.questionText = frame.text;
      else this.revealed[SPEAKERS.indexOf(this.speaker) - 1] = frame.text;
      finished = frame.done;
    }
    this.timeline.tick(ms, finished);
    const activeEvent = this.timeline.current;
    return {
      text: this.text,
      speaker: this.speaker,
      question: this.questionText,
      choiceLines: [...this.revealed],
      presentingChoices: this.speaker !== "omega",
      awaiting: activeEvent?.type === "continue",
      event:
        activeEvent ?? (event?.type === "transition" ? event : undefined),
      eventFinished: activeEvent === event && finished,
      done: !activeEvent,
    };
  }
  proceed() {
    this.timeline.proceed();
  }
  resolveInput(inputId: string): boolean {
    return this.timeline.resolveInput(inputId);
  }
  resolveCue(awaitedEvent: string): boolean {
    return this.timeline.resolveCue(awaitedEvent);
  }
  startCompletion(index = 0) {
    this.started = true;
    this.text = "";
    this.questionText = "";
    this.revealed = ["", "", ""];
    this.timeline.startCompletion(index);
  }
  static choices(lines: readonly string[]): StudioOpening {
    return new StudioOpening({
      schemaVersion: 1,
      title: "Dreamweaver path turns",
      source: "Current authored question choices",
      presentation: studioOpeningDocument.presentation,
      events: lines.flatMap((text, index) => [
        {
          id: `path-${index}`,
          type: "line" as const,
          speaker: SPEAKERS[index + 1],
          text,
        },
        { id: `hold-${index}`, type: "wait" as const, durationMs: 700 },
      ]),
    });
  }
}

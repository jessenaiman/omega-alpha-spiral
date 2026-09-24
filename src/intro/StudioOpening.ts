import scene1 from "../dialogue/scene1.oml?raw";
import {
  DialogueTimeline,
  parseDialogue,
  type DialogueDocument,
} from "./ghost-type-study/DialogueTimeline";
import {
  WritingPlayback,
  resolveWritingText,
} from "./ghost-type-study/WritingPlayback";
import { parseOml } from "../core/oml";
import type { ChronicleQuestion } from "./chronicle";
import {
  PROFILES,
  SPEAKERS,
  type SpeakerId,
} from "./ghost-type-study/profiles";

/** The game plays the same .oml the studio edits. One file, one parser. */
export const studioOpeningDocument = toDocument(parseOml(scene1));

function toDocument(parsed: ReturnType<typeof parseOml>): DialogueDocument {
  return parseDialogue(
    JSON.stringify({
      $schema: "./dialogue.schema.json",
      schemaVersion: 1,
      title: "Opening",
      source: "src/dialogue/scene1.oml",
      events: parsed.events.map((event, index) => ({
        id: `line-${index + 1}`,
        ...(event.type === "wait"
          ? { type: "wait", durationMs: event.durationMs ?? 0 }
          : event.type === "continue"
            ? { type: "continue", label: event.label ?? "continue" }
            : {
                type: "line",
                speaker: event.speaker ?? "omega",
                text: event.text ?? "",
              }),
      })),
      presentation: {
        scene: "opening",
        era: parsed.scene.era ?? "ibm-pc-vga",
        layout: parsed.scene.layout ?? "passage",
        voices: {},
      },
    })
  );
}
for (const event of studioOpeningDocument.events)
  if (event.type === "line" && !SPEAKERS.includes(event.speaker as SpeakerId))
    throw new Error(
      `Opening references an unsupported writing profile: ${event.speaker}`
    );

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
      if (event?.type === "line") {
        this.speaker = event.speaker as SpeakerId;
        this.writing.restart(
          {
            ...PROFILES[this.speaker],
            ...document.presentation?.voices[this.speaker],
          },
          event.text
        );
        this.text = "";
      }
    });
  }
  get choices(): string[] {
    return SPEAKERS.slice(1)
      .map((speaker) =>
        this.document.events
          .filter((event) => event.type === "line" && event.speaker === speaker)
          .at(-1)
      )
      .map((event) =>
        event?.type === "line" ? resolveWritingText(event.text) : ""
      );
  }
  get lastLine(): string {
    const event = this.document.events
      .filter((event) => event.type === "line" && event.speaker === "omega")
      .at(-1);
    return event?.type === "line" ? resolveWritingText(event.text) : "";
  }
  applyTo(question: ChronicleQuestion): ChronicleQuestion {
    const text = this.choices;
    const choice = (index: 0 | 1 | 2) => ({
      ...question.choices[index],
      text: text[index] || question.choices[index].text,
    });
    return {
      ...question,
      question: this.lastLine,
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
    if (event?.type === "line") {
      const frame = this.writing.advance(reduced ? 1e9 : ms);
      this.text = frame.text;
      if (this.speaker === "omega") this.questionText = frame.text;
      else this.revealed[SPEAKERS.indexOf(this.speaker) - 1] = frame.text;
      finished = frame.done;
    }
    this.timeline.tick(ms, finished);
    return {
      text: this.text,
      speaker: this.speaker,
      question: this.questionText,
      choiceLines: [...this.revealed],
      presentingChoices: this.speaker !== "omega",
      awaiting: this.timeline.current?.type === "continue",
      done: !this.timeline.current,
    };
  }
  proceed() {
    this.timeline.proceed();
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

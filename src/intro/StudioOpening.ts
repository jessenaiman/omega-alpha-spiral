import ghostFloor01 from "../dialogue/ghost-floor-01.oml?raw";
import {
  DialogueTimeline,
  dialogueDocumentFromOml,
  type DialogueDocument,
} from "../dialogue/timeline";
import { WritingPlayback, resolveWritingText } from "../dialogue/writing";
import { parseOml } from "../core/oml";
import type { GhostQuestion } from "../dialogue/ghost";
import { PROFILES, SPEAKERS, type SpeakerId } from "../dialogue/personas";
import type { Layout } from "../era-shaders/text";

const layouts: readonly Layout[] = ["manuscript", "fragments", "passage"];

/** The game plays the same .oml the studio edits. One file, one parser. */
export const ghostFloor01Script = parseOml(ghostFloor01);
const openingLayout = layouts.includes(
  ghostFloor01Script.scene.layout as Layout
)
  ? (ghostFloor01Script.scene.layout as Layout)
  : "passage";
export const studioOpeningDocument = dialogueDocumentFromOml(
  ghostFloor01Script,
  "src/dialogue/ghost-floor-01.oml",
  {
    levelId: ghostFloor01Script.scene.id ?? "ghost-floor-01",
    eraShaderId:
      ghostFloor01Script.scene.era_shader ?? "dec-vt100-ascii-terminal",
    layout: openingLayout,
    voices: {},
  }
);
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
    return ghostFloor01Script.choices.map((choice) =>
      resolveWritingText(choice.text)
    );
  }
  get questionPrompt(): string {
    return resolveWritingText(ghostFloor01Script.question.text ?? "");
  }
  applyTo(question: GhostQuestion): GhostQuestion {
    const choice = (index: 0 | 1 | 2) => {
      const authored = ghostFloor01Script.choices[index];
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

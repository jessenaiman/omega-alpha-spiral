import type { SpeakerProfile } from "./personas";

export type WritingFrame = {
  text: string;
  phase: string;
  done: boolean;
  oldText: string;
};
type Step = { at: number; text: string; phase: string; oldText?: string };

// Bracketed corrections follow the authored Dialogic-style text timeline idea:
// https://docs.dialogic.pro/timeline-text-syntax.html
const CORRECTION = /\[([^\]|]+)\|([^\]]+)\]|([^\s|\[\]]+)\|([^\s|\[\]]+)/g;
const CORRECTION_AT_START =
  /^(?:\[([^\]|]+)\|([^\]]+)\]|([^\s|\[\]]+)\|([^\s|\[\]]+))/;

/** The word after `|` is final; brackets are authoring syntax, not output. */
export function resolveWritingText(text: string): string {
  return text.replace(
    CORRECTION,
    (_pair, _bracketedFirst, bracketedFinal, _bareFirst, bareFinal) =>
      bracketedFinal ?? bareFinal
  );
}

// Glyph reveal/revision performance only. DialogueTimeline owns script progression.
export class WritingPlayback {
  private steps: Step[] = [];
  private cursor = 0;
  private elapsed = 0;
  private frame: WritingFrame = {
    text: "",
    phase: "Waiting",
    done: false,
    oldText: "",
  };
  private original = "";
  private revised = false;
  private seed = 472;
  private rand() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  restart(profile: SpeakerProfile, sample: string) {
    this.steps = [];
    this.cursor = 0;
    this.elapsed = 0;
    this.revised = false;
    this.seed = 472;
    this.original = resolveWritingText(sample);
    this.frame = { text: "", phase: "Waiting", done: false, oldText: "" };
    let at = profile.startDelayMs,
      text = "";
    const write = (ch: string, phase = "Writing", allowMistake = true) => {
      at += profile.intervalMs * (1 + (this.rand() - 0.5) * profile.jitter);
      if (ch === " " || ch === "\n")
        at += profile.intervalMs * (ch === "\n" ? 2.5 : 0.6);
      if (
        allowMistake &&
        /[a-z]/i.test(ch) &&
        this.rand() < profile.mistakeFrequency
      ) {
        this.steps.push({
          at,
          text: text + (ch === "e" ? "r" : "e"),
          phase: "Mistake",
        });
        at += profile.correctionDelayMs;
        this.steps.push({ at, text, phase: "Correcting" });
        at += profile.intervalMs;
      }
      text += ch;
      this.steps.push({ at, text, phase });
    };
    for (let index = 0; index < sample.length;) {
      const correction = CORRECTION_AT_START.exec(sample.slice(index));
      if (correction) {
        const cue = correction[0];
        const first = correction[1] ?? correction[3];
        const final = correction[2] ?? correction[4];
        for (const ch of first) write(ch, "Writing", false);
        const oldText = text;
        at += profile.correctionDelayMs;
        for (let remaining = first.length - 1; remaining >= 0; remaining--) {
          text = text.slice(0, -1);
          this.steps.push({ at, text, phase: "Retracting", oldText });
          at += profile.intervalMs * 0.65;
        }
        for (const ch of final) write(ch, "Revising", false);
        index += cue.length;
      } else {
        write(sample[index]);
        index++;
      }
    }
    this.steps.push({
      at: at + profile.intervalMs,
      text,
      phase: "Complete",
      oldText: "",
    });
  }

  advance(ms: number): WritingFrame {
    this.elapsed += ms;
    while (
      this.cursor < this.steps.length &&
      this.steps[this.cursor].at <= this.elapsed
    ) {
      const step = this.steps[this.cursor++];
      this.frame = {
        ...this.frame,
        text: step.text,
        phase: step.phase,
        oldText: step.oldText ?? this.frame.oldText,
        done: step.phase === "Complete" || step.phase === "Revised",
      };
    }
    return this.frame;
  }

  revise(profile: SpeakerProfile): boolean {
    if (
      this.revised ||
      !this.frame.done ||
      !this.original.includes(profile.replacement.from)
    )
      return false;
    this.revised = true;
    this.frame.oldText = this.frame.text;
    this.frame.done = false;
    this.frame.phase = "Reconsidering";
    let text = this.original,
      at = this.elapsed + profile.revisionDelayMs;
    const index = text.indexOf(profile.replacement.from);
    // Visibly erase/retype the authored span; leave the rest of the sentence in place.
    for (let n = profile.replacement.from.length - 1; n >= 0; n--) {
      text =
        this.original.slice(0, index) +
        profile.replacement.from.slice(0, n) +
        this.original.slice(index + profile.replacement.from.length);
      this.steps.push({ at, text, phase: "Retracting" });
      at += profile.intervalMs * 0.65;
    }
    for (let n = 1; n <= profile.replacement.to.length; n++) {
      text =
        this.original.slice(0, index) +
        profile.replacement.to.slice(0, n) +
        this.original.slice(index + profile.replacement.from.length);
      this.steps.push({ at, text, phase: "Revising" });
      at += profile.intervalMs;
    }
    this.steps.push({ at: at + 300, text, phase: "Revised" });
    return true;
  }
}

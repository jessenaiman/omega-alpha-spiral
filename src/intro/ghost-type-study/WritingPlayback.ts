import type { SpeakerProfile } from "./profiles";

export type WritingFrame = {
  text: string;
  phase: string;
  done: boolean;
  oldText: string;
};
type Step = { at: number; text: string; phase: string };

// Fixed sample presentation only: no branches, story state, or second dialogue engine.
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
    this.original = sample;
    this.frame = { text: "", phase: "Waiting", done: false, oldText: "" };
    let at = profile.startDelayMs,
      text = "";
    for (const ch of sample) {
      at += profile.intervalMs * (1 + (this.rand() - 0.5) * profile.jitter);
      if (ch === " " || ch === "\n")
        at += profile.intervalMs * (ch === "\n" ? 2.5 : 0.6);
      if (/[a-z]/i.test(ch) && this.rand() < profile.mistakeFrequency) {
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
      this.steps.push({ at, text, phase: "Writing" });
    }
    this.steps.push({ at: at + profile.intervalMs, text, phase: "Complete" });
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

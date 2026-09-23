export type SpeakerId = "omega" | "light" | "shadow" | "ambition";

export interface SpeakerProfile {
  id: SpeakerId;
  label: string;
  color: string;
  intervalMs: number;
  startDelayMs: number;
  jitter: number;
  mistakeFrequency: number;
  correctionDelayMs: number;
  revisionDelayMs: number;
  sample: string;
  replacement: { from: string; to: string };
  note: string;
}

export const PROFILES: Record<SpeakerId, SpeakerProfile> = {
  omega: {
    id: "omega",
    label: "Omega",
    color: "#d5e8f2",
    intervalMs: 90,
    startDelayMs: 350,
    jitter: 0.65,
    mistakeFrequency: 0.12,
    correctionDelayMs: 650,
    revisionDelayMs: 1500,
    sample: "NONCANONICAL · signal: night is clear\nrecording only",
    replacement: { from: "clear", to: "lost" },
    note: "Show late word edits as recorded SOS; do not bind typing to live player input.",
  },
  light: {
    id: "light",
    label: "Light",
    color: "#d8efff",
    intervalMs: 110,
    startDelayMs: 500,
    jitter: 0.12,
    mistakeFrequency: 0.025,
    correctionDelayMs: 850,
    revisionDelayMs: 1100,
    sample: "NONCANONICAL · maybe the signal is safe\nI have read it twice",
    replacement: { from: "maybe", to: "certainly" },
    note: "Keep 3D glyphs faint blue-white, slow, neat, and aligned.",
  },
  shadow: {
    id: "shadow",
    label: "Shadow",
    color: "#f2b84b",
    intervalMs: 40,
    startDelayMs: 250,
    jitter: 0.55,
    mistakeFrequency: 0.1,
    correctionDelayMs: 220,
    revisionDelayMs: 420,
    sample: "NONCANONICAL · the signal holds\nlook again",
    replacement: { from: "holds", to: "breaks" },
    note: "Use amber glyphs on an angled straight segment; keep motion readable.",
  },
  ambition: {
    id: "ambition",
    label: "Ambition",
    color: "#ed4949",
    intervalMs: 65,
    startDelayMs: 400,
    jitter: 0.3,
    mistakeFrequency: 0.06,
    correctionDelayMs: 400,
    revisionDelayMs: 750,
    sample: "NONCANONICAL · you failed again\nI can take that back",
    replacement: { from: "failed", to: "waited" },
    note: "Let red text curve toward the player, then retract harsh words.",
  },
};

export const SPEAKERS: SpeakerId[] = ["omega", "light", "shadow", "ambition"];

export type { TypographyOwner as SpeakerId } from "../../core/sceneTypography";
import type { TypographyOwner as SpeakerId } from "../../core/sceneTypography";
import Ajv from "ajv";
import scene1 from "../../dialogue/scene1.oml?raw";
import dreamweaverSchema from "../../dialogue/dreamweaver.oms?raw";
import { parseOmd, parseOml, speakerId, type Omd } from "../../core/oml";

/** A voice, as declared by its .omd file. Nothing here is hardcoded. */
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
  era: string;
  note: string;
  favoritePalette: string[];
  quickChoiceMs: number;
  hesitationMs: number;
  sample: string;
  replacement: { from: string; to: string };
}

export const SCRIPT = parseOml(scene1);
export const SCRIPT_TEXT = scene1;
const sourceFiles = import.meta.glob("../../dialogue/*.omd", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const validate = new Ajv().compile(JSON.parse(dreamweaverSchema));
const voices: SpeakerId[] = ["omega", "light", "shadow", "ambition"];
const designs = Object.fromEntries(
  voices.map((id) => {
    const file = SCRIPT.voices.find((voice) => speakerId(voice.name) === id)?.file;
    if (!file || !/^[a-z0-9_-]+\.omd$/i.test(file))
      throw new Error(`Scene 1 needs an .omd declaration for ${id}.`);
    const source = sourceFiles[`../../dialogue/${file}`];
    if (!source) throw new Error(`Missing declared voice file: ${file}`);
    const design = parseOmd(source);
    if (design.id !== id || design.schema !== "dreamweaver.oms" || !validate(design))
      throw new Error(`Invalid ${file}: ${JSON.stringify(validate.errors)}`);
    return [id, design];
  })
) as Record<SpeakerId, Omd>;

export const PROFILES = Object.fromEntries(
  (Object.keys(designs) as SpeakerId[]).map((id) => {
    const d = designs[id];
    return [
      id,
      {
        id,
        label: d.display_name || id,
        color: d.color,
        intervalMs: d.typing.interval,
        startDelayMs: d.typing.delay,
        jitter: d.typing.jitter,
        mistakeFrequency: d.typing.mistakes,
        correctionDelayMs: d.typing.correction,
        revisionDelayMs: d.typing.revision,
        era: d.typography.tradition,
        note: d.spatial.note,
        favoritePalette: (d.custom.favorite_palette ?? d.color)
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean),
        quickChoiceMs: Number(d.custom.quick_choice_ms ?? 3000),
        hesitationMs: Number(d.custom.hesitation_ms ?? 10000),
        sample: `NONCANONICAL - ${d.custom.personality ?? d.display_name}`,
        replacement: {
          from: d.replacement.from ?? "",
          to: d.replacement.to ?? "",
        },
      } satisfies SpeakerProfile,
    ];
  })
) as Record<SpeakerId, SpeakerProfile>;

export const SPEAKERS = Object.keys(PROFILES) as SpeakerId[];

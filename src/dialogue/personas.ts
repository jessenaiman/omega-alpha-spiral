export type SpeakerId = "omega" | "light" | "shadow" | "ambition";
import Ajv from "ajv";
import ghostFloor01 from "./ghost-floor-01.oml?raw";
import dialogueSchema from "./dialogue.oms?raw";
import { parseOmd, parseOml, speakerId, type Omd } from "../core/oml";
import { resolveEraShader } from "../era-shaders";

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
  eraShaderId: string;
  eraShaderSurfaces: string[];
  note: string;
  favoritePalette: string[];
  quickChoiceMs: number;
  hesitationMs: number;
  sample: string;
  replacement: { from: string; to: string };
}

export const SCRIPT = parseOml(ghostFloor01);
export const SCRIPT_TEXT = ghostFloor01;
const sourceFiles = import.meta.glob("./*.omd", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const validate = new Ajv({ strict: true }).compile(JSON.parse(dialogueSchema));
if (!validate(SCRIPT))
  throw new Error(
    `Invalid ghost-floor-01.oml: ${JSON.stringify(validate.errors)}`
  );
const voices: SpeakerId[] = ["omega", "light", "shadow", "ambition"];
const designs = Object.fromEntries(
  voices.map((id) => {
    const file = SCRIPT.voices.find(
      (voice) => speakerId(voice.name) === id
    )?.file;
    if (!file || !/^[a-z0-9_-]+\.omd$/i.test(file))
      throw new Error(`Scene 1 needs an .omd declaration for ${id}.`);
    const source = sourceFiles[`./${file}`];
    if (!source) throw new Error(`Missing declared voice file: ${file}`);
    const design = parseOmd(source);
    if (
      design.id !== id ||
      design.schema !== "dialogue.oms" ||
      !validate(design)
    )
      throw new Error(`Invalid ${file}: ${JSON.stringify(validate.errors)}`);
    resolveEraShader(design.era_shader.id);
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
        eraShaderId: d.era_shader.id,
        eraShaderSurfaces: d.era_shader.surfaces
          .split(",")
          .map((surface) => surface.trim())
          .filter(Boolean),
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

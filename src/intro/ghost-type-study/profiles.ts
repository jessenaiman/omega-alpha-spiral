export type { TypographyOwner as SpeakerId } from "../../core/sceneTypography";
import type { TypographyOwner as SpeakerId } from "../../core/sceneTypography";
import scene1 from "../../dialogue/scene1.oml?raw";
import Light from "../../dialogue/Light.omd?raw";
import Shadow from "../../dialogue/Shadow.omd?raw";
import Ambition from "../../dialogue/Ambition.omd?raw";
import System from "../../dialogue/System.omd?raw";
import { parseOmd, parseOml, type Omd } from "../../core/oml";

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
  sample: string;
  replacement: { from: string; to: string };
}

const designs: Record<SpeakerId, Omd> = {
  light: parseOmd(Light),
  shadow: parseOmd(Shadow),
  ambition: parseOmd(Ambition),
  omega: parseOmd(System),
};

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

export const SCRIPT = parseOml(scene1);
export const SCRIPT_TEXT = scene1;

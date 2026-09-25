// OML, OMD, and OMS are the Omega Spiral dialogue formats described in:
// https://github.com/jessenaiman/omega-alpha-spiral/blob/main/project-management/TaskNotes/Dialog%20Studio.md

export interface TagDef {
  name: string;
  color?: string;
  role?: string;
  wrap?: boolean;
  apply?: "color" | "font" | "scale" | "wait";
  meaning?: string;
}

export interface VoiceDef {
  name: string;
  color?: string;
  interval?: number;
  file?: string;
}

export type OmlStateValue = string | number | boolean;

export interface OmlStateEffect {
  operation: "set" | "increment";
  path: string;
  value: OmlStateValue;
}

export interface ChoiceDef {
  id: string;
  owner: string;
  text: string;
  responses: string[];
  effects: OmlStateEffect[];
  emit?: string;
  transition?: string;
}

export type OmlEvent =
  | { type: "line"; speaker: string; text: string }
  | { type: "show-question" }
  | { type: "show-choice"; id: string }
  | { type: "wait"; durationMs: number }
  | { type: "continue"; label: string }
  | {
      type: "input";
      id: string;
      prompt: string;
      hint: string;
      statePath: string;
      maxLength: number;
    }
  | {
      type: "cue";
      id: string;
      text: string;
      hint: string;
      await: string;
    }
  | ({ type: "set-state" } & OmlStateEffect)
  | { type: "emit"; name: string }
  | { type: "transition"; level: string };

export interface Oml {
  kind: "level";
  tags: TagDef[];
  voices: VoiceDef[];
  scene: {
    id?: string;
    era_shader?: string;
    layout?: string;
    next?: string;
  };
  question: { text?: string };
  choices: ChoiceDef[];
  events: OmlEvent[];
  completion: OmlEvent[];
}

/** An .omd persona design. Omega is a persona and is not a Dreamweaver. */
export interface Omd {
  schema?: string;
  kind: "persona";
  id: string;
  display_name: string;
  nicknames: string;
  color: string;
  custom: Record<string, string>;
  typing: Record<string, number>;
  typography: Record<string, string>;
  era_shader: { id: string; surfaces: string };
  replacement: Record<string, string>;
  spatial: Record<string, string>;
}

const numericFields = new Set([
  "interval",
  "delay",
  "jitter",
  "mistakes",
  "correction",
  "revision",
]);

const num = (value: string) =>
  value.trim() === "" ? Number.NaN : Number(value);

/** Parse an .omd persona file. */
export function parseOmd(text: string): Omd {
  const design: Omd = {
    kind: "persona",
    id: "",
    display_name: "",
    nicknames: "",
    color: "",
    custom: {},
    typing: {},
    typography: {},
    era_shader: { id: "", surfaces: "" },
    replacement: {},
    spatial: {},
  };
  let table: Record<string, string | number> = design as unknown as Record<
    string,
    string | number
  >;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      const head = section(line.slice(1, -1));
      if (!head) continue;
      const key = head[1].toLowerCase() as keyof Omd;
      const nested = design[key];
      if (typeof nested === "object" && nested !== null)
        table = nested as Record<string, string | number>;
      continue;
    }

    const [key, value] = parseValues(line);
    table[key] = numericFields.has(key) ? num(value) : value;
  }
  return design;
}

const VOICE_NAMES = ["omega", "light", "shadow", "ambition"];
const SYSTEM = new Set(["omega", "system", "sys"]);

export const speakerId = (name: string): string => {
  const key = name.trim().toLowerCase();
  if (SYSTEM.has(key)) return "omega";
  return VOICE_NAMES.find((voice) => voice === key) ?? name.trim();
};

export const speakerName = (id: string): string =>
  id === "omega" ? "System" : id.charAt(0).toUpperCase() + id.slice(1);

/** A section header such as `[tag ERROR]`, `[choice light]`, or `[script]`. */
const section = (line: string) => /^([a-z_]+)(?:\s+(.+))?$/i.exec(line.trim());

const parseValues = (line: string): [string, string] => {
  const at = line.indexOf("=");
  if (at < 0) return [line.trim(), ""];
  const key = line.slice(0, at).trim();
  let value = line.slice(at + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  )
    value = value.slice(1, -1);
  return [key, value];
};

const parseStateValue = (value: string): OmlStateValue => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
};

const parseEffect = (
  operation: OmlStateEffect["operation"],
  source: string
): OmlStateEffect => {
  const [path, value] = parseValues(source);
  if (!path || !value)
    throw new Error(`Invalid ${operation} effect: ${source}`);
  return { operation, path, value: parseStateValue(value) };
};

export function parseOml(text: string): Oml {
  const oml: Oml = {
    kind: "level",
    tags: [],
    voices: [],
    scene: {},
    question: {},
    choices: [],
    events: [],
    completion: [],
  };
  let where:
    | "tag"
    | "voice"
    | "scene"
    | "question"
    | "choice"
    | "script"
    | "completion"
    | null = null;
  let current: TagDef | VoiceDef | ChoiceDef | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    if (line.trimStart().startsWith("[") && line.trim().endsWith("]")) {
      const head = section(line.trim().slice(1, -1));
      if (head) {
        const kind = head[1].toLowerCase();
        const name = head[2]?.trim();
        if (kind === "tag" && name) {
          current = { name };
          oml.tags.push(current);
          where = "tag";
          continue;
        }
        if (kind === "voice" && name) {
          current = { name };
          oml.voices.push(current);
          where = "voice";
          continue;
        }
        if (kind === "choice" && name) {
          current = {
            id: name,
            owner: name,
            text: "",
            responses: [],
            effects: [],
          };
          oml.choices.push(current);
          where = "choice";
          continue;
        }
        if (
          kind === "scene" ||
          kind === "question" ||
          kind === "script" ||
          kind === "completion"
        ) {
          current = null;
          where = kind;
          continue;
        }
      }
      if (where === "script" || where === "completion") {
        (where === "script" ? oml.events : oml.completion).push(
          readEvent(line.trim())
        );
        continue;
      }
    }

    if (where === "scene") {
      const [key, value] = parseValues(line.trim());
      if (["id", "era_shader", "layout", "next"].includes(key))
        oml.scene[key as keyof Oml["scene"]] = value;
      continue;
    }

    if (where === "question") {
      const [key, value] = parseValues(line.trim());
      if (key === "text") oml.question.text = value.replace(/\\n/g, "\n");
      continue;
    }

    if (where === "choice" && current && "responses" in current) {
      const [key, value] = parseValues(line.trim());
      if (key === "owner") current.owner = value;
      else if (key === "text") current.text = value;
      else if (key === "response")
        current.responses.push(value.replace(/\\n/g, "\n"));
      else if (key === "set" || key === "increment")
        current.effects.push(parseEffect(key, value));
      else if (key === "emit") current.emit = value;
      else if (key === "transition") current.transition = value;
      continue;
    }

    if (current && where !== "script") {
      const [key, value] = parseValues(line.trim());
      if (where === "tag") {
        const tag = current as TagDef;
        if (key === "wrap") tag.wrap = value === "true";
        else if (key === "apply") tag.apply = value as TagDef["apply"];
        else if (key === "color" || key === "role" || key === "meaning")
          tag[key] = value;
      } else if (where === "voice") {
        const voice = current as VoiceDef;
        if (key === "interval") voice.interval = num(value);
        else if (key === "color" || key === "file") voice[key] = value;
      }
      continue;
    }

    (where === "completion" ? oml.completion : oml.events).push(
      readEvent(line)
    );
  }
  return oml;
}

const TIMED =
  /^\[(wait|timer_delay|delay)(?:\s+([^\]]+)|\(([^)]*)\)|\[([^\]]*)\])\]$/i;
const CONTINUE = /^\[continue\s+(.+?)\]$/i;
const INPUT = /^\[input\s+([^\s\]]+)(?:\s+(.+))?\]$/i;
const CUE = /^\[cue\s+([^\s\]]+)(?:\s+(.+))?\]$/i;
const SHOW = /^\[show\s+(question|choice)(?:\s+([^\]]+))?\]$/i;
const STATE = /^\[(set|increment)\s+(.+?)\]$/i;
const EMIT = /^\[emit\s+(.+?)\]$/i;
const TRANSITION = /^\[transition\s+(.+?)\]$/i;
const SPOKEN = /^([A-Za-z][A-Za-z ]{0,20}?)\s*:\s*(.*)$/;

export function parseDurationMs(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|sec(?:onds?)?)?$/i.exec(
    value.trim()
  );
  if (!match) return null;
  return Math.round(
    Number(match[1]) * (match[2]?.toLowerCase().startsWith("s") ? 1000 : 1)
  );
}

const directiveAttributes = (source: string | undefined): Record<string, string> => {
  const values: Record<string, string> = {};
  if (!source) return values;
  const attribute = /([a-z_]+)=(?:"((?:\\.|[^"])*)"|([^\s]+))/gi;
  for (const match of source.matchAll(attribute))
    values[match[1].toLowerCase()] = (match[2] ?? match[3] ?? "")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  return values;
};

const requiredAttribute = (
  attributes: Record<string, string>,
  name: string,
  directive: string
): string => {
  const value = attributes[name];
  if (!value) throw new Error(`${directive} requires ${name}.`);
  return value;
};

function readEvent(line: string): OmlEvent {
  const timed = line.match(TIMED);
  if (timed) {
    const durationMs = parseDurationMs(timed[2] ?? timed[3] ?? timed[4]);
    if (durationMs !== null) return { type: "wait", durationMs };
  }
  const proceed = line.match(CONTINUE);
  if (proceed) return { type: "continue", label: proceed[1] };
  const input = line.match(INPUT);
  if (input) {
    const attributes = directiveAttributes(input[2]);
    const maxLength = Number(
      requiredAttribute(attributes, "max_length", `[input ${input[1]}]`)
    );
    if (!Number.isInteger(maxLength) || maxLength < 1)
      throw new Error(`[input ${input[1]}] max_length must be a positive integer.`);
    return {
      type: "input",
      id: input[1],
      prompt: requiredAttribute(attributes, "prompt", `[input ${input[1]}]`),
      hint: requiredAttribute(attributes, "hint", `[input ${input[1]}]`),
      statePath: requiredAttribute(attributes, "state", `[input ${input[1]}]`),
      maxLength,
    };
  }
  const cue = line.match(CUE);
  if (cue) {
    const attributes = directiveAttributes(cue[2]);
    return {
      type: "cue",
      id: cue[1],
      text: requiredAttribute(attributes, "text", `[cue ${cue[1]}]`),
      hint: requiredAttribute(attributes, "hint", `[cue ${cue[1]}]`),
      await: requiredAttribute(attributes, "await", `[cue ${cue[1]}]`),
    };
  }
  const show = line.match(SHOW);
  if (show?.[1].toLowerCase() === "question") return { type: "show-question" };
  if (show?.[1].toLowerCase() === "choice" && show[2])
    return { type: "show-choice", id: show[2].trim() };
  const state = line.match(STATE);
  if (state)
    return {
      type: "set-state",
      ...parseEffect(
        state[1].toLowerCase() as OmlStateEffect["operation"],
        state[2]
      ),
    };
  const emitted = line.match(EMIT);
  if (emitted) return { type: "emit", name: emitted[1] };
  const transition = line.match(TRANSITION);
  if (transition) return { type: "transition", level: transition[1] };
  const spoken = line.match(SPOKEN);
  return {
    type: "line",
    speaker: speakerId(spoken ? spoken[1] : "omega"),
    text: (spoken ? spoken[2] : line).replace(/\\n/g, "\n"),
  };
}

const writeStateValue = (value: OmlStateValue) => String(value);

const directiveValue = (value: string): string =>
  `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")}"`;

const writeEvent = (event: OmlEvent): string => {
  if (event.type === "wait") return `[wait ${event.durationMs}]`;
  if (event.type === "show-question") return "[show question]";
  if (event.type === "show-choice") return `[show choice ${event.id}]`;
  if (event.type === "continue") return `[continue ${event.label}]`;
  if (event.type === "input")
    return `[input ${event.id} prompt=${directiveValue(event.prompt)} hint=${directiveValue(event.hint)} state=${event.statePath} max_length=${event.maxLength}]`;
  if (event.type === "cue")
    return `[cue ${event.id} text=${directiveValue(event.text)} hint=${directiveValue(event.hint)} await=${event.await}]`;
  if (event.type === "set-state")
    return `[${event.operation} ${event.path} = ${writeStateValue(event.value)}]`;
  if (event.type === "emit") return `[emit ${event.name}]`;
  if (event.type === "transition") return `[transition ${event.level}]`;
  return `${speakerName(event.speaker)}: ${event.text.replace(/\n/g, "\\n")}`;
};

export function writeOml(oml: Oml): string {
  const out: string[] = [
    "# OML - Omega Spiral level dialogue",
    "# https://github.com/jessenaiman/omega-alpha-spiral/blob/main/project-management/TaskNotes/Dialog%20Studio.md",
    "",
  ];
  for (const tag of oml.tags) {
    out.push(`[tag ${tag.name}]`);
    if (tag.color) out.push(`color = ${tag.color}`);
    if (tag.role) out.push(`role = ${tag.role}`);
    if (tag.wrap) out.push("wrap = true");
    if (tag.apply) out.push(`apply = ${tag.apply}`);
    if (tag.meaning) out.push(`meaning = ${tag.meaning}`);
    out.push("");
  }
  for (const voice of oml.voices) {
    out.push(`[voice ${voice.name}]`);
    if (voice.color) out.push(`color = ${voice.color}`);
    if (voice.file) out.push(`file = ${voice.file}`);
    if (voice.interval !== undefined) out.push(`interval = ${voice.interval}`);
    out.push("");
  }
  out.push("[scene]");
  if (oml.scene.id) out.push(`id = ${oml.scene.id}`);
  if (oml.scene.era_shader) out.push(`era_shader = ${oml.scene.era_shader}`);
  if (oml.scene.layout) out.push(`layout = ${oml.scene.layout}`);
  if (oml.scene.next) out.push(`next = ${oml.scene.next}`);
  out.push("");

  if (oml.question.text) {
    out.push("[question]");
    out.push(`text = ${oml.question.text.replace(/\n/g, "\\n")}`);
    out.push("");
  }

  for (const choice of oml.choices) {
    out.push(`[choice ${choice.id}]`);
    out.push(`owner = ${choice.owner}`);
    out.push(`text = ${choice.text}`);
    for (const response of choice.responses)
      out.push(`response = ${response.replace(/\n/g, "\\n")}`);
    for (const effect of choice.effects)
      out.push(
        `${effect.operation} = ${effect.path} = ${writeStateValue(effect.value)}`
      );
    if (choice.emit) out.push(`emit = ${choice.emit}`);
    if (choice.transition) out.push(`transition = ${choice.transition}`);
    out.push("");
  }

  out.push("[script]");
  for (const event of oml.events) out.push(writeEvent(event));
  if (oml.completion.length) {
    out.push("", "[completion]");
    for (const event of oml.completion) out.push(writeEvent(event));
  }
  return out.join("\n") + "\n";
}

/** A tag matches `[NAME]`, `[NAME payload]` or `[NAME=p]...[/NAME]`. */
export interface TagMatch {
  start: number;
  end: number;
  tag: TagDef;
  value: string;
  body?: { start: number; end: number };
}

const escapeRe = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matcher(tag: TagDef): RegExp {
  const name = escapeRe(tag.name);
  if (tag.wrap)
    return new RegExp(
      `\\[${name}=([^\\]]*)\\]([\\s\\S]*?)\\[\\/${name}\\]`,
      "g"
    );
  return new RegExp(`\\[${name}(?:[ :]?([^\\]]*))?\\]`, "g");
}

export function tagMatches(text: string, tags: TagDef[]): TagMatch[] {
  const found: TagMatch[] = [];
  for (const tag of tags) {
    const regex = matcher(tag);
    for (const match of text.matchAll(regex)) {
      const body = tag.wrap ? match[2] : undefined;
      const at = body === undefined ? 0 : match[0].indexOf(body);
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        tag,
        value: match[1] ?? match[0],
        body:
          body === undefined
            ? undefined
            : {
                start: match.index + at,
                end: match.index + at + body.length,
              },
      });
    }
  }
  return found.sort((a, b) => a.start - b.start || b.end - a.end);
}

export const classOf = (tag: TagDef) =>
  `tok-${tag.name.toLowerCase().replace(/\s+/g, "-")}`;

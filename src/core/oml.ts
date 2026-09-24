// OML — Omega Markup Language. One text file: tag and voice definitions, then
// the script. What the editor shows is the file. No JSON, no directory of tags.

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
}

export interface OmlEvent {
  type: "line" | "wait" | "continue";
  speaker?: string;
  text?: string;
  durationMs?: number;
  label?: string;
}

export interface Oml {
  tags: TagDef[];
  voices: VoiceDef[];
  scene: { era?: string; layout?: string };
  events: OmlEvent[];
}

/** An .omd voice design. Mirrors Dialogic's .dch. */
export interface Omd {
  id: string;
  display_name: string;
  nicknames: string;
  color: string;
  custom: Record<string, string>;
  typing: Record<string, number>;
  typography: Record<string, string>;
  replacement: Record<string, string>;
  spatial: Record<string, string>;
}

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

/** Parse an .omd design file. Same grammar as .oml: sections, key = value. */
export function parseOmd(text: string): Omd {
  const design = {
    id: "",
    display_name: "",
    nicknames: "",
    color: "",
    custom: {},
    typing: {},
    typography: {},
    replacement: {},
    spatial: {},
  } as unknown as Omd;
  let table: Record<string, string> | Record<string, number> = design as never;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const head = section(line.startsWith("[") ? line.slice(1, -1).trim() : "");
    if (head) {
      const [, kind] = head;
      const key = kind.toLowerCase();
      const nested = [
        "custom",
        "typing",
        "typography",
        "replacement",
        "spatial",
      ].includes(key);
      table = ((nested
        ? (
            design as unknown as Record<string, Record<string, string | number>>
          )[key]
        : (design as unknown as Record<string, string>)) ?? {}) as typeof table;
      continue;
    }
    const [key, value] = parseValues(line);
    if (
      key === "interval" ||
      key === "delay" ||
      key === "jitter" ||
      key === "mistakes" ||
      key === "correction" ||
      key === "revision"
    )
      (table as Record<string, number>)[key] = num(value);
    else (table as Record<string, string>)[key] = value;
  }
  return design;
}

const VOICE_NAMES = ["omega", "light", "shadow", "ambition"];

/** System aliases, because Dialogic requires SYSTEM and you know it as Omega. */
const SYSTEM = new Set(["omega", "system", "sys"]);

export const speakerId = (name: string): string => {
  const key = name.trim().toLowerCase();
  if (SYSTEM.has(key)) return "omega";
  return VOICE_NAMES.find((v) => v === key) ?? name.trim();
};

export const speakerName = (id: string): string =>
  id === "omega" ? "System" : id.charAt(0).toUpperCase() + id.slice(1);

/** A section header: `[tag NAME]` or a bare `[typing]`. The name is optional. */
const section = (line: string) => /^([a-z]+)(?:\s+(.+))?$/i.exec(line.trim());

const parseValues = (line: string): [string, string] => {
  const at = line.indexOf("=");
  if (at < 0) return [line.trim(), ""];
  return [
    line.slice(0, at).trim(),
    line
      .slice(at + 1)
      .trim()
      .replace(/^["']|["']$/g, ""),
  ];
};

export function parseOml(text: string): Oml {
  const oml: Oml = { tags: [], voices: [], scene: {}, events: [] };
  let where: "tag" | "voice" | "scene" | "script" | null = null;
  let current: TagDef | VoiceDef | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    if (line.trimStart().startsWith("[")) {
      const head = section(line.trim().slice(1, -1).trim());
      if (head) {
        const [, kind, name] = head;
        if (kind.toLowerCase() === "tag") {
          current = { name: name.trim() };
          oml.tags.push(current as TagDef);
          where = "tag";
        } else if (kind.toLowerCase() === "voice") {
          current = { name: name.trim() };
          oml.voices.push(current as VoiceDef);
          where = "voice";
        } else if (kind.toLowerCase() === "scene") {
          current = null;
          where = "scene";
        } else {
          current = null;
          where = "script";
        }
      }
      continue;
    }

    if (where === "scene") {
      const [key, value] = parseValues(line.trim());
      oml.scene[key as "era" | "layout"] = value;
      continue;
    }

    if (current && where !== "script") {
      const [key, value] = parseValues(line.trim());
      const target = current as TagDef & VoiceDef;
      if (key === "wrap") target.wrap = value === "true";
      else if (key === "meaning") target.meaning = value;
      else if (key === "apply" || key === "role")
        target[key] = value as TagDef["apply"];
      else target[key as "color"] = value;
      continue;
    }

    oml.events.push(readEvent(line));
  }
  return oml;
}

const WAIT = /^\[wait\s+(\d+)\]/i;
const CONTINUE = /^\[continue\s+(.+?)\]$/i;
const SPOKEN = /^([A-Za-z][A-Za-z ]{0,20}?)\s*:\s*(.*)$/;

function readEvent(line: string): OmlEvent {
  const wait = line.match(WAIT);
  if (wait) return { type: "wait", durationMs: Number(wait[1]) };
  const cont = line.match(CONTINUE);
  if (cont) return { type: "continue", label: cont[1] };
  const spoken = line.match(SPOKEN);
  return {
    type: "line",
    speaker: speakerId(spoken ? spoken[1] : "omega"),
    text: spoken ? spoken[2] : line,
  };
}

export function writeOml(oml: Oml): string {
  const out: string[] = ["# OML — Omega Spiral dialogue", ""];
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
    out.push("");
  }
  out.push("[script]");
  for (const event of oml.events) {
    if (event.type === "wait") out.push(`[wait ${event.durationMs}]`);
    else if (event.type === "continue") out.push(`[continue ${event.label}]`);
    else
      out.push(`${speakerName(event.speaker ?? "omega")}: ${event.text ?? ""}`);
  }
  return out.join("\n") + "\n";
}

/** A tag matches `[NAME]`, `[NAME payload]` or, when it wraps, `[NAME=p]…[/NAME]`. */
export interface TagMatch {
  start: number;
  end: number;
  tag: TagDef;
  value: string;
  body?: { start: number; end: number };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

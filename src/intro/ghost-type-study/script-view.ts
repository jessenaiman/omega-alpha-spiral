// The script surface. Edits the OML text directly; highlights what it finds there.
import { PROFILES } from "./profiles";
import { classOf, parseOml, tagMatches, type Oml } from "../../core/oml";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const escape = (text: string) => text.replace(/[&<>]/g, (c) => ESCAPES[c]);

function highlight(text: string, tags: Oml["tags"]): string {
  let out = "";
  let cursor = 0;
  for (const match of tagMatches(text, tags)) {
    if (match.start < cursor) continue;
    out += escape(text.slice(cursor, match.start));
    const className = classOf(match.tag);
    if (match.tag.wrap && match.body) {
      out += `<span class="tok-markup">${escape(
        text.slice(match.start, match.body.start)
      )}</span>`;
      out += `<span class="${className}" style="color:${match.value}">${escape(
        text.slice(match.body.start, match.body.end)
      )}</span>`;
      out += `<span class="tok-markup">${escape(
        text.slice(match.body.end, match.end)
      )}</span>`;
    } else {
      out += `<span class="${className}">${escape(
        text.slice(match.start, match.end)
      )}</span>`;
    }
    cursor = match.end;
  }
  return out + escape(text.slice(cursor));
}

export function createScriptEditor(
  root: HTMLElement,
  onChange: (text: string) => void
) {
  root.replaceChildren();
  const wrap = document.createElement("div");
  wrap.className = "script-editor";
  const mirror = document.createElement("pre");
  mirror.className = "script-mirror";
  mirror.setAttribute("aria-hidden", "true");
  const input = document.createElement("textarea");
  input.className = "script-input";
  input.spellcheck = false;
  input.setAttribute("aria-label", "OML script");
  input.placeholder =
    "# add a tag\n[tag chime]\ncolor = #c9ffdd\n\n# write the scene\nSystem: [chime] Echo Chamber Active";
  wrap.append(mirror, input);
  root.append(wrap);

  const paint = () => {
    const { tags } = parseOml(input.value);
    mirror.innerHTML =
      input.value
        .split("\n")
        .map((line) => {
          const head = /^\s*\[(tag|voice|script)\b/.exec(line);
          if (head) return `<span class="tok-section">${escape(line)}</span>`;
          const assignment = /^\s*(\w+)\s*=/.exec(line);
          if (assignment)
            return `<span class="tok-key">${escape(
              line.slice(0, assignment[0].length - 1)
            )}</span>${escape(line.slice(assignment[0].length - 1))}`;
          const spoken = /^([A-Za-z][A-Za-z ]{0,20}?)(:)/.exec(line);
          if (spoken) {
            const key = spoken[1].trim().toLowerCase() as keyof typeof PROFILES;
            const accent = PROFILES[key]?.color ?? "#9fb4c2";
            const head = line.slice(0, spoken[1].length);
            return `<span class="script-speaker" style="--accent:${accent}">${escape(
              head
            )}</span>${highlight(line.slice(head.length), tags)}`;
          }
          return highlight(line, tags);
        })
        .join("\n") + "\n";
  };

  input.addEventListener("input", () => {
    paint();
    onChange(input.value);
  });
  input.addEventListener("scroll", () => {
    mirror.scrollTop = input.scrollTop;
    mirror.scrollLeft = input.scrollLeft;
  });
  paint();

  return {
    setText(text: string) {
      if (input.value === text) return;
      input.value = text;
      paint();
    },
    getText: () => input.value,
    focus: () => input.focus(),
  };
}

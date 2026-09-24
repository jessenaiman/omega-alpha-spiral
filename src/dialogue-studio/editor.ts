import ghostFloor01 from "../dialogue/ghost-floor-01.oml?raw";
import {
  DialogueTimeline,
  dialogueDocumentFromOml,
  type DialogueDocument,
  type DialogueEvent,
  type DialoguePresentation,
} from "../dialogue/timeline";
import { parseOml } from "../core/oml";
import type { Layout } from "../era-shaders/text";

type DialogueEditorHost = {
  line(speaker: string, text: string): void;
  supports(speaker: string): boolean;
  samples(): void;
  pause(): void;
  resume(): void;
  presentation(): DialoguePresentation;
  restore(presentation: DialoguePresentation): void;
  script?(document: DialogueDocument): void;
};

const layouts: readonly Layout[] = ["manuscript", "fragments", "passage"];
const layoutFrom = (value: string | undefined, fallback: Layout): Layout =>
  layouts.includes(value as Layout) ? (value as Layout) : fallback;

/**
 * Playback inspector for the OML editor. The editable source remains the .oml
 * text in the Script tab; this panel never creates a second dialogue format.
 */
export function createDialogueEditor(host: DialogueEditorHost) {
  const panel = window.document.createElement("aside");
  panel.id = "dialogue-editor";
  panel.setAttribute("aria-label", "Level dialogue preview");
  panel.innerHTML = `<h2>Level dialogue preview</h2>
    <p class="script-source">The game and this preview read the same .oml level file.</p>
    <ol id="script-outline" aria-label="Dialogue sequence"></ol>
    <div class="actions"><button id="script-play">Play level dialogue</button><button id="script-continue" disabled>Continue</button></div>
    <p id="script-state" role="status"></p>
    <p id="script-error" role="alert"></p>
    <button id="script-samples">Return to persona samples</button>`;
  window.document.body.append(panel);

  const el = <T extends HTMLElement>(id: string) =>
    panel.querySelector<T>(`#${id}`)!;
  const proceed = el<HTMLButtonElement>("script-continue");
  let active = false;
  let selectedIndex = -1;
  let document = documentFromText(ghostFloor01);
  let timeline = new DialogueTimeline(document, enter);

  function documentFromText(text: string): DialogueDocument {
    const level = parseOml(text);
    const current = host.presentation();
    const presentation: DialoguePresentation = {
      ...current,
      levelId: level.scene.id ?? current.levelId,
      eraShaderId: level.scene.era_shader ?? current.eraShaderId,
      layout: layoutFrom(level.scene.layout, current.layout),
    };
    const candidate = dialogueDocumentFromOml(
      level,
      level.scene.id
        ? `src/dialogue/${level.scene.id}.oml`
        : "current .oml editor buffer",
      presentation
    );
    for (const event of candidate.events)
      if (event.type === "line" && !host.supports(event.speaker))
        throw new Error(`No persona profile is loaded for ${event.speaker}.`);
    return candidate;
  }

  function outline() {
    el("script-outline").replaceChildren(
      ...document.events.map((event, index) => {
        const row = window.document.createElement("li");
        const button = window.document.createElement("button");
        const title = window.document.createElement("strong");
        const text = window.document.createElement("span");
        title.textContent = `${String(index + 1).padStart(2, "0")} · ${
          event.type === "line"
            ? event.speaker
            : event.type === "wait"
              ? "Pause"
              : "Player input"
        }`;
        text.textContent =
          event.type === "line"
            ? event.text
            : event.type === "wait"
              ? `${event.durationMs} ms`
              : event.label;
        button.append(title, text);
        button.disabled = true;
        button.setAttribute("aria-pressed", String(index === selectedIndex));
        if (active && timeline.index === index) button.dataset.playing = "true";
        row.append(button);
        return row;
      })
    );
  }

  function enter(event: DialogueEvent | undefined) {
    selectedIndex = timeline.index;
    proceed.disabled = event?.type !== "continue";
    el("script-state").textContent = !event
      ? "Level dialogue finished."
      : event.type === "line"
        ? `Writing · ${event.id}`
        : event.type === "wait"
          ? `Waiting ${event.durationMs / 1000}s · ${event.id}`
          : event.label;
    outline();
    if (event?.type === "line") host.line(event.speaker, event.text);
  }

  function start(index = 0) {
    active = true;
    panel.hidden = false;
    if (document.presentation) host.restore(document.presentation);
    document.presentation = host.presentation();
    host.resume();
    timeline.start(index);
    el("script-error").textContent = "";
  }

  function loadText(text: string) {
    try {
      document = documentFromText(text);
      timeline = new DialogueTimeline(document, enter);
      selectedIndex = -1;
      host.script?.(document);
      outline();
      el("script-error").textContent = "";
    } catch (reason) {
      el("script-error").textContent =
        reason instanceof Error ? reason.message : String(reason);
    }
  }

  el("script-play").onclick = () => start();
  proceed.onclick = () => timeline.proceed();
  el("script-samples").onclick = () => {
    active = false;
    panel.hidden = true;
    host.samples();
  };

  host.script?.(document);
  outline();

  return {
    start,
    setPresentation(presentation: DialoguePresentation) {
      document.presentation = structuredClone(presentation);
      host.script?.(document);
    },
    deactivate() {
      active = false;
      panel.hidden = true;
    },
    tick(ms: number, finished: boolean) {
      if (active) timeline.tick(ms, finished);
    },
    loadText,
    dispose() {
      panel.remove();
    },
  };
}

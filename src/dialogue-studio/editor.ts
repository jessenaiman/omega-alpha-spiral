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
    <pre id="script-event-details" aria-label="Current OML event"></pre>
    <input id="script-input-value" aria-label="Preview player input" hidden>
    <p id="script-hint" aria-label="Authored gameplay hint"></p>
    <pre id="script-values" aria-label="Preview dialogue state"></pre>
    <div class="actions"><button id="script-play">Play level dialogue</button><button id="script-play-completion" disabled>Play completion</button><button id="script-continue" disabled>Continue</button></div>
    <p id="script-state" role="status"></p>
    <p id="script-error" role="alert"></p>
    <button id="script-samples">Return to persona samples</button>`;
  window.document.body.append(panel);

  const el = <T extends HTMLElement>(id: string) =>
    panel.querySelector<T>(`#${id}`)!;
  const proceed = el<HTMLButtonElement>("script-continue");
  let active = false;
  let selectedIndex = -1;
  let activeOffset = 0;
  const previewValues: Record<string, string> = {};
  let document = documentFromText(ghostFloor01);
  let timeline = new DialogueTimeline(document, enter);
  const completionButton = el<HTMLButtonElement>("script-play-completion");

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
    for (const event of [...candidate.events, ...(candidate.completion ?? [])]) {
      if (
        event.type === "line" ||
        event.type === "question" ||
        event.type === "choice"
      ) {
        const speaker = event.type === "question" ? "omega" : event.speaker;
        if (!host.supports(speaker))
          throw new Error(`No persona profile is loaded for ${speaker}.`);
      }
    }
    return candidate;
  }

  function outline() {
    el("script-outline").replaceChildren(
      ...[...document.events, ...(document.completion ?? [])].map(
        (event, index) => {
          const row = window.document.createElement("li");
          const button = window.document.createElement("button");
          const title = window.document.createElement("strong");
          const text = window.document.createElement("span");
          const isCompletion = index >= document.events.length;
          title.textContent = `${isCompletion ? "Completion" : "Script"} · ${String(
            isCompletion ? index - document.events.length + 1 : index + 1
          ).padStart(2, "0")} · ${event.type}`;
          text.textContent =
            event.type === "line" ||
            event.type === "question" ||
            event.type === "choice"
              ? event.text
              : event.type === "wait"
                ? `${event.durationMs} ms`
                : event.type === "continue"
                  ? event.label
                  : event.type === "input"
                    ? `${event.prompt} → ${event.statePath}`
                    : event.type === "cue"
                      ? `${event.text} → ${event.await}`
                  : event.type === "set-state"
                    ? `${event.operation} ${event.path} = ${event.value}`
                    : event.type === "emit"
                      ? event.name
                      : event.type === "transition"
                        ? event.level
                        : "";
          button.append(title, text);
          button.disabled = true;
          button.setAttribute("aria-pressed", String(index === selectedIndex));
          if (active && activeOffset + timeline.index === index)
            button.dataset.playing = "true";
          row.append(button);
          return row;
        }
      )
    );
  }

  function enter(event: DialogueEvent | undefined) {
    selectedIndex = event ? activeOffset + timeline.index : -1;
    const input = el<HTMLInputElement>("script-input-value");
    input.hidden = event?.type !== "input";
    if (event?.type === "input") {
      input.value = "";
      input.placeholder = event.hint;
      input.maxLength = event.maxLength;
    }
    el("script-hint").textContent =
      event?.type === "input" || event?.type === "cue" ? event.hint : "";
    proceed.disabled =
      event?.type !== "continue" &&
      event?.type !== "input" &&
      event?.type !== "cue";
    proceed.textContent =
      event?.type === "input"
        ? "Submit input"
        : event?.type === "cue"
          ? "Complete cue"
          : "Continue";
    el("script-event-details").textContent = event
      ? JSON.stringify(event, null, 2) ?? ""
      : "";
    el("script-state").textContent = !event
      ? activeOffset === 0
        ? "Level dialogue finished."
        : "Completion finished."
      : event.type === "line"
        ? `Writing · ${event.id}`
        : event.type === "question" || event.type === "choice"
          ? `Writing · ${event.id}`
        : event.type === "wait"
          ? `Waiting ${event.durationMs / 1000}s · ${event.id}`
          : event.type === "continue"
            ? event.label
            : event.type === "input"
              ? `Input · ${event.inputId}`
              : event.type === "cue"
                ? `Cue · ${event.cueId}`
            : `${event.type} · ${event.id}`;
    outline();
    if (event?.type === "line" || event?.type === "choice")
      host.line(event.speaker, event.text);
    else if (event?.type === "question") host.line("omega", event.text);
    else if (event?.type === "input") host.line("omega", event.prompt);
    else if (event?.type === "cue") host.line("omega", event.text);
  }

  function start(index = 0, completion = false) {
    active = true;
    panel.hidden = false;
    activeOffset = completion ? document.events.length : 0;
    timeline = new DialogueTimeline(document, enter);
    if (document.presentation) host.restore(document.presentation);
    document.presentation = host.presentation();
    host.resume();
    if (completion) timeline.startCompletion(index);
    else timeline.start(index);
    el("script-error").textContent = "";
  }

  function loadText(text: string) {
    try {
      document = documentFromText(text);
      timeline = new DialogueTimeline(document, enter);
      completionButton.disabled = !document.completion?.length;
      selectedIndex = -1;
      host.script?.(document);
      outline();
      el("script-error").textContent = "";
    } catch (reason) {
      el("script-error").textContent =
        reason instanceof Error ? reason.message : String(reason);
    }
  }

  completionButton.disabled = !document.completion?.length;
  el("script-play").onclick = () => start();
  completionButton.onclick = () => start(0, true);
  proceed.onclick = () => {
    const event = timeline.current;
    if (event?.type === "continue") timeline.proceed();
    else if (event?.type === "input") {
      const input = el<HTMLInputElement>("script-input-value");
      const value = input.value.trim().slice(0, event.maxLength);
      if (!value) {
        input.setCustomValidity("Enter a value to preview this input event.");
        input.reportValidity();
        return;
      }
      input.setCustomValidity("");
      previewValues[event.statePath] = value;
      el("script-values").textContent = JSON.stringify(previewValues, null, 2);
      timeline.resolveInput(event.inputId);
    }
    else if (event?.type === "cue") timeline.resolveCue(event.await);
  };
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

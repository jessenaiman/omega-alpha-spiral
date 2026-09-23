import opening from "./opening.dialogue.json?raw";
import {
  DialogueTimeline,
  parseDialogue,
  type DialogueEvent,
  type DialogueDocument,
  type DialoguePresentation,
} from "./DialogueTimeline";
import eraResearchPrompt from "../../../artifacts/omega-dialogue-studio/era-research-prompt.md?raw";
import { PROFILES, SPEAKERS } from "./profiles";

export function createDialogueEditor(host: {
  line(speaker: string, text: string): void;
  supports(speaker: string): boolean;
  samples(): void;
  pause(): void;
  resume(): void;
  presentation(): DialoguePresentation;
  restore(presentation: DialoguePresentation): void;
}) {
  const panel = window.document.createElement("aside");
  panel.id = "dialogue-editor";
  panel.setAttribute("aria-label", "Opening script editor");
  panel.innerHTML = `<h2>Opening transmission</h2>
    <p class="script-source">Adapted from your Godot opening. Recorded output; word alternatives preserved.</p>
    <ol id="script-outline" aria-label="Dialogue sequence"></ol>
    <div class="actions script-structure">
      <button id="script-up" aria-label="Move selected instruction up">↑</button><button id="script-down" aria-label="Move selected instruction down">↓</button>
      <button id="script-duplicate">Duplicate</button><button id="script-remove">Remove</button>
    </div>
    <label>Selected instruction<input id="script-id" readonly></label>
    <label id="script-speaker-label">Speaker<select id="script-speaker"></select></label>
    <label id="script-text-label">Dialogue text<textarea id="script-text" rows="5" maxlength="220" spellcheck="false"></textarea></label>
    <label id="script-wait-label" hidden>Pause in milliseconds<input id="script-wait" type="number" min="0" max="60000" step="100"></label>
    <details><summary>Add instruction</summary><div class="actions"><button id="script-add-line">Dialogue line</button><button id="script-add-wait">Timed pause</button><button id="script-add-continue">Wait for player</button></div></details>
    <div class="actions"><button id="script-apply">Apply & preview</button><button id="script-play">Play opening</button></div>
    <div class="actions"><button id="script-undo" disabled>Undo</button><button id="script-redo" disabled>Redo</button></div>
    <p id="script-save-state" role="status">Original opening</p>
    <p id="script-state" role="status"></p>
    <button id="script-continue" disabled>Continue</button>
    <details><summary>Dialogue file</summary><p id="script-origin"></p>
      <div class="actions"><button id="script-save">Export JSON</button><button id="script-open">Open JSON</button></div>
      <label>Shared JSON source<textarea id="script-json" rows="12" spellcheck="false"></textarea></label>
      <button id="script-apply-json">Apply JSON</button>
      <input id="script-file" type="file" accept=".json,application/json" hidden>
    </details>
    <details><summary>Research more text eras</summary><p>Copy this prompt into your research tool and return its chronology and source links.</p><textarea id="era-research" rows="10" readonly aria-label="Era research prompt"></textarea></details>
    <p id="script-error" role="alert"></p>
    <button id="script-samples">Return to voice samples</button>`;
  window.document.body.append(panel);
  const el = <T extends HTMLElement>(id: string) =>
    panel.querySelector<T>(`#${id}`)!;
  let selectedIndex = 0;
  const speaker = el<HTMLSelectElement>("script-speaker");
  for (const id of SPEAKERS) {
    const option = window.document.createElement("option");
    option.value = id;
    option.textContent = PROFILES[id].label;
    speaker.append(option);
  }
  const input = el<HTMLTextAreaElement>("script-text");
  const proceed = el<HTMLButtonElement>("script-continue");
  const drafts = new Map<string, DialogueEvent>();
  const undo: DialogueDocument[] = [],
    redo: DialogueDocument[] = [];
  let document = parseDialogue(opening),
    active = false;
  el<HTMLTextAreaElement>("era-research").value = eraResearchPrompt;
  let timeline = new DialogueTimeline(document, enter);
  function outline() {
    el("script-outline").replaceChildren(
      ...document.events.map((saved, index) => {
        const event = drafts.get(saved.id) ?? saved;
        const row = window.document.createElement("li");
        const button = window.document.createElement("button");
        const title = window.document.createElement("strong");
        const text = window.document.createElement("span");
        title.textContent = `${String(index + 1).padStart(2, "0")} · ${event.type === "line" ? event.speaker : event.type === "wait" ? "Pause" : "Wait for player"}`;
        text.textContent =
          event.type === "line"
            ? event.text
            : event.type === "wait"
              ? `${event.durationMs} ms`
              : event.label;
        button.append(title, text);
        button.setAttribute("aria-pressed", String(index === selectedIndex));
        if (active && timeline.index === index) button.dataset.playing = "true";
        button.onclick = () => {
          host.pause();
          selectedIndex = index;
          showSelected();
        };
        row.append(button);
        return row;
      })
    );
    el<HTMLButtonElement>("script-up").disabled = selectedIndex === 0;
    el<HTMLButtonElement>("script-down").disabled =
      selectedIndex === document.events.length - 1;
    el<HTMLButtonElement>("script-remove").disabled =
      document.events.length === 1;
  }
  function showSelected() {
    const saved = document.events[selectedIndex];
    const event = drafts.get(saved.id) ?? saved;
    el<HTMLInputElement>("script-id").value = event.id;
    input.value =
      event.type === "line"
        ? event.text
        : event.type === "continue"
          ? event.label
          : "";
    el("script-text-label").hidden = event.type === "wait";
    el("script-speaker-label").hidden = event.type !== "line";
    el("script-wait-label").hidden = event.type !== "wait";
    if (event.type === "line") speaker.value = event.speaker;
    if (event.type === "wait")
      el<HTMLInputElement>("script-wait").value = String(event.durationMs);
    el<HTMLButtonElement>("script-apply").disabled = false;
    outline();
  }
  function refresh() {
    selectedIndex = Math.max(
      0,
      Math.min(selectedIndex, document.events.length - 1)
    );
    el("script-origin").textContent = document.source;
    panel.querySelector("h2")!.textContent = document.title;
    showSelected();
    el<HTMLTextAreaElement>("script-json").value = JSON.stringify(
      document,
      null,
      2
    );
  }
  function changed(message = "Changed · export JSON to save your design") {
    el("script-save-state").textContent = message;
    el<HTMLButtonElement>("script-undo").disabled = undo.length === 0;
    el<HTMLButtonElement>("script-redo").disabled = redo.length === 0;
    el<HTMLTextAreaElement>("script-json").value = JSON.stringify(
      document,
      null,
      2
    );
  }
  function commit(candidate: DialogueDocument) {
    const valid = parseDialogue(JSON.stringify(candidate));
    for (const event of valid.events)
      if (event.type === "line" && !host.supports(event.speaker))
        throw new Error(
          `No writing profile loaded for ${event.speaker}. Current document preserved.`
        );
    undo.push(structuredClone(document));
    if (undo.length > 50) undo.shift();
    redo.length = 0;
    document = valid;
    timeline = new DialogueTimeline(document, enter);
    changed();
  }
  function applyDrafts() {
    if (!drafts.size) return;
    const candidate = structuredClone(document);
    for (const event of candidate.events)
      if (drafts.has(event.id)) Object.assign(event, drafts.get(event.id));
    commit(candidate);
    drafts.clear();
  }
  function enter(event: DialogueEvent | undefined) {
    proceed.disabled = event?.type !== "continue";
    el("script-state").textContent = !event
      ? "Block finished. Replay to iterate."
      : event.type === "line"
        ? `Writing · ${event.id}`
        : event.type === "wait"
          ? `Waiting ${event.durationMs / 1000}s · ${event.id}`
          : event.label;
    if (event) {
      selectedIndex = timeline.index;
      showSelected();
    } else outline();
    if (event?.type === "line") host.line(event.speaker, event.text);
  }
  function start(index = 0) {
    try {
      applyDrafts();
    } catch (reason) {
      error(reason);
      return;
    }
    active = true;
    panel.hidden = false;
    if (document.presentation) host.restore(document.presentation);
    document.presentation = host.presentation();
    host.resume();
    timeline.start(index);
  }
  function error(reason: unknown) {
    el("script-error").textContent =
      reason instanceof Error ? reason.message : String(reason);
  }
  function retainDraft() {
    host.pause();
    const event = structuredClone(document.events[selectedIndex]);
    if (event.type === "line") {
      event.text = input.value;
      event.speaker = speaker.value;
    }
    if (event.type === "continue") event.label = input.value;
    if (event.type === "wait")
      event.durationMs = el<HTMLInputElement>("script-wait").valueAsNumber;
    drafts.set(event.id, event);
    el("script-save-state").textContent =
      "Draft retained · preview or export to apply";
    outline();
  }
  input.oninput = retainDraft;
  speaker.onchange = retainDraft;
  el<HTMLInputElement>("script-wait").oninput = retainDraft;
  el("script-apply").onclick = () => {
    const index = selectedIndex;
    try {
      applyDrafts();
      el("script-error").textContent = "";
      start(index);
    } catch (reason) {
      error(reason);
    }
  };
  el("script-play").onclick = () => start();
  proceed.onclick = () => timeline.proceed();
  function restructure(edit: (events: DialogueEvent[]) => void) {
    host.pause();
    try {
      applyDrafts();
      const candidate = structuredClone(document);
      edit(candidate.events);
      commit(candidate);
      refresh();
      proceed.disabled = true;
      el("script-state").textContent =
        "Sequence edited · play or preview to continue";
      el("script-error").textContent = "";
    } catch (reason) {
      error(reason);
    }
  }
  el("script-up").onclick = () =>
    restructure((events) => {
      if (selectedIndex < 1) return;
      [events[selectedIndex - 1], events[selectedIndex]] = [
        events[selectedIndex],
        events[selectedIndex - 1],
      ];
      selectedIndex--;
    });
  el("script-down").onclick = () =>
    restructure((events) => {
      if (selectedIndex >= events.length - 1) return;
      [events[selectedIndex + 1], events[selectedIndex]] = [
        events[selectedIndex],
        events[selectedIndex + 1],
      ];
      selectedIndex++;
    });
  el("script-duplicate").onclick = () =>
    restructure((events) => {
      const copy = structuredClone(events[selectedIndex]);
      copy.id = `${copy.id}-${crypto.randomUUID().slice(0, 8)}`;
      events.splice(++selectedIndex, 0, copy);
    });
  el("script-remove").onclick = () =>
    restructure((events) => {
      if (events.length > 1) events.splice(selectedIndex, 1);
    });
  function insert(event: DialogueEvent) {
    restructure((events) => {
      events.splice(++selectedIndex, 0, event);
    });
  }
  el("script-add-line").onclick = () =>
    insert({
      id: crypto.randomUUID(),
      type: "line",
      speaker: "omega",
      text: "[Write dialogue here]",
    });
  el("script-add-wait").onclick = () =>
    insert({ id: crypto.randomUUID(), type: "wait", durationMs: 1000 });
  el("script-add-continue").onclick = () =>
    insert({
      id: crypto.randomUUID(),
      type: "continue",
      label: "Waiting for player to continue",
    });
  function travelHistory(from: DialogueDocument[], to: DialogueDocument[]) {
    const previous = from.pop();
    if (!previous) return;
    host.pause();
    to.push(structuredClone(document));
    document = previous;
    drafts.clear();
    timeline = new DialogueTimeline(document, enter);
    refresh();
    if (document.presentation) host.restore(document.presentation);
    changed("Revision restored · preview to see it, export to save");
  }
  el("script-undo").onclick = () => travelHistory(undo, redo);
  el("script-redo").onclick = () => travelHistory(redo, undo);
  el("script-save").onclick = () => {
    try {
      applyDrafts();
    } catch (reason) {
      error(reason);
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(document, null, 2) + "\n"], {
        type: "application/json",
      })
    );
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "opening.dialogue.json";
    link.click();
    changed(
      "JSON export requested · includes text, era, layout and writing settings"
    );
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  el("script-open").onclick = () => el<HTMLInputElement>("script-file").click();
  el<HTMLInputElement>("script-file").onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      if (file.size > 250000)
        throw new Error("Use a dialogue file smaller than 250 KB.");
      const candidate = parseDialogue(await file.text());
      applyDrafts();
      commit(candidate);
      el("script-error").textContent = "";
      refresh();
      start();
    } catch (reason) {
      error(reason);
    }
    (e.target as HTMLInputElement).value = "";
  };
  el("script-apply-json").onclick = () => {
    try {
      const candidate = parseDialogue(
        el<HTMLTextAreaElement>("script-json").value
      );
      applyDrafts();
      commit(candidate);
      el("script-error").textContent = "";
      refresh();
      start();
    } catch (reason) {
      error(reason);
    }
  };
  el("script-samples").onclick = () => {
    active = false;
    panel.hidden = true;
    host.samples();
  };
  refresh();
  return {
    start,
    setPresentation(presentation: DialoguePresentation) {
      if (
        !active ||
        JSON.stringify(document.presentation) === JSON.stringify(presentation)
      )
        return;
      const valid = parseDialogue(
        JSON.stringify({ ...document, presentation })
      );
      undo.push(structuredClone(document));
      if (undo.length > 50) undo.shift();
      redo.length = 0;
      document.presentation = valid.presentation;
      changed();
    },
    deactivate() {
      active = false;
      panel.hidden = true;
    },
    tick(ms: number, finished: boolean) {
      if (active) timeline.tick(ms, finished);
    },
    dispose() {
      panel.remove();
    },
  };
}

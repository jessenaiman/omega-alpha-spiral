import { TERMINAL_COPY, TERMINAL_SYMBOLS, type DreamweaverId } from '../content/script.js';
import { GhostTerminalPhase, type GhostTerminalSnapshot } from '../phases/GhostTerminalPhase.js';

export class GameUi {
  private readonly terminal: HTMLElement;
  private readonly status: HTMLElement;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly root: HTMLElement, private readonly phase: GhostTerminalPhase, private readonly enterTown: () => void = () => {}) {
    const terminal = root.querySelector<HTMLElement>('[data-ghost-terminal]');
    const status = root.querySelector<HTMLElement>('[data-game-status]');
    if (!terminal || !status) throw new Error('Ghost Terminal UI shell is incomplete.');
    this.terminal = terminal;
    this.status = status;
    this.unsubscribe = phase.subscribe(snapshot => this.render(snapshot));
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private render(snapshot: GhostTerminalSnapshot): void {
    this.terminal.replaceChildren();
    this.terminal.append(this.header(snapshot));

    const transcript = document.createElement('section');
    transcript.className = 'terminal-transcript';
    transcript.setAttribute('aria-live', 'polite');
    this.terminal.append(transcript);

    if (snapshot.stage === 'player-name') this.renderPlayerName(transcript);
    if (snapshot.stage === 'choice') this.renderChoice(transcript, snapshot);
    if (snapshot.stage === 'omega-name') this.renderOmegaName(transcript, snapshot);
    if (snapshot.stage === 'complete') this.renderComplete(transcript, snapshot);
  }

  private header(snapshot: GhostTerminalSnapshot): HTMLElement {
    const header = document.createElement('header');
    header.className = 'terminal-header';
    const identity = document.createElement('span');
    identity.textContent = 'OMEGA/SPIRAL';
    const instance = document.createElement('span');
    instance.dataset.terminalInstance = '';
    instance.textContent = `INSTANCE ${String(snapshot.instance).padStart(3, '0')}`;
    header.append(identity, instance);
    return header;
  }

  private renderPlayerName(target: HTMLElement): void {
    target.append(
      this.line('SIGNAL FOUND', 'signal'),
      this.line(TERMINAL_COPY.opening, 'opening'),
      this.line(TERMINAL_COPY.playerPrompt, 'prompt'),
    );
    const form = this.nameForm('player', 'YOUR NAME', 'COMMIT NAME', value => this.phase.submitPlayerName(value));
    target.append(form);
    queueMicrotask(() => form.querySelector<HTMLInputElement>('input')?.focus());
  }

  private renderChoice(target: HTMLElement, snapshot: GhostTerminalSnapshot): void {
    const question = snapshot.question;
    if (!question) throw new Error('Terminal question is missing.');
    const progress = this.line(`QUERY ${String(question.index).padStart(2, '0')} / 03`, 'progress');
    progress.dataset.questionId = question.id;
    target.append(progress, this.line(question.prompt, 'prompt'));

    const list = document.createElement('div');
    list.className = 'terminal-choices';
    for (const [index, choice] of question.choices.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `terminal-choice owner-${choice.owner}`;
      button.dataset.choiceOwner = choice.owner;
      button.disabled = snapshot.awaitingContinue;
      button.setAttribute('aria-pressed', String(snapshot.selectedOwner === choice.owner));
      const key = document.createElement('span');
      key.className = 'choice-key';
      key.textContent = `[${index + 1}]`;
      const label = document.createElement('span');
      label.textContent = choice.label;
      button.append(key, label);
      button.addEventListener('click', () => this.phase.selectChoice(choice.owner));
      list.append(button);
    }
    list.addEventListener('keydown', event => this.navigateChoices(event, list));
    target.append(list);

    if (snapshot.awaitingContinue && snapshot.response) {
      const response = this.line(snapshot.response, 'response');
      response.dataset.terminalResponse = '';
      const proceed = document.createElement('button');
      proceed.type = 'button';
      proceed.className = 'terminal-continue';
      proceed.dataset.continue = '';
      proceed.textContent = 'CONTINUE  ›';
      proceed.addEventListener('click', () => this.phase.continue());
      target.append(response, proceed);
      queueMicrotask(() => proceed.focus());
    } else {
      queueMicrotask(() => list.querySelector<HTMLButtonElement>('button')?.focus());
    }
  }

  private renderOmegaName(target: HTMLElement, snapshot: GhostTerminalSnapshot): void {
    target.append(
      this.line(TERMINAL_SYMBOLS, 'symbols'),
      this.line(`PLAYER // ${snapshot.playerName.toUpperCase()}`, 'signal'),
      this.line(TERMINAL_COPY.omegaPrompt, 'prompt'),
    );
    const form = this.nameForm('omega', 'NAME THE SIGNAL', 'COMMIT OMEGA', value => this.phase.submitOmegaName(value));
    target.append(form);
    queueMicrotask(() => form.querySelector<HTMLInputElement>('input')?.focus());
  }

  private renderComplete(target: HTMLElement, snapshot: GhostTerminalSnapshot): void {
    const complete = document.createElement('section');
    complete.className = 'terminal-complete';
    complete.dataset.terminalComplete = '';
    complete.append(
      this.line('RECIPROCAL IDENTIFICATION ACCEPTED', 'signal'),
      this.line(`${snapshot.playerName.toUpperCase()} ↔ ${snapshot.omegaName.toUpperCase()}`, 'symbols'),
      this.line(TERMINAL_COPY.complete, 'complete'),
      this.line('DISPLAY BUS // 640×480 // STANDBY', 'progress'),
    );
    const enter = document.createElement('button');
    enter.type = 'button';
    enter.className = 'terminal-continue';
    enter.textContent = 'ENTER THE TOWN';
    enter.addEventListener('click', () => {
      enter.disabled = true;
      this.enterTown();
    }, { once: true });
    complete.append(enter);
    target.append(complete);
    this.status.textContent = TERMINAL_COPY.handoff;
  }

  private nameForm(
    kind: 'player' | 'omega',
    labelText: string,
    submitText: string,
    submit: (value: string) => { readonly ok: boolean; readonly error?: string },
  ): HTMLFormElement {
    const form = document.createElement('form');
    form.className = 'terminal-name-form';
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 24;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.dataset[kind === 'player' ? 'playerName' : 'omegaName'] = '';
    label.append(input);
    const error = document.createElement('span');
    error.className = 'terminal-error';
    error.setAttribute('role', 'alert');
    error.dataset.nameError = '';
    const button = document.createElement('button');
    button.type = 'submit';
    button.dataset[kind === 'player' ? 'submitName' : 'submitOmega'] = '';
    button.textContent = submitText;
    form.append(label, error, button);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const result = submit(input.value);
      if (!result.ok) {
        error.textContent = result.error ?? 'Name rejected.';
        input.focus();
      }
    });
    return form;
  }

  private line(text: string, role: string): HTMLParagraphElement {
    const line = document.createElement('p');
    line.className = `terminal-line line-${role}`;
    line.textContent = text;
    return line;
  }

  private navigateChoices(event: KeyboardEvent, list: HTMLElement): void {
    if (!['ArrowDown', 'ArrowUp', 'KeyW', 'KeyS'].includes(event.code)) return;
    const buttons = [...list.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const direction = event.code === 'ArrowUp' || event.code === 'KeyW' ? -1 : 1;
    buttons[(current + direction + buttons.length) % buttons.length]?.focus();
    event.preventDefault();
  }
}

export function dreamweaverLabel(owner: DreamweaverId): string {
  return owner.toUpperCase();
}

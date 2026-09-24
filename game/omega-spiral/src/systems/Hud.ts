export class Hud {
  private readonly statusLine = this.getElement("#status-line");
  private readonly outcomePanel = this.getElement("#outcome-panel");
  private readonly outcomeText = this.getElement("#outcome-text");

  update(nearbyLabel: string | null, outcome: string | null, selected: "D" | "M" | "C" | null, complete: boolean): void {
    const label = selected === "D" ? "Door" : selected === "M" ? "Monster" : "Chest";
    this.statusLine.textContent = complete
      ? "Floor One complete · R to restart"
      : selected
        ? `Follow the ${label} threshold`
        : nearbyLabel
          ? `E · choose ${nearbyLabel}`
          : "Find one of three exits";
    this.outcomePanel.hidden = outcome === null;
    this.outcomeText.textContent = outcome ?? "";
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing HUD element: ${selector}`);
    return element;
  }
}

import logo from "../../assets/references/omega-spiral-logo-reference.png";
import "./start-menu.css";

/** The game is constructed only after Begin; menu clicks cannot advance its script. */
export function showStartMenu(begin: () => void): void {
  const game = document.querySelector<HTMLElement>("main.os-boot")!;
  game.hidden = true;
  game.inert = true;
  const menu = document.createElement("section");
  menu.className = "os-start-menu";
  menu.setAttribute("aria-labelledby", "os-start-title");
  menu.innerHTML = `<div class="os-start-content">
    <img class="os-start-mark" alt="" width="192" height="192">
    <p class="os-start-kicker">CHAPTER ZERO</p>
    <h1 id="os-start-title">Omega Spiral</h1>
    <button type="button" class="os-start-begin">Begin <span aria-hidden="true">↵</span></button>
    <details class="os-start-help"><summary>How to play</summary>
      <p><kbd>W A S D</kbd> or arrow keys to move.</p>
      <p>Stop at each question. Choose a strand and approach its Dreamweaver.</p>
      <p><kbd>Enter</kbd> to interact or continue. Type your name at the final doorway.</p>
    </details>
    <p class="os-start-note">Headphones recommended · sound can be muted in game</p>
  </div>`;
  menu.querySelector("img")!.src = logo;
  const button = menu.querySelector<HTMLButtonElement>("button")!;
  button.addEventListener("click", () => {
    button.disabled = true;
    game.hidden = false;
    game.inert = false;
    menu.remove();
    begin();
  }, { once: true });
  document.body.append(menu);
  button.focus({ preventScroll: true });
}

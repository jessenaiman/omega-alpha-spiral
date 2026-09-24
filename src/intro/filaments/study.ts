import { mountFilamentView } from "./FilamentView";

const slider = document.querySelector<HTMLInputElement>("#scrub")!;
const phase = document.querySelector<HTMLOutputElement>("#phase")!;
const play = document.querySelector<HTMLButtonElement>("#play")!;
const view = mountFilamentView(
  document.querySelector<HTMLElement>("#field")!,
  (time, label) => {
    slider.value = String(time);
    if (phase.value !== label) phase.value = label;
  }
);
play.textContent = view.playing ? "Pause" : "Play";
play.addEventListener("click", () => {
  view.setPlaying(!view.playing);
  play.textContent = view.playing ? "Pause" : "Play";
});
slider.addEventListener("input", () => {
  view.setPlaying(false);
  play.textContent = "Play";
  view.seek(Number(slider.value));
});
document
  .querySelectorAll<HTMLButtonElement>("[data-time]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      view.setPlaying(false);
      view.seek(Number(button.dataset.time));
      play.textContent = "Play";
    });
  });
window.addEventListener("pagehide", () => view.dispose(), { once: true });

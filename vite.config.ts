import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { studioDialogueSave } from "./tools/studio/save-dialogue";

export default defineConfig({
  plugins: [studioDialogueSave()],
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5188,
    strictPort: true,
    // Playwright holds recording files open on Windows; evidence is not source.
    watch: { ignored: ["**/artifacts/**"] },
  },
  preview: { host: "127.0.0.1", port: 4188, strictPort: true },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        basic: fileURLToPath(new URL("./basic.html", import.meta.url)),
        lab: fileURLToPath(new URL("./lab.html", import.meta.url)),
        floorOne: fileURLToPath(new URL("./floor-one.html", import.meta.url)),
        rogue: fileURLToPath(new URL("./rogue.html", import.meta.url)),
        intro: fileURLToPath(new URL("./intro.html", import.meta.url)),
        dialogueStudio: fileURLToPath(
          new URL("./omega-dialogue-studio.html", import.meta.url)
        ),
        legacyTypeStudy: fileURLToPath(
          new URL("./intro-type-prototype.html", import.meta.url)
        ),
      },
    },
  },
});

import { readFile, writeFile, readdir, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/** Local authoring endpoint for OML scenes. GET lists, POST writes one file. */
export function studioDialogueSave(): Plugin {
  const dir = fileURLToPath(new URL("../../src/dialogue/", import.meta.url));
  const safeName = (name: string) =>
    /^[a-z0-9][a-z0-9_-]*$/i.test(name) ? name : null;
  let saving = false;

  return {
    name: "omega-studio-save",
    configureServer(server) {
      server.middlewares.use("/api/studio/scenes", async (req, res) => {
        const reply = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        const local =
          req.headers.origin === `http://${req.headers.host}` &&
          /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host ?? "");
        if (!local)
          return reply(403, { error: "Save from this local studio tab." });

        if (req.method === "GET") {
          const files = (await readdir(dir))
            .filter((f) => f.endsWith(".oml"))
            .sort();
          return reply(200, { files });
        }

        if (req.method !== "POST")
          return reply(405, { error: "Use GET to list, POST to save." });
        if (saving)
          return reply(409, { error: "A save is in progress. Try again." });
        saving = true;
        try {
          let body = "";
          for await (const chunk of req) {
            body += chunk.toString();
            if (Buffer.byteLength(body) > 500000)
              return reply(413, { error: "Scene is too large." });
          }
          const request = JSON.parse(body);
          const name = safeName(String(request.name ?? ""));
          if (!name)
            return reply(400, { error: "Scene name must be a filename." });
          const text = String(request.text ?? "");
          if (!text.trim()) return reply(400, { error: "Scene is empty." });
          if (!/^\s*(\[script\]|#)/m.test(text))
            return reply(400, { error: "Scene needs a [script] section." });
          const file = `${dir}${name}.oml`;
          await writeFile(`${file}.saving`, text, "utf8");
          await rename(`${file}.saving`, file);
          reply(200, { saved: true, scene: name, game: "/intro.html" });
        } catch (error) {
          reply(400, {
            error: error instanceof Error ? error.message : "Could not save.",
          });
        } finally {
          saving = false;
        }
      });
    },
  };
}

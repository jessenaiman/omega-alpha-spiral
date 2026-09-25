import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import type { Plugin } from "vite";
import { parseOmd, parseOml, speakerId } from "../../src/core/oml";
import { assertEraShaderBuilt, resolveEraShader } from "../../src/era-shaders";

/** Local-only authoring endpoint. The game imports dialogue files, never this plugin. */
export function studioDialogueSave(): Plugin {
  const dir = fileURLToPath(new URL("../../src/dialogue/", import.meta.url));
  const safeName = (name: string) =>
    /^[a-z0-9][a-z0-9_-]*\.(oml|omd|oms)$/i.test(name) ? name : null;
  const ajv = new Ajv();
  let saving = false;

  async function validate(name: string, text: string): Promise<void> {
    const kind = name.slice(-4).toLowerCase();
    if (kind === ".oml") {
      const script = parseOml(text);
      if (!/^\s*\[script\]\s*$/m.test(text) || !script.events.length)
        throw new Error("Scene needs a [script] section with dialogue events.");
      const schemaText = await readFile(join(dir, "dialogue.oms"), "utf8");
      const check = ajv.compile(JSON.parse(schemaText));
      if (!check(script))
        throw new Error(
          `${name} does not match dialogue.oms: ${ajv.errorsText(check.errors)}`
        );
      assertEraShaderBuilt(resolveEraShader(script.scene.era_shader ?? ""));
      for (const voice of script.voices) {
        const file = safeName(voice.file ?? "");
        if (!file?.toLowerCase().endsWith(".omd"))
          throw new Error(`${voice.name} needs a declared .omd file.`);
        const design = parseOmd(await readFile(join(dir, file), "utf8"));
        if (speakerId(voice.name) !== speakerId(design.id ?? ""))
          throw new Error(`${file} does not define ${voice.name}.`);
      }
      for (const npc of script.npcs) {
        assertEraShaderBuilt(resolveEraShader(npc.era_shader));
        const voice = safeName(npc.voice);
        if (!voice?.toLowerCase().endsWith(".omd"))
          throw new Error(`${npc.display_name} needs a declared .omd voice.`);
        await readFile(join(dir, voice), "utf8");
      }
      const next = script.scene.next;
      if (next) await readFile(join(dir, `${next}.oml`), "utf8");
      return;
    }
    if (kind === ".omd") {
      const design = parseOmd(text);
      const schema = safeName(design.schema ?? "");
      if (!schema?.endsWith(".oms"))
        throw new Error("Design needs schema = filename.oms.");
      const check = ajv.compile(JSON.parse(await readFile(join(dir, schema), "utf8")));
      if (!check(design))
        throw new Error(`Design does not match ${schema}: ${ajv.errorsText(check.errors)}`);
      return;
    }
    const candidate = ajv.compile(JSON.parse(text));
    for (const file of await readdir(dir)) {
      if (file.endsWith(".omd")) {
        const design = parseOmd(await readFile(join(dir, file), "utf8"));
        if (design.schema === name && !candidate(design))
          throw new Error(
            `${file} does not match ${name}: ${ajv.errorsText(candidate.errors)}`
          );
      } else if (file.endsWith(".oml")) {
        const level = parseOml(await readFile(join(dir, file), "utf8"));
        if (!candidate(level))
          throw new Error(
            `${file} does not match ${name}: ${ajv.errorsText(candidate.errors)}`
          );
      }
    }
  }

  return {
    name: "omega-studio-save",
    configureServer(server) {
      server.middlewares.use("/api/studio/files", async (req, res) => {
        let ownsSave = false;
        const reply = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        const host = req.headers.host ?? "";
        if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) ||
          (req.method === "POST" && req.headers.origin !== `http://${host}`))
          return reply(403, { error: "Use the local dialogue studio." });

        try {
          if (req.method === "GET") {
            const name = new URL(req.url ?? "/", `http://${host}`).searchParams.get("name");
            if (name) {
              if (!safeName(name)) return reply(400, { error: "Invalid filename." });
              return reply(200, { name, text: await readFile(join(dir, name), "utf8") });
            }
            const files = (await readdir(dir))
              .filter((file) => safeName(file))
              .sort();
            return reply(200, { files });
          }
          if (req.method !== "POST")
            return reply(405, { error: "Use GET to open or POST to save." });
          if (saving) return reply(409, { error: "A save is in progress." });
          saving = true;
          ownsSave = true;
          let body = "";
          for await (const chunk of req) {
            body += chunk.toString();
            if (Buffer.byteLength(body) > 500000)
              return reply(413, { error: "File is too large." });
          }
          const request = JSON.parse(body);
          const name = safeName(String(request.name ?? ""));
          if (!name) return reply(400, { error: "Invalid filename." });
          const text = String(request.text ?? "");
          if (!text.trim()) return reply(400, { error: "File is empty." });
          await validate(name, text);
          const file = join(dir, name);
          await writeFile(`${file}.saving`, text, "utf8");
          await rename(`${file}.saving`, file);
          return reply(200, { saved: true, name });
        } catch (error) {
          return reply(400, { error: error instanceof Error ? error.message : "Could not open or save." });
        } finally {
          if (ownsSave) saving = false;
        }
      });
    },
  };
}

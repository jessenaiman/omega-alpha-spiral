import { readFile } from "node:fs/promises";

// Inventory only; this does not certify artistic approval or runtime readiness.
const catalog = JSON.parse(await readFile(
  new URL("../../assets/intro/catalog.json", import.meta.url), "utf8"
));
for (const asset of catalog.assets) {
  console.log(`${asset.status}\t${asset.id}\t${asset.path}\t${asset.role}`);
}

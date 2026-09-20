import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { compileVfxExport, loadVfxExportBundle } from 'nixie-fx/export';

const source: unknown = JSON.parse(readFileSync(new URL('./boot-dust.json', import.meta.url), 'utf8'));
const compiled = compileVfxExport([{ effect: source, effectPath: 'boot-dust.json' }]);
const effectsByPath = Object.fromEntries(compiled.effects.map((entry) => [entry.path, entry.effect]));
const bundle = { manifest: compiled.manifest, effectsByPath, assetPaths: [] };
loadVfxExportBundle(bundle, { requiredBackend: 'three3d', requiredEffectIds: ['boot-dust'], requireEveryAsset: true });
const output: URL = new URL('../../src/intro/vfx/', import.meta.url);
mkdirSync(output, { recursive: true });
writeFileSync(new URL('boot-dust.bundle.json', output), JSON.stringify(bundle, null, 2) + '\n');
process.stdout.write(JSON.stringify({ validation: compiled.validation, support: compiled.effects[0].effect.support.backends.three3d }) + '\n');

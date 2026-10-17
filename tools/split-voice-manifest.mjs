// Rebuild the language indexes without recording or touching MP3s.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import manifests from './voice-manifests.cjs';
const dir = new URL('../voices/', import.meta.url);
const all = JSON.parse(fs.readFileSync(new URL('manifest.json', dir), 'utf8'));
for (const [lang, shard] of Object.entries(manifests.splitManifest(all))) {
  const file = new URL(`manifest-${lang}.json`, dir);
  fs.writeFileSync(file, JSON.stringify(shard));
  console.log(`${fileURLToPath(file)}: ${Object.keys(shard.lines).length} lines, ${fs.statSync(file).size} bytes`);
}

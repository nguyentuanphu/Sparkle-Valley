// (Welcome steady, owner 16-17 Oct AEDT) pictures of the Welcome screen in English and Vietnamese on a phone, a tablet
// and a computer, for the before and after of the steady Start button.
// Usage (game served on :8765, from tools/): node welcome-shots.mjs <folder> → docs/owner-repair-20261014/evidence/<folder>/<device>-<lang>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open } from '../tests/harness.mjs';
const out = fileURLToPath(new URL(`../docs/owner-repair-20261014/evidence/${process.argv[2] || 'welcome-steady'}/`, import.meta.url));
fs.mkdirSync(out, { recursive: true });
const SIZES = { phone: [390, 844, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const b = await launch();
for (const [dev, [w, h, touch]] of Object.entries(SIZES)) for (const lang of ['en', 'vi']) {
  const P = await open(b, { w, h, touch, lang, play: false, settings: { calm: false } });
  await P.page.waitForTimeout(1200);
  await P.page.screenshot({ path: path.join(out, `${dev}-${lang}.png`) });
  if (P.errors.length) console.log(dev, lang, 'errors:', P.errors.slice(0, 3).join(' | '));
  await P.ctx.close(); console.log('took', dev, lang);
}
await b.close();

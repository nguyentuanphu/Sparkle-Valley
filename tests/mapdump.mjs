import { launch, open, clear } from './harness.mjs';
import fs from 'fs';
const b = await launch();
const { page } = await open(b, { w: 900, h: 900 });
await clear(page);
await page.evaluate(() => __sv.openPad(0, 'map')); await page.waitForTimeout(800);
const url = await page.evaluate(() => document.querySelector('.bigmap').toDataURL('image/png'));
fs.writeFileSync('out/map.png', Buffer.from(url.split(',')[1], 'base64'));
await b.close();

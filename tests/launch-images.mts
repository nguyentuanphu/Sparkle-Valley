// iPhone and iPad launch pictures (owner, 23 Oct 2026 AEDT: "the white screen comes back" on the Home Screen app).
// A Home Screen web app on iOS shows plain white from the tap until the page paints, unless index.html names an
// apple-touch-startup-image for the exact screen. This draws the same light Welcome screen as index.html's #boot for
// every current iPhone and iPad size, portrait and landscape, into icons/launch/, and writes the links between the
// launch:start and launch:end marks in index.html. Run after changing the Welcome look: node tests/launch-images.mts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'icons/launch');
// [css width, css height, pixel ratio] in portrait: iPhones from SE to 16 Pro Max, then iPads
export const SCREENS: [number, number, number][] = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3], [428, 926, 3],
  [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3],
  [768, 1024, 2], [744, 1133, 2], [810, 1080, 2], [820, 1180, 2], [834, 1112, 2], [834, 1194, 2], [1024, 1366, 2]
];
const page = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;box-sizing:border-box;
background:linear-gradient(#e8f6ff,#f8f1ff);color:#4a2a78;text-align:center;font:20px system-ui,sans-serif}
h1{margin:0;font-size:clamp(28px,6vw,48px);max-width:600px}p{margin:0;font-size:clamp(18px,3.6vw,26px);opacity:.85}</style>
<h1>Welcome to Sparkle Valley</h1><p>Chào mừng đến Thung Lũng Lấp Lánh</p>`;

const links: string[] = [];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [w, h, dpr] of SCREENS) for (const portrait of [true, false]) {
    const [vw, vh] = portrait ? [w, h] : [h, w], name = `launch-${vw * dpr}x${vh * dpr}.png`;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr }), p = await ctx.newPage();
    await p.setContent(page); await p.screenshot({ path: path.join(out, name) }); await ctx.close();
    links.push(`<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${portrait ? 'portrait' : 'landscape'})" href="icons/launch/${name}">`);
  }
} finally { await browser.close(); }
const file = path.join(root, 'index.html'), html = fs.readFileSync(file, 'utf8');
const marks = /<!-- launch:start[\s\S]*?<!-- launch:end -->/;
if (!marks.test(html)) throw new Error('index.html: no launch:start / launch:end marks');
fs.writeFileSync(file, html.replace(marks, `<!-- launch:start (tests/launch-images.mts) -->\n${[...new Set(links)].join('\n')}\n<!-- launch:end -->`));
console.log(`launch pictures: ${new Set(links).size}`);

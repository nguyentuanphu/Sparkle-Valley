// Rebuild the self-contained design proposal; this does not touch game files.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const data=(file,mime)=>`data:${mime};base64,${fs.readFileSync(path.join(root,file)).toString('base64')}`;
const source=execFileSync('git',['show','f1dc57cd:js/art.js'],{cwd:root,encoding:'utf8'});
const {artSVG}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let html=fs.readFileSync(path.join(here,'prototype.template.html'),'utf8');
const home=`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 24L24 9l19 15" fill="#ff8a5a" stroke="#3b2a4f" stroke-width="2.6" stroke-linejoin="round"/><path d="M10 23h28v20H10z" fill="#fff3d0" stroke="#3b2a4f" stroke-width="2.6"/><path d="M21 43V31h8v12" fill="#b07a4a" stroke="#3b2a4f" stroke-width="2.6"/><rect x="14" y="27" width="5" height="5" rx="1" fill="#8ed7f3" stroke="#3b2a4f" stroke-width="1.5"/><path d="M37 2l2.1 4.4 4.9.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L30 7.1l4.9-.7z" fill="#ffd23f" stroke="#3b2a4f" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const keys={OWL:'🦉',BOOK:'📖',NUMBERS:'🔢',MUSIC:'🎵',BRAIN:'🧩',PIG:'🐷',HEART:'💛',GEAR:'⚙️',CLOCK:'🕒',KITE:'🪁'};
for(const [key,value]of Object.entries(keys)){const art=artSVG(value);if(!art)throw new Error('Missing actual game art: '+key);html=html.replaceAll(`/*${key}*/`,art)}
html=html.replaceAll('/*HOMEICON*/',home);
const imageKeys={HERO:'docs/website-review-20261023/assets/hero-vietnam-australia.png','GAME-BG':'marketing/source/stills10/cine-hoian-en.jpg',BANNER:'docs/learning-banner-20261021/sparkle-valley-combined-heritage.png'};
for(const [key,file]of Object.entries(imageKeys))html=html.replaceAll(`/*${key}*/`,data(file,file.endsWith('.png')?'image/png':'image/jpeg'));
let fonts='';for(const [name,file]of [['Fredoka','Fredoka-latin-500.woff2'],['Baloo','Baloo2-latin-600.woff2'],['Baloo','Baloo2-latin-ext-600.woff2'],['Baloo','Baloo2-vietnamese-600.woff2']])fonts+=`@font-face{font-family:${name};font-style:normal;font-weight:400 800;font-display:swap;src:url(${data('fonts/'+file,'font/woff2')}) format('woff2');${file.includes('vietnamese')?'unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9;':''}}`;
html=html.replace('/*FONTS*/',fonts);
if(/\/\*[A-Z-]+\*\//.test(html))throw new Error('Unfilled asset placeholder');
fs.writeFileSync(path.join(here,'prototype.html'),html);
console.log('Created self-contained prototype.html using r88 game SVG art, bundled fonts and project images.');

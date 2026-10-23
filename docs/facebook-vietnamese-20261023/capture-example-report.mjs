// Run against a compiled, isolated r88 export. No actual child profiles are read.
// SV_CAPTURE_ROOT=/tmp/sv-parent-capture-r88 node docs/facebook-vietnamese-20261023/capture-example-report.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=process.env.SV_CAPTURE_ROOT;
if(!root)throw Error('Supply SV_CAPTURE_ROOT pointing to a compiled isolated r88 export');
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const browser=await chromium.launch();
try{
 const p=await browser.newPage({viewport:{width:820,height:1180}});
 await p.route('http://capture.local/**',async route=>{
  const name=decodeURIComponent(new URL(route.request().url()).pathname);
  if(name.includes('/api/'))return route.abort();
  if(name==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="vi"><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/style.css"><body></body></html>'});
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(path.resolve(root)+path.sep))return route.abort();
  try {await route.fulfill({body:await fs.readFile(file),contentType:({'.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});}catch{await route.abort()}
 });
 await p.goto('http://capture.local/');
 await p.evaluate(async()=>{
  const s=await import('/js/state.js');
  Object.assign(s.settings,{lang:'vi',online:false,voice:false,music:false,sound:false,countPlayers:false});
  await import('/js/games/all.js');
  const child=s.profiles[0]||s.addProfile();child.name='Bé ví dụ';child.stats={days:{},played:{numbers:6,memory:5,colors:4}};
  const r=await import('/js/report.js');
  [12,18,0,15,22,10,16].forEach((min,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);child.stats.days[r.dayKey(d)]={min,games:[2,3,0,2,4,1,3][i]}});
  r.openReport(child);
 });
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForFunction(()=>getComputedStyle(document.querySelector('.modal.report')).opacity==='1');
 await p.screenshot({path:path.join(dir,'example-report.png'),clip:await p.locator('.modal.report .card').boundingBox()});
 console.log('Captured actual r88 report with isolated illustrative profile.');
}finally{await browser.close()}

import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const base=new URL('./',import.meta.url),panels=['settings','settings-scrolled','grownups','voices','backup','fixed-reports','simple'];
const names=['phone-en','phone-vi','tablet-en','tablet-vi','computer-en','computer-vi'];
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1640},deviceScaleFactor:1});
 for(const panel of panels){
  const html='<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e6e0f2;font:18px sans-serif;display:grid;grid-template-columns:repeat(3,480px)}article{box-sizing:border-box;width:480px;height:820px;padding:12px;text-align:center}h2{font-size:20px;margin:0 0 8px}img{max-width:456px;max-height:764px;object-fit:contain}</style>'+names.map(n=>`<article><h2>${n} · ${panel}</h2><img src="${n}-${panel}.png"></article>`).join('');
  await fs.writeFile(new URL('review-'+panel+'.html',base),html);
  await page.goto('http://127.0.0.1:8765/docs/v1.01-shots/review-'+panel+'.html');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.screenshot({path:new URL('review-'+panel+'.png',base).pathname});
 }
}finally{await browser.close()}
console.log('Seven sheets cover all 42 native UI captures.');

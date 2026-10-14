// Matching synthetic-data evidence; run on the pinned baseline and repair candidate.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { launch, open, start, clear } from './harness.mjs';
import { URL as gameURL } from './harness.mjs';
const phase = process.argv[2] || 'baseline';
const sourceCommit = process.env.SV_EVIDENCE_COMMIT || execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim();
const sourceFingerprints = {};
// Verify the served code, rather than attributing old pictures from a build label alone.
const servedFiles=execFileSync('git',['ls-tree','-r','--name-only',sourceCommit,'--','js','css','vendor','fonts','icons','index.html','sw.js','voices/manifest.json','voices/areas.json'],{encoding:'utf8'}).trim().split('\n');
for (const file of servedFiles) {
  const expected = execFileSync('git', ['show', `${sourceCommit}:${file}`], {maxBuffer:8*1024*1024});
  const response = await fetch(new URL(file, gameURL));
  if (!response.ok) throw new Error(`Evidence source unavailable: ${file} (${response.status})`);
  const actual = Buffer.from(await response.arrayBuffer());
  if (!actual.equals(expected)) throw new Error(`Served evidence source differs from ${sourceCommit}: ${file}`);
  sourceFingerprints[file] = createHash('sha256').update(actual).digest('hex');
}
const dir = path.resolve('../docs/owner-repair-20261014/evidence', phase);
fs.mkdirSync(dir, { recursive: true });
const browser = await launch(), results = [];
try {
  for (const [device,w,h,touch,lang] of [['phone',390,844,true,'en'],['phone',390,844,true,'vi'],['tablet',820,1180,true,'en'],['computer',1280,800,false,'en']]) {
    const label = `${device}-${lang}`;
    const P = await open(browser, { w,h,touch,lang,play:false, route:async ctx => {
      await ctx.route('**/content/custom.json*', rt => rt.fulfill({ contentType:'application/json',body:'{}' }));
      await ctx.route('**/api/tester**', rt => rt.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,k:'0123456789abcdef',rid:'evidence-receipt',mine:[],open:[],reports:0})}));
      await ctx.route('**/api/live**', rt => rt.fulfill({contentType:'application/json',body:JSON.stringify({releases:{tester:{on:true,devices:['tester000001']},autoplay:{on:true,devices:['tester000001']}},festivals:{}})}));
      await ctx.route('**/api/hello**', rt => rt.fulfill({status:204}));
    },pre:() => {
      const ps=JSON.parse(localStorage.getItem('sv2_profiles')||'[]'); ps.forEach((p,i)=>{p.name=`Demo ${i+1}`;p.photo=null;}); localStorage.setItem('sv2_profiles',JSON.stringify(ps));
      localStorage.setItem('sv2_playerid','tester000001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r1'}));localStorage.setItem('sv2_live',JSON.stringify({releases:{tester:{on:true,devices:['tester000001']},autoplay:{on:true,devices:['tester000001']}},festivals:{}}));
    }});
    const shot = async name => { await P.page.evaluate(() => document.fonts.ready); await P.page.waitForTimeout(550); await P.page.screenshot({path:path.join(dir,`${label}-${name}.png`)}); };
    await shot('welcome');
    await P.page.click('.screen.title .press', {force:true}); await P.page.waitForSelector('.screen.who');
    await P.page.waitForTimeout(650); await shot('selection');
    const bounds = () => P.page.evaluate(() => { const r=document.querySelector('.who-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; });
    const before=await bounds(); await P.page.locator('.pick[data-id]').first().click(); await P.page.waitForTimeout(150);const after=await bounds();
    if (phase!=='baseline' && (Math.abs(before.y-after.y)>1 || Math.abs(before.height-after.height)>1)) throw new Error('Selection shell moved across redraw');
    const selection=await P.page.evaluate(()=>({scrollHeight:document.querySelector('.who-body')?.scrollHeight,height:document.querySelector('.who-body')?.clientHeight,labels:[...document.querySelectorAll('.pick span:last-of-type')].map(x=>({text:x.textContent,y:x.getBoundingClientRect().y,height:x.getBoundingClientRect().height}))}));
    await P.page.evaluate(async () => { const S=await import('/js/state.js'); S.profiles.forEach(p=>p.screen='valley'); __sv._owlAuto=true; }); await P.page.click('.who .go'); await P.page.waitForFunction(()=>__sv.heroes.length>0);
    await clear(P.page);
    for (const [name,action] of [['bag',()=>__sv.openPad(0,'bag')],['shop',()=>{__sv.openPad(0,'bag');document.querySelector('.pad [data-t="shop"]').click();}],['audio',()=>__sv.openSound(document.querySelector('.dk.snd'))]]) {
      await clear(P.page); await P.page.evaluate(action); await P.page.waitForTimeout(550); await shot(name);
      if(name==='shop' && phase!=='baseline') {
        const optical=await P.page.evaluate(async()=>{const img=document.querySelector('.shop-preview');await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data,bg=[d[0],d[1],d[2]];let minY=c.height,maxY=0;for(let y=0;y<c.height;y++)for(let px=0;px<c.width;px++){const i=(y*c.width+px)*4;if(Math.max(...bg.map((v,k)=>Math.abs(d[i+k]-v)))>45){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}return {height:c.height,visibleHeight:maxY-minY};});
        if(optical.visibleHeight<optical.height*.55)throw new Error('Outfit preview remains optically too small: '+JSON.stringify(optical));
      }
      if (name==='audio' && phase!=='baseline') {if(await P.page.locator('.dk.mus:visible').count())throw new Error('Duplicate Music entrance');const r=await P.page.locator('.audio-tray').boundingBox();if(r.x<11 || r.x+r.width>w-11 || r.y<11 || r.y+r.height>h-11)throw new Error('Audio outside safe viewport: '+JSON.stringify(r));}
      if (name==='bag') await P.page.waitForSelector('.pad', {state:'visible'});
      if(name==='shop'){await P.page.click('[data-go="wardrobe"]');await P.page.waitForTimeout(400);await shot('mirror');await P.page.evaluate(()=>document.querySelectorAll('.wardrobe').forEach(x=>x.remove()));}
    }
    await clear(P.page); await P.page.waitForFunction(()=>__sv.tester&&__sv.autoplay,{timeout:15000});
    await P.page.evaluate(()=>__sv.tester.openPanel(0));await P.page.waitForSelector('.tpanel');await shot('tester');
    if(phase!=='baseline' && await P.page.locator('.audio-tray').count())throw new Error('Audio competes with reporting panel');
    if(phase!=='baseline') {
      await P.page.fill('.tpanel textarea','Synthetic report draft');await P.page.click('[data-test-tab="autoplay"]');await shot('autoplay');
      await P.page.click('[data-test-tab="tester"]');
      if(await P.page.inputValue('.tpanel textarea')!=='Synthetic report draft')throw new Error('Report draft lost across tabs');
    }
    const build=await P.page.evaluate(async()=>(await import('/js/build.js')).BUILD);
    results.push({device,w,h,lang,build,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),before,after,selection,errors:P.errors});
    console.log(`${phase} ${label}: captured welcome, selection, bag, shop, audio`);
    await P.ctx.close();
  }
} finally { await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2)); }

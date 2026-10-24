// Actual modules in the isolated compiled release export; synthetic empty profile, API blocked.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const base=new URL('./parents-final/',import.meta.url);await fs.mkdir(base,{recursive:true});
const browser=await chromium.launch(),rows=[];
try{
 for(const [device,w,h] of [['phone',390,844],['tablet',820,1180],['computer',1280,800]])for(const lang of ['en','vi']){
  const ctx=await browser.newContext({viewport:{width:w,height:h}}),p=await ctx.newPage();
  try{
   await p.route('**/api/**',r=>r.abort());await p.goto('http://127.0.0.1:8766/_parent-capture.html');
   await p.evaluate(async lang=>{const S=await import('/js/state.js');Object.assign(S.settings,{lang,autoPack:false,voice:false,music:false,sound:false,online:false,countPlayers:false});const child=S.profiles[0]||S.addProfile();child.name=lang==='vi'?'Bé ví dụ':'Example child';child.stats={days:{},played:{}};S.profiles.splice(1);(await import('/js/popups.js')).dialogHooks.little=()=>true;(await import('/js/ui-settings.js')).openGrownups()},lang);
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.grownups')).opacity==='1');await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(()=>{document.querySelectorAll('details[data-sec]').forEach(d=>d.open=d.dataset.sec==='players')});
   await p.locator('[data-sec=players]').scrollIntoViewIfNeeded();
   await p.screenshot({path:new URL(device+'-'+lang+'-settings.png',base).pathname});
   if(device==='tablet')await p.screenshot({path:new URL('../website-review-20261023/assets/parent-controls/settings-'+lang+'.png',new URL('../',base)).pathname,clip:await p.locator('.grownups .card').boundingBox()});
   await p.evaluate(()=>{document.querySelectorAll('details[data-sec]').forEach(d=>d.open=d.dataset.sec==='data');document.querySelectorAll('[data-sec=data] details').forEach(d=>d.open=true)});
   await p.locator('#gSaveCopy').scrollIntoViewIfNeeded();
   const check=await p.evaluate(()=>{const panel=document.querySelector('.grownups-panel'),head=panel.querySelector('h2').getBoundingClientRect(),body=document.querySelector('.grownups-body').getBoundingClientRect(),done=document.querySelector('#gDone').getBoundingClientRect();return {panelScroll:panel.scrollTop,headingTop:head.top,footerTop:done.top,bodyBottom:body.bottom,footerVisible:done.top>=0&&done.bottom<=innerHeight}});
   await p.screenshot({path:new URL(device+'-'+lang+'-backup.png',base).pathname});
   rows.push({device,lang,...check});
   if(check.panelScroll!==0||check.headingTop<0||!check.footerVisible||check.bodyBottom>check.footerTop)throw Error(JSON.stringify(rows.at(-1)));
   await p.locator('.grownups .x').click();await p.waitForSelector('.grownups',{state:'detached'});
   await p.evaluate(async()=>{const S=await import('/js/state.js');(await import('/js/report.js')).openReport(S.profiles[0])});
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.modal.report')).opacity==='1');
   await p.screenshot({path:new URL(device+'-'+lang+'-report.png',base).pathname});
   if(device==='tablet')await p.screenshot({path:new URL('../website-review-20261023/assets/parent-controls/report-'+lang+'.png',new URL('../',base)).pathname,clip:await p.locator('.modal.report .card').boundingBox()});
   console.log(device+'-'+lang+' stable parent header and separate floating action: pass');
  }finally{await ctx.close()}
 }
}finally{await browser.close();await fs.writeFile(new URL('checks.json',base),JSON.stringify(rows,null,2)+'\n')}

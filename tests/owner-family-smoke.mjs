// Two isolated browser devices using the real private-family action handler.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { familyAction } from '../netlify/lib/family-devices.mjs';
import { launch, open, clear } from './harness.mjs';
const records = new Map();
const store = { get: async key => structuredClone(records.get(key) ?? null), setJSON: async (key,value) => records.set(key,structuredClone(value)), delete: async key => records.delete(key), list: async ({prefix}) => ({blobs:[...records.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}) };
const route = async ctx => ctx.route('**/api/family-devices/*', async r => {
  try { const req=r.request(), token=(req.headers().authorization || '').replace(/^Bearer /,''); const value=await familyAction(store,new URL(req.url()).pathname.split('/').pop(),req.postDataJSON(),token); await r.fulfill({status:200,json:value}); }
  catch(e) { await r.fulfill({status:e.status || 500,json:{error:e.message}}); }
});
fs.mkdirSync('out/owner-round',{recursive:true});
const browser=await launch();
async function panel(page) { await clear(page); await page.evaluate(async()=>{const U=await import('/js/ui.js'); U.openGrownups();}); await page.locator('[data-sec="familydevices"] > summary').click(); }
try {
 const a=await open(browser,{w:390,h:844,touch:true,route}); await panel(a.page);
 const recovery=a.page.waitForEvent('download'); await a.page.click('.fd-create'); await (await recovery).saveAs('out/owner-round/recovery-fixture.json'); await a.page.waitForSelector('.fd-pair');
 await a.page.click('.fd-pair'); await a.page.waitForFunction(()=>document.querySelector('.fd-paircode')?.textContent.includes('-'));
 const code=(await a.page.locator('.fd-paircode').innerText()).match(/[A-F0-9]{4}(?:-[A-F0-9]{4}){3}/)[0];
 const b=await open(browser,{w:820,h:1180,touch:true,route}); await panel(b.page); await b.page.fill('.fd-label','Test tablet'); await b.page.fill('.fd-code',code); await b.page.click('.fd-join'); await b.page.waitForSelector('.fd-refresh');
 assert.deepEqual(await b.page.evaluate(()=>Object.keys(globalThis.__svFamilyPhotos || {})),[]);
 await panel(a.page); await a.page.waitForSelector('[data-action="approve"]'); await a.page.click('[data-action="approve"]'); await b.page.click('.fd-refresh'); await b.page.waitForSelector('.fd-photo');
 const npc=await a.page.locator('.fd-npc').inputValue();
 const image=await a.page.evaluate(()=>{const c=document.createElement('canvas'); c.width=c.height=32; c.getContext('2d').fillStyle='#13aaff'; c.getContext('2d').fillRect(0,0,32,32); return c.toDataURL('image/png').split(',')[1];});
 await a.page.locator('.fd-photo').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
 await a.page.waitForFunction(()=>document.querySelector('.fd-status')?.textContent.includes('Photo saved'));
 await b.page.evaluate(async()=>{await (await import('/js/familydevices.js')).refreshDevicePhotos({force:true});});
 assert.ok(await b.page.evaluate(id=>globalThis.__svFamilyPhotos?.[id]?.image.startsWith('blob:'),npc));
 assert.equal(await b.page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('sv2_familyphotos'))).includes('base64')),false);
 // A late rejection for an earlier connection cannot revoke the newly connected family.
 const currentConnection=await b.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_familydevice')));
 const recoveryKey=await a.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_familydevice')).recovery);
 const replacement=await familyAction(store,'recover',{recovery:recoveryKey,label:'Replacement tablet'});
 let releaseStale,startedStale;const staleStarted=new Promise(resolve=>{startedStale=resolve;}),staleRelease=new Promise(resolve=>{releaseStale=resolve;});
 await b.ctx.route('**/api/family-devices/status',async r=>{if(r.request().headers().authorization!=='Bearer '+currentConnection.token)return r.fallback();startedStale();await staleRelease;await r.fulfill({status:403,json:{error:'device removed'}});});
 await b.page.evaluate(()=>{void import('/js/familydevices.js').then(m=>{window.__staleFamilyRefresh=m.refreshDevicePhotos({force:true}).catch(()=>{});});});
 let staleTimer;await Promise.race([staleStarted,new Promise((_,reject)=>{staleTimer=setTimeout(()=>reject(new Error('Stale authorization fixture did not start')),30000);})]);clearTimeout(staleTimer);
 await b.page.evaluate(connection=>localStorage.setItem('sv2_familydevice',JSON.stringify(connection)),replacement);releaseStale();await b.page.evaluate(()=>window.__staleFamilyRefresh);
 assert.ok(await b.page.evaluate(connection=>JSON.parse(localStorage.getItem('sv2_familydevice'))?.token===connection.token,replacement),'stale rejection must not clear the new connection');
 assert.ok(await b.page.evaluate(id=>!!globalThis.__svFamilyPhotos?.[id]?.image,npc),'stale rejection must not clear newly authorized photos');
 await b.ctx.setOffline(true); await b.page.evaluate(()=>{globalThis.__svFamilyPhotos={};}); await b.page.evaluate(async()=>{await (await import('/js/familydevices.js')).refreshDevicePhotos({force:true});});
 assert.ok(await b.page.evaluate(id=>globalThis.__svFamilyPhotos?.[id]?.image.startsWith('blob:'),npc));
 await panel(b.page); const backup=b.page.waitForEvent('download'); await b.page.click('.fd-offlinebackup'); const file=await (await backup).path(); const photos=JSON.parse(fs.readFileSync(file)); assert.ok(photos.photos[npc].image.startsWith('data:image/jpeg;'));
 await b.ctx.setOffline(false); const connection=await b.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_familydevice'))); const status=await familyAction(store,'status',{},connection.token); const own=status.devices.find(d=>d.label==='Replacement tablet');
 await a.page.locator(`[data-device="${own.id}"]`).click();
 await b.page.evaluate(async()=>{try {await (await import('/js/familydevices.js')).refreshDevicePhotos({force:true});} catch(e){if(!e.message.includes('403')) throw e;}});
 assert.deepEqual(await b.page.evaluate(()=>Object.keys(globalThis.__svFamilyPhotos)),[]); assert.equal(await b.page.evaluate(()=>localStorage.getItem('sv2_familyphotos')),null);
 assert.ok(await b.page.evaluate(()=>localStorage.getItem('sv2_familydevice')===null),'revoked connection must allow setup, joining or recovery again');
 await panel(b.page);await b.page.waitForSelector('.fd-create');
 assert.equal(await b.page.locator('.fd-code').count(),1,'revoked device can pair again without clearing unrelated game data');
 assert.deepEqual(a.errors,[]); assert.deepEqual(b.errors,[]); console.log('PASS: pairing approval, photo transfer, postcard, offline cache and backup, revocation clears cached photos and restores connection/recovery controls');
} finally { await browser.close(); }

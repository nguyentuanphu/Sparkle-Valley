// Actual road instruction playback plus decoding every imported EN/VI cast recording.
import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mjs';
const browser=await launch(),rows=[];
try {
 for(const lang of ['en','vi']) {
  const P=await open(browser,{w:390,h:844,touch:true,lang,settings:{voice:true,bilingual:false,autoPack:false,music:false,sound:false},pre:()=>{window.__roadDeviceSpeech=0;window.__roadSources=0;speechSynthesis.speak=()=>window.__roadDeviceSpeech++;const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){if(this.buffer?.length>1){window.__roadSources++;setTimeout(()=>this.onended?.(),30);}return start.apply(this,args);};}});await clear(P.page);
  await P.page.waitForFunction(async()=>!!(await import('/js/voice.js')).voicePack());
  const decoded=await P.page.evaluate(async lang=>{const ctx=new AudioContext(),out=[];try{for(const cast of ['f','m'])for(const hash of lang==='en'?['92c829b74a9b3c8a','f7337bbf-67da81be']:['5e0a902f-6caedd14','46230ceb1cab2f71']){const url=`/voices/${lang}/${cast}/${hash}.mp3`,r=await fetch(url);if(!r.ok)throw Error('Missing '+url);const b=await ctx.decodeAudioData(await r.arrayBuffer());out.push({url,duration:b.duration,samples:b.length});}}finally{await ctx.close();}return out;},lang);
  assert.ok(decoded.length===4&&decoded.every(r=>r.duration>.1&&r.samples>100));
  await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0],it=G.interactables.find(i=>i.id==='crossing_town_north');h.place(it.x-1,it.z+1);window.__roadSources=0;window.__roadDeviceSpeech=0;window.__roadLog=[];window.__svVoiceLog=(lang,text,recorded)=>window.__roadLog.push({lang,text,recorded});window.__roadDialog=it.act(h,G);});
  await P.page.waitForFunction(()=>window.__roadSources>0&&window.__roadLog.length>0);
  const playback=await P.page.evaluate(()=>({sources:window.__roadSources,native:window.__roadDeviceSpeech,log:window.__roadLog}));
  assert.equal(playback.native,0);assert.ok(playback.log.every(r=>r.lang===lang&&r.recorded));assert.match(playback.log[0].text,lang==='en'?/both ways/:/cả hai phía/);
  await P.page.locator('.dialog .dtext').click();await P.page.evaluate(()=>window.__roadDialog);assert.deepEqual(P.errors,[]);rows.push({lang,decoded,playback});await P.ctx.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify(rows));

import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, hello, live, report } from '../../netlify/lib/players.mjs';
const NOW=Date.UTC(2026,9,14,7), ID='device000001';
const memory=()=>{const m=new Map();return {get:async(k,o)=>m.has(k)?o?.type==='json'?JSON.parse(m.get(k)):m.get(k):null,set:async(k,v)=>m.set(k,String(v)),setJSON:async(k,v)=>m.set(k,JSON.stringify(v)),delete:async k=>m.delete(k),list:async({prefix=''})=>({blobs:[...m.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))})};};
const message=(extra={})=>({id:ID,h:'batch00000000001',b:'r75',sid:'a'.repeat(16),started:NOW,l:'en',d:'phone',days:[{d:'2026-10-14',build:'r75',m:5,g:{},t:0,o:0}],...extra});
test('same installation on two versions stays one device; history and latest are distinct',async()=>{
 const S=memory();await hello(S,message({days:[{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r75',m:7}]}),NOW);
 const R=await report(S,NOW);assert.equal(R.week.devices,1);assert.equal(R.allTime,1);assert.equal(R.devices.length,1);assert.equal(R.devices[0].mins,12);
 assert.deepEqual(R.builds,{r74:1,r75:1});assert.deepEqual(R.latestBuilds,{r75:1});
});
test('delayed old tab does not replace the newer session version or double count resend',async()=>{
 const S=memory();await hello(S,message(),NOW);const old=message({h:'batch00000000002',b:'r74',started:NOW-3600000,days:[{d:'2026-10-13',build:'r74',m:9}]});
 await hello(S,old,NOW+1000);await hello(S,old,NOW+2000);const R=await report(S,NOW+3000);
 assert.equal(R.devices[0].build,'r75');assert.equal(R.devices[0].mins,14);assert.equal(R.week.devices,1);assert.equal(R.builds.r74,1);
});
test('older untagged migrated history is unknown, not relabelled as upload-time build',()=>{
 const d=clean(message({days:[{d:'2026-10-13',m:8}]}),NOW);assert.equal(d.days[0].build,'?');
 const legacy=clean(message({sid:undefined,started:undefined,b:'r74',days:[{d:'2026-10-13',m:8}]}),NOW);assert.equal(legacy.days[0].build,'r74');
});
test('duplicates within a day/build are dropped but different originating builds survive',()=>{
 const d=clean(message({days:[{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r75',m:7}]}),NOW);
 assert.equal(d.days.length,2);assert.deepEqual(d.days.map(x=>x.build),['r74','r75']);
});
test('two tabs share identity and ending one leaves the other online',async()=>{
 const S=memory();await hello(S,message(),NOW);await live(S,{id:ID,sid:'a'.repeat(16),b:'r75',live:1},NOW);await live(S,{id:ID,sid:'b'.repeat(16),b:'r74',live:1},NOW+1);
 let R=await report(S,NOW+2);assert.equal(R.onlineNow,1);assert.deepEqual(new Set(R.devices[0].activeVersions),new Set(['r74','r75']));
 await live(S,{id:ID,sid:'b'.repeat(16),b:'r74',live:0},NOW+3);R=await report(S,NOW+4);assert.equal(R.onlineNow,1);assert.deepEqual(R.devices[0].activeVersions,['r75']);
});
test('legacy old-build upload cannot overwrite a known newer-session version',async()=>{
 const S=memory();await hello(S,message(),NOW);await hello(S,message({h:'batch00000000003',sid:undefined,started:undefined,b:'r74'}),NOW+1000);
 assert.equal((await report(S,NOW+1001)).devices[0].build,'r75');
});

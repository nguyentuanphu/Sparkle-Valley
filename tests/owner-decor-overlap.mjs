// Two real festivals share village/Hoian during the Lunar New Year build-up.
// Inspect the actual placement builder against the real world's colliders, not screenshots or a road-mask-only count.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mjs';
const browser=await launch(),rows=[];
try {
 const P=await open(browser,{w:1280,h:800});await clear(P.page);
 rows.push(...await P.page.evaluate(async()=>{const G=__sv,W=await import('/js/world.js'),{createDecor}=await import('/js/festdecor.js'),{FESTCAL}=await import('/js/content/festcal.js'),C=(await import('/js/custom.js')).CUSTOM;C.festivals={...(C.festivals||{}),tet:{deco:5},ramthang1:{deco:5}};
  const free=(x,z,r=1)=>W.heightAt(x,z)>W.WATER+.3&&!G.world.colliders.some(c=>c.r>0&&c.top==null&&Math.hypot(c.x-x,c.z-z)<c.r+r)&&!G.world.boxes.some(b=>x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r),D=createDecor(free),shape=()=>({parts:[],glows:[]}),out=[];
  for(const [key,place] of [['village',W.VILLAGE]]){const sets=['tet','ramthang1'].map(id=>D.decorate(key,place,FESTCAL.find(f=>f.id===id),{stage:4},shape,shape,['#ff4f9a'],'flag',[])||[]).map(items=>items.filter(i=>i.kind==='piece'));const overlap=sets[1].filter(p=>sets[0].some(q=>Math.hypot(p.x-q.x,p.z-q.z)<.05));out.push({key,counts:sets.map(s=>s.length),overlap:overlap.map(p=>({x:p.x,z:p.z}))});}return out;}));
 for(const r of rows){assert.ok(r.counts.every(n=>n>0),'Both real festival plans must be present');assert.equal(r.overlap.length,0,'Festival pieces must not occupy the same ground: '+JSON.stringify(r));}
 assert.deepEqual(P.errors,[]);await P.ctx.close();
}finally{await browser.close();fs.mkdirSync('out/owner-decor-overlap',{recursive:true});fs.writeFileSync('out/owner-decor-overlap/results.json',JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify(rows));

import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mjs';
const browser=await launch(),rows=[],ids=process.argv.includes('--baseline')?['robot']:['robot','maze','duckmaze','sortout'];
const live={releases:{autoplay:{on:true,devices:['planprobe001']}},festivals:{}};
try{
 for(const lang of process.argv.includes('--baseline')?['en']:['en','vi']){
  const P=await open(browser,{w:390,h:844,touch:true,lang,settings:{voice:false,autoPack:false},pre:`localStorage.setItem('sv2_playerid','planprobe001');localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,route:async ctx=>{await ctx.route('**/api/live**',r=>r.fulfill({json:live}));await ctx.route('**/api/tester**',r=>r.fulfill({json:{ok:true,rid:'synthetic-plan-receipt',mine:[],open:[]}}));}});await clear(P.page);
  await P.page.waitForFunction(()=>!!__sv.autoplay);
  await P.page.evaluate(ids=>{const G=__sv,p=G.heroes[0].profile;p.age='big';p.difficulty='hard';p.gameDiff={...p.gameDiff,...Object.fromEntries(ids.map(id=>[id,'hard']))};G.gameSpot=()=>null;G.autoplay.start(ids.map(id=>'game:'+id),'x5');},ids);
  await P.page.waitForFunction(n=>!__sv.autoplay.running()&&JSON.parse(localStorage.getItem('sv2_autoplay_report')||'{}').done?.length===n,ids.length,{timeout:360000});
  const report=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_autoplay_report')));
  for(const id of ids){const row=report.done.find(r=>r.key==='game:'+id);rows.push({id,lang,...row});assert.ok(row?.ok&&/^(won|thắng):/.test(row.said),JSON.stringify(rows.at(-1)));}
  assert.deepEqual(P.errors,[]);await P.ctx.close();
 }
}finally{await browser.close();}
console.log(JSON.stringify(rows));

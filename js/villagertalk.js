// (Round U, owner 11 Oct: "all NPCs should be able to talk and should throw facts or slangs") Every person in the valley
// answers a tap. Sellers, hosts and story people already have their own words; every other villager (the crowds at the
// festivals, people on a walk) gets a tap that tells a fact or a saying of their region (js/content/villagerlines.js),
// a different one each time. Built after the title (js/main.js), from the people already in the valley.
import { T } from './i18n.js';
import { dialog } from './popups.js';
import { SFX } from './audio.js';
import { CITIES } from './world.js';
import { WORLD as MAP_WORLD } from './content/map.js';
import { VILLAGER_LINES, VILLAGER_JOBS } from './content/villagerlines.js';
import { sprite } from './gfx.js';

// the region of a spot: Australia on the west bank, the home island in the middle, Vietnam east (as traffic.js does)
const regionOf = (x, z) => { if (MAP_WORLD.keepLeft.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return 'au'; let best = 'vn', bd = 1e9; for (const c of CITIES) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c.cc; } } return Math.abs(x) < 70 && Math.abs(z + 14) < 100 ? 'home' : best; };

export function createVillagerTalk(G) {
  const me = new Set(G.heroes.map(h => h.av && h.av.root)), added = [], seen = new Set();
  let k = 0; const jobN = {}, list = [];
  // (people who arrive later, a festival crowd, are found by the next look round: every few seconds)
  const scan = () => { const people = []; G.scene.traverse(o => { if (o.userData.avatar && !me.has(o) && o.parent === G.scene && !seen.has(o)) people.push(o); });
  for (const o of people) {
    seen.add(o);
    const p = o.position;
    if (G.interactables.some(i => !added.includes(i) && !i.walks && Number.isFinite(i.x) && Math.hypot(i.x - p.x, i.z - p.z) < 2.6)) continue;   // already has words of its own (a tap that moves, another villager's or a bus's, does not count: it goes away)
    const reg = regionOf(p.x, p.z), lines = VILLAGER_LINES[reg] || VILLAGER_LINES.vn; let n = k++ % lines.length;
    // (Round U) a job, with its picture over the villager's head
    const jobs = VILLAGER_JOBS[reg] || VILLAGER_JOBS.vn, job = jobs[(jobN[reg] = (jobN[reg] || 0) + 1) % jobs.length], tag = sprite(job[0], .55);
    tag.position.set(0, 2.45, 0); o.add(tag);
    const it = { id: 'villager_' + added.length, get x() { return o.position.x; }, get z() { return o.position.z; }, r: 2.4, icon: '💬', bubble: '💬', walks: true,
      label: () => T('Say hello', 'Chào hỏi'),
      act: async () => { SFX.tap(); const line = lines[n]; n = (n + 1) % lines.length; await dialog(T(job[1], job[2]), [line]); } };
    G.interactables.push(it); added.push(it); list.push({ o, it, reg, job, tag, home: { x: p.x, z: p.z } });
  }
  G.villagerTalk.added = added.length; G.villagerTalk.people = seen.size; };
  G.villagerTalk = { added: 0, people: 0, list, scan };
  scan(); setInterval(scan, 4000);
  return G.villagerTalk;
}

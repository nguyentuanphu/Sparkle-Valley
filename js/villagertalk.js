// (Round U, owner 11 Oct: "all NPCs should be able to talk and should throw facts or slangs") Every person in the valley
// answers a tap. Sellers, hosts and story people already have their own words; every other villager (the crowds at the
// festivals, people on a walk) gets a tap that tells a fact or a saying of their region (js/content/villagerlines.js),
// a different one each time. Built after the title (js/main.js), from the people already in the valley.
import { T } from './i18n.js';
import { dialog } from './popups.js';
import { SFX } from './audio.js';
import { CITIES } from './world.js';
import { WORLD as MAP_WORLD } from './content/map.js';
import { VILLAGER_LINES } from './content/villagerlines.js';

// the region of a spot: Australia on the west bank, the home island in the middle, Vietnam east (as traffic.js does)
const regionOf = (x, z) => { if (MAP_WORLD.keepLeft.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return 'au'; let best = 'vn', bd = 1e9; for (const c of CITIES) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c.cc; } } return Math.abs(x) < 70 && Math.abs(z + 14) < 100 ? 'home' : best; };

export function createVillagerTalk(G) {
  const me = new Set(G.heroes.map(h => h.av && h.av.root)), added = [];
  const people = []; G.scene.traverse(o => { if (o.userData.avatar && !me.has(o) && o.parent === G.scene) people.push(o); });
  let k = 0;
  for (const o of people) {
    const p = o.position;
    if (G.interactables.some(i => Number.isFinite(i.x) && Math.hypot(i.x - p.x, i.z - p.z) < 2.6)) continue;   // already has words of its own
    const reg = regionOf(p.x, p.z), lines = VILLAGER_LINES[reg] || VILLAGER_LINES.vn; let n = k++ % lines.length;
    const it = { id: 'villager_' + added.length, get x() { return o.position.x; }, get z() { return o.position.z; }, r: 2.4, icon: '💬', bubble: '💬', walks: true,
      label: () => T('Say hello', 'Chào hỏi'),
      act: async () => { SFX.tap(); const line = lines[n]; n = (n + 1) % lines.length; await dialog(reg === 'au' ? T('Neighbour', 'Hàng xóm') : T('Villager', 'Người làng'), [line]); } };
    G.interactables.push(it); added.push(it);
  }
  G.villagerTalk = { added: added.length, people: people.length };
  return G.villagerTalk;
}

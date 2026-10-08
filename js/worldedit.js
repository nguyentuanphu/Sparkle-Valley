// The family's own changes to the world, made on the map in Sparkle Studio and kept in the content pack
// (content/custom.json → "world"):
//   build: new houses and buildings  { type, x, z, rot, name: [en, vi], about: [en, vi], owner: { name, gender, look, line: [en, vi] } }
//   edits: move or remove what is already there  { op: 'move' | 'remove', x, z, r, dx, dz, turn }
//   land:  more level ground  { x0, x1, z0, z1 }  (worked into the ground itself in world.js)
// New houses are ordinary homes (door name, About, Go inside, the owner at the door). Moving takes everything
// inside the circle (the building, its people, stalls, trees, its tap spots) to the new place; the ground is
// levelled under it afterwards like everywhere else.
import { THREE, toonVC, merge, outline } from './gfx.js';
import { addPole } from './powerlines.js';
import { heightAt } from './world.js';
import { houseTube, houseVilla, houseCottage, houseVillage } from './houses.js';
import { raisedHouse } from './town.js';
import { MODELS } from './cities.js';
import { registerName } from './i18n.js';
import { CUSTOM } from './custom.js';

const house = (mk, kind, room) => ({ mk, kind, room, home: true });
const landmark = key => ({ mk: () => ({ parts: MODELS[key]() }), kind: 'landmark' });
// what can be built (Sparkle Studio shows the same list): [id] → how to make it, in both languages
export const BUILD_TYPES = {
  tube: { ...house(o => houseTube({ wall: o.color || '#9fd8c8', floors: 3 }), 'tube', 'tube'), name: ['Tube house (Vietnam)', 'Nhà ống'], icon: '🏠' },
  tube2: { ...house(o => houseTube({ wall: o.color || '#ffb3a0', floors: 2 }), 'tube', 'tube'), name: ['Small tube house', 'Nhà ống nhỏ'], icon: '🏠' },
  village: { ...house(o => houseVillage({ wall: o.color || '#efe0bf' }), 'village', 'village'), name: ['Village house with tiled roof', 'Nhà ngói ở làng'], icon: '🏡' },
  villa: { ...house(() => houseVilla(), 'villa', 'villa'), name: ['French villa', 'Biệt thự Pháp'], icon: '🏛️' },
  cottage: { ...house(o => houseCottage({ wall: o.color || '#cfe6ee' }), 'cottage', 'cottage'), name: ['Australian cottage', 'Nhà gỗ kiểu Úc'], icon: '🏘️' },
  raised: { ...house(() => raisedHouse(), 'raised', 'raised'), name: ['Queenslander on stilts', 'Nhà sàn kiểu Queensland'], icon: '🛖' },
  pagoda: { ...landmark('chuadau'), name: ['Pagoda', 'Chùa'], icon: '🛕' },
  clocktower: { ...landmark('bnclock'), name: ['Clock tower', 'Tháp đồng hồ'], icon: '🕰️' },
  cathedral: { ...landmark('cathedral'), name: ['Red-brick church', 'Nhà thờ gạch đỏ'], icon: '⛪' },
  postoffice: { ...landmark('postoffice'), name: ['Post office', 'Bưu điện'], icon: '🏤' },
  communal: { ...landmark('dendo'), name: ['Temple', 'Đền'], icon: '⛩️' },
  // (a power pole: shown and wired to its neighbours only while Studio's power-pole switch is on; js/powerlines.js)
  powerpole: { pole: true, mk: () => ({ parts: [] }), name: ['Power pole', 'Cột điện'], icon: '🔌' }
};
const W = () => CUSTOM.world && typeof CUSTOM.world === 'object' ? CUSTOM.world : {};
const num = v => typeof v === 'number' && isFinite(v);
const str = (v, n = 80) => typeof v === 'string' ? v.slice(0, n) : '';
const pair = v => Array.isArray(v) ? [str(v[0], 300), str(v[1] || v[0], 300)] : null;

// new buildings: before the homes are made (js/homes.js turns world.houses into visitable homes)
export function addFamilyBuildings(G) {
  const { scene, world } = G; let n = 0;
  for (const b of (Array.isArray(W().build) ? W().build : []).slice(0, 80)) {
    const T = b && BUILD_TYPES[b.type]; if (!T || !num(b.x) || !num(b.z) || Math.abs(b.x) > 190 || Math.abs(b.z) > 190) continue;
    if (T.pole) { if (addPole(world, b.x, heightAt(b.x, b.z), b.z)) n++; continue; }
    const rot = num(b.rot) ? b.rot : 0, y = heightAt(b.x, b.z), m = T.mk({ color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : null });
    const obj = m.obj || new THREE.Mesh(m.geo || merge(m.parts), toonVC());
    obj.castShadow = obj.receiveShadow = true; obj.position.set(b.x, y - (m.parts ? .05 : 0), b.z); obj.rotation.y = rot; obj.userData.family = true; scene.add(obj);
    if (m.parts) outline(obj, .025, '#4a3a3f');
    const half = Math.max(m.w || 6, m.d || 6) / 2 * .8;
    world.boxes.push({ x0: b.x - half, x1: b.x + half, z0: b.z - half, z1: b.z + half });
    if (T.home) {
      const name = pair(b.name) || [T.name[0], T.name[1]], about = pair(b.about) || [`A new ${T.name[0].toLowerCase()} the family built.`, `Một ${T.name[1].toLowerCase()} mới cả nhà vừa xây.`];
      const o = b.owner && typeof b.owner === 'object' ? b.owner : null, L = (o && o.look) || {};
      const look = { style: str(L.style, 12) || 'shirt', color: /^#[0-9a-f]{6}$/i.test(L.color || '') ? L.color : '#5fb0ff', hair: /^#[0-9a-f]{6}$/i.test(L.hair || '') ? L.hair : '#2a1d14', hairStyle: str(L.hairStyle, 12) || 'short', hat: 'none', skin: /^#[0-9a-f]{6}$/i.test(L.skin || '') ? L.skin : '#f1c6a4', back: 'none', glider: 0 };
      const people = o && str(o.name, 40) ? [[str(o.name, 40), look, 0, pair(o.line) || ['Welcome to our new home!', 'Chào mừng con đến nhà mới của cô chú!'], [1.6, .8]]] : [];
      people.forEach(p => registerName(p[0]));
      world.houses.push({ x: b.x, z: b.z, rot, d: m.d || 7, kind: T.kind, info: { kind: T.kind, room: T.room, name, about, people } });
    } else world.colliders.push({ x: b.x, z: b.z, r: half });
    n++;
  }
  return n;
}

// move or remove what is already there: after everything is built, before the ground is levelled
export function applyWorldEdits(G) {
  const { scene, world } = G, edits = (Array.isArray(W().edits) ? W().edits : []).filter(e => e && num(e.x) && num(e.z) && num(e.r) && e.r > .5 && e.r < 40).slice(0, 80);
  if (!edits.length) return 0;
  const keepOut = new Set([world.terrain, ...(G.heroes || []).map(h => h.av && h.av.root).filter(Boolean)]);
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (const e of edits) {
    const inside = (x, z) => Math.hypot(x - e.x, z - e.z) <= e.r, move = e.op === 'move', dx = num(e.dx) ? e.dx : 0, dz = num(e.dz) ? e.dz : 0, turn = num(e.turn) ? e.turn : 0;
    const to = (x, z) => { const c = Math.cos(turn), sn = Math.sin(turn), rx = x - e.x, rz = z - e.z; return [e.x + rx * c + rz * sn + dx, e.z - rx * sn + rz * c + dz]; };
    for (const o of [...scene.children]) {
      if (keepOut.has(o) || o.isLight || o.isCamera || !o.position || o.userData.road) continue;
      if (o.isInstancedMesh) { // trees, rocks, flowers: one by one
        let ch = false;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); if (!inside(p.x, p.z)) continue;
          if (move) { const [nx, nz] = to(p.x, p.z); p.y += heightAt(nx, nz) - heightAt(p.x, p.z); p.x = nx; p.z = nz; q.premultiply(new THREE.Quaternion().setFromAxisAngle(up, turn)); } else s.set(0, 0, 0);
          m4.compose(p, q, s); o.setMatrixAt(i, m4); ch = true; }
        if (ch) { o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere && o.computeBoundingSphere(); }
        continue;
      }
      if (o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius > e.r * 2 + 8) continue; } // the ground, the sea, roads…
      if (!inside(o.position.x, o.position.z)) continue;
      if (move) { const [nx, nz] = to(o.position.x, o.position.z); o.position.y += heightAt(nx, nz) - heightAt(o.position.x, o.position.z); o.position.x = nx; o.position.z = nz; o.rotation.y += turn; }
      else o.visible = false;
      n++;
    }
    const shift = (list, keyX = 'x', keyZ = 'z') => { for (let i = list.length - 1; i >= 0; i--) { const it = list[i]; if (!it || !num(it[keyX]) || !inside(it[keyX], it[keyZ])) continue; if (move) { const [nx, nz] = to(it[keyX], it[keyZ]); it[keyX] = nx; it[keyZ] = nz; } else list.splice(i, 1); } };
    shift(world.colliders); shift(G.interactables); shift(world.houses);
    if (G.npcs) G.npcs.forEach(nn => { if (num(nn.x) && inside(nn.x, nn.z) && move) [nn.x, nn.z] = to(nn.x, nn.z); });
    for (let i = world.boxes.length - 1; i >= 0; i--) { const b = world.boxes[i], cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; if (b.room || !inside(cx, cz)) continue;
      if (!move) { world.boxes.splice(i, 1); continue; }
      const hw = (b.x1 - b.x0) / 2, hd = (b.z1 - b.z0) / 2, [nx, nz] = to(cx, cz), c = Math.abs(Math.cos(turn)), sn = Math.abs(Math.sin(turn)), w2 = hw * c + hd * sn, d2 = hw * sn + hd * c;
      b.x0 = nx - w2; b.x1 = nx + w2; b.z0 = nz - d2; b.z1 = nz + d2; }
    if (G.homes && G.homes.list) G.homes.list.forEach(hm => { if (hm.door && num(hm.door.x) && inside(hm.door.x, hm.door.z) && move) { [hm.door.x, hm.door.z] = to(hm.door.x, hm.door.z); } });
  }
  return n;
}

// Traffic of the two homes (round R, owner: vehicles on Vietnamese streets, Australian streets and farms, bicycles
// everywhere, children can ride them, all switchable in Sparkle Studio). Uses the models in js/vehicles.js.
//   · on the roads between places: motorbikes, taxis, buses and xe ba gác in Vietnam (riding on the right); cars, utes,
//     SUVs, buses and the postie bike in Australia (on the left). Each rides its road and back at a gentle speed and
//     stops while a child is in front of it.
//   · in the cities: rows of parked motorbikes and bicycles in Vietnam, parked cars and a bus at its stop in Australia;
//     a xích lô that gives rides in Sài Gòn and Hà Nội; the electric cart round Hà Nội; a modern tram in Melbourne.
//   · bicycles to ride in the villages, the farm, Two Homes Street and Aussie Corner (Jump gets off).
// Studio switches (CUSTOM.features): traffic, cityVehicles, rideBikes, xichloRides, realVehicles. Switching one off
// hides it for everyone; nothing a child owns depends on it.
// Under-5s see the toy look; when every child playing is 5 or older (and realVehicles is on) the real look is used.
// apply() rebuilds the meshes when the look changes (G.traffic.apply(real) at the start of each session).
import { THREE, blobShadow } from './gfx.js';
import { build, seatRider } from './vehicles.js';
import { CITIES, ROADS, VILLAGE, HOME, TOWN, AUSSIE, WATER, heightAt, roadDist } from './world.js';
import { WORLD as MAP_WORLD } from './content/map.js';
const KEEP_LEFT = MAP_WORLD.keepLeft;
import { buildAvatar } from './avatar.js';
import { featureOn } from './custom.js';
import { TOWN_PARKED } from './town.js';
import { T } from './i18n.js';

const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e0aa80') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const VN_RIDERS = [look('shirt', '#3a78c8', '#1d1412', 'short', 'cap'), look('aodai', '#ffffff', '#1d1412', 'long', 'nonla'), look('shirt', '#e8c25a', '#1d1412', 'short'), look('shirt', '#ff7eb8', '#1d1412', 'ponytail'), look('shirt', '#5a8a3a', '#1d1412', 'short', 'nonla')];
const AU_RIDERS = [look('shirt', '#ffd23f', '#6a4a2a', 'short', 'cap', '#f2c9a8'), look('shirt', '#3a78c8', '#a86a3a', 'short', 'cap', '#f2c9a8'), look('shirt', '#d8433a', '#2a1d18', 'ponytail', 'none', '#8a5a3a')];
const TWO_WHEEL = new Set(['honda67', 'cub', 'dream', 'scooter', 'postie', 'trailBike', 'quadBike', 'baGac', 'roadster', 'miniBike', 'roadBike', 'bmx', 'kidsBike', 'xichlo', 'touristCart']);
const VN_ROAD = ['honda67', 'cub', 'dream', 'scooter', 'taxi', 'cub', 'scooter', 'baGac', 'bus', 'dream', 'sedan', 'roadster'];
const AU_ROAD = ['sedan', 'ute', 'suv', 'busAU', 'postie', 'sedan', 'roadBike', 'ute'];
const SPEED = { bus: 4.2, busAU: 4.2, tramModern: 3.2, xichlo: 1.6, touristCart: 2.2, roadster: 2.6, miniBike: 2.4, roadBike: 3.6, baGac: 3.2, default: 4.6 };

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const route = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
const pointAt = (r, s) => { s = Math.max(0, Math.min(r.len, s)); let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const k = (s - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1), [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i]; return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)]; };
// a city's main street: through its two gates, or from its gate through the middle and out the far side
const mainStreet = c => { const [g0, g1] = c.gates; const b = g1 || [2 * c.x - g0[0], 2 * c.z - g0[1]]; return [g0, b]; };

export function createTraffic(G) {
  const { scene, world } = G, W = world;
  const slots = [];        // every vehicle: { id, args, x, z, yaw, mover?, rider?, ride?, cc }
  const ground = (x, z) => (W.groundAt ? W.groundAt(x, z) : heightAt(x, z));
  const free = (x, z, r = 1.4) => heightAt(x, z) > WATER + .3 && !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r) && !W.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
  const ccAt = (x, z) => { let best = 'vn', bd = 1e9; for (const c of CITIES) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c.cc; } } return KEEP_LEFT.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1) ? 'au' : best; }; // (the map's Australian side, js/content/map.js)

  // ---------- the roads between places ----------
  if (featureOn('traffic', true)) {
    const R = rng(7);
    ROADS.filter(r => r.kind === 'asphalt').forEach((road, k) => {
      const rt = route(road.pts), mid = pointAt(rt, rt.len / 2), cc = ccAt(mid[0], mid[1]), list = cc === 'vn' ? VN_ROAD : AU_ROAD;
      const n = rt.len > 70 ? 2 : 1;
      for (let j = 0; j < n; j++) slots.push({ id: list[(k * 3 + j * 5) % list.length], cc, mover: { r: rt, s: rt.len * (j + .3) / (n + .2), dir: j % 2 ? -1 : 1, lane: cc === 'vn' ? 1.4 : -1.4, wait: 0, rest: 2 + R() * 3 } });
    });
  }
  // ---------- the cities ----------
  if (featureOn('cityVehicles', true)) for (const c of CITIES) {
    const [a, b] = mainStreet(c), len = Math.hypot(b[0] - a[0], b[1] - a[1]), fx = (b[0] - a[0]) / len, fz = (b[1] - a[1]) / len, yaw = Math.atan2(fx, fz);
    const inCity = (x, z) => x > c.x0 + 1 && x < c.x1 - 1 && z > c.z0 + 1 && z < c.z1 - 1;
    // parked along both kerbs, nose to the kerb in Vietnam (motorbikes side by side), along the kerb in Australia
    const VN_PARK = ['honda67', 'cub', 'dream', 'scooter', 'cub', 'miniBike', 'dream', 'scooter'], AU_PARK = ['sedan', 'suv', 'ute', 'sedan', 'bmx'];
    let n = 0;
    for (const side of [-1, 1]) for (let s = 6; s < len - 6 && n < 10; s += c.cc === 'vn' ? 1.1 : 5.2) {
      const x = a[0] + fx * s - fz * side * 4.4, z = a[1] + fz * s + fx * side * 4.4;
      if (!inCity(x, z) || !free(x, z, c.cc === 'vn' ? .7 : 1.6)) continue;
      const id = (c.cc === 'vn' ? VN_PARK : AU_PARK)[(n + (side > 0 ? 3 : 0)) % (c.cc === 'vn' ? VN_PARK : AU_PARK).length];
      slots.push({ id, cc: c.cc, x, z, yaw: c.cc === 'vn' ? yaw + side * Math.PI / 2 : yaw + (side > 0 ? Math.PI : 0) }); n++;
      if (c.cc === 'vn' && n % 4 === 0) s += 2.5;   // a gap between groups
    }
    // the city's own: a xích lô in Sài Gòn and Hà Nội, the electric cart round Hà Nội, a modern tram in Melbourne
    const street = route([[a[0] + fx * 3 - fz * 2, a[1] + fz * 3 + fx * 2], [b[0] - fx * 3 - fz * 2, b[1] - fz * 3 + fx * 2]]);
    if (c.id === 'saigon' || c.id === 'hanoi') slots.push({ id: 'xichlo', cc: 'vn', city: c, mover: { r: street, s: 2, dir: 1, lane: 0, wait: 0, rest: 6 }, rides: featureOn('xichloRides', true) });
    if (c.id === 'hanoi') slots.push({ id: 'touristCart', cc: 'vn', mover: { r: route([[a[0] - fz * -2.2 + fx * 3, a[1] + fx * -2.2 + fz * 3], [b[0] - fz * -2.2 - fx * 3, b[1] + fx * -2.2 - fz * 3]]), s: 5, dir: -1, lane: 0, wait: 0, rest: 8 } });
    if (c.id === 'melbourne') slots.push({ id: 'tramModern', cc: 'au', mover: { r: street, s: 1, dir: 1, lane: 0, wait: 0, rest: 10 } });
    if (c.id === 'sydney' || c.id === 'brisbane') { const x = a[0] + fx * (len * .3) + fz * 4.6, z = a[1] + fz * (len * .3) - fx * 4.6; if (free(x, z, 2.5)) slots.push({ id: 'busAU', cc: 'au', x, z, yaw }); }
  }
  if (featureOn('cityVehicles', true)) TOWN_PARKED.forEach(([x, z, r, id]) => slots.push({ id, cc: 'vn', x, z, yaw: r }));
  // ---------- bicycles to ride ----------
  const rideSpots = [];
  if (featureOn('rideBikes', true)) {
    // bicycles wait beside the road, never on it (tests: roads)
    const offRoad = (x, z, r) => { const d = roadDist(x, z); return !d.road || d.d > d.road.w / 2 + r; };
    const spot = (x0, z0, ids, cc, rideable = true) => { for (let k = 0; k < 24; k++) { const a = k * 2.4, d = 3 + k * .5, x = x0 + Math.cos(a) * d, z = z0 + Math.sin(a) * d; if (free(x, z, 1.2) && offRoad(x, z, 1.2)) { ids.forEach((id, j) => { const px = x + j * .9, pz = z; if (free(px, pz, .8) && offRoad(px, pz, .8)) slots.push({ id, cc, x: px, z: pz, yaw: Math.PI / 2, rideable }); }); return; } } };
    spot(VILLAGE.x - 6, VILLAGE.z + 8, ['miniBike', 'roadster'], 'vn');
    spot(HOME.x + 8, HOME.z - 6, ['kidsBike', 'bmx'], 'au');
    spot((TOWN.x0 + TOWN.x1) / 2, TOWN.roadZ + 4, ['miniBike', 'bmx'], 'vn');
    spot((AUSSIE.x0 + AUSSIE.x1) / 2, AUSSIE.roadZ + 5, ['roadBike', 'kidsBike'], 'au');
    // the farm's trail bike and quad bike (to look at; grown-ups' machines)
    spot(HOME.x - 10, HOME.z + 6, ['quadBike'], 'au', false);
  }

  // ---------- making the meshes (again when the look changes) ----------
  // Each model is built once per look and copied (the copies share its shapes), and a vehicle is only made when a child
  // comes within 150 m of it, so starting the game costs nothing (it took 1.4 s to make them all at once).
  let real = false;
  const R2 = rng(11), tpl = new Map(), NEAR = 150;
  const where = sl => sl.v ? [sl.v.o.position.x, sl.v.o.position.z] : sl.mover ? pointAt(sl.mover.r, sl.mover.s) : [sl.x, sl.z];
  function copy(id) {
    const k = id + (real ? '|real' : '');
    if (!tpl.has(k)) { const v = build(id, { real }); tpl.set(k, { v, wheelIdx: v.wheels.map(w => v.o.children.indexOf(w)) }); }
    const { v, wheelIdx } = tpl.get(k), o = v.o.clone(true);
    return { ...v, o, wheels: wheelIdx.map(n => o.children[n]) };
  }
  function make(sl) {
    const at = where(sl), yaw0 = sl.v ? sl.v.o.rotation.y : sl.yaw || 0;
    if (sl.v) scene.remove(sl.v.o);
    const v = sl.v = copy(sl.id);
    if (TWO_WHEEL.has(sl.id) && !sl.rideable && v.seat && sl.mover) {
      const list = sl.cc === 'au' ? AU_RIDERS : VN_RIDERS, A = buildAvatar(list[Math.floor(R2() * list.length)]);
      A.anim('idle', 0, 0); seatRider(A, v, v.seat, v.grips, v.feet); sl.rider = A;
    }
    const sh = blobShadow(); sh.scale.set(1.2, 1, TWO_WHEEL.has(sl.id) ? 2 : 4); sh.position.y = .04; v.o.add(sh);
    scene.add(v.o);
    v.o.position.set(at[0], ground(at[0], at[1]), at[1]); v.o.rotation.y = sl.mover ? (sl.mover.dir > 0 ? at[2] : at[2] + Math.PI) || 0 : yaw0;
  }
  function apply(wantReal) {
    wantReal = !!wantReal && featureOn('realVehicles', true);
    if (wantReal === real) return; real = wantReal;
    slots.forEach(sl => { if (sl.v && !sl.taken && !sl.passenger) make(sl); });
  }
  // make the ones near a child, a few each frame
  let scan = 0;
  W.updaters.push(dt => {
    if ((scan -= dt) > 0) return; scan = .4;
    const H = G.heroes || []; if (!H.length) return;
    let n = 0;
    for (const sl of slots) { if (sl.v) continue; const [x, z] = where(sl); if (H.some(h => Math.hypot(h.pos.x - x, h.pos.z - z) < NEAR)) { make(sl); if (++n >= 4) { scan = 0; break; } } }
  });

  // children ride the bicycles: Jump gets off (js/player.js riding, with the vehicle's own seat and grips)
  for (const sl of slots.filter(s => s.rideable)) {
    G.interactables.push({ id: 'bike_' + slots.indexOf(sl), get x() { return where(sl)[0]; }, get z() { return where(sl)[1]; }, r: 2.2, icon: '🚲',
      label: () => T('Ride the bicycle', 'Đạp xe'), visible: h => !sl.taken && !h.riding && !h.carry,
      act: (h, game) => { if (!sl.v) make(sl); sl.taken = h; const v = sl.v; h.mount({ vehicle: v, mesh: v.o, shadow: { position: new THREE.Vector3() }, yaw: v.o.rotation.y, speed: sl.id === 'roadBike' ? 8 : 6, slot: sl, quiet: true });
        const hud = G.huds && G.huds[G.heroes.indexOf(h)]; if (hud && hud.toast) hud.toast(T('Press Jump to get off', 'Bấm Nhảy để xuống xe')); } });
  }
  // a xích lô ride: sit in front while it rides the main street and back; Jump gets off
  for (const sl of slots.filter(s => s.rides)) {
    G.interactables.push({ id: 'xichlo_' + sl.city.id, get x() { return where(sl)[0]; }, get z() { return where(sl)[1]; }, r: 2.6, icon: '🚲',
      label: () => T('Ride the xích lô', 'Đi xích lô'), visible: h => !sl.passenger && !h.riding && !h.carry,
      act: h => { if (!sl.v) make(sl); sl.passenger = h; sl.mover.wait = 0; let left = sl.mover.r.len * 2 + 4;
        h.carry = (dt, t, pad) => {
          left -= dt * SPEED.xichlo; if (pad.jump() || left <= 0) { h.carry = null; sl.passenger = null; const o = sl.v.o; h.place(o.position.x + Math.cos(o.rotation.y) * 1.6, o.position.z - Math.sin(o.rotation.y) * 1.6); return null; }
          const p = sl.v.o.localToWorld(new THREE.Vector3(...sl.v.passenger)); return { x: p.x, y: p.y - .55, z: p.z, yaw: sl.v.o.rotation.y, state: 'sit', speed: 0, rest: true };
        };
      } });
  }

  // ---------- moving ----------
  const AHEAD = 5;
  W.updaters.push((dt, t) => {
    const H = G.heroes || [];
    for (const sl of slots) {
      const m = sl.mover; if (!m || !sl.v) continue;
      // far from every child: nothing to update
      const o = sl.v.o; if (H.length && !H.some(h => Math.hypot(h.pos.x - o.position.x, h.pos.z - o.position.z) < 140)) continue;
      const sp = SPEED[sl.id] || SPEED.default;
      if (m.wait > 0) { m.wait -= dt; }
      else {
        const [x, z, yaw] = pointAt(m.r, m.s), hy = m.dir > 0 ? yaw : yaw + Math.PI, fx = Math.sin(hy), fz = Math.cos(hy);
        // a child (or the rider on a bike) in front: wait
        const blocked = H.some(h => h !== sl.passenger && (() => { const dx = h.pos.x - o.position.x, dz = h.pos.z - o.position.z, along = dx * fx + dz * fz; return along > 0 && along < AHEAD + (sl.id.startsWith('bus') || sl.id.startsWith('tram') ? 3 : 0) && Math.abs(dx * fz - dz * fx) < 1.8; })());
        if (!blocked) {
          m.s += m.dir * sp * dt;
          if (m.s >= m.r.len || m.s <= 0) { m.s = Math.max(0, Math.min(m.r.len, m.s)); m.dir *= -1; m.wait = m.rest; }
          const rx = -Math.cos(hy), rz = Math.sin(hy);   // to the right of the way it goes
          const px = x + rx * m.lane, pz = z + rz * m.lane;
          o.position.set(px, ground(px, pz), pz); o.rotation.y = hy;
          sl.v.wheels.forEach(w => { w.rotation.x += sp * dt / sl.v.wr; });
        }
      }
    }
  });
  const api = { apply, slots, where, make, count: () => slots.length };
  G.traffic = api;
  return api;
}

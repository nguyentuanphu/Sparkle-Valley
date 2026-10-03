// Free ferries: a little blue ferry boat that goes round Mirror Lake stopping at four piers, and two
// bamboo rafts that cross the river. Walk to the end of a pier and tap "Ride the ferry"; if the boat
// isn't there yet, you wait and hop on when it arrives. Tap "Get off" at any stop.
import { THREE, P, merge, toonVC, outline, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { WATER, LAKE, RIVER, BRIDGE, DRAGON, CITIES, VILLAGE, TOWN, MARKET, CHINA, INDIA, HOME, AUSSIE, heightAt, regionAt, REGION_NAMES } from './world.js';
import { dist2 } from './util.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);

function signTex(lines, w = 512, h = 128, bg = '#2f86c0') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const draw = () => { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = `bold ${h * .4}px Fredoka, "Baloo 2", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lines(), w / 2, h * .54, w - 30); t.needsUpdate = true; };
  draw(); onLang(draw); return t;
}

function ferryBoat() {
  const p = [];
  p.push(P(B(7, 1.1, 3), '#ffffff', [0, .55, 0]), P(B(7.2, .25, 3.2), '#2f86c0', [0, .05, 0]), P(new THREE.CylinderGeometry(1.5, 1.5, 1.1, 16, 1, false, 0, Math.PI), '#ffffff', [3.5, .55, 0], [0, Math.PI / 2, 0]));
  p.push(P(B(7.4, .15, 3.3), '#c98a4a', [0, 1.15, 0])); // deck rail top
  p.push(P(B(2.6, 1.8, 2.4), '#e8f6ff', [-1.8, 2.1, 0]), P(B(3, .25, 2.8), '#ff5a5a', [-1.8, 3.1, 0]));
  [-1, 1].forEach(s => p.push(P(B(.9, .7, .1), '#86cfe8', [-1.8, 2.3, s * 1.21])));
  p.push(P(C(.25, .3, 1.2), '#ffd23f', [-1.8, 3.8, 0]), P(C(.3, .3, .2), '#2b2238', [-1.8, 4.45, 0]));
  for (let i = 0; i < 6; i++) p.push(P(C(.04, .04, .6, 6), '#ffffff', [-.2 + i * .65, 1.45, 1.45]), P(C(.04, .04, .6, 6), '#ffffff', [-.2 + i * .65, 1.45, -1.45]));
  p.push(P(new THREE.TorusGeometry(.32, .1, 8, 16), '#ff5a5a', [1, 1.6, 1.52]));
  const m = new THREE.Mesh(merge(p), toonVC()); m.castShadow = true; outline(m, .03, '#2b3a4f');
  const g = new THREE.Group(); g.add(m);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({ map: signTex(() => T('⛴️ FREE FERRY', '⛴️ PHÀ MIỄN PHÍ')), transparent: true }));
  sign.position.set(-1.8, 2.75, 1.24); g.add(sign); const s2 = sign.clone(); s2.position.z = -1.24; s2.rotation.y = Math.PI; g.add(s2);
  const flag = sprite('🚩', .9); flag.position.set(-1.8, 5, 0); g.add(flag);
  g.deck = 1.15; g.seats = [[1.4, .6], [1.4, -.6], [2.6, .5], [2.6, -.5]];
  return g;
}
function bambooRaft() {
  const p = [];
  for (let i = 0; i < 9; i++) p.push(P(C(.2, .2, 5, 8), i % 2 ? '#c9b45a' : '#b8a24a', [0, .25, -1.6 + i * .4], [0, 0, Math.PI / 2]));
  [-1.8, 1.8].forEach(x => p.push(P(B(.2, .15, 3.6), '#8a6a3a', [x, .5, 0])));
  [[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].forEach(([x, z]) => p.push(P(C(.06, .06, 2, 6), '#8a6a3a', [x, 1.5, z])));
  p.push(P(C(.05, .05, 3, 6), '#8a6a3a', [2.3, 1.6, 0], [0, 0, -.5])); // pole
  const m = new THREE.Mesh(merge(p), toonVC()); m.castShadow = true; outline(m, .03, '#4a3a2a');
  // the thatched roof is its own see-through-able piece: while a child rides, it fades so the camera can see them
  const roofMat = toonVC(); roofMat.transparent = true;
  const roof = new THREE.Mesh(merge([P(new THREE.ConeGeometry(2.6, 1, 4), '#d9b86a', [0, 2.9, 0], [0, Math.PI / 4, 0], [1.1, 1, .8])]), roofMat); roof.castShadow = true;
  const g = new THREE.Group(); g.add(m, roof); g.roof = roof;
  const lan = sprite('🏮', .7); lan.position.set(0, 2.2, 0); g.add(lan);
  g.deck = .5; g.seats = [[-.6, .5], [.6, -.5], [-.6, -.6], [.6, .6]];
  return g;
}

export function createFerries(G) {
  const { scene, world } = G;
  const pier = (sx, sz, ex, ez) => { // wooden pier from (sx,sz) on land to (ex,ez) over water; walkable
    const dx = ex - sx, dz = ez - sz, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz), y = WATER + .6, parts = [];
    for (let k = 0; k <= L; k += .55) parts.push(P(B(2.6, .14, .5), k % 1.1 < .55 ? '#b88a5a' : '#a87a4a', [0, 0, k]));
    for (let k = 0; k <= L; k += 2.2) [-1.2, 1.2].forEach(x => parts.push(P(C(.13, .13, 3.2, 6), '#7a5236', [x, -1.3, k])));
    const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(sx, y, sz); m.rotation.y = a; m.receiveShadow = true; scene.add(m);
    for (let k = 0; k <= L; k += 1.2) { const px = sx + dx / L * k, pz = sz + dz / L * k; world.platforms.push({ x0: px - 1.1, x1: px + 1.1, z0: pz - 1.1, z1: pz + 1.1, y: y + .07 }); }
    return { tip: { x: ex, z: ez, y: y + .07 }, a };
  };

  // a boat that drives along a path of points, stopping at some of them
  const ferries = [];
  function makeFerry({ model, path, loop, stops, speed }) {
    model.traverse(o => { o.userData.noCam = true; }); // a moving boat never pushes the camera in (it ended up inside the raft's roof)
    scene.add(model);
    const F = { model, path, loop, stops, speed, seg: 0, k: 0, dir: 1, wait: 4, at: stops[0].i, riders: new Set(), waiting: new Set() };
    model.position.set(path[0].x, WATER, path[0].z);
    ferries.push(F); return F;
  }
  const stopAt = F => F.wait > 0 ? F.stops.find(s => s.i === F.at) : null;

  // ---------- Mirror Lake: four piers, one ferry going round ----------
  const R = LAKE.r;
  const DOCKS = [
    { a: 100, name: () => T('North Beach', 'Bãi Bắc') },
    { a: 160, name: () => T('Sunny Farm', 'Nông Trại') },
    { a: 243, name: () => T('Two Homes Street', 'Phố Hai Quê') },
    { a: 330, name: () => T('Three Regions Market', 'Chợ Ba Miền') }
  ];
  const REEF_A = Math.atan2(160 - LAKE.z, 76 - LAKE.x) * 180 / Math.PI; // keep clear of the coral reef
  const lakePath = [], lakeStops = [];
  for (let a = 100; a < 460; a += 6) {
    const ang = a % 360, near = DOCKS.find(d => Math.abs(d.a - ang) < 3);
    const off = Math.abs(((ang - REEF_A + 540) % 360) - 180);
    const r = off < 28 ? R * (.48 + off / 28 * .2) : R * .68;
    const rad = ang * Math.PI / 180;
    if (near) lakeStops.push({ i: lakePath.length, name: near.name, dock: near });
    lakePath.push({ x: LAKE.x + Math.cos(rad) * r, z: LAKE.z + Math.sin(rad) * r });
  }
  DOCKS.forEach(d => {
    const rad = d.a * Math.PI / 180, cx = Math.cos(rad), cz = Math.sin(rad);
    // the pier starts where the ground is above water
    let rs = R * .7; while (rs < R * 1.1 && heightAt(LAKE.x + cx * rs, LAKE.z + cz * rs) < WATER + .5) rs += .5;
    d.pier = pier(LAKE.x + cx * (rs + 1), LAKE.z + cz * (rs + 1), LAKE.x + cx * R * .72, LAKE.z + cz * R * .72);
  });
  const lakeFerry = makeFerry({ model: ferryBoat(), path: lakePath, loop: true, stops: lakeStops, speed: 6.5 });

  // ---------- the river: two bamboo rafts crossing back and forth ----------
  // Each crossing is picked on the river where it is open water well away from both bridges (a raft under the
  // Dragon Bridge left the camera inside the deck: nothing to see), and as close as possible to a town or village,
  // so each bank's stop is a real place you can find on the map.
  const PLACES = [...CITIES.map(c => ({ x: c.x, z: c.z, name: () => T(c.name[0], c.name[1]) })), { x: VILLAGE.x, z: VILLAGE.z, name: () => T('Lotus Village', 'Làng Sen') },
    { x: (TOWN.x0 + TOWN.x1) / 2, z: TOWN.roadZ, name: () => T('Two Homes Street', 'Phố Hai Quê') }, { x: (MARKET.x0 + MARKET.x1) / 2, z: MARKET.roadZ, name: () => T('Three Regions Market', 'Chợ Ba Miền') },
    { x: CHINA.x, z: CHINA.z, name: () => T('China Town', 'Phố Tàu') }, { x: INDIA.x, z: INDIA.z, name: () => T('India Village', 'Làng Ấn Độ') }, { x: HOME.x, z: HOME.z, name: () => T('Sunny Farm', 'Nông Trại Nắng') }, { x: (AUSSIE.x0 + AUSSIE.x1) / 2, z: AUSSIE.roadZ, name: () => T('Aussie Corner', 'Góc nước Úc') }];
  const nearest = (x, z) => { let b = null, bd = 1e9; for (const p of PLACES) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; b = p; } } return [b, bd]; };
  const bridgeD = (x, z) => Math.min(...[BRIDGE, DRAGON].map(B => Math.hypot(Math.max(B.x0 - x, 0, x - B.x1), z - B.z)));
  const cands = [];
  for (let i = 1; i < RIVER.length - 1; i++) for (let t = .1; t < .95; t += .1) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    if (bridgeD(x, z) < 34 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 16 || heightAt(x, z) > WATER - .5) continue;
    cands.push({ i, x, z, d: nearest(x, z)[1] });
  }
  cands.sort((a, b) => a.d - b.d);
  const picks = []; for (const c of cands) { if (picks.every(p => Math.hypot(p.x - c.x, p.z - c.z) > 60)) picks.push(c); if (picks.length === 2) break; }
  picks.forEach(({ i, x, z }) => {
    const [x0, z0] = RIVER[i], [x1, z1] = RIVER[i + 1];
    let dx = x1 - x0, dz = z1 - z0; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    const px = -dz, pz = dx; // across the river
    const bank = s => { let k = 0; while (k < 30 && heightAt(x + px * s * k, z + pz * s * k) < WATER + .5) k += .5; return k; };
    const kA = bank(-1), kB = bank(1);
    const pa = pier(x - px * (kA + 2), z - pz * (kA + 2), x - px * (kA - 1.2), z - pz * (kA - 1.2));
    const pb = pier(x + px * (kB + 2), z + pz * (kB + 2), x + px * (kB - 1.2), z + pz * (kB - 1.2));
    const ends = [{ x: x - px * (kA - 2.6), z: z - pz * (kA - 2.6) }, { x: x + px * (kB - 2.6), z: z + pz * (kB - 2.6) }];
    const path = []; for (let k = 0; k <= 10; k++) path.push({ x: ends[0].x + (ends[1].x - ends[0].x) * k / 10, z: ends[0].z + (ends[1].z - ends[0].z) * k / 10 });
    const side = s => Math.abs(px) > Math.abs(pz) ? (px * s > 0 ? T('east bank', 'bờ Đông') : T('west bank', 'bờ Tây')) : (pz * s > 0 ? T('south bank', 'bờ Nam') : T('north bank', 'bờ Bắc'));
    const placeOf = (bx, bz) => { const [p, d] = nearest(bx, bz); if (p && d < 90) return p.name; const rg = REGION_NAMES[regionAt(bx, bz)]; return rg || (() => ''); };
    const pA = placeOf(x - px * (kA + 10), z - pz * (kA + 10)), pB = placeOf(x + px * (kB + 10), z + pz * (kB + 10));
    const names = [() => pA() + ' · ' + side(-1), () => pB() + ' · ' + side(1)];
    makeFerry({ model: bambooRaft(), path, loop: false, speed: 3.2, stops: [{ i: 0, name: names[0], dock: { pier: pa } }, { i: path.length - 1, name: names[1], dock: { pier: pb } }] });
  });

  // ---------- riding ----------
  const _q = new THREE.Vector3();
  function board(h, F) {
    if (h.carry) return;
    F.waiting.delete(h); F.riders.add(h); h.ferry = F; SFX.whoosh(); const seat = F.model.seats[[...F.riders].indexOf(h) % F.model.seats.length];
    const stopName = () => { const s = stopAt(F); return s ? s.name() : ''; };
    h.carryIt = { icon: '🚶', label: () => stopAt(F) ? T('Get off here: ', 'Xuống ở đây: ') + stopName() : h.offNext ? T('Getting off at the next stop', 'Xuống ở bến sau') : T('Get off at the next stop', 'Xuống ở bến sau'),
      act: () => { if (stopAt(F)) leave(h, F); else { h.offNext = true; SFX.tap(); G.toast(h, T('OK! You will get off at the next stop.', 'Được rồi! Con sẽ xuống ở bến sau.')); } } };
    h.cancelCarry = () => { F.riders.delete(h); h.carry = null; h.ferry = null; h.carryIt = null; h.offNext = false; };
    h.carry = () => {
      const m = F.model; _q.set(seat[0], m.deck, seat[1]).applyMatrix4(m.matrixWorld);
      return { x: _q.x, y: _q.y, z: _q.z, yaw: m.rotation.y + Math.PI / 2, state: 'idle', rest: true };
    };
    say(`All aboard! Ferries are free. Tap Get off when you reach your stop.`, `Lên phà nào! Phà miễn phí. Đến bến con muốn thì bấm Xuống nhé.`);
  }
  function leave(h, F) {
    const s = stopAt(F); if (!s) return;
    const tip = s.dock.pier.tip, a = s.dock.pier.a;
    h.cancelCarry(); h.cancelCarry = null;
    // step onto the end of the pier, facing the shore
    h.place(tip.x - Math.sin(a) * 1.4, tip.z - Math.cos(a) * 1.4, tip.y); h.yaw = a + Math.PI; SFX.jump();
  }

  // board from each pier: tap to ride (or wait for the boat)
  ferries.forEach((F, fi) => F.stops.forEach((s, si) => {
    const tip = s.dock.pier.tip, a = s.dock.pier.a, x = tip.x - Math.sin(a) * 1.2, z = tip.z - Math.cos(a) * 1.2;
    const icon = sprite('⛴️', 1.4); icon.position.set(x, tip.y + 2.6, z); scene.add(icon);
    world.updaters.push((dt, t) => { icon.position.y = tip.y + 2.6 + Math.sin(t * 2 + fi + si) * .15; });
    G.interactables.push({ id: `ferry${fi}_${si}`, x, z, y: tip.y, r: 2.6, icon: '⛴️', visible: h => !h.carry,
      label: () => (stopAt(F) === s ? T('Ride the free ferry', 'Đi phà miễn phí') : F.waiting.size && [...F.waiting].some(w => w.waitStop === s) ? T('Waiting for the ferry…', 'Đang chờ phà…') : T('Wait for the free ferry', 'Chờ phà miễn phí')) + ' · ' + s.name(),
      act: h => {
        if (stopAt(F) === s) return board(h, F);
        h.waitStop = s; F.waiting.add(h); SFX.tap(); say('The ferry is coming. Wait here on the pier!', 'Phà đang đến. Đứng chờ ở cầu tàu nhé!');
      } });
  }));

  // ---------- moving the boats ----------
  world.updaters.push((dt, t) => {
    ferries.forEach(F => {
      const m = F.model;
      if (F.wait > 0) {
        F.wait -= dt;
        const s = stopAt(F);
        // children waiting on this pier hop on; riders who asked get off
        if (s) {
          F.waiting.forEach(h => { if (h.waitStop === s && dist2(h.pos.x, h.pos.z, s.dock.pier.tip.x, s.dock.pier.tip.z) < 5) board(h, F); else if (dist2(h.pos.x, h.pos.z, s.dock.pier.tip.x, s.dock.pier.tip.z) > 12) F.waiting.delete(h); });
          F.riders.forEach(h => { if (h.offNext) { h.offNext = false; leave(h, F); } });
        }
        if (F.wait <= 0) { F.seg = F.at; F.k = 0; }
      } else {
        const n = F.path.length;
        let i = F.seg, j = F.loop ? (i + 1) % n : i + F.dir;
        if (!F.loop && (j < 0 || j >= n)) { F.dir *= -1; j = i + F.dir; }
        const a = F.path[i], b = F.path[j], L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        F.k += F.speed * dt / L;
        if (F.k >= 1) {
          F.seg = j; F.k = 0;
          const st = F.stops.find(s => s.i === j);
          if (st) {
            F.at = j; F.wait = F.loop ? 7 : 6; m.position.set(b.x, WATER, b.z);
            if ([...F.riders].length) { SFX.chime(); F.riders.forEach(h => G.toast(h, '⛴️ ' + st.name())); say(`${st.name()}!`, `${st.name()}!`); }
            if (!F.loop && (j === 0 || j === n - 1)) F.dir = j === 0 ? 1 : -1;
          }
          return;
        }
        m.position.set(a.x + (b.x - a.x) * F.k, WATER, a.z + (b.z - a.z) * F.k);
        const want = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
        let d = want - m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); m.rotation.y += d * Math.min(1, dt * (F.loop ? 2 : 6));
      }
      if (m.roof) { const want = F.riders.size ? .28 : 1, mt = m.roof.material; mt.opacity += (want - mt.opacity) * Math.min(1, dt * 4); mt.depthWrite = mt.opacity > .95; }
      m.position.y = WATER + Math.sin(t * 1.6 + F.speed) * .06; m.rotation.z = Math.sin(t * 1.1) * .02;
      m.updateMatrixWorld();
    });
  });
  return { ferries, docks: DOCKS };
}

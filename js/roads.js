// Roads between the villages and cities: an asphalt main road with a dashed white centre line, dirt
// roads to the quieter places, Đà Nẵng's golden Dragon Bridge where the road crosses the river, and a
// golden welcome gate (cổng chào) at the entrance of every village and city.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { T, onLang } from './i18n.js';
import { SFX } from './audio.js';
import { heightAt, ROADS, DRAGON, REGION_NAMES, setRoadBeds, roadBedsOn } from './world.js';

// a long strip texture: asphalt with a dashed centre line, or packed dirt with wheel tracks
export function roadTexture(kind) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  if (kind !== 'dirt') { // 'asphalt', or 'plain' asphalt without lines (for junctions)
    g.fillStyle = '#6f747a'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2); }
    if (kind === 'asphalt') { g.fillStyle = '#e9e4d4'; g.fillRect(2, 0, 3, 256); g.fillRect(59, 0, 3, 256);
      g.fillStyle = '#f6f1e4'; g.fillRect(30, 20, 4, 90); g.fillRect(30, 148, 4, 90); }
  } else {
    g.fillStyle = '#c99d66'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,240,210,.12)' : 'rgba(90,60,30,.12)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 2, 2); }
    g.fillStyle = 'rgba(120,85,50,.22)'; g.fillRect(14, 0, 7, 256); g.fillRect(43, 0, 7, 256);
    g.fillStyle = 'rgba(110,160,80,.5)'; g.fillRect(29, 0, 6, 256); // a little grass down the middle
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// A side road that ends on another road stops at that road's edge (instead of painting its lines over it).
function segDist(x, z, pts) { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return best; }
function trimmed(R) {
  let pts = R.pts.map(p => p.slice());
  for (const end of [0, 1]) {
    if ((R.gates || [])[end]) continue;
    const [x, z] = end ? pts[pts.length - 1] : pts[0];
    const other = ROADS.find(o => o !== R && segDist(x, z, o.pts) < 1.5); if (!other) continue;
    let cut = other.w / 2 - .15; if (end) pts.reverse();
    while (pts.length > 2 && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) <= cut) { cut -= Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]); pts.shift(); }
    const [ax, az] = pts[0], [bx, bz] = pts[1], L = Math.hypot(bx - ax, bz - az) || 1; pts[0] = [ax + (bx - ax) / L * Math.min(cut, L * .9), az + (bz - az) / L * Math.min(cut, L * .9)];
    if (end) pts.reverse();
  }
  return pts;
}
// Each road is a smooth line sampled every metre with one smooth height along it: the ground under the whole width
// (its highest point), averaged over several metres so the road never humps or steps, level from side to side,
// and exactly on the bridge decks. Roads meeting another road take its height at the joint and ease into their own.
// The ground under and beside the road is then shaped to that height (world.js road beds), so the road, its edges
// and the walking surface always agree.
function denseLine(R) {
  const src = trimmed(R), pts = [];
  for (let i = 0; i < src.length - 1; i++) { const [ax, az] = src[i], [bx, bz] = src[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1)); for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
  pts.push(src[src.length - 1]); return pts;
}
const deckAt = (world, x, z) => { for (const p of world.platforms) if (!p.tower && x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) return p.y; return null; };
function profile(R, world, pts) {
  const hw = R.w / 2, deck = [], base = pts.map(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(nx - px, nz - pz) || 1, ux = -(nz - pz) / L, uz = (nx - px) / L;
    // a real bridge deck: the deck is well above the ground under it (near the ends the bank is the ground)
    const d = deckAt(world, x, z), g0 = heightAt(x, z), onDeck = d != null && g0 < d - 1; deck.push(onDeck); if (onDeck) return d;
    let y = -1e9; for (const s of [-1, -.5, 0, .5, 1]) y = Math.max(y, heightAt(x + ux * hw * s, z + uz * hw * s)); return y;
  });
  let ys = base.slice();
  for (let it = 0; it < 6; it++) ys = ys.map((y, i) => { if (deck[i]) return y; let s = 0, w = 0; for (let k = -4; k <= 4; k++) { const j = i + k; if (j < 0 || j >= ys.length) continue; const wk = 5 - Math.abs(k); s += ys[j] * wk; w += wk; } return s / w; });
  // never far below the ground's high points (cut at most 35 cm into a bump) nor dug into the bridge banks
  ys = ys.map((y, i) => deck[i] ? y : Math.max(y, base[i] - .35));
  // at a town's gate the road meets the town's own level ground exactly, easing into its smooth height over 14 m
  (R.gates || []).forEach((g, end) => { if (!g) return; const n = ys.length, i0 = end ? n - 1 : 0, diff = base[i0] - ys[i0], N = Math.min(14, n - 1);
    for (let k = 0; k <= N; k++) { const i = end ? n - 1 - k : k, u = 1 - k / N; if (!deck[i]) ys[i] += diff * u * u * (3 - 2 * u); } });
  return { ys, deck };
}
function ribbonGeo(R, pts, ys) {
  const pos = [], uv = [], idx = [], hw = R.w / 2; let along = 0;
  pts.forEach(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = nx - px, dz = nz - pz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) along += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const s of [-1, -.5, 0, .5, 1]) { pos.push(x - dz * hw * s, ys[i] + .035, z + dx * hw * s); uv.push((s + 1) / 2, along / (R.kind === 'asphalt' ? 9 : 7)); }
    if (i) { const a = (i - 1) * 5; for (let c = 0; c < 4; c++) idx.push(a + c, a + c + 1, a + c + 5, a + c + 1, a + c + 6, a + c + 5); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// all roads: profiles, joints matched, road beds registered and switched on (the ground is reshaped), then the ribbons
function buildRoads(G, mats) {
  const { scene, world } = G, all = ROADS.map(R => { const pts = denseLine(R); return { R, pts, ...profile(R, world, pts) }; });
  // a road whose end meets another road takes that road's height there, easing over the last 14 m
  all.forEach((A, ai) => [0, 1].forEach(end => {
    const n = A.pts.length, [x, z] = A.pts[end ? n - 1 : 0];
    let best = null, bd = 1e9; all.forEach((B, bi) => { if (bi === ai) return; B.pts.forEach((p, j) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < B.R.w / 2 + 1.2 && d < bd && (bi < ai || (j > 2 && j < B.pts.length - 3))) { bd = d; best = B.ys[j]; } }); });
    if (best == null) return;
    const diff = best - A.ys[end ? n - 1 : 0], N = Math.min(14, n - 1);
    for (let k = 0; k <= N; k++) { const i = end ? n - 1 - k : k; if (!A.deck[i]) { const u = 1 - k / N; A.ys[i] += diff * u * u * (3 - 2 * u); } }
  }));
  const segs = [];
  for (const A of all) for (let i = 0; i < A.pts.length - 1; i++) if (!A.deck[i] && !A.deck[i + 1]) segs.push({ r: all.indexOf(A), first: i === 0, last: i === A.pts.length - 2, ax: A.pts[i][0], az: A.pts[i][1], bx: A.pts[i + 1][0], bz: A.pts[i + 1][1], ya: A.ys[i], yb: A.ys[i + 1], hw: A.R.w / 2 });
  setRoadBeds(segs); roadBedsOn(world, scene);
  world.roadTop = null; // walking on a road is walking on the ground now (bridge decks are platforms)
  for (const A of all) { const m = new THREE.Mesh(ribbonGeo(A.R, A.pts, A.ys), mats[A.R.kind]); m.receiveShadow = true; m.userData.road = true; scene.add(m); }
}

// the welcome sign on a gate: big words that follow the language
function gateSign(text, w, h, bg = '#c62828', fg = '#ffe27a') {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w); const g = c.getContext('2d');
  const draw = () => {
    const s = typeof text === 'function' ? text() : Array.isArray(text) ? T(text[0], text[1]) : text;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(10, 10, c.width - 20, c.height - 20);
    let size = c.height * .5; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`;
    while (g.measureText(s).width > c.width - 60 && size > 12) { size -= 2; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, c.width / 2, c.height / 2 + 3);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (typeof text !== 'string') onLang(() => { draw(); t.needsUpdate = true; });
  const m = new THREE.MeshBasicMaterial({ map: t }), grp = new THREE.Group();
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b.rotation.y = Math.PI; a.position.z = .13; b.position.z = -.13;
  grp.add(a, b); return grp;
}

// A golden cổng chào: two round golden pillars with lotus tops, a curved golden roof and a red sign.
export function goldenGate(scene, world, x, z, rot, text, span = 8) {
  const gold = '#f2c230', deep = '#d49a12', red = '#c62828', hs = span / 2, H = 6;
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push(P(new THREE.CylinderGeometry(.75, .9, .6, 12), '#b9a27a', [s * hs, .3, 0]));
    parts.push(P(new THREE.CylinderGeometry(.48, .55, H, 14), gold, [s * hs, H / 2 + .5, 0]));
    for (let k = 0; k < 3; k++) parts.push(P(new THREE.TorusGeometry(.55, .1, 6, 16), deep, [s * hs, 1.5 + k * 1.6, 0], [Math.PI / 2, 0, 0]));
    parts.push(P(new THREE.SphereGeometry(.7, 12, 8), gold, [s * hs, H + 1.3, 0], [0, 0, 0], [1, .8, 1]));
    parts.push(P(new THREE.ConeGeometry(.35, .9, 10), deep, [s * hs, H + 2.1, 0]));
  }
  parts.push(P(new THREE.BoxGeometry(span + 1.6, .55, 1.3), gold, [0, H + .3, 0]));
  parts.push(P(new THREE.BoxGeometry(span + 2.6, .35, 1.9), deep, [0, H + .85, 0]));
  // the roof curls up at both ends, like a temple roof
  for (const s of [-1, 1]) parts.push(P(new THREE.ConeGeometry(.35, 1.4, 6), gold, [s * (hs + 1.4), H + 1.3, 0], [0, 0, s * -.9]));
  parts.push(P(new THREE.BoxGeometry(span * .55, .5, .9), red, [0, H + 1.35, 0]), P(new THREE.SphereGeometry(.5, 10, 8), '#ff5a3a', [0, H + 1.85, 0]));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(x, heightAt(x, z) - .1, z); m.rotation.y = rot; m.castShadow = true; m.userData.noCam = true; scene.add(m); outline(m, .025, '#6a4a10');
  const sg = gateSign(text, span - .6, 1.5, red, '#ffe27a'); sg.position.set(0, H - .7, 0); m.add(sg);
  // pillars are solid; you walk between them
  for (const s of [-1, 1]) world.colliders.push({ x: x + Math.cos(rot) * s * hs, z: z - Math.sin(rot) * s * hs, r: .9 });
  return m;
}

// ---------- a gate in the style of each place (the road passes between the two posts, 7.5 m apart) ----------
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d), C3 = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
const roofCone = (w, h, d, color, y, z = 0) => P(new THREE.ConeGeometry(1, 1, 4), color, [0, y, z], [0, Math.PI / 4, 0], [w * .72, h, d * .72]);
const halfRing = (r, tube, color, y, segs = 24) => P(new THREE.TorusGeometry(r, tube, 8, segs, Math.PI), color, [0, y, 0]);
const STYLES = {
  // Hà Nội: an old city gate (ô quan), a thick wall with an arch and a little pavilion on top
  ohquan: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(2.6, 5.4, 3), '#b9ab8e', [s * (hs + 1.1), 2.7, 0]), P(B3(2.8, .4, 3.2), '#9a8c70', [s * (hs + 1.1), .2, 0])]),
    P(B3(2 * hs + 5, 1.8, 3), '#b9ab8e', [0, 6.3, 0]), halfRing(hs, .35, '#a89a7c', 5.2),
    P(B3(4.6, 1.6, 2.4), '#9a3a2a', [0, 7.9, 0]), roofCone(6.4, 1.5, 3.6, '#6a4a2a', 9.3), roofCone(7.4, .7, 4.2, '#7a5634', 8.5),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.25, 1, 6), '#6a4a2a', [s * 3.6, 9, 0], [0, 0, s * -.9]))
  ], sign: { y: 6.3, w: 5.4, h: 1.2, bg: '#a8302a', fg: '#ffe27a' }, posts: hs + 1.1, postR: 1.5 }),
  // Bắc Ninh: a village gate of old brick with a curved tiled roof
  kinhbac: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.2, 5, 1.2), '#b45a3a', [s * hs, 2.5, 0]), P(B3(1.5, .3, 1.5), '#8a3a2a', [s * hs, 5.1, 0]), P(new THREE.SphereGeometry(.45, 10, 8), '#e8c86a', [s * hs, 5.6, 0])]),
    P(B3(2 * hs + 1.6, .6, 1.4), '#7a3a2a', [0, 5.3, 0]), roofCone(2 * hs + 3.4, 1.6, 3, '#8a4a2a', 6.5),
    ...[-1, 1].map(s => P(new THREE.ConeGeometry(.3, 1.2, 6), '#8a4a2a', [s * (hs + 2.2), 6.3, 0], [0, 0, s * -.9]))
  ], sign: { y: 4.4, w: 6, h: 1.1, bg: '#7a2a1a', fg: '#ffe27a' }, posts: hs }),
  // Hồ Chí Minh City: two white posts and a bright blue steel arch
  saigon: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.9, 6.2, .9), '#f4f4f0', [s * hs, 3.1, 0]), P(B3(1, .3, 1), '#3a78c8', [s * hs, 2, 0]), P(B3(1, .3, 1), '#3a78c8', [s * hs, 4, 0])]),
    halfRing(hs, .28, '#3a78c8', 6), halfRing(hs - .7, .12, '#ffd23f', 6)
  ], sign: { y: 5.3, w: 6.4, h: 1.1, bg: '#ffffff', fg: '#1f4f9a' }, posts: hs }),
  // Sydney: a little steel coat-hanger arch between two stone pylons
  coathanger: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.6, 3.6, 1.6), '#cfc6b0', [s * (hs + .4), 1.8, 0]), P(B3(1.9, .35, 1.9), '#b8ae96', [s * (hs + .4), 3.8, 0])]),
    halfRing(hs + .4, .3, '#8a949a', 2.4), halfRing(hs - .3, .14, '#8a949a', 2.4),
    ...[-2.4, -1.2, 0, 1.2, 2.4].map(x => P(B3(.08, 6 - Math.abs(x) * .55, .08), '#8a949a', [x, 2.4 + (6 - Math.abs(x) * .55) / 2 - .4, 0]))
  ], sign: { y: 3.4, w: 5.2, h: .9, bg: '#2f5f8a', fg: '#ffffff' }, posts: hs + .4, postR: 1.1 }),
  // Melbourne: green cast-iron posts and lacework arch
  iron: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(C3(.2, .26, 5.8), '#2f5a3a', [s * hs, 2.9, 0]), P(new THREE.SphereGeometry(.3, 10, 8), '#c9a24a', [s * hs, 6, 0])]),
    halfRing(hs, .1, '#2f5a3a', 5.2), halfRing(hs - .5, .07, '#2f5a3a', 5.2),
    ...Array.from({ length: 9 }, (_, k) => { const a = k / 8 * Math.PI; return P(new THREE.TorusGeometry(.22, .04, 4, 10), '#2f5a3a', [Math.cos(a) * (hs - .25), 5.2 + Math.sin(a) * (hs - .25), 0]); })
  ], sign: { y: 4.6, w: 5.4, h: .9, bg: '#f4ead2', fg: '#2f5a3a' }, posts: hs }),
  // Brisbane: a white Queenslander gate with lattice, a tin roof and a koala
  queenslander: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.5, 4.8, .5), '#f4f1e8', [s * hs, 2.4, 0]), ...[0, 1, 2].map(k => P(B3(.06, 1.2, .06), '#f4f1e8', [s * (hs + .4 + k * .25), 1.2, 0]))]),
    P(B3(2 * hs + 1, .4, .8), '#f4f1e8', [0, 4.8, 0]), roofCone(2 * hs + 2, 1, 2, '#9aa6ac', 5.5),
    P(new THREE.SphereGeometry(.42, 10, 8), '#9a9a9e', [hs - .2, 5.4, .2]), P(new THREE.SphereGeometry(.3, 10, 8), '#9a9a9e', [hs - .2, 5.95, .3]), P(new THREE.SphereGeometry(.12, 8, 6), '#3a3a3a', [hs - .2, 5.95, .58])
  ], sign: { y: 4.1, w: 5.4, h: .9, bg: '#2f7a4a', fg: '#ffffff' }, posts: hs }),
  // Aussie Corner: a rustic gate of logs with a hanging sign
  timber: hs => ({ parts: [
    ...[-1, 1].map(s => P(C3(.42, .48, 5.6, 9), '#8a5a3b', [s * hs, 2.8, 0])),
    P(C3(.36, .36, 2 * hs + 2, 9), '#7a4a2a', [0, 5.4, 0], [0, 0, Math.PI / 2]),
    ...[-1.2, 1.2].map(x => P(B3(.05, .8, .05), '#5a3a1a', [x, 4.85, 0]))
  ], sign: { y: 4.1, w: 4.4, h: 1, bg: '#7a4a2a', fg: '#ffd23f' }, posts: hs }),
  // China Town: a paifang, red pillars and green tiled roofs
  paifang: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(C3(.34, .4, 6.2), '#c0392b', [s * hs, 3.1, 0]), P(C3(.26, .3, 4.4), '#c0392b', [s * (hs + 1.8), 2.2, 0]), roofCone(2.2, .9, 1.6, '#2f7a4a', 4.8, 0), P(B3(.6, .5, .6), '#7a6a5a', [s * hs, .25, 0])].map((p, k) => k === 2 ? P(new THREE.ConeGeometry(1, 1, 4), '#2f7a4a', [s * (hs + 1.8), 4.8, 0], [0, Math.PI / 4, 0], [1.4, .8, 1.1]) : p)),
    P(B3(2 * hs + 4.4, .5, .6), '#c0392b', [0, 5.6, 0]), P(B3(2 * hs + 1.4, .35, .5), '#e8b830', [0, 4.6, 0]),
    roofCone(2 * hs + 4, 1.4, 2.4, '#2f7a4a', 6.6), ...[-1, 1].map(s => P(new THREE.ConeGeometry(.3, 1, 6), '#2f7a4a', [s * (hs + 2.6), 6.4, 0], [0, 0, s * -1]))
  ], sign: { y: 5.1, w: 3.6, h: .8, bg: '#e8b830', fg: '#a8202a' }, posts: hs }),
  // India Village: a sandstone arch with little domed pavilions (chhatris)
  mughal: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(1.8, 6.4, 2), '#d9a066', [s * (hs + .9), 3.2, 0]), P(C3(.5, .5, 1, 8), '#e8c08a', [s * (hs + .9), 7.6, 0]), P(new THREE.SphereGeometry(.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#f4e8d0', [s * (hs + .9), 8.1, 0])]),
    halfRing(hs, .55, '#d9a066', 4.2), P(B3(2 * hs + 3.6, 1.4, 2), '#d9a066', [0, 6.9, 0]),
    P(new THREE.SphereGeometry(1.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#f4e8d0', [0, 7.6, 0]), P(new THREE.ConeGeometry(.12, .7, 6), '#c9a24a', [0, 8.9, 0])
  ], sign: { y: 6.9, w: 6, h: 1, bg: '#ff9f43', fg: '#ffffff' }, posts: hs + .9, postR: 1.2 }),
  // Sunny Farm: a wooden farm gate with sunflowers
  farm: hs => ({ parts: [
    ...[-1, 1].flatMap(s => [P(B3(.5, 4.4, .5), '#8a5a3b', [s * hs, 2.2, 0]), P(C3(.04, .04, 1.2, 5), '#4f9a4a', [s * (hs + .7), .6, .3]), P(new THREE.SphereGeometry(.3, 10, 8), '#ffd23f', [s * (hs + .7), 1.3, .3], [0, 0, 0], [1, 1, .4])]),
    P(B3(2 * hs + 1.2, .5, .5), '#8a5a3b', [0, 4.4, 0]), P(B3(2 * hs + 1.6, .2, .7), '#6a4a2a', [0, 4.75, 0])
  ], sign: { y: 3.6, w: 5, h: 1, bg: '#f6ead0', fg: '#7a4a2a' }, posts: hs }),
  // Two Homes Street: a Bà Rịa brick post and an Aussie timber post, one each side
  twohomes: hs => ({ parts: [
    P(B3(1.1, 5.6, 1.1), '#c0553a', [-hs, 2.8, 0]), P(new THREE.ConeGeometry(.8, .9, 4), '#f2c230', [-hs, 6.05, 0], [0, Math.PI / 4, 0]),
    P(B3(.8, 5.6, .8), '#f4f1e8', [hs, 2.8, 0]), P(B3(1.1, .25, 1.1), '#2f7a4a', [hs, 5.7, 0]),
    P(B3(hs, .45, .8), '#c0553a', [-hs / 2, 5.3, 0]), P(B3(hs, .45, .8), '#f4f1e8', [hs / 2, 5.3, 0])
  ], sign: { y: 4.5, w: 6.2, h: 1, bg: '#ffffff', fg: '#4a2a78' }, posts: hs })
};
export const GATE_STYLE = { hanoi: 'ohquan', bacninh: 'kinhbac', danang: 'golden', saigon: 'saigon', sydney: 'coathanger', melbourne: 'iron', brisbane: 'queenslander', aussie: 'timber', china: 'paifang', india: 'mughal', home: 'farm', town: 'twohomes' };
export function localGate(scene, world, x, z, rot, text, style, span = 7.5) {
  const make = STYLES[style]; if (!make) return goldenGate(scene, world, x, z, rot, text, span);
  const hs = span / 2, g = make(hs);
  const m = new THREE.Mesh(merge(g.parts), toonVC()); m.position.set(x, heightAt(x, z) - .1, z); m.rotation.y = rot; m.castShadow = true; m.userData.noCam = true; scene.add(m); outline(m, .022, '#4a3a2a');
  const sg = gateSign(text, g.sign.w, g.sign.h, g.sign.bg, g.sign.fg); sg.position.set(0, g.sign.y, 0); m.add(sg);
  for (const s of [-1, 1]) world.colliders.push({ x: x + Math.cos(rot) * s * g.posts, z: z - Math.sin(rot) * s * g.posts, r: g.postR || .8 });
  return m;
}

export function createRoads(G) {
  const { scene, world } = G;
  const mats = { asphalt: new THREE.MeshToonMaterial({ map: roadTexture('asphalt'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), dirt: new THREE.MeshToonMaterial({ map: roadTexture('dirt'), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }) };
  // the Dragon Bridge's deck first, so the road is laid on it rather than down in the river
  { const B = DRAGON; world.platforms.push({ x0: B.x0 - 2, x1: B.x1 + 2, z0: B.z - B.w / 2, z1: B.z + B.w / 2, y: B.h + .1 }); }
  buildRoads(G, mats);
  // ---------- Đà Nẵng's Dragon Bridge (Cầu Rồng): a golden dragon arching along the road ----------
  {
    const B = DRAGON, len = B.x1 - B.x0, y = B.h, hw = B.w / 2, gold = '#f2c230';
    const parts = [P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .08, B.w - 1.6), '#6f747a', [0, .03, 0])];
    for (const s of [-1, 1]) parts.push(P(new THREE.BoxGeometry(len + 2, .8, .12), '#e8e4d8', [0, .4, s * hw]));
    for (const px of [-.25, .25]) parts.push(P(new THREE.CylinderGeometry(.6, .8, 10, 8), '#9a948a', [px * len, -5, 0]));
    // the dragon: one long golden body arching over the road in waves (as on the real Cầu Rồng), thick at the neck
    // and thin at the tail, with scale bands, a row of orange spines, legs with claws where it touches the deck, a
    // proper head (snout, open jaw, horns, whiskers, flame mane) and a finned tail
    const hx = len / 2 + .2, gold2 = '#d9a21e', orange = '#e8761a';
    const bodyY = t => 1.2 + Math.pow(Math.abs(Math.sin(t * Math.PI * 2.5)), .8) * 4.4;
    const pts3 = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts3.push(new THREE.Vector3(-hx + t * (2 * hx), bodyY(t), Math.sin(t * Math.PI * 5) * .25)); }
    const curve = new THREE.CatmullRomCurve3(pts3), SEG = 220, RAD = 12, frames = curve.computeFrenetFrames(SEG, false);
    { // the body as one swept tube whose radius follows the dragon (thin tail → thick neck)
      const pos = [], idx = [], rOf = t => .22 + .55 * Math.min(1, t / .35) + .1 * Math.sin(t * 60);
      for (let i = 0; i <= SEG; i++) { const t = i / SEG, c = curve.getPointAt(t), N = frames.normals[i], Bn = frames.binormals[i], r = rOf(t);
        for (let j = 0; j < RAD; j++) { const a = j / RAD * Math.PI * 2; pos.push(c.x + r * (Math.cos(a) * N.x + Math.sin(a) * Bn.x), c.y + r * (Math.cos(a) * N.y + Math.sin(a) * Bn.y), c.z + r * (Math.cos(a) * N.z + Math.sin(a) * Bn.z)); } }
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * RAD + j, b2 = i * RAD + (j + 1) % RAD, c2 = a + RAD, d2 = b2 + RAD; idx.push(a, c2, b2, b2, c2, d2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      parts.push(P(g, gold));
      for (let i = 6; i < SEG - 2; i += 7) { const t = i / SEG, c = curve.getPointAt(t), tg = curve.getTangentAt(t), r = rOf(t);
        const ring = new THREE.TorusGeometry(r * 1.02, .05, 4, 12); ring.lookAt(tg); parts.push(P(ring, gold2, [c.x, c.y, c.z]));
        // a spine on top every other band
        if (i % 14 === 6) parts.push(P(new THREE.ConeGeometry(.16 + r * .25, .5 + r * .6, 5), orange, [c.x, c.y + r * .95 + .2, c.z], [0, 0, -Math.atan2(tg.y, tg.x) * .6])); }
    }
    // legs with claws where the body comes down to the deck
    for (const t of [.2, .4, .6, .8]) { const c = curve.getPointAt(t); for (const s of [-1, 1]) { parts.push(P(new THREE.CylinderGeometry(.14, .2, c.y, 6), gold2, [c.x, c.y / 2, s * .55]));
      for (const k of [-1, 0, 1]) parts.push(P(new THREE.ConeGeometry(.07, .35, 4), '#f6e7b8', [c.x + .2 + k * .05, .1, s * .55 + k * .14], [0, 0, -Math.PI / 2])); } }
    { // the head, at the east end looking out to sea
      const H = curve.getPointAt(1), x0 = H.x, y0 = H.y;
      parts.push(P(new THREE.SphereGeometry(.85, 14, 10), gold, [x0 + .5, y0 + .1, 0], [0, 0, 0], [1.3, .85, .9]));               // skull
      parts.push(P(new THREE.BoxGeometry(1.5, .45, .8), gold, [x0 + 1.6, y0 + .05, 0], [0, 0, -.12]));                            // snout
      parts.push(P(new THREE.BoxGeometry(1.3, .22, .7), gold2, [x0 + 1.5, y0 - .45, 0], [0, 0, .35]));                            // open jaw
      parts.push(P(new THREE.BoxGeometry(.9, .08, .5), '#c0392b', [x0 + 1.45, y0 - .2, 0], [0, 0, .12]));                         // tongue
      for (const s of [-1, 1]) {
        parts.push(P(new THREE.SphereGeometry(.2, 8, 6), '#ffffff', [x0 + .95, y0 + .45, s * .38]), P(new THREE.SphereGeometry(.11, 8, 6), '#2b2238', [x0 + 1.07, y0 + .48, s * .44])); // eyes
        parts.push(P(new THREE.ConeGeometry(.12, 1.5, 6), '#f6e7b8', [x0 - .2, y0 + 1.05, s * .35], [0, 0, .9]));                 // horns swept back
        parts.push(P(new THREE.CylinderGeometry(.03, .015, 1.6, 4), orange, [x0 + 2.3, y0 - .25, s * .45], [s * .5, 0, 1.2]));    // whiskers
        parts.push(P(new THREE.SphereGeometry(.07, 6, 4), '#2b2238', [x0 + 2.33, y0 + .2, s * .16]));                             // nostrils
        for (let k = 0; k < 5; k++) parts.push(P(new THREE.ConeGeometry(.14, .9, 5), k % 2 ? orange : '#ffb020', [x0 - .4 - k * .12, y0 + .2 + Math.sin(k) * .3, s * (.55 + k * .05)], [s * -1.1, 0, 1.6 + k * .12])); // flame mane
      }
      for (let k = 0; k < 4; k++) parts.push(P(new THREE.ConeGeometry(.06, .22, 4), '#ffffff', [x0 + 1.2 + k * .2, y0 - .2, (k % 2 ? 1 : -1) * .26], [Math.PI, 0, 0])); // teeth
    }
    { const T0 = curve.getPointAt(0); parts.push(P(new THREE.ConeGeometry(.6, 1.4, 3), orange, [T0.x - .6, T0.y + .2, 0], [0, 0, Math.PI / 2], [1, 1, .3])); } // tail fin
    const br = new THREE.Mesh(merge(parts), toonVC()); br.position.set((B.x0 + B.x1) / 2, y, B.z); br.castShadow = true; scene.add(br); outline(br, .02, '#6a4a10');
    // fire, then water, from the dragon's mouth: every 40 s (as the real bridge does on weekend nights), or when tapped
    const mouth = new THREE.Vector3(br.position.x + curve.getPointAt(1).x + 2.4, y + curve.getPointAt(1).y - .2, B.z), NP = 70;
    const spray = new THREE.InstancedMesh(new THREE.SphereGeometry(.35, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: .85, depthWrite: false }), NP);
    spray.frustumCulled = false; spray.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3); scene.add(spray);
    const pp = Array.from({ length: NP }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, fire: true })), m4 = new THREE.Matrix4(), col = new THREE.Color();
    let showT = -1, emitAcc = 0, idle = 25;
    const start = (at = 0) => { if (showT < 0) showT = at; };
    G.dragonShow = start;
    world.updaters.push((dt, t) => {
      if (showT < 0) { idle -= dt; if (idle <= 0) { idle = 40; start(); } }
      const near = G.heroes.some(h => Math.hypot(h.pos.x - mouth.x, h.pos.z - mouth.z) < 90);
      if (showT >= 0) {
        showT += dt; const fire = showT < 6, water = showT > 7.5 && showT < 13.5;
        if ((fire || water) && near) { emitAcc += dt * (fire ? 34 : 40);
          while (emitAcc > 1) { emitAcc--; const q = pp.find(o => o.life <= 0); if (!q) break; q.life = fire ? 1.1 : 1.6; q.fire = fire; q.x = mouth.x; q.y = mouth.y; q.z = mouth.z;
            q.vx = (fire ? 11 : 13) + Math.random() * 3; q.vy = fire ? 1 + Math.random() * 1.5 : 5 + Math.random() * 2; q.vz = (Math.random() - .5) * (fire ? 2.5 : 3.5); } }
        if (showT > 0 && showT < dt * 1.5 && near) { SFX.whoosh(); }
        if (showT > 7.5 && showT < 7.5 + dt * 1.5 && near) { SFX.splash(); }
        if (showT > 16) showT = -1;
      }
      let any = false;
      pp.forEach((q, i) => {
        if (q.life > 0) { any = true; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy += (q.fire ? 2 : -9.8) * dt; q.vx *= q.fire ? .97 : .995;
          const k = Math.max(0, q.life / (q.fire ? 1.1 : 1.6)), sc = q.fire ? .6 + (1 - k) * 2.2 : .45 + (1 - k) * .9;
          m4.makeScale(sc, sc, sc).setPosition(q.x, q.y, q.z); col.set(q.fire ? (k > .6 ? '#fff2a0' : k > .3 ? '#ffa020' : '#e0401a') : (k > .5 ? '#e8f8ff' : '#7fd0ff')); }
        else m4.makeScale(0, 0, 0);
        spray.setMatrixAt(i, m4); spray.setColorAt(i, col);
      });
      spray.visible = any; if (any) { spray.instanceMatrix.needsUpdate = true; spray.instanceColor.needsUpdate = true; }
    });
    G.interactables.push({ id: 'dragonshow', x: B.x1 + 3, z: B.z + hw + 2.5, r: 3, icon: '🐉', label: () => T('Ask the dragon to breathe fire and water', 'Nhờ rồng phun lửa và nước'), act: () => { start(0); SFX.tap(); } });
    world.boxes.push({ x0: B.x0, x1: B.x1, z0: B.z + hw - .1, z1: B.z + hw + .3 }, { x0: B.x0, x1: B.x1, z0: B.z - hw - .3, z1: B.z - hw + .1 });
    G.dragonBridge = br;
  }

  // ---------- golden welcome gates: one across each road where it enters a village or city ----------
  // (the gate stands on the road's end point and faces along the road, so you always drive through it)
  for (const R of ROADS) (R.gates || []).forEach((id, k) => {
    if (!id) return;
    const n = R.pts.length, [x, z] = R.pts[k ? n - 1 : 0], [px, pz] = R.pts[k ? n - 2 : 1];
    localGate(scene, world, x, z, Math.atan2(x - px, z - pz), () => T('Welcome to ', 'Chào mừng đến ') + REGION_NAMES[id](), GATE_STYLE[id] || 'golden', 7.5);
  });
  G.goldenGate = (x, z, r, t, span) => goldenGate(scene, world, x, z, r, t, span);
}

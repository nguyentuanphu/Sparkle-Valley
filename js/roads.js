// Roads between the villages and cities: an asphalt main road with a dashed white centre line, dirt
// roads to the quieter places, Đà Nẵng's golden Dragon Bridge where the road crosses the river, and a
// golden welcome gate (cổng chào) at the entrance of every village and city.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { T, onLang } from './i18n.js';
import { heightAt, ROADS, DRAGON, REGION_NAMES } from './world.js';

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

// The road surface sits just above the highest ground nearby, so the bumpy terrain (one point every 2–2.7 m)
// never pokes through it. On a bridge the deck is the ground (tower tops are not).
const roadY = (world, x, z) => {
  let y = Math.max(heightAt(x, z), heightAt(x + 1.4, z), heightAt(x - 1.4, z), heightAt(x, z + 1.4), heightAt(x, z - 1.4));
  for (const p of world.platforms) if (!p.tower && x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) y = Math.max(y, p.y);
  return y + .08;
};

// a ribbon that follows the ground (and the bridge deck), split into short pieces so it hugs the hills;
// three points across (both edges and the middle) so it also follows the slope sideways
function ribbon(R, world) {
  const pts = []; // dense points along the road
  for (let i = 0; i < R.pts.length - 1; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2));
    for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
  }
  pts.push(R.pts[R.pts.length - 1]);
  const pos = [], uv = [], idx = [], hw = R.w / 2; let along = 0;
  pts.forEach(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = nx - px, dz = nz - pz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) along += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const s of [-1, 0, 1]) {
      const vx = x - dz * hw * s, vz = z + dx * hw * s;
      pos.push(vx, roadY(world, vx, vz), vz); uv.push((s + 1) / 2, along / (R.kind === 'asphalt' ? 9 : 7));
    }
    // counter-clockwise seen from above, so the road faces up
    if (i) { const a = (i - 1) * 3; for (const c of [0, 1]) idx.push(a + c, a + c + 1, a + c + 3, a + c + 1, a + c + 4, a + c + 3); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
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

export function createRoads(G) {
  const { scene, world } = G;
  const mats = { asphalt: new THREE.MeshToonMaterial({ map: roadTexture('asphalt'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), dirt: new THREE.MeshToonMaterial({ map: roadTexture('dirt'), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }) };
  // the Dragon Bridge's deck first, so the road is laid on it rather than down in the river
  { const B = DRAGON; world.platforms.push({ x0: B.x0 - 2, x1: B.x1 + 2, z0: B.z - B.w / 2, z1: B.z + B.w / 2, y: B.h + .1 }); }
  for (const R of ROADS) { const m = new THREE.Mesh(ribbon(R, world), mats[R.kind]); m.receiveShadow = true; scene.add(m); }
  // where an asphalt road joins another, a plain round patch covers the crossing lines
  {
    const patch = new THREE.MeshToonMaterial({ map: roadTexture('plain'), polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), done = [];
    for (const R of ROADS) if (R.kind === 'asphalt') for (const k of [0, R.pts.length - 1]) {
      const [x, z] = R.pts[k];
      if ((R.gates || [])[k ? 1 : 0] || done.some(([a, b]) => Math.hypot(a - x, b - z) < 2)) continue;
      if (!ROADS.some(o => o !== R && o.kind === 'asphalt' && o.pts.some(([a, b]) => Math.hypot(a - x, b - z) < 1))) continue;
      done.push([x, z]);
      const g = new THREE.RingGeometry(.01, R.w / 2 + 1.1, 24, 5); g.rotateX(-Math.PI / 2);
      const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, roadY(world, x + pa.getX(i), z + pa.getZ(i)) + .02);
      g.computeVertexNormals(); const m = new THREE.Mesh(g, patch); m.position.set(x, 0, z); m.receiveShadow = true; scene.add(m);
    }
  }

  // ---------- Đà Nẵng's Dragon Bridge (Cầu Rồng): a golden dragon arching along the road ----------
  {
    const B = DRAGON, len = B.x1 - B.x0, y = B.h, hw = B.w / 2, gold = '#f2c230';
    const parts = [P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .08, B.w - 1.6), '#6f747a', [0, .03, 0])];
    for (const s of [-1, 1]) parts.push(P(new THREE.BoxGeometry(len + 2, .8, .12), '#e8e4d8', [0, .4, s * hw]));
    for (const px of [-.25, .25]) parts.push(P(new THREE.CylinderGeometry(.6, .8, 10, 8), '#9a948a', [px * len, -5, 0]));
    // the dragon's body: humps of golden rings down the middle of the bridge
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = -len / 2 + t * len, hump = Math.abs(Math.sin(t * Math.PI * 2.5)) * 4.2 + 1.2;
      parts.push(P(new THREE.SphereGeometry(.55, 10, 8), gold, [x, hump, 0]));
      if (i % 2 === 0) parts.push(P(new THREE.ConeGeometry(.22, .7, 6), '#e0861a', [x, hump + .6, 0]));
    }
    // head at the east end (facing the sea, as in Đà Nẵng) and a curly tail at the west end
    const hx = len / 2 + .2;
    parts.push(P(new THREE.SphereGeometry(1.1, 14, 10), gold, [hx, 3.2, 0], [0, 0, 0], [1.4, .9, .9]), P(new THREE.ConeGeometry(.5, 1.6, 8), '#e0861a', [hx + 1.6, 3.2, 0], [0, 0, -Math.PI / 2]));
    for (const s of [-1, 1]) parts.push(P(new THREE.SphereGeometry(.22, 8, 6), '#2b2238', [hx + .7, 3.6, s * .55]), P(new THREE.ConeGeometry(.15, 1.2, 6), '#e0861a', [hx - .3, 4.3, s * .4], [0, 0, .5]));
    parts.push(P(new THREE.TorusGeometry(1.1, .4, 8, 16, Math.PI * 1.5), gold, [-hx - .4, 1.6, 0]));
    const br = new THREE.Mesh(merge(parts), toonVC()); br.position.set((B.x0 + B.x1) / 2, y, B.z); br.castShadow = true; scene.add(br); outline(br, .02, '#6a4a10');
    // the dragon breathes a little puff of fire now and then (just for fun)
    const puff = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff9a2a', transparent: true, opacity: .8 }));
    scene.add(puff); puff.visible = false;
    world.updaters.push((dt, t) => { const k = (t % 9) / 9; puff.visible = k < .12; if (puff.visible) { const s = .5 + k * 18; puff.scale.setScalar(s); puff.material.opacity = .9 - k * 6; puff.position.set(br.position.x + hx + 2.4 + k * 14, y + 3.2, B.z); } });
    world.boxes.push({ x0: B.x0, x1: B.x1, z0: B.z + hw - .1, z1: B.z + hw + .3 }, { x0: B.x0, x1: B.x1, z0: B.z - hw - .3, z1: B.z - hw + .1 });
    G.dragonBridge = br;
  }

  // ---------- golden welcome gates: one across each road where it enters a village or city ----------
  // (the gate stands on the road's end point and faces along the road, so you always drive through it)
  for (const R of ROADS) (R.gates || []).forEach((id, k) => {
    if (!id) return;
    const n = R.pts.length, [x, z] = R.pts[k ? n - 1 : 0], [px, pz] = R.pts[k ? n - 2 : 1];
    goldenGate(scene, world, x, z, Math.atan2(x - px, z - pz), () => T('Welcome to ', 'Chào mừng đến ') + REGION_NAMES[id](), 7.5);
  });
  G.goldenGate = (x, z, r, t, span) => goldenGate(scene, world, x, z, r, t, span);
}

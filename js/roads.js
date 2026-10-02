// Roads between the villages and cities: an asphalt main road with a dashed white centre line, dirt
// roads to the quieter places, Đà Nẵng's golden Dragon Bridge where the road crosses the river, and a
// golden welcome gate (cổng chào) at the entrance of every village and city.
import { THREE, toonVC, P, merge, outline } from './gfx.js';
import { T, onLang } from './i18n.js';
import { heightAt, ROADS, DRAGON, HOME } from './world.js';

// a long strip texture: asphalt with a dashed centre line, or packed dirt with wheel tracks
function roadTexture(kind) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  if (kind === 'asphalt') {
    g.fillStyle = '#6f747a'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2); }
    g.fillStyle = '#e9e4d4'; g.fillRect(2, 0, 3, 256); g.fillRect(59, 0, 3, 256);
    g.fillStyle = '#f6f1e4'; g.fillRect(30, 20, 4, 90); g.fillRect(30, 148, 4, 90);
  } else {
    g.fillStyle = '#c99d66'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,240,210,.12)' : 'rgba(90,60,30,.12)'; g.fillRect(Math.random() * 64, Math.random() * 256, 2 + Math.random() * 2, 2); }
    g.fillStyle = 'rgba(120,85,50,.22)'; g.fillRect(14, 0, 7, 256); g.fillRect(43, 0, 7, 256);
    g.fillStyle = 'rgba(110,160,80,.5)'; g.fillRect(29, 0, 6, 256); // a little grass down the middle
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// a ribbon that follows the ground (and the bridge deck), split into short pieces so it hugs the hills
function ribbon(R, groundAt) {
  const pts = []; // dense points along the road
  for (let i = 0; i < R.pts.length - 1; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5));
    for (let k = 0; k < n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
  }
  pts.push(R.pts[R.pts.length - 1]);
  const pos = [], uv = [], idx = [], hw = R.w / 2; let along = 0;
  pts.forEach(([x, z], i) => {
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = nx - px, dz = nz - pz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) along += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const s of [-1, 1]) {
      const vx = x - dz * hw * s, vz = z + dx * hw * s;
      pos.push(vx, groundAt(vx, vz, 99) + .07, vz); uv.push(s < 0 ? 0 : 1, along / (R.kind === 'asphalt' ? 9 : 7));
    }
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

// the welcome sign on a gate: big words that follow the language
function gateSign(text, w, h, bg = '#c62828', fg = '#ffe27a') {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w); const g = c.getContext('2d');
  const draw = () => {
    const s = Array.isArray(text) ? T(text[0], text[1]) : text;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(10, 10, c.width - 20, c.height - 20);
    let size = c.height * .5; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`;
    while (g.measureText(s).width > c.width - 60 && size > 12) { size -= 2; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, c.width / 2, c.height / 2 + 3);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (Array.isArray(text)) onLang(() => { draw(); t.needsUpdate = true; });
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
  const mats = { asphalt: new THREE.MeshToonMaterial({ map: roadTexture('asphalt'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), dirt: new THREE.MeshToonMaterial({ map: roadTexture('dirt'), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }) };
  for (const R of ROADS) { const m = new THREE.Mesh(ribbon(R, world.groundAt), mats[R.kind]); m.receiveShadow = true; scene.add(m); }

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
    world.platforms.push({ x0: B.x0 - 2, x1: B.x1 + 2, z0: B.z - hw, z1: B.z + hw, y: y + .1 });
    G.dragonBridge = br;
  }

  // ---------- golden welcome gates at the villages ----------
  const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  const gates = [
    [76, 30, Math.PI / 2, ['Welcome to Lotus Village', 'Chào mừng đến Làng Sen']],
    [96, 83, Math.PI / 2, ['Welcome to the Three Regions Market', 'Chào mừng đến Chợ Ba Miền']],
    [-90, -12, Math.PI / 2, ['Welcome to Aussie Corner', 'Chào mừng đến Góc Nước Úc']],
    [100, -62, 0, ['Welcome to China Town', 'Chào mừng đến Làng Trung Hoa']],
    [-112, -58, 0, ['Welcome to India Village', 'Chào mừng đến Làng Ấn Độ']],
    [-20, 98, face(-20, 98, HOME.x, HOME.z), ['Welcome to Sunny Farm', 'Chào mừng đến Nông Trại']],
    [6, 47, Math.PI / 2, ['Welcome to Sparkle Valley', 'Chào mừng đến Thung Lũng Lấp Lánh']]
  ];
  gates.forEach(([x, z, r, t]) => goldenGate(scene, world, x, z, r, t, 7.5));
  G.goldenGate = (x, z, r, t, span) => goldenGate(scene, world, x, z, r, t, span);
}

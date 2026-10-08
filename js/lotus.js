// Lotus Village, Phase 2 of the owner's design rules (round 30): "cây đa, giếng nước, sân đình" and village life.
//  · the village well (giếng nước): a round stone well with a small tiled roof; tap it and the bucket goes down
//  · the old banyan tree gets hanging roots, and a little shrine (miếu) at its foot, where we walk quietly
//  · the pond path (a footpath, world.js ROADS) ends at a bench; a small wooden pier, and a round basket boat
//    (thuyền thúng) bobbing on the lotus pond
//  · hens pecking in the yards and a dog by the houses (the village cat is the secret one in js/secrets.js):
//    happy faces, never on a path, a sound and their name when tapped
//  · a bicycle with a flower basket and a fruit basket riding the pond path, and a buffalo cart with hay on the
//    village lane: walking pace or slower, and they wait whenever a child is within 4 m in front of them
// Places are given relative to the middle of the village and were chosen where the ground is free (≥ 3 m from
// anything solid, ≥ 2.5 m from anything tappable), so nothing is pushed out of the way.
import { THREE, P, merge, toonVC, outline } from './gfx.js';
import { T } from './i18n.js';
import { SFX } from './audio.js';
import { heightAt, roadDist, VILLAGE, ROADS } from './world.js';
import { buildAvatar } from './avatar.js';
import { animalModel } from './animals.js';

const V = VILLAGE, at = (dx, dz) => [V.x + dx, V.z + dz];
const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e0aa80') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });

export function createLotus(G, { say, toast }) {
  const { scene, world } = G, mat = toonVC();
  const put = (parts, x, z, rot = 0, dy = 0, edge = true) => { const m = new THREE.Mesh(merge(parts), mat); m.position.set(x, heightAt(x, z) + dy, z); m.rotation.y = rot; m.castShadow = true; scene.add(m); if (edge) outline(m, .02, '#3a2a20'); return m; };
  const thing = (id, x, z, r, icon, label, act) => G.interactables.push({ id, x, z, r, icon, label, act });
  const lines = {};
  const talk = (h, key) => { const [en, vi] = lines[key]; say(en, vi); if (h && toast) toast(h, T(en, vi)); };

  // ---------- the village well ----------
  {
    const [x, z] = at(-14, -6), stone = '#b8b0a2', dark = '#8f877a', wood = '#7a5236', tile = '#b9533c';
    const parts = [P(new THREE.CylinderGeometry(1, 1.1, .85, 16, 1, true), stone, [0, .42, 0]), P(new THREE.TorusGeometry(1, .14, 6, 18), dark, [0, .86, 0], [Math.PI / 2, 0, 0]),
      P(new THREE.CircleGeometry(.95, 16), '#2e6f8e', [0, .55, 0], [-Math.PI / 2, 0, 0])];
    for (let k = 0; k < 8; k++) parts.push(P(new THREE.BoxGeometry(.5, .16, .12), k % 2 ? dark : '#c9c1b2', [Math.cos(k * .785) * 1.06, .25 + (k % 2) * .3, Math.sin(k * .785) * 1.06], [0, -k * .785, 0]));
    for (const s of [-1, 1]) parts.push(P(new THREE.CylinderGeometry(.08, .1, 2.2, 6), wood, [s * 1.05, 1.1, 0]));
    parts.push(P(new THREE.CylinderGeometry(.06, .06, 2.3, 6), wood, [0, 1.75, 0], [0, 0, Math.PI / 2]));
    for (const s of [-1, 1]) parts.push(P(new THREE.BoxGeometry(2.8, .1, 1.05), tile, [0, 2.45, s * .45], [s * .5, 0, 0]));
    parts.push(P(new THREE.BoxGeometry(2.9, .14, .16), '#8e3a2a', [0, 2.68, 0]), P(new THREE.BoxGeometry(.6, .5, .5), '#7a5a3a', [1.45, .25, .55]));
    put(parts, x, z, .3);
    // the bucket on its rope, which goes down when the well is tapped
    const bucket = new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.2, .15, .3, 10), '#8a5a3b', [0, -.15, 0]), P(new THREE.CylinderGeometry(.01, .01, 1, 4), '#d9c9a0', [0, .35, 0])]), mat);
    const y0 = heightAt(x, z) + 1.3; bucket.position.set(x, y0, z); scene.add(bucket);
    world.colliders.push({ x, z, r: 1.3 });
    let dip = 0; world.updaters.push(dt => { if (dip > 0) { dip = Math.max(0, dip - dt); bucket.position.y = y0 - Math.sin((1 - dip / 2.4) * Math.PI) * 1.1; } });
    lines.well = ['The village well! Long ago everyone came here for water, and to chat with their neighbours.', 'Giếng nước của làng đó! Ngày xưa ai cũng ra đây lấy nước và trò chuyện với hàng xóm.'];
    thing('lv_well', x + 1.6, z + .6, 2.6, '🪣', () => T('The village well', 'Giếng nước của làng'), h => { dip = 2.4; setTimeout(() => SFX.splash(), 900); talk(h, 'well'); });
  }

  // ---------- the banyan's hanging roots and the little shrine at its foot ----------
  {
    const [bx, bz] = at(6, 6), roots = [];
    for (let i = 0; i < 14; i++) { const a = i * 2.39, r = 2.2 + (i % 4) * .7, len = 3.2 + (i % 3) * .9; roots.push(P(new THREE.CylinderGeometry(.035, .05, len, 4), '#8a6a4a', [Math.cos(a) * r, 7 - len / 2, Math.sin(a) * r])); }
    put(roots, bx, bz, 0, 0, false);
    const [x, z] = at(3.9, 3.9), red = '#b8322a', cream = '#efe0bf', tile = '#a0442f';
    const parts = [P(new THREE.BoxGeometry(1.1, .45, 1), '#a9a294', [0, .22, 0]), P(new THREE.BoxGeometry(.8, .75, .7), cream, [0, .82, 0]), P(new THREE.BoxGeometry(.5, .45, .05), red, [-.36, .82, 0], [0, Math.PI / 2, 0]),
      P(new THREE.ConeGeometry(.78, .5, 4), tile, [0, 1.45, 0], [0, Math.PI / 4, 0]), P(new THREE.SphereGeometry(.07, 6, 5), '#ffd23f', [0, 1.75, 0]),
      P(new THREE.CylinderGeometry(.13, .1, .12, 10), '#c9a24a', [-.62, .5, 0]), ...[-.06, 0, .06].map(o => P(new THREE.CylinderGeometry(.012, .012, .3, 3), '#c0392b', [-.62, .7, o])),
      P(new THREE.SphereGeometry(.09, 8, 6), '#ff9a2e', [-.62, .5, .26]), P(new THREE.SphereGeometry(.09, 8, 6), '#ffd23f', [-.62, .5, -.26])];
    put(parts, x, z, 0); // (it faces west, to the square path)
    world.colliders.push({ x, z, r: .75 });
    lines.shrine = ['Under the old banyan tree there is a little shrine. Here we walk quietly and say thank you.', 'Dưới gốc đa già có một miếu nhỏ. Ở đây mình đi nhẹ nói khẽ và nói lời cảm ơn.'];
    thing('lv_shrine', x - .7, z + 1.3, 2.4, '🌳', () => T('The little shrine under the banyan', 'Miếu nhỏ dưới gốc đa'), h => { SFX.chime(); talk(h, 'shrine'); });
  }

  // ---------- the pond: a bench where the path ends, a little pier and a round basket boat ----------
  const pond = at(-10, 4), deg = a => a * Math.PI / 180;
  {
    // the bench, just past the path's end, looking at the lotus
    const ea = deg(80), ex = pond[0] + 8 * Math.cos(ea), ez = pond[1] + 8 * Math.sin(ea), tx = -Math.sin(ea), tz = Math.cos(ea), x = ex + tx * 1.4, z = ez + tz * 1.4;
    const wood = '#9a6a3e', legs = '#6b4a2e';
    put([P(new THREE.BoxGeometry(1.8, .1, .5), wood, [0, .48, 0]), P(new THREE.BoxGeometry(1.8, .4, .08), wood, [0, .8, -.24], [-.15, 0, 0]),
      ...[-.75, .75].flatMap(s => [P(new THREE.BoxGeometry(.1, .48, .44), legs, [s, .24, 0])])], x, z, Math.atan2(pond[0] - x, pond[1] - z));
    world.colliders.push({ x, z, r: .8 });
    lines.bench = ['Let us sit for a little while and watch the lotus flowers open.', 'Mình ngồi đây một chút ngắm hoa sen nở nhé.'];
    thing('lv_bench', x, z, 2, '🪷', () => T('Sit and watch the lotus', 'Ngồi ngắm hoa sen'), h => { G.fx && G.fx(pond[0], heightAt(pond[0], pond[1]) + 1.2, pond[1], '🪷'); talk(h, 'bench'); });
  }
  {
    // a small wooden pier from the path out over the water (to look at; nobody walks on the water)
    const a = deg(20), ux = Math.cos(a), uz = Math.sin(a), mid = 5.6, x = pond[0] + ux * mid, z = pond[1] + uz * mid, y = heightAt(pond[0], pond[1]) + .3;
    const wood = '#a87a4a', post = '#6b4a2e', parts = [];
    for (let k = 0; k < 7; k++) parts.push(P(new THREE.BoxGeometry(.38, .07, 1.2), k % 2 ? wood : '#b88a5a', [-1.4 + k * .47, 0, 0]));
    for (const s of [-1, 1]) for (const px of [-1.5, 0, 1.5]) parts.push(P(new THREE.CylinderGeometry(.06, .06, .7, 6), post, [px, -.3, s * .55]));
    const m = new THREE.Mesh(merge(parts), mat); m.position.set(x, y, z); m.rotation.y = -a; m.castShadow = true; scene.add(m);
  }
  {
    // the round basket boat (thuyền thúng), tied near the pier, bobbing; tap it and it spins a little
    const a = deg(42), x = pond[0] + Math.cos(a) * 3, z = pond[1] + Math.sin(a) * 3, y = heightAt(pond[0], pond[1]) + .12;
    const weave = '#8a6a3a', tar = '#3a3a3a';
    const boat = new THREE.Mesh(merge([P(new THREE.SphereGeometry(.85, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), weave, [0, .5, 0]),
      P(new THREE.TorusGeometry(.85, .07, 6, 22), '#6b4a2e', [0, .5, 0], [Math.PI / 2, 0, 0]), P(new THREE.CylinderGeometry(.8, .5, .06, 18), tar, [0, .1, 0]),
      P(new THREE.BoxGeometry(1.4, .05, .18), '#b88a5a', [0, .5, 0]), P(new THREE.CylinderGeometry(.03, .03, 1.6, 5), '#b88a5a', [.5, .65, .3], [.4, 0, .9]), P(new THREE.BoxGeometry(.25, .04, .4), '#b88a5a', [1.2, .3, .7], [.4, 0, .9])]), mat);
    boat.position.set(x, y, z); boat.castShadow = true; scene.add(boat); outline(boat, .02, '#3a2a20');
    let spin = 0;
    world.updaters.push((dt, t) => { boat.position.y = y + Math.sin(t * 1.3) * .04; boat.rotation.x = Math.sin(t * 1.1) * .05; boat.rotation.z = Math.sin(t * .9 + 1) * .05; if (spin > 0) { spin = Math.max(0, spin - dt); boat.rotation.y += dt * 2.2 * spin; } });
    lines.boat = ['A thuyền thúng, a round basket boat! Fishermen in central Vietnam paddle them round and round.', 'Thuyền thúng đó! Ngư dân miền Trung chèo thuyền thúng xoay vòng vòng.'];
    boat.userData.react = h => { spin = 2; SFX.splash(); talk(h, 'boat'); };
  }

  // ---------- hens and a dog (they stay in their yards, never on a path) ----------
  const animals = [];
  const okSpot = (x, z) => { const rd = roadDist(x, z); if (rd.d < rd.road.w / 2 + 1) return false; const p = { x, z }; world.collide(p, .4); return Math.hypot(p.x - x, p.z - z) < .01; };
  const addAnimal = (kind, home, wander, speed, sound, key, line) => {
    const m = animalModel(kind), [hx, hz] = home; m.position.set(hx, heightAt(hx, hz), hz); scene.add(m);
    const a = { m, home, wander, speed, tx: hx, tz: hz, wait: Math.random() * 3 }; animals.push(a);
    lines[key] = line;
    m.userData.react = h => { sound(); a.wait = 2.5; G.fx && G.fx(m.position.x, m.position.y + 1, m.position.z, '💛'); talk(h, key); };
  };
  [[-13, -22], [-15, -21], [-12, -20.5], [-14.5, -23]].forEach((p, i) => addAnimal('chicken', at(...p), 2.6, .5, () => SFX.cluck(), 'hen', ['A hen! Cluck, cluck! She is looking for seeds.', 'Con gà mái! Cục ta cục tác! Nó đang tìm hạt thóc.']));
  addAnimal('puppy', at(22, 6), 3, .9, () => SFX.woof(), 'dog', ['The village dog! Woof woof! He is happy to see you.', 'Chú chó của làng! Gâu gâu! Nó vui khi gặp con.']);
  world.updaters.push((dt, t) => {
    if (!G.heroes.some(h => Math.abs(h.pos.x - V.x) < 70 && Math.abs(h.pos.z - V.z) < 70)) return; // nobody is near: they rest
    for (const a of animals) {
      const p = a.m.position;
      if (a.wait > 0) { a.wait -= dt; continue; }
      const dx = a.tx - p.x, dz = a.tz - p.z, d = Math.hypot(dx, dz);
      if (d < .2) { a.wait = 1.5 + Math.random() * 4; for (let k = 0; k < 6; k++) { const ang = Math.random() * 6.283, r = Math.random() * a.wander, x = a.home[0] + Math.cos(ang) * r, z = a.home[1] + Math.sin(ang) * r; if (okSpot(x, z)) { a.tx = x; a.tz = z; break; } } continue; }
      const s = Math.min(d, a.speed * dt), nx = p.x + dx / d * s, nz = p.z + dz / d * s;
      if (!okSpot(nx, nz)) { a.tx = p.x; a.tz = p.z; continue; }
      p.x = nx; p.z = nz; p.y = heightAt(nx, nz); a.m.rotation.y = Math.atan2(dx, dz);
    }
  });

  // ---------- a bicycle on the pond path and a buffalo cart on the village lane ----------
  // Each rides along its own path and back, at walking pace or slower, waits while a child is within 4 m in front,
  // and gives way to the other one.
  const movers = [];
  const route = R => { const pts = R.pts.map(p => p.slice()), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum[cum.length - 1] }; };
  const pointAt = (r, s) => { s = Math.max(0, Math.min(r.len, s)); let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const k = (s - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1), [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i]; return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)]; };
  const pondPath = ROADS.find(R => R.kind === 'footpath'), lane = ROADS.find(R => R.kind === 'dirt' && Math.abs(R.pts[0][1] - V.z) < 1 && R.pts[0][0] < V.x);
  // the bicycle: a frame, two wheels, a flower basket in front and a fruit basket behind, and its rider in a nón lá.
  // It faces +z. The wheels stand upright along the way it rides (a torus is made lying in the x-y plane, so it is
  // turned a quarter round y), each with a hub and spokes, and they turn as it rides. The frame tubes join the hubs,
  // the pedals, the seat and the handlebars, so nothing floats.
  const WR = .34, HUB_Y = WR + .02, FRONT = .56, REAR = -.56;
  const BB = [0, .4, 0], SEAT = [0, .86, -.24], HEAD = [0, .84, .4], HEAD_LO = [0, .7, .44];
  const rod = (a, b2, r, color) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b2), d = vb.clone().sub(va), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), e = new THREE.Euler().setFromQuaternion(q);
    return P(new THREE.CylinderGeometry(r, r, len, 6), color, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, (a[2] + b2[2]) / 2], [e.x, e.y, e.z]); };
  const wheel = () => new THREE.Mesh(merge([
    P(new THREE.TorusGeometry(WR, .035, 6, 22), '#2f3336', [0, 0, 0], [0, Math.PI / 2, 0]),                 // the tyre
    P(new THREE.TorusGeometry(WR - .035, .012, 4, 22), '#b8c0c4', [0, 0, 0], [0, Math.PI / 2, 0]),          // the rim
    P(new THREE.CylinderGeometry(.045, .045, .09, 8), '#9aa4a8', [0, 0, 0], [0, 0, Math.PI / 2]),          // the hub
    ...[0, 1, 2, 3, 4, 5].map(k => P(new THREE.CylinderGeometry(.007, .007, (WR - .04) * 2, 4), '#c8d0d4', [0, 0, 0], [k * Math.PI / 6, 0, 0]))   // the spokes
  ]), mat);
  const bike = new THREE.Group();
  const wheels = [FRONT, REAR].map(z => { const w = wheel(); w.position.set(0, HUB_Y, z); bike.add(w); return w; });
  const TEAL = '#2fa9a0', fH = [0, HUB_Y, FRONT], rH = [0, HUB_Y, REAR];
  bike.add(new THREE.Mesh(merge([
    rod(SEAT, HEAD, .028, TEAL), rod(HEAD_LO, BB, .03, TEAL), rod(BB, SEAT, .03, TEAL),                    // top, down and seat tubes
    ...[-1, 1].flatMap(sd => [rod([sd * .05, BB[1], BB[2]], [sd * .05, HUB_Y, REAR], .018, TEAL), rod([sd * .04, SEAT[1] - .04, SEAT[2]], [sd * .05, HUB_Y, REAR], .016, TEAL),   // chain and seat stays
      rod([sd * .045, HEAD_LO[1], HEAD_LO[2]], [sd * .05, HUB_Y, FRONT], .018, '#9aa4a8')]),                  // the fork
    rod(HEAD_LO, [0, .98, .43], .022, '#9aa4a8'), rod([-.28, 1.0, .46], [.28, 1.0, .46], .016, '#9aa4a8'), // stem and handlebars
    ...[-1, 1].map(sd => P(new THREE.CylinderGeometry(.025, .025, .09, 6), '#3a2a20', [sd * .3, 1.0, .46], [0, 0, Math.PI / 2])),  // grips
    rod([0, SEAT[1], SEAT[2]], [0, SEAT[1] + .06, SEAT[2]], .02, '#9aa4a8'), P(new THREE.BoxGeometry(.16, .05, .26), '#3a2a20', [0, SEAT[1] + .08, SEAT[2]]),   // the saddle
    rod([-.12, BB[1], 0], [.12, BB[1], 0], .02, '#555'), ...[-1, 1].map(sd => P(new THREE.BoxGeometry(.1, .025, .06), '#333', [sd * .14, BB[1] + sd * .12, sd * .03])),  // crank and pedals
    P(new THREE.CylinderGeometry(.11, .11, .015, 14), '#777', [.06, BB[1], 0], [0, 0, Math.PI / 2]),        // chain ring
    ...[-1, 1].map(sd => P(new THREE.BoxGeometry(.03, .03, .32), '#2fa9a0', [sd * .06, HUB_Y + WR + .06, FRONT], [.2, 0, 0])),  // front mudguard
    P(new THREE.BoxGeometry(.3, .03, .36), '#9aa4a8', [0, HUB_Y + WR + .1, REAR]), ...[-1, 1].map(sd => rod([sd * .13, HUB_Y + WR + .1, REAR], [sd * .05, HUB_Y, REAR], .012, '#9aa4a8')),   // rear rack
    P(new THREE.CylinderGeometry(.2, .16, .2, 10), '#c9a24a', [0, .92, .62]), rod([0, .9, .55], [0, .98, .45], .015, '#9aa4a8'),   // front basket on the bars
    ...['#ff7eb8', '#ffd23f', '#ffffff', '#ff6b5a'].map((c, k) => P(new THREE.SphereGeometry(.07, 6, 5), c, [Math.cos(k * 1.6) * .1, 1.06, .62 + Math.sin(k * 1.6) * .1])),
    P(new THREE.BoxGeometry(.4, .2, .3), '#a87a4a', [0, HUB_Y + WR + .22, REAR]), ...['#ff9a2e', '#5fbf4a', '#e8433a'].map((c, k) => P(new THREE.SphereGeometry(.08, 6, 5), c, [-.1 + k * .1, HUB_Y + WR + .36, REAR]))
  ]), mat));
  const rider = buildAvatar(look('aodai', '#ffffff', '#1d1412', 'long', 'nonla')); rider.root.position.set(0, .5, -.22); rider.root.scale.setScalar(.92); bike.add(rider.root);
  scene.add(bike);
  lines.bike = ['Kring kring! Cô Hoa rides her bicycle with flowers for the market.', 'Kính coong! Cô Hoa đạp xe chở hoa ra chợ.'];
  bike.userData.react = h => { SFX.ding(); talk(h, 'bike'); };
  // the buffalo cart: a buffalo pulling a wooden cart with a red canopy and hay, a tiny lotus on the front
  const cart = new THREE.Group();
  const buffalo = animalModel('buffalo'); scene.add(buffalo); // (its own object, so it walks; placed in front of the cart every frame)
  cart.add(new THREE.Mesh(merge([P(new THREE.CylinderGeometry(.03, .03, .9, 5), '#7a5236', [0, 1.05, .55], [0, 0, Math.PI / 2])]), mat)); // (the yoke)
  cart.add(new THREE.Mesh(merge([P(new THREE.BoxGeometry(1.3, .12, 1.8), '#9a6a3e', [0, .75, -.6]), ...[-1, 1].map(s => P(new THREE.BoxGeometry(.06, .35, 1.8), '#8a5a3b', [s * .65, .95, -.6])),
    ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.42, .42, .08, 12), '#6b4a2e', [s * .72, .42, -.6], [0, 0, Math.PI / 2])), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.03, .03, 1.7, 5), '#7a5236', [s * .25, .7, .45], [Math.PI / 2 - .2, 0, 0])),
    P(new THREE.BoxGeometry(1.1, .45, 1.2), '#e8c25a', [0, 1.05, -.75]), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.03, .03, 1.1, 5), '#6b4a2e', [s * .6, 1.4, -.1])),
    P(new THREE.CylinderGeometry(.8, .8, 1.3, 12, 1, true, -Math.PI / 2, Math.PI), '#c62828', [0, 1.75, -.6], [Math.PI / 2, 0, 0]),
    ...[0, 1, 2, 3, 4].map(k => P(new THREE.ConeGeometry(.06, .16, 4), '#ff8ab8', [Math.cos(k * 1.26) * .06, 1.05, .35 + Math.sin(k * 1.26) * .06], [Math.cos(k * 1.26) * .5, 0, Math.sin(k * 1.26) * .5]))]), mat));
  scene.add(cart);
  lines.cart = ['Moo! The buffalo cart brings hay from the rice fields. It goes slowly, so we always walk beside it safely.', 'Nghé ọ! Xe trâu chở rơm từ cánh đồng về. Xe đi chậm, mình đi bên cạnh cho an toàn nhé.'];
  cart.userData.react = buffalo.userData.react = h => { SFX.moo(); talk(h, 'cart'); };
  if (pondPath) movers.push({ o: bike, r: route(pondPath), s: 0, dir: 1, speed: .95, wait: 0, len: 1.2, anim: rider, rest: 3, wheels, wr: WR });
  if (lane) movers.push({ o: cart, pull: buffalo, r: route(lane), s: 0, dir: 1, speed: .6, wait: 0, len: 4.2, rest: 6 });
  const AHEAD = 4;
  world.updaters.push((dt, t) => {
    const near = G.heroes.some(h => Math.abs(h.pos.x - V.x) < 80 && Math.abs(h.pos.z - V.z) < 80);
    for (const m of movers) {
      let go = near && m.wait <= 0;
      if (m.wait > 0) m.wait -= dt;
      const [x, z, yaw0] = pointAt(m.r, m.s), yaw = m.dir > 0 ? yaw0 : yaw0 + Math.PI, fx = Math.sin(yaw), fz = Math.cos(yaw);
      // a child within 4 m in front (or anyone else riding the path ahead): wait
      const front = (px, pz, d) => { const ox = px - x, oz = pz - z, along = ox * fx + oz * fz; return along > -.5 && along < d + m.len / 2 && Math.abs(ox * fz - oz * fx) < 1.6; };
      if (G.heroes.some(h => front(h.pos.x, h.pos.z, AHEAD)) || movers.some(o => o !== m && front(o.o.position.x, o.o.position.z, 3.5))) go = false;
      m.waiting = !go;
      if (go) { m.s += m.dir * m.speed * dt; if (m.s >= m.r.len - m.len / 2 || m.s <= m.len / 2) { m.s = Math.max(m.len / 2, Math.min(m.r.len - m.len / 2, m.s)); m.dir *= -1; m.wait = m.rest; } }
      // (turning round at the end of the path happens slowly, while it rests)
      if (m.dyaw == null) m.dyaw = yaw; let dy = yaw - m.dyaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI; m.dyaw += dy * Math.min(1, dt * (Math.abs(dy) > 1 ? .9 : 4));
      m.o.position.set(x, heightAt(x, z), z); m.o.rotation.y = m.dyaw;
      if (m.pull) { const px = x + Math.sin(m.dyaw) * 1.7, pz = z + Math.cos(m.dyaw) * 1.7; m.pull.position.set(px, heightAt(px, pz), pz); m.pull.rotation.y = m.dyaw; }
      if (m.anim) m.anim.anim('ride', t, go ? 2 : 0);
      if (m.wheels && go) m.wheels.forEach(w => { w.rotation.x += m.speed * dt / m.wr; });   // (the wheels roll as far as the bike goes)
    }
  });
  if (movers[0]) movers[0].s = movers[0].r.len * .4;
  if (movers[1]) movers[1].s = 2;
  return { movers, animals, lines };
}

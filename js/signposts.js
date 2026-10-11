// (Round U, owner 11 Oct: picture signposts, so children and grown-ups know where each road goes; was planned as T4b)
// A wooden post at the corner of every junction (a road that ends on another road's middle), with a board pointing along
// each way: the place's picture and its name in the chosen language. Built after the title (js/main.js), from the
// roads and the places already in the valley, so nothing is written by hand.
import { THREE, toonVC, P, merge, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { ROADS, roadDist, edgeDist, heightAt } from './world.js';

const seg = (pts, x, z) => { let bd = 1e9, bi = 0, bt = 0; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))), d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < bd) { bd = d; bi = i; bt = t; } } return { d: bd, i: bi, t: bt }; };
const unit = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az) || 1; return [(bx - ax) / L, (bz - az) / L]; };

export function createSignposts(G) {
  const { scene, world } = G, places = (G.PLACES || []).filter(p => !p.under && p.key && Number.isFinite(p.x));
  // the place a road leads to, going towards its end `e`: the place nearest that end (within 45 m), or nothing
  const placeAt = ([x, z]) => { let best = null, bd = 45; for (const p of places) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } } return best; };
  const board = (p, w = 2.3, h = .58) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    const draw = () => { g.fillStyle = '#f6e7c8'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#8a5a3b'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 120);
      let size = 52, s = p.name(); g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`; while (g.measureText(s).width > 380 && size > 20) { size -= 2; g.font = `bold ${size}px Fredoka, "Baloo 2", sans-serif`; }
      g.fillStyle = '#5a3a20'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, 24, 66);
      g.beginPath(); g.moveTo(440, 30); g.lineTo(496, 64); g.lineTo(440, 98); g.closePath(); g.fillStyle = '#c0392b'; g.fill(); };
    draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const m = new THREE.MeshBasicMaterial({ map: t }), grp = new THREE.Group();
    const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), b2 = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b2.rotation.y = Math.PI; b2.scale.x = -1; a.position.z = .03; b2.position.z = -.03;
    grp.add(a, b2); return grp;
  };
  const postGeo = merge([P(new THREE.CylinderGeometry(.09, .11, 3.4, 8), '#8a5a3b', [0, 1.7, 0]), P(new THREE.SphereGeometry(.15, 8, 6), '#c0392b', [0, 3.45, 0])]);
  world.signposts = [];
  for (const R of ROADS) for (const end of [0, 1]) {
    if (R.loop || (R.gates || [])[end]) continue;
    const pts = end ? R.pts.slice().reverse() : R.pts, [jx, jz] = pts[0];
    const O = ROADS.find(o => o !== R && seg(o.pts, jx, jz).d < 1.5 && ![o.pts[0], o.pts[o.pts.length - 1]].some(e => Math.hypot(e[0] - jx, e[1] - jz) < 3));
    if (!O || R.kind === 'footpath') continue;
    // the three ways: along this road away from the junction, and both ways along the road it meets
    const q = seg(O.pts, jx, jz), [ox, oz] = unit(...O.pts[q.i], ...O.pts[q.i + 1]);
    const ways = [{ d: unit(jx, jz, ...pts[Math.min(3, pts.length - 1)]), to: pts[pts.length - 1] }, { d: [ox, oz], to: O.loop ? null : O.pts[O.pts.length - 1] }, { d: [-ox, -oz], to: O.loop ? null : O.pts[0] }]
      .map(w => ({ ...w, p: w.to && placeAt(w.to) })).filter(w => w.p);
    if (!ways.length) continue;
    // the post stands on the corner, off both roads
    const [ux, uz] = ways[0].d, nx = -uz, nz = ux; let at = null;
    for (const s of [1, -1]) { const x = jx + ux * (O.w / 2 + 1.8) + nx * s * (R.w / 2 + 1.8), z = jz + uz * (O.w / 2 + 1.8) + nz * s * (R.w / 2 + 1.8); if (edgeDist(x, z) > 1 && heightAt(x, z) > .5) { at = [x, z]; break; } }
    if (!at || world.signposts.some(s => Math.hypot(s.x - at[0], s.z - at[1]) < 6)) continue;
    const grp = new THREE.Group(), y = heightAt(...at); grp.position.set(at[0], y, at[1]);
    grp.add(new THREE.Mesh(postGeo, toonVC()));
    ways.slice(0, 3).forEach((w, k) => {
      const bd = board(w.p), yaw = Math.atan2(w.d[0], w.d[1]) - Math.PI / 2; bd.position.set(w.d[0] * 1.2, 2.9 - k * .66, w.d[1] * 1.2); bd.rotation.y = yaw; grp.add(bd);
      const ic = sprite(w.p.icon, .62); ic.position.set(w.d[0] * 2.6, 2.9 - k * .66, w.d[1] * 2.6); grp.add(ic);   // (the picture at the board's pointing end)
    });
    scene.add(grp); world.colliders.push({ x: at[0], z: at[1], r: .25 });
    world.signposts.push({ x: at[0], z: at[1], ways: ways.map(w => w.p.key) });
  }
  return world.signposts;
}

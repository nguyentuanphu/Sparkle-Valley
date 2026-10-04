// The solid map: nobody walks through houses, walls, fences, rocks, kiosks, statues or furniture.
// Once the valley is built, every still object is sliced at a child's body height (from 35 cm to 1.6 m above the
// ground under it) and the places where its surfaces cross that slice are marked solid on a 0.5 m grid. Gaps that
// are really there stay open (a gateway between two pillars, a doorway, a bridge between its railings), and
// low things you step onto (stages, piers, bridge decks: the world's platforms) stay walkable.
// Things that move (people, pets, animals, boats, kites…) are left out: anything that moved while the map was
// being made is skipped, and they have their own round colliders.
import { THREE } from './gfx.js';
import { BUILD } from './build.js';
import { CUSTOM } from './custom.js';

// the saved map belongs to one build and one family content pack (moved or added buildings change it)
const SIG = (() => { let h = 0; const t = JSON.stringify(CUSTOM || {}); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return BUILD + '_' + (h >>> 0).toString(36); })();
const CELL = .5, HALF = 200, N = Math.round(HALF * 2 / CELL), LO = .35, HI = 1.6;
export function buildSolids(G) {
  const { scene, world: W } = G, grid = new Uint8Array(N * N);
  const idx = (x, z) => { const i = Math.floor((x + HALF) / CELL), j = Math.floor((z + HALF) / CELL); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
  const skipTree = o => { for (let p = o; p && p !== scene; p = p.parent) { const u = p.userData || {}; if (u.avatar || u.road || u.walk || u.moving) return true; } return false; };
  const boats = new Set(); ((G.ferries && G.ferries.ferries) || []).forEach(F => F.model.traverse(o => boats.add(o)));
  // which meshes are still: their place now and a moment later
  const cand = [];
  scene.updateMatrixWorld(true);
  scene.traverse(o => {
    if (!o.isMesh || !o.visible || o === W.terrain || o.userData.outline || boats.has(o) || skipTree(o)) return;
    const m = o.material; if (!m || (Array.isArray(m) ? m.some(x => x.transparent) : m.transparent)) return; // glass, water, verges, sprites
    const g = o.geometry; if (!g || !g.attributes.position) return; if (!g.boundingBox) g.computeBoundingBox();
    if (o.isInstancedMesh && g.boundingBox.max.y - g.boundingBox.min.y < 1.4) return; // grass and flowers
    cand.push({ o, m0: o.matrixWorld.clone() });
  });
  return new Promise(resolve => setTimeout(() => {
    const t0 = performance.now(); scene.updateMatrixWorld(true);
    const still = cand.filter(c => c.o.parent && c.o.matrixWorld.equals(c.m0)).map(c => c.o);
    const gcache = new Float32Array(N * N).fill(NaN), ground = (x, z) => { const k = idx(x, z); if (k < 0) return W.groundAt(x, z); let g = gcache[k]; if (g !== g) g = gcache[k] = W.groundAt(Math.floor((x + HALF) / CELL) * CELL - HALF + CELL / 2, Math.floor((z + HALF) / CELL) * CELL - HALF + CELL / 2); return g; };
    const plat = W.platforms || [], onPlatSide = (x, z, y) => plat.some(p => !p.tower && x > p.x0 - .4 && x < p.x1 + .4 && z > p.z0 - .4 && z < p.z1 + .4 && y <= p.y + .08 && (!p.r || Math.hypot(x - p.cx, z - p.cz) < p.r + .4));
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m4 = new THREE.Matrix4(), mi = new THREE.Matrix4();
    let marked = 0;
    const tri = (A, B, C) => {
      // only triangles that reach into the body-height slice somewhere near them
      const ymin = Math.min(A.y, B.y, C.y), ymax = Math.max(A.y, B.y, C.y);
      const gx = (A.x + B.x + C.x) / 3, gz = (A.z + B.z + C.z) / 3, g0 = ground(gx, gz);
      if (ymax < g0 + LO - 1.5 || ymin > g0 + HI + 1.5) return;
      const e1 = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z), e2 = Math.hypot(C.x - A.x, C.y - A.y, C.z - A.z), n = Math.min(60, Math.ceil(Math.max(e1, e2) / .3));
      for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
        const u = i / n, v = j / n, x = A.x + (B.x - A.x) * u + (C.x - A.x) * v, y = A.y + (B.y - A.y) * u + (C.y - A.y) * v, z = A.z + (B.z - A.z) * u + (C.z - A.z) * v;
        const k = idx(x, z); if (k < 0 || grid[k]) continue;
        const g = ground(x, z); if (y < g + LO || y > g + HI) continue;
        if (onPlatSide(x, z, y)) continue;
        grid[k] = 1; marked++;
      }
    };
    // a saved map from an earlier start of this same valley is used as it is (the work below takes a few seconds)
    const sig = 'sv2_solid_' + SIG + '_' + still.length;
    let oi = 0, work = 0, lastEnd = 0; // (declared before the saved map is used: done() reads work)
    let cached = null; try { cached = localStorage.getItem(sig); } catch (e) { }
    if (cached) { const bin = atob(cached); for (let k = 0; k < N * N; k++) if (bin.charCodeAt(k >> 3) & (1 << (k & 7))) { grid[k] = 1; marked++; } return done(true); }
    // otherwise a little at a time (about 12 ms per frame), so the game keeps moving while it is made; on a device
    // whose frames are slow anyway, a bigger bite each time (a quarter of the time between bites, at most 120 ms)
    const step = () => {
      const s0 = performance.now(), until = s0 + Math.min(120, Math.max(12, lastEnd ? (s0 - lastEnd) * .25 : 12));
      while (oi < still.length && performance.now() < until) {
        const o = still[oi++], g = o.geometry, pos = g.attributes.position, ix = g.index, count = ix ? ix.count : pos.count;
        const reps = o.isInstancedMesh ? o.count : 1;
        for (let r = 0; r < reps; r++) {
          if (o.isInstancedMesh) { o.getMatrixAt(r, mi); m4.multiplyMatrices(o.matrixWorld, mi); } else m4.copy(o.matrixWorld);
          for (let t = 0; t < count; t += 3) {
            const i0 = ix ? ix.getX(t) : t, i1 = ix ? ix.getX(t + 1) : t + 1, i2 = ix ? ix.getX(t + 2) : t + 2;
            a.fromBufferAttribute(pos, i0).applyMatrix4(m4); b.fromBufferAttribute(pos, i1).applyMatrix4(m4); c.fromBufferAttribute(pos, i2).applyMatrix4(m4);
            tri(a, b, c);
          }
        }
      }
      work += performance.now() - s0; lastEnd = performance.now();
      if (oi < still.length) return setTimeout(step, 0);
      try { const bytes = new Uint8Array(N * N / 8); for (let k = 0; k < N * N; k++) if (grid[k]) bytes[k >> 3] |= 1 << (k & 7); let str = ''; for (let k = 0; k < bytes.length; k += 4096) str += String.fromCharCode.apply(null, bytes.subarray(k, k + 4096));
        for (let k = localStorage.length - 1; k >= 0; k--) { const key = localStorage.key(k); if (key && key.startsWith('sv2_solid_') && key !== sig) localStorage.removeItem(key); }
        localStorage.setItem(sig, btoa(str)); } catch (e) { }
      done(false);
    };
    step();
    function done(fromCache) {
    W.solid = grid; W.solidGround = ground; W.solidAt = (x, z) => { const k = idx(x, z); return k >= 0 && grid[k] === 1; };
    // anything you tap that now stands inside something solid reaches out to the nearest open ground
    for (const it of G.interactables) {
      if (!Number.isFinite(it.x) || !W.solidAt(it.x, it.z)) continue;
      let best = 1e9; for (let r = .5; r < 12 && best > 1e8; r += .5) for (let s = 0; s < 24; s++) { const an = s / 24 * Math.PI * 2; if (!W.solidAt(it.x + Math.cos(an) * r, it.z + Math.sin(an) * r)) { best = r; break; } }
      if (best < 1e8) it.r = Math.max(it.r || 2.5, best + 1.4);
    }
    W.solidStats = { meshes: still.length, cells: marked, ms: Math.round(performance.now() - t0), work: Math.round(work), cached: fromCache };
    resolve(W.solidStats);
    }
  }, 1200));
}
// push a body of radius r out of solid cells (used by world.collide)
export function pushOutOfSolids(W, pos, r) {
  if (!W.solid) return;
  if (pos.y != null && pos.y > W.solidGround(pos.x, pos.z) + 1.2) return; // up in the air (gliding, a tower top, a room upstairs)
  for (let pass = 0; pass < 2; pass++) {
    const i0 = Math.floor((pos.x - r + HALF) / CELL), i1 = Math.floor((pos.x + r + HALF) / CELL), j0 = Math.floor((pos.z - r + HALF) / CELL), j1 = Math.floor((pos.z + r + HALF) / CELL);
    let moved = false;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (i < 0 || j < 0 || i >= N || j >= N || !W.solid[j * N + i]) continue;
      const x0 = i * CELL - HALF, z0 = j * CELL - HALF, cx = Math.max(x0, Math.min(pos.x, x0 + CELL)), cz = Math.max(z0, Math.min(pos.z, z0 + CELL));
      let dx = pos.x - cx, dz = pos.z - cz; const d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d < 1e-4) { dx = pos.x - (x0 + CELL / 2); dz = pos.z - (z0 + CELL / 2); const l = Math.hypot(dx, dz) || 1; pos.x += dx / l * (r + CELL / 2); pos.z += dz / l * (r + CELL / 2); }
      else { pos.x += dx / d * (r - d); pos.z += dz / d * (r - d); }
      moved = true;
    }
    if (!moved) break;
  }
}

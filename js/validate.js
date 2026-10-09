// One world checker for the hard rules (architecture step "gen.validate", round 30): the same checks wherever they
// are needed (the test suite now; Sparkle Studio before Publish next). Each problem names its rule id from
// docs/ARCHITECTURE.md §9, so a report reads the same everywhere. It only reads the world; it never changes it.
//   validateWorld(G) → [{ rule, severity, msg }]   (empty when every rule holds; severity from js/content/rules.js)
import { ROADS, roadDist, VILLAGE } from './world.js';
import { ROAD_GRADE } from './roads.js';
import { RULES } from './content/rules.js';

export function validateWorld(G) {
  const W = G.world, out = [], add = (rule, msg) => { if (!RULES[rule]) throw new Error(`validate.js uses ${rule}, which is not in the rule registry`); if (out.length < 200) out.push({ rule, severity: RULES[rule].severity, msg }); }, f = v => v.toFixed(0);
  // ROAD-003 grade, ROAD-002 smooth curves (no step turns more than 8°), rounded changes of slope
  (W.roadLines || []).forEach((L, k) => {
    const G2 = (ROAD_GRADE[L.kind] || ROAD_GRADE.dirt) + .002;
    for (let i = 1; i < L.ys.length; i++) {
      const d = Math.hypot(L.pts[i][0] - L.pts[i - 1][0], L.pts[i][1] - L.pts[i - 1][1]) || 1, g = Math.abs(L.ys[i] - L.ys[i - 1]) / d;
      if (g > G2 && !L.deck[i]) add('ROAD-003', `road ${k} (${L.kind}) ${(g * 100).toFixed(0)} % at ${L.pts[i].map(f)}`);
      if (i < L.ys.length - 1) {
        const a1 = Math.atan2(L.pts[i][1] - L.pts[i - 1][1], L.pts[i][0] - L.pts[i - 1][0]), a2 = Math.atan2(L.pts[i + 1][1] - L.pts[i][1], L.pts[i + 1][0] - L.pts[i][0]); let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
        if (t * 180 / Math.PI > 8) add('ROAD-002', `road ${k} turns ${(t * 180 / Math.PI).toFixed(0)}° at ${L.pts[i].map(f)}`);
        if (Math.abs((L.ys[i + 1] - L.ys[i]) - (L.ys[i] - L.ys[i - 1])) > .16 && !L.deck[i]) add('ROAD-003', `road ${k} kink at ${L.pts[i].map(f)}`);
      }
    }
  });
  // ROAD-001 widths (asphalt 5.2, dirt 3.4, footpath 1.6)
  const WIDTH = { asphalt: 5.2, dirt: 3.4, footpath: 1.6 };
  ROADS.forEach((R, k) => { if (WIDTH[R.kind] !== R.w) add('ROAD-001', `road ${k} is ${R.kind} ${R.w} m wide`); });
  // G5 / ROAD-004: nothing solid or tappable standing on a road
  const on = (x, z, r) => { const d = roadDist(x, z); return d.road && d.d < d.road.w / 2 + r; };
  for (const c of W.colliders) if (c.r > .45 && on(c.x, c.z, c.r - .3)) add('ROAD-004', `something solid on a road at ${f(c.x)},${f(c.z)}`);
  for (const b of W.boxes) { const x = (b.x0 + b.x1) / 2, z = (b.z0 + b.z1) / 2; if (on(x, z, Math.min(b.x1 - b.x0, b.z1 - b.z0) / 2)) add('ROAD-004', `a building on a road at ${f(x)},${f(z)}`); }
  // (a street seller walking along the pavement may cross a side street on the way: walking, not standing; skipped)
  for (const i of G.interactables || []) if (Number.isFinite(i.x) && !i.walks && on(i.x, i.z, -.5)) add('ROAD-004', `"${i.id}" stands on a road`);
  // ROAD-011: Lotus Village's pond path keeps 1.5–2.5 m between its edge and the water
  const pond = [VILLAGE.x - 10, VILLAGE.z + 4], pp = ROADS.find(R => R.id === 'lv_pond'); // (round T: by its id in the map, not "the first footpath")
  if (pp) pp.pts.slice(3).forEach(([x, z]) => { const g = Math.hypot(x - pond[0], z - pond[1]) - 5.2 - pp.w / 2; if (g < 1.45 || g > 2.55) add('ROAD-011', `pond path ${g.toFixed(1)} m from the water at ${f(x)},${f(z)}`); });
  // VEH-001: riders at walking pace or slower (js/lotus.js)
  for (const m of (G.lotus && G.lotus.movers) || []) if (m.speed > 1) add('VEH-001', `a rider goes ${m.speed} m/s on a ${m.r ? 'path' : 'road'}`);
  return out;
}

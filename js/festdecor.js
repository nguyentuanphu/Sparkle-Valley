// Festival decorations along the streets (Play core, owner 10 Oct: "each festival should decorate the whole town and
// villages rather than scattered with a few"): which spots beside each place's streets carry a piece, and how many at
// each week of the build-up; and what a child is told when they tap a festival on the calendar that is not on today
// (owner, 10 Oct: children never start a festival). Loaded by js/festivals.js once a child plays (PERF-001).
import { roadDist, heightAt, TOWN, AUSSIE, MARKET } from './world.js';
import { T } from './i18n.js';
import { liveRule } from './custom.js';

const day = s => { const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; };
// an admin's schedule in Studio's Releases page (fest_<id> with a start date): the festival is on from that day, for its
// days there (or the festival's own length)
export function scheduled(F, now) {
  const r = liveRule('fest_' + F.id); if (!r || !r.start || r.on === false) return false;
  const st = day(String(r.start).slice(0, 10)); if (!st) return false;
  const end = new Date(+st + (r.days > 0 ? r.days : F.days || 1) * 864e5);
  return now >= st && now < end;
}


// the streets some places draw themselves (not in the valley's road list; widths as in js/town.js and js/regions.js):
// along x at z, half width hw
const INNER = { town: { x0: 6, x1: 44, z: TOWN.roadZ, hw: 3.5 }, aussie: { x0: AUSSIE.x0, x1: AUSSIE.x1, z: AUSSIE.roadZ, hw: 3.5 }, market: { x0: MARKET.x0, x1: MARKET.x1, z: MARKET.roadZ, hw: 4 } };
// how much one place can carry (PERF budgets): pieces along its streets on the day, strings of bunting
export const MAX_PIECES = 48, MAX_BUNTING = 10;

// free(x, z, r): open ground there (js/festivals.js: dry, no building or collider)
export function createDecor(free) {
  // spots beside the streets of a place: a little off every road, lane and footpath (never on it or its verge, G5) and
  // beside a city's main street; kept 5 m apart; worked out once per place
  const streetCache = {};
  const streetSpots = (key, o) => {
    if (streetCache[key]) return streetCache[key];
    const box = o.x0 != null ? o : { x0: o.x - (o.r || 24), x1: o.x + (o.r || 24), z0: o.z - (o.r || 24), z1: o.z + (o.r || 24) }, round = o.x0 == null;
    const lay = o.layout, inner = INNER[key], cand = [];
    // (a city: also round the edge of its paved square)
    if (o.w && o.d) for (let t = 0; t < 1; t += 1 / 40) for (const [ex, ez, ea] of [[o.x - o.w + 1.5 + t * (2 * o.w - 3), o.z - o.d + 1.5, 0], [o.x - o.w + 1.5 + t * (2 * o.w - 3), o.z + o.d - 1.5, Math.PI], [o.x - o.w + 1.5, o.z - o.d + 1.5 + t * (2 * o.d - 3), Math.PI / 2], [o.x + o.w - 1.5, o.z - o.d + 1.5 + t * (2 * o.d - 3), -Math.PI / 2]]) {
      const d = roadDist(ex, ez), u = lay ? Math.abs((ex - o.x) * Math.cos(lay.toward) - (ez - o.z) * Math.sin(lay.toward)) : 99;
      if ((!d.road || d.d > d.road.w / 2 + 1.6) && u > 2.6 + 1.6 && free(ex, ez, .9)) cand.push({ x: ex, z: ez, a: ea });
    }
    // (1 m apart, so the narrow strip beside each street is never stepped over)
    for (let x = box.x0; x <= box.x1; x += 1) for (let z = box.z0; z <= box.z1; z += 1) {
      if (round && Math.hypot(x - o.x, z - o.z) > (o.r || 24)) continue;
      const d = roadDist(x, z); let side = d.road && d.d > d.road.w / 2 + 1.6 && d.d < d.road.w / 2 + 2.8, a = 0, street = false;
      // (a place's own street, drawn by its file: on its footpaths, never on the street)
      if (inner && x > inner.x0 - 1 && x < inner.x1 + 1) { const dz = z - inner.z, u = Math.abs(dz); if (u < inner.hw + 1.6) side = false; else if (u < inner.hw + 2.8) { side = true; street = true; a = dz > 0 ? Math.PI : 0; } }
      if (lay) { const u0 = (x - o.x) * Math.cos(lay.toward) - (z - o.z) * Math.sin(lay.toward), u = Math.abs(u0); if (u < 2.6 + 1.6) side = false; else if (u < 2.6 + 2.8) { side = true; street = true; a = Math.atan2(-Math.sign(u0) * Math.cos(lay.toward), Math.sign(u0) * Math.sin(lay.toward)); } }
      // (each piece faces the street: the way the distance to the road gets smaller)
      if (side && !street) { const gx = roadDist(x + .5, z).d - roadDist(x - .5, z).d, gz = roadDist(x, z + .5).d - roadDist(x, z - .5).d; a = Math.atan2(-gx, -gz) || 0; }
      if (side && !(d.road && d.d < d.road.w / 2 + 1.6) && free(x, z, .9)) cand.push({ x, z, a });
    }
    const out = [];
    for (const c of cand) if (out.every(q => Math.hypot(q.x - c.x, q.z - c.z) >= 5)) out.push(c);
    return (streetCache[key] = out);
  };
  // which of a place's street spots carry a piece at a stage (1 to 4): spread over the whole place at every stage
  // (every 4th spot in week 1, every 2nd in week 2, ...), at most MAX_PIECES (a quiet day: a few, gently)
  const chosen = (spots, F, stage) => {
    const cap = F.kind === 'quiet' ? 10 : MAX_PIECES, step = Math.max(1, spots.length / cap), every = [];
    for (let k = 0; k < spots.length && every.length < cap; k += step) every.push(spots[Math.floor(k)]);
    const n = Math.round(every.length * (F.kind === 'quiet' ? .6 : stage / 4));
    return [...every.keys()].sort((a, b) => ((a % 4) - (b % 4)) || a - b).slice(0, n).map(k => every[k]);
  };
  // the pieces and bunting along a place's streets (null: a place without streets, which keeps its ring)
  const decorate = (key, o, F, A, piece, bunting, bc, bk) => {
    const spots = streetSpots(key, o), parts = [], glows = []; if (spots.length < 6) return null;
    chosen(spots, F, A.stage).forEach((q, i) => { const r = piece(F.theme, i, q.x, heightAt(q.x, q.z), q.z, q.a); parts.push(...r.parts); glows.push(...r.glows); });
    // bunting along the streets between neighbouring spots (from the second week)
    const nb = F.kind === 'quiet' ? 0 : Math.round(Math.max(0, A.stage - 1) / 3 * MAX_BUNTING);
    for (let k = 0, j = 0; k < spots.length && j < nb; k += 2) { const a = spots[k], b = spots.find((q, m) => m > k && Math.hypot(q.x - a.x, q.z - a.z) < 9);
      if (!b) continue; const q = bunting([a.x, heightAt(a.x, a.z) + 3.2, a.z], [b.x, heightAt(b.x, b.z) + 3.2, b.z], bc, bk); parts.push(...q.parts); glows.push(...q.glows); j++; }
    return { parts, glows };
  };
  // (checks) the spots that carry a piece at a stage
  const plan = (key, o, F, stage) => { const sp = streetSpots(key, o); return sp.length >= 6 ? chosen(sp, F, stage).map(q => ({ x: q.x, z: q.z })) : []; };
  return { streetSpots, decorate, plan };
}

// a festival tapped on the calendar that is not on today: still to come (days to go; nothing starts), or in its
// build-up (the child is taken to see the decorations going up). n: its next dates; at: its first place's middle
export async function tell(G, h, F, A, n) {
  const s = d => d === 1 ? '' : 's';
  // (owner, 11 Oct, #32) the calendar only tells: it never takes the child anywhere
  if (A && A.on) return G.dialog(T(F.en, F.vi), [[`It's ${F.en} today! Its place is all decorated.`, `Hôm nay là ${F.vi}! Nơi tổ chức đã trang trí xong rồi.`]]);
  if (!A) { const d = n ? n.daysTo : null;
    return G.dialog(T(F.en, F.vi), [[d != null ? `${F.en} is in ${d} day${s(d)}. The decorations come by themselves three weeks before. See you then!` : `${F.en} is not on now.`,
      d != null ? `Còn ${d} ngày nữa là đến ${F.vi}. Ba tuần trước ngày lễ, nơi đó sẽ tự trang trí. Hẹn gặp con nhé!` : `${F.vi} chưa đến đâu con.`]]); }
  return G.dialog(T(F.en, F.vi), [[`${F.en} is in ${A.daysTo} day${s(A.daysTo)}! The decorations are going up.`, `Còn ${A.daysTo} ngày nữa là đến ${F.vi}! Mọi người đang trang trí rồi.`]]);
}

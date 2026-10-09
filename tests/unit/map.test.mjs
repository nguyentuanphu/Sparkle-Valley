// The map of the valley (round T): js/content/map.js is plain data, so it is checked here in Node.
// WORLD-008 ids unique and well-formed, WORLD-009 every reference resolves, and everything inside the valley.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../js/content/map.js';

const HALF = M.WORLD.size / 2;
const placeIds = new Set(M.PLACES.map(p => p.id));
const lists = { PLACES: M.PLACES, WATERS: M.WATERS, BRIDGES: M.BRIDGES, ROADS: M.ROADS, SADDLES: M.SADDLES, CLEARINGS: M.CLEARINGS, SHRINES: M.SHRINES, TOWERS: M.TOWERS, LEAFIES: M.LEAFIES, BOATS: M.BOATS };
const inside = ([x, z], pad = 0) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= HALF - pad && Math.abs(z) <= HALF - pad;

test('map: every id is unique in its list and well-formed (WORLD-008)', () => {
  for (const [name, list] of Object.entries(lists)) {
    const ids = list.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length, `${name}: the same id twice`);
    for (const id of ids) assert.match(id, /^[a-z][a-z0-9_]*$/, `${name}: bad id ${id}`);
  }
});

test('map: every reference resolves (WORLD-009)', () => {
  for (const p of M.PLACES) if (p.place) assert.ok(placeIds.has(p.place), `place ${p.id} sits in an unknown place ${p.place}`);
  for (const R of M.ROADS) for (const g of R.gates || []) if (g) assert.ok(placeIds.has(g), `road ${R.id}: gate to an unknown place ${g}`);
  const waters = new Set(M.WATERS.map(w => w.id));
  for (const B of M.BRIDGES) { assert.ok(waters.has(B.over), `bridge ${B.id} over unknown water ${B.over}`); assert.ok(B.axis === 'x' || B.axis === 'z', `bridge ${B.id}: axis x or z, never diagonal`); }
  for (const W of M.WATERS) if (W.place) assert.ok(placeIds.has(W.place), `water ${W.id} in an unknown place`);
  for (const [id, L] of Object.entries(M.LANDMARK_AT)) assert.ok(placeIds.has(L.place), `landmark ${id} in an unknown place ${L.place}`);
  for (const [id, home] of Object.entries(M.LANDMARK_HOME)) assert.ok(placeIds.has(home), `landmark ${id} belongs to an unknown place ${home}`);
  for (const C of M.CLEARINGS) if (C.place) assert.ok(placeIds.has(C.place), `clearing ${C.id} in an unknown place`);
  for (const b of M.BOATS) assert.ok(waters.has(b.water), `boat ${b.id} on unknown water ${b.water}`);
  for (const id of Object.keys(M.LEGACY.C)) assert.ok(placeIds.has(id), `old anchor for an unknown place ${id}`);
});

test('map: every place, road, bridge, landmark and spot is inside the valley', () => {
  for (const p of M.PLACES) assert.ok(inside(M.anchorOf(p.id), 5), `place ${p.id} outside`);
  for (const R of M.ROADS) R.pts.forEach((pt, i) => assert.ok(inside(pt, 5), `road ${R.id} point ${i} outside`));
  for (const W of M.WATERS) for (const pt of W.pts || []) assert.ok(inside(pt), `water ${W.id} outside`);
  for (const B of M.BRIDGES) assert.ok(inside(B.axis === 'x' ? [B.a0, B.c] : [B.c, B.a0], 5) && inside(B.axis === 'x' ? [B.a1, B.c] : [B.c, B.a1], 5), `bridge ${B.id} outside`);
  for (const id of Object.keys(M.LANDMARK_AT)) assert.ok(inside(M.landmarkAt(id), 5), `landmark ${id} outside`);
  for (const list of [M.SHRINES, M.TOWERS, M.LEAFIES]) for (const s of list) assert.ok(inside(s.at, 5), `${s.id} outside`);
  const [rx, rz] = M.WORLD.rooms; assert.ok(inside([rx, rz], 5), 'the room spot is outside');
});

test('map: a city road ends exactly on one of the city\'s gates (ROAD-007), and every gate is on the city\'s edge', () => {
  const cities = new Map(M.PLACES.filter(p => p.kind === 'city').map(c => [c.id, c]));
  for (const c of cities.values()) for (const [dx, dz] of c.gates) assert.ok(Math.abs(Math.abs(dx) - c.w) < 1e-9 || Math.abs(Math.abs(dz) - c.d) < 1e-9, `${c.id}: a gate off its edge`);
  for (const R of M.ROADS) (R.gates || []).forEach((g, end) => {
    const c = cities.get(g); if (!c) return;
    const [x, z] = end ? R.pts[R.pts.length - 1] : R.pts[0];
    assert.ok(c.gates.some(([dx, dz]) => Math.hypot(c.at[0] + dx - x, c.at[1] + dz - z) < .01), `road ${R.id} does not end on a gate of ${g}`);
  });
});

test('map: saved spots and Studio content belong to a layout (round T migration)', () => {
  assert.equal(typeof M.MAP_VERSION, 'string');
  assert.equal(M.onThisMap(M.MAP_VERSION), true);
  assert.equal(M.onThisMap('an older layout'), false);
  // no stamp means map 'C' (everything saved before round T)
  assert.equal(M.onThisMap(undefined), M.MAP_VERSION === 'C');
  assert.ok(M.LEGACY.C && Object.isFrozen(M.LEGACY.C), 'the old anchors are kept, frozen');
});

test("map: layout 'C' is the valley as it was (round T0 moved nothing)", { skip: M.MAP_VERSION !== 'C' }, () => {
  for (const [id, at] of Object.entries(M.LEGACY.C)) assert.deepEqual(M.anchorOf(id), at, `${id} moved`);
});

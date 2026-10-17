// Tester reports (owner, 12 Oct 2026 AEDT; PRIV-014, PRIV-016): only devices the Releases switch `tester` covers are
// heard; reports are checked and grouped into problems; limits a device and a connection a day; the status a device
// gets (its problems, the open ones, the retest); Studio sets a problem fixed, which counts as help for the badges and
// the weekly star; a device confirms a fix or says it came back. In-memory stores, no browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../netlify/lib/tester.mts';
import { makeTester } from '../../netlify/functions/tester.mts';
import { cleanLive } from '../../netlify/lib/live.mts';
import { testerLevel, keyOf, badgeFor, nextBadge, peeksOf } from '../../js/content/tester.js';

const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }), _m: m }; };
const A = 'aaaaaaaaaaaa', B = 'bbbbbbbbbbbb', X = 'xxxxxxxxxxxx';
const LIVE = { releases: { tester: { on: true, devices: [A, B], levels: { B: 'auto' } } } };
const rep = (id, o = {}) => ({ id, b: 'r66', kind: 'auto', auto: 'error', detail: 'x is not defined @ ui.js:12', where: { area: 'village', game: 'memory', window: '', x: 1, z: 2 }, errors: ['x is not defined @ ui.js:12'], log: [[-3, 'tap', 'Play']], dev: { os: 'iOS', br: 'Safari', sc: '390x844', lang: 'vi', fps: 50 }, players: [{ name: 'Bé Na', age: 'little' }], shot: 'data:image/jpeg;base64,AAAA', ...o });

test('the game decides who is a tester and at which level', () => {
  assert.equal(testerLevel(false, LIVE.releases.tester, A), '');
  assert.equal(testerLevel(true, LIVE.releases.tester, X), '', 'a device not ticked is not a tester');
  assert.equal(testerLevel(true, { devices: [A], levels: { [A]: 'auto' } }, A), 'auto');
  assert.equal(testerLevel(true, { devices: [A] }, A), 'ladybird', 'the ladybird by default');
  assert.equal(testerLevel(true, {}, X), 'ladybird', 'no list: every device');
  assert.deepEqual(peeksOf({ peeks: ['readingTrial', '<b>'] }), ['readingTrial']);
  assert.equal(keyOf('error', 'a', 'b'), 'error|a|b');
  assert.equal(badgeFor(0), null); assert.equal(badgeFor(1).id, 'lb1'); assert.equal(badgeFor(24).id, 'lb2'); assert.equal(badgeFor(50).id, 'lb4');
  assert.equal(nextBadge(10).id, 'lb3');
});

test('Studio keeps each tester device\'s level and the sneak peeks, and nothing odd', () => {
  const c = cleanLive({ releases: { tester: { on: true, devices: [A, 'bad'], levels: { [A]: 'auto', [B]: 'all', zz: 'auto' }, peeks: ['readingTrial', 'x y'] } } });
  assert.deepEqual(c.releases.tester, { on: true, devices: [A], levels: { [A]: 'auto' }, peeks: ['readingTrial'] });
});

test('only tester devices are heard; reports are checked and grouped into problems', async () => {
  const S = mem();
  assert.equal((await T.addReport(S, LIVE, rep(X))).status, 403, 'not a tester');
  assert.equal((await T.addReport(S, { releases: {} }, rep(A))).status, 403, 'the switch is off');
  assert.equal((await T.addReport(S, LIVE, { ...rep(A), kind: 'nope' })).status, 400);
  const a = await T.addReport(S, LIVE, rep(A)), b = await T.addReport(S, LIVE, rep(B, { detail: 'x is not defined @ ui.js:12' }));
  assert.ok(a.ok && b.ok); assert.equal(a.k, b.k, 'the same error in the same game is one problem');
  const n = await T.addReport(S, LIVE, rep(A, { kind: 'looks', auto: undefined, note: 'The bridge is floating', spoken: true }));
  assert.notEqual(n.k, a.k, 'a tester\'s note is its own problem');
  const j = await T.addReport(S, LIVE, rep(B, { kind: 'broken', auto: undefined, note: 'Same', join: a.k }));
  assert.equal(j.k, a.k, '"Already reported → add to it" joins the open problem');
  const all = await T.problems(S), p = all.find(x => x.k === a.k);
  assert.equal(p.n, 3); assert.equal(p.devices, 2); assert.deepEqual(p.builds, ['r66']); assert.equal(p.status, 'new');
  const d = await T.problem(S, a.k); assert.equal(d.reports.length, 3); assert.equal(d.reports[0].players[0].name, 'Bé Na', 'a tester\'s report keeps the names (PRIV-016)');
  assert.ok((await T.shotOf(S, d.reports[0].rid)).startsWith('data:image/jpeg'));
  const big = rep(A, { note: 'x'.repeat(5000), errors: Array(99).fill('e'), log: Array(999).fill([1, 'tap', 'x']) }), c = T.cleanReport(big).r;
  assert.ok(c.note.length <= T.TLIMITS.note && c.errors.length <= T.TLIMITS.errors && c.log.length <= T.TLIMITS.log, 'sizes are capped');
});

test('a device may send 60 reports a day, a connection 150 (PRIV-014)', async () => {
  const S = mem(); let last;
  for (let i = 0; i < T.TLIMITS.device + 1; i++) last = await T.addReport(S, LIVE, rep(A, { detail: 'e' + i }), Date.now(), 'ip1');
  assert.equal(last.status, 429);
});

test('fixed in a version: the device sees it, replays it, confirms it; help counts for badges and the star', async () => {
  const S = mem(), a = await T.addReport(S, LIVE, rep(A)), n = await T.addReport(S, LIVE, rep(B, { kind: 'idea', auto: undefined, note: 'More boats' }));
  let st = await T.deviceStatus(S, LIVE, A, 'r66'); assert.equal(st.mine[0].status, 'new'); assert.equal(st.open.length, 2); assert.equal(st.helped, 0);
  assert.equal(await T.deviceStatus(S, LIVE, X, 'r66'), null, 'not a tester: nothing');
  await T.setProblem(S, a.k, { fixedIn: 'r67' });
  st = await T.deviceStatus(S, LIVE, A, 'r66'); assert.equal(st.mine[0].status, 'fixed'); assert.equal(st.retest.length, 0, 'not on the fixed version yet');
  st = await T.deviceStatus(S, LIVE, A, 'r67'); assert.equal(st.retest.length, 1, 'on the fixed version: replay it'); assert.equal(st.helped, 1); assert.ok(st.star, 'the week\'s star');
  assert.ok(await T.deviceSays(S, LIVE, { id: A, k: a.k, fixed: true })); assert.equal((await T.problems(S)).find(p => p.k === a.k).status, 'confirmed');
  // the same error again on the fixed version: it came back
  await T.addReport(S, LIVE, { ...rep(A), b: 'r67' }); assert.equal((await T.problems(S)).find(p => p.k === a.k).status, 'back');
  await T.setProblem(S, n.k, { dupOf: a.k }); assert.equal((await T.problems(S)).find(p => p.k === n.k).status, 'dup');
  const ov = await T.overview(S); assert.equal(ov.testers.length, 2); assert.ok(ov.summary.open >= 1);
  assert.ok(await T.deviceSays(S, LIVE, { id: A, accepted: true })); assert.ok((await T.testers(S)).find(t => t.id === A).accepted > 0);
});

test('/api/tester: reports in, status out, refused for others', async () => {
  const S = mem(), L = mem(), G = mem(); await L.setJSON('live', LIVE);
  const h = makeTester({ testerStore: async () => S, liveStore: async () => L, guardStore: async () => G });
  const post = b => h(new Request('https://x/api/tester', { method: 'POST', body: JSON.stringify(b) }), { ip: '1.2.3.4' });
  assert.equal((await post(rep(A))).status, 200);
  assert.equal((await post(rep(X))).status, 403);
  assert.equal((await h(new Request('https://x/api/tester', { method: 'POST', body: 'x'.repeat(T.TLIMITS.size + 1) }), { ip: '1.2.3.4' })).status, 413);
  const g = await h(new Request(`https://x/api/tester?id=${A}&b=r66`), { ip: '1.2.3.4' }); assert.equal(g.status, 200); assert.equal((await g.json()).mine.length, 1);
  assert.equal((await h(new Request(`https://x/api/tester?id=${X}&b=r66`), { ip: '1.2.3.4' })).status, 403);
});

test('each problem goes to the core it most likely belongs to (tools/tester-issues.mts)', async () => {
  const { coreOf } = await import('../../tools/tester-issues.mts');
  assert.equal(coreOf({ title: 'error', where: { game: 'memory' } }, null), 'play');
  assert.equal(coreOf({ title: 'x', where: {} }, { reports: [{ errors: ['boom @ roads.js:3'] }] }), 'world');
  assert.equal(coreOf({ title: 'x', where: {}, auto: 'slow', kind: 'auto' }, null), 'analytics-infra');
  assert.equal(coreOf({ title: 'button off the screen', where: { window: 'modal pad' } }, null), 'kid-ui');
});
test('a new issue only for a problem seen on the live build or the one before it (owner, 17 Oct AEDT)', async () => {
  const { recentEnough } = await import('../../tools/tester-issues.mts');
  assert.equal(recentEnough(['r69', 'r74'], 83), false, 'a device left on r69 to r74 files nothing new');
  assert.equal(recentEnough(['r74', 'r82'], 83), true); assert.equal(recentEnough(['r83'], 83), true);
  assert.equal(recentEnough([], 83), false); assert.equal(recentEnough(['?'], 83), false);
  assert.equal(recentEnough(['r40'], 0), true, 'no live build known: every problem as before');
});


test('a report retry with its client ID returns the receipt without counting another report', async () => {
  const S = mem(), body = rep(A, { clientId: 'a'.repeat(32) });
  const first = await T.addReport(S, LIVE, body, 1000, 'ip');
  const again = await T.addReport(S, LIVE, body, 2000, 'ip');
  assert.equal(again.rid, first.rid); assert.equal(again.k, first.k);
  const state = await T.deviceStatus(S, LIVE, A, 'r66', 3000); assert.equal(state.reports, 1);
});
test('Studio retains per-device progress, speed and autoplay choices and rejects invalid values', () => {
  const c = cleanLive({ releases: { tester: { on: true, policies: { [A]: { revert: 'keep', speed: 'x5', autoplay: false }, bad: { revert: 'keep' }, [B]: { revert: 'invalid', speed: 'x99', autoplay: 'yes' } } } } });
  assert.deepEqual(c.releases.tester.policies, { [A]: { revert: 'keep', speed: 'x5', autoplay: false } });
});


test('tester summary uses the Sydney day across the UTC date boundary', () => {
 const now = Date.parse('2026-10-13T22:30:00Z');
 const result = T.summary([{ firstAt:Date.parse('2026-10-13T22:00:00Z'), lastAt:now, devices:1, n:1, status:'new', title:'x' }], now);
 assert.equal(result.day,'2026-10-14'); assert.equal(result.new,1); assert.equal(result.open,1);
});

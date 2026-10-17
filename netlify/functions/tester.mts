// Tester reports (owner, 12 Oct 2026 AEDT; netlify/lib/tester.mts). POST /api/tester: a tester device sends a report,
// or says it accepted the agreement or that a fixed problem stayed fixed; GET /api/tester?id=&b=: its reports' status
// (the fixed tick, the retest, the rewards, the open problems for "already reported"). Only devices the Releases
// switch `tester` covers are heard (PRIV-016); a connection may send 150 reports a day, a device 60 (PRIV-014).
import { addReport, deviceStatus, deviceSays, TLIMITS } from '../lib/tester.mts';
import { readLive } from '../lib/live.mts';
import { ipOf, ipKey, count } from '../lib/guard.mts';

const store = name => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
export const TESTER_LIMIT = 120, TESTER_WINDOW = 10 * 60e3; // requests a connection in 10 minutes
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
export const makeTester = ({ testerStore = store('testers'), liveStore = store('live'), guardStore = store('guard'), now = () => Date.now() } = {}) => async (req, ctx) => {
  const G = await guardStore(), ip = await ipKey(G, ipOf(req, ctx));
  if (!await count(G, 'tester/' + ip, TESTER_LIMIT, TESTER_WINDOW, now())) return new Response('', { status: 429, headers: { 'Retry-After': '600' } });
  const live = await readLive(await liveStore()).catch(() => ({ releases: {} })), S = await testerStore();
  if (req.method === 'GET') {
    const u = new URL(req.url), st = await deviceStatus(S, live, u.searchParams.get('id') || '', u.searchParams.get('b') || '', now());
    return st ? json(st) : json({ error: 'not a tester' }, 403);
  }
  if (req.method !== 'POST') return new Response('', { status: 405 });
  const text = await req.text(); if (text.length > TLIMITS.size) return new Response('', { status: 413 });
  let body = null; try { body = JSON.parse(text); } catch (e) { return new Response('', { status: 400 }); }
  if (body && (body.accepted === true || body.k)) return (await deviceSays(S, live, body, now())) ? new Response(null, { status: 204 }) : json({ error: 'not a tester' }, 403);
  const r = await addReport(S, live, body, now(), ip);
  return r.ok ? json(r) : json({ error: r.error }, r.status || 400);
};
export default makeTester();
export const config = { path: '/api/tester' };

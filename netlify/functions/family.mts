// A family photo for the family's own devices (round R privacy, 9 Oct): GET /api/family/<name> with the header
// "x-family-code" (typed once on the device: Grown-ups → Children → Family photos). Without the right code there is no
// photo; ten wrong codes from one connection lock it out for 15 minutes; each connection may ask 300 times in 10
// minutes. The answer is "private, no-store": no shared cache keeps it (the game keeps its own copy, sw.js never does).
import { NAME, get, checkCode } from '../lib/family.mts';
import { ipOf, ipKey, count, locked, failed } from '../lib/guard.mts';

const famBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'family-photos', consistency: 'strong' }));
const guardBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'guard', consistency: 'strong' }));
const no = (status, msg) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store' } });
export const makeFamily = ({ familyStore = famBlobs, guardStore = guardBlobs, now = () => Date.now() } = {}) => async (req, ctx) => {
  if (req.method !== 'GET') return no(405, '');
  const name = decodeURIComponent(new URL(req.url).pathname.split('/').pop() || ''); if (!NAME.test(name)) return no(404, 'not found');
  const G = await guardStore(), k = 'fam/' + await ipKey(G, ipOf(req, ctx)), t = now();
  if (await locked(G, [k], t)) return no(429, 'Too many wrong codes: wait 15 minutes.');
  if (!await count(G, k, 300, 10 * 60e3, t)) return no(429, 'Too many requests: wait a few minutes.');
  const F = await familyStore();
  if (!await checkCode(F, req.headers.get('x-family-code'))) { await failed(G, [k], t); return no(401, 'family code needed'); }
  const b = await get(F, name); if (!b) return no(404, 'not found');
  return new Response(b, { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'x-family-code' } });
};
export default makeFamily();
export const config = { path: '/api/family/*' };

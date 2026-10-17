// A device saying hello (js/players.js): counted in the players report, anonymously (netlify/lib/players.mts).
// (round R privacy, 9 Oct) Each connection may say hello 60 times in 10 minutes (a home's devices share one: each says
// "still here" every two minutes while playing); more is refused (429) and the device keeps its outbox for later.
import { hello } from '../lib/players.mts';
import { ipOf, ipKey, count } from '../lib/guard.mts';

const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'players', consistency: 'strong' }));
const guardBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'guard', consistency: 'strong' }));
export const HELLO_LIMIT = 60, HELLO_WINDOW = 10 * 60e3;
export const makeHello = ({ playersStore = blobs, guardStore = guardBlobs, now = () => Date.now() } = {}) => async (req, ctx) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  const G = await guardStore(), ip = await ipKey(G, ipOf(req, ctx));
  if (!await count(G, 'hello/' + ip, HELLO_LIMIT, HELLO_WINDOW, now())) return new Response('', { status: 429, headers: { 'Retry-After': '600' } });
  const text = await req.text(); if (text.length > 60000) return new Response('', { status: 413 });
  let body = null; try { body = JSON.parse(text); } catch (e) { return new Response('', { status: 400 }); }
  // roughly where (town, state, country) from the connection, worked out by Netlify; the address itself is never kept
  const g = (ctx && ctx.geo) || {}, where = { city: g.city || '', region: (g.subdivision && (g.subdivision.code || g.subdivision.name)) || '', country: (g.country && g.country.code) || '' };
  const ok = await hello(await playersStore(), body, Date.now(), where, { ip }).catch(() => false);
  return new Response(null, { status: ok ? 204 : 400 });
};
export default makeHello();
export const config = { path: '/api/hello' };

import { familyAction } from '../lib/family-devices.mjs';
import { ipOf, ipKey, count } from '../lib/guard.mjs';
const blobs = name => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
export const makeFamilyDevices = ({ familyStore = blobs('families'), guardStore = blobs('guard'), now = () => Date.now() } = {}) => async (req, ctx) => {
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const action = new URL(req.url).pathname.split('/').pop();
  const guard = await guardStore(), ip = await ipKey(guard, ipOf(req, ctx));
  if (!await count(guard, 'family-devices/' + ip, ['create', 'join', 'recover'].includes(action) ? 10 : 150, 10 * 60e3, now())) return json({ error: 'wait before trying again' }, 429);
  const data = await req.text(); if (data.length > 28000000) return json({ error: 'backup too large' }, 413);
  try { const body = JSON.parse(data || '{}'); const token = (req.headers.get('authorization') || '').replace(/^Bearer /, ''); return json(await familyAction(await familyStore(), action, body, token, now())); }
  catch (e) { return json({ error: e.status ? e.message : 'request could not be completed' }, e.status || 400); }
};
export default makeFamilyDevices();
export const config = { path: '/api/family-devices/*' };

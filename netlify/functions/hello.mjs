// A device saying hello (js/players.js): counted in the players report, anonymously (netlify/lib/players.mjs).
import { hello } from '../lib/players.mjs';

const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'players', consistency: 'strong' }));
export const makeHello = ({ playersStore = blobs } = {}) => async req => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  const text = await req.text(); if (text.length > 12000) return new Response('', { status: 413 });
  let body = null; try { body = JSON.parse(text); } catch (e) { return new Response('', { status: 400 }); }
  const ok = await hello(await playersStore(), body).catch(() => false);
  return new Response(null, { status: ok ? 204 : 400 });
};
export default makeHello();
export const config = { path: '/api/hello' };

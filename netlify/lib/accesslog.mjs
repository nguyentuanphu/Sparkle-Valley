// Studio's access log (round R privacy, 9 Oct): who signed in (or tried to), from which town and country (Netlify's
// geo; the connection's address is never kept), and every time the players report (Analytics) was opened.
// Kept in Netlify Blobs (store "studio-log"), e/<time>-<random> = { at, who, role, what, where }; Studio → Setup →
// Access log lists the last 200, and only the newest 1,000 are kept.
import { randomBytes } from 'crypto';

const clean = (s, n) => String(s || '').normalize('NFC').replace(/[^\p{L}\p{N} .:@+_'-]/gu, '').slice(0, n);
export const whereOf = ctx => { const g = (ctx && ctx.geo) || {}; return [clean(g.city, 40), clean(g.country && (g.country.code || g.country.name), 40)].filter(Boolean).join(', '); };
export async function add(S, { who, role = '', what, ctx, note = '' }, now = Date.now()) {
  const at = new Date(now).toISOString();
  try { await S.setJSON(`e/${at}-${randomBytes(3).toString('hex')}`, { at, who: clean(who, 64) || '?', role: clean(role, 12), what: clean(what, 24), where: whereOf(ctx), ...(note ? { note: clean(note, 80) } : {}) }); } catch (e) { }
}
export async function list(S, n = 200, keep = 1000) {
  let keys = [], cursor; do { const r = await S.list({ prefix: 'e/', ...(cursor ? { cursor } : {}) }); keys.push(...r.blobs.map(b => b.key)); cursor = r.cursor; } while (cursor && keys.length < 20000);
  keys.sort().reverse();
  for (const k of keys.slice(keep)) await S.delete(k).catch(() => { });
  const out = []; for (const k of keys.slice(0, n)) { const e = await S.get(k, { type: 'json' }).catch(() => null); if (e) out.push(e); }
  return out;
}

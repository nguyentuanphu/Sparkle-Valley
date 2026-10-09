// Guards for the website's public doors (round R privacy, 9 Oct): how often one connection may knock, and locking a
// door for 15 minutes after 10 wrong tries. Used by /api/hello, /api/family and Studio's sign-in.
// Kept in Netlify Blobs (store "guard"). The connection's address (IP) is never kept: only a keyed hash of it, made
// with a random salt that lives in the same store ("salt"), so the counters can't be turned back into addresses.
//   rl/<what>/<hash>   { t, n }            requests in the current window
//   f/<what>/<key>     { t, n, until }     wrong tries since t; until = locked until then
import { createHmac, randomBytes } from 'crypto';

export const LOCK_AFTER = 10, LOCK_MS = 15 * 60e3;
// the connection's address as Netlify gives it (context.ip), else its header
export const ipOf = (req, ctx) => String((ctx && ctx.ip) || req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown');
let SALT = null;
async function salt(S) {
  if (SALT) return SALT;
  let s = await S.get('salt'); if (!s) { s = randomBytes(24).toString('hex'); await S.set('salt', s); }
  return (SALT = String(s));
}
export const ipKey = async (S, ip) => createHmac('sha256', await salt(S)).update(String(ip)).digest('hex').slice(0, 24);
// one more request in a fixed window: true while within the limit
export async function count(S, key, limit, ms, now = Date.now()) {
  const k = 'rl/' + key, r = await S.get(k, { type: 'json' }).catch(() => null), o = r && now - r.t < ms ? r : { t: now, n: 0 };
  o.n++; await S.setJSON(k, o); return o.n <= limit;
}
// minutes left on a lock (0: open). keys like 'ip/<hash>', 'acct/<name>'
export async function locked(S, keys, now = Date.now()) {
  for (const k of keys) { const r = await S.get('f/' + k, { type: 'json' }).catch(() => null); if (r && r.until > now) return Math.ceil((r.until - now) / 60e3); }
  return 0;
}
// a wrong try: 10 within 15 minutes locks for 15 minutes
export async function failed(S, keys, now = Date.now()) {
  for (const k of keys) {
    let r = await S.get('f/' + k, { type: 'json' }).catch(() => null);
    if (!r || (now - r.t > LOCK_MS && !(r.until > now))) r = { t: now, n: 0 };
    r.n++; if (r.n >= LOCK_AFTER) { r.until = now + LOCK_MS; r.n = 0; r.t = now + LOCK_MS; }
    await S.setJSON('f/' + k, r);
  }
}
export async function cleared(S, keys) { for (const k of keys) await S.delete('f/' + k).catch(() => { }); }
// old counters are thrown away now and then (a day after their window)
export async function tidy(S, now = Date.now()) {
  for (const pre of ['rl/', 'f/']) { try { const { blobs } = await S.list({ prefix: pre }); for (const b of blobs.slice(0, 2000)) { const r = await S.get(b.key, { type: 'json' }).catch(() => null); if (!r || (now - r.t > 864e5 && !(r.until > now))) await S.delete(b.key); } } catch (e) { } }
}

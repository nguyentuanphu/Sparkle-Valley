// Family photos are family-only (owner, 9 Oct, round R privacy): photo faces and Family album pictures are never
// public files. Sparkle Studio keeps them here, in Netlify Blobs (store "family-photos"), under random names
// (24+ letters, made with crypto), and content/custom.json names them "family:<name>", never by a path.
// The game asks /api/family/<name> (netlify/functions/family.mjs) with the family code a grown-up typed once on the
// device; without the right code nothing is given.
//   p/<name>   the photo (JPEG, base64)
//   code       the family code (unless FAMILY_CODE is set in Netlify's environment variables, which then wins)
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export const NAME = /^[\w-]{24,64}$/;
const env = k => ((globalThis.Netlify && globalThis.Netlify.env.get(k)) || process.env[k] || '').trim();
// a code is easy to type: 12 letters and digits without look-alikes (O/0, I/1), shown as ABCD-EFGH-JKMN
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40);
export const showCode = c => cleanCode(c).replace(/(.{4})(?=.)/g, '$1-');
export const makeCode = () => [...randomBytes(12)].map(b => ABC[b & 31]).join('');
export const newName = () => randomBytes(18).toString('base64url');

export async function put(S, name, buf) { if (!NAME.test(name || '')) throw new Error('bad name'); await S.set('p/' + name, Buffer.from(buf).toString('base64')); }
export async function get(S, name) { if (!NAME.test(name || '')) return null; const b = await S.get('p/' + name).catch(() => null); return b == null ? null : Buffer.from(String(b), 'base64'); }
export async function remove(S, name) { if (NAME.test(name || '')) await S.delete('p/' + name).catch(() => { }); }
// the family code (made the first time it is asked for)
export async function code(S) {
  const e = cleanCode(env('FAMILY_CODE')); if (e) return { code: showCode(e), fromEnv: true };
  let c = cleanCode(await S.get('code').catch(() => null)); if (!c) { c = makeCode(); await S.set('code', c); }
  return { code: showCode(c), fromEnv: false };
}
export async function newCode(S) {
  if (cleanCode(env('FAMILY_CODE'))) return { error: 'The family code is FAMILY_CODE in Netlify (Site configuration → Environment variables): change it there.' };
  const c = makeCode(); await S.set('code', c); return { code: showCode(c), fromEnv: false };
}
// the code a device sent, compared in constant time (a short code is never accepted)
export async function checkCode(S, given) {
  const g = cleanCode(given); if (g.length < 8) return false;
  const want = cleanCode(env('FAMILY_CODE')) || cleanCode(await S.get('code').catch(() => null)); if (!want) return false;
  const h = s => createHash('sha256').update('sv-family:' + s).digest();
  return timingSafeEqual(h(g), h(want));
}

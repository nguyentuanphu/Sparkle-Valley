// Studio admins (round O, owner: "let other admins in with their own account, without making more tokens"). The owner
// signs in with STUDIO_PASSWORD and adds people in Studio → Setup → 👥 Admins: a sign-in name, a password and what
// they may do. Everyone works through the website's own GitHub token, so nobody else needs one.
//   viewer   📊 Analytics only, and nothing can be changed
//   editor   every page and Publish, but not the admins list
//   owner    everything (the STUDIO_PASSWORD, or an admin the owner made an owner)
// Kept in Netlify Blobs (store "studio-admins"), a/<name> = { name, role, salt, hash, at, by }: the password itself is
// never kept, only a slow scrypt hash of it. A sign-in lasts 30 days; changing someone's password or removing them
// signs them out everywhere (their cookie carries part of the hash), and changing STUDIO_PASSWORD signs out everyone.
import crypto from 'crypto';

export const ROLES = ['viewer', 'editor', 'owner'];
export const NAME = /^[a-z0-9][a-z0-9._@+-]{1,59}$/;
const key = name => 'a/' + name;
const hashOf = (pw, salt) => crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 }).toString('base64url');
const secret = pw => crypto.createHash('sha256').update('sparkle-studio-admin:' + pw).digest();
const sigOf = (pw, a, exp) => crypto.createHmac('sha256', secret(pw)).update(`${a.name}|${exp}|${a.hash.slice(0, 16)}`).digest('base64url');
const same = (x, y) => typeof x === 'string' && typeof y === 'string' && x.length === y.length && crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y));
export const cleanName = n => String(n || '').trim().toLowerCase();

export async function list(S) {
  const { blobs } = await S.list({ prefix: 'a/' }), out = [];
  for (const b of blobs.slice(0, 200)) { const a = await S.get(b.key, { type: 'json' }); if (a) out.push({ name: a.name, role: a.role, at: a.at, by: a.by || '' }); }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
export async function get(S, name) { name = cleanName(name); return NAME.test(name) ? S.get(key(name), { type: 'json' }) : null; }
// add someone, or give them a new password and/or role
export async function put(S, { name, password, role }, by) {
  name = cleanName(name);
  if (!NAME.test(name)) return { error: 'A sign-in name has 2–60 letters, numbers or . _ @ + - (no spaces).' };
  if (!ROLES.includes(role)) role = 'viewer';
  const old = await get(S, name);
  if (!old && !password) return { error: 'Choose a password for them.' };
  if (password && String(password).length < 10) return { error: 'A password needs at least 10 characters.' };
  const a = old || { name, at: new Date().toISOString(), by };
  a.role = role;
  if (password) { a.salt = crypto.randomBytes(16).toString('base64url'); a.hash = hashOf(password, a.salt); }
  await S.setJSON(key(name), a);
  return { ok: true };
}
export async function remove(S, name) { name = cleanName(name); if (NAME.test(name)) await S.delete(key(name)); return { ok: true }; }
// signing in with a name and password: the account, or null
export async function check(S, name, password) {
  const a = await get(S, name); if (!a || typeof password !== 'string') return null;
  return same(hashOf(password, a.salt), a.hash) ? a : null;
}
// the cookie: "a.<name>.<expiry>.<signature>"
export const makeCookie = (pw, a, days = 30) => { const exp = Date.now() + days * 864e5; return `a.${a.name}.${exp}.${sigOf(pw, a, exp)}`; };
export async function fromCookie(S, pw, c) {
  const m = /^a\.([a-z0-9._@+-]{2,60})\.(\d{10,16})\.([\w-]{20,})$/.exec(String(c || '')); if (!m || !(+m[2] > Date.now())) return null;
  const a = await get(S, m[1]); if (!a) return null;
  return same(sigOf(pw, a, m[2]), m[3]) ? a : null;
}
// what each role may reach: a viewer only reads the analytics (and what the dashboard needs to open)
export function allowed(role, api, post) {
  if (role === 'owner') return true;
  if (/^admins\//.test(api) && api !== 'admins/me') return false;
  // (audit, 9 Oct) putting code live (merging a pull request, bringing back an old deploy) stays with the owner
  if (role === 'editor') return !(post && ['github/merge', 'site/restore'].includes(api));
  if (post) return api === 'admins/me';
  return ['info', 'whoami', 'content', 'players', 'inbox'].includes(api);
}

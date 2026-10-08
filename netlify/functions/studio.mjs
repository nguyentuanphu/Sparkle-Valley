// Sparkle Studio online: the same dashboard as SparkleStudio.exe (studio/ui, served at /studio/) and the same
// engine (studio/core.cjs), on the game's own website, behind the grown-ups' password.
// The family's files are kept in GitHub: saves go to the "studio-draft" branch, Publish puts them live (main).
// Set these in Netlify → Site configuration → Environment variables (never in the code):
//   STUDIO_PASSWORD   the grown-ups' password (long, not used anywhere else)          required
//   GITHUB_TOKEN      fine-grained token: this repository only, Contents read and write  for saving
//   GITHUB_REPO       e.g. nguyentuanphu/Sparkle-Valley (the default)                    optional
//   AZURE_KEY, AZURE_REGION                            to make voices online             optional
//   NETLIFY_TOKEN                                      the Website page                  optional
import core from '../../studio/core.cjs';
import { report, inbox, setLabel } from '../lib/players.mjs';
import * as admins from '../lib/admins.mjs';
const { createStudio, githubStore, makeToken, checkToken, samePassword } = core;

const env = k => ((globalThis.Netlify && globalThis.Netlify.env.get(k)) || process.env[k] || '').trim();
const json = (o, status = 200, headers = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const cookieOf = (req, name) => { const m = new RegExp('(?:^|;\\s*)' + name + '=([^;]+)').exec(req.headers.get('cookie') || ''); return m ? decodeURIComponent(m[1]) : ''; };
const COOKIE = 'sv_studio';

// the players' store is Netlify Blobs on the website (tests hand in their own)
const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'players', consistency: 'strong' }));
const adminBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'studio-admins', consistency: 'strong' }));
export const makeStudio = ({ playersStore = blobs, adminStore = adminBlobs } = {}) => async req => {
  const url = new URL(req.url), p = url.pathname, pw = env('STUDIO_PASSWORD'), post = req.method === 'POST';
  if (!pw) return json({ error: 'The online Studio is not set up yet: add STUDIO_PASSWORD in Netlify (Site configuration → Environment variables), then deploy again.', setup: true }, 503);
  // signing in and out
  if (p === '/studio/api/login' && post) {
    const b = await req.json().catch(() => ({})), name = admins.cleanName(b.name);
    const cookie = v => ({ 'Set-Cookie': `${COOKIE}=${v}; Path=/studio; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict` });
    // no name (or "owner"): the owner's STUDIO_PASSWORD; a name: that admin's own password (round O)
    if (!name || name === 'owner') { if (samePassword(pw, b.password)) return json({ ok: true, role: 'owner' }, 200, cookie(makeToken(pw))); }
    else { const a = await admins.check(await adminStore(), name, b.password); if (a) return json({ ok: true, role: a.role }, 200, cookie(admins.makeCookie(pw, a))); }
    await new Promise(r => setTimeout(r, 1500)); // slow, so guessing takes forever
    return json({ error: name && name !== 'owner' ? 'That name and password don’t match.' : 'That is not the password.' }, 401);
  }
  if (p === '/studio/api/logout') return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/studio; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });
  // the exe asks for the players report with the password it keeps; the dashboard has the cookie
  const ck = cookieOf(req, COOKIE);
  let me = checkToken(pw, ck) || samePassword(pw, req.headers.get('x-studio-password') || undefined) ? { name: 'owner', role: 'owner' } : null;
  if (!me && ck.startsWith('a.')) { const a = await admins.fromCookie(await adminStore(), pw, ck).catch(() => null); if (a) me = { name: a.name, role: a.role }; }
  if (!me) return json({ error: 'Please sign in.', signin: true }, 401);
  if (post && req.headers.get('x-studio') !== '1') return json({ error: 'no' }, 403); // only the dashboard itself sends changes
  // what this admin may do (round O): a viewer reads the analytics only; only an owner manages the admins
  const route = p.startsWith('/studio/content/') ? 'file' : decodeURIComponent(p.slice('/studio/api/'.length));
  if (!admins.allowed(me.role, route.startsWith('file/') && !post ? 'info' : route, post)) return json({ error: me.role === 'viewer' ? 'Your account can look at the Analytics only.' : 'Only an owner can do that.' }, 403);
  if (p === '/studio/api/whoami') return json(me);
  if (p.startsWith('/studio/api/admins/')) {
    const S = await adminStore(), b = post ? await req.json().catch(() => ({})) : {};
    if (p === '/studio/api/admins/list') return json({ admins: await admins.list(S), me });
    if (p === '/studio/api/admins/save' && post) { if (admins.cleanName(b.name) === 'owner') return json({ error: '“owner” is kept for the STUDIO_PASSWORD.' }, 400); const r = await admins.put(S, b, me.name); return json(r, r.error ? 400 : 200); }
    if (p === '/studio/api/admins/remove' && post) return json(await admins.remove(S, b.name));
    // anyone changes their own password (the owner's is STUDIO_PASSWORD, changed in Netlify)
    if (p === '/studio/api/admins/me' && post) {
      if (me.name === 'owner') return json({ error: 'The owner’s password is STUDIO_PASSWORD: change it in Netlify (Site configuration → Environment variables).' }, 400);
      if (!await admins.check(S, me.name, b.old)) return json({ error: 'The old password is not right.' }, 401);
      const r = await admins.put(S, { name: me.name, password: b.password, role: me.role }, me.name); return json(r, r.error ? 400 : 200);
    }
    return json({ error: 'no' }, 404);
  }
  const players = async () => report(await playersStore());
  if (p === '/studio/api/players') return json(await players());
  if (p === '/studio/api/inbox') return json(await inbox(await playersStore()));
  // a name for a device in the play report ("Na's iPad"), round L
  if (p === '/studio/api/players/label' && post) { const b = await req.json().catch(() => ({})); return json({ ok: await setLabel(await playersStore(), b.id, b.label) }); }
  const conf = { azureKey: env('AZURE_KEY'), azureRegion: env('AZURE_REGION'), githubToken: env('GITHUB_TOKEN'), githubRepo: env('GITHUB_REPO') || 'nguyentuanphu/Sparkle-Valley', githubBranch: env('GITHUB_BRANCH') || 'main',
    netlifyToken: env('NETLIFY_TOKEN'), netlifySite: env('NETLIFY_SITE') || env('SITE_ID'), siteUrl: env('URL') };
  if (!conf.githubToken) return json({ error: 'Add GITHUB_TOKEN in Netlify (Site configuration → Environment variables) so the online Studio can read and save the family’s files.', setup: true }, 503);
  const store = githubStore({ token: conf.githubToken, repo: conf.githubRepo, branch: conf.githubBranch });
  const studio = createStudio({ store, conf, online: true, local: { players, inbox: async () => inbox(await playersStore()) } });
  // the game's modules on the Map and Voices pages fetch content/custom.json from the page's own address
  const api = p.startsWith('/studio/content/') ? 'file/' + p.slice(8) : decodeURIComponent(p.slice('/studio/api/'.length));
  try {
    const body = post ? Buffer.from(await req.arrayBuffer()) : null;
    if (body && body.length > 5.5e6) return json({ error: 'That is too big to send online (over 5 MB).' }, 413);
    const r = await studio.handle(api, req.method, body);
    if (api === 'info' && r.body && typeof r.body === 'object') r.body.me = me; // who is signed in, and what they may do
    if (post && r.code < 400) await store.flush('Sparkle Studio online: ' + api);
    if (r.raw) return new Response(r.raw, { status: r.code, headers: { 'Content-Type': r.type, 'Cache-Control': 'no-store' } });
    if (api === 'file/content/custom.json' && r.code === 404) return json({});
    return json(r.body, r.code);
  } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
};
export default makeStudio();
export const config = { path: ['/studio/api/*', '/studio/content/*'] };

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
const { createStudio, githubStore, makeToken, checkToken, samePassword } = core;

const env = k => ((globalThis.Netlify && globalThis.Netlify.env.get(k)) || process.env[k] || '').trim();
const json = (o, status = 200, headers = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const cookieOf = (req, name) => { const m = new RegExp('(?:^|;\\s*)' + name + '=([^;]+)').exec(req.headers.get('cookie') || ''); return m ? decodeURIComponent(m[1]) : ''; };
const COOKIE = 'sv_studio';

// the players' store is Netlify Blobs on the website (tests hand in their own)
const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'players', consistency: 'strong' }));
export const makeStudio = ({ playersStore = blobs } = {}) => async req => {
  const url = new URL(req.url), p = url.pathname, pw = env('STUDIO_PASSWORD'), post = req.method === 'POST';
  if (!pw) return json({ error: 'The online Studio is not set up yet: add STUDIO_PASSWORD in Netlify (Site configuration → Environment variables), then deploy again.', setup: true }, 503);
  // signing in and out
  if (p === '/studio/api/login' && post) {
    const b = await req.json().catch(() => ({}));
    if (!samePassword(pw, b.password)) { await new Promise(r => setTimeout(r, 1500)); return json({ error: 'That is not the password.' }, 401); } // slow, so guessing takes forever
    return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=${makeToken(pw)}; Path=/studio; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict` });
  }
  if (p === '/studio/api/logout') return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/studio; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });
  // the exe asks for the players report with the password it keeps; the dashboard has the cookie
  const signedIn = checkToken(pw, cookieOf(req, COOKIE)) || samePassword(pw, req.headers.get('x-studio-password') || undefined);
  if (!signedIn) return json({ error: 'Please sign in.', signin: true }, 401);
  if (post && req.headers.get('x-studio') !== '1') return json({ error: 'no' }, 403); // only the dashboard itself sends changes
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
    if (post && r.code < 400) await store.flush('Sparkle Studio online: ' + api);
    if (r.raw) return new Response(r.raw, { status: r.code, headers: { 'Content-Type': r.type, 'Cache-Control': 'no-store' } });
    if (api === 'file/content/custom.json' && r.code === 404) return json({});
    return json(r.body, r.code);
  } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
};
export default makeStudio();
export const config = { path: ['/studio/api/*', '/studio/content/*'] };

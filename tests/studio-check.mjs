// Sparkle Studio, both ways it runs, checked together (the exe and the online Studio must always be the same):
//   · a pretend GitHub (in memory) stands in for the real one, so nothing real is touched
//   · a pretend Netlify serves the site like Netlify does (netlify.toml's redirects, the two functions)
//   · SparkleStudio's own server (studio/studio.cjs) runs on a copy of a small game folder
// Then the dashboard is opened in both, on a desktop and a phone, and saving, publishing and the players report
// are tried for real.
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { start } from './harness.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------- a pretend GitHub: blobs, trees, commits and branches in memory ----------
export function fakeGitHub(repo, files) {
  const blobs = new Map(), trees = new Map(), commits = new Map(), refs = new Map(), log = [];
  const gitSha = b => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
  const id = () => crypto.randomBytes(20).toString('hex');
  const putTree = map => { const t = id(); trees.set(t, map); return t; };
  const putCommit = (tree, parents, message) => { const c = id(); commits.set(c, { tree, parents, message }); return c; };
  const ancestors = c => { const out = new Set(), todo = [c]; while (todo.length) { const x = todo.shift(); if (!x || out.has(x)) continue; out.add(x); todo.push(...commits.get(x).parents); } return out; }; // nearest first
  const first = new Map(); for (const [p, b] of Object.entries(files)) { const buf = Buffer.from(b); const s = gitSha(buf); blobs.set(s, buf); first.set(p, s); }
  refs.set('main', putCommit(putTree(first), [], 'start'));
  const R = `/repos/${repo}`;
  async function handle(method, url, body) {
    const u = new URL(url), p = decodeURIComponent(u.pathname); log.push(method + ' ' + p);
    const ok = j => ({ status: 200, j }), no = (status, message) => ({ status, j: { message } });
    if (!p.startsWith(R)) return no(404, 'Not Found');
    const q = p.slice(R.length); let m;
    if ((m = /^\/git\/ref\/heads\/(.+)$/.exec(q)) && method === 'GET') return refs.has(m[1]) ? ok({ object: { sha: refs.get(m[1]) } }) : no(404, 'Not Found');
    if ((m = /^\/compare\/(.+)\.\.\.(.+)$/.exec(q))) { const a = refs.get(m[1]) || m[1], b2 = refs.get(m[2]) || m[2], A = ancestors(a), B = ancestors(b2); const base = [...B].find(x => A.has(x)) || a; return ok({ ahead_by: [...B].filter(x => !A.has(x)).length, merge_base_commit: { sha: base } }); }
    if ((m = /^\/git\/commits\/(\w+)$/.exec(q)) && method === 'GET') { const c = commits.get(m[1]); return c ? ok({ sha: m[1], tree: { sha: c.tree } }) : no(404, 'No commit'); }
    if ((m = /^\/git\/trees\/([\w:/.-]+)$/.exec(q)) && method === 'GET') {
      const [tsha, sub] = m[1].split(':'), map = trees.get(tsha); if (!map) return no(404, 'No tree');
      const pre = sub ? sub + '/' : '', rec = u.searchParams.get('recursive'), out = [], dirs = new Set();
      for (const [path2, s] of map) { if (!path2.startsWith(pre)) continue; const rest = path2.slice(pre.length); if (rec || !rest.includes('/')) out.push({ path: rest, type: 'blob', sha: s }); else dirs.add(rest.split('/')[0]); }
      for (const d of dirs) out.push({ path: d, type: 'tree', sha: tsha + ':' + pre + d });
      return ok({ tree: out });
    }
    if ((m = /^\/contents\/(.+)$/.exec(q)) && method === 'GET') { // one file, or one folder (round K)
      const ref = u.searchParams.get('ref') || 'main', c = refs.get(ref) || ref, map = commits.has(c) && trees.get(commits.get(c).tree); if (!map) return no(404, 'No commit');
      const rel = m[1]; if (map.has(rel)) { const b = blobs.get(map.get(rel)); return ok({ type: 'file', name: rel.split('/').pop(), path: rel, sha: map.get(rel), size: b.length, encoding: 'base64', content: b.toString('base64') }); }
      const pre = rel + '/', out = new Map(); for (const [path2, s2] of map) if (path2.startsWith(pre)) { const rest = path2.slice(pre.length), n = rest.split('/')[0]; out.set(n, rest.includes('/') ? { type: 'dir', name: n, path: pre + n } : { type: 'file', name: n, path: path2, sha: s2 }); }
      return out.size ? ok([...out.values()]) : no(404, 'Not Found');
    }
    if ((m = /^\/git\/blobs\/(\w+)$/.exec(q))) return blobs.has(m[1]) ? ok({ content: blobs.get(m[1]).toString('base64') }) : no(404, 'No blob');
    if (q === '/git/blobs' && method === 'POST') { const buf = Buffer.from(body.content, 'base64'), s = gitSha(buf); blobs.set(s, buf); return ok({ sha: s }); }
    if (q === '/git/trees' && method === 'POST') {
      const base = body.base_tree ? trees.get(body.base_tree.split(':')[0]) : new Map(); if (!base) return no(422, 'bad base');
      const map = new Map(base); for (const e of body.tree) { if (e.sha === null) { if (!map.has(e.path)) return no(422, 'tree.sha is invalid'); map.delete(e.path); } else { if (!blobs.has(e.sha)) return no(422, 'no such blob'); map.set(e.path, e.sha); } }
      return ok({ sha: putTree(map) });
    }
    if (q === '/git/commits' && method === 'POST') return ok({ sha: putCommit(body.tree, body.parents, body.message) });
    if ((m = /^\/git\/refs\/heads\/(.+)$/.exec(q)) && method === 'PATCH') {
      if (!refs.has(m[1])) return no(422, 'Reference does not exist');
      if (!body.force && !ancestors(body.sha).has(refs.get(m[1]))) return no(422, 'Update is not a fast forward');
      refs.set(m[1], body.sha); return ok({ object: { sha: body.sha } });
    }
    if (q === '/git/refs' && method === 'POST') { const b2 = body.ref.replace('refs/heads/', ''); if (refs.has(b2)) return no(422, 'Reference already exists'); refs.set(b2, body.sha); return ok({ ref: body.ref }); }
    if (q.startsWith('/commits')) { const out = []; let c = refs.get(u.searchParams.get('sha') || 'main'); while (c && out.length < 8) { out.push({ sha: c, html_url: '#', commit: { message: commits.get(c).message, author: { date: new Date().toISOString() } } }); c = commits.get(c).parents[0]; } return ok(out); }
    if (q.startsWith('/pulls')) return ok([]);
    return no(404, 'Not Found: ' + q);
  }
  const fileAt = (branch, rel) => { const c = refs.get(branch); if (!c) return null; const s = trees.get(commits.get(c).tree).get(rel); return s ? blobs.get(s) : null; };
  const commitOnMain = (rel, buf, message) => { const c = refs.get('main'), map = new Map(trees.get(commits.get(c).tree)), b = Buffer.from(buf), s = gitSha(b); blobs.set(s, b); map.set(rel, s); refs.set('main', putCommit(putTree(map), [c], message)); };
  return { handle, refs, fileAt, commitOnMain, log, messageOf: c => commits.get(c).message };
}

// every fetch to api.github.com goes to the pretend GitHub (in this process)
export function routeGitHub(gh) {
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opt = {}) => {
    const u = String(url);
    if (!u.startsWith('https://api.github.com')) return real(url, opt);
    const r = await gh.handle(opt.method || 'GET', u, opt.body ? JSON.parse(opt.body) : null);
    return new Response(JSON.stringify(r.j), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  };
  return () => { globalThis.fetch = real; };
}

// Netlify Blobs, in memory
export function memoryBlobs() {
  const m = new Map();
  return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); },
    delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }), _m: m };
}

// ---------- a pretend Netlify: the site's files, netlify.toml's redirects and the two functions ----------
export async function fakeNetlify({ port, env, players }) {
  Object.assign(process.env, env);
  const { makeStudio } = await import(path.join(ROOT, 'netlify/functions/studio.mjs'));
  const { makeHello } = await import(path.join(ROOT, 'netlify/functions/hello.mjs'));
  const adminStore = memoryBlobs(), studio = makeStudio({ playersStore: async () => players, adminStore: async () => adminStore }), hello = makeHello({ playersStore: async () => players });
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`); let p = decodeURIComponent(url.pathname);
    const fn = p === '/api/hello' ? hello : (p.startsWith('/studio/api/') || p.startsWith('/studio/content/')) ? studio : null;
    if (fn) {
      const ch = []; for await (const c of req) ch.push(c);
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(ch) : undefined }), { geo: JSON.parse(req.headers['x-test-geo'] || '{}') }); // (Netlify gives the town from the connection; tests say it in a header)
      const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    if (p === '/studio' || p === '/studio/') p = '/studio/ui/index.html'; else if (p.startsWith('/studio/game/')) p = p.slice('/studio/game'.length); else if (p.startsWith('/studio/voices/')) p = p.slice('/studio'.length);
    const f = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return server;
}

// ---------- the whole check (called from run.mjs) ----------
export async function studioCheck(browser, open) {
  const ok = (c, m) => { if (!c) throw new Error(m); };
  const repo = 'family/sparkle', PW = 'a-long-test-password-123', NPORT = 8791, SPORT = 8792, site = `http://localhost:${NPORT}`;
  const seed = {}; for (const f of ['index.html', 'sw.js', 'js/main.js', 'js/i18n.js', 'js/build.js', 'js/packhash.js']) seed[f] = fs.readFileSync(path.join(ROOT, f));
  seed['content/custom.json'] = JSON.stringify({ message: { en: 'Hello', vi: 'Xin chào' } }); seed['voices/en/f/0000aaaa.mp3'] = 'x'; seed['voices/manifest.json'] = JSON.stringify({ version: 2, cast: { en: ['f'] }, voices: {}, lines: { '0000aaaa': 'f' }, langOf: { '0000aaaa': 'en' } }); // (like the real pack: it lists what is recorded)
  const gh = fakeGitHub(repo, seed), unroute = routeGitHub(gh), players = memoryBlobs();
  const net = await fakeNetlify({ port: NPORT, players, env: { STUDIO_PASSWORD: PW, GITHUB_TOKEN: 'test-token', GITHUB_REPO: repo, URL: site, AZURE_KEY: '', NETLIFY_TOKEN: '' } });
  // the exe's own server, on a copy of a small game folder, with its settings in a folder of its own
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-studio-')), game = path.join(tmp, 'game'), appdata = path.join(tmp, 'appdata');
  fs.cpSync(path.join(ROOT, 'js'), path.join(game, 'js'), { recursive: true }); // the game's code (the pages read it)
  for (const f of Object.keys(seed)) { fs.mkdirSync(path.dirname(path.join(game, f)), { recursive: true }); fs.writeFileSync(path.join(game, f), seed[f]); }
  fs.mkdirSync(path.join(appdata, 'SparkleStudio'), { recursive: true }); fs.writeFileSync(path.join(appdata, 'SparkleStudio', 'settings.json'), JSON.stringify({ gameDir: game, siteUrl: site, studioPassword: PW, githubToken: 'test-token', githubRepo: repo }));
  // the exe is its own process: it reaches the same pretend GitHub over http (STUDIO_GITHUB_API, tests only)
  const GPORT = 8793, ghNet = http.createServer((req, res) => { let d = ''; req.on('data', c => d += c); req.on('end', async () => { const r = await gh.handle(req.method, 'https://api.github.com' + req.url, d ? JSON.parse(d) : null); res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r.j)); }); });
  await new Promise(r => ghNet.listen(GPORT, '127.0.0.1', r));
  const exe = spawn(process.execPath, [path.join(ROOT, 'studio/studio.cjs')], { env: { ...process.env, APPDATA: appdata, STUDIO_PORT: String(SPORT), STUDIO_NO_OPEN: '1', STUDIO_GITHUB_API: `http://127.0.0.1:${GPORT}` }, stdio: 'ignore' });
  const notes = [];
  try {
    for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${SPORT}/studio/api/ping`)).ok) break; } catch (e) { } await new Promise(r => setTimeout(r, 200)); }
    const call = async (p, { body, cookie, headers = {} } = {}) => { const r = await fetch(site + p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, j: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
    // 1. the password
    ok((await call('/studio/api/info')).status === 401, 'online Studio answered without signing in');
    ok((await call('/studio/api/login', { body: { password: 'wrong' } })).status === 401, 'a wrong password was let in');
    const li = await call('/studio/api/login', { body: { password: PW } }); ok(li.status === 200 && /^sv_studio=/.test(li.cookie), 'signing in failed');
    const C = li.cookie, X = { 'X-Studio': '1' };
    // 1b. other admins with their own accounts (round O): the owner adds them; a viewer only reads the analytics,
    // an editor can change things but not the admins; a new password or removing them signs them out
    { const add = (name, password, role) => call('/studio/api/admins/save', { body: { name, password, role }, cookie: C, headers: X });
      ok((await add('ba.nam', 'short', 'viewer')).status === 400, 'a short admin password was accepted');
      ok((await add('ba.nam', 'viewer-password-1', 'viewer')).status === 200 && (await add('co.lan', 'editor-password-1', 'editor')).status === 200, 'the owner could not add admins');
      ok((await call('/studio/api/login', { body: { name: 'ba.nam', password: 'nope-nope-nope' } })).status === 401, 'a wrong admin password was let in');
      const v = await call('/studio/api/login', { body: { name: 'Ba.Nam', password: 'viewer-password-1' } }); ok(v.status === 200 && /^sv_studio=a\./.test(v.cookie), 'a viewer could not sign in');
      const vi = await call('/studio/api/info', { cookie: v.cookie }); ok(vi.status === 200 && vi.j && vi.j.me && vi.j.me.role === 'viewer', 'info does not say who is signed in: ' + JSON.stringify(vi.j && vi.j.me));
      ok((await call('/studio/api/players', { cookie: v.cookie })).status === 200, 'a viewer could not read the analytics');
      ok((await call('/studio/api/content', { body: { message: { en: 'x' } }, cookie: v.cookie, headers: X })).status === 403, 'a viewer could change the content');
      ok((await call('/studio/api/admins/list', { cookie: v.cookie })).status === 403, 'a viewer could see the admins');
      const e = await call('/studio/api/login', { body: { name: 'co.lan', password: 'editor-password-1' } });
      ok((await call('/studio/api/admins/save', { body: { name: 'x.y', password: 'editor-password-2', role: 'owner' }, cookie: e.cookie, headers: X })).status === 403, 'an editor could add admins');
      ok((await call('/studio/api/admins/me', { body: { old: 'editor-password-1', password: 'editor-password-2' }, cookie: e.cookie, headers: X })).status === 200, 'an editor could not change their own password');
      ok((await call('/studio/api/info', { cookie: e.cookie })).status === 401, 'the old sign-in still worked after the password changed');
      ok(!JSON.stringify([...adminStore._m.values()]).includes('viewer-password-1'), 'an admin password was kept as it is');
      await call('/studio/api/admins/remove', { body: { name: 'ba.nam' }, cookie: C, headers: X });
      ok((await call('/studio/api/players', { cookie: v.cookie })).status === 401, 'a removed admin could still read');
      notes.push('admins: viewer reads analytics only, editor cannot manage admins, password change and removal sign out'); }
    // 1c. online now (round O): "still here" from a device shows it playing in the Analytics, "gone" shows it offline
    { const live = on => fetch(site + '/api/hello', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'livetest0001', live: on, kid: 'Na' }) });
      ok((await live(1)).status === 204, 'a live hello was refused');
      let r = (await call('/studio/api/players', { cookie: C })).j, d = (r.devices || []).find(x => x.id === 'livetest0001');
      ok(r.onlineNow >= 1 && d && d.online && d.playingNow === 'Na', 'a device playing now is not shown online: ' + JSON.stringify(d));
      await live(0); r = (await call('/studio/api/players', { cookie: C })).j; d = (r.devices || []).find(x => x.id === 'livetest0001');
      ok(d && !d.online && d.seenAt, 'a device that left still shows online: ' + JSON.stringify(d));
      notes.push('online now: 🟢 while playing (with the child), ⚪ after leaving'); }
    const info = await call('/studio/api/info', { cookie: C }); ok(info.j && info.j.ok && info.j.online && info.j.voices === 1, 'online info: ' + JSON.stringify(info.j));
    // round K: changing page online is quick: the status and the family's content take a few small GitHub calls, never the list of every file
    { gh.log.length = 0; await call('/studio/api/info', { cookie: C }); await call('/studio/api/content', { cookie: C }); const calls = gh.log.slice();
      ok(!calls.some(c => /\/git\/trees\//.test(c)) && calls.length <= 6, 'a page change online asked GitHub ' + calls.length + ' times: ' + calls.join(', ')); notes.push(`a page change online: ${calls.length} small GitHub calls`); }
    // 2. saving goes to the draft, never straight to the live branch
    ok((await call('/studio/api/content', { cookie: C, body: { message: { en: 'x', vi: 'x' } } })).status === 403, 'a change without the Studio header was taken');
    ok((await call('/studio/api/content', { cookie: C, headers: X, body: { message: { en: 'Hi from online', vi: 'Chào từ trên mạng' } } })).status === 200, 'saving online failed');
    ok(gh.refs.has('studio-draft') && /Hello/.test(gh.fileAt('main', 'content/custom.json')) && /online/.test(gh.fileAt('studio-draft', 'content/custom.json')), 'the save did not go to the draft');
    ok(/online/.test((await call('/studio/api/content', { cookie: C })).j.message.en), 'the draft was not read back');
    const face = await call('/studio/api/face', { cookie: C, headers: X, body: { id: 'Bà Năm', dataUrl: 'data:image/jpeg;base64,' + Buffer.from('JPEG').toString('base64') } });
    ok(face.j && face.j.photo === 'content/faces/ba-nam.jpg', 'face upload: ' + JSON.stringify(face.j));
    ok((await fetch(site + '/studio/api/file/content/faces/ba-nam.jpg', { headers: { cookie: C } })).ok, 'the face photo could not be shown');
    // a family album photo (Studio → Family album) goes to content/album/ in the draft too
    const alb = await call('/studio/api/albumphoto', { cookie: C, headers: X, body: { id: 'f1', dataUrl: 'data:image/jpeg;base64,' + Buffer.from('JPEG').toString('base64') } });
    ok(alb.j && /^content\/album\/f1-[a-z0-9]+\.jpg$/.test(alb.j.photo), 'album photo upload: ' + JSON.stringify(alb.j));
    ok((await call('/studio/api/albumphoto', { cookie: C, headers: X, body: { id: 'f2', dataUrl: 'data:image/png;base64,AAAA' } })).status === 400, 'a PNG was taken as an album photo');
    ok((await call('/studio/api/info', { cookie: C })).j.unpublished, 'saved changes not shown as waiting');
    // 3. meanwhile the exe publishes something else to the live branch: Publish online must keep it
    gh.commitOnMain('content/ads/sign.jpg', 'AD', 'Family update from Sparkle Studio (1 files)');
    const pub = await call('/studio/api/github/publish', { cookie: C, headers: X, body: { message: 'From the test' } });
    ok(pub.j && pub.j.end && pub.j.result.changed === 3, 'publish: ' + JSON.stringify(pub.j));
    ok(/online/.test(gh.fileAt('main', 'content/custom.json')) && gh.fileAt('main', 'content/faces/ba-nam.jpg') && gh.fileAt('main', 'content/ads/sign.jpg') && gh.fileAt('main', alb.j.photo), 'publish lost a file');
    ok(gh.refs.get('studio-draft') === gh.refs.get('main') && !(await call('/studio/api/info', { cookie: C })).j.unpublished, 'the draft did not start again after publishing');
    ok((await call('/studio/api/github/publish', { cookie: C, headers: X, body: {} })).j.result.changed === 0, 'a second publish found changes');
    // only the family's files can change online
    ok((await call('/studio/api/voices/extra', { cookie: C, headers: X, body: { lines: [{ lang: 'vi', text: 'Một câu mới' }] } })).j.added === 1, 'adding a voice line failed');
    notes.push('online: password, draft, publish (keeps the exe\'s change)');
    // 4. players: devices say hello, the report counts them
    const hi = (b2) => fetch(site + '/api/hello', { method: 'POST', body: JSON.stringify(b2) }).then(r => r.status);
    ok(await hi({ id: 'aaaaaaaaaaaa', b: 'r37', l: 'vi', k: 2, m: 10, g: { caro: 2 }, t: 1, d: 'phone', a: true }) === 204, 'hello not taken');
    await hi({ id: 'aaaaaaaaaaaa', b: 'r37', l: 'vi', k: 2, m: 5, g: { caro: 1, oanquan: 1 }, d: 'phone' });
    await hi({ id: 'bbbbbbbbbbbb', b: 'r36', l: 'en', k: 1, m: 3, d: 'computer' });
    ok(await hi({ id: 'BAD id!', m: 3 }) === 400 && await hi({ id: 'cccccccccccc', name: 'Lan', m: 4 }) === 204, 'odd hellos handled wrongly');
    ok(![...players._m.values()].some(v => /Lan/.test(v)), 'a name was kept');
    const rep = await call('/studio/api/players', { cookie: C });
    ok(rep.j && rep.j.today.devices === 3 && rep.j.today.mins === 22 && rep.j.games[0][0] === 'caro' && rep.j.games[0][1] === 3 && rep.j.allTime === 3 && rep.j.langs.vi === 1, 'players report: ' + JSON.stringify(rep.j && rep.j.today));
    ok((await call('/studio/api/players', { headers: { 'X-Studio-Password': 'nope' } })).status === 401, 'the report was given without the password');
    // the missing lines inbox: devices send lines they had to say with the machine voice
    await hi({ id: 'aaaaaaaaaaaa', b: 'r37', l: 'vi', m: 1, v: [['vi', 'Chào con, con khỏe không?'], ['en', 'A brand new line!'], ['xx', 'bad'], ['vi', '<script>']] });
    await hi({ id: 'bbbbbbbbbbbb', b: 'r37', l: 'en', m: 1, v: [['en', 'A brand new line!']] });
    const inb = (await call('/studio/api/inbox', { cookie: C })).j;
    ok(Array.isArray(inb) && inb.length === 2 && inb[0].text === 'A brand new line!' && inb[0].n === 2, 'inbox: ' + JSON.stringify(inb));
    notes.push('players: 3 devices counted, nothing personal kept; inbox has 2 lines');
    // round L: a device with one child's day: name, games (started, won, left), places, stories, hours, errors, stuck, smoothness; the town from the connection
    { const today = new Date().toISOString().slice(0, 10);
      const st = await fetch(site + '/api/hello', { method: 'POST', headers: { 'x-test-geo': JSON.stringify({ city: 'Brisbane', subdivision: { code: 'QLD' }, country: { code: 'AU' } }) }, body: JSON.stringify({ id: 'dddddddddddd', b: 'r43', l: 'en', k: 1, d: 'tablet', a: true, os: 'iPadOS', br: 'Safari', sc: '820x1180',
        days: [{ d: today, m: 12, g: { caro: 2 }, t: 1, o: 0, h: { 9: 12 }, c: { p1: { n: 'Na', a: 'little', m: 12, sm: 2, t: 1, g: { caro: [6, 1, 5] }, p: { village: 2 } }, 'bad key!': { n: '<b>x</b>' } }, e: { 'x is not defined @ main.js:10': 2, '<script>': 1 }, s: { 'village (3, 4)': 3 }, q: { caro: 5 }, f: [1200, 60, 50] }] }) }).then(r => r.status);
      ok(st === 204, 'a rich hello was not taken: ' + st);
      ok((await call('/studio/api/players/label', { cookie: C, headers: X, body: { id: 'dddddddddddd', label: 'Na’s iPad' } })).status === 200, 'naming a device failed');
      const R = (await call('/studio/api/players', { cookie: C })).j, dv = (R.devices || []).find(x => x.id === 'dddddddddddd') || {}, kid = (dv.kids || [])[0] || {};
      ok(dv.label === 'Na’s iPad' && dv.os === 'iPadOS' && dv.br === 'Safari' && dv.loc && dv.loc.city === 'Brisbane' && dv.loc.country === 'AU' && dv.kids.length === 1 && kid.name === 'Na' && kid.age === 'little' && kid.games[0][0] === 'caro' && kid.games[0][3] === 5 && kid.places[0][0] === 'village' && dv.fps === 20 && dv.errors === 2 && dv.stuck === 3, 'device report: ' + JSON.stringify(dv));
      ok(R.hours[9] >= 12 && R.places[0][0] === 'village' && R.problems.errors.length === 1 && R.problems.stuck[0][1] === 3 && R.problems.quits[0][0] === 'caro' && R.locations['Brisbane, QLD, AU'] === 1 && R.os.iPadOS === 1 && R.tips.length >= 3, 'report for everyone: ' + JSON.stringify({ hours: R.hours, places: R.places, problems: R.problems, loc: R.locations, tips: R.tips }));
      ok(![...players._m.values()].some(v => /<b>|<script>|127\.0\.0\.1/.test(v)), 'something odd was kept');
      notes.push(`report per device and child: name, games, places, town, system and browser, errors, stuck spots, ${R.tips.length} suggestions`); }
    // 4b. offline play is not lost, and a send whose answer was lost is counted once
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });
      await ctx.addInitScript(() => { window.__svHelloTest = 'manual'; localStorage.setItem('sv2_settings', JSON.stringify({ lang: 'vi', voice: false, sound: false, music: false, quality: 'low' })); });
      const pg = await ctx.newPage(); await pg.goto(site + '/'); await start(pg);
      const ymd = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const today = ymd(Date.now()), yday = ymd(Date.now() - 864e5);
      await ctx.setOffline(true);
      const off = await pg.evaluate(async ([today, yday]) => { const P = await import('/js/players.js'); P.countPlay('game', 'caro'); P.countPlay('tale');
        const o = JSON.parse(localStorage.getItem('sv2_hello_out')); o.days[today].m = 12; o.days[yday] = { m: 20, g: { oanquan: 1 }, t: 0, o: 0 }; localStorage.setItem('sv2_hello_out', JSON.stringify(o));
        const sent = await P.flush(false); return { sent, out: JSON.parse(localStorage.getItem('sv2_hello_out')), me: localStorage.getItem('sv2_playerid') }; }, [today, yday]);
      ok(!off.sent && off.out.pending && off.out.pending.days.length === 2, 'offline: the outbox did not keep the play: ' + JSON.stringify(off));
      const before = players._m.size;
      await ctx.setOffline(false);
      const on = await pg.evaluate(async () => { const P = await import('/js/players.js'); const sent = await P.flush(false); return { sent, out: JSON.parse(localStorage.getItem('sv2_hello_out')), me: localStorage.getItem('sv2_playerid') }; });
      const rec = d => JSON.parse(players._m.get(`d/${d}/${on.me}`) || 'null');
      ok(players._m.size > before && on.sent && !on.out.pending && rec(yday) && rec(yday).mins === 20 && rec(yday).games.oanquan === 1 && rec(today).mins === 12 && rec(today).games.caro === 1 && rec(today).tales === 1, 'back online: the waiting play was not counted on its own days: ' + JSON.stringify({ on, y: rec(yday), t: rec(today) }));
      // the website gets it but the answer is lost: the device keeps the batch and sends the same one again
      await pg.route('**/api/hello', async route => { await route.fetch(); await route.fulfill({ status: 500, body: '' }); });
      const lost = await pg.evaluate(async today => { const P = await import('/js/players.js'); const o = JSON.parse(localStorage.getItem('sv2_hello_out')); o.days[today] = { m: 5, g: {}, t: 0, o: 0 }; localStorage.setItem('sv2_hello_out', JSON.stringify(o)); return { sent: await P.flush(false), out: JSON.parse(localStorage.getItem('sv2_hello_out')) }; }, today);
      ok(!lost.sent && lost.out.pending && rec(today).mins === 17, 'lost answer: ' + JSON.stringify({ lost, t: rec(today) }));
      await pg.unroute('**/api/hello');
      const again = await pg.evaluate(async () => { const P = await import('/js/players.js'); return { sent: await P.flush(false), out: JSON.parse(localStorage.getItem('sv2_hello_out')) }; });
      ok(again.sent && !again.out.pending && rec(today).mins === 17, 'the same batch was counted twice: ' + JSON.stringify({ again, t: rec(today) }));
      await ctx.close();
      notes.push('offline play waits in an outbox and is counted on its own days; a re-sent batch counts once');
    }
    // 5. the exe: same engine, its own folder; the players report through the website; the same version
    const ex = async (p, body) => { const r = await fetch(`http://localhost:${SPORT}/studio/api/` + p, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}); return { status: r.status, j: await r.json().catch(() => null) }; };
    const ei = await ex('info'); ok(ei.j && ei.j.ok && !ei.j.online && ei.j.studio === info.j.studio, 'exe info: ' + JSON.stringify(ei.j));
    ok((await ex('content', { message: { en: 'From the exe', vi: 'Từ máy' } })).status === 200 && /exe/.test(fs.readFileSync(path.join(game, 'content/custom.json'), 'utf8')), 'the exe did not save into its folder');
    ok(fs.readdirSync(path.join(game, 'content/old')).length === 1, 'the exe kept no backup of the old content');
    { const web = (await call('/studio/api/players', { cookie: C })).j, exeR = (await ex('players')).j; ok(exeR && exeR.today && exeR.today.devices === web.today.devices && web.today.devices >= 3, 'the exe could not show the players: ' + JSON.stringify({ exe: exeR && exeR.today, web: web.today })); }
    ok((await ex('voices/inbox')).j.length === 2, 'the exe could not see the inbox');
    const chk = (await ex('check')).j; ok(chk.some(x => x.ok && /the same here and online/.test(x.en)), 'the exe and online versions were not compared: ' + JSON.stringify(chk.map(x => x.en)));
    // the exe sends to GitHub in two steps (owner, round 30): 1. a draft (the website does not change), 2. Publish
    const job = async (p, body) => { const s0 = await ex(p, body); ok(s0.status === 200, p + ': ' + JSON.stringify(s0.j)); for (let i = 0; i < 100; i++) { const j = (await ex('job')).j; if (j && j.end) return j; await new Promise(r => setTimeout(r, 100)); } throw new Error(p + ' never finished'); };
    const d1 = await job('github/draft', { message: 'Draft from the exe' });
    ok(!d1.error && d1.result.changed >= 1 && d1.result.draft && /exe/.test(gh.fileAt('studio-draft', 'content/custom.json')) && !/exe/.test(gh.fileAt('main', 'content/custom.json')), 'the exe draft: ' + JSON.stringify(d1));
    ok((await ex('info')).j.unpublished, 'the exe did not show the draft as waiting');
    const p1 = await job('github/publish', { message: 'Publish from the exe' });
    ok(!p1.error && p1.result.changed >= 1 && /exe/.test(gh.fileAt('main', 'content/custom.json')) && gh.refs.get('studio-draft') === gh.refs.get('main') && gh.fileAt('main', 'content/faces/ba-nam.jpg'), 'the exe publish: ' + JSON.stringify(p1));
    ok((await job('github/draft', {})).result.changed === 0, 'a second exe draft found changes');
    notes.push('exe: saves to its folder with a backup, players via the website, same version; GitHub in two steps (draft, then Publish)');
    // 6. the dashboard in a browser: online (signed in) and in the exe, on a desktop and a phone
    const pages = ['home', 'message', 'players', 'publish', 'check', 'settings', 'photos'], bad = [];
    for (const [w, h, touch] of [[1180, 800, false], [390, 800, true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch }), errs = [];
      const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon|401|403/.test(m.text())) errs.push(m.text() + ' ' + (m.location().url || '')); });
      await pg.goto(site + '/studio'); await pg.waitForSelector('#pw', { timeout: 15000 }); await pg.fill('#pw', PW); await pg.click('#si button'); await pg.waitForSelector('#tabs button', { timeout: 15000 });
      // round K: five sections (a column on a computer, a bar at the bottom of a phone), each opening as cards
      const navOk = await pg.evaluate(touch => { const bs = [...document.querySelectorAll('#tabs button')], r = bs.map(b => b.getBoundingClientRect()); return bs.length === 5 && (touch ? r.every(x => x.bottom >= innerHeight - 2 - 40 && x.height >= 56) : r.every(x => x.left < 220)); }, touch);
      if (!navOk) bad.push(`online ${w}px: the five sections are not where they should be`);
      await pg.evaluate(() => document.querySelector('#tabs [data-k="family"]').click()); await pg.waitForTimeout(400);
      if (await pg.evaluate(() => document.querySelectorAll('#page .pcard').length) !== 6) bad.push(`online ${w}px: the Family section does not show its six cards`);
      for (const k of pages) { await pg.evaluate(k2 => { location.hash = k2; }, k); await pg.waitForTimeout(k === 'photos' ? 2500 : 900); const t = await pg.evaluate(() => document.querySelector('#page').innerText); if (await pg.evaluate(() => !!document.querySelector('#page .card.badtxt')) || !t.trim()) bad.push(`online ${w}px ${k}: ${t.slice(0, 80)}`);
        if (await pg.evaluate(() => document.scrollingElement.scrollWidth > innerWidth + 1)) bad.push(`online ${w}px ${k}: page scrolls sideways`); }
      ok(/3/.test(await pg.evaluate(() => (document.querySelector('#tabs [data-k="players"]').click(), new Promise(r => setTimeout(() => r(document.querySelector('#page').innerText), 1500))))), 'online players page');
      await pg.screenshot({ path: `out/studio-online-${w}.png` });
      const pe = await ctx.newPage(); pe.on('pageerror', e => errs.push('exe: ' + e.message));
      await pe.goto(`http://localhost:${SPORT}/`); // (sends you on to /studio/) await pe.waitForSelector('#tabs button', { timeout: 15000 });
      for (const k of pages) { await pe.evaluate(k2 => { location.hash = k2; }, k); await pe.waitForTimeout(900); const t = await pe.evaluate(() => document.querySelector('#page').innerText); if (await pe.evaluate(() => !!document.querySelector('#page .card.badtxt')) || !t.trim()) bad.push(`exe ${w}px ${k}: ${t.slice(0, 80)}`); }
      await pe.screenshot({ path: `out/studio-exe-${w}.png` });
      bad.push(...errs.map(e => `${w}px: ${e}`)); await ctx.close();
    }
    ok(!bad.length, bad.slice(0, 8).join(' · '));
    notes.push(`${pages.length} pages open online and in the exe, desktop and phone`);
    return notes.join('; ');
  } finally { exe.kill(); net.close(); ghNet.close(); unroute(); fs.rmSync(tmp, { recursive: true, force: true }); }
}

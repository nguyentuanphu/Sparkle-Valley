// Sparkle Studio: the grown-ups' dashboard for Sparkle Valley, running on the family's own computer.
// Double-click SparkleStudio.exe (or run `node studio/studio.cjs`): it starts a small private web server on this
// computer only (http://localhost:7777) and opens the dashboard in the browser. It edits the game folder it sits in
// (or the folder chosen in Settings):
//   · content/custom.json + content/faces/  the family's content pack (message, names, faces, stories, quiz, defaults)
//   · voices/                               the offline voice pack (new lines made with Azure, Piper or the microphone)
//   · photos/                               real photos of the landmarks (from Wikipedia/Commons, with credits)
//   · sparkle-valley-netlify.zip            the publish zip, and an optional one-click deploy to Netlify
// Publishing to GitHub sends only what the family changed (content, voices, photos); Netlify then updates the site.
// Keys (Azure, Netlify, GitHub) are kept only on this computer, in %APPDATA%\SparkleStudio\settings.json, never in the game.
'use strict';
const http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), vm = require('vm'), { spawn, execFile } = require('child_process');

let sea = null; try { sea = require('node:sea'); if (!sea.isSea()) sea = null; } catch (e) { sea = null; }
const UI_DIR = path.join(__dirname, 'ui');
const asset = name => { if (sea) { try { return Buffer.from(sea.getAsset(name)); } catch (e) { return null; } } const p = path.join(UI_DIR, name); return fs.existsSync(p) ? fs.readFileSync(p) : null; };

// ---------- settings (on this computer only) ----------
const CONF_DIR = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'SparkleStudio'), CONF = path.join(CONF_DIR, 'settings.json');
let conf = {}; try { conf = JSON.parse(fs.readFileSync(CONF, 'utf8')); } catch (e) { conf = {}; }
const saveConf = () => { fs.mkdirSync(CONF_DIR, { recursive: true }); fs.writeFileSync(CONF, JSON.stringify(conf, null, 1)); };
const isGame = d => d && fs.existsSync(path.join(d, 'index.html')) && fs.existsSync(path.join(d, 'js', 'main.js'));
function findGame() {
  const tries = [process.argv[2], conf.gameDir, path.dirname(process.execPath), process.cwd(), path.resolve(__dirname, '..')].filter(Boolean);
  for (const t of tries) for (const d of [t, path.dirname(t), path.dirname(path.dirname(t))]) if (isGame(d)) return path.resolve(d); // the folder, or one or two up (studio/dist/)
  return null;
}
let GAME = findGame();
const G = (...p) => path.join(GAME, ...p);
const safeJoin = (root, rel) => { const p = path.resolve(root, '.' + path.sep + decodeURIComponent(rel).replace(/^[\\/]+/, '')); const r = path.resolve(root); return p === r || p.startsWith(r + path.sep) ? p : null; };

// ---------- helpers ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip', '.toml': 'text/plain' };
const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const readBody = (req, max = 60e6) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { no(new Error('too big')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', no); });
const json = async req => JSON.parse((await readBody(req)).toString('utf8') || '{}');
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'face';

// ---------- the content pack ----------
const CONTENT = () => G('content', 'custom.json');
function readContent() { try { return JSON.parse(fs.readFileSync(CONTENT(), 'utf8')); } catch (e) { return {}; } }
function writeContent(obj) {
  fs.mkdirSync(G('content'), { recursive: true });
  if (fs.existsSync(CONTENT())) { const bdir = G('content', 'old'); fs.mkdirSync(bdir, { recursive: true }); fs.copyFileSync(CONTENT(), path.join(bdir, 'custom-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')); }
  fs.writeFileSync(CONTENT(), JSON.stringify(obj, null, 1));
}

// ---------- voices ----------
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
const AZ_VOICES = { en: { f: 'en-AU-NatashaNeural', m: 'en-AU-WilliamNeural' }, vi: { f: 'vi-VN-HoaiMyNeural', m: 'vi-VN-NamMinhNeural' }, zh: { m: 'zh-CN-YunxiNeural' }, hi: { m: 'hi-IN-MadhurNeural' } };
const LOCALE = { en: 'en-AU', vi: 'vi-VN', zh: 'zh-CN', hi: 'hi-IN' };
const MAN = () => G('voices', 'manifest.json');
function voicesHave() {
  const out = {};
  for (const [L, slots] of Object.entries(CAST)) { out[L] = {}; for (const s of slots) { const d = G('voices', L, s); out[L][s] = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []; } }
  return out;
}
let manCache = null, manTimer = null;
function manifest() { if (!manCache) { try { manCache = JSON.parse(fs.readFileSync(MAN(), 'utf8')); } catch (e) { manCache = { version: 2, engine: 'mixed', cast: CAST, voices: {}, lines: {}, langOf: {} }; } } return manCache; }
function addToManifest(lang, slot, hash) {
  const m = manifest(); m.lines = m.lines || {}; m.langOf = m.langOf || {}; m.cast = m.cast || CAST; m.voices = m.voices || {};
  if (!m.voices[lang]) m.voices[lang] = {}; if (!m.voices[lang][slot]) m.voices[lang][slot] = { id: AZ_VOICES[lang][slot], name: AZ_VOICES[lang][slot] };
  m.langOf[hash] = lang; m.lines[hash] = (m.lines[hash] || '').replace(slot, '') + slot; m.made = new Date().toISOString().slice(0, 10);
  clearTimeout(manTimer); manTimer = setTimeout(() => { fs.mkdirSync(G('voices'), { recursive: true }); fs.writeFileSync(MAN(), JSON.stringify(m)); }, 800);
}
const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function azureSay(lang, slot, text) {
  if (!conf.azureKey || !conf.azureRegion) throw new Error('Add your Azure Speech key and region in Settings first.');
  const v = (conf.voices && conf.voices[lang] && conf.voices[lang][slot]) || AZ_VOICES[lang][slot];
  const ssml = `<speak version='1.0' xml:lang='${LOCALE[lang]}'><voice name='${v}'>${xml(text)}</voice></speak>`;
  for (let a = 0; ; a++) {
    const r = await fetch(`https://${conf.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': conf.azureKey, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3', 'User-Agent': 'sparkle-studio' }, body: ssml });
    if (r.status === 401 || r.status === 403) throw new Error('Azure did not accept the key or region (' + r.status + '). Check them in Settings.');
    if ((r.status === 429 || r.status >= 500) && a < 6) { await new Promise(ok => setTimeout(ok, 4000 * (a + 1))); continue; }
    if (!r.ok) throw new Error('Azure ' + r.status + ': ' + (await r.text()).slice(0, 160));
    return Buffer.from(await r.arrayBuffer());
  }
}
// Piper: free voices that run on this computer, no internet (https://github.com/rhasspy/piper). The grown-up
// downloads piper.exe and a voice model (.onnx) per language and puts their paths in Settings.
let lame = null;
function lameLib() { if (lame) return lame; const src = asset('lame.min.js'); if (!src) throw new Error('The MP3 encoder is missing.'); const ctx = { console, Math, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Uint8Array, Array, ArrayBuffer }; ctx.window = ctx; ctx.self = ctx; vm.runInNewContext(src.toString('utf8'), ctx); lame = ctx.lamejs; return lame; }
function wavToMp3(buf) {
  // a plain 16-bit PCM WAV (what Piper writes) → MP3 32 kbps mono
  let p = 12, rate = 22050, ch = 1, data = null;
  while (p < buf.length - 8) { const id = buf.toString('ascii', p, p + 4), n = buf.readUInt32LE(p + 4); if (id === 'fmt ') { ch = buf.readUInt16LE(p + 10); rate = buf.readUInt32LE(p + 12); } if (id === 'data') { data = buf.subarray(p + 8, p + 8 + n); break; } p += 8 + n + (n & 1); }
  if (!data) throw new Error('Piper did not make a WAV file.');
  const L = lameLib(), samples = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.length / 2 / ch) * ch);
  const mono = ch === 1 ? samples : Int16Array.from({ length: samples.length / ch }, (_, i) => samples[i * ch]);
  const enc = new L.Mp3Encoder(1, rate, 32), out = [];
  for (let i = 0; i < mono.length; i += 1152) { const b = enc.encodeBuffer(mono.subarray(i, i + 1152)); if (b.length) out.push(Buffer.from(b)); }
  const e = enc.flush(); if (e.length) out.push(Buffer.from(e));
  return Buffer.concat(out);
}
function piperSay(lang, text) {
  const exe = conf.piperExe, model = conf.piperModels && conf.piperModels[lang];
  if (!exe || !fs.existsSync(exe)) return Promise.reject(new Error('Set the path to piper.exe in Settings first.'));
  if (!model || !fs.existsSync(model)) return Promise.reject(new Error(`Set a Piper voice model for ${lang} in Settings first.`));
  const tmp = path.join(os.tmpdir(), 'sparkle-piper-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.wav');
  return new Promise((ok, no) => {
    const p = spawn(exe, ['--model', model, '--output_file', tmp], { windowsHide: true }); let err = '';
    p.stderr.on('data', d => { err += d; }); p.on('error', no);
    p.on('close', code => { try { if (code !== 0 || !fs.existsSync(tmp)) return no(new Error('Piper stopped: ' + err.slice(-200))); const mp3 = wavToMp3(fs.readFileSync(tmp)); fs.unlinkSync(tmp); ok(mp3); } catch (e) { no(e); } });
    p.stdin.end(text);
  });
}

// ---------- the publish zip (a small ZIP writer: deflate, CRC-32) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zipFolder(root, items, out) {
  const files = [];
  const walk = rel => { const abs = path.join(root, rel); if (!fs.existsSync(abs)) return; const st = fs.statSync(abs); if (st.isDirectory()) { for (const f of fs.readdirSync(abs)) { if (f === 'old' && rel.endsWith('content')) continue; walk(path.join(rel, f)); } } else files.push(rel); };
  items.forEach(walk);
  const fd = fs.openSync(out, 'w'), central = []; let off = 0;
  const w = b => { fs.writeSync(fd, b); off += b.length; };
  for (const rel of files) {
    const data = fs.readFileSync(path.join(root, rel)), name = Buffer.from(rel.split(path.sep).join('/'), 'utf8'), crc = crc32(data);
    const already = /\.(mp3|mp4|png|jpg|jpeg|woff2|zip)$/i.test(rel), body = already ? data : zlib.deflateRawSync(data, { level: 9 }), method = already ? 0 : 8;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(method, 8); h.writeUInt32LE(0, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    const at = off; w(h); w(name); w(body);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(method, 10); c.writeUInt32LE(0, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(at, 42);
    central.push(Buffer.concat([c, name]));
  }
  const cd = Buffer.concat(central), start = off; w(cd);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(start, 16); w(e);
  fs.closeSync(fd);
  return { files: files.length, bytes: off };
}
const PUBLISH = ['index.html', 'manifest.webmanifest', 'sw.js', 'netlify.toml', 'css', 'fonts', 'icons', 'js', 'vendor', 'videos', 'content', 'voices', 'photos'];

// ---------- one long job at a time (photos, GitHub), with progress the dashboard polls ----------
let JOB = null;
const job = (kind, f) => { if (JOB && !JOB.end) throw new Error('Something else is still running: ' + JOB.kind); JOB = { kind, done: 0, total: 0, msg: '', start: Date.now() }; f(JOB).then(r => { JOB.result = r; JOB.end = true; }, e => { JOB.error = String(e && e.message || e); JOB.end = true; }); return JOB; };

// ---------- real photos of the landmarks, saved into the game (photos/<key>/n.jpg + photos/index.json) ----------
const UA = { 'User-Agent': 'SparkleStudio/1.0 (family game dashboard)', accept: 'application/json' };
const BADPIC = /\.(svg|gif|tif|tiff|webm|ogv|ogg|oga|wav|mp3|pdf)$|logo|flag of|map|locator|coat of arms|seal of|icon|diagram|signature|plan of|chart/i;
const PIX = () => G('photos', 'index.json');
const readPix = () => { try { return JSON.parse(fs.readFileSync(PIX(), 'utf8')); } catch (e) { return {}; } };
const writePix = o => { fs.mkdirSync(G('photos'), { recursive: true }); fs.writeFileSync(PIX(), JSON.stringify(o, null, 1)); };
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
async function bestPhotos(sources, max) {
  for (const s of sources) {
    const [lang, title] = s.split(/:(.+)/), t = encodeURIComponent(title.replace(/ /g, '_'));
    const ml = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${t}`, { headers: UA }); if (!ml.ok) continue;
    const j = await ml.json(); let lead = '';
    try { const sm = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${t}`, { headers: UA }); if (sm.ok) lead = decodeURIComponent(((await sm.json()).originalimage || {}).source || '').split('/').pop(); } catch (e) { }
    let items = (j.items || []).filter(it => it.type === 'image' && it.showInGallery !== false && !BADPIC.test(it.title || ''));
    items.sort((a, b) => (b.title.replace(/^File:/, '').replace(/ /g, '_') === lead) - (a.title.replace(/^File:/, '').replace(/ /g, '_') === lead));
    if (items.length) return items.slice(0, max).map(it => ({ file: it.title, caption: strip(it.caption && it.caption.html || it.caption && it.caption.text || '') }));
  }
  return [];
}
async function commonsInfo(file) {
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1280&titles=${encodeURIComponent(file)}`, { headers: UA });
  const j = await r.json(), pg = Object.values((j.query || {}).pages || {})[0], ii = pg && pg.imageinfo && pg.imageinfo[0]; if (!ii) return null;
  const md = ii.extmetadata || {};
  return { url: ii.thumburl || ii.url, width: ii.width, credit: [strip(md.Artist && md.Artist.value).slice(0, 80), strip(md.LicenseShortName && md.LicenseShortName.value)].filter(Boolean).join(' · ') };
}
async function getPhotos(J, list, max) {
  const pix = readPix(); J.total = list.length;
  for (const { key, sources, name } of list) {
    J.msg = name || key;
    try {
      const picks = await bestPhotos(sources, max), out = [];
      fs.mkdirSync(G('photos', key), { recursive: true });
      for (const p of picks) {
        const info = await commonsInfo(p.file); if (!info || (info.width && info.width < 500)) continue;
        const img = await fetch(info.url, { headers: { 'User-Agent': UA['User-Agent'] } }); if (!img.ok) continue;
        const n = out.length + 1, rel = `photos/${key}/${n}.jpg`; fs.writeFileSync(G(rel), Buffer.from(await img.arrayBuffer()));
        out.push({ src: rel, file: p.file, caption: p.caption.slice(0, 160), credit: info.credit });
      }
      if (out.length) pix[key] = out;
    } catch (e) { J.errors = (J.errors || 0) + 1; J.last = String(e.message || e); }
    J.done++; writePix(pix);
  }
  return { saved: Object.keys(pix).length };
}

// ---------- publish to GitHub: only the family's changes (content, voices, photos), as one commit ----------
// The live site is built from GitHub by Netlify, so a commit here is published there a minute or two later.
async function gh(p, opt = {}) {
  const r = await fetch('https://api.github.com' + p, { ...opt, headers: { Authorization: 'Bearer ' + conf.githubToken, Accept: 'application/vnd.github+json', 'User-Agent': 'sparkle-studio', 'X-GitHub-Api-Version': '2022-11-28', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
  const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) { }
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(j.message || t).slice(0, 160)}`);
  return j;
}
// ---------- the website: Netlify deploys and GitHub changes, to see and manage from the dashboard ----------
async function nf(p, opt = {}) {
  const r = await fetch('https://api.netlify.com/api/v1' + p, { ...opt, headers: { Authorization: 'Bearer ' + conf.netlifyToken, 'User-Agent': 'sparkle-studio', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
  const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) { }
  if (!r.ok) throw new Error(`Netlify ${r.status}: ${(j.message || t).slice(0, 160)}`);
  return j;
}
async function siteStatus() {
  const out = {};
  if (conf.netlifyToken && conf.netlifySite) {
    try {
      const site = await nf(`/sites/${encodeURIComponent(conf.netlifySite)}`), deps = await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/deploys?per_page=10`);
      out.netlify = { name: site.name, url: site.ssl_url || site.url, admin: site.admin_url, repo: site.build_settings && site.build_settings.repo_url, branch: site.build_settings && site.build_settings.repo_branch, published: site.published_deploy && site.published_deploy.id,
        deploys: deps.map(d => ({ id: d.id, state: d.state, context: d.context, branch: d.branch, commit: (d.commit_ref || '').slice(0, 7), title: d.title || '', at: d.created_at, url: d.deploy_ssl_url || d.deploy_url, error: d.error_message || '', live: site.published_deploy && site.published_deploy.id === d.id })) };
    } catch (e) { out.netlifyError = String(e.message || e); }
  }
  if (conf.githubToken && conf.githubRepo) {
    try {
      const R = `/repos/${conf.githubRepo}`, br = conf.githubBranch || 'main';
      const commits = await gh(`${R}/commits?sha=${encodeURIComponent(br)}&per_page=8`), pulls = await gh(`${R}/pulls?state=open&per_page=10`);
      out.github = { repo: conf.githubRepo, branch: br, commits: commits.map(c => ({ sha: c.sha.slice(0, 7), msg: (c.commit.message || '').split('\n')[0].slice(0, 120), at: c.commit.author && c.commit.author.date, url: c.html_url })),
        pulls: pulls.map(p => ({ n: p.number, title: p.title, draft: p.draft, branch: p.head && p.head.ref, url: p.html_url, at: p.updated_at })) };
    } catch (e) { out.githubError = String(e.message || e); }
  }
  return out;
}
const gitSha = b => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
const SYNC = ['content', 'voices', 'photos', 'tools/voice-extra.json'];
async function publishGitHub(J, message) {
  if (!conf.githubToken || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) throw new Error('Add the GitHub token and repository (owner/name) in Settings first.');
  const R = `/repos/${conf.githubRepo}`, br = conf.githubBranch || 'main';
  J.msg = 'Reading the website’s files…';
  const ref = await gh(`${R}/git/ref/heads/${encodeURIComponent(br)}`), base = ref.object.sha, baseTree = (await gh(`${R}/git/commits/${base}`)).tree.sha;
  const remote = new Map(), root = await gh(`${R}/git/trees/${baseTree}`);
  for (const top of ['content', 'voices', 'photos', 'tools']) { const e = root.tree.find(x => x.path === top && x.type === 'tree'); if (!e) continue; const t = await gh(`${R}/git/trees/${e.sha}?recursive=1`); for (const x of t.tree) if (x.type === 'blob') remote.set(top + '/' + x.path, x.sha); }
  const local = [];
  const walk = rel => { const abs = G(rel); if (!fs.existsSync(abs)) return; const st = fs.statSync(abs); if (st.isDirectory()) { for (const f of fs.readdirSync(abs)) { if (rel === 'content' && f === 'old') continue; walk(rel + '/' + f); } } else local.push(rel); };
  SYNC.forEach(walk);
  const changed = []; for (const rel of local) { const b = fs.readFileSync(G(rel)); if (remote.get(rel) !== gitSha(b)) changed.push(rel); }
  J.total = changed.length; if (!changed.length) return { changed: 0, note: 'Nothing new to publish: the website already has everything.' };
  const items = [];
  for (const rel of changed) { J.msg = rel; const b = fs.readFileSync(G(rel)); const blob = await gh(`${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: b.toString('base64'), encoding: 'base64' }) }); items.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha }); J.done++; }
  J.msg = 'Making the commit…'; let tree = baseTree;
  for (let i = 0; i < items.length; i += 400) tree = (await gh(`${R}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: tree, tree: items.slice(i, i + 400) }) })).sha;
  const commit = await gh(`${R}/git/commits`, { method: 'POST', body: JSON.stringify({ message: message || `Family update from Sparkle Studio (${changed.length} files)`, tree, parents: [base] }) });
  await gh(`${R}/git/refs/heads/${encodeURIComponent(br)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  return { changed: changed.length, commit: commit.sha.slice(0, 7), url: `https://github.com/${conf.githubRepo}/commit/${commit.sha}` };
}


// ---------- the health check ----------
function check() {
  const out = [];
  const add = (ok, en, vi) => out.push({ ok, en, vi });
  add(isGame(GAME), `Game folder: ${GAME}`, `Thư mục game: ${GAME}`);
  try { const sw = fs.readFileSync(G('sw.js'), 'utf8'), m = /FILES\s*=\s*\[([\s\S]*?)\]/.exec(sw), list = m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).filter(f => f !== './') : [];
    const miss = list.filter(f => !fs.existsSync(G(f))); add(!miss.length, miss.length ? `Files the offline app needs but are missing: ${miss.join(', ')}` : `All ${list.length} offline files are there`, miss.length ? `Thiếu tệp cho chế độ ngoại tuyến: ${miss.join(', ')}` : `Đủ ${list.length} tệp ngoại tuyến`);
    const v = /VERSION = '([^']+)'/.exec(sw); add(true, `Game version ${v ? v[1] : '?'}`, `Phiên bản ${v ? v[1] : '?'}`); } catch (e) { add(false, 'sw.js could not be read', 'Không đọc được sw.js'); }
  try { JSON.parse(fs.readFileSync(CONTENT(), 'utf8')); add(true, 'The content pack is valid', 'Gói nội dung hợp lệ'); } catch (e) { add(!fs.existsSync(CONTENT()), fs.existsSync(CONTENT()) ? 'content/custom.json is broken: ' + e.message : 'No content pack yet (that is fine)', fs.existsSync(CONTENT()) ? 'content/custom.json bị lỗi' : 'Chưa có gói nội dung (không sao)'); }
  const c = readContent(); for (const [id, f] of Object.entries(c.faces || {})) if (!fs.existsSync(G(f.photo || ''))) add(false, `Face photo missing for ${id}: ${f.photo}`, `Thiếu ảnh khuôn mặt của ${id}`);
  const have = voicesHave(), n = Object.values(have).reduce((a, s) => a + Object.values(s).reduce((b, l) => b + l.length, 0), 0);
  add(n > 0, n ? `Voice pack: ${n} recordings` : 'No voice pack yet', n ? `Gói giọng: ${n} bản ghi` : 'Chưa có gói giọng');
  return out;
}

// ---------- names the villagers have (for the Villagers page) ----------
function villagerNames() {
  try {
    const src = fs.readFileSync(G('js', 'i18n.js'), 'utf8'), m = /const NAMES_EN = \{([\s\S]*?)\n\};/.exec(src); if (!m) return [];
    const seen = new Map(); for (const x of m[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) if (!seen.has(x[1])) seen.set(x[1], x[2]);
    return [...seen.entries()].map(([vi, en]) => ({ id: vi, en })).sort((a, b) => a.id.localeCompare(b.id, 'vi'));
  } catch (e) { return []; }
}

// ---------- the server ----------
const PORT = +(process.env.STUDIO_PORT || 7777);
const server = http.createServer(async (req, res) => {
  try {
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '')) return send(res, 403, 'local only', 'text/plain');
    const url = new URL(req.url, 'http://localhost'), p = url.pathname;
    if (req.method === 'POST' && req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)) return send(res, 403, { error: 'local only' });
    // the dashboard
    if (p === '/' || p === '/index.html') return send(res, 200, asset('index.html'), MIME['.html']);
    if (p.startsWith('/ui/')) { const b = asset(p.slice(4)); return b ? send(res, 200, b, MIME[path.extname(p)] || 'application/octet-stream') : send(res, 404, 'not found', 'text/plain'); }
    // the game itself, to try things out
    if (p.startsWith('/game/')) {
      if (!GAME) return send(res, 404, 'no game folder', 'text/plain');
      const f = safeJoin(GAME, p.slice(6) || 'index.html'); if (!f) return send(res, 403, 'no', 'text/plain');
      const file = fs.existsSync(f) && fs.statSync(f).isDirectory() ? path.join(f, 'index.html') : f;
      if (!fs.existsSync(file)) return send(res, 404, 'not found', 'text/plain');
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    }
    // the game's modules (loaded by the Voices page) fetch content/custom.json from the page's own address
    if (p.startsWith('/content/') && GAME) { const f = safeJoin(GAME, p); return f && fs.existsSync(f) && fs.statSync(f).isFile() ? send(res, 200, fs.readFileSync(f), MIME[path.extname(f).toLowerCase()] || 'application/octet-stream') : send(res, 404, '{}', MIME['.json']); }
    if (!p.startsWith('/api/')) return send(res, 404, 'not found', 'text/plain');
    const api = p.slice(5); lastSeen = Date.now();
    if (api === 'ping') return send(res, 200, { ok: true });
    if (api === 'quit' && req.method === 'POST') { send(res, 200, { ok: true }); log('Closed from the dashboard.'); setTimeout(() => process.exit(0), 300); return; }
    if (api === 'info') {
      const have = GAME ? voicesHave() : {}, nv = Object.values(have).reduce((a, s) => a + Object.values(s).reduce((b, l) => b + l.length, 0), 0);
      let version = '?'; try { version = /VERSION = '([^']+)'/.exec(fs.readFileSync(G('sw.js'), 'utf8'))[1]; } catch (e) { }
      return send(res, 200, { game: GAME, ok: isGame(GAME), version, voices: nv, conf: { azure: !!conf.azureKey, azureRegion: conf.azureRegion || '', netlify: !!conf.netlifyToken, netlifySite: conf.netlifySite || '', github: !!conf.githubToken, githubRepo: conf.githubRepo || '', githubBranch: conf.githubBranch || 'main', piper: !!conf.piperExe, piperExe: conf.piperExe || '', piperModels: conf.piperModels || {} }, settingsFile: CONF });
    }
    if (api === 'settings' && req.method === 'POST') {
      const b = await json(req);
      for (const k of ['azureRegion', 'netlifySite', 'piperExe', 'githubRepo', 'githubBranch']) if (typeof b[k] === 'string') conf[k] = b[k].trim();
      for (const k of ['azureKey', 'netlifyToken', 'githubToken']) if (typeof b[k] === 'string' && b[k].trim()) conf[k] = b[k].trim(); // empty = keep the saved one
      if (b.forget) for (const k of [].concat(b.forget)) delete conf[k];
      if (b.piperModels && typeof b.piperModels === 'object') conf.piperModels = Object.assign(conf.piperModels || {}, b.piperModels);
      if (typeof b.gameDir === 'string' && b.gameDir.trim()) { if (!isGame(b.gameDir.trim())) return send(res, 400, { error: 'That folder has no game in it (index.html and js/main.js).' }); conf.gameDir = path.resolve(b.gameDir.trim()); GAME = conf.gameDir; manCache = null; }
      saveConf(); return send(res, 200, { ok: true });
    }
    if (!isGame(GAME)) return send(res, 400, { error: 'Choose the game folder in Settings first.' });
    if (api === 'content') { if (req.method === 'POST') { const b = await json(req); writeContent(b); return send(res, 200, { ok: true }); } return send(res, 200, readContent()); }
    if (api === 'names') return send(res, 200, villagerNames());
    if (api === 'face' && req.method === 'POST') {
      const b = await json(req), m = /^data:image\/jpeg;base64,(.+)$/.exec(b.dataUrl || ''); if (!m) return send(res, 400, { error: 'not a JPEG' });
      fs.mkdirSync(G('content', 'faces'), { recursive: true }); const name = slug(b.id) + '.jpg'; fs.writeFileSync(G('content', 'faces', name), Buffer.from(m[1], 'base64'));
      return send(res, 200, { photo: 'content/faces/' + name });
    }
    if (api === 'job') return send(res, 200, JOB || {});
    if (api === 'photos/index') return send(res, 200, readPix());
    if (api === 'photos/get' && req.method === 'POST') { const b = await json(req); const list = (b.list || []).filter(x => x && /^[\p{L}\p{N}-]{1,60}$/u.test(x.key || '') && Array.isArray(x.sources)); return send(res, 200, job('photos', J => getPhotos(J, list, Math.min(8, Math.max(1, +b.max || 4))))); }
    if (api === 'photos/remove' && req.method === 'POST') { const b = await json(req), pix = readPix(), L = pix[b.key] || []; const i = L.findIndex(p => p.src === b.src); if (i >= 0) { const f = safeJoin(GAME, L[i].src); if (f && fs.existsSync(f)) fs.unlinkSync(f); L.splice(i, 1); if (L.length) pix[b.key] = L; else delete pix[b.key]; writePix(pix); } return send(res, 200, { ok: true }); }
    if (api === 'voices/extra') {
      const f = G('tools', 'voice-extra.json'); let L = []; try { L = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { }
      if (req.method === 'POST') { const b = await json(req), have = new Set(L.map(l => l.lang + '|' + l.text)); let n = 0; for (const l of b.lines || []) if (l && CAST[l.lang] && typeof l.text === 'string' && l.text.trim() && l.text.length < 400 && !have.has(l.lang + '|' + l.text)) { L.push({ lang: l.lang, text: l.text }); have.add(l.lang + '|' + l.text); n++; } fs.mkdirSync(G('tools'), { recursive: true }); fs.writeFileSync(f, JSON.stringify(L, null, 0).replace(/\},\{/g, '},\n{') + '\n'); return send(res, 200, { added: n, total: L.length }); }
      return send(res, 200, L);
    }
    if (api === 'site/status') return send(res, 200, await siteStatus());
    if (api === 'site/rebuild' && req.method === 'POST') { if (!conf.netlifyToken || !conf.netlifySite) return send(res, 400, { error: 'Add your Netlify token and site in Settings first.' }); await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/builds`, { method: 'POST', body: '{}' }); return send(res, 200, { ok: true }); }
    if (api === 'site/restore' && req.method === 'POST') { const b = await json(req); if (!/^[0-9a-f]{16,40}$/.test(b.id || '')) return send(res, 400, { error: 'bad deploy' }); await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/deploys/${b.id}/restore`, { method: 'POST', body: '{}' }); return send(res, 200, { ok: true }); }
    if (api === 'github/merge' && req.method === 'POST') { const b = await json(req); if (!(+b.n > 0)) return send(res, 400, { error: 'bad pull request' }); const r = await gh(`/repos/${conf.githubRepo}/pulls/${+b.n}/merge`, { method: 'PUT', body: JSON.stringify({ merge_method: 'merge' }) }); return send(res, 200, { ok: true, sha: r.sha }); }
    if (api === 'github/publish' && req.method === 'POST') { const b = await json(req); return send(res, 200, job('github', J => publishGitHub(J, String(b.message || '').slice(0, 200)))); }
    if (api === 'srcfiles') { const list = []; for (const d of ['js', 'js/games']) for (const f of fs.readdirSync(G(d))) if (f.endsWith('.js')) list.push(d + '/' + f); return send(res, 200, list); }
    if (api === 'voices/have') return send(res, 200, voicesHave());
    if (api === 'voice' && req.method === 'POST') {
      const b = await json(req);
      if (!CAST[b.lang] || !CAST[b.lang].includes(b.slot) || !/^[0-9a-f]{8}-?[0-9a-f]{1,8}$/.test(b.hash || '')) return send(res, 400, { error: 'bad line' });
      let mp3;
      if (b.engine === 'azure') mp3 = await azureSay(b.lang, b.slot, String(b.text || ''));
      else if (b.engine === 'piper') mp3 = await piperSay(b.lang, String(b.text || ''));
      else if (b.engine === 'upload') { const m = /^data:audio\/mpeg;base64,(.+)$/.exec(b.audio || ''); if (!m) return send(res, 400, { error: 'not an MP3' }); mp3 = Buffer.from(m[1], 'base64'); }
      else return send(res, 400, { error: 'which engine?' });
      const dir = G('voices', b.lang, b.slot); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, b.hash + '.mp3'), mp3); addToManifest(b.lang, b.slot, b.hash);
      return send(res, 200, { ok: true, bytes: mp3.length });
    }
    if (api === 'build' && req.method === 'POST') { const out = G('sparkle-valley-netlify.zip'); const r = zipFolder(GAME, PUBLISH, out); return send(res, 200, Object.assign({ path: out }, r)); }
    if (api === 'zip') { const f = G('sparkle-valley-netlify.zip'); if (!fs.existsSync(f)) return send(res, 404, { error: 'Build the zip first.' }); res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="sparkle-valley-netlify.zip"' }); return fs.createReadStream(f).pipe(res); }
    if (api === 'deploy' && req.method === 'POST') {
      if (!conf.netlifyToken || !conf.netlifySite) return send(res, 400, { error: 'Add your Netlify token and site in Settings first.' });
      const f = G('sparkle-valley-netlify.zip'); if (!fs.existsSync(f)) return send(res, 400, { error: 'Build the zip first.' });
      const r = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(conf.netlifySite)}/deploys`, { method: 'POST', headers: { Authorization: 'Bearer ' + conf.netlifyToken, 'Content-Type': 'application/zip' }, body: fs.readFileSync(f) });
      const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) { }
      if (!r.ok) return send(res, 502, { error: `Netlify said ${r.status}: ${(j.message || t).slice(0, 200)}` });
      return send(res, 200, { ok: true, state: j.state, url: j.ssl_url || j.url || j.deploy_ssl_url, admin: j.admin_url });
    }
    if (api === 'check') return send(res, 200, check());
    if (api === 'open' && req.method === 'POST') { const b = await json(req); const what = b.folder ? GAME : `http://localhost:${PORT}/game/`; openThing(what); return send(res, 200, { ok: true }); }
    return send(res, 404, { error: 'unknown' });
  } catch (e) { send(res, 500, { error: String(e && e.message || e) }); }
});
function openThing(u) {
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', u], { windowsHide: true });
  else if (process.platform === 'darwin') execFile('open', [u]); else execFile('xdg-open', [u], () => { });
}
// The dashboard opens in its own app window (Edge or Chrome "--app": no address bar, no tabs), else the default browser.
function openApp(u) {
  if (process.platform === 'win32') {
    const E = process.env, cands = [[E['ProgramFiles(x86)'], 'Microsoft\\Edge\\Application\\msedge.exe'], [E.ProgramFiles, 'Microsoft\\Edge\\Application\\msedge.exe'], [E.ProgramFiles, 'Google\\Chrome\\Application\\chrome.exe'], [E['ProgramFiles(x86)'], 'Google\\Chrome\\Application\\chrome.exe'], [E.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe']];
    for (const [dir, rel] of cands) { if (!dir) continue; const exe = path.join(dir, rel); if (fs.existsSync(exe)) { try { spawn(exe, ['--app=' + u, '--window-size=1280,900'], { detached: true, stdio: 'ignore' }).unref(); return; } catch (e) { } } }
  }
  openThing(u);
}
// Packaged as the exe there is no console window: messages go to a log file next to the settings.
const LOG = path.join(CONF_DIR, 'studio.log');
try { fs.mkdirSync(CONF_DIR, { recursive: true }); fs.writeFileSync(LOG, ''); } catch (e) { }
const log = m => { console.log(m); try { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + m + '\n'); } catch (e) { } };
process.on('uncaughtException', e => { log('error: ' + (e && e.stack || e)); });
// The exe stops by itself a few minutes after its window is closed (the dashboard checks in every 20 s; hidden windows may slow that to once a minute).
const AUTO_QUIT = !!sea || !!process.env.STUDIO_AUTO_QUIT, QUIT_AFTER = +(process.env.STUDIO_QUIT_MS || 180000);
let lastSeen = 0;
setInterval(() => { if (AUTO_QUIT && lastSeen && Date.now() - lastSeen > QUIT_AFTER) { log('No dashboard window for a while: stopping.'); process.exit(0); } }, 5000);
server.on('error', e => { if (e.code === 'EADDRINUSE') { log(`Sparkle Studio is already open: http://localhost:${PORT}`); openApp(`http://localhost:${PORT}/`); setTimeout(() => process.exit(0), 1500); } else { log('error: ' + e.message); process.exit(1); } });
server.listen(PORT, '127.0.0.1', () => {
  log(`Sparkle Studio is running: http://localhost:${PORT} · game folder: ${GAME || '(choose it in Settings)'}`);
  if (!process.env.STUDIO_NO_OPEN) openApp(`http://localhost:${PORT}/`);
});

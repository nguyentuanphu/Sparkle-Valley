// Tester reports on a tester device (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md). Loaded only
// on the devices Studio's Releases page makes testers (switch `tester`, js/testergate.js); everywhere else nothing of it
// is downloaded. Once the tester accepts the agreement (shown once, both languages):
//   - the game reports by itself when something goes wrong (an error, a game or window that did not open or close, a
//     frozen or slow screen, a button off the screen, a line with no recording, a child stuck), each with a picture of
//     the screen, the last 30 seconds (taps, windows, where the child walked) and the device's details;
//   - the ladybird (level "ladybird"): tap = the screen is kept at that moment, then a kind, a spoken or typed note and
//     Send; long press = a quick report; a number = reports waiting to send; a tick = a problem you found is fixed;
//   - reports wait on the device while offline and send by themselves; the device asks how its reports are doing
//     (the fixed tick, the rewards in js/testerrewards.js), replays its fixed problems on a new version (the retest),
//     and on a new version runs the auto play check by itself at night or while charging, sending what it finds.
// PRIV-016: on a tester device that accepted, reports keep the players' names, ages and progress; nothing is sent
// before "I accept", and "Stop being a tester" (Settings) stops everything at once.
import { T, nm } from './i18n.js';
import { settings, profiles, farm } from './state.js';
import { BUILD } from './build.js';
import { el, esc } from './util.js';
import { pic } from './art.js';
import { modal, holdButton } from './popups.js';
import { say, voiceMisses } from './voice.js';
import { listen, canListen } from './listen.js';
import { setPeeks, liveRule } from './custom.js';
import { setProblemHook } from './players.js';
import { SFX } from './audio.js';
import * as C from './content/tester.js';

const KEY = { acc: 'sv2_tester', out: 'sv2_tester_out', st: 'sv2_tester_status', seen: 'sv2_tester_seen', ap: 'sv2_tester_ap' };
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const URL_ = () => window.__svTesterURL || 'api/tester';
const me = () => { try { return localStorage.getItem('sv2_playerid') || ''; } catch (e) { return ''; } };
const L = pair => T(pair[0], pair[1]);

let G = null, level = '', live = false, offs = [], log = [], errors = [], want = null, lastGame = '', status = get(KEY.st, null), mark = null;
const sent = new Map(), counts = new Map();

// ---------- what happened in the last 30 seconds ----------
const note = (k, s) => { const t = Date.now(); log.push([t, k, String(s || '').replace(/\s+/g, ' ').slice(0, 120)]); while (log.length && (t - log[0][0] > C.LIMITS.replay * 1000 || log.length > 400)) log.shift(); };
const labelOf = n => { const b = n && n.closest && n.closest('button, [role=button], a, .hcard, .sp-stop, .sp-catcard, .chip'); if (!b) return n && n.tagName ? n.tagName.toLowerCase() : ''; return (b.getAttribute('aria-label') || b.textContent || b.className || '').trim().slice(0, 40); };
const topWindow = () => { const w = [...document.querySelectorAll('.modal, .gl, .theatre, .storybook, .dialog')].filter(x => x.offsetParent || getComputedStyle(x).position === 'fixed').pop(); if (!w) return ''; const h = w.querySelector('h2, h3, .gl-title, .dname, b'); return (w.className.split(' ').slice(0, 2).join(' ') + (h ? ': ' + h.textContent.trim() : '')).slice(0, 80); };
const whereNow = () => { const h = G && G.heroes && G.heroes[0], open = document.querySelector('.gl'); return { area: String((G && G.regionOf && G.regionOf[0]) || 'valley'), place: '', game: open ? lastGame : '', window: topWindow(), x: h ? Math.round(h.pos.x) : 0, z: h ? Math.round(h.pos.z) : 0 }; };
const playersNow = () => (profiles || []).slice(0, 8).map(p => ({ name: nm(p.name || ''), age: p.age || '', coins: farm ? farm.coins : 0, stars: p.stars ? Object.keys(p.stars).length : 0, level: p.difficulty || '' }));
const osOf = (ua = navigator.userAgent) => /iPhone|iPod/.test(ua) ? 'iOS' : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPadOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : 'other';
const brOf = (ua = navigator.userAgent) => /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
let fpsNow = 0;
const devNow = () => ({ os: osOf(), br: brOf(), sc: `${innerWidth}x${innerHeight}`, lang: settings.lang, fps: Math.round(fpsNow), mem: navigator.deviceMemory || 0 });

// ---------- the picture of the screen ----------
// (the 3D view keeps no picture between frames, so it is copied right after the next frame is drawn; the window on top
// is written underneath as words)
function grab() {
  try {
    const R = G.renderer, src = R && R.domElement, w = C.LIMITS.shotWidth, h = Math.round(w * innerHeight / Math.max(1, innerWidth));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#88b'; g.fillRect(0, 0, w, h); if (src) g.drawImage(src, 0, 0, w, h);
    const win = topWindow(), dlg = document.querySelector('.dialog .dtext');
    const lines = [win, dlg ? dlg.textContent : ''].filter(Boolean).map(s => s.slice(0, 70));
    if (lines.length) { g.fillStyle = 'rgba(30,20,50,.78)'; g.fillRect(0, h - 22 * lines.length - 8, w, 22 * lines.length + 8); g.fillStyle = '#fff'; g.font = '15px sans-serif'; lines.forEach((s, i) => g.fillText(s, 8, h - 22 * (lines.length - i) + 10)); }
    return c.toDataURL('image/jpeg', .6);
  } catch (e) { return ''; }
}
const shot = () => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } }; want = () => fin(grab()); setTimeout(() => { want = null; fin(grab()); }, 400); });

// ---------- sending ----------
const queue = () => get(KEY.out, []);
function keep(list) { if (put(KEY.out, list)) return; const thin = list.map((r, i) => i < list.length - 5 ? { ...r, shot: '' } : r); if (!put(KEY.out, thin)) put(KEY.out, thin.slice(-10).map(r => ({ ...r, shot: '' }))); }
function enqueue(r) { const q = queue(); q.push(r); keep(q.slice(-C.LIMITS.queue)); paintCount(); flush(); }
let flushing = false;
async function flush() {
  if (flushing || !live || navigator.onLine === false) return; flushing = true;
  try {
    let q = queue();
    while (q.length) {
      const r = q[0]; let res = null; try { res = await fetch(URL_(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }); } catch (e) { break; }
      if (res.status === 429 || res.status >= 500) break;
      q.shift(); keep(q); // (sent, or refused for good: a report the website will not take is not kept)
    }
  } finally { flushing = false; paintCount(); }
}
const body = (kind, extra) => ({ id: me(), b: BUILD, kind, where: whereNow(), errors: errors.slice(-C.LIMITS.errors), log: log.map(([t, k, s]) => [Math.round((t - Date.now()) / 100) / 10, k, s]), dev: devNow(), players: playersNow(), at: Date.now(), ...extra });

// the game reports by itself (the same thing at the same place once in 10 minutes, counted meanwhile)
export async function autoReport(kind, detail, where) {
  if (!live) return; const w = where || whereNow(), k = C.keyOf(kind, detail, w.game || w.window || w.area);
  counts.set(k, (counts.get(k) || 0) + 1); const last = sent.get(k);
  if (last && Date.now() - last < C.LIMITS.sameAgain) return; sent.set(k, Date.now());
  const n = counts.get(k); counts.set(k, 0); note('report', kind + ' ' + detail);
  enqueue(body('auto', { auto: kind, detail: String(detail || '').slice(0, 200), where: w, shot: await shot(), count: n }));
}

// ---------- watching for problems ----------
function watch() {
  const on = (t, k, f, o) => { t.addEventListener(k, f, o); offs.push(() => t.removeEventListener(k, f, o)); };
  // errors in the game's own code
  const err = (msg, file, line) => { const f = String(file || '').split('/').pop().split('?')[0]; if (f && !/\.m?js$/.test(f)) return; const s = `${String(msg || 'error').slice(0, 120)} @ ${f || '?'}:${line || 0}`; errors.push(s); if (errors.length > C.LIMITS.errors) errors.shift(); note('error', s); autoReport('error', s); };
  on(window, 'error', e => err(e.message, e.filename, e.lineno));
  on(window, 'unhandledrejection', e => { const r = e.reason, m = /\/([\w.-]+\.m?js):(\d+)/.exec(String(r && r.stack || '')); err(r && r.message || String(r), m ? m[1] : 'promise.js', m ? m[2] : 0); });
  // taps, and windows that do not close
  on(document, 'pointerdown', e => note('tap', `${labelOf(e.target)} @${Math.round(e.clientX)},${Math.round(e.clientY)}`), true);
  on(document, 'click', e => {
    const b = e.target.closest && e.target.closest('.x, .gl-x, [data-a=close], .close, #qDone'); if (!b) return;
    const box = b.closest('.modal, .gl, .theatre, .storybook'); if (!box) return; const what = labelOf(b) + ' ' + (box.className || '').split(' ').slice(0, 2).join(' ');
    setTimeout(() => { if (document.contains(box) && !box.classList.contains('out') && box.offsetParent !== null) autoReport('noclose', what); }, C.LIMITS.closeWait * 1000);
  }, true);
  // windows opening and closing
  const mo = new MutationObserver(list => { for (const r of list) { r.addedNodes.forEach(n => n.classList && /\b(modal|gl|theatre|storybook|dialog)\b/.test(n.className) && note('open', (n.className + ' ' + ((n.querySelector && n.querySelector('h2, .dname, .gl-title')) || {}).textContent).slice(0, 80))); r.removedNodes.forEach(n => n.classList && /\b(modal|gl|theatre|storybook)\b/.test(n.className) && note('close', n.className.slice(0, 40))); } });
  mo.observe(document.body, { childList: true }); offs.push(() => mo.disconnect());
  // games that do not open
  if (G.playGame && !G.playGame.__tester) { const pg = G.playGame; G.playGame = Object.assign(function (i, id, ...a) { lastGame = String(id || ''); note('game', lastGame); const out = pg.call(this, i, id, ...a); setTimeout(() => { if (live && !document.querySelector('.gl')) autoReport('noopen', lastGame); }, C.LIMITS.openWait * 1000); return out; }, { __tester: true }); offs.push(() => { G.playGame = pg; }); }
  // a child stuck (js/players.js watchHero)
  setProblemHook((kind, key) => { if (kind === 'stuck') autoReport('stuck', key); }); offs.push(() => setProblemHook(null));
  // frames: frozen (no frame for 2 s while on screen) and slow (under 20 a second for 10 s)
  let lastF = performance.now(), frames = 0, since = performance.now(), raf = 0;
  const tick = t => { if (!live) return; const gap = t - lastF; if (gap > C.LIMITS.freeze * 1000 && document.visibilityState === 'visible' && performance.now() - mounted > 15000) autoReport('freeze', `${(gap / 1000).toFixed(1)} s`);
    lastF = t; frames++; if (t - since > C.LIMITS.slowFor * 1000) { fpsNow = frames * 1000 / (t - since); if (fpsNow < C.LIMITS.slowFps && document.visibilityState === 'visible' && performance.now() - mounted > 15000) autoReport('slow', `${Math.round(fpsNow)} frames a second`); frames = 0; since = t; }
    raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick); offs.push(() => cancelAnimationFrame(raf));
  on(document, 'visibilitychange', () => { lastF = performance.now(); since = performance.now(); frames = 0; });
  // every 5 s: a button off the screen, a line with no recording, where the child walked
  let misses = new Set(voiceMisses().map(m => m[0] + '|' + m[1])), lastPos = '';
  const every = setInterval(() => {
    for (const b of document.querySelectorAll('.modal button, .hud button, .gl button, .dialog button')) {
      if (!b.offsetParent) continue; const r = b.getBoundingClientRect(); if (!r.width) continue;
      if (r.right < 2 || r.bottom < 2 || r.left > innerWidth - 2 || r.top > innerHeight - 2) autoReport('offscreen', labelOf(b));
    }
    const now = voiceMisses(); for (const [lang, text] of now) { const k = lang + '|' + text; if (!misses.has(k)) { misses.add(k); autoReport('novoice', `${lang}: ${String(text).slice(0, 100)}`); } }
    const h = G.heroes && G.heroes[0]; if (h) { const p = `${(G.regionOf && G.regionOf[0]) || 'valley'} ${Math.round(h.pos.x)},${Math.round(h.pos.z)}`; if (p !== lastPos) { lastPos = p; note('walk', p); } }
  }, 5000); offs.push(() => clearInterval(every));
  on(window, 'online', () => flush());
  const fl = setInterval(() => flush(), 60e3); offs.push(() => clearInterval(fl));
}
let mounted = 0;

// ---------- the picture of the 3D view, right after a frame ----------
function hookRender() {
  const R = G.renderer; if (!R || R.render.__tester) return; const orig = R.render;
  R.render = Object.assign(function (...a) { const out = orig.apply(this, a); if (want) { const w = want; want = null; w(); } return out; }, { __tester: true });
  offs.push(() => { R.render = orig; });
}

// ---------- the ladybird and the tester mark ----------
const paintCount = () => { const n = queue().length, fixed = fixedToSee().length; document.querySelectorAll('.z-lb').forEach(b => { b.querySelector('.lb-n').textContent = n ? String(n) : ''; b.querySelector('.lb-n').hidden = !n; b.querySelector('.lb-ok').hidden = !fixed; }); };
const fixedToSee = () => { const seen = get(KEY.seen, {}); return ((status && status.mine) || []).filter(p => ['fixed', 'confirmed'].includes(p.status) && !seen[p.k]); };
function addUI() {
  mark = el('div', 'testermark', `${pic('🐞')}<span>${T('Tester', 'Người thử')} · ${BUILD}</span>`); mark.setAttribute('aria-hidden', 'true'); document.body.appendChild(mark); offs.push(() => mark.remove());
  if (level !== 'ladybird') return;
  // (each player's HUD gets one, also the ones made after this: the game starts after the title screen)
  const ensure = () => (G.huds || []).forEach((hud, i) => {
    const z = hud.q && hud.q('.zoomer'); if (!z || z.querySelector('.z-lb')) return;
    const b = el('button', 'z-lb', `${pic('🐞')}<i class="lb-n" hidden></i><i class="lb-ok" hidden>✓</i><kbd class="kb">L</kbd>`); b.setAttribute('aria-label', T('Report a problem (hold: quick report)', 'Báo lỗi (giữ: báo nhanh)'));
    let t0 = 0, quick = null;
    b.addEventListener('pointerdown', e => { e.stopPropagation(); t0 = performance.now(); quick = setTimeout(() => { quick = null; quickReport(); }, 700); });
    b.addEventListener('pointerup', e => { e.stopPropagation(); if (quick) { clearTimeout(quick); quick = null; if (fixedToSee().length) showFixed(); else openPanel(i); } });
    b.addEventListener('pointerleave', () => { if (quick) { clearTimeout(quick); quick = null; } });
    b.addEventListener('keydown', e => { if (e.key === 'Enter') openPanel(i); });
    z.appendChild(b); offs.push(() => b.remove()); paintCount();
  });
  ensure(); const ev = setInterval(ensure, 1000); offs.push(() => clearInterval(ev));
  const key = e => { if ((e.key === 'l' || e.key === 'L') && !e.target.closest('input, textarea') && !document.querySelector('.modal.tpanel')) openPanel(0); };
  addEventListener('keydown', key); offs.push(() => removeEventListener('keydown', key));
  paintCount();
}
async function quickReport() { SFX.tap && SFX.tap(); const s = await shot(); enqueue(body('broken', { note: T('Quick report: something was wrong just now', 'Báo nhanh: vừa có gì đó không ổn'), detail: 'quick', shot: s })); toast(navigator.onLine === false ? L(C.TESTER_LINES.waiting) : L(C.TESTER_LINES.sent)); }
function toast(s) { const t = el('div', 'testertoast', esc(s)); document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2600); }

// the panel: the picture is taken first, then a kind, a spoken or typed note, Send; or "Already reported → add to it"
export async function openPanel(i = 0) {
  if (!live || document.querySelector('.modal.tpanel')) return; const pic0 = await shot(), where = whereNow();
  const was = G.paused; G.paused = true; SFX.tap && SFX.tap();
  const near = ((status && status.open) || []).filter(p => p.where && ((where.game && p.where.game === where.game) || (where.window && p.where.window === where.window) || (!where.game && !where.window && p.where.area === where.area && Math.hypot((p.where.x || 0) - where.x, (p.where.z || 0) - where.z) < 25))).slice(0, 3);
  let kind = 'broken', spoken = false;
  const m = modal('tpanel', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('Report a problem', 'Báo lỗi')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <img class="tp-shot" alt="" src="${pic0}">
    ${near.length ? `<div class="tp-near"><b>${T('Already reported here', 'Đã có người báo ở đây')}</b>${near.map(p => `<div class="tp-old"><span>${esc(p.title)} <small>· ${p.n}×</small></span><button class="btn" data-join="${esc(p.k)}">${T('Same problem: add to it', 'Cùng lỗi: báo thêm')}</button></div>`).join('')}</div>` : ''}
    <div class="tp-kinds">${C.KINDS.map(k => `<button class="tp-k ${k.id === kind ? 'on' : ''}" data-k="${k.id}" aria-pressed="${k.id === kind}">${pic(k.icon)}<span>${T(k.en, k.vi)}</span></button>`).join('')}</div>
    <div class="tp-note"><textarea maxlength="600" rows="3" placeholder="${T('What happened? What did you expect?', 'Chuyện gì xảy ra? Bạn mong điều gì?')}"></textarea>${canListen() ? `<button class="btn tp-mic" aria-label="${T('Say it', 'Nói')}">${pic('🎤')} ${T('Say it', 'Nói')}</button>` : ''}</div>
    <div class="actions"><button class="btn primary tp-send">${T('Send', 'Gửi')}</button></div>`);
  const card = m.querySelector('.card'), ta = card.querySelector('textarea');
  const close = () => { m.close(); G.paused = was; };
  card.querySelector('.x').onclick = close;
  card.querySelectorAll('.tp-k').forEach(b => b.onclick = () => { kind = b.dataset.k; card.querySelectorAll('.tp-k').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); SFX.tap && SFX.tap(); });
  const mic = card.querySelector('.tp-mic'); if (mic) mic.onclick = async () => { mic.disabled = true; const heard = await listen({ onPartial: t => { ta.value = t; } }); mic.disabled = false; if (heard && heard[0] !== '\u0000') { ta.value = (ta.value && ta.value !== heard ? ta.value + ' ' : '') + heard; spoken = true; } };
  const send = join => { enqueue(body(kind, { note: ta.value.trim(), spoken, shot: pic0, where, join: join || '' })); close(); toast(join ? L(C.TESTER_LINES.already) : navigator.onLine === false ? L(C.TESTER_LINES.waiting) : L(C.TESTER_LINES.sent)); say(...(join ? C.TESTER_LINES.already : C.TESTER_LINES.sent)); };
  card.querySelector('.tp-send').onclick = () => send('');
  card.querySelectorAll('[data-join]').forEach(b => b.onclick = () => send(b.dataset.join));
  return m;
}
// "Fixed in rNN: please check" with Yes, fixed / Still wrong
function showFixed() {
  const list = fixedToSee(); if (!list.length) return; const p = list[0], seen = get(KEY.seen, {});
  const m = modal('tpanel tfixed', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('Fixed', 'Đã sửa')}${p.fixedIn ? ' · ' + esc(p.fixedIn) : ''}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <p>${esc(p.title)}</p><p>${T('Please check: is it fixed?', 'Bạn thử lại nhé: đã hết lỗi chưa?')}</p>
    <div class="actions"><button class="btn primary" data-ok="1">${T('Yes, fixed', 'Đã hết lỗi')}</button><button class="btn" data-ok="0">${T('Still wrong', 'Vẫn còn lỗi')}</button></div>`);
  const card = m.querySelector('.card'), done = ok => { seen[p.k] = 1; put(KEY.seen, seen); m.close(); paintCount(); tell({ k: p.k, fixed: ok }); }; // (the thank-you comes with the status: js/testerrewards.js)
  card.querySelector('.x').onclick = () => m.close();
  card.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => done(b.dataset.ok === '1'));
}
const tell = b => fetch(URL_(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: me(), ...b }) }).catch(() => { });

// ---------- how my reports are doing ----------
export async function refresh() {
  if (!live || navigator.onLine === false) return status;
  try { const r = await fetch(`${URL_()}?id=${encodeURIComponent(me())}&b=${BUILD}`, { cache: 'no-store' }); if (r.ok && /json/.test(r.headers.get('content-type') || '')) { status = await r.json(); put(KEY.st, status); } } catch (e) { }
  paintCount(); if (G.testerRewards && status) G.testerRewards.apply(status);
  return status;
}

// ---------- the retest: a fixed problem replayed on the new version ----------
async function retest() {
  if (!live || !status || !Array.isArray(status.retest)) return; const done = get(KEY.seen, {});
  for (const p of status.retest) {
    const tag = 'rt:' + p.k + ':' + BUILD; if (done[tag]) continue; done[tag] = 1; put(KEY.seen, done);
    if (G.paused || document.querySelector('.gl, .modal, .theatre, .storybook')) return; // (only when the child is free)
    const game = p.where && p.where.game, before = errors.length; let again = false;
    if (game && G.playGame) { G.playGame(0, game, 'replay'); await new Promise(r => setTimeout(r, 8000)); again = !document.querySelector('.gl') || errors.length > before; document.querySelector('.gl .gl-x')?.click(); }
    else if (p.auto === 'error') { await new Promise(r => setTimeout(r, 8000)); again = errors.slice(before).some(e => p.title.includes(e.split(' @ ')[0].slice(0, 40))); }
    else continue; // (a problem that cannot be replayed by itself waits for the tester's Yes or Still wrong)
    tell({ k: p.k, fixed: !again }); note('retest', p.k + (again ? ' came back' : ' fixed'));
  }
}

// ---------- the auto play check by itself, on a new version (at night or while charging) ----------
async function nightly() {
  const ap = get(KEY.ap, {}); const rep = get('sv2_autoplay_report', null);
  // what the last run found (the check restarts the game when it ends): sent once
  if (rep && rep.build && rep.at && ap.sent !== rep.at) { ap.sent = rep.at; put(KEY.ap, ap);
    for (const d of rep.done || []) if (d.problems && d.problems.length) autoReport('autoplay', `${d.name || d.key}: ${d.problems.join('; ')}`.slice(0, 200), { area: 'autoplay', place: '', game: d.g === 'games' ? d.key : '', window: d.g || '', x: 0, z: 0 }); }
  if (ap.ran === BUILD) return;
  const charging = await (navigator.getBattery ? navigator.getBattery().then(b => b.charging).catch(() => false) : Promise.resolve(false)), h = new Date().getHours();
  if (!charging && !(h >= 0 && h < 6)) return;
  if (Date.now() - lastInput < 120e3 || G.paused) return; // (only when nobody is playing)
  ap.ran = BUILD; put(KEY.ap, ap);
  if (!G.autoplay) { const m = await import('./autoplay.js'); m.mountAutoplay(G); }
  if (G.autoplay && G.autoplay.start && !G.autoplay.running()) G.autoplay.start(null, 'fast');
}
let lastInput = Date.now();

// ---------- the agreement, the Settings rows ----------
const accepted = () => { const a = get(KEY.acc, null); return !!(a && a.at && !a.stopped); };
function agreement() {
  if (document.querySelector('.modal.tagree')) return;
  const A = C.AGREEMENT, m = modal('tagree', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${L(A.title)}</h2></div>
    <p>${L(A.intro)}</p><ul class="tg-list">${A.points.map(p => `<li>${esc(L(p))}</li>`).join('')}</ul>
    <div class="actions"><button class="btn primary tg-yes">${L(A.accept)}</button><button class="btn tg-no">${L(A.later)}</button></div>`);
  const card = m.querySelector('.card');
  card.querySelector('.tg-yes').onclick = () => { put(KEY.acc, { at: Date.now(), b: BUILD }); m.close(); tell({ accepted: true, dev: { label: '' } }); start(); say(...C.TESTER_LINES.welcome); };
  card.querySelector('.tg-no').onclick = () => { m.close(); };
}
// the Settings card (js/ui.js openQuick) shows a Tester section on a tester device
export function settingsRows(box, redraw) {
  if (!box) return; const on = accepted(), q = queue().length, st = status || {};
  box.innerHTML = `<div class="qs-sec qs-tester"><h4>${pic('🐞')} ${T('Tester', 'Người thử')}</h4>${on ? `
    <p class="note">${T(`Reports sent: ${st.reports || 0} · helped fix: ${st.helped || 0}${q ? ` · waiting to send: ${q}` : ''}`, `Đã gửi: ${st.reports || 0} báo cáo · giúp sửa: ${st.helped || 0}${q ? ` · đang chờ gửi: ${q}` : ''}`)}</p>
    <div class="qs-trow"><button class="btn" data-t="mine">${T('My reports', 'Báo cáo của tôi')}</button><button class="btn" data-t="ap">${T('Run the auto play check now', 'Chạy tự chơi kiểm tra ngay')}</button>${G.testerRewards ? `<button class="btn" data-t="corner">${T('Tester\'s Corner', 'Góc người thử')}</button>` : ''}</div>
    <button class="btn" data-t="stop">${T('Stop being a tester', 'Thôi làm người thử')}</button>` : `<button class="btn primary" data-t="join">${T('Become a tester', 'Làm người thử')}</button>`}</div>`;
  const act = { join: () => { const a = get(KEY.acc, {}); delete a.stopped; put(KEY.acc, a); agreement(); },
    stop: () => { put(KEY.acc, { ...get(KEY.acc, {}), stopped: Date.now() }); stop(); redraw && redraw(); },
    mine: () => showMine(), corner: () => G.testerRewards && G.testerRewards.corner(),
    ap: async () => { if (!G.autoplay) { const m = await import('./autoplay.js'); m.mountAutoplay(G); } G.autoplay && G.autoplay.start && G.autoplay.start(null, 'fast'); } };
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { SFX.tap && SFX.tap(); act[b.dataset.t](); });
}
const STATUS_WORDS = { new: ['New', 'Mới'], fixing: ['Being fixed', 'Đang sửa'], fixed: ['Fixed', 'Đã sửa'], confirmed: ['Fixed and checked', 'Đã sửa và kiểm tra'], back: ['Came back', 'Bị lại'], notbug: ['Not a problem', 'Không phải lỗi'], dup: ['Same as another', 'Trùng lỗi khác'] };
function showMine() {
  const list = ((status && status.mine) || []).slice().reverse(), waiting = queue();
  const m = modal('tpanel tmine', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('My reports', 'Báo cáo của tôi')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    ${waiting.length ? `<p class="note">${T(`${waiting.length} waiting to send`, `${waiting.length} đang chờ gửi`)}</p>` : ''}
    <div class="tm-list">${list.length ? list.map(p => `<div class="tm-row s-${esc(p.status)}"><b>${esc(p.title)}</b><small>${L(STATUS_WORDS[p.status] || ['', ''])}${p.fixedIn ? ' · ' + esc(p.fixedIn) : ''}</small></div>`).join('') : `<p class="note">${T('Nothing yet. Tap the ladybird when something looks wrong.', 'Chưa có gì. Chạm vào con bọ rùa khi thấy gì không ổn.')}</p>`}</div>`);
  m.querySelector('.x').onclick = () => m.close();
}

// ---------- starting and stopping ----------
function start() {
  if (live || !accepted()) return; live = true; mounted = performance.now();
  hookRender(); watch(); addUI();
  const inp = () => { lastInput = Date.now(); }; addEventListener('pointerdown', inp, true); addEventListener('keydown', inp, true); offs.push(() => { removeEventListener('pointerdown', inp, true); removeEventListener('keydown', inp, true); });
  setPeeks(C.peeksOf(liveRule('tester')));
  import('./testerrewards.js').then(m => m.mountRewards(G, () => status)).then(() => refresh()).catch(() => refresh());
  const rf = setInterval(refresh, 10 * 60e3); offs.push(() => clearInterval(rf));
  setTimeout(() => { flush(); retest(); }, 20000);
  const nt = setInterval(nightly, 5 * 60e3); offs.push(() => clearInterval(nt)); setTimeout(nightly, 30000);
}
function stop() { live = false; offs.splice(0).forEach(f => { try { f(); } catch (e) { } }); setPeeks([]); if (G.testerRewards) G.testerRewards.unmount(); }

// js/testergate.js: this device is a tester at this level ('' = no longer)
export function mountTester(game, lv) {
  G = game; level = lv;
  G.tester = { level, openPanel, autoReport, refresh, retest, nightly, settings: settingsRows, status: () => status, unmount: () => { stop(); delete G.tester; } };
  // (the agreement waits until a child is in the valley, not over the title screen)
  if (accepted()) start(); else if (!(get(KEY.acc, null) || {}).stopped) { const wait = setInterval(() => { if (!G.tester) return clearInterval(wait); if (G.heroes && G.heroes.length && !G.paused) { clearInterval(wait); setTimeout(agreement, 1200); } }, 500); }
}

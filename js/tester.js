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
import { takeCopy, putCopyBack, hasCopy, dropCopy } from './keepcopy.js';
import { revertOf } from './content/autoplay.js';
import { easyName } from './content/devname.js';
import { unreachableControl, activeReportPanel, observeGameOpen } from './tester-detection.js';

const KEY = { acc: 'sv2_tester', out: 'sv2_tester_out', st: 'sv2_tester_status', seen: 'sv2_tester_seen', ap: 'sv2_tester_ap', delivery: 'sv2_report_delivery', copy: 'sv2_tester_copy' };
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const URL_ = () => window.__svTesterURL || 'api/tester';
const me = () => { try { return localStorage.getItem('sv2_playerid') || ''; } catch (e) { return ''; } };
const L = pair => T(pair[0], pair[1]);

let G = null, level = '', live = false, offs = [], log = [], errors = [], want = null, lastGame = '', status = get(KEY.st, null), panelOpening = false;
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
async function grab(sceneOnly = false) {
  try { const src = G.renderer?.domElement, copy = document.createElement('canvas'); if (src) { copy.width = src.width; copy.height = src.height; copy.getContext('2d').drawImage(src,0,0); } const m = await import('./screencapture.js'); return await m.captureScreen(copy, { sceneOnly }); } catch { return ''; }
}
const shot = (sceneOnly = false) => new Promise(res => { let done = false; const fin = async () => { if (done) return; done = true; want = null; res(await grab(sceneOnly)); }; want = fin; setTimeout(fin, 400); });

// ---------- sending ----------
const clientId = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');
const queue = () => { const rows = get(KEY.out, []); let changed = false; for (const row of rows) if (!row.clientId) { row.clientId = clientId(); changed = true; } if (changed) keep(rows); return rows; };
function keep(list) { if (put(KEY.out, list)) return; const thin = list.map((r, i) => i < list.length - 5 ? { ...r, shot: '' } : r); if (!put(KEY.out, thin)) put(KEY.out, thin.slice(-10).map(r => ({ ...r, shot: '' }))); }
function enqueue(r) { const q = queue(); r.clientId ||= clientId(); q.push(r); keep(q.slice(-C.LIMITS.queue)); delivery(r.clientId, { state: 'queued' }); paintCount(); flush(); return r.clientId; }
function delivery(id, result) { const all = get(KEY.delivery, {}); all[id] = { ...result, at: Date.now() }; const entries = Object.entries(all).slice(-120); put(KEY.delivery, Object.fromEntries(entries)); dispatchEvent(new CustomEvent('sv-report-delivery')); }
export const reportDelivery = id => get(KEY.delivery, {})[id] || { state: 'queued' };
export const reportingState = () => ({ enabled: live, queued: queue().length, sending: flushing });
export const retryReports = () => flush();
export async function sendAutoplayReport(rep) {
  if (!live) return { state: 'disabled', ids: [] };
  const ids = [];
  for (const d of rep.done || []) if (d.problems?.length) { const id = await autoReport('autoplay', `${d.name || d.key}: ${d.problems.join('; ')}`.slice(0, 200), { area: 'autoplay', place: '', game: d.g === 'games' ? d.key : '', window: d.g || '', x: 0, z: 0 }); if (id) ids.push(id); }
  return { state: ids.length ? 'queued' : 'no-problems', ids };
}
let flushing = false;
async function flush() {
  if (flushing || !live || navigator.onLine === false) return; flushing = true;
  // (14 Oct AEDT) the list is read again after each send and only the report just sent is taken off: a report made
  // while another was being sent (an error just as a "slow" report went) used to be lost when the old list was kept
  const same = (x, r) => x && x.at === r.at && x.kind === r.kind && (x.auto || '') === (r.auto || '') && (x.detail || '') === (r.detail || '') && (x.note || '') === (r.note || '');
  try {
    const attempted = new Set();
    while (true) {
      const r = queue().find(row => !attempted.has(row.clientId));
      if (!r) break;
      attempted.add(r.clientId);
      delivery(r.clientId, { state: 'sending' }); let res = null; try { res = await fetch(URL_(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }); } catch (e) { delivery(r.clientId, { state: 'retry' }); break; }
      if (!res.ok) { delivery(r.clientId, { state: 'retry', status: res.status }); if ([400,413].includes(res.status)) continue; break; }
      let receipt; try { receipt = await res.json(); } catch { delivery(r.clientId, { state: 'retry' }); break; }
      if (!receipt.ok || !receipt.rid) { delivery(r.clientId, { state: 'retry' }); break; }
      delivery(r.clientId, { state: 'sent', rid: receipt.rid, problem: receipt.k });
      const q = queue(), k = q.findIndex(x => same(x, r)); if (k >= 0) { q.splice(k, 1); keep(q); } // only acknowledged reports leave the durable queue
    }
  } finally { flushing = false; paintCount(); }
}
const body = (kind, extra) => ({ id: me(), b: BUILD, kind, where: whereNow(), errors: errors.slice(-C.LIMITS.errors), log: log.map(([t, k, s]) => [Math.round((t - Date.now()) / 100) / 10, k, s]), dev: devNow(), players: playersNow(), at: Date.now(), ...extra });

// the game reports by itself (the same thing at the same place once in 10 minutes, counted meanwhile)
// (more: extra fields; more.log, the auto play check's last steps, goes before the tester's own log)
export async function autoReport(kind, detail, where, more = {}) {
  if (!live) return; const w = where || whereNow(), k = C.keyOf(kind, detail, w.game || w.window || w.area);
  counts.set(k, (counts.get(k) || 0) + 1); const last = sent.get(k);
  if (last && Date.now() - last.at < C.LIMITS.sameAgain) return last.id;
  const n = counts.get(k); counts.set(k, 0); note('report', kind + ' ' + detail);
  const b = body('auto', { auto: kind, detail: String(detail || '').slice(0, 200), where: w, shot: await shot(), count: n });
  if (Array.isArray(more.log)) b.log = more.log.concat(b.log).slice(-300); // (the website keeps the last 300)
  const id = enqueue(b); sent.set(k, { at: Date.now(), id }); return id;
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
  if (G.playGame && !G.playGame.__tester) {
    const pg = G.playGame, pending = new Set();
    G.playGame = Object.assign(function (i, id, ...a) {
      const requested = String(id || ''); lastGame = requested; note('game', requested);
      // The game rejects a second launch while another activity is open: not a failed open.
      const cancel = document.querySelector('.gl:not(.out)') ? null : observeGameOpen(requested, () => { if (live) autoReport('noopen', requested); }, {wait:C.LIMITS.openWait * 1000});
      if (cancel) pending.add(cancel);
      const timer = setTimeout(() => { if (cancel) pending.delete(cancel); }, C.LIMITS.openWait * 1000 + 10);
      try { return pg.call(this, i, id, ...a); } catch (error) { cancel?.(); pending.delete(cancel); clearTimeout(timer); throw error; }
    }, { __tester:true });
    offs.push(() => { pending.forEach(cancel => cancel()); pending.clear(); G.playGame = pg; });
  }
  // a child stuck (js/players.js watchHero)
  setProblemHook((kind, key) => { if (kind === 'stuck') autoReport('stuck', key); }); offs.push(() => setProblemHook(null));
  // frames: frozen (no frame for 2 s while on screen) and slow (under 20 a second for 10 s)
  let lastF = performance.now(), frames = 0, since = performance.now(), raf = 0;
  const tick = t => { if (!live) return; const gap = t - lastF; if (gap > C.LIMITS.freeze * 1000 && document.visibilityState === 'visible' && performance.now() - mounted > 15000) autoReport('freeze', `${(gap / 1000).toFixed(1)} s`);
    lastF = t; frames++; if (t - since > C.LIMITS.slowFor * 1000) { fpsNow = frames * 1000 / (t - since); if (fpsNow < C.LIMITS.slowFps && document.visibilityState === 'visible' && performance.now() - mounted > 15000) autoReport('slow', `${Math.round(fpsNow)} frames a second`); frames = 0; since = t; }
    raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick); offs.push(() => cancelAnimationFrame(raf));
  const resetFrames = () => { lastF=performance.now();since=performance.now();frames=0; };
  on(document, 'visibilitychange', resetFrames);
  on(window,'pagehide',resetFrames); on(window,'pageshow',resetFrames);
  on(document,'freeze',resetFrames); on(document,'resume',resetFrames);
  // every 5 s: a button off the screen, a line with no recording, where the child walked
  let misses = new Set(voiceMisses().map(m => m[0] + '|' + m[1])), lastPos = '';
  const every = setInterval(() => {
    const top = activeReportPanel(document);
    for (const b of document.querySelectorAll('.modal button, .hud button, .gl button, .dialog button')) {
      if (unreachableControl(b, top)) autoReport('offscreen', labelOf(b));
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
  // (each player's HUD gets the mark under its clock and, at the ladybird level, the ladybird with the zoom buttons; also
  // the HUDs made after this: the game starts after the title screen)
  const ensure = () => (G.huds || []).forEach((hud, i) => {
    const ck = hud.q && hud.q('.zoom'); if (ck && !ck.querySelector('.testermark')) { const mk = el('span', 'testermark', `${pic('🐞')}<span>${T('Tester', 'Người thử')} · ${BUILD}</span>`); mk.setAttribute('aria-hidden', 'true'); ck.appendChild(mk); offs.push(() => mk.remove()); }
    if (level !== 'ladybird') return;
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
async function quickReport() { SFX.tap && SFX.tap(); const s = await shot(); enqueue(body('broken', { note: T('Quick report: something was wrong just now', 'Báo nhanh: vừa có gì đó không ổn'), detail: 'quick', shot: s })); toast(L(C.TESTER_LINES.waiting)); }
function toast(s) { const t = el('div', 'testertoast', esc(s)); document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2600); }

// the panel: the picture is taken first, then a kind, a spoken or typed note, Send; or "Already reported → add to it"
export async function openPanel(i = 0, initialTab = 'tester') {
  const existing=document.querySelector('.modal.tpanel');
  if(existing){existing.selectTab?.(initialTab);return existing;}
  if (!live || panelOpening) return;
  panelOpening=true; let pic0,scenePic;
  try {pic0=await shot();scenePic=await shot(true);} finally {panelOpening=false;}
  if(!live)return;
  // Capture what the reporter saw, then clear competing control trays for the form.
  document.querySelector('.audio-tray')?.close?.();
  document.querySelectorAll('.zoomer.open').forEach(x=>x.classList.remove('open'));
  const where=whereNow();
  const was = G.paused; G.paused = true; SFX.tap && SFX.tap();
  const near = ((status && status.open) || []).filter(p => p.where && ((where.game && p.where.game === where.game) || (where.window && p.where.window === where.window) || (!where.game && !where.window && p.where.area === where.area && Math.hypot((p.where.x || 0) - where.x, (p.where.z || 0) - where.z) < 25))).slice(0, 3);
  let kind = 'broken', spoken = false, selectedShot = pic0;
  const m = modal('tpanel', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('Report a problem', 'Báo lỗi')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <div class="actions"><button class="btn tp-retry">${T('Retry queued reports', 'Gửi lại báo cáo đang chờ')}</button></div><p class="note" role="status">${T(`${queue().length} reports queued. Sent reports are in My reports.`, `${queue().length} báo cáo đang chờ. Báo cáo đã gửi nằm trong Báo cáo của tôi.`)}</p>
    <label class="tog"><input type="checkbox" class="tp-full" checked> ${T('Include the complete interface', 'Kèm toàn bộ giao diện')}</label><img class="tp-shot" alt="" src="${pic0}">
    ${near.length ? `<div class="tp-near"><b>${T('Already reported here', 'Đã có người báo ở đây')}</b>${near.map(p => `<div class="tp-old"><span>${esc(p.title)} <small>· ${p.n}×</small></span><button class="btn" data-join="${esc(p.k)}">${T('Same problem: add to it', 'Cùng lỗi: báo thêm')}</button></div>`).join('')}</div>` : ''}
    <div class="tp-kinds">${C.KINDS.map(k => `<button class="tp-k ${k.id === kind ? 'on' : ''}" data-k="${k.id}" aria-pressed="${k.id === kind}">${pic(k.icon)}<span>${T(k.en, k.vi)}</span></button>`).join('')}</div>
    <div class="tp-note"><textarea maxlength="600" rows="3" placeholder="${T('What happened? What did you expect?', 'Chuyện gì xảy ra? Bạn mong điều gì?')}"></textarea>${canListen() ? `<button class="btn tp-mic" aria-label="${T('Say it', 'Nói')}">${pic('🎤')} ${T('Say it', 'Nói')}</button>` : ''}</div>
    <div class="actions"><button class="btn primary tp-send">${T('Send', 'Gửi')}</button></div>`);
  const card = m.querySelector('.card'), ta = card.querySelector('textarea');
  card.querySelector('.tp-full').onchange = e => { selectedShot = e.target.checked ? pic0 : scenePic; card.querySelector('.tp-shot').src = selectedShot; };
  const reportBody = el('div','testing-report'), autoBody = el('div','testing-auto');
  const head = card.querySelector('.tp-head');
  [...card.children].filter(child => child !== head).forEach(child => reportBody.appendChild(child));
  const tabs = el('div','testing-tabs', `<button class="btn" data-test-tab="tester" role="tab">${T('Tester','Người thử')}</button><button class="btn" data-test-tab="autoplay" role="tab">${T('Auto play','Tự chơi')}</button>`);
  tabs.setAttribute('role','tablist'); reportBody.id='testing-report'; autoBody.id='testing-autoplay';
  reportBody.setAttribute('role','tabpanel'); autoBody.setAttribute('role','tabpanel'); autoBody.hidden=true;
  const reportActions=reportBody.querySelector('.tp-send').closest('.actions');reportActions.classList.add('testing-actions');
  card.append(tabs,reportBody,autoBody,reportActions);
  const close = () => { G.autoplay?.detach?.(); m.close(); G.paused = was; };
  card.querySelector('.x').onclick = close;
  const selectTab = tab => {
    reportBody.hidden=tab!=='tester'; autoBody.hidden=tab!=='autoplay';reportActions.hidden=tab!=='tester';
    head.querySelector('h2').textContent=tab==='tester'?T('Report a problem','Báo lỗi'):T('Auto play','Tự chơi');
    tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.testTab===tab;b.classList.toggle('primary',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;b.id='testing-tab-'+b.dataset.testTab;const target=b.dataset.testTab==='tester'?reportBody:autoBody;b.setAttribute('aria-controls',target.id);target.setAttribute('aria-labelledby',b.id);});
    if (tab==='autoplay') {
      if (G.autoplay?.attach) G.autoplay.attach(autoBody,close);
      else autoBody.textContent=T('Auto play is not enabled on this device.','Tự chơi chưa được bật trên máy này.');
    }
  };
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>selectTab(b.dataset.testTab));
  tabs.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'tester':e.key==='End'?'autoplay':reportBody.hidden?'tester':'autoplay';selectTab(next);tabs.querySelector(`[data-test-tab="${next}"]`).focus();}};
  m.selectTab=selectTab;
  selectTab(initialTab);
  card.querySelector('.tp-retry').onclick = () => flush();
  card.querySelectorAll('.tp-k').forEach(b => b.onclick = () => { kind = b.dataset.k; card.querySelectorAll('.tp-k').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); SFX.tap && SFX.tap(); });
  const mic = card.querySelector('.tp-mic'); if (mic) mic.onclick = async () => { mic.disabled = true; const heard = await listen({ onPartial: t => { ta.value = t; } }); mic.disabled = false; if (heard && heard[0] !== '\u0000') { ta.value = (ta.value && ta.value !== heard ? ta.value + ' ' : '') + heard; spoken = true; } };
  const send = join => { enqueue(body(kind, { note: ta.value.trim(), spoken, shot: selectedShot, where, join: join || '' })); close(); toast(join ? L(C.TESTER_LINES.already) : L(C.TESTER_LINES.waiting)); say(...(join ? C.TESTER_LINES.already : C.TESTER_LINES.waiting)); };
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
    const tag = 'rt:' + p.k + ':' + BUILD; if (done[tag]) continue;
    if (G.paused || document.querySelector('.gl, .modal, .theatre, .storybook')) return; // (only when the child is free)
    const game = p.where && p.where.game, before = errors.length; let again = false;
    if (game && G.playGame) { G.playGame(0, game, 'replay'); await new Promise(r => setTimeout(r, 8000)); again = !document.querySelector('.gl') || errors.length > before; document.querySelector('.gl .gl-x')?.click(); }
    else if (p.auto === 'error') { await new Promise(r => setTimeout(r, 8000)); again = errors.slice(before).some(e => p.title.includes(e.split(' @ ')[0].slice(0, 40))); }
    else continue; // (a problem that cannot be replayed by itself waits for the tester's Yes or Still wrong)
    done[tag]=1;put(KEY.seen,done);tell({ k: p.k, fixed: !again }); note('retest', p.k + (again ? ' came back' : ' fixed'));
  }
}

// ---------- the auto play check by itself, on a new version (at night or while charging) ----------
async function nightly() {
  const ap = get(KEY.ap, {}); const rep = get('sv2_autoplay_report', null);
  // Recover legacy reports into the same receipt-backed outbox as a current run.
  if (rep && rep.build && rep.at && !rep.reportIds?.length && ap.sent !== rep.at) {
    const result = await sendAutoplayReport(rep);
    if (result.state !== 'disabled') { rep.reportIds = result.ids; rep.reportState = result.state; put('sv2_autoplay_report', rep); ap.sent = rep.at; put(KEY.ap, ap); await flush(); }
  }
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
  card.querySelector('.tg-yes').onclick = () => { put(KEY.acc, { at: Date.now(), b: BUILD }); takeCopy(KEY.copy); m.close(); tell({ accepted: true, dev: { label: '' } }); start(); say(...C.TESTER_LINES.welcome); };
  card.querySelector('.tg-no').onclick = () => { m.close(); };
}
// the Settings card (js/ui.js openQuick) shows a Tester section on a tester device
export function settingsRows(box, redraw) {
  if (!box) return; const on = accepted(), q = queue().length, st = status || {};
  const policy = revertOf(liveRule('tester'), me());
  const retention = policy === 'keep'
    ? T('This device keeps progress after testing.', 'Máy này giữ tiến bộ sau khi thử nghiệm.')
    : policy === 'autoplay'
      ? T('Autoplay restores coins and game progress after each run. Clothes, badges, stickers and grown-up settings stay; manual play stays.', 'Tự chơi trả lại xu và tiến bộ sau mỗi lượt. Quần áo, huy hiệu, nhãn dán và cài đặt người lớn vẫn giữ; chơi bằng tay vẫn giữ.')
      : T('Coins and game progress return to the saved starting point when tester mode ends, including manual play. Clothes, badges, stickers and grown-up settings stay.', 'Xu và tiến bộ trở về điểm đã lưu khi thôi làm người thử, kể cả chơi bằng tay. Quần áo, huy hiệu, nhãn dán và cài đặt người lớn vẫn giữ.');
  // (owner, 13 Oct AEDT: "tidy up the tester section ... tidier and smarter design") one card: who this device is, the
  // reports as three chips, three big tiles, and "Stop being a tester" held down on its own at the bottom
  const tile = (k, ic, en, vi, sub) => `<button class="tst-tile" data-t="${k}"><span class="tst-ic">${pic(ic)}</span><b>${T(en, vi)}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  box.innerHTML = `<div class="qs-sec qs-tester">${on ? `
    <div class="tst-head"><span class="tst-lb">${pic('🐞')}</span><div><b>${T('You are a tester', 'Con là người thử')}</b><small>${esc(BUILD)}${me() ? ' · ' + esc(easyName(me(), settings.lang)) : ''}</small></div></div>
    <div class="tst-stats"><span class="tst-chip"><b>${st.reports || 0}</b>${T('sent', 'đã gửi')}</span><span class="tst-chip ok"><b>${st.helped || 0}</b>${T('helped fix', 'giúp sửa')}</span>${q ? `<span class="tst-chip wait"><b>${q}</b>${T('waiting to send', 'chờ gửi')}</span>` : ''}</div>
    <div class="tst-tiles">${tile('mine', '📋', 'My reports', 'Báo cáo của tôi')}${tile('ap', '🤖', 'Auto play', 'Tự chơi', T('Plays the game by itself to find problems', 'Tự chơi game để tìm lỗi'))}${G.testerRewards ? tile('corner', '🏆', "Tester's Corner", 'Góc người thử', T('Badges and stickers', 'Huy hiệu và nhãn dán')) : ''}</div>
    <button class="btn tst-stop hold" data-hold="stop"><span class="ring"></span>${T('Hold to stop being a tester', 'Giữ để thôi làm người thử')}</button>
    <p class="note">${retention}</p>` : `
    <div class="tst-head"><span class="tst-lb">${pic('🐞')}</span><div><b>${T('Tester', 'Người thử')}</b><small>${T('Help find problems: report what looks wrong, and earn badges.', 'Giúp tìm lỗi: báo những gì không ổn, và nhận huy hiệu.')}</small></div></div>
    <button class="btn primary" data-t="join">${T('Become a tester', 'Làm người thử')}</button>`}</div>`;
  const act = { join: () => { const a = get(KEY.acc, {}); delete a.stopped; put(KEY.acc, a); agreement(); },
    stop: () => { put(KEY.acc, { ...get(KEY.acc, {}), stopped: Date.now() }); if (G.autoplay && G.autoplay.stop) G.autoplay.stop(); stop(); putBack(); redraw && redraw(); },
    mine: () => showMine(), corner: () => G.testerRewards && G.testerRewards.corner(),
    ap: async () => { if (!G.autoplay) { const m = await import('./autoplay.js'); m.mountAutoplay(G); } if (G.autoplay && G.autoplay.open) G.autoplay.open(); } };
  box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { SFX.tap && SFX.tap(); act[b.dataset.t](); });
  const h = box.querySelector('[data-hold="stop"]'); if (h) holdButton(h, () => { SFX.tap && SFX.tap(); act.stop(); });
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
  if (!hasCopy(KEY.copy)) takeCopy(KEY.copy); // (a tester from before 13 Oct: progress from now on goes back when they stop)
  hookRender(); watch(); addUI();
  const inp = () => { lastInput = Date.now(); }; addEventListener('pointerdown', inp, true); addEventListener('keydown', inp, true); offs.push(() => { removeEventListener('pointerdown', inp, true); removeEventListener('keydown', inp, true); });
  setPeeks(C.peeksOf(liveRule('tester')), 7);   // (rollout, owner 13 Oct AEDT) and each batch 7 days before its start
  import('./testerrewards.js').then(m => m.mountRewards(G, () => status)).then(() => refresh()).catch(() => refresh());
  const rf = setInterval(refresh, 10 * 60e3); offs.push(() => clearInterval(rf));
  setTimeout(() => { flush(); retest(); }, 20000);
  const nt = setInterval(nightly, 5 * 60e3); offs.push(() => clearInterval(nt)); setTimeout(nightly, 30000);
}
// (owner, 13 Oct AEDT) the progress from when this device became a tester goes back when they stop being one, in place
// (no restart); badges, stickers and clothes stay. Studio's tester rule `revert: 'autoplay'` instead puts back only what
// each auto play run did (js/autoplay.js), so nothing goes back here.
function putBack() {
  if (revertOf(liveRule('tester'), me()) !== 'progress' || !hasCopy(KEY.copy)) { dropCopy(KEY.copy); return; }
  if (putCopyBack(KEY.copy, G)) { const m = T('Progress is back as it was before testing. Badges and stickers stay.', 'Tiến bộ đã trở lại như trước khi thử. Huy hiệu và nhãn dán vẫn giữ.'); (G.huds || []).forEach(h => h.toast && h.toast(m)); }
}
function stop() { live = false; offs.splice(0).forEach(f => { try { f(); } catch (e) { } }); setPeeks([]); if (G.testerRewards) G.testerRewards.unmount(); }

// js/testergate.js: this device is a tester at this level ('' = no longer)
export function mountTester(game, lv) {
  G = game; level = lv;
  G.tester = { level, openPanel, autoReport, refresh, retest, nightly, settings: settingsRows, status: () => status, unmount: () => { stop(); delete G.tester; } };
  // (the agreement waits until a child is in the valley, not over the title screen)
  if (accepted()) start(); else if (!(get(KEY.acc, null) || {}).stopped) { const wait = setInterval(() => { if (!G.tester) return clearInterval(wait); if (G.heroes && G.heroes.length && !G.paused) { clearInterval(wait); setTimeout(agreement, 1200); } }, 500); }
}

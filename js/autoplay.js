// The auto play check (owner, 12 Oct AEDT): a small window for grown-ups testing the game as a child sees it. It walks
// the child to each game, festival, folk show, story, place, villager and shop, opens it, lets it run for a moment,
// closes it and notes what went wrong: an error, something that did not open or close, a line with no recording,
// a slow screen, a button off the screen. Lists and timings: js/content/autoplay.js. Loaded only on the devices
// Studio's Releases page allows (switch `autoplay`), from main.js.
// While it runs the child never tires (stamina and hearts stay full) and nothing is counted for the players report;
// when it stops, everything the device had saved (progress, coins, stars) is put back as it was and the game restarts.
import { T } from './i18n.js';
import { el, esc } from './util.js';
import { GAMES } from './games/frame.js';
import { CUSTOM } from './custom.js';
import { FESTCAL } from './content/festcal.js';
import { voiceMisses } from './voice.js';
import { settings } from './state.js';
import { BUILD } from './build.js';
import { AP_GROUPS, AP_SPEEDS, AP_OPEN_WAIT, apGroupOf, AP_KEEP } from './content/autoplay.js';

const REPORT = 'sv2_autoplay_report', BACKUP = 'sv2_autoplay_backup', UI = 'sv2_autoplay_ui';
const wait = ms => new Promise(r => setTimeout(r, ms));
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const STOP = new Error('stop'), SKIP = new Error('skip');
let G = null, root = null, run = null, ui = null, errSink = null;

export function mountAutoplay(game) {
  if (root) return;
  G = game;
  if (localStorage.getItem(BACKUP)) { putBack(); return; } // a check that never finished (the page was closed): put things back first
  ui = Object.assign({ open: false, groups: AP_GROUPS.map(g => g.key), speed: 'fast', x: null, y: null, q: '' }, get(UI, {}));
  root = el('div', 'apbox'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', T('Auto play check', 'Tự chơi để kiểm tra'));
  style(); document.body.appendChild(root); draw();
  addEventListener('error', e => errSink && errSink.push(String(e.message || e.error || 'error')));
  addEventListener('unhandledrejection', e => errSink && errSink.push(String((e.reason && e.reason.message) || e.reason || 'error')));
  const ce = console.error; console.error = (...a) => { if (errSink) errSink.push(a.map(String).join(' ').slice(0, 200)); ce.apply(console, a); };
  G.autoplay = { unmount, running: () => !!run, start: (keys, speed) => { if (speed) ui.speed = speed; return start(keys); } }; // (start: the window, and the autoplay check)
}
export function unmount() { if (run) run.stop = true; if (root) root.remove(); root = null; if (G) delete G.autoplay; }

// ---------- putting the device back as it was ----------
function backup() {
  const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^sv2_/.test(k) && !AP_KEEP.test(k)) o[k] = localStorage.getItem(k); }
  localStorage.setItem(BACKUP, JSON.stringify({ t: Date.now(), o }));
}
function putBack() {
  let b = null; try { b = JSON.parse(localStorage.getItem(BACKUP) || 'null'); } catch (e) { b = null; }
  if (b && b.o) {
    const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    for (const k of keys) if (/^sv2_/.test(k) && !AP_KEEP.test(k) && !(k in b.o)) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(b.o)) localStorage.setItem(k, v);
  }
  localStorage.removeItem(BACKUP);
  // the game saves when the page goes away: keep it from writing the check's play over what was just put back
  const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (/^sv2_/.test(k) && !AP_KEEP.test(k)) return; return set.call(this, k, v); };
  location.reload();
}

// ---------- what to check ----------
function steps(all) {
  const on = new Set(all ? AP_GROUPS.map(g => g.key) : ui.groups), S = [], add = (g, key, name, fn) => { if (on.has(g)) S.push({ g, key, name, fn }); };
  for (const id of Object.keys(GAMES)) add('games', 'game:' + id, () => (GAMES[id].name ? GAMES[id].name() : id), note => doGame(id, note));
  for (const F of FESTCAL) add('festivals', 'fest:' + F.id, () => T(F.en, F.vi), note => doFestival(F, note));
  for (const t of G.TALES || []) add('stories', 'tale:' + t.id, () => t.title(), note => doTale(t, note));
  (G.PLACES || []).forEach((p, k) => add('places', 'place:' + (p.key || k), () => p.name(), note => doPlace(p, note)));
  for (const it of G.interactables || []) { const g = apGroupOf(it.id || ''); if (g === 'festivals' || !it.act || !Number.isFinite(it.x)) continue; add(g, 'tap:' + it.id, () => (typeof it.label === 'function' ? it.label() : it.id), note => doTap(it, note)); }
  if (G.openWardrobe) add('shop', 'wardrobe', () => T('Wardrobe', 'Tủ đồ'), note => doOpen(() => G.openWardrobe(0), note));
  if (G.openSongs) add('shop', 'songs', () => T('Songs', 'Bài hát'), note => doOpen(() => G.openSongs(), note));
  const q = all ? '' : (ui.q || '').trim().toLowerCase();
  return q ? S.filter(s => { try { return s.name().toLowerCase().includes(q) || s.key.includes(q); } catch (e) { return false; } }) : S;
}

// ---------- doing it ----------
const hero = () => G.heroes && G.heroes[0];
const sp = () => AP_SPEEDS[run.speed] || AP_SPEEDS.fast;
// a moment that can be paused, skipped or stopped
async function hold(sec) { const end = Date.now() + sec * 1000; while (Date.now() < end || run.paused) { if (run.stop) throw STOP; if (run.skip) { run.skip = false; throw SKIP; } await wait(100); } }
async function until(test, sec) { const end = Date.now() + sec * 1000; while (Date.now() < end) { if (run.stop) throw STOP; if (test()) return true; await wait(100); } return !!test(); }
async function go(x, z) {
  const h = hero(); if (!h || !Number.isFinite(x) || !Number.isFinite(z)) return;
  const far = () => Math.hypot(h.pos.x - x, h.pos.z - z); if (far() < 2.5) return;
  G.paused = false;
  if (sp().walk === 'fly') { await G.travel(h, x, z); return; }
  if (sp().walk === 'walk') { // like a child's tap-to-walk; a child that gets stuck slides the rest of the way
    let last = far(), still = 0;
    for (let t = 0; t < 600 && far() > 2; t++) { h.goal = { x, z }; await hold(.1); if (Math.abs(far() - last) < .03) still++; else still = 0; last = far(); if (still > 25) break; }
    h.goal = null; if (far() <= 2) return;
  }
  const v = sp().glide; let t0 = performance.now();
  while (far() > 1.6) {
    if (run.stop) throw STOP; if (run.skip) { run.skip = false; throw SKIP; }
    await new Promise(r => requestAnimationFrame(r)); if (run.paused) { t0 = performance.now(); continue; }
    const now = performance.now(), dt = Math.min(.1, (now - t0) / 1000); t0 = now;
    const d = far(), k = Math.min(1, v * dt / d), nx = h.pos.x + (x - h.pos.x) * k, nz = h.pos.z + (z - h.pos.z) * k;
    h.yaw = Math.atan2(x - h.pos.x, z - h.pos.z); h.place(nx, nz);
  }
}
const opened = () => document.querySelector('.gl, .theatre, .songs, .dialog, .modal, .pad');
async function closeAll() {
  for (const s of ['.gl .gl-x', '.th-x', '.sg-x']) document.querySelectorAll(s).forEach(b => b.click());
  await wait(350);
  document.querySelectorAll('.dialog, .modal, .pad, .gl, .theatre, .songs').forEach(e => { if (!root || !root.contains(e)) e.remove(); });
  document.body.classList.remove('songs-on'); G.paused = false;
}
function offScreen(box, note) {
  if (!box) return; const W = innerWidth, H = innerHeight;
  for (const b of box.querySelectorAll('button')) { const r = b.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right < 2 || r.bottom < 2 || r.left > W - 2 || r.top > H - 2) { note(T('a button off the screen: ', 'một nút ngoài màn hình: ') + (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30)); break; } }
}
async function doGame(id, note) {
  const spot = G.gameSpot && G.gameSpot(id); if (spot) await go(spot.x, spot.z);
  await closeAll(); G.playGame(0, id, 'replay');
  if (!await until(() => document.querySelector('.gl'), AP_OPEN_WAIT)) { note(T('did not open', 'không mở được')); return; }
  await hold(sp().game); offScreen(document.querySelector('.gl'), note);
  const x = document.querySelector('.gl .gl-x'); if (x) x.click();
  if (!await until(() => !document.querySelector('.gl'), 2)) note(T('did not close', 'không đóng được'));
}
async function doFestival(F, note) {
  const d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  CUSTOM.releases = { ...(CUSTOM.releases || {}), ['fest_' + F.id]: { on: true, start: ymd, days: 1 } }; // (this device, until the check stops)
  try {
    G.festivals.rebuild(); await wait(300);
    for (const key of F.where || []) { const s = (G.festivals.streetSpots(key) || [])[0]; if (s) { await go(s.x, s.z); await hold(sp().place); } }
    const it = (G.interactables || []).find(i => i.id === 'festival_' + F.id);
    if (!it) { note(T('no festival table', 'không có bàn lễ hội')); return; }
    await go(it.x, it.z); it.act(hero(), G); await hold(sp().talk); offScreen(opened(), note);
  } finally { delete CUSTOM.releases['fest_' + F.id]; G.festivals.rebuild(); }
}
async function doTale(t, note) {
  await closeAll(); G.readTale(0, t.id);
  if (!await until(() => document.querySelector('.theatre'), AP_OPEN_WAIT + 2.5)) { note(T('did not open', 'không mở được')); return; }
  const end = Date.now() + sp().story * 1000; while (Date.now() < end) { await hold(1); const n = document.querySelector('.th-next'); if (n) n.click(); }
  offScreen(document.querySelector('.theatre'), note);
  const x = document.querySelector('.th-x'); if (x) x.click();
  if (!await until(() => !document.querySelector('.theatre'), 2)) note(T('did not close', 'không đóng được'));
}
async function doPlace(p) { await go(p.x, p.z); await hold(sp().place); }
async function doTap(it, note) { await closeAll(); await go(it.x, it.z); it.act(hero(), G); await hold(sp().talk); offScreen(opened(), note); }
async function doOpen(open, note) { await closeAll(); open(); if (!await until(() => opened(), AP_OPEN_WAIT)) { note(T('did not open', 'không mở được')); return; } await hold(sp().talk); offScreen(opened(), note); }

// one step: its errors, missing recordings and frame rate are noted
async function step(s) {
  const problems = [], note = m => problems.push(m), errs = errSink = [], miss0 = new Set(voiceMisses().map(m => m[0] + '|' + m[1]));
  let frames = 0, on = true; const count = () => { if (!on) return; frames++; requestAnimationFrame(count); }; requestAnimationFrame(count);
  const t0 = performance.now(); let skipped = false;
  try { await s.fn(note); } catch (e) { if (e === STOP) { on = false; errSink = null; throw e; } if (e === SKIP) skipped = true; else note(T('error: ', 'lỗi: ') + String(e && e.message || e).slice(0, 160)); }
  on = false; errSink = null;
  await closeAll();
  const secs = (performance.now() - t0) / 1000, fps = secs > .5 ? Math.round(frames / secs) : null;
  for (const e of [...new Set(errs)].slice(0, 3)) note(T('error: ', 'lỗi: ') + e);
  for (const m of voiceMisses()) if (!miss0.has(m[0] + '|' + m[1])) note(T('no recording: ', 'chưa thu âm: ') + String(m[0]).slice(0, 80));
  if (fps != null && fps < 20) note(T(`slow: ${fps} frames a second`, `chậm: ${fps} khung hình mỗi giây`));
  return { g: s.g, key: s.key, name: (() => { try { return s.name(); } catch (e) { return s.key; } })(), ok: !problems.length && !skipped, skipped, problems, secs: Math.round(secs * 10) / 10, fps };
}
// keep the child going: full stamina and hearts the whole time
function neverTired() { const h = hero(); if (h) { h.stamina = h.staminaMax; h.exhausted = false; if (h.profile) h.hearts = h.profile.hearts; } }

async function start(only) {
  const h = hero(); if (!h || run) return;
  const list = only ? steps(true).filter(s => only.includes(s.key)) : steps(); if (!list.length) return;
  backup(); settings.countPlayers = false; // (not counted in the players report; put back with everything else)
  run = { speed: ui.speed, list, i: 0, done: [], paused: false, skip: false, stop: false, started: Date.now() };
  const keep = setInterval(neverTired, 200); draw();
  try { for (; run.i < list.length; run.i++) { draw(); run.done.push(await step(list[run.i])); put(REPORT, report()); } }
  catch (e) { if (e !== STOP) run.done.push({ g: '?', key: '?', name: '?', ok: false, problems: [String(e && e.message || e)] }); }
  clearInterval(keep);
  put(REPORT, report()); ui.open = true; put(UI, ui);
  putBack(); // everything back as it was; the game restarts and the window shows the report
}
const report = () => ({ at: new Date().toISOString(), build: BUILD, speed: run.speed, total: run.list.length, done: run.done });

// ---------- the window ----------
function style() {
  if (document.getElementById('apstyle')) return;
  const s = el('style'); s.id = 'apstyle';
  s.textContent = `.apbox{position:fixed;z-index:99999;right:12px;top:84px;width:min(380px,calc(100vw - 24px));max-height:min(calc(100vh - 210px),640px);overflow:auto;background:#fffdf7;color:#2b2233;border-radius:16px;box-shadow:0 6px 24px #0004;font:14px/1.35 system-ui,sans-serif;touch-action:manipulation}
.apbox.mini{width:auto;max-height:none;overflow:visible;background:none;box-shadow:none}
.apbox .aph{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#6b4fd8;color:#fff;border-radius:16px 16px 0 0;cursor:move;user-select:none}
.apbox .aph b{flex:1}.apbox button{min-height:44px;min-width:44px;border-radius:12px;border:0;padding:6px 12px;font:inherit;cursor:pointer;background:#ece6ff;color:#2b2233}
.apbox button.go{background:#2bb673;color:#fff;font-weight:700}.apbox button.on{background:#6b4fd8;color:#fff}.apbox button.stop{background:#e8505b;color:#fff}
.apbox .aph button{background:#ffffff33;color:#fff}.apbox .apb{padding:10px;display:grid;gap:8px}
.apbox label{display:flex;align-items:center;gap:8px;min-height:44px;font-size:13px}.apbox .grps{display:grid;grid-template-columns:1fr 1fr;gap:0 8px}.apbox input[type=checkbox]{width:22px;height:22px}
.apbox input[type=search]{min-height:44px;border-radius:12px;border:1px solid #ccc;padding:0 10px;font:inherit}
.apbox .row{display:flex;gap:6px;flex-wrap:wrap}.apbox .bar{height:8px;background:#eee;border-radius:4px;overflow:hidden}.apbox .bar i{display:block;height:100%;background:#6b4fd8}
.apbox .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:#2bb673}.apbox .dot.bad{background:#e8505b}.apbox .dot.skip{background:#aaa}
.apbox .res{display:grid;gap:4px}.apbox .res div{padding:4px 0;border-bottom:1px solid #eee}.apbox .res small{display:block;color:#a33;margin-left:16px}
.apbox .pill{background:#6b4fd8;color:#fff;font-weight:700;box-shadow:0 3px 12px #0004}.apbox .note{color:#666;font-size:12px}`;
  document.head.appendChild(s);
}
function place() {
  if (ui.x != null && ui.y != null) { root.style.left = Math.max(0, Math.min(innerWidth - 60, ui.x)) + 'px'; root.style.top = Math.max(0, Math.min(innerHeight - 60, ui.y)) + 'px'; root.style.right = 'auto'; }
}
function drag(handle) {
  handle.onpointerdown = e => {
    if (e.target.closest('button')) return;
    const r = root.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; handle.setPointerCapture(e.pointerId);
    handle.onpointermove = m => { ui.x = m.clientX - dx; ui.y = m.clientY - dy; place(); };
    handle.onpointerup = () => { handle.onpointermove = null; put(UI, ui); };
  };
}
const speedRow = () => `<div class="row">${Object.entries(AP_SPEEDS).map(([k, s]) => `<button data-sp="${k}" class="${(run ? run.speed : ui.speed) === k ? 'on' : ''}">${esc(T(s.en, s.vi))}</button>`).join('')}</div>`;
function draw() {
  if (!root) return;
  place();
  if (!ui.open) {
    root.className = 'apbox mini';
    root.innerHTML = `<button class="pill" data-a="open">${run ? `${T('Checking', 'Đang kiểm')} ${Math.min(run.i + 1, run.list.length)} / ${run.list.length}` : T('Auto check', 'Tự kiểm tra')}</button>`;
    root.querySelector('[data-a="open"]').onclick = () => { ui.open = true; put(UI, ui); draw(); };
    return;
  }
  root.className = 'apbox';
  const head = `<div class="aph"><b>${T('Auto play check', 'Tự chơi để kiểm tra')}</b><button data-a="min" aria-label="${T('Fold away', 'Thu nhỏ')}">_</button></div>`;
  if (run) {
    const s = run.list[run.i], g = s && AP_GROUPS.find(x => x.key === s.g), bad = run.done.filter(r => !r.ok && !r.skipped).length;
    let nm = ''; try { nm = s ? s.name() : ''; } catch (e) { nm = s ? s.key : ''; }
    root.innerHTML = head + `<div class="apb">
      <div><b>${esc(g ? T(g.en, g.vi) : '')}</b>: ${esc(nm)} (${Math.min(run.i + 1, run.list.length)} / ${run.list.length})</div>
      <div class="bar"><i style="width:${(run.i / run.list.length * 100).toFixed(1)}%"></i></div>
      <div>${T(`${run.done.length - bad} fine, ${bad} with problems`, `${run.done.length - bad} ổn, ${bad} có lỗi`)}</div>
      ${speedRow()}
      <div class="row"><button data-a="pause">${run.paused ? T('Go on', 'Tiếp tục') : T('Pause', 'Tạm dừng')}</button><button data-a="skip">${T('Skip', 'Bỏ qua')}</button><button class="stop" data-a="stop">${T('Stop', 'Dừng')}</button></div>
      <div class="res">${run.done.slice(-5).reverse().map(row).join('')}</div>
      <p class="note">${T('When it stops, the children’s progress is put back and the game starts again.', 'Khi dừng, tiến bộ của các con được trả lại và game mở lại.')}</p></div>`;
  } else {
    const rep = get(REPORT, null), all = steps(), q = (ui.q || '').trim();
    root.innerHTML = head + `<div class="apb">
      ${hero() ? '' : `<p class="note">${T('Choose a player first.', 'Hãy chọn người chơi trước.')}</p>`}
      <button class="go" data-a="start" ${hero() && all.length ? '' : 'disabled'}>${T(`Start (${all.length})`, `Bắt đầu (${all.length})`)}</button>
      ${speedRow()}
      <input type="search" data-a="q" placeholder="${T('Only some: type a name', 'Chỉ vài thứ: gõ tên')}" value="${esc(q)}">
      ${q ? `<p class="note">${T(`${all.length} match`, `${all.length} mục khớp`)}: ${all.slice(0, 8).map(s => { try { return esc(s.name()); } catch (e) { return ''; } }).join(', ')}${all.length > 8 ? '…' : ''}</p>` : ''}
      <div class="grps">${AP_GROUPS.map(g => `<label><input type="checkbox" data-g="${g.key}" ${ui.groups.includes(g.key) ? 'checked' : ''}>${esc(T(g.en, g.vi))}</label>`).join('')}</div>
      ${rep ? lastReport(rep) : ''}</div>`;
    root.querySelectorAll('[data-g]').forEach(c => c.onchange = () => { ui.groups = [...root.querySelectorAll('[data-g]:checked')].map(x => x.dataset.g); put(UI, ui); draw(); });
    const qi = root.querySelector('[data-a="q"]'); qi.onchange = () => { ui.q = qi.value; put(UI, ui); draw(); };
    root.querySelector('[data-a="start"]').onclick = () => start();
    root.querySelectorAll('[data-again]').forEach(b => b.onclick = () => start([b.dataset.again]));
    const sv = root.querySelector('[data-a="save"]'); if (sv) sv.onclick = () => saveReport(rep);
    const cp = root.querySelector('[data-a="copy"]'); if (cp) cp.onclick = () => { try { navigator.clipboard.writeText(text(rep)); cp.textContent = T('Copied', 'Đã chép'); } catch (e) { } };
    const cl = root.querySelector('[data-a="clear"]'); if (cl) cl.onclick = () => { try { localStorage.removeItem(REPORT); } catch (e) { } draw(); };
  }
  root.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { ui.speed = b.dataset.sp; if (run) run.speed = ui.speed; put(UI, ui); draw(); });
  const a = k => root.querySelector(`[data-a="${k}"]`);
  a('min').onclick = () => { ui.open = false; put(UI, ui); draw(); };
  if (run) { a('pause').onclick = () => { run.paused = !run.paused; draw(); }; a('skip').onclick = () => { run.skip = true; }; a('stop').onclick = () => { run.stop = true; }; }
  drag(root.querySelector('.aph'));
}
const row = r => `<div><span class="dot ${r.skipped ? 'skip' : r.ok ? '' : 'bad'}"></span>${esc(r.name)}${r.problems.map(p => `<small>${esc(p)}</small>`).join('')}</div>`;
function lastReport(rep) {
  const bad = rep.done.filter(r => !r.ok && !r.skipped);
  return `<h4>${T('Last check', 'Lần kiểm tra trước')}: ${new Date(rep.at).toLocaleString()}</h4>
    <div>${T(`${rep.done.length} of ${rep.total} checked: ${rep.done.length - bad.length} fine, ${bad.length} with problems`, `Đã kiểm ${rep.done.length} / ${rep.total}: ${rep.done.length - bad.length} ổn, ${bad.length} có lỗi`)}</div>
    <div class="res">${bad.slice(0, 40).map(r => `<div><span class="dot bad"></span>${esc(r.name)} <button data-again="${esc(r.key)}">${T('Again', 'Lại')}</button>${r.problems.map(p => `<small>${esc(p)}</small>`).join('')}</div>`).join('')}</div>
    <div class="row"><button data-a="save">${T('Save report', 'Lưu báo cáo')}</button><button data-a="copy">${T('Copy', 'Chép')}</button><button data-a="clear">${T('Clear', 'Xóa')}</button></div>`;
}
const text = rep => [`Sparkle Valley ${rep.build || ''} auto play check, ${rep.at}, speed ${rep.speed}`, `${rep.done.length} of ${rep.total} checked`, '']
  .concat(rep.done.map(r => `${r.skipped ? 'SKIPPED' : r.ok ? 'OK     ' : 'PROBLEM'}  [${r.g}] ${r.name}${r.fps ? ` (${r.fps} fps, ${r.secs} s)` : ''}${r.problems.map(p => '\n           ' + p).join('')}`)).join('\n');
function saveReport(rep) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text(rep)], { type: 'text/plain' }));
  a.download = `sparkle-valley-check-${rep.at.slice(0, 16).replace(/[:T]/g, '-')}.txt`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

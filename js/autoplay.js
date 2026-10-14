// The auto play check (owner, 12 Oct AEDT; rebuilt 13 Oct AEDT after the owner tested it: "such a mess"): for grown-ups
// testing the game as a child sees it. It moves the child like a child would (walks round water and walls, runs on
// Quick, flies long trips like the Go button) and plays with a finger on the screen: each game played to its end
// (mostly right, some wrong), each story read with "read by itself", each villager talked to, and the quests followed
// one after another. What went wrong is noted and sent to Studio at once with a picture and the last steps: an error,
// something that did not open or close, a button covered or off the screen, a line with no recording, a slow screen,
// a story that stopped, and the child getting stuck. Lists and timings: js/content/autoplay.js. Loaded only on the
// devices Studio's Releases page allows (switch `autoplay`), from main.js; its button sits under the ladybird.
// While it runs the child never tires and nothing is counted for the players report. Stopping it never restarts the
// game: the tester plays on from there. Progress goes back as Studio's tester rule says (js/keepcopy.js).
import { T } from './i18n.js';
import { el, esc } from './util.js';
import { GAMES, playWatch } from './games/frame.js';
import { CUSTOM, liveRule } from './custom.js';
import { FESTCAL } from './content/festcal.js';
import { voiceMisses } from './voice.js';
import { settings } from './state.js';
import { BUILD } from './build.js';
import { pic } from './art.js';
import { takeCopy, putCopyBack, hasCopy } from './keepcopy.js';
import { sendAutoplayReport, reportDelivery, reportingState, retryReports } from './tester.js';
import { AP_GROUPS, apSpeed, AP_SPEEDS, AP_OPEN_WAIT, AP_RIGHT, AP_STUCK, AP_PATH, AP_TRAIL, AP_QUESTS, apGroupOf, revertOf } from './content/autoplay.js';

const REPORT = 'sv2_autoplay_report', UI = 'sv2_autoplay_ui', RUNCOPY = 'sv2_autoplay_copy', OLD_BACKUP = 'sv2_autoplay_backup';
const wait = ms => new Promise(r => setTimeout(r, ms));
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const STOP = new Error('stop'), SKIP = new Error('skip');
const rnd = (a, b) => a + Math.random() * (b - a), any = list => list[Math.floor(Math.random() * list.length)];
let G = null, root = null, run = null, ui = null, errSink = null, finger = null, trail = [], btnTimer = 0, hostClose = null;

export function mountAutoplay(game) {
  if (root) return;
  G = game;
  if (localStorage.getItem(OLD_BACKUP)) { oldPutBack(); return; } // (a check from before 13 Oct that never finished)
  if (hasCopy(RUNCOPY)) putCopyBack(RUNCOPY, G); // a run that never ended (the page was closed): its progress goes back
  ui = Object.assign({ open: false, groups: AP_GROUPS.filter(g => g.key !== 'quests').map(g => g.key), speed: 'fast', x: null, y: null, q: '' }, get(UI, {}));
  const devicePolicy = liveRule('tester')?.policies?.[localStorage.getItem('sv2_playerid') || '']; if (devicePolicy?.speed && AP_SPEEDS[devicePolicy.speed]) ui.speed = devicePolicy.speed;
  if (!AP_SPEEDS[ui.speed]) ui.speed = 'x1';
  root = el('div', 'apbox'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', T('Auto play check', 'Tự chơi để kiểm tra'));
  style(); document.body.appendChild(root); addEventListener('sv-report-delivery', () => { if (root && !run && ui.open) draw(); }); draw();
  finger = el('div', 'apfinger'); finger.setAttribute('aria-hidden', 'true'); finger.hidden = true; document.body.appendChild(finger);
  addEventListener('error', e => errSink && errSink.push(String(e.message || e.error || 'error')));
  addEventListener('unhandledrejection', e => errSink && errSink.push(String((e.reason && e.reason.message) || e.reason || 'error')));
  const ce = console.error; console.error = (...a) => { if (errSink) errSink.push(a.map(String).join(' ').slice(0, 200)); ce.apply(console, a); };
  btnTimer = setInterval(buttons, 1000); buttons();
  G.autoplay = { unmount, running: () => !!run, trail: () => trail.slice(),
    walkTo: (x, z, speed) => walkTo(x, z, speed),
    open: () => { if (G.tester?.openPanel) return G.tester.openPanel(0, 'autoplay'); ui.open = true; put(UI, ui); draw(); },
    attach: (host, close) => { hostClose = close; host.appendChild(root); ui.open = true; put(UI, ui); draw(); },
    detach: () => { hostClose = null; document.body.appendChild(root); ui.open = false; put(UI, ui); draw(); },
    stop: () => { if (run) run.stop = true; }, start: (keys, speed) => { if (speed) ui.speed = AP_SPEEDS[speed] ? speed : 'fast'; return start(keys); } };
}
export function unmount() {
  if (run) run.stop = true; clearInterval(btnTimer);
  if (root) root.remove(); if (finger) finger.remove(); root = finger = null; hostClose = null;
  document.querySelectorAll('.zoomer .z-ap').forEach(b => b.remove());
  if (G) delete G.autoplay;
}
// the version before 13 Oct kept a copy of every saved key and restarted the game to put it back: done once more
function oldPutBack() {
  let b = null; try { b = JSON.parse(localStorage.getItem(OLD_BACKUP) || 'null'); } catch (e) { b = null; }
  localStorage.removeItem(OLD_BACKUP);
  if (b && b.o) { for (const [k, v] of Object.entries(b.o)) if (/^sv2_(profiles|farm)$/.test(k)) localStorage.setItem(k, v); }
  const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (/^sv2_(profiles|farm)$/.test(k)) return; return set.call(this, k, v); };
  location.reload();
}

// ---------- the button under the ladybird ----------
function buttons() {
  for (const hud of G.huds || []) {
    const z = hud.q && hud.q('.zoomer'); if (!z) continue;
    if (z.querySelector('.z-lb')) { z.querySelector('.z-ap')?.remove(); continue; }
    let b = z.querySelector('.z-ap');
    if (!b) {
      b = el('button', 'z-ap', `${pic('🐞')}<i class="ap-n" hidden></i>`); b.setAttribute('aria-label', T('Auto play', 'Tự chơi'));
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.onclick = e => { e.stopPropagation(); ui.open = !ui.open; put(UI, ui); draw(); };
      const lb = z.querySelector('.z-lb'); if (lb) lb.after(b); else z.appendChild(b);
    }
    b.classList.toggle('on', !!run); b.classList.toggle('paused', !!(run && run.paused));
    const n = b.querySelector('.ap-n'); n.hidden = !run; if (run) n.textContent = `${Math.min(run.i + 1, run.list.length)}/${run.list.length}`;
  }
}

// ---------- what to check ----------
function steps(all) {
  const on = new Set(all ? AP_GROUPS.map(g => g.key) : ui.groups), S = [], add = (g, key, name, fn, many) => { if (on.has(g)) S.push({ g, key, name, fn, many }); };
  add('quests', 'quests', () => T('Follow the quests', 'Làm theo nhiệm vụ'), doQuests, true);
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

// ---------- waiting like a person ----------
const hero = () => G.heroes && G.heroes[0];
const sp = () => apSpeed(run.speed);
const think = () => rnd(...sp().think);
// a moment that can be paused, skipped or stopped
async function hold(sec) { const end = Date.now() + sec * 1000; while (Date.now() < end || run.paused) { if (run.stop) throw STOP; if (run.skip) { run.skip = false; throw SKIP; } await wait(100); } }
async function until(test, sec) { const end = Date.now() + sec * 1000; while (Date.now() < end) { if (run.stop) throw STOP; if (run.skip) { run.skip = false; throw SKIP; } if (test()) return true; await wait(100); } return !!test(); }
// the last steps, sent with each problem (as the tester report's log: seconds before the report, kind, words)
function step_(k, s) { trail.push([Date.now(), k, String(s || '').replace(/\s+/g, ' ').slice(0, 110)]); if (trail.length > AP_TRAIL) trail.shift(); }
const trailLog = () => trail.map(([t, k, s]) => [Math.max(-600, Math.round((t - Date.now()) / 100) / 10), k, s]);

// ---------- the finger ----------
const shown = b => { if (!b || !b.isConnected) return false; const r = b.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false; const cs = getComputedStyle(b); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .1 && !b.disabled; };
const label = b => ((b && (b.getAttribute && (b.getAttribute('aria-label') || b.textContent || b.getAttribute('class')))) || '').toString().replace(/\s+/g, ' ').trim().slice(0, 40);
async function fingerTo(x, y) {
  if (!finger) return; finger.hidden = false;
  finger.style.transitionDuration = sp().finger + 'ms'; finger.style.left = x + 'px'; finger.style.top = y + 'px';
  await hold(sp().finger / 1000 + .05);
}
function fire(t, x, y) {
  const o = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 };
  t.dispatchEvent(new PointerEvent('pointerdown', o)); t.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, o, { buttons: 0 })));
  if (finger) { finger.classList.remove('tap'); void finger.offsetWidth; finger.classList.add('tap'); }
}
const click = t => { if (typeof t.click === 'function') t.click(); else t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }; // (a drawing has no click())
// tap a button where a child's finger would land; a button with something else on top is a problem
async function tap(b, note) {
  if (!shown(b)) return false;
  if (b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const r = b.getBoundingClientRect(), x = r.left + r.width * rnd(.35, .65), y = r.top + r.height * rnd(.35, .65);
  await fingerTo(x, y); if (!b.isConnected) return false;
  const top = document.elementFromPoint(x, y);
  // (something of the same game or window moving over it for a moment, a card turning, is not a problem)
  const box = b.closest('.gl, .card, .dialog, .theatre, .songs, .pad, .storybook'); // (a game's own win screen coming up over its last button is not a problem either)
  if (top && top !== b && !b.contains(top) && !top.contains(b) && !(root && root.contains(top)) && !(box && box.contains(top)) && note) note(T('a button covered by something: ', 'một nút bị che: ') + label(b) + ' (' + label(top) + ')');
  if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { if (note) note(T('a button off the screen: ', 'một nút ngoài màn hình: ') + label(b)); }
  step_('tap', label(b)); fire(b, x, y); click(b);
  return true;
}
// a swipe from one spot to another (games that are dragged)
async function swipe(x0, y0, x1, y1) {
  await fingerTo(x0, y0); const t = document.elementFromPoint(x0, y0); if (!t) return;
  const o = (x, y, b) => ({ bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: b });
  t.dispatchEvent(new PointerEvent('pointerdown', o(x0, y0, 1))); step_('drag', label(t));
  for (let k = 1; k <= 8; k++) { const x = x0 + (x1 - x0) * k / 8, y = y0 + (y1 - y0) * k / 8; if (finger) { finger.style.left = x + 'px'; finger.style.top = y + 'px'; } (document.elementFromPoint(x, y) || t).dispatchEvent(new PointerEvent('pointermove', o(x, y, 1))); await wait(30); }
  (document.elementFromPoint(x1, y1) || t).dispatchEvent(new PointerEvent('pointerup', o(x1, y1, 0)));
}
// where a spot in the valley is on the screen (null: behind the camera or off the screen)
function onScreen(x, y, z) {
  const h = hero(), cam = h && h.cam; if (!cam || !G.renderer) return null;
  const v = cam.position.clone().set(x, y, z).project(cam); if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) return null;
  const r = G.renderer.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}

// ---------- moving like a child ----------
// a path round water, walls, houses and trees (G.goodSpot), on a grid; null when there is none on foot
async function findPath(x0, z0, x1, z1, near) {
  const c = AP_PATH.cell, m = AP_PATH.margin, minX = Math.min(x0, x1) - m, minZ = Math.min(z0, z1) - m, nx = Math.ceil((Math.max(x0, x1) + m - minX) / c), nz = Math.ceil((Math.max(z0, z1) + m - minZ) / c);
  const ix = x => Math.round((x - minX) / c), iz = z => Math.round((z - minZ) / c), key = (i, j) => i * 100000 + j, wx = i => minX + i * c, wz = j => minZ + j * c;
  const good = new Map(), ok = (i, j) => { if (i < 0 || j < 0 || i > nx || j > nz) return false; const k = key(i, j); if (!good.has(k)) good.set(k, !!G.goodSpot(wx(i), wz(j)) || Math.hypot(wx(i) - x0, wz(j) - z0) < 2.2); return good.get(k); }; // (the first steps away from a wall or a villager the child stands by)
  const si = ix(x0), sj = iz(z0), reach = Math.max(near + 1, 3.5);
  const open = [[0, si, sj]], from = new Map([[key(si, sj), null]]), cost = new Map([[key(si, sj), 0]]); let n = 0, end = null;
  const H = (i, j) => Math.hypot(wx(i) - x1, wz(j) - z1);
  while (open.length && n < AP_PATH.max) {
    let b = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[b][0]) b = k;
    const [, i, j] = open[b]; open[b] = open[open.length - 1]; open.pop(); n++;
    if (H(i, j) <= reach) { end = key(i, j); break; }
    if (n % 300 === 0) { await new Promise(r => requestAnimationFrame(r)); if (run && run.stop) throw STOP; }
    const g0 = cost.get(key(i, j));
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = i + di, bb = j + dj; if (!ok(a, bb)) continue; if (di && dj && (!ok(i + di, j) || !ok(i, j + dj))) continue;
      const k = key(a, bb), g = g0 + (di && dj ? 1.414 : 1) * c; if (cost.has(k) && cost.get(k) <= g) continue;
      cost.set(k, g); from.set(k, key(i, j)); open.push([g + H(a, bb), a, bb]);
    }
  }
  if (end == null) return null;
  const pts = []; for (let k = end; k != null; k = from.get(k)) pts.unshift({ x: wx(Math.floor(k / 100000)), z: wz(k % 100000) });
  // straighten it: from each point, go to the furthest one in a clear line
  const clear = (a, b) => { const d = Math.hypot(b.x - a.x, b.z - a.z), s = Math.ceil(d / .7); for (let k = 1; k < s; k++) if (!G.goodSpot(a.x + (b.x - a.x) * k / s, a.z + (b.z - a.z) * k / s)) return false; return true; };
  const out = []; let at = { x: x0, z: z0 }, k = 0;
  while (k < pts.length) { let far = k; for (let q = pts.length - 1; q > k; q--) if (clear(at, pts[q])) { far = q; break; } at = pts[far]; out.push(at); k = far + 1; }
  if (Math.hypot(x1 - at.x, z1 - at.z) > .5 && clear(at, { x: x1, z: z1 })) out.push({ x: x1, z: z1 });
  return out;
}
// walk along the points like a tap-to-walk; false: stuck (a jump was tried first)
async function walk(path, x, z, near) {
  const h = hero(); let jumped = false;
  for (let k = 0; k < path.length; k++) {
    const p = path[k], last = k === path.length - 1, to = last ? Math.max(.8, near - .3) : 1.1;
    let mark = { x: h.pos.x, z: h.pos.z, t: Date.now() };
    while (Math.hypot(h.pos.x - p.x, h.pos.z - p.z) > to) {
      if (Math.hypot(h.pos.x - x, h.pos.z - z) <= near) { h.goal = null; return true; }
      if (topOpen()) { h.goal = null; await settle(40); await closeAll(); mark = { x: h.pos.x, z: h.pos.z, t: Date.now() }; }
      G.paused = false; h.goal = { x: p.x, z: p.z }; h.goalT = 0; h.autoRun = sp().run;
      await hold(.1);
      if (Date.now() - mark.t > AP_STUCK.secs * 1000) {
        if (Math.hypot(h.pos.x - mark.x, h.pos.z - mark.z) < AP_STUCK.moved) {
          if (jumped) { h.goal = null; h.autoRun = false; return false; }
          jumped = true; step_('jump', `${Math.round(h.pos.x)},${Math.round(h.pos.z)}`); if (h.onGround) { h.vy = 8.5; h.onGround = false; }
        }
        mark = { x: h.pos.x, z: h.pos.z, t: Date.now() };
      }
    }
  }
  h.goal = null; h.autoRun = false; return true;
}
async function go(x, z, near = 1.8, note) {
  const h = hero(); if (!h || !Number.isFinite(x) || !Number.isFinite(z)) return;
  const far = () => Math.hypot(h.pos.x - x, h.pos.z - z); if (far() <= near) return;
  if (topOpen()) { await settle(40, note); await closeAll(); }
  G.paused = false; if (h.riding && h.dismount) h.dismount();
  if (far() > sp().fly) { step_('fly', `${Math.round(x)},${Math.round(z)}`); await G.travel(h, x - 1.5, z + 2); await hold(.4); }
  for (let tries = 0; tries < 3 && far() > near; tries++) {
    const path = await findPath(h.pos.x, h.pos.z, x, z, near);
    if (!path) { step_('fly', T('no way on foot', 'không có đường đi bộ')); await G.landBy(h, x, z); await hold(.4); if (far() <= near + 6) return; continue; }
    step_('walk', `${Math.round(x)},${Math.round(z)} (${path.length})`);
    if (await walk(path, x, z, near)) return;
    if (tries === 0) await stuck(note); // (reported once a jump has not helped; then it tries another way)
  }
  if (far() > near + 3) { step_('fly', T('still stuck', 'vẫn bị kẹt')); await G.landBy(h, x, z); await hold(.4); }
}
// stuck: a problem, with the spot and a picture; also sent to Studio straight away
async function stuck(note) {
  const h = hero(), where = `${Math.round(h.pos.x)}, ${Math.round(h.pos.z)}`, area = String((G.regionOf && G.regionOf[0]) || '');
  const msg = T(`stuck at ${where}`, `bị kẹt ở ${where}`) + (area ? ` (${area})` : '');
  if (note) note(msg); step_('stuck', where);
  send('stuck', msg, { x: Math.round(h.pos.x), z: Math.round(h.pos.z) });
}

async function walkTo(x, z, speed = 'watch') {
  if (run || !hero()) return null; const problems = [];
  run = { speed, list: [], i: 0, done: [], paused: false, skip: false, stop: false }; trail = [];
  try { await go(x, z, 2, m => problems.push(m)); } finally { const h = hero(); h.goal = null; h.autoRun = false; run = null; }
  return { problems, trail: trail.map(t => t[1] + ':' + t[2]) };
}

// ---------- whatever is open on the screen, done like a child ----------
const OPEN = '.reward, .storybook, .dialog, .gl, .theatre, .songs, .modal, .pad';
const topOpen = () => [...document.querySelectorAll(OPEN)].filter(e => !(root && root.contains(e)) && !e.classList.contains('out') && shown(e)).pop();
async function settle(secs, note = () => { }) {
  const end = Date.now() + secs * 1000;
  while (Date.now() < end) {
    const w = topOpen(); if (!w) return;
    await hold(think());
    if (!w.isConnected) continue;
    if (w.matches('.gl')) { await playGame(note); continue; }
    if (w.matches('.theatre')) { await readTale(note); continue; }
    if (w.matches('.reward')) { await tap(w, note); continue; }
    if (w.matches('.dialog')) { const ch = [...w.querySelectorAll('.dch')].filter(shown); await tap(ch.length ? ch[0] : w.querySelector('.dtext') || w, note); continue; }
    if (w.matches('.storybook')) { const g = w.querySelector('.qt-go'); await tap(shown(g) ? g : w.querySelector('.sb-art') || w, note); continue; }
    return; // (a menu, the shop, the songs: left for the step to look at and close)
  }
}
async function closeAll() {
  for (let k = 0; k < 4; k++) {
    const w = topOpen(); if (!w) break;
    const x = w.querySelector('.gl-x, .th-x, .sg-x, .x, [data-a=close], .close, .sb-skip');
    if (x && shown(x)) { step_('close', label(w).slice(0, 30)); x.click(); await wait(350); }
    else if (w.matches('.dialog, .reward, .storybook')) { w.click(); await wait(300); }
    else break;
  }
  document.querySelectorAll('.dialog, .modal, .pad, .gl, .theatre, .songs, .reward, .storybook').forEach(e => { if (!root || !root.contains(e)) e.remove(); });
  document.body.classList.remove('songs-on'); G.paused = false;
}

// ---------- playing a game ----------
// the things a child could tap in a game (buttons, and anything that shows a pointer)
function targets(stage) {
  const list = [...stage.querySelectorAll('button, [role=button], [onclick], [data-k], [data-v], [draggable=true], .tile, .card, .cell')];
  for (const e of stage.querySelectorAll('div, span, i, b, svg, img')) { if (list.length > 80) break; if (!list.includes(e) && getComputedStyle(e).cursor === 'pointer') list.push(e); }
  // (the innermost button: a square with its arrow buttons inside is tapped by its arrows; a picture inside a button is the button)
  const btn = e => e.matches('button, [role=button]');
  return list.filter(e => shown(e) && !e.closest('.gl-head') && !(btn(e) ? list.some(o => o !== e && e.contains(o) && btn(o)) : list.some(o => o !== e && o.contains(e) && btn(o))));
}
async function playGame(note) {
  const gl = document.querySelector('.gl'); if (!gl) return {};
  const s = sp(), stage = gl.querySelector('.gl-stage') || gl, tried = new Set(), r = { won: false, rights: 0, wrongs: 0, taps: 0 };
  let last = Date.now();
  playWatch.on = k => { last = Date.now(); if (k === 'right') r.rights++; if (k === 'wrong') r.wrongs++; if (k === 'win') r.won = true; };
  const mo = new MutationObserver(() => { last = Date.now(); }); mo.observe(stage, { childList: true, subtree: true, attributes: true, characterData: true });
  const end = Date.now() + s.game * (run.quest ? 3 : 1) * 1000; // (a quest's game is played longer: the quest needs it done)
  try {
    while ((Date.now() < end || gl.querySelector('.gl-win')) && gl.isConnected && !gl.classList.contains('out')) {
      await hold(think()); if (!gl.isConnected) break;
      const win = gl.querySelector('.gl-win');
      if (win) { if (win.classList.contains('ask')) { const t = [win.querySelector('.gl-tapout'), win.querySelector('p'), win].find(shown); if (!t || !await tap(t, note)) await until(() => !gl.isConnected, 1); } continue; }
      // a reward, a chapter's book or a chat that popped up over the game: tapped away first, like a child would
      const top = topOpen(); if (top && top !== gl && !gl.contains(top) && top.matches('.reward, .storybook, .dialog')) { const g = top.querySelector('.qt-go, .sb-skip'); await tap(shown(g) ? g : top, note); continue; }
      const lv = gl.querySelector('.gl-lvlpick'); if (lv) { await tap(lv.querySelector('[data-l].on') || lv.querySelector('[data-l]'), note); continue; }
      const how = document.querySelector('.howto'); if (how) { const x = how.querySelector('.x, .ht-x, button'); if (x) await tap(x, note); else how.remove(); continue; }
      // the game says which ones it is choosing from (untilRight): mostly the right one, sometimes a wrong one
      const ask = playWatch.ask; let pick = null;
      if (ask && ask.els.some(shown)) {
        const right = ask.els.find(e => shown(e) && ask.check(e)), wrong = ask.els.filter(e => shown(e) && !ask.check(e) && !tried.has(e));
        pick = right && (Math.random() < AP_RIGHT || !wrong.length) ? right : any(wrong);
      } else {
        const all = targets(stage), fresh = all.filter(e => !tried.has(e));
        if (all.length && !fresh.length) tried.clear();
        pick = fresh.length ? any(fresh) : all.length ? any(all) : null;
      }
      if (pick) { tried.add(pick); await tap(pick, note); r.taps++; }
      else { // nothing to tap: a tap or a swipe on the playing field, like a child trying
        const b = stage.getBoundingClientRect(), x = rnd(b.left + b.width * .2, b.right - b.width * .2), y = rnd(b.top + b.height * .25, b.bottom - b.height * .15);
        if (Math.random() < .5) { await fingerTo(x, y); const t = document.elementFromPoint(x, y); if (t) { step_('tap', label(t)); fire(t, x, y); click(t); } }
        else await swipe(x, y, x + rnd(-120, 120), y + rnd(-90, 90));
        r.taps++;
      }
      if (Date.now() - last > s.idle * 1000) { r.cant = true; break; }
    }
  } finally { playWatch.on = null; mo.disconnect(); }
  return r;
}

// ---------- reading a story ----------
async function readTale(note) {
  const th = document.querySelector('.theatre'); if (!th) return;
  const page = () => [...th.querySelectorAll('.th-dots i')].findIndex(i => i.classList.contains('on'));
  const a = th.querySelector('.th-auto'); if (a && !a.classList.contains('on')) await tap(a, note);
  let at = page(), since = Date.now(); const end = Date.now() + (sp().page ? 180 : 420) * 1000;
  while (th.isConnected && !th.classList.contains('out') && Date.now() < end) {
    if (sp().page) { await hold(sp().page); const n = th.querySelector('.th-next'); if (n && th.isConnected) await tap(n, note); }
    else await hold(1);
    const p = page(); if (p !== at) { at = p; since = Date.now(); step_('page', String(p + 1)); }
    else if (Date.now() - since > 45000) { note(T(`the story stopped on page ${at + 1}`, `truyện dừng ở trang ${at + 1}`)); break; }
  }
}

// ---------- each kind of step ----------
const closer = sel => async note => { const x = document.querySelector(sel); if (x && shown(x)) await tap(x, note); else if (x) x.click(); };
async function doGame(id, note) {
  const spot = G.gameSpot && G.gameSpot(id); if (spot) { await go(spot.x, spot.z, Math.max(1.8, (spot.r || 2) * .7), note); const s = onScreen(spot.x, 1, spot.z); if (s) await fingerTo(s.x, s.y); }
  await closeAll(); G.playGame(0, id, 'replay');
  if (!await until(() => document.querySelector('.gl'), AP_OPEN_WAIT)) { note(T('did not open', 'không mở được')); return; }
  const r = await playGame(note);
  if (r.cant) note(T('help: auto play could not work out how to play it', 'cần giúp: tự chơi chưa biết chơi trò này'), true);
  await until(() => !document.querySelector('.gl:not(.out)'), 1.5);
  if (document.querySelector('.gl:not(.out)')) { await closer('.gl .gl-x')(note); if (!await until(() => !document.querySelector('.gl'), 2)) note(T('did not close', 'không đóng được')); }
  return `${r.won ? T('won', 'thắng') : T('played', 'đã chơi')}: ${r.rights} ✓, ${r.wrongs} ✗, ${r.taps} ${T('taps', 'lần chạm')}`;
}
async function doFestival(F, note) {
  const d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  CUSTOM.releases = { ...(CUSTOM.releases || {}), ['fest_' + F.id]: { on: true, start: ymd, days: 1 } }; // (this device, until the step ends)
  try {
    G.festivals.rebuild(); await wait(300);
    for (const key of F.where || []) { const s = (G.festivals.streetSpots(key) || [])[0]; if (s) { await go(s.x, s.z, 3, note); await hold(sp().stay); } }
    const it = (G.interactables || []).find(i => i.id === 'festival_' + F.id);
    if (!it) { note(T('no festival table', 'không có bàn lễ hội')); return; }
    await doTap(it, note);
  } finally { delete CUSTOM.releases['fest_' + F.id]; G.festivals.rebuild(); }
}
async function doTale(t, note) {
  if (G.storyteller) await go(G.storyteller.x, G.storyteller.z, 3, note);
  await closeAll(); G.readTale(0, t.id);
  if (!await until(() => document.querySelector('.theatre'), AP_OPEN_WAIT + 2.5)) { note(T('did not open', 'không mở được')); return; }
  await readTale(note);
  await until(() => !document.querySelector('.theatre:not(.out)'), 1);
  if (document.querySelector('.theatre:not(.out)')) { await closer('.th-x')(note); if (!await until(() => !document.querySelector('.theatre'), 2)) note(T('did not close', 'không đóng được')); }
}
async function doPlace(p, note) { await go(p.x, p.z, 4, note); await hold(sp().stay); }
// go up to a thing or a person, tap it, and do what opens (talk through, play, read)
async function doTap(it, note) {
  await closeAll(); const h = hero();
  await go(it.x, it.z, Math.max(1.6, Math.min(it.r || 2, 3) * .8), note);
  const s = onScreen(it.x, 1.2, it.z); if (s) await fingerTo(s.x, s.y);
  step_('tap', (typeof it.label === 'function' ? it.label() : it.id) || it.id); G.goAndDo(h, it);
  await hold(.6); await until(() => !h.goal, 6); await hold(.4);
  await settle(sp().talk + 30, note);
  const w = topOpen(); if (w) { await hold(sp().talk); offScreen(w, note); }
}
async function doOpen(open, note) { await closeAll(); open(); if (!await until(() => topOpen(), AP_OPEN_WAIT)) { note(T('did not open', 'không mở được')); return; } await hold(sp().talk); offScreen(topOpen(), note); }
function offScreen(box, note) {
  if (!box) return; const W = innerWidth, H = innerHeight;
  for (const b of box.querySelectorAll('button')) { const r = b.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right < 2 || r.bottom < 2 || r.left > W - 2 || r.top > H - 2) { note(T('a button off the screen: ', 'một nút ngoài màn hình: ') + label(b)); break; } }
}

// ---------- following the quests ----------
// like a child: the goal bar's place, walked to (or flown, when far), the person or thing there tapped, and whatever
// opens done (talk, play, read); a quest that does not move on after a few tries is noted and the run goes on
async function doQuests(note, out) {
  const h = hero(); let lastId = null, tries = 0; run.quest = true;
  try { await questLoop(h, out); } finally { if (run) run.quest = false; }
}
async function questLoop(h, out) {
  let lastId = null, tries = 0;
  for (let n = 0; n < AP_QUESTS.max; n++) {
    const q = G.currentQuest && G.currentQuest(h.profile); if (!q) { step_('quest', T('every quest done', 'xong mọi nhiệm vụ')); break; }
    if (q.id === lastId) { if (++tries >= AP_QUESTS.tries) { out.at(-1).notes.push(T('help: auto play could not finish this quest', 'cần giúp: tự chơi chưa làm xong nhiệm vụ này')); break; } }
    else { lastId = q.id; tries = 0; }
    const r = await one({ g: 'quests', key: 'quest:' + q.id, name: () => q.title(), fn: nt => questOnce(q, nt) });
    if (tries) { const l = out.at(-1); l.secs += r.secs; l.problems.push(...r.problems); l.ok = l.ok && r.ok; if (r.said) l.said = r.said; } else out.push(r);
    if (run) { run.qname = r.name; draw(); }
  }
}
async function questOnce(q, note) {
  const h = hero(); await closeAll();
  const tg = G.questTarget && G.questTarget(h);
  const goBtn = G.huds && G.huds[0] && G.huds[0].q('.q-go'); if (goBtn && shown(goBtn)) { const r = goBtn.getBoundingClientRect(); await fingerTo(r.left + r.width / 2, r.top + r.height / 2); } // (shows where a child would look)
  if (!tg) { if (G.sayObjective) G.sayObjective(0); await hold(sp().talk); return; }
  const it = (G.interactables || []).filter(x => !x.auto && (!x.visible || x.visible(h)) && x.act).sort((a, b) => Math.hypot(a.x - tg.x, a.z - tg.z) - Math.hypot(b.x - tg.x, b.z - tg.z))[0];
  if (it && Math.hypot(it.x - tg.x, it.z - tg.z) < 2.5) await doTap(it, note);
  else { await go(tg.x, tg.z, 1.2, note); await hold(sp().stay); await settle(60, note); }
  await hold(1.2); await settle(30, note);
  const now = G.currentQuest(h.profile); return !now || now.id !== q.id ? T('done', 'xong') : '';
}

// ---------- one step: its problems, missing recordings and frame rate ----------
async function one(s) {
  const problems = [], notes = [], note = (m, help) => (help ? notes : problems).push(m), errs = errSink = [], miss0 = new Set(voiceMisses().map(m => m[0] + '|' + m[1]));
  let frames = 0, on = true; const count = () => { if (!on) return; frames++; requestAnimationFrame(count); }; requestAnimationFrame(count);
  const t0 = performance.now(); let skipped = false, said = '';
  let nm = s.key; try { nm = s.name(); } catch (e) { }
  step_('start', nm);
  try { said = (await s.fn(note)) || ''; } catch (e) { if (e === STOP) { on = false; errSink = null; throw e; } if (e === SKIP) skipped = true; else note(T('error: ', 'lỗi: ') + String(e && e.message || e).slice(0, 160)); }
  on = false; errSink = null;
  const secs = (performance.now() - t0) / 1000, fps = secs > .5 ? Math.round(frames / secs) : null;
  for (const e of [...new Set(errs)].slice(0, 3)) note(T('error: ', 'lỗi: ') + e);
  for (const m of voiceMisses()) if (!miss0.has(m[0] + '|' + m[1])) note(T('no recording: ', 'chưa thu âm: ') + String(m[0]).slice(0, 80));
  if ((!sp().rate || sp().rate === 1) && fps != null && fps < 20) note(T(`slow: ${fps} frames a second`, `chậm: ${fps} khung hình mỗi giây`));
  for (const p of problems) if (!/^(stuck|bị kẹt)/.test(p)) send(s.g, `${nm}: ${p}`); // (being stuck was sent when it happened)
  return { g: s.g, key: s.key, name: nm, ok: !problems.length && !skipped, skipped, problems, notes, said, secs: Math.round(secs * 10) / 10, fps };
}
// a problem to Studio's tester inbox, now, with a picture and the last steps (only on a tester device)
function send(g, detail, at) {
  const h = hero(); import('./tester.js').then(m => m.autoReport && m.autoReport('autoplay', String(detail).slice(0, 200),
    { area: String((G.regionOf && G.regionOf[0]) || 'valley'), place: '', game: /^game:/.test((run && run.list[run.i] || {}).key || '') ? run.list[run.i].key.slice(5) : '', window: 'autoplay ' + g, x: at ? at.x : h ? Math.round(h.pos.x) : 0, z: at ? at.z : h ? Math.round(h.pos.z) : 0 },
    { log: trailLog() })).catch(() => { });
}
// keep the child going: full stamina and hearts the whole time
function neverTired() { const h = hero(); if (h) { h.stamina = h.staminaMax; h.exhausted = false; if (h.profile) h.hearts = h.profile.hearts; } }
// is this device a tester? (then the progress stays until they stop being one, unless Studio says otherwise)
const tester = () => { const a = get('sv2_tester', null); return !!(a && a.at && !a.stopped); };

async function start(only) {
  const h = hero(); if (!h || run) return;
  const list = only ? steps(true).filter(s => only.includes(s.key)) : steps(); if (!list.length) return;
  const perRun = !tester() || revertOf(liveRule('tester'), localStorage.getItem('sv2_playerid') || '') === 'autoplay';
  if (perRun) takeCopy(RUNCOPY);
  const counted = settings.countPlayers; settings.countPlayers = false; // (not counted in the players report)
  run = { speed: ui.speed, list, i: 0, done: [], paused: false, skip: false, stop: false, started: Date.now(), perRun };
  trail = []; if (hostClose) hostClose(); ui.open = false; put(UI, ui); // close the shared shell; the run continues
  const keep = setInterval(neverTired, 200); draw(); buttons();
  try {
    for (; run.i < list.length; run.i++) {
      draw(); buttons(); const s = list[run.i];
      if (s.many) await s.fn(null, run.done); else run.done.push(await one(s));
      put(REPORT, report());
    }
  } catch (e) { if (e !== STOP) run.done.push({ g: '?', key: '?', name: '?', ok: false, problems: [String(e && e.message || e)], notes: [] }); }
  clearInterval(keep);
  const hh = hero(); if (hh) { hh.goal = null; hh.autoRun = false; }
  try { await closeAll(); } catch (e) { }
  if (finger) finger.hidden = true;
  settings.countPlayers = counted;
  if (perRun) putCopyBack(RUNCOPY, G);
  const finalReport = report(); const result = await sendAutoplayReport(finalReport);
  put(REPORT, { ...finalReport, reportIds: result.ids, reportState: result.state });
  run = null; ui.open = false; put(UI, ui); draw(); buttons();
  G.autoplay?.open(); // results return to the same ladybird tab on tester devices
}
const report = () => ({ at: new Date().toISOString(), build: BUILD, speed: run.speed, total: run.list.length, done: run.done, perRun: run.perRun });

// ---------- the window ----------
function style() {
  if (document.getElementById('apstyle')) return;
  const s = el('style'); s.id = 'apstyle';
  s.textContent = `.apbox{position:fixed;z-index:99999;right:84px;top:84px;width:min(380px,calc(100vw - 24px));max-height:min(calc(100vh - 120px),640px);overflow:auto;background:var(--panel2);color:var(--text);border-radius:var(--r);box-shadow:var(--shadow);font:600 16px/1.35 var(--font);touch-action:manipulation}
.apbox[hidden]{display:none}
@media (max-width:520px){.apbox{right:12px;left:12px;width:auto;top:70px}}
.apbox .aph{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#6b4fd8;color:#fff;border-radius:16px 16px 0 0;cursor:move;user-select:none;position:sticky;top:0;z-index:1}
.apbox .aph b{flex:1}.apbox button{min-height:44px;min-width:44px;border-radius:12px;border:0;padding:6px 12px;font:inherit;cursor:pointer;background:#ece6ff;color:#2b2233}
.apbox button.go{background:#2bb673;color:#fff;font-weight:700}.apbox button.on{background:#6b4fd8;color:#fff}.apbox button.stop{background:#e8505b;color:#fff}
.apbox .aph button{background:#ffffff33;color:#fff}.apbox .apb{padding:10px;display:grid;gap:8px}
.apbox label{display:flex;align-items:center;gap:8px;min-height:44px;font-size:13px}.apbox .grps{display:grid;grid-template-columns:1fr 1fr;gap:0 8px}.apbox input[type=checkbox]{width:22px;height:22px}
.apbox label.qst{grid-column:1/-1;font-weight:700}
.apbox input[type=search]{min-height:44px;border-radius:12px;border:1px solid #ccc;padding:0 10px;font:inherit}
.apbox .row{display:flex;gap:6px;flex-wrap:wrap}.apbox .bar{height:8px;background:#eee;border-radius:4px;overflow:hidden}.apbox .bar i{display:block;height:100%;background:#6b4fd8}
.apbox .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:#2bb673}.apbox .dot.bad{background:#e8505b}.apbox .dot.skip,.apbox .dot.help{background:#aaa}
.apbox .res{display:grid;gap:4px}.apbox .res div{padding:4px 0;border-bottom:1px solid #eee}.apbox .res small{display:block;color:#a33;margin-left:16px}.apbox .res small.help{color:#777}.apbox .res small.said{color:#2b7a4b}
.apbox .note{color:#666;font-size:12px}
.apfinger{position:fixed;z-index:99998;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid #fff;background:rgba(107,79,216,.45);box-shadow:0 0 0 2px #6b4fd8,0 3px 10px #0005;pointer-events:none;transition-property:left,top;transition-timing-function:cubic-bezier(.3,.7,.3,1)}
.apfinger::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:3px solid #6b4fd8;opacity:0}
.apfinger.tap::after{animation:apTap .45s ease-out}
@keyframes apTap{from{transform:scale(.6);opacity:1}to{transform:scale(2.2);opacity:0}}
.zoomer .z-ap{position:relative}.zoomer .z-ap .art{width:34px;height:34px}
.zoomer .z-ap.on{box-shadow:0 0 0 4px #2bb673,var(--shadow);animation:apPulse 1.6s ease-in-out infinite}.zoomer .z-ap.on.paused{box-shadow:0 0 0 4px #ffb52e,var(--shadow);animation:none}
.zoomer .z-ap .ap-n{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);font:700 11px/1 system-ui,sans-serif;font-style:normal;background:#2bb673;color:#fff;border-radius:999px;padding:3px 6px;white-space:nowrap}
@keyframes apPulse{50%{transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.zoomer .z-ap.on{animation:none}.apfinger{transition-duration:0s!important}}`;
  document.head.appendChild(s);
}
function place() { /* fixed shell: legacy drag coordinates are deliberately ignored */ }
function drag(handle) {
  handle.onpointerdown = e => {
    if (e.target.closest('button')) return;
    const r = root.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; if (e.isTrusted) handle.setPointerCapture(e.pointerId);
    handle.onpointermove = m => { ui.x = m.clientX - dx; ui.y = m.clientY - dy; place(); };
    handle.onpointerup = () => { handle.onpointermove = null; put(UI, ui); };
  };
}
const speedRow = () => `<div class="row">${Object.entries(AP_SPEEDS).filter(([key]) => /^x[1235]$/.test(key)).map(([k, s]) => `<button data-sp="${k}" class="${(run ? run.speed : ui.speed) === k ? 'on' : ''}">${esc(T(s.en, s.vi))}</button>`).join('')}</div>`;
const backNote = () => tester() && revertOf(liveRule('tester'), localStorage.getItem('sv2_playerid') || '') === 'keep'
  ? T('This device keeps progress after testing.', 'Máy này giữ tiến bộ sau khi thử nghiệm.')
  : (run ? run.perRun : !tester() || revertOf(liveRule('tester'), localStorage.getItem('sv2_playerid') || '') === 'autoplay')
  ? T('When it stops, the game goes on from there; what auto play earned goes back, badges and stickers stay.', 'Khi dừng, game tiếp tục từ đó; phần tự chơi kiếm được được trả lại, huy hiệu và nhãn dán vẫn giữ.')
  : T('When it stops, the game goes on from there. Progress goes back when you stop being a tester; badges and stickers stay.', 'Khi dừng, game tiếp tục từ đó. Tiến bộ được trả lại khi thôi làm người thử; huy hiệu và nhãn dán vẫn giữ.');
function draw() {
  if (!root) return;
  place(); root.hidden = !ui.open;
  if (!ui.open) { root.innerHTML = ''; return; }
  root.className = 'apbox' + (hostClose ? ' embedded' : '');
  const head = `<div class="aph"><b>${pic('🤖')} ${T('Auto play', 'Tự chơi')}</b><button data-a="min" aria-label="${T('Close', 'Đóng')}">✕</button></div>`;
  if (run) {
    const s = run.list[run.i], g = s && AP_GROUPS.find(x => x.key === s.g), bad = run.done.filter(r => !r.ok && !r.skipped).length;
    let nm = ''; try { nm = s ? s.name() : ''; } catch (e) { nm = s ? s.key : ''; }
    root.innerHTML = head + `<div class="apb">
      <div><b>${esc(g ? T(g.en, g.vi) : '')}</b>: ${esc(s && s.many && run.qname ? run.qname : nm)} (${Math.min(run.i + 1, run.list.length)} / ${run.list.length})</div>
      <div class="bar"><i style="width:${(run.i / run.list.length * 100).toFixed(1)}%"></i></div>
      <div>${T(`${run.done.length - bad} fine, ${bad} with problems`, `${run.done.length - bad} ổn, ${bad} có lỗi`)}</div>
      ${speedRow()}
      <div class="row"><button data-a="pause">${run.paused ? T('Go on', 'Tiếp tục') : T('Pause', 'Tạm dừng')}</button><button data-a="skip">${T('Skip', 'Bỏ qua')}</button><button class="stop" data-a="stop">${T('Stop', 'Dừng')}</button></div>
      <div class="res">${run.done.slice(-5).reverse().map(row).join('')}</div>
      <p class="note">${backNote()}</p></div>`;
  } else {
    const rep = get(REPORT, null), all = steps(), q = (ui.q || '').trim();
    root.innerHTML = head + `<div class="apb">
      ${hero() ? '' : `<p class="note">${T('Choose a player first.', 'Hãy chọn người chơi trước.')}</p>`}
      <button class="go" data-a="start" ${hero() && all.length ? '' : 'disabled'}>${T(`Start (${all.length})`, `Bắt đầu (${all.length})`)}</button>
      ${speedRow()}
      <input type="search" data-a="q" placeholder="${T('Only some: type a name', 'Chỉ vài thứ: gõ tên')}" value="${esc(q)}">
      ${q ? `<p class="note">${T(`${all.length} match`, `${all.length} mục khớp`)}: ${all.slice(0, 8).map(s => { try { return esc(s.name()); } catch (e) { return ''; } }).join(', ')}${all.length > 8 ? '…' : ''}</p>` : ''}
      <div class="grps">${AP_GROUPS.map(g => `<label class="${g.key === 'quests' ? 'qst' : ''}"><input type="checkbox" data-g="${g.key}" ${ui.groups.includes(g.key) ? 'checked' : ''}>${esc(T(g.en, g.vi))}</label>`).join('')}</div>
      <p class="note">${backNote()}</p>
      ${rep ? lastReport(rep) : ''}</div>`;
    root.querySelectorAll('[data-g]').forEach(c => c.onchange = () => { ui.groups = [...root.querySelectorAll('[data-g]:checked')].map(x => x.dataset.g); put(UI, ui); draw(); });
    const qi = root.querySelector('[data-a="q"]'); qi.onchange = () => { ui.q = qi.value; put(UI, ui); draw(); };
    root.querySelector('[data-a="start"]').onclick = () => start();
    root.querySelectorAll('[data-again]').forEach(b => b.onclick = () => start([b.dataset.again]));
    const send = root.querySelector('[data-a="send"]'); if (send) send.onclick = async () => { send.disabled = true; const result = await sendAutoplayReport(rep); put(REPORT, { ...rep, reportIds: result.ids, reportState: result.state }); retryReports(); draw(); };
    const sv = root.querySelector('[data-a="save"]'); if (sv) sv.onclick = () => saveReport(rep);
    const cp = root.querySelector('[data-a="copy"]'); if (cp) cp.onclick = () => { try { navigator.clipboard.writeText(text(rep)); cp.textContent = T('Copied', 'Đã chép'); } catch (e) { } };
    const cl = root.querySelector('[data-a="clear"]'); if (cl) cl.onclick = () => { try { localStorage.removeItem(REPORT); } catch (e) { } draw(); };
  }
  root.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { ui.speed = b.dataset.sp; if (run) run.speed = ui.speed; put(UI, ui); draw(); });
  const a = k => root.querySelector(`[data-a="${k}"]`);
  a('min').onclick = () => { if (hostClose) return hostClose(); ui.open = false; put(UI, ui); draw(); };
  if (run) { a('pause').onclick = () => { run.paused = !run.paused; draw(); buttons(); }; a('skip').onclick = () => { run.skip = true; }; a('stop').onclick = () => { run.stop = true; }; }
  // Panels stay fixed; draggable windows are not part of the game's UI contract.
}
const row = r => `<div><span class="dot ${r.skipped ? 'skip' : r.ok ? (r.notes && r.notes.length ? 'help' : '') : 'bad'}"></span>${esc(r.name)}${r.said ? `<small class="said">${esc(r.said)}</small>` : ''}${r.problems.map(p => `<small>${esc(p)}</small>`).join('')}${(r.notes || []).map(p => `<small class="help">${esc(p)}</small>`).join('')}</div>`;
function deliveryText(rep) {
  if (!reportingState().enabled) return T('Reporting is off on this device. Enable testing and accept the tester agreement in Settings.', 'Báo cáo đang tắt trên máy này. Bật thử nghiệm và đồng ý tham gia trong Cài đặt.');
  if (!(rep.done || []).some(x => x.problems?.length)) return T('No problems found in this check.', 'Chưa tìm thấy lỗi trong lần kiểm tra này.');
  const states = (rep.reportIds || []).map(reportDelivery);
  if (states.length && states.every(x => x.state === 'sent')) return T('Sent: received by the website.', 'Đã gửi: trang web đã nhận.');
  if (states.some(x => x.state === 'retry')) return T('Not sent yet. Kept here; retry when connected.', 'Chưa gửi được. Đã giữ trên máy; gửi lại khi có mạng.');
  return states.some(x => x.state === 'sending') ? T('Sending…', 'Đang gửi…') : T('Queued on this device.', 'Đang chờ gửi trên máy này.');
}
function lastReport(rep) {
  const bad = rep.done.filter(r => !r.ok && !r.skipped), help = rep.done.filter(r => r.ok && r.notes && r.notes.length);
  return `<h4>${T('Last check', 'Lần kiểm tra trước')}: ${new Date(rep.at).toLocaleString()}</h4>
    <div>${T(`${rep.done.length} checked: ${rep.done.length - bad.length} fine, ${bad.length} with problems`, `Đã kiểm ${rep.done.length}: ${rep.done.length - bad.length} ổn, ${bad.length} có lỗi`)}</div>
    <div class="res">${bad.slice(0, 40).map(r => `<div><span class="dot bad"></span>${esc(r.name)} <button data-again="${esc(r.key)}">${T('Again', 'Lại')}</button>${r.problems.map(p => `<small>${esc(p)}</small>`).join('')}</div>`).join('')}
    ${help.slice(0, 20).map(row).join('')}</div>
    <p class="note" role="status">${deliveryText(rep)}</p>
    <div class="row"><button data-a="send">${T('Send / retry report', 'Gửi / gửi lại báo cáo')}</button></div><details><summary>${T('Export options', 'Tùy chọn xuất bản sao')}</summary><div class="row"><button data-a="save">${T('Export a copy', 'Xuất bản sao')}</button><button data-a="copy">${T('Copy', 'Chép')}</button><button data-a="clear">${T('Clear', 'Xóa')}</button></div></details>`;
}
const text = rep => [`Sparkle Valley ${rep.build || ''} auto play check, ${rep.at}, speed ${rep.speed}`, `${rep.done.length} checked`, '']
  .concat(rep.done.map(r => `${r.skipped ? 'SKIPPED' : r.ok ? 'OK     ' : 'PROBLEM'}  [${r.g}] ${r.name}${r.said ? ` (${r.said})` : ''}${r.fps ? ` (${r.fps} fps, ${r.secs} s)` : ''}${r.problems.map(p => '\n           ' + p).join('')}${(r.notes || []).map(p => '\n           ' + p).join('')}`)).join('\n');
function saveReport(rep) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text(rep)], { type: 'text/plain' }));
  a.download = `sparkle-valley-check-${rep.at.slice(0, 16).replace(/[:T]/g, '-')}.txt`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

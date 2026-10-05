// Counting players, without knowing who they are, so the family can see in Sparkle Studio how many children play.
// The first time, this device makes up a random number for itself. Every 10 minutes of play (and when the game is
// put away) it says hello to the game's own website (netlify/functions/hello.mjs) with only:
//   that number · the build · the language · how many children's profiles · minutes played · which games were
//   started and how many stories were opened since the last hello · phone, tablet or computer · installed or not
//   · minutes played with friends online
//   · up to 15 lines of the game's own text it had to read with the machine voice (so Sparkle Studio can record
//     them: the "missing lines inbox"), never a line with a child's name in it
// Round L (owner: "a report per child and for everyone: devices, location, games and places, activity, bugs and where
// they get stuck"): each played day also carries, per child, the child's first name (Grown-ups → Advanced → "Names
// in analytics" leaves them out), age group, minutes, games started, won and left early, places visited and
// stories opened; minutes by hour of the day; the device's system and browser (from the browser, e.g. "iOS · Safari")
// and screen size; how smooth the game ran; errors in the game's own code (the message and file:line, never what a
// child typed); and where a child pushed to walk but did not move (stuck), by area. The town or city is worked out
// by the website from the connection (never GPS). Never photos, voices or anything a child typed.
// Everything this file sends is the game's ANALYTICS (owner: "any data sent back to Studio is labelled analytics"); Grown-ups →
// Advanced → "Analytics" turns it all off.
// Nothing is sent when the game is opened from a file, this computer (tests, Sparkle Studio) or with it switched off.
// Offline play counts too: minutes, games and stories wait in a small outbox on the device (per day, at most 14 days)
// and go when the internet is back. The outbox is only emptied when the website says it got them; each send has a
// one-time id, so a copy that arrives twice is counted once.
import { settings, profiles } from './state.js';
import { BUILD } from './build.js';
import { Net } from './net.js';
import { voiceMisses } from './voice.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';

const KEY = 'sv2_playerid', OUT = 'sv2_hello_out', SENT = 'sv2_voicesent', EVERY = 10 * 60e3;
let lastSent = 0, sending = false; // (lastSent: the last confirmed send)
const id = () => { let v = ''; try { v = localStorage.getItem(KEY) || ''; if (!/^[a-z0-9]{12}$/.test(v)) { v = rnd(12); localStorage.setItem(KEY, v); } } catch (e) { } return v; };
const rnd = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
const onSite = () => !!window.__svHelloTest || (/^https:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname) && !/[?&]studio=1/.test(location.search) && !location.pathname.startsWith('/studio'));
const kind = () => { const w = Math.min(screen.width, screen.height), touch = matchMedia('(pointer: coarse)').matches; return !touch ? 'computer' : w < 600 ? 'phone' : 'tablet'; };
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }; // the child's own day

// the outbox: { days: { 'YYYY-MM-DD': { m, g: {game: n}, t, o } }, pending?: { h, days[], v[] } }, kept on the device until the website has it
const readOut = () => { try { const o = JSON.parse(localStorage.getItem(OUT) || '{}'); return o && o.days ? o : { days: {} }; } catch (e) { return { days: {} }; } };
const writeOut = o => { const ks = Object.keys(o.days).sort(); while (ks.length > 14) delete o.days[ks.shift()]; if (o.pending && o.pending.days.length > 14) o.pending.days = o.pending.days.slice(-14); try { localStorage.setItem(OUT, JSON.stringify(o)); } catch (e) { } };
const bump = f => { if (settings.countPlayers === false) return; const o = readOut(), d = o.days[today()] = o.days[today()] || { m: 0, g: {}, t: 0, o: 0 }; for (const k of ['h', 'c', 'e', 's', 'q']) d[k] = d[k] || {}; d.f = d.f || [0, 0, 0]; f(d); writeOut(o); };
// one child's bucket for the day (by profile; the first name only when the family allows it)
const kidOf = (d, p) => { const k = String(p.id || p.name || 'guest').replace(/[^\w-]/g, '').slice(0, 24) || 'guest'; const c = d.c[k] = d.c[k] || { n: '', a: '', m: 0, g: {}, p: {}, t: 0, sm: 0 }; c.n = settings.reportNames === false ? '' : String(p.name || '').trim().split(/\s+/)[0].slice(0, 20); c.a = p.age === 'big' ? 'big' : 'little'; return c; };
const profileOf = pid => (profiles || []).find(p => { try { return makeId('player', p.id || 'guest') === pid; } catch (e) { return false; } });
// the device, from what the browser says about itself (just the family of system and browser)
const osOf = (ua = navigator.userAgent) => /iPhone|iPod/.test(ua) ? 'iOS' : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPadOS' : /Android/.test(ua) ? 'Android' : /CrOS/.test(ua) ? 'ChromeOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'other';
const browserOf = (ua = navigator.userAgent) => /SamsungBrowser/.test(ua) ? 'Samsung' : /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
// something that went wrong: an error in the game's own code, or a child stuck (pushing to walk, not moving)
export function noteProblem(kind, key) { if (!/^[\w .:/()'#,@-]{1,140}$/.test(key || '')) return; bump(d => { const b = kind === 'stuck' ? d.s : d.e; b[key] = Math.min(999, (b[key] || 0) + 1); }); }
// a child walking: pushing the stick or keys for 4 s without moving half a metre counts once a minute, by area
const stuck = { t: 0, x: 0, z: 0, last: 0 };
export function watchHero(h, pad, dt, area) {
  if (!h || !pad) return;
  const pushing = Math.hypot(pad.mx || 0, pad.mz || 0) > .4 && !h.riding && !h.indoors;
  if (!pushing || Math.hypot(h.pos.x - stuck.x, h.pos.z - stuck.z) > .5) { stuck.t = 0; stuck.x = h.pos.x; stuck.z = h.pos.z; return; }
  stuck.t += dt;
  if (stuck.t > 4 && Date.now() - stuck.last > 60e3) { stuck.last = Date.now(); stuck.t = 0; noteProblem('stuck', `${String(area || 'valley').replace(/[^\w-]/g, '')} (${Math.round(h.pos.x)}, ${Math.round(h.pos.z)})`); }
}

// something to count: a game started (its id) or a story opened
export function countPlay(what, gameId) {
  if (what === 'game' && /^[\w-]{1,32}$/.test(gameId || '')) bump(d => { d.g[gameId] = (d.g[gameId] || 0) + 1; });
  if (what === 'tale') bump(d => { d.t++; });
}
// lines said with the machine voice that this device has not reported yet (the game's own words only)
function newMisses() {
  let sent = []; try { sent = JSON.parse(localStorage.getItem(SENT) || '[]'); } catch (e) { }
  const names = (profiles || []).flatMap(p => [p.name, p.nick]).filter(n => n && n.trim().length > 1).map(n => n.trim().toLowerCase());
  const out = voiceMisses().filter(m => m[1].length <= 300 && !sent.includes(m[0] + '|' + m[1]) && !names.some(n => m[1].toLowerCase().includes(n))).slice(0, 15).map(m => [m[0], m[1]]);
  return { out };
}
// Send what waits. Played days move from the outbox into ONE "pending" batch with a one-time id; the batch is sent,
// and re-sent with the same id, until the website confirms it (204). So a batch that arrived but whose answer was
// lost (closing the game, a dropped connection) is never counted twice, and nothing is lost while offline.
export async function flush(closing) {
  if (sending || settings.countPlayers === false || !onSite()) return false;
  const o = readOut();
  if (!o.pending) {
    const days = Object.entries(o.days).filter(([, d]) => d.m || d.t || d.o || Object.keys(d.g).length || Object.keys(d.e || {}).length).map(([d, x]) => ({ d, m: x.m, g: x.g, t: x.t, o: x.o, h: x.h || {}, c: x.c || {}, e: x.e || {}, s: x.s || {}, q: x.q || {}, f: x.f || [0, 0, 0] }));
    if (!days.length) return false;
    const miss = newMisses();
    o.pending = { h: rnd(16), days, v: miss.out }; o.days = {}; writeOut(o);
  }
  if (navigator.onLine === false) return false; // waits for the 'online' event
  const me = id(); if (!me) return false;
  const P = o.pending, body = JSON.stringify({ id: me, h: P.h, b: BUILD, l: settings.lang, k: (profiles || []).length, d: kind(), a: installed(), os: osOf(), br: browserOf(), sc: `${Math.round(screen.width)}x${Math.round(screen.height)}`, days: P.days, v: P.v });
  if (closing) { try { navigator.sendBeacon && navigator.sendBeacon('/api/hello', new Blob([body], { type: 'application/json' })); } catch (e) { } return false; } // confirmed by the next send
  sending = true;
  try {
    const r = await fetch('/api/hello', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    if (r.status !== 204) return false;
    const now = readOut(); if (now.pending && now.pending.h === P.h) delete now.pending; writeOut(now);
    markSent(P.v); lastSent = Date.now(); return true;
  } catch (e) { return false; } finally { sending = false; }
}
const markSent = v => { let sent = []; try { sent = JSON.parse(localStorage.getItem(SENT) || '[]'); } catch (e) { } try { localStorage.setItem(SENT, JSON.stringify(sent.concat(v.map(m => m[0] + '|' + m[1])).slice(-800))); } catch (e) { } };
const acts = new Map(); // activity id → { game, players }
let listening = false;
function listen() {
  if (listening) return; listening = true;
  events.on('ActivityStarted', e => { const g = String(e.defId || '').split(':')[1]; if (!g || !/^[\w-]{1,32}$/.test(g)) return; acts.set(e.activityId, { g, players: e.players || [] }); if (acts.size > 50) acts.delete(acts.keys().next().value);
    bump(d => { for (const pid of e.players || []) { const p = profileOf(pid); if (p) { const c = kidOf(d, p); c.g[g] = c.g[g] || [0, 0, 0]; c.g[g][0]++; } } }); });
  const ended = (e, slot) => { const a = acts.get(e.activityId); if (!a) return; acts.delete(e.activityId);
    bump(d => { if (slot === 2) d.q[a.g] = (d.q[a.g] || 0) + 1; for (const pid of a.players) { const p = profileOf(pid); if (p) { const c = kidOf(d, p); c.g[a.g] = c.g[a.g] || [0, 0, 0]; c.g[a.g][slot]++; } } }); };
  events.on('ActivityCompleted', e => ended(e, 1)); events.on('ActivityAbandoned', e => ended(e, 2)); // won · left before the end
  events.on('PlayerEnteredVillage', e => { const pl = String(e.villageId || '').split(':')[1], p = profileOf(e.playerId); if (pl && p && /^[\w-]{1,32}$/.test(pl)) bump(d => { const c = kidOf(d, p); c.p[pl] = (c.p[pl] || 0) + 1; }); });
  // errors in the game's own code (not other websites' scripts), each message at most once a minute
  const seenErr = new Map();
  const err = (msg, file, line) => { const f = String(file || '').split('/').pop().split('?')[0]; if (f && !/\.m?js$/.test(f)) return; const key = `${String(msg || 'error').replace(/[^\w .:/()'#,-]/g, ' ').replace(/\s+/g, ' ').slice(0, 100).trim()} @ ${f || '?'}:${+line || 0}`; const t = seenErr.get(key) || 0; if (Date.now() - t < 60e3) return; seenErr.set(key, Date.now()); noteProblem('error', key); };
  addEventListener('error', e => err(e.message, e.filename, e.lineno));
  addEventListener('unhandledrejection', e => { const r = e.reason, st = String(r && r.stack || ''), m = /\/([\w.-]+\.m?js):(\d+)/.exec(st); err(r && r.message || String(r), m ? m[1] : 'promise.js', m ? m[2] : 0); });
}
// how smoothly the game runs: frames counted for one second each minute while it is on the screen
function sampleFps() { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else { const fps = Math.round(n * 1000 / (performance.now() - t0)); bump(d => { d.f[0] += fps; d.f[1]++; if (fps < 20) d.f[2]++; }); } }; requestAnimationFrame(tick); }

export function startCounting(G) {
  listen();
  if (window.__svHelloTest === 'manual') return; // (tests send by hand)
  // a minute counts while the game is on the screen (offline too: it waits in the outbox)
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    const simple = document.body.classList.contains('simple-on'), hr = new Date().getHours();
    bump(d => { d.m++; if (Net.connected) d.o++; d.h[hr] = (d.h[hr] || 0) + 1; for (const h of (G && G.heroes) || []) if (h.profile) { const c = kidOf(d, h.profile); c.m++; if (simple) c.sm++; } });
    sampleFps();
    if (Date.now() - lastSent >= EVERY) flush(false);
  }, 60e3);
  addEventListener('pagehide', () => flush(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); else flush(false); });
  addEventListener('online', () => flush(false)); // the internet is back: send what waited
  // a story opened: the tale theatre appearing on the screen
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('theatre')) { countPlay('tale'); const p = G && G.heroes[0] && G.heroes[0].profile; if (p) bump(d => { kidOf(d, p).t++; }); } }).observe(document.body, { childList: true });
  // the first hello soon after starting (a child who plays two minutes still counts), and whatever waited from before
  setTimeout(() => { bump(d => { d.m = Math.max(d.m, 1); }); flush(false); }, 90e3);
  setTimeout(() => flush(false), 5000);
}

// Counting players, without knowing who they are, so the family can see in Sparkle Studio how many children play.
// The first time, this device makes up a random number for itself. Every 10 minutes of play (and when the game is
// put away) it says hello to the game's own website (netlify/functions/hello.mjs) with only:
//   that number · the build · the language · how many children's profiles · minutes played · which games were
//   started and how many stories were opened since the last hello · phone, tablet or computer · installed or not
//   · minutes played with friends online
//   · up to 15 lines of the game's own text it had to read with the machine voice (so Sparkle Studio can record
//     them: the "missing lines inbox"), never a line with a child's name in it
// Never names, photos, places, voices or anything a child typed. Grown-ups → Advanced → "Count players" turns it off.
// Nothing is sent when the game is opened from a file, this computer (tests, Sparkle Studio) or with it switched off.
// Offline play counts too: minutes, games and stories wait in a small outbox on the device (per day, at most 14 days)
// and go when the internet is back. The outbox is only emptied when the website says it got them; each send has a
// one-time id, so a copy that arrives twice is counted once.
import { settings, profiles } from './state.js';
import { BUILD } from './build.js';
import { Net } from './net.js';
import { voiceMisses } from './voice.js';

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
const bump = f => { if (settings.countPlayers === false) return; const o = readOut(), d = o.days[today()] = o.days[today()] || { m: 0, g: {}, t: 0, o: 0 }; f(d); writeOut(o); };

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
    const days = Object.entries(o.days).filter(([, d]) => d.m || d.t || d.o || Object.keys(d.g).length).map(([d, x]) => ({ d, m: x.m, g: x.g, t: x.t, o: x.o }));
    if (!days.length) return false;
    const miss = newMisses();
    o.pending = { h: rnd(16), days, v: miss.out }; o.days = {}; writeOut(o);
  }
  if (navigator.onLine === false) return false; // waits for the 'online' event
  const me = id(); if (!me) return false;
  const P = o.pending, body = JSON.stringify({ id: me, h: P.h, b: BUILD, l: settings.lang, k: (profiles || []).length, d: kind(), a: installed(), days: P.days, v: P.v });
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
export function startCounting() {
  if (window.__svHelloTest === 'manual') return; // (tests send by hand)
  // a minute counts while the game is on the screen (offline too: it waits in the outbox)
  setInterval(() => { if (document.visibilityState !== 'visible') return; bump(d => { d.m++; if (Net.connected) d.o++; }); if (Date.now() - lastSent >= EVERY) flush(false); }, 60e3);
  addEventListener('pagehide', () => flush(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); else flush(false); });
  addEventListener('online', () => flush(false)); // the internet is back: send what waited
  // a story opened: the tale theatre appearing on the screen
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('theatre')) countPlay('tale'); }).observe(document.body, { childList: true });
  // the first hello soon after starting (a child who plays two minutes still counts), and whatever waited from before
  setTimeout(() => { bump(d => { d.m = Math.max(d.m, 1); }); flush(false); }, 90e3);
  setTimeout(() => flush(false), 5000);
}

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
import { settings, profiles } from './state.js';
import { BUILD } from './build.js';
import { Net } from './net.js';
import { voiceMisses } from './voice.js';

const KEY = 'sv2_playerid', EVERY = 10 * 60e3;
let tally = { m: 0, g: {}, t: 0, o: 0 }, lastSent = Date.now();
const id = () => { let v = ''; try { v = localStorage.getItem(KEY) || ''; if (!/^[a-z0-9]{12}$/.test(v)) { v = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); localStorage.setItem(KEY, v); } } catch (e) { } return v; };
const onSite = () => /^https:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname) && !/[?&]studio=1/.test(location.search) && !location.pathname.startsWith('/studio');
const kind = () => { const w = Math.min(screen.width, screen.height), touch = matchMedia('(pointer: coarse)').matches; return !touch ? 'computer' : w < 600 ? 'phone' : 'tablet'; };
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// something to count: a game started (its id) or a story opened
export function countPlay(what, gameId) {
  if (what === 'game' && /^[\w-]{1,32}$/.test(gameId || '')) tally.g[gameId] = (tally.g[gameId] || 0) + 1;
  if (what === 'tale') tally.t++;
}
// lines said with the machine voice that this device has not reported yet (the game's own words only)
const SENT = 'sv2_voicesent';
function newMisses() {
  let sent = []; try { sent = JSON.parse(localStorage.getItem(SENT) || '[]'); } catch (e) { }
  const names = (profiles || []).flatMap(p => [p.name, p.nick]).filter(n => n && n.trim().length > 1).map(n => n.trim().toLowerCase());
  const out = voiceMisses().filter(m => m[1].length <= 300 && !sent.includes(m[0] + '|' + m[1]) && !names.some(n => m[1].toLowerCase().includes(n))).slice(0, 15).map(m => [m[0], m[1]]);
  return { out, mark: () => { try { localStorage.setItem(SENT, JSON.stringify(sent.concat(out.map(m => m[0] + '|' + m[1])).slice(-800))); } catch (e) { } } };
}
function send(beacon) {
  if (settings.countPlayers === false || !onSite() || (!tally.m && !tally.t && !Object.keys(tally.g).length)) return;
  const me = id(); if (!me) return;
  const miss = newMisses();
  const body = JSON.stringify({ id: me, b: BUILD, l: settings.lang, k: (profiles || []).length, m: Math.round(tally.m), g: tally.g, t: tally.t, o: Math.round(tally.o), d: kind(), a: installed(), v: miss.out });
  tally = { m: 0, g: {}, t: 0, o: 0 }; lastSent = Date.now(); miss.mark();
  try { if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/hello', new Blob([body], { type: 'application/json' })); else fetch('/api/hello', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => { }); } catch (e) { }
}
export function startCounting() {
  // a minute counts while the game is on the screen
  setInterval(() => { if (document.visibilityState !== 'visible') return; tally.m++; if (Net.connected) tally.o++; if (Date.now() - lastSent >= EVERY) send(false); }, 60e3);
  addEventListener('pagehide', () => send(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(true); });
  // a story opened: the tale theatre appearing on the screen
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('theatre')) countPlay('tale'); }).observe(document.body, { childList: true });
  // the first hello soon after starting (a child who plays two minutes still counts)
  setTimeout(() => { tally.m = Math.max(tally.m, 1); send(false); }, 90e3);
}

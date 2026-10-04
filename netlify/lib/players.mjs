// How many children play, counted without knowing who they are.
// Each device makes up a random id the first time (js/players.js) and now and then says "hello": the build, the
// language, how many children's profiles it has, minutes played and which games and stories were played since
// the last hello. No names, no photos, no places, no IP addresses are kept. A grown-up can switch it off
// (Grown-ups → Advanced → "Count players").
// It is kept in Netlify Blobs (store "players"):
//   d/<day>/<id>   that device on that day          dev/<id>   the day it was first seen
//   sum/<day>      a finished day, added up (the d/ records of days older than 60 days are removed)
//   seen/<hello>   a hello already counted (a device re-sends what it isn't sure arrived; the copy is ignored)
// Offline play is not lost: the device keeps an outbox of its minutes and games per day and sends it when it is
// online again, so each day is counted as the day it was played.
//   line/<hash>    a line of the game's text that devices had to say with the machine voice (Sparkle Studio's
//                  "missing lines inbox": the grown-up records them, and the next voice pack has them)
import { createHash } from 'crypto';
const ID = /^[a-z0-9]{10,24}$/, WORD = /^[\w-]{1,32}$/;
const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const int = (v, max) => Math.max(0, Math.min(max, Math.round(+v || 0)));
const words = (o, max) => { const out = {}; let n = 0; for (const [k, v] of Object.entries(o && typeof o === 'object' ? o : {})) if (WORD.test(k) && n++ < 40) out[k] = int(v, max); return out; };

// what a device sent, checked: anything odd is dropped
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function clean(b, now = Date.now()) {
  if (!b || typeof b !== 'object' || !ID.test(b.id || '')) return null;
  // the days played since the last hello that arrived (at most 14, none in the future, none older than 30 days);
  // an older device sends one bucket for today
  const lo = day(now - 30 * 864e5), hi = day(now + 864e5), seen = new Set();
  const days = (Array.isArray(b.days) ? b.days : [{ d: day(now), m: b.m, g: b.g, t: b.t, o: b.o }]).slice(0, 14)
    .filter(x => x && DAY.test(x.d) && x.d >= lo && x.d <= hi && !seen.has(x.d) && seen.add(x.d))
    .map(x => ({ d: x.d, mins: int(x.m, 24 * 60), games: words(x.g, 500), tales: int(x.t, 200), online: int(x.o, 24 * 60) })); // online: minutes with friends online
  return { id: b.id, hid: /^[a-z0-9]{8,24}$/.test(b.h || '') ? b.h : '', build: WORD.test(b.b || '') ? b.b : '?', lang: /^(en|vi)$/.test(b.l) ? b.l : '?', kids: int(b.k, 8), days,
    kind: /^(phone|tablet|computer)$/.test(b.d) ? b.d : '?', app: !!b.a,
    lines: (Array.isArray(b.v) ? b.v : []).slice(0, 15).filter(v => Array.isArray(v) && /^(en|vi|zh|hi)$/.test(v[0]) && typeof v[1] === 'string' && v[1].trim() && v[1].length <= 300 && !/[\u0000-\u001f<>]/.test(v[1])).map(v => [v[0], v[1].trim()]) }; // minutes with friends online
}

export async function hello(S, body, now = Date.now()) {
  const d = clean(body, now); if (!d) return false;
  const today = day(now);
  if (d.hid && await S.get('seen/' + d.hid)) return true; // a copy of one already counted (its answer was lost): just confirm it
  // the first day this device was ever seen (an outbox can bring an earlier day than the one already known)
  const known = await S.get('dev/' + d.id), first = [known, ...d.days.map(x => x.d)].filter(Boolean).sort()[0] || today;
  if (first !== known) await S.set('dev/' + d.id, first);
  for (const x of d.days) {
    const key = `d/${x.d}/${d.id}`, r = (await S.get(key, { type: 'json' })) || { hellos: 0, mins: 0, games: {}, tales: 0, online: 0 };
    r.isNew = x.d === first; r.hellos++; r.mins = Math.min(24 * 60, r.mins + x.mins); r.tales += x.tales; r.online = Math.min(24 * 60, r.online + x.online);
    for (const [g, n] of Object.entries(x.games)) r.games[g] = (r.games[g] || 0) + n;
    Object.assign(r, { build: d.build, lang: d.lang, kids: d.kids, kind: d.kind, app: d.app });
    await S.setJSON(key, r);
    if (x.d < today) await S.delete('sum/' + x.d); // a finished day that just got more play (from an outbox) is added up again
  }
  if (d.hid) await S.set('seen/' + d.hid, today); // only once it is all written
  for (const [lang, text] of d.lines) { const k = 'line/' + createHash('sha1').update(lang + '|' + text).digest('hex').slice(0, 16), o = (await S.get(k, { type: 'json' })) || { lang, text, n: 0, first: today }; o.n++; o.last = today; await S.setJSON(k, o); }
  return true;
}

const add = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
async function sumDay(S, date, keep) {
  const saved = await S.get('sum/' + date, { type: 'json' }); if (saved) return saved;
  const { blobs } = await S.list({ prefix: `d/${date}/` }), s = { date, ids: [], newDevices: 0, mins: 0, games: {}, langs: {}, builds: {}, kinds: {}, app: 0, kids: 0, tales: 0, online: 0 };
  for (const b of blobs) {
    const r = await S.get(b.key, { type: 'json' }); if (!r) continue;
    s.ids.push(b.key.split('/')[2]); if (r.isNew) s.newDevices++; s.mins += r.mins; s.kids += r.kids; s.tales += r.tales; s.online += r.online || 0; if (r.app) s.app++;
    add(s.langs, r.lang); add(s.builds, r.build); add(s.kinds, r.kind); for (const [g, n] of Object.entries(r.games || {})) add(s.games, g, n);
  }
  if (keep) await S.setJSON('sum/' + date, s); // a finished day never changes again
  return s;
}

// the report for Sparkle Studio's Players page
export async function report(S, now = Date.now()) {
  const days = []; for (let i = 29; i >= 0; i--) days.push(day(now - i * 864e5));
  const sums = []; for (const [i, d] of days.entries()) sums.push(await sumDay(S, d, i < days.length - 1));
  const uniq = list => new Set(list.flatMap(s => s.ids)).size, last = n => sums.slice(-n);
  const total = (list, f) => { const o = {}; for (const s of list) for (const [k, v] of Object.entries(s[f])) add(o, k, v); return o; };
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  let allTime = 0, cursor; do { const r = await S.list({ prefix: 'dev/', ...(cursor ? { cursor } : {}) }); allTime += r.blobs.length; cursor = r.cursor; } while (cursor);
  // tidy up: the day-by-day device records are only needed for 60 days (the sums stay)
  const old = day(now - 60 * 864e5);
  try { const { blobs } = await S.list({ prefix: 'd/' }); for (const b of blobs) if (b.key.slice(2, 12) < old) await S.delete(b.key); } catch (e) { }
  try { const { blobs } = await S.list({ prefix: 'seen/' }); for (const b of blobs) { const v = await S.get(b.key); if (!v || v < old) await S.delete(b.key); } } catch (e) { }
  const t = sums[sums.length - 1], w = last(7), deviceDays = sums.reduce((a, s) => a + s.ids.length, 0);
  return {
    made: new Date(now).toISOString(),
    today: { devices: t.ids.length, newDevices: t.newDevices, mins: t.mins },
    week: { devices: uniq(w), newDevices: w.reduce((a, s) => a + s.newDevices, 0), mins: w.reduce((a, s) => a + s.mins, 0) },
    month: { devices: uniq(sums), newDevices: sums.reduce((a, s) => a + s.newDevices, 0), mins: sums.reduce((a, s) => a + s.mins, 0) },
    allTime,
    perDay: sums.map(s => ({ date: s.date, devices: s.ids.length, newDevices: s.newDevices, mins: s.mins })),
    minsPerDevice: deviceDays ? Math.round(sums.reduce((a, s) => a + s.mins, 0) / deviceDays) : 0,
    kidsPerDevice: deviceDays ? +(sums.reduce((a, s) => a + s.kids, 0) / deviceDays).toFixed(1) : 0,
    games: top(total(sums, 'games'), 25), tales: sums.reduce((a, s) => a + s.tales, 0), onlineMins: sums.reduce((a, s) => a + s.online, 0),
    langs: total(w, 'langs'), builds: total(w, 'builds'), kinds: total(w, 'kinds'), app: w.reduce((a, s) => a + s.app, 0), weekDeviceDays: w.reduce((a, s) => a + s.ids.length, 0)
  };
}

// the missing lines inbox, most asked-for first
export async function inbox(S) {
  const { blobs } = await S.list({ prefix: 'line/' }), out = [];
  for (const b of blobs.slice(0, 2000)) { const o = await S.get(b.key, { type: 'json' }); if (o) out.push(o); }
  return out.sort((a, b) => b.n - a.n).slice(0, 600);
}

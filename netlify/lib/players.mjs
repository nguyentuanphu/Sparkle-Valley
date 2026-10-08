// How many children play, and (round L) what each one plays, for the grown-ups' report in Sparkle Studio.
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
const obj = o => o && typeof o === 'object' && !Array.isArray(o) ? o : {};
const KEY = /^[\w .:/()'#,@-]{1,140}$/, NAME = /^[\p{L}' -]{0,20}$/u;
const counts = (o, max, n = 20, re = KEY) => { const out = {}; let k = 0; for (const [a, v] of Object.entries(obj(o))) if (re.test(a) && k++ < n) out[a] = int(v, max); return out; };
// one child's day: first name (or none), age group, minutes, games [started, won, left early], places, stories
const kid = c => ({ n: NAME.test(String(c.n || '')) ? String(c.n || '').trim() : '', a: c.a === 'big' ? 'big' : 'little', m: int(c.m, 24 * 60), sm: int(c.sm, 24 * 60), t: int(c.t, 200),
  g: Object.fromEntries(Object.entries(obj(c.g)).filter(([k, v]) => WORD.test(k) && Array.isArray(v)).slice(0, 40).map(([k, v]) => [k, [int(v[0], 500), int(v[1], 500), int(v[2], 500)]])),
  p: counts(c.p, 500, 30, WORD) });
const kids = o => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => WORD.test(k)).slice(0, 8).map(([k, c]) => [k, kid(obj(c))]));
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
    .map(x => ({ d: x.d, mins: int(x.m, 24 * 60), games: words(x.g, 500), tales: int(x.t, 200), online: int(x.o, 24 * 60), // online: minutes with friends online
      hours: Object.fromEntries(Object.entries(obj(x.h)).filter(([k]) => /^([01]?\d|2[0-3])$/.test(k)).map(([k, v]) => [+k, int(v, 60)])), kids: kids(x.c),
      errs: counts(x.e, 999), stuck: counts(x.s, 999), quits: words(x.q, 500), fps: Array.isArray(x.f) ? [int(x.f[0], 1e6), int(x.f[1], 24 * 60), int(x.f[2], 24 * 60)] : [0, 0, 0] }));
  return { id: b.id, hid: /^[a-z0-9]{8,24}$/.test(b.h || '') ? b.h : '', build: WORD.test(b.b || '') ? b.b : '?', lang: /^(en|vi)$/.test(b.l) ? b.l : '?', kids: int(b.k, 8), days,
    kind: /^(phone|tablet|computer)$/.test(b.d) ? b.d : '?', app: !!b.a,
    os: /^(iOS|iPadOS|Android|ChromeOS|Windows|macOS|Linux|other)$/.test(b.os) ? b.os : '?', br: /^(Safari|Chrome|Edge|Firefox|Samsung|other)$/.test(b.br) ? b.br : '?', sc: /^\d{2,5}x\d{2,5}$/.test(b.sc || '') ? b.sc : '',
    lines: (Array.isArray(b.v) ? b.v : []).slice(0, 15).filter(v => Array.isArray(v) && /^(en|vi|zh|hi)$/.test(v[0]) && typeof v[1] === 'string' && v[1].trim() && v[1].length <= 300 && !/[\u0000-\u001f<>]/.test(v[1])).map(v => [v[0], v[1].trim()]) }; // minutes with friends online
}

// a place name from the connection (Netlify's geo), cleaned
const place = s => String(s || '').normalize('NFC').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40);
// Online now (round O, owner: Studio should show whether each device is playing right now): while the game is on the
// screen a device says "still here" every two minutes ({ id, live: 1, kid: the child's first name }), and "gone"
// when it is put away ({ id, live: 0 }); only the latest is kept, in live/<id>.
export async function live(S, b, now = Date.now()) {
  if (!b || !ID.test(b.id || '')) return false;
  const kid = NAME.test(String(b.kid || '')) ? String(b.kid || '').trim() : '';
  await S.setJSON('live/' + b.id, { on: !!b.live, at: now, kid });
  return true;
}
export const LIVE_MS = 5 * 60e3; // no "still here" for five minutes: offline (the phone died, or lost the internet)
export async function hello(S, body, now = Date.now(), where = {}) {
  if (body && body.live != null) return live(S, body, now);
  const d = clean(body, now); if (!d) return false;
  const today = day(now);
  if (d.hid && await S.get('seen/' + d.hid)) return true; // a copy of one already counted (its answer was lost): just confirm it
  // the first day this device was ever seen (an outbox can bring an earlier day than the one already known)
  const known = await S.get('dev/' + d.id), first = [known, ...d.days.map(x => x.d)].filter(Boolean).sort()[0] || today;
  if (first !== known) await S.set('dev/' + d.id, first);
  // the device itself: what it is, roughly where, first and last seen (round L)
  { const k = 'info/' + d.id, o = (await S.get(k, { type: 'json' })) || { first: first };
    const loc = { city: place(where.city), region: place(where.region), country: place(where.country).toUpperCase().slice(0, 3) };
    Object.assign(o, { kind: d.kind, app: d.app, os: d.os, br: d.br, sc: d.sc || o.sc || '', build: d.build, lang: d.lang, kids: d.kids, last: today, first: first < (o.first || first) ? first : (o.first || first) });
    if (loc.country || loc.city) o.loc = loc;
    await S.setJSON(k, o); }
  for (const x of d.days) {
    const key = `d/${x.d}/${d.id}`, r = (await S.get(key, { type: 'json' })) || { hellos: 0, mins: 0, games: {}, tales: 0, online: 0 };
    r.hours = r.hours || {}; r.children = r.children || {}; r.errs = r.errs || {}; r.stuck = r.stuck || {}; r.quits = r.quits || {}; r.fps = r.fps || [0, 0, 0];
    for (const [h, n] of Object.entries(x.hours)) r.hours[h] = Math.min(60, (r.hours[h] || 0) + n);
    for (const f of ['errs', 'stuck', 'quits']) for (const [k, n] of Object.entries(x[f])) r[f][k] = (r[f][k] || 0) + n;
    r.fps = r.fps.map((v, i) => v + x.fps[i]);
    for (const [k, c] of Object.entries(x.kids)) {
      const m = r.children[k] = r.children[k] || { n: '', a: c.a, m: 0, sm: 0, t: 0, g: {}, p: {} };
      m.n = c.n; m.a = c.a; m.m = Math.min(24 * 60, m.m + c.m); m.sm = Math.min(24 * 60, m.sm + c.sm); m.t += c.t;
      for (const [g, v] of Object.entries(c.g)) { const o = m.g[g] = m.g[g] || [0, 0, 0]; v.forEach((n, i) => { o[i] += n; }); }
      for (const [pl, n] of Object.entries(c.p)) m.p[pl] = (m.p[pl] || 0) + n;
    }
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
  const { blobs } = await S.list({ prefix: `d/${date}/` }), s = { date, ids: [], newDevices: 0, mins: 0, games: {}, langs: {}, builds: {}, kinds: {}, app: 0, kids: 0, tales: 0, online: 0, dev: {} };
  for (const b of blobs) {
    const r = await S.get(b.key, { type: 'json' }); if (!r) continue;
    s.ids.push(b.key.split('/')[2]); if (r.isNew) s.newDevices++; s.mins += r.mins; s.kids += r.kids; s.tales += r.tales; s.online += r.online || 0; if (r.app) s.app++;
    add(s.langs, r.lang); add(s.builds, r.build); add(s.kinds, r.kind); for (const [g, n] of Object.entries(r.games || {})) add(s.games, g, n);
    // round L: what this device did that day, kept with the day's sum (per child, hours, problems, smoothness)
    s.dev[b.key.split('/')[2]] = { mins: r.mins, tales: r.tales, games: r.games || {}, hours: r.hours || {}, kids: r.children || {}, errs: r.errs || {}, stuck: r.stuck || {}, quits: r.quits || {}, fps: r.fps || [0, 0, 0] };
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
  const detail = await details(S, sums, now);
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
    langs: total(w, 'langs'), builds: total(w, 'builds'), kinds: total(w, 'kinds'), app: w.reduce((a, s) => a + s.app, 0), weekDeviceDays: w.reduce((a, s) => a + s.ids.length, 0),
    ...detail
  };
}

// round L: the last 30 days per device and per child, when they play, where from, what went wrong, and suggestions
async function details(S, sums, now) {
  const infos = {}, labels = {};
  const lives = {};
  for (const pre of ['info/', 'label/', 'live/']) { let cursor; do { const r = await S.list({ prefix: pre, ...(cursor ? { cursor } : {}) }); for (const b of r.blobs.slice(0, 500)) { const id = b.key.slice(pre.length); if (pre === 'info/') infos[id] = await S.get(b.key, { type: 'json' }); else if (pre === 'live/') lives[id] = await S.get(b.key, { type: 'json' }); else labels[id] = await S.get(b.key); } cursor = r.cursor; } while (cursor); }
  const hours = Array(24).fill(0), places = {}, errs = {}, stuck = {}, quits = {}, starts = {}, devs = {};
  for (const s of sums) for (const [id, x] of Object.entries(s.dev || {})) {
    const D = devs[id] = devs[id] || { id, mins: 0, days: 0, tales: 0, kids: {}, errs: 0, stuck: 0, fps: [0, 0, 0], last: s.date };
    D.mins += x.mins; D.days++; D.tales += x.tales; D.last = s.date; D.fps = D.fps.map((v, i) => v + ((x.fps || [])[i] || 0));
    for (const [h, n] of Object.entries(x.hours || {})) hours[+h] += n;
    for (const [k, n] of Object.entries(x.errs || {})) { const e = errs[k] = errs[k] || { n: 0, devices: new Set() }; e.n += n; e.devices.add(id); D.errs += n; }
    for (const [k, n] of Object.entries(x.stuck || {})) { add(stuck, k, n); D.stuck += n; }
    for (const [k, n] of Object.entries(x.quits || {})) add(quits, k, n);
    for (const [k, n] of Object.entries(x.games || {})) add(starts, k, n);
    for (const [k, c] of Object.entries(x.kids || {})) {
      const K = D.kids[k] = D.kids[k] || { key: k, name: '', age: c.a, mins: 0, simpleMins: 0, tales: 0, games: {}, places: {} };
      if (c.n) K.name = c.n; K.age = c.a; K.mins += c.m; K.simpleMins += c.sm || 0; K.tales += c.t;
      for (const [g, v] of Object.entries(c.g || {})) { const o = K.games[g] = K.games[g] || [0, 0, 0]; v.forEach((n, i) => { o[i] += n; }); }
      for (const [pl, n] of Object.entries(c.p || {})) { add(K.places, pl, n); add(places, pl, n); }
    }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
  const fpsOf = f => f[1] ? Math.round(f[0] / f[1]) : null;
  const devices = Object.keys({ ...infos, ...devs }).map(id => { const I = infos[id] || {}, D = devs[id] || { mins: 0, days: 0, tales: 0, kids: {}, errs: 0, stuck: 0, fps: [0, 0, 0] };
    return { id, label: labels[id] || '', kind: I.kind || '?', os: I.os || '?', br: I.br || '?', screen: I.sc || '', app: !!I.app, build: I.build || '?', lang: I.lang || '?', loc: I.loc || null, first: I.first || '', last: I.last || D.last || '',
      online: !!(lives[id] && lives[id].on && now - lives[id].at < LIVE_MS), seenAt: lives[id] ? new Date(lives[id].at).toISOString() : '', playingNow: lives[id] && lives[id].on && now - lives[id].at < LIVE_MS ? lives[id].kid || '' : '',
      mins: D.mins, days: D.days, tales: D.tales, errors: D.errs, stuck: D.stuck, fps: fpsOf(D.fps), slowMins: D.fps[2],
      kids: Object.values(D.kids).sort((a, b) => b.mins - a.mins).map(K => ({ ...K, games: Object.entries(K.games).sort((a, b) => b[1][0] - a[1][0]).slice(0, 10).map(([g, v]) => [g, ...v]), places: top(K.places, 8) })) }; })
    .sort((a, b) => b.online - a.online || (b.last || '').localeCompare(a.last || '') || b.mins - a.mins).slice(0, 100);
  const count = f => { const o = {}; for (const d of devices) if (d.days) add(o, f(d)); return o; };
  const problems = {
    errors: Object.entries(errs).sort((a, b) => b[1].n - a[1].n).slice(0, 15).map(([k, e]) => [k, e.n, e.devices.size]),
    stuck: top(stuck, 15),
    quits: Object.entries(quits).map(([g, n]) => [g, n, starts[g] || n, Math.round(100 * n / Math.max(n, starts[g] || n))]).sort((a, b) => b[1] - a[1]).slice(0, 12),
    slow: devices.filter(d => d.fps != null && d.fps < 25).map(d => [d.id, d.label, d.fps, d.slowMins])
  };
  // things worth doing: Studio words them (with the games' and places' own names), most useful first
  const tips = [], who = d => ({ id: d.id, label: d.label, kind: d.kind, os: d.os, br: d.br });
  for (const [g, n, st, pct] of problems.quits) if (st >= 5 && pct >= 50) tips.push({ k: 'quit', g, n, st });
  for (const [where, n] of problems.stuck) if (n >= 3) tips.push({ k: 'stuck', where, n });
  for (const [e, n, dv] of problems.errors.slice(0, 3)) tips.push({ k: 'error', e, n, dv });
  for (const d of devices) if (d.fps != null && d.fps < 25) tips.push({ k: 'slow', d: who(d), fps: d.fps });
  const newest = Object.keys(count(d => d.build)).filter(b => /^r\d+$/.test(b)).sort((a, b) => +a.slice(1) - +b.slice(1)).pop();
  for (const d of devices) if (d.days && newest && /^r\d+$/.test(d.build) && d.build !== newest) tips.push({ k: 'old', d: who(d), build: d.build, newest });
  const quiet = day(now - 7 * 864e5);
  for (const d of devices) if (d.last && d.last < quiet && d.days) tips.push({ k: 'quiet', d: who(d), last: d.last });
  for (const d of devices) for (const K of d.kids) if (K.age === 'little' && K.mins > 30 && K.simpleMins < K.mins * .2) tips.push({ k: 'simple', name: K.name, d: who(d) });
  return { onlineNow: devices.filter(d => d.online).length, hours, places: top(places, 15), devices, os: count(d => d.os), browsers: count(d => d.br), locations: count(d => d.loc ? [d.loc.city, d.loc.region, d.loc.country].filter(Boolean).join(', ') : '?'), problems, tips: tips.slice(0, 20) };
}
// a name the family gives a device in Studio ("Na's iPad")
export async function setLabel(S, id, label) { if (!ID.test(id || '')) return false; const l = String(label || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40); if (l) await S.set('label/' + id, l); else await S.delete('label/' + id); return true; }

// the missing lines inbox, most asked-for first
export async function inbox(S) {
  const { blobs } = await S.list({ prefix: 'line/' }), out = [];
  for (const b of blobs.slice(0, 2000)) { const o = await S.get(b.key, { type: 'json' }); if (o) out.push(o); }
  return out.sort((a, b) => b.n - a.n).slice(0, 600);
}

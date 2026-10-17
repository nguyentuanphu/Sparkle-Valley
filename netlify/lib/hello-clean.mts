// @ts-check
// What a device sends in its "hello" (js/players.js), checked before anything is kept (netlify/lib/players.mts): the
// device's random id, its build and session, the days it played and what was played. Anything odd is dropped; a value is
// kept only as the text or number the rule allows (a list or object that merely looks like text is not kept as itself).
// (owner repair round, 15 Oct AEDT: identity, build and version data are type-checked, `types` check.)

export const ID = /^[a-z0-9]{10,24}$/, WORD = /^[\w-]{1,32}$/, KEY = /^[\w .:/()'#,@-]{1,140}$/, NAME = /^[\p{L}' -]{0,20}$/u, DAY = /^\d{4}-\d{2}-\d{2}$/;
export const LINES = { hello: 10, device: 30, ip: 60, newPerDay: 200 }; // (round R privacy) missing lines taken at most

/** @typedef {Record<string, unknown>} Loose  what arrived: any field may be missing or of any kind */
/** @typedef {[number, number, number]} GameCounts  [started, won, left early] */
/** @typedef {{ n: string, a: 'big' | 'little', m: number, sm: number, t: number, g: Record<string, GameCounts>, p: Record<string, number> }} KidDay */
/** @typedef {[number, number, number, 0 | 1, string]} Start  ms to code, to a built valley, to the first picture, from the saved copy, slowest step */
/**
 * @typedef {{ d: string, build: string, mins: number, games: Record<string, number>, tales: number, online: number,
 *   hours: Record<number, number>, kids: Record<string, KidDay>, errs: Record<string, number>, stuck: Record<string, number>,
 *   quits: Record<string, number>, fps: [number, number, number], starts: Start[], bat: number[] }} HelloDay
 * @typedef {{ id: string, hid: string, build: string, sid: string, started: number, lang: 'en' | 'vi' | '?', kids: number, days: HelloDay[],
 *   kind: 'phone' | 'tablet' | 'computer' | '?', app: boolean, os: string, br: string, sc: string, lines: [string, string][] }} Hello
 */

/** as a regular expression tests it (`x || ''`), but as text @param {unknown} v @returns {string} */
export const txt = v => v ? String(v) : '';
/** @param {number} [t] @returns {string} */
export const day = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
/** a whole number from 0 to max @param {unknown} v @param {number} max @returns {number} */
export const int = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
/** @param {unknown} o @returns {Loose} */
export const obj = o => o && typeof o === 'object' && !Array.isArray(o) ? /** @type {Loose} */ (o) : {};
/** @param {unknown} o @param {number} max @param {number} [n] @param {RegExp} [re] @returns {Record<string, number>} */
export const counts = (o, max, n = 20, re = KEY) => { const out = /** @type {Record<string, number>} */ ({}); let k = 0; for (const [a, v] of Object.entries(obj(o))) if (re.test(a) && k++ < n) out[a] = int(v, max); return out; };
/** @param {unknown} o @param {number} max @returns {Record<string, number>} */
export const words = (o, max) => counts(o, max, 40, WORD);
/** one child's day: first name (or none), age group, minutes, games [started, won, left early], places, stories @param {Loose} c @returns {KidDay} */
export const kid = c => ({ n: NAME.test(txt(c.n)) ? txt(c.n).trim() : '', a: c.a === 'big' ? 'big' : 'little', m: int(c.m, 24 * 60), sm: int(c.sm, 24 * 60), t: int(c.t, 200),
  g: Object.fromEntries(Object.entries(obj(c.g)).filter(([k, v]) => WORD.test(k) && Array.isArray(v)).slice(0, 40).map(([k, v]) => { const a = /** @type {unknown[]} */ (v); return [k, /** @type {GameCounts} */ ([int(a[0], 500), int(a[1], 500), int(a[2], 500)])]; })),
  p: counts(c.p, 500, 30, WORD) });
/** @param {unknown} o @returns {Record<string, KidDay>} */
export const kids = o => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => WORD.test(k)).slice(0, 8).map(([k, c]) => [k, kid(obj(c))]));

// (battery round, 12 Oct) a day's drawing and battery: [minutes measured, frames drawn while a child played and something
// moved, ms spent on them, draw calls on them, pixel ratio x100 summed per minute, idle minutes, minutes on battery,
// battery used in tenths of a percent, minutes charging, seconds of that playing]
export const BAT_MAX = [24 * 60, 24 * 3600 * 240, 864e5, 24 * 3600 * 240 * 5000, 24 * 60 * 400, 24 * 60, 24 * 60, 1000, 24 * 60, 24 * 3600];
/** @param {unknown} b @returns {number[]} */
export const bat = b => Array.isArray(b) && b.length === 10 ? BAT_MAX.map((m, i) => int(b[i], m)) : BAT_MAX.map(() => 0);
/** @param {number[]} a @param {number[]} b @returns {number[]} */
export const batAdd = (a, b) => BAT_MAX.map((m, i) => Math.min(m * 30, (a[i] || 0) + (b[i] || 0)));

/** what a device sent, checked: anything odd is dropped @param {unknown} input @param {number} [now] @returns {Hello | null} */
export function clean(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const b = /** @type {Loose} */ (input);
  if (!ID.test(txt(b.id))) return null;
  // the days played since the last hello that arrived (at most 14, none in the future, none older than 30 days);
  // an older device sends one bucket for today
  const lo = day(now - 30 * 864e5), hi = day(now + 864e5), seen = new Set();
  /** where a day was played: its own build (a release or '?'), or the device's build for an older device @param {Loose} x */
  const origin = x => typeof x.build === 'string' && (/^r\d{1,4}$/.test(x.build) || x.build === '?') ? x.build : (b.sid ? '?' : WORD.test(txt(b.b)) ? txt(b.b) : '?');
  /** @type {unknown[]} */
  const sent = Array.isArray(b.days) ? b.days : [{ d: day(now), m: b.m, g: b.g, t: b.t, o: b.o }];
  const days = sent.slice(0, 42).map(obj)
    .filter(x => { const d = txt(x.d); if (!DAY.test(d) || d < lo || d > hi) return false; const key = d + '|' + origin(x); if (seen.has(key)) return false; seen.add(key); return true; })
    .map(x => /** @type {HelloDay} */ ({ d: txt(x.d), build: origin(x), mins: int(x.m, 24 * 60), games: words(x.g, 500), tales: int(x.t, 200), online: int(x.o, 24 * 60), // online: minutes with friends online
      hours: Object.fromEntries(Object.entries(obj(x.h)).filter(([k]) => /^([01]?\d|2[0-3])$/.test(k)).map(([k, v]) => [+k, int(v, 60)])), kids: kids(x.c),
      errs: counts(x.e, 999), stuck: counts(x.s, 999), quits: words(x.q, 500), fps: Array.isArray(x.f) ? [int(x.f[0], 1e6), int(x.f[1], 24 * 60), int(x.f[2], 24 * 60)] : [0, 0, 0],
      starts: (Array.isArray(x.st) ? x.st : []).filter(a => Array.isArray(a)).slice(0, 6).map(a => [int(a[0], 6e5), int(a[1], 6e5), int(a[2], 6e5), a[3] ? 1 : 0, /^[a-z]{1,16}$/.test(txt(a[4])) ? txt(a[4]) : '']),
      bat: bat(x.b) }));
  const started = b.started, l = txt(b.l), d = txt(b.d), os = txt(b.os), br = txt(b.br);
  return { id: txt(b.id), hid: /^[a-z0-9]{8,24}$/.test(txt(b.h)) ? txt(b.h) : '', build: WORD.test(txt(b.b)) ? txt(b.b) : '?', sid: /^[a-z0-9]{16}$/.test(txt(b.sid)) ? txt(b.sid) : '',
    started: typeof started === 'number' && Number.isSafeInteger(started) && started > 0 && started <= now + 300000 ? started : 0,
    lang: l === 'en' || l === 'vi' ? l : '?', kids: int(b.k, 8), days,
    kind: d === 'phone' || d === 'tablet' || d === 'computer' ? d : '?', app: !!b.a,
    os: /^(iOS|iPadOS|Android|ChromeOS|Windows|macOS|Linux|other)$/.test(os) ? os : '?', br: /^(Safari|Chrome|Edge|Firefox|Samsung|other)$/.test(br) ? br : '?', sc: /^\d{2,5}x\d{2,5}$/.test(txt(b.sc)) ? txt(b.sc) : '',
    lines: (Array.isArray(b.v) ? b.v : []).slice(0, LINES.hello).filter(v => Array.isArray(v) && /^(en|vi|zh|hi)$/.test(txt(v[0])) && typeof v[1] === 'string' && v[1].trim() && v[1].length <= 300 && !/[\u0000-\u001f<>]/.test(v[1])).map(v => /** @type {[string, string]} */ ([txt(v[0]), v[1].trim()])) };
}

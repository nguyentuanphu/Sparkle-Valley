export type RandomStream = (() => number) & { int(a: number, b: number): number; range(a: number, b: number): number; pick<T>(list: T[]): T; shuffle<T>(list: T[]): T[] };
// @ts-check
// Seeded random streams (architecture §7, layer L0). A generator that needs randomness takes its own named stream,
// so adding randomness in one place never shifts what another place makes (ID-001), and a test can repeat a run.
//   const r = stream('lotus/hens');  r() → 0..1;  r.int(1, 6);  r.pick(list);  r.range(a, b)
// stream(name) is the same for everyone on every start; stream(name, session()) differs per play session.

/** mulberry32: small, fast, good enough for games. @param {number} seed */
export function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** A 32-bit hash of a text (FNV-1a). @param {string} text */
export function hash32(text: string) { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
let sessionSeed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
/** this play session's seed (tests can set it) */
export const session = () => sessionSeed;
/** @param {number} s */
export const setSession = s => { sessionSeed = s >>> 0; };
/**
 * @param {string | number} name  @param {number} [salt]
 * @returns {(() => number) & { int: (a: number, b: number) => number, range: (a: number, b: number) => number, pick: <T>(list: T[]) => T, shuffle: <T>(list: T[]) => T[] }}
 */
export function stream(name: string | number, salt = 0): RandomStream {
  const r = (mulberry((typeof name === 'number' ? name : hash32(name)) ^ salt) as RandomStream);
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.range = (a, b) => a + r() * (b - a);
  r.pick = list => list[Math.floor(r() * list.length)];
  r.shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return r;
}

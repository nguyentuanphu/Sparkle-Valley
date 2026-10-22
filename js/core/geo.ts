// @ts-check
// 2D maths for the ground plane (architecture §2, layer L0): x and z in metres. Pure: no three.js, no DOM.

/** @param {number} v @param {number} a @param {number} b */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** @param {number} a @param {number} b @param {number} t */
export const lerp = (a, b, t) => a + (b - a) * t;
/** smoothstep @param {number} e0 @param {number} e1 @param {number} x */
export const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
/** distance on the ground @param {number} ax @param {number} az @param {number} bx @param {number} bz */
export const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
/** the shortest turn from angle a to b, in -π..π @param {number} a @param {number} b */
export const angleDiff = (a, b) => ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
/** @param {number} a @param {number} b @param {number} t */
export const angleLerp = (a, b, t) => a + angleDiff(a, b) * t;
/**
 * Distance from a point to a segment, and how far along it (0..1) the nearest point is.
 * @param {number} px @param {number} pz @param {number} ax @param {number} az @param {number} bx @param {number} bz
 */
export function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1) : 0;
  return { d: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t };
}
/** @typedef {[number, number]} P2 */
/** @param {P2[]} pts */
export const polyLength = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist2(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); return s; };
/** Nearest distance from a point to a polyline. @param {number} x @param {number} z @param {P2[]} pts */
export function polyDist(x, z, pts) { let best = Infinity; for (let i = 1; i < pts.length; i++) best = Math.min(best, segDist(x, z, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]).d); return best; }
/** @typedef {{ x0: number, z0: number, x1: number, z1: number }} Box */
/** @param {Box} b @param {number} x @param {number} z @param {number} [pad] */
export const inBox = (b, x, z, pad = 0) => x >= b.x0 - pad && x <= b.x1 + pad && z >= b.z0 - pad && z <= b.z1 + pad;
/** @param {Box} a @param {Box} b @param {number} [pad] */
export const boxesOverlap = (a, b, pad = 0) => a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.z0 - pad < b.z1 && b.z0 - pad < a.z1;

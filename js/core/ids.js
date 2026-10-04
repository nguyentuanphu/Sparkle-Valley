// @ts-check
// Identifiers (architecture §5, layer L0): every thing other systems talk about has an id like `kind:scope/name`
// (lower-case ASCII, `-` inside names, `/` between scope and name). Examples: `place:village`, `game:caro`,
// `npc:village/ba-nam`, `sticker:place/hue`. Ids are made from content keys, never from list positions (ID-001), and
// named things keep theirs forever (ID-002). Pure: no DOM, no game state; runs in Node too (tests/unit).

/** Turn any text into an id part: "Bà Năm" → "ba-nam", "Hồ Gươm" → "ho-guom". */
export function slug(text) {
  return String(text == null ? '' : text).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}
const PART = /^[a-z0-9][a-z0-9-]*$/;
/**
 * Make an id. `id('npc', 'village', 'Bà Năm')` → `npc:village/ba-nam`; `id('game', 'caro')` → `game:caro`.
 * @param {string} kind  @param {...(string|number)} parts  @returns {string}
 */
export function id(kind, ...parts) {
  const k = slug(kind), ps = parts.filter(p => p != null && p !== '').map(p => slug(String(p)));
  if (!k || !ps.length || ps.some(p => !PART.test(p))) throw new Error(`bad id parts: ${kind} ${parts.join(' ')}`);
  return `${k}:${ps.join('/')}`;
}
/** @param {any} s  @returns {boolean} */
export const isId = s => typeof s === 'string' && /^[a-z0-9-]+:[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(s) && s.length <= 160;
/**
 * `parse('npc:village/ba-nam')` → { kind: 'npc', scope: ['village'], name: 'ba-nam' }; null if it is not an id.
 * @param {string} s  @returns {{ kind: string, scope: string[], name: string } | null}
 */
export function parse(s) {
  if (!isId(s)) return null;
  const [kind, rest] = s.split(':'), parts = rest.split('/');
  return { kind, scope: parts.slice(0, -1), name: parts[parts.length - 1] };
}
/** @param {string} s  @returns {string | null} */
export const kindOf = s => { const p = parse(s); return p ? p.kind : null; };

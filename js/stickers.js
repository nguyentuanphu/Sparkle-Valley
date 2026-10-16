// The sticker book (owner plan, 16 Oct 2026 AEDT, chat B; docs/plans-20261016/CHAT-B-STICKER-BOOK-PROMPT.md).
// One place that gives, keeps and counts stickers. Other systems only call give(id), has(id) and count():
//   import { give, has, count } from './stickers.js';
//   give('hen');            // the child playing now gets the hen sticker (once; again = maybe a shiny copy)
//   give('hen', hero);      // a given child (a hero, or a profile)
//   has('hen'); count();    // does the child have it; how many different stickers they have
// A child's stickers are kept in their profile: stickerBook = { got: { id: { t, n } }, fresh: { id: 1 } }.
// main.js calls attach(G) once at start so give() knows who is playing.

let G = null;
/** main.js: who is playing (G.heroes), saving and toasts */
export function attach(game) { G = game; }

const profileOf = who => (who && who.profile) ? who.profile : who && typeof who === 'object' ? who : (G && G.heroes && G.heroes[0] ? G.heroes[0].profile : null);
/** a child's book, made on first use (older saves have none) */
export function book(p) {
  if (!p) return { got: {}, fresh: {} };
  const b = p.stickerBook = (p.stickerBook && typeof p.stickerBook === 'object') ? p.stickerBook : {};
  b.got = b.got && typeof b.got === 'object' ? b.got : {};
  b.fresh = b.fresh && typeof b.fresh === 'object' ? b.fresh : {};
  return b;
}

/** does the child have this sticker */
export function has(id, who) { const p = profileOf(who); return !!(p && book(p).got[id]); }
/** how many different stickers the child has */
export function count(who) { const p = profileOf(who); return p ? Object.keys(book(p).got).length : 0; }
/**
 * give a sticker: the first time it goes into the book with a "New!" badge; returns { id, first } or null (no child)
 * @param {string} id  @param {any} [who] a hero or a profile (default: the child playing now)
 */
export function give(id, who) {
  const p = profileOf(who); if (!p || !id) return null;
  const b = book(p), had = b.got[id];
  if (had) had.n = (had.n || 1) + 1; else { b.got[id] = { t: Date.now(), n: 1 }; b.fresh[id] = 1; }
  if (G && G.save) G.save();
  return { id, first: !had };
}

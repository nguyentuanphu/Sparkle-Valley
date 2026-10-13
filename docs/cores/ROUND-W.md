# Round W: a tidier look, safer code (planned, 13 Oct AEDT)

Owner, 13 Oct AEDT (pop-up answer): after the story films and the faster checks, plan these three. Stay with plain
JavaScript (no TypeScript: no build step, no big rewrite while 8 cores work). Plan first; nothing is built before the
owner's "go". Each part gets before/after screenshots on phone, tablet and computer for the owner's OK, its own checks
(`node suite.mjs --changed`), and the full suite once before "yes, deploy".

## 1. UI tidy-up (Kid UI files; Release builds it)
| What | How | Check |
|---|---|---|
| Messages never pile up | one queue for toasts and notes: one at a time, never over a screen's title or the Shop's own words; a newer message replaces an older one of the same kind | new `toasts` |
| Fewer buttons on a phone for under-5s | the 4 or 5 they use (Play, Map, Bag, Mic, Jump) stay; the rest behind one "more" button; big kids keep all | `phone`, `contract` (re-recorded: owner asked) |
| One set of sizes and colours | corner rounding, shadows, gaps, card and chip sizes as named values at the top of `css/style.css`, used by every screen; the file split into one block per core | `phone`, `spill`, screenshots |
| Picture buttons for friends | in a room, each friend's 8 word buttons become a grid of big picture buttons ("Do something together") | `friendstab`, `phone` |
| Every icon drawn | any phone emoji a child can see gets a drawing in `js/art.js`; a check lists any left | `emoji` extended |
| Gentle motion | a soft pop when a window opens, cards lift when tapped; calm mode turns it off | `a11y` (calm mode: no motion) |

## 2. Type-check the files that hold saved data and messages
Add `// @ts-check` with JSDoc types to `js/net.js`, `js/trade.js`, `js/shop.js`, `js/parents.js` and the save code, listed in
`tests/tsconfig.json`, checked by the `types` check. No behaviour change.

## 3. Split `js/main.js` and `js/ui.js`
`main.js` (about 1,860 lines) and `ui.js` (about 1,200) are shared by every core and cause most merge conflicts. Move each
core's block into its own file (Friends panel, Pad tabs, Backpack, Shop, layout), keep `main.js` as wiring only. No visible
change: the full suite and the UI record (`contract`) must stay the same.

## Order
Films (`docs/cores/tasks/films-batches.md`) first, then 3 (split, so the later parts touch smaller files), then 2, then 1.

# UI redesign mockups and rules (16 October 2026 AEDT)

A copy of the claude.ai design canvas "Sparkle Valley UI Redesign" (https://claude.ai/artifact/TYdNnTxrKTP8JsNGC4FsbY, owner's account), kept here so every chat can read it (CLAUDE.md: designs go into the repo).

- `canvas/` holds the source of every board (`.dc.html`, readable HTML with inline styles) and `canvas.json` (layout). They render only inside the canvas, but their markup shows the exact sizes, colours and texts.
- `now/` holds the "Now" pictures: the r79 branch (`work/r79-20261016`) on a phone (390 x 844) and Grown-ups on a computer (1180 x 760), taken 16 Oct AEDT.

Status: **mockups for the owner to review.** The owner has not yet approved restyling existing screens. New screens (the sticker book, the daily adventure window) are built in this style; existing screens keep their look until the owner says yes.

## Boards

| Board | File | Now picture |
|---|---|---|
| Design system: colours, type, pieces | `canvas/Main.dc.html` | |
| Game screen (phone) | `canvas/HUD.dc.html` | `now/phone-hud.png` |
| Daily adventure (phone) | `canvas/Adventure.dc.html` | `now/phone-log.png` (Adventures tab) |
| Sticker book (phone) | `canvas/Stickers.dc.html` | `now/phone-album.png` |
| Bag (phone) | `canvas/Bag.dc.html` | `now/phone-bag.png` |
| Mirror (phone) | `canvas/Mirror.dc.html` | `now/phone-wardrobe.png` |
| Grown-ups (tablet / computer) | `canvas/Grownups.dc.html` | `now/computer-grownups.png` |
| Comparisons and rules | `canvas/Cmp*.dc.html` | |

## Design system

- Colours (from the handbook's G0): pink `#ff6fae`, purple `#8a5cf6`, leaf green `#43c463`, gold `#ffb020`, sky `#29b6f6`, paper `#fff6e4`, ink `#3a2a20`, butter `#ffe7a8`.
- Fonts already shipped: Baloo 2 (titles, 800) and Fredoka (everything else, 500-600).
- Pieces: Panel (paper, 3 px ink outline, 28 px corners, 6 px solid shadow), Main button (green, white text, 22 px, at least 64 px tall), Second button (paper), Round button (56 px, pink, Close and Back only), Tile (picture over a name of at most 2 lines), Tab, Chip, Counter.

## Rules for every screen (UI-1 to UI-10)

- **UI-1 One kit.** Screens are built only from the kit pieces. A new look goes into the kit first, never into one screen.
- **UI-2 Colours have one job.** Green = go / yes. Gold = earned or picked. Pink = close / back. Sky = hear again / info. Purple = new / magic.
- **UI-3 Four text sizes.** 40, 28, 22, 18 px. Nothing under 15 px on a children's screen; 15 px only for item names under pictures.
- **UI-4 Big targets.** Children's buttons at least 56 px, the main one 64 px, Jump 96 px; 8 px between them. Grown-ups' at least 44 px.
- **UI-5 One main action.** At most one green Main button per screen, at the bottom. Close is the pink round button, top right.
- **UI-6 Pictures first.** Every choice has a picture; words under it, at most 2 lines. An under-5 can use every screen without reading; tapping a label says it.
- **UI-7 Solid, outlined, sinking.** Never see-through over the world; 3 px ink outline; 4-6 px solid shadow; pressed = sinks.
- **UI-8 Feel and sound.** Open with a 180 ms bounce, close with a 120 ms shrink, a sound on every tap; calm mode turns movement off.
- **UI-9 Nine at a time.** At most 9 choices (3 x 3) on a phone screen; more go on tabs or pages, not a long scroll.
- **UI-10 Progress looks the same everywhere.** Done = green tick. Now = gold glow. Not yet = dashed outline. Missing = grey shape with "?".

The handbook's hard rules still hold: bilingual with `T()`, no phone emoji (drawings from `js/art.js`), recorded voices, nothing removed without the owner asking.

## Rules for each screen

**Game screen (HUD)**
- HUD-1 Three zones only: top = who I am and what I have; under it = today's goal; bottom = moving and menus.
- HUD-2 At most 8 buttons always showing on a phone; anything else goes in a "more" tray.
- HUD-3 The middle of the screen stays clear; messages go at the top or beside the thing, and leave after 4 seconds.
- HUD-4 The goal card always shows progress and a hear-again button; tapping it opens the adventure.
- HUD-5 Moving stick bottom-left, Jump (96 px) and Talk bottom-right, menus in one bar along the bottom.
- HUD-6 Something to pick up glows gold with a small bubble.
- Open question for the owner: the mockup leaves out the mini-map, clock, mic, Run and camera (suggestion: keep the mini-map, the rest in a "more" tray).

**Daily adventure (ADV)**
- ADV-1 One adventure on screen at a time; other lists behind one "More adventures" button.
- ADV-2 Always 3 steps, each with a picture or number and at most 6 words.
- ADV-3 A character introduces it in a speech bubble (2 lines at most, recorded voice, no child's name in the spoken line).
- ADV-4 The reward is shown before the child starts.
- ADV-5 Week stamps only fill up; a missed day never takes one away; no timers for under-5s.
- ADV-6 One green "Let's go!" at the bottom; it closes the window and points the way.

**Sticker book (STK)**
- STK-1 Pages of exactly 9 (3 x 3), one theme each; the tab colour is the theme colour.
- STK-2 Stickers they have: full colour plus name. Missing: grey shape, "?" and a hint (spoken on tap).
- STK-3 Never an empty page; the first page always has 2-3 stickers a new player gets in the first minutes.
- STK-4 Every page shows a count, a progress bar and its prize at the bottom.
- STK-5 A new sticker keeps a purple "New!" badge until tapped; the button shows how many are new.
- STK-6 Tapping a sticker says its name in both languages and plays its sound.

**Bag (BAG)**
- BAG-1 Items first under the title; 3 tiles per row on a phone, picture 60 px, name at most 2 lines and at least 15 px, count badge bottom-right.
- BAG-2 Tapping a tile only selects it (gold ring); nothing is eaten, given or sold by one tap.
- BAG-3 The action card: picture, name, one line on what it's for, at most 2 buttons.
- BAG-4 Kinds of things are tabs, never folding sections.
- BAG-5 No prices on children's tiles.
- BAG-6 Gift boxes look like wrapped gifts; their main button is always "Give it".

**Mirror (MIR)**
- MIR-1 The child's picture is the biggest thing (at least 40 % of the screen height).
- MIR-2 Only clothes the child owns, from their own set; empty categories hidden.
- MIR-3 Tap = wear (gold ring), tap again = take off; no Remove buttons (owner, r79).
- MIR-4 The picture changes at once, with a sparkle and a "swish".
- MIR-5 Category tabs: picture and word, at least 50 px tall, at most 4 showing.
- MIR-6 A bubble above the picture names what they're wearing.

**Grown-ups (GU)**
- GU-1 Full screen with a section menu (left on a tablet or computer, tabs on a phone); never one long scroll.
- GU-2 Children is always the first section.
- GU-3 Each setting is one row: label left, control right, at most one line of help.
- GU-4 Same kit pieces, calmer: fewer colours, text 15-17 px, buttons at least 44 px.
- GU-5 A change saves at once and shows a small "Saved" tick.
- GU-6 A new setting goes into an existing section; a new section needs the owner's yes.

## Status reconciliation, 20 October 2026 AEDT

The wider audit found no later recorded blanket approval for the existing-screen restyle. Selected r79 fixes and new Sticker/Adventure screens were delivered; that does not approve every mockup rule. Keep the fixed-window requirement and all existing HUD functions while preparing the proposal for review. The separate ten drawing games remain missing helper work. [Expanded drawing/design audit](../pending-audit-20261020/drawings-and-design.md). No redesign is implemented by this note.

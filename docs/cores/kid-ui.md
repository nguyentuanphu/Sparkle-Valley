# Kid UI core

**You make everything a child sees and taps outside the 3D world and the games:** the title and welcome, making a
character, “Who's playing?”, the Simple screen, the buttons on the screen (HUD and dock), the Pad (map, backpack,
album…), menus, settings and Grown-ups, pop-ups, icons and pictures, text size and calm mode.

## You own
- Screens and menus: `js/ui.js`, `js/hud.js`, `js/simple.js`, `js/songs.js` (the Songs page), `js/popups.js`, `js/packbar.js`, `js/install.js`, `js/credits.js`, `js/extras.js`, `js/report.js`, `js/chat.js`, `js/commands.js`, `js/listen.js`, `js/photos.js`
- The real-photo viewer and 360° window: `js/realworld.js` (except the landmark list `REAL`, which World keeps);
  the photos themselves: `photos/` and `photos/index.json` (filled by Studio's Real photos page or `tools/fetch-landmark-photos.mjs`)
- Pictures: `js/art.js`, `js/icons.js`, `js/symbols.js`, `js/avatar.js`
- Words: `js/i18n.js` (English and Vietnamese)
- Children's profiles and settings: `js/state.js`
- Looks: `css/style.css` (other cores keep their own blocks), `index.html`, `fonts/`, `icons/`
- The shared big card (round S, CSS block "the shared big card" in `css/style.css`): `.modal.kcard`, round ✕, picture tabs
  `.ktab`, coin prices `.kcoin` (a coin drawing and a number), 64 px and more for under-5s (`.kcard.little`); used by the
  clothes shop and the mystery box, rankings and collection book screens (Play's `js/shop.js`, `js/boxes.js`)
- Hands-on panels: `js/handpad.js` (tap, hold, pull and drag panels the stories use); no phone emoji: `js/emojiswap.js`

## Hard rules (§9.6)
A11Y-001 (Reduce motion turns on Calm), A11Y-002 (every spoken line also shown as words, ≥ 16 px), A11Y-003 (Simple
screen tabs open on their groups), A11Y-005 (age modes change sizes, hints and voice, not the screen), A11Y-006 (an
under-5 sees one group at a time, scrolling down, every stop a drawn picture), A11Y-007 (every tap answers at once);
UI-006 (checked on a phone, a tablet and a computer: tidy on all three), UI-001 (everything in English and Vietnamese), UI-002 (no phone emoji: drawn pictures), UI-003 (Close/Save/Next always
on screen at 320–390 px), UI-004 (touch targets ≥ 44 px, ≥ 64 px for under-5s); SAFE-001 (safe for ages 2–8);
SAVE-001…003 (saves never lost, versioned, unknown parts dropped safely); PRIV-011 (landmark photos only from our own
`photos/`, never fetched from Wikipedia or Wikimedia by the game; Google's map and street view only after a grown-up's
press and hold).

## Checks you run
`contract language phone a11y simple adventure firstplayer playhub iphone emoji names quiet welcomevoice ages`
A changed screen layout is re-recorded with `node run.mjs contract --update-contract`, only when the owner asked for it.

## Talks to
- **Play**: their lists show on your screens; you decide how, they decide what.
- **Voice & Audio**: every spoken line needs a recording.
- **Online**: the Friends tab's panel is drawn by `drawOnlinePanel` in `js/main.js` (Online's block); its look is yours.
- **Analytics & Infra**: the Grown-ups → Advanced → Analytics switch.

## Owner's decisions to keep
- Under-5s start on the Simple screen, big kids in the valley; each child switches either way (round I).
- The Simple screen: groups first, one page per group that scrolls down, no “next page” buttons (round P).
- The switch to it is “▦ Hình to / Big pictures” beside the player's card (round O).
- A new device has no ready-made characters: the child makes their own (round P).
- Festivals in one place (Settings → Lễ hội); Grown-ups shows only the Analytics switch, no explanation (round N).
- Privacy (owner, 9 Oct, round R): a short notice at the top of Grown-ups (`privacyHTML` in `js/extras.js`, its own
  block outside the groups): six plain lines on what the game keeps and sends. Grown-ups has no voice engine or voice
  key (voices are made in Studio); the chat key stays.
- Real photos (owner, 9 Oct): served from our own site only (`photos/index.json`, each photo `{ src: 'photos/<key>/n.jpg',
  file, caption, credit }`, the key is `photoKey(REAL[id][0])`); a place with none shows "the photos are on their way";
  the credit is shown as words, not a link. The real address (round H, map and street view inside the game) stays, behind
  the press-and-hold gate (`holdButton`, now in `js/popups.js`), with a line saying it opens Google.
- Character making with the clothes shop on (round S, owner plan 8 Oct: "only 2 default outfits, boy and girl; hair is chosen at
  creation or in Grown-ups, Children, Edit"): the Clothes row offers Girl and Boy; the colour, Hat and On-the-back rows are
  hidden (they come from the shop). Hair, skin and the rest stay. The new wardrobe has no hair rows (hair is set in Edit).
- The Bag button in the dock goes to the clothes shop when the shop switch is on (owner: "Backpack button teleports to the
  shop"); the backpack is the shop's last tab and still a Pad tab. Big kids at Medium or Hard get a gift chip under the
  name card (`chip.c-box`, recorded in `tests/ui-contract.json`) for mystery boxes, rankings and the collection book.
- New drawings in `js/art.js` (round S): shoes, necklace, three medals, wind chime, pot plant, carp streamer.

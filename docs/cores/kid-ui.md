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
- Grown-ups' features (round S, with Play): `js/parents.js` (its Grown-ups group, the dance break, bedtime and certificate screens; its CSS block at the end of `css/style.css`)

## Hard rules (§9.6)
A11Y-001 (Reduce motion turns on Calm), A11Y-002 (every spoken line also shown as words, ≥ 16 px), A11Y-003 (each Simple
screen tab is one road), A11Y-005 (age modes change sizes, hints and voice, not the screen), A11Y-006 (an
under-5 sees one road per tab, scrolling down, category after category, every stop a drawn picture), A11Y-007 (every tap answers at once);
UI-006 (checked on a phone, a tablet and a computer: tidy on all three), UI-001 (everything in English and Vietnamese), UI-002 (no phone emoji: drawn pictures), UI-003 (Close/Save/Next always
on screen at 320–390 px), UI-004 (touch targets ≥ 44 px, ≥ 64 px for under-5s); SAFE-001 (safe for ages 2–8);
SAVE-001…003 (saves never lost, versioned, unknown parts dropped safely); PRIV-011 (landmark photos only from our own
`photos/`, never fetched from Wikipedia or Wikimedia by the game; Google's map and street view only after a grown-up's
press and hold).

## Checks you run
`contract language phone a11y simple adventure firstplayer playhub iphone emoji names quiet welcomevoice ages parents`
A changed screen layout is re-recorded with `node run.mjs contract --update-contract`, only when the owner asked for it.

## Talks to
- **Play**: their lists show on your screens; you decide how, they decide what.
- **Voice & Audio**: every spoken line needs a recording.
- **Online**: the Friends tab's panel is drawn by `drawOnlinePanel` in `js/main.js` (Online's block); its look is yours.
- **Analytics & Infra**: the Grown-ups → Advanced → Analytics switch.

## Owner's decisions to keep
- Under-5s start on the Simple screen, big kids in the valley; each child switches either way (round I).
- The Simple screen (Round U, owner, 11 Oct: "separate sections for games, stories and places"; replaces bug #30's one long
  road per tab, 10 Oct): each bottom tab (Trò chơi, Truyện, Nơi chốn) first shows its categories as big picture cards (games
  show their stars won); a card opens that category's own short road (its drawn heading stop, then its stops), and the big
  ⬅ Back in the top bar goes back to the cards. Khám phá stays as the one search and jump button; its cards open that
  category. In places, China and India always come last.
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
- Grown-ups' features (round S, owner plan 8 Oct; each a Studio switch in the 'kids' group):
  - one new Grown-ups group, "Family: missions, week, bedtime" (`data-sec="family"`), before the note for grown-ups,
    drawn by `G.parents.grownupsHTML` (ui.js only calls it);
  - family missions: written there or in Studio → Family → Family missions (content pack `missions`); a new one is
    shown once in a speech box (the family's words shown, a recorded line spoken); Pad → Adventures lists them first
    with a 64 px ✓ that a grown-up holds (the press-and-hold gate); +10 coins and a sticker;
  - weekly note: plain sentences per child from the play report's days; certificate card: a 1200 × 850 picture with
    the stickers in the valley's drawings, "Save picture" through `js/photos.js` (no print window);
  - dance break after 20 minutes of free play (six moves, 7 s each, family "kids" song first, 64 px Skip; still in
    Calm mode); bedtime in AEST (10 min warning, the valley dims over 3 min, a lullaby on the Songs page with the
    family's own lullaby first, a goodnight card after 6 min that a grown-up holds for 10 more minutes); a birthday
    (month and day, `profile.birthday`, on this device; also in its backup file) with a cake keepsake, coins and a sticker.
- Backpack (round S): "Village festival prizes" after the kite: tap a prize to carry it or put it away.
- Films, second batch (owner, 10 Oct: "go as suggested"): the tales Bánh Chưng Bánh Giầy and Cây khế (in Cây khế the greedy brother's bag of gold falls into the sea, never the brother); the guides Bắn bi and Lật hình. A guide's real game plays by itself inside the guide (`demo` in `GUIDES`, run by `demoKit` in `js/howto.js`), with the game's own code and a quiet copy of the game's api, so the Play core's game files are not changed.
- Films on tall phone screens (owner, 10 Oct: "fix the screen issue"): the film camera opens up on a narrow screen so it shows as much across as a 16:9 screen (at most 75° top to bottom), so nothing at the sides is cut off.
- Kid UI chat, 11 Oct (owner, AEDT): "Go, also bring the films": the films branch is merged into `core/kid-ui` with the robot's fixes.

## Progress notes
- **11 Oct 2026, 11:40 am AEDT, `core/kid-ui`:** the robot's Kid UI fixes merged: #27 (`bugfix/kid-ui-27`, PR #40), #28 (#42), #31 (#44), #41 (#46), #30 (#48), #32 (#53), plus the films branch.
  - Clashes settled:
    - #31's Change player button in Grown-ups has the id `gChange`, because `gWho` is already the "Who's here" box.
    - The Pad map keeps #28's city chips; the old Change player quick button is gone.
    - `voices/manifest.json` was rebuilt with `tools/make-voice-pack.mjs` (0 new lines).
  - Fixes to the robot's work found by the full suite:
    - `hubmap` (test): #28 shows one city at a time, so the check now taps every city chip in order. It keeps its north-to-south test and adds one: Hạ Long must be on Hà Nội's page, Huế on Đà Nẵng's. Not weakened.
    - `arch`: #41 made `js/credits.js` import `js/ui.js`, which imports it back. `ui.js` now passes `hideCaption` to `openCredits(onClose)`. Closing the credits still hides a caption that was showing (checked in the browser: shown before, hidden after).
    - `rules`: #30 changed A11Y-003 and A11Y-006 in `docs/ARCHITECTURE.md`; `js/content/rules.js` is regenerated with `tools/rules-from-doc.mjs`.
    - `types`: #32's `dropOldFestival` in `js/state.js` returns a count, like `dropOldVoice`; it behaves the same.
  - Full suite, run one check at a time:
    - Most of it ran on commit `f7854eac`. The four fixes above came during the run (`0c010ede`, `3ffdc81e`, `f4d8e92b`, `f2204a90`).
    - After them, these checks were run again on `f2204a90` and passed: hubmap, arch, rules, types, boot, phone, festcal, currency, grownupsui and saves.
    - Result: 86 checks, 80 pass, 6 skipped (online, no local server in a helper chat), 0 fail.
  - Every check:
    - Passed: boot, spill, language, two-players, facetoface, games, features, camera, contract, roads, flat, roadshape, phone, solid, voice, voicepack, welcomevoice, studio, ground, resume, migrate, village, validate, tales, emoji, hubmap, festcal, films, halves, preload, story, chapter2, yard, kidplay, shop, boxes, hoilang, surprises, parents (it passes here, though the board says it fails on `main`), currency, camcalm, vehicles, dialogtap, viwords, noemoji, arch, mapcoords, regions, walkaway, ages, simple, adventure, gamelevel, quiet, songs, realphotos, firstplayer, grownupsui, playhub, a11y, unit, events, postcards, familyphotos, myhouse, names, rules, coop, report, iphone, tienlen, chests, types, perf, saves, photo, netmsg, offline, nostudio, onlineoff.
    - Skipped: multiplayer, netgames, together, meet, cloud, knock.
  - Screenshots looked at, on phone 390 × 844, tablet 820 × 1180 and computer 1180 × 760: #30 the Simple screen road, #27 a caption and a pop-up at once (they no longer overlap), #28 the Pad map with city chips and arrows (also scrolled to the chips on tablet and computer), #31 Change player in Grown-ups, #41 the credits. All tidy.
  - Still open: the Pad map's names overlap on the east side (the board request, next on the list).
  - No new spoken lines.

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

- Round T4b, finding your way (owner, 11 Oct AEDT: "Go"; brief `docs/cores/tasks/kid-ui-t4b.md` on `round-t`):
  - a picture signpost at every junction of two asphalt or dirt roads (`js/signposts.js`): one board per road leaving it, naming where that road leads (the town it passes or ends at, or the town the next side road goes to), the child's language first;
  - name tags over places within 40 m (`js/nametags.js`): at most 4, the nearest first, never covering each other, none in calm mode or films;
  - the Pad map drawn from the map data (land by height, rivers, ponds, roads in their region colours), with clouds over places not yet visited that lift with one puff;
  - the Memory Villages and Hội An join the place lists by their ids (`withSitePlaces` in `js/content/activities.js`).
- r60 (11 Oct AEDT): `main` already gives the speech box its own `dlg-rise` animation, so the item 3 commit's `rise-dialog` was dropped when merging; the `mapnames` check only tests that the box starts in the middle.

- 12 Oct AEDT, owner's go ("all of the above", then "Go"): the friends row on phones (buttons under the name and status), the Kid UI board tidied (live in r63), and a 6-page 3D film of Sự tích Hồ Gươm where the child pulls up the net and hands the sword back to the Golden Turtle; Chapter 2 picks it up by itself (`FILMS.hoguom`).

- 12 Oct AEDT, noon: owner: this chat deploys the next round (r65) as Release while the Release chat is out of usage; wait until one more branch is ready for Release (the owner says when), then merge every ready branch and run the full suite before deploying.

- 12 Oct AEDT, evening: owner picked everything for tester reports (brief `docs/cores/tasks/tester-reports.md`): agreement screen, automatic reports with screenshot and 30-second replay, the ladybird bug icon (tap, long press, offline count, fixed tick, already-reported hint) instead of shake to report, nightly auto play, automatic retest, tester mark with the version, daily summary, and all eight rewards, with the Bug Hunter badge also worn on the explorer's shirt. Tester screens never name Studio, GitHub or Netlify. On tester devices that accepted, reports keep children's names, ages and progress with no grown-up gate (an exception to the PRIV rules and HANDOFF rule 11 for tester reports only). Not built yet: plan and go first.

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
- **11 Oct 2026, 2:45 pm AEDT, item 3 (owner's go, 11 Oct AEDT: "Go"):** built and committed as `fecb8858` on the branch `claude/affectionate-wozniak-2jek7i`. It is not on `core/kid-ui` yet, which stays at the tested `4a510c81`.
  - What it does:
    - Speech box: its own `@keyframes rise-dialog` keeps `translateX(-50%)`, so it slides up from the middle (`css/style.css`).
    - Pad map names: each name goes under, above, right or left of its picture, whichever covers no other name or picture (`js/ui.js`; the names are kept on `canvas.bigmap.labels` for the check).
    - Hội An is a place of its own. It joins by its id in `js/content/map.js` through `withSitePlaces` in `js/content/activities.js` (no map file changed): in the Pad map's Vietnam list between Đà Nẵng and Hồ Chí Minh City, and on the Simple screen's Places road. Its landmark is listed under it, no longer under Đà Nẵng. `vungtau`, `harbour`, `memory_e` and `memory_w` get one line each in `SITE_PLACES` once the World core builds them.
    - New check `mapnames` (phone, tablet and computer): no names overlap or go off the map, Hội An is in place, and the speech box starts in the middle. It passes. With the names all under their pictures it fails (festival stage / Đà Nẵng, market / Hội An), so it catches the problem. `hubmap` passes too.
    - "Hội An" recorded (4 voice files).
  - Not done yet:
    - The full suite on `fecb8858`: stopped by the owner after 5 checks (boot, spill, language, two-players, facetoface passed; `games` was cut off by the stop, not a failure).
    - Phone, tablet and computer screenshots of the map names and Hội An.
    - Merging `fecb8858` into `core/kid-ui`, pushing it, and ticking the three Kid UI requests on the board.
- **11 Oct 2026, 9:55 pm AEDT, Round T4b on `core/kid-ui` (last code commit `18c0850a`):** finding your way.
  - What changed:
    - picture signposts at junctions (new `js/signposts.js`): 16 posts, 40 boards; all posts one mesh, all boards one mesh with one shared 1024 px picture; boards start above a child's head, so only the post is solid;
    - name tags (new `js/nametags.js`): page elements over the 3D view, no draws; kept clear of the HUD's top band and right-hand buttons;
    - the drawn Pad map (`valleyPicture` in `js/ui.js`) with clouds over places not yet visited (`profile.mapClouds` remembers which have lifted);
    - the Memory Villages in the place lists (`js/content/activities.js`);
    - `js/main.js`: one line each to build the signposts and name tags, and one to update the tags per view;
    - `sw.js` FILES and `index.html` modulepreload: the two new files;
    - CSS: name tags and the cloud puff.
    - Brought in: `main` r60 and the item 3 commit (Pad map names apart, Hội An). Main's own `dlg-rise` kept for the speech box.
  - Full suite, one check at a time:
    - First run: 99 of 101 (7 online skipped). Two failed:
      - `plots`: signposts on three garden plots, then boards over two. Fixed: posts keep off plots and solid things; boards start at 1.7 m.
      - `startup`: 1093 KB > 1035 and 1559 ms > 1130 to the title. Also fails on `main` (r60) in the same run: 1088 KB and 2100 ms. Not from this round (the two new files add about 5 KB); on the board for Release and Analytics & Infra.
    - Run again after the fixes and passed: plots, signs, solid, validate, ground, walkaway, nametags, padmap, phone, perf, preload, arch, mapcoords, types.
  - Every check:
    - Passed: boot, spill, language, two-players, facetoface, games, features, camera, contract, roads, flat, roadshape, phone, solid, voice, voicepack, voicecover, voicearea, welcomevoice, studio, ground, resume, migrate, village, validate, tales, emoji, hubmap, signs, nametags, padmap, mapnames, festcal, festivals, films, halves, preload, story, chapter2, chapter3, yard, kidplay, shop, boxes, hoilang, surprises, parents, currency, camcalm, vehicles, dialogtap, viwords, noemoji, arch, mapcoords, regions, bridges, boats, plots, roadtone, walkaway, ages, simple, adventure, gamelevel, quiet, rain, songs, realphotos, firstplayer, grownupsui, playhub, a11y, unit, events, postcards, familyphotos, myhouse, names, rules, coop, report, iphone, tienlen, chests, types, perf, saves, photo, netmsg, offline, nostudio, onlineoff.
    - Skipped (online, no local server): multiplayer, netgames, together, meet, cloud, knock, mapver.
    - Failed: startup (also on `main`).
  - Draws against `main`, measured side by side with the `perf` check: home 1091 to 1097 against 1089; Lotus Village 694 to 700 against 693.
  - Screenshots looked at, on phone 390 × 844, tablet 820 × 1180 and computer 1180 × 760 (the Pad map also at 1366 × 768): a signpost close up, name tags at the busiest spot (Three Regions Market, Hội An, the east Memory Village), and the drawn Pad map. All tidy.
  - No new spoken lines.
  - Not done: the friends-row Join button on phones (Online's request); T4's drawing of every landmark on the map (only places).
  - Later, 11 Oct AEDT: main moved to r61 (T1b tidy streets), merged in without clashes (`b4b4ca74`). Run again and passed: signs, plots, solid, nametags, padmap, mapnames, hubmap, validate, ground, stalls (new in r61), phone, preload, arch, mapcoords, types, emoji, noemoji.
- **12 Oct 2026, 12:00 pm AEDT, `core/kid-ui` (last commit: the merge of `main` r64, `f1c4baf6`):** the friends row, the board tidy-up and the Hồ Gươm film (owner's go, 12 Oct AEDT).
  - What changed:
    - friends row on phones (`css/style.css`): under 560 px, Join, Invite and remove wrap under the name and status, each 44 px tall; the face sits beside the name on every screen. The `phone` check now draws the row in Vietnamese with a long status on computer, phone and tablet: no button covers the status, every button is 44 px or more;
    - the board's Kid UI section tidied (live in r63, duplicates gone, finished items ticked);
    - a 6-page 3D film of Sự tích Hồ Gươm (`FILMS.hoguom` in `js/content/films.js`; new props `net`, `sword`, `turtle`, `turtleTower` in `js/film.js`). Chapter 2 picks it up by itself. Change from the plan: the net is pulled up by itself on page 1 (the `films` check allows no tap on page 1); the child taps on page 2 (help Lê Lợi reach the handle) and page 5 (give the sword back to the Golden Turtle);
    - two new spoken lines (the two taps, English and Vietnamese), recorded with Azure.
    - Brought in: `main` r64. Only the generated `voices/manifest.json` and `voices/areas.json` clashed: taken from r64 and made again with the voice tool (0 new files).
  - Full suite before the merge, one check at a time: 102 of 104 (7 online skipped).
    - Passed: every check but the two below; the run included phone, films, chapter2, kidplay, voicepack, voicecover, voicearea and unit.
    - Skipped (online, no local server): multiplayer, netgames, together, meet, cloud, knock, mapver.
    - Failed:
      - `perf`: 832k triangles in Lotus Village (limit 800k), once. Run again twice side by side with `main` r64: passed both times on the branch (787k, 785k), `main` 785k and 789k. Nothing in this work adds to the valley.
      - `startup`: also fails on `main` r64, measured side by side twice: first title 1807 and 1799 ms on the branch, 1719 and 1695 ms on `main` (limit about 1130 ms); first download 980 KB against 979 KB. Not from this work; still on the board for Release and Analytics & Infra.
  - After merging r64, run again and passed: boot, phone, iphone, games, features, roads, signs, nametags, padmap, mapnames, hubmap, films, chapter2, voicepack, voicecover, voicearea, unit, rules, arch, types, tienlen, netmsg, offline, onlineoff, a11y, playhub, grownupsui, kidplay, preload, validate, solid, plots, walkaway; netgames and together skipped (online).
  - Screenshots looked at, on phone 390 × 844, tablet 820 × 1180 and computer 1180 × 760: the friends row (Vietnamese, long status) on all three, and every page of the Hồ Gươm film. All tidy.

# Play core

**You make the things to do:** every mini-game, the fairy tales, festivals, the song list, levels (Easy, Medium,
Hard), stars, quests, rewards, co-op quests and the games played together online.

## You own
- Mini-games: `js/games/*` (`frame.js` is the shared game frame: top bar, Easy·Medium·Hard, win screen), `js/learn.js`, `js/fun.js`, `js/vnfun.js`, `js/words.js`, `js/words2.js`
- The one activity list: `js/content/activities.js` (areas, ages, how hard each game is)
- Stories: `js/tales.js`, `js/talesdata.js`, `js/story.js`, `js/cartoon.js`, `js/howto.js`
- Festivals: `js/festivals.js`; folk shows' programme: `js/folkshow.js` (with World)
- Songs list and which song plays where: `js/content/songs.js` (the tunes themselves are Voice & Audio's)
- Progress and rewards: `js/data.js` (items, quests, stickers), `js/money.js`, `js/passport.js`, `js/placebook.js`, `js/familycards.js`, `js/secrets.js`, `js/coop.js`, `js/twinchests.js`, `js/claims.js`, `js/trade.js`
- Games with friends: `js/netgames.js` (the game rules; the connection is Online's)
- The Games hub lists in `js/ui.js` (`HUB`, `openGamesHub` contents) together with Kid UI
- Little ones' play (round R): `js/kidplay.js` (the companion growing, the hat goal, the daily gift; Studio group "For little ones")
- Money games (round S, owner plan 8 Oct, item 7): `js/games/money.js` (the ten games), `js/games/moneylogic.js` (their sums, no screen: unit-tested in `tests/unit/money.test.mjs`); the coins, notes and lì xì envelope are drawn in `js/art.js` (keys `aud5` … `aud10000`, `vnd1000` … `vnd500000`, `lixi`)
- Shop and rewards (round S): `js/shop.js` and `js/content/shop.js` (the clothes shop, prices, what is owned), `js/boxes.js` and `js/content/boxes.js` (mystery boxes, collectibles, family rankings; Studio group "Shop and rewards")
- Hội làng (round S): `js/hoilang.js`, times and prizes in `js/content/hoilang.js` (with World for where the poles and the parade go)
- Surprises (round S): `js/surprises.js`, the list and the limit in `js/content/surprises.js`
- Grown-ups' features (round S, with Kid UI): `js/parents.js`, pure parts in `js/content/parents.js`

## Hard rules (§9.6)
ACT-001 (under-5 mode never punishes: no losing, no timers, no reading), ACT-002 (every game: both languages, a how-to
film, Next/Stop at the end, tap outside to leave), ACT-003 (nothing a game made stays alive after it ends), A11Y-004
(every game says what to do when it opens, for under-5s), A11Y-006 (under-5s see only games made for them), UI-005
(one activity list: every game in exactly one area), STR-001.

## Checks you run
`games gamelevel tales songs playhub coop tienlen netgames together chests postcards myhouse adventure shop boxes hoilang surprises parents currency`, and `unit` (`tests/unit/roundS.test.mjs`)

## Talks to
- **Kid UI**: the Simple screen and the Games hub show your lists; a new game needs a drawn icon (`js/art.js`) and a place in `activities.js`.
- **Voice & Audio**: every new line a child hears needs a recording: list them on the board for the voice pack.
- **Online**: a new together-game needs its messages added to `js/netmsg.js`.
- **World**: a game's host or a festival needs a spot in the valley.

## Owner's decisions to keep
- Stars only (no difficulty dots); Easy · Medium · Hard inside each game, remembered per game and child (round M).
- Songs live with the games: the pink button is “Vui chơi / Play” with a Songs tab (round O).
- Festival music during festivals; Vietnamese tunes in the Vietnam areas; family recordings first (round N).
- Money games (round S): in the child's home currency, the Grown-ups money setting (`settings.currency`, AUD or VND);
  game coins only, never real money. AUD uses the real coins (5c to $2) and notes ($5 to $100); VND uses notes only
  (1.000 to 500.000), so for VND "Coin or Note?" becomes "Tiền lẻ hay tiền chẵn?" (under 10.000 is small change).
  Under-5s get the two easiest steps of each game (counting one kind of coin, pictures, no budget) and can never
  lose: too much is gently refused and the right one wiggles after two misses. They live in their own Simple-screen
  area "Money and shopping" (`money`), shown in the Play hub's Learning tab.

## Shop and rewards (round S, owner plan 8 Oct: Round R Part 2 items 6 and 10)
- **Clothes shop** (`js/shop.js`, catalogue and rules `js/content/shop.js`, Studio switch `shop`): a striped stall by Chợ Ba Miền,
  placed with `openSpot` on flat dry ground off the roads, facing the market street. 50 things in six kinds (hats and nón,
  necklaces, tops, shorts/trousers/skirts, shoes and sandals, on the back), each tagged for girls, boys or both: about twice
  the old choice for each. Prices: `DAY_COINS` = 70 coins is about a day of play; small things 30, nice things 70,
  special things 120 (`priceOf`). Game coins only (`farm.coins`). Bought things go in `profile.owned.clothes`; what a child
  already wore when the shop came counts as owned (`adoptWorn`), and so do hats won elsewhere (`profile.owned.hats`).
- **Bag button** (owner, 10 Oct, Bug #29, replaces "Backpack button teleports to the shop"): the Bag opens the backpack. Inside it is one small shop button (`js/ui.js`, `drawBag`) that opens the clothes shop right there, no travel; the stall in the valley stays. The shop has no backpack tab and the wardrobe has no shop button on its rows.
- **Wardrobe:** `G.openWardrobe` shows a row per kind with only what the child owns (plus passport hats), one tap to wear;
  a kind with nothing yet just shows the empty face. The Done button has its own strip at the top; rows wrap, so nothing overlaps or is cut off.
- **Mystery boxes** (`js/boxes.js`, rules `js/content/boxes.js`, switch `mysteryBox`): only for big kids (5 to 8) at Medium or
  Hard. One free box a day (AEST day, as `js/kidplay.js`) and one more when a quest or story step is finished (at most one a
  day, kept up to 3), hooked into `checkQuests` in `js/main.js`. Boxes are never sold. A second one of anything turns into
  stars (common 1, rare 2, magic 3) kept in `profile.boxes.stars`.
- **Collectibles** (switch `collectibles`): 25 fairies, dragons, stickers and decorations in `profile.collect`, shown in the
  collection book (shadows for what is still to find). Decorations are only in the book for now (not yet placed in homes).
- **Rankings** (switch `rankings`): the family on this device (every profile) on four boards: stars and quests, collections,
  kindness, learning (`scores` in `js/content/boxes.js`). Everyone is shown with a medal or a star; nobody is "last".
- **TODO (online friends):** friends' numbers in the rankings are not built. Plan: when two friends are in a room, each sends
  its four board numbers (no names beyond the first name already shared, no photos) in a new `js/netmsg.js` message; the
  rankings card adds them under a "Friends" heading, kept only for the session. Needs the Online core.
- **Lines to record** (voice pack): `SHOP_LINES` in `js/shop.js`, `BOX_LINES` in `js/boxes.js`, the name of every shop thing
  (`CLOTHES` en/vi), every collectible (`COLLECTIBLES`), the six kinds (`SLOTS`), the four kinds of collectible (`KINDS`) and
  the four boards (`BOARDS`). None has a child's name.
- Every host game is free any time; the 3-coin "start it now" on the games board is gone (round S, owner plan 8 Oct).
- Hội làng (round S): 3 events a day in AEST, 09:00, 16:00 and 19:00 (17:30 instead of 19:00 when an under-5 plays), each
  running 15 minutes so late children still join; after it ends a child near the village is told the next time. A
  parade of 4 villagers walks beside the village street, a crowd of 5 cheers round the singer's stage (at the village
  nearest a child only). Joining plays the village's game of the moment; the prize (drum, lion head, fan, carp lantern,
  tò he, medal, in order) works like the kite: kept, carried beside the child (Backpack switch) and a house keepsake
  (`hl_<id>`). Under-5s get it for joining in, big kids for a win; once per event. Studio switch `hoilang`.
- Surprises (round S): at most 3 a session (first after 150 s of free play, then 300 s apart), chosen only when they can
  be enjoyed (stars at night, the rainbow after a shower, the lotus near Lotus Village's pond, one map piece a day, the
  chest after 3 pieces) and only when the child is free; one at a time; if the child walks 35 m away it comes back to
  them (never missed). Each gives a sticker or a keepsake (`sp_*` in the house). Calm mode: one slow shooting star, no
  bobbing or flutter. Studio switch `surprises`.

## The lantern story, Chapter 2: Hà Nội (owner's go, 10 Oct AEST; brief `tasks/play-chapter2.md`)
- **Files:** the steps in `js/content/chapters.js` (`ch2`); their words, the lines said while doing them, `COUNT` and the
  festival film's words in `js/content/chapter2text.js` (loaded with the places, so the start-up download stays under
  PERF-001); the runner `js/lanterns.js` (each chapter's landmark, lantern spot, rope and lights in
  `places`); Hà Nội's pieces in `js/content/chapter2hanoi.js`; the star lantern, stone turtle, lion head, mooncakes and
  bridge in `js/content/chapter2props.js`; the festival film in `js/content/chapter2films.js` (loaded only when the
  lantern is hung); the companion's new trick in `js/companion.js` (`lead`). Chapter 2's code and words load when a child playing has found
  chapter 1's lantern. Studio switch `story_ch2`. Check `chapter2`.
- **Steps:** follow 3 lantern lights to Hà Nội; say hello to Cô Tam at Văn Miếu (big kids); Tèo's challenge (big kids
  Ô ăn quan, with Play, How to play (the guide film) and Later; under-5s Oẳn tù tì, which they always win); help Bà Lan
  at the bún chả stall by hand: hold to fan the grill, tap three bowls (big kids); Cô Tam's lesson: count the stone
  turtles (3 for under-5s; 5 for big kids, then "how many?" with a gentle second try, and the word "học"); Bà Năm tells
  Sự tích Hồ Gươm; find the lantern by the lake (big kids read the clue "where the old turtle rests" and look at three
  spots; an under-5's companion flies over the right one); pull the rope to hang it on Cầu Thê Húc. Under-5s: 6 steps,
  big kids: 8.
- **Festival night:** the film (the bridge lights up red over Hồ Gươm; the Trung Thu parade with star lanterns, the lion
  dance and mooncakes, and the child taps to light the star lanterns), then the bridge stays lit and six children with
  star lanterns walk round the lake for about 80 seconds. Keepsake: the star lantern (`lantern_ch2`). The companion learns
  its trick, lighting the way (`profile.lanterns.tricks`). Big kids' bonus secret: a golden turtle comes up in the lake
  once, with a turtle sticker.

## Owner's decisions (11 Oct AEST)
- Item 1 of the owner's work list (11 Oct): the robot's #29 fix (`bugfix/play-29`, PR #43) is merged into `core/play`, checked
  on phone, tablet and computer screenshots; the wardrobe's chips wrap beside their row's picture and an under-5's are 64 px on
  short screens, so all six rows show on a phone.
- #32 (owner's correction, 11 Oct): nothing in the game sends a child to a festival; Play's part is `festivals.visit`, which now
  only tells (no travel), checked by `festivals`. The rest of #32 (the calendar box in settings, removing `settings.festival`)
  is Kid UI's (the robot's fix).
- Festival places for Round T (owner's "go", 11 Oct AEST; Release → Play request T1/T3): **wait for r60** on `main` (and
  `docs/cores/LOG-r60.md`) before starting; on 11 Oct `main` was r59 (934de81), so nothing was built. Then: merge `main` into
  `core/play`; `js/festivals.js` `PLACES()` also finds `hoian` by its id from `js/content/map.js` (a site, so a ring round its
  middle, no map files changed); `js/content/festcal.js` `where`: Hội An (`hoian`) gets Tết, Rằm tháng Giêng and Trung Thu,
  Vũng Tàu (`vungtau`, already a city) gets Tết, Quốc khánh and Trung Thu. Checks `festivals festcal`, then the full suite.

## Owner's decisions (Chapter 2, 10 Oct AEST; the owner said "go" to the plan and its suggestions)
- Tèo, Cô Tam and Bà Năm come to Hà Nội for Trung Thu: they stand there only while a child is in Chapter 2 (spots found
  with free ground, not new map positions); their usual places stay as they are.
- Bà Năm's Hà Nội tale is Sự tích Hồ Gươm (already in the game).
- Under-5s play Oẳn tù tì in Tèo's challenge (Ô ăn quan is a 5+ game).
- Chapter 2's festival night (film and parade) is the story's ending and plays on any day the lantern is hung; the real
  Trung Thu festival in the valley still follows the calendar (owner, 10 Oct AEST).
- Chapter 2 (`story_ch2`) is off by default; an admin switches it on or schedules it in Studio (owner, 10 Oct AEST).
- Festivals (owner, 10 Oct AEST): every festival is on, but runs only from 3 weeks before its day or when an admin
  switches it on or schedules it; children can never start one; a festival decorates the whole town or village, not a few
  scattered things. Brief: `docs/cores/tasks/play-festivals.md` (its own Play chat).
- Next in this chat (owner, 10 Oct AEST): the festivals brief (`tasks/play-festivals.md`) and story Chapter 3 (Sydney),
  both in one round. Chapter 3: Bà Năm tells The Magic Pudding; under-5s play tug of war with Jack and Ruby (cricket is
  5+); Chi's look chosen by Play (changeable in Studio); switch `story_ch3` off until an admin switches it on.
- (earlier) This chat works on story Chapter 2 only; Kid UI, Voice & Audio and the World layout are run in their own chats (owner, 10 Oct AEST): their parts go on the board, never built here.

## Festivals on a schedule, whole places decorated (owner, 10 Oct AEST; brief `tasks/play-festivals.md`)
- **In season only:** a festival shows from 3 weeks before its day (a quiet day: a few days before), or when an admin
  schedules it in Studio's Releases page (`fest_<id>` with a start date and a number of days: on from that day). The
  grown-ups' press-and-hold setting (by date, off, one festival) stays. Studio's Preview link (`?festival=<id>`) still
  shows any festival once, for grown-ups.
- **Children never start one, and nothing sends them to one** (owner, 11 Oct, #32): a tap on the calendar only tells about
  the festival (days to go, decorations going up, or on today) and never moves the child (`tell` in `js/festdecor.js`).
  Only Studio's Preview link (an admin) takes a child to a festival. The calendar's words say so (`js/ui.js`, one line,
  noted on the board).
- **Whole places:** pieces along every street, lane and footpath of each place in `where` (beside the road, off its verge,
  G5), beside a city's main street and round its square, and on the footpaths of the streets Two Homes Street, Aussie
  Corner and the market draw themselves; spread over the whole place at every stage (every 4th spot in week 1 ... all on
  the day, at most 48 a place), bunting along the streets from week 2. A place without streets keeps its ring.
- **Files:** `js/festivals.js` (rules, calendar), `js/festdecor.js` (street spots, admin schedule, the calendar's words;
  loaded once a child plays, so the start-up download stays within PERF-001). Checks `festivals` (new), `festcal` (now
  has an admin schedule Halloween for its trick-or-treat test, since a child's tap no longer starts it).

## The lantern story, Chapter 3: Sydney (owner's go, 10 Oct AEST)
- **Files:** steps and words in `js/content/chapter3text.js` (it adds `ch3` to `CHAPTERS` when it loads, so the start-up
  download stays small; chapter 2 does the same in `chapter2text.js`); places in
  `js/content/chapter3sydney.js`; shapes (Opera House sails, Harbour Bridge, ferry, gum tree, koala) in
  `js/content/chapter3props.js`; festival film in `js/content/chapter3films.js`. `js/lanterns.js` loads every later chapter
  the same way (`LATER`), once a child playing has found the chapter before's lantern. Studio switch `story_ch3` (off).
  Check `chapter3`.
- **Steps:** follow 3 lantern lights to Sydney; meet Chi (big kids); Chi's Aussie words (an under-5 hears two words and
  taps the picture; a big kid reads four and picks what each means; a wrong answer just hides); Captain Molly's ferry
  game (big kids); Jack and Ruby's challenge (cricket for big kids, tug of war for under-5s; cheeky at first, friends
  after); Bà Năm tells The Magic Pudding; find the lantern by the harbour (big kids read "where the ferries wait" and look
  at three spots; an under-5's companion flies high, then down over the right one); pull the rope to hang it at the Opera
  House. Under-5s: 6 steps, big kids: 8.
- **Festival night:** the film (the Opera House's sails light up in colours at dusk; fireworks over the Harbour Bridge,
  started by the child's tap), then the sails stay lit and fireworks burst over the harbour for a minute. Keepsake: the
  Opera House night-light (`lantern_ch3`). Trick learned: flying higher. Big kids' secret: a koala in a gum tree, with a
  koala sticker.
- **Chi** (new, owner: "you choose"): about 8, ponytail, yellow top; half Australian, half Vietnamese; says each word in
  both languages. Her look can be changed later in Studio.

## Progress notes (festivals and Chapter 3)
- **Full suite, 11 Oct 00:15 AEST, commit 08e238a** (`core/play`, `main` 3399198 merged in): 82 of 83 passed.
  Passed: boot, spill, language, two-players, facetoface, games, features, camera, contract, roads, flat, roadshape, phone,
  solid, voice, voicepack, welcomevoice, studio, ground, resume, village, validate, tales, emoji, hubmap, festcal,
  festivals, films, halves, preload, story, chapter2, chapter3, yard, kidplay, shop, boxes, hoilang, surprises, currency,
  camcalm, vehicles, dialogtap, viwords, noemoji, arch, walkaway, ages, simple, adventure, gamelevel, quiet, songs,
  realphotos, firstplayer, grownupsui, playhub, a11y, unit, events, postcards, familyphotos, myhouse, names, rules, coop,
  report, iphone, tienlen, chests, types, perf, saves, photo, netmsg, onlineoff. Skipped (no local
  PeerJS or MQTT server in a helper chat; they report as passed): multiplayer, meet, netgames, together, cloud, knock.
  Failed: `parents` ("bedtime [true,true,true,false]"): it fails the same way on `main` 3399198; the check plays bedtime
  at the fixed date 2026-10-10 and the run was after midnight AEST on 11 Oct, so it is not from this branch (on the board).
- `perf`: triangles 793k to 805k in three runs (limit 824k); startMB 3.344 or 3.374 for the same code (limit 3.346);
  `main` measures 3.373 twice, so the start-up budget is over on `main` too (on the board). Halloween's decorations go up
  from today (10 Oct is three weeks before), on `main` and here alike.
- Screenshots looked at: the `phone` check's phone, tablet and computer views (passed); the chapter 3 word panel (pictures
  for an under-5, words for a big kid) and the festival film pages during the checks.
- **Full suite, 11 Oct 07:22 AEST, commit 9483edf** (`core/play` with `bugfix/play-29` and `main` 45feb75+ merged in): 86 of 88
  passed. Failed once and passed on a re-run straight after (11 Oct 08:30 AEST): `phone` (the speech box's slide-in puts
  "Chơi!" / "Để sau" off screen for 0.3 s; already on the board for Kid UI) and `hoilang` ("the child was not told the festival
  is on": the surprise-gift and passport toasts came at the same moment). Skipped (no local PeerJS or MQTT server; they report as
  passed): multiplayer, meet, netgames, together, cloud, knock. `parents` passed. Play's own checks with `festivals`, `festcal`,
  `chapter2`, `chapter3`, `story`, `phone`, `contract`: 27 of 27 (11 Oct 06:50 AEST).
- Screenshots looked at (11 Oct AEST): Bag with its small shop button, the shop (7 tabs) and the wardrobe, for a big kid and an
  under-5, on phone 390x760, tablet 820x1180 and computer 1280x800.
- **Item 2, Chapter 3 finished (owner's go, 11 Oct AEST):** 238 missing recordings made with Azure (Chapter 3's words, Chi's
  word questions, the festival calendar's "today" lines and others; no line has a child's name); Chi, Jack and Ruby's looks
  can come from Studio's content pack (`looks`, `lookOf` in `js/content/chapter3sydney.js`; the Studio page is asked of
  Studio on the board); every Chapter 3 step looked at on phone 390x760, tablet 820x1180 and computer 1280x800 for an
  under-5 and a big kid (nothing to fix). Not recorded: the festival lines with a number of days (any number), which use
  the phone's voice as before.
- **Full suite, 11 Oct 09:53 AEST, commit dc55967:** 88 of 88 passed (multiplayer, meet, netgames, together, cloud, knock
  skipped: no local PeerJS or MQTT server; they report as passed).

## What is left for Play (handover, 11 Oct 1:30 pm AEST; this chat stopped here at the owner's request)
- Done and pushed on `core/play` (e1c9552): owner's items 1 and 2 (see the notes above), board says "ready for Release".
- Item 3 (ongoing): any new GitHub issue labelled `play` from the Front Desk (none open on 11 Oct; #29 is fixed on `core/play`).
- Release → Play (board, T1/T3): festival `where` ids for the new places in `js/content/festcal.js`. `hoian` is in
  `js/content/map.js` now (a site, its old town comes later); `vungtau` is not there yet. Add them once Round T's places exist
  as festival places (`PLACES()` in `js/festivals.js` reads cities and the old places only), then run `festivals festcal`.
- Waiting on other cores (on the board, nothing for Play to build): Studio's "Story characters" page writing `looks`; World's
  real spots in Hà Nội and Sydney for chapters 2 and 3 (Round T); Kid UI's rest of #32 and the speech box's slide-in
  (`phone` flake); Release merging `core/play` (PR #43 or `core/play`, not both) and the robots' `.bugfix/result.md` conflict.
- Not recorded on purpose: festival calendar lines with a number of days (any number), which use the phone's voice.

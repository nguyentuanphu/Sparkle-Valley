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
- Hội làng (round S): `js/hoilang.js`, times and prizes in `js/content/hoilang.js` (with World for where the poles and the parade go)
- Surprises (round S): `js/surprises.js`, the list and the limit in `js/content/surprises.js`
- Grown-ups' features (round S, with Kid UI): `js/parents.js`, pure parts in `js/content/parents.js`

## Hard rules (§9.6)
ACT-001 (under-5 mode never punishes: no losing, no timers, no reading), ACT-002 (every game: both languages, a how-to
film, Next/Stop at the end, tap outside to leave), ACT-003 (nothing a game made stays alive after it ends), A11Y-004
(every game says what to do when it opens, for under-5s), A11Y-006 (under-5s see only games made for them), UI-005
(one activity list: every game in exactly one area), STR-001.

## Checks you run
`games gamelevel tales songs playhub coop tienlen netgames together chests postcards myhouse adventure hoilang surprises parents`, and `unit` (`tests/unit/roundS.test.mjs`)

## Talks to
- **Kid UI**: the Simple screen and the Games hub show your lists; a new game needs a drawn icon (`js/art.js`) and a place in `activities.js`.
- **Voice & Audio**: every new line a child hears needs a recording: list them on the board for the voice pack.
- **Online**: a new together-game needs its messages added to `js/netmsg.js`.
- **World**: a game's host or a festival needs a spot in the valley.

## Owner's decisions to keep
- Stars only (no difficulty dots); Easy · Medium · Hard inside each game, remembered per game and child (round M).
- Songs live with the games: the pink button is “Vui chơi / Play” with a Songs tab (round O).
- Festival music during festivals; Vietnamese tunes in the Vietnam areas; family recordings first (round N).
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

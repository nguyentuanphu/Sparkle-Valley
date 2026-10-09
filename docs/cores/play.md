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

## Hard rules (§9.6)
ACT-001 (under-5 mode never punishes: no losing, no timers, no reading), ACT-002 (every game: both languages, a how-to
film, Next/Stop at the end, tap outside to leave), ACT-003 (nothing a game made stays alive after it ends), A11Y-004
(every game says what to do when it opens, for under-5s), A11Y-006 (under-5s see only games made for them), UI-005
(one activity list: every game in exactly one area), STR-001.

## Checks you run
`games gamelevel tales songs playhub coop tienlen netgames together chests postcards myhouse adventure`

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

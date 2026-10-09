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

## Hard rules (§9.6)
ACT-001 (under-5 mode never punishes: no losing, no timers, no reading), ACT-002 (every game: both languages, a how-to
film, Next/Stop at the end, tap outside to leave), ACT-003 (nothing a game made stays alive after it ends), A11Y-004
(every game says what to do when it opens, for under-5s), A11Y-006 (under-5s see only games made for them), UI-005
(one activity list: every game in exactly one area), STR-001.

## Checks you run
`shop boxes games gamelevel tales songs playhub coop tienlen netgames together chests postcards myhouse adventure`

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
- **Bag button:** with the switch on, the dock's Bag goes to the shop (a fade, then the shop opens); the old backpack is the
  last picture tab in the shop and stays in the Pad. Switch off: everything is as before.
- **Wardrobe:** `G.openWardrobe` shows a row per kind with only what the child owns (plus passport hats), one tap to wear;
  a kind with nothing yet has a shop picture that goes to the shop.
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

# Suggested improvements (point 52)

Third AI chat, 16 October 2026 AEDT. These are **suggestions only**, kept apart from the required fixes in the evidence table. None of them is built. Each one needs the owner's choice before anyone starts it (UX-010: a brief with owners, screens and checks first). Effort: small (a day or less), medium (a few days), large (a week or more, or another core's files).

They come from the pictures and play-throughs of this round (`evidence/thinking-46-after/`, `evidence/learning-after-b09/`, the film pictures) and from reading the game's code.

## More interesting

| # | Idea | Why | Effort | Files |
|---|---|---|---|---|
| I1 | **The level follows the child inside a game.** After three right answers in a row with no miss, the next round is one step harder; after two misses in a round, one step easier. The Easy, Medium and Hard choice stays as the starting point. | Today the level only changes between games (progress plus the grown-ups' difficulty). A child who is bored or stuck stays there for the whole game. | Medium | `js/games/frame.js` (a shared `api.adapt()`), the six reasoning games; a check like `ownerthinkinglevels` |
| I2 | **"Try this again tomorrow."** Each child's profile remembers which rule or story they missed most (for example "can fly", or the rain story), and the game brings it back first next time. | Spaced practice helps learning more than repeating at once, and it needs no new art. | Medium | `js/state.js` (a small per-child record, migrated safely, UX-009), `js/games/bigthinkers*.js` |
| I3 | **Family stories in Garden Steps.** In Studio, a grown-up adds a four-step story of their own (photos or the game's pictures, with their own words in English and Vietnamese), shown to their children only. | Children order things they know from home (making phở, going to school); the family feature already exists for quizzes. | Large | Studio (`studio/ui/app.js`, family content), `js/games/bigthinkers.js`, voice recording for family lines |
| I4 | **A sticker for each skill.** Finishing Hard in a reasoning game gives a sticker in the Pad's sticker book (for example "Rule finder", "Path planner"). | A visible goal for bigger children, and grown-ups can see what was learned. | Small to medium | `js/games/frame.js` (win), the sticker book, art in `js/art.js` |
| I5 | **Two children, one puzzle.** In split-screen, one child picks and the other agrees ("Do you agree?") before the answer counts. | Talking about the answer is how reasoning grows; split-screen exists already. | Large | `js/games/frame.js` and the split-screen code (Play core) |

## Easier on the eyes

| # | Idea | Why | Effort | Files |
|---|---|---|---|---|
| E1 | **Smaller, quieter rewards.** The "Combo x9" and "Lucky star" banners stack on top of each other over the board (seen in Flower Path on a phone: three banners across the puzzle). Show one small banner at the top, and turn the stars down. | They hide the puzzle the child is still solving, and fast flashing is tiring. | Small | `js/games/frame.js` (`combo`, `lucky`), `css/style.css` (`.gl-combo`) |
| E2 | **A "calm screen" switch for grown-ups** (Studio and the device): no confetti or spark bursts, a softer background, slower animations. It uses the existing `reduceMotion` setting where there is one. | Some children are over-stimulated, and grown-ups ask for evening play. | Small to medium | `js/state.js` (setting), `js/games/frame.js`, `css/style.css`, Studio switch in `js/content/releases.js` (Release's file this round) |
| E3 | **Bigger small buttons on a computer.** "Hear again", "Show again" and "Ready to try" are 64 px tall but have 12 to 14 px text on a 1280 px screen (see `computer-en-*` pictures). Use the same 18 to 20 px as the question line. | Easier to read for a parent sitting beside the child, and for children starting to read. | Small | `css/style.css` (`.bt-repeat`, `.gl-stage .btn`) |
| E4 | **Dim the board on the win screen.** "You did it!" and "Tap anywhere else to finish" are written over the board's pictures (see the `ownerthinkinglevels` screenshots). A soft dark layer behind them makes them readable. | The words are hard to read over busy pictures. | Small | `css/style.css` (`.gl-win`) |
| E5 | **Warmer evening colours.** After 7 pm Sydney time (or on a grown-up's switch), the valley and the game backgrounds take a warmer, darker tint. | Gentler on the eyes before bed; the day and night cycle exists already. | Medium | `js/world.js` lighting (World core; map files are frozen this round), `css/style.css` |

## For grown-ups

| # | Idea | Why | Effort | Files |
|---|---|---|---|---|
| G1 | **A learning page per child in the Grown-ups area:** which learning games they played, the level reached, and the rule or story they find hard (from I2). Nothing is sent off the device. | Parents can see progress without watching every game. | Medium | Grown-ups panel (`js/ui.js` or the Pad), `js/state.js` |
| G2 | **Picture-only mode for pre-readers:** the question line is hidden (the `explain_gameLine` switch exists), the pictures grow, and the first time each game opens, a hand shows the first move. | Under-5s do not read; the spoken line and a shown move are what they use. | Medium | `js/games/frame.js`, `js/howto.js` (Kid UI core) |

## Not suggested

- No timers or "you lost" in learning games. The gentle rules (no timers, nothing lost on a wrong tap) are a good fit for the age group.
- No copying of another app's characters or exercises. The ideas above use the game's own art and voice.

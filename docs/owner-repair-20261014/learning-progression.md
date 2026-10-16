# Learning progression and acceptance

WO-13, original points46–48. Henry includes learning improvements in the approved consolidated round. This is the bounded content/verification list; it does not claim a complete curriculum or a completed runtime check.

Preserve all12 reading activities and their English/Vietnamese content: Listen & Touch, Story Choices, tracing, sounds, word building, rhyme, sight words, tones, syllables, word-picture matching, sentence building and read-along. Nine are available to under-5s; sight words, matching and sentences remain age-gated. The existing trial/Studio switch and saved progress remain intact. The interrupted local expanded run is not a pass. Later exactf475 GitHub run38658819569 completed the full reading check in1179s, including all12 games and EN/VI/age-level cases; evidence/github-f47546d5-full-157-checks.json. New progression/content changes still require fresh proof.

| Skill step | Existing or planned activity | Progression | Required proof |
|---|---|---|---|
| Listen and identify | Listen & Touch | Two pictured choices for little ones; more choices at later levels; hear again | EN/VI, wrong choice/retry, ear control, every level and clean exit |
| Understand a short spoken situation | Story Choices | Pictured choices and replay; no reading requirement for little ones | Instruction clarity, useful feedback, both languages and completion |
| Connect sounds/marks/words | Existing10 reading trials | Preserve their current skill-specific level lists and language-specific phonics/tones | Full reading90-case result, recorded speech and age gating |
| Find a shared rule | Find the Rule | Gentle pictured groups; later levels distinguish more attributes and choices | Demonstration, non-punishing retry and distinct difficulty cases |
| Put actions in order | Garden Steps | Short guided gardening sequence; later levels choose order with less prompting | EN/VI, progress indication, wrong-order recovery and completion |
| Plan a route | Flower Path | Three-by-three for little ones; larger route/branches at later levels | Adjacent steps only, safe retries, routes solvable and touch bounds |
| Predict a pattern | Pattern Picnic (draft implemented) | Picture sequence from two repeating symbols to a longer rule | Original existing game art; no colour-only rule; every tier in EN/VI |
| Compose a picture from shapes | Shape Builders (draft implemented) | Few large pieces/shadows to multi-piece compositions | Original shapes using game palette/outlines; touch/voice guidance, 64px controls and clean exit |
| Remember a logical sequence | Remember the Garden (draft implemented) | Visible short model for little ones; longer recalled order for bigger children | Hear/show again; no timed failure or progress loss; every tier in EN/VI |

The three additions address the brief's missing pattern/composition/memory depth without copying another product's assets or curriculum. All use the existing activity frame, artwork, language/font system, praise/retry behavior, navigation, recorded-voice pipeline and per-device testing progress policy. They must remain behind the same existing content/Studio controls and enter the canonical activity list exactly once.

Before marking this work checked: complete existing reading coverage; inspect phone/tablet/computer and EN/VI instructions; prove all new activities at under-5/Easy/Medium/Hard where age-appropriate, retry and cancellation; record every fixed spoken line; run relevant changed checks, phone/accessibility/lifecycle checks, and the exact-candidate GitHub suite. Production delivery and physical-device proof stay separate. The actual before/after table must show missing baseline pictures for new activities rather than manufacture a prior feature.

15 Oct continuation: all24 EN/VI/age-or-level cases completed with retry and cancellation; real pointer/touch drag also passed in layout checks. Stage pictures exposed shared header/caption/reward-counter overlap and compressed Shape Builders drawing; stricter real-entrance/long-guidance/landscape tests now drive repairs. These additions are not accepted as complete until the refined layout, recorded prompts, menu/progress integration and attributed comparisons are verified. Existing full reading passed again at exactf4751179s; earlier interrupted run remains interrupted.

Latest isolated learning acceptance: focused11/11 and broader5/5 passed;32 added recordings decoded and real EN/VI instruction/replay awake/iPhone-fallback cases passed112s, full fixed-line coverage8118. A new stale voice-index update bug was reproduced and repaired; final refresh/index/offline/contract/static10/10 passed. Original three activities still need independent difficulty/clarity review; complete attributed activity comparisons and exact-candidate full suite remain pending.

## Third AI review and repair, 16 October 2026 AEDT (points 46-48, branch `work/owner-repair-learning-20261016`)

Owner's "go" for this plan: 16 Oct AEDT (pop-up, "Go, all three"). Scope: the six reasoning games only (`js/games/bigthinkers.js`, `js/games/bigthinkers2.js`). The twelve reading activities were not changed. Level here means the game's tier: under-5, Easy (level 1), Medium (level 2), Hard (level 3 or more; a child's progress in a game also moves it up, as before).

### What was wrong (found by reading the code on c0bcd0bf, then confirmed in pictures)

| Game | Finding | How bad |
|---|---|---|
| Find the Rule | The same four fixed puzzles at every level; Easy, Medium and Hard identical (3 choices). A wrong tap only said "Try again", never what the rule was. | High: no progression, little learning from mistakes |
| Garden Steps | The spoken guidance named the answer ("Plant the seed."), so it was matching, not ordering. The last step had one choice only. Same at every level. | High: the activity did not test the skill it names |
| Flower Path | The path was fully marked with flowers and every other square was locked, so there was nothing to plan. One fixed route; Easy, Medium and Hard the same 4x4 board. | High: no reasoning needed, no progression |
| Remember the Garden | The choices were only the pictures not used yet, so the last pick was forced (one choice). A wrong tap said only "Try again". | Medium |
| Pattern Picnic | Levels did differ, but Medium and Hard opened with the under-5 pattern (apple, flower). | Low |
| Shape Builders | Levels differ (3 to 6 pieces, rotated outlines). No change needed. | None |

### What changed

- **Find the Rule:** nine rules (fruit, animals, things to wear, things that take us places, flowers, live in water, can fly, red, yellow). Under-5: 2 examples and 2 choices; Easy: 2 examples, 3 choices; Medium: 3 examples, 3 choices, one look-alike (for example a carrot beside fruit); Hard: 3 examples, 4 choices, always one colour or "can fly" rule, mostly look-alike choices (a banana when the rule is red). Pictures that also fit a rule are never offered as wrong (a fish is never "not an animal"). A wrong tap says the rule ("Not that one. Look again: they are all fruit." / "Chưa đúng. Nhìn lại nhé: tất cả đều là trái cây."); a right one says it too.
- **Garden Steps:** five little four-step stories (seed to fruit, snowman, rain to rainbow, rice from field to table, shoot to flower and bee). The guidance asks "What happens first?" / "What happens next?" and the step's words are said only after the child picks it. Pictures from other stories join the choices (1 for under-5 and Easy, 2 from Medium), so the last step is a real choice. Under-5: one three-step story; Easy and Medium two stories; Hard three. A wrong tap says "That comes later. What has to happen before it?" or "That picture is not part of this story." Pictures that look alike (two chicks, two bowls, two clouds) were replaced after looking at the screenshots.
- **Flower Path:** a new path every game, drawn so it never touches itself (one way through, no short cuts). Under-5 3x3, Easy 4x4, Medium 4x4 with two dead-end flowers, Hard 5x5 with two or three dead-end flowers. Every square next to the child is a choice (also the one they came from), so there are always two or more. Wrong taps explain: a puddle, a dead end ("Those flowers stop at a puddle. Find the way to the flag."), or going back. The board is sized to fit a phone (the 5x5 board was cut off at first; fixed and now checked). Owner, 16 Oct AEDT: "the flower path pictures overlap each other": on a tablet and a computer the shared choice size drew 80 px pictures in 74 px squares; the pictures now have a fixed size (46 px) inside every square, and `ownerthinkinglevels` measures phone, tablet and computer (it fails on the old size).
- **Remember the Garden:** garden pictures not in the row join the choices (1 for under-5 and Easy, 2 from Medium), and a wrong tap says why.
- **Pattern Picnic:** each level has its own run of patterns; Medium and Hard start harder.
- The three original games got the same "Hear again" button (64 px) as the newer three. No timers; nothing is lost on a wrong tap; under-5s still get 3 stars and the hint after two misses.

### Checks (16 Oct AEDT)

- New check `ownerthinkinglevels` (tests/run.mjs): the four games at under-5, Easy, Medium and Hard in EN and VI on a phone (390x844), played to the end with one wrong tap each. It fails if a game does not finish, a question ever has only one choice, a wrong tap does not say why, a button is under 64 px (under-5) or 44 px or goes off screen, the Vietnamese guidance is English, Garden Steps names the answer before the choice, or the levels do not differ (Find the Rule 2/3/4 choices, Flower Path 3/4/5 board and dead ends from Medium, Garden Steps and Remember the Garden choices growing). It caught two real faults on the way (a forced single choice at a path corner; a Medium board with no dead end) and passes on 8526f611 and later.
- `ownerlearningprogression` (existing, Pattern Picnic, Shape Builders, Remember the Garden, 24 cases) passes with the changes.
- A simulation of 2000 random Flower Path boards per level: every path reaches the flag, none has a short cut, every dead end touches only one flower, Medium and Hard always have at least two dead ends.
- Pictures before (c0bcd0bf) and after, six games at under-5, Easy and Hard on a phone (EN and VI), a tablet and a computer: `evidence/thinking-46-before-c0bcd0bf/` and `evidence/thinking-46-after/` (script `tests/owner-thinking-shots.mjs`, no page errors). Looked at: phone EN and VI, tablet and computer for every changed game.

### Still open

- New spoken lines are not recorded yet (listed on `docs/cores/BOARD.md` for Release, who owns the voice index this round); until then the device voice reads them.
- Physical devices, and a real child trying the new levels, remain unverified. The reading activities were not re-reviewed in this pass.

## r79 learning, chat 2, 16 October 2026 AEDT (E1, E3, E4, I1, I2, I4, G2 and four new games; branch `work/r79-learning-20261016`)

Owner's answer to the plan pop-up: "Do everything at once". "Learning games" below means the six reasoning games, the four new games and the five games in `js/games/learning.js` (they carry `learn: true` when they register). Other games are unchanged.

| Item | What a child sees | Where |
|---|---|---|
| E1 | One small reward banner ("Combo x3", "Lucky star! +3", "A bit harder!") in the top bar, over the game's name between Leave and How to play. A new one replaces the one showing; it never covers the question line or the puzzle. Calm fade, no zoom. | `js/games/frame.js` `banner()`, `css/style.css` `.gl-reward` |
| E3 | On a computer (wide screen, mouse) the game buttons ("Hear again", "Show again", "Ready to try", "That's it!") have 19 px text. Phones and tablets keep 16 px. | `css/style.css` |
| E4 | "You did it!" sits on a darker, softly blurred layer, and the words have a dark band behind them. | `css/style.css` `.gl-win` |
| I1 | Three right in a row make the next round one step harder; two misses in a round make it one step easier. The level moves at most one step from where the game started (Easy, Medium or Hard stay the starting point), and under-5s always stay at the under-5 level. Flower Path and Shape Builders have one puzzle per game, so their step applies to "Play again" of the same game only. | `frame.js` `api.tier()`, `api.nextRound()` |
| I2 | Each child's profile keeps a small record of what they missed in each learning game (a rule, a story, a word, a sound; at most 12 per game, counts up to 9). The most-missed one comes back first next time; a clean answer counts it down. Old saves of any shape get a clean record (`normalizeLearn` in `js/state.js`, called by `normalizeProfile`). | `profile.learn = { v: 1, miss: { game: { key: n } }, seen: { game: 1 } }` |
| I4 | Finishing Hard in a reasoning game gives its sticker once, shown under "You did it!" and in the sticker book: Rule finder, Story sorter, Path planner, Pattern spotter, Shape builder, Memory keeper. Drawn in `js/art.js` (keys `skill:<game>`); the sticker book draws them with `pic()`. Not for under-5s. | `js/games/registry.js` `SKILLS`, `js/fun.js` |
| G2 | Under-5s in learning games: the question line is hidden (still spoken, its space kept), the pictures are bigger, and the first time each game opens for that child a drawn hand taps the first right move three times. | `frame.js` `pic-only`, `api.hand()` |

### The four new games (`js/games/talkgames.js`)

| Game | Area, age | Levels | A wrong tap |
|---|---|---|---|
| Say It, Find It (`sayfind`) | Letters and words, 3+ | 2, 4, 6 pictures; Hard: two-word asks with a big and a little picture of the same thing ("Where is the big dog?"). Optional microphone: saying the word counts like a tap and the child hears it back; no microphone, no permission or a phone without speech recognition: no button, tapping works. | "That is a banana. The mango is yellow-green and shaped like a big bean." |
| Market Counting (`marketcount`) | Numbers, 3+ | Up to 3 (under-5), up to 5, up to 10; Hard: "add 2 more" or "take 1 away" from a basket that already has fruit. Fruit is tapped or dragged into the basket (and back out); each one is counted aloud. | Too many or too few: the basket counts out loud, extra fruit gets a red ring, missing places show as dashed spaces, then "We need three. Put in one more." |
| How Do They Feel? (`feelings`, rebuilt in place) | Me and my family, everyone | 2 faces (under-5), then 4 (happy, sad, surprised, cross); Medium and Hard add "What could you do?" (2 and 3 choices). Eight little stories about Lá. | "Would you smile if your ice cream fell? Lá feels sad." / "That will not help Lá right now. Sharing can help when someone is sad." |
| First Sound Hunt (`soundhunt`) | Letters and words, 4+ | 1 of 2, 2 of 4, 2 or 3 of 6 pictures; Hard: end sounds in English, tones in Vietnamese. One language's words per game. | Both words, one after the other: "tiger… frog… They start with different sounds." |

The old "How Do They Feel?" (Tí's stories, three faces chosen from eight feelings) had the same name as the new game, so it was rebuilt in place with the same id: its place on the Simple screen and a child's progress stay. "First Sound Hunt" sits beside the existing "First Sounds" (which letter a word starts with).

### Checks and pictures

- New check `r79learning` (`tests/run.mjs`, at the end): the four new games at under-5, Easy, Medium and Hard in EN and VI on a phone, each played to the end with one wrong tap (32 runs: never one choice, every wrong tap says why, 64 px and 44 px buttons, nothing off screen, no English in the Vietnamese games, the levels differ); E1, E3 (and phones unchanged), E4, I1 (up, down, at most one step, under-5s fixed, "Play again" carry), I2 (comes back first, counts up and down, old saves, kept after a reload), I4 (Hard only, once, not for under-5s, the sticker book draws it), G2 (first time only, bigger children see words and no hand), the microphone (none: no button; heard: counts; refused: button goes, tapping still works).
- Before and after pictures: `evidence/r79-learning-before/` (the code before this chat) and `evidence/r79-learning-after/` (script `r79-learning-shots.mjs`), phone EN and VI, tablet and computer.
- Steady windows: `evidence/steady-sweep-r79-learning/` (`tests/owner-steady-sweep.mjs` with `SV_GAMES`, every learning game's screen).
- New spoken lines: `r79-learning-voice-lines.md` (for Release to record).

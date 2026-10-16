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
- **Flower Path:** a new path every game, drawn so it never touches itself (one way through, no short cuts). Under-5 3x3, Easy 4x4, Medium 4x4 with two dead-end flowers, Hard 5x5 with two or three dead-end flowers. Every square next to the child is a choice (also the one they came from), so there are always two or more. Wrong taps explain: a puddle, a dead end ("Those flowers stop at a puddle. Find the way to the flag."), or going back. The board is sized to fit a phone (the 5x5 board was cut off at first; fixed and now checked).
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

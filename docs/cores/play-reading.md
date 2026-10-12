# Play (reading): the ten reading games, a trial behind a switch

The second Play chat (owner, 11 Oct AEDT), branch `core/play-reading`, brief `tasks/play-reading.md`. The first Play chat
keeps `docs/cores/play.md` and `core/play`; this file holds this chat's notes and the owner's decisions for the brief.

## Owner's decisions (11 Oct AEDT)
- 11 Oct, about 8:05 pm AEDT: "go" to the plan: all ten games as the brief lists them, behind Studio's `readingTrial`
  switch (off), in English (Australian English) and Vietnamese, the language setting choosing which one a child reads.
- Same answer: little ones' Tone Marks game uses friendly pictures (cá / cà / ca and others), not "ma" (ghost) and
  "mả" (grave); big kids still hear the six tones on "ma" as sounds only, with no pictures.
- Same time: English letter sounds (/s/, /a/, /t/…) are recorded as exact sounds from their phonetic spelling (IPA)
  with Azure, through a small added block in `tools/make-voice-pack.mjs` (Voice & Audio's, noted on the board).
  Vietnamese sounds are real Vietnamese syllables ("bờ", "mờ", "á").

- 12 Oct, about 1:35 pm AEDT: "you push, and I will get Release core to run full suite": this chat pushes
  `core/play-reading` as it is; Release runs the full suite when it merges.

- 12 Oct, about 2:10 pm AEDT: "if you have full suited, you can deploy", then "Yes, deploy" for r65 (pop-up): this
  chat acts as Release for this round only (version r65, merged into main by pull request).

## How it is built
- `js/games/readingmenu.js` (small): the ten games' names, pictures, ages and how-to cards. It is loaded after the
  title only while `readingTrial` is on (`js/main.js`, one block), so with the switch off nothing of the trial loads.
- `js/games/reading.js`: the ten games, loaded when a reading game opens. `js/content/reading.js`: the word lists
  for both languages (loaded with the games).
- Area "Reading corner / Góc đọc" (`reading`), after "Letters and words" on the Simple screen and in the Play hub's
  Learning tab; with no games registered (switch off) the area is empty and never shown.

## The ten games (what each one does differently from Letter Hunt and First Sounds)
Letter Hunt: hear a letter's name, find the letter. First Sounds: see a picture, pick its first letter. None of these repeats them.
| Game | Big kids (Easy / Medium / Hard) | Under-5s |
|---|---|---|
| Lantern Letters `rd_trace` | trace the letter over glowing dots (more of the letter to cover each level; Hard mixes in capitals); the lantern says the letter, its sound and a word | wide finger, about half the dots |
| Sound Pond `rd_sounds` | hear a sound, catch the fish with its letter: 3, 4, 5 fish, fish swim gently | 2 still fish, right one wiggles after two misses |
| Word Builder `rd_build` | drag or tap letter tiles onto the picture (CVC; then frog, duck; then fish, teeth with sh, ck, ee, th); 0, 1, 2 spare tiles. Vietnamese: âm đầu + vần tiles, then the đánh vần line ("mờ eo meo huyền mèo") | tiles in order, tap each |
| Rhyme Time `rd_rhyme` | Easy: do they rhyme? Medium: pick the rhyme from 3 pictures and words; Hard: from 4 words only | yes or no, pictures only |
| Word Balloons `rd_sight` | hear a common word, pop its balloon (3, 4, 5 balloons; Hard has look-alike words). Calm mode: balloons stand still | not shown |
| Tone Marks `rd_tones` | Vietnamese: hear the word, tap it among 3 or 4 tones of "ma", "ba", "be"; Hard: tap the mark it needs. English: short and long vowels (kit / kite, the magic e) | Vietnamese: cá / cà / ca, bò / bó, bà / ba pictures; English: cub / cube, pin / pine pictures |
| Syllable Drum `rd_syllable` | beat once per syllable / tiếng: up to 2, 3, then 4; a wrong count says listen again | any count is praised, then the right count is shown and beaten |
| Word and Picture `rd_match` | read the word (said only if the ear is tapped), tap its picture among 3 or 4; Hard: picture to word | not shown |
| Sentence Train `rd_sentence` | tap word carriages in order: 3, 4, then 5 words; then the sentence is read with each word lit | not shown |
| Read With Me `rd_readalong` | choose one of 3 little books per language (4 pages), read aloud with each word lit, tap a word to hear it, then one question with picture answers | the same, answers are pictures only |

Our own books (not the folk tales: their sentences are too long for read-along): English "The Big Red Bus", "Koala Can Not
Sleep", "A Day at the Beach"; Vietnamese "Chú Mèo Con", "Đi Chợ Với Bà", "Trăng Rằm".

## Voices
- Every word, letter name, sound, đánh vần line, sentence, book page and question is in `readingLines()`
  (`js/content/reading.js`): 254 English and 287 Vietnamese lines; instructions are normal say() lines in both languages.
- Recorded with Azure (en-AU Natasha and William, vi-VN Hoài My and Nam Minh), 11 Oct AEDT: 1160 files (580 lines: 541 reading lines and 39 other cores' lines that were not recorded yet), coverage clean
  (`voicecover`). English sounds from IPA (`SOUND_IPA`): s, m, n, f, l, r, v, z, sh, th are held ("sss"), stops are
  short (t, p, k with a breath). Nobody has listened to them yet: the owner is asked to.
- None has a child's name.

## Progress notes
- 11 Oct, 8:05 pm AEDT: plan agreed; building.
- **Full suite, 12 Oct, 3:20 am AEDT, commit a62b9ee (`core/play-reading`, from `main` 9c1e2334, `main` unchanged since):
  97 of 99 passed.** Skipped (no local PeerJS or MQTT server in a helper chat; they report as passed): multiplayer, meet,
  netgames, together, cloud, knock, mapver. Failed: `startup` (PERF-001 first download 1099 KB > 1035, title 1.8 s): it
  fails on `main` too, measured in this chat the same night at 1088 KB and 1.78 s; the 11 KB more here is only
  `voices/manifest.json` (580 more recorded lines, read at start), not the games' code. `adventure` failed ("the
  activity list has ten games that do not exist" with the switch off): fixed by adding the ten games' ages to the
  activity list only when the switch is on (`js/games/readingmenu.js`); then games, adventure, hubmap, ages, simple,
  playhub all passed again (12 Oct AEDT).
- Own checks (11 to 12 Oct AEDT): `reading` (new) passed: switch off, nothing of the trial loads or shows; switch on,
  10 games in the Reading corner (7 for under-5s), all 74 versions finish (each game at Easy, Medium, Hard and the
  under-5 version, English and Vietnamese). `noemoji`, `emoji`, `phone`, `voicecover`, `perf`, `arch` passed.
- Screenshots looked at (12 Oct AEDT): every game, big kid and under-5, on phone 390x760 (English), tablet 820x1180
  (Vietnamese) and computer 1280x800: no button under 44 px, nothing off screen, no scrolling. Fixed from them: the
  drum and the train engine were drawn tiny; a balloon was cut off at a phone's edge; short words in Read With Me were
  under 44 px. Not ours, seen on a phone in every game: the star counter covers the end of a long instruction (board,
  Kid UI).
- **After merging `main` (1e5e0ece, r62) into `core/play-reading` (merge cae56af3, no conflicts): full suite 12 Oct,
  5:39 am AEDT, 99 of 101 passed.** Skipped as before (multiplayer, meet, netgames, together, cloud, knock, mapver).
  `startup` red as on `main` (first download 1102 KB > 1035; title 1.7 s). `hoilang` failed twice ("not told the festival
  is on": the surprise-gift and passport toasts came at the same moment, as already noted in `docs/cores/play.md`),
  then passed twice in a row on this branch (6:10 am AEDT), and passed twice on a clean `main` copy: a timing flake, not
  from the reading games. `reading`, `voicecover`, `perf`, `phone`, `noemoji`, `emoji`, `arch` passed.
- **After merging `main` r63 (6fa1b6fe; merge 31c88886, voice list rebuilt from both sides' recordings, coverage
  clean): full suite 12 Oct, 9:00 am AEDT, 104 of 105 passed** (skipped as before: multiplayer, meet, netgames,
  together, cloud, knock, mapver; `hoilang` and `reading` passed). Failed: `startup` only, on time to the title. Run
  again twice each on this branch and on a clean `main` r63 copy (12 Oct, about 9:30 am AEDT): `main` fails the same
  way (title 1711 and 1755 ms against about 1170), this branch 1786 ms (one slow first run, 2444 ms); first download
  982 KB here against 979 KB on `main` (under the 1035 KB limit on both). So the trial adds 3 KB at start (the voice
  list), nothing else.
- **After merging `main` r64 (5f0f5f8a; merge 8186422c, voice list rebuilt, coverage clean): full suite 12 Oct, about
  1:15 pm AEDT, 105 of 108 passed.** `startup` red on title time only (1.9 s; first download 982 KB, under the new
  1000 KB limit), the same as `main`. `perf` over once (841,707 triangles > 800,000), then passed on this branch
  (789,921) and twice on a clean `main` r64 copy (786k to 791k): not from the reading games. `reading` was cut off by
  the run's 2-hour limit (it passed in the three full runs before); its rerun was still going when the owner said to
  push, and Release runs the full suite next.
- `reading` rerun on the r64 merge (commit f21fa3f8), 12 Oct, 1:48 pm AEDT: passed (all 74 versions, both languages, switch off and on).

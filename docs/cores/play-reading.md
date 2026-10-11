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
- Recorded with Azure (en-AU Natasha and William, vi-VN Hoài My and Nam Minh), 11 Oct AEDT: 1160 files, coverage clean
  (`voicecover`). English sounds from IPA (`SOUND_IPA`): s, m, n, f, l, r, v, z, sh, th are held ("sss"), stops are
  short (t, p, k with a breath). Nobody has listened to them yet: the owner is asked to.
- None has a child's name.

## Progress notes
- 11 Oct, 8:05 pm AEDT: plan agreed; building.

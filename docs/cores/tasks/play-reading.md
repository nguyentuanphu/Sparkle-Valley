# Task brief: ten reading games, a trial behind a switch (Play core)

Written 11 Oct 2026, 7:55 pm AEDT, by the Analytics & Infra chat from the owner's answers (the owner asked for reading
games like the interactive reading games in Khan Academy Kids, first 5, then "increase to 10 games", as a trial to see
if they are good). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## The owner's rules (11 Oct AEDT)
1. Ten reading games in the Play hub, **as a trial**: one Studio switch `readingTrial` (Releases page), **off** until an
   admin switches it on, so the owner can try them at home before the children see them.
2. They are **our own games**, inspired by the kinds of early-reading activity Khan Academy Kids has (tracing, letter
   sounds, blending, rhyme, sight words, read-along). Never copy their names, characters, pictures, sounds or screens:
   Sparkle Valley's own drawings (`js/art.js`), villagers (Ông Cú, Bà Năm, the companion) and voices.
3. English and Vietnamese for everything (Vietnamese is not a translation of English phonics: use real Vietnamese
   reading steps, letters with marks, tones, vần, tiếng).

## What is there now (check it first, do not duplicate)
- The area "Letters and words" (`words` in `js/content/activities.js`): Letter Hunt (`letters`, `js/games/thinking.js`),
  First Sounds (`phonics`, `js/games/learning.js`), Opposites, Two Homes Words, First Words: Chinese and Hindi.
- Stories and storybooks (`js/tales.js`, `js/story.js`): game 10 below reuses them, it does not make new stories.
- Say in your plan how each new game differs from Letter Hunt and First Sounds; drop or merge one that does not.

## The ten games
| # | id | Name (EN / VI) | The child... | Ages | Under-5 version |
|---|---|---|---|---|---|
| 1 | `rd_trace` | Lantern Letters / Đèn Lồng Chữ Cái | traces a big letter with a finger along glowing dots; the lantern lights and says the letter and its sound. Vietnamese set includes ă â đ ê ô ơ ư | 2-6 | wide path, any wobble counts |
| 2 | `rd_sounds` | Sound Pond / Ao Âm Thanh | hears a sound ("/m/ như mèo") and catches the fish carrying that letter (letter shape to sound; First Sounds is picture to sound) | 3-6 | 2 fish, the right one wiggles after two misses |
| 3 | `rd_build` | Word Builder / Ghép Chữ | drags letter tiles onto a picture to make the word (c-a-t, m-è-o); each tile says its sound, then the word is blended aloud | 5-8 | 2-letter words, tiles already in order to tap |
| 4 | `rd_rhyme` | Rhyme Time / Tìm Vần | hears two picture words and says if they rhyme (cat/hat; mèo/kẹo), or picks the one that rhymes | 4-7 | yes/no with pictures only |
| 5 | `rd_sight` | Word Balloons / Bóng Bay Chữ | hears a common word ("the", "là", "và") and pops the balloon with it; balloons float slowly | 5-8 | not shown to under-5s (needs reading) |
| 6 | `rd_tones` | Tone Marks / Dấu Thanh | hears "ma, má, mà, mả, mã, mạ" and puts the right mark on the word; English mode: long and short vowels (cap/cape) | 4-8 | hears and taps the picture (ma, má, mạ) |
| 7 | `rd_syllable` | Syllable Drum / Trống Đếm Tiếng | beats the drum once for each syllable / tiếng in a word or name ("ba-na-na", "con mèo") | 3-6 | any beat count is praised, the right count is shown |
| 8 | `rd_match` | Word and Picture / Chữ và Hình | reads a word and taps its picture (or the other way round) | 5-8 | not shown to under-5s |
| 9 | `rd_sentence` | Sentence Train / Tàu Câu | puts word carriages in order to make a sentence, then hears it read ("The cat sits." / "Con mèo ngồi.") | 6-8 | not shown to under-5s |
| 10 | `rd_readalong` | Read With Me / Cùng Đọc | a storybook page is read aloud while each word lights up; the child taps a word to hear it again; one question at the end (Who? Where?) answered by tapping a picture | 3-8 | pictures only, the voice reads |

Spare if one is dropped: Big and Little Letters / Chữ Hoa Chữ Thường (match A to a).

## How they work (every game)
- One new area **"Reading corner / Góc đọc"** (`reading` in `js/content/activities.js`) shown in the Play hub's Learning
  tab, only when `readingTrial` is on (and each game in exactly one area: UI-005).
- The shared frame `js/games/frame.js` (top bar, Easy · Medium · Hard, stars, win screen, Next/Stop).
- Under-5s (ACT-001, A11Y-004, A11Y-006): voice first, no reading needed, no losing, no timers, 64 px targets; games
  5, 8 and 9 are for 5 to 8 only. Big kids: real challenge at Medium and Hard (longer words, more choices).
- Each game says what to do when it opens, has a how-to film (ACT-002, or ask Kid UI for it on the board) and leaves
  nothing alive when it ends (ACT-003).
- Word lists in a content file (`js/content/reading.js`): only words a child of 2 to 8 knows, both languages, with
  pictures that already have drawings in `js/art.js`; a new picture needs a drawing (no emoji, `noemoji`/`emoji` check).
- Nothing about the child is kept except stars and progress, as for the other games.

## Voices
Every letter name, letter sound, word, sentence and instruction must be in the voice pack (HANDOFF rule 11). Letter
sounds need care: Azure says a letter's name, not its sound, so record sounds as short syllables or phonetic text (and
the six Vietnamese tones on "ma"); list how each is made. If `AZURE_SPEECH_KEY` is set, record with
`node tools/make-voice-pack.mjs --engine azure`; otherwise list every new line on the board for Voice & Audio.

## You may change
`js/games/reading.js` (new), `js/content/reading.js` (new), `js/content/activities.js` (the new area and its games),
`js/content/releases.js` (the `readingTrial` line only), `js/art.js` (new drawings: tell Kid UI on the board),
`sw.js` FILES (the two new files only, noted on the board), `tests/run.mjs` (your checks), `docs/cores/play.md`.
The Games hub lists in `js/ui.js` together with Kid UI (note it on the board). Do not bump the version.

## Checks
Play's checks (`docs/cores/play.md`), plus `noemoji emoji phone voicecover perf startup`, a new check `reading` (with the
switch off no reading game shows; with it on all ten open and finish at Easy, Medium and Hard for a big kid, the
under-5 versions finish with no losing and no reading, games 5, 8 and 9 are hidden from under-5s, both languages),
screenshots of each game on a phone, a tablet and a computer, then the full suite. The new files must load only when a
reading game opens, so the start-up download does not grow (`startup`, PERF-001).

## Later (not in this brief)
The owner tries them with the children, then decides which stay, which change and when the switch goes on for everyone.

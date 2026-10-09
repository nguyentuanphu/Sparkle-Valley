# Task brief: lantern story Chapter 2, Hà Nội (Play core)

Written 10 Oct 2026 (AEST). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## Goal
Build Chapter 2 of Đèn Lồng Thung Lũng (The Valley Lanterns), as planned in `docs/cores/STORY.md` (chapter table and characters). Release: late October.

## What the chapter has
- **Arrive:** Ông Cú or the companion takes the child to Hà Nội; a core character meets them.
- **Help (3 to 5 quests):** Tèo's Ô ăn quan challenge (he starts as a show-off rival and ends a loyal friend); Cô Tam's lesson at Văn Miếu (a learning quest: a word, a number or a custom); small jobs for Hà Nội's people.
- **Play:** Ô ăn quan, with its guide film.
- **Story:** one Hà Nội tale as a film or picture story, told by Bà Năm.
- **Find the lantern:** a small search with clues (under-5s: the companion leads the way).
- **Festival night:** the lantern is hung, Cầu Thê Húc lights up red over Hồ Gươm (a short film), then a Trung Thu lantern parade; a keepsake for home.
- Under-5s: the same story with fewer steps and no reading. Big kids (5 to 8): the full quests, harder games and a bonus secret.
- The companion learns a new trick this chapter (STORY.md: "learns a new trick each chapter").

## How to build it
- Follow the Prologue and Chapter 1: `js/lanterns.js`, `js/content/chapters.js`, `js/companion.js`, `js/handpad.js`, `js/dinh.js`.
- Use existing places and characters by id (Hà Nội, Hồ Gươm, Cầu Thê Húc, Văn Miếu, Tèo, Cô Tam, Bà Năm). Do not move or add world positions (`CLAUDE.md`, helper rule 4); if the chapter needs a new spot, ask on `docs/cores/BOARD.md` (World) and use `js/openspot.js` meanwhile.
- A Studio release switch `story_ch2`, next to `story_ch1` in `js/content/releases.js`.
- The goal bar: Chapter 2 starts when Chapter 1 is done; the side-story order in STORY.md stays.

## You may change
`js/lanterns.js`, `js/content/chapters.js`, `js/companion.js`, `js/handpad.js`, new files `js/content/chapter2*.js` if needed, `js/content/releases.js` (one line), `js/art.js` (new drawings), `tests/run.mjs` (your check), `docs/cores/play.md`, `docs/cores/STORY.md` (status line).

## Checks
Your core's checks (`docs/cores/play.md`), plus `story yard films emoji noemoji contract a11y phone`, a new check `chapter2` (plays the chapter from start to the parade for an under-5 and a big kid), then the full suite.

## Report
As in `CLAUDE.md` helper rule 11, plus screenshots of the lit Cầu Thê Húc and the parade.

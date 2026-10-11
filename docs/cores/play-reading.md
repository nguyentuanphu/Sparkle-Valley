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

## Progress notes
- 11 Oct, 8:05 pm AEDT: plan agreed; building.

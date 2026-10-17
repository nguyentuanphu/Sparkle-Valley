# Release r69: the Play branch (handover from the Play chat, 13 Oct AEDT)

> You are the **Release** core. Do `docs/cores/tasks/release-r69.md`.

The owner asked the Play chat to stop its full suite and hand this round to the Release chat (13 Oct, about 3:40 am AEDT).
Nothing of `core/play` is live yet: r66, r67 and r68 were built from other branches.

## What goes in
r69 = live main (r68) + `core/play`. Every other branch carries only board or notes lines; no pull requests are open.
`core/play` already has main r68 merged in (voice manifest unioned, areas rebuilt) and merges cleanly into main.

1. **The tester's 14 notes ("Notes on SV")**, the owner's go 12 Oct AEDT: "this chat fixes all" (across Kid UI, World,
   Voice & Audio and `js/main.js`). Files and what changed are on the board (Play section) and in `play.md` progress notes.
   - Simple screen: inside a category card, its name is a heading at the top of the road, not a stop (`js/simple.js`).
   - Story bar: back, next, pause (stops the voice), green "read by itself" last (`js/tales.js`).
   - Days game: whole day names, sized to fit (`js/games/more.js`).
   - Animal calls about 2 s, louder, music dipped (`Music.duck`, `animalCall` in `js/audio.js`; `js/games/learning.js`).
   - Chuyền quà: no background music under its tune, a stop sign, the holder lit, the gift pulsing on the child's turn.
   - Bunny game: the tick fills its button.
   - Recipe book "Sổ công thức nấu ăn" shows the ingredients in the bag; the bag has no jump chips (`js/ui.js`).
   - **Shop button in the dock beside the Bag** (owner: "bottom bar"; it was inside the bag from Bug #29) (`js/hud.js`, `js/icons.js`).
   - Storyteller's tag says Bà Năm; the house grandma is Bà Nội (names only in `js/homes.js`, no positions); people in a
     room and its floor can be tapped; no floating (i) in rooms; (i) buttons only up close, people first; outdoor (i)
     signs open when tapped (`js/main.js`, `js/heritage.js`, `js/regionsites.js`).
   - Indoors: the camera stays close inside the room (`js/player.js`, `js/seethrough.js`); no rain or rainbow lines (`js/weather.js`).
   - Hồ Gươm: the light on the nearest place still to search, the "!" tappable, Go flies past water (`js/content/chapter2hanoi.js`, `js/main.js`).
2. **Switches** (owner, 12 Oct AEDT: "all other features should be on for now until I say or switch it off"; "only power
   poles and auto play are off"): `readingTrial`, `story_ch2`, `story_ch3` are `def: true`; `powerPoles` and `autoplay`
   stay off. Live Studio rules already have `story_ch2` and `story_ch3` on.
3. **The auto play check** (owner 12 Oct): Studio Releases switch `autoplay` (group "For testing"), every device or ticked
   devices; `js/autoplay.js`, `js/content/autoplay.js`; new check `autoplay` (already in HANDOFF's checks table).
4. **Studio**: real photos publish in steps of 12 (502/503/504 retried); the exe updates itself from the `studio-exe`
   branch and keeps its game folder up to date from GitHub (`studio/core.cts`, `studio/studio.cts`, `studio/ui/*`,
   `netlify/functions/studio.mts`, `tools/publish-exe.sh`).

## Already done on `core/play`
- HANDOFF: an r69 round-history entry (draft: fill in the checks) and the `autoplay` row in the checks table.
- Voices: all recorded (the one new line "Your turn! Tap the present to rip the paper!" / "Đến lượt con! Chạm vào món quà
  để xé giấy!", Azure, en and vi). `make-voice-pack --engine azure` found 0 missing after the r68 merge.
- Checks run by the Play chat (details and dates in `play.md` progress notes): before the r68 merge, about 30 browser
  checks for every changed part pass (boot, games, phone, tales, signs, nametags, films, story, chapter2, chapter3,
  kidplay, shop, dialogtap, simple, rain, playhub, a11y, postcards, myhouse, iphone, reading, autoplay, festivals,
  features, voicecover, studio...); after the r68 merge only the quick checks (types, unit, arch, rules, preload, emoji)
  were run: **the full suite has not been run.**
- Screenshots looked at on phone, tablet and computer for the Simple screen, story bar, days, Chuyền quà, bunny, recipe
  book, bag and dock.

## Fixed after the handover (13 Oct, about 6 am AEDT)
- `a11y` was red with the reading games on by default: six reading games spoke their first line without announcing it
  (`sayAsync` does not tell the caption listeners), so the under-5 check heard nothing. `js/games/reading.js` now
  announces every instruction like the other games; `a11y` passes (87 games), `reading` re-run.

## Known before you start
- `startup` is red on main r66 too (first title 1.5 to 1.7 s on the test machine against about 1.0 s): not this branch.
- `perf` (PERF-003) sits at its edge on main as well: home draw calls 1095 to 1145 against 1100, triangles 780k to 830k
  against 800k, varying run to run; with the reading games on and off the 3D scene differs by one small mesh.
- `knock` is skipped without a local MQTT broker.
- Do not use `pkill -f` with a pattern that is also in your own command line: it kills your shell.

## Your steps (`release.md`, "A round, step by step")
1. `git fetch`; merge `core/play` into a release branch from main (or open a pull request from `core/play`); fix the AI
   review's findings, if any.
2. Bump to **r69**: `js/build.js`, `sw.js` VERSION (`sv-2026-10-13-r69` or the day you ship), `studio/version.json`.
3. `node tools/make-voice-pack.mjs --engine azure` (expect 0 new).
4. Full suite: `cd tests && node run.mjs` (one browser run at a time; keep a local server on port 8765 running).
5. HANDOFF: finish the r69 entry with the checks; board; `release.md` notes.
6. The Netlify zip (`git archive` line in `release.md`).
7. Report to the owner in plain words (AEDT), then the one pop-up "yes, deploy".
8. After it is live: `bash tools/publish-exe.sh "r69: photos in steps, self-update, game folder kept new"` so the owner's
   exe offers "Update now" (the exe on the owner's computer is older than the updater: they may need one manual download
   from the `studio-exe` branch first).

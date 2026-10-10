# Board: what each core is doing and what it needs from others

Every core keeps its own section up to date. Times are in AEST. Release reads this before merging.

Each section starts with a **Now** line (owner, 10 Oct; rules in `CLAUDE.md`, "Working together across chats"):
`- **Now:** what I am doing · branch · last commit · waiting for (owner's go, yes push, another core, nothing) · date AEST`

Format for a request:
`- [ ] (from → to) what is needed · why · files · date AEST`

## Release
- **Now:** r55 (story chapter 2, Hà Nội; switch `story_ch2` off by default) deployed at the owner's "Deploy now"; full suite finishing on the merged code; Round T next, as r56 · branch `claude/exciting-feynman-5nxzz8` · 10 Oct AEST
- Halloween decorations start growing about three weeks before 31 Oct: they only reach players once a round is deployed.
- Still to build from the Round R plan (`docs/cores/ROUND-R.md`, Part 2): items 2 to 12 (Concept D layout, child's journey, homes, surprises, shop and wardrobe, money games, the rest of the festival groups, Hội làng times, 5–8 challenges, parent features, voice pack by area); the owner's privacy decisions of 9 Oct; splitting the code into per-core folders (infrastructure round).
- The Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet: ask the owner at every report.

## Front Desk
- **Now:** no chat yet. Front Desk and bug robot merged into main by Release (10 Oct AEST). Bugs go on GitHub Issues (`bug` + core label + `small`/`big`); the bug robot runs every 3 hours (`docs/cores/front-desk.md`) · 10 Oct AEST
- [ ] (Release → Analytics & Infra) for your records: `.github/workflows/bug-fixer.yml` (the bug robot) added by Release on the owner's request; it is yours to look after like the other workflows · 10 Oct AEST

## World
- **Now:** (r55 is now taken by chapter 2: Round T ships as r56) Round T is run by a Release chat on branch `round-t` (see `docs/cores/ROUND-T.md`, Progress); no separate World chat until Round T is merged · 10 Oct AEST
- (nothing open)

## Play
- **Now:** Chapter 2 (Hà Nội) merged by Release into `claude/exciting-feynman-5nxzz8` (last Play commit eb059c4); Studio switch `story_ch2` is off until an admin switches it on or schedules it · waiting for nothing · 10 Oct AEST
- [x] (Play → Release) Done as the allowed one-line fixes, please keep when merging: four new files in `sw.js` FILES (`js/content/chapter2hanoi.js`, `js/content/chapter2props.js`, `js/content/chapter2films.js`, `js/content/chapter2text.js`), and the star-lantern keepsake `lantern_ch2` in `js/myhouse.js` DECOR (without it the keepsake has no place in the house) · 10 Oct AEST
- New brief `tasks/play-festivals.md` (owner's festival rules, 10 Oct AEST): for its own Play chat.
- [ ] (Play → Release) The `solid` check sometimes fails with "desktop and phone maps differ (42122 vs 42152)": it happens on `main` too (1 in 4 runs on d87ab6c, 10 Oct AEST), so it is not from Chapter 2; 30 cells differ between the two windows · `tests/run.mjs` (solid) · 10 Oct AEST
- [x] (Play → Release) Owner's rule, 10 Oct AEST, added to `CLAUDE.md` by this chat at the owner's request: always ask the owner with pop-up questions (clickable choices), never as plain-text questions; please keep it when merging and add it to `HANDOFF.md` §0 · `CLAUDE.md` · 10 Oct AEST
- [ ] (Play → Release) The `story` check now expects Chapter 2's first step after Chapter 1 (it expected an old adventure because there was no Chapter 2 yet); the new `chapter2` check plays Chapter 2 for an under-5 and a big kid · `tests/run.mjs` · 10 Oct AEST
- [ ] (Play → World) Chapter 2 needs real spots in Hà Nội for Tèo, Cô Tam (beside Văn Miếu, with 3 to 5 stone turtles), Bà Năm and the clues by Hồ Gươm; until then `js/content/chapter2hanoi.js` finds free ground off the roads and Hà Nội's main street. Note: the Thê Húc bridge (Hồ Gươm) stands outside Hà Nội's square, about 30 m south-east, and Tháp Rùa (`turtle`) is far away across the valley · 10 Oct AEST
- [ ] (Play → Voice & Audio) New spoken lines to record (none has a child's name): Chapter 2's step names in `js/content/chapters.js` (`ch2`), and all its words in the new `js/content/chapter2text.js` (`STEP_WORDS`, `LINES`, `COUNT` one to five, `TALE`); they live there so the start-up download stays small, so `tools/voice-harvest.mjs` needs to read that file too · 10 Oct AEST
- [ ] (Play → Kid UI) Bà Năm tells Sự tích Hồ Gươm (`hoguom`) in Chapter 2 as a picture story; if your films brief makes it a 3D film, the chapter picks it up by itself · 10 Oct AEST

## Kid UI
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Play → Kid UI) A speech box slides in from the right for 0.3 s: `@keyframes rise` (`css/style.css`) sets `transform` without the `.dialog`'s `translateX(-50%)`, so while it plays the box sits half its width to the right. The `phone` check then sometimes finds its buttons off screen ("button \"Chơi!\" off screen ... on top: dialog.little"); seen 2 times in 5 runs on `core/play` and not on `main` in 2, at the same frame speed, so it is chance, not Chapter 2. Fix idea: a dialog keyframe that keeps `translateX(-50%)` · `css/style.css` · 10 Oct AEST

## Voice & Audio
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → Music.

## Online
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## Studio
- **Now:** Studio review (branch `claude/quirky-meitner-dsxo5i`, last commit ca787a8) merged by Release into the next round · waiting for nothing · 10 Oct AEST
- [x] (Studio → Release, added to HANDOFF) Studio review, 10 Oct AEST, branch `claude/quirky-meitner-dsxo5i`): please add to `HANDOFF.md`'s checks table, `studio` row: "(Studio review) every server message has Vietnamese (`studio/ui/vi.js`); leaving a page with changes not saved asks; save and Publish say what happened; 44 px buttons and boxes on 21 pages on a tablet and a phone; the game's names follow Studio's language; the pages open on a computer, a tablet and a phone". New Studio file `studio/ui/vi.js` (already in `studio/build-exe.sh`; not a game file, so not in `sw.js`). SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).

## Analytics & Infra
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- From Studio (10 Oct AEST): `perf` fails on `main` (d87ab6c) as well: PERF-001 start-up download 3.36 MB, budget 3.2 MB. Not from the Studio review (no game files changed); it fits `tasks/infra-speed.md` (smaller start-up download).

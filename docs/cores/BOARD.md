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
- **Now:** no chat yet. Front Desk and bug robot merged into main by Release (10 Oct AEST). Bugs go on GitHub Issues (`bug` + core label + `small`/`big`); the bug robot runs every 30 minutes (`docs/cores/front-desk.md`) · 10 Oct AEST
- [ ] (Release → Analytics & Infra) for your records: `.github/workflows/bug-fixer.yml` (the bug robot) added by Release on the owner's request; it is yours to look after like the other workflows · 10 Oct AEST

## World
- **Now:** (r55 is now taken by chapter 2: Round T ships as r56) Round T is run by a Release chat on branch `round-t` (see `docs/cores/ROUND-T.md`, Progress); no separate World chat until Round T is merged · 10 Oct AEST
- (nothing open)

## Play
- **Now:** building the festivals brief (`tasks/play-festivals.md`: in season only, children cannot start one, whole places decorated) and story Chapter 3 (Sydney) · `core/play` · from 45feb75 · waiting for nothing · 10 Oct AEST
- [x] (Play → Release) Done as the allowed one-line fixes, please keep when merging: four new files in `sw.js` FILES (`js/content/chapter2hanoi.js`, `js/content/chapter2props.js`, `js/content/chapter2films.js`, `js/content/chapter2text.js`), and the star-lantern keepsake `lantern_ch2` in `js/myhouse.js` DECOR (without it the keepsake has no place in the house) · 10 Oct AEST
- Festivals brief (`tasks/play-festivals.md`) built in this Play chat (owner, 10 Oct AEST): in season only or when an admin schedules a festival (Studio Releases page, `fest_<id>` with a start date and days); children cannot start one; decorations along every street of each place. New check `festivals`; `festcal` now has an admin schedule Halloween instead of a child's tap.
- [ ] (Play → Release) Chapter 3 (Sydney), allowed one-line fixes, please keep when merging: four new files in `sw.js` FILES (`js/content/chapter3sydney.js`, `chapter3props.js`, `chapter3films.js`, `chapter3text.js`) and the keepsake `lantern_ch3` in `js/myhouse.js` DECOR · 10 Oct AEST
- [ ] (Play → World) Chapter 3 needs real spots in Sydney for Chi, Jack and Ruby, and by the Opera House for Bà Năm, the clues (a little ferry, a gum tree, a beach) and the koala's gum tree; until then `js/content/chapter3sydney.js` finds free ground. Note: the Opera House stands on the lake's east beach, far from Sydney's square, and its turn (-90 degrees) is read from the model in the scene · 10 Oct AEST
- [ ] (Play → Voice & Audio) Chapter 3's new spoken lines (none has a child's name): the step names in `js/content/chapters.js` (`ch3`) and everything in `js/content/chapter3text.js` (`STEP_WORDS`, `WORDS`, `LINES`, `TALE`), plus "What does G'day mean?" style questions and "G'day means hello!" lines built from `WORDS` in `js/content/chapter3sydney.js`; and the festival calendar's two new lines in `js/festdecor.js` (`tell`) · 10 Oct AEST
- [ ] (Play → Release) Allowed one-line fixes, please keep when merging: `js/festdecor.js` added to `sw.js` FILES; the calendar's words in `js/ui.js` (Kid UI) changed from "Tap one to visit it now..." to "Tap one to hear about it. Each festival comes by itself on its days..." · 10 Oct AEST
- [ ] (Play → Release, Analytics & Infra) PERF-001 has almost no room left: `main` (45feb75) measures 3.3437 MB before the title against a limit of 3.346 (3.2 + 3 % + 0.05), and sometimes 3.38 (1 run in 3), so `perf` fails on `main` now and then. Play's new code loads after the title (`js/festdecor.js`, chapter 2's places), and Play moved chapter 2's buttons out of `lanterns.js`, so this branch adds about 1 KB · `tests/perf-baseline.json`, `tasks/infra-speed.md` · 10 Oct AEST
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
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- (nothing open)

## Analytics & Infra
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- (nothing open)

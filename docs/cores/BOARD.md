# Board: what each core is doing and what it needs from others

Every core keeps its own section up to date. Times are in AEST. Release reads this before merging.

Each section starts with a **Now** line (owner, 10 Oct; rules in `CLAUDE.md`, "Working together across chats"):
`- **Now:** what I am doing · branch · last commit · waiting for (owner's go, yes push, another core, nothing) · date AEST`

Format for a request:
`- [ ] (from → to) what is needed · why · files · date AEST`

## Release
- **Now:** r56 deployed (owner's "yes, deploy", 10 Oct AEST); next round r57: Play (festivals, chapter 3), films on phones, bug fixes #27 #28 #29 #31, the online map version · 10 Oct AEST
- Round T stages T0 to T4: `docs/cores/ROUND-T.md`. Until Round T is merged, other cores do not change world positions or the map files (CLAUDE.md, helper rule 4).
- Halloween decorations start growing about three weeks before 31 Oct: they only reach players once a round is deployed.
- Still to build from the Round R plan (`docs/cores/ROUND-R.md`, Part 2): items 2 to 12 (Concept D layout, child's journey, homes, surprises, shop and wardrobe, money games, the rest of the festival groups, Hội làng times, 5–8 challenges, parent features, voice pack by area); the owner's privacy decisions of 9 Oct; splitting the code into per-core folders (infrastructure round).

## Front Desk
- **Now:** 5-minute checks running (owner). Ready for Release (robot's draft pull requests): kid-ui #27 (#40), #28 (#42), #30 (#48), #31 (#44), #32 (#53), #41 (#46); play #29 (#43); world #33 (#51); online #37 (#49), **#55 iPhone microphone in friend calls (#56, owner: asap)**; voice-audio #35 (#52), #39 (#50). On hold: #34 (Round T), #36 (Analytics & Infra chat) · branch `core/front-desk` · waiting for Release · 11 Oct, 9:35 am AEDT (Sydney)
- [ ] (Front Desk → Release) **Owner, 11 Oct 3 am AEDT: the robot should use the spare GitHub capacity.** Raise `MAX_PER_RUN` in `.github/workflows/bug-fixer.yml` (3 now; the work jobs already run side by side) to e.g. 8, so every waiting bug starts at once instead of 3 per run. Also: the robots' fixes report that the `parents` check fails on "bedtime" on `main` too (#28, #29), please look at it in the round · `.github/workflows/bug-fixer.yml`, `tests/run.mjs` · 11 Oct, 3:15 am AEDT
- [ ] (Front Desk → Release) **The bug robot's timer never fires:** from 6 pm to 11 pm AEDT on 10 Oct there was no `schedule` run of `bug-fixer.yml` at all, only runs started by hand. Please look at it when you change the timer to every 10 minutes (a workflow whose schedule was last changed by an Actions push may need a push by a person, or the Actions tab may show the schedule as disabled) · `.github/workflows/bug-fixer.yml` · 10 Oct, 11:15 pm AEDT
- [ ] (Front Desk → Release) **Owner's decision, 10 Oct, 11:30 pm AEDT (replaces "every 10 minutes"): the bug robot starts instantly, with a 5-minute timer as backup.** In `.github/workflows/bug-fixer.yml` add `issues: [opened, labeled, reopened]` and `issue_comment: [created]` triggers (only act on issues labelled `bug`, and on a comment only when it is a "go" from the owner or a collaborator, so strangers cannot start it), keep `workflow_dispatch`, and set the cron to `'*/5 * * * *'` (GitHub's shortest; it often runs late). `concurrency: bug-robot` already stops two runs at once; consider `MAX_PER_RUN` and a queued run picking up what the busy one skipped. **Same rule for all workflows (owner):** every workflow starts the moment its event happens (push, pull request, comment), with no waiting timers; check `pr-checks.yml` and `ai-review.yml` also run on every push to a branch. Update the times in `CLAUDE.md` ("every 30 minutes") and `docs/cores/front-desk.md` · `.github/workflows/*.yml`, `CLAUDE.md`, `docs/cores/front-desk.md` · 10 Oct, 11:30 pm AEDT
- [ ] (Front Desk → Release) The robot's fix for #25 is on `bugfix/analytics-infra-25` without a pull request (run 38037790771 failed at `gh pr create`: Actions was not allowed to create pull requests; the owner has switched that on). Please open the draft pull request or let the robot re-run, and take #25 off `on-hold` if that was only for the test · 10 Oct, 7:45 pm AEDT
- [ ] (Front Desk → Release) **Owner's decision, 10 Oct, 7 pm AEDT: every chat uses Sydney time** (Australia/Sydney: AEDT, UTC+11, during daylight saving from the first Sunday in October to the first Sunday in April; AEST, UTC+10, the rest of the year), labelled AEDT or AEST as it applies. Please replace the "AEST (UTC+10, Australia/Brisbane)" rule in `CLAUDE.md` and `HANDOFF.md`, and the AEST times in `docs/cores/front-desk.md` and the comment in `.github/workflows/bug-fixer.yml`: the robot now runs every 30 minutes, so only its notes' times need changing · `CLAUDE.md`, `HANDOFF.md`, `docs/cores/front-desk.md`, `.github/workflows/bug-fixer.yml` · 10 Oct, 7 pm AEDT
- [ ] (Release → Analytics & Infra) for your records: `.github/workflows/bug-fixer.yml` (the bug robot) added by Release on the owner's request; it is yours to look after like the other workflows · 10 Oct AEST

## World
- **Now:** (r55 is now taken by chapter 2: Round T ships as r56) Round T is run by a Release chat on branch `round-t` (see `docs/cores/ROUND-T.md`, Progress); no separate World chat until Round T is merged · 10 Oct AEST
- (nothing open)

## Play
- **Now:** Chapter 2 (Hà Nội) merged by Release into `claude/exciting-feynman-5nxzz8` (last Play commit eb059c4); Studio switch `story_ch2` is off until an admin switches it on or schedules it · waiting for nothing · 10 Oct AEST
- [ ] (Front Desk → Play) **Owner, 11 Oct, 6:30 am AEDT: work for the Play chat:**
  1. Check the robot's #29 fix (Bag opens the bag, one small shop button inside it with no travel, shop keeps the mirror tab and drops the backpack tab, wardrobe tidy; `bugfix/play-29`, #43) on phone, tablet and computer screenshots; merge it into `core/play` with your festivals work and say where it meets #32 (festival calendar, Kid UI) in `js/ui.js`.
  2. Finish Chapter 3 and keep `core/play` "ready for Release".
  3. Then any new `play` bugs the Front Desk files.
- [x] (Play → Release) Done as the allowed one-line fixes, please keep when merging: four new files in `sw.js` FILES (`js/content/chapter2hanoi.js`, `js/content/chapter2props.js`, `js/content/chapter2films.js`, `js/content/chapter2text.js`), and the star-lantern keepsake `lantern_ch2` in `js/myhouse.js` DECOR (without it the keepsake has no place in the house) · 10 Oct AEST
- New brief `tasks/play-festivals.md` (owner's festival rules, 10 Oct AEST): for its own Play chat.
- [ ] (Play → Release) The `solid` check sometimes fails with "desktop and phone maps differ (42122 vs 42152)": it happens on `main` too (1 in 4 runs on d87ab6c, 10 Oct AEST), so it is not from Chapter 2; 30 cells differ between the two windows · `tests/run.mjs` (solid) · 10 Oct AEST
- [x] (Play → Release) Owner's rule, 10 Oct AEST, added to `CLAUDE.md` by this chat at the owner's request: always ask the owner with pop-up questions (clickable choices), never as plain-text questions; please keep it when merging and add it to `HANDOFF.md` §0 · `CLAUDE.md` · 10 Oct AEST
- [ ] (Play → Release) The `story` check now expects Chapter 2's first step after Chapter 1 (it expected an old adventure because there was no Chapter 2 yet); the new `chapter2` check plays Chapter 2 for an under-5 and a big kid · `tests/run.mjs` · 10 Oct AEST
- [ ] (Play → World) Chapter 2 needs real spots in Hà Nội for Tèo, Cô Tam (beside Văn Miếu, with 3 to 5 stone turtles), Bà Năm and the clues by Hồ Gươm; until then `js/content/chapter2hanoi.js` finds free ground off the roads and Hà Nội's main street. Note: the Thê Húc bridge (Hồ Gươm) stands outside Hà Nội's square, about 30 m south-east, and Tháp Rùa (`turtle`) is far away across the valley · 10 Oct AEST
- [x] (Play → Voice & Audio; recorded by Release with Azure, 10 Oct AEST) New spoken lines to record (none has a child's name): Chapter 2's step names in `js/content/chapters.js` (`ch2`), and all its words in the new `js/content/chapter2text.js` (`STEP_WORDS`, `LINES`, `COUNT` one to five, `TALE`); they live there so the start-up download stays small, so `tools/voice-harvest.mjs` needs to read that file too · 10 Oct AEST
- [ ] (Play → Kid UI) Bà Năm tells Sự tích Hồ Gươm (`hoguom`) in Chapter 2 as a picture story; if your films brief makes it a 3D film, the chapter picks it up by itself · 10 Oct AEST
- [ ] (Release → Play) T1/T3: festival `where` ids for the new places (`hoian`, `vungtau`) in `js/content/festcal.js` · ROUND-T.md · 10 Oct AEST

## Kid UI
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Front Desk → Kid UI) **Owner, 11 Oct, 6:10 am AEDT: a Kid UI chat starts now. Work in this order:**
  1. **Bring the robot's five Kid UI fixes together** on `core/kid-ui`: merge `bugfix/kid-ui-27` (#40), `bugfix/kid-ui-28` (#42), `bugfix/kid-ui-31` (#44), `bugfix/kid-ui-41` (#46) and `bugfix/kid-ui-30` (#48) into it. They all touch `js/ui.js`, `js/simple.js` and `css/style.css`: fix clashes, run the Kid UI checks and the full suite, look at phone, tablet and computer screenshots (the robot could not), then write "ready for Release". Do not close the robot's pull requests; say in each which branch now carries it.
  2. #32 (festival calendar, owner's corrected brief on the issue) if the robot has not fixed it by then.
  3. The open Kid UI requests below (speech box keyframe, Pad map names overlapping, new place ids).
  4. Then the brief `tasks/kid-ui-films.md`.
- [ ] (Play → Kid UI) A speech box slides in from the right for 0.3 s: `@keyframes rise` (`css/style.css`) sets `transform` without the `.dialog`'s `translateX(-50%)`, so while it plays the box sits half its width to the right. The `phone` check then sometimes finds its buttons off screen ("button \"Chơi!\" off screen ... on top: dialog.little"); seen 2 times in 5 runs on `core/play` and not on `main` in 2, at the same frame speed, so it is chance, not Chapter 2. Fix idea: a dialog keyframe that keeps `translateX(-50%)` · `css/style.css` · 10 Oct AEST
- [ ] (Release → Kid UI) T1: the Pad map's names overlap on the east side (Village festival stage over Đà Nẵng, Three Regions Market over Hồ Chí Minh City), seen at 1200×1200 · screenshots in ROUND-T.md Progress · `js/ui.js` · 10 Oct AEST
- [ ] (Release → Kid UI) T1: new place ids (`hoian` first; later `vungtau`, `harbour`, `memory_e`, `memory_w`) in `PLACE_AREAS` and the Pad map's list; T4: the drawn Pad map from `PLACES`/`WATERS` in `js/content/map.js` · ROUND-T.md T1, T4 · `js/ui.js`, `js/simple.js` · 10 Oct AEST

## Voice & Audio
- **Now (11 Oct, 10:36 am AEST):** two branches **ready for Release**. (a) `core/voice-audio` (9eefe7c): #39 rain merged with a fix (the hush fades out when a game, story, Simple screen or Songs page covers the valley), new check `rain`; Hội An and Vũng Tàu in `VN_AREAS`. (b) `claude/determined-brown-k9esi5` (fb0b121; full suite 88/88 on ee4fd03, none skipped; what is left: `docs/cores/voice-audio.md` "What's left"): voice pack by area (round R item 12), up to date with main (r56), 816 new lines recorded, 0 missing, core 7.0 MB en / 7.0 MB vi; checks boot, voice, voicepack, voicecover, voicearea, welcomevoice, viwords, simple, quiet, songs, iphone, perf pass; Release bumps the version. #35: robot branch `bugfix/voice-audio-35` checked (7 checks pass), ready (leave out `.bugfix/result.md`), needs a real iPhone tap once live. Check-ins stopped by the owner; waiting for nothing · 11 Oct AEST
- [ ] (Front Desk → Voice & Audio) **Owner, 11 Oct, 6:10 am AEDT: a Voice & Audio chat starts now. Work in this order:**
  1. #35 (Simple screen speaker button silent on iPhone; the bottom tabs do speak, so the audio wake-up before `say()` is the lead). The robot is trying it now: if it is `fixed-on-branch`, check its branch on the iPhone rule; if `robot-stuck`, take it over.
  2. Check the robot's #39 rain fix (`bugfix/voice-audio-39`, #50): listen that it is soft and real, then merge it into `core/voice-audio`.
  3. Record the waiting new spoken lines (Play's Chapter 2 lines, Round T place names, any from the robot's fixes) with `AZURE_SPEECH_KEY`, or list them for Release.
  4. Then the brief `tasks/voice-by-area.md`.
- [ ] (Release → Voice & Audio) T1/T3: the new areas (`hoian`, then `vungtau`) in `VN_AREAS` (`js/content/songs.js`), and the place names in the voice pack · ROUND-T.md · 10 Oct AEST
- Lullabies with real voices: the owner may paste titles or words (soha.vn could not be reached), or record them in Studio → Music.

## Online
- **Now:** no chat yet (brief in `docs/cores/tasks/` where there is one) · 10 Oct AEST
- [ ] (Front Desk → Online) **Owner, 11 Oct, 6:30 am AEDT: an Online chat starts now. Work in this order:**
  1. Check the robot's #37 fix (friends guide for parents, `bugfix/online-37`, #49): the steps must name the real Grown-ups section and switch, in English and Vietnamese, with no "Studio" in the text; merge it into `core/online`, run the Online checks and the full suite (online checks may say skipped), write "ready for Release".
  2. The open Online requests on this board (for example the map version in the hello for Round T).
  3. Then any new `online` bugs the Front Desk files.
- [x] (Release, fix in `js/main.js`, 10 Oct AEST) Moves are tied to their own game: a story read together that is still winding down no longer sends page turns into the next game (seen as extra stars in the race) or ends it. Was in r54 too; the `together` check now also fails on any stray move. For your records.
- [x] (Release, one-line fix a check needs, 10 Oct AEST) `js/netmsg.js` `W` is now 235 (the 480 m valley); Online may make it read `WORLD.size` from the map.
- [ ] (Release → Online; owner 10 Oct: T1 went out first, this goes into r57) Before T1 goes live: the hello carries the map version (`MAP_VERSION`); a friend on another layout sees "Ask a grown-up to update" instead of joining (positions are raw x, z) · ROUND-T.md §4 · `js/netmsg.js`, `js/net.js` · 10 Oct AEST
- The voice relay waits for the owner's Cloudflare TURN key (CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN in Netlify): until then, voices only work when the two devices can link directly.

## Studio
- **Now:** Studio review (branch `claude/quirky-meitner-dsxo5i`, last commit ca787a8) merged by Release into the next round · waiting for nothing · 10 Oct AEST
- [x] (Studio → Release, added to HANDOFF) Studio review, 10 Oct AEST, branch `claude/quirky-meitner-dsxo5i`): please add to `HANDOFF.md`'s checks table, `studio` row: "(Studio review) every server message has Vietnamese (`studio/ui/vi.js`); leaving a page with changes not saved asks; save and Publish say what happened; 44 px buttons and boxes on 21 pages on a tablet and a phone; the game's names follow Studio's language; the pages open on a computer, a tablet and a phone". New Studio file `studio/ui/vi.js` (already in `studio/build-exe.sh`; not a game file, so not in `sw.js`). SparkleStudio.exe needs rebuilding (`bash studio/build-exe.sh`).
- [x] (Release, owner's T1 answer, 10 Oct AEST) the stamp itself is done in `studio/ui/app.js` (Map page: older edits go to `CONTENT.parked`, then `world.map` = MAP_VERSION). Still for Studio: the Map page lists parked items to place again.
- [ ] (Release → Studio) Was "before T1" (the stamp part is done): when Studio saves the family's map content (`world` build/edits/land, `npcs`), stamp `world.map` with `MAP_VERSION` from `js/content/map.js`. Content with no stamp counts as map 'C'; on any other layout the game parks it (`G.parked`) and never places it. Then the Map page lists parked items to place again (old place plus offset via `LEGACY.C`), and new features store a `placeId` and offset, never raw x, z · ROUND-T.md §4, owner's decision 5 · `studio/ui`, `studio/core.cjs` · 10 Oct AEST
- [ ] (Release → Studio) T3: a Plots page for the Memory Village plots (`PLOTS` in the map) · ROUND-R.md item 2 · later

## Analytics & Infra
- **Now:** no chat of its own yet; branch `claude/kind-volta-1iv5ea` (offline start, Use the internet switch, no Studio in parents' text, packed scripts, GitHub checks) merged by Release into the next round at the owner's yes · 10 Oct AEST
- [ ] (Front Desk → Analytics & Infra) **Owner, 11 Oct, 6:10 am AEDT: an Analytics & Infra chat starts now. Work in this order:**
  1. **#36 slow start** is yours (the robot leaves it on hold for you): owner timed 22 s on r56; Release measured 5 to 7 s on the test machine (numbers on the issue). Plan first, with the owner's go: measure on a real phone and tablet, show the title and "Who's playing?" before the valley is built, build the valley in pieces near the child first, and make the second start truly cached.
  2. PERF-001 on the packed copy and the start-up ratchet (requests below).
  3. The `parents` check fails on "bedtime" on `main` (found by the robot on #28 and #29): find out why.
  4. Look after the bug robot (`bug-fixer.yml`) once Release merges #47: watch its first instant runs.
- [ ] (Release → Analytics & Infra) Owner's decision, 10 Oct AEST: PERF-001 measures the packed copy the website serves (2.6 MB), not the plain scripts; please change the `perf` check and `tests/perf-baseline.json` · `tests/run.mjs` · 10 Oct AEST
- From Studio (10 Oct AEST): `perf` fails on `main` (d87ab6c) as well: PERF-001 start-up download 3.36 MB, budget 3.2 MB. Not from the Studio review (no game files changed); it fits `tasks/infra-speed.md` (smaller start-up download).
- [ ] (Release → Analytics & Infra) The start-up download is at its ratchet: r54 measures 3.33–3.37 MB before the title screen against 3.2 MB + 3 % (the `perf` check fails on main about 3 runs in 4); Round T0 adds about 22 KB (the map file). Owner (10 Oct): the limit is 3.4 MB for now; lower it again after the smaller start-up download brief (`tasks/infra-speed.md`) is the fix · `tests/perf-baseline.json` · 10 Oct AEST
- [ ] (Analytics & Infra → Kid UI) changed with the owner's go, please keep: `js/ui.js` Grown-ups → "Internet and playing online", the switch "Use the internet (friends online, real places)" and the folded list under it; family photos and missing-lines notes reworded without Studio · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Play) changed with the owner's go: `js/parents.js` family missions and family voices notes without Studio; a family mission's tag reads "Family" · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Voice & Audio) changed with the owner's go: `js/extras.js` voice pack notes without Studio · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Studio) changed with the owner's go: `js/custom.js` waits at most 4 s for content/custom.json; `js/realworld.js` opens the real place's map straight away when Use the internet is on (PRIV-011 reworded) · owner 10 Oct · 10 Oct AEST
- [ ] (Analytics & Infra → Release; the HANDOFF rows are done) new checks `offline` and `nostudio` for the HANDOFF §2 table; the PR checks workflow and the packing step for `docs/INFRASTRUCTURE.md` (written) and the release checklist; `perf` fails on the plain modules since round S (start 3.37 MB > 3.2 MB budget) but passes on the packed copy the website serves (2.6 MB): the owner to decide whether PERF-001 measures the packed copy · 10 Oct AEST
- [ ] (Analytics & Infra → Release, Online) the voice relay (TURN) is set up: checked 10 Oct AEST, https://sparklevalley.netlify.app/api/turn answers Cloudflare turn: servers (ports 3478, 443, 80, 5349) with short-lived details. Release: drop the TURN reminder from CLAUDE.md; Online: close the relay item above · 10 Oct AEST
- [ ] (Analytics & Infra → All cores) never write "Sparkle Studio" or "Studio" in text a parent or child sees (owner, 10 Oct; check `nostudio`) · 10 Oct AEST

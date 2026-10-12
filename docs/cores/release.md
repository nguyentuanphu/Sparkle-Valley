# Release core

**You bring the cores' work together and hand it to the owner:** merge the core branches, run the full regression
suite, bump the version, record new voices, update the docs, build the packages, report, and push and deploy only
when the owner says so.

## You own
- Merging `core/*` branches into the round branch; `CLAUDE.md`, `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/BOARD.md`
- `js/build.js` (BUILD), `sw.js` VERSION and FILES, `studio/version.json`
- `tests/run.mjs` (the runner) and `tests/harness.mjs`; `tests/ui-contract.json`, `tests/perf-baseline.json`, `tests/arch-baseline.json`
- Packages: `tools/make-bundle.sh`, `tools/bundle-parts.py`, `studio/build-exe.sh` (run)

## A round, step by step
1. Read `BOARD.md`; merge each ready core branch and each bug robot pull request (`bugfix/*` branches, label
   `fixed-on-branch`: read the fix and its checks first). Every pull request into `main` shows two marks: **Quick checks**
   and **AI review**; fix (or send back) every problem the AI review lists before merging; fix conflicts with the core's owner on the board.
2. Bump r-number in `js/build.js`, `sw.js` VERSION and `studio/version.json`.
3. Record new voices (`tools/make-voice-pack.mjs --engine azure`, see Voice & Audio).
4. Run the **full suite** (`node run.mjs`, about an hour; one browser run at a time). Fix or send back every failure.
5. Update `HANDOFF.md` (round history and checks table) and `docs/ARCHITECTURE.md` §9 if rules changed (`node tools/rules-from-doc.mjs`).
6. Packages: the Netlify zip (`git archive --format=zip -o <dir>/sparkle-valley-netlify-rNN-game.zip HEAD index.html sw.js manifest.webmanifest netlify.toml css js fonts icons vendor videos content`). **No local bundle** (owner, 11 Oct: the offline files are on GitHub and the Google Drive mirror). The Studio exe when `studio/` changed (`bash studio/build-exe.sh`).
7. Report to the owner: what changed (plain words), how it was tested, the Netlify zip, times in Sydney time (AEDT/AEST).
8. Ask one pop-up question per round: “yes, deploy”. It covers pushing the release branch and merging it into main
   (which makes Netlify publish), for that round only (owner, 10 Oct: Release is the master release; helper chats push
   their own branches without asking).
9. (Done 10 Oct AEST: the Google Drive mirror and the voice relay are set up; no more reminders.)
10. After deploying, check the live deploy in Netlify and say when it went live (AEST).

## Hard rules (§9.1)
PROC-001…006 (read their wording in §9.1): plan first; nothing reaches main without the owner's “yes, deploy” (one per
round); the full suite green before a report; times in AEST; no keys or personal data in the repository.

## Checks you run
All of them (`node run.mjs`), plus `types unit arch rules` on every merge.

## Owner's decisions
- **Bug robot (10 Oct AEST):** small bugs filed by the Front Desk are fixed and pushed by `.github/workflows/bug-fixer.yml`
  to `bugfix/<core>-<issue>` branches with draft pull requests, without asking; big bugs wait for the owner's "go". Release
  merges those pull requests in a round like any core branch (they close their issue), and deploying still needs
  "yes, deploy". Robot runs use the Claude account in the GitHub secret `CLAUDE_CODE_OAUTH_TOKEN` or
  `CLAUDE_CODE_OAUTH_TOKEN_GIVEAWAY` (backup: `CLAUDE_CODE_OAUTH_TOKEN_BACKUP`). The robot starts the moment a bug
  is filed (5-minute backup timer; owner, 10 Oct).
- 10 Oct AEST: Release is the master release of all work. Helper chats push their own branches without asking; Release collects every branch, merges, runs the full suite, reports, and asks one pop-up "yes, deploy" per round, which covers pushing and merging into `main`.
- 10 Oct AEST: every question to the owner is a pop-up question with clickable choices (`CLAUDE.md`, HANDOFF rule 19).
- 10 Oct AEST: Release checks every branch once an hour (routine "Release: hourly branch collection", about 26 minutes past each hour): fetch, read each branch's Now line, merge the core branches marked "ready for Release" into the Release branch locally and run `types unit arch rules`; never pushes or merges into main without the round's "yes, deploy". `studio-draft` and old `claude/*` branches are merged only after asking the owner.
- 10 Oct AEST: no double suite runs. Release reruns the full suite only when the merged code differs from what a helper tested (two or more branches merged, or Release changed code itself); otherwise it runs the quick checks (`types unit arch rules ground studio`) and relies on the helper's recorded full-suite result (commit id and every check, in that core's progress notes).
- 10 Oct AEST: r55 (chapter 2) deployed at the owner's "Deploy now" with the full suite still running (2 of 81 checks done, both passed); the rest reported when it finished.
- (10 Oct AEST) The start-up download ratchet (`tests/perf-baseline.json` startMB) is 3.4 MB for now; lower it again when the smaller start-up download lands (Analytics & Infra).
- (10 Oct AEST) Round T0: "yes, push"; not deployed yet. (Planned as r55; r55 went to chapter 2, so T0 and T1 go out together as r56.)
- (10 Oct AEST) T1 from the Concept D map (`docs/concept-d/index.html`): a bigger home island (about 110 x 130 m) so Ông Cú, Phố Hai Quê and Sunny Farm fit; Bắc Ninh north-east of Hà Nội, as drawn; the ring road in T1; asphalt roads 6.4 m (rule R1 / ROAD-001 changed); Release makes the one Studio stamp change (`world.map`) in T1, noted on the board.
- **Audit on every pull request (10 Oct AEST):** `.github/workflows/pr-checks.yml` runs the quick checks
  (`rules unit types arch emoji noemoji preload boot`, free GitHub minutes; `phone` stays in the full suite,
  too slow on GitHub's machines) and `.github/workflows/ai-review.yml`
  has a second Claude review the changes against the rules and post one comment (Claude usage, same account as the bug
  robot). The review runs when a pull request is opened, reopened or marked ready, and again when the label `ai-review`
  is added; not on every push. The round's pull request into `main` is reviewed too, before "yes, deploy".
- 10 Oct AEST: `claude/kind-volta-1iv5ea` (offline start, Use the internet switch, packed start-up scripts on Netlify, GitHub checks) merged into the next round at the owner's yes.
- 10 Oct AEST (r56 report): "yes, deploy" for r56. T1 goes out before the online map-version check (online play is off until a grown-up turns it on; devices update within days); the map version in the online hello goes into r57.
- 10 Oct AEST: PERF-001 (start-up download) should measure the packed copy the website serves (2.6 MB), not the plain scripts; Analytics & Infra changes the check.
- 10 Oct AEST: the Google Drive mirror and the voice relay (TURN) are done; stop asking about them.
- **Tidy streets (11 Oct AEDT):** stalls, kiosks and sellers follow the Concept D street rules (one market row per place,
  one side of the main street, facing it, spacing rules checked by `validate.js`); stage T1b in `ROUND-T.md`, built by the
  robot chat after r57, before T2.
- **No local bundle (11 Oct AEDT):** the round report gives the Netlify zip but no local bundle; the owner gets the offline
  files from GitHub and the Google Drive mirror.
- 11 Oct AEDT: Release collects every 5 minutes (session job, hourly routine as backup): merges every branch marked "ready for Release" and the robot's bugfix branches whose issue says fixed-on-branch (Kid UI ones together), runs the full suite, looks at phone, tablet and computer screenshots, then reports and asks one "yes, deploy". Messages to the owner only for a round report, a yes-deploy question or a blocker. Times in Sydney time.
- 11 Oct AEDT: two Release chats: the robot chat runs r57 (robot fixes #27 #28 #29 #31 #41 and the robot workflows); this round chat runs r58 on top of it.
- 11 Oct, 9:30 am AEDT: owner: hold both r57 and r58 for further advice; Release keeps collecting and testing locally, no deploy.

- (10 Oct AEST) Round T1 (r56): "yes, push" (pull request #21, with T0); deploy "not yet". The Google Drive mirror and the voice relay (TURN): neither set up yet.
- (10 Oct AEST) T2 "go", with: Chùa Cầu is a footbridge for walking beside the Vietnam road (the road crosses the Hội An canal on a plain bridge next to it); the Brisbane River, the Yarra and the Murray join the main river (plain bridges where they pass the ring road); road colours as tinted asphalt (red Vietnam, orange Australia, purple to the mountains, blue along the coast), white lines kept.
- (10 Oct AEST, evening) The start-up speed ratchet (`worldMs` in `tests/perf-baseline.json`): re-measure on today's slower test machine and set it to r56's median (6600 ms; ten second starts each side by side, T2 (r58) median 6850 ms), still +25 % allowed.
- (11 Oct AEST) Round T2 (built as r57, full suite 86/86): push "not yet"; deploy "not yet". The Google Drive mirror and the voice relay (TURN): both set up (no more reminders).
- (11 Oct AEST) "Yes, push" for T2. The version clash with the Play round: the other round keeps r57, T2 becomes r58. T3 is one release (built in two steps: Vũng Tàu and the mountains, then the plots), "go with the plan".
- (11 Oct AEST) r59 (T3, full suite 90/90): "yes, deploy" for T2 (r58) and T3 (r59) together.
- (11 Oct AEST) The next release is r60 (whichever round ships next, Round T4 or the Play round); r57 is no longer kept for the Play round.
- (11 Oct AEST) r60 is Round T4a (World: road surfaces by region, water colours and foam, reeds, footsteps), built by Release; T4b (signposts, name tags, the drawn Pad map) goes to a separate Kid UI chat (brief `docs/cores/tasks/kid-ui-t4b.md`). Vietnam's roads get yellow centre dashes (Australia stays white, with kerbs); footsteps use the game's own sound maker for now (Voice & Audio may replace them).
- 11 Oct AEDT: owner: r57 and r58 reach the game inside r60 (r59 already live); "yes, deploy" for r60 as soon as its full suite is green (Release fixes failures first, then deploys without a second question).
- 11 Oct, about 5:25 pm AEDT: **T1b "go"** with the plan as shown: rules first, one market row per place, the ice-cream van parks in a bay at the end of Aussie Corner's row and Uncle Robbo's sausage sizzle joins the row (Recommended option); the round is r61.
- 12 Oct AEDT: Round U work is pushed to `claude/peaceful-hopper-un7oym` as a backup after each part (owner: "yes, back it up"); main and the website stay on r61 until "yes, deploy".
- 11 Oct AEDT (evening): **"go" for Round U** as planned in `docs/cores/ROUND-U.md` (r62, one release; the Simple screen's sections replace the bug #30 decision "one long road per tab"; bus fares, under-5s and children without coins ride free).
- 11 Oct, about 7:45 pm AEDT: next round (r62) = **all 13 items** plus the day plan for villagers, bus stops with a timetable, picture signposts, Ông Cú as guide, and the extras weather and night, job pictures, "Where is…?" sparkles, animals with homes, sellers remember you, a village job board, price pictures and change counted out loud. **All in one release** (one report, one "yes, deploy" at the end). Plan first, then "go".
- 11 Oct AEDT (evening): **"yes, deploy" for r61** (T1b tidy streets; full suite 97/98, `startup` red as on r60).
- 11 Oct, about 6:30 pm AEDT: **finish T1b (r61) first**; then **one round in this chat for the owner's new list** (plan and "go" first): (1) top-bar and Backpack coin/orb/Leafy chips say what they are on hover or tap; (2) the Backpack's tab row scrolls by finger and mouse; (3) the Map scrolls on a tablet; (4) every line in the chosen language (Grandma Huệ spoke Vietnamese in English; check everything); (5) sound and voice switches easy to find; (6) one gate per village; (7) no weeds inside roads, no height steps where roads and bridges join; (8) bought clothes and accessories show in the wear area until worn, clothes for girls and boys; (9) the Simple screen's games, stories and places as separate sections; (10) every villager talks, with a fact or a saying; (11) a guide to upgrading and decorating the house; (12) every vehicle can be ridden, buses and trams take a fare. (13, owner, same evening) Family missions, the week's note and bedtime (Grown-ups, `js/parents.js`): 15 ready-made family tasks to choose from (both languages, things to do together for real), and a short guide for grown-ups and children that says this is family play and what to do. Also in the plan: a day plan for villagers, bus stops with a timetable, picture signposts, Ông Cú as a guide, and more ideas from Release for the owner to choose.
- 11 Oct AEDT: r60 deployed with the `startup` check red (96/97 green): the slower start came with r59 (Round T) and the bigger voice manifest with voice by area; World and Voice & Audio fix them (board). Owner's choice.
- (11 Oct AEDT) r61 (T4a): no Netlify zip this round (owner); T4a is r61 because r60 went out from the other Release chat.
- (11 Oct AEDT) r61 report (full suite 98/99, `startup` red as on main r60): owner said "push": round-t pushed to GitHub; not merged into main or deployed (no "yes, deploy" yet).
- (11 Oct AEDT) r61 went live from the other Release chat (T1b) at 7:35 pm AEDT: T4a becomes r62, main merged in, full suite again before "yes, deploy" (owner).
- (11 Oct AEDT, 10:45 pm) r62 (T4a) report, full suite 99/100 (`startup` red as on main r61): owner said "not yet" to deploy; round-t stays pushed, nothing merged into main.
- (11 Oct AEDT, 11:57 pm) "Yes, deploy" for r62 (Round T4a): round-t merged into main by pull request.
- (12 Oct AEDT, 12:05 am) r62 live on Netlify (pull request #62). The AI review did not finish twice (out of usage); the owner said merge without it.
- (12 Oct AEDT, about 2:30 am) Owner to the Play chat: "push, check other branches and deploy altogether", then "this chat does it now" (act as Release for one round). r63 = live r62 + core/play, core/kid-ui, core/voice-audio, core/studio, core/online on `claude/clever-faraday-w5vqs9`; full suite 103/104 (`startup` red, as on live r62).
- (12 Oct AEDT, 5:42 AM) "Yes, deploy" for r63 (owner, pop-up question to the Play chat acting as Release): `claude/clever-faraday-w5vqs9` merged into main by pull request.
- (12 Oct AEDT) r63 bug round (owner, from iPhone screenshots), fixed by Release in this chat: remove the Pad map's Back/Next buttons; the Hà Nội gate is blocked; the voice bar goes past 100%; friends' games are children only (no computer players, e.g. Tiến Lên) and the children choose the level (Easy/Medium/Hard) and Caro's board size (9, 13, 15, 19); the microphone starts off on every device and the iPhone microphone does not react to a tap.
- (12 Oct AEDT) r63 went live from the other Release chat first, so this bug round is r64 (as the owner chose for T4a).
- (12 Oct AEDT) Battery (owner: phone hot, MacBook loses about 10 % at once): after r64, one round with all three: quick savers (computers capped, no "high-performance" chip, sharpness capped at 1.5x, a slower title screen, no drawing when nothing moves, voice downloads spread out), fewer draws (merge the small objects toward the 250 budget), and battery and frame statistics (frames drawn, frame time, draws, battery where the browser tells it) shown in Analytics.
- (12 Oct AEDT, 9:00 am) "Yes, deploy" for r64 (the iPhone bug round): round-t merged into main by pull request.
- (12 Oct AEDT, 9:03 am) r64 live on Netlify (pull request #65; AI review: looks fine).
- (12 Oct AEDT) Releases rollout: keep everything switched on (no weekly schedule).
- (12 Oct AEDT) r65 is released by the Kid UI chat as temporary Release (one combined full suite). The battery round, the three Studio fixes and the daily voice job go to new helper chats (briefs in docs/cores/tasks/battery.md, studio-r65.md, voice-daily.md); each pushes its branch ready for Release and joins that combined suite or the round after.
- (12 Oct AEDT, about 12:45 pm) The Release chat is out of usage for a few hours: the owner asked the Kid UI chat to act as Release for r65 ("Bắt đầu ngay"): main r64 + `core/kid-ui`, `core/play-reading`, `core/voice-audio`, `core/play`, merged on `claude/affectionate-wozniak-2jek7i`, full suite before the "yes, deploy" pop-up (the owner asked why the suite again: the branches were each tested alone and share `js/ui.js`, `js/main.js`, `tests/run.mjs`, `js/content/releases.js` and the voice lists).
- (12 Oct AEDT, about 2:00 pm) Owner: "combine and merge everything on this round": r65 also takes Round U as it stands (`claude/peaceful-hopper-un7oym`, not marked ready, still being built) and the ad videos (`claude/exciting-feynman-5nxzz8`, about 342 MB in `marketing/`, published by Netlify with the site because `publish = "."`). Round U's own signposts (a second copy of T4b, live since r63) dropped with its duplicate `signs` check; its join rule renumbered ROAD-017 (ROAD-015 and 016 were taken).
- 11 Oct AEDT (owner): every video always comes with a thumbnail of what it is about (a cover image, also built into the mp4); the game's website is sparklevalley.au, used in every ad, caption and link.
- (12 Oct AEDT, about 2:10 pm) Owner to the second Play chat (reading games): "if you have full suited, you can deploy"; then **"Yes, deploy" for r65** (pop-up question): live r64 + `core/play-reading` (ten reading games, `readingTrial` off), merged into main by pull request. Full suite on the branch with r64 merged in: 105/108 (`startup` title time as on main; `perf` once over then green; `reading` cut off by the run's time limit, then green on its own); after the version bump `boot offline contract unit nostudio` 5/5.

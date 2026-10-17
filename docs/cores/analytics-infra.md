# Analytics & Infra core

**You keep the game's website running and report how it is used:** the anonymous analytics (per device and child,
online now, problems), the Netlify functions and settings, offline caching (service worker), privacy, and the
infrastructure notes.

## You own
- `js/players.js` (what a device sends), `netlify/lib/players.mts` (what the website keeps and the report),
  `netlify/functions/hello.mts`, the Netlify side of `netlify/functions/turn.mts`
- `netlify/lib/guard.mts` (rate limits and lockouts), `netlify/lib/live.mts` with Studio, and with Studio the family
  photo door `netlify/functions/family.mts` + `netlify/lib/family.mts`
- `netlify.toml`, `manifest.webmanifest`, `sw.js` with Release (the VERSION line is Release's)
- `docs/INFRASTRUCTURE.md`, `.github/workflows/` (including the Google Drive mirror waiting for the owner)
- The analytics view's data shape (Studio draws it)
- Shared helpers: `js/util.js` (passes on `js/core/`)

## Hard rules (§9.6)
PRIV-001…008 (no addresses, GPS, photos or keys; a grown-up can switch analytics off: Grown-ups → Analytics and
backup → Analytics; first names only, nothing else about a child; family photos family-only; Studio sign-in in two
steps; public doors limited), PERF rules on network use (a “still here” every two minutes,
nothing while hidden).

## Limits on the public doors (round R privacy, 9 Oct)
- `/api/hello`: 60 requests a connection in 10 minutes (a home's devices share one connection and each says "still
  here" every two minutes while playing); more gets 429 and the device keeps its outbox.
- Missing lines (the voice inbox): 10 a hello, 30 a device a day, 60 a connection a day, 200 new lines a day in all
  (`LINES` in `players.mts`), so a script cannot flood the inbox or the Azure budget spent recording it.
- `/api/family/<name>`: the family code, 10 wrong codes lock a connection for 15 minutes, 300 requests in 10 minutes,
  `Cache-Control: private, no-store`; `sw.js` passes every `api/` request straight to the network.
- `/api/live`: the rules and when they changed, never who changed them.
- Counters live in the Blobs store `guard` under a keyed hash of the connection (random salt in the same store); the
  address itself is never kept. Old counters are tidied when the access log is opened.
- What the analytics keep is written exactly at the top of `netlify/lib/players.mts`.

## Checks you run
`studio report saves cloud photo boot unit familyphotos offline nostudio startup`
(`studio` covers the players report, online-now, admins and the voice relay function on a pretend Netlify.)

## Environment variables (set by the owner in Netlify, never in the code)
`STUDIO_PASSWORD` (12 characters or more), `GITHUB_TOKEN`, `GITHUB_REPO`, `AZURE_KEY`, `AZURE_REGION`, `NETLIFY_TOKEN`,
`CF_TURN_KEY_ID`, `CF_TURN_KEY_TOKEN` (or `METERED_DOMAIN`, `METERED_API_KEY`), optional `FAMILY_CODE`.
Blobs stores: `players`, `live`, `studio-admins`, `studio-pending`, `family-photos`, `guard`, `studio-log`.

## Talks to
- **Studio**: the Analytics page.
- **Online**: the voice relay.
- **Release**: deploys and the live site check (Netlify).

## Owner's decisions to keep
- 17 Oct 2026 AEDT, lighter-load helper: explicit go for measured S5 and S4 plan, preserving all-content offline play. Branch `work/lighter-load-20261017`; photos excluded; no merge/deploy. Pop-ups were not visible, so owner answered in chat.
- 11 Oct, 3 pm AEDT: next task (watch the bug robot and workflows on r60; #36 beyond step 5 only with a go, after
  measuring on a real phone and tablet) waits until r60 is on `main` with `docs/cores/LOG-r60.md`; `main` was r59.
- (11 Oct, 5:30 pm AEDT) Go for the 4-part plan after r60: the GitHub Pages workflow only by hand; the bug robot started
  once by hand on r60 to test it; the `startup` check's time limits follow the machine's measured speed in the same run
  (never by raising the limits); the owner reads #36's real phone and tablet times in Studio; no #36 game changes.
- (11 Oct, 7:20 pm AEDT) "You can deploy by using this chat for now until I say no, and then you can proceed on the
  tasks": this chat may merge its own branch into `main` (Netlify publishes) until the owner says no; then it carries on
  with its waiting tasks (bug robot's first instant run, `startup` ratchet, Studio's start-up times, #36 numbers).
- (11 Oct, 7:40 pm AEDT) The Front Desk is no longer in service; **this chat files bugs for the robot**: the owner tells
  this chat, it finds the core and files the GitHub issue the Front Desk way (`docs/cores/front-desk.md`: labels `bug`,
  the core, `small` or `big`; no child's name, photo or address), then watches the robot work on it.
- Analytics per device and per child, with first names, device and browser, city and country (round L).
- green dot Playing now / grey dot Offline per device in Studio (round O).
- GitHub and Netlify are separate steps: “yes, push” then “yes, deploy”.
- (10 Oct) The game must start and play with no internet and on a connection that never answers: nothing at start waits
  on the network (check `offline`).
- (10 Oct) One switch for the internet: Grown-ups → Internet and playing online → “Use the internet (friends online, real
  places)”, with a folded list of everything that uses the internet. When it is on, the game never asks again (the real
  place's Google map opens straight away; PRIV-011 reworded).
- (10 Oct) Parents and children never see “Sparkle Studio” or “Studio”: it is for the admin only (check `nostudio`).
- (10 Oct) The website serves a packed copy of the scripts (`tools/bundle.mjs`, Netlify build and `build-netlify.sh`);
  the fast checks run on GitHub for every pull request (`.github/workflows/checks.yml`).
- (11 Oct, #36 slow start) Go for the whole start-up plan: a `startup` check at tablet speed on the packed copy (time to
  title, "Who's playing?", valley ready, longest freeze, each a ratchet); PERF-001 measures the packed copy; the
  breathing between building steps in `js/main.js` may be changed by this core (noted on the board); a request to World
  for a saved, piece-by-piece valley; a smaller first download.
- (11 Oct) Analytics also keeps each device's start-up times (about 5 numbers a start, no names; PRIV-005), so real
  phone and tablet times show in Studio's Analytics; nothing is sent when Analytics is off.
- (11 Oct) Once the owner has said go, this chat checks the board, its branch and its GitHub issues every 5 minutes,
  acts on anything new, pushes its own branch when its checks pass and keeps its Now line current; the check-ins pause
  while waiting for the owner's go (said in one line). Times for the owner in Sydney time (AEDT).
- (11 Oct) Step 5 of #36 (a smaller first download) done anyway although the gain is small: only in the packing step
  (minified stylesheet in bundle/, no kept names), 1058 -> 1032 KB on the first start.

## Progress notes
- **11 Oct, #36 slow start (branch `core/analytics-infra`, code at 5be6481, docs after).** Full suite on 5be6481:
  **87/87 passed, none skipped** (local PeerJS and MQTT servers up; finished 8:02 am AEDT). New check `startup`
  (packed copy, service worker on, processor 4x slower): first start 1058 KB, title 1.0-1.1 s, valley ready 19 s;
  second start 0 KB, ready 18-20 s, longest freeze 4.5-5.0 s; slowest steps things 5.6 s, land 5.0 s, roads 2.0 s.
  `perf` now measures PERF-001 on the packed copy (2.6 MB, ratchet 2.7). Start-up times added to Analytics (PRIV-005).
  Tried: pauses between building steps in `js/main.js` gave nothing measurable (each freeze is one World function), so
  that change was not kept. The fix is World's (board request): keep the built valley on the device, build in pieces.
- **11 Oct, #36 step 5 (56d9578).** Packing only: minified stylesheet, no kept names. Checked on the packed copy:
  `startup` (first start 1032 KB, title 0.9-1.0 s, ready 17.9-18.2 s; second start 0 KB, ready 17.2-17.5 s, longest
  freeze 4.4-4.5 s), `perf`, `boot`, `offline` pass; fast checks unit rules preload emoji arch types names pass;
  title, Who's playing, the valley's HUD and the first panel identical to the plain copy on phone, tablet and computer.
- **11 Oct, 2:40 pm AEDT: session paused, hand-off.** Owner: "stop checking until further notice"; the 5-minute
  check-ins are stopped. Everything is pushed (`core/analytics-infra`, c72d815 plus this note), ready for Release.
  Left for the next Analytics & Infra chat:
  1. Item 4: once Release merges PR #47 (instant bug robot, and the `checks.yml` fix that installs Playwright), watch
     the robot's first instant runs (`bug-fixer.yml`): it starts on a new `bug` issue and on a "go" comment, the
     5-minute backup timer fires, and no run pushes outside `bugfix/<core>-<issue>`. Check `checks.yml` goes green.
  2. #36: when World (Round T) lands the keep-the-built-valley or build-in-pieces change, run `startup` and lower the
     maxima in `tests/startup-baseline.json` (never raise them); post the new numbers on issue #36.
  3. When Studio shows `startup` on the Analytics page, check it reads the report's `startup` correctly.
  4. Item 3 (`parents` failing on "bedtime" on `main`) was already fixed on `main` (2fa7043): nothing to do.
- **11 Oct, 5:15 pm AEDT: r60 live, plan waiting for the owner's go (session ended for usage).** Branch now has `main`
  (r60) merged in. Found: (1) `pages.yml` (Deploy to GitHub Pages) fails on every merge into `main` since 10 Oct because
  Pages is not switched on (the game is on Netlify); proposed: run it only by hand. Checks is green on r60; branches
  older than r60 fail Checks until they merge `main`. (2) The bug robot has not run on r60 yet (last run 11 Oct, 12:47
  pm AEDT, on r56); only #34 and #36 are open, both on hold; check the 5-minute timer fires and a new bug starts it.
  (3) `startup` is red on r60 (Release: 96/97): first download 1088 KB (voice list, asked of Voice & Audio), slower
  build since T2/T3 (asked of World); proposed: measure on `main` here and make the time limits fair on slower machines
  by measuring the machine's speed in the same run, never by raising the limits. (4) #36 on a real phone and tablet:
  no Studio key here, so the owner opens the game twice on each device and reads the start-up times in Studio; no #36
  game changes without a new go. The owner has not said go to any of this yet.
- **11 Oct, 7:10 pm AEDT: the post-r60 plan done (owner's go 5:30 pm; code c9d4e83, docs after).**
  1. `pages.yml` (Deploy to GitHub Pages) now runs only by hand: it failed on every merge into `main` because Pages is
     not switched on (the game is on Netlify). `docs/INFRASTRUCTURE.md` updated; HANDOFF and README lines asked of
     Release on the board.
  2. Bug robot on r60: started by hand at 5:27 pm AEDT, green in 15 s on `bb99e13` (nothing to pick: #34 and #36 are on
     hold). GitHub skips the 5-minute backup timer: no timed run from 12:47 pm to 7 pm AEDT. The instant start (a new
     or relabelled `bug` issue, the owner's "go") is the real trigger; a new bug from the Front Desk is its next test.
  3. `startup` now measures the machine's speed in the same run (a fixed piece of work at the same slowed speed, the
     middle of 7 tries, `machineMs.ref` 180 in `tests/startup-baseline.json`) and stretches or shortens the time limits
     by measured / ref (0.5 to 3); downloads are not stretched; no limit raised. Tested: 56d9578 (before r59) passes
     at x1.00 (title 0.9 s, ready 17.6 s) and at a 1.5x slower processor passes at x1.45 (ready 24.8 s, which failed
     the old limits). r60 on this machine (x0.99 to x1.11) still fails, so its slowdown is the game's: first download
     1088 KB > 1035 (Voice & Audio's manifest) and title 1.5-2.2 s against 0.9 s before r59 (World / bigger start);
     ready 19.4-25.0 s, near its limit. The board's requests to World and Voice & Audio stand.
  4. #36 on real devices: no Studio key in this chat; the owner opens the game twice on a phone and a tablet and reads
     the start-up times in Studio's Analytics (Studio still has to draw `startup`: board request).
  Full suite on c9d4e83 (finished 7:08 pm AEDT): **96/97 passed**; failed `startup` (r60's own slowdown, above);
  skipped (no local PeerJS / MQTT servers here): multiplayer, netgames, together, meet, cloud, knock, mapver.
  Checks run for this core: startup (3 runs plus 2 on 56d9578), boot, offline, studio, report, saves, cloud (skipped),
  photo, unit, familyphotos, nostudio: all pass except startup.
- **12 Oct, 6:30 am AEDT: `startup` ratchet after r63.** The Voice & Audio fix (voice list after the title) went live in
  r63; `startup` on r63, two runs: first download 979 KB both times, so `firstKB` lowered 1035 -> 1000. Still red on the
  title (1.6-2.2 s against 1.1 s x machine speed): World's; ready 20.3-25.3 s, freeze 4.2-4.9 s.


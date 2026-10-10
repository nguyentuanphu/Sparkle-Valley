# Analytics & Infra core

**You keep the game's website running and report how it is used:** the anonymous analytics (per device and child,
online now, problems), the Netlify functions and settings, offline caching (service worker), privacy, and the
infrastructure notes.

## You own
- `js/players.js` (what a device sends), `netlify/lib/players.mjs` (what the website keeps and the report),
  `netlify/functions/hello.mjs`, the Netlify side of `netlify/functions/turn.mjs`
- `netlify/lib/guard.mjs` (rate limits and lockouts), `netlify/lib/live.mjs` with Studio, and with Studio the family
  photo door `netlify/functions/family.mjs` + `netlify/lib/family.mjs`
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
  (`LINES` in `players.mjs`), so a script cannot flood the inbox or the Azure budget spent recording it.
- `/api/family/<name>`: the family code, 10 wrong codes lock a connection for 15 minutes, 300 requests in 10 minutes,
  `Cache-Control: private, no-store`; `sw.js` passes every `api/` request straight to the network.
- `/api/live`: the rules and when they changed, never who changed them.
- Counters live in the Blobs store `guard` under a keyed hash of the connection (random salt in the same store); the
  address itself is never kept. Old counters are tidied when the access log is opened.
- What the analytics keep is written exactly at the top of `netlify/lib/players.mjs`.

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


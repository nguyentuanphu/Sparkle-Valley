# Sparkle Valley cores: one chat per core

The project is split into **8 cores** (owner, 8 Oct, round Q). Each AI chat works on **one core**. It reads that
core's file before doing anything, changes only that core's files, and hands work for other cores over through
[`BOARD.md`](BOARD.md). Only the **Release** core merges, runs the full suite, packages, reports, and asks the owner
one "yes, deploy" per round before anything reaches `main` (owner, 10 Oct: Release is the master release).

| # | Core | File | In one line |
|---|------|------|-------------|
| 1 | World | [world.md](world.md) | The 3D valley: land, roads, buildings, villages, landmarks, water, collisions, 3D speed |
| 2 | Play | [play.md](play.md) | Mini-games, stories, festivals, songs, levels, quests and rewards |
| 3 | Kid UI | [kid-ui.md](kid-ui.md) | Everything a child taps: Simple screen, HUD and dock, menus, settings, welcome, characters, accessibility |
| 4 | Voice & Audio | [voice-audio.md](voice-audio.md) | The voice pack, the device voice, music, sound effects, Azure |
| 5 | Online | [online.md](online.md) | Friends, rooms, knock and invite, microphone and calls, relays, child safety |
| 6 | Studio | [studio.md](studio.md) | Sparkle Studio (exe and online), admins, saving and Publish, family content and photos |
| 7 | Analytics & Infra | [analytics-infra.md](analytics-infra.md) | The analytics report, Netlify functions and settings, privacy, the service worker and caching |
| 8 | Release | [release.md](release.md) | Merging, the full regression suite, version, voices, packages, reports, push and deploy |
| – | Front Desk (not a core) | [front-desk.md](front-desk.md) | The owner's first stop for bugs and questions: finds the core, files the bug for the bug robot; never changes code |

**Bugs (owner, 10 Oct):** tell the Front Desk. It files a GitHub issue labelled `bug` and the core's label; the bug
robot (`.github/workflows/bug-fixer.yml`, started the moment a bug is filed, 5-minute backup timer) fixes small bugs on `bugfix/<core>-<issue>` branches with a
draft pull request, and writes a plan for big ones that waits for the owner's "go". Release merges, after "yes, deploy".

## How to start a chat for a core

**With a task brief (owner, 10 Oct):** start the chat on `main` and send one line, for example:

> You are the **Play** core. Do `docs/cores/tasks/play-chapter2.md`.

The rules for helper chats are in `CLAUDE.md` (read automatically), so nothing else needs pasting. The briefs:

| Brief | Core | Task |
|---|---|---|
| [play-chapter2.md](tasks/play-chapter2.md) | Play | Lantern story Chapter 2, Hà Nội |
| [kid-ui-films.md](tasks/kid-ui-films.md) | Kid UI | The next 3D story and how-to films |
| [voice-by-area.md](tasks/voice-by-area.md) | Voice & Audio | Voice pack by area (Round R item 12) |
| [infra-speed.md](tasks/infra-speed.md) | Analytics & Infra | Smaller start-up download, checks on every pull request |
| [studio-review.md](tasks/studio-review.md) | Studio | Studio review and improvements |
| [play-festivals.md](tasks/play-festivals.md) | Play | Festivals on a schedule, whole places decorated |
| [battery.md](tasks/battery.md) | Battery (helper, `core/battery`) | The battery round: fewer frames and draws, battery statistics |
| [studio-r65.md](tasks/studio-r65.md) | Studio | A cleaner Analytics page, broken real photos, ads preview and guide |
| [voice-daily.md](tasks/voice-daily.md) | Voice & Audio | A daily job that records every missing voice line |
| [play-reading.md](tasks/play-reading.md) | Play (2nd chat, `core/play-reading`) | Ten reading games, a trial behind a switch |
| [release-r70-finish.md](tasks/release-r70-finish.md) | Release | Finish r70: full suite, screenshots, zip, "yes, deploy" |
| [films-batches.md](tasks/films-batches.md) | Release | Story films in batches of about 6, Vietnamese first; the owner's three film notes |

**Without a brief**, paste this as the first message (change the core):

> You are the **Online** core of Sparkle Valley. Read `CLAUDE.md`, then `docs/cores/README.md`, then
> `docs/cores/online.md`, then the open items for Online in `docs/cores/BOARD.md`. Show me your plan before you change anything.

The Release core is started the same way: "You are the **Release** core…".

## Rules every core keeps

These come from `CLAUDE.md`, `HANDOFF.md` and `docs/ARCHITECTURE.md` §9, which stay the source of truth.

1. **Plan first.** Show the owner the plan, then do it (HANDOFF rule 17). Ask when a choice is the owner's to make.
2. **Push only your own branch; no need to ask** (owner, 10 Oct). Commit on the core's own branch (the one the
   chat's session was given, or `core/<name>`, e.g. `core/online`) and push it once your checks pass. Never push to
   `main`, never deploy; a pull request stays a draft. Release collects every branch, merges, and asks the owner one
   "yes, deploy" per round (the helper chat rules are in `CLAUDE.md`).
3. **Stay in your files.** Each core file lists what it owns. To change another core's file, write the request on
   `BOARD.md` (what, why, which file). A one-line fix that a check needs is allowed if it is noted on the board.
4. **Rules are checked.** A core changes its own hard rules (`docs/ARCHITECTURE.md` §9) only when the owner asks. It
   then runs `node tools/rules-from-doc.mjs` so `js/content/rules.js` matches.
5. **Tests.** Before handing over, run the core's own checks (listed in its file):
   `cd tests && SV_URL=http://localhost:<port>/ CHROMIUM=/opt/pw-browsers/chromium node run.mjs <checks>`.
   Serve the copy you work on with `python3 -m http.server <port>`. Never run two browser test runs at once.
   A changed check, or a new one, is part of the work.
6. **Times in Sydney time** (AEDT, UTC+11, in daylight saving; AEST, UTC+10, the rest of the year), labelled, in every message and document (owner, 10 Oct).
7. **Words for the owner.** Use plain words, Vietnamese when the owner writes Vietnamese, and no jargon.
8. **No keys or personal data in the repository.** Keys live in Netlify's environment variables or on the family's
   computer (Studio settings).
9. **Children first.** Under-5s can't read: everything they need is a picture and a voice. Nothing a child sees may
   frighten, sell to or expose them (rules A11Y, SAFE, PRIV).
10. **Write it down.** Each round adds a line to `HANDOFF.md` (history and checks table) through Release. Decisions
    the owner makes go into the core's file under "Owner's decisions".

## Who owns shared files

| File | Owner core | Others |
|------|-----------|--------|
| `js/main.js` | Release (wiring only) | Each core adds or changes only its own block, marked with a comment; bigger changes go via the board |
| `js/ui.js` | Kid UI | Play (Games hub lists), Online (Friends tab: `drawOnlinePanel` lives in main.js) |
| `css/style.css` | Kid UI | Each core keeps its styles in its own block with a comment header |
| `js/state.js` | Kid UI (profiles, settings) | others add a setting through the board |
| `tests/run.mjs` | each core owns its own checks | Release owns the runner and `harness.mjs` |
| `HANDOFF.md`, `CLAUDE.md` | Release | cores propose text on the board |
| `docs/ARCHITECTURE.md` | the core named in each rule | Release keeps §9.1 and §9.7 |
| `sw.js`, `js/build.js`, `studio/version.json` | Release | a core adds a new file to `sw.js` FILES and says so on the board |

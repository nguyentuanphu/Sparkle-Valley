# Sparkle Valley cores: one chat per core

The project is split into **8 cores** (owner, 8 Oct, round Q). Each AI chat works on **one core**. It reads that
core's file before doing anything, changes only that core's files, and hands work for other cores over through
[`BOARD.md`](BOARD.md). Only the **Release** core merges, runs the full suite, packages, reports, and asks the owner
for "yes, push" and "yes, deploy".

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

## How to start a chat for a core

Paste this as the first message (change the core):

> You are the **Online** core of Sparkle Valley. Read `CLAUDE.md`, then `docs/cores/README.md`, then
> `docs/cores/online.md`, then the open items for Online in `docs/cores/BOARD.md`. Show me your plan before you change anything.

The Release core is started the same way: "You are the **Release** core…".

## Rules every core keeps

These come from `CLAUDE.md`, `HANDOFF.md` and `docs/ARCHITECTURE.md` §9, which stay the source of truth.

1. **Plan first.** Show the owner the plan, then do it (HANDOFF rule 17). Ask when a choice is the owner's to make.
2. **Never push.** No `git push`, pull request or deploy from a core chat. Commit on the core's own branch
   (`core/<name>`, e.g. `core/online`). Release merges, and asks for "yes, push" and, separately, "yes, deploy".
3. **Stay in your files.** Each core file lists what it owns. To change another core's file, write the request on
   `BOARD.md` (what, why, which file). A one-line fix that a check needs is allowed if it is noted on the board.
4. **Rules are checked.** A core changes its own hard rules (`docs/ARCHITECTURE.md` §9) only when the owner asks. It
   then runs `node tools/rules-from-doc.mjs` so `js/content/rules.js` matches.
5. **Tests.** Before handing over, run the core's own checks (listed in its file):
   `cd tests && SV_URL=http://localhost:<port>/ CHROMIUM=/opt/pw-browsers/chromium node run.mjs <checks>`.
   Serve the copy you work on with `python3 -m http.server <port>`. Never run two browser test runs at once.
   A changed check, or a new one, is part of the work.
6. **Times in AEST** (UTC+10, Australia/Brisbane), labelled "AEST", in every message and document.
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

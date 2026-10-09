# Sparkle Valley: rules for the assistant

**HARD RULE: do not `git push`, and do not open or update a pull request, until the owner has checked the work and clearly confirmed.**
- Commit locally as you go.
- When a round is done, show what changed and how it was tested, and give the Netlify zip.
- Then wait for an explicit "yes, push" before pushing. Each confirmation covers that one push only.
- **Ended by the owner (5 Oct, after Round I): "ask me every time".** The earlier standing instruction (4 Oct, after Round E: "Yes push, all other rounds keep running without asking me") no longer applies. Every push again needs its own "yes, push" from the owner, after the round's full regression suite is green and the round has been reported (what changed, how tested, Netlify zip and local bundle).
- **GitHub and Netlify are asked for separately (owner, 5 Oct): "split the push to GitHub and Netlify, sometimes I only want to push to GitHub, so ask me for both".** "Yes, push" covers pushing the branch to GitHub only (and opening or updating its pull request). Merging into `main`, which makes Netlify publish the game, needs its own "yes, deploy" (or "yes, Netlify"). At every round report ask both questions.
- **Artifacts always go into the repo (owner, 10 Oct: "Always allow adding artifact to repo").** Whenever a design, plan or drawing page is made or updated as a claude.ai artifact, put a copy in the repo (the page and its pictures, under `docs/<name>/`) and link it from the docs that use it, so every chat can read it. This is allowed without asking, and the push of such a docs-only commit to the working branch needs no separate "yes, push". Merging into `main` still needs "yes, deploy", and anything that changes the game still needs "yes, push".
- **Reminder each round:** the Google Drive mirror (`.github/workflows/drive-mirror.yml`) is not set up yet; the owner will do it later (rclone on Windows: `net stop winnat` as admin before signing in, own Google client ID, then `net start winnat`; GitHub secrets `RCLONE_CONF`, `DRIVE_FOLDER_ID`). Ask the owner about it at every round report until they say it is done.
- **Reminder each round (owner, 9 Oct): the voice relay (TURN) is not set up yet.** Netlify → Site configuration → Environment variables: `CF_TURN_KEY_ID` and `CF_TURN_KEY_TOKEN` (Cloudflare → Realtime → TURN Server → Create), or `METERED_DOMAIN` and `METERED_API_KEY`, then redeploy; check that `/api/turn` lists `turn:` servers (`netlify/functions/turn.mjs`). Remind the owner at every round report, together with the Drive mirror, until they say it is done.

**Questions as pop-ups (owner, 10 Oct): "Always ask me in popup questions".** Every question to the owner (yes, push; yes, deploy; go; any choice) is asked with the pop-up question tool, not only written in the message.

**Phone, tablet and computer (owner, 8 Oct):** every change is checked on a phone, a tablet and a computer so it looks tidy on all three (rule UI-006, check `phone`); look at screenshots of all three before reporting a round.

**Times and dates:** always give them in AEST (UTC+10, Australia/Brisbane), labelled "AEST", in messages, reports and documents (owner, 5 Oct). Convert from UTC (GitHub, Netlify, logs) before quoting.

**Cores (owner, 8 Oct):** the project is split into 8 cores, one AI chat per core (World, Play, Kid UI, Voice & Audio, Online, Studio, Analytics & Infra, Release). If the owner says which core you are, read `docs/cores/README.md` and your core's file in `docs/cores/` before anything else, work only in that core's files on the branch `core/<name>`, and put requests for other cores on `docs/cores/BOARD.md`. Only the Release core merges, runs the full suite, reports and asks for "yes, push" / "yes, deploy". With no core named, you are Release.

**Helper chats (owner, 10 Oct): every chat that is told it is a core (not Release) keeps these rules, whether or not the owner pastes them.**
1. Read this file, `HANDOFF.md`, `docs/cores/README.md`, your core's file in `docs/cores/` and, if the owner names one, your task brief in `docs/cores/tasks/`. The brief says what to build; this file and the docs say how. If they disagree, the docs win: say so.
2. **Plan first and wait:** before changing anything, show the owner your plan (what you will build, which files, which checks, what is left for later) and wait for the owner's "go".
3. Work only in your core's files and the files your brief allows. A change another core owns goes on `docs/cores/BOARD.md` (what, why, which file).
4. **The map is being rebuilt (Round T, Release core):** do not change world positions or these files: `js/world.js`, `js/roads.js`, `js/regions.js`, `js/cities.js`, `js/town.js`, `js/homes.js`, `js/vendors.js`, `js/hawkers.js`, `js/places.js`, `js/solids.js`, `js/content/map.js`. Use places and characters by their id only.
5. Do not bump the version (`sw.js` VERSION, `js/build.js`, `studio/version.json`), do not merge into `main`, do not deploy. Commit locally as you go.
6. **Push only after the owner says "yes, push"**, and only to this chat's own branch (the one the session was given, or `core/<name>`), never to `main`. If a pull request is opened, keep it a draft: only Release merges.
7. No emoji in docs; any emoji in the game needs a drawing in `js/art.js`. Touch targets 44 px or more (64 px for under-5s). English and Vietnamese for everything a child sees or hears. Times in AEST.
8. Never weaken, skip or delete a check to make it pass: fix the code. If a check is wrong, explain why before changing it.
9. New spoken lines: if `AZURE_SPEECH_KEY` is set, record them with `node tools/make-voice-pack.mjs --engine azure` (never print or commit the key); otherwise list them in the report. Lines with a child's name are never recorded (HANDOFF rule 11).
10. Before reporting, run your core's checks, the checks your brief names and any new ones, then the full suite (`cd tests && node run.mjs`). Online checks may say "skipped" in a helper chat: say so.
11. **The report** lists: what changed (files), every check with pass, fail or skipped, the screenshots you looked at (phone, tablet, computer), new spoken lines (recorded or not), anything not done, decisions the owner made (also written into your core file under "Owner's decisions"), your branch name and last commit id.

Everything else about the project (requirements, how it's built, testing, working style) is in `HANDOFF.md`. Read it first.

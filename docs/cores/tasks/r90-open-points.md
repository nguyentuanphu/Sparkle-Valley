# r90: open points carried over from r89.1 (Release, 24 Oct 2026 AEDT)

Paste the prompt below to the helper chat working on r90 on its own branch. Release (this chat) keeps the last section.

## Prompt (for the helper chat working on r90)

You are a helper chat for Sparkle Valley, not Release. Release (another chat) collects your branch, merges it, runs the
full suite on GitHub, reports to the owner and asks for "yes, deploy". Keep the CLAUDE.md "Helper chats" rules:

- **Read first:** CLAUDE.md, HANDOFF.md, docs/cores/README.md and docs/cores/BOARD.md (all of it), plus the core file
  in docs/cores/ for each core whose files you touch (Play, Kid UI, World, Analytics & Infra; the issue labels say
  which).
- **Branch:** work only on the branch this session was given. Start of session: `git fetch`, `git pull` your branch,
  then merge `main` into it. main is now r89.1 (`ec773cce`, live 24 Oct 2026 3:20 am AEDT). Resolve conflicts with
  the repo's tools: `node tools/preload.mts`; the website with `sync-website.mjs`, then `--record-reviewed`, then
  `node tools/build-website.mts`. Never edit generated files by hand.
- **Plan first and wait:** show the owner your plan (what, which files, which checks, what is left for later) and
  wait for the owner's "go", asked with a pop-up question (2 to 4 choices, the recommended one first). With no answer
  after 15 minutes, carry on with the recommended choice and write it down as "assumed, owner can change".
- **Never:**
  - bump the version (`sw.ts` VERSION, `js/build.ts`, `studio/version.json`)
  - merge into `main` or deploy
  - change world positions or the map files (helper rule 4)
  - weaken, skip or delete a check
- **Pushing:** push your own branch whenever your checks pass, after `git pull --no-rebase`, without asking. Any pull
  request stays a draft. Never force-push.
- **Checks:** `cd tests && node suite.mjs --changed`. If it picks the full suite, push and start
  `.github/workflows/full-suite.yml` on your branch by hand instead of running it locally.
- **Screens:** look at phone, tablet and computer screenshots for every change you can see.
- **Rules for what children see:** English and Vietnamese for everything a child sees or hears; touch targets 44 px or
  more (64 px for under-5s); no emoji in docs.
- **Spoken lines:** record new ones with `node tools/make-voice-pack.mts --engine azure` if `AZURE_SPEECH_KEY` is set
  (never print or commit the key), otherwise list them for Release.
- **When done:**
  - put "ready for Release" on your board line, with your branch, your last commit and any assumed choices
  - record every check (pass, fail or skipped, with the commit id and date in AEDT) in your core file's progress
    notes
  - write the owner's decisions into that core file under "Owner's decisions"
  - do not close GitHub issues: Release closes them with "Fixed in rNN" once the round is live

### The work: open points carried over from r89.1

#### A. Save a copy, then the family code (owner's choice, 23 Oct AEDT)
Plan: docs/cores/tasks/save-copy-family-code.md (on main). Part 1, "Save a copy / Load a copy" in Grown-ups:
- One file of the children's progress, handed to the share sheet (Save to Files, which is iCloud Drive; Google Drive;
  Mail). This works the way `sharePDF` does in js/printpage.ts.
- Load a copy checks the file, shows the children's names and the date, and asks before replacing anything. It never
  overwrites a child's save silently.
Part 2, the family code:
- A code and QR in Studio, entered once per device, so Studio counts by family and child.
- "Same device as..." in Studio, to join two device entries by hand.
- No fingerprinting.
- The privacy wording, in English and Vietnamese, goes to the owner first.
Show each part's plan before building.

#### B. Tester issues still open on GitHub (replay each on r89.1 before changing code; fix only what reproduces)
- **Probably fixed by r89.1:** #448, #449 (Robot Planner: "a button covered by something: pill arrow (hp-slot)", i.e.
  the story hand pad covered the game). r89.1 hides `.handpad` while a game is open. Replay Robot Planner with auto
  play at x5 (`tests/owner-autoplay-plans.mjs --speed=x5 --ids=robot`) and report the result to Release.
- **Auto play "stuck at" a spot:** #406, #407, #408, #409, #410, #426, #431, #440. Spots: Small to Big meadow
  (204, 15); village (193, -47) and (-2, -83); home (-8, 33). They did not reproduce on r89. If one is a world-position
  problem, put it on the board for World instead of moving anything.
- **Quests auto play could not finish:** #427 and #361 (hang the lantern at the dinh), #365 (count the stone turtles at
  Van Mieu with Co Tam), #339 (a folk game with Teo: the Play button covered).
- **Spoken line not recorded:** #362, #363 (the Vietnamese line of "Lat la sen de tim den long").
- **Freeze and slow reports:** #367, #370, #371, #373, #374, #394, #401 to #405, #411 to #414, #473 to #491, #493;
  also #341 and #36 (on hold). r89.1 stops counting a freeze while the page was hidden or put away. The ones left
  show "longest script 0 ms", so look at drawing (GPU) and big pictures, not scripts. Use each report's "last 30
  seconds" (Studio, Analytics, Tester reports) and group them by where they happened.
- **Offscreen reports:** #376 to #399 (tester panel and HUD labels: Idea, Sound, Gui, Dong, Tu choi, NhaySpace, Ban doM
  and so on). r89.1 skips the scan while a text box is focused. Check whether the tester panel itself is cut off on
  small screens (#375 says the report screen is too small), and fix the panel or the detector
  (js/tester-detection.ts), whichever is wrong.
- **The owner's own reports:** #375 (report screen too small), #372 (Retry queued reports does nothing), #369 (the gate
  blocks the view and does not fade), #368 (tram front view blocked by the windscreen), #355 (game restarts or goes
  white while playing), #354 (riding stops at every bridge), #350 (An lung tung khong dung rules), #337 (already
  fixed-on-branch: confirm it).

#### C. Things to know (no work unless the owner asks)
- **Launch schedule:** content/custom.json "releases" has 20 switches with start dates from Sat 7 Nov to Sat 26 Dec
  (docs/cores/tasks/launch-schedule.md). Do not change the dates: the owner sets them in Studio.
- **How checks see the schedule:** they run as if every batch had already started. tests/harness.mjs leaves out a rule
  whose start date is still to come. The `rollout` check passes `schedule: true` and checks the real dates.
- **`featureOn` precedence (js/custom.js):** a release rule wins over CUSTOM.features. js/custom.js is still JS:
  convert it to TS in a rename-only commit before changing it (the same goes for any other JS file you change, such as
  js/handpad.js).
- **Point builds:** builds like `r89.1` are accepted everywhere (server, issue tool, Studio).
- **Device number:** it now rides in the save copy (js/state.ts) and comes back after a storage wipe.
- **Owner to confirm on a real iPhone:** no white screen before Welcome, in both the Chrome and the Safari Home Screen
  apps.

### Your report to the owner
Per helper rule 11:
- what changed (files) and every check (pass, fail or skipped)
- the phone, tablet and computer screenshots you looked at
- new spoken lines, recorded or not
- anything not done
- the owner's decisions
- your branch name and last commit id

## Kept by Release (not for the helper)
- Commit tests/check-map.json and tests/check-times.json from the r89.1 full suite run's "check-map" artifact (run
  39962125256), or from the r90 round's run.
- Root-cause the second-try checks of r89.1: ownerautoplaytransport, cloud, feel.
- The AI review did not finish twice on PR #494 (review account usage, no backup account): raise with the owner.
- Collect the helper's branch, merge, the full suite on GitHub, local speed checks, the Netlify zip, the version
  question and "yes, deploy"; then close fixed issues with "Fixed in r90".

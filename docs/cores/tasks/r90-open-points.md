# r90: open points carried over from r89.1 (Release, 24 Oct 2026 AEDT)

Paste this to the chat working on r90. It is Release work unless a core is named.

## Prompt

You are Release for Sparkle Valley, working on r90 on your own branch. Read CLAUDE.md, HANDOFF.md,
docs/cores/README.md, docs/cores/BOARD.md (all of it) and docs/cores/release.md (Owner's decisions) first.

r89.1 went live on 24 Oct 2026 at 3:20 am AEDT (PR #494, merged into main as `ec773cce`; sv-2026-10-23-r89.1). Start by
merging `main` into your r90 branch (`git fetch origin main && git merge origin/main`), resolving conflicts with the
repo's tools: regenerate the preload list (`node tools/preload.mts`) and the website (`sync-website.mjs`, then
`--record-reviewed`, then `node tools/build-website.mts`). Never edit generated files by hand.

These open points belong in r90. Plan them with the owner first (pop-up questions only, the recommended choice first),
then build, check and report as the CLAUDE.md rules say.

### 1. Housekeeping from r89.1 (do first, small)
- Commit `tests/check-map.json` and `tests/check-times.json` from the "check-map" artifact of the r89.1 full suite run
  (GitHub Actions run 39962125256), or from r90's own first full suite run if newer.
- Check-flakes to root-cause (each passed only on a second try in r89.1; "flake" is not a cause):
  `ownerautoplaytransport` (first try: "No clear walking target from actual bus exit"), `cloud` (first try: slow
  online room, rtt 529 to 854 ms), `feel` (first try: phone calm mode).
- AI review did not finish twice on PR #494 (the "Claude reviews" step stopped after about 20 s with no output;
  `HAS_BACKUP: false`). Most likely the review account's usage: tell the owner, and suggest adding a backup account
  secret. Do not change the workflow to hide it.

### 2. Save a copy, then the family code (owner's choice, 23 Oct AEDT)
Plan: docs/cores/tasks/save-copy-family-code.md (on main). Part 1, "Save a copy / Load a copy" in Grown-ups:
- One file of the children's progress, handed to the share sheet (Save to Files, which is iCloud Drive; Google Drive;
  Mail). This works the way `sharePDF` does in js/printpage.ts.
- Load a copy checks the file, shows the children's names and the date, and asks before replacing anything. It never
  overwrites a child's save silently.
Part 2, the family code:
- A code and QR in Studio, entered once per device, so Studio counts by family and child.
- "Same device as…" in Studio, to join two device entries by hand.
- No fingerprinting.
- The privacy wording, in English and Vietnamese, goes to the owner first.
Show each part's plan before building.

### 3. Tester issues still open on GitHub (replay each on r89.1 before changing code)
- **Probably fixed by r89.1:** #448, #449 (Robot Planner: "a button covered by something: pill arrow (hp-slot)", i.e.
  the story hand pad covered the game). r89.1 hides `.handpad` while a game is open (css/style.css, the story check).
  Replay Robot Planner with auto play at x5; if clean, close with "Fixed in r89.1".
- **Auto play "stuck at" a spot:** #406, #407, #408, #409, #410, #426, #431, #440. Spots: Small to Big meadow
  (204, 15); village (193, -47) and (-2, -83); home (-8, 33). They did not reproduce on r89. Replay those quests or
  games at those spots on r89.1; fix only what reproduces. World positions belong to the map rebuild rule
  (CLAUDE.md helper rule 4).
- **Quests auto play could not finish:** #427 and #361 (hang the lantern at the đình), #365 (count the stone turtles
  at Văn Miếu with Cô Tam), #339 (a folk game with Tèo: the Play button covered).
- **Spoken line not recorded:** #362, #363 (Lật lá sen để tìm đèn lồng, Vietnamese). Record it if `AZURE_SPEECH_KEY` is
  set; otherwise list it for the owner.
- **Freeze and slow reports:** #367, #370, #371, #373, #374, #394, #401 to #405, #411 to #414, #473 to #491, #493;
  also #341 and #36 (on hold). r89.1 stops counting a freeze while the page was hidden or put away
  (blur/visibility/pagehide). The ones left show "longest script 0 ms", so look at drawing (GPU) and big pictures, not
  scripts. Use the tester reports' "last 30 seconds" in Studio → Analytics → Tester reports. Group them by where they
  happened.
- **Offscreen reports:** #376 to #399 (labels of the tester panel and HUD: Idea, Sound, Gửi, Đóng, Tự chơi, NhảySpace,
  Bản đồM and so on). r89.1 skips the offscreen scan while a text box is focused. Check whether the tester panel
  itself is cut off on small screens (#375 says the report screen is too small), and fix the panel or the detector
  (`js/tester-detection.ts`), whichever is wrong.
- **The owner's own reports:** #375 (report screen too small), #372 (Retry queued reports does nothing), #369 (the gate
  blocks the view and does not fade), #368 (tram front view blocked by the windscreen), #355 (game restarts or goes
  white while playing), #354 (riding stops at every bridge), #350 (Ấn lung tung không đúng rules), #337 (already
  fixed-on-branch: confirm and close).

### 4. Things to know (no work unless the owner asks)
- **Launch schedule:** content/custom.json "releases" has 20 switches with start dates from Sat 7 Nov to Sat 26 Dec
  (docs/cores/tasks/launch-schedule.md). Testers see each batch 7 days early. Studio's Releases page overrides the
  shipped dates.
- **How checks see the schedule:** they run as if every batch had already started. tests/harness.mjs leaves out a rule
  whose start date is still to come. The `rollout` check passes `schedule: true` and checks the real dates. Keep this
  in mind when adding a new dated release.
- **`featureOn` precedence (js/custom.js):** a release rule wins over CUSTOM.features. Studio's Features page lists none
  of the scheduled switches, so there is no conflict today. If one is added there, decide its precedence with the
  owner. js/custom.js is still JS: convert it to TS in a rename-only commit before changing it.
- **Point builds:** r89.1-style builds (`r` + number + optional `.N`) are accepted by the server, the issue tool, the
  Studio Fixed-in box and studio/core.cts. Builds compare as numbers.
- **Device number:** it now rides in the save copy (js/state.ts) and comes back after a storage wipe. Separate apps on
  one iPhone are still separate devices until the family code exists.
- **Owner to confirm on a real iPhone:** no white screen before Welcome, in both the Chrome and the Safari Home Screen
  apps. The start screen now has a small valley picture (icons/launch/valley-*.jpg), so the phone's browser engine
  paints it at once.

### Reporting
Per CLAUDE.md:
- Each fixed tester issue is closed with "Fixed in r90" only after r90 is live.
- The full suite runs on GitHub; local speed checks run one at a time.
- Phone, tablet and computer screenshots, plus the Netlify zip.
- The version number and "yes, deploy" are asked by pop-up and never assumed.

# Release r70: finish the full suite and deploy (handoff, 13 Oct AEDT)

Written by the Release chat in case its usage runs out. Start a new chat on the branch below and send:

> You are the **Release** core. Do `docs/cores/tasks/release-r70-finish.md`.

## Where things stand (13 Oct, about 10:15 am AEDT)
- Branch `claude/great-faraday-weuhjv`, pushed (owner: "push them altogether on the r70"). Version **r70** in
  `js/build.js`, `sw.js` VERSION and `studio/version.json`. `main` and Netlify are on **r69** (PR #72, live 6:29 am AEDT 13 Oct).
- Every branch marked "ready for Release" is merged (the bag fixes and the Studio work included). `studio-draft` stays out (owner).
- 60 new voice lines were recorded with Azure (0 missing). The new microphone messages are on-screen only (not in the voice pack).
- The full suite was started at about 9:30 am AEDT in two halves (it is too long for one 2-hour background job).

## What r70 holds (Round V, the owner's iPhone notes of 13 Oct; plan in `docs/cores/ROUND-V.md`)
1. Quest bar folds to a chip on a tap and hides its arrow, remembered per child (`questbar`).
2. iPhone edges: no blur band at the top, no black strip at the bottom (large viewport height) (`phone`).
3. and 5. "Chào hỏi": the child's own character, pets and friends never get a "Say hello" tap or a job picture (`talk`).
4. Seated villagers never stand up or float; a walk that would enter a road or house stops (`dayplan`).
6. iPhone microphone, three fixes:
   - **6d, the real cause:** `js/audio.js` kept iPhone in its play-only sound mode (`navigator.audioSession.type = 'playback'`,
     since 3 Oct), where iPhone never asks for the microphone and voice control cannot listen. Now `micMode()` sets
     'play-and-record' while a call, voice control, the recorder or the microphone test uses the microphone, and 'playback'
     again after (`js/audio.js`, `js/net.js`, `js/listen.js`, `js/recorder.js`, `js/mictest.js`).
   - 6b: a microphone the iPhone ended (game in the background) is dropped and a tap asks again; says when it stops; a
     message after 10 s with no answer.
   - 6c: "Microphone test (grown-ups)" in Friends (`js/mictest.js`, loaded only when tapped): where the game runs, the
     permission, the microphone's exact answer with a sound bar, voice control, and "Copy the answers".
   - Busy microphone (FaceTime) message; the microphone is off when a room is made or joined.
7. Camera button centred; beside a house the camera turns in about half a second (`camcalm`, `camera`).
8. "Where is…?": after a pick, Fly or Walk (`wayfind`).
9. Friends: closes by itself when a friend comes in or a game starts; Retry re-invites; "My friends" folds (`friendstab`, `netgames`, `meet`).
10. Shop is a Pad tab right after Backpack; no Shop button in the dock (`shop`, `contract` re-recorded: owner asked).
11. Backpack: each item says what it is for; food asks "Eat it?"; coins, Sparkle Orbs and Leafies as three cards; the section row is back (`bagitems`, `chips`, `hscroll`).
11b. A started family mission shows in the quest bar (`questbar`, `familymissions`).
12. Simple screen: one page that scrolls, each section's title then its games on a road (`simple`, `adventure`).
13. Clothes by set: girl or boy at creation; the shop sells that set; other-set clothes can be gifted, same-set traded (`shop`, `wearbag`, `tradeclothes`).
14. "Play together" list; Tiến Lên miền Bắc next to miền Nam (`netgames`, `tienlen`, unit test).
15. Ride anywhere: animals run home after a ride, vehicles go back to their spot; buses and trams: pick any stop; eye-level camera while riding (`ride`, `vehicles`).

## What to do
1. `git fetch`, check out `claude/great-faraday-weuhjv`, `git pull --no-rebase`, merge `origin/main` (should be a no-op),
   read `docs/cores/BOARD.md`. Check GitHub for any branch marked "ready for Release" since r70 started; merge it if so.
2. Serve: `python3 -m http.server 8765 &` from the repo root (a server started with `&` outlives the 2-hour job limit).
3. Run the full suite in two halves, each as its own background job (timeout 7200000):
   `grep -oE "^await check\('[a-z0-9-]+'" tests/run.mjs | cut -d"'" -f2` lists every check; split the list in two.
   `cd tests && CHROMIUM=/opt/pw-browsers/chromium SV_URL=http://localhost:8765/ node run.mjs <checks…>`.
   Never run two browser test runs at once. Never `pkill -f` with a pattern in your own command line.
4. Must pass, newest first: `mictest` (new), `iphone` (extended: sound mode, dead microphone), `friendstab`, `questbar`,
   `bagitems`, `tradeclothes`, `talk`, `dayplan`, `wayfind`, `ride`, `shop`, `wearbag`, `simple`, `adventure`, `contract`.
   Known: `startup` was already over its limit on main (say so, do not hide it); `perf` sits at its edge; online checks
   are skipped here (no local relay). Re-run anything else red; fix the code, never weaken a check.
5. Screenshots on phone, tablet and computer of the Round V changes (Friends with the microphone test, the Shop tab,
   the Backpack cards, the Simple screen, the quest chip, the stop picker); look at them before reporting.
6. Netlify zip: `git archive --format=zip -o <scratchpad>/sparkle-valley-netlify-r70-game.zip HEAD index.html sw.js manifest.webmanifest netlify.toml css js fonts icons vendor videos content`; send it.
7. Report (what changed, every check pass/fail/skipped, screenshots, voices, what is not done), then ONE pop-up question:
   "yes, deploy" (Recommended first). Nothing reaches `main` without it.
8. After "yes, deploy": PR from `claude/great-faraday-weuhjv` into `main`, merge, confirm
   `curl https://sparklevalley.netlify.app/js/build.js` says r70 (times in AEDT), update `docs/cores/BOARD.md`,
   `docs/cores/release.md` and the HANDOFF r70 line; if `studio/` changed, `bash tools/publish-exe.sh "r70 notes"`.
9. Ask the owner to try the microphone on the iPhone (Friends, voice control) and, if it still fails, to open
   Friends → "Microphone test (grown-ups)" → "Copy the answers" and paste them.

## Then
The story films: `docs/cores/tasks/films-batches.md`. After that the batch rollout: `docs/cores/tasks/rollout.md`
(branch `core/rollout`, ask its three pop-up questions first).

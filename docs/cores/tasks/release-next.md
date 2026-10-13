# Release: the next round (r71) (handoff, 13 Oct AEDT, about 2:30 pm)

Start a new chat on `main` and send:

> You are the **Release** core. Fetch the branch `claude/great-faraday-weuhjv`, merge it into your release branch (it holds
> this brief and the latest release notes), then do `docs/cores/tasks/release-next.md`.

Read `CLAUDE.md` first (it holds the rules, including "Checks and the full suite" from 13 Oct), then `docs/cores/release.md`
(steps, owner's decisions, notes) and the whole `docs/cores/BOARD.md`.

## Where things stand
- **Live: r70** since 13 Oct, 12:59 pm AEDT (pull request #74). Docs and test tools went to main afterwards (#75, no game
  change). SparkleStudio.exe stays at r69 (no Studio changes in r70).
- GitHub branches were cleaned (40 to 17) with the `Branch cleanup` job (`.github/workflows/branch-cleanup.yml`, started by
  hand; it never deletes `core/…`, `studio-exe`, `studio-draft`, `voices/…` or unmerged work unless named).

## What to collect for r71
Check every branch on GitHub (`git fetch --prune`), read each branch's board line and progress notes, merge the ones marked
"ready for Release". At handoff these had work that is not on main:
| Branch | What | State |
|---|---|---|
| `core/play-studio` | Auto play rebuilt (moves and plays like a child) | marked ready for Release (after r69) |
| `core/play` | Reading games speak their instructions (a11y) | 1 commit; check its board line |
| `claude/quirky-maxwell-4lm9tv` | Films batch: all 33 tale films drafted (Chinese and Indian too), narrator lines fill the old films | another chat's work; check its handoff note and board line, and the owner's three film notes in `docs/cores/tasks/films-batches.md` |
Also: any `bugfix/…` pull requests from the bug robot, and the Studio online family updates on main (photos, notes).

## Update from the previous Release chat (13 Oct, about 4:10 pm AEDT)
- **Done:** the 3 Tiến Lên voice lines are recorded (commit `12a24526`, on `claude/great-faraday-weuhjv`): `voicecover` passes.
- **First code map saved:** `tests/check-map.json` (135 checks, 186 files) and `tests/check-times.json` (commit `a857dff9`);
  `node suite.mjs --changed` now works. Times in it are from an overloaded run (too high); the next full run refreshes them.
- **3-at-once trial (full suite, 13 Oct):** 101 min, 127/135 passed; the 8 red ones were re-run alone: all pass except
  `startup` (over its limit as on main), so the others were overload (`solid`, `nametags`, `migrate`, `voicearea`,
  `testerreport`, `perf`; `perf` had also run with the code recording on: fixed, speed checks now run without it).
- **Timing of 9 everyday checks:** 1 at a time 7 min, 2 at once 5 min, 3 at once 4 min, 3 with one drawing thread 5 min
  (that switch does not help: not used).
- **The layout now (commit `e04802e8`):** the 16 heavy checks (`HEAVY` in `tests/suite.mjs`) share one lane, one after
  another; the everyday checks share the other lanes; any check that failed beside others runs once more alone and the
  summary lists it as "passed only alone" (a check that also fails alone stays FAILED). Default `--jobs 3`.
- **Running when this was written:** a full suite with that layout (started 4:04 pm AEDT). If its result is not recorded
  below, run `cd tests && node suite.mjs` once yourself as r71's full suite: it proves the layout and refreshes the map.
  Then write the real time into CLAUDE.md "Checks and the full suite" (it still says "about an hour") and
  `docs/cores/release.md` step 4, and replace item 2 below ("run --jobs 2") with what the run showed.
- **Heavy-lane run, 44 min in (4:48 pm AEDT):** 57/135 done, load still about 14 on 4 processors: drawing the 3D valley
  in software keeps every processor busy, so running side by side gains only about 1.5x (expect 100 to 110 min, not 60).
  Red so far, all timeouts of the overload kind: `phone`, `autoplay`, `solid`, `voicearea` (they re-run alone at the end).
  So: CLAUDE.md and `docs/cores/release.md` should say "about 1 hour 45 minutes" for the full suite, and the real speed-up
  is `--changed` (a change runs 10 to 20 minutes of checks) and the full suite only once per release. A bigger machine or
  the GitHub full suite (Round W idea 4, split over about 6 machines) would be the next step.
- **Not yet tried:** `--changed` on a real edit. Try it: change one line inside a function in, say, `js/hud.js`, run
  `node suite.mjs --changed --list`, check the list is short and sensible, undo the edit.

## Must do in r71
1. **Record 3 voice lines** (the `voicecover` check found them): "▶ Play Tiến Lên (southern rules)", "▶ Play Tiến Lên (northern
   rules)", "Tiến Lên, northern rules (cards)" (English; r70 gave the Tiến Lên variants English words). With `AZURE_SPEECH_KEY`:
   `node tools/make-voice-pack.mjs --engine azure --key "$AZURE_SPEECH_KEY" --region "$AZURE_SPEECH_REGION"` (never print the key).
2. **The full suite with `tests/suite.mjs`** (rules in CLAUDE.md). Warning from its first trial on 13 Oct: **3 at once
   overloaded the 4-processor machine** (load about 14: each test browser draws the 3D valley on every processor), so checks
   ran slowly and `solid`, `nametags`, `migrate`, `voicearea`, `testerreport` failed from overload. Until that is tuned, run
   `node suite.mjs --jobs 2`, re-run anything red alone with `node run.mjs <check>` before calling it a real failure, and
   tune it: try one drawing thread per browser (a Chromium flag in `tests/harness.mjs` `launch()`, e.g.
   `--num-raster-threads=1`) and measure 2 and 3 at once; write the setting that works into CLAUDE.md "Checks and the full
   suite", `tests/suite.mjs` (default `--jobs`) and `docs/cores/release.md`.
3. After a clean full suite, **commit the new `tests/check-map.json` and `tests/check-times.json`** (the code map that
   `suite.mjs --changed` needs; it was never saved yet, so `--changed` falls back to the full suite until then).
4. Version r71 (`js/build.js`, `sw.js` VERSION, `studio/version.json`), phone/tablet/computer screenshots, the Netlify zip,
   the report, ONE pop-up "yes, deploy" (Recommended first). After it: pull request into main, merge, confirm live
   (`curl https://sparklevalley.netlify.app/js/build.js`, AEDT), update board, release notes, HANDOFF; publish the Studio exe
   only if `studio/` really changed (`bash tools/publish-exe.sh "notes"`).

## Waiting on the owner
- The iPhone microphone on r70 (Friends and voice control). If it still fails: Friends → "Microphone test (grown-ups)" →
  "Copy the answers"; the cause found on 13 Oct was iPhone's play-only sound mode (`js/audio.js` `micMode()`).
- GitHub setting "Automatically delete head branches" (Settings → General → Pull Requests), suggested 13 Oct.
- `core/battery`, `core/play-reading`, `core/front-desk` are finished; the owner can delete them on GitHub's Branches page.

## After r71
- The full suite on GitHub (owner said plan it, 13 Oct): `docs/cores/tasks/github-suite.md`, an Analytics & Infra chat.
Round W (`docs/cores/ROUND-W.md`: split main.js and ui.js, type-check key files, UI tidy-up; plan first, the owner's "go"),
then the batch rollout (`docs/cores/tasks/rollout.md`).

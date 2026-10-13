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
Round W (`docs/cores/ROUND-W.md`: split main.js and ui.js, type-check key files, UI tidy-up; plan first, the owner's "go"),
then the batch rollout (`docs/cores/tasks/rollout.md`).

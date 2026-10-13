# The full suite on GitHub (brief, 13 Oct AEDT)

Owner, 13 Oct AEDT (pop-up answer): "Plan the GitHub full suite on top of today's method: yes". Start a chat and send:

> You are the **Analytics & Infra** core. Do `docs/cores/tasks/github-suite.md`.

Plan first (CLAUDE.md helper rules): show the plan, wait for the owner's "go".

## Why
The full suite on a chat's machine takes about 1 hour 45 minutes (4 processors, the 3D valley drawn without a graphics
card; running checks side by side only gains about 1.5x and causes timeouts), the chat waits and uses Claude usage, and
background jobs stop at 2 hours. On GitHub, split over about 6 machines, it should take about 25 to 30 minutes, free of
Claude usage, with the result on the pull request.

## What stays (today's method, `tests/suite.mjs`, rules in CLAUDE.md "Checks and the full suite")
- `node suite.mjs --changed` for every change, on the chat's own machine.
- The code map `tests/check-map.json` and `tests/check-times.json` (the GitHub run refreshes them).
- The samples for `reading`, `films`, `voicearea` (`SV_SAMPLE`, `SV_FULL`, `SV_SEED`).
- `node suite.mjs` locally as the backup (GitHub down or out of free minutes).
- The speed checks `perf`, `startup`, `battery` stay local (GitHub machines are shared: their speed changes minute to minute).

## Build
1. `.github/workflows/full-suite.yml`: on a pull request into `main` (and by hand). A matrix of about 6 jobs; each job:
   checkout, Node 22, `cd tests && npm install --no-package-lock --no-save && npx playwright install --with-deps chromium`
   (as `pr-checks.yml` does), serve the repo (`python3 -m http.server 8765 &`), run its share of the checks.
2. A way to give each job its share: e.g. `node suite.mjs --shard k/6 --jobs 1 --no-solo` (new options in `suite.mjs`:
   split the checks into 6 groups by `check-times.json`, heavy checks spread out, speed checks left out). Each job uploads
   its results and `out/cover/*.json`.
3. A last job collects the results: one summary on the pull request (passed, failed, skipped, "passed only alone"), and
   the refreshed `check-map.json` and `check-times.json` as an artifact (Release commits them).
4. A check that fails on GitHub runs once more in the same job before it counts (as `suite.mjs` does locally).
5. Voices: the checks that need `voices/` files get them from the checkout (they are in the repo).

## Prove it before trusting it
Run it on a test pull request and run `node suite.mjs` locally on the same commit. Compare check by check. Fix every check
that differs (fonts, browser version, timing); write down any that must stay local and why. Only then change the rules.

## Then change the rules
CLAUDE.md "Checks and the full suite", `docs/cores/release.md` step 4, `tests/README.md`, HANDOFF §2: "the full suite runs
on GitHub on the release pull request (about 25 to 30 minutes); the speed checks locally (`node run.mjs perf startup
battery`); `node suite.mjs` is the backup".

## Watch
- Free minutes: about 2,000 a month if the repository is private; one full run over 6 machines is about 150 to 180
  minutes, so about 10 releases a month. Run it only on pull requests into `main` and by hand, never on every push.
- Online checks stay skipped (no relay on GitHub either) unless a local PeerJS and MQTT server is started in the job.

# Task brief: smaller start-up download and checks on every pull request (Analytics & Infra core)

Written 10 Oct 2026 (AEST). The rules for helper chats are in `CLAUDE.md`; this brief says what to build.

## Goal
From `docs/cores/ROUND-R.md` (Infrastructure): "bundle and compress the code; GitHub CI with deploy previews; split main.js into the 8 cores. (Voices and exe stay in git for now.)" **This task does the first two only.** Splitting `main.js` waits until the map work (Round T) is merged.

## What to build
- **Bundle and compress the start-up scripts** with a tool script (not by hand), run when the Netlify zip is built (`build-netlify.sh`) and by Netlify. Development keeps working with the plain ES modules (no build step needed to run the game locally or in the tests).
- The service worker (`sw.js`) still caches everything for offline, and a new build still updates devices.
- **Done by Release (10 Oct AEST, owner's request):** `.github/workflows/pr-checks.yml` (quick checks on every pull
  request into `main`) and `.github/workflows/ai-review.yml`. Extend `pr-checks.yml` rather than adding a second one.
  Still to do: run the fast checks on every push to a branch too. The original item: **a GitHub Actions workflow** that runs the fast checks on every pull request and every push to a branch: unit tests, `node tools/rules-from-doc.mjs --check`, `node tools/preload.mjs --check`, the emoji audit, and `arch` if it runs without a browser. Netlify already makes deploy previews; the workflow need not deploy.
- Voices and SparkleStudio.exe stay in git (do not move them).

## You may change
`build-netlify.sh`, new files under `tools/`, `.github/workflows/` (a new workflow; leave `drive-mirror.yml` and `pages.yml` alone), `netlify.toml`, `sw.js` (caching), `index.html` (the start-up script list), `tests/run.mjs` (`perf`, `preload`, `boot`), `docs/cores/analytics-infra.md`, `docs/INFRASTRUCTURE.md`.

## Checks
Your core's checks (`docs/cores/analytics-infra.md`), plus `boot preload perf voicepack iphone`, then the full suite on the plain modules and the `boot` and `perf` checks again on the built zip served locally. Put the start-up download and time to "Who's playing?" before and after in the report.

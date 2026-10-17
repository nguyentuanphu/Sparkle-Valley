# Takeover prompt for the Studio live chat (17 October 2026 AEDT, round r81)

The first Studio live chat built the work and handed over. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are a helper chat on Sparkle Valley (Studio core), taking over the r81 "Studio live" work from another chat. Another chat, **Release**, owns `main`, the version number and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md` (including "No answer within 15 minutes: carry on"), `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/studio.md` (Owner's decisions: 17 Oct AEDT r81 entry, and the last progress note) and `docs/cores/BOARD.md` (section "Studio live").
2. Read the original brief: `docs/owner-repair-20261014/STUDIO-LIVE-CHAT-PROMPT.md`. Its rules still apply (version files, map files, family data, both languages, pop-up questions, AEDT).
3. Take over the branch: `git fetch origin work/studio-live-20261017 work/r80-20261017 && git checkout -B work/studio-live-20261017 origin/work/studio-live-20261017`. Before every push merge `origin/work/r80-20261017` again, and `main` once r80 is on it. Never force-push.
4. Start the game server (`python3 -m http.server 8765` in the repo). If `npm ci` in `tests/` cannot reach the registry, link the machine's Playwright: `mkdir -p tests/node_modules && ln -s /opt/node-tools/node_modules/playwright tests/node_modules/playwright && ln -s /opt/node-tools/node_modules/playwright-core tests/node_modules/playwright-core`.

### 2. Where the work stands (17 Oct AEDT, about 10:30 am)

- **Built and pushed:** draft pull request #330 (`work/studio-live-20261017` into `main`), code at `96d783f6`, last commit `27d8f730` (docs). Board line says "ready for Release (r81)".
- **What it does:** the content pages (Message, Missions, Quiz, Our stories, Villagers names/voices/photo links, Story characters, Memory Villages, Simple screen, Defaults, Ads settings) save live at once:
  - website: `netlify/lib/live.mts` (`LIVE_SECTIONS`, `cleanContent`, `saveContent`, `readContent`; Blobs store `live`, key `content`; 200 KB cap; too-long text refused); `/studio/api/live/content` in `netlify/functions/studio.mts` (needs "edit"; the exe key allowed in `netlify/lib/admins.mts`); `/api/live` sends `content` (`netlify/functions/live.mts`).
  - game: `js/custom.js` (`useContent`: kept copy first, then the website's answer; `custom.json` stays the fallback), `js/main.js` (family message and Defaults follow `onLive`), `js/ads.js` (no picture yet, no ad).
  - Studio: `studio/ui/app.js` (`LIVE_PAGES`, `saveLivePage`, `liveBadge`, `PUB`; live copy laid over `CONTENT` on load), `studio/core.cts` and `studio/studio.cts` (the exe sends `live/content` with its Studio key and still writes its folder), `studio/ui/vi.js` (new server messages).
  - Rule STUDIO-002 reworded (`js/content/rules.js`, `docs/ARCHITECTURE.md`).
- **Checks passed locally (17 Oct AEDT):** `unit` (145, new `tests/unit/live-content.test.mjs`), `studiolive` (new, in `tests/run.mjs`), `studio` (online Message goes live with nothing waiting; the exe's Message goes live with its key), `nostudio`, `phone`, `rules`, `arch`; `types` skipped (no npm install).
- **Pictures looked at:** `docs/owner-repair-20261014/evidence/studio-live-before/` and `studio-live-after/` (made by `tests/owner-studio-live-shots.mjs`).
- **Waiting for:** the GitHub full suite on pull request #330 (run 38981057532, started 17 Oct 10:22 am AEDT). Look at its summary on the pull request. A red check is fixed, not waved through; name any check that passed only on its second try.

### 3. What to do

1. **Full suite result.** Open run 38981057532 (or the latest `full-suite.yml` run on the branch). For every red check: reproduce it locally (`cd tests && node run.mjs <check>`), check whether it is red on `work/r80-20261017` too (then it is not this branch's: say so on the board and the pull request, once), otherwise fix the root cause, run the check again and push. Afterwards run `git checkout tests/check-times.json tools/voice-daily.json`.
2. **Small extras that may join r81 (ask the owner with one pop-up before starting any of them; recommended first):**
   - a. `js/launch.js` reads `content/custom.json` itself for `features.explain_updateNotice`, so a live `features` value does not reach it. Make it also look at the kept live copy (`localStorage` `sv2_live`, `content.features`). Small; board note at "Studio live".
   - b. (Play reading → Studio, optional) Studio's Simple screen page lists games from `js/games/all.js`, so the reading games (registered by `js/games/readingmenu.js` only while `readingTrial` is on) are not listed.
   - c. Nothing else on the board or in GitHub issues is open for Studio. The third AI's R1 ("opening Studio online stops a child's game") is already fixed on r80 (`claimTab` is called by the game only, with a `.tab-held` check).
3. **Not for this chat:** rebuilding and publishing SparkleStudio.exe (`bash studio/build-exe.sh`, `tools/publish-exe.sh`) is Release's after r81 goes live.

### 4. Finishing

- Keep the "Studio live" Now line on `docs/cores/BOARD.md` current (what, branch, last commit, check results with dates in AEDT, "ready for Release (r81)").
- Add a progress note in `docs/cores/studio.md` (commit, every check pass/fail/skipped, date AEDT). Decisions the owner makes go under "Owner's decisions".
- Push only `work/studio-live-20261017` (`git pull --no-rebase` first); keep pull request #330 a draft.
- Report: what changed (files), every check (pass, fail or skipped), pictures looked at, choices assumed under the 15-minute rule, branch and last commit.

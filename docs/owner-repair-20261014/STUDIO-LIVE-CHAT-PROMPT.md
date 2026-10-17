# Prompt for the Studio live chat (17 October 2026 AEDT, for round r81)

The owner chose on 17 Oct AEDT: Studio's content pages go live at once, without Publish, in r81. This chat runs beside the r80 release. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are a helper chat on Sparkle Valley (Studio core). Another chat, **Release**, owns `main`, the version number and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md` (including "No answer within 15 minutes: carry on"), `HANDOFF.md`, `docs/cores/README.md`, `docs/cores/studio.md` and `docs/cores/BOARD.md`.
2. Make your branch from r80's branch. It holds the newest work, which is not yet on `main`:
   `git fetch origin work/r80-20261017 && git checkout -b work/studio-live-20261017 origin/work/r80-20261017`
   Before every push, merge it in again (`git fetch origin work/r80-20261017 && git merge --no-edit origin/work/r80-20261017`), and merge `main` once r80 is on it.
3. Start the game server (`python3 -m http.server 8765` in the repo). If `npm ci` in `tests/` cannot reach the registry, link the machine's Playwright: `mkdir -p tests/node_modules && ln -s /opt/node-tools/node_modules/playwright tests/node_modules/playwright && ln -s /opt/node-tools/node_modules/playwright-core tests/node_modules/playwright-core`.

### 2. How Studio reaches devices today (checked 17 Oct AEDT)

- **Live at once (online Studio only):** Releases, Festivals, Sparkle Lab and tester controls.
  - Path: `studio/ui/app.js` `saveLive` (about line 647), then `/studio/api/live` (`netlify/functions/studio.mts`), then `netlify/lib/live.mts` (`saveLive`, cleaned by `cleanLive`), then the public `/api/live` (`netlify/functions/live.mts`, `Cache-Control: public, max-age=30`).
  - The game reads it in `js/custom.js` (about lines 104 to 120): the copy kept in localStorage (`sv2_live`) first, then the website's answer, and `onLive` listeners when it changed. A live rule wins over the same rule in `custom.json` (`pick()`).
  - `sw.js` never caches `/api/`.
- **Needs Publish, then a Netlify build:** everything else on the content pages: Message, Missions, Quiz, Our stories, Villagers (names), Story characters, Memory Villages (plots), Simple screen (`activities`), Defaults (`defaults`, `features`), Ads settings, and the photo links (`faces[].photo`, `album`).
  - Path: `saveContent` (`app.js` about line 56), then `writeContent` (`studio/core.cts` about line 294) into `content/custom.json`, held in the blob store `studio-pending`.
  - Publish (`core.cts` about lines 128 to 166, 518 to 523) commits to `studio-draft`, then moves `main`, which makes Netlify build.
- **SparkleStudio.exe:** has no live path; even Releases and Festivals need Publish there.

### 3. What to build

1. **The content pages above go live at once.**
   - `cleanLive` in `netlify/lib/live.mts` keeps a checked section for each one: allowed keys only, size limits per item and for the whole answer (it goes to every device at every opening), text cleaned the way `custom.json` content is.
   - `js/custom.js` merges each section the way `pick()` does: live wins, and `custom.json` stays the fallback.
   - Each Studio page saves through `saveLive`, the way Releases do.
2. **Photo links live.** The photos are already in the private family store at once (`core.cts` about lines 466 to 470); only their link waits for Publish today.
3. **Screens that read once at start.** Most `CUSTOM.*` values are read once when the game opens. Where a page's change should show without reopening (Message, Missions), hook it to `onLive`. Otherwise, say in Studio that it shows the next time the game opens.
4. **Studio says it plainly.** Each page shows "Live: devices get it the next time they open the game (about 30 seconds)", or "Needs Publish" for what stays there, in English and Vietnamese.
5. **SparkleStudio.exe.** Make it save these pages to the website's `/studio/api/live` with its Studio key. If that is too big for r81, list it under "not done" and keep Publish working in the exe.
6. **What stays on Publish:** game code, the map and buildings (tied to `W.MAP_VERSION`), music, ad pictures, recorded voices and real photos (files kept for offline use). Do not move them.
7. **Old values.** A value already in `custom.json` keeps working until a live one replaces it. Nothing a child already has is taken away.

### 4. Checks

1. **Unit tests** for `cleanLive`: each new section, the size limits, and refusal of unknown keys and oversized text.
2. **A check in `tests/run.mjs`** (comment inside the `await check(...)` block, no loose lines or blank lines between blocks):
   - a live Message, Mission, Quiz question and Defaults switch reach the game with no Publish, in English and in Vietnamese;
   - a live value wins over `custom.json`;
   - with no internet the game uses its kept copy.
3. **Pictures** of the Studio pages, before and after, in `docs/owner-repair-20261014/evidence/studio-live-*`. Look at them.
4. **The suite:** run `cd tests && node suite.mjs --changed`. If it chooses the full suite, push your branch and start `.github/workflows/full-suite.yml` by hand on it instead (CLAUDE.md, 17 Oct). Afterwards run `git checkout tests/check-times.json tools/voice-daily.json`.

### 5. Finishing

- Push your branch only, never `main`. Run `git pull --no-rebase` first, then `git push -u origin work/studio-live-20261017`. Open a draft pull request against `main`.
- On `docs/cores/BOARD.md`, add your section with a "Now" line: what you did, your branch, your last commit, the check results (pass, fail or skipped, with the date in AEDT), and "ready for Release (r81)".
- Report: what changed (files), every check with pass, fail or skipped, the pictures you looked at, any choice assumed under the 15-minute rule, your branch and last commit.

### 6. Rules

- **Version:** do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- **Map:** do not change world positions or the map files listed in CLAUDE.md (helper rule 4).
- **Where analytics go:** device statistics (for example devices not seen for 30 days) belong in Studio's analytics only, never on the game's Grown-ups screen (owner, 17 Oct AEDT).
- **Family data:** never delete or overwrite children's saves or family data. Keys stay in environment settings, never printed or committed.
- **Players:** everything a child sees or hears is in English and Vietnamese. Studio pages are in both languages too.
- **Checks and questions:** never weaken or delete a check. Ask the owner only with pop-up questions, one short question each, and give times in AEDT.
- **Plan first:** show the owner your plan in one short pop-up and wait for "go".

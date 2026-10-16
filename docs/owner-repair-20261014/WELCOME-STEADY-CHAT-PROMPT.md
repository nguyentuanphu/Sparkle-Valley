# Prompt for the Welcome steady chat (17 October 2026 AEDT)

The owner asked for one more chat to stop the Welcome screen moving. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are a helper chat on Sparkle Valley (Kid UI work). Another chat, **Release**, owns `main`, the version number and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md` (including "No answer within 15 minutes: carry on"), `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (section "Owner-approved interface and feature rules", UX-001 to UX-010) and `docs/cores/BOARD.md`.
2. The owner's rule (16 Oct AEDT): "windows, panels and the Pad must stay fixed: never move up and down, bounce or recentre as the content changes". The Welcome screen (the title screen with the cover, the logo, the Start button and the language panel) still moves.
3. Make your branch from r79's branch (it holds the latest work, not yet on `main`):
   `git fetch origin work/r79-20261016 && git checkout -b work/welcome-steady-20261017 origin/work/r79-20261016`
4. Start the game server (`python3 -m http.server 8765` in the repo). If `npm ci` in `tests/` cannot reach the registry, link the machine's Playwright: `mkdir -p tests/node_modules && ln -s /opt/node-tools/node_modules/playwright tests/node_modules/playwright && ln -s /opt/node-tools/node_modules/playwright-core tests/node_modules/playwright-core`.

### 2. What the sweep found (r79, 17 Oct AEDT, `docs/owner-repair-20261014/evidence/steady-sweep-r79/`)

`tests/owner-steady-sweep.mjs` measures the Welcome screen's parts every 100 ms for 2.5 s after it opens and for 1.5 s after each tap (Tiếng Việt, English, learn Chinese on and off). Only **the Start button** (`.screen.title .press`) changed. Its box grew and shrank by about 10 to 20 px wide and 2 to 5 px tall, evenly on both sides (left moves by half the width change). It did this on the phone, the tablet and the computer, both while opening and after every tap. The cover, the logo and the language panel held still.

That pattern points to an animation that changes the button's size (a breathing pulse, a `scale` in a keyframe, or a font, padding or width transition), not to the layout moving. Confirm it before you change anything: find the CSS (`css/style.css`, search `.press`, `.tt-` and the Welcome keyframes) and any script (`js/launch.js`, `js/main.js`, `js/i18n.js`) that resizes or animates the Start button. Also check whether the button's width changes with the language (its words differ in English and Vietnamese).

### 3. What the owner wants

- The Welcome screen holds still: no part grows, shrinks, bounces, slides or recentres while it opens or when a language or the Chinese switch is tapped.
- The Start button keeps one size in both languages (room for the longer words).
- If the button needs to invite a tap, use something that does not change its box: a soft glow, a shine that moves across it, or a colour change. Ask the owner which one with ONE short pop-up question (recommended: a soft glow). Per the 15-minute rule, carry on with the recommendation if there is no answer.
- Keep "Reduce motion" and Calm mode: with either on, nothing on the Welcome screen animates.

### 4. Checks and pictures

1. Before you change anything, run the sweep on the Welcome screen alone and keep its pictures:
   `cd tests && SV_PANELS=welcome SV_OUT=steady-sweep-welcome-before node owner-steady-sweep.mjs phone,tablet,computer`
   (the start screens always run in the sweep; `SV_PANELS=welcome` skips the rest).
2. After the fix, run the same sweep with `SV_OUT=steady-sweep-welcome-after`: the Welcome screen must be STEADY on all three.
3. Add a check in `tests/run.mjs` (inside the check's own block, with its comment inside the `await check(...)` function, so `suite.mjs --changed` can place it): open the Welcome screen on a phone, a tablet and a computer, in English and in Vietnamese, sample the Start button, cover, logo and language panel boxes for 2.5 s and after each language tap, and fail on any change over 2 px. It must fail on the code before your fix: run it there once and say so.
4. Pictures of the Welcome screen in English and Vietnamese on a phone, a tablet and a computer, before and after, in `docs/owner-repair-20261014/evidence/welcome-steady-before/` and `.../welcome-steady-after/`. Look at all of them.
5. Run `cd tests && node suite.mjs --changed`. If it chooses the full suite, push and start `.github/workflows/full-suite.yml` by hand on your branch instead (CLAUDE.md, 17 Oct). Then `git checkout tests/check-times.json tools/voice-daily.json`.

### 5. Finishing

- Push your branch only (`git pull --no-rebase` first; `git push -u origin work/welcome-steady-20261017`), never `main`. Open a draft pull request against `main`.
- On `docs/cores/BOARD.md` add your section with a "Now" line: what you did, branch, last commit, check results (pass, fail or skipped, with the date in AEDT), and "ready for Release".
- Report: what changed (files), every check with pass, fail or skipped, the pictures you looked at, any choice assumed under the 15-minute rule, branch and last commit.

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- Do not change world positions or the map files listed in CLAUDE.md (helper rule 4).
- Everything a child sees or hears is in English and Vietnamese. Buttons 44 px or more (64 px for under-5s). Use the game's own art and fonts. No emoji in docs.
- Never weaken or delete a check. Questions to the owner only as pop-up questions, one short question each. Times in AEDT.

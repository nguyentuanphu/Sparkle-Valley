# Prompt for chat A: Feel and sound (owner plan, 16 October 2026 AEDT)

The owner split the "feel and sound, sticker book, daily adventure" plan into three chats on 16 Oct AEDT. Chat A (this one) builds feel and sound. Chat B builds the sticker book and uses chat A's effects. Chat C builds the daily adventure and uses both. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are chat A of three helper chats on Sparkle Valley: feel and sound. Chat B (sticker book, branch `work/sticker-book`) and chat C (daily adventure, branch `work/daily-adventure`) build on your work. Another chat, **Release**, owns `main`, the version number, the voice index and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (with "Owner-approved interface and feature rules", UX-001 to UX-010), `docs/ARCHITECTURE.md` and `docs/cores/BOARD.md`.
2. Read this file and the other two prompts in `docs/plans-20261016/`, so you know what B and C need from you, and UI-8 in `docs/ui-redesign-20261016/README.md`.
3. Check on the board that r79 is on `main`. If it isn't yet, stop and tell the owner with one pop-up.
4. Create your branch from `main`: `git fetch origin main && git checkout -b work/feel-sound origin/main`.
   The plan and mockup docs (`docs/plans-20261016/`, `docs/ui-redesign-20261016/`) are on the branch `work/plans-20261016` until Release merges it. If they are not on `main` yet, read them there first (`git fetch origin work/plans-20261016 && git show origin/work/plans-20261016:docs/plans-20261016/<file>`) and merge that branch into yours right after creating it: `git merge --no-edit origin/work/plans-20261016`.
5. **Push the API first.** Before anything else, write `js/feel.js` with the five functions below (they can do little at first), commit, and push. B and C start from it. Write "feel.js API pushed" on the board with the commit id.

### 2. What to build (in this order, commit after each)

| Item | What it means |
|---|---|
| F1 `js/feel.js` | One module every screen uses: `press(el)`, `open(panel)`, `close(panel)`, `reward(kind, fromEl or world point, toEl)` with kind coin, star or sticker, and `nope(el)`. Nothing else in the game makes its own press, open or reward effect from now on. |
| F2 Buttons | One listener: every `button` sinks into its shadow on press and springs back, with a sound. Main buttons sound lower, round Close buttons higher. |
| F3 Sounds | Made in code like the existing `SFX` in `js/audio.js`, no sound files. New: whoosh (window opens), whoop (closes), boing (replaces the low "no" tone for a wrong tap), swish (mirror), shhk (sticker), and a drum-roll then ta-da (adventure done). Coins earned close together climb the scale with the existing `pop(n)`. |
| F4 Movement | In `css/style.css`: pop-in 180 ms, shrink 120 ms, press, wiggle, breathe. All off when `reduceMotion()` (`js/state.js`) is true. |
| F5 Rewards that fly | A coin, star or sticker flies from where it was earned into its counter, and the counter jiggles. Confetti in the six game colours for finished adventures: at most 60 pieces lasting 1.2 seconds, within PERF-001 to 005. |
| F6 The world | Each animal gets 2-3 different reactions when tapped (flap, roll over, bob), with `animalCall`. Small sparkles where the child taps. Dust puffs when running, off on low quality. |
| F7 Help for under-5s | Things they can tap slowly breathe (grow and shrink a little). After 10 seconds without a tap, the companion points: "Over there!". Never a countdown. |

### 3. Files: keep out of the others' way

- Yours: `js/feel.js`, `js/audio.js`, the animal reactions, the button listener.
- Chat B's: `js/stickers.js`, `js/content/stickers.js`, the Album part of `js/ui.js`, `js/placebook.js`.
- Chat C's: `js/adventure.js`, `js/content/adventures.js`, the goal chip in `js/hud.js`, the Adventures part of `js/ui.js`.
- Shared files (`js/art.js`, `css/style.css`, `tests/run.mjs`): add your work only as your own block at the END of each file, under `/* feel and sound (chat A) */`. Do not edit the other chats' lines.
- A new `.js` file: ask Release on the board to add it to the offline list.

### 4. Checks and pictures

1. A new `feel` check in `tests/run.mjs`: every button gets the press effect, every window opens and closes through `feel`, and calm mode has no movement. `perf` and `contract` must stay as they are (no screen's structure changes).
2. Pictures (and a short screen recording if you can) on a phone, a tablet and a computer in `docs/plans-20261016/evidence/feel-*`. Look at all three before reporting.
3. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`. One test run at a time.
4. Record the results (commit id, every check with pass, fail or skipped, date AEDT) in your progress note on `docs/cores/BOARD.md`.

### 5. Finishing

Push your branch only (`git pull --no-rebase` first; `git push origin work/feel-sound`), never `main`, and no pull request against `main`. When everything is done and checked, write "Feel and sound: ready for Release" on the board with your last commit id. Release merges A first, then B, then C.

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- Do not change any screen's layout, colours or texts: this round only adds movement and sound.
- Everything a child sees or hears is in English and Vietnamese. No emoji in the game's look or in docs. Nothing scary, no loud sounds, nothing that punishes.
- Never push to `main`. Never weaken or delete a check.
- Questions to the owner only as pop-up questions, ONE short question per pop-up. Times in AEDT.
- Plan first: show the owner your plan in one short pop-up and wait for "go". Then ask, one pop-up each:
  - "Add a 'Tap sounds' on/off switch in Grown-ups?" (Yes (Recommended) / No)
  - "Confetti for under-5s too?" (Yes, gentle (Recommended) / No)

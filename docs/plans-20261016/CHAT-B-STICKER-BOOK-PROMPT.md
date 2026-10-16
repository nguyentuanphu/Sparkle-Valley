# Prompt for chat B: Sticker book (owner plan, 16 October 2026 AEDT)

The owner split the "feel and sound, sticker book, daily adventure" plan into three chats on 16 Oct AEDT. Chat A builds feel and sound. Chat B (this one) builds the sticker book. Chat C builds the daily adventure, and its rewards are your stickers. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

**Round (owner, 17 Oct AEDT): r80.** r79 is taken by other work; chats A, B and C all go into **r80** together. r79 may not be on `main` yet when you start: do not stop for that (owner, 16 Oct: "just work first"); start from `main` as below and Release puts everything in r80.

You are chat B of three helper chats on Sparkle Valley: the sticker book. Chat A (feel and sound, branch `work/feel-sound`) gives you the flying-sticker effect. Chat C (daily adventure, branch `work/daily-adventure`) gives stickers as rewards through your `stickers.give(id)`. Another chat, **Release**, owns `main`, the version number, the voice index and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (with UX-001 to UX-010), `docs/ARCHITECTURE.md` and `docs/cores/BOARD.md`.
2. Read this file and the other two prompts in `docs/plans-20261016/`.
3. Read the owner's mockups and rules in `docs/ui-redesign-20261016/` (`README.md`, and `canvas/Stickers.dc.html` for the exact design). Follow UI-1 to UI-10 and STK-1 to STK-6 (also copied in section 2 below).
4. Check on the board that chat A wrote "feel.js API pushed" (it has: `work/feel-sound`, ready for Release). If it is missing, tell the owner with one pop-up.
5. Create your branch: `git fetch origin main work/feel-sound && git checkout -b work/sticker-book origin/main && git merge --no-edit origin/work/feel-sound`. Merge `origin/work/feel-sound` again before each push.
   The plan and mockup docs (`docs/plans-20261016/`, `docs/ui-redesign-20261016/`) are on the branch `work/plans-20261016` until Release merges it. If they are not on `main` yet, read them there first (`git fetch origin work/plans-20261016 && git show origin/work/plans-20261016:docs/plans-20261016/<file>`) and merge that branch into yours right after creating it: `git merge --no-edit origin/work/plans-20261016`.
6. **Push the API first.** Write `js/stickers.js` with `give(id)`, `has(id)` and `count()` (they can do little at first), commit and push, then write "stickers API pushed" on the board with the commit id. Chat C starts from it.

### 2. What to build (in this order, commit after each)

| Item | What it means |
|---|---|
| S1 Sticker list | `js/content/stickers.js`: every sticker has an id, its page, a drawing from `js/art.js`, an English and Vietnamese name, a hint (where to find it), how it is earned (an event that exists), and its sound. Every page has exactly 9. Unit tested. |
| S2 Pages | Farm friends, Wild animals, Yummy dishes, Fruit and flowers, Treasures, Places Vietnam, Places Australia and the world, Festivals, Friends and family, Rare and shiny. |
| S3 Nothing lost | Move what already exists into the pages: "My treasures" into Fruit and flowers and Treasures; `js/placebook.js` place stickers and postcards into Places; family cards into Friends and family; the stickers from `js/surprises.js` into Rare and shiny. Old saves keep everything (UX-009). |
| S4 Earning | `stickers.give(id)` is called from events that already happen (meeting an animal, cooking, arriving at a place, a festival, a surprise). It uses chat A's `feel.reward('sticker', …)`, adds a "New!" badge, and shows the number of new stickers on the button. |
| S5 Screen | The Album tab becomes the sticker book, as in the mockup: tabs by theme, 3 x 3 page, count and progress bar, missing stickers as a grey shape with "?" and a hint (spoken on tap). The scrapbook stays: the child decorates it with stickers they own. |
| S6 First minutes | A new player gets 3 stickers in their first 5 minutes (meeting Grandpa Owl, the hen, the first village). No page is ever completely empty. |
| S7 Prizes | A full page gives a golden frame plus one prize (a new song or a decoration for their house). When a child earns a sticker they already have, a 1 in 20 chance of a shiny copy. |
| S8 Tap a sticker | It says its name in English and Vietnamese with the recorded voice and plays its sound. |

**Rules for this screen (STK, owner-approved design):**
- STK-1 Pages of exactly 9 (3 x 3), one theme each; the tab colour is the theme colour.
- STK-2 Stickers they have: full colour plus name. Missing: grey shape, "?" and a hint of where to find it (spoken on tap).
- STK-3 Never an empty page. The first page always has 2-3 stickers a new player gets in the first minutes.
- STK-4 Every page shows a count, a progress bar and its prize at the bottom.
- STK-5 A new sticker keeps a purple "New!" badge until tapped; the button shows how many are new.
- STK-6 Tapping a sticker says its name in both languages and plays its sound.

### 3. Files: keep out of the others' way

- Yours: `js/stickers.js`, `js/content/stickers.js`, the Album part of `js/ui.js`, `js/placebook.js`, the `give()` calls you add to existing events.
- Chat A's (do not change): `js/feel.js`, `js/audio.js`.
- Chat C's (do not change): `js/adventure.js`, `js/content/adventures.js`, the goal chip in `js/hud.js`, the Adventures part of `js/ui.js`.
- Shared files (`js/art.js`, `css/style.css`, `tests/run.mjs`, `js/state.js`): add your work only as your own block at the END of each file, under `/* sticker book (chat B) */`. In `js/ui.js` change only the Album tab.
- A new `.js` file: ask Release on the board to add it to the offline list.

### 4. Checks and pictures

1. Unit test for the sticker list: every sticker has a drawing, both names, a hint and an earning event that exists; every page has 9. An old-save test: a save from before keeps every treasure, place, postcard and family card.
2. A `stickers` check in `tests/run.mjs`: earning, the New! badge, a full page and its prize, both languages, under-5 and big kid, phone and computer. The `contract` check changes because the Album changes: run `--update-contract` only after the owner says yes (pop-up), and say so on the board.
3. Pictures before and after on a phone, a tablet and a computer in `docs/plans-20261016/evidence/stickers-*`. Look at all three before reporting.
4. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`. One test run at a time.
5. Record the results (commit id, every check with pass, fail or skipped, date AEDT) on `docs/cores/BOARD.md`.

### 5. Finishing

Push your branch only (`git pull --no-rebase` first; `git push origin work/sticker-book`), never `main`, and no pull request against `main`. When everything is done and checked, write "Sticker book: ready for Release" on the board with your last commit id. Release merges A first, then B, then C.

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- New spoken lines (every sticker name and hint): list them on the board for Release to record. No child's name in a spoken line.
- Everything a child sees or hears is in English and Vietnamese. Buttons at least 56 px for children, 64 px for under-5s. Use the game's own art and fonts. No emoji in the game's look or in docs.
- Never push to `main`. Never weaken or delete a check.
- Questions to the owner only as pop-up questions, ONE short question per pop-up. Times in AEDT.
- Plan first: show the owner your plan in one short pop-up and wait for "go". Then ask, one pop-up each:
  - "Rename the Album button to Stickers?" (Yes (Recommended) / Keep Album)
  - "Prize for a full page?" (Golden frame + a song (Recommended) / Golden frame + a house decoration / Golden frame only)

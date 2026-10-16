# Prompt for chat C: Daily adventure (owner plan, 16 October 2026 AEDT)

The owner split the "feel and sound, sticker book, daily adventure" plan into three chats on 16 Oct AEDT. Chat A builds feel and sound. Chat B builds the sticker book. Chat C (this one) builds the daily adventure, which uses both. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

**Round (owner, 17 Oct AEDT): r80.** r79 is taken by other work; chats A, B and C all go into **r80** together. r79 may not be on `main` yet when you start: do not stop for that (owner, 16 Oct: "just work first"); start from `main` as below and Release puts everything in r80.

You are chat C of three helper chats on Sparkle Valley: the daily adventure. Chat A (feel and sound, branch `work/feel-sound`) gives you `feel.js`: the press, open, reward and confetti effects. Chat B (sticker book, branch `work/sticker-book`) gives you `stickers.give(id)` for rewards. Another chat, **Release**, owns `main`, the version number, the voice index and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (with UX-001 to UX-010), `docs/ARCHITECTURE.md` (events and lifecycle) and `docs/cores/BOARD.md`.
2. Read this file and the other two prompts in `docs/plans-20261016/`. Read `js/surprises.js` and `js/content/surprises.js` (how a thing waits for the child so it is never missed), `js/wayfind.js` ("Show me the way"), `js/owlguide.js` and the Adventures tab in `js/ui.js`.
3. Read the owner's mockups and rules in `docs/ui-redesign-20261016/` (`README.md`, and `canvas/Adventure.dc.html` and `canvas/HUD.dc.html` for the exact design). Follow UI-1 to UI-10, ADV-1 to ADV-6 and HUD-4 (also copied in section 2 below).
4. Check on the board that chat A wrote "feel.js API pushed" (it has) and that chat B wrote "stickers API pushed". If either is missing, tell the owner with one pop-up.
5. Create your branch: `git fetch origin main work/feel-sound work/sticker-book && git checkout -b work/daily-adventure origin/main && git merge --no-edit origin/work/feel-sound origin/work/sticker-book`. Merge both again before each push.
   The plan and mockup docs (`docs/plans-20261016/`, `docs/ui-redesign-20261016/`) are on the branch `work/plans-20261016` until Release merges it. If they are not on `main` yet, read them there first (`git fetch origin work/plans-20261016 && git show origin/work/plans-20261016:docs/plans-20261016/<file>`) and merge that branch into yours right after creating it: `git merge --no-edit origin/work/plans-20261016`.

### 2. What to build

**Part A (first, push and report when done):**

| Item | What it means |
|---|---|
| D1 List of adventures | `js/content/adventures.js`: each has an id, who gives it, exactly 3 steps (kind go, find, give, talk, play or cook, with a target and a count), the reward (sticker id, coins, an item), the ages, the places it uses, and festival or not. Unit tested like the surprises list. |
| D2 Choosing | One adventure per child per day, picked from the date and the child. Only in places the child has unlocked, no repeat within 7 days, a festival adventure on festival days. |
| D3 Steps | Steps listen for things that already happen (arriving at a place, picking something up, talking to someone, finishing a game, cooking). Things to find appear near the target and wait like surprises do, so they are never missed. |
| D4 Goal card | On the game screen: the step as a short line, progress dots (done = gold, not yet = dashed), and a hear-again button. Tapping it opens the adventure window. |
| D5 Adventure window | As in the mockup: Grandpa Owl's speech bubble, the 3 steps (tick, gold glow, dashed), the chest showing the reward, the week stamps, and one green "Let's go!" that closes the window and starts "Show me the way". |
| D6 Finishing | Chest opens with chat A's confetti and ta-da; the sticker comes through `stickers.give(id)`; coins fly into the counter. |
| D7 Kept | Family missions, side stories, the chests for two and the main adventure stay, behind one "More adventures" button in the Adventures tab. |
| D8 Switches | Grown-ups: Daily adventure on/off and when a new day starts. Studio switch `adventure` in `js/content/releases.js`. |

The first 10 adventures: Grandma Năm's eggs, Lost puppy, Market helper, Kite day, Grumpy Cloud, Ferry to Hà Nội, Lotus picking, Feed Mr. Bear's buffalo, Bánh mì delivery, Lantern night (festival).

**Part B (after part A is checked):**

| Item | What it means |
|---|---|
| D9 | 20 more adventures across the villages and cities, and festival adventures for each festival in the game. |
| D10 Week chest | 7 stamps in a week open a big chest (a new hat or pet). A missed day never takes a stamp away. |
| D11 Owl remembers | Owl talks about yesterday's adventure ("The puppy misses you!"), never with the child's name. |
| D12 Big kids (5 and over) | The same adventure, harder: find 5 instead of 3, count the coins, a two-part ask. A timer only if the grown-up chose "Tricky". |

**Rules for these screens (owner-approved design):**
- ADV-1 One adventure on screen at a time; other lists behind one "More adventures" button.
- ADV-2 Always 3 steps, each with a picture or number and at most 6 words.
- ADV-3 A character introduces it in a speech bubble (2 lines at most, recorded voice, no child's name in the spoken line).
- ADV-4 The reward is shown before the child starts.
- ADV-5 Week stamps only fill up; a missed day never takes one away; no timers for under-5s.
- ADV-6 One green "Let's go!" at the bottom; it closes the window and points the way.
- HUD-4 The goal card always shows progress and a hear-again button; tapping it opens the adventure.

### 3. Files: keep out of the others' way

- Yours: `js/adventure.js`, `js/content/adventures.js`, the goal chip in `js/hud.js`, the Adventures tab in `js/ui.js`, the Grown-ups switch.
- Chat A's (do not change): `js/feel.js`, `js/audio.js`.
- Chat B's (do not change): `js/stickers.js`, `js/content/stickers.js`, the Album tab. Need a new sticker for an adventure? Ask chat B on the board to add it.
- Shared files (`js/art.js`, `css/style.css`, `tests/run.mjs`, `js/state.js`, `js/content/releases.js`): add your work only as your own block at the END of each file, under `/* daily adventure (chat C) */`.
- A new `.js` file: ask Release on the board to add it to the offline list.

### 4. Checks and pictures

1. Unit test for the adventure list: every step's target exists, every place can be reached by road, every reward sticker exists in chat B's list, every line is in both languages.
2. An `adventure` check in `tests/run.mjs` that plays one adventure from start to finish (under-5 and big kid, English and Vietnamese, phone and computer), plus a missed day keeping the stamps. The `contract` check changes because the goal chip and the Adventures tab change: run `--update-contract` only after the owner says yes (pop-up), and say so on the board.
3. Pictures before and after on a phone, a tablet and a computer in `docs/plans-20261016/evidence/adventure-*`. Look at all three before reporting.
4. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`. One test run at a time.
5. Record the results (commit id, every check with pass, fail or skipped, date AEDT) on `docs/cores/BOARD.md`.

### 5. Finishing

Push your branch only (`git pull --no-rebase` first; `git push origin work/daily-adventure`), never `main`, and no pull request against `main`. When part A is done and checked, write "Daily adventure part A: ready for Release" on the board with the commit id; the same for part B. Release merges A first, then B, then C.

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- New spoken lines (every adventure, step and Owl line): list them on the board for Release to record. No child's, friend's or pet's name in a spoken line.
- Everything a child sees or hears is in English and Vietnamese. Buttons at least 56 px for children, 64 px for under-5s. Use the game's own art and fonts. No emoji in the game's look or in docs. Under-5s: no timers, no losing.
- Never push to `main`. Never weaken or delete a check.
- Questions to the owner only as pop-up questions, ONE short question per pop-up. Times in AEDT.
- Plan first: show the owner your plan in one short pop-up and wait for "go". Then ask, one pop-up each:
  - "When does a new adventure day start?" (6 am (Recommended) / Midnight / When the child first plays)
  - "Reward for each daily adventure?" (1 sticker + 10 coins (Recommended) / 1 sticker only / 1 sticker + 25 coins)
  - "Should family missions stay in the goal chip?" (No, only the daily adventure (Recommended) / Yes, take turns)

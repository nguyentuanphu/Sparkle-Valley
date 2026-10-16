# Prompt for the r79 learning chat (chat 2, 16 October 2026 AEDT)

The owner split r79 into two chats on 16 Oct AEDT. Chat 1 (branch `work/r79-20261016`) does parts A and B of `R79-CHAT-PROMPT.md` and the clothes. This chat, chat 2, does part C: learning. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are chat 2 of round r79 on Sparkle Valley, a helper chat. Chat 1 does the screens and clothes on `work/r79-20261016` and gathers your branch at the end. Another chat, **Release**, owns `main`, the version number, the voice index and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (section "Owner-approved interface and feature rules", UX-001 to UX-010) and `docs/cores/BOARD.md`.
2. Read in `docs/owner-repair-20261014/`: `R79-CHAT-PROMPT.md` (part C and the rules), `decisions.md` (the owner's 16 Oct answers at the end), `improvements.md`, `learning-progression.md` (with the third AI's 16 Oct section on the six reasoning games).
3. Your branch already exists:
   `git fetch origin work/r79-learning-20261016 && git checkout work/r79-learning-20261016`
   Before each push, merge chat 1's branch into yours: `git fetch origin work/r79-20261016 && git merge --no-edit origin/work/r79-20261016`.

### 2. What to build (part C, in this order, commit after each)

| Item | What it means |
|---|---|
| E1 | Learning games show one small reward banner at the top, not "Combo" and "Lucky star" stacked over the puzzle. |
| E3 | On a computer, game buttons like "Hear again", "Show again" and "Ready to try" use 18 to 20 px text. |
| E4 | A soft dark layer behind "You did it!" so it is readable over the board. |
| I1 | The level follows the child inside a learning game: three right in a row make the next round one step harder; two misses make it one step easier. Easy, Medium and Hard stay the starting point. |
| I2 | Each child's profile remembers the rule or story they missed most; the game brings it back first next time. A small per-child record, migrated safely (UX-009). |
| I4 | A sticker in the Pad's sticker book for finishing Hard in each reasoning game (for example "Rule finder", "Path planner"), drawn in `js/art.js`. |
| G2 | Picture-only mode for under-5s: question line hidden (the `explain_gameLine` switch exists), bigger pictures, a hand shows the first move the first time each game opens. |

Then the four new games the owner chose (16 Oct AEDT, all four), in the style of Khan Academy Kids but with the game's own art, voice and frame (`js/games/frame.js`), registered like the other learning games:

| Game | Age | What the child does | What they hear | How it gets harder | A wrong tap |
|---|---|---|---|---|---|
| Say it, find it | 3-6 | Hears "Where is the mango?" and taps it, or says the word into the microphone and hears it back | The word, then praise with the word again | 2, then 4, then 6 pictures; then two-word asks ("the red bird") | Names what was touched: "That is a banana. The mango is round and yellow-green." |
| Market counting | 3-7 | Drags fruit into a basket while each one is counted aloud | "One, two, three..." | Up to 5, then up to 10, then "add 2 more" or "take 1 away" | Too many or too few: the basket counts out loud and shows the gap |
| How do they feel? | 3-6 | Hears a short story ("Lá dropped her ice cream") and taps a face: happy, sad, surprised or cross | The story, then the feeling named | 2 faces, then 4, then "what could help?" | "Would you smile if your ice cream fell? Lá feels sad." |
| First sound hunt | 4-7 | Hears "b... ball" and taps everything that starts with the same sound, in English or Vietnamese | The sound and the word | 2 choices, then 4, then end sounds, and tones in Vietnamese | Says both words slowly so the difference can be heard |

The microphone in "Say it, find it" is optional: tapping always works, and nothing breaks without a microphone or permission.

### 3. Files: keep out of chat 1's way

- Yours: `js/games/frame.js`, `js/games/bigthinkers.js`, `js/games/bigthinkers2.js`, `js/games/learning.js`, `js/games/registry.js`, new game files under `js/games/`, the sticker book.
- Chat 1's (do not change): the Pad, Bag, Shop, wardrobe/mirror, top buttons, audio and camera trays, `js/shop.js`, `js/content/shop.js`, `js/avatar.js`, `js/ui.js`.
- Shared files (`js/art.js`, `css/style.css`, `tests/run.mjs`): add your work only as your own block at the END of each file, under a comment `/* r79 learning (chat 2) */` (or `// r79 learning (chat 2)`). Do not edit chat 1's lines.
- `js/state.js`: chat 1 adds the clothes gift boxes there first. Merge chat 1's branch before your I2 change, and add your per-child record next to it without touching theirs.
- A new `.js` file: ask Release on the board to add it to the offline list.

### 4. Checks and pictures

1. Add or update a check in `tests/run.mjs` for each item (every game at under-5, Easy, Medium and Hard, EN and VI, one wrong tap each, buttons 64 px for under-5s and 44 px otherwise, nothing off screen, no single-choice question, every wrong tap explained).
2. Before and after pictures on a phone, a tablet and a computer in `docs/owner-repair-20261014/evidence/r79-learning-*`. Look at all three before reporting.
3. Windows must never move up and down when content changes: `tests/owner-steady-sweep.mjs` (see its first lines) on the game screens.
4. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`. One test run at a time.
5. Record the results (commit id, every check with pass, fail or skipped, date AEDT) in your progress note on `docs/cores/BOARD.md`.

### 5. Finishing

The owner chose ONE handover for r79. Push your branch only (`git pull --no-rebase` first; `git push origin work/r79-learning-20261016`), never `main`, and do not open a pull request against `main`. When everything is done and checked, write "r79 learning: done, ready for chat 1 to merge" on the board with your last commit id. Chat 1 merges it, runs the checks together and marks r79 "ready for Release".

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. Never change the version.
- New spoken lines: list them on the board for Release to record.
- Everything a child sees or hears is in English and Vietnamese. Buttons at least 44 px, 64 px for under-5s. Use the game's own art and fonts. No emoji in docs. No timers and no "you lost" in learning games. No copying another app's characters or exercises.
- Never push to `main`. Never weaken or delete a check.
- Questions to the owner only as pop-up questions, ONE short question per pop-up (a large pop-up with several questions failed on 16 Oct). Times in AEDT.
- Plan first: show the owner your plan in one short pop-up and wait for "go".

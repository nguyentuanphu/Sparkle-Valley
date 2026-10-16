# Prompt for the r79 chat (16 October 2026 AEDT)

This replaces the earlier separate r79 and r80 prompts: the owner asked for ONE chat doing both, plus the bugs reported on 16 Oct. Paste everything under "Prompt" into a new Claude Code chat on the repository nguyentuanphu/Sparkle-Valley.

## Prompt

You are a helper chat on Sparkle Valley. Another chat is **Release**: it owns `main`, the version number, the voice index and every deployment. You never deploy.

### 1. Start

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (section "Owner-approved interface and feature rules", UX-001 to UX-010) and `docs/cores/BOARD.md`.
2. Read in `docs/owner-repair-20261014/`: `evidence-table.md` (rows 6, 7, 12, 14, 17, 18), `decisions.md`, `improvements.md`, `learning-progression.md`.
3. Your branch already exists, with the owner's screenshots in it:
   `git fetch origin work/r79-20261016 && git checkout work/r79-20261016`
4. Look at every picture in `docs/owner-repair-20261014/evidence/owner-reports-20261016/` before planning.

### 2. Part A: bugs the owner reported on 16 Oct (pictures 1 to 5)

| # | Picture | What is wrong | What the owner wants |
|---|---|---|---|
| A1 | 1 | Bag: item names run over their pictures ("a bowl of tàu hủ...", "Purple crystal"); icons not centred; long names squeezed. | Every tile: picture centred, name under it, never over it; long names fit (two lines at most, then "..."). |
| A2 | 1, 2, 3 | "Getting the voices ready..." bar floats over the Pad's content. | It never covers a panel's content or buttons. |
| A3 | 2 | Album, "Words I learned": the pictures (bowl, pineapple, corn, pig) are drawn below and across the rows; empty round circles at the left of each row. | Each row: its picture and buttons inside the row, lined up; no empty circles. |
| A4 | 3 | Wardrobe in the Shop: a "Remove" button in every row is confusing. | Redesign (also point 18 below). |
| A5 | 4 | Audio: Music, Sounds and Voice open in a row to the LEFT of the speaker, not aligned. | Owner confirmed: they open in one tidy row directly UNDER the speaker and chat buttons, right-aligned with them, evenly spaced and centred. |
| A6 | 4 | "Big pictures" and "Trick" are off centre and not level with the player card (with the settings cog). | Lined up on the same level as the player card, centred. |
| A7 | 5 | Camera tray: zoom in, zoom out and camera view sit in a column to the LEFT of the eye button. | Owner confirmed: one straight column directly ABOVE the eye button, centred on it. |
| A8 | 5 | The eye icon "looks very scary". | A friendly view icon in the game's art style (for example a camera or binoculars), drawn in `js/art.js`. |

### 3. Part B: the owner's unfinished screen points

| Point | What the owner wants |
|---|---|
| 6 | Shop opened from the Pad stays in the Pad; going back keeps the scroll position. |
| 7 | A game opened from Play goes back to Play when closed; a game opened by talking to a villager closes straight back to the valley. |
| 12 | Every Bag item explains itself when tapped: coins, treasures, food, clothes, worn items, festival prizes, kites. |
| 14 | The "Eat it?" question is small and discreet. |
| 17 | Shop clothes and accessories drawn in the game's own art style, like the other icons. |
| 18 | The mirror (wardrobe) makes sense: a clear picture of the child, the clothes they own, tap to wear or take off. Men and Lady collections stay. |

### 4. Part C: learning (points 46, 47, 52, chosen by the owner on 16 Oct)

| Item | What it means |
|---|---|
| E1 | Learning games show one small reward banner, not "Combo" and "Lucky star" stacked over the puzzle. |
| E3 | On a computer, game buttons like "Hear again" use 18 to 20 px text. |
| E4 | A soft dark layer behind "You did it!" so it is readable over the board. |
| I1 | The level follows the child inside a learning game: three right in a row make the next round one step harder; two misses make it one step easier. |
| I2 | Each child's profile remembers the rule or story they missed most; the game brings it back first next time. |
| I4 | A sticker in the Pad's sticker book for finishing Hard in each reasoning game. |
| G2 | Picture-only mode for under-5s: question line hidden, bigger pictures, a hand shows the first move the first time a game opens. |
| New games | More interactive learning games in the style of Khan Academy Kids: the child talks and touches, and hears back. |

### 5. Steps

1. **Plan first.** Send the owner ONE pop-up question that covers: your plan for parts A, B and C, and 3 to 5 new game ideas (age, what the child does, what they hear, how it gets harder, how a wrong tap is explained), recommended choice first. If a picture is unclear, ask in the same pop-up.
2. Work in this order: part A, then B, then C. Commit after each item.
3. Before and after pictures on a phone, a tablet and a computer, in `docs/owner-repair-20261014/evidence/r79-*`.
4. Windows must never move up and down when content changes. Check with the sweep script `tests/owner-steady-sweep.mjs` (see its first lines; `SV_PANELS=bag,shop,wardrobe,audio-tray,view-tray SV_OUT=steady-sweep-r79`).
5. Add or update a check in `tests/run.mjs` for each item.
6. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`. One test run at a time on this machine.
7. Start the GitHub workflow `full-suite.yml` by hand on your branch.
8. Push your branch only (`git push origin work/r79-20261016`), open a draft pull request against `main`, and write "ready for Release" on `docs/cores/BOARD.md`. You may push and mark ready after part A and B, then continue with part C.

### 6. Rules

- Do not change `sw.js`, `js/build.js`, `studio/version.json`, `index.html` or `voices/`. If you add a new `.js` file, ask Release on the board to add it to the offline list.
- New spoken lines: list them on the board for Release to record.
- Everything a child sees or hears is in English and Vietnamese. Buttons at least 44 px, 64 px for under-5s. Use the game's own art and fonts. No emoji in docs. No timers and no "you lost" in learning games.
- Never push to `main`. Never change the version. Never weaken or delete a check.
- Questions to the owner only as pop-up questions. Times in AEDT.

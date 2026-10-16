# Prompt for the third AI, round r78 (16 October 2026 AEDT)

Paste everything under "Prompt" into the third AI's chat.

## Prompt

You are the third AI on Sparkle Valley (repository nguyentuanphu/Sparkle-Valley). Release is another chat.

### 1. What has happened

- r77 is live (16 Oct 2026, 3:23 pm AEDT). Your branch went out in it.
- Your old branch `work/owner-repair-learning-20261016` is finished. Do not push to it again. Release will close PR #301.

### 2. Your job in r78

Make more interactive learning games (points 46 and 47), in the style of Khan Academy Kids: the child talks and touches, and hears back.

### 3. Steps

1. Start a new branch from main:
   `git fetch origin main && git checkout -b work/r78-learning-20261016 origin/main`
2. Read `CLAUDE.md`, `docs/cores/BOARD.md`, and your own `docs/owner-repair-20261014/learning-progression.md` and `improvements.md`.
3. Suggest 3 to 5 new activities to the owner in ONE pop-up question. Put your recommended one first.
4. Build only the activities the owner picks.
5. Add one check for each activity in `tests/run.mjs`.
6. Take pictures on a phone, a tablet and a computer. Save them in `docs/owner-repair-20261014/evidence/r78-learning-*`.
7. Run `cd tests && node suite.mjs --changed`, then `git checkout tests/check-times.json tools/voice-daily.json`.
8. Start the GitHub workflow `full-suite.yml` by hand on your branch.
9. Push your branch only. Open a draft pull request.
10. Write "ready for Release" on `docs/cores/BOARD.md`.

### 4. Rules

- Change only `js/games/*` and new data files beside them. Release is changing every other file in r78.
- Everything a child sees or hears is in English and Vietnamese.
- Buttons for children under 5 are at least 64 px.
- Use the game's own art and fonts.
- New spoken lines: list them on the board for Release to record. If you record them yourself, keep `voices/manifest.json` and `voices/areas.json` additive (only add lines) and list Vietnamese lines under `other.vi`.
- Never push to `main`. Never change the version number.

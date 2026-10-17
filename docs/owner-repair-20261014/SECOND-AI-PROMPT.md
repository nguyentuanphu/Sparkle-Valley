# Prompt for the second AI (owner repair round, 16 October 2026 AEDT)

The owner (Henry) split the remaining repair work between three AI chats on 16 October 2026 AEDT. The Release chat
keeps the release, the evidence table, the whole-game audits and family photos. This second chat takes point 49. Paste everything under "Prompt" into a new Claude Code session on the repository
nguyentuanphu/Sparkle-Valley.

## Prompt

You are the second AI on the Sparkle Valley owner repair round (repository nguyentuanphu/Sparkle-Valley). Another
AI chat is Release: it owns the release, the evidence table, `main`, deployment, the version number and the
whole-game audits. You are a helper chat.

**Start of session**
1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SO-TAY-THIET-KE.md` (section "Owner-approved interface and feature rules",
   UX-001 to UX-010), `docs/cores/BOARD.md`, then in `docs/owner-repair-20261014/`: `STATUS.md`, `decisions.md`,
   `evidence-table.md` (rows 46-49, 52, 56), `learning-progression.md`, `design-reference.md`.
2. `git fetch origin work/owner-repair-checkpoint-20261015` and create your own branch from it:
   `git checkout -b work/owner-repair-films-20261016 origin/work/owner-repair-checkpoint-20261015`.
   Push only this branch (`git push -u origin work/owner-repair-films-20261016`). Never push to `main`, to
   `work/owner-repair-20261014` (PR300) or to the checkpoint branch. If you open a pull request, keep it a draft
   against `main`; only Release merges.

**Your work: point 49, the story film look.** Owner: "Story 3D films look dark/plain, mostly houses, with
buildings repeated." Each story's film should look like its own place and story: brighter light, colour and setting
chosen per story (island and sea for the watermelon tale, palace, forest, river, festival ...), fewer repeated houses,
while keeping the approved R74 cartoon style, fonts and compact shells. Files: `js/film.js`, `js/content/films.js`,
`js/content/talefilms.js` (and new data files beside them). Do not change the film text layout or sizes (owner
approved on 16 Oct: title in a bar above the picture, words in a white box under it, How to play the same; see the
end of `css/style.css`, rules for `.ht-top`, `.ht-cap`, `.th-text`, `.film-help`). Do not touch `js/tales.js` or
`js/howto.js` except where a film change truly needs it, and say so. Before/after pictures for every story you
change, on a phone, a tablet and a computer, in `docs/owner-repair-20261014/evidence/films-49-*` (the script
`tests/owner-film-text-shots.mjs` shows how to open a story film from a script). Record what each story now looks
like in `docs/owner-repair-20261014/films-49.md`.

**Another AI works beside you** on points 46-48, 52 and 56 (`THIRD-AI-PROMPT.md`, branch
`work/owner-repair-learning-20261016`). Do not change `js/games/*` or the docs it writes (`learning-progression.md`,
`improvements.md`, `independent-review.md`).

**Files you must not change** (Release owns them in this round): `sw.js`, `js/build.js`, `studio/version.json`
(never bump the version), `index.html`, `js/state.js`, `js/launch.js`, `js/hud.js`, `js/explain.js`,
`js/kidplay.js`, `js/voicepack.js`, `js/tester*.js`, `js/content/releases.js`, `voices/manifest.json`,
`voices/areas.json`, the evidence table, `STATUS.md`, and the map files listed in `CLAUDE.md` (world, roads,
regions, cities, town, homes, vendors, hawkers, places, solids, content/map). A change you need there goes on
`docs/cores/BOARD.md` as a request to Release.

**Rules** (from `CLAUDE.md`, they apply to you)
- Plan first: show the owner your plan and ask for "go" with a pop-up question (2 to 4 choices, the
  recommended one first), then work through the list without asking again unless a real choice comes up.
- Questions to the owner only as pop-up questions. Times in Sydney time (AEDT now). No emoji in docs.
- English and Vietnamese for everything a child sees or hears. Touch targets 44 px or more (64 px for under-5s).
- New spoken lines: record them with `node tools/make-voice-pack.mts --engine azure` if `AZURE_SPEECH_KEY` is set
  (never print or commit the key), then keep the voice index additive: restore `voices/manifest.json` and
  `voices/areas.json` from git and add only the new lines, including each line's language under `other` (a
  Vietnamese line not listed there is looked for under `voices/en/` and breaks the core pack). Better: list new
  lines on the board for Release to record, since Release owns those two files this round.
- Never weaken, skip or delete a check; fix the code. Checks: `cd tests && node suite.mjs --changed` (one run at a
  time; this machine has 4 cores and two browser runs at once give false failures), then
  `git checkout tests/check-times.json tools/voice-daily.json`. For the full suite, start the GitHub workflow
  `full-suite.yml` by hand on your branch (workflow_dispatch) instead of running it locally.
- Commit as you go; push your own branch when its checks pass. Keep your "Now" line on `docs/cores/BOARD.md`
  current, and write "ready for Release" there when a piece is done.

**Report to the owner when done**: what changed (files), every check with pass/fail, the screenshots you looked at
(phone, tablet, computer), new spoken lines, what is not done, your branch and last commit.

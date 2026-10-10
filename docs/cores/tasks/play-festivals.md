# Task brief: festivals on a schedule, whole places decorated (Play core)

Written 10 Oct 2026 (AEST) from the owner's answers in the Chapter 2 chat. The rules for helper chats are in `CLAUDE.md`;
this brief says what to build.

## The owner's rules (10 Oct AEST)
1. Every festival is on (no festival is left out), but it only runs in its own season: from 3 weeks before its day,
   or when an admin switches it on or schedules it in Sparkle Studio.
2. Children can never start a festival themselves in the game. Festivals come one after another, as the calendar or the
   admin's schedule says.
3. When a festival is on, it decorates the whole town or village it belongs to (every street and square of each place
   in its `where` list), not a few things scattered here and there.

## What is there now (check it first)
- `js/content/festcal.js`: every festival on its real date, `kind: 'party'` builds up for 3 weeks (stage 1 to 4),
  `where` lists its places, `theme` its decorations. `js/festivals.js` builds them; Studio switches are `fest_<id>` in
  `js/content/releases.js` (Studio's Releases page can switch on, schedule or switch off).
- Find every way a child can start or bring forward a festival now (buttons, the calendar, the Pad, the festival table,
  tests' helpers that a child could reach) and list them in your plan.
- Look at how many decorations each place gets now at each stage, with screenshots, before and after.

## What to build
- Rules 1 and 2 above: a festival shows only in its season or when an admin switches it on or schedules it; nothing a
  child does starts one.
- Rule 3: decorations along every street and square of each place in `where` (lanterns, flags, garlands as the theme
  says), growing with the build-up stages, never on a road or verge (G5, `roads` check), at most what the performance
  budgets allow (PERF rules, `perf` check; use InstancedMesh for repeats).
- The story's own festival nights are not part of this: Chapter 2's Trung Thu parade plays when the child hangs the
  lantern, on any day (owner, 10 Oct).

## You may change
`js/festivals.js`, `js/content/festcal.js`, `js/content/releases.js` (festival lines only), `tests/run.mjs` (your
checks), `docs/cores/play.md`. Where decorations need new world positions, follow `CLAUDE.md` helper rule 4 (the map is
being rebuilt): place them from the places' existing data, or ask World on `docs/cores/BOARD.md`. If Studio's schedule
needs a change, ask Studio on the board.

## Checks
Play's checks (`docs/cores/play.md`), plus `festcal roads perf noemoji phone`, a new check `festivals` (no festival
outside its season unless an admin switched it on; a child cannot start one; each place in `where` decorated along its
streets at each stage), then the full suite.

## Report
As in `CLAUDE.md` helper rule 11, plus screenshots of one village and one city decorated (phone, tablet, computer).

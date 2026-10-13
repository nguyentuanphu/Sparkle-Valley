# Batch rollout (owner's brief, 13 Oct AEDT)

Owner, 13 Oct AEDT: the Release chat does this after Round V (`docs/cores/ROUND-V.md`), on branch `core/rollout` from main.
Helper-chat rules apply (plan first and wait for the owner's "go" by pop-up question, no version bump, never main,
times in AEDT, no emoji in docs, English and Vietnamese for everything a child sees or hears, no map file changes).

## Goal
Features roll out to players in batches, so children keep finding something new, all controlled from Sparkle Studio's
Releases page (Ra mắt): start date, "on for N days", "New" badge for N days, and the New! moment (badge, companion
flies over, "What's new" card).

## Found (13 Oct AEDT, live r68)
- Almost everything is on for everyone: every switch in `js/content/releases.js` starts on unless Studio turns it off
  (`def: true`). The live Studio settings (`/api/live`) set only `story_ch2` and `story_ch3`, both on.
- Off now: `powerPoles`, `readingTrial`, `autoplay`, `tester`.
- Switching a feature off never takes it from a child who already used it (FEATURES.md, owner 8 Oct): it only hides it
  from children who haven't tried it; they get it later as "New!".
- Studio already supports batches: start date, days, newDays (`studio/ui/app.js` Releases page; `js/custom.js`
  releaseOn / releaseNew; `main.js` shows up to 3 "What's new" items).
- The gap: the newest Round U features have no switch: "Where is...?" sparkles (`js/wayfind.js`), village job boards
  (`js/jobs.js`), riding any vehicle and bus fares (`js/traffic.js`), every villager talking (`js/villagertalk.js`),
  sellers who remember you and price pictures (`js/snacks.js`, `js/pricetags.js`), the house guide (`js/myhouse.js`),
  Ông Cú as guide (`js/owlguide.js`), the villagers' day plan (`js/dayplan.js`), animal homes (`js/animalhomes.js`),
  the money games one by one, village singers (`js/songs.js`); check the code for others.

## To do
1. A Studio switch for each (entry in `js/content/releases.js`: id, en, vi, group, `def: true`), a featureOn/releaseOn
   guard in each feature's file, following the FEATURES.md rule. A check (`rollout`): each new switch hides its feature
   when off, keeps it for a child who already used it, shows the New! moment on its start day.
2. Base game, always on: the world and its games, the story prologue, chapters 1 and 2, the Simple screen, the shop,
   family missions, bedtime and the other grown-up features, traffic, the bug fixes. Festivals come by their dates.
3. Batch calendar (draft from the Kid UI chat; one batch every Saturday AEDT, each with a 7-day New badge):
   17 Oct ride around (bicycles, xích lô, any vehicle, buses with fares); 24 Oct surprises and mystery boxes;
   31 Oct Halloween plus the Village festival (hội làng); 7 Nov story chapter 3 (Sydney); 14 Nov Bà Huệ and ông
   Nghi's yard (story_yard, yardHands); 21 Nov collection book and family rankings; 28 Nov the companion grows and
   the coin goal for its hats; 5 Dec "Where is...?" sparkles and village job boards; 12 Dec Reading corner (if the
   trial is done); 19 Dec onward Christmas, New Year, then the money games one at a time.
4. Testers see each batch a week early (the tester "peeks" list in Studio).
5. A short Studio checklist (each row, start date, New days); the calendar written into `docs/cores/FEATURES.md`
   (replacing the old "Suggested drip calendar").

## Ask the owner first (pop-up questions, recommended first)
- Cadence: every Saturday (recommended), Wednesday and Saturday, or every two weeks.
- Hold back features children can already see and bring them back as "New!" (recommended), only drip the Round U
  ones, or only drip future work.
- Who sets the dates: a Studio checklist (recommended), or a built-in plan in `content/custom.json` Studio can change.

Then the plan (files, checks, later), the owner's "go", build, checks and the full suite, progress notes, board
"ready for Release", push `core/rollout`, report (files, checks, phone, tablet and computer screenshots, spoken lines).

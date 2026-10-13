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

## Owner's decisions (13 Oct AEDT, rollout chat, branch `core/rollout`)
- Cadence: one batch every Saturday (AEDT), each with a 7-day New badge.
- Hold back what children can already see and bring it back as "New!" on its batch day; a child who has already used a
  feature keeps it (FEATURES.md rule).
- Dates: a Studio checklist for the owner (no built-in plan in `content/custom.json`); the owner types each start date and
  New days on the Releases page.
- Plan approved ("go", 13 Oct AEDT) with the calendar additions (singers, hunt, big decorations, guides, villagers, the
  money games one a week from 2 Jan) and testers seeing each batch 7 days early by themselves.
- (14 Oct AEDT) Studio problems the owner saw on the iPhone (Releases page unreadable in dark mode, Analytics "504"): the
  owner chose "you fix both", on a separate branch `fix/studio-dark-analytics`, not mixed with the rollout.

## Progress notes
- **14 Oct, 2:56 am AEDT, branch `core/rollout`, commit 4e99279e (code), checks:** (after merging main r72, commit a1deb204: unit rules types arch emoji noemoji preload names bilingual boot rollout voicecover kidplay boxes surprises phone, 16 of 16 pass)
  - `node suite.mjs --changed` picked all 137 checks (js/main.js and js/custom.js load everywhere). It stopped at its
    2-hour limit during the last reruns: 128 passed (7 of them skipped as online: multiplayer, netgames, meet, knock, together,
    cloud, mapver: no local PeerJS or MQTT server).
  - Failed in the suite, then fixed: `kidplay`, `boxes`, `surprises` (they expected Off to take a feature from a child who
    had just used it, against the owner's 8 Oct rule; they now check Off for a child who never used it, `rollout` checks
    the keeping); `rollout` (the New! card came after 10 s under load: now waits up to 40 s); `voicecover` (6 new label
    lines recorded with Azure).
  - Failed in the suite only under load, pass alone: `phone`, `nametags`, `micoff`, `testerreport`, `saves`, `offline`,
    `voicearea`. `voicecover`: its coverage part passes; its "You rolled 47" playback part failed twice in a row and then
    passed; by hand it plays from 3 parts on this branch and on main (timing in the check, worth watching).
  - `startup`: over its limit, as on main (Release's board line).
  - Passed alone after the fixes: kidplay, boxes, surprises, rollout, phone, nametags, micoff, testerreport, saves,
    offline, voicearea, voicecover. Screenshots looked at: boot at 390 (phone), 1024 (tablet), 1280 (computer).
  - New spoken lines: "The living valley", "Money games", "Coin or Note?" (en and vi), recorded with Azure.

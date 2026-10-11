# Release log: r56 to r60, what is outstanding, and prompts for new chats

Written by Release, 11 Oct 2026 (Sydney time, AEDT). The owner's questions: what was deployed, what is in r60, what is
left, and a prompt to start a new chat for each core.

## 1. What has been deployed

| Version | What | Live? |
|---|---|---|
| r55 | Lantern story chapter 2, Hà Nội (switch `story_ch2`, off until an admin turns it on) | Yes, 10 Oct, 4:43 pm AEDT |
| r56 | Round T0 + T1 (the Concept D valley), Studio review, offline start and one "Use the internet" switch, online moves fix, 558 voice lines | Yes, 11 Oct, 2:06 am AEDT |
| r57 | Robot chat's round: bug fixes #27 #28 #29 #31 #41 and the robot workflows (instant start, 8 bugs a run, 5-minute timer, Sydney time) | No (owner held it); inside r60 |
| r58 | Two chats used this number. Release's r58 (festivals, Chapter 3, films, robot fixes) was not deployed and is inside r60. The Round T chat's "r58" (T2) went out inside r59 | Release's: no |
| r59 | Round T2 + T3: water and bridges, Vũng Tàu, the mountains, the Memory Villages (pull request #54, merged by the Round T chat) | Yes, 11 Oct, 2:39 pm AEDT |
| r60 | Everything below, on top of r59 | Not yet: full suite running, then "yes, deploy" |

## 2. What is in r60 (local branch `release-next`, Release core)

- **r59** (Round T2 + T3), as live now.
- **Robot bug fixes:** #27 caption boxes on iPhone get their own lanes; #28 the map shows a row of cities and each city's
  places; #29 the Bag opens the backpack, the shop is one small button, wardrobe tidy on phones; #30 the Simple screen is
  one scrolling road per tab; #31 "Change player" only in Grown-ups; #32 the festival calendar is only a calendar; #33
  trees and things turn see-through instead of pulling the camera in; #35 the Simple screen's speaker button wakes iPhone
  audio first; #37 grown-ups are told where the friends switch is; #39 softer rain; #41 credits scroll and the caption
  closes with them; #55 the microphone button starts a fresh request.
- **Robot workflows (r57):** the bug robot starts instantly on a new or relabelled bug, 8 bugs a run, a 5-minute backup
  timer; quick checks on every push; AI review not on every push; Sydney time in the rules.
- **Play:** festivals only in season or when an admin schedules one, children cannot start one, whole places decorated
  (`js/festdecor.js`); story Chapter 3, Sydney (switch `story_ch3`, off until switched on); new recordings.
- **Kid UI:** the robot's Kid UI fixes and the films on phones (the camera widens on tall screens), merged together.
- **Online:** the map version in the knock and friends' notes; a friend on another map gets a "Different valley" card;
  #37 and #55.
- **Voice & Audio:** voice pack by area (a 5 to 7 MB core first, the rest area by area on Wi-Fi, mobile data after a
  grown-up's yes); Vietnamese tunes in Hội An and Vũng Tàu.
- **Studio:** the Map page lists things kept aside from the old map (place again or forget).
- **Analytics & Infra:** #36 slow start, steps 1 to 5: the `startup` check, PERF-001 measured on the packed copy,
  start-up times in Analytics, a smaller first download.
- **Release fixes while merging:** the Change player button had the same id as the online "Who's here" box (now
  `gChange`); `js/seethrough.js` (#33) was missing from the offline file list, so the game never started on a dead
  connection; a type error in #32's settings clean-up; the festival calendar note kept #32's wording; the credits close
  both ways (event and callback); the voice pack, its areas and the preload list rebuilt (114 + 98 new lines); the rules
  list regenerated (#30 reworded two rules).
- **Checks:** quick checks pass (types, unit, arch, rules, preload, voicecover). Full suite: running.

## 3. Outstanding

| Core | What is left | Where it is written |
|---|---|---|
| Release | The `studio` check: the Studio program does not save into its game folder (failed in the last two runs); finish r60's full suite, then "yes, deploy" | this file |
| Kid UI | Its newest commit (speech box rises from the middle, Pad map names never overlap, Hội An as a place) is not tested and not in r60; the friends row's Join button lies over the friend's status on phones (from Online); new place ids in `PLACE_AREAS` and the Pad map list (Round T) | BOARD.md Kid UI; `docs/cores/kid-ui.md` |
| Play | Festival `where` ids for the new places (`hoian`, later `vungtau`) in `js/content/festcal.js` once they are festival places; new `play` bugs from the Front Desk | `docs/cores/play.md`, "What is left for Play" |
| Online | Nothing to build; owner to try #55 on a real iPhone; a game older than Round T is let in like r56 | `docs/cores/online.md` |
| Voice & Audio | Record the "Different valley" card's line; lullabies (owner's titles or Studio → Music); after each new place, harvest and record | `docs/cores/voice-audio.md` |
| Studio | Stamp `world.map` with `MAP_VERSION` when Studio saves map content; a Plots page for the Memory Villages (later); a "Story characters" page writing `looks` (asked by Play) | BOARD.md Studio |
| Analytics & Infra | #36 beyond step 5 (on hold for the owner); look after the bug robot and workflows | `docs/cores/analytics-infra.md` |
| World / Round T | T1b tidy streets and T4 (the drawn Pad map), per `docs/cores/ROUND-T.md`; real spots in Hà Nội and Sydney for chapters 2 and 3 | `docs/cores/ROUND-T.md` |
| Front Desk | #34 roads (on hold for Round T), #36 (on hold for Analytics & Infra) | GitHub issues |
| Owner | Try #35 and #55 on an iPhone once r60 is live; switch on `story_ch2` / `story_ch3` in Studio when wanted | |
| Not merged on purpose | `studio-draft` (Studio's own Publish branch), `claude/azure-voice-pack-sparkle-t4unwd` (old, 3 Oct) | |

## 4. Prompts for new chats

Paste one into a new chat. Every chat first reads the rules in `CLAUDE.md` (plan first, pop-up questions, its own
files only, push its own branch, "ready for Release" on the board, Sydney time). Start each one only after r60 is live,
so it starts from the newest `main`.

**Release**
> You are the Release core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/release.md, docs/cores/LOG-r60.md
> and the whole of docs/cores/BOARD.md (also the copy on core/front-desk). Every 5 minutes collect the finished work:
> fetch every branch, read each core's Now line and progress notes, merge every branch marked "ready for Release" and the
> robot's bugfix branches whose issue says fixed-on-branch, run the full suite, look at phone, tablet and computer
> screenshots, fix what you can and put the rest on the board. When a round is green, report it and ask me "yes, deploy"
> as one pop-up question. Only message me with a round report, a "yes, deploy" question or a blocker. Sydney time.

**Kid UI**
> You are the Kid UI core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md, docs/cores/kid-ui.md,
> docs/cores/LOG-r60.md (section 3) and the whole of docs/cores/BOARD.md. Work on branch core/kid-ui, starting from main.
> Tasks: 1) finish and test the commit "Kid UI requests: speech box rises from the middle, Pad map names never overlap,
> Hội An is a place" (on claude/affectionate-wozniak-2jek7i); 2) on a phone the friends row's Join button must not lie
> over the friend's status; 3) the new place ids in PLACE_AREAS and the Pad map list. Plan first and ask me "go" with a
> pop-up question; run your checks and the full suite; push core/kid-ui and write "ready for Release" on the board.

**Play**
> You are the Play core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md, docs/cores/play.md (the
> section "What is left for Play"), docs/cores/LOG-r60.md and the whole of docs/cores/BOARD.md. Work on branch core/play,
> starting from main. Tasks: festival `where` ids for the new places (hoian, then vungtau) in js/content/festcal.js once
> they are festival places, and any GitHub issue labelled play. Plan first and ask me "go" with a pop-up question; run the
> festivals and festcal checks and the full suite; push core/play and write "ready for Release" on the board.

**Voice & Audio**
> You are the Voice & Audio core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md,
> docs/cores/voice-audio.md, docs/cores/LOG-r60.md and the whole of docs/cores/BOARD.md. Work on branch core/voice-audio,
> starting from main. Tasks: record the Online "Different valley" card's line and any new lines from Round T's places
> (voice-harvest, then make-voice-pack --engine azure, then the voicecover check); lullabies when I give titles. Plan
> first and ask me "go" with a pop-up question; push core/voice-audio and write "ready for Release" on the board.

**Studio**
> You are the Studio core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md, docs/cores/studio.md,
> docs/cores/LOG-r60.md and the whole of docs/cores/BOARD.md. Work on branch core/studio, starting from main. Tasks:
> 1) when Studio saves map content (world builds, edits, land, npcs) stamp world.map with MAP_VERSION from
> js/content/map.js; 2) a "Story characters" page that writes `looks` (asked by Play); 3) later, a Plots page for the
> Memory Villages. Online Studio and SparkleStudio.exe change together. Plan first and ask me "go" with a pop-up
> question; run the studio check and the full suite; push core/studio and write "ready for Release" on the board.

**Analytics & Infra**
> You are the Analytics & Infra core of Sparkle Valley. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md,
> docs/cores/analytics-infra.md, docs/cores/LOG-r60.md and the whole of docs/cores/BOARD.md. Work on branch
> core/analytics-infra, starting from main. Tasks: watch the bug robot and the workflows after r60 is live; #36 slow start
> beyond step 5 only with my go (measure on a real phone and tablet first). Plan first and ask me "go" with a pop-up
> question; push core/analytics-infra and write "ready for Release" on the board.

**World (Round T)**
> You are the World core of Sparkle Valley and run Round T. Read CLAUDE.md, HANDOFF.md, docs/cores/README.md,
> docs/cores/world.md, docs/cores/ROUND-T.md, docs/cores/LOG-r60.md and the whole of docs/cores/BOARD.md. Work on branch
> round-t, starting from main. Tasks: T1b tidy streets and T4 (the drawn Pad map) as written in ROUND-T.md, and real spots
> in Hà Nội and Sydney for story chapters 2 and 3. Do not merge into main yourself: write "ready for Release" on the
> board and Release deploys it. Plan first and ask me "go" with a pop-up question.

**Front Desk**
> You are the Front Desk of Sparkle Valley. Read CLAUDE.md and docs/cores/front-desk.md, then the whole of
> docs/cores/BOARD.md and docs/cores/LOG-r60.md. When I report a bug or ask a question, find the core that owns it and
> file it as a GitHub issue for the bug robot (bug + core label + small or big). You never change the game's code, push
> code or deploy.

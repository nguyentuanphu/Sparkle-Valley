# Public launch: what goes out when (Release, 23 Oct 2026 AEDT)

Owner, 23 Oct AEDT: "I am about to release the game to public, check all games, festivals etc, and let me know which
one should be rolled out and what are the schedules. Then I will let you auto set the time in Studio for auto release;
I can later intervene to turn off manually."

How a start date works (js/custom.js, docs/cores/FEATURES.md "Batch calendar"): before its date a feature is hidden only
from children who never used it (what a child already used stays theirs); on its date it is on for everyone with the
MỚI / New badge and the "New in the valley!" card for 7 days. Testers see each batch 7 days early. Festivals come by
their own dates: decorations 21 days before a party festival (3 days before a quiet one), the five-object hunt in the
last week and on the day, the festival table game at 15:00 and the show at 18:30 (17:30 for under-5s).

Today Studio sets only 6 switches (autoplay, tester, familyDevices, story_ch2, story_ch3, wayfind); everything else runs
on the game's defaults, which are "on". So a public launch today would give a new child everything at once.

## Schedule set (owner, 23 Oct AEDT: "looks good, but the Reading corner and the money games should be on by default")

| Date (AEDT) | What new players get | Switches given this start date (New 7 days) |
|---|---|---|
| Sat 31 Oct 2026: launch (Halloween) | The base game: the valley and every game in it (the ten drawing games, the Reading corner's ten reading games and all ten money games), story prologue and chapters 1, 2 and 3 (Sydney: on in Studio, kept on: assumed, owner can change), the Simple screen, the shop, family missions, weekly note, certificate, bedtime, the daily adventure, rides (bicycles, xích lô, any vehicle, buses with fares), traffic and city vehicles; Halloween | none (base game) |
| Sat 7 Nov | Surprises, mystery boxes, the festival hunt and big decorations (Diwali on 8 Nov) | `surprises`, `mysteryBox`, `festHunt`, `festDecoBig` |
| Sat 14 Nov | Village festival and village singers | `hoilang`, `singers` |
| Sat 28 Nov | Bà Huệ and ông Nghi's yard | `story_yard`, `yardHands` |
| Sat 5 Dec | Collection book and family rankings | `collectibles`, `rankings` |
| Sat 12 Dec | The companion grows, coin goal, price pictures, sellers who remember you | `companionGrow`, `saveGoal`, `priceTags`, `sellersRemember` |
| Sat 19 Dec | Christmas week: job boards, Ông Cú as guide, every villager talks, their day plan | `jobs`, `owlGuide`, `villagerTalk`, `dayPlan` |
| Sat 26 Dec | House guide, animals with homes (New Year's Eve on 31 Dec) | `houseGuide`, `animalHomes` |

Kept off for the public (as now): power poles (`powerPoles`, unfinished), "Find a place" compass (`wayfind`), family
devices and photo sharing (`familyDevices`, trial), auto play and tester (only the ticked devices).

## Festivals over the next year (decorations start 21 days before; quiet days 3)

Halloween 31 Oct (decorations up since 10 Oct) · Diwali 8 Nov (from 18 Oct) · Teachers' Day 20 Nov (from 30 Oct) ·
Christmas 25 Dec (from 4 Dec) · New Year's Eve 31 Dec (from 10 Dec) · Australia Day 26 Jan (from 5 Jan) · Kitchen Gods
30 Jan (from 9 Jan) · Tết 6 Feb (from 16 Jan) · First Full Moon 20 Feb · Clean Up Australia 7 Mar · Harmony Day 21 Mar ·
Holi 22 Mar · Easter 28 Mar · Hùng Kings 16 Apr (quiet) · Anzac 25 Apr (quiet) · Mother's Day 9 May · Reconciliation
Week 27 May (quiet) · Children's Day 1 Jun · Đoan Ngọ 9 Jun · NAIDOC 4 Jul · Vu Lan 16 Aug (quiet) · National Day 2 Sep ·
Father's Day 5 Sep · Mid-Autumn 15 Sep. All 24 stay on by their own dates.

## How it is set

The dates are in the game's shipped settings (`content/custom.json` "releases", 20 switches), so they need no Studio password and
work offline. Anything set in Studio's Releases page wins over them, so the owner can switch any one off (or move it)
at any time.

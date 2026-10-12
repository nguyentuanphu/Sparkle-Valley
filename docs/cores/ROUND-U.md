# Round U: the owner's list of 11 Oct (r62)

Owner, 11 Oct AEDT (Release chat `claude/peaceful-hopper-un7oym`): items 1 to 13, the four valley ideas and seven extras,
**all in one release** (one report, one "yes, deploy"). Plan first; nothing is built before the owner's "go".
Rules first where a hard rule changes (PROC-006): the rule and its check go in, shown failing, then the fix.

## Part A: quick fixes (Kid UI, Play, Voice & Audio)
| # | What | How | Files | Check |
|---|---|---|---|---|
| 1 | Coin, Sparkle Orb and Leafy chips say what they are | hover shows the name; a tap shows a small bubble with the picture, the name and one line ("Coins: buy food and clothes"), spoken; on the top bar and in the Backpack | `js/hud.js`, `js/ui.js`, `css/style.css` | `chips` (new): every chip has a name and answers a tap |
| 2 | Backpack tab row scrolls | finger: `touch-action: pan-x`; mouse: drag to scroll and the wheel scrolls sideways; arrows at the ends when more is hidden | `js/ui.js`, `css/style.css` | `phone` + new `hscroll`: every sideways row moves by finger and mouse |
| 3 | The Map scrolls on a tablet | the Pad map's list scrolls inside the Pad on every size (no page scroll trap) | `js/ui.js`, `css/style.css` | `hscroll` (tablet 820×1180: the last place can be reached) |
| 4 | Every line in the chosen language | a scan of every `[en, vi]` pair in the code and content: an English slot with Vietnamese letters, or the same text twice, is a fault (Grandma Huệ's welcome in `js/cities.js` has Vietnamese in both); every one found gets its English line; then playing in English must never show or say Vietnamese except names and dish words | all content files; `tools/lang-audit.mjs` (new) | `bilingual` (new; fails on r61 first) |
| 5 | Sound and voice switches easy to find | they exist only deep in Grown-ups; add a Sound button (music, sounds, voice: three big switches) to the dock and to the Simple screen | `js/ui.js`, `js/simple.js` | `phone`, `contract` (UI change asked by the owner: contract re-recorded) |

## Part B: the valley (World)
| # | What | How | Files | Check |
|---|---|---|---|---|
| 6 | One gate per village and city | the main gate keeps its arch; other roads come in without a gate (plain paving). Changes rule ROAD-007 ("a gate on every named road end") to "one gate per place, on its main road" (owner) | `js/world.js`, `js/cities.js`, `js/content/map.js`, `docs/ARCHITECTURE.md` | `roads` (gates: one per place) |
| 7a | No weeds inside roads | find what still grows on the asphalt (the `roads` check only looks at the grass tufts; the screenshots show green tufts on Aussie Corner's road) and make every plant, bush, flower and rock keep off every road and street | `js/world.js`, the plant builders | `roads` extended to every plant instance |
| 7b | No height steps where roads and bridges join | measure every join (road to road, road to bridge, road to a place's paving): at most 0.05 m step; fix the ramps | `js/roads.js`, `js/world.js` | `joins` (new; fails on r61 first) |
| 12 | Every vehicle can be ridden; buses and trams take a fare | tap any parked or passing vehicle to ride it (bicycles and xích lô already can); buses and trams stop at bus stops, a child gets on for a fare in coins (under-5s and a child without coins ride free: never punished), gets off at the next stop | `js/traffic.js`, `js/vehicles.js` | `ride` (new) |
| + | Bus stops with a timetable | a stop with a shelter and a picture timetable (bus picture, clock pictures) in each city and village on a bus road; the bus waits there | `js/traffic.js`, `js/content/map.js` (stops) | `ride` |
| + | Picture signposts | at every junction a post with pictures of the places each way (was T4b) | `js/roads.js`, `js/art.js` | `signs` (new) |

## Part C: play and people (Play, Kid UI)
| # | What | How | Files | Check |
|---|---|---|---|---|
| 8a | Bought clothes show in the wear area | everything bought and not worn is listed there, tap to wear | `js/shop.js`, `js/ui.js` | `shop` |
| 8b | Clothes for girls and boys | each child's profile has girl or boy (asked when the character is made, already in the default outfits); the shop and wardrobe show that set first and the other set behind "More"; nothing is taken away from a child who already owns it | `js/content/shop.js`, `js/shop.js`, `js/state.js` | `shop` |
| 10 | Every villager talks | every person in the valley answers a tap with a fact or a saying of their place (bank of lines by region, both languages, recorded) | `js/town.js`, `js/regions.js`, `js/cities.js`, new `js/content/villagerlines.js` | `talk` (new): every person answers |
| 11 | House guide | the first time in your house: Ông Cú's step-by-step guide (earn coins, buy a decoration, place it, upgrade a room); a "?" button repeats it | `js/myhouse.js` | `houseguide` (new) |
| 13 | Family missions: 15 tasks and a guide | 15 ready-made tasks (both languages, done together for real: week and bedtime ones), a grown-up turns each on or off; a short picture guide for grown-ups and children ("this is family play: do it for real, a grown-up holds ✓"), shown once and from "?" | `js/parents.js`, new `js/content/familymissions.js` | `parents` |
| + | Ông Cú as guide | he explains one new thing each visit (money, the house, the bus, the signposts, family missions), pictures and voice | `js/companion.js` or `js/story.js` | `guide` (new) |
| + | Sellers remember you | a seller greets the child by name on screen (the spoken line has no name: HANDOFF rule 11) and remembers the favourite food | `js/snacks.js`, `js/regions.js`, `js/cities.js` | `snacks` |
| + | Village job board | a board in each village with helping tasks (carry fruit, find a lost hen, deliver a letter) that show what the place is for; coins and a sticker | new `js/jobs.js` | `jobs` (new) |
| + | Price pictures and change | a price picture (coins) on every stall and kiosk; paying counts the change out loud | `js/snacks.js`, `js/regions.js`, `js/cities.js` | `snacks` |

## Part D: the Simple screen (Kid UI)
| 9 | Games, stories and places as separate sections | each tab shows its categories as big picture cards (Play outside, Vietnamese games…); a tap opens that category's own short road; ⬅ back to the cards. **This replaces the owner's decision for bug #30 (10 Oct: "one long road per tab")** | `js/simple.js`, `css/style.css` | `simple`, `phone`, `contract` |

## Part E: a living valley (World, Play)
| What | How | Files | Check |
|---|---|---|---|
| Day plan for villagers | each villager has a home, a job spot and a market time; they walk between them along footpaths by the game clock, greet each other, go home at night | new `js/dayplan.js`, `js/town.js` | `dayplan` (new): nobody walks on a road or through a house |
| Weather and night | rain: umbrellas, stalls close their awnings; night: stalls close, lanterns light, villagers at home | `js/weather.js`, `js/dayplan.js` | `dayplan` |
| Job pictures | a small picture of each villager's job over their name tag | `js/art.js`, the people builders | `talk` |
| "Where is…?" sparkles | a "Where?" button: tap a picture (market, home, a friend, a game) and a sparkle trail shows the way along the roads | new `js/wayfind.js` | `wayfind` (new) |
| Animals with homes | hens to the coop at night, ducks on the pond, dogs follow their family | `js/animals.js`, `js/lotus.js` | `animals` |

## Order of work (one release, r62)
1. Rules and checks first: `bilingual`, `joins`, `chips`, `hscroll`, `ride`, `talk` and the ROAD-007 change, shown failing on r61.
2. Part A, then B, C, D, E; commit after each item, full suite after each part.
3. New spoken lines recorded with Azure (the key is set in this chat); no line with a child's name is recorded.
4. Sky views, phone, tablet and computer screenshots of every change; the full suite; the report with the Netlify zip; "yes, deploy".

## Risks
- Size: this is the largest round so far (about 25 pieces); expect several long sessions. Each part is committed and listed on the board as it lands, so nothing is lost between chats.
- `startup` is already over its limit; the living-valley parts must load after the title and stay within the draw-call budget (`perf`).
- Other chats: Play, Kid UI and Online own some of these files; while Round U runs, Release asks them on the board not to change `js/ui.js`, `js/simple.js`, `js/parents.js`, `js/shop.js`, `js/traffic.js`.

## Progress (12 Oct AEDT)
- Parts A to E built on `claude/peaceful-hopper-un7oym`, each part pushed as a backup (main stays on r61 until "yes, deploy").
- New checks: `bilingual`, `hscroll`, `chips`, `soundsw`, `joins`, `ride`, `signs`, `familymissions`, `wearbag`, `talk`, `houseguide`, `guide`, `prices`, `jobs`, `wayfind`, `dayplan`, `animalhomes`; `simple` and `adventure` updated for the category cards; `contract` re-recorded twice (the Sound button, the 🧭 button), both asked for by the owner.
- Smaller than planned: stalls stay open at night (lanterns light over them instead of closing); only villagers with a house door within 35 m and a clear walk go inside at night (the rest light a lantern); the Lotus Village hens are the ones with a coop.
- Part F: voices (Azure), version r62, full suite, screenshots, report, "yes, deploy".

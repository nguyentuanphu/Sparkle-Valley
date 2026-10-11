# Task brief: Round T4b, finding your way (Kid UI core)

Written 11 Oct 2026 (AEST) by Release. The rules for helper chats are in `CLAUDE.md`; this brief says what to build. The plan for the whole of Round T is `docs/cores/ROUND-T.md` (T4b in section 3, and the Progress notes).

## Where things stand
- Rounds T0 to T3 are live (r59): the Concept D valley, its rivers and bridges, Vũng Tàu, the mountains and the two Memory Villages.
- Release builds T4a (road surfaces, water colours, reeds, footsteps) on branch `round-t` for r60 at the same time. Base your branch `core/kid-ui` on `main` and pull `main` again before you push; Release merges both.
- Every world position is in `js/content/map.js` (`PLACES`, `WATERS`, `ROADS`, `BRIDGES`, `LANDMARK_AT`, `PLOTS`). Read it, never write it.

## Goal
Three things that help a child find their way:
1. **Picture signposts at road junctions.** Where two roads meet (asphalt or dirt, not footpaths), a small post with one arrow board per road leaving the junction: the icon of the next place along it (the place's `icon`, or a landmark's) and its name in English and Vietnamese, the language the child plays in shown first. Low and chunky, in the valley's toy style; one merged mesh per signpost, the boards drawn into one shared texture so all signposts together stay a few draws.
2. **Name tags over nearby places.** When a child comes within about 40 m of a place (a city, a village, a landmark, a Memory Village), its name floats above it: at most 4 at once, the nearest first, fading in and out over half a second, never overlapping each other on screen (move or hide the farther one). Hidden in calm mode and in films.
3. **A drawn Pad map.** Replace today's screenshot-style Pad map with one drawn from the map data: the land, `WATERS` (rivers, lakes, ponds, the sea), `ROADS` in their region colours (`ROAD_TONES`), and every place's icon and name. Soft white clouds over places the child has not visited yet (`profile.visited`), lifting with a little puff the first time they get there. Tapping a place still flies there (`game.travelTo`). Names never overlap (the east side overlapped before: Village festival stage over Đà Nẵng, Three Regions Market over TP. HCM). The list under the map shows the new places too: `hoian`, `vungtau`, `harbour`, `memory_e`, `memory_w` (and `PLACE_AREAS` in `js/content/activities.js`).

## Already decided by the owner
- English and Vietnamese for everything a child sees or hears; touch targets 44 px or more (64 px for under-5s); any emoji in the game needs a drawing in `js/art.js`.
- Road colours: red Vietnam, orange Australia, purple to the mountains, blue along the coast, grey on the home island (`ROAD_TONES`).
- Times in AEST; ask the owner every question as a pop-up with choices.

## You may change
`js/ui.js`, `js/simple.js`, `js/content/activities.js`, `js/art.js`, `css/style.css` (your block), a new `js/signposts.js` and `js/nametags.js` (or one file), `js/main.js` only to call them (one line each), `tests/run.mjs` (your new checks), `sw.js` FILES and `index.html` modulepreload (one line per new file). Ask Release on `docs/cores/BOARD.md` for anything else.

## Not yours
`js/world.js`, `js/roads.js`, `js/regions.js`, `js/cities.js`, `js/content/map.js` and the other map files (helper rule 4). A signpost is placed from the road data at load time (junctions found from `ROADS`), never at a written-down x, z: the `mapcoords` check fails on plain numbers.

## Checks
- New `signs`: every junction of two non-footpath roads has a signpost; every board names a real place; signposts stand off the road surface and nothing walks through them wrongly (they are solid like a post).
- New `nametags`: at most 4 tags at once, none overlapping on screen, on phone, tablet and computer.
- New `padmap`: every place in `PLACES` is on the drawn map; clouds over unvisited places, gone after a visit; names do not overlap at 390 px, 1180 px and 1366 px wide.
- Then `phone noemoji emoji perf mapcoords` and the full suite. The `perf` draw calls at home and in Lotus Village must not rise by more than a few draws, and no texture may pass 1024 px.

## Report
As in `CLAUDE.md` helper rule 11, plus screenshots of a signpost, name tags at a busy spot, and the drawn Pad map on phone, tablet and computer. Mark your board line "ready for Release" when pushed.

# World core

**You build the 3D valley:** the land and water, the roads, the buildings and villages, the real landmarks, the
people, animals and vehicles standing in it, what is solid, and how fast it draws.

## You own
- Land and water: `js/world.js`, `js/worldcache.js`, `js/worldedit.js`, `js/gfx.js`, `js/weather.js`, `js/ferry.js`, `js/kite.js`
- Roads: `js/roads.js`
- Places and buildings: `js/regions.js`, `js/regionsites.js`, `js/cities.js`, `js/town.js`, `js/suburbs.js`, `js/lotus.js`, `js/heritage.js`, `js/asia.js`, `js/houses.js`, `js/homes.js`, `js/myhouse.js`, `js/places.js`, `js/showcase.js`
- People, animals and things in the world: `js/chatter.js`, `js/hawkers.js`, `js/vendors.js`, `js/animals.js`, `js/pets.js`, `js/farm.js`, `js/gather.js`, `js/snacks.js`, `js/folkshow.js` (where the folk shows stand; what they play belongs to Play)
- Moving about: `js/player.js`, `js/input.js`, `js/solids.js`, the camera code in `js/main.js` (`cycleView`, `zoomBy`, its block)
- Checks on the world: `js/validate.js`, `tests/world-audit.mjs`
- The real landmarks' data: `js/realworld.js` `REAL` (where each landmark is); the photo viewer itself is Kid UI's
- Traffic and wires: `js/traffic.js` (cars, buses and bikes on the roads), `js/powerlines.js`

## Hard rules (docs/ARCHITECTURE.md §9.3 to §9.5)
WORLD-001…012, ROAD-001…013 (roads ≤ 8 % asphalt and 12 % dirt, smooth, junctions 60–120°, gates on road ends,
nothing standing on a road), BUILDING-001…005 (level ground under every building, roofs aligned, doors reachable),
NPC-001…002, ANIMAL-001, VEH-001, RIVER-001…003, PERF-001…005 (draw-call budget, world caching and the other speed rules).
Read the full wording in §9 before changing anything they cover.

## Checks you run
`boot spill features camera roads flat roadshape solid ground resume village validate walkaway perf phone`
Plus `node tests/world-audit.mjs` after moving buildings, land or roads.

## Talks to
- **Play**: where each game's host and each festival stands (`js/content/activities.js` is Play's; positions are yours).
- **Kid UI**: the map in the Pad, the region name banner, the Simple screen's places list (`PLACE_AREAS`).
- **Voice & Audio**: which music plays in which area (`VN_AREAS` in `js/content/songs.js`): tell them when an area is renamed.
- **Studio**: the Map and building page edits `content/custom.json` "world" through `js/worldedit.js`: keep its format.

## Owner's decisions to keep
- Flat villages; roads never steeper than 8 % (dirt 12 %); the reef and Hạ Long sit inside the lake on ground under the water (round N).
- Houses and objects are solid; the camera stays calm near houses and trees.
- Phones draw the valley 30 times a second and nothing behind full-screen pages (round O, battery).
- Hội làng (round S, `js/hoilang.js`): a festival pole (cây nêu with flags, one merged mesh and a 0.4 m collider) on clear
  ground off the roads 4–14 m from each games board. The parade walks the nearest non-footpath road within 30 m of the
  singer's stage, 3.4 m to one side of its middle (on the verge, out of the traffic), up to 20 m each way; with no road
  it circles the stage. The 9 people are built once and reused, visible only at the village nearest a child while an
  event is on.
- Surprises (round S, `js/surprises.js`): placed with `G.clearSpot` off the roads (`w/2 + 1.5 m`, G5) and off the water;
  the rainbow lotus floats on Lotus Village's lotus pond; at most one in the valley at a time, removed when found.

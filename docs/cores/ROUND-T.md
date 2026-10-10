# Round T: Concept D valley layout, the staged plan

Written 10 Oct 2026 (AEST) from the owner-approved spec in ROUND-R.md Part 2 item 2. The owner's Concept D drawings (maps, road and water looks, art direction, village pattern) are copied into the repo at `docs/concept-d/index.html` (open it in a browser; the pictures sit beside it), taken from the live page on 10 Oct. Plan first, then go (HANDOFF rule 17).



## 1. How the world is built today

**Size and coordinates**
- `js/world.js:11` sets `SIZE = 400`, `HALF = 200` (1 unit = 1 m), with north at −z.
- There is one water plane at `WATER = 0` (`world.js` createWorld, about line 483). Anything whose `heightAt` is below 0 shows as water, so every river and lake is a channel carved down to sea level.

**Terrain** (`heightAt`, `world.js:165-254`)
- Noise plus hand-tuned terms:
  - the northern mountains: `smooth(-55,-165,z)` (:167);
  - the edge wall: `smooth(150,195,…)` (:169);
  - the plateau and its ramp;
  - flats for each place (`flat()`, `FLATS`, `LOTS`);
  - a hard-coded saddle for the Sydney road (:197-203);
  - the festival grounds;
  - the lake;
  - the river (`riverDist` loops over the `RIVER` polyline, :146);
  - bridge banks (:217);
  - road beds (`RB_GRID`);
  - the WORLD-001 levelling (:243);
  - building footprints.
- `regionAt` (:256) is a hand-ordered if-chain.

**Places**
- Data anchors are at `world.js:12-34` and :54-59: `PLATEAU`, `VILLAGE`, `PADDIES`, `LAKE`, `BAMBOO`, `HOME`, `PLAYGROUND`, `TOWN`, `MARKET`, `AUSSIE`, `CITIES` (7, with gates), `CHINA`, `INDIA`, `BRIDGE`, `DRAGON`.
- `SHRINES`, `TOWERS` and `LEAFY_SPOTS` are absolute (:290-317).
- `LOTS` are generated along the roads out of each city (:324-366).
- `YARD` is absolute (:45).

**Roads**
- `ROADS` (:65-101) are absolute polylines with `gates`. They are filleted in place (:106-131).
- `js/roads.js` builds the ribbons, gates (`GATE_STYLE`) and the Dragon Bridge.
- Bridges must run along the x axis: `{x0,x1,z}` in `BRIDGE`/`DRAGON`, `roads.js:68`, `:320`, the `world.js` bank code and `tests/world-audit.mjs` `onBridge`.

**Data-driven (these follow their anchors)**
- `cities.js` (city plans from `CITIES`).
- `suburbs.js` (`LOTS`).
- `regionsites.js` (`findSpot` round each city).
- `heritage.js` (rough `near x,z` hints at :21-37, then a search; Hạ Long and the reef are placed inside `LAKE`).
- `lotus.js`, `farm.js`, the NPCs in `main.js` (`V.x + …`), `asia.js`, `twinchests.js`.
- `openspot.js`: the story's đình and the yard both use it.
- `ferry.js`: paths come from `RIVER`/`LAKE`, stops are worked out.

**Hard-coded absolute positions (the problem)**
- `regions.js:67-77`: `LANDMARKS`. Also the market and Aussie Corner builders (:89-252: `103, 93.5`, `-130, 6`, Opera `98,128`, lighthouse `-10,160`, Uluru `-128,152`).
- `vendors.js:6-24`.
- `cities.js:232` (`STREETS`) and :272/277/307 (Bạch Dinh, Nhà Tròn, house 8).
- `town.js:194-220, 296, 327, 332`.
- `homes.js:23-50`.
- `hawkers.js:33`.
- `places.js:37,54`.
- `main.js`: :195 (owl), :210 (Ruby), :629-630, :728-741 (`G.PLACES`), :1270 (`HOME_SPOT`), :1272 (`±190`).
- `ui.js:642` (`LANDMARK_HOME`, Pad map).
- `solids.js:15` (`HALF = 200`).

**Duplicated positions**
- The market/Aussie centres appear in `main.js` `PLACES`, `regions.js` and `vendors.js`.
- Two Homes Street appears in `world.js` `TOWN`/`BRIDGE`/`YARD`/`PLAYGROUND`, `town.js`, `homes.js`, `cities.js` and `places.js`.
- Opera appears in `regions.js` and in `main.js` (`92,128`).

**Caching and budgets**
- `worldcache.js:14` (`SIG` = build + hash of the content pack) caches the map picture.
- `solids.js:13` stores an 800×800 solid grid in `localStorage` under the same kind of signature.
- A new build changes both signatures, so both caches rebuild themselves.
- `tests/perf-baseline.json` ratchets (measured in Lotus Village only):
  - draw calls ≤ 1500 (target 250);
  - triangles ≤ 800k;
  - start-up download ≤ 3.2 MB.
- Boot times (`G.bootTimes`) are reported but not ratcheted. The terrain is 200×200 segments (`world.js:445`).

## 2. The key decision: one map file plus anchor-relative builders

**Rules**
1. **`js/content/map.js` is the only place that holds world coordinates.** It is plain data with no imports (except `MAP_VERSION`), so Node can import it. This is ARCHITECTURE §12 step 3.
2. **`world.js` keeps exporting the same names** (`VILLAGE`, `TOWN`, `MARKET`, `CITIES`, `RIVER`, `LAKE`, `HOME`…), now built from `map.js`. The 43 files that import `world.js` don't change.
3. **Every builder works in local coordinates** from its place's anchor, using `at(dx,dz)` the way `lotus.js` and `farm.js` already do, or a group transform the way `yard.js` does. Places only move (no rotation) in T1, because the streets assume east–west (`roadZ`).
4. **Bridges run along either axis**, never diagonally: `{id, axis:'x'|'z', a0, a1, c, w, h, over, style, landmark}`. Platforms and solids stay axis-aligned boxes, and the R9 rule (±20° to the river) is met by designing the crossings square.
5. **Water is one sea-level plane plus carved channels.** A spatial grid over all water (like `RB_GRID`) replaces `riverDist`; `waterDist(x,z)` and `waterAt(x,z)` return the id.

**Proposed shape of `js/content/map.js`**
```
MAP_VERSION = 'D1'
WORLD   = { size: 480, north: '-z', seaZ: 205 /* southern coast */ }
PLACES  = [{ id, kind: 'city'|'village'|'street'|'island'|'memory'|'site', cc: 'vn'|'au'|'asia'|'home',
             bank: 'east'|'west'|'island', at: [x,z], r | w,d, h, gates: [[dx,dz]…], street: {roadZ|axis},
             name: [en,vi], icon, tone, arrive: [dx,dz], areas: [region ids] }]
WATERS  = [{ id: 'main'|'songhong'|'songhan'|'hoian'|'saigon'|'brisbane'|'yarra'|'murray'|'mekong'|
             'hoguom'|'harbour'|'hoguong'|'billabong'|'sea', kind: 'river'|'lake'|'coast',
             pts: [[x,z,width]…] | at, r, joins, colour, depth }]
RELIEF  = [{ id: 'north'|'truongson'|'gdr', pts, h, w, snow, pass: { at, h } }]
BRIDGES = [{ id: 'haique'|'island_w'|'rong'|'chuacau'|'longbien'|'harbour'|'story'|'princes', axis, a0, a1, c, w, h, over, style, landmark }]
ROADS   = [{ id, kind, tone: 'vn'|'au'|'mountain'|'coast'|'ring', pts, gates: [placeId|null, …], loop }]
LANDMARK_AT = { opera: { place: 'sydney', off: [dx,dz], rot }, lighthouse: { place: 'vungtau', … }, … }
LANDMARK_HOME = { … }        // moved from ui.js:642
SHRINES, TOWERS, LEAFIES     // { id, place?, off | at }
BOATS   = [{ id: 'raft', water: 'main', stops: 'bridges' }, { id: 'harbourferry', water: 'harbour', piers: [...] }, …]
PLOTS   = [{ id: 'mv_e_01', village: 'memory_e', size: 'small'|'house'|'big', off, rot, address: [en,vi] }]
LEGACY  = { C: { village: [110,30], town: [32,53], market: [121,83], … } }   // frozen old anchors, for migration only
```

## 3. Stages

Every stage ends with the full suite green, `node tests/world-audit.mjs` clean and screenshots on phone, tablet and computer.

### T0: The map file and rebasing, no visible change (medium to large, mechanical)
- **Goal:** the same valley pixel for pixel, but every position comes from `map.js` with `MAP_VERSION='C'`.
- **Files:**
  - new `js/content/map.js`;
  - `world.js` (anchors, `ROADS`, `SHRINES`/`TOWERS`/`LEAFIES`, `YARD` relative to `TOWN`, size settings for the edge wall and tree scatter, the water grid, `waterDist`, a general `bridgeAt()`);
  - `roads.js:68,320`;
  - `solids.js:15` (`HALF` from `SIZE`);
  - `main.js` (owl, Ruby, `G.PLACES`, `HOME_SPOT`, ±190);
  - `regions.js`, `vendors.js`, `cities.js:232-307`, `town.js`, `homes.js`, `hawkers.js`, `places.js` (all rewritten as anchor plus offset);
  - `heritage.js` (`near` hints from the map);
  - `ui.js:642`;
  - `validate.js:30` (find the pond path by id `lv_pond`, not "the first footpath").
- **Tests to update** (remove the coordinates):
  - `run.mjs:156`: the Dragon deck at `(37,-62)`; use the bridge from the map instead.
  - `:187`: `place(28,66)`; use `PLAYGROUND`.
  - `:258`: `(28,60)`, `(-60,0)`.
  - `:330-333`: the `flat` area list and the `[BRIDGE, DRAGON]` exclusion; loop over `PLACES` with `flat` and over all bridges.
  - `:554/571`: the resume spot `(-30,-56)` and "home at −3,−4"; use a road point and `HOME_SPOT` from the map.
  - `:562`: the lake `(55,125)`.
  - `:579`: `place(100,44)`.
  - `village`: `paths[0]`.
  - `perf`: `VILLAGE.x-30`.
  - `:2300/2322`: Sài Gòn spots.
  - `world-audit.mjs`: `onBridge` and `lakeD` become `bridgeAt` and `waterDist`; the exception `lf7` becomes a flag `inWater`.
- **New checks:**
  - `tests/unit/map.test.mjs` (Node, fast): ids unique (WORLD-008); every reference resolves (road gates, bridge `over`, `LANDMARK_HOME`, plots → village) (WORLD-009); everything inside the bounds.
  - A "no stray coordinates" grep in `arch` or `names`: no literal of two or three digits in a position call outside `map.js`, with an allow-list for local model geometry.
  - `perf`: add the ratchets `worldMs` (boot `world` + `roads` + `solids`) and `drawCallsHome` (at the start spot), measured before T1.
- **Saves:** start stamping `profile.posMap = MAP_VERSION` (`main.js:109, :1277`) and `CUSTOM.world.map` (Studio). Add `MAP_VERSION` to both `SIG`s. Migration code is wired up but does nothing for 'C'.
- **Risks:** a missed literal shifts something by a few metres. Before/after screenshots and `features`/`camera`/`solid` should catch it.

### T1: Two banks, the island and moving everything (large)
- **Goal:** `MAP_VERSION='D1'`, `SIZE` 480.
  - **Main river:** north to south, splitting round a **home island**: Ông Cú's plateau lowered to about 10 m, the home or Sunny Farm, and Phố Hai Quê on the main-bridge axis.
  - **Bridges:** two island bridges, `haique` (east) and `island_w`. Both run east–west.
  - **East bank, north to south:** Hà Nội, Bắc Ninh, Làng Sen (with the paddies), Đà Nẵng, Hội An (a region site for now), Chợ Ba Miền, TP. HCM.
  - **West bank, north to south:** Brisbane, Aussie Corner, Sydney, Melbourne, Uluru (the outback beyond a simple Great Dividing Range ridge).
  - **North:** the mountain belt with China Town and India Village.
  - **South:** the coast replaces the southern edge wall; Hồ Gương stays, with Hạ Long and the reef inside it.
  - **Sông Hàn and Cầu Rồng** (a north–south bridge) at Đà Nẵng, so the Dragon Bridge still crosses real water.
  - **Roads:** re-routed in `map.js`; every place reachable by asphalt (R8); still no ring road.
- **Files:** mostly `map.js`, plus the `heightAt` terms (relief from `RELIEF`, the coast, the island, generalised bank ramps); `ferry.js` (the raft path from `WATERS.main`, both channels); `regionAt` (driven by data, same ids); the `REGION_NAMES` additions.
- **What moves:** every place, landmark, shrine, tower, Leafy and festival ground. Opera goes next to Sydney. The Harbour Bridge landmark temporarily stays on the `haique` deck. The lighthouse stays on the coast until T3.
- **Checks that change:**
  - `features` (`cities === 7` is unchanged);
  - `flat` (its count message);
  - `roads` (`gates ≥ 15`, maybe more);
  - `hubmap` (still passes if the north-to-south z order holds; add assertions for the Australian order);
  - `story` and `yard` (the đình is re-found by `openSpot`; the yard moves with `TOWN`);
  - `perf` (rebaseline `worldMs` and allow at most +25 %; `drawCalls` in the village must not rise);
  - `solid` (the bigger grid).
- **New checks:**
  - `banks`, in the unit test and the browser: every `cc:'vn'` place is east of the main river at its z, every `au` place west; the order by z matches the spec's lists; the island is surrounded by water.
  - `migrate`: an old save with `pos` and no `posMap` starts at home with the "valley has grown" toast; old Studio edits are parked.
- **Risks:**
  - Grades: the 8 % rule is the hardest constraint. Keep places at 3–6 m beside rivers and the island at about 10 m.
  - Build time: the terrain is 1.44× bigger. Keep about 2.4 m spacing (`seg = SIZE/2`, 180 on low) and use the water grid for `heightAt`.
  - Solid map size in `localStorage`: about 150 KB.
  - The map picture gets coarser per metre: go from 256 to 320 px.
  - Online friends on different builds: see §4.

### T2: Real water, bridges, ring road, road colours, boats (large)
- **Goal:**
  - Rivers: Sông Hồng (red-brown), the Hội An canal, Sông Sài Gòn, the Brisbane River, the Yarra, the Murray, and the Mekong delta channels.
  - Lakes: Hồ Gươm becomes real water (the Turtle Tower stays inside it), Sydney Harbour, a billabong.
  - Bridge landmarks on `BRIDGES`: Long Biên, Chùa Cầu, Harbour (moved off `haique`), Story, Princes.
  - A ring road with `loop: true`, which needs a closing fillet in `world.js:108`, end handling in `roads.js` `trimmed` and routes in `traffic.js`.
  - Road `tone`: one shared material per tone in `createRoads`, so draw calls don't grow.
  - Boats: the raft stops at every bridge; a Sydney Harbour ferry; a coast boat past the delta.
- **Checks that change:**
  - The Two Homes Street/market landmarks lists.
  - `features`: the `harbour` landmark position.
  - `LANDMARK_HOME`.
  - `validate`: R9 crossings.
  - The rule registry: add RIVER-004/005/006 to ARCHITECTURE §9.5 and `content/rules.js`, or the `rules` check fails.
- **New checks:**
  - `bridges` (RIVER-001/004): every bridge landmark spans its `over` water (≥ 60 % of the span below `WATER−1`, both ends on land); the deck is walkable; crossings within ±20° and straight ≥ 6 m each side.
  - `boats` (RIVER-002/003/005/006): ride every boat end to end, sampling every 1 m with ±1.5 m of hull width; fail if `heightAt > WATER−0.8`. Each stop's pier's land end is within a road's `w/2 + 3 m` (R8 dead end at a pier). Clearance under every deck it passes ≥ boat height + 0.5 m. A blocked route goes back to a pier.
  - `ring`: the loop is closed, there are only T-junctions, every road has a tone.
- **Risks:**
  - Rivers through towns: generalise the WORLD-001 river exemption (`world.js:243` `dr >= 13`) and the `flat` check to `waterDist`.
  - `heightAt` cost: the water grid is required.
  - Boats under low decks.

### T3: Bà Rịa–Vũng Tàu, mountains, Memory Village plots (medium to large; can be split T3a/T3b)
- **Goal:**
  - Vũng Tàu, south-east of HCM, as a place with the shared village-pattern builder (gate, market street, square, stage, back lanes, footpath loop). The lighthouse and Bạch Dinh move there (`cities.js:272`); Nhà Tròn stays.
  - The HCM boat down Sông Sài Gòn.
  - Snowy peaks; China and India moved to final spots in the north.
  - Trường Sơn with the Hải Vân pass as a low saddle at ≤ 8 %.
  - The Great Dividing Range with the outback beyond.
  - `PLOTS`: two Memory Villages of about 20 plots each, plus 2–3 spare plots in each town. Each is levelled (reusing the `LOTS` easing), joined to a lane, has an address, and shows a garden by default. All gardens are one instanced mesh.
- **New checks:**
  - `plots`: at least 60 plots; each flat within 0.05 m; off roads and water; front within 2 m of a road edge; unique addresses; nothing standing on a plot.
  - `boats`: extended to the Vũng Tàu route.
- **Risks:** pass grades; draw calls from the gardens.

### T4: Ground and water looks, signposts, name tags, Pad map (large; split by core)
- **T4a (World):**
  - Road surfaces by region: yellow dashes in Vietnam, white dashes and kerbs in Australia, brick and paving in towns, red-earth paths.
  - A small world-space "water map" texture (river colour and depth from `heightAt`) for per-river colour, a moving foam line and ripples. It is painted once and cached through `worldcache` (`cachedCanvas('water', …)`), so the water stays one draw call.
  - Reeds and water hyacinth (instanced), footsteps by surface.
- **T4b (Kid UI):**
  - Picture signposts at junctions.
  - Name tags (at most 4, fading, never overlapping).
  - A drawn Pad map from `PLACES`/`WATERS` with clouds over unvisited places.
- **Checks:** the `perf` draw calls and texture size (≤ 1024 px), `phone`, `noemoji`.

### Later stages
- **T5:** art direction place by place, with a speed check after each.
- **T6:** riding and roaming animals: zones from `map.js`, no dangerous animals near paths.
- **T7:** journey stops, built with Round R item 3.

## 4. Existing players and stored coordinates
- **Saved spot (`profile.pos`, the `sv2_profiles` format is unchanged):** on start (`main.js:1290`), if `posMap !== MAP_VERSION`, place the child at `HOME_SPOT` on the island and show one "The valley has grown!" moment (tie it to the New! moment). Then stamp `posMap`. Safe copies restored later have no `posMap`, so they take the same path.
- **Data keyed by id, which is unaffected:** `visited` and the region ids (keep `plateau`, `home`, `town`, `village`, `market`, `aussie` and the city ids exactly), stickers, postcards, the lantern and yard story steps, shrine/tower/Leafy flags, farm plots (by index, relative to `HOME`; keep the plot count), `myhouse` (the room is relative).
- **Homes:** `homes.js` uses enumeration ids (`home{k}`). Give them explicit ids in the data in T0 so they don't reorder.
- **Studio world edits** (`CUSTOM.world.build/edits/land`, `CUSTOM.npcs`, all absolute):
  - Content without `world.map` set to 'D1' is **parked**, not applied. A `remove` or `move` circle on a new map could hit the wrong building.
  - Studio's Map page lists parked items to place again. NPCs and new buildings can be offered a re-projection through `LEGACY.C` (old place plus offset onto the new anchor).
  - `content/custom.json` is `{}` in this branch; check the live `studio-draft` content before T1.
  - New Studio features should store `plotId` or `placeId + offset`, never raw x/z.
- **Story positions:**
  - The đình is re-found by `openSpot` round `VILLAGE`.
  - The yard follows `TOWN`; the shop lookup falls back to `npc_bahue`, so the `{x:13,z:41}` fallback must also come from the map.
  - Festival `where` ids, `VN_AREAS` and `PLACE_AREAS` are by id; new ids (`hoian`, `vungtau`, `harbour`, `memory_e/w`) need requests on `docs/cores/BOARD.md` to Voice & Audio, Play and Kid UI.
- **Online:** positions are raw x/z. Add `map` to the hello message in `netmsg.js` (Online core). On a mismatch, show "Ask a grown-up to update" instead of joining.
- **Caches:** they rebuild themselves through `SIG`. Nothing to migrate.

## 5. Open questions for the owner (with my defaults)
1. **"Phố Hai Quê on the main bridge":** *Default:* the street runs across the island along the bridge's line, with the two bridge spans as its ends, so the houses stay on land (WORLD-003).
2. **Sunny Farm:** *Default:* it moves onto the home island with Ông Cú; the plateau is lowered to about 10 m so roads stay ≤ 8 %.
3. **Hải Vân:** *Default:* a low saddle at ≤ 8 %, not a tunnel.
4. **Returning children:** *Default:* they start at home once, with a "valley has grown" moment.
5. **Size:** *Default:* 480 m. If phones miss the speed checks, fall back to 440 m with the same layout.

### Critical Files for Implementation
- /home/user/sv-t/js/world.js
- /home/user/sv-t/js/roads.js
- /home/user/sv-t/js/regions.js
- /home/user/sv-t/js/ferry.js
- /home/user/sv-t/tests/run.mjs
- /home/user/sv-t/tests/world-audit.mjs
- /home/user/sv-t/js/content/map.js (new)
## 3b. The plan checked against the Concept D drawings (10 Oct AEST)
The owner's approved map is the SVG in `docs/concept-d/index.html` ("Thung Lũng Hai Quê"). It is drawn on a 420 × 420 grid:
metres = (drawing − 210) × 8/7 (480 m valley, centre 0,0, north up). `docs/cores/round-t/t1-vs-concept-d.png` shows it next
to the T1 layout taken from it.

Where the plan above differed from the drawing (the drawing wins):
- The main river is one river from the northern mountains straight to the sea (x about 0 to +25), splitting only round a
  small home island at about (9, −11); it does not end in a lake.
- Hồ Gương (Mirror Lake) is a lake by Làng Sen, between the river and the Vietnam road, at about (103, −46), not in the south.
- The ring road (drawn about 106 × 92 m round the island) carries the two island bridges; the roads to each bank leave it east
  and west at the island's latitude (z about −11).
- Vietnam road straight north–south at x about 153 (Hà Nội −135, Đà Nẵng 7, Hội An 91, TP. HCM 149); Bắc Ninh is north-east of
  Hà Nội at about (215, −162); Làng Sen east of the road at about (192, −37); Chợ Ba Miền east of the road between Hội An and
  TP. HCM. Australia road at x about −114 (Brisbane −137, Sydney −11 west of the road, Melbourne 126); Aussie Corner east of
  the road between Brisbane and Sydney; Sydney Harbour between Sydney and the river.
- Uluru stands west, about (−210, 59), beyond the Great Dividing Range (x about −178 to −142); a billabong at (−201, 9).
- China Town about (107, −169) and India Village about (−94, −174), on the purple mountain road from Brisbane to Hà Nội over the
  north, which crosses the river.
- The Trường Sơn range stands between the river and the Vietnam road (x about 48 to 78); the road east from the island crosses
  it (Hải Vân pass, T3).
- Memory Villages: east (46..103, 64..103), west (−80..−23, 48..87): kept free from T1.

Where the drawing and the written spec disagree (asked to the owner):
- Bắc Ninh: the written list says Hà Nội, Bắc Ninh north to south; the drawing puts Bắc Ninh north-east of Hà Nội (real geography).
- The island is drawn about 68 × 60 m, too small for Ông Cú's plateau, Phố Hai Quê and Sunny Farm (decisions 1 and 2).
- Main roads are drawn 6.4 m wide ("Vietnam main road (6.4 m)"); the hard rule R1 / ROAD-001 says asphalt 5.2 m (T4).

## Progress (for the next chat to pick up)
**10 Oct 2026, T2 built: release r57 (Release core chat, branch `round-t`, local commits; waiting for the owner's "yes, push" / "yes, deploy").**
The owner said "go" for T2 (10 Oct) with: Chùa Cầu a footbridge beside the road; the western rivers join the main river;
road colours as tinted asphalt (`docs/cores/release.md`, Owner's decisions).
- Water (`js/world.js`, `js/content/map.js` WATERS): rivers have a width (`w`, against the main river's) and a `tone`; small
  round lakes (`kind: 'pond'`, `PONDS`, `pondDist`). New: Sông Hồng (red-brown, from the north-east hills past Hà Nội's south,
  through Hồ Gương, under the ring road into the main river), the Hội An canal (off Sông Hàn), Sông Sài Gòn (main river to
  the sea past TP. HCM), two Mekong channels, the Brisbane River, Sydney Harbour (wide, main river to Sydney), the Yarra,
  the Murray, Hồ Gươm by Hà Nội (Turtle Tower on its island, Thê Húc bridge on it) and a billabong by Uluru.
- Bridges (`BRIDGES`): Long Biên (truss), Chùa Cầu (covered footbridge, `foot`), the Harbour Bridge (moved to Sydney
  Harbour, on the ring road), the Story Bridge (cantilever), Princes Bridge (stone arches); plain bridges for the ring road
  over Sông Hồng and the Vietnam road over the canal; the island's east bridge is plain. Postcards for Long Biên and Princes
  Bridge; the market's small copies of the Turtle Tower and Chùa Cầu are gone (the real ones stand in place).
- Moved to make room: Aussie Corner 6 m south, the paddies (210, −98) r 16, the Chợ Trâu ground (75, −146), the Đua bò
  ground (108, 106), Mỹ Sơn, Phong Nha, Tràng An. MAP_VERSION 'D2' (a spot saved on D1 starts at home once).
- Roads: each asphalt road has a `tone` (`ROAD_TONES`: red Vietnam, orange Australia, purple mountains, blue coast, plain
  grey home), one material per colour, white lines kept.
- Boats: the raft line stops by every bridge it passes under (`bridgeStops`, a footpath to each pier); the Sydney Harbour
  ferry (Sydney quay to the island, under the Harbour Bridge); the lake ferry keeps two piers (Làng Sen and Đà Nẵng, each
  with a footpath); no crossing rafts (Concept D lists none). The raft's roof is 0.4 m lower, the harbour ferry has no flag,
  so both pass under every deck.
- Checks: new `bridges` (RIVER-004), `boats` (RIVER-002/005/006), `roadtone` (ROAD-014); rules added to ARCHITECTURE §9.
- Speed: crop plants and fruit bushes are drawn as two pieces each (home 1,094 draws, village 690 / 695k triangles). The
  world builds about 0.9 s slower than r56 (6.8–7.0 s against 5.9–6.1 s side by side; limit 7.4 s): more water, bridges and
  roads in every height look-up.
- Pictures: `docs/cores/round-t/t2-sky-pad-vs-concept-d.jpg`. Next: T3 (Vũng Tàu and its boats, the Memory Villages, the
  Trường Sơn range and Hải Vân pass), plan first and the owner's "go".

**10 Oct 2026, T1 built: release r56 (Release core chat, branch `round-t`, local commits; waiting for the owner's "yes, push" / "yes, deploy").** r55 (T0) was pushed as pull
request #21 (not merged, not deployed). The owner said "go, build T1" with these answers (10 Oct): a bigger home island so Ông
Cú, Phố Hai Quê and Sunny Farm fit; Bắc Ninh north-east of Hà Nội as drawn; the ring road in T1; asphalt roads 6.4 m (rule R1
changed, `ROAD_WIDTH` in the map); Release stamps Studio map edits (`studio/ui/app.js` Map page: older edits go to
`CONTENT.parked`, then `world.map` = MAP_VERSION).
- Built so far: `js/content/map.js` MAP_VERSION 'D1' from the Concept D map (§3b; `docs/cores/round-t/t1-vs-concept-d.png`):
  480 m valley, the home island (plateau r 24 h 8, Phố Hai Quê, Sunny Farm), the main river split round it (`main_n`, `main_w`,
  `main_e`, `main_s`), Sông Hàn with Cầu Rồng along z, the ring road (`loop: true`) with plain bridges north and south, the
  island bridges (Harbour style east, plain west), Vietnam road at x 153, Australia road at x −132, the mountain road Brisbane →
  India → China → Bắc Ninh, the coast in the south (`WORLD.coast`), the Great Dividing Range (`RELIEF`), Hồ Gương by Làng Sen.
  `world.js`: river distance over every river in a 16 m grid (`RIVERS`, `RIVER` = the raft line), coast, ridge, edge only east,
  west and north, the open ground never below water by itself, loop fillet, plain bridges; `roads.js`: loops untrimmed, gates
  as wide as their road, Cầu Rồng turns with its bridge; pick-ups moved from `js/data.js` into the map (`GATHER_AT`).
- Fixed on the way: gate posts as wide as the 6.4 m roads; side gates that hit city sites removed (Hà Nội east, Sydney east;
  Bắc Ninh is reached by the mountain road, `link_au` meets the Australia road south of Sydney); Bondi up the beach out of
  the sea; plateau apples spread by the plateau's size (they fell into the river); trees kept off the riverbanks; the lake
  tower on flat ground; crops kept inside the valley; the Chợ Trâu festival ground moved clear; a pick-up off the mountain
  road; `js/netmsg.js` positions ±235 m (board: Online); the `coop` check searches the whole valley.
- Speed (PERF-003): from Lotus Village a child now sees across the river to Đà Nẵng, so the village view drew 1.0M triangles
  (limit 800k). Not drawn any more: small things far from every camera, each taken whole (a lantern from 110 m, a house from
  230 m, busy little things such as people and vehicles from 65 m, the dark outlines from 40 m, where they are a sixth of a
  pixel) (`G.farCull` in `js/main.js`). Now 714k triangles, 701 draws in the village, 1,085 draws at home (r54: 2,335).
  `perf-baseline.json`: draw calls lowered to what T1 measures; `worldMs` set to r54's own median measured side by side
  (r54 5.7–6.1 s, T1 5.8–6.1 s, six starts each; the 4.7 s from T0 came from a quieter machine), +25 % unchanged.
- Found by the full suite and the screenshots, fixed: the water buffalo rests now and then and was marked solid where it stood
  (the phone and desktop solid maps differed; it is `moving` now); the `solid` check walked into spots from the old 400 m grid
  (now from the valley's size); the lowered Dawn Plateau no longer counted as the plateau (`regionAt` wanted ground above 12 m;
  now the plateau's height from the map), so home read as meadow: new check `regions` (every area somewhere in the valley, the
  big places read as themselves). Ông Cú says "The valley has grown!" aloud too (recorded with Azure, en and vi).
- Looked at: the sky view and the Pad map next to the Concept D map (`docs/cores/round-t/t1-sky-pad-vs-concept-d.jpg`); phone,
  tablet and computer at home, Phố Hai Quê, Lotus Village, Đà Nẵng and Sydney; a low fly-over of 23 places (nothing floating
  or sunk). Seen, left for later: the Pad map's names overlap on the east side (Village festival stage over Đà Nẵng, Three
  Regions Market over Hồ Chí Minh City) and Hội An is not in its list yet (Kid UI on the board; the drawn Pad map is T4).
  Walking into Phố Hai Quê gives the Australia "visit" stamp (the town has always counted for Australia; in r54 its middle
  read as meadow): kept as it is.
- Next: T2 (real water: the named rivers and lakes, the bridge landmarks, road colours, boats; the ring road is already in T1), plan first and the owner's "go".

**Earlier: 10 Oct 2026, about 07:30 AEST: stage T0 built (steps 1 to 6), release r55.**
- Step 1: `js/content/map.js` (MAP_VERSION 'C'). Step 2: `world.js`, `roads.js`, `ferry.js` from the map. Step 3: every builder
  places its things from its place's anchor (regions, vendors, cities, town, homes with fixed ids, hawkers, places, pets, yard,
  heritage, main, ui, solids, validate, traffic, gather, secrets, regionsites, vnfun); MAP_VERSION in the solids and
  worldcache signatures. Step 4: `profile.posMap`; no stamp means 'C'; another layout starts at home once with "The valley has
  grown!"; Studio map content from another layout is parked (`STUDIO_ON_MAP`, `PARKED` in world.js, `G.parked`). Step 5: the
  checks lost their fixed positions; new `tests/unit/map.test.mjs`, `mapcoords` (r54 had 103 stray positions, now 0),
  `migrate`; `perf` adds `drawCallsHome` (r54: 2335) and `worldMs` (r54: 4700 ms, +25 % allowed). Step 6: positions match r54
  within 0.01 m; the 17 screenshots differ from r54 no more than two r54 runs differ from each other.
- The "before" reference from r54 is outside the repo (the chat's scratchpad: `ref/dump.mjs`, `ref/compare.py`); a new chat
  rebuilds it from main if needed.
- Found while checking the plan: also hard-coded were `traffic.js`, `gather.js`, `secrets.js`, `pets.js`, `regionsites.js`,
  `vnfun.js`, `main.js` (title camera, ±190), and things by Ông Cú's plateau (at 0,0); all from the map now.
- Open for the owner: the start-up download check (`perf` startMB) already fails on r54 about 3 runs in 4 (3.33–3.37 MB against
  3.2 MB + 3 %); T0 adds about 22 KB. Board: Analytics & Infra (smaller start-up download), Online (netmsg size and map in the
  hello), Studio (stamp `world.map`, list parked items) before T1.
- Next: r55 full suite, packages, report; then the T1 plan (wait for the owner's "go").

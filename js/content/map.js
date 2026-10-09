// The map of the valley (round T, ARCHITECTURE §12 step 3): the one place that holds world coordinates.
// Plain data with no imports, so Node can read it too (tests/unit/map.test.mjs). js/world.js builds its exported
// places (VILLAGE, TOWN, CITIES, RIVER, BRIDGE…) from it, and every builder places its things as an offset from its
// place's anchor, so moving a place here moves everything in it.
// x runs east, z runs south (north is −z); 1 unit = 1 m.
// MAP_VERSION names the layout: 'C' is the valley as it was up to round S. A saved spot (profile.pos) is stamped with
// it (profile.posMap), so a later layout knows the spot belongs to an older map (js/main.js migratePos).
export const MAP_VERSION = 'C';

export const WORLD = {
  size: 400, north: '-z', water: 0,
  edge: [150, 195],                                // the wall of hills round the edge rises between these distances from the middle
  mountains: { z0: -55, z1: -165, pines: -60, region: -75 }, // the snowy belt in the north: starts rising at z0, full at z1; pines north of `pines`; "Snowcap Peaks" north of `region`
  wild: { x0: -170, x1: 170, z0: -120, z1: 170 },  // where wild dig spots, bushes and rocks are scattered (js/gather.js)
  summit: { x0: -150, x1: 150, z0: -185, z1: -90, zMin: -180 }, // where the snowman looks for the highest summit (js/secrets.js)
  keepLeft: [[-1e9, -85, -1e9, 1e9], [-1e9, -20, 20, 70]],  // [x0, x1, z0, z1]: traffic keeps left here, as in Australia (js/traffic.js)
  rooms: [-176, -176, 420]                          // [x, z, height]: inside a house, the room is built high above the far north-west corner, where nothing else is (js/homes.js)
};

// Places: `at` is the anchor [x, z]. Circles have r; boxes have w, d (half the width and depth, like the cities), so
// the box runs from at − w to at + w. h is the one flat level of a village, town or city (HANDOFF rule 10).
// street.roadZ: where a street place's main street runs, from the anchor. gates: road ends, from the anchor.
// A place with `place` instead of `at` sits at an offset (`off`) from that place's anchor.
export const PLACES = [
  { id: 'plateau', kind: 'site', cc: 'home', at: [0, 0], r: 32, h: 18 },   // the Dawn Plateau, Ông Cú's home
  { id: 'village', kind: 'village', cc: 'vn', at: [110, 30], r: 34, h: 3 },   // Lotus Village (Làng Sen)
  { id: 'paddies', kind: 'site', cc: 'vn', at: [112, -38], r: 26, h: 2.4 },   // the rice fields
  { id: 'lake', kind: 'lake', at: [55, 125], r: 46 },   // Mirror Lake (Hồ Gương)
  { id: 'bamboo', kind: 'site', at: [-100, 85], r: 48 },   // Whispering Bamboo
  { id: 'home', kind: 'village', cc: 'home', at: [-26, 126], r: 30, h: 4 },   // Sunny Farm: house, field, barn and Mr. Bear's market
  { id: 'town', kind: 'street', cc: 'home', at: [32, 53], w: 20, d: 21, h: 7.2, street: { roadZ: -6 } },   // Two Homes Street (Phố Hai Quê): Bà Rịa meets a Sydney suburb
  { id: 'market', kind: 'street', cc: 'vn', at: [121, 83], w: 25, d: 13, h: 4, street: { roadZ: 0 } },   // Chợ Ba Miền, the Three Regions market
  { id: 'aussie', kind: 'street', cc: 'au', at: [-117, -12], w: 27, d: 28, h: 4.5, street: { roadZ: 0 } },   // Aussie Corner
  // the cities (js/cities.js): the first gate is the main gate; the main street runs straight through
  { id: 'danang', kind: 'city', cc: 'vn', at: [84, -40], w: 13, d: 11, h: 3, icon: '🐉', name: ['Đà Nẵng', 'Đà Nẵng'], gates: [[0, -11], [0, 11]] },
  { id: 'bacninh', kind: 'city', cc: 'vn', at: [48, -124], w: 16, d: 13, h: 8, /* (8 m: the road from the Dragon Bridge stays under 8 %) */ icon: '🕰️', name: ['Bắc Ninh', 'Bắc Ninh'], gates: [[0, 13]] },
  { id: 'hanoi', kind: 'city', cc: 'vn', at: [4, -62], w: 13, d: 13, h: 5.2, icon: '🐢', name: ['Hà Nội', 'Hà Nội'], gates: [[13, 0], [-13, 0]] },
  { id: 'saigon', kind: 'city', cc: 'vn', at: [-8, 86], w: 13, d: 11, h: 7.4, icon: '🛵', name: ['Hồ Chí Minh City', 'TP. Hồ Chí Minh'], gates: [[0, -11]] },
  { id: 'brisbane', kind: 'city', cc: 'au', at: [-70, -32], w: 13, d: 11, h: 3, icon: '🐨', name: ['Brisbane', 'Brisbane'], gates: [[0, 11], [0, -11]] },
  { id: 'melbourne', kind: 'city', cc: 'au', at: [-144, 66], w: 13, d: 13, h: 4.4, icon: '🚋', name: ['Melbourne', 'Melbourne'], gates: [[13, 0]] },
  { id: 'sydney', kind: 'city', cc: 'au', at: [-36, 52], w: 13, d: 13, h: 5, icon: '⛴️', name: ['Sydney', 'Sydney'], gates: [[13, 0], [-13, 0]] },
  { id: 'china', kind: 'village', cc: 'asia', at: [100, -88], r: 24, h: 4.5 },   // China Town (4.5 m: the road up from Đà Nẵng stays under 8 %)
  { id: 'india', kind: 'village', cc: 'asia', at: [-112, -84], r: 24, h: 5.5 },   // India Village (5.5 m: the road from the Brisbane junction stays under 8 %)
  { id: 'uluru', kind: 'site', cc: 'au', at: [-128, 152] },   // Uluru, the big red rock in the far south-west
  { id: 'apostles', kind: 'site', cc: 'au', at: [-132, 126] },   // the Twelve Apostles (js/regionsites.js): kept free of trees
  // festival grounds (js/vnfun.js), kept free of trees: the buffalo pushing ring north of Bắc Ninh, the bull-race field west of Sài Gòn
  { id: 'choitrau', kind: 'ground', cc: 'vn', at: [-8, -140] },
  { id: 'duabo', kind: 'ground', cc: 'vn', at: [-62, 84] },
  // places inside places
  { id: 'playground', kind: 'site', place: 'town', off: [-4, 9], r: 13, h: 7.2 },   // the park on Two Homes Street, where kids from Australia and Vietnam play
  // (round R story) bà Huệ and ông Nghi's yard (js/yard.js): its own levelled plot on the slope behind the north row of
  // Two Homes Street, facing the street (+z), clear of the river
  { id: 'yard', kind: 'plot', place: 'town', off: [11, -38.5], w: 15.5, d: 12, rot: 0, h: 5.8 }
];

// Water: one sea-level plane, and channels carved below it. The river runs from the northern mountains south into Mirror Lake.
export const WATERS = [
  { id: 'main', kind: 'river', pts: [[-35, -200], [-25, -130], [5, -85], [45, -55], [62, -10], [62, 40], [57, 85]] }, // (moved 4 m east past Two Homes Street, whose last cottage stood on the bank)
  { id: 'lake', kind: 'lake', place: 'lake' }
];

// Bridges run along the x or the z axis, never diagonally: from a0 to a1 along it, centred on c across it; h is the deck.
export const BRIDGES = [
  { id: 'haique', axis: 'x', a0: 44, a1: 74, c: 47, w: 6.4, h: 7.4, over: 'main', style: 'harbour', landmark: 'harbour' },   // the Harbour-style bridge carrying Two Homes Street over the river
  { id: 'rong', axis: 'x', a0: 22, a1: 52, c: -62, w: 6.4, h: 5.4, over: 'main', style: 'dragon', landmark: 'dragonbridge' }   // Đà Nẵng's golden Dragon Bridge carrying the road east over the river
];

// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other.
// Each road is a list of [x, z] points. `gates` names the place at the start and at the end of the road:
// a golden welcome gate stands exactly there, across the road (js/roads.js). Roads that end on another road
// (a junction) have no gate at that end. Two Homes Street and the market keep their own streets.
// js/world.js rounds the corners (fillets) and joins side roads onto the road they end on.
export const ROADS = [
  // west from Two Homes Street: Sydney, Hồ Chí Minh City and the farm
  { id: 'town_sydney', kind: 'asphalt', pts: [[6, 47], [-4, 48], [-14, 52], [-23, 52]], gates: ['town', 'sydney'] },
  { id: 'saigon_road', kind: 'asphalt', pts: [[-4, 48], [-6, 60], [-8, 66], [-8, 75]], gates: [null, 'saigon'] },
  { id: 'farm_road', kind: 'asphalt', pts: [[-6, 60], [-17, 60], [-22, 67], [-24, 76], [-23, 88], [-22, 99]], gates: [null, 'home'] }, // leaves the Sài Gòn road at ~72° and runs straight ~7 m before it bends (R5: a T, never a shallow fork)
  // Sydney to Melbourne, and north to Brisbane and Aussie Corner
  { id: 'sydney_melbourne', kind: 'asphalt', pts: [[-49, 52], [-60, 52], [-82, 53], [-100, 55], [-114, 62], [-122, 66], [-131, 66]], gates: ['sydney', 'melbourne'] },
  { id: 'brisbane_road', kind: 'asphalt', pts: [[-60, 52], [-57, 32], [-55, 18], [-60, 2], [-68, -8], [-70, -12], [-70, -21]], gates: [null, 'brisbane'] },
  { id: 'aussie_road', kind: 'asphalt', pts: [[-70, -12], [-80, -12], [-90, -12]], gates: [null, 'aussie'] }, // a square T off the Brisbane road (R5)
  // Brisbane to Hà Nội, and to India Village
  { id: 'brisbane_hanoi', kind: 'asphalt', pts: [[-70, -43], [-70, -55], [-50, -54], [-30, -56], [-18, -62], [-9, -62]], gates: ['brisbane', 'hanoi'] }, // a longer straight below Brisbane's gate, so the India road can leave it square
  { id: 'india_road', kind: 'asphalt', pts: [[-70, -48], [-80, -48.5], [-96, -50], [-108, -51], [-112, -54], [-112, -58]], gates: [null, 'india'] }, // leaves the straight below Brisbane's gate square (R5), 5 m clear of the gate, not the bend
  // from Hà Nội over Đà Nẵng's Dragon Bridge, to Đà Nẵng, China Town and Bắc Ninh
  { id: 'hanoi_china', kind: 'asphalt', pts: [[17, -62], [56, -62], [70, -57], [84, -54], [96, -55], [100, -58], [100, -62], [100, -70]], gates: ['hanoi', 'china'] },   // up the slope into China Town
  { id: 'danang_road', kind: 'asphalt', pts: [[84, -54], [84, -51]], gates: [null, 'danang'] },
  { id: 'bacninh_road', kind: 'asphalt', pts: [[56, -62], [54, -80], [48, -100], [48, -111]], gates: [null, 'bacninh'] },
  // south from Đà Nẵng past Lotus Village to the Harbour Bridge and the market (the village and the market have their own gates)
  { id: 'danang_market', kind: 'asphalt', pts: [[84, -29], [84, -22], [78, -10], [73, 8], [75, 22], [73.5, 30], [75, 36], [79, 42], [79, 52], [82, 62], [88, 74], [96, 83]], gates: ['danang', null] },
  { id: 'harbour_link', kind: 'asphalt', pts: [[76, 47], [79, 47]], gates: [null, null] },   // off the Harbour Bridge: the road passes just beyond its stone towers
  { id: 'village_link', kind: 'asphalt', pts: [[73.5, 30], [78, 30]], gates: [null, null] },   // Lotus Village has its own old gate (cổng làng)
  // dirt roads
  { id: 'plateau_ramp', kind: 'dirt', pts: [[0, 33], [0, 40], [-2, 47.6]] },                       // down the Dawn Plateau to the main road
  { id: 'village_lane', kind: 'dirt', pts: [[79, 30], [92, 30]] },                               // Lotus Village's lane, in through its old gate
  { id: 'paddies_lane', kind: 'dirt', pts: [[110, -3], [111, -12]] },                              // Lotus Village to the rice fields
  { id: 'bacninh_china', kind: 'dirt', pts: [[64, -114], [67, -98], [76, -88], [84, -86]] },                 // Bắc Ninh to China Town
  { id: 'aussie_melbourne', kind: 'dirt', pts: [[-146, -12], [-150, 15], [-148, 40], [-144, 53]] },    // Aussie Corner to Melbourne
  { id: 'aussie_india', kind: 'dirt', pts: [[-112, -36], [-104, -36], [-104, -50.7]] }, // Aussie Corner to the India road, straight down into it (R5)
  { id: 'saigon_lake', kind: 'dirt', pts: [[-8, 97], [0, 106], [4, 110]] },                       // Hồ Chí Minh City to Mirror Lake
  { id: 'farm_lake', kind: 'dirt', pts: [[-12, 128], [-4, 130], [6, 140]] },                    // the farm to Mirror Lake
  { id: 'farm_woods', kind: 'dirt', pts: [[-56, 128], [-80, 132], [-104, 134], [-116, 134]] },   // the farm to the western woods
  { id: 'market_lake', kind: 'dirt', pts: [[118, 96], [112, 108], [100, 118]] },                  // the market to Mirror Lake
  // footpaths (R1, 1.6 m; Phase 2, round 30): Lotus Village's pond path (R11) carries on from the village lane round the
  // lotus pond's north and east sides, 8 m from its middle (1.5–2.5 m from the water), and ends at a bench; a short
  // path leaves it square (R5) to the little shrine at the foot of the banyan tree (js/lotus.js)
  ...(() => {
    const [vx, vz] = PLACES.find(p => p.id === 'village').at, cx = vx - 10, cz = vz + 4, arc = []; for (let a = 215; a <= 440; a += 15) arc.push([cx + 8 * Math.cos(a * Math.PI / 180), cz + 8 * Math.sin(a * Math.PI / 180)]);
    return [{ id: 'lv_pond', kind: 'footpath', pts: [[vx - 18, vz], ...arc] }, { id: 'lv_shrine', kind: 'footpath', pts: [[cx + 8, cz], [vx + 2.4, vz + 4]] }];
  })()
];

// Where the road from Sydney crosses the Dawn Plateau's ramp to Two Homes Street: a gentle saddle, so the road meets
// the street at its own level by the gate. `box` [x0, x1, z0, z1]; `heights` [x, height] along it; `line` the road's
// course [x, z] (west end, bend, east end).
export const SADDLES = [{ id: 'town_ramp', box: [-30, 16, 20, 76], heights: [[-30, 5], [-14, 7.5], [-6, 9.5], [0, 9.5], [6, 7.2], [16, 7.2]], line: [[-23, 52], [-4, 48], [6, 47]] }];

// Spots kept free of trees ([x, z, r]): round Uluru, and an old clearing on the south shore (kept since round 5).
export const CLEARINGS = [{ id: 'uluru', place: 'uluru', off: [0, -2], r: 34 }, { id: 'southshore', at: [24, 170], r: 14 }];

// ---------- places of interest ----------
export const SHRINES = [
  { id: 'sh_pattern', game: 'pattern', at: [-16, -12] },
  { id: 'sh_count', game: 'counting', at: [17, -15] },
  { id: 'sh_letters', game: 'letters', at: [-6, 20] },
  { id: 'sh_memory', game: 'memory', at: [-62, 18] },
  { id: 'sh_hanoi', game: 'hanoi', at: [-30, -98] },
  { id: 'sh_robot', game: 'robot', at: [12, 92] },
  { id: 'sh_goat', game: 'goat', at: [-112, 98] },
  { id: 'sh_sort', game: 'sorting', at: [150, -48] },
  { id: 'sh_shapes', game: 'shapes', at: [98, 165] },
  { id: 'sh_colors', game: 'colors', at: [-78, -58] }, // beside the India road junction, not on the road (moved in round 30 when the junction was squared)
  { id: 'sh_maze', game: 'maze', at: [70, -110] },
  { id: 'sh_numbers', game: 'numbers', at: [160, 85] }
];
export const TOWERS = [
  { id: 'tw_plateau', at: [8, 4] },
  { id: 'tw_bamboo', at: [-88, 60] },
  { id: 'tw_peaks', at: [20, -125] },
  { id: 'tw_lake', at: [120, 120] }
];
// hidden Leafies under rocks or as a sparkle (their ids are lf0, lf1… in this order: saved in profiles)
export const LEAFIES = [
  ['rock', -24, 8], ['sparkle', 0, -28], ['rock', 26, 18], ['sparkle', -40, -30], ['rock', -78, 30], ['sparkle', -120, 120], ['rock', -92, 112],
  ['sparkle', 55, 125], ['rock', 30, 150], ['sparkle', 140, 140], ['rock', 150, 10], ['sparkle', 112, 30], ['rock', 120, -70], ['sparkle', 80, -80],
  ['rock', -10, -150], ['sparkle', -60, -140], ['rock', 50, -150], ['sparkle', -150, -32], ['rock', -150, 40], ['sparkle', 0, 60], ['rock', 70, 60],
  ['sparkle', -62, 152], ['rock', 170, -120], ['sparkle', 95, -15]
].map(([kind, x, z], i) => ({ id: 'lf' + i, kind, at: [x, z], ...(i === 7 ? { inWater: true } : {}) })); // (lf7 sparkles over the middle of the lake on purpose)

// Where each landmark stands: its place and the offset from that place's anchor (js/regions.js, js/cities.js,
// js/heritage.js). For the UNESCO sites it is only where to start looking for a clear spot (js/heritage.js).
export const LANDMARK_AT = {
  // postcards (js/regions.js)
  opera: { place: 'lake', off: [43, 3] },        // on the lake's east beach, looking over the water like Bennelong Point
  harbour: { place: 'town', off: [27, -6] },     // the middle of the Harbour Bridge (the postcard is on the street's south footpath)
  uluru: { place: 'uluru', off: [0, -16] },      // the postcard, in front of the rock
  banana: { place: 'aussie', off: [19, -6] },
  bondi: { place: 'lake', off: [-37, 29] },
  lighthouse: { place: 'home', off: [16, 34] },  // on the hill by the south shore
  turtle: { place: 'market', off: [-18, 10.5] },
  onepillar: { place: 'market', off: [-10, -10] },
  chuacau: { place: 'market', off: [0, 10.5] },
  benthanh: { place: 'market', off: [24, -4] },
  // Two Homes Street (js/cities.js)
  bachdinh: { place: 'town', off: [-19, 19.5] },
  nhatron: { place: 'town', off: [4.5, 10.5] },
  // the UNESCO sites (js/heritage.js)
  halong: { place: 'lake', off: [-33, -7] },
  hue: { place: 'village', off: [40, -12] },
  myson: { place: 'market', off: [31, -33] },
  phongnha: { place: 'paddies', off: [16, -22] },
  trangan: { place: 'danang', off: [-2, 12] },
  reef: { place: 'lake', off: [21, 35] },
  sisters: { place: 'melbourne', off: [-16, -26] },
  exhibition: { place: 'aussie', off: [-43, -12] },
  kakadu: { place: 'sydney', off: [-42, -8] },
  forbidden: { place: 'china', off: [28, 18] },
  heaven: { place: 'china', off: [-28, 16] },
  terracotta: { place: 'china', off: [24, -14] },
  potala: { place: 'china', off: [-24, -16] },
  qutub: { place: 'india', off: [-26, 18] },
  redfort: { place: 'india', off: [26, -20] },
  konark: { place: 'india', off: [26, 16] },
  hampi: { place: 'india', off: [-26, -18] },
  mahabodhi: { place: 'india', off: [-40, 0] }
};
// which place each landmark belongs to in the real world (the Pad map lists it under that place; moved from js/ui.js)
export const LANDMARK_HOME = { bnclock: 'bacninh', chuadau: 'bacninh', butthap: 'bacninh', dendo: 'bacninh', quanho: 'bacninh',
  turtle: 'hanoi', onepillar: 'hanoi', vanmieu: 'hanoi', puppettheatre: 'hanoi', thehuc: 'hanoi', halong: 'hanoi', trangan: 'hanoi',
  dragonbridge: 'danang', goldenbridge: 'danang', marble: 'danang', hoian: 'danang', chuacau: 'danang', myson: 'danang', hue: 'danang', phongnha: 'danang',
  benthanh: 'saigon', cathedral: 'saigon', postoffice: 'saigon', cairang: 'saigon', bachdinh: 'saigon', nhatron: 'saigon', lighthouse: 'saigon',
  wheel: 'brisbane', lonepine: 'brisbane', storybridge: 'brisbane', reef: 'brisbane', banana: 'sydney',
  opera: 'sydney', harbour: 'sydney', sydneytower: 'sydney', lunapark: 'sydney', bondi: 'sydney', sisters: 'sydney',
  flinders: 'melbourne', wtram: 'melbourne', exhibition: 'melbourne', apostles: 'melbourne', kakadu: 'uluru', uluru: 'uluru',
  forbidden: 'china', heaven: 'china', terracotta: 'china', potala: 'china', qutub: 'india', redfort: 'india', konark: 'india', hampi: 'india', mahabodhi: 'india' };

// Boats (js/ferry.js): the lake ferry's piers (degrees round the lake, 0 = east, 90 = south) and the river rafts.
export const BOATS = [
  { id: 'lakeferry', water: 'lake', docks: [{ id: 'north', a: 100 }, { id: 'farm', a: 160 }, { id: 'town', a: 243 }, { id: 'market', a: 330 }] },
  { id: 'raft', water: 'main', stops: 'places' },        // the raft line up and down the river, stopping by the towns (under both bridges)
  { id: 'crossing', water: 'main', count: 2 }            // two rafts crossing to the other bank, well away from the bridges
];

// ---------- looking things up ----------
const BY_ID = new Map(PLACES.map(p => [p.id, p]));
// a place's anchor [x, z] (a place inside a place: its parent's anchor plus its offset)
export function anchorOf(id) { const p = BY_ID.get(id); if (!p) return null; if (p.at) return p.at; const a = anchorOf(p.place); return a && [a[0] + p.off[0], a[1] + p.off[1]]; }
// where a landmark stands [x, z]
export function landmarkAt(id) { const L = LANDMARK_AT[id]; if (!L) return null; const a = anchorOf(L.place); return a && [a[0] + L.off[0], a[1] + L.off[1]]; }

// The anchors of earlier layouts, frozen (only for moving old saves and old Studio edits onto a new map).
export const LEGACY = Object.freeze({
  C: Object.freeze({ plateau: [0, 0], village: [110, 30], paddies: [112, -38], lake: [55, 125], bamboo: [-100, 85], home: [-26, 126], town: [32, 53], market: [121, 83], aussie: [-117, -12],
    danang: [84, -40], bacninh: [48, -124], hanoi: [4, -62], saigon: [-8, 86], brisbane: [-70, -32], melbourne: [-144, 66], sydney: [-36, 52], china: [100, -88], india: [-112, -84],
    uluru: [-128, 152], apostles: [-132, 126], choitrau: [-8, -140], duabo: [-62, 84], playground: [28, 62], yard: [43, 14.5] })
});

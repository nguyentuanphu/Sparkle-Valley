// The map of the valley (round T, ARCHITECTURE §12 step 3): the one place that holds world coordinates.
// Plain data with no imports, so Node can read it too (tests/unit/map.test.mjs). js/world.js builds its exported
// places (VILLAGE, TOWN, CITIES, RIVER, BRIDGE…) from it, and every builder places its things as an offset from its
// place's anchor, so moving a place here moves everything in it.
// x runs east, z runs south (north is −z); 1 unit = 1 m.
// MAP_VERSION names the layout: 'C' is the valley as it was up to round S; 'D1' is Concept D stage T1 (the owner's
// approved map, docs/concept-d/index.html: two banks, the home island with its ring road, mountains in the north, the
// coast in the south). A saved spot (profile.pos) is stamped with it (profile.posMap), so a later layout knows the spot
// belongs to an older map (js/main.js).
export const MAP_VERSION = 'D1';
// Is a saved spot, or the family's Studio content, made on this layout? Anything saved before round T has no stamp: it
// belongs to map 'C'. (A spot or Studio edit from an older layout is never used at the wrong place: js/main.js, js/world.js.)
export const onThisMap = stamp => (stamp || 'C') === MAP_VERSION;

// Road classes and their widths (rule R1 / ROAD-001; owner, 10 Oct AEST: asphalt 6.4 m, as the Concept D drawings show)
export const ROAD_WIDTH = { asphalt: 6.4, dirt: 3.4, footpath: 1.6 };

// (Concept D map: drawing units × 8/7 = metres, the drawing's middle (210, 210) is (0, 0); north up)
export const WORLD = {
  size: 480, north: '-z', water: 0,
  edge: [222, 252],                                // the wall of hills on the east, west and north rises between these distances from the middle
  coast: { z: 194, sea: -5 },                      // the southern coast: the sea from about z, with a sandy beach before it
  mountains: { z0: -150, z1: -238, pines: -150, region: -172 }, // the snowy belt in the north: starts rising at z0, full at z1; pines north of `pines`; "Snowcap Peaks" north of `region`
  wild: { x0: -215, x1: 215, z0: -150, z1: 180 },  // where wild dig spots, bushes and rocks are scattered (js/gather.js)
  summit: { x0: -220, x1: 220, z0: -236, z1: -176, zMin: -234 }, // where the snowman looks for the highest summit (js/secrets.js)
  keepLeft: [[-1e9, -76, -1e9, 1e9]],              // [x0, x1, z0, z1]: traffic keeps left here, as in Australia (the west bank; js/traffic.js)
  rooms: [-226, -226, 420],                        // [x, z, height]: inside a house, the room is built high above the far north-west corner, where nothing else is (js/homes.js)
  ramp: 40                                         // the gentle walk down from the Dawn Plateau runs this far south of its edge
};

// Places: `at` is the anchor [x, z]. Circles have r; boxes have w, d (half the width and depth, like the cities), so
// the box runs from at − w to at + w. h is the one flat level of a village, town or city (HANDOFF rule 10).
// street.roadZ: where a street place's main street runs, from the anchor. gates: road ends, from the anchor.
// A place with `place` instead of `at` sits at an offset (`off`) from that place's anchor.
export const PLACES = [
  // the home island in the middle of the river (owner's decisions 1 and 2): Ông Cú's plateau, Phố Hai Quê across it in
  // line with the two island bridges, Sunny Farm in the south
  { id: 'island', kind: 'island', cc: 'home', at: [9, -14], rx: 52, rz: 88 },
  { id: 'plateau', kind: 'site', cc: 'home', at: [9, -76], r: 24, h: 8 },   // the Dawn Plateau, Ông Cú's home (lowered so the path down stays gentle)
  { id: 'town', kind: 'street', cc: 'home', at: [9, -22], w: 26, d: 21, h: 4.6, street: { roadZ: -6 } },   // Two Homes Street (Phố Hai Quê): Bà Rịa meets a Sydney suburb
  { id: 'home', kind: 'village', cc: 'home', at: [9, 40], r: 28, h: 4 },   // Sunny Farm: house, field, barn and Mr. Bear's market
  // the east bank: Vietnam, north to south (Hà Nội, Bắc Ninh north-east of it, Làng Sen, Đà Nẵng, Hội An, Chợ Ba Miền, TP. HCM)
  { id: 'hanoi', kind: 'city', cc: 'vn', at: [153, -135], w: 13, d: 13, h: 5, icon: '🐢', name: ['Hà Nội', 'Hà Nội'], gates: [[0, 13]] },
  { id: 'bacninh', kind: 'city', cc: 'vn', at: [200, -172], w: 16, d: 13, h: 6, icon: '🕰️', name: ['Bắc Ninh', 'Bắc Ninh'], gates: [[-16, 0]] },
  { id: 'paddies', kind: 'site', cc: 'vn', at: [204, -102], r: 18, h: 3 },   // the rice fields
  { id: 'village', kind: 'village', cc: 'vn', at: [204, -42], r: 34, h: 2.4 },   // Lotus Village (Làng Sen)
  { id: 'lake', kind: 'lake', at: [120, -74], r: 22 },   // Mirror Lake (Hồ Gương) by Làng Sen, with Hạ Long Bay and the reef inside
  { id: 'danang', kind: 'city', cc: 'vn', at: [153, 7], w: 13, d: 11, h: 3, icon: '🐉', name: ['Đà Nẵng', 'Đà Nẵng'], gates: [[0, -11], [0, 11], [-13, 0]] },
  { id: 'hoian', kind: 'site', cc: 'vn', at: [170, 90], r: 14 },   // Hội An (the old town comes in a later stage; for now its landmark)
  { id: 'market', kind: 'street', cc: 'vn', at: [197, 114], w: 25, d: 13, h: 6, street: { roadZ: 0 } },   // Chợ Ba Miền, the Three Regions market
  { id: 'saigon', kind: 'city', cc: 'vn', at: [153, 151], w: 13, d: 11, h: 4, icon: '🛵', name: ['Hồ Chí Minh City', 'TP. Hồ Chí Minh'], gates: [[0, -11]] },
  // the west bank: Australia, north to south (Brisbane, Aussie Corner, Sydney, Melbourne; Uluru in the outback beyond the Great Dividing Range)
  { id: 'brisbane', kind: 'city', cc: 'au', at: [-132, -137], w: 13, d: 11, h: 3, icon: '🐨', name: ['Brisbane', 'Brisbane'], gates: [[0, 11], [0, -11]] },
  { id: 'aussie', kind: 'street', cc: 'au', at: [-100, -71], w: 18, d: 28, h: 4, street: { roadZ: 0 } },   // Aussie Corner
  { id: 'sydney', kind: 'city', cc: 'au', at: [-132, -4], w: 13, d: 13, h: 4, icon: '⛴️', name: ['Sydney', 'Sydney'], gates: [[0, -13], [0, 13]] },
  { id: 'melbourne', kind: 'city', cc: 'au', at: [-132, 126], w: 13, d: 13, h: 4, icon: '🚋', name: ['Melbourne', 'Melbourne'], gates: [[0, -13]] },
  { id: 'uluru', kind: 'site', cc: 'au', at: [-196, 62] },   // Uluru, the big red rock in the outback
  { id: 'apostles', kind: 'site', cc: 'au', at: [-160, 182] },   // the Twelve Apostles on the southern coast (js/regionsites.js): kept free of trees
  { id: 'bamboo', kind: 'site', at: [-186, -112], r: 28 },   // Whispering Bamboo
  // the northern mountains: China Town and India Village, on the mountain road from Brisbane to Hà Nội
  { id: 'china', kind: 'village', cc: 'asia', at: [107, -200], r: 22, h: 5.5 },
  { id: 'india', kind: 'village', cc: 'asia', at: [-94, -200], r: 22, h: 5.5 },
  // festival grounds (js/vnfun.js), kept free of trees: the buffalo pushing ring near Hà Nội and Bắc Ninh, the bull-race field west of Sài Gòn
  { id: 'choitrau', kind: 'ground', cc: 'vn', at: [106, -120] },
  { id: 'duabo', kind: 'ground', cc: 'vn', at: [108, 160] },
  // places inside places
  { id: 'playground', kind: 'site', place: 'town', off: [-4, 9], r: 13, h: 4.6 },   // the park on Two Homes Street, where kids from Australia and Vietnam play
  // (round R story) bà Huệ and ông Nghi's yard (js/yard.js): its own levelled plot behind the north row of Two Homes
  // Street, east of the houses, facing the street (+z)
  { id: 'yard', kind: 'plot', place: 'town', off: [28, -30], w: 15.5, d: 12, rot: 0, h: 4.6 }
];

// Water: one sea-level plane, and channels carved below it. The main river runs from the northern mountains to the sea,
// splitting round the home island; Sông Hàn comes in from the east at Đà Nẵng (the other rivers come in stage T2).
export const WATERS = [
  { id: 'main_n', kind: 'river', pts: [[-7, -252], [-3, -200], [2, -160], [6, -126], [9, -104]] },
  { id: 'main_w', kind: 'river', pts: [[9, -104], [-25, -96], [-47, -70], [-54, -14], [-47, 42], [-25, 74], [9, 86]] },
  { id: 'main_e', kind: 'river', pts: [[9, -104], [43, -96], [65, -70], [72, -14], [65, 42], [43, 74], [9, 86]] },
  { id: 'main_s', kind: 'river', pts: [[9, 86], [12, 120], [14, 160], [12, 200], [10, 252]] },
  { id: 'han', kind: 'river', pts: [[252, 37], [200, 36], [153, 37], [116, 37]] },
  { id: 'lake', kind: 'lake', place: 'lake' }
];

// Bridges run along the x or the z axis, never diagonally: from a0 to a1 along it, centred on c across it; h is the deck.
export const BRIDGES = [
  { id: 'haique', axis: 'x', a0: 54, a1: 84, c: -28, w: 7.6, h: 4, over: 'main_e', style: 'harbour', landmark: 'harbour' },   // the Harbour-style bridge from Phố Hai Quê east to the ring road
  { id: 'island_w', axis: 'x', a0: -68, a1: -38, c: -28, w: 7.6, h: 4.2, over: 'main_w', style: 'plain' },   // the home island's west bridge
  { id: 'ring_n', axis: 'x', a0: -10, a1: 18, c: -130, w: 7.6, h: 5.4, over: 'main_n', style: 'plain' },   // the ring road over the river, north of the island
  { id: 'ring_s', axis: 'x', a0: -2, a1: 26, c: 104, w: 7.6, h: 5.4, over: 'main_s', style: 'plain' },   // and south of it
  { id: 'north', axis: 'x', a0: -12, a1: 16, c: -172, w: 7.6, h: 6, over: 'main_n', style: 'plain' },   // the mountain road over the river
  { id: 'rong', axis: 'z', a0: 24, a1: 52, c: 153, w: 7.6, h: 4.4, over: 'han', style: 'dragon', landmark: 'dragonbridge' }   // Đà Nẵng's golden Dragon Bridge carrying the Vietnam road south over Sông Hàn
];

// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other.
// Each road is a list of [x, z] points. `gates` names the place at the start and at the end of the road:
// a golden welcome gate stands exactly there, across the road (js/roads.js). Roads that end on another road
// (a junction) have no gate at that end. A road with `loop` closes on itself (the ring road round the home island).
// js/world.js rounds the corners (fillets) and joins side roads onto the road they end on.
export const ROADS = [
  // the ring road round the home island (Concept D), over the river north and south of it
  { id: 'ring', kind: 'asphalt', loop: true, pts: [[-30, -130], [48, -130], [96, -82], [96, 62], [48, 104], [-30, 104], [-78, 62], [-78, -82]] },
  // Phố Hai Quê runs across the island; a bridge at each end to the ring road
  { id: 'island_e', kind: 'asphalt', pts: [[21, -28], [96, -28]], gates: ['town', null] },
  { id: 'island_w', kind: 'asphalt', pts: [[-17, -28], [-78, -28]], gates: ['town', null] },
  // from the ring to each bank: Đà Nẵng in the east, Sydney in the west
  { id: 'link_vn', kind: 'asphalt', pts: [[96, 7], [140, 7]], gates: [null, 'danang'] },
  { id: 'link_au', kind: 'asphalt', pts: [[-78, 30], [-132, 30]], gates: [null, null] },   // a square T onto the Australia road just south of Sydney
  // the Vietnam road, north to south
  { id: 'vn_north', kind: 'asphalt', pts: [[153, -122], [153, -4]], gates: ['hanoi', 'danang'] },
  { id: 'vn_south', kind: 'asphalt', pts: [[153, 18], [153, 140]], gates: ['danang', 'saigon'] },   // over Cầu Rồng
  { id: 'village_link', kind: 'asphalt', pts: [[153, -42], [171, -42]], gates: [null, null] },   // Lotus Village has its own old gate (cổng làng)
  { id: 'market_link', kind: 'asphalt', pts: [[153, 114], [172, 114]], gates: [null, null] },     // the market has its own gate
  // the Australia road, north to south
  { id: 'au_north', kind: 'asphalt', pts: [[-132, -126], [-132, -17]], gates: ['brisbane', 'sydney'] },
  { id: 'au_south', kind: 'asphalt', pts: [[-132, 9], [-132, 113]], gates: ['sydney', 'melbourne'] },
  { id: 'aussie_road', kind: 'asphalt', pts: [[-132, -71], [-118, -71]], gates: [null, 'aussie'] },   // a square T off the Australia road (R5)
  // the mountain road over the north, from Brisbane to Hà Nội, with China Town and India Village
  { id: 'mountain', kind: 'asphalt', pts: [[-132, -148], [-132, -172], [-104, -172], [-60, -172], [60, -172], [120, -172], [184, -172]], gates: ['brisbane', 'bacninh'] },
  { id: 'china_road', kind: 'asphalt', pts: [[107, -172], [107, -178]], gates: [null, 'china'] },
  { id: 'india_road', kind: 'asphalt', pts: [[-94, -172], [-94, -178]], gates: [null, 'india'] },
  // on the island: Sunny Farm, and the path up to Ông Cú
  { id: 'farm_road', kind: 'asphalt', pts: [[40, -28], [40, -2], [29, 16]], gates: [null, 'home'] },
  // dirt roads
  { id: 'plateau_ramp', kind: 'dirt', pts: [[-6, -60], [-24, -44], [-24, -28]] },                  // down from the Dawn Plateau to the island road
  { id: 'village_lane', kind: 'dirt', pts: [[172, -42], [185, -42]] },                          // Lotus Village's lane, in through its old gate
  { id: 'paddies_lane', kind: 'dirt', pts: [[206, -76], [205, -86]] },                          // Lotus Village to the rice fields
  { id: 'uluru_track', kind: 'dirt', pts: [[-132, 64], [-150, 64], [-168, 56], [-184, 46]] },   // over the Great Dividing Range to Uluru
  // footpaths (R1, 1.6 m; Phase 2, round 30): Lotus Village's pond path (R11) carries on from the village lane round the
  // lotus pond's north and east sides, 8 m from its middle (1.5–2.5 m from the water), and ends at a bench; a short
  // path leaves it square (R5) to the little shrine at the foot of the banyan tree (js/lotus.js)
  ...(() => {
    const [vx, vz] = PLACES.find(p => p.id === 'village').at, cx = vx - 10, cz = vz + 4, arc = []; for (let a = 215; a <= 440; a += 15) arc.push([cx + 8 * Math.cos(a * Math.PI / 180), cz + 8 * Math.sin(a * Math.PI / 180)]);
    return [{ id: 'lv_pond', kind: 'footpath', pts: [[vx - 18, vz], ...arc] }, { id: 'lv_shrine', kind: 'footpath', pts: [[cx + 8, cz], [vx + 2.4, vz + 4]] }];
  })()
];

// (none in this layout: the saddle where the Sydney road crossed the old plateau's ramp)
export const SADDLES = [];
// the Great Dividing Range: a low ridge between the Australian towns and the outback, with a pass for the Uluru track
export const RELIEF = [{ id: 'gdr', pts: [[-166, -96], [-166, 120]], h: 14, w: 12, pass: { at: [-166, 60], h: 4.5, w: 14 } }];

// Spots kept free of trees ([x, z, r]): round Uluru.
export const CLEARINGS = [{ id: 'uluru', place: 'uluru', off: [0, -2], r: 34 }];

// ---------- places of interest ----------
export const SHRINES = [
  // (the first three stand on the Dawn Plateau: the quest "Solve the 3 shrines on the plateau")
  { id: 'sh_pattern', game: 'pattern', at: [-7, -84] },
  { id: 'sh_count', game: 'counting', at: [25, -86] },
  { id: 'sh_letters', game: 'letters', at: [22, -62] },
  { id: 'sh_memory', game: 'memory', at: [-102, 44] },
  { id: 'sh_hanoi', game: 'hanoi', at: [104, -146] },
  { id: 'sh_robot', game: 'robot', at: [64, 150] },
  { id: 'sh_goat', game: 'goat', at: [-196, 110] },
  { id: 'sh_sort', game: 'sorting', at: [200, 14] },
  { id: 'sh_shapes', game: 'shapes', at: [-60, 150] },
  { id: 'sh_colors', game: 'colors', at: [-104, -112] },
  { id: 'sh_maze', game: 'maze', at: [52, -150] },
  { id: 'sh_numbers', game: 'numbers', at: [-96, 84] }
];
export const TOWERS = [
  { id: 'tw_plateau', at: [10, -66] },
  { id: 'tw_bamboo', at: [-176, -100] },
  { id: 'tw_peaks', at: [40, -208] },
  { id: 'tw_lake', at: [118, -92] }
];
// hidden Leafies under rocks or as a sparkle (their ids are lf0, lf1… in this order: saved in profiles)
export const LEAFIES = [
  ['rock', -12, -90], ['sparkle', 30, -60], ['rock', 34, 48], ['sparkle', -100, -150], ['rock', -105, 20], ['sparkle', -186, 0], ['rock', -150, 96],
  ['sparkle', 120, -60], ['rock', 60, 130], ['sparkle', 186, 156], ['rock', 200, -14], ['sparkle', 214, -40], ['rock', 175, -125], ['sparkle', 130, -190],
  ['rock', -30, -195], ['sparkle', -60, -150], ['rock', 70, -195], ['sparkle', -200, -60], ['rock', -200, 30], ['sparkle', -30, 130], ['rock', 110, 60],
  ['sparkle', -90, 170], ['rock', 210, -200], ['sparkle', 186, 60]
].map(([kind, x, z], i) => ({ id: 'lf' + i, kind, at: [x, z], ...(i === 7 ? { inWater: true } : {}) })); // (lf7 sparkles over the middle of Hồ Gương on purpose)

// things to pick up (herbs, mushrooms, eggs, rice, fruit, a fish…: js/data.js GATHER, in this order): [item, place, dx, dz]
export const GATHER_AT = [
  ['herb', 'bamboo', 10, 22], ['herb', 'bamboo', -14, 6], ['herb', 'sydney', -30, 40], ['herb', 'melbourne', 30, -32], ['mushroom', 'bamboo', 2, -22], ['mushroom', 'brisbane', 30, -22], ['mushroom', 'plateau', -18, 12], ['mushroom', 'india', 30, 16],
  ['herb', 'plateau', 26, 4], ['mushroom', 'home', -30, -20], ['egg', 'village', -6, -18], ['egg', 'village', -12, -14], ['rice', 'paddies', -7, -2], ['rice', 'paddies', 6, 8], ['rice', 'paddies', -12, 10], ['banana', 'saigon', -30, -20],
  ['banana', 'saigon', -45, 10], ['banana', 'hoian', -25, 20], ['fish', 'lake', 0, -30], ['mango', 'market', 10, -24], ['mango', 'danang', 30, 18], ['leaf', 'bamboo', 20, -9], ['bean', 'paddies', 13, -8], ['herb', 'danang', -25, -35]
];

// Where each landmark stands: its place and the offset from that place's anchor (js/regions.js, js/cities.js,
// js/heritage.js). For the UNESCO sites it is only where to start looking for a clear spot (js/heritage.js).
export const LANDMARK_AT = {
  // postcards (js/regions.js)
  opera: { place: 'sydney', off: [34, 24] },     // by the water east of Sydney, like Bennelong Point
  harbour: { place: 'town', off: [57, -6] },     // the middle of the Harbour Bridge (the postcard is on the street's south footpath)
  uluru: { place: 'uluru', off: [0, -16] },      // the postcard, in front of the rock
  banana: { place: 'aussie', off: [9, -6] },
  bondi: { place: 'melbourne', off: [26, 50] },  // the lifesavers' tower on the southern beach
  lighthouse: { place: 'saigon', off: [52, 30] }, // on the coast (it moves to Bà Rịa–Vũng Tàu in stage T3)
  turtle: { place: 'market', off: [-18, 10.5] },
  onepillar: { place: 'market', off: [-10, -10] },
  chuacau: { place: 'market', off: [0, 10.5] },
  benthanh: { place: 'market', off: [24, -4] },
  // Two Homes Street (js/cities.js)
  bachdinh: { place: 'town', off: [-19, 19.5] },
  nhatron: { place: 'town', off: [4.5, 10.5] },
  // the UNESCO sites (js/heritage.js)
  halong: { place: 'lake', off: [-9, -5] },
  hue: { place: 'danang', off: [42, -14] },
  myson: { place: 'hoian', off: [28, -18] },
  phongnha: { place: 'paddies', off: [-10, -30] },
  trangan: { place: 'hanoi', off: [-36, -6] },
  reef: { place: 'lake', off: [8, 9] },
  sisters: { place: 'sydney', off: [-30, -40] },
  exhibition: { place: 'melbourne', off: [-30, 10] },
  kakadu: { place: 'uluru', off: [10, -54] },
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
  { id: 'lakeferry', water: 'lake', docks: [{ id: 'north', a: 270 }, { id: 'village', a: 345 }, { id: 'danang', a: 80 }, { id: 'island', a: 190 }] },
  { id: 'raft', water: ['main_n', 'main_e', 'main_s'], stops: 'places' },   // the raft line down the river past the island's east side, stopping by the towns (under the bridges)
  { id: 'crossing', water: 'main_n', count: 2 }            // two rafts crossing to the other bank, well away from the bridges
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

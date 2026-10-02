// The open world: terrain, water, sky with day and night, trees, the Lotus Village,
// shrines, towers, hidden Leafies and everything you can walk up to and use.
import { THREE, toon, toonVC, toonSmooth, glow, P, merge, sprite, blobShadow } from './gfx.js';
import { clamp, lerp, smooth, fbm, seeded, dist2 } from './util.js';
import { T } from './i18n.js';
import { houseVillage } from './houses.js';
import { settings } from './state.js';

export const SIZE = 400, HALF = SIZE / 2, WATER = 0;
export const PLATEAU = { x: 0, z: 0, r: 32, h: 18 };
export const VILLAGE = { x: 110, z: 30, r: 34, h: 3 };
export const PADDIES = { x: 112, z: -38, r: 26, h: 2.4 };
export const LAKE = { x: 55, z: 125, r: 46 };
export const BAMBOO = { x: -100, z: 85, r: 48 };
export const HOME = { x: -26, z: 126, r: 30, h: 4 };   // Sunny Farm: house, field, barn and Mr. Bear's market
export const PLAYGROUND = { x: 28, z: 62, r: 13, h: 7.2 };   // the park on Two Homes Street, where kids from Australia and Vietnam play
export const TOWN = { x0: 12, x1: 52, z0: 32, z1: 74, h: 7.2, roadZ: 47 };   // Two Homes Street: Bà Rịa meets a Sydney suburb
export const MARKET = { x0: 96, x1: 146, z0: 70, z1: 96, h: 4, roadZ: 83 };    // Chợ Ba Miền: the Three Regions market (north, central, south Vietnam)
export const AUSSIE = { x0: -144, x1: -90, z0: -40, z1: 16, h: 4.5, roadZ: -12 }; // Aussie Corner: milk bar, fish and chips, ice-cream van, playground
// Cities around the valley: each a paved square with a welcome gate, landmarks, a game host and food kiosks (js/cities.js)
export const CITIES = [   // gates: where the roads come in (the first is the main gate); the main street runs straight through
  { id: 'hanoi', cc: 'vn', x: 84, z: -40, w: 13, d: 11, h: 3, icon: '🐢', name: ['Hà Nội', 'Hà Nội'], gates: [[84, -29], [84, -51]] },
  { id: 'bacninh', cc: 'vn', x: 48, z: -124, w: 16, d: 13, h: 8.6, icon: '🕰️', name: ['Bắc Ninh', 'Bắc Ninh'], gates: [[48, -111]] },
  { id: 'danang', cc: 'vn', x: 4, z: -62, w: 13, d: 13, h: 5.2, icon: '🐉', name: ['Đà Nẵng', 'Đà Nẵng'], gates: [[17, -62], [-9, -62]] },
  { id: 'saigon', cc: 'vn', x: -8, z: 86, w: 13, d: 11, h: 7.4, icon: '🛵', name: ['Hồ Chí Minh City', 'TP. Hồ Chí Minh'], gates: [[-8, 75]] },
  { id: 'sydney', cc: 'au', x: -70, z: -32, w: 13, d: 11, h: 3, icon: '⛴️', name: ['Sydney', 'Sydney'], gates: [[-70, -21], [-70, -43]] },
  { id: 'melbourne', cc: 'au', x: -144, z: 66, w: 13, d: 13, h: 4.4, icon: '🚋', name: ['Melbourne', 'Melbourne'], gates: [[-131, 66]] },
  { id: 'brisbane', cc: 'au', x: -36, z: 52, w: 13, d: 13, h: 5, icon: '🐨', name: ['Brisbane', 'Brisbane'], gates: [[-23, 52], [-49, 52]] }
];
CITIES.forEach(c => Object.assign(c, { x0: c.x - c.w, x1: c.x + c.w, z0: c.z - c.d, z1: c.z + c.d }));
const FLATS = [TOWN, MARKET, AUSSIE, ...CITIES];
const RIVER = [[-35, -200], [-25, -130], [5, -85], [45, -55], [62, -10], [58, 40], [52, 85]];
export const CHINA = { x: 100, z: -88, r: 24, h: 9 };    // China Town: lanterns, tiled roofs, a pagoda and a little Great Wall
export const INDIA = { x: -112, z: -84, r: 24, h: 9 };  // India Village: colourful houses, a little Taj Mahal, rangoli and marigolds
export const BRIDGE = { x0: 44, x1: 74, z: 47, w: 6.4, h: 7.4 };   // the Harbour-style bridge carrying Two Homes Street over the river
export const DRAGON = { x0: 22, x1: 52, z: -62, w: 6.4, h: 5.4 };   // Đà Nẵng's golden Dragon Bridge carrying the road east over the river
const BRIDGES = [BRIDGE, DRAGON];
// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other.
// Each road is a list of [x, z] points. `gates` names the place at the start and at the end of the road:
// a golden welcome gate stands exactly there, across the road (js/roads.js). Roads that end on another road
// (a junction) have no gate at that end. Two Homes Street and the market keep their own streets.
export const ROADS = [
  // west from Two Homes Street: Brisbane, Hồ Chí Minh City and the farm
  { kind: 'asphalt', pts: [[6, 47], [-4, 48], [-14, 52], [-23, 52]], gates: ['town', 'brisbane'] },
  { kind: 'asphalt', pts: [[-4, 48], [-6, 60], [-8, 66], [-8, 75]], gates: [null, 'saigon'] },
  { kind: 'asphalt', pts: [[-6, 60], [-16, 66], [-24, 76], [-23, 88], [-22, 99]], gates: [null, 'home'] },
  // Brisbane to Melbourne, and north to Sydney and Aussie Corner
  { kind: 'asphalt', pts: [[-49, 52], [-60, 52], [-82, 53], [-100, 55], [-114, 62], [-122, 66], [-131, 66]], gates: ['brisbane', 'melbourne'] },
  { kind: 'asphalt', pts: [[-60, 52], [-57, 32], [-55, 18], [-60, 2], [-68, -8], [-70, -12], [-70, -21]], gates: [null, 'sydney'] },
  { kind: 'asphalt', pts: [[-68, -8], [-80, -11.5], [-90, -12]], gates: [null, 'aussie'] },
  // Sydney to Đà Nẵng, and to India Village
  { kind: 'asphalt', pts: [[-70, -43], [-70, -50], [-50, -52], [-30, -56], [-18, -62], [-9, -62]], gates: ['sydney', 'danang'] },
  { kind: 'asphalt', pts: [[-70, -50], [-96, -50], [-108, -51], [-112, -54], [-112, -58]], gates: [null, 'india'] },
  // over the Dragon Bridge to Hà Nội, China Town and Bắc Ninh
  { kind: 'asphalt', pts: [[17, -62], [56, -62], [70, -57], [84, -54]], gates: ['danang', null] },
  { kind: 'asphalt', pts: [[84, -54], [84, -51]], gates: [null, 'hanoi'] },
  { kind: 'asphalt', pts: [[84, -54], [96, -55], [100, -58], [100, -62]], gates: [null, 'china'] },
  { kind: 'asphalt', pts: [[56, -62], [54, -80], [48, -100], [48, -111]], gates: [null, 'bacninh'] },
  // south from Hà Nội past Lotus Village to the Harbour Bridge and the market (the village and the market have their own gates)
  { kind: 'asphalt', pts: [[84, -29], [84, -22], [78, -10], [73, 8], [75, 22], [73.5, 30], [73, 40], [74, 47]], gates: ['hanoi', null] },
  { kind: 'asphalt', pts: [[73.5, 30], [78, 30]], gates: [null, null] },   // Lotus Village has its own old gate (cổng làng)
  { kind: 'asphalt', pts: [[74, 47], [80, 60], [88, 74], [96, 83]], gates: [null, null] },
  // dirt roads
  { kind: 'dirt', pts: [[0, 33], [0, 40], [-2, 47.6]] },                       // down the Dawn Plateau to the main road
  { kind: 'dirt', pts: [[79, 30], [92, 30]] },                               // Lotus Village's lane, in through its old gate
  { kind: 'dirt', pts: [[110, -3], [111, -12]] },                              // Lotus Village to the rice fields
  { kind: 'dirt', pts: [[64, -114], [67, -98], [78, -91]] },                 // Bắc Ninh to China Town
  { kind: 'dirt', pts: [[-146, -12], [-150, 15], [-148, 40], [-144, 53]] },    // Aussie Corner to Melbourne
  { kind: 'dirt', pts: [[-112, -40], [-110, -50.5]] },                           // Aussie Corner to the India road
  { kind: 'dirt', pts: [[-8, 97], [0, 106], [4, 110]] },                       // Hồ Chí Minh City to Mirror Lake
  { kind: 'dirt', pts: [[-12, 128], [-4, 130], [6, 140]] },                    // the farm to Mirror Lake
  { kind: 'dirt', pts: [[-56, 128], [-80, 132], [-104, 134], [-116, 134]] },   // the farm to the western woods
  { kind: 'dirt', pts: [[118, 96], [112, 108], [100, 118]] }                   // the market to Mirror Lake
];
ROADS.forEach(R => { R.w = R.kind === 'asphalt' ? 5.2 : 3.4; });
// distance from (x, z) to the nearest road centre line, and that road
export function roadDist(x, z) {
  let best = 1e9, road = null;
  for (const R of ROADS) for (let i = 0; i < R.pts.length - 1; i++) {
    const [ax, az] = R.pts[i], [bx, bz] = R.pts[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t); if (d < best) { best = d; road = R; }
  }
  return { d: best, road };
}

function riverDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1];
    const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}
const flat = (h, x, z, c, r, fall, target) => lerp(h, target, 1 - smooth(r, r + fall, dist2(x, z, c.x, c.z)));

// Height of the ground at (x, z). Used for the mesh and for walking, so they always agree.
export function heightAt(x, z) {
  let h = 5 + fbm(x * .011, z * .011, 4) * 11 + fbm(x * .05 + 3, z * .05, 2) * 1.2;
  const mtn = smooth(-55, -165, z);
  h += mtn * (22 + fbm(x * .018 + 7, z * .018 - 3, 4) * 34);
  h += smooth(150, 195, Math.max(Math.abs(x), Math.abs(z))) * 45;
  // The Dawn Plateau, with a gentle ramp down to the south so little legs can walk off it.
  const dp = dist2(x, z, PLATEAU.x, PLATEAU.z);
  const base = h;
  h = lerp(h, PLATEAU.h + fbm(x * .08, z * .08, 2) * .6, 1 - smooth(PLATEAU.r, PLATEAU.r + 10, dp));
  if (dp > PLATEAU.r - 2 && z > 0) {
    const across = Math.abs(x - PLATEAU.x) / Math.max(1, dp);
    const w = smooth(.32, .16, across) * (1 - smooth(80, 98, dp));
    h = lerp(h, lerp(PLATEAU.h, Math.max(base, 4), smooth(PLATEAU.r, 92, dp)), w);
  }
  h = flat(h, x, z, VILLAGE, VILLAGE.r, 16, VILLAGE.h);
  h = flat(h, x, z, HOME, HOME.r, 16, HOME.h);
  h = flat(h, x, z, PLAYGROUND, PLAYGROUND.r, 12, PLAYGROUND.h);
  h = flat(h, x, z, CHINA, CHINA.r, 18, CHINA.h);
  h = flat(h, x, z, INDIA, INDIA.r, 18, INDIA.h);
  h = flat(h, x, z, PADDIES, PADDIES.r, 12, PADDIES.h + (Math.floor((z - PADDIES.z) / 9) * .35));
  h = flat(h, x, z, BAMBOO, BAMBOO.r - 10, 20, 5 + fbm(x * .03, z * .03, 2) * 2);
  const dl = dist2(x, z, LAKE.x, LAKE.z);
  h = lerp(h, -7, 1 - smooth(LAKE.r * .55, LAKE.r, dl));
  h = lerp(h, Math.min(h, 1.2), 1 - smooth(LAKE.r, LAKE.r + 14, dl));
  for (const F of FLATS) { const ox = Math.max(F.x0 - x, 0, x - F.x1), oz = Math.max(F.z0 - z, 0, z - F.z1); if (ox < 12 && oz < 12) h = lerp(h, F.h, 1 - smooth(0, 12, Math.hypot(ox, oz))); }
  const dr = riverDist(x, z);
  h = lerp(h, -2.6 - mtn * 2, 1 - smooth(3.5, 11, dr));
  // Raised banks either side of each bridge.
  for (const B of BRIDGES) if (Math.abs(z - B.z) < 8 && x > B.x0 - 10 && x < B.x1 + 16) {
    // level ground at deck height at both ends, easing back to the natural hills further away; the river in the middle is left alone
    const west = smooth(B.x0 + 8, B.x0 + 3, x), east = smooth(B.x1 - 8, B.x1 - 3, x) * (1 - smooth(B.x1 + 4, B.x1 + 16, x));
    const w = (1 - smooth(4, 8, Math.abs(z - B.z))) * (west + east);
    h = lerp(h, B.h - .2, clamp(w, 0, 1));
  }
  return h;
}

export function regionAt(x, z) {
  if (dist2(x, z, PLATEAU.x, PLATEAU.z) < PLATEAU.r + 8 && heightAt(x, z) > 12) return 'plateau';
  for (const c of CITIES) if (x > c.x0 - 4 && x < c.x1 + 4 && z > c.z0 - 4 && z < c.z1 + 4) return c.id;
  if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r + 10) return 'village';
  if (dist2(x, z, CHINA.x, CHINA.z) < CHINA.r + 8) return 'china';
  if (dist2(x, z, INDIA.x, INDIA.z) < INDIA.r + 8) return 'india';
  if (dist2(x, z, HOME.x, HOME.z) < HOME.r + 6) return 'home';
  if (dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 8) return 'paddies';
  if (x > TOWN.x0 - 3 && x < TOWN.x1 + 3 && z > TOWN.z0 - 3 && z < TOWN.z1 + 3) return 'town';
  if (x > MARKET.x0 - 3 && x < MARKET.x1 + 3 && z > MARKET.z0 - 3 && z < MARKET.z1 + 3) return 'market';
  if (x > AUSSIE.x0 - 3 && x < AUSSIE.x1 + 3 && z > AUSSIE.z0 - 3 && z < AUSSIE.z1 + 3) return 'aussie';
  if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r + 12) return 'lake';
  if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r + 6) return 'bamboo';
  if (z < -75) return 'mountain';
  return 'meadow';
}
export const REGION_NAMES = {
  plateau: () => T('Dawn Plateau', 'Cao Nguyên Bình Minh'),
  village: () => T('Lotus Village', 'Làng Sen'),
  town: () => T('Two Homes Street', 'Phố Hai Quê'),
  market: () => T('Three Regions Market', 'Chợ Ba Miền'),
  aussie: () => T('Aussie Corner', 'Góc Nước Úc'),
  china: () => T('China Town', 'Làng Trung Hoa'),
  india: () => T('India Village', 'Làng Ấn Độ'),
  home: () => T('Sunny Farm', 'Nông Trại Nắng Mai'),
  paddies: () => T('Golden Rice Fields', 'Cánh Đồng Lúa Vàng'),
  lake: () => T('Mirror Lake', 'Hồ Gương'),
  bamboo: () => T('Whispering Bamboo', 'Rừng Tre Thì Thầm'),
  mountain: () => T('Snowcap Peaks', 'Núi Tuyết Trắng'),
  meadow: () => T('Breezy Meadows', 'Đồng Cỏ Lộng Gió')
};
CITIES.forEach(c => { REGION_NAMES[c.id] = () => T(c.name[0], c.name[1]); });

// ---------- places of interest ----------
export const SHRINES = [
  { id: 'sh_pattern', game: 'pattern', x: -16, z: -12 },
  { id: 'sh_count', game: 'counting', x: 17, z: -15 },
  { id: 'sh_letters', game: 'letters', x: -6, z: 20 },
  { id: 'sh_memory', game: 'memory', x: -62, z: 18 },
  { id: 'sh_hanoi', game: 'hanoi', x: -30, z: -98 },
  { id: 'sh_robot', game: 'robot', x: 12, z: 92 },
  { id: 'sh_goat', game: 'goat', x: -112, z: 98 },
  { id: 'sh_sort', game: 'sorting', x: 150, z: -48 },
  { id: 'sh_shapes', game: 'shapes', x: 98, z: 165 },
  { id: 'sh_colors', game: 'colors', x: -70, z: -55 },
  { id: 'sh_maze', game: 'maze', x: 70, z: -110 },
  { id: 'sh_numbers', game: 'numbers', x: 160, z: 85 }
];
export const TOWERS = [
  { id: 'tw_plateau', x: 8, z: 4, name: () => T('Dawn Tower', 'Tháp Bình Minh') },
  { id: 'tw_bamboo', x: -88, z: 60, name: () => T('Bamboo Tower', 'Tháp Rừng Tre') },
  { id: 'tw_peaks', x: 20, z: -125, name: () => T('Peak Tower', 'Tháp Núi Tuyết') },
  { id: 'tw_lake', x: 120, z: 120, name: () => T('Lake Tower', 'Tháp Hồ Gương') }
];
export const TOWER_H = 26, REVEAL_R = 130;
const LEAFY_SPOTS = [
  ['rock', -24, 8], ['sparkle', 0, -28], ['rock', 26, 18], ['sparkle', -40, -30], ['rock', -78, 30], ['sparkle', -120, 120], ['rock', -92, 112],
  ['sparkle', 55, 125], ['rock', 30, 150], ['sparkle', 140, 140], ['rock', 150, 10], ['sparkle', 112, 30], ['rock', 120, -70], ['sparkle', 80, -80],
  ['rock', -10, -150], ['sparkle', -60, -140], ['rock', 50, -150], ['sparkle', -150, -32], ['rock', -150, 40], ['sparkle', 0, 60], ['rock', 70, 60],
  ['sparkle', -62, 152], ['rock', 170, -120], ['sparkle', 95, -15]
];
export const LEAFIES = LEAFY_SPOTS.map(([kind, x, z], i) => ({ id: 'lf' + i, kind, x, z }));

// ---------- the world object ----------
export function createWorld(scene, quality) {
  const W = {
    colliders: [], boxes: [], platforms: [], houses: [], plants: [], overcast: 0, interactables: [], updaters: [], lanterns: [], shrineMeshes: {}, towerMeshes: {}, leafyMeshes: {},
    time: .36
  };
  const rnd = seeded(20250921);

  // ---------- sky ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z=gl_Position.w; }',
    fragmentShader: 'uniform vec3 top,hor,bot,sunDir,sunCol; varying vec3 vP; void main(){ float y=vP.y; vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.6)):mix(hor,bot,clamp(-y*4.,0.,1.)); float s=max(dot(vP,normalize(sunDir)),0.); c+=sunCol*(pow(s,600.)*1.6+pow(s,12.)*.25); gl_FragColor=vec4(c,1.); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2, y = rnd() * .9 + .08, r = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * r * 800, y * 800, Math.sin(a) * r * 800); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; scene.add(stars);
  const moon = sprite('🌕', 40); scene.add(moon);

  scene.fog = new THREE.Fog(0xcfe8ff, 120, 420);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9c79a, .8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); scene.add(sun); scene.add(sun.target);
  if (quality !== 'low') {
    sun.castShadow = true; const S = sun.shadow; S.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    S.camera.left = S.camera.bottom = -28; S.camera.right = S.camera.top = 28; S.camera.near = 1; S.camera.far = 260; S.bias = -.0006; S.normalBias = .04;
  }
  scene.environmentIntensity = .35;

  const PAL = [
    // t, top, horizon, bottom, sun colour, sun intensity, hemi intensity
    [0, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [.22, '#24306a', '#e78f6a', '#3a3f6a', '#ffb07a', .35, .45],
    [.3, '#3f8fd8', '#ffe2bc', '#a9d0ee', '#fff0d6', .9, .75],
    [.5, '#2d84d4', '#a8d4f0', '#a8d4f2', '#fff6e6', 1.05, .85],
    [.7, '#3a86d2', '#ffd9a8', '#a0c0e0', '#ffe6c0', .95, .78],
    [.78, '#3a3a7a', '#f08a5a', '#4a3f6a', '#ff9a6a', .4, .5],
    [.86, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32],
    [1, '#0b1433', '#1d2b5a', '#10183a', '#7fa0ff', .15, .32]
  ].map(r => [r[0], new THREE.Color(r[1]), new THREE.Color(r[2]), new THREE.Color(r[3]), new THREE.Color(r[4]), r[5], r[6]]);
  const tmpA = new THREE.Color(), tmpB = new THREE.Color();
  W.isNight = () => W.time < .24 || W.time > .8;
  W.updateSky = (dt, camPos, focus = camPos) => {
    if (settings.alwaysDay) W.time = lerp(W.time, .42, Math.min(1, dt));
    else W.time = (W.time + dt / 600) % 1; // a full day lasts ten minutes
    const t = W.time; let i = 0; while (i < PAL.length - 2 && PAL[i + 1][0] <= t) i++;
    const a = PAL[i], b = PAL[i + 1], k = smooth(a[0], b[0], t);
    skyMat.uniforms.top.value.copy(a[1]).lerp(b[1], k);
    skyMat.uniforms.hor.value.copy(a[2]).lerp(b[2], k);
    skyMat.uniforms.bot.value.copy(a[3]).lerp(b[3], k);
    skyMat.uniforms.sunCol.value.copy(a[4]).lerp(b[4], k);
    scene.fog.color.copy(skyMat.uniforms.hor.value);
    const ang = (t - .25) * Math.PI * 2, sd = new THREE.Vector3(Math.cos(ang) * .8, Math.sin(ang), .35).normalize();
    skyMat.uniforms.sunDir.value.copy(sd);
    const day = sd.y > -.05;
    // the shadow box follows the player so nearby shadows stay crisp
    sun.position.copy(focus).addScaledVector(day ? sd : sd.clone().negate(), 120); sun.target.position.copy(focus);
    sun.color.copy(tmpA.copy(a[4]).lerp(b[4], k)); sun.intensity = lerp(a[5], b[5], k) * 1.55;
    hemi.intensity = lerp(a[6], b[6], k) * 1.25; scene.environmentIntensity = lerp(a[6], b[6], k) * .28;
    hemi.color.copy(tmpB.set('#ffffff').lerp(skyMat.uniforms.top.value, .18));
    // rainy weather (js/weather.js) greys the sky and softens the sun
    if (W.overcast > 0) {
      const o = W.overcast; skyMat.uniforms.top.value.lerp(tmpA.set('#8e9aa8'), o * .65); skyMat.uniforms.hor.value.lerp(tmpA.set('#b8c2cc'), o * .6);
      scene.fog.color.copy(skyMat.uniforms.hor.value); sun.intensity *= 1 - o * .55; hemi.intensity *= 1 - o * .2;
    }
    sky.position.copy(camPos); stars.position.copy(camPos);
    starMat.opacity = clamp(-sd.y * 4, 0, 1);
    moon.position.copy(camPos).addScaledVector(sd.clone().negate(), 700); moon.material.opacity = starMat.opacity;
    const night = clamp(-sd.y * 3 + .2, 0, 1);
    W.lanterns.forEach(m => { m.material.emissiveIntensity = .2 + night * 1.6; });
  };

  // ---------- terrain ----------
  const seg = quality === 'low' ? 150 : 200;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, seg, seg); tg.rotateX(-Math.PI / 2);
  const pa = tg.attributes.position, cols = new Float32Array(pa.count * 3), c = new THREE.Color();
  const C = { sand: new THREE.Color('#ecd6a4'), grassA: new THREE.Color('#7fbf8c'), grassB: new THREE.Color('#62a878'), dry: new THREE.Color('#e3cf9c'),
    rock: new THREE.Color('#d9cfba'), snow: new THREE.Color('#f6f8fb'), dirt: new THREE.Color('#e6d2a2'), paddy: new THREE.Color('#a7d67c'), bamboo: new THREE.Color('#6eae78'), deep: new THREE.Color('#cdb88e') };
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), h = heightAt(x, z); pa.setY(i, h);
    const sl = Math.abs(heightAt(x + 1.5, z) - h) + Math.abs(heightAt(x, z + 1.5) - h);
    const n = fbm(x * .03, z * .03, 2);
    c.copy(C.grassA).lerp(C.grassB, clamp(n + .5, 0, 1));
    if (n > .4) c.lerp(C.dry, clamp((n - .4) * 6, 0, 1)); // sandy patches between the grass, like a dry summer
    if (dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 4) c.copy(C.paddy).lerp(C.grassB, ((Math.floor(x / 5) + Math.floor(z / 9)) & 1) * .25);
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) c.lerp(C.bamboo, .5);
    const dv = dist2(x, z, VILLAGE.x, VILLAGE.z);
    if (dv < VILLAGE.r - 4 && (Math.abs(x - VILLAGE.x) < 3 || Math.abs(z - VILLAGE.z) < 3 || Math.abs(dv - 14) < 2.2)) c.copy(C.dirt);
    const dh = dist2(x, z, HOME.x, HOME.z);
    if (dh < HOME.r - 4 && (Math.abs(x - HOME.x) < 2 || Math.abs(z - HOME.z) < 2)) c.copy(C.dirt);
    if (sl > 2.2) c.lerp(C.rock, clamp((sl - 2.2) / 1.5, 0, 1));
    if (h > 34) c.lerp(C.snow, clamp((h - 34) / 6, 0, 1));
    if (h < 1.6) c.copy(C.sand);
    if (h < -1.5) c.copy(C.deep);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
  // fine detail (grass blades, pebbles, soil) painted into a tiling texture and blended over the ground colours
  const dc = document.createElement('canvas'); dc.width = dc.height = 256; const dx = dc.getContext('2d');
  dx.fillStyle = '#f4f4f4'; dx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { const v = 215 + Math.floor(Math.random() * 40); dx.fillStyle = `rgb(${v},${v},${v})`; const x = Math.random() * 256, y = Math.random() * 256; dx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 5); }
  for (let i = 0; i < 140; i++) { const v = 150 + Math.floor(Math.random() * 60); dx.fillStyle = `rgba(${v},${v},${v},.6)`; dx.beginPath(); dx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, Math.PI * 2); dx.fill(); }
  const dtex = new THREE.CanvasTexture(dc); dtex.wrapS = dtex.wrapT = THREE.RepeatWrapping; dtex.repeat.set(140, 140); dtex.anisotropy = 4;
  const terrain = new THREE.Mesh(tg, toonSmooth({ map: dtex })); terrain.receiveShadow = true; scene.add(terrain); W.terrain = terrain;

  // water with a soft moving shimmer
  const wc = document.createElement('canvas'); wc.width = wc.height = 128; const wx = wc.getContext('2d');
  wx.fillStyle = '#ffffff'; wx.fillRect(0, 0, 128, 128); wx.strokeStyle = 'rgba(160,220,255,.9)'; wx.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const x0 = Math.random() * 128, y0 = Math.random() * 128; wx.beginPath(); wx.arc(x0, y0, 6 + Math.random() * 10, .2, 1.4); wx.stroke(); }
  const wtex = new THREE.CanvasTexture(wc); wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping; wtex.repeat.set(60, 60); wtex.colorSpace = THREE.SRGBColorSpace;
  const waterMat = new THREE.MeshStandardMaterial({ color: '#2f8fc8', map: wtex, transparent: true, opacity: .8, roughness: .08, metalness: .25 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(SIZE + 400, SIZE + 400).rotateX(-Math.PI / 2), waterMat); water.position.y = WATER; scene.add(water);
  W.updaters.push((dt, t) => { wtex.offset.set(t * .01, t * .006); });

  // ---------- trees & plants (instanced) ----------
  const geos = {
    round: merge([P(new THREE.CylinderGeometry(.24, .38, 3.2, 6), '#7a5a3e', [0, 1.6, 0]), P(new THREE.CylinderGeometry(.1, .16, 1.8, 5), '#7a5a3e', [.6, 3, 0], [0, 0, -.6]), P(new THREE.CylinderGeometry(.1, .16, 1.6, 5), '#7a5a3e', [-.5, 2.9, .2], [.2, 0, .6]),
      P(new THREE.IcosahedronGeometry(2.2, 1), '#2f7f5f', [0, 4.5, 0]), P(new THREE.IcosahedronGeometry(1.7, 1), '#3a8d68', [1.5, 4.1, .6]), P(new THREE.IcosahedronGeometry(1.6, 1), '#276f55', [-1.4, 4.2, -.4]), P(new THREE.IcosahedronGeometry(1.4, 1), '#46a077', [.3, 5.9, .3])]),
    apple: merge([P(new THREE.CylinderGeometry(.3, .42, 2.6, 7), '#8a5a3b', [0, 1.3, 0]), P(new THREE.IcosahedronGeometry(2.2, 1), '#348a63', [0, 3.9, 0]),
      ...[[1.6, 4, .8], [-1.4, 3.6, 1], [.4, 4.4, -1.8], [-.6, 5.4, .9], [1.1, 3.1, -1.3]].map(p => P(new THREE.SphereGeometry(.32, 8, 6), '#e8433a', p))]),
    pine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#25664f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#2c7558', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#348462', [0, 6.2, 0])]),
    snowpine: merge([P(new THREE.CylinderGeometry(.25, .35, 2, 6), '#6e4a32', [0, 1, 0]), P(new THREE.ConeGeometry(2, 3.2, 8), '#2f6a4f', [0, 3.2, 0]), P(new THREE.ConeGeometry(1.5, 2.6, 8), '#e9f2ff', [0, 4.8, 0]), P(new THREE.ConeGeometry(.9, 2, 8), '#ffffff', [0, 6.2, 0])]),
    bamboo: merge([[0, 0], [.7, .3], [-.5, .6], [.2, -.7], [-.7, -.3]].flatMap(([x, z], i) => {
      const hgt = 7 + (i % 3) * 1.6;
      return [P(new THREE.CylinderGeometry(.13, .15, hgt, 6), '#8cc65a', [x, hgt / 2, z]), P(new THREE.ConeGeometry(.9, 2.2, 6), '#5fae4a', [x, hgt + .4, z]),
        P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .3, z], [Math.PI / 2, 0, 0]), P(new THREE.TorusGeometry(.15, .04, 4, 8), '#6a9a3a', [x, hgt * .6, z], [Math.PI / 2, 0, 0])];
    })),
    palm: merge([P(new THREE.CylinderGeometry(.2, .32, 5.5, 6), '#a07848', [.3, 2.7, 0], [0, 0, -.12]),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.ConeGeometry(.5, 3.2, 4), i % 2 ? '#4fae4a' : '#3d9a42', [.6 + Math.cos(i) * 1.3, 5.3, Math.sin(i) * 1.3], [Math.PI / 2 - .5, i * 1.05, 0], [1, 1, .25])),
      P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.6, 5.2, .3]), P(new THREE.SphereGeometry(.25, 6, 5), '#7a5a2a', [.4, 5.1, -.3])]),
    bush: merge([P(new THREE.IcosahedronGeometry(1.1, 1), '#24654f', [0, .7, 0], [0, 0, 0], [1.2, .85, 1]), P(new THREE.IcosahedronGeometry(.8, 1), '#30785c', [.9, .55, .3])]),
    rock: merge([P(new THREE.DodecahedronGeometry(1, 0), '#e6dcc6', [0, .45, 0], [0, .5, 0], [1.5, .85, 1.15])])
  };
  const spots = { round: [], apple: [], pine: [], snowpine: [], bamboo: [], palm: [], bush: [], rock: [] };
  const appleTrees = [];
  const nearPOI = (x, z) => FLATS.some(F => x > F.x0 - 4 && x < F.x1 + 4 && z > F.z0 - 4 && z < F.z1 + 4) || dist2(x, z, -128, 150) < 34 || dist2(x, z, 24, 170) < 14 || SHRINES.some(s => dist2(x, z, s.x, s.z) < 9) || TOWERS.some(s => dist2(x, z, s.x, s.z) < 10) || LEAFIES.some(s => dist2(x, z, s.x, s.z) < 3);
  for (let i = 0; i < 9000; i++) {
    const x = (rnd() - .5) * (SIZE - 30), z = (rnd() - .5) * (SIZE - 30), h = heightAt(x, z);
    if (h < 1.5 || nearPOI(x, z)) continue;
    const sl = Math.abs(heightAt(x + 2, z) - h) + Math.abs(heightAt(x, z + 2) - h);
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r + 4 || dist2(x, z, PADDIES.x, PADDIES.z) < PADDIES.r + 3 || dist2(x, z, HOME.x, HOME.z) < HOME.r + 4) continue;
    if (dist2(x, z, CHINA.x, CHINA.z) < CHINA.r + 6 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r + 6) continue;
    if (Math.abs(z - BRIDGE.z) < 8 && x > BRIDGE.x0 - 14 && x < BRIDGE.x1 + 10) continue;
    if (BRIDGES.some(B => Math.abs(z - B.z) < 8 && x > B.x0 - 14 && x < B.x1 + 10) || roadDist(x, z).d < 4.5) continue; // keep roads clear
    const inPlat = dist2(x, z, PLATEAU.x, PLATEAU.z) < PLATEAU.r;
    if (inPlat && dist2(x, z, PLATEAU.x, PLATEAU.z) < 12) continue;
    const r = rnd();
    let type = null;
    if (dist2(x, z, BAMBOO.x, BAMBOO.z) < BAMBOO.r) type = r < .75 ? 'bamboo' : r < .85 ? 'bush' : null;
    else if (h > 30) type = sl < 4 && r < .35 ? 'snowpine' : r < .45 ? 'rock' : null;
    else if (z < -60) type = sl < 3 && r < .4 ? 'pine' : r < .5 ? 'rock' : null;
    else if (dist2(x, z, LAKE.x, LAKE.z) < LAKE.r + 22 && h < 5) type = r < .3 ? 'palm' : r < .38 ? 'bush' : null;
    else if (sl < 2.5) type = r < (inPlat ? .1 : .14) ? 'round' : r < .2 ? 'bush' : r < .225 ? 'rock' : r < .235 ? 'apple' : null;
    if (!type) continue;
    const lim = { round: 380, apple: 26, pine: 260, snowpine: 120, bamboo: 230, palm: 60, bush: 260, rock: 200 };
    if (spots[type].length >= (quality === 'low' ? lim[type] * .6 : lim[type])) continue;
    const s = type === 'rock' ? .5 + rnd() * 1.4 : .8 + rnd() * .5;
    spots[type].push([x, h - .1, z, rnd() * 6.28, s]);
    if (type === 'apple') appleTrees.push({ x, z });
    if (type !== 'bush') W.colliders.push({ x, z, r: type === 'rock' ? 1.1 * s : type === 'bamboo' ? 1 : .6 });
  }
  // A few apple trees right on the plateau so the cooking quest is easy to start.
  [[-20, 4], [22, 6], [-8, -22]].forEach(([x, z]) => { spots.apple.push([x, heightAt(x, z) - .1, z, 0, 1]); appleTrees.push({ x, z }); W.colliders.push({ x, z, r: .6 }); });
  const o3 = new THREE.Object3D(), tint = new THREE.Color();
  for (const k in spots) {
    const list = spots[k]; if (!list.length) continue;
    const im = new THREE.InstancedMesh(geos[k], toonVC(), list.length); im.castShadow = k !== 'rock'; im.receiveShadow = true;
    list.forEach((s, i) => { o3.position.set(s[0], s[1], s[2]); o3.rotation.set(0, s[3], 0); o3.scale.setScalar(s[4]); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); tint.setHSL(0, 0, .88 + rnd() * .12); im.setColorAt(i, tint); });
    scene.add(im); im.userData.kind = k; im.userData.list = list; W.plants.push(im); // tappable (js/fun.js)
  }
  appleTrees.forEach((t, i) => {
    let ready = 0;
    W.interactables.push({ id: 'apple' + i, x: t.x, z: t.z, r: 3.2, icon: '🍎', label: () => T('Shake tree', 'Rung cây'),
      act: (pl, game) => { const now = performance.now(); if (now < ready) { game.toast(pl, T('No apples yet. Come back later!', 'Chưa có táo. Lát nữa quay lại nhé!')); return; }
        ready = now + 90000; if (game.shakeTree) game.shakeTree(pl, t); else { game.give(pl, 'apple', 2); game.fx(t.x, heightAt(t.x, t.z) + 4, t.z, '🍎'); } } });
  });

  // grass tufts and flowers
  const nGrass = quality === 'low' ? 2500 : quality === 'high' ? 9000 : 6000;
  const blade = merge([0, 1, 2].map(i => P(new THREE.ConeGeometry(.12, .9, 3), '#ffffff', [Math.cos(i * 2.1) * .18, .4, Math.sin(i * 2.1) * .18], [Math.cos(i * 2.1) * .25, 0, Math.sin(i * 2.1) * .25])));
  const flower = merge([P(new THREE.CylinderGeometry(.03, .03, .6, 4), '#4f9e45', [0, .3, 0]), ...[0, 1, 2, 3, 4].map(i => P(new THREE.SphereGeometry(.13, 6, 4), '#ffffff', [Math.cos(i * 1.256) * .16, .62, Math.sin(i * 1.256) * .16])), P(new THREE.SphereGeometry(.09, 6, 4), '#ffd23f', [0, .66, 0])]);
  const gIm = new THREE.InstancedMesh(blade, toonVC(), nGrass), fIm = new THREE.InstancedMesh(flower, toonVC(), Math.floor(nGrass / 6));
  let gi = 0, fi = 0; const FC = ['#ff7eb8', '#ffffff', '#ffd23f', '#9a6bff', '#ff8a5a', '#7fd8ff'];
  for (let tries = 0; tries < nGrass * 6 && (gi < nGrass || fi < fIm.count); tries++) {
    const near = rnd() < .5; const x = near ? (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), z = near ? (rnd() - .5) * 180 : (rnd() - .5) * (SIZE - 40), h = heightAt(x, z);
    if (h < 1.8 || h > 30) continue;
    if (dist2(x, z, VILLAGE.x, VILLAGE.z) < VILLAGE.r - 6 || dist2(x, z, HOME.x, HOME.z) < HOME.r - 8 || dist2(x, z, CHINA.x, CHINA.z) < CHINA.r - 2 || dist2(x, z, INDIA.x, INDIA.z) < INDIA.r - 2) continue;
    o3.position.set(x, h - .05, z); o3.rotation.set(0, rnd() * 6, 0); o3.scale.setScalar(.45 + rnd() * .45); o3.updateMatrix();
    if (rnd() < .16 && fi < fIm.count) { fIm.setMatrixAt(fi, o3.matrix); fIm.setColorAt(fi++, tint.set(FC[Math.floor(rnd() * FC.length)])); }
    else if (gi < nGrass) { gIm.setMatrixAt(gi, o3.matrix); gIm.setColorAt(gi++, tint.setHSL(.26 + rnd() * .06, .55, .3 + rnd() * .1)); }
  }
  gIm.count = gi; fIm.count = fi; scene.add(gIm, fIm);

  // clouds: big soft painted cumulus with warm afternoon light on their edges
  const cloudTex = k => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = seeded(77 + k);
    const blobs = Array.from({ length: 9 }, (_, i) => ({ x: 90 + i * 40 + r() * 30, y: 170 - Math.sin(i / 8 * Math.PI) * (60 + r() * 50), rad: 40 + r() * 45 }));
    const pass = (col, dy, grow) => { g.fillStyle = col; blobs.forEach(b => { g.beginPath(); g.arc(b.x, b.y + dy, b.rad * grow, 0, Math.PI * 2); g.fill(); }); g.fillRect(70, 170 + dy, 380, 40); };
    pass('#f0cfa0', 8, 1); pass('#fbe6c4', 0, .95); pass('#fff6e6', -10, .78);
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 205, 512, 60);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const cloudTexs = [0, 1, 2].map(cloudTex);
  const clouds = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexs[i % 3], transparent: true, depthWrite: false, fog: false }));
    const a = rnd() * Math.PI * 2, d = 330 + rnd() * 200, sc = 110 + rnd() * 90;
    m.position.set(Math.cos(a) * d, 45 + rnd() * 55, Math.sin(a) * d); m.scale.set(sc, sc / 2, 1); m.renderOrder = -1; scene.add(m); clouds.push(m);
  }
  W.updaters.push(dt => clouds.forEach(m => { m.position.x += dt * 1.2; if (m.position.x > 560) m.position.x = -560; }));

  // ---------- village ----------
  const V = VILLAGE;
  // village houses (nhà ba gian): wooden columns, tiled roofs with upturned corners, brick yards
  function house(x, z, rot, w = 7, d = 6, wall = '#efe0bf', roof = '#b9533c', palms = false) {
    const g = houseVillage({ w, d: d * .9, wall, tile: roof, palms }).obj;
    g.position.set(x, heightAt(x, z) - .05, z); g.rotation.y = rot; scene.add(g);
    W.colliders.push({ x, z, r: Math.max(w, d) * .62 });
    W.houses.push({ x, z, rot, d: Math.max(w, d) * 1.24, kind: 'village' });
    return g;
  }
  [[-18, -14, .5], [-4, -22, 0], [14, -20, -.3], [22, -4, -1.3], [20, 14, -2.2], [-20, 10, 1.6], [-14, 22, 2.4], [6, 24, 3.1]]
    .forEach(([dx, dz, r], i) => house(V.x + dx, V.z + dz, r + Math.PI, 6 + (i % 3), 5 + (i % 2), i % 3 === 1 ? '#f6dca0' : '#efe0bf', i % 2 ? '#b9533c' : '#a0442f', i % 3 === 0));
  // village gate (cổng làng) on the west side, facing the bridge
  {
    const gx = V.x - V.r + 2, gz = V.z, y = heightAt(gx, gz);
    const gate = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, -4]), P(new THREE.BoxGeometry(1.2, 6, 1.2), '#e8dcc0', [0, 3, 4]),
      P(new THREE.BoxGeometry(1.8, .7, 10.5), '#b9533c', [0, 6.4, 0]), P(new THREE.BoxGeometry(2.4, .3, 11.5), '#8e3a2a', [0, 6.9, 0]),
      P(new THREE.BoxGeometry(.3, 1.2, 4), '#c9302c', [.75, 5.3, 0]), P(new THREE.BoxGeometry(.32, .9, 3.4), '#ffd23f', [.8, 5.3, 0])
    ]), toonVC()); gate.position.set(gx, y, gz); gate.userData.noCam = true; scene.add(gate);
    W.colliders.push({ x: gx, z: gz - 4, r: .9 }, { x: gx, z: gz + 4, r: .9 });
  }
  // the big banyan tree (cây đa) in the middle of the village
  {
    const y = heightAt(V.x, V.z);
    const banyan = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(1.1, 1.8, 6, 9), '#7a5236', [0, 3, 0]),
      ...[[0, 8, 0, 4.5], [3.5, 7, 1.5, 3.2], [-3.5, 7.2, -1, 3.4], [1, 7.5, -3.5, 3], [-1.5, 7, 3.4, 3]].map(([x, yy, z, r]) => P(new THREE.IcosahedronGeometry(r, 1), '#3f8f3f', [x, yy, z])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.CylinderGeometry(.08, .08, 4, 4), '#8a6a4a', [Math.cos(i) * 3, 3.5, Math.sin(i) * 3]))
    ]), toonVC()); banyan.position.set(V.x + 6, y, V.z + 6); scene.add(banyan);
    W.colliders.push({ x: V.x + 6, z: V.z + 6, r: 2 });
  }
  // lotus pond
  {
    const px = V.x - 10, pz = V.z + 4, y = heightAt(px, pz) + .08;
    const pond = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: '#3aa0c8', shininess: 80 }));
    pond.position.set(px, y, pz); scene.add(pond);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(5.3, .35, 6, 28).rotateX(Math.PI / 2), toon('#b7ad98')); rim.position.set(px, y + .05, pz); scene.add(rim);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, r = 1 + (i % 4) * 1.1;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(.7, 12, .3, 5.8).rotateX(-Math.PI / 2), toon('#3f9a45')); pad.position.set(px + Math.cos(a) * r, y + .05, pz + Math.sin(a) * r); scene.add(pad);
      if (i % 2 === 0) { const fl = new THREE.Mesh(merge([0, 1, 2, 3, 4, 5].map(k => P(new THREE.ConeGeometry(.18, .6, 4), k % 2 ? '#ffc0d8' : '#ff8ab8', [Math.cos(k) * .14, .25, Math.sin(k) * .14], [Math.cos(k) * .45, 0, Math.sin(k) * .45]))), toonVC()); fl.position.copy(pad.position); scene.add(fl); }
    }
    W.colliders.push({ x: px, z: pz, r: 5.4 });
  }
  // market stalls (chợ) with striped umbrellas
  const stall = (x, z, rot, col) => {
    const y = heightAt(x, z);
    const m = new THREE.Mesh(merge([
      P(new THREE.BoxGeometry(3.4, 1, 1.6), '#a9764a', [0, .5, 0]),
      ...[-1.5, 1.5].flatMap(px => [P(new THREE.CylinderGeometry(.08, .08, 3, 5), '#7a5236', [px, 1.5, -.7])]),
      P(new THREE.ConeGeometry(2.6, 1.1, 8), col, [0, 3.2, 0]),
      ...[[-1, '#e8433a'], [-.4, '#ffd23f'], [.3, '#ff9a2e'], [.9, '#4cbf5c']].map(([px, cc]) => P(new THREE.SphereGeometry(.24, 8, 6), cc, [px, 1.15, .1]))
    ]), toonVC()); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m);
    W.colliders.push({ x, z, r: 1.9 });
  };
  stall(V.x + 2, V.z - 10, 0, '#e8434a'); stall(V.x - 4, V.z - 11, .2, '#3d7fd6'); stall(V.x + 8, V.z - 9, -.3, '#ffb52e');
  // strings of red lanterns (đèn lồng)
  const lanternGeo = new THREE.SphereGeometry(.35, 10, 8); lanternGeo.scale(1, 1.2, 1);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, x = V.x + Math.cos(a) * 14, z = V.z + Math.sin(a) * 14, y = heightAt(x, z);
    if (i % 2 === 0) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.6, 5), toon('#7a5236')); pole.position.set(x, y + 1.8, z); scene.add(pole); W.colliders.push({ x, z, r: .3 }); }
    const l = new THREE.Mesh(lanternGeo, new THREE.MeshStandardMaterial({ roughness: .5, color: i % 3 === 2 ? '#ffcf3a' : '#e8332a', emissive: i % 3 === 2 ? '#ffb000' : '#ff3a1a', emissiveIntensity: .3 }));
    l.position.set(x, y + 3.4, z); scene.add(l); W.lanterns.push(l);
  }
  // Ô ăn quan board drawn on the ground, hopscotch squares, tug-of-war rope
  {
    const bx = V.x + 16, bz = V.z + 22;
    const board = new THREE.Mesh(merge([
      ...[0, 1, 2, 3, 4].flatMap(i => [P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, -.6]), P(new THREE.BoxGeometry(1.1, .06, 1.1), '#e9d6a8', [-2.4 + i * 1.2, 0, .6])]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [-3.1, 0, 0], [0, Math.PI, 0]),
      P(new THREE.CylinderGeometry(1.2, 1.2, .06, 16, 1, false, 0, Math.PI), '#e9d6a8', [3.1, 0, 0])
    ]), toonVC()); board.position.set(bx, heightAt(bx, bz) + .04, bz); scene.add(board);
    const hx = V.x - 18, hz = V.z - 2;
    const hop = new THREE.Mesh(merge([[0, 0], [0, 1.3], [-.65, 2.6], [.65, 2.6], [0, 3.9], [-.65, 5.2], [.65, 5.2], [0, 6.5]].map(([x, z], i) => P(new THREE.BoxGeometry(1.2, .05, 1.2), i % 2 ? '#ffffff' : '#ffe08a', [x, 0, z]))), toonVC());
    hop.position.set(hx, heightAt(hx, hz) + .04, hz); hop.rotation.y = Math.PI / 2; scene.add(hop);
    const rx = V.x + 2, rz = V.z + 18;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 9, 6).rotateZ(Math.PI / 2), toon('#d9b26a')); rope.position.set(rx, heightAt(rx, rz) + .9, rz); scene.add(rope);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(.1, .5, .3), toon('#e8332a')); flag.position.set(rx, heightAt(rx, rz) + .6, rz); scene.add(flag);
  }
  // cooking pots: one on the plateau, one in the village
  W.pots = [{ x: -4, z: 8 }, { x: V.x - 2, z: V.z + 12 }].map(p => {
    const y = heightAt(p.x, p.z);
    const pot = new THREE.Mesh(merge([
      P(new THREE.SphereGeometry(.9, 12, 8, 0, Math.PI * 2, Math.PI * .35, Math.PI * .65), '#3a3a42', [0, 1.1, 0]),
      ...[0, 1, 2].map(i => P(new THREE.CylinderGeometry(.07, .07, 1.6, 4), '#5a4030', [Math.cos(i * 2.1) * .8, .6, Math.sin(i * 2.1) * .8], [Math.sin(i * 2.1) * .3, 0, -Math.cos(i * 2.1) * .3])),
      ...[0, 1, 2, 3, 4, 5].map(i => P(new THREE.BoxGeometry(.9, .2, .2), '#7a5236', [Math.cos(i) * .4, .1, Math.sin(i) * .4], [0, i, 0]))
    ]), toonVC()); pot.position.set(p.x, y, p.z); scene.add(pot);
    const fire = sprite('🔥', 1.1); fire.position.set(p.x, y + .5, p.z); scene.add(fire);
    W.updaters.push((dt, t) => { fire.scale.setScalar(1 + Math.sin(t * 9) * .1); });
    W.colliders.push({ x: p.x, z: p.z, r: 1.1 });
    return p;
  });
  // the Lotus Statue (trades Sparkle Orbs for extra hearts or stamina)
  W.statue = { x: V.x + 18, z: V.z - 2 };
  {
    const s = W.statue, y = heightAt(s.x, s.z);
    const st = new THREE.Mesh(merge([
      P(new THREE.CylinderGeometry(2, 2.4, 1, 8), '#c9c2b2', [0, .5, 0]),
      P(new THREE.CylinderGeometry(.7, 1.1, 3, 10), '#e6e0d0', [0, 2.5, 0]), P(new THREE.SphereGeometry(.7, 12, 10), '#e6e0d0', [0, 4.5, 0]),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => P(new THREE.ConeGeometry(.5, 1.6, 4), '#ffb3cf', [Math.cos(i * .785) * 1.2, 1.4, Math.sin(i * .785) * 1.2], [Math.cos(i * .785) * .7, 0, -Math.sin(i * .785) * .7]))
    ]), toonVC()); st.position.set(s.x, y, s.z); st.rotation.y = -Math.PI / 2; scene.add(st);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 6, 24), glow('#ffe58a')); halo.position.set(s.x, y + 4.6, s.z); halo.rotation.y = Math.PI / 2; scene.add(halo);
    W.updaters.push((dt, t) => { halo.rotation.x = Math.sin(t) * .2; });
    W.colliders.push({ x: s.x, z: s.z, r: 2.2 });
  }

  // ---------- bridge ----------
  {
    // A small "Sydney Harbour Bridge": a grey steel arch, hangers, stone pylons at each end and a road deck.
    const B = BRIDGE, len = B.x1 - B.x0, y = B.h, hw = B.w / 2, steel = '#8d979c';
    const parts = [
      P(new THREE.BoxGeometry(len + 2, .5, B.w), '#7d858a', [0, -.25, 0]), P(new THREE.BoxGeometry(len + 2, .06, B.w - 2.2), '#b4b9bc', [0, .03, 0]),
      P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, hw - .5]), P(new THREE.BoxGeometry(len + 2, .1, 1), '#d9d4c8', [0, .07, -hw + .5]),
      ...Array.from({ length: 7 }, (_, i) => P(new THREE.BoxGeometry(1.6, .08, .14), '#f6f1e4', [-len / 2 + 3 + i * (len - 6) / 6, .09, 0])),
      P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, hw]), P(new THREE.BoxGeometry(len + 2, .9, .12), steel, [0, .45, -hw]),
      ...[-.32, .32].map(f => P(new THREE.CylinderGeometry(.5, .7, 12, 6), '#9a948a', [f * len, -6, 0]))
    ];
    for (const sz of [-1, 1]) {
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .35, 5, 28, Math.PI), steel, [0, -1.2, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      parts.push(P(new THREE.TorusGeometry(len / 2 - 1, .22, 5, 28, Math.PI), steel, [0, -2.4, sz * (hw - .2)], [0, 0, 0], [1, .62, 1]));
      for (let i = 1; i < 12; i++) { const t = i / 12, x = -len / 2 + 1 + t * (len - 2), a = Math.acos(Math.max(-1, Math.min(1, x / (len / 2 - 1)))), top = Math.sin(a) * (len / 2 - 1) * .62 - 1.2; if (top > 1) parts.push(P(new THREE.BoxGeometry(.12, top, .12), steel, [x, top / 2, sz * (hw - .2)])); }
      for (const ex of [-1, 1]) parts.push(P(new THREE.BoxGeometry(2.2, 7, 2.2), '#d8cdb6', [ex * (len / 2 + .6), 2.2, sz * (hw + .6)]), P(new THREE.BoxGeometry(2.6, .5, 2.6), '#c8bca2', [ex * (len / 2 + .6), 5.9, sz * (hw + .6)]));
    }
    const br = new THREE.Mesh(merge(parts), toonVC()); br.castShadow = true; br.receiveShadow = true; br.position.set((B.x0 + B.x1) / 2, y, B.z); scene.add(br);
    // railings keep little explorers on the bridge
    W.boxes.push({ x0: B.x0, x1: B.x1, z0: B.z + hw - .1, z1: B.z + hw + .3 }, { x0: B.x0, x1: B.x1, z0: B.z - hw - .3, z1: B.z - hw + .1 });
    W.platforms.push({ x0: B.x0 - 2, x1: B.x1 + 2, z0: B.z - B.w / 2, z1: B.z + B.w / 2, y: y + .1 });
  }

  // ---------- shrines ----------
  const shrineBase = merge([
    P(new THREE.CylinderGeometry(3.4, 3.8, .6, 8), '#8f8a80', [0, .3, 0]), P(new THREE.CylinderGeometry(2.6, 3, .4, 8), '#a8a296', [0, .8, 0]),
    ...[0, 1, 2, 3].map(i => P(new THREE.BoxGeometry(.6, 3.2, .6), '#6e6a64', [Math.cos(i * 1.571 + .785) * 2.4, 2.2, Math.sin(i * 1.571 + .785) * 2.4])),
    P(new THREE.ConeGeometry(2.9, 1.6, 4), '#5e5a54', [0, 4.4, 0], [0, .785, 0])
  ]);
  SHRINES.forEach(s => {
    const y = heightAt(s.x, s.z);
    const g = new THREE.Group(); g.position.set(s.x, y - .1, s.z);
    const sb = new THREE.Mesh(shrineBase, toonVC({ roughness: .8 })); sb.castShadow = sb.receiveShadow = true; g.add(sb);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 0), glow('#ff9a3a')); core.position.y = 2.3; g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, .06, 6, 30), glow('#ffb35a', .8)); ring.position.y = 2.3; ring.rotation.x = Math.PI / 2; g.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 60, 8, 1, true), glow('#ff9a3a', .18)); beam.position.y = 32; g.add(beam);
    scene.add(g); W.shrineMeshes[s.id] = { core, ring, beam };
    W.colliders.push(...[0, 1, 2, 3].map(i => ({ x: s.x + Math.cos(i * 1.571 + .785) * 2.4, z: s.z + Math.sin(i * 1.571 + .785) * 2.4, r: .5 })));
    W.updaters.push((dt, t) => { core.rotation.y += dt * 1.2; core.position.y = 2.3 + Math.sin(t * 2) * .15; ring.rotation.z += dt * .6; });
  });
  W.setShrineDone = (id, done) => {
    const m = W.shrineMeshes[id]; if (!m) return;
    const col = done ? '#5fe0ff' : '#ff9a3a';
    m.core.material.color.set(col); m.ring.material.color.set(done ? '#9ff0ff' : '#ffb35a'); m.beam.material.color.set(col); m.beam.visible = true;
  };

  // ---------- towers ----------
  TOWERS.forEach(tw => {
    const y = heightAt(tw.x, tw.z), H = TOWER_H;
    const legs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    const parts = [];
    legs.forEach(([a, b]) => parts.push(P(new THREE.BoxGeometry(.7, H, .7), '#5a5650', [a * 2.4, H / 2, b * 2.4])));
    for (let k = 1; k < 6; k++) parts.push(P(new THREE.BoxGeometry(5.6, .35, 5.6), '#6e6a64', [0, k * H / 6, 0]));
    parts.push(P(new THREE.CylinderGeometry(4.2, 3.6, .6, 10), '#7a766e', [0, H + .3, 0]));
    const body = new THREE.Mesh(merge(parts), toonVC({ roughness: .7, metalness: .15 })); body.castShadow = true;
    const panels = new THREE.Mesh(new THREE.BoxGeometry(4.2, H - 2, 4.2), glow('#ff9a3a', .22)); panels.position.y = H / 2;
    const top = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glow('#ff9a3a')); top.position.y = H + 2.2;
    const g = new THREE.Group(); g.add(body, panels, top); g.position.set(tw.x, y - .2, tw.z); scene.add(g);
    W.towerMeshes[tw.id] = { panels, top, y: y - .2 };
    W.colliders.push({ x: tw.x, z: tw.z, r: 3.4 });
    W.platforms.push({ x0: tw.x - 4, x1: tw.x + 4, z0: tw.z - 4, z1: tw.z + 4, y: y - .2 + H + .6, tower: tw.id });
    W.updaters.push((dt, t) => { top.rotation.y += dt; top.position.y = H + 2.2 + Math.sin(t * 1.5) * .2; });
  });
  W.setTowerDone = (id, done) => { const m = W.towerMeshes[id]; if (!m) return; const c = done ? '#5fe0ff' : '#ff9a3a'; m.panels.material.color.set(c); m.top.material.color.set(c); };

  // ---------- Leafies (hidden little forest spirits) ----------
  const leafyRock = merge([P(new THREE.DodecahedronGeometry(.9, 0), '#b0aaa0', [0, .45, 0], [0, 0, 0], [1, .75, 1]), P(new THREE.ConeGeometry(.12, .5, 4), '#5fbf4a', [0, 1.25, 0], [0, 0, .3])]);
  LEAFIES.forEach(lf => {
    const y = heightAt(lf.x, lf.z);
    let obj;
    if (lf.kind === 'rock') { obj = new THREE.Mesh(leafyRock, toonVC()); obj.position.set(lf.x, y - .05, lf.z); }
    else { obj = sprite('✨', 1.3); obj.position.set(lf.x, y + 1.2, lf.z); W.updaters.push((dt, t) => { obj.material.rotation = t; obj.scale.setScalar(1.1 + Math.sin(t * 4 + lf.x) * .25); }); }
    scene.add(obj); W.leafyMeshes[lf.id] = obj;
  });
  W.hideLeafy = id => { const o = W.leafyMeshes[id]; if (o) o.visible = false; };

  // ---------- simple animals ----------
  const buffaloGeo = merge([
    P(new THREE.BoxGeometry(1.6, 1.3, 2.8), '#55555e', [0, 1.4, 0]), P(new THREE.BoxGeometry(1, 1, 1.1), '#4a4a52', [0, 1.7, 1.8]),
    P(new THREE.TorusGeometry(.7, .12, 5, 12, Math.PI), '#d8d0c0', [0, 2.2, 1.9]),
    ...[[.55, .9], [-.55, .9], [.55, -.9], [-.55, -.9]].map(([x, z]) => P(new THREE.CylinderGeometry(.18, .16, 1, 6), '#44444c', [x, .5, z])),
    P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [.3, 1.9, 2.36]), P(new THREE.SphereGeometry(.12, 6, 5), '#ffffff', [-.3, 1.9, 2.36])
  ]);
  W.buffalo = [];
  [[PADDIES.x - 6, PADDIES.z + 4], [V.x - 26, V.z + 18]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(buffaloGeo, toonVC()); m.position.set(x, heightAt(x, z), z); scene.add(m);
    const sh = blobShadow(); sh.scale.setScalar(2.2); scene.add(sh);
    const b = { id: 'buffalo' + i, mesh: m, shadow: sh, home: [x, z], tx: x, tz: z, rider: null, yaw: 0 };
    W.buffalo.push(b);
    W.interactables.push({ id: b.id, get x() { return m.position.x; }, get z() { return m.position.z; }, r: 3, icon: '🐃', label: () => T('Ride buffalo', 'Cưỡi trâu'), visible: () => !b.rider, act: (pl, game) => game.mount(pl, b) });
  });
  W.updaters.push((dt, t) => W.buffalo.forEach(b => {
    if (b.rider) return;
    const m = b.mesh, dx = b.tx - m.position.x, dz = b.tz - m.position.z, d = Math.hypot(dx, dz);
    if (d < .5) { if (Math.random() < dt * .2) { b.tx = b.home[0] + (Math.random() - .5) * 16; b.tz = b.home[1] + (Math.random() - .5) * 16; } }
    else { b.yaw = Math.atan2(dx, dz); m.rotation.y = b.yaw; m.position.x += dx / d * dt * 1.2; m.position.z += dz / d * dt * 1.2; }
    m.position.y = heightAt(m.position.x, m.position.z); b.shadow.position.set(m.position.x, m.position.y + .05, m.position.z);
  }));
  // ducks on the lake and chickens in the village (just for company)
  const critters = [];
  for (let i = 0; i < 6; i++) { const s = sprite('🦆', 1.4); critters.push({ s, cx: LAKE.x + (Math.random() - .5) * 30, cz: LAKE.z + (Math.random() - .5) * 30, r: 3 + Math.random() * 4, a: Math.random() * 6, sp: .3 + Math.random() * .3, water: true }); }
  for (let i = 0; i < 5; i++) { const s = sprite(i % 2 ? '🐓' : '🐔', 1.1); critters.push({ s, cx: V.x - 8 + Math.random() * 20, cz: V.z - 20 + Math.random() * 8, r: 2 + Math.random() * 3, a: Math.random() * 6, sp: .4 }); }
  for (let i = 0; i < 14; i++) { const s = sprite('🦋', .7); critters.push({ s, cx: (Math.random() - .5) * 160, cz: (Math.random() - .5) * 160, r: 3, a: Math.random() * 6, sp: .8, fly: true }); }
  const fireflies = [];
  for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = BAMBOO.x + (Math.random() - .5) * 80, z = BAMBOO.z + (Math.random() - .5) * 80; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  for (let i = 0; i < 30; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#fff7a0', transparent: true, opacity: 0, depthWrite: false, fog: false })); s.scale.setScalar(.25); const x = V.x + (Math.random() - .5) * 60, z = V.z + (Math.random() - .5) * 60; s.position.set(x, heightAt(x, z) + 1.5, z); scene.add(s); fireflies.push({ s, ox: x, oz: z, a: Math.random() * 6 }); }
  W.fireflies = fireflies;
  critters.forEach(c => { c.cx = clamp(c.cx, -170, 170); c.cz = clamp(c.cz, -170, 170); scene.add(c.s); c.s.userData.critter = c; });
  W.critters = critters;
  W.updaters.push((dt, t) => {
    critters.forEach(c => {
      c.a += dt * c.sp; const x = c.cx + Math.cos(c.a) * c.r, z = c.cz + Math.sin(c.a) * c.r;
      const g = c.water ? WATER + .4 : heightAt(x, z) + (c.fly ? 1.6 + Math.sin(t * 3 + c.r) * .5 : .5);
      c.s.position.set(x, c.water ? Math.max(g, heightAt(x, z) + .5) : g, z);
    });
    const night = W.isNight();
    fireflies.forEach(f => { f.a += dt; const on = night && !(f.caught > performance.now() / 1000); f.s.visible = on; f.s.material.opacity = on ? .6 + Math.sin(t * 3 + f.a * 3) * .4 : 0; f.s.position.x = f.ox + Math.sin(f.a * .7) * 2; f.s.position.z = f.oz + Math.cos(f.a * .5) * 2; });
  });

  // ---------- walking surface ----------
  // Ground height including bridges and tower tops (only if you are already above them).
  W.groundAt = (x, z, y = 1e9) => {
    let g = heightAt(x, z);
    for (const p of W.platforms) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && y >= p.y - 1.2) g = Math.max(g, p.y);
    return g;
  };
  W.platformAt = (x, z, y) => W.platforms.find(p => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1 && Math.abs(y - p.y) < .3);
  W.collide = (pos, r = .5) => {
    for (const c of W.colliders) {
      const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
      if (d < m && d > 1e-4) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
    }
    // houses and walls: push out of the box the shortest way
    for (const b of W.boxes) {
      if (pos.x < b.x0 - r || pos.x > b.x1 + r || pos.z < b.z0 - r || pos.z > b.z1 + r) continue;
      const pen = [pos.x - (b.x0 - r), (b.x1 + r) - pos.x, pos.z - (b.z0 - r), (b.z1 + r) - pos.z], k = pen.indexOf(Math.min(...pen));
      if (k === 0) pos.x = b.x0 - r; else if (k === 1) pos.x = b.x1 + r; else if (k === 2) pos.z = b.z0 - r; else pos.z = b.z1 + r;
    }
    pos.x = clamp(pos.x, -HALF + 8, HALF - 8); pos.z = clamp(pos.z, -HALF + 8, HALF - 8);
  };
  W.update = (dt, t) => W.updaters.forEach(f => f(dt, t));
  return W;
}

// Paint a top-down picture of the world for the map and minimap.
export function paintMap(size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size), d = img.data, step = SIZE / size;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const wx = -HALF + (i + .5) * step, wz = -HALF + (j + .5) * step, h = heightAt(wx, wz);
    const shade = clamp(1 + (heightAt(wx - 1, wz - 1) - h) * .12, .7, 1.25);
    let r, g, b;
    if (h < 0) { const k = clamp(-h / 7, 0, 1); r = 90 - k * 40; g = 175 - k * 50; b = 215 - k * 30; }
    else if (h < 1.6) { r = 232; g = 214; b = 160; }
    else if (h > 34) { r = 240; g = 245; b = 252; }
    else if (h > 22) { r = 150; g = 150; b = 138; }
    else { r = 112 + h * 2; g = 178 - h; b = 130; }
    if (dist2(wx, wz, VILLAGE.x, VILLAGE.z) < VILLAGE.r - 2) { r = 222; g = 196; b = 150; }
    if (dist2(wx, wz, PADDIES.x, PADDIES.z) < PADDIES.r) { r = 160; g = 214; b = 110; }
    if (dist2(wx, wz, CHINA.x, CHINA.z) < CHINA.r - 2) { r = 226; g = 190; b = 160; }
    if (dist2(wx, wz, INDIA.x, INDIA.z) < INDIA.r - 2) { r = 238; g = 200; b = 150; }
    if (dist2(wx, wz, BAMBOO.x, BAMBOO.z) < BAMBOO.r) { r *= .8; g *= .95; b *= .8; }
    for (const C of CITIES) if (wx > C.x0 && wx < C.x1 && wz > C.z0 && wz < C.z1) { r = 230; g = 214; b = 186; }
    { const rd = roadDist(wx, wz); if (rd.d < rd.road.w / 2 + .6) { if (rd.road.kind === 'asphalt') { r = 120; g = 124; b = 130; } else { r = 196; g = 158; b = 108; } } }
    if (wx > 6 && wx < 56 && Math.abs(wz - TOWN.roadZ) < 3.6) { r = 175; g = 180; b = 184; }
    else if ((wx > MARKET.x0 && wx < MARKET.x1 && Math.abs(wz - MARKET.roadZ) < 4) || (wx > AUSSIE.x0 && wx < AUSSIE.x1 && Math.abs(wz - AUSSIE.roadZ) < 3.6)) { r = 190; g = 186; b = 178; }
    else if (wx > 10 && wx < 52 && ((wz > 32 && wz < 40) || (wz > 55 && wz < 72 && (wx < 18 || wx > 40)))) { r = 236; g = 200; b = 160; }
    const o = (j * size + i) * 4; d[o] = clamp(r * shade, 0, 255); d[o + 1] = clamp(g * shade, 0, 255); d[o + 2] = clamp(b * shade, 0, 255); d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // the bridge
  x.fillStyle = '#a9764a'; const s = size / SIZE;
  x.fillRect((BRIDGE.x0 + HALF) * s, (BRIDGE.z - 2 + HALF) * s, (BRIDGE.x1 - BRIDGE.x0) * s, 4 * s);
  x.fillStyle = '#e8b51e'; x.fillRect((DRAGON.x0 + HALF) * s, (DRAGON.z - 2 + HALF) * s, (DRAGON.x1 - DRAGON.x0) * s, 4 * s);
  return c;
}

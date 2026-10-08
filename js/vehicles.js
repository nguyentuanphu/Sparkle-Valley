// Vehicles of the two homes (round R, owner: "the xe máy and xích lô don't look real at all; add the xe 67, the Honda,
// the xích lô, Australia's motorbikes, and bicycles of every kind, the xe đạp thồ too").
// Every builder returns { o, wheels, wr, seat, name }: o faces +z with its wheels on y = 0, wheels are the meshes that
// turn as it rides (rotation.x += distance / wr), seat is where a rider sits. Real proportions at about 0.9 of real size
// (the valley's people are a little small), drawn in the valley's toon style with an outline.
// Bodies are side profiles (drawn in z, y like a sketch on paper) given thickness and soft edges, so tanks, leg shields
// and side covers have the real shapes instead of boxes.
import { THREE, P, merge, toonSmooth, outline } from './gfx.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const CHROME = '#d8dee2', BLACK = '#26292c', TYRE = '#2b2e31', RUBBER = '#3a3d40', STEEL = '#9aa4a8';
// one solid thing: parts merged, soft toon shading, a thin dark outline
function solid(parts, line = .012) { const m = new THREE.Mesh(merge(parts), toonSmooth()); m.castShadow = true; if (line) outline(m, line, '#3c3236'); return m; }
// a straight tube between two points
export function rod(a, b, r, color, seg = 8) {
  const va = V3(...a), vb = V3(...b), d = vb.clone().sub(va), len = d.length();
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.normalize()));
  return P(new THREE.CylinderGeometry(r, r, len, seg), color, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [e.x, e.y, e.z]);
}
// a bent tube through points
const bend = (pts, r, color, seg = 24) => P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V3(...p))), seg, r, 8, false), color);
// a side profile: points [z, y] round the outline (a smooth closed curve), thickness w, centred on x
function side(pts, w, color, x = 0, bevel = .025) {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); s.splineThru([...pts.slice(1), pts[0]].map(([a, b]) => new THREE.Vector2(a, b)));
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.002, w - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .8, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -(w - bevel * 2) / 2); g.computeVertexNormals();
  return P(g, color, [x, 0, 0], [0, -Math.PI / 2, 0]);
}
const ball = (r, color, pos, scl = [1, 1, 1], seg = 18) => P(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), color, pos, [0, 0, 0], scl);
const box = (w, h, d, color, pos, rot = [0, 0, 0]) => P(new THREE.BoxGeometry(w, h, d), color, pos, rot);
const disc = (r, t, color, pos, seg = 20) => P(new THREE.CylinderGeometry(r, r, t, seg), color, pos, [0, 0, Math.PI / 2]);
// a wheel standing in the y-z plane, centred on (0,0,0): tyre, rim, hub and spokes (or a cast wheel's five arms)
function wheel({ r, tyre = .045, rim = CHROME, spokes = 18, cast = false, knobby = false, hubR = .05, width }) {
  const parts = [P(new THREE.TorusGeometry(r - tyre, tyre, 10, 36), TYRE, [0, 0, 0], [0, Math.PI / 2, 0], [1, 1, width ? width / (tyre * 2) : 1]),   // the tyre
    P(new THREE.TorusGeometry(r - tyre * 1.9, tyre * .32, 6, 36), rim, [0, 0, 0], [0, Math.PI / 2, 0]), disc(hubR, .1, STEEL, [0, 0, 0], 12)];   // rim and hub
  if (knobby) for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; parts.push(box(tyre * 2.3, .035, .03, '#232527', [0, Math.cos(a) * (r - .004), Math.sin(a) * (r - .004)], [-a, 0, 0])); }
  if (cast) for (let k = 0; k < 5; k++) parts.push(box(.03, (r - tyre * 2) * 2 * .5, .05, rim, [0, Math.cos(k * 1.2566) * (r - tyre * 2) * .5, Math.sin(k * 1.2566) * (r - tyre * 2) * .5], [-k * 1.2566, 0, 0]));
  else for (let k = 0; k < spokes / 2; k++) parts.push(P(new THREE.CylinderGeometry(.005, .005, (r - tyre * 1.8) * 2, 4), '#c9d0d4', [k % 2 ? .02 : -.02, 0, 0], [k * Math.PI / (spokes / 2) + .08, 0, 0]));
  return solid(parts, .008);
}
// put wheels on a vehicle; returns the meshes, which turn as it rides
function wheelsAt(g, list) { return list.map(([x, y, z, opt]) => { const w = wheel(opt); w.position.set(x, y, z); g.add(w); return w; }); }
const kit = (g, parts) => { g.add(solid(parts)); return g; };
const lamp = (pos, r = .07) => [P(new THREE.CylinderGeometry(r, r * .8, .08, 16), CHROME, pos, [Math.PI / 2, 0, 0]), P(new THREE.CircleGeometry(r * .82, 16), '#fff6c8', [pos[0], pos[1], pos[2] + .042])];
const grips = (y, z, w = .3) => [rod([-w, y, z], [w, y, z], .012, CHROME), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.018, .018, .1, 8), BLACK, [s * (w - .04), y, z], [0, 0, Math.PI / 2]))];
const mirrors = (y, z, w = .24) => [-1, 1].flatMap(s => [rod([s * w * .8, y, z], [s * w, y + .2, z - .03], .006, CHROME), P(new THREE.CylinderGeometry(.045, .045, .012, 14), CHROME, [s * w, y + .22, z - .03], [Math.PI / 2, 0, 0])]);
const plate = (pos, col = '#f4f4ee') => [box(.16, .1, .01, col, pos), box(.12, .015, .012, '#3a3a3a', [pos[0], pos[1] + .015, pos[2] - .002]), box(.12, .015, .012, '#3a3a3a', [pos[0], pos[1] - .015, pos[2] - .002])];

// ---------- Vietnam's motorbikes ----------
// Xe 67: the Honda 67 (CD50/SS50 of 1967), the old classic: a teardrop tank with chrome knee pads, a long flat seat,
// round headlamp, chrome mudguards, an upswept exhaust and spoked 17-inch wheels
export function honda67(color = '#c8372d') {
  const g = new THREE.Group(), R = .29, F = .6, B = -.58;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, tyre: .04 }], [0, R, B, { r: R, tyre: .045 }]]);
  kit(g, [
    side([[.42, .78], [.2, .86], [-.08, .84], [-.12, .74], [.1, .7], [.38, .7]], .26, color),            // the tank
    ...[-1, 1].map(s => ball(.075, CHROME, [s * .13, .76, .12], [.35, .8, 1.4])),                         // chrome knee pads
    ball(.035, CHROME, [0, .87, .1], [1, .5, 1.3]),                                                      // filler cap
    side([[-.08, .82], [-.5, .84], [-.72, .8], [-.7, .76], [-.1, .76]], .25, BLACK),                     // the seat
    rod([0, .88, .5], [0, .72, .05], .03, color), rod([0, .72, .05], [0, .7, -.62], .025, color),          // backbone and seat rail
    side([[-.04, .72], [-.32, .74], [-.36, .5], [-.12, .44]], .24, color),                               // side covers
    box(.2, .17, .24, '#8e959a', [0, .42, .02]), ...[0, 1, 2, 3].map(k => box(.21, .012, .2, '#a9b0b4', [0, .48 + k * .03, .21], [0, 0, 0])), // engine and cylinder fins (lying forward)
    P(new THREE.CylinderGeometry(.075, .075, .2, 14), '#a9b0b4', [0, .47, .22], [Math.PI / 2 - .25, 0, 0]),
    bend([[.09, .43, .3], [.12, .3, .2], [.13, .3, -.2], [.14, .5, -.5], [.14, .56, -.7]], .022, CHROME), P(new THREE.CylinderGeometry(.04, .03, .32, 12), CHROME, [.14, .54, -.62], [Math.PI / 2 - .2, 0, 0]),   // upswept exhaust
    ...[-1, 1].flatMap(s => [rod([s * .07, .5, -.15], [s * .07, R, B], .02, BLACK), rod([s * .08, R + .02, B + .02], [s * .09, .74, -.5], .018, CHROME)]),   // swing arm, rear shocks
    ...[-1, 1].map(s => rod([s * .065, .86, .52], [s * .065, R, F], .02, CHROME)), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.03, .03, .2, 10), BLACK, [s * .065, .62, .55], [-.25, 0, 0])),   // forks and gaiters
    bend([[0, R + .05, F - .3], [0, R + .27, F - .12], [0, R + .3, F + .05], [0, R + .2, F + .27]], .055, CHROME), bend([[0, R + .05, B - .28], [0, R + .3, B - .05], [0, R + .29, B + .1]], .065, CHROME),   // mudguards
    ...lamp([0, .82, .64], .085), box(.06, .04, .05, BLACK, [0, .93, .55]),                               // headlamp and speedo
    ...grips(.94, .52, .3), ...mirrors(.94, .52), box(.07, .04, .04, '#d8322a', [0, .7, -.79]), ...plate([0, .6, -.82]),
    ...[-1, 1].map(s => rod([s * .06, .32, .02], [s * .19, .32, .02], .012, STEEL))                       // footpegs
  ]);
  return { o: g, wheels, wr: R, seat: [0, .84, -.3], name: ['Honda 67', 'Xe 67'] };
}
// Honda Super Cub: the step-through with its white leg shield, round lamp in the handlebar and a chrome carrier
export function cub(color = '#2f6fb0') {
  const g = new THREE.Group(), R = .28, F = .58, B = -.56;
  const wheels = wheelsAt(g, [[0, R, F, { r: R }], [0, R, B, { r: R }]]);
  kit(g, [
    side([[.5, .9], [.42, .92], [.36, .62], [.24, .34], [.06, .3], [.04, .36], [.2, .42], [.3, .66], [.36, .9]], .38, '#f2efe6'),   // leg shield
    side([[.36, .78], [.42, .82], [.12, .4], [-.05, .36], [-.12, .44]], .12, color),                         // the beam under the shield
    side([[-.08, .44], [-.12, .7], [-.4, .76], [-.66, .72], [-.7, .56], [-.4, .5], [-.2, .42]], .3, color),     // body under the seat
    side([[-.12, .8], [-.48, .82], [-.56, .78], [-.12, .76]], .26, BLACK),                                   // seat
    box(.34, .015, .34, CHROME, [0, .82, -.78]), ...[-1, 1].map(s => rod([s * .16, .82, -.6], [s * .16, .82, -.96], .01, CHROME)),   // carrier
    box(.18, .12, .3, '#8e959a', [0, .3, -.04]), bend([[.08, .28, .12], [.1, .22, -.1], [.12, .26, -.5], [.13, .34, -.74]], .022, CHROME), P(new THREE.CylinderGeometry(.04, .03, .3, 12), CHROME, [.13, .33, -.66], [Math.PI / 2, 0, 0]),
    box(.36, .02, .3, '#3a3d40', [0, .33, .15]),                                                              // floor step
    ...[-1, 1].map(s => rod([s * .06, .9, .45], [s * .06, R, F], .02, '#3a3d40')), bend([[0, R + .04, F - .3], [0, R + .26, F - .1], [0, R + .29, F + .08], [0, R + .2, F + .27]], .06, color),
    bend([[0, R + .12, B - .25], [0, R + .3, B], [0, R + .28, B + .15]], .065, color),
    side([[.38, .98], [.6, 1.0], [.62, .92], [.4, .9]], .44, color), ...lamp([0, .95, .63], .07), ...grips(.98, .5, .28), ...mirrors(1.0, .48),
    box(.07, .04, .04, '#d8322a', [0, .7, -.78]), ...plate([0, .62, -.8])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .82, -.32], name: ['Honda Super Cub', 'Xe Cub'] };
}
// Honda Dream: the Vietnamese family's "xe Honda": bigger and squarer than the Cub, the famous plum-brown colour,
// a square lamp, chrome side grab rails and a big carrier
export function dream(color = '#6b2f2a') {
  const g = new THREE.Group(), R = .29, F = .62, B = -.6;
  const wheels = wheelsAt(g, [[0, R, F, { r: R }], [0, R, B, { r: R }]]);
  kit(g, [
    side([[.52, .94], [.44, .96], [.38, .64], [.26, .36], [.04, .32], [.04, .38], [.22, .44], [.32, .66], [.38, .94]], .42, color),   // leg shield
    side([[-.06, .42], [-.1, .74], [-.42, .8], [-.72, .76], [-.76, .58], [-.42, .5], [-.2, .42]], .32, color),
    box(.3, .05, .5, '#c9a44a', [0, .74, -.4]),                                                              // gold stripe
    side([[-.08, .86], [-.6, .88], [-.68, .82], [-.1, .8]], .29, '#2a2220'),                                 // long seat
    ...[-1, 1].map(s => bend([[s * .17, .82, -.2], [s * .19, .84, -.6], [s * .12, .84, -.76]], .014, CHROME)), box(.36, .015, .32, CHROME, [0, .85, -.88]),
    box(.2, .13, .32, '#8e959a', [0, .3, -.04]), bend([[.09, .28, .12], [.12, .22, -.1], [.14, .26, -.5], [.15, .34, -.78]], .024, CHROME), P(new THREE.CylinderGeometry(.045, .035, .34, 12), CHROME, [.15, .33, -.7], [Math.PI / 2, 0, 0]),
    box(.38, .02, .32, '#3a3d40', [0, .35, .15]),
    ...[-1, 1].map(s => rod([s * .065, .94, .48], [s * .065, R, F], .022, CHROME)), bend([[0, R + .04, F - .3], [0, R + .27, F - .1], [0, R + .3, F + .08], [0, R + .21, F + .27]], .06, color),
    bend([[0, R + .12, B - .25], [0, R + .31, B], [0, R + .29, B + .15]], .065, color),
    box(.36, .14, .16, color, [0, 1.0, .52]), box(.16, .1, .02, '#fff6c8', [0, 1.0, .61]), box(.1, .05, .02, '#ffb43a', [-.13, 1.0, .61]), box(.1, .05, .02, '#ffb43a', [.13, 1.0, .61]),  // square lamp + indicators
    ...grips(1.04, .5, .3), ...mirrors(1.06, .48), box(.18, .05, .04, '#d8322a', [0, .74, -.81]), ...plate([0, .64, -.83])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .86, -.34], name: ['Honda Dream', 'Xe Dream'] };
}
// a modern Vietnamese scooter (Honda Vision style): smooth white body, small cast wheels, flat floor
export function scooter(color = '#f4f2ee', trim = '#c8372d') {
  const g = new THREE.Group(), R = .24, F = .6, B = -.5;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, cast: true, rim: '#3a3d40', tyre: .05 }], [0, R, B, { r: R, cast: true, rim: '#3a3d40', tyre: .05 }]]);
  kit(g, [
    side([[.6, 1.0], [.5, 1.02], [.42, .6], [.36, .3], [.2, .26], [.24, .5], [.32, .96]], .4, color),        // apron
    side([[.2, .26], [-.1, .26], [-.12, .32], [.2, .32]], .36, '#3a3d40'),                                    // floor
    side([[-.1, .3], [-.12, .66], [-.4, .76], [-.74, .72], [-.78, .5], [-.5, .36], [-.2, .3]], .36, color),
    side([[-.14, .78], [-.66, .82], [-.72, .76], [-.14, .72]], .3, '#2a2220'),
    box(.38, .04, .34, trim, [0, .6, -.48]), box(.4, .1, .14, trim, [0, .98, .56]), box(.16, .06, .02, '#fff6c8', [0, .97, .64]),
    ...[-1, 1].map(s => rod([s * .07, .96, .48], [s * .07, R, F], .024, '#3a3d40')), bend([[0, R + .05, F - .26], [0, R + .24, F - .08], [0, R + .26, F + .08], [0, R + .18, F + .22]], .06, color),
    box(.14, .14, .4, '#8e959a', [.1, .26, -.4]), P(new THREE.CylinderGeometry(.04, .035, .26, 12), '#5a5f64', [.18, .3, -.6], [Math.PI / 2, 0, 0]),
    ...grips(1.04, .48, .28), ...mirrors(1.06, .46), box(.2, .05, .04, '#d8322a', [0, .7, -.78]), ...plate([0, .56, -.8])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .8, -.36], name: ['Scooter', 'Xe tay ga'] };
}
// Xích lô: the Sài Gòn / Hà Nội cyclo. The passenger sits in front in a padded seat between two wheels under a folding
// hood; the driver pedals behind on a bicycle saddle and steers the whole seat with a bar round its back.
export function xichlo(frame = '#2d5a8a', seat = '#c62f2f', hood = '#2f6b3a') {
  const g = new THREE.Group(), R = .3, RR = .34, F = .34, B = -1.02, W = .38;
  const wheels = wheelsAt(g, [[-W, R, F, { r: R }], [W, R, F, { r: R }], [0, RR, B, { r: RR, tyre: .035 }]]);
  kit(g, [
    rod([-W - .04, R, F], [W + .04, R, F], .025, frame),                                                         // front axle
    side([[.56, .36], [.6, .44], [.2, .5], [-.14, .48], [-.16, .4], [.2, .38]], .7, frame),                    // the carriage's tub
    side([[.22, .5], [-.16, .5], [-.22, .62], [-.26, 1.0], [-.16, 1.02], [-.08, .62], [.2, .6]], .62, seat),     // padded seat and backrest
    ...[-1, 1].map(s => side([[.24, .5], [.3, .66], [-.06, .74], [-.14, .64], [-.12, .5]], .06, frame, s * .34)),  // armrests
    box(.62, .03, .3, '#7a5236', [0, .4, .52]),                                                                  // footboard
    ...[-1, 1].map(s => bend([[s * .34, .74, -.14], [s * .36, 1.0, -.34], [s * .2, 1.12, -.44], [0, 1.14, -.46]], .012, CHROME)),   // hood bows, folded
    P(new THREE.SphereGeometry(.42, 20, 10, 0, Math.PI, 0, Math.PI / 2), hood, [0, .98, -.3], [0, Math.PI / 2, -1.25], [.6, 1.0, .82]),   // the hood, folded down behind the seat back
    bend([[-.36, .92, -.32], [-.3, 1.08, -.38], [0, 1.12, -.42], [.3, 1.08, -.38], [.36, .92, -.32]], .018, CHROME),  // the driver's steering bar round the seat back
    rod([0, .5, -.24], [0, .8, -.62], .03, frame), rod([0, .8, -.62], [0, 1.0, -.7], .025, frame),               // frame to the saddle
    rod([0, .5, -.3], [0, .42, -.66], .028, frame), rod([0, .42, -.66], [0, RR, B], .022, frame), rod([0, .98, -.7], [0, RR, B], .02, frame),
    box(.18, .05, .24, BLACK, [0, 1.04, -.72]),                                                                  // driver's saddle
    rod([-.12, .42, -.66], [.12, .42, -.66], .015, '#555'), ...[-1, 1].map(s => box(.1, .025, .06, '#333', [s * .14, .42 + s * .1, -.66])), disc(.1, .014, '#777', [.06, .42, -.66]),
    bend([[0, RR + .06, B + .28], [0, RR + .36, B + .02], [0, RR + .32, B - .18]], .055, frame),
    ...[-1, 1].map(s => bend([[s * W, R + .06, F - .26], [s * W, R + .32, F], [s * W, R + .26, F + .2]], .05, frame)),
    ...lamp([W + .02, .66, .6], .045), ...lamp([-W - .02, .66, .6], .045), ...plate([0, .44, .66], '#f4f4ee')
  ]);
  return { o: g, wheels, wr: R, seat: [0, 1.04, -.74], passenger: [0, .56, .02], name: ['Xích lô (cyclo)', 'Xích lô'] };
}

// ---------- Australia's motorbikes ----------
// The postie bike: Australia Post's red Honda CT110, high exhaust, big racks front and back with letter boxes
export function postie() {
  const g = new THREE.Group(), R = .29, F = .6, B = -.58, RED = '#d8202a';
  const wheels = wheelsAt(g, [[0, R, F, { r: R, knobby: true }], [0, R, B, { r: R, knobby: true }]]);
  kit(g, [
    side([[.48, .9], [.42, .92], [.36, .62], [.24, .36], [.06, .32], [.04, .38], [.2, .44], [.3, .66], [.36, .9]], .36, RED),
    side([[-.08, .44], [-.12, .7], [-.42, .76], [-.66, .72], [-.7, .56], [-.4, .5], [-.2, .42]], .3, RED),
    side([[-.12, .8], [-.48, .82], [-.56, .78], [-.12, .76]], .26, BLACK),
    box(.2, .13, .3, '#8e959a', [0, .32, -.04]), bend([[.09, .34, .1], [.14, .5, -.1], [.15, .6, -.4], [.15, .62, -.7]], .022, '#5a5f64'), box(.06, .18, .3, '#3a3d40', [.17, .62, -.5]),   // the high pipe and its heat shield
    box(.4, .02, .32, '#3a3d40', [0, .36, .15]),
    ...[-1, 1].map(s => rod([s * .065, .92, .46], [s * .065, R, F], .022, '#3a3d40')), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.032, .032, .22, 10), BLACK, [s * .065, .6, .54], [-.25, 0, 0])),
    bend([[0, R + .1, F - .26], [0, R + .3, F - .04], [0, R + .3, F + .14]], .05, RED), bend([[0, R + .12, B - .25], [0, R + .31, B], [0, R + .29, B + .15]], .055, RED),
    // the racks and the letter boxes
    box(.5, .02, .5, '#3a3d40', [0, .84, -.86]), box(.46, .36, .44, '#e8432a', [0, 1.04, -.86]), box(.47, .04, .45, '#c62828', [0, 1.23, -.86]),
    ...[-1, 1].map(s => box(.08, .3, .4, '#e8432a', [s * .3, .62, -.72])),
    box(.36, .02, .26, '#3a3d40', [0, .98, .74]), box(.32, .22, .24, '#e8432a', [0, 1.1, .74]),
    ...lamp([0, .92, .62], .07), ...grips(1.0, .46, .32), ...mirrors(1.02, .44), ...plate([0, .66, -1.1], '#f2d24a')
  ]);
  return { o: g, wheels, wr: R, seat: [0, .82, -.34], name: ['Postie bike', 'Xe bưu tá Úc'] };
}
// a farm trail bike: tall, knobbly tyres, high mudguards, a number board, the kind kids see on Australian farms
export function trailBike(color = '#f2b51e') {
  const g = new THREE.Group(), R = .34, F = .74, B = -.66;
  const wheels = wheelsAt(g, [[0, R, F, { r: R, knobby: true, tyre: .055 }], [0, R, B, { r: R, knobby: true, tyre: .06 }]]);
  kit(g, [
    side([[.3, 1.0], [.04, 1.02], [-.06, .9], [.1, .86], [.3, .88]], .3, color),                                // tank
    side([[-.02, 1.0], [-.66, 1.0], [-.7, .96], [-.04, .94]], .24, BLACK),                                      // long flat seat
    side([[-.1, .96], [-.7, .98], [-.86, .96], [-.6, .86], [-.14, .82]], .3, color),                            // tail
    rod([0, 1.05, .46], [0, .5, .1], .03, '#3a3d40'), rod([0, .5, .1], [0, .45, -.2], .03, '#3a3d40'),
    box(.2, .26, .26, '#5a5f64', [0, .52, -.06]), bend([[.08, .6, .12], [.14, .7, -.1], [.15, .86, -.5], [.15, .9, -.8]], .025, '#5a5f64'),
    ...[-1, 1].map(s => rod([s * .06, .48, -.2], [s * .06, R, B], .022, '#3a3d40')), rod([0, .58, -.2], [0, .92, -.4], .03, color),
    ...[-1, 1].map(s => rod([s * .07, 1.08, .48], [s * .07, R, F], .028, CHROME)),
    side([[F + .32, R + .38], [F + .06, R + .44], [F - .2, R + .42], [F - .18, R + .38], [F + .1, R + .36]], .16, color),   // front guard, high
    side([[.42, 1.16], [.52, 1.2], [.6, .98], [.5, .92]], .26, '#f4f4ee'),                                      // number board
    ...grips(1.2, .44, .36), box(.06, .04, .04, '#d8322a', [0, .98, -.88])
  ]);
  return { o: g, wheels, wr: R, seat: [0, .98, -.3], name: ['Farm trail bike', 'Xe cào cào ở trang trại Úc'] };
}
// the farm quad bike, with racks and a cattle dog's spot behind
export function quadBike(color = '#c8372d') {
  const g = new THREE.Group(), R = .28, F = .5, B = -.5, W = .42;
  const wheels = wheelsAt(g, [[-W, R, F, { r: R, knobby: true, tyre: .1, cast: true, rim: '#3a3d40' }], [W, R, F, { r: R, knobby: true, tyre: .1, cast: true, rim: '#3a3d40' }],
    [-W, R, B, { r: R, knobby: true, tyre: .11, cast: true, rim: '#3a3d40' }], [W, R, B, { r: R, knobby: true, tyre: .11, cast: true, rim: '#3a3d40' }]]);
  kit(g, [
    side([[.8, .62], [.5, .72], [.2, .7], [-.2, .72], [-.6, .7], [-.8, .62], [-.6, .5], [.6, .5]], .62, color),
    ...[-1, 1].flatMap(sd => [side([[F + .3, .58], [F, .66], [F - .3, .58], [F, .54]], .3, color, sd * W), side([[B + .3, .58], [B, .66], [B - .3, .58], [B, .54]], .3, color, sd * W)]),
    side([[.1, .82], [-.4, .84], [-.46, .78], [.1, .76]], .3, BLACK), box(.24, .26, .3, '#5a5f64', [0, .4, 0]),
    box(.7, .03, .4, '#3a3d40', [0, .76, .66]), box(.7, .03, .44, '#3a3d40', [0, .76, -.68]), ...[-1, 1].map(s => rod([s * .34, .76, .46], [s * .34, .82, .86], .015, '#3a3d40')),
    rod([0, .74, .3], [0, .96, .22], .03, '#3a3d40'), ...grips(.98, .22, .36), ...lamp([-.2, .66, .8], .05), ...lamp([.2, .66, .8], .05)
  ]);
  return { o: g, wheels, wr: R, seat: [0, .84, -.16], name: ['Quad bike', 'Xe bốn bánh trang trại'] };
}

// ---------- bicycles ----------
// one bicycle frame builder for all of them: where the hubs, crank, saddle and bars are, and the style of frame
function bicycle({ R, wb = 1.1, frame = '#1d1f22', step = false, drop = false, rack = false, basket = false, mud = true, guard = false, tyre = .03, kids = false, bmx = false }) {
  const g = new THREE.Group(), F = wb / 2, B = -wb / 2, H = R + .01;
  const wheels = wheelsAt(g, [[0, H, F, { r: R, tyre, spokes: bmx ? 36 : 28 }], [0, H, B, { r: R, tyre, spokes: bmx ? 36 : 28 }]]);
  const BB = [0, H + .03, -.02], SEAT = [0, H + R * 1.55, B * .42], HEAD = [0, H + R * 1.5, F * .7], HEAD_LO = [0, H + R * 1.12, F * .78];
  const p = [
    step ? bend([HEAD, [0, HEAD_LO[1] - R * .5, F * .5], [0, BB[1] + .04, BB[2] + .12], BB], .024, frame) : rod(SEAT, HEAD, .022, frame),
    rod(HEAD_LO, BB, .026, frame), rod(BB, SEAT, .026, frame), rod(HEAD, HEAD_LO, .03, frame),
    ...[-1, 1].flatMap(s => [rod([s * .04, BB[1], BB[2]], [s * .05, H, B], .014, frame), rod([s * .03, SEAT[1] - .05, SEAT[2]], [s * .05, H, B], .013, frame), rod([s * .04, HEAD_LO[1], HEAD_LO[2]], [s * .05, H, F], .014, CHROME)]),
    rod(SEAT, [0, SEAT[1] + .1, SEAT[2] - .02], .014, CHROME), side([[SEAT[2] + .12, SEAT[1] + .12], [SEAT[2] - .1, SEAT[1] + .14], [SEAT[2] - .14, SEAT[1] + .1], [SEAT[2] + .1, SEAT[1] + .09]], .14, BLACK),
    rod(HEAD, [0, HEAD[1] + .12, HEAD[2] - .02], .015, CHROME),
    rod([-.1, BB[1], BB[2]], [.1, BB[1], BB[2]], .015, '#555'), ...[-1, 1].map(s => box(.09, .022, .05, '#333', [s * .12, BB[1] + s * .13, BB[2] + s * .03])), disc(R * .3, .012, '#777', [.05, BB[1], BB[2]])
  ];
  if (drop) p.push(...[-1, 1].map(s => bend([[s * .2, HEAD[1] + .12, HEAD[2] - .02], [s * .2, HEAD[1] + .12, HEAD[2] + .1], [s * .2, HEAD[1] + .0, HEAD[2] + .14], [s * .2, HEAD[1] - .06, HEAD[2] + .04]], .012, '#2b2e31')), rod([-.2, HEAD[1] + .12, HEAD[2] - .02], [.2, HEAD[1] + .12, HEAD[2] - .02], .012, CHROME));
  else if (bmx) p.push(rod([-.28, HEAD[1] + .22, HEAD[2] - .06], [.28, HEAD[1] + .22, HEAD[2] - .06], .012, CHROME), ...[-1, 1].map(s => rod([s * .16, HEAD[1] + .1, HEAD[2]], [s * .2, HEAD[1] + .22, HEAD[2] - .06], .012, CHROME)), rod([-.16, HEAD[1] + .14, HEAD[2] - .03], [.16, HEAD[1] + .14, HEAD[2] - .03], .01, CHROME),
    ...[-1, 1].flatMap(s => [P(new THREE.CylinderGeometry(.022, .022, .12, 10), STEEL, [s * .1, H, B], [0, 0, Math.PI / 2]), P(new THREE.CylinderGeometry(.022, .022, .12, 10), STEEL, [s * .1, H, F], [0, 0, Math.PI / 2])]), ...[-1, 1].map(s => P(new THREE.CylinderGeometry(.02, .02, .1, 8), BLACK, [s * .29, HEAD[1] + .22, HEAD[2] - .06], [0, 0, Math.PI / 2])));
  else p.push(...grips(HEAD[1] + .12, HEAD[2] - .06, kids ? .2 : .27), rod([0, HEAD[1] + .12, HEAD[2] - .02], [0, HEAD[1] + .12, HEAD[2] - .06], .012, CHROME), ball(.025, CHROME, [.16, HEAD[1] + .15, HEAD[2] - .06]));
  if (mud) p.push(bend([[0, H + .05, F - R - .02], [0, H + R + .05, F - .04], [0, H + R + .06, F + .1], [0, H + R * .5, F + R + .06]], .02, frame), bend([[0, H + R * .6, B + R + .04], [0, H + R + .05, B + .06], [0, H + R + .03, B - .14], [0, H + .1, B - R - .05]], .022, frame));
  if (guard) p.push(side([[BB[2] + .12, BB[1] + .06], [B + .06, H + .06], [B + .04, H - .04], [BB[2] + .12, BB[1] - .1]], .03, frame, .07));
  if (rack) p.push(box(.16, .012, .34, CHROME, [0, H + R + .1, B + .02]), ...[-1, 1].map(s => rod([s * .07, H + R + .1, B - .04], [s * .05, H, B], .01, CHROME)));
  if (basket) p.push(P(new THREE.CylinderGeometry(.16, .13, .2, 12, 1, true), '#c9a24a', [0, HEAD[1] - .04, HEAD[2] + .2]), P(new THREE.CircleGeometry(.13, 12), '#a8823a', [0, HEAD[1] - .14, HEAD[2] + .2], [-Math.PI / 2, 0, 0]));
  if (kids) for (const s of [-1, 1]) { const tw = wheel({ r: .09, tyre: .022, spokes: 6, rim: '#ffffff' }); tw.position.set(s * .2, .09, B - .02); g.add(tw); p.push(rod([s * .03, H, B], [s * .2, .09, B - .02], .012, CHROME)); }
  if (!drop && !bmx) p.push(...lamp([0, HEAD[1] - .04, HEAD[2] + .08], .035));
  p.push(box(.04, .03, .015, '#d8322a', [0, H + R * .72, B - R - .03]));
  g.add(solid(p, .007));
  return { g, wheels, F, B, H, SEAT, HEAD, BB, R };
}
// the Vietnamese man's roadster (Phượng Hoàng / Thống Nhất): black, big wheels, a chain guard and a rear carrier
export function roadster() { const b = bicycle({ R: .36, wb: 1.16, frame: '#1d1f22', rack: true, guard: true }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], name: ['Roadster bicycle', 'Xe đạp Phượng Hoàng'] }; }
// xe đạp mini: the little step-through city bike with a front basket that mums and big sisters ride to market
export function miniBike(color = '#e88aa8') { const b = bicycle({ R: .26, wb: .96, frame: color, step: true, basket: true, rack: true }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], name: ['Mini city bike', 'Xe đạp mini'] }; }
// a road bike with drop bars and thin tyres (Sunday riders on Australian roads)
export function roadBike(color = '#2f8fd8') { const b = bicycle({ R: .35, wb: 1.0, frame: color, drop: true, mud: false, tyre: .018 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], name: ['Road bike', 'Xe đạp đua'] }; }
// a BMX: small wheels, pegs, high bars
export function bmx(color = '#38b54a') { const b = bicycle({ R: .26, wb: .9, frame: color, bmx: true, mud: false, tyre: .04 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .14, b.SEAT[2]], name: ['BMX', 'Xe đạp BMX'] }; }
// a little kid's bike with training wheels
export function kidsBike(color = '#ff7a3a') { const b = bicycle({ R: .2, wb: .7, frame: color, kids: true, basket: true, tyre: .035 }); return { o: b.g, wheels: b.wheels, wr: b.R, seat: [0, b.SEAT[1] + .12, b.SEAT[2]], name: ["Kid's bike", 'Xe đạp trẻ em'] }; }
// Xe đạp thồ: a heavy roadster made into a pack bike. A long bamboo pole is tied to the left handlebar so the rider can
// walk beside it (on the right) and steer, a second one up from the seat post to push with, and it is loaded high: sacks on both
// sides of the carrier, baskets of fruit and a bundle on the top tube.
export function packBike() {
  const b = bicycle({ R: .36, wb: 1.2, frame: '#2b3a2e', rack: true, guard: true }), p = [], { F, B, H, R, SEAT, HEAD } = b;
  p.push(rod([.27, HEAD[1] + .12, HEAD[2] - .06], [.42, HEAD[1] + .5, HEAD[2] - .7], .022, '#c9a45a'), rod([.02, SEAT[1] + .05, SEAT[2]], [.36, SEAT[1] + .62, SEAT[2] - .55], .022, '#c9a45a'));  // steering pole and pushing pole
  p.push(box(.5, .03, .6, '#8a6a3e', [0, H + R + .12, B]));                                                     // a wide board on the carrier
  for (const s of [-1, 1]) p.push(ball(.2, '#d9c08a', [s * .32, H + R - .02, B + .02], [.7, 1.3, 1.1]), ball(.18, '#cdb27a', [s * .3, H + R + .3, B - .06], [.7, 1.2, 1]));   // sacks hanging each side
  p.push(P(new THREE.CylinderGeometry(.26, .22, .3, 14, 1, true), '#b8893a', [0, H + R + .3, B]), ...Array.from({ length: 9 }, (_, k) => ball(.08, ['#ff9a2e', '#5fbf4a', '#e8433a'][k % 3], [Math.cos(k * 2.3) * .14, H + R + .46 + (k % 3) * .03, B + Math.sin(k * 2.3) * .14])));   // a basket of fruit on top
  p.push(ball(.14, '#6a8a3a', [0, (SEAT[1] + HEAD[1]) / 2 - .04, (SEAT[2] + HEAD[2]) / 2], [.8, .8, 2.1]), ...[-1, 1].map(s => rod([s * .1, H + R * 1.2, .02 + s * .1], [s * .1, H + R * 1.65, .02 + s * .1], .008, '#8a6a3e')));   // a bundle of greens on the top tube, tied on
  p.push(...[-1, 1].map(s => P(new THREE.CylinderGeometry(.16, .14, .24, 12, 1, true), '#c9a24a', [s * .3, HEAD[1] - .1, HEAD[2] + .02])));   // baskets hung from the bars
  b.g.add(solid(p, .008));
  return { o: b.g, wheels: b.wheels, wr: R, seat: null, walk: [.62, 0, HEAD[2] - .35], name: ['Pack bicycle (xe đạp thồ)', 'Xe đạp thồ'] };
}

// every vehicle by id, for Sparkle Studio and the valley's traffic
export const VEHICLES = { honda67, cub, dream, scooter, xichlo, postie, trailBike, quadBike, roadster, miniBike, roadBike, bmx, kidsBike, packBike };

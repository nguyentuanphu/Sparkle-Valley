// Prototype only (not in the game): today's characters beside a rounder, fuller 3D character with real expressions.
import { THREE, toon, outline } from '../../js/gfx.js';
import { buildAvatar } from '../../js/avatar.js';

const V = (x, y) => new THREE.Vector2(x, y);
const mesh = (g, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); return o; };
const basic = c => new THREE.MeshBasicMaterial({ color: c });

// a head with cheeks and a small chin: a sphere pushed out at the lower sides and flatter at the front
function headGeo(r) {
  const g = new THREE.SphereGeometry(r, 48, 36), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const low = Math.max(0, -y / r);
    x *= 1 + .1 * Math.sin(low * Math.PI) ; z *= 1 + .06 * Math.sin(low * Math.PI);
    if (z > 0) z *= .9;
    if (y < -r * .6) y *= .96;
    p.setXYZ(i, x * 1.04, y, z);
  }
  g.computeVertexNormals(); return g;
}
const R = .34; // head radius
// a point on the face, and the turn that makes a flat thing lie on it
function onFace(x, y, lift = .004) {
  const z = Math.sqrt(Math.max(0, R * R - x * x - y * y)) * .9 + lift;
  return { p: [x * 1.04, y, z], r: [-Math.asin(y / R) * .9, Math.asin(x / R) * .9, 0] };
}
function eye(side, mood, look) {
  const g = new THREE.Group(), at = onFace(side * .125, .0, -.012); g.position.set(...at.p); g.rotation.set(...at.r);
  const closed = mood === 'grin' || (mood === 'wink' && side < 0);
  if (closed) { // a happy closed eye: an arc
    const arc = mesh(new THREE.TorusGeometry(.05, .012, 8, 20, Math.PI), basic('#2b1a14'), [0, -.01, .03], [0, 0, 0]); g.add(arc); return g;
  }
  const big = mood === 'wow' ? 1.18 : 1;
  g.add(mesh(new THREE.SphereGeometry(.066, 24, 18), toon('#ffffff'), [0, 0, 0], [0, 0, 0], [big, 1.18 * big, .55]));
  g.add(mesh(new THREE.SphereGeometry(.048, 24, 18), toon(look.eyes || '#5a3418'), [0, -.006, .02], [0, 0, 0], [big, 1.12 * big, .5]));
  g.add(mesh(new THREE.SphereGeometry(.026, 16, 12), basic('#140a06'), [0, -.008, .032], [0, 0, 0], [1, 1.1, .5]));
  g.add(mesh(new THREE.SphereGeometry(.014, 10, 8), basic('#ffffff'), [.016, .02, .042]));
  g.add(mesh(new THREE.SphereGeometry(.007, 8, 6), basic('#ffffff'), [-.014, -.024, .04]));
  if (mood === 'sleepy') { g.add(mesh(new THREE.SphereGeometry(.072, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(look.skin), [0, -.012, .006], [0, 0, 0], [1.05, 1.25, .72])); g.add(mesh(new THREE.TorusGeometry(.066, .008, 6, 20, Math.PI), basic('#2b1a14'), [0, -.012, .045], [0, 0, Math.PI], [1, .25, 1])); } // a heavy eyelid // a heavy eyelid
  // lashes for the girls
  if (false && look.lashes) [-1, 0, 1].forEach(k => g.add(mesh(new THREE.CapsuleGeometry(.006, .025, 2, 6), basic('#2b1a14'), [side * (.05 + k * .012) * -1 * -1 + k * .02, .075 - Math.abs(k) * .008, .02], [0, 0, k * -.5 - side * .2])));
  return g;
}
function brow(side, mood, look) {
  const y = mood === 'wow' ? .112 : mood === 'sleepy' ? .082 : .092, at = onFace(side * .125, y, .006);
  const tilt = mood === 'sleepy' ? side * -.25 : mood === 'wow' ? side * .15 : side * .08;
  return mesh(new THREE.CapsuleGeometry(.013, .06, 4, 8), toon(look.hair), at.p, [at.r[0], at.r[1], Math.PI / 2 + tilt]);
}
function mouth(mood) {
  const g = new THREE.Group(), at = onFace(0, -.14, .012); g.position.set(...at.p); g.rotation.set(...at.r);
  if (mood === 'grin') { // an open laughing mouth with a tongue
    const s = new THREE.Shape(); s.moveTo(-.07, 0); s.quadraticCurveTo(0, .012, .07, 0); s.quadraticCurveTo(.06, -.085, 0, -.09); s.quadraticCurveTo(-.06, -.085, -.07, 0);
    g.add(mesh(new THREE.ShapeGeometry(s, 16), basic('#7a2034'), [0, .02, .01]));
    g.add(mesh(new THREE.CircleGeometry(.035, 16), basic('#ff7f8f'), [0, -.045, .012], [0, 0, 0], [1.2, .6, 1]));
    g.add(mesh(new THREE.PlaneGeometry(.09, .018), basic('#ffffff'), [0, .01, .013]));
  } else if (mood === 'wow') g.add(mesh(new THREE.CircleGeometry(.03, 20), basic('#7a2034'), [0, 0, .01], [0, 0, 0], [1, 1.3, 1]));
  else if (mood === 'sleepy') g.add(mesh(new THREE.TorusGeometry(.03, .008, 6, 16, Math.PI), basic('#a3485a'), [0, .02, .01], [0, 0, Math.PI]));
  else g.add(mesh(new THREE.TorusGeometry(.045, .011, 8, 20, Math.PI), basic('#a3485a'), [0, .02, .01], [0, 0, Math.PI]));
  return g;
}
function hairFor(look, hairM, head) {
  head.add(mesh(new THREE.SphereGeometry(R + .025, 40, 24, 0, Math.PI * 2, 0, Math.PI * .5), hairM, [0, .02, -.02], [-.32, 0, 0], [1.06, 1.05, 1.04]));
  head.add(mesh(new THREE.SphereGeometry(R + .02, 32, 24, Math.PI, Math.PI, 0, Math.PI * .78), hairM, [0, 0, -.01], [0, 0, 0], [1.06, 1, 1.04]));
  // fringe: soft tapered locks swept across the forehead
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * .24, l = mesh(new THREE.SphereGeometry(.09, 16, 12), hairM);
    l.scale.set(.75, 1.25, .5); l.position.set(Math.sin(a) * .3 * 1.04, .2 - Math.abs(i - 3) * .012, Math.cos(a) * .27); l.rotation.set(-.6, a, (i - 3) * -.12 - .25); head.add(l);
  }
  if (look.hairStyle === 'pigtails') [-1, 1].forEach(s => {
    const g = new THREE.Group(); g.position.set(s * .33, .02, -.08); g.rotation.z = s * .5;
    g.add(mesh(new THREE.TorusGeometry(.035, .016, 8, 16), toon(look.tie || '#ff5fa2'), [0, 0, 0], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.CapsuleGeometry(.075, .2, 6, 14), hairM, [0, -.15, 0], [0, 0, 0], [1, 1, .9])); head.add(g);
  });
  if (look.hairStyle === 'short') head.add(mesh(new THREE.SphereGeometry(.07, 12, 10), hairM, [.05, .36, .02], [0, 0, -.6], [1, 1.6, .7])); // a little tuft on top
}
// the body: a rounded torso, shoulders, arms that bend at the elbow, mitten hands with a thumb, legs that bend at the knee
export function buildNew(look, mood = 'smile', pose = 'stand') {
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const skin = toon(look.skin), hairM = toon(look.hair), cloth = toon(look.color), pants = toon(look.pants || '#3a4a7a'), shoeM = toon(look.shoe || '#e8434a'), sole = toon('#fff8ee');
  // legs
  const leg = s => {
    const hip = new THREE.Group(); hip.position.set(s * .085, .5, 0); rig.add(hip);
    hip.add(mesh(new THREE.CapsuleGeometry(.072, .12, 6, 16), look.dress ? skin : pants, [0, -.1, 0]));
    const knee = new THREE.Group(); knee.position.y = -.2; hip.add(knee);
    knee.add(mesh(new THREE.CapsuleGeometry(.062, .12, 6, 16), look.dress ? skin : pants, [0, -.1, 0]));
    knee.add(mesh(new THREE.SphereGeometry(.088, 20, 14), shoeM, [0, -.24, .035], [0, 0, 0], [1, .72, 1.45]));
    knee.add(mesh(new THREE.SphereGeometry(.09, 20, 10, 0, Math.PI * 2, Math.PI * .5, Math.PI * .5), sole, [0, -.245, .035], [0, 0, 0], [1.03, .4, 1.48]));
    return { hip, knee };
  };
  const L = leg(1), Rl = leg(-1);
  // torso
  const torso = new THREE.Group(); rig.add(torso);
  const body = new THREE.LatheGeometry([V(0, .44), V(.16, .45), V(.2, .5), V(.215, .62), V(.205, .75), V(.19, .84), V(.15, .9), V(.07, .93), V(0, .935)], 32);
  torso.add(mesh(body, cloth, [0, 0, 0], [0, 0, 0], [1.05, 1, .82]));
  if (look.dress) torso.add(mesh(new THREE.LatheGeometry([V(.18, .62), V(.22, .55), V(.29, .44), V(.33, .36), V(.335, .33), V(0, .33)], 32), cloth, [0, 0, 0], [0, 0, 0], [1, 1, .85]));
  else torso.add(mesh(new THREE.CylinderGeometry(.205, .21, .1, 28), pants, [0, .47, 0], [0, 0, 0], [1.05, 1, .82]));
  torso.add(mesh(new THREE.TorusGeometry(.085, .022, 8, 24), toon(look.collar || '#ffffff'), [0, .915, 0], [Math.PI / 2, 0, 0], [1, .85, 1])); // a collar
  if (look.pocket) torso.add(mesh(new THREE.SphereGeometry(.05, 12, 8), toon(look.pocket), [.07, .72, .165], [0, 0, 0], [1, .8, .25]));
  // arms
  const arm = s => {
    const sh = new THREE.Group(); sh.position.set(s * .2, .86, 0); torso.add(sh);
    sh.add(mesh(new THREE.SphereGeometry(.072, 18, 14), cloth));
    sh.add(mesh(new THREE.CapsuleGeometry(.058, .1, 6, 14), cloth, [0, -.09, 0]));
    const el = new THREE.Group(); el.position.y = -.17; sh.add(el);
    el.add(mesh(new THREE.CapsuleGeometry(.05, .09, 6, 14), skin, [0, -.07, 0]));
    el.add(mesh(new THREE.SphereGeometry(.066, 18, 14), skin, [0, -.19, 0], [0, 0, 0], [.9, 1.05, .78])); // mitten hand
    el.add(mesh(new THREE.CapsuleGeometry(.022, .035, 4, 8), skin, [s * -.045, -.165, .03], [.3, 0, s * .7])); // thumb
    sh.rotation.z = s * .18; return { sh, el };
  };
  const AL = arm(1), AR = arm(-1);
  // head
  const head = new THREE.Group(); head.position.y = 1.2; rig.add(head);
  torso.add(mesh(new THREE.CylinderGeometry(.055, .06, .08, 14), skin, [0, .95, 0]));
  head.add(mesh(headGeo(R), skin));
  [-1, 1].forEach(s => head.add(mesh(new THREE.SphereGeometry(.06, 14, 10), skin, [s * .35, -.03, 0], [0, 0, 0], [.5, 1, .8])));
  head.add(mesh(new THREE.SphereGeometry(.02, 12, 8), toon(look.skin), onFace(0, -.06, .006).p, [0, 0, 0], [1.2, 1, 1])); // a little nose
  [-1, 1].forEach(s => { const at = onFace(s * .19, -.09, .004); head.add(mesh(new THREE.CircleGeometry(.05, 20), new THREE.MeshBasicMaterial({ color: '#ff8a8a', transparent: true, opacity: .45, depthWrite: false }), at.p, at.r, [1.25, .75, 1])); });
  [-1, 1].forEach(s => { head.add(eye(s, mood, look)); head.add(brow(s, mood, look)); });
  head.add(mouth(mood));
  hairFor(look, hairM, head);
  if (look.cap) { head.add(mesh(new THREE.SphereGeometry(R + .05, 32, 16, 0, Math.PI * 2, 0, Math.PI * .42), toon(look.cap), [0, .04, -.01], [-.15, 0, 0], [1.06, 1, 1.06])); head.add(mesh(new THREE.CylinderGeometry(.2, .2, .025, 24, 1, false, 0, Math.PI), toon(look.cap), [0, .17, .27], [.25, Math.PI / 2 + Math.PI, 0], [1, 1, 1.25])); }
  // poses
  if (pose === 'wave') { AR.sh.rotation.z = -2.5; AR.el.rotation.z = -.5; head.rotation.z = .08; }
  if (pose === 'cheer') { AL.sh.rotation.z = 2.6; AR.sh.rotation.z = -2.6; AL.el.rotation.z = .3; AR.el.rotation.z = -.3; rig.position.y = .04; }
  if (pose === 'walk') { L.hip.rotation.x = -.45; L.knee.rotation.x = .3; Rl.hip.rotation.x = .4; Rl.knee.rotation.x = .5; AL.sh.rotation.x = .45; AR.sh.rotation.x = -.45; AL.el.rotation.x = -.4; AR.el.rotation.x = -.4; torso.rotation.y = .1; }
  if (pose === 'shy') { AL.sh.rotation.z = .35; AR.sh.rotation.z = -.35; AL.el.rotation.x = -1.1; AR.el.rotation.x = -1.1; head.rotation.set(.12, 0, .14); }
  outline(rig, .009, '#6a4a3a');
  return root;
}
export { buildAvatar };

// Chibi characters whose face is the child's own photo.
import { THREE, toon, glow, blobShadow } from './gfx.js';
import { OUTFITS, GLIDERS } from './state.js';

const G = {
  head: new THREE.SphereGeometry(.5, 32, 24),
  hairCap: new THREE.SphereGeometry(.54, 32, 18, 0, Math.PI * 2, 0, Math.PI * .55),
  hairBack: new THREE.SphereGeometry(.53, 24, 18, Math.PI, Math.PI, 0, Math.PI * .8),
  bun: new THREE.SphereGeometry(.17, 12, 10),
  spike: new THREE.ConeGeometry(.14, .4, 6),
  body: new THREE.CylinderGeometry(.27, .36, .62, 16),
  skirt: new THREE.ConeGeometry(.55, .55, 18, 1, true),
  aodai: new THREE.CylinderGeometry(.26, .4, .95, 16),
  arm: new THREE.CylinderGeometry(.075, .07, .42, 8), hand: new THREE.SphereGeometry(.085, 10, 8),
  leg: new THREE.CylinderGeometry(.09, .085, .36, 8), shoe: new THREE.SphereGeometry(.12, 10, 8),
  belt: new THREE.TorusGeometry(.33, .04, 6, 20),
  nonla: new THREE.ConeGeometry(.82, .5, 24, 1, false), cap: new THREE.SphereGeometry(.56, 20, 12, 0, Math.PI * 2, 0, Math.PI * .45), brim: new THREE.CylinderGeometry(.3, .3, .04, 16, 1, false, 0, Math.PI),
  crown: new THREE.CylinderGeometry(.26, .3, .22, 8, 1, true), ear: new THREE.CapsuleGeometry(.08, .38, 4, 8), petal: new THREE.SphereGeometry(.09, 8, 6)
};
G.face = (() => {
  const g = new THREE.SphereGeometry(.508, 40, 28, 0, Math.PI, 0, Math.PI);
  const p = g.attributes.position, uv = g.attributes.uv, k = .47;
  for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * k), .5 + (p.getY(i) + .03) / (2 * k));
  uv.needsUpdate = true; return g;
})();
G.glider = (() => {
  const s = new THREE.Shape(); s.moveTo(-1.3, 0); s.quadraticCurveTo(0, .55, 1.3, 0); s.lineTo(.9, -.15); s.quadraticCurveTo(0, .2, -.9, -.15); s.closePath();
  return new THREE.ShapeGeometry(s, 12);
})();

export function drawDefaultFace(x, S, look, mood = 'smile') {
  x.save(); x.fillStyle = look.skin; x.fillRect(0, 0, S, S);
  x.fillStyle = look.hair; x.beginPath(); x.ellipse(S * .5, S * .08, S * .62, S * .28, 0, 0, Math.PI * 2); x.fill();
  [.36, .64].forEach(ex => {
    x.fillStyle = '#2b1a2e'; x.beginPath(); x.ellipse(ex * S, S * .55, S * .05, S * .07, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(ex * S + S * .016, S * .53, S * .02, 0, Math.PI * 2); x.fill();
  });
  x.fillStyle = 'rgba(255,110,140,.4)'; [.26, .74].forEach(cx => { x.beginPath(); x.arc(cx * S, S * .67, S * .07, 0, Math.PI * 2); x.fill(); });
  x.strokeStyle = '#a33b52'; x.lineWidth = S * .026; x.lineCap = 'round'; x.beginPath();
  if (mood === 'o') x.arc(S * .5, S * .7, S * .04, 0, Math.PI * 2); else x.arc(S * .5, S * .65, S * .09, .2 * Math.PI, .8 * Math.PI);
  x.stroke(); x.restore();
}
export function faceTexture(look, photo) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const finish = () => {
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(S / 2, S / 2, S * .42, S / 2, S / 2, S * .5); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over'; tex.needsUpdate = true;
  };
  drawDefaultFace(x, S, look); finish();
  if (photo) { const im = new Image(); im.onload = () => { x.clearRect(0, 0, S, S); x.drawImage(im, 0, 0, S, S); finish(); }; im.src = photo; }
  return tex;
}
const avatarCache = {};
export function avatarURL(p) {
  if (p.photo) return p.photo;
  const k = p.look.hair + p.look.skin;
  if (!avatarCache[k]) { const c = document.createElement('canvas'); c.width = c.height = 160; drawDefaultFace(c.getContext('2d'), 160, p.look); avatarCache[k] = c.toDataURL(); }
  return avatarCache[k];
}

export function buildAvatar(look, photo) {
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const shadow = blobShadow(); root.add(shadow); shadow.position.y = .03;
  const out = OUTFITS.find(o => o.id === look.outfit) || OUTFITS[0];
  const skin = toon(look.skin), hairM = toon(look.hair), cloth = toon(out.color), trim = toon(out.trim);
  const A = { root, rig };
  // legs
  const mkLeg = sx => { const g = new THREE.Group(); g.position.set(sx, .42, 0); const l = new THREE.Mesh(G.leg, look.outfit === 'aodai' ? toon('#ffffff') : skin); l.position.y = -.18; g.add(l); const s = new THREE.Mesh(G.shoe, toon('#5a3a2a')); s.scale.set(1, .7, 1.3); s.position.set(0, -.38, .04); g.add(s); rig.add(g); return g; };
  A.legL = mkLeg(.13); A.legR = mkLeg(-.13);
  // body
  const torso = new THREE.Group(); torso.position.y = .42; rig.add(torso); A.torso = torso;
  if (look.outfit === 'aodai') {
    const b = new THREE.Mesh(G.aodai, cloth); b.position.y = .4; torso.add(b);
    const t = new THREE.Mesh(G.belt, trim); t.rotation.x = Math.PI / 2; t.position.y = .85; t.scale.setScalar(.78); torso.add(t);
  } else {
    const b = new THREE.Mesh(G.body, cloth); b.position.y = .5; torso.add(b);
    if (look.outfit === 'dress' || look.outfit === 'sunny') { const s = new THREE.Mesh(G.skirt, cloth); s.position.y = .22; torso.add(s); }
    const belt = new THREE.Mesh(G.belt, trim); belt.rotation.x = Math.PI / 2; belt.position.y = .3; belt.scale.setScalar(1.03); torso.add(belt);
    if (look.outfit === 'overalls') [.13, -.13].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .02), trim); s.position.set(x, .55, .29); torso.add(s); });
    if (look.outfit === 'tunic') { const c = new THREE.Mesh(new THREE.TorusGeometry(.2, .05, 6, 16), trim); c.rotation.x = Math.PI / 2; c.position.y = .8; torso.add(c); }
  }
  const mkArm = sx => { const g = new THREE.Group(); g.position.set(sx * .34, .74, 0); const a = new THREE.Mesh(G.arm, cloth); a.position.y = -.18; g.add(a); const h = new THREE.Mesh(G.hand, skin); h.position.y = -.42; g.add(h); g.rotation.z = sx * .25; torso.add(g); return g; };
  A.armL = mkArm(1); A.armR = mkArm(-1);
  // head
  const head = new THREE.Group(); head.position.y = 1.46; rig.add(head); A.head = head;
  head.add(new THREE.Mesh(G.head, skin));
  A.faceMat = new THREE.MeshToonMaterial({ map: faceTexture(look, photo), transparent: true, alphaTest: .02 });
  const face = new THREE.Mesh(G.face, A.faceMat); head.add(face);
  const hc = new THREE.Mesh(G.hairCap, hairM); hc.rotation.x = -.35; hc.position.set(0, .03, -.04); head.add(hc);
  if (look.hairStyle === 'long') { const hb = new THREE.Mesh(G.hairBack, hairM); hb.scale.set(1, 1.35, 1); hb.position.y = -.12; head.add(hb); }
  if (look.hairStyle === 'buns') [-1, 1].forEach(s => { const b = new THREE.Mesh(G.bun, hairM); b.position.set(s * .42, .3, -.1); head.add(b); });
  if (look.hairStyle === 'spiky') for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(G.spike, hairM); sp.position.set((i - 2) * .16, .48, -.1 - Math.abs(i - 2) * .04); sp.rotation.z = (2 - i) * .25; head.add(sp); }
  // hat
  const hat = new THREE.Group(); head.add(hat);
  if (look.hat === 'nonla') { const n = new THREE.Mesh(G.nonla, toon('#ecd9a0')); n.position.y = .55; hat.add(n); const st = new THREE.Mesh(new THREE.TorusGeometry(.5, .015, 4, 24), toon('#c94a4a')); st.rotation.x = Math.PI / 2; st.position.y = .38; hat.add(st); }
  if (look.hat === 'cap') { const c = new THREE.Mesh(G.cap, toon('#e8434a')); c.position.y = .06; hat.add(c); const b = new THREE.Mesh(G.brim, toon('#e8434a')); b.position.set(0, .2, .42); b.rotation.y = Math.PI / 2 * 0; b.scale.set(1.2, 1, 1.6); hat.add(b); }
  if (look.hat === 'crown') { const c = new THREE.Mesh(G.crown, toon('#ffcf3a', { side: THREE.DoubleSide, emissive: new THREE.Color('#5a3b00') })); c.position.y = .55; hat.add(c); }
  if (look.hat === 'bunny') [-1, 1].forEach(s => { const e = new THREE.Mesh(G.ear, toon('#ffffff')); e.position.set(s * .2, .7, -.05); e.rotation.z = -s * .2; hat.add(e); });
  if (look.hat === 'flower') for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(G.petal, toon(i % 2 ? '#ff7eb8' : '#ffd1e6')); p.position.set(.32 + Math.cos(i) * .1, .38 + Math.sin(i) * .1, .12); hat.add(p); }
  // glider (hidden until gliding)
  const glider = new THREE.Group(); glider.visible = false; glider.position.y = 2.6;
  const gm = new THREE.Mesh(G.glider, toon(GLIDERS[look.glider || 0], { side: THREE.DoubleSide })); gm.rotation.x = -Math.PI / 2 + .25; gm.scale.setScalar(1.2); glider.add(gm);
  [-.5, .5].forEach(x => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.1, 4), toon('#7a5236')); r.position.set(x, -.5, 0); r.rotation.z = x * .6; glider.add(r); });
  rig.add(glider); A.glider = glider;
  A.anim = (state, t, speed) => animate(A, state, t, speed);
  return A;
}

export function animate(A, state, t, speed = 0) {
  const sw = Math.sin(t * (6 + speed * 1.2)) * Math.min(1, speed / 4);
  A.rig.rotation.set(0, 0, 0); A.rig.position.y = 0; A.glider.visible = false;
  A.legL.rotation.set(0, 0, 0); A.legR.rotation.set(0, 0, 0); A.armL.rotation.set(0, 0, .25); A.armR.rotation.set(0, 0, -.25);
  A.head.rotation.set(0, 0, 0);
  switch (state) {
    case 'walk':
      A.legL.rotation.x = sw * .8; A.legR.rotation.x = -sw * .8; A.armL.rotation.x = -sw * .7; A.armR.rotation.x = sw * .7;
      A.rig.position.y = Math.abs(Math.sin(t * (6 + speed * 1.2))) * .08 * Math.min(1, speed / 4); A.rig.rotation.x = Math.min(.15, speed * .015);
      break;
    case 'air': A.legL.rotation.x = .5; A.legR.rotation.x = -.3; A.armL.rotation.z = 1.2; A.armR.rotation.z = -1.2; break;
    case 'glide': A.glider.visible = true; A.armL.rotation.z = 2.6; A.armR.rotation.z = -2.6; A.legL.rotation.x = .3; A.legR.rotation.x = .2; A.rig.rotation.x = .15; A.rig.position.y = Math.sin(t * 2) * .05; break;
    case 'swim': A.rig.rotation.x = 1.1; A.rig.position.y = -.9; A.armL.rotation.x = Math.sin(t * 5) * 1.5; A.armR.rotation.x = -Math.sin(t * 5) * 1.5; A.legL.rotation.x = Math.sin(t * 8) * .5; A.legR.rotation.x = -Math.sin(t * 8) * .5; break;
    case 'climb': A.armL.rotation.x = -2.6 + Math.sin(t * 6) * .5; A.armR.rotation.x = -2.6 - Math.sin(t * 6) * .5; A.legL.rotation.x = Math.sin(t * 6) * .5; A.legR.rotation.x = -Math.sin(t * 6) * .5; break;
    case 'ride': A.legL.rotation.set(-1.2, 0, .5); A.legR.rotation.set(-1.2, 0, -.5); A.rig.position.y = Math.abs(Math.sin(t * 7)) * .06 * Math.min(1, speed / 3); A.armL.rotation.x = -.6; A.armR.rotation.x = -.6; break;
    case 'cheer': A.armL.rotation.z = 2.7 + Math.sin(t * 10) * .2; A.armR.rotation.z = -2.7 - Math.sin(t * 10) * .2; A.rig.position.y = Math.abs(Math.sin(t * 8)) * .25; break;
    case 'wave': A.armR.rotation.z = -2.5 + Math.sin(t * 10) * .4; A.head.rotation.z = Math.sin(t * 3) * .1; break;
    default: A.rig.position.y = Math.sin(t * 2) * .02; A.armL.rotation.z = .25 + Math.sin(t * 2) * .04; A.armR.rotation.z = -.25 - Math.sin(t * 2) * .04;
  }
}

// The wise owl guide.
export function buildOwl() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.9, 20, 16), toon('#a0724a')); body.scale.set(1, 1.2, .9); body.position.y = 1.1; g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(.65, 16, 12), toon('#f2dcb0')); belly.scale.set(1, 1.2, .6); belly.position.set(0, 1, .45); g.add(belly);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.27, 14, 10), toon('#ffffff')); eye.position.set(s * .3, 1.75, .62); g.add(eye);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), toon('#2b1a2e')); pu.position.set(s * .3, 1.75, .85); g.add(pu);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(.15, .45, 5), toon('#7a5236')); tuft.position.set(s * .55, 2.35, 0); tuft.rotation.z = -s * .4; g.add(tuft);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), toon('#7a5236')); wing.scale.set(.4, 1, .8); wing.position.set(s * .85, 1.1, 0); g.add(wing);
  });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 6), toon('#ffb52e')); beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.5, .9); g.add(beak);
  const glasses = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 6, 20), toon('#3a2a20')); glasses.position.set(.3, 1.75, .66); g.add(glasses);
  const g2 = glasses.clone(); g2.position.x = -.3; g.add(g2);
  const sh = blobShadow(); sh.scale.setScalar(1.6); g.add(sh);
  return g;
}

// A gourd-shaped collector who loves Leafies.
export function buildGourd() {
  const g = new THREE.Group();
  const lo = new THREE.Mesh(new THREE.SphereGeometry(.9, 18, 14), toon('#e2b84a')); lo.position.y = .9; g.add(lo);
  const hi = new THREE.Mesh(new THREE.SphereGeometry(.6, 18, 14), toon('#e8c45a')); hi.position.y = 2.1; g.add(hi);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .4, 6), toon('#6a8a3a')); stem.position.y = 2.8; g.add(stem);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), toon('#5fbf4a')); leaf.scale.set(1.4, .3, .8); leaf.position.set(.25, 2.9, 0); g.add(leaf);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), toon('#2b1a2e')); e.position.set(s * .2, 2.15, .55); g.add(e); });
  const m = new THREE.Mesh(new THREE.TorusGeometry(.12, .03, 6, 12, Math.PI), toon('#a33b52')); m.rotation.z = Math.PI; m.position.set(0, 1.98, .57); g.add(m);
  const sh = blobShadow(); sh.scale.setScalar(1.8); g.add(sh);
  return g;
}
export const spriteGlow = c => glow(c);

// The story films (round R pilot): one script per page of a tale, played by js/film.js while the narrator
// reads the page. Each script builds its set, places the actors and says what happens and when (seconds
// from the start of the page). Pages stand alone, so ◀ ▶ can jump to any page.
// The child helps on two pages of each film: S.help(time, English, Vietnamese, what happens after the tap).
import { SETS as L, PROPS as Pp, LOOK, G3 } from '../film.js';
import { THREE, P, merge } from '../gfx.js';

const PI = Math.PI, H = PI / 2;
// the cast
const AN = LOOK({ style: 'tunic', color: '#8a5a32', hairStyle: 'short', skin: '#d8a070' });
const WIFE = LOOK({ style: 'aodai', color: '#b8573a', hairStyle: 'buns', skin: '#f0c098' });
const SON = LOOK({ style: 'shirt', color: '#f2e2b8', hairStyle: 'spiky', skin: '#e0aa80' });
const KING = LOOK({ style: 'tunic', color: '#e8b62a', hat: 'crown', skin: '#e0aa80' });
const GUARD = LOOK({ style: 'tunic', color: '#c62f2f', hat: 'silkcap' });
const SAILOR = (c, hat = 'nonla') => LOOK({ style: 'shirt', color: c, hat, skin: '#c89060' });
const MOTHER = LOOK({ style: 'aodai', color: '#6a4a3a', hairStyle: 'buns', hair: '#cfcfcf', skin: '#e0aa80' });
const GIONG = LOOK({ style: 'shirt', color: '#e8d8a8', hairStyle: 'short', skin: '#e0aa80' });
const HERO = LOOK({ style: 'tunic', color: '#7a8088', back: 'cape', hairStyle: 'short', skin: '#e0aa80' });
const MESSENGER = LOOK({ style: 'tunic', color: '#c62f2f', hat: 'silkcap', skin: '#d8a070' });
const VILLAGER = (style, color, hat = 'nonla', hairStyle = 'buns') => LOOK({ style, color, hat, hairStyle, skin: '#d8a070' });
const ENEMY = LOOK({ style: 'tunic', color: '#3a3a48', hairStyle: 'spiky', skin: '#c89070' });

// things on the water bob up and down with the waves
function afloat(S, model, x, z, yaw = 0) {
  const g = new THREE.Group(); g.add(model); S.add(g, x, -.3, z, yaw);
  S.every((dt, time) => { model.position.y = Math.sin(time * 1.5 + x) * .08; model.rotation.z = Math.sin(time * 1.1) * .035; model.rotation.x = Math.sin(time * .9) * .02; });
  return g;
}
// put an actor somewhere in a moving thing (a boat, a horse); 'yaw' is relative to it
function board(a, parent, pos, yaw = 0, scale) { parent.add(a.o); a.o.position.set(...pos); a.o.rotation.set(0, yaw, 0); if (scale) a.o.scale.setScalar(scale); }
// get off: back into the world (keeps where it is on screen), then hop to a spot
function hopOff(S, a, t, to, yaw) {
  S.drop(a.o, t); S.move(a.o, t + .01, .6, [to[0], 0, to[1]], undefined, .5);
  S.at(t + .02, () => { a.o.rotation.set(0, yaw, 0); });
  a.px = to[0]; a.pz = to[1]; a.yaw = yaw;
  return t + .62;
}
const isle = (S, hut = true) => {
  S.sky('#6fc0ee', '#d8f0ff'); L.sea(S); L.island(S); L.sun(S, 70, 45, -160, 9);
  L.palm(S, -7, -4, .35); L.palm(S, 6, -6, .25, 1); L.palm(S, 9.5, 1, .45, 2); L.palm(S, -10, 3, .3, 3);
  L.clouds(S, [[-50, 26, -100, 2.2], [10, 32, -120, 2.6], [60, 24, -90, 1.8]]);
  if (hut) L.hut(S, -5.5, -1.5, .4);
};
const village = (S, house = [0, -6]) => {
  S.sky('#7cc8f0', '#e8f6ff'); L.ground(S, '#8fcf6a'); L.mountains(S, -110); L.sun(S, -60, 55, -170, 9);
  L.clouds(S, [[-40, 28, -90, 2], [30, 34, -110, 2.4]]);
  if (house) L.house(S, house[0], house[1]);
  L.bamboo(S, -9, -3); L.bamboo(S, 9.5, -4, '#5fae4a', 6); L.bamboo(S, -13, 5, '#5fae4a', 6, 6); L.bamboo(S, 13, 6, '#5fae4a', 8);
  L.banyan(S, -16, -12, 1.1); L.paddy(S, 20, 2, 10, 9);
  S.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 3).rotateX(-H), new THREE.MeshToonMaterial({ color: '#d8bf8a' })), 0, .005, 9); // the village road
};
// day passes into night and back (n times), from time t, each day 'day' seconds
function days(S, t, n, day = 1.8) {
  for (let i = 0; i < n; i++) {
    const a = t + i * day;
    S.skyTo(a, day * .3, '#f09a5a', '#ffd8a8'); S.skyTo(a + day * .3, day * .25, '#141a44', '#34406e'); S.lightTo(a + day * .3, day * .25, .25, .35);
    S.skyTo(a + day * .7, day * .3, '#6fc0ee', '#d8f0ff'); S.lightTo(a + day * .7, day * .3, 1.05, .85);
  }
  return t + n * day;
}
const tint = (clump, k, from = '#5fae4a', to = '#e8c43a') => { const [st, lf] = clump.userData.mats; st.color.set(from).lerp(new THREE.Color(to), k); lf.color.set('#3a8a36').lerp(new THREE.Color('#d8a82a'), k); };

export const FILMS = {
  // ---------------- Sự tích dưa hấu (The First Watermelon) ----------------
  duahau: { pages: [
    // 1. The family is taken to a lonely sandy island and left there.
    S => {
      isle(S, false);
      const boat = afloat(S, Pp.boat(7), 0, 42, PI);
      const an = S.person(AN, 0, 0, PI), wife = S.person(WIFE, 0, 0, PI), son = S.person(SON, 0, 0, PI, .68), g1 = S.person(GUARD, 0, 0, 0), g2 = S.person(GUARD, 0, 0, 0);
      [[an, -.5, -.8], [wife, .5, -.5], [son, 0, -1.6], [g1, -.5, 1.6], [g2, .5, 1.9]].forEach(([a, x, z]) => board(a, boat.children[0], [x, .4, z], 0));
      S.mood(an, 0, 'sad'); S.mood(wife, 0, 'sad'); S.mood(son, 0, 'sad');
      S.move(boat, 0, 4.5, [0, -.3, 15.6], t => 1 - (1 - t) ** 2);
      S.shot([16, 7, 56], [0, 1, 34]);
      S.cam(0, 4.4, [9, 4.5, 27], [0, 1, 15]);
      S.do(g1, 4, 'point', 1.5);
      hopOff(S, an, 4.6, [-1.2, 11.4], 0); hopOff(S, wife, 4.9, [.2, 11.6], 0); hopOff(S, son, 5.2, [1.2, 11.2], 0);
      S.cam(4.6, 1.6, [8, 2.6, 13.5], [0, 1, 11.4]);
      S.tw(6, 6, k => { boat.position.z = 15.6 + k * 26; boat.rotation.y = PI - k * PI; }, t => t * t);
      S.face(son, 6.2, [.2, 11.6]); S.do(son, 6.6, 'hug', 3); S.do(wife, 6.6, 'sad', 4);
      S.cam(6.6, 3, [0, 2.2, 17.5], [0, 1, 11.4]);
      S.face(an, 9.4, PI - .8, .8); S.face(an, 10.4, PI + .8, .9); S.face(an, 11.4, .5, .7);
      S.mood(an, 11.6, 'smile'); S.talk(an, 11.8, 1.6); S.do(an, 11.8, 'talk', 1.6); S.mood(wife, 12.6, 'smile'); S.mood(son, 12.8, 'smile');
      S.cam(10.8, 1.8, [-.4, 1.6, 14], [-1, 1.25, 11.4]);
      S.at(13.5, () => { });
    },
    // 2. Birds eat black seeds and drop them on the sand.
    S => {
      isle(S);
      const an = S.person(AN, 2, 5, 0);
      const wild = Pp.melonHalves(.3); S.add(wild, -4.4, 0, -.2); wild.userData.halves.forEach((h, i) => { h.position.x = (i ? 1 : -1) * .3; h.rotation.z = (i ? -1 : 1) * 1.2; });
      const birds = [0, 1, 2].map(i => { const b = Pp.bird(['#3a3a44', '#5a4a3a', '#3a4a5a'][i]); S.add(b, -32 - i * 3, 11 + i, -12); return b; });
      S.shot([2.4, 1.8, 11], [2, 1.2, 5]);
      S.do(an, 0, 'stretch', 1.6); S.mood(an, 0, 'smile');
      birds.forEach((b, i) => {
        const land = [-4.6 + i * .5, 0, .6 + (i % 2) * .4];
        S.at(.4, () => { b.rotation.y = Math.atan2(land[0] - b.position.x, land[2] - b.position.z); });
        S.move(b, .4 + i * .3, 3.6, land);
        S.at(4.1 + i * .3, () => { b.userData.flap = .05; b.userData.peck = 1; });
        S.at(7 + i * .2, () => { b.userData.flap = 1; b.userData.peck = 0; b.rotation.y = Math.atan2(6, 5); });
        S.move(b, 7 + i * .2, 1.6, [1.2 + i * .5, 3.6 + i * .2, 5.4 + i * .3]);
        S.at(8.7 + i * .2, () => { b.rotation.y = Math.atan2(30, -35); });
        S.move(b, 8.7 + i * .2, 3.5, [30 + i * 4, 16, -32], t => t * t);
      });
      S.every((dt, time) => birds.forEach((b, i) => { b.rotation.x = b.userData.peck ? Math.max(0, Math.sin(time * 9 + i * 2)) * .6 : 0; }));
      // black seeds fall from the birds and bounce on the sand
      const seeds = [0, 1, 2, 3, 4, 5].map(i => { const s = Pp.seed(); s.visible = false; S.add(s, 1.2 + (i % 3) * .5, 3.5, 5.4 + (i >> 1) * .15); return s; });
      seeds.forEach((s, i) => { const t = 8.2 + i * .12, x = 1 + (i % 3) * .35, z = 6.1 + (i % 2) * .3; S.show(s, t); S.move(s, t, .55, [x, 0, z], k => k * k); S.move(s, t + .55, .3, [x + .05, 0, z + .04], undefined, .12); });
      S.face(an, 3, [-4.5, .6]); S.do(an, 4.6, 'point', 2.2);
      S.cam(1.6, 2.4, [-1.5, 3.2, 8], [-5, 1.6, -1]);
      S.cam(4.4, 1.4, [-2.6, 1, 3.2], [-4.4, .2, .4]);
      S.cam(6.8, 1.6, [5, 2.6, 12], [1.5, 1.8, 5.5]);
      S.face(an, 8.2, [1.4, 6.3]);
      S.cam(8.9, 1.2, [2.4, 1.1, 8.9], [1.3, .1, 6.2]);
      S.walk(an, 9.4, [1.35, 5.6]);
      S.do(an, 10.2, 'pick', 1.8);
      const inHand = Pp.seed(); inHand.visible = false; S.grab(an, 11, inHand, [0, -.47, .1]); S.show(inHand, 11); S.show(seeds[1], 11, false);
      S.do(an, 12, 'carry', 2.5); S.mood(an, 12, 'happy');
      S.cam(11.9, 1.4, [2.6, 1.6, 8.6], [1.4, 1.1, 5.6]);
    },
    // 3. He plants the seeds and waters them every day; green vines grow everywhere.
    S => {
      isle(S);
      const an = S.person(AN, 0, 3.3, 0);
      const row = [-1, -.5, 0, .5, 1].map(x => [x, 4.6]);
      const mounds = row.map(([x, z]) => { const m = new THREE.Mesh(G3.S(.16, 8, 6), new THREE.MeshToonMaterial({ color: '#c8a868' })); m.scale.set(1, .35, 1); m.visible = false; return S.add(m, x, 0, z); });
      const seeds = row.map(([x, z]) => { const s = Pp.seed(); s.visible = false; return S.add(s, x, .04, z); });
      S.shot([2.6, 1.7, 8.2], [0, .6, 4]);
      S.do(an, .3, 'dig', 2.2); mounds.forEach((m, i) => S.show(m, .6 + i * .35));
      S.cam(1, 1.4, [1, 1, 6.8], [0, .15, 4.6]);
      S.do(an, 2.6, 'plant', 1.4); seeds.forEach((s, i) => { S.show(s, 2.7 + i * .2); S.show(s, 3.6, false); });
      const gourd = Pp.gourd(); S.add(gourd, -.8, .1, 3); S.grab(an, 4, gourd, [0, -.5, .1]);
      const drops = Pp.drops(18, .9); S.add(drops, 0, .95, 4.55);
      S.do(an, 4.2, 'water', 2.2); S.show(drops, 4.5); S.show(drops, 6.2, false); S.do(an, 6.4, 'water');
      S.cam(4, 1.4, [3.2, 1.9, 8.6], [0, .7, 4.2]);
      const sp = Pp.sparkle(); S.add(sp, 0, 0, 4.6);
      S.help(6.5, 'Tap to water the seeds!', 'Chạm để tưới nước cho hạt nhé!', t => { S.do(an, t, 'water', 1.6); S.show(drops, t); S.show(drops, t + 1.5, false); S.show(sp, t + .6); S.show(sp, t + 2.4, false); }, [0, .4, 4.6], 1.8);
      // days go by; sprouts, then vines everywhere
      S.walk(an, 7.2, [-2.6, 2.6]); S.face(an, 8.6, [0, 4.6]);
      S.cam(7, 2.4, [0, 6.5, 15], [0, 0, 3.5]);
      const sunDisc = L.sun(S, -40, 20, -60, 4); S.tw(7.6, 6, k => { sunDisc.position.set(-40 + k * 80, 20 + Math.sin(k * PI * 3) * 14, -60); }, t => t);
      days(S, 7.6, 3, 1.9);
      const sprouts = row.map(([x, z]) => { const s = Pp.sprout(); s.scale.setScalar(0); return S.add(s, x, 0, z); });
      sprouts.forEach((s, i) => S.scale(s, 8.4 + i * .15, .8, 0, 1.4, undefined));
      const vines = Pp.vines(54, 4.2); S.add(vines, 0, 0, 4.6);
      S.tw(10, 3.8, k => vines.userData.grow(k), t => t);
      sprouts.forEach(s => S.scale(s, 11, .6, 1.4, 0));
      S.do(an, 13.4, 'cheer', 2); S.mood(an, 13.4, 'happy');
      S.cam(12.6, 2.2, [4.5, 3.2, 11], [-.8, .4, 4]);
    },
    // 4. Big round fruits appear: green outside, red and sweet inside.
    S => {
      isle(S);
      const vines = Pp.vines(54, 4.2); S.add(vines, 0, 0, 4.6); vines.userData.grow(1);
      const spots = [[.6, 5.4, .5], [-1.8, 6.2, .42], [2.4, 3.6, .45], [-2.6, 3.2, .38], [1.6, 7.4, .4], [-.4, 8.2, .36]];
      const melons = spots.map(([x, z, r]) => { const m = Pp.melon(r); m.scale.setScalar(.05); return S.add(m, x, 0, z, x); });
      melons.forEach((m, i) => S.scale(m, .5 + i * .35, 2.2, .05, 1, k => 1 - (1 - k) ** 3));
      const an = S.person(AN, -.6, 3.6, 0), wife = S.person(WIFE, -8, 2.2, H), son = S.person(SON, -8.6, 3.2, H, .68);
      S.shot([0, 3.4, 13], [0, .4, 4.8]);
      S.cam(.8, 3, [2.6, 1.3, 9], [.4, .3, 5.4]);
      S.walk(wife, 1, [-1.9, 4.4], 1.6); S.walk(son, 1.2, [-1.2, 5.7], 1.8);
      S.do(an, 3.4, 'surprised', 1.4); S.mood(an, 3.4, 'o'); S.mood(wife, 3.4, 'o'); S.mood(son, 3.4, 'o');
      S.walk(an, 4.6, [.3, 4.5]); S.face(an, 5.2, [.6, 5.4]); S.do(an, 5.5, 'kneel');
      S.cam(4.6, 1.4, [2, 1.5, 8.2], [.4, .6, 5]);
      const halves = Pp.melonHalves(.5); halves.visible = false; S.add(halves, .6, 0, 5.4, .6);
      const sp = Pp.sparkle('#ff9ec8'); S.add(sp, .6, .3, 5.4);
      const slices = [an, wife, son].map(() => { const s = Pp.slice(); s.visible = false; return s; });
      S.help(6, 'Tap the watermelon to open it!', 'Chạm vào quả dưa để bổ ra nào!', t => {
        S.show(melons[0], t, false); S.show(halves, t); S.show(sp, t); S.show(sp, t + 1.6, false);
        halves.userData.halves.forEach((h, i) => { const s = i ? 1 : -1; S.tw(t, .7, k => { h.position.x = s * (.02 + k * .3); h.rotation.z = -s * k * 1.25; }, k => 1 - (1 - k) ** 3); });
        S.cam(t, .8, [1.5, 1.1, 7.2], [.6, .3, 5.4]);
        S.mood(an, t + .4, 'happy'); S.mood(wife, t + .4, 'happy'); S.mood(son, t + .4, 'happy');
        S.do(an, t + 1.2, 'idle');
        [an, wife, son].forEach((a, i) => { S.grab(a, t + 1.4, slices[i], [0, -.5, .12]); S.show(slices[i], t + 1.4); S.do(a, t + 1.6, 'eat', 4); });
        S.cam(t + 1.6, 1.8, [-.2, 1.6, 9.4], [-.6, 1, 5]);
        S.do(son, t + 5.8, 'cheer', 2); S.talk(wife, t + 5.8, 1.5);
      }, [.6, .4, 5.4]);
    },
    // 5. He sends melons out to sea; sailors find them and come to trade.
    S => {
      isle(S);
      const sea = S.root.children[0];
      const an = S.person(AN, 0, 7.6, 0), m = Pp.melon(.42);
      S.add(m); S.grab(an, 0, m, [0, .5, .42], 'torso'); S.do(an, 0, 'carry');
      S.shot([3.6, 1.8, 13.5], [0, 1, 8]);
      S.walk(an, .5, [0, 11]); S.do(an, 3.4, 'carry'); S.do(an, 3.6, 'kneel');
      S.cam(2.5, 1.5, [2.6, 1.5, 14.2], [0, .6, 11.2]);
      const boat = afloat(S, Pp.boat(7, '#c8783a'), 6, 56, PI);
      const s1 = S.person(SAILOR('#3b6fe0'), 0, 0, 0), s2 = S.person(SAILOR('#5fa84a', 'none'), 0, 0, 0);
      board(s1, boat.children[0], [0, .4, 2.3], 0); board(s2, boat.children[0], [.4, .4, -1.4], 0);
      S.help(4, 'Tap to push the melon out to sea!', 'Chạm để thả quả dưa ra biển nào!', t => {
        S.do(an, t, 'throw', .5); S.drop(m, t + .2); S.move(m, t + .21, .8, [.3, -.2, 14], undefined, .8);
        let floating = false; S.at(t + 1, () => { floating = true; });
        S.every((dt, time) => { if (floating) { m.position.y = sea.userData.waveAt(m.position.x, m.position.z, time) - .25; m.rotation.z = Math.sin(time * 1.4) * .2; } });
        S.move(m, t + 1, 7.5, [5.6, -.2, 52.5], k => k);
        S.do(an, t + 1.2, 'wave', 3);
        S.cam(t + .8, 1.6, () => [m.position.x + 2.5, 1.8, m.position.z + 6], () => [m.position.x, 0, m.position.z]);
        // the sailor sees it and lifts it out of the water
        S.at(t + 6, () => { s1.mood = 'o'; }); S.do(s1, t + 6.4, 'pick', 1.4);
        S.at(t + 8.5, () => { floating = false; }); S.grab(s1, t + 8.5, m, [0, .5, .42], 'torso'); S.do(s1, t + 8.6, 'carry', 2.5); S.mood(s1, t + 9, 'happy'); S.talk(s2, t + 9, 1.5);
        S.cam(t + 8.4, 1.4, [10, 3, 46], [6, 1.6, 54]);
        // they sail to the island to trade
        S.tw(t + 10.5, 5, k => { boat.position.z = 56 - k * 41.5; boat.position.x = 6 - k * 4.5; }, k => 1 - (1 - k) ** 2);
        S.walk(an, t + 10, [.4, 10.2]); S.do(an, t + 11.5, 'wave', 3); S.mood(an, t + 11.5, 'happy');
        S.cam(t + 10.5, 4, [14, 5.5, 30], [1.5, .8, 14]);
        const sack = Pp.sack();
        hopOff(S, s2, t + 15.6, [1.4, 12], PI); S.add(sack); sack.visible = false;
        S.grab(s2, t + 16.3, sack, [0, .45, .4], 'torso'); S.show(sack, t + 16.3); S.do(s2, t + 16.3, 'give', 1.6); S.face(an, t + 16, [1.4, 12]);
        S.grab(an, t + 17.9, sack, [0, .45, .4], 'torso'); S.do(an, t + 17.9, 'carry', 2); S.talk(an, t + 17.9, 1.6); S.mood(s2, t + 16, 'happy');
        S.cam(t + 15.4, 1.6, [4, 1.9, 15.6], [.8, 1, 10.8]);
      }, [0, .6, 11.4]);
    },
    // 6. The king welcomes him home; that is why we eat watermelon at Tết.
    S => {
      S.sky('#9fd4f4', '#fff1d8'); L.ground(S, '#cbb88a'); L.palace(S); L.blossom(S, -8, -2.5); L.blossom(S, 8, -2.5);
      const lanterns = [-6, -3, 0, 3, 6].map(x => L.lantern(S, x, 4.3, -6.2));
      const king = S.person(KING, 0, -5.9, 0), g1 = S.person(GUARD, -3.3, -6, 0), g2 = S.person(GUARD, 3.3, -6, 0);
      [king, g1, g2].forEach(a => { a.o.position.y = .5; });
      [g1, g2].forEach(g => { const f = Pp.flag('#e8b62a'); S.add(f); S.grab(g, 0, f, [0, -.45, .05]); });
      const an = S.person(AN, 0, 6, PI), wife = S.person(WIFE, -1.2, 6.6, PI), son = S.person(SON, 1.1, 6.4, PI, .68), m = Pp.melon(.42);
      S.add(m); S.grab(an, 0, m, [0, .5, .42], 'torso'); S.do(an, 0, 'carry');
      S.shot([0, 4.2, 20], [0, 2, -3]);
      S.walk(an, .3, [0, -3.4]); S.walk(wife, .5, [-1.3, -2.6]); S.walk(son, .6, [1.2, -2.7]);
      S.do(an, 7.3, 'carry');
      S.cam(3, 2.5, [5, 2.2, 2.5], [0, 1.4, -4.5]);
      [an, wife, son].forEach(a => S.do(a, 7.6, 'bow', 2));
      S.mood(king, 8, 'happy'); S.talk(king, 8.4, 2.2); S.do(king, 8.4, 'talk', 2.2);
      S.cam(7.8, 1.6, [1.2, 2.4, -2], [0, 1.9, -5.9]);
      S.walk(an, 10.2, [0, -4.9], 1); S.do(an, 11.8, 'give', 1);
      S.grab(king, 12.6, m, [0, .5, .42], 'torso'); S.do(king, 12.6, 'carry', 2); S.do(an, 12.8, 'idle');
      S.cam(10.4, 1.6, [3, 2, -2], [0, 1.3, -5.6]);
      // Tết: lanterns glow, fireworks, everyone cheers
      const fw = [[0, 13, -16], [-9, 11, -15], [9, 12, -15]].map(p => Pp.fireworks(S, ...p));
      S.skyTo(14, 2.5, '#20225a', '#f09a5a'); S.lightTo(14, 2.5, .55, .6);
      lanterns.forEach(l => S.at(14.5, () => { l.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ vertexColors: true }); o.material.userData.film = true; } }); }));
      fw.forEach((f, i) => S.show(f, 15 + i * .5));
      [an, wife, son].forEach((a, i) => { S.mood(a, 14.6, 'happy'); S.do(a, 15.2 + i * .2, 'cheer', 3); });
      S.cam(14, 3, [0, 3, 13], [0, 5, -7]);
      S.at(19, () => { });
    }
  ] },

  // ---------------- Thánh Gióng (Saint Gióng) ----------------
  thanhgiong: { pages: [
    // 1. An old mother has a little boy who does not speak or walk, even at three.
    S => {
      village(S);
      S.add(Pp.mat(), 0, 0, 1.8);
      const boy = S.person(GIONG, 0, 2.2, 0, .5), mom = S.person(MOTHER, -.9, 1.9, H);
      S.do(boy, 0, 'lie'); S.do(mom, 0, 'sitground'); S.mood(mom, 0, 'sad');
      S.shot([7, 5, 16], [0, 1, 0]);
      S.cam(1.5, 2.5, [2.4, 1.3, 5.6], [-.3, .4, 1.9]);
      S.do(mom, 3.6, 'give', 1.8); S.talk(mom, 3.6, 1.8); S.do(mom, 5.4, 'sitground');
      S.cam(5.6, 2.6, [0, 6.5, 19], [0, 2, 0]);
      const sunDisc = L.sun(S, -50, 25, -80, 5); S.tw(5.6, 5.4, k => { sunDisc.position.set(-50 + k * 100, 25 + Math.sin(k * PI * 3) * 16, -80); }, t => t);
      days(S, 5.6, 3, 1.8);
      S.scale(boy.o, 5.6, 5.4, .5, .56);
      S.cam(11.2, 1.6, [-.1, 1.15, 4.2], [-.9, .75, 1.9]);
      S.at(13.5, () => { });
    },
    // 2. The king's messenger calls for help, and the boy speaks for the first time.
    S => {
      village(S);
      S.add(Pp.mat(), 0, 0, 1.8);
      const boy = S.person(GIONG, 0, 2.2, 0, .56), mom = S.person(MOTHER, -.9, 1.9, H);
      S.do(boy, 0, 'lie'); S.do(mom, 0, 'sitground'); S.mood(mom, 0, 'sad');
      const horse = Pp.horse('#8a5a3a'); S.add(horse, -30, 0, 9, H); horse.userData.gait = 1;
      const msg = S.person(MESSENGER, 0, 0, 0); board(msg, horse, [0, 1.18, -.05]); S.do(msg, 0, 'ride');
      const fl = Pp.flag('#e8b62a'); S.add(fl); S.grab(msg, 0, fl, [0, -.45, .05]);
      S.move(horse, 0, 6, [-3, 0, 9], k => k);
      S.at(6, () => { horse.userData.gait = 0; });
      S.talk(msg, 1.8, 4); S.do(msg, 2, 'ride');
      S.shot([-22, 3, 19], [-26, 1.6, 9]);
      S.cam(.2, 5.6, () => [horse.position.x + 5, 3, 18.5], () => [horse.position.x, 1.6, 9]);
      S.do(boy, 6.4, 'situp'); S.mood(boy, 6.4, 'o'); S.mood(mom, 6.4, 'o');
      S.cam(6.2, .7, [1, 1, 5], [0, .55, 2.2]);
      S.mood(boy, 7.2, 'smile'); S.talk(boy, 7.2, 3); S.do(boy, 7.2, 'point', 3);
      S.do(mom, 7, 'surprised', 1.6);
      S.walk(mom, 9, [-1.6, 7.4]); S.do(mom, 11.6, 'wave', 2); S.mood(mom, 11, 'happy');
      S.tw(10.6, .8, k => { horse.rotation.y = H + k * (PI - .3 - H); });
      S.talk(msg, 12, 1.6);
      S.cam(9.4, 2.2, [4, 3, 15.5], [-1.5, 1.2, 6]);
    },
    // 3. He eats bowl after bowl of rice and grows bigger and bigger.
    S => {
      village(S, [0, -7]);
      S.add(Pp.table(), 1.2, 0, 1.5);
      const boy = S.person(GIONG, 0, 1, 0, .56), mom = S.person(MOTHER, -1.8, -.2, .5);
      S.do(boy, 0, 'sitground');
      const bowl = Pp.bowl(); S.add(bowl); S.grab(boy, 0, bowl, [0, -.52, .1]); S.do(boy, .3, 'eat');
      const stack = [0, 1, 2, 3, 4, 5].map(i => { const b = Pp.bowl(false); b.visible = false; return S.add(b, 1.4 + (i % 2) * .04, .46 + i * .07, 1.5); });
      stack.forEach((b, i) => S.show(b, 1.6 + i * .7));
      const vs = [S.person(VILLAGER('aodai', '#3a7a6a'), -9, 6, H), S.person(VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), 9, 5, -H), S.person(VILLAGER('aodai', '#a8573a'), 8, 9, -H)];
      const loads = [Pp.pot(), Pp.basket(), Pp.pot()];
      vs.forEach((v, i) => { S.add(loads[i]); S.grab(v, 0, loads[i], [0, .3, .42], 'torso', .8); S.do(v, 0, 'carry'); });
      [[-2.2, 3.2], [2.6, 3.1], [1.2, 4.6]].forEach((p, i) => S.walk(vs[i], .2 + i * .3, p, 1.8));
      vs.forEach((v, i) => { S.face(v, 5, [0, 1]); S.drop(loads[i], 5.2, [vs[i].px * .8, 0, vs[i].pz - .5]); S.do(v, 5.2, 'idle'); });
      S.shot([0, 3, 10.5], [0, .8, 1.2]);
      S.cam(1.2, 1.6, [.7, .85, 3.4], [0, .55, 1]);
      S.scale(boy.o, 1.5, 4, .56, .85);
      S.cam(4.6, 1.6, [0, 2.4, 9], [0, .8, 1.2]);
      const sp = Pp.sparkle(); S.add(sp, 0, 0, 1);
      S.help(6, 'Tap to give him more rice!', 'Chạm để đưa thêm cơm cho cậu bé!', t => {
        S.do(vs[0], t, 'give', 1.2);
        S.show(sp, t + .3); S.scale(boy.o, t + .4, 2, .85, 1.7, k => 1 - (1 - k) ** 3);
        S.cam(t + .2, 3, [0, 3.4, 11.5], [0, 1.6, 1]);
        S.scale(boy.o, t + 2.8, 2.4, 1.7, 2.6, k => 1 - (1 - k) ** 3);
        vs.forEach((v, i) => { S.mood(v, t + 1, 'o'); S.do(v, t + 1, 'surprised', 1.6); S.mood(v, t + 4, 'happy'); S.do(v, t + 4.2 + i * .15, 'cheer', 2.6); });
        S.mood(mom, t + 1, 'o'); S.mood(mom, t + 3.5, 'happy'); S.mood(boy, t + 3, 'happy');
        S.cam(t + 3.2, 2.4, [0, 5.4, 15.5], [0, 2.4, 0]);
        S.show(sp, t + 5.2, false);
      }, [0, 1, 1]);
    },
    // 4. He becomes a giant, rides an iron horse that breathes fire and chases the enemies away.
    S => {
      village(S, [-16, 8]);
      L.paddy(S, -18, -16, 12, 10);
      const hero = S.person(HERO, 0, 0, 0, 2.4);
      const helmet = Pp.helmet(); S.add(helmet); S.grab(hero, 0, helmet, [0, .05, 0], 'head');
      const stick = Pp.stick(1.7); S.add(stick); S.grab(hero, 0, stick, [0, -.45, .06]);
      const sp = Pp.sparkle(); S.add(sp, 0, 0, 0); S.show(sp, 0); S.show(sp, 2.4, false); sp.scale.setScalar(2.5);
      S.do(hero, .2, 'stretch', 2); S.mood(hero, 0, 'happy');
      S.shot([0, 1.3, 9.5], [0, 3.4, 0]);
      const horse = Pp.horse('#6a7078', true); horse.scale.setScalar(2.4); S.add(horse, 16, 0, -4, -H); horse.userData.gait = 1;
      S.move(horse, 2.2, 3, [3, 0, -.6], k => k); S.at(5.2, () => { horse.userData.gait = 0; });
      S.cam(2.2, 2.2, [11, 4.5, 14], [4, 2.4, -1]);
      S.at(5.4, () => { board(hero, horse, [0, 1.18, -.05], 0, 1); hero.state = 'ride'; });
      S.tw(5.6, .6, k => { horse.rotation.y = -H - k * H; });
      S.tw(6, .8, k => { horse.rotation.x = -Math.sin(k * PI) * .35; });
      S.at(6.2, () => { horse.userData.fire.visible = true; });
      S.cam(5.4, 1.4, [9, 5, 9], [2.6, 5, -1]);
      S.at(7, () => { horse.userData.gait = 2; });
      S.move(horse, 7, 6, [0, 0, -27], k => k);
      S.cam(7, 1.4, () => [horse.position.x + 11, 8, horse.position.z + 13], () => [horse.position.x, 3, horse.position.z - 6]);
      // the enemies see the fire and run far away
      const foes = [-6, -3.6, -1.2, 1.2, 3.6, 6].map((x, i) => S.person(ENEMY, x, -34 - (i % 2) * 1.6, 0));
      S.cam(9.4, .6, [7, 3, -22], [0, 1.4, -34]);
      foes.forEach((f, i) => { S.mood(f, 9.6, 'o'); S.do(f, 9.6, 'surprised', 1); S.face(f, 10.6 + i * .08, PI, .3); S.walk(f, 11 + i * .1, [f.px * 1.4, -78], 6); });
      S.cam(11.6, 1.2, () => [horse.position.x + 11, 8, horse.position.z + 13], () => [horse.position.x, 3, horse.position.z - 8]);
      S.at(13, () => { horse.userData.gait = 0; }); S.at(16, () => { });
    },
    // 5. His iron stick breaks, so he pulls up bamboo; then he rides up the mountain and flies into the sky.
    S => {
      village(S, null);
      L.mountains(S, -130, '#6f98a8');
      const clumps = [[-4.6, -3.2], [-8, -5], [5.5, -6.5], [8.5, -2]].map(([x, z]) => L.bamboo(S, x, z, '#5fae4a', 7, 8));
      L.clouds(S, [[-12, 34, -100, 3], [8, 40, -110, 3.4], [0, 46, -96, 2.8], [20, 36, -104, 3]]);
      const horse = Pp.horse('#6a7078', true); horse.scale.setScalar(2.4); S.add(horse, 0, 0, 6, PI); horse.userData.fire.visible = true; horse.userData.gait = 2;
      const hero = S.person(HERO, 0, 0, 0, 1); board(hero, horse, [0, 1.18, -.05]); S.do(hero, 0, 'ride');
      const helmet = Pp.helmet(); S.add(helmet); S.grab(hero, 0, helmet, [0, .05, 0], 'head');
      const stick = Pp.stick(1.7); S.add(stick); S.grab(hero, 0, stick, [0, -.45, .06]);
      const foes = [-3, 0, 3, 5].map(x => S.person(ENEMY, x, -16, 0));
      S.shot([9, 5, 14], [0, 3.5, 0]);
      S.move(horse, 0, 1.6, [0, 0, 0], k => 1 - (1 - k) ** 2); S.at(1.6, () => { horse.userData.gait = 0; });
      // the stick snaps
      S.at(1.9, () => { S.root.attach(stick.userData.halves[1]); });
      S.tw(1.95, .9, (k, first) => { const b = stick.userData.halves[1]; if (first) b.userData.y0 = b.position.y; b.position.y = Math.max(.1, b.userData.y0 * (1 - k)); b.rotation.z = k * 1.4; }, k => k * k);
      S.mood(hero, 2, 'o'); S.cam(1.8, 1, [9, 6, 10], [0, 4.4, -.6]);
      S.tw(2.8, .8, k => { horse.rotation.y = PI + k * .75; }); S.mood(hero, 3.2, 'smile');
      S.cam(3, 1.4, [7, 5.5, 10], [-3.5, 3.5, -3]);
      const bam = clumps[0];
      S.help(3.6, 'Tap the bamboo to pull it up!', 'Chạm vào bụi tre để nhổ lên nào!', t => {
        S.do(hero, t, 'pull', 1.4); S.mood(hero, t, 'happy');
        S.tw(t + .2, 1.2, k => { bam.position.y = k * 2.4; bam.rotation.z = -k * .3; });
        S.at(t + 1.4, () => { hero.A.armR.attach(bam); bam.scale.setScalar(1 / 2.4 * .5); bam.position.set(0, -.42, .1); bam.rotation.set(PI, 0, 0); });
        S.do(hero, t + 1.5, 'swing', 3.4);
        S.tw(t + 1.6, 3, k => clumps.forEach(c => tint(c, k)), k => k);
        foes.forEach((f, i) => { S.mood(f, t + 1.6, 'o'); S.face(f, t + 2 + i * .1, PI, .3); S.walk(f, t + 2.3 + i * .1, [f.px * 1.5, -70], 6); });
        S.cam(t + 1.6, 1.6, [10, 6, 10], [-1, 4, -3]);
        // off to the mountain, and up into the sky
        S.tw(t + 5, .6, k => { horse.rotation.y = PI + .75 - k * .75; });
        S.at(t + 5.4, () => { horse.userData.gait = 2; });
        S.move(horse, t + 5.4, 3.6, [0, 0, -40], k => k);
        S.cam(t + 5.4, 1.4, () => [horse.position.x + 9, 7, horse.position.z + 14], () => [horse.position.x, 3, horse.position.z - 6]);
        const trail = Pp.sparkle('#ffe27a'); horse.add(trail); trail.position.set(0, .8, -.8);
        S.show(trail, t + 9);
        S.tw(t + 9, 5.4, k => { horse.position.set(0, k * k * 44, -40 - k * 56); horse.rotation.x = -.45 * Math.sin(Math.min(1, k * 2) * H); }, k => k);
        S.cam(t + 9, 2, [0, 5, -14], [0, 18, -70]);
        S.cam(t + 11.5, 3, [0, 8, -26], [0, 38, -96]);
        S.skyTo(t + 10, 3, '#ffb85a', '#fff0c8');
      }, [-4.6, 3, -3.2]);
    },
    // 6. The bamboo turned yellow from the horse's fire; he is a hero of Vietnam.
    S => {
      village(S, null);
      const clumps = [[-6.5, -1], [-9, 2.5], [6, -1.5], [9, 2], [-4, -9], [5, -10]].map(([x, z]) => L.bamboo(S, x, z, '#5fae4a', 7, 7));
      L.shrine(S, 0, -8);
      const sp = Pp.sparkle('#ffe27a'); S.add(sp, -6.5, 1, -1); sp.scale.setScalar(2);
      S.shot([-3.8, 2, 4], [-6.5, 3.2, -1]);
      S.cam(.5, 4.5, [-2.6, 3.2, 6], [-6.5, 3.6, -1]);
      S.show(sp, 1); S.tw(1, 4, k => clumps.forEach(c => tint(c, k)), k => k);
      S.show(sp, 5.4, false);
      const mom = S.person(MOTHER, -1.2, 12, PI), v1 = S.person(VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), 1.2, 12.6, PI), v2 = S.person(VILLAGER('aodai', '#a8573a'), 0, 13.4, PI), kid = S.person(SON, .5, 14, PI, .68);
      [[mom, [-1.2, -3.6]], [v1, [1.2, -3.6]], [v2, [-.4, -2.4]], [kid, [.7, -2.3]]].forEach(([a, p], i) => S.walk(a, 5.2 + i * .25, p, 2.6));
      S.cam(5.2, 2.6, [0, 4, 15], [0, 1.6, -3]);
      [mom, v1, v2, kid].forEach(a => { S.do(a, 11, 'bow', 2.4); S.mood(a, 13.6, 'happy'); });
      S.skyTo(10, 3.5, '#ff9a5a', '#ffe0a8'); S.lightTo(10, 3.5, .8, .7);
      S.cam(10.6, 2.2, [3.4, 2.2, 0], [0, 1.4, -5.5]);
      S.cam(13.6, 2.6, [0, 6, 16], [0, 4, -8]);
      S.at(16.4, () => { });
    }
  ] }
};

// ---------------- How-to guides (round R pilot) ----------------
// One page per card of the how-to (js/howto.js): the title, where the game comes from, each step, playing
// it for real, and "your turn". Village children show the game, acted out in the valley.
const TEO = LOOK({ style: 'shirt', color: '#ffb52e', hairStyle: 'spiky', skin: '#d8a070' });
const BONG = LOOK({ style: 'dress', color: '#ff7eb8', hairStyle: 'buns', skin: '#e0aa80' });
const LAN = LOOK({ style: 'overalls', color: '#3cc7e8', hairStyle: 'ponytail', skin: '#f0c098' });

// the Ô ăn quan yard: a banyan, the board in the dirt, Tèo on the near side and Bống on the far side
function quanYard(S, { drawn = true, stones = 5 } = {}) {
  S.sky('#7cc8f0', '#e8f6ff'); L.ground(S, '#8fcf6a'); L.banyan(S, -5, -5, .9); L.bamboo(S, 6, -6, '#5fae4a', 6, 6); L.house(S, 2, -12);
  const b = Pp.oanquan(); S.add(b, 0, 0, 0);
  if (!drawn) b.userData.lines.children.forEach(l => l.scale.set(.001, 1, .001));
  const pebbles = b.userData.sq.map(([x, z], i) => [...Array(stones)].map((_, j) => { const p = b.userData.pebble(i, j); p.position.set(x + Math.cos(j * 2.4) * .12, 0, z + Math.sin(j * 2.4) * .1); b.add(p); return p; }));
  const quan = [-1, 1].map(s => { const q = Pp.seed(); q.scale.setScalar(4); q.position.set(s * 1.82, .01, 0); b.add(q); return q; });
  const teo = S.person(TEO, 0, 1.25, PI, .72), bong = S.person(BONG, .3, -1.3, 0, .72);
  return { b, pebbles, quan, teo, bong };
}
export const GUIDES = {
  oanquan: { pages: [
    // the title: two friends at their board under the banyan
    S => { const { teo, bong } = quanYard(S); S.shot([3.2, 2.4, 4.6], [0, .4, 0]); S.cam(.3, 3, [2, 1.6, 3.2], [0, .3, 0]); S.do(teo, .6, 'wave', 2); S.do(bong, 1, 'wave', 2); S.mood(teo, 0, 'happy'); S.mood(bong, 0, 'happy'); S.at(3.4, () => { }); },
    // where it comes from: children draw the board on the ground and play with little stones
    S => {
      const { b, pebbles, quan, teo, bong } = quanYard(S, { drawn: false });
      pebbles.flat().concat(quan).forEach(p => { p.visible = false; });
      const stick = Pp.stick(.8, '#8a6a4a'); S.add(stick); S.grab(teo, 0, stick, [0, -.42, .1]);
      S.shot([2.6, 2.6, 3.4], [0, 0, .1]);
      S.do(teo, .2, 'dig', 3.6);
      b.userData.lines.children.forEach((l, i) => S.tw(.4 + i * .3, .45, k => { l.scale.set(Math.max(.001, k), 1, Math.max(.001, k)); }));
      S.cam(.4, 3.4, [-.4, 2.8, 2.6], [0, 0, 0]);
      S.do(bong, 1, 'pick', 3); S.mood(bong, 0, 'happy');
      pebbles.forEach((row, i) => row.forEach((p, j) => { const t = 3.4 + i * .18 + j * .04; S.show(p, t); const y = p.position.y; p.position.y = .8; S.move(p, t, .35, [p.position.x, y, p.position.z], k => k * k); }));
      quan.forEach((q, i) => S.show(q, 5.4 + i * .2));
      S.show(stick, 4.2, false); S.do(teo, 4.2, 'kneel');
      S.cam(4, 2, [0, 3.4, 2.8], [0, 0, 0]);
      S.at(6.4, () => { });
    },
    // step 1: pick one of your squares on the bottom row
    S => {
      const { b, pebbles, teo, bong } = quanYard(S);
      S.do(teo, 0, 'kneel'); S.do(bong, 0, 'kneel');
      S.shot([1.8, 3.2, 3], [0, 0, .1]);
      S.cam(.2, 1.6, [.8, 2.2, 2.6], [-.5, .1, .4]);
      const ring = Pp.sparkle(); S.add(ring, -.6, 0, .3); S.show(ring, .8);
      S.do(teo, 1.6, 'pick', 2);
      // the five stones jump up into his hand
      pebbles[1].forEach((p, j) => { S.tw(2.2 + j * .12, .35, (k, first) => { if (first) p.userData.from = p.position.clone(); p.position.y = p.userData.from.y + Math.sin(k * PI) * .4; p.position.z = p.userData.from.z + k * .25; p.scale.setScalar(1 - k * .6); }); S.show(p, 2.6 + j * .12, false); });
      const handful = Pp.seed(); handful.scale.setScalar(3.4); handful.visible = false; S.grab(teo, 3.1, handful, [0, -.48, .06]); S.show(handful, 3.1); S.show(ring, 3.2, false);
      S.do(teo, 3.6, 'carry', 2); S.mood(teo, 3.6, 'happy');
      S.cam(3.4, 1.4, [1.2, 1.5, 2.8], [-.4, .5, .9]);
    },
    // step 2: choose a direction, then drop one seed in each square
    S => {
      const { b, pebbles, teo, bong } = quanYard(S);
      pebbles[1].forEach(p => { p.visible = false; });
      S.do(teo, 0, 'kneel'); S.do(bong, 0, 'kneel'); S.mood(teo, 0, 'happy');
      // an arrow on the ground shows the way he goes
      const arrow = new THREE.Group(); arrow.add(new THREE.Mesh(G3.Box(.7, .02, .08), new THREE.MeshBasicMaterial({ color: '#ffd23f' }))); const tip = new THREE.Mesh(G3.Cone(.12, .22, 3), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); tip.rotation.set(0, 0, -H); tip.position.x = .4; arrow.add(tip);
      S.add(arrow, -.2, .05, .72); arrow.visible = false; S.show(arrow, .5);
      S.shot([1.8, 3.2, 3], [.2, 0, .1]);
      const hand = Pp.seed(); hand.scale.setScalar(3.4); S.add(hand); S.grab(teo, 0, hand, [0, -.48, .06]);
      // five stones, one into each square to the right, while he moves along
      S.do(teo, 1, 'plant', 4.6);
      for (let n = 0; n < 5; n++) {
        const to = b.userData.sq[(2 + n) % 10], t = 1.2 + n * .85, p = b.userData.pebble(30 + n, n);
        S.add(p, teo.px, .5, teo.pz - .4); p.visible = false; S.show(p, t);
        S.move(p, t, .5, [to[0] + .1, .01, to[1] + .06], undefined, .35);
        const tag = Pp.countTag(n + 1); tag.visible = false; S.add(tag, to[0], .55, to[1]); S.show(tag, t + .5); S.show(tag, t + 1.5, false);
        S.walk(teo, t, [to[0] + .1, 1.2], .9, 'kneel');
      }
      S.show(hand, 5.4, false); S.show(arrow, 5.4, false);
      S.cam(1.4, 4, [2, 2.6, 2.8], [.8, 0, .3]);
      S.do(teo, 5.8, 'cheer', 1.6);
    },
    // step 3: land next to an empty square, and capture the seeds after it
    S => {
      const { b, pebbles, teo, bong } = quanYard(S);
      pebbles[4].forEach(p => { p.visible = false; });   // the empty square
      S.do(teo, 0, 'kneel'); S.do(bong, 0, 'kneel');
      S.shot([1.8, 3.2, 3], [.6, 0, 0]);
      const e = Pp.sparkle('#9fe0ff'); S.add(e, 1.2, 0, .3); S.show(e, .6); S.show(e, 2.4, false);
      const c = Pp.sparkle('#ffd23f'); S.add(c, 1.2, 0, -.3); S.show(c, 2.2);
      S.cam(.4, 1.6, [1.6, 1.8, 1.6], [1.2, 0, 0]);
      S.do(teo, 3, 'pick', 1.6); S.mood(bong, 3, 'o');
      // the stones in the square after it slide over to Tèo's pile
      pebbles[5].forEach((p, j) => S.move(p, 3.4 + j * .1, .7, [-.2 + j * .1, .01, .95 + (j % 2) * .08], undefined, .3));
      S.show(c, 4.4, false);
      S.do(teo, 4.8, 'cheer', 2); S.mood(teo, 4.6, 'happy'); S.mood(bong, 5.4, 'smile'); S.talk(bong, 5.4, 1.2);
      S.cam(4.2, 1.6, [0, 1.8, 3], [0, .4, .6]);
    },
    // for real: draw ten squares and two half moons, and use pebbles
    S => {
      const { teo, bong } = quanYard(S);
      const lan = S.person(LAN, -3.2, 1.6, H, .72);
      S.shot([0, 3.6, 5.6], [0, .2, 0]);
      S.walk(lan, .4, [-1.6, 1.1], 1.4); S.do(lan, 2, 'kneel'); S.mood(lan, 2, 'happy');
      [teo, bong, lan].forEach((a, i) => S.do(a, 2.6 + i * .2, 'cheer', 2));
      S.cam(.4, 3, [2.4, 2.4, 4.2], [-.3, .3, 0]);
      S.at(5, () => { });
    },
    // your turn
    S => { const { teo, bong } = quanYard(S); [teo, bong].forEach(a => { S.mood(a, 0, 'happy'); S.face(a, .2, [0, 6]); S.do(a, .6, 'wave', 2.4); }); const sp = Pp.sparkle(); S.add(sp, 0, 0, 0); S.show(sp, .4); sp.scale.setScalar(2); S.shot([0, 1.6, 5], [0, .6, 0]); S.cam(.2, 2.4, [0, 1.3, 3.8], [0, .6, 0]); S.at(3.2, () => { }); }
  ] },

  counting: { pages: [
    // the title: Lan in the orchard with a basket
    S => { const lan = countYard(S).lan; S.shot([0, 1.8, 6], [0, 1, 0]); S.cam(.3, 2.6, [1.4, 1.4, 4], [0, .9, 0]); S.do(lan, .6, 'wave', 2); S.at(3.2, () => { }); },
    // step 1: count the things
    S => {
      const { lan, basket } = countYard(S);
      S.shot([1.2, 1.6, 4.2], [.6, 1.2, -.4]);
      S.do(lan, .2, 'point', 4.6); S.talk(lan, 1, 3.6);
      [0, 1, 2].forEach(i => {
        const a = Pp.melon(.11); a.children[0].material = new THREE.MeshToonMaterial({ color: '#e8332a' }); a.children[0].material.userData.film = true;
        S.add(a, .2 + i * .35, 2.4, -1.2); S.move(a, .8 + i * 1.2, .7, [.95 + (i - 1) * .12, .32, .6 + (i % 2) * .08], k => k * k, 0);
        const tag = Pp.countTag(i + 1); tag.visible = false; S.add(tag, .95 + (i - 1) * .12, .95, .6); S.show(tag, 1.5 + i * 1.2);
      });
      S.cam(.6, 3.6, [1.8, 1.3, 2.6], [.9, .5, .5]);
      S.mood(lan, 4.4, 'happy'); S.at(5.4, () => { });
    },
    // step 2: tap the right number
    S => {
      const { lan } = countYard(S, true);
      const signs = [2, 3, 4].map((n, i) => { const s = Pp.numberSign(n, ['#3b6fe0', '#e8433a', '#3a9a4a'][i]); return S.add(s, -1.4 + i * 1.4, 0, 1.6); });
      S.shot([0, 1.8, 6.4], [0, 1, 1]);
      S.walk(lan, .4, [0, 2.4], 1.1); S.face(lan, 1.6, [0, 1.6]); S.do(lan, 2, 'point', 1.2);
      const sp = Pp.sparkle(); S.add(sp, 0, .8, 1.6); S.show(sp, 2.6);
      S.tw(2.6, .4, k => { signs[1].userData.board.scale.setScalar(1 + Math.sin(k * PI) * .25); });
      S.mood(lan, 2.8, 'happy'); S.do(lan, 3.2, 'cheer', 2);
      S.cam(.6, 2.2, [0, 1.5, 4.4], [0, 1.1, 1.6]);
      S.at(5.4, () => { });
    },
    // your turn
    S => { const { lan } = countYard(S); S.mood(lan, 0, 'happy'); S.do(lan, .4, 'wave', 2.4); S.shot([0, 1.4, 4], [0, .9, 0]); S.at(3, () => { }); }
  ] }
};
// the counting guide's orchard: an apple tree, a basket, Lan
function countYard(S, noBasket) {
  S.sky('#7cc8f0', '#eaf8ff'); L.ground(S, '#9ad470'); L.house(S, -6, -9, .3);
  const tree = new THREE.Group(); tree.add(new THREE.Mesh(G3.Cyl(.18, .26, 2, 8), new THREE.MeshToonMaterial({ color: '#7a5236' }))); tree.children[0].position.y = 1;
  const crown = new THREE.Mesh(G3.S(1.3, 12, 9), new THREE.MeshToonMaterial({ color: '#4f9e42' })); crown.position.y = 2.6; tree.add(crown);
  [0, 1, 2, 3, 4, 5].forEach(i => { const a = new THREE.Mesh(G3.S(.11, 8, 6), new THREE.MeshToonMaterial({ color: '#e8332a' })); a.position.set(Math.cos(i * 1.4) * 1.1, 2.3 + (i % 3) * .3, Math.sin(i * 1.4) * 1.1 + .2); tree.add(a); });
  S.add(tree, .4, 0, -1.4);
  const basket = noBasket ? null : S.add(Pp.basket(), .95, 0, .6);
  const lan = S.person(LAN, -.7, .6, .5, .74); S.mood(lan, 0, 'happy');
  return { lan, basket };
}

// ---------------- The lantern story (round R): the prologue and each chapter's festival night ----------------
// S.ctx carries the child's own look, name and companion (js/lanterns.js)
import { buildOwl } from '../avatar.js';
import { buildDinh, buildLantern } from '../dinh.js';
import { buildCompanion } from '../companion.js';
const owl = () => { const o = buildOwl(); o.remove(o.children[o.children.length - 1]); return o; }; // (without its shared shadow)
const kidOf = S => LOOK(Object.assign({ style: 'shirt', color: '#3b6fe0', hairStyle: 'short' }, (S.ctx && S.ctx.look) || {}, { back: 'none', glider: 0 }));
// the grumpy cloud Mây Cau Có: big, grey, puffed cheeks and a frown
function grumpy() {
  const g = new THREE.Group(), parts = [];
  for (let i = 0; i < 7; i++) parts.push(P(G3.S(1.6 + (i % 3) * .5, 10, 8), i % 2 ? '#8a90a0' : '#9aa0b0', [(i - 3) * 1.4, Math.sin(i * 1.3) * .5, (i % 2) * .6]));
  parts.push(P(G3.S(.32, 10, 8), '#ffffff', [-.8, .4, 2]), P(G3.S(.32, 10, 8), '#ffffff', [.8, .4, 2]), P(G3.S(.15, 8, 6), '#2a2a3a', [-.8, .35, 2.28]), P(G3.S(.15, 8, 6), '#2a2a3a', [.8, .35, 2.28]),
    P(G3.Box(.7, .12, .1), '#2a2a3a', [-.85, .85, 2.1], [0, 0, -.35]), P(G3.Box(.7, .12, .1), '#2a2a3a', [.85, .85, 2.1], [0, 0, .35]), P(G3.Cyl(.25, .25, .12, 12), '#5a5a6a', [0, -.5, 2.1], [H, 0, 0]));
  g.add(new THREE.Mesh(merge(parts), new THREE.MeshToonMaterial({ vertexColors: true })));
  return g;
}
function windStreaks(S, n = 14) {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false });
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(G3.Cyl(.03, .03, 3 + (i % 3), 4), m); s.rotation.z = H; s.position.set(-14 + (i * 3.7) % 28, 4 + (i * 1.9) % 9, -6 + (i * 2.3) % 8); g.add(s); }
  g.visible = false;
  S.every((dt, time) => { if (g.visible) g.children.forEach((s, i) => { s.position.x += dt * (16 + i % 4 * 3); if (s.position.x > 16) s.position.x = -16; }); });
  return S.add(g);
}
FILMS.lantern_prologue = { pages: [
  // 1. the night before the festival: the lanterns glow on the old banyan
  S => {
    village(S, [10, -10]); S.sky('#2a3070', '#f0a070'); S.light(.6, .7);
    L.banyan(S, 0, -4, 1.2);
    const lan = [...Array(9)].map((_, i) => { const a = -.3 + i * .45, l = buildLantern(true); l.scale.setScalar(1.1); return S.add(l, Math.cos(a) * 5.2, 2.6 + (i % 3) * .45, -4 + Math.sin(a) * 2 + 2.2); }); // (under the branches, where everyone can see them)
    S.every((dt, time) => lan.forEach((l, i) => { l.rotation.z = Math.sin(time * 1.3 + i) * .08; }));
    const o = owl(); o.scale.setScalar(.7); S.add(o, 2.6, 0, -.8, -.4);
    const nam = S.person(LOOK({ style: 'aodai', color: '#8a4a8a', hairStyle: 'buns', hair: '#e8e8e8' }), -2.4, 1, .4), teo = S.person(TEO, -1, 2, .2, .72), v = S.person(VILLAGER('shirt', '#3b6fe0', 'nonla', 'short'), 1, 1.8, -.2);
    [nam, teo, v].forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, 1 + i * .4, 'point', 2); });
    S.shot([0, 2.4, 13], [0, 3, -3]); S.cam(.3, 8, [1.5, 3, 8.5], [0, 3.8, -3.5]);
    S.at(9.5, () => { });
  },
  // 2. whoosh: Mây Cau Có blows the lanterns far away
  S => {
    village(S, [10, -10]); S.sky('#2a3070', '#d88a70'); S.light(.55, .65);
    L.banyan(S, 0, -4, 1.2);
    const lan = [...Array(9)].map((_, i) => { const a = -.3 + i * .45, l = buildLantern(true); l.scale.setScalar(1.1); return S.add(l, Math.cos(a) * 5.2, 2.6 + (i % 3) * .45, -4 + Math.sin(a) * 2 + 2.2); }); // (under the branches, where everyone can see them)
    const cloud = grumpy(); S.add(cloud, -26, 13, -10); S.move(cloud, 0, 3, [-9, 12, -8]);
    S.tw(3, 1.2, k => { cloud.scale.set(1 + Math.sin(k * Math.PI) * .25, 1 + Math.sin(k * Math.PI) * .2, 1); });
    const wind = windStreaks(S); S.show(wind, 3.6);
    lan.forEach((l, i) => S.move(l, 3.8 + i * .25, 4.5, [18 + i * 3, 22 + (i % 4) * 4, -30 - i * 4], k => k * k));
    const nam = S.person(LOOK({ style: 'aodai', color: '#8a4a8a', hairStyle: 'buns', hair: '#e8e8e8' }), -2.4, 1, .4), teo = S.person(TEO, -1, 2, .2, .72);
    [nam, teo].forEach((a, i) => { S.mood(a, 4, 'o'); S.do(a, 4.2 + i * .3, 'surprised', 3); S.mood(a, 8, 'sad'); });
    S.shot([0, 2.4, 13], [-2, 4.5, -4]);
    S.cam(3.6, 2, [2, 2.4, 12], [0, 6, -6]); S.cam(6, 3.5, [2, 2, 12], [10, 16, -24]);
    S.at(10.5, () => { });
  },
  // 3. Ông Cú asks the child, and two friends are ready to fly with them
  S => {
    village(S, [10, -10]); S.sky('#3a3a80', '#f2b080'); S.light(.7, .75);
    L.banyan(S, 0, -6, 1.2);
    const o = owl(); o.scale.setScalar(.8); S.add(o, 0, 0, -1.6, 0);
    S.every((dt, time) => { o.rotation.z = Math.sin(time * 3) * .04; o.position.y = Math.abs(Math.sin(time * 3)) * .05; });
    const kid = S.person(kidOf(S), 0, 2.2, PI, .72); S.mood(kid, 0, 'smile');
    const ff = buildCompanion('firefly'), dr = buildCompanion('dragon');
    S.add(ff, -1.6, 1.6, .4); S.add(dr, 1.6, 1.4, .4); ff.visible = dr.visible = false; S.show(ff, 3.5); S.show(dr, 4.2);
    S.every((dt, time) => [ff, dr].forEach((c, i) => { c.position.y = 1.5 + Math.sin(time * 2 + i) * .15; c.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * c.userData.flap) * .6; }); c.rotation.y = Math.sin(time * .8 + i) * .4; }));
    const sp = Pp.sparkle(); S.add(sp, 0, .5, .4); S.show(sp, 3.4);
    S.shot([0, 1.8, 7], [0, 1.2, 0]); S.cam(.5, 3, [2.6, 1.6, 5], [0, 1.1, 0]);
    S.mood(kid, 3.6, 'happy'); S.do(kid, 4.5, 'cheer', 2);
    S.cam(3.2, 2.5, [0, 1.7, 5.6], [0, 1.4, .4]);
    S.at(8.5, () => { });
  }
] };
FILMS.lantern_ch1 = { pages: [
  // 1. the lantern goes up on the đình; it glows and the mist lifts
  S => {
    S.sky('#a8c8e8', '#ffe8c8'); L.ground(S, '#8fcf6a'); L.mountains(S, -110); L.bamboo(S, -11, -6); L.bamboo(S, 11, -5);
    const d = buildDinh(); S.add(d, 0, 0, -4);
    const mm = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .45, depthWrite: false });
    const mist = [...Array(10)].map((_, i) => { const s = new THREE.Mesh(G3.S(2.4 + (i % 3) * .6, 12, 8), mm); s.scale.y = .6; return S.add(s, Math.cos(i * 2.4) * 4, 1.4 + (i % 3) * 1.2, -4 + Math.sin(i * 2.4) * 3); });
    const kid = S.person(kidOf(S), 0, 6, PI, .72);
    const lan = buildLantern(true); lan.scale.setScalar(.8); S.add(lan); S.grab(kid, 0, lan, [0, -.5, .1]);
    const comp = buildCompanion(S.ctx.companion || 'firefly'); S.add(comp, .8, 1.6, 6.3);
    S.every((dt, time) => { comp.position.y = 1.5 + Math.sin(time * 2.2) * .12; comp.userData.wings.forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * Math.sin(time * comp.userData.flap) * .6; }); });
    S.shot([3, 2.4, 13], [0, 2.4, -2]);
    S.walk(kid, .4, [0, -.4], 1.3); S.move(comp, .4, 4.2, [.9, 1.6, .2], k => k);
    S.do(kid, 4.2, 'give', 1.4);
    const hook = d.userData.hooks[2].clone().add(new THREE.Vector3(0, 0, -4));
    S.drop(lan, 4.6); S.move(lan, 4.62, 1.2, [hook.x, hook.y, hook.z], undefined, .4);
    const others = d.userData.hooks.filter((_, i) => i !== 2).map(v => { const l = buildLantern(true); l.scale.setScalar(.9); l.visible = false; return S.add(l, v.x, v.y, v.z - 4); });
    others.forEach((l, i) => S.show(l, 6.2 + i * .35));
    S.tw(6, 3, k => { mm.opacity = .45 * (1 - k); mist.forEach(m => m.scale.set(1 + k * .5, .6 + k * .3, 1 + k * .5)); }, k => k);
    S.skyTo(6, 3, '#7cc8f0', '#e8f6ff');
    S.mood(kid, 6.4, 'happy'); S.do(kid, 7, 'cheer', 2.4);
    S.cam(4, 2, [2, 2.2, 5], [0, 2.6, -2]); S.cam(6.5, 3, [4, 3, 11], [0, 3, -4]);
    S.at(10.5, () => { });
  },
  // 2. that night: the village festival with drums, games and lanterns everywhere
  S => {
    S.sky('#141a44', '#34406e'); S.light(.3, .55); L.ground(S, '#5f8f4a'); L.mountains(S, -110, '#3a4a6a'); L.bamboo(S, -11, -6); L.bamboo(S, 11, -5);
    const d = buildDinh(); S.add(d, 0, 0, -6);
    d.userData.hooks.forEach(v => { const l = buildLantern(true); l.scale.setScalar(.9); S.add(l, v.x, v.y, v.z - 6); });
    // strings of lanterns across the yard
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const l = buildLantern(true, i % 3 ? '#d8301e' : '#ffb52e'); l.scale.setScalar(.6); S.add(l, -8 + i * 2, 4.2 - Math.sin(i / 8 * PI) * .6, 1 + r * 4); }
    const drum = new THREE.Mesh(G3.Cyl(.7, .7, .9, 16), new THREE.MeshToonMaterial({ color: '#a8281e' })); drum.rotation.z = H; S.add(drum, -3.5, .9, 2);
    const drummer = S.person(VILLAGER('shirt', '#c62f2f', 'none', 'short'), -3.5, 3.1, PI);
    S.every((dt, time) => { drummer.A.armR.rotation.x = -1.2 + Math.max(0, Math.sin(time * 6)) * .8; drummer.A.armL.rotation.x = -1.2 + Math.max(0, Math.sin(time * 6 + PI)) * .8; drum.scale.setScalar(1 + Math.max(0, Math.sin(time * 6)) * .03); });
    const kid = S.person(kidOf(S), 0, 4, 0, .72), teo = S.person(TEO, 1.4, 4.4, 0, .72), bong = S.person(BONG, -1.2, 4.6, 0, .72), nam = S.person(LOOK({ style: 'aodai', color: '#8a4a8a', hairStyle: 'buns', hair: '#e8e8e8' }), 2.8, 3.4, -.4);
    [kid, teo, bong, nam].forEach((a, i) => { S.mood(a, 0, 'happy'); S.do(a, .5 + i * .3, i === 3 ? 'wave' : 'cheer', 6); });
    const fw = [[-6, 14, -14], [5, 15, -16], [0, 17, -20]].map(p => Pp.fireworks(S, ...p)); fw.forEach((f, i) => S.show(f, 1 + i * .8));
    S.shot([0, 3, 14], [0, 3, -2]); S.cam(.5, 8, [3, 2.4, 10], [0, 4, -4]);
    S.at(10, () => { });
  }
] };

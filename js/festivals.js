// Festivals on real dates (from the device's own calendar, no internet needed): Tết and Lunar New
// Year, the Mid-Autumn lantern festival, Diwali, Christmas and Australia Day. During a festival the
// village gets decorations, there are fireworks at night, and the festival table gives a treat once
// a day and starts a game that fits. Grown-ups can preview any festival from Grown-ups.
import { THREE, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { settings, saveProfiles, farm, saveFarm, reduceMotion } from './state.js';
import { heightAt, VILLAGE, CHINA, INDIA, AUSSIE, TOWN } from './world.js';
import { FEAST } from './data.js';

// dates for the moon festivals (they move each year)
const LUNAR_NY = ['2025-01-29', '2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11'];
const MID_AUTUMN = ['2025-10-06', '2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12', '2031-10-01', '2032-09-19'];
const DIWALI = ['2025-10-20', '2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05', '2030-10-26', '2031-11-14', '2032-11-02'];
const day = s => new Date(s + 'T12:00:00');
const near = (list, d, before, after) => list.some(s => { const k = (d - day(s)) / 864e5; return k >= -before && k <= after; });

export const FESTIVALS = {
  tet: { icon: '🧧', name: () => T('Tết, the Lunar New Year', 'Tết Nguyên Đán'), where: () => [VILLAGE, CHINA], deco: ['🏮', '🧧', '🌸', '🏮'], fireworks: true, game: 'dragon', treat: null,
    lines: [['Chúc mừng năm mới! Happy Lunar New Year! Families clean their houses, cook bánh chưng and visit their grandparents.', 'Chúc mừng năm mới! Mọi nhà dọn dẹp nhà cửa, gói bánh chưng và đi thăm ông bà.'], ['Here is a red lucky-money envelope, lì xì, for you! In China it is called hóngbāo.', 'Đây là bao lì xì đỏ cho con! Ở Trung Quốc người ta gọi là hóngbāo.']] },
  midautumn: { icon: '🥮', name: () => T('Mid-Autumn Festival', 'Tết Trung Thu'), where: () => [VILLAGE, CHINA], deco: ['🏮', '⭐', '🐰', '🥮'], fireworks: false, game: 'kite', treat: 'mooncake',
    lines: [['It is the Mid-Autumn Festival! Children carry star lanterns under the full moon and share mooncakes.', 'Tết Trung Thu rồi! Các bạn nhỏ rước đèn ông sao dưới trăng rằm và cùng ăn bánh trung thu.'], ['Look at the moon tonight: can you see the moon lady Chị Hằng and the rabbit?', 'Tối nay ngắm trăng nhé: con có thấy Chị Hằng và chú thỏ không?']] },
  diwali: { icon: '🪔', name: () => T('Diwali, the festival of lights', 'Lễ hội ánh sáng Diwali'), where: () => [INDIA], deco: ['🪔', '🪔', '🌼', '✨'], fireworks: true, game: 'rangoli', treat: 'ladoo',
    lines: [['Happy Diwali! Families light little clay lamps called diyas and draw rangoli patterns at the door.', 'Chúc mừng Diwali! Mọi nhà thắp những ngọn đèn đất nhỏ gọi là diya và vẽ tranh rangoli trước cửa.'], ['Have some ladoo, round sweets we share with friends and neighbours!', 'Ăn kẹo ladoo nhé, những viên kẹo tròn để chia cho bạn bè và hàng xóm!']] },
  christmas: { icon: '🎄', name: () => T('Christmas', 'Lễ Giáng Sinh'), where: () => [AUSSIE, { x: (TOWN.x0 + TOWN.x1) / 2, z: (TOWN.z0 + TOWN.z1) / 2 }], deco: ['🎄', '🎁', '⭐', '🔔'], fireworks: false, game: 'parcel', treat: 'xmascookie',
    lines: [['Merry Christmas! In Australia Christmas is in summer, so lots of families go to the beach!', 'Giáng Sinh vui vẻ! Ở Úc Giáng Sinh rơi vào mùa hè, nên nhiều gia đình đi biển!'], ['Here is a Christmas cookie. Let’s play Pass the Parcel!', 'Tặng con bánh quy Giáng Sinh. Mình chơi Chuyền Quà nhé!']] },
  ausday: { icon: '🇦🇺', name: () => T('Australia Day', 'Ngày Nước Úc'), where: () => [AUSSIE], deco: ['🇦🇺', '🎈', '🌭', '🦘'], fireworks: true, game: 'cricket', treat: 'sizzle',
    lines: [['Happy Australia Day! People have picnics and barbecues, play backyard cricket and watch fireworks.', 'Chúc mừng Ngày Nước Úc! Mọi người đi dã ngoại, nướng thịt, chơi cricket sân sau và xem pháo hoa.'], ['It is also a day to remember the First Nations people, who have cared for this land for more than 60,000 years.', 'Đây cũng là ngày tưởng nhớ người Thổ dân, những người đã gìn giữ mảnh đất này hơn 60.000 năm.'], ['Have a sausage sizzle!', 'Ăn xúc xích nướng kẹp bánh mì nhé!']] }
};

// a festival a child chose to visit from the Games hub or settings (for this session only)
let visiting = null;
// a festival happens at a village (a centre point) or a city block (a box): use the middle of either
const spots = F => F.where().map(o => o.x != null ? o : { x: (o.x0 + o.x1) / 2, z: (o.z0 + o.z1) / 2 });
export function festivalToday(d = new Date()) {
  if (visiting && FESTIVALS[visiting]) return visiting;
  const pick = settings.festival || 'auto';
  if (pick === 'none') return null;
  if (pick !== 'auto') return FESTIVALS[pick] ? pick : null;
  if (near(LUNAR_NY, d, 7, 7)) return 'tet';
  if (near(MID_AUTUMN, d, 10, 2)) return 'midautumn';
  if (near(DIWALI, d, 5, 3)) return 'diwali';
  const m = d.getMonth() + 1, dd = d.getDate();
  if (m === 12 && dd <= 26) return 'christmas';
  if (m === 1 && dd >= 24 && dd <= 27) return 'ausday';
  return null;
}

export function createFestivals(G) {
  const { scene, world } = G;
  // a soft round glow for firework sparks
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
  const group = new THREE.Group(); scene.add(group);
  const bursts = [];
  let current = null, tableIt = null;
  const build = () => {
    group.clear(); bursts.length = 0;
    if (tableIt) { const k = G.interactables.indexOf(tableIt); if (k >= 0) G.interactables.splice(k, 1); tableIt = null; }
    current = festivalToday(); if (!current) return;
    const F = FESTIVALS[current];
    // decorations in a ring round each village
    spots(F).forEach((c, w) => {
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2, r = 9 + (i % 3) * 4, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        const s = sprite(F.deco[i % F.deco.length], 1.2); s.position.set(x, heightAt(x, z) + 3.2 + (i % 2) * .6, z); group.add(s);
        s.userData.base = s.position.y; s.userData.k = i;
      }
      if (w === 0) { // the festival table in the middle of the first village
        const x = c.x - 3, z = c.z + 3, s = sprite(F.icon, 2); s.position.set(x, heightAt(x, z) + 2.4, z); group.add(s);
        tableIt = { id: 'festival', x, z, r: 3.2, icon: F.icon, label: () => F.name(), act: h => visit(h) };
        G.interactables.push(tableIt);
      }
    });
  };
  const visit = async h => {
    const F = FESTIVALS[current], p = h.profile, today = new Date().toDateString();
    p.festivals = p.festivals || {};
    await G.dialog(F.name(), F.lines);
    if (p.festivals[current] !== today) {
      p.festivals[current] = today;
      if (F.treat) { p.dishes[F.treat] = (p.dishes[F.treat] || 0) + 1; const t = FEAST.find(x => x.id === F.treat); G.toast(h, `+1 ${t.icon} ${t.name()}`); }
      else { farm.coins += 10; saveFarm(); G.toast(h, '🧧 +' + G.fmt(10)); SFX.coin(); }
      const st = G.giveSticker(p); saveProfiles();
      G.celebrate && G.celebrate(h);
      await G.reward(F.icon, F.name(), st ? T('A festival present and a sticker!', 'Quà lễ hội và một hình dán!') : T('A festival present!', 'Quà lễ hội!'));
    }
    const k = await G.dialog(F.name(), [[`Shall we play a festival game?`, `Mình chơi một trò ngày lễ nhé?`]], [['🎉 Yes!', '🎉 Có!'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) G.playGame(h.i, F.game, 'replay');
  };
  // gentle bobbing, and fireworks at night
  let fwT = 0, showT = 0;
  world.updaters.push((dt, t) => {
    if (!current) return;
    group.children.forEach(s => { if (s.userData.base != null) s.position.y = s.userData.base + Math.sin(t * 2 + s.userData.k) * .15; });
    const F = FESTIVALS[current];
    if (showT > 0) showT -= dt;
    if (F.fireworks && (world.isNight() || showT > 0) && !reduceMotion()) {
      fwT -= dt;
      if (fwT <= 0) {
        fwT = showT > 0 ? .5 + Math.random() * .6 : 1.2 + Math.random() * 1.5;
        const c = spots(F)[0], x = c.x + (Math.random() - .5) * 30, z = c.z + (Math.random() - .5) * 30, y = heightAt(c.x, c.z) + 22 + Math.random() * 10;
        const col = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43'][Math.floor(Math.random() * 5)];
        for (let i = 0; i < 16; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(1.3);
          const a = i / 16 * Math.PI * 2, e = (Math.random() - .5) * 1.2; s.position.set(x, y, z); group.add(s);
          bursts.push({ s, v: new THREE.Vector3(Math.cos(a) * 7, Math.sin(e) * 7, Math.sin(a) * 7), life: 1.4 });
        }
        if (G.heroes.some(h => Math.hypot(h.pos.x - x, h.pos.z - z) < 80)) SFX.pop(Math.floor(Math.random() * 5));
      }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.life -= dt; b.v.y -= dt * 4; b.s.position.addScaledVector(b.v, dt); b.s.material.opacity = Math.max(0, b.life / 1.4);
      if (b.life <= 0) { group.remove(b.s); bursts.splice(i, 1); }
    }
  });
  build();
  return {
    rebuild: build,
    current: () => current,
    // any festival, any day: decorate, fly the child to the festival table, a fireworks show, then the festival visit
    visit: async (i, id) => {
      const h = G.heroes[i]; if (!h || !FESTIVALS[id]) return;
      visiting = id; build();
      if (tableIt) await G.landBy(h, tableIt.x, tableIt.z); // an open spot next to the table, never inside a stall or tree
      showT = 14; SFX.chime && SFX.chime();
      // arriving can open a story page (a new village): let it finish before the festival starts
      for (let k = 0; k < 600 && document.querySelector('.storybook, .reward, .modal'); k++) await new Promise(r => setTimeout(r, 200));
      await new Promise(r => setTimeout(r, 900)); showT = 14;
      if (tableIt) visit(h);
    },
    list: () => Object.entries(FESTIVALS).map(([id, F]) => ({ id, icon: F.icon, name: F.name(), today: festivalToday() === id })),
    // a greeting when a session starts during a festival
    greet: h => { if (!current) return; const F = FESTIVALS[current]; setTimeout(() => { G.toast(h, `${F.icon} ${T("It's ", 'Hôm nay là ')}${F.name()}!`); say(`It is ${F.name()}! Visit the festival table for a present.`, `Hôm nay là ${F.name()}! Đến bàn lễ hội nhận quà nhé.`); }, 4000); }
  };
}

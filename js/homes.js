// Homes: every house in the valley is a place to visit. Its door shows whose home it is; the family (on
// Two Homes Street) stands outside; "About this house" tells what kind of house it is and where it is; and
// "Go inside" takes the child into the house: a room furnished the way that kind of home really is (a family
// altar and wooden sofa in a Vietnamese tube house, a verandah lounge in an Aussie cottage, a charpai and
// rangoli in India…), with the family there to talk to, and the door back out.
import { THREE, P, merge, toonVC, sprite } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { heightAt, regionAt, REGION_NAMES, TOWN } from './world.js';
import { buildAvatar } from './avatar.js';
import { PERSONAS } from './chat.js';
import { ITEMS } from './data.js';
import { el, wait } from './util.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 12) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);
const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const GREY = '#cfcfcf', BLACK = '#1d1412';

// The families of Two Homes Street (matched to their house by position). Names are shown as written; the
// English game calls them Uncle / Auntie (js/i18n.js).
// people: [name, look, kid?, line [en, vi], [where outside: sideways from the door, out from the wall]]
export const HOMES = [
  { at: [20.1, 36.3], kind: 'tube', room: 'banhmi', name: ['Uncle Trung and Auntie Phương’s Bánh Mì shop', 'Tiệm bánh mì nhà chú Trung, mợ Phương'],
    about: ['A nhà ống (tube house): narrow at the front and long inside. The bánh mì shop is downstairs and the family lives upstairs. Every morning chú Trung bakes the bread and mợ Phương fills it with pâté, pickles and herbs.', 'Nhà ống: mặt tiền hẹp, bên trong dài. Tầng dưới bán bánh mì, tầng trên là nhà ở. Sáng nào chú Trung cũng nướng bánh, mợ Phương kẹp pa-tê, đồ chua và rau thơm.'],
    people: [['Chú Trung', look('shirt', '#f2f2f2', BLACK, 'short'), 0, ['Fresh bánh mì, still warm! Crunchy outside, soft inside.', 'Bánh mì mới ra lò nè con, còn nóng hổi! Giòn bên ngoài, mềm bên trong.'], [-1.6, .6]],
      ['Mợ Phương', look('aodai', '#3cb0a0', BLACK, 'long'), 0, ['Come in, come in! Em Hà, say hello to your friend.', 'Vào nhà chơi con! Em Hà ơi, chào bạn đi con.'], [2.0, .6]],
      ['Em Hà', look('dress', '#ffd23f', BLACK, 'buns'), 1, ['Hi! Do you want to skip rope with me?', 'Chào bạn! Bạn nhảy dây với Hà không?'], [.9, .5]]] },
  { at: [24.6, 36.3], kind: 'tube', room: 'coffee', name: ['Uncle Thuận’s Coffee', 'Quán cà phê chú Thuận'],
    about: ['A tube house with a little coffee shop downstairs. Vietnamese coffee drips slowly through a small metal filter called a phin. Grown-ups sit on low stools on the footpath and chat for hours.', 'Nhà ống có quán cà phê nhỏ ở tầng dưới. Cà phê Việt Nam nhỏ giọt chậm qua cái phin nhôm. Người lớn ngồi ghế đẩu trên vỉa hè, nói chuyện cả buổi.'],
    people: [['Chú Thuận', look('tunic', '#6b4a2a', BLACK, 'short'), 0, ['Drip, drip, drip… a phin coffee takes five minutes. For you: a cold milk, not coffee!', 'Tí tách, tí tách… ly cà phê phin phải đợi năm phút. Con thì uống sữa tươi mát nha, cà phê là của người lớn!'], [1.6, .6]],
      ['Chú Sự', look('shirt', '#3a78c8', BLACK, 'short', 'cap'), 0, ['I drive a xe ôm, a motorbike taxi. I know every street in town!', 'Chú chạy xe ôm. Đường nào trong phố chú cũng biết hết!'], [-1.3, .8]]] },
  { at: [33.5, 35.1], kind: 'villa', room: 'villa', name: ['Uncle Tâm and Auntie An’s villa', 'Nhà cậu Tâm, mợ An'],
    about: ['An old French-style villa with tall green shutters and a front garden. It stays cool in the hot sun. Cậu Tâm and mợ An live here with their two boys, Tí and Bi.', 'Biệt thự kiểu Pháp xưa, cửa chớp xanh cao và vườn trước nhà. Trời nắng mà trong nhà vẫn mát. Cậu Tâm, mợ An sống ở đây với hai đứa con là Tí và Bi.'],
    people: [['Cậu Tâm', look('shirt', '#5b7fbf', BLACK, 'short'), 0, ['Welcome! The boys are always racing round the garden.', 'Chào con! Hai đứa nhỏ nhà cậu suốt ngày chạy quanh vườn.'], [-2.6, 1.5]],
      ['Mợ An', look('aodai', '#e8a0c0', BLACK, 'long'), 0, ['Would you like some star fruit from our tree?', 'Con ăn khế không? Khế vườn nhà mợ đó.'], [2.6, 1.5]],
      ['Tí', look('overalls', '#5fd39a', BLACK, 'spiky'), 1, ['I’m Tí! I’m the big brother.', 'Mình là Tí! Mình là anh hai.'], [-3.3, 2.8]],
      ['Bi', look('hoodie', '#ff9f43', BLACK, 'short'), 1, ['I’m Bi! Let’s play hide and seek!', 'Mình là Bi! Chơi trốn tìm đi!'], [4, 2.6]]] },
  { at: [45, 33.5], kind: 'brick', room: 'brick', name: ['Uncle Sơn’s house', 'Nhà bác Sơn'],
    about: ['A solid brick house with a tiled roof. Bác Sơn keeps bonsai trees and songbirds in the front yard, and plays Chinese chess with the neighbours in the evening.', 'Ngôi nhà gạch mái ngói chắc chắn. Bác Sơn chơi cây cảnh, nuôi chim hót trước sân, chiều chiều đánh cờ tướng với hàng xóm.'],
    people: [['Bác Sơn', look('tunic', '#8a6a4a', GREY, 'short'), 0, ['Listen to my bird sing! And look at this little bonsai: it is older than your parents!', 'Nghe chim nhà bác hót nè! Còn cây bonsai nhỏ xíu này già hơn cả ba mẹ con đó!'], [-2.2, 2.6]]] },
  { at: [13.5, 59], kind: 'raised', room: 'raised', name: ['Auntie Thủy and Auntie Thúy’s house', 'Nhà O Thủy, O Thúy'],
    about: ['A raised house on posts, like a Queenslander, so the breeze blows underneath. The twin sisters O Thủy and O Thúy came from Huế: in Huế people call an auntie “O”.', 'Nhà sàn trên cột như nhà Queenslander bên Úc, gió thổi mát bên dưới. Hai chị em sinh đôi O Thủy và O Thúy quê ở Huế: người Huế gọi cô là “O”.'],
    people: [['O Thủy', look('aodai', '#7a4aa0', BLACK, 'long', 'nonla'), 0, ['Chào cháu! In Huế we wear purple áo dài and conical hats with poems inside.', 'Chào cháu! Ở Huế tụi O mặc áo dài tím, đội nón bài thơ.'], [-1.9, .7]],
      ['O Thúy', look('aodai', '#9a6ac0', BLACK, 'buns'), 0, ['I am Thúy, the younger twin, by five minutes!', 'O là Thúy, em sinh đôi, nhỏ hơn có năm phút thôi!'], [1.9, .7]]] },
  { at: [45, 63.2], kind: 'cottage', room: 'cottage', name: ['Ruby’s family cottage', 'Nhà gỗ của gia đình Ruby'],
    about: ['An Australian weatherboard cottage with a verandah, a Hills Hoist clothesline out the back and a cricket bat by the door.', 'Nhà gỗ ván kiểu Úc có hiên, sân sau có dây phơi đồ xoay Hills Hoist và cây gậy cricket để cạnh cửa.'], people: [] },
  { at: [20.3, 57.7], kind: 'home8', room: 'home8', name: ['Number 8', 'Nhà số 8'],
    about: ['A Bà Rịa family home with a balcony full of flowers. Knock and you are always welcome: there is always rice, fruit and a big hug here.', 'Ngôi nhà của một gia đình Bà Rịa, ban công đầy hoa. Gõ cửa là lúc nào cũng được đón: ở đây lúc nào cũng có cơm, trái cây và một cái ôm thật chặt.'], people: [] },
  { at: [15, 36.25], kind: 'shop', room: 'huenghi', name: ['Huệ Nghi', 'Huệ Nghi'],
    about: ['The Huệ Nghi shop: transport of goods, and steel, old and new. Bà Huệ keeps the books and ông Nghi knows every kind of steel bar by heart.', 'Cửa hàng Huệ Nghi: vận chuyển hàng hóa, sắt thép cũ và mới. Bà Huệ giữ sổ sách, ông Nghi thuộc làu từng loại sắt thép.'], people: [] }
];

const KIND = {
  tube: ['A Vietnamese tube house (nhà ống)', 'Nhà ống Việt Nam'], villa: ['A French-style villa', 'Biệt thự kiểu Pháp'], cottage: ['An Australian weatherboard cottage', 'Nhà gỗ ván kiểu Úc'],
  village: ['A three-room village house (nhà ba gian)', 'Nhà ba gian ở làng quê'], china: ['A Chinese courtyard house', 'Nhà sân vườn Trung Hoa'], india: ['An Indian family home', 'Ngôi nhà Ấn Độ'],
  brick: ['A brick house with a tiled roof', 'Nhà gạch mái ngói'], raised: ['A raised house on posts', 'Nhà sàn trên cột'], home8: ['A Bà Rịa family home', 'Nhà gia đình ở Bà Rịa'], shop: ['A shophouse', 'Nhà phố buôn bán']
};
const ROOM_OF = { tube: 'tube', villa: 'villa', cottage: 'cottage', village: 'village', china: 'china', india: 'india', brick: 'brick', raised: 'raised', home8: 'home8', shop: 'huenghi' };
const ABOUT_KIND = {
  village: ['In the middle room is the family altar, where the family remembers their grandparents. Guests are welcomed there with tea.', 'Gian giữa đặt bàn thờ tổ tiên. Khách đến nhà được mời trà ở gian giữa.'],
  china: ['Grandparents, parents and children live round a courtyard, with red lanterns at the gate for good luck.', 'Ông bà, cha mẹ và con cháu sống quanh một khoảng sân, treo đèn lồng đỏ ở cổng cho may mắn.'],
  india: ['Marigold garlands hang on the door and a rangoli pattern of coloured powder welcomes guests on the step.', 'Vòng hoa cúc vạn thọ treo trên cửa, hình rangoli bằng bột màu trước bậc thềm chào đón khách.'],
  tube: ['Narrow at the front, very long inside: a shop downstairs and the family upstairs.', 'Mặt tiền hẹp, bên trong rất dài: tầng dưới buôn bán, tầng trên gia đình ở.'],
  cottage: ['The verandah keeps the house cool, and neighbours wave to each other from it.', 'Hiên nhà giúp mát mẻ, hàng xóm vẫy chào nhau từ hiên.'],
  villa: ['Tall shutters and thick walls keep it cool in the tropical sun.', 'Cửa chớp cao và tường dày giữ mát dưới nắng nhiệt đới.']
};

// where a house is, in words a child can find on the map
function whereIs(x, z) {
  if (x > TOWN.x0 - 4 && x < TOWN.x1 + 4 && z > TOWN.z0 - 4 && z < TOWN.z1 + 4) {
    const side = z < TOWN.roadZ ? T('the Bà Rịa side (north)', 'phía Bà Rịa (bắc)') : T('the Sydney side (south)', 'phía Sydney (nam)');
    return T(`Two Homes Street, ${side}`, `Phố Hai Quê, ${side}`);
  }
  const r = regionAt(x, z), n = REGION_NAMES[r] ? REGION_NAMES[r]() : T('the valley', 'thung lũng');
  return n;
}

export function createHomes(G, { KNOCK, GIFTS, give, sfx, say }) {
  const { scene, world } = G;
  const homes = [];
  // the room is built high above the far north-west corner of the map, where nothing else is
  const RX = -176, RZ = -176, RY = 420;
  world.platforms.push({ x0: RX - 8, x1: RX + 8, z0: RZ - 7, z1: RZ + 7, y: RY });

  const tagSprite = (name, y) => {
    registerName(name);
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g2 = c.getContext('2d');
    const draw = () => { g2.clearRect(0, 0, 256, 64); g2.fillStyle = 'rgba(40,40,40,.55)'; g2.beginPath(); g2.roundRect(8, 10, 240, 46, 23); g2.fill(); g2.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(nm(name), 128, 34, 228); };
    draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(2.6, .65, 1); s.position.y = y; return s;
  };
  const person = ([name, lk, kid], x, y, z, face) => {
    const A = buildAvatar(lk, null); A.root.position.set(x, y, z); A.root.rotation.y = face; if (kid) A.root.scale.setScalar(.78);
    const tg = tagSprite(name, kid ? 2.05 : 2.45); tg.position.x = x; tg.position.z = z; tg.position.y += y; scene.add(A.root); scene.add(tg);
    return { A, tg, name };
  };
  const live = []; // people standing outside: they breathe and look round when a child is near
  world.updaters.push((dt, t) => { for (const [k, p] of live.entries()) { const r = p.A.root.position; if (!G.heroes.some(h => Math.abs(h.pos.x - r.x) < 50 && Math.abs(h.pos.z - r.z) < 50)) continue; p.A.anim(p.hop ? 'dance' : 'idle', t + k, 0); } });

  // every house: who lives there, its door, the family outside
  (world.houses || []).forEach((hs, k) => {
    const H = HOMES.find(e => Math.hypot(e.at[0] - hs.x, e.at[1] - hs.z) < 2.6) || null;
    const fx = Math.sin(hs.rot), fz = Math.cos(hs.rot), sx = Math.cos(hs.rot), sz = -Math.sin(hs.rot);
    const door = { x: hs.x + fx * (hs.d / 2 + 1.2), z: hs.z + fz * (hs.d / 2 + 1.2) };
    const home = { id: 'home' + k, hs, H, door, kind: H ? H.kind : hs.kind, room: H ? H.room : ROOM_OF[hs.kind] || 'tube',
      name: () => H ? T(H.name[0], H.name[1]) : T(KIND[hs.kind] ? KIND[hs.kind][0] : 'A house', KIND[hs.kind] ? KIND[hs.kind][1] : 'Một ngôi nhà'), where: () => whereIs(hs.x, hs.z), people: [] };
    homes.push(home);
    if (H) H.people.forEach((pp, j) => {
      // the family stands beside the door, facing the street (kids a little further out)
      const [off, out] = pp[4] || [[-1.9, 1.9, -3.1, 3.1][j] || 0, pp[2] ? 1.6 : .7];
      const x = hs.x + fx * (hs.d / 2 + out) + sx * off, z = hs.z + fz * (hs.d / 2 + out) + sz * off, P0 = person(pp, x, world.groundAt(x, z), z, hs.rot);
      if (pp[0] === 'Em Hà') P0.hop = true; live.push(P0); home.people.push(P0); world.colliders.push({ x, z, r: .35 });
      PERSONAS['home_' + pp[0]] = { emoji: pp[2] ? '🧒' : '🙂', name: pp[0], age: pp[2] ? ['a child', 'một bạn nhỏ'] : ['grown-up', 'người lớn'], about: H.about, likes: pp[3], mood: ['Very well, thank you!', 'Khỏe lắm, cảm ơn con!'], role: `lives at ${H.name[0]} on Two Homes Street`, region: 'nam' };
      G.interactables.push({ id: `home_${k}_${j}`, x, z, r: 1.6, icon: '💬', label: () => nm(pp[0]), act: () => G.dialog(pp[0], [pp[3]]) });
    });
    let day = '';
    G.interactables.push({ id: home.kind === 'home8' ? 'house8' : 'door' + k, x: door.x, z: door.z, r: 2.2, icon: '🚪', label: () => home.name(), act: async h => {
      sfx.tap(); setTimeout(() => sfx.tap(), 180);
      const who = home.people.length ? home.people[0].name : T('Knock knock!', 'Cốc cốc!');
      const hello = H && H.people.length ? H.people[0][3] : (KNOCK[hs.kind] || KNOCK.tube)[0];
      const k2 = await G.dialog(who, [hello], [['🏠 Go inside', '🏠 Vào nhà'], ['ℹ️ About this house', 'ℹ️ Về ngôi nhà này'], ['👋 Bye', '👋 Tạm biệt']]);
      const today = new Date().toDateString();
      if (k2 === 0) enter(h, home);
      if (k2 === 1) await about(home);
      if (k2 >= 0 && day !== today && GIFTS[hs.kind] && ITEMS[GIFTS[hs.kind]]) { day = today; give(h, GIFTS[hs.kind], 1); }
    } });
  });

  async function about(home) {
    const hs = home.hs, kind = KIND[home.kind] || KIND.tube, extra = home.H ? home.H.about : ABOUT_KIND[home.kind] || ABOUT_KIND.tube;
    await G.dialog(home.name(), [[`${kind[0]}. ${extra[0]}`, `${kind[1]}. ${extra[1]}`], [`Where: ${home.where()} (map square ${Math.round(hs.x)}, ${Math.round(hs.z)}).`, `Ở đâu: ${home.where()} (ô bản đồ ${Math.round(hs.x)}, ${Math.round(hs.z)}).`]]);
  }

  // ---------- inside ----------
  let room = null, inside = null; // the built room and the home it shows
  const visitors = new Map(); // hero -> where to come back out
  function enter(h, home) {
    if (inside && inside !== home && [...visitors.keys()].some(o => o !== h)) { G.toast(h, T('Your friend is visiting another house. Try again soon!', 'Bạn của con đang ở nhà khác. Lát nữa thử lại nhé!')); return; }
    const f = el('div', 'fade blue'); document.body.appendChild(f); sfx.tap();
    setTimeout(async () => {
      if (inside !== home) buildRoom(home);
      visitors.set(h, home);
      h.place(RX, RZ + 2.2, RY); h.yaw = Math.PI; h.camYaw = 0; h.gliding = false; h.indoors = home;
      f.classList.add('out'); setTimeout(() => f.remove(), 700);
      G.toast(h, '🏠 ' + home.name());
      say(`Welcome to ${home.name()}!`, `Chào mừng con đến ${home.name()}!`);
    }, 600);
  }
  const leaving = new Set();
  function leave(h) {
    const home = visitors.get(h); if (!home || leaving.has(h)) return; leaving.add(h);
    const f = el('div', 'fade blue'); document.body.appendChild(f);
    setTimeout(() => {
      const hs = home.hs, fx = Math.sin(hs.rot), fz = Math.cos(hs.rot), [x, z] = G.clearSpot ? G.clearSpot(home.door.x + fx * 1.2, home.door.z + fz * 1.2, .5) : [home.door.x, home.door.z];
      h.place(x, z); h.yaw = hs.rot; h.camYaw = hs.rot + Math.PI; h.indoors = null; visitors.delete(h); leaving.delete(h);
      if (!visitors.size) { clearRoom(); inside = null; }
      f.classList.add('out'); setTimeout(() => f.remove(), 700);
    }, 600);
  }

  const roomItems = [], roomPeople = [];
  function clearRoom() {
    roomPeople.forEach(p => { const i = live.indexOf(p); if (i >= 0) live.splice(i, 1); }); roomPeople.length = 0;
    if (room) { scene.remove(room); room.traverse(o => { if (o.geometry) o.geometry.dispose(); }); room = null; }
    roomItems.forEach(it => { const i = G.interactables.indexOf(it); if (i >= 0) G.interactables.splice(i, 1); }); roomItems.length = 0;
    for (let i = world.boxes.length - 1; i >= 0; i--) if (world.boxes[i].room) world.boxes.splice(i, 1);
  }
  function buildRoom(home) {
    clearRoom(); inside = home;
    const g = new THREE.Group(); g.position.set(RX, RY, RZ); room = g; scene.add(g);
    const theme = ROOMS[home.room] || ROOMS.tube, W2 = 7, D2 = 5.5, wallH = 2.4;
    const parts = [
      P(B(W2 * 2 + 6, .3, D2 * 2 + 6), '#7fae6a', [0, -.2, 0]), // a lawn round the house so it doesn't float
      P(B(W2 * 2, .12, D2 * 2), theme.floor, [0, .02, 0]),
      ...floorTiles(theme), ...walls(W2, D2, wallH, theme),
      ...theme.build()
    ];
    const m = new THREE.Mesh(merge(parts), toonVC()); m.receiveShadow = true; m.castShadow = true; g.add(m);
    // solid walls (with the door gap at the front)
    const bx = (x0, x1, z0, z1) => world.boxes.push({ x0: RX + x0, x1: RX + x1, z0: RZ + z0, z1: RZ + z1, room: true });
    bx(-W2 - .2, W2 + .2, -D2 - .2, -D2 + .1); bx(-W2 - .2, -W2 + .1, -D2, D2); bx(W2 - .1, W2 + .2, -D2, D2); bx(-W2 - .2, -1.2, D2 - .1, D2 + .2); bx(1.2, W2 + .2, D2 - .1, D2 + .2);
    // the family inside, and a welcome sign
    const fam = home.H ? home.H.people : [];
    fam.forEach((pp, j) => {
      const x = [-2.5, 2.4, -.9, 1.1][j] || 0, z = [-1.2, -1.4, .6, .8][j] || 0, P0 = person(pp, RX + x, RY, RZ + z, 0);
      g.attach(P0.A.root); g.attach(P0.tg); P0.hop = pp[0] === 'Em Hà'; live.push(P0); roomPeople.push(P0);
      const it = { id: `inroom_${j}`, x: RX + x, z: RZ + z + .8, y: RY, r: 1.7, icon: '💬', bubble: '💬', label: () => nm(pp[0]), act: () => G.dialog(pp[0], [pp[3]]) };
      G.interactables.push(it); roomItems.push(it);
    });
    if (!fam.length && home.room !== 'huenghi') { // nobody named lives here: the family's grandma says hello
      const gm = person(['Bà Năm', look('aodai', '#c0503a', GREY, 'buns'), 0], RX - 1.5, RY, RZ - 1.2, 0); g.attach(gm.A.root); g.attach(gm.tg); live.push(gm); roomPeople.push(gm);
      const it = { id: 'inroom_g', x: RX - 1.5, z: RZ - .4, y: RY, r: 1.7, icon: '💬', bubble: '💬', label: () => nm('Bà Năm'), act: () => G.dialog('Bà Năm', [(KNOCK[home.kind] || KNOCK.tube)[0]]) };
      G.interactables.push(it); roomItems.push(it);
    }
    if (home.room === 'huenghi') ['Bà Huệ', 'Ông Nghi'].forEach((n, j) => {
      const P0 = person([n, look(j ? 'shirt' : 'aodai', j ? '#d8d4c8' : '#7a4a8a', GREY, j ? 'short' : 'buns'), 0], RX + (j ? 2 : -2.6), RY, RZ - 1, 0); g.attach(P0.A.root); g.attach(P0.tg); live.push(P0); roomPeople.push(P0);
    });
    const out = { id: 'home_out', x: RX, z: RZ + 4.6, y: RY, r: 1.8, icon: '🚪', bubble: '🚪', label: () => T('Go outside', 'Ra ngoài'), act: h => leave(h) };
    const info = { id: 'home_info', x: RX + 5, z: RZ + 3.6, y: RY, r: 1.6, icon: 'ℹ️', bubble: 'ℹ️', label: () => T('About this house', 'Về ngôi nhà này'), act: () => about(home) };
    G.interactables.push(out, info); roomItems.push(out, info);
    const sign = sprite('ℹ️', .9); sign.position.set(5, 1.6, 3.6); g.add(sign);
  }
  // walking out of the open door also takes you back outside
  world.updaters.push(() => { for (const [h] of visitors) if (h.pos.y > RY - 20 && h.pos.z > RZ + 6.2) leave(h); });

  G.homes = { list: homes, enter, leave, about, isInside: h => visitors.has(h) };
  return G.homes;
}

// ---------- rooms ----------
function floorTiles(th) {
  if (!th.tiles) return [];
  const out = []; for (let x = -6.5; x <= 6.5; x += 1) for (let z = -5; z <= 5; z += 1) if ((Math.round(x + 6.5) + Math.round(z + 5)) % 2) out.push(P(B(.98, .02, .98), th.tiles, [x, .09, z]));
  return out;
}
function walls(W2, D2, h, th) {
  const w = th.wall, out = [];
  out.push(P(B(W2 * 2, h, .2), w, [0, h / 2, -D2]), P(B(.2, h, D2 * 2), w, [-W2, h / 2, 0]), P(B(.2, h, D2 * 2), w, [W2, h / 2, 0]));
  out.push(P(B(W2 - 1.2, h, .2), w, [-(W2 + 1.2) / 2, h / 2, D2]), P(B(W2 - 1.2, h, .2), w, [(W2 + 1.2) / 2, h / 2, D2]));
  out.push(P(B(W2 * 2 + .2, .14, .3), th.trim || '#ffffff', [0, h, -D2]), P(B(.3, .14, D2 * 2), th.trim || '#ffffff', [-W2, h, 0]), P(B(.3, .14, D2 * 2), th.trim || '#ffffff', [W2, h, 0]));
  // windows with the sky behind them
  for (const x of [-4.5, 4.5]) out.push(P(B(1.4, 1, .05), '#9fd3e8', [x, 1.5, -D2 + .13]), P(B(1.6, .1, .1), th.trim || '#ffffff', [x, .95, -D2 + .15]));
  for (const z of [-2, 2]) for (const s of [-1, 1]) out.push(P(B(.05, 1, 1.3), '#9fd3e8', [s * (W2 - .13), 1.5, z]));
  // doormat at the open door
  out.push(P(B(1.8, .03, .9), '#c0503a', [0, .1, D2 - .6]));
  return out;
}
// small furniture
const altar = (x, z) => [P(B(1.8, 1.1, .6), '#8a2a1a', [x, .55, z]), P(B(1.9, .08, .7), '#d4a020', [x, 1.12, z]), P(B(1.2, .8, .05), '#f2d36b', [x, 1.65, z - .25]), P(C(.08, .1, .2, 8), '#c0a060', [x, 1.25, z]), ...[-.15, 0, .15].map(d => P(C(.008, .008, .3, 4), '#a0502a', [x + d, 1.45, z])), P(C(.25, .2, .08, 10), '#e8d080', [x - .55, 1.2, z]), ...[0, 1, 2].map(i => P(S(.09), ['#ffb52e', '#e8433a', '#5fd36a'][i], [x - .6 + i * .07, 1.32, z + (i % 2) * .05])), P(C(.03, .03, .4, 6), '#e8433a', [x + .6, 1.35, z]), P(S(.06), '#ffd23f', [x + .6, 1.6, z])];
const sofaVN = (x, z) => [P(B(2.2, .45, .7), '#7a4a2a', [x, .3, z]), P(B(2.2, .7, .12), '#6a3a1a', [x, .7, z - .32]), P(B(.12, .55, .7), '#6a3a1a', [x - 1.1, .55, z]), P(B(.12, .55, .7), '#6a3a1a', [x + 1.1, .55, z]), P(B(1.2, .45, .7), '#7a4a2a', [x, .25, z + 1.1]), P(C(.08, .06, .1, 8), '#ffffff', [x - .2, .52, z + 1.1]), P(C(.08, .06, .1, 8), '#ffffff', [x + .2, .52, z + 1.1]), P(S(.12), '#f2f2f2', [x, .55, z + 1.1])];
const fan = (x, z) => [P(C(.05, .05, 1.4, 6), '#dddddd', [x, .7, z]), P(C(.25, .25, .04, 10), '#cccccc', [x, .02, z]), P(C(.35, .35, .1, 14), '#9fd0f0', [x, 1.45, z], [Math.PI / 2, 0, 0])];
const tv = (x, z) => [P(B(1.6, .55, .45), '#8a5a3b', [x, .28, z]), P(B(1.2, .7, .06), '#222222', [x, .95, z]), P(B(1.1, .6, .02), '#3a6ab0', [x, .95, z + .04])];
const moto = (x, z, col = '#d9483a') => [P(C(.25, .25, .08, 12), '#222222', [x, .25, z - .55], [0, 0, Math.PI / 2]), P(C(.25, .25, .08, 12), '#222222', [x, .25, z + .55], [0, 0, Math.PI / 2]), P(B(.3, .35, 1.1), col, [x, .55, z]), P(B(.3, .1, .5), '#2a2a2a', [x, .78, z - .1]), P(B(.6, .05, .05), '#999999', [x, .95, z + .55])];
const table = (x, z, col = '#a07048', w = 1.4, d = .9) => [P(B(w, .06, d), col, [x, .75, z]), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => P(B(.06, .75, .06), col, [x + a * (w / 2 - .08), .37, z + b * (d / 2 - .08)]))];
const stool = (x, z, col = '#e0453a') => [P(C(.18, .2, .35, 8), col, [x, .17, z])];
const shelf = (x, z, col = '#8a5a3b') => [P(B(1.4, 1.8, .4), col, [x, .9, z]), ...[.45, .95, 1.45].map(y => P(B(1.3, .04, .35), '#6a4026', [x, y, z + .02])), ...[0, 1, 2, 3, 4].map(i => P(B(.12, .35, .25), ['#e8433a', '#3a78c8', '#5fd36a', '#ffd23f', '#9a6ac0'][i], [x - .5 + i * .22, 1.15, z + .03]))];
const stairs = (x, z) => [0, 1, 2, 3, 4, 5].map(i => P(B(1.2, .3 * (i + 1), .4), '#c9b08a', [x, .15 * (i + 1), z + i * .4 - 1]));
const bed = (x, z, col = '#ffb3c6') => [P(B(1.6, .4, 2.1), '#a07048', [x, .2, z]), P(B(1.5, .15, 2), '#ffffff', [x, .45, z]), P(B(1.5, .1, 1.3), col, [x, .55, z + .3]), P(B(.6, .15, .35), '#ffffff', [x, .58, z - .75])];
const plant = (x, z) => [P(C(.22, .16, .4, 10), '#c0503a', [x, .2, z]), P(S(.35), '#4f9a52', [x, .65, z]), P(S(.22), '#5fa860', [x + .15, .9, z])];
const rug = (x, z, c1, c2) => [P(B(3, .02, 2), c1, [x, .1, z]), P(B(2.4, .025, 1.4), c2, [x, .1, z])];
const frame = (x, y, z, col = '#3a78c8') => [P(B(.6, .45, .04), '#6a4026', [x, y, z]), P(B(.5, .35, .02), col, [x, y, z + .02])];
const lantern = (x, z, y = 2.1) => [P(S(.22), '#e8332a', [x, y, z], [0, 0, 0], [1, 1.2, 1]), P(C(.08, .08, .06, 8), '#ffd23f', [x, y + .28, z]), P(C(.08, .08, .06, 8), '#ffd23f', [x, y - .28, z])];

const ROOMS = {
  tube: { floor: '#e8dcc8', tiles: '#d4c4a8', wall: '#f6e3c0', trim: '#ffffff', build: () => [...altar(0, -5), ...sofaVN(-3.5, -3), ...fan(3, -4.5), ...tv(4.6, -4.8), ...moto(5.5, 2.5), ...stairs(-6, 0), ...plant(-5.5, 4.4), ...frame(-2, 1.7, -5.35), ...frame(2, 1.7, -5.35, '#e8433a')] },
  banhmi: { floor: '#e8dcc8', tiles: '#d4c4a8', wall: '#f6c8a8', trim: '#ffffff', build: () => [...altar(0, -5), ...sofaVN(-3.5, -3), ...fan(3, -4.5),
    P(B(2.6, 1, .8), '#3a78c8', [2.8, .5, 2.6]), P(B(2.6, .5, .8), '#cfe8f6', [2.8, 1.25, 2.6]), ...[0, 1, 2, 3, 4].map(i => P(C(.08, .08, .6, 8), '#e8b060', [1.9 + i * .45, 1.15, 2.6], [0, 0, Math.PI / 2])), P(B(1.4, .3, .5), '#c0392b', [2.8, 1.75, 2.6]), ...moto(-5.5, 2.5, '#3a78c8'), ...stairs(-6, -1), ...plant(5.6, 4.4)] },
  coffee: { floor: '#d9c9a8', tiles: '#c4b08a', wall: '#f6e09a', trim: '#7a4a2a', build: () => [...altar(-3.5, -5), P(B(3, 1, .7), '#7a4a2a', [3, .5, -2.5]), ...[0, 1, 2, 3].map(i => [P(C(.06, .05, .12, 8), '#c0c0c0', [2 + i * .6, 1.08, -2.5]), P(C(.05, .05, .1, 8), '#3a2418', [2 + i * .6, 1.17, -2.5])]).flat(), ...table(0, 1, '#a07048', 1, .8), ...stool(-.8, 1), ...stool(.8, 1, '#3a78c8'), ...table(-3.5, 1.5, '#a07048', 1, .8), ...stool(-4.3, 1.5, '#ffd23f'), ...stool(-2.7, 1.5), ...fan(5.5, -4), ...plant(-6, 4.4), ...frame(0, 1.7, -5.35, '#6a4026')] },
  villa: { floor: '#b07a4a', wall: '#f3ead8', trim: '#3a7a5a', build: () => [P(B(2, 1.1, .9), '#1d1d1d', [-4.5, .55, -4.6]), P(B(1.9, .05, .5), '#ffffff', [-4.5, 1.12, -4.4]), P(B(.6, .45, .4), '#1d1d1d', [-4.5, .22, -3.6]), ...rug(0, -1, '#9a3a3a', '#d9b06a'), P(B(1, .45, .9), '#3a7a5a', [-1.6, .3, -1]), P(B(1, .7, .2), '#3a7a5a', [-1.6, .7, -1.4]), P(B(1, .45, .9), '#3a7a5a', [1.6, .3, -1]), P(B(1, .7, .2), '#3a7a5a', [1.6, .7, -1.4]), ...table(0, -.6, '#6a4026', 1, .7), ...shelf(4.8, -5), ...shelf(3.2, -5), P(S(.3), '#ffe8a0', [0, 2.2, -1]), ...plant(-6, 4.4), ...plant(6, 4.4), ...[-1, 1].map(s => P(B(.08, 2.2, 1.6), '#3a7a5a', [s * 6.85, 1.2, -2]))] },
  cottage: { floor: '#c9a06a', wall: '#f6f1e4', trim: '#5a8ac0', build: () => [...rug(-1, -1, '#3a6ab0', '#e8e0cc'), P(B(2.6, .5, .9), '#6b8f5a', [-1, .35, -2.8]), P(B(2.6, .7, .2), '#5a7a4a', [-1, .75, -3.2]), ...table(-1, -1.2, '#a07048', 1.2, .6), P(B(3, 1, .7), '#e8e0cc', [4, .5, -4.8]), P(B(3, .06, .75), '#8a8a8a', [4, 1.02, -4.8]), P(B(.9, 1.9, .7), '#f2f2f2', [6, .95, -4.8]), P(C(.05, .05, .9, 6), '#c9a05a', [-6.2, .6, 3], [0, 0, .3]), P(B(.12, .35, .5), '#c9a05a', [-6.05, 1.1, 3]), P(B(1.2, 1.1, .5), '#8a5a3b', [-5.8, .55, -4.8]), P(B(.9, .6, .1), '#2a2a2a', [-5.8, .6, -4.5]), ...plant(6, 4.4)] },
  brick: { floor: '#c98a6a', tiles: '#b5735a', wall: '#f0d8c0', trim: '#8a4a3a', build: () => [...altar(0, -5), ...table(-3, -1, '#6a4026', 1.6, 1), ...stool(-3.9, -1, '#6a4026'), ...stool(-2.1, -1, '#6a4026'), P(B(.8, .05, .8), '#e8d8a8', [3, .78, -1]), ...table(3, -1, '#6a4026', 1, 1), ...[0, 1].map(i => P(S(.07), i ? '#e8433a' : '#222222', [2.8 + i * .4, .85, -1])), ...plant(5.5, -4.6), ...plant(-5.5, -4.6), P(C(.3, .3, .9, 10), '#c9a05a', [5.6, 1.6, 2], [0, 0, 0], [1, 1, 1]), P(S(.12), '#ffd23f', [5.6, 1.5, 2]), ...frame(-3, 1.7, -5.35, '#5fd36a')] },
  raised: { floor: '#d9b48a', wall: '#efe6f6', trim: '#7a4aa0', build: () => [...altar(0, -5), ...sofaVN(3.5, -3), P(B(.08, 1.7, 1.2), '#8a5a3b', [-6.6, .85, -2]), P(B(.05, 1.3, .6), '#7a4aa0', [-6.5, 1.2, -2.2]), P(B(.05, 1.3, .6), '#9a6ac0', [-6.5, 1.2, -1.6]), P(C(.02, .45, .25, 16), '#e8d8a0', [-6.7, 1.9, 1.5], [0, 0, Math.PI / 2]), ...table(-2.5, 0, '#6a4026', 1, 1), P(C(.1, .08, .14, 8), '#5fbfa0', [-2.5, .85, 0]), ...plant(-5.5, 4.4), ...frame(3, 1.7, -5.35, '#7a4aa0')] },
  home8: { floor: '#e8dcc8', tiles: '#f2e6cc', wall: '#f6e3a8', trim: '#3b6fe0', build: () => [...altar(0, -5), ...table(-2.5, -1, '#a07048', 1.8, 1.1), ...stool(-3.5, -1), ...stool(-1.5, -1, '#3a78c8'), ...stool(-2.5, -1.9, '#ffd23f'), P(C(.22, .2, .25, 12), '#f2f2f2', [-2.5, .9, -1]), ...[0, 1, 2, 3].map(i => P(S(.1), ['#ffd23f', '#5fd36a', '#e8433a', '#ff9f43'][i], [-2 + (i % 2) * .2, .85, -.7 + i * .05])), ...sofaVN(3.5, -3), ...tv(4.6, -4.8), ...fan(-5.8, -4.6), ...frame(-2, 1.7, -5.35, '#ff7eb8'), ...frame(2, 1.7, -5.35, '#5fd36a'), ...plant(5.6, 4.4), ...moto(-5.5, 2.5, '#f2f2f2')] },
  huenghi: { floor: '#9a9a96', wall: '#e9b7ae', trim: '#c0392b', build: () => [...[0, 1, 2, 3, 4].flatMap(i => [P(C(.05, .05, 3.2, 6), '#6a6a70', [-4.6, .3 + i * .18, -4.4 + (i % 2) * .15], [0, 0, Math.PI / 2])]), ...[0, 1, 2].map(i => P(B(1, .2, 1), '#7a7a80', [-4.5, .1 + i * .2, -2])), ...table(3, -3.5, '#8a6a4a', 1.6, .9), P(B(.5, .05, .35), '#f2f2f2', [3, .8, -3.5]), P(B(.3, .04, .2), '#3a3a3a', [3.5, .8, -3.4]), P(B(.9, .9, .5), '#c0392b', [5.6, 1.5, -5.1]), P(S(.12), '#ffd23f', [5.6, 1.6, -4.8]), ...stool(2.4, -2.6), ...stool(3.6, -2.6), ...fan(0, -4.6), P(B(1.4, .6, 1), '#2d5a3a', [0, .3, 2.4])] },
  village: { floor: '#b8a07a', wall: '#e8d8b8', trim: '#6a4a2a', build: () => [...altar(0, -5), P(B(2.4, .45, 1.6), '#7a4a2a', [-4, .23, -2]), P(B(2.2, .05, 1.4), '#d9c08a', [-4, .47, -2]), ...[0, 1, 2].map(i => P(C(.3, .25, .7, 10), '#8a6a3a', [4.6 + (i % 2) * .4, .35, -4.5 + i * .7])), ...table(0, -1.5, '#6a4026', 1.2, .8), P(C(.18, .14, .12, 10), '#e8e0cc', [0, .85, -1.5]), ...plant(-5.8, 4.4), ...plant(5.8, 4.4)] },
  china: { floor: '#a8584a', tiles: '#984a3c', wall: '#f2e2c4', trim: '#c0392b', build: () => [...lantern(-3, -2), ...lantern(3, -2), ...lantern(0, 2), P(C(.9, .9, .08, 20), '#8a2a1a', [0, .75, -1.5]), P(C(.15, .2, .75, 10), '#6a2a1a', [0, .37, -1.5]), ...[0, 1, 2, 3].map(i => P(C(.2, .2, .45, 10), '#8a2a1a', [Math.cos(i * 1.57) * 1.3, .22, -1.5 + Math.sin(i * 1.57) * 1.3])), ...[-4, 4].map(x => P(B(.9, 1.6, .03), '#f6efe0', [x, 1.4, -5.37])), ...[-4, 4].map(x => P(B(.06, 1.2, .02), '#2a2a2a', [x, 1.4, -5.33])), ...plant(-5.8, 4.4), ...plant(5.8, 4.4)] },
  india: { floor: '#e8c890', wall: '#f6d0a0', trim: '#e8433a', build: () => [P(B(2, .45, 1), '#8a5a3b', [-4, .3, -3]), ...[0, 1, 2, 3, 4].map(i => P(B(1.9, .03, .06), '#e8d8a8', [-4, .53, -3.4 + i * .2])), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => P(C(.5 - (i % 2) * .15, .5 - (i % 2) * .15, .02, 16), ['#e8433a', '#ffd23f', '#3a78c8', '#5fd36a', '#ff7eb8', '#ff9f43', '#9a6ac0', '#ffffff'][i], [1, .1 + i * .003, 0], [0, i * .4, 0], [1 - i * .1, 1, 1 - i * .1])), ...[0, 1, 2, 3, 4].map(i => [P(C(.08, .05, .05, 8), '#c0702a', [-1 + i * .5, .12, 3.5]), P(S(.04), '#ffd23f', [-1 + i * .5, .2, 3.5])]).flat(), ...[0, 1, 2].map(i => P(S(.18), '#c9a020', [4.5 + i * .45, .2, -4.6])), ...plant(-5.8, 4.4)] }
};

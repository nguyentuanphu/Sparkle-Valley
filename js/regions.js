// Places that bring both homes to life:
//  • Chợ Ba Miền (Three Regions Market): street food from the north (Hà Nội), centre (Huế, Hội An) and
//    south (Sài Gòn, Bà Rịa) of Vietnam, each vendor speaking with their own regional words.
//  • Aussie Corner: a milk bar, a fish and chip shop, a bakery, an ice-cream van, a sausage sizzle, a
//    playground with a flying fox, and a cricket pitch, with shopkeepers who love their Aussie slang.
//  • Landmarks to visit and collect as postcards: Opera House, Harbour Bridge, Uluru, the Big Banana,
//    Bondi lifesavers' tower, Vũng Tàu lighthouse, Turtle Tower, One Pillar Pagoda, Hội An's covered bridge
//    and Bến Thành market's clock tower.
import { THREE, toon, toonVC, P, merge, sprite } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say } from './voice.js';
import { SFX, tone } from './audio.js';
import { heightAt, MARKET, AUSSIE } from './world.js';
import { buildAvatar } from './avatar.js';
import { Box, Cyl, gable, hip, win } from './town.js';
import { dialog, reward } from './ui.js';
import { farm, saveFarm } from './state.js';
import { PERSONAS } from './chat.js';
import { AUSSIE_SLANG, VN_WORDS, REGION_NAME } from './words.js';
import { dist2, pick } from './util.js';

// ---------- small builders ----------
function signMesh(text, bg = '#c0392b', fg = '#fff8e0', w = 4, h = .9, font = 'Fredoka') {
  // text is 'WORDS' or ['English', 'Tiếng Việt']; it redraws when the language changes
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const g = c.getContext('2d');
  const draw = () => {
    const tx = Array.isArray(text) ? T(text[0], text[1]) : text;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = c.height * .55; g.font = `bold ${size}px ${font}, "Baloo 2", sans-serif`;
    while (g.measureText(tx).width > c.width - 40 && size > 10) { size -= 2; g.font = `bold ${size}px ${font}, "Baloo 2", sans-serif`; }
    g.fillText(tx, c.width / 2, c.height / 2 + 2);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (Array.isArray(text)) onLang(() => { draw(); t.needsUpdate = true; });
  // two faces back to back, so the words read the right way round from both sides
  const g2 = new THREE.Group(), m = new THREE.MeshBasicMaterial({ map: t });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b.rotation.y = Math.PI; b.position.z = -.01;
  g2.add(a, b); return g2;
}
// a market stall: table, posts, striped canopy
function stall(a, b, w = 3, d = 1.6) {
  const p = [];
  p.push(P(Box(w, .9, d), '#8a5a3b', [0, .45, 0]), P(Box(w + .1, .06, d + .1), '#e8dcc0', [0, .92, 0]));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => p.push(P(Box(.1, 2.6, .1), '#6b4a32', [x * (w / 2 - .05), 1.3, z * (d / 2 - .05)])));
  for (let k = 0; k < 6; k++) p.push(P(Box(w / 6 + .02, .08, d + 1), k % 2 ? a : b, [-w / 2 + w / 12 + k * w / 6, 2.65, .3], [.18, 0, 0]));
  return merge(p);
}
function tag(scene, text, x, y, z) {
  registerName(text);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  const draw = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill();
    g.font = 'bold 28px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm(text), 128, 34, 228); };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.position.set(x, y, z); scene.add(s); return s;
}

// ---------- the people who sell things ----------
// region: bac | trung | nam | au.  word: index into VN_WORDS / AUSSIE_SLANG they like to teach first.
const L = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
export const VENDORS = [
  { id: 'bahai', name: 'Bà Hai', region: 'bac', look: L('aodai', '#7a4a8a', '#d8d8d8', 'buns'), x: 103, z: 77.4, face: 0, stall: ['#c0392b', '#f6e7c8'], sign: ['HANOI PHỞ', 'PHỞ HÀ NỘI'], goods: ['🍜', '🌿'], food: ['🍜', 'a bowl of phở', 'bát phở', 6],
    greet: ["Come here, little one! A hot bowl of phở? Up north we call a bowl a 'bát'.", 'Cháu ơi, vào đây ăn bát phở nóng không? Ngon lắm đấy, ăn đi cháu!'], role: 'a kind grandma from Hà Nội in the north of Vietnam who sells phở and speaks with a northern accent (bát, thế, đấy, ạ)' },
  { id: 'cothu', name: 'Cô Thu', region: 'bac', look: L('aodai', '#e8d27a', '#1d1412', 'long', 'nonla'), x: 108.5, z: 87.6, face: Math.PI, pole: true, food: ['🟢', 'green rice flakes (cốm)', 'cốm làng Vòng', 4],
    greet: ['Cốm, fresh green rice flakes from Hà Nội! I carry everything on my shoulder pole.', 'Cốm đây! Cốm làng Vòng thơm lắm! Cô gánh hàng rong đi khắp phố đấy cháu ạ.'], role: 'a street seller from Hà Nội who carries her goods on a bamboo shoulder pole (gánh hàng rong)' },
  { id: 'olai', name: 'O Lài', region: 'trung', look: L('aodai', '#3cc7e8', '#1d1412', 'long', 'nonla'), x: 118, z: 77.4, face: 0, stall: ['#7a4aa8', '#f6e7c8'], sign: ['HUẾ RICE CAKES', 'BÁNH BÈO HUẾ'], goods: ['🥟', '🌶️'], food: ['🥟', 'little bánh bèo cakes', 'bánh bèo', 5],
    greet: ["Hello! In Huế we say 'răng rứa' for 'why is that'. Would you like some bánh bèo?", 'Răng rứa con? Mi ăn chi? Bánh bèo Huế ngon lắm nờ, ăn thử một đọi đi!'], role: 'a cheerful aunt from Huế in central Vietnam who speaks with a central accent (răng, rứa, mô, tê, chi, o)' },
  { id: 'chunam', name: 'Chú Năm', region: 'trung', look: L('tunic', '#c0392b', '#2a2a2a', 'short'), x: 124, z: 88.6, face: Math.PI, stall: ['#e8a33a', '#f6e7c8'], sign: ['HỘI AN LANTERNS', 'ĐÈN LỒNG HỘI AN'], goods: ['🏮', '👒'], food: ['🏮', 'a Hội An silk lantern', 'đèn lồng Hội An', 8],
    greet: ['These silk lanterns come from Hội An. At night the whole old town glows!', 'Đèn lồng Hội An đây! Tối tối cả phố cổ sáng rực, đẹp lắm mi ơi!'], role: 'a lantern maker from Hội An in central Vietnam' },
  { id: 'chutam', name: 'Chú Tám', region: 'nam', look: L('shirt', '#ffffff', '#1d1412', 'short', 'cap'), x: 134, z: 77.4, face: 0, stall: ['#3a78c8', '#f6e7c8'], sign: ['SÀI GÒN BÁNH MÌ', 'BÁNH MÌ SÀI GÒN'], goods: ['🥖', '🥒'], food: ['🥖', 'a crunchy bánh mì', 'ổ bánh mì', 5],
    greet: ["Hey there! Crunchy bánh mì, super yummy! Down south we say 'ngon bá cháy'!", 'Con ăn gì nè? Bánh mì nóng giòn nè, ngon bá cháy luôn đó con!'], role: 'a friendly bánh mì seller from Sài Gòn in the south who speaks with a southern accent (nè, nha, nghen, dzậy, bá cháy)' },
  { id: 'cout', name: 'Cô Út', region: 'nam', look: L('dress', '#5fd39a', '#1d1412', 'ponytail', 'nonla', '#e0aa80'), x: 140, z: 88.6, face: Math.PI, stall: ['#2f9a5a', '#f6e7c8'], sign: ['COCONUTS · SWEET SOUP', 'NƯỚC DỪA · CHÈ'], goods: ['🥥', '🍧'], food: ['🥥', 'a cold coconut', 'trái dừa tươi', 5],
    greet: ['Fresh coconut from Bà Rịa! Cold and sweet. Down south a fruit is a "trái"!', 'Dừa tươi Bà Rịa nè con! Mát lạnh, ngọt lịm. Uống một trái nghen!'], role: 'a coconut and sweet soup seller from Bà Rịa in southern Vietnam' },
  { id: 'kelly', name: 'Mrs Kelly', region: 'au', look: L('dress', '#ff9f43', '#c98b4a', 'buns', 'none', '#ffe3d1'), x: -136, z: -17.4, face: 0, food: ['🍬', 'a bag of lollies', 'túi kẹo', 3],
    greet: ["G'day, love! After some lollies? Mixed lollies are heaps good this arvo!", 'Chào cháu! Mua kẹo không? Ở Úc, kẹo gọi là "lollies" đó!'], role: 'the friendly owner of an old-fashioned Australian milk bar (corner shop) who sells lollies, icy poles and milkshakes and uses Aussie slang' },
  { id: 'davo', name: 'Davo', region: 'au', look: L('shirt', '#3a78c8', '#6b4226', 'short', 'cap', '#ffe3d1'), x: -126, z: -17.4, face: 0, food: ['🍟', 'hot chips', 'khoai tây chiên', 5],
    greet: ["How ya going, mate? Hot chips with chicken salt! Watch out for the seagulls!", 'Khỏe không bạn? Khoai chiên nóng hổi nè! Coi chừng mấy con hải âu giành ăn đó!'], role: 'a cheerful Aussie fish and chip shop owner by the beach who says mate and no worries' },
  { id: 'bev', name: 'Aunty Bev', region: 'au', look: L('overalls', '#ff7eb8', '#e8e8e8', 'short', 'none', '#ffe3d1'), x: -116, z: -17.4, face: 0, food: ['🥧', 'a meat pie', 'bánh pie nhân thịt', 6],
    greet: ['Morning, darl! A pie for brekkie? Or a lamington, they are ripper!', 'Chào con! Ăn bánh pie cho bữa sáng không? Bánh lamington cũng ngon tuyệt nha!'], role: 'a warm Australian baker who sells meat pies, sausage rolls and lamingtons' },
  { id: 'gazza', name: 'Gazza', region: 'au', look: L('shirt', '#f7c6d9', '#3b2618', 'spiky', 'cap', '#ffe3d1'), x: -99, z: -6.2, face: -2.5, food: ['🍦', 'a soft-serve ice cream', 'kem ốc quế', 4],
    greet: ['Ding ding! The ice-cream van is here! Soft serve with sprinkles? Too easy!', 'Đinh đoong! Xe kem tới rồi! Kem ốc quế rắc cốm màu nha? Dễ ợt!'], role: 'an Aussie ice-cream van driver who plays a jingle around the neighbourhood' },
  { id: 'robbo', name: 'Uncle Robbo', region: 'au', look: L('tunic', '#2f6a4f', '#8a8a8a', 'short', 'none', '#e0aa80'), x: -114, z: -.6, face: Math.PI, food: ['🌭', 'a snag in bread', 'xúc xích kẹp bánh mì', 4],
    greet: ['Sausage sizzle! Snag in bread with sauce and onions, mate. Fair dinkum the best!', 'Xúc xích nướng đây! Kẹp bánh mì với tương cà và hành. Ngon thiệt sự!'], role: 'a jolly Aussie uncle running a weekend sausage sizzle at the park' }
];

// ---------- landmarks you can collect as postcards ----------
export const LANDMARKS = [
  { id: 'opera', icon: '🎭', x: 98, z: 128, name: () => T('Sydney Opera House', 'Nhà hát Opera Sydney'), fact: ['The Sydney Opera House has roofs shaped like big white sails. Inside, people sing, dance and play music.', 'Nhà hát Opera Sydney có mái hình những cánh buồm trắng khổng lồ. Bên trong, người ta hát, múa và chơi nhạc.'] },
  { id: 'harbour', icon: '🌉', x: 59, z: 47, name: () => T('Harbour Bridge', 'Cầu Cảng Sydney'), fact: ['The Sydney Harbour Bridge is nicknamed "the Coathanger" because of its shape. Brave people climb right to the top!', 'Cầu Cảng Sydney có biệt danh là "cái móc áo" vì hình dáng của nó. Có người còn leo lên tận đỉnh cầu!'] },
  { id: 'uluru', icon: '🪨', x: -128, z: 136, name: () => T('Uluru', 'Uluru'), fact: ['Uluru is a giant red rock in the middle of Australia. It is a very special place for Aboriginal people, its traditional owners, and it glows orange at sunset.', 'Uluru là một khối đá đỏ khổng lồ ở giữa nước Úc. Đây là nơi rất thiêng liêng của người Thổ dân, chủ nhân truyền thống của vùng đất, và đá rực cam lúc hoàng hôn.'] },
  { id: 'banana', icon: '🍌', x: -98, z: -18, name: () => T('The Big Banana', 'Quả Chuối Khổng Lồ'), fact: ['Australia loves its "Big Things"! The Big Banana in Coffs Harbour is one of the most famous. There is a Big Pineapple and a Big Prawn too!', 'Nước Úc rất thích "những thứ khổng lồ"! Quả Chuối Khổng Lồ ở Coffs Harbour là nổi tiếng nhất. Còn có Quả Dứa Khổng Lồ và Con Tôm Khổng Lồ nữa!'] },
  { id: 'bondi', icon: '🏖️', x: 18, z: 154, name: () => T("Lifesavers' Tower", 'Tháp Cứu Hộ Bãi Biển'), fact: ['On Aussie beaches, lifesavers in red and yellow keep everyone safe. Always swim between the red and yellow flags!', 'Ở bãi biển nước Úc, đội cứu hộ mặc đồ đỏ vàng giữ an toàn cho mọi người. Luôn bơi giữa hai lá cờ đỏ vàng nhé!'] },
  { id: 'lighthouse', icon: '🗼', x: -10, z: 160, name: () => T('Vũng Tàu Lighthouse', 'Hải Đăng Vũng Tàu'), fact: ['The Vũng Tàu lighthouse stands on a hill by the sea in Bà Rịa–Vũng Tàu. Its light helps ships find their way at night.', 'Hải đăng Vũng Tàu nằm trên đồi bên bờ biển Bà Rịa–Vũng Tàu. Ánh đèn giúp tàu thuyền tìm đường vào ban đêm.'] },
  { id: 'turtle', icon: '🐢', x: 103, z: 93.5, name: () => T('Turtle Tower', 'Tháp Rùa'), fact: ['Tháp Rùa stands in Hoàn Kiếm Lake in Hà Nội. Legend says a golden turtle took back a magic sword there after peace came.', 'Tháp Rùa nằm giữa Hồ Hoàn Kiếm ở Hà Nội. Truyền thuyết kể rằng Rùa Vàng đã nhận lại thanh gươm thần ở đó khi đất nước thanh bình.'] },
  { id: 'onepillar', icon: '🪷', x: 111, z: 73, name: () => T('One Pillar Pagoda', 'Chùa Một Cột'), fact: ['Chùa Một Cột in Hà Nội stands on one stone pillar, like a lotus flower rising from the water.', 'Chùa Một Cột ở Hà Nội đứng trên một cột đá, giống như bông sen vươn lên khỏi mặt nước.'] },
  { id: 'chuacau', icon: '🌉', x: 121, z: 93.5, name: () => T('Hội An Covered Bridge', 'Chùa Cầu Hội An'), fact: ['Chùa Cầu in Hội An is a covered bridge about 400 years old. At night the old town glows with silk lanterns.', 'Chùa Cầu ở Hội An là cây cầu có mái che khoảng 400 năm tuổi. Ban đêm, phố cổ lung linh đèn lồng.'] },
  { id: 'benthanh', icon: '🕰️', x: 145, z: 79, name: () => T('Bến Thành Clock Tower', 'Tháp Đồng Hồ Chợ Bến Thành'), fact: ['Chợ Bến Thành in Sài Gòn is famous for its clock tower. Inside you can find almost anything to eat!', 'Chợ Bến Thành ở Sài Gòn nổi tiếng với tháp đồng hồ. Bên trong có gần như đủ món ngon!'] }
];

export function createRegions(G) {
  const { scene, world } = G, mat = toonVC();
  const put = (geo, x, z, rot = 0, dy = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, heightAt(x, z) + dy, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  const box = (x0, x1, z0, z1) => world.boxes.push({ x0, x1, z0, z1 });
  const signAt = (text, x, y, z, rot = 0, bg, fg, w, h) => { const s = signMesh(text, bg, fg, w, h); s.position.set(x, heightAt(x, z) + y, z); s.rotation.y = rot; scene.add(s); return s; };
  const people = [];
  const person = (look, x, z, face) => { const A = buildAvatar(look, null); A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root); people.push(A); world.colliders.push({ x, z, r: .4 }); return A; };
  const I = (id, x, z, r, icon, label, act) => G.interactables.push({ id, x, z, r, icon, label, act, bubble: icon });

  // ================= Chợ Ba Miền =================
  const M = MARKET, mz = M.roadZ;
  { const g = [];
    g.push(P(Box(M.x1 - M.x0, .05, 8), '#d8cfbc', [(M.x0 + M.x1) / 2, .03, mz]));
    for (let x = M.x0 + 1; x < M.x1; x += 2) g.push(P(Box(.05, .06, 8), '#c4b9a2', [x, .035, mz]));
    const road = new THREE.Mesh(merge(g), mat); road.position.y = M.h; road.receiveShadow = true; scene.add(road); }
  // region banners across the street
  [[['THE NORTH · HÀ NỘI', 'MIỀN BẮC · HÀ NỘI'], 106, '#c0392b'], [['THE CENTRE · HUẾ · HỘI AN', 'MIỀN TRUNG · HUẾ · HỘI AN'], 121, '#7a4aa8'], [['THE SOUTH · SÀI GÒN · BÀ RỊA', 'MIỀN NAM · SÀI GÒN · BÀ RỊA'], 137, '#2f7ac8']].forEach(([t, x, c]) => {
    const posts = merge([P(Box(.2, 5, .2), '#6b4a32', [0, 2.5, -4.6]), P(Box(.2, 5, .2), '#6b4a32', [0, 2.5, 4.6])]); put(posts, x, mz);
    signAt(t, x, 4.6, mz, Math.PI / 2, c, '#fff8e0', 8.6, 1.1);
    world.colliders.push({ x, z: mz - 4.6, r: .3 }, { x, z: mz + 4.6, r: .3 });
  });
  // the entrance gate on the west
  { const p = [P(Box(1, 6, 1), '#c0392b', [0, 3, -4.8]), P(Box(1, 6, 1), '#c0392b', [0, 3, 4.8]), P(Box(1.4, .5, 11.4), '#e8c03a', [0, 6.2, 0]), P(Box(1.8, .3, 12.4), '#a24e3a', [0, 6.6, 0])];
    put(merge(p), M.x0 + .5, mz); signAt(['THREE REGIONS MARKET', 'CHỢ BA MIỀN'], M.x0 - .1, 5.3, mz, -Math.PI / 2, '#c0392b', '#ffe08a', 7, 1.2);
    world.colliders.push({ x: M.x0 + .5, z: mz - 4.8, r: .7 }, { x: M.x0 + .5, z: mz + 4.8, r: .7 }); }
  // lanterns along the central (Hội An) section
  for (let k = 0; k < 14; k++) { const l = sprite('🏮', .7); l.position.set(114 + k, M.h + 4.3 - Math.sin(k / 13 * Math.PI) * .6, mz + (k % 2 ? 1.2 : -1.2)); scene.add(l); }

  // ---- landmarks inside the market ----
  // Hồ Gươm with Tháp Rùa (Turtle Tower)
  const pond = (cx, cz, w, d) => { put(merge([P(Box(w + .8, .3, d + .8), '#b9b09c', [0, .15, 0]), P(Box(w, .32, d), '#5f9fb0', [0, .17, 0])]), cx, cz); box(cx - w / 2 - .4, cx + w / 2 + .4, cz - d / 2 - .4, cz + d / 2 + .4); };
  pond(103, 93.5, 8, 4.4);
  put(merge([P(Box(1.6, 1.2, 1.6), '#d8cdb6', [0, .8, 0]), P(Box(1.3, 1, 1.3), '#d8cdb6', [0, 1.9, 0]), P(Box(1, .9, 1), '#d8cdb6', [0, 2.85, 0]), P(new THREE.ConeGeometry(.9, .7, 4), '#8a7a5a', [0, 3.6, 0], [0, Math.PI / 4, 0]),
    P(new THREE.SphereGeometry(.6, 8, 6), '#3f7d5c', [-1.6, .3, .5], [0, 0, 0], [1.4, .4, 1]), P(Box(.35, .7, .05), '#5a4a3a', [0, 1.9, .66])]), 103, 93.5);
  // Chùa Một Cột (One Pillar Pagoda) on its own little pond
  pond(111, 73, 4.4, 4.4);
  put(merge([P(Cyl(.25, .3, 1.8, 8), '#cfc3a6', [0, 1, 0]), P(Box(1.9, .2, 1.9), '#8a5a3b', [0, 1.95, 0]), P(Box(1.5, 1, 1.5), '#a24e3a', [0, 2.5, 0]),
    P(new THREE.ConeGeometry(1.6, .9, 4), '#5a4a3a', [0, 3.4, 0], [0, Math.PI / 4, 0]), ...[0, 1, 2, 3].map(k => P(new THREE.ConeGeometry(.12, .5, 4), '#5a4a3a', [Math.cos(k * 1.571 + .785) * 1.1, 3.1, Math.sin(k * 1.571 + .785) * 1.1], [0, 0, 0]))]), 111, 73);
  // Chùa Cầu Hội An (covered bridge) over a small canal
  pond(121, 93.5, 3, 5);
  put(merge([P(Box(7, .3, 2.6), '#8a5a3b', [0, .9, 0]), ...[-3, -1, 1, 3].flatMap(x => [P(Box(.2, 1.8, .2), '#c0392b', [x, 1.9, 1.1]), P(Box(.2, 1.8, .2), '#c0392b', [x, 1.9, -1.1])])]), 121, 93.5, Math.PI / 2);
  { const r = []; gable(r, 7, 2.6, 1, 2.8, '#a24e3a', '#e8c03a'); put(merge(r), 121, 93.5, Math.PI / 2); }
  // Bến Thành clock tower on the east end
  { const p = [P(Box(3, 6, 10), '#f2e6c2', [0, 3, 0]), P(Box(2.4, 3, 2.4), '#f2e6c2', [0, 7.5, 0]), P(new THREE.ConeGeometry(1.8, 1.4, 4), '#a24e3a', [0, 9.7, 0], [0, Math.PI / 4, 0]),
      P(Cyl(.8, .8, .1, 16), '#ffffff', [-1.22, 7.6, 0], [0, 0, Math.PI / 2]), P(Box(.05, .6, .08), '#333', [-1.3, 7.75, 0]), P(Box(.05, .08, .45), '#333', [-1.3, 7.6, .15]),
      ...[-3, 0, 3].map(z => P(new THREE.TorusGeometry(.9, .12, 4, 10, Math.PI), '#d8b86a', [-1.52, 2.2, z], [0, Math.PI / 2, 0]))];
    put(merge(p), M.x1 + 1.8, mz - 4, 0); box(M.x1 + .3, M.x1 + 3.3, mz - 9, mz + 1);
    signAt(['BẾN THÀNH MARKET', 'CHỢ BẾN THÀNH'], M.x1 + .25, 5.2, mz - 4, -Math.PI / 2, '#2f7ac8', '#ffffff', 5, .8); }

  // ---- market stalls and vendors ----
  for (const v of VENDORS.filter(v => v.region !== 'au')) {
    const south = Math.abs(v.face) > 1;
    if (v.stall) {
      const sx = v.x, sz = v.z + (south ? -1.4 : 1.4);
      put(stall(v.stall[0], v.stall[1]), sx, sz, south ? Math.PI : 0);
      signAt(v.sign, sx, 3.2, sz + (south ? -1.15 : 1.15), south ? Math.PI : 0, v.stall[0], '#fff8e0', 3, .55);
      v.goods.forEach((gd, k) => { const s = sprite(gd, .55); s.position.set(sx - .7 + k * 1.2, M.h + 1.25, sz); scene.add(s); });
      box(sx - 1.6, sx + 1.6, sz - .9, sz + .9);
    }
    const A = person(v.look, v.x, v.z, v.face);
    if (v.pole) { // gánh hàng rong: a bamboo pole with two baskets on her shoulder
      const pole = new THREE.Mesh(merge([P(Box(2.4, .07, .07), '#c9a35a', [0, 0, 0]), ...[-1.1, 1.1].flatMap(x => [P(Cyl(.32, .25, .35, 10), '#b98a4a', [x, -.75, 0]), P(new THREE.SphereGeometry(.26, 8, 5), '#7fc45a', [x, -.55, 0], [0, 0, 0], [1, .5, 1]), P(Box(.02, .6, .02), '#7a5a3a', [x, -.3, 0])])]), mat);
      pole.position.set(0, 1.18, .02); A.root.add(pole);
    }
    tag(scene, v.name, v.x, M.h + 2.5, v.z);
    I('v_' + v.id, v.x, v.z + (south ? -2.6 : 2.6), 3, v.food[0], () => nm(v.name), h => vendorTalk(G, h, v));
  }

  // ================= Aussie Corner =================
  const A = AUSSIE, az = A.roadZ;
  { const g = [], L2 = A.x1 - A.x0, cx = (A.x0 + A.x1) / 2;
    g.push(P(Box(L2, .06, 7), '#b4b9bc', [cx, .03, az]), P(Box(L2, .07, 3), '#e8d5a8', [cx, .035, az - 5]), P(Box(L2, .07, 3), '#e8d5a8', [cx, .035, az + 5]));
    g.push(P(Box(L2, .08, .16), '#f6f1e4', [cx, .05, az - 3.2]), P(Box(L2, .08, .16), '#f6f1e4', [cx, .05, az + 3.2]));
    for (let x = A.x0 + 2; x < A.x1 - 2; x += 4) g.push(P(Box(1.8, .08, .16), '#f6f1e4', [x, .05, az]));
    // a "wombat crossing" (raised zebra crossing)
    for (let k = -3; k <= 3; k++) g.push(P(Box(.6, .1, 5.6), '#f6f1e4', [-121 + k * 1.1, .06, az]));
    const road = new THREE.Mesh(merge(g), mat); road.position.y = A.h; road.receiveShadow = true; scene.add(road); }
  // shops along the north side (fronts face the road)
  const shop = (x, w, wall, awn, text, signBg) => {
    const d = 8, p = [], front = az - 6.6, cz = front - d / 2;
    p.push(P(Box(w, 4.2, d), wall, [0, 2.1, 0]), P(Box(w + .2, .7, d + .2), '#f4efe2', [0, 4.45, 0]));
    p.push(P(Box(w - 1.6, 2.2, .1), '#9fd2ee', [-.6, 1.6, d / 2 + .03]), P(Box(1, 2.2, .1), '#6a4a3a', [w / 2 - 1, 1.1, d / 2 + .03]));
    p.push(P(Box(w, .12, 2.4), awn, [0, 3.1, d / 2 + 1.1], [.22, 0, 0]));
    [-1, 1].forEach(sx => p.push(P(Box(.12, 3, .12), '#f4efe2', [sx * (w / 2 - .2), 1.5, d / 2 + 2.2])));
    put(merge(p), x, cz); box(x - w / 2, x + w / 2, cz - d / 2, cz + d / 2);
    world.colliders.push({ x: x - w / 2 + .2, z: front + 2.2, r: .25 }, { x: x + w / 2 - .2, z: front + 2.2, r: .25 });
    signAt(text, x, 3.9, front + .05, 0, signBg, '#ffffff', w - .8, .9);
  };
  shop(-136, 8.5, '#f2e6c2', '#d9483a', ['MILK BAR · LOLLIES', 'TIỆM TẠP HÓA · KẸO'], '#d9483a');
  shop(-126, 8.5, '#cfe0e6', '#2f7ac8', ['FISH & CHIPS', 'CÁ & KHOAI CHIÊN'], '#2f7ac8');
  shop(-116, 8, '#f6d6b8', '#e8a33a', ['BAKERY · PIES', 'TIỆM BÁNH · BÁNH PIE'], '#a24e3a');
  // the Big Banana: a banana-smoothie shop wearing a giant banana
  { const p = [P(Box(7, 3.4, 6), '#fff3c4', [0, 1.7, 0]), P(Box(7.2, .4, 6.2), '#e8c03a', [0, 3.6, 0])];
    for (let k = 0; k <= 10; k++) { const a = -1.1 + k * .22, r = 6; p.push(P(new THREE.SphereGeometry(1.35 - Math.abs(k - 5) * .1, 10, 8), k === 0 || k === 10 ? '#6b5a2a' : '#f2d23a', [Math.sin(a) * r, 4.2 + Math.cos(a) * r - r + 3.2, 0])); }
    put(merge(p), -99, -20); box(-102.5, -95.5, -23, -17); signAt(['THE BIG BANANA', 'QUẢ CHUỐI KHỔNG LỒ'], -99, 2.9, -16.95, 0, '#e8c03a', '#5a3a1a', 5, .8); }
  // ice-cream van parked on the kerb
  const van = new THREE.Group();
  { const p = [P(Box(5, 2.2, 2.2), '#f7c6d9', [0, 1.5, 0]), P(Box(5.02, .5, 2.22), '#ffffff', [0, 2.4, 0]), P(Box(1.4, 1.5, 2.1), '#f7c6d9', [3.1, 1.15, 0]), P(Box(.05, .8, 1.8), '#9fd2ee', [3.82, 1.5, 0]),
      P(Box(2, 1, .05), '#3a3030', [-.4, 1.7, 1.12]), P(Box(2.2, .1, .5), '#ffffff', [-.4, 1.15, 1.3]),
      ...[[-1.6, 1], [-1.6, -1], [2.8, 1], [2.8, -1]].map(([x, z]) => P(Cyl(.42, .42, .25, 12), '#2f3336', [x, .42, z * 1.05], [Math.PI / 2, 0, 0])),
      P(new THREE.ConeGeometry(.5, 1.2, 10), '#e8b36a', [-.5, 3.3, 0], [Math.PI, 0, 0]), P(new THREE.SphereGeometry(.55, 10, 8), '#ffe0ec', [-.5, 4.1, 0]), P(new THREE.SphereGeometry(.2, 8, 6), '#e8433a', [-.5, 4.65, 0])];
    van.add(new THREE.Mesh(merge(p), mat)); van.position.set(-103, A.h, az + 4.2); van.rotation.y = Math.PI; scene.add(van); box(-106, -100, az + 3, az + 5.4); }
  // sausage sizzle tent with a barbie
  { const p = [P(Box(2.4, .9, 1.2), '#4a4a4a', [0, .45, 0]), P(Box(2.2, .06, 1), '#2a2a2a', [0, .93, 0]), ...[-.6, -.2, .2, .6].map(x => P(Cyl(.08, .08, .9, 6), '#b5483c', [x, 1, .1], [0, 0, Math.PI / 2])),
      ...[[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]].map(([x, z]) => P(Box(.08, 2.6, .08), '#dddddd', [x, 1.3, z])), P(Box(3.4, .1, 3), '#2f7ac8', [0, 2.6, 0]), P(new THREE.ConeGeometry(2.4, .7, 4), '#ffffff', [0, 3, 0], [0, Math.PI / 4, 0])];
    put(merge(p), -114, -2.2); box(-115.3, -112.7, -2.9, -1.5); const smoke = sprite('💨', .8); smoke.position.set(-114, A.h + 1.6, -2.2); scene.add(smoke); world.updaters.push((dt, t) => { smoke.position.y = A.h + 1.5 + (t * .6 % 1); smoke.material.opacity = 1 - (t * .6 % 1); }); }

  // the playground: flying fox, merry-go-round, see-saw
  const play = [];
  play.push(P(Box(20, .05, 16), '#c9a77a', [0, .03, 0]));
  [-9, 9].forEach(x => play.push(P(Box(.25, 4.6, .25), '#2f7ac8', [x, 2.3, -.6], [0, 0, x < 0 ? .12 : -.12]), P(Box(.25, 4.6, .25), '#2f7ac8', [x, 2.3, .6], [0, 0, x < 0 ? .12 : -.12])));
  play.push(P(Cyl(.03, .03, 18, 4), '#555', [0, 4.1, 0], [0, 0, Math.PI / 2]));
  play.push(P(Cyl(1.6, 1.6, .2, 18), '#e8433a', [-3, .45, 5]));
  play.push(P(Box(4, .12, .4), '#ffd23f', [4, .7, 5]), P(new THREE.ConeGeometry(.3, .6, 4), '#555', [4, .3, 5]));
  put(merge(play), -130, 6);
  world.colliders.push({ x: -139, z: 6, r: .5 }, { x: -121, z: 6, r: .5 }, { x: -133, z: 11, r: 1.7 }, { x: -126, z: 11, r: 1.2 });
  const trolley = new THREE.Mesh(merge([P(Box(.4, .3, .3), '#333', [0, 0, 0]), P(Box(.06, 1.8, .06), '#555', [0, -1, 0]), P(Cyl(.35, .35, .12, 12), '#ffd23f', [0, -1.95, 0])]), mat);
  scene.add(trolley);
  const merry = new THREE.Mesh(merge([0, 1, 2, 3].map(k => P(Box(.08, .9, .08), '#ffffff', [Math.cos(k * 1.57) * 1.2, .9, Math.sin(k * 1.57) * 1.2]))), mat); merry.position.set(-133, A.h, 11); scene.add(merry);
  const seesaw = new THREE.Mesh(merge([P(Box(4, .12, .4), '#ffd23f', [0, 0, 0])]), mat); seesaw.position.set(-126, A.h + .7, 11); scene.add(seesaw);
  const kid = buildAvatar(L('shirt', '#e8433a', '#c98b4a', 'short', 'cap', '#ffe3d1'), null); scene.add(kid.root); kid.armL.rotation.x = kid.armR.rotation.x = -2.8;
  // cricket pitch
  { const p = [P(Box(2.4, .04, 12), '#d9c48a', [0, .02, 0])];
    for (const z of [-5.4, 5.4]) for (const x of [-.2, 0, .2]) p.push(P(Cyl(.03, .03, .8, 5), '#f4efe2', [x, .4, z]));
    p.push(P(Box(.12, 1, .3), '#e8c69a', [.7, .5, 4.6], [0, 0, .3]));
    put(merge(p), -102, 6); }
  // a gum tree with a koala, and kangaroos hopping on the edge of the oval
  { const t = [P(Cyl(.25, .4, 6, 6), '#e9e1d2', [0, 3, 0]), P(new THREE.IcosahedronGeometry(1.8, 0), '#7f9a6a', [0, 6.8, 0], [0, 0, 0], [1.3, .7, 1.3]), P(new THREE.IcosahedronGeometry(1.3, 0), '#8aa676', [1.3, 6, .4], [0, 0, 0], [1.2, .7, 1.2])];
    put(merge(t), -92, 12); world.colliders.push({ x: -92, z: 12, r: .5 });
    const koala = sprite('🐨', 1.1); koala.position.set(-91.6, heightAt(-92, 12) + 4.6, 12.3); scene.add(koala); }
  const roos = [0, 1, 2].map(k => { const s = sprite('🦘', 1.6); scene.add(s); return { s, a: k * 2.1 }; });

  // shopkeepers
  for (const v of VENDORS.filter(v => v.region === 'au')) {
    person(v.look, v.x, v.z, v.face);
    tag(scene, v.name, v.x, A.h + 2.5, v.z);
    I('v_' + v.id, v.x, v.z + (Math.abs(v.face) > 1 ? -2.4 : 2.6), 3, v.food[0], () => nm(v.name), h => vendorTalk(G, h, v));
  }

  // ---- kids and grown-ups who host the folk games ----
  const HOSTS = [
    ['datnieu', 'Bông', L('dress', '#ff7eb8', '#1d1412', 'buns'), 117, 75.5, 0, ['Đập niêu! I will blindfold you, and we all shout where the pot is!', 'Đập niêu nè! Tớ bịt mắt bạn, cả nhóm sẽ hô cho bạn biết niêu ở đâu!']],
    ['chichi', 'Bà Năm', L('aodai', '#5b7fbf', '#d8d8d8', 'buns'), 128, 74.5, 0, ['Come, grandchild. Put your finger in my hand: chi chi chành chành!', 'Lại đây cháu. Đặt ngón tay vào tay bà nào: chi chi chành chành!']],
    ['kite', 'Anh Hai', L('shirt', '#3cc7e8', '#1d1412', 'spiky', 'nonla', '#e0aa80'), 142, 93.5, Math.PI, ['The wind is perfect for flying kites, like on the beach at Vũng Tàu!', 'Gió đẹp quá, thả diều thôi em, giống như trên bãi biển Vũng Tàu vậy!']],
    ['words', 'Cô Hạnh', L('aodai', '#ffffff', '#1d1412', 'long'), 100, 87.6, Math.PI, ['I am a teacher. Did you know a bowl is "bát" in the north and "chén" in the south? Want to learn more?', 'Cô là cô giáo. Con có biết miền Bắc gọi là "bát", miền Nam gọi là "chén" không? Học thêm nhé?']],
    ['sackrace', 'Noah', L('overalls', '#2f7ac8', '#e8c26a', 'short', 'cap', '#ffe3d1'), -137, -1.5, Math.PI, ['Sack race! Like at our school sports day. Ready, set, hop!', 'Đua nhảy bao bố! Giống ngày hội thể thao ở trường tớ. Chuẩn bị, nhảy!']],
    ['parcel', 'Chloe', L('dress', '#ffd23f', '#a8432a', 'long', 'bow', '#ffe3d1'), -117, 11, -1.4, ["It's my birthday party! Let's play pass the parcel!", 'Hôm nay sinh nhật tớ! Chơi chuyền quà đi!']],
    ['cricket', 'Liam', L('shirt', '#ffffff', '#6b4226', 'short', 'cap', '#ffe3d1'), -100.5, 12.5, Math.PI, ["Fancy a hit of backyard cricket, mate? You bat first!", 'Chơi cricket sân sau không bạn? Bạn đánh trước nhé!']]
  ];
  for (const [game, name, look, x, z, face, line] of HOSTS) {
    person(look, x, z, face); tag(scene, name, x, heightAt(x, z) + 2.5, z);
    I('g_' + game, x, z + (Math.abs(face) > 1 ? -2 : 2), 3, G.GAMES_ICON ? G.GAMES_ICON(game) : '🎮', () => nm(name), h => G.kidTalk(h, game, name, line));
  }
  // party decorations and hanging pots
  { const t = [P(Box(2.4, .1, 1.2), '#ffffff', [0, .8, 0]), ...[[-1, -.5], [1, -.5], [-1, .5], [1, .5]].map(([x, z]) => P(Box(.08, .8, .08), '#dddddd', [x, .4, z]))];
    put(merge(t), -119, 11); world.colliders.push({ x: -119, z: 11, r: 1.2 }); ['🎈', '🎂', '🎁'].forEach((e, k) => { const sp = sprite(e, .7); sp.position.set(-119.8 + k * .8, A.h + 1.2 + (k === 0 ? .8 : 0), 11); scene.add(sp); }); }
  { const t = [P(Box(.15, 3.2, .15), '#6b4a32', [-2.5, 1.6, 0]), P(Box(.15, 3.2, .15), '#6b4a32', [2.5, 1.6, 0]), P(Box(5.2, .12, .12), '#6b4a32', [0, 3.2, 0])];
    for (let k = 0; k < 4; k++) t.push(P(Cyl(.02, .02, .7, 3), '#a08060', [-1.8 + k * 1.2, 2.85, 0]), P(new THREE.SphereGeometry(.32, 8, 6), '#a0603a', [-1.8 + k * 1.2, 2.35, 0], [0, 0, 0], [1, .85, 1]));
    put(merge(t), 117, 73); world.colliders.push({ x: 114.5, z: 73, r: .3 }, { x: 119.5, z: 73, r: .3 }); }
  const kiteS = sprite('🪁', 1.6); scene.add(kiteS);
  const kline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#5a4a3a' })); scene.add(kline);
  world.updaters.push((dt, t) => { const k = new THREE.Vector3(140 + Math.sin(t * .5) * 3, M.h + 16 + Math.sin(t * .9) * 1.5, 100 + Math.cos(t * .4) * 2); kiteS.position.copy(k); kline.geometry.setFromPoints([new THREE.Vector3(142, M.h + 1.2, 93.2), k]); });

  // ================= landmarks in the wider valley =================
  // Sydney Opera House on the lake's east beach, looking over the water like Bennelong Point
  { const p = [P(Box(16, 1.6, 10), '#cdb89a', [0, .8, 0]), P(Box(16, .3, 2), '#d9c9aa', [0, .15, 6])];
    const sail = (x, z, s, rot) => { p.push(P(new THREE.ConeGeometry(2.4 * s, 5 * s, 12, 1, true, 0, Math.PI), '#f4f1ea', [x, 1.6 + 2.2 * s, z], [-.35, rot, 0])); };
    sail(-4.5, 1, 1.15, 0); sail(-2, .8, 1, 0); sail(.2, .6, .8, 0); sail(3.5, 0, 1, Math.PI); sail(5.6, .2, .8, Math.PI);
    put(merge(p), 98, 128, -Math.PI / 2); world.colliders.push({ x: 98, z: 128, r: 6.5 }); }
  // lifesavers' tower and the red-and-yellow flags
  { const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => P(Box(.15, 3, .15), '#dddddd', [x, 1.5, z])), P(Box(2.6, 1.6, 2.6), '#ffffff', [0, 3.8, 0]), P(Box(2.7, .4, 2.7), '#2f7ac8', [0, 4.4, 0]),
      ...[-6, 6].flatMap(x => [P(Box(.06, 2.4, .06), '#888', [x, 1.2, 4]), P(Box(.8, .3, .04), '#e8433a', [x + .4, 2.2, 4]), P(Box(.8, .3, .04), '#ffd23f', [x + .4, 1.9, 4])])];
    put(merge(p), 18, 154); world.colliders.push({ x: 18, z: 154, r: 1.6 }); }
  // Vũng Tàu lighthouse on the hill
  { const p = [P(Cyl(1.3, 1.7, 8, 12), '#ffffff', [0, 4, 0]), P(Cyl(1.5, 1.5, .3, 12), '#cfd6da', [0, 8.1, 0]), P(Cyl(.9, .9, 1.4, 10), '#ffe9a0', [0, 8.9, 0]), P(new THREE.ConeGeometry(1.2, 1.2, 10), '#c0392b', [0, 10.2, 0]), P(Box(4, 1.8, 3), '#f2e6c2', [2.6, .9, 0])];
    put(merge(p), -10, 160); world.colliders.push({ x: -10, z: 160, r: 1.8 }, { x: -7.4, z: 160, r: 1.8 });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.5, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide }));
    beam.geometry.translate(0, -15, 0); beam.geometry.rotateZ(Math.PI / 2); const piv = new THREE.Group(); piv.position.set(-10, heightAt(-10, 160) + 8.9, 160); piv.add(beam); scene.add(piv);
    world.updaters.push((dt, t) => { piv.rotation.y = t * .8; beam.visible = world.isNight(); }); }
  // Uluru in the far south-west
  { const p = [P(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#c4542e', [0, -.5, 0], [0, 0, 0], [30, 11, 13])];
    for (let k = 0; k < 9; k++) p.push(P(Box(.6, 6, 1.5), '#a8442a', [-20 + k * 5, 3, 12.2 - Math.abs(k - 4) * .9]));
    put(merge(p), -128, 152, .2); box(-156, -100, 142, 162); }
  // the Harbour Bridge already carries the road: just add its postcard below

  for (const lm of LANDMARKS) I('pc_' + lm.id, lm.x, lm.z + (lm.id === 'uluru' ? 0 : 0), lm.id === 'uluru' ? 5 : 3.4, '📮', () => T('Postcard: ', 'Bưu thiếp: ') + lm.name(), h => postcard(G, h, lm));

  // ---------- life ----------
  let jingleT = 5;
  world.updaters.push((dt, t) => {
    const near = (x, z, r) => G.heroes.some(h => dist2(h.pos.x, h.pos.z, x, z) < r);
    if (near(-117, -5, 60)) {
      const k = (Math.sin(t * .5) + 1) / 2; trolley.position.set(-138.6 + k * 17.2, A.h + 4 - Math.sin(k * Math.PI) * .2, 6);
      kid.root.position.set(trolley.position.x, trolley.position.y - 3.4, 6); kid.root.rotation.y = Math.cos(t * .5) > 0 ? Math.PI / 2 : -Math.PI / 2;
      merry.rotation.y = t * 1.2; seesaw.rotation.z = Math.sin(t * 1.6) * .25;
      roos.forEach((r, k) => { const a = t * .25 + r.a; r.s.position.set(-102 + Math.cos(a) * 9, A.h + .8 + Math.abs(Math.sin(t * 4 + k)) * .9, 6 + Math.sin(a) * 6); });
      jingleT -= dt;
      if (jingleT < 0 && near(-103, az + 4, 26)) { jingleT = 22; [659, 587, 523, 587, 659, 659, 659].forEach((f, i) => setTimeout(() => tone(f, .22, { type: 'triangle', vol: .12 }), i * 230)); }
    }
  });
  people.forEach((P2, k) => world.updaters.push((dt, t) => { if (P2.armR) P2.armR.rotation.x = Math.sin(t * 1.5 + k) * .25; }));

  // villagers you can chat with
  for (const v of VENDORS) PERSONAS[v.id] = {
    emoji: v.food[0], name: v.name, age: ['old enough to know the best food in town', 'đủ lớn để biết món nào ngon nhất'],
    about: [v.greet[0], v.greet[1]], likes: [`Making ${v.food[1]} for hungry kids!`, `Làm ${v.food[2]} cho các bạn nhỏ đói bụng!`], mood: v.region === 'au' ? ["Good as gold, mate!", 'Khỏe re, bạn ơi!'] : v.region === 'trung' ? ['Khỏe lắm, cảm ơn mi!', 'Khỏe lắm, cảm ơn mi!'] : v.region === 'nam' ? ['Khỏe re nè!', 'Khỏe re nè con!'] : ['Bà khỏe, cảm ơn cháu!', 'Bà khỏe, cảm ơn cháu!'],
    role: v.role, region: v.region
  };
}

// ---------- talking to a vendor: buy something, or learn a word from their home ----------
async function vendorTalk(G, h, v) {
  const p = h.profile;
  const k = await dialog(v.name, [v.greet], [[`${v.food[0]} Buy ${v.food[1]} (${G.fmt(v.food[3])})`, `${v.food[0]} Mua ${v.food[2]} (${G.fmt(v.food[3])})`], ['🗣️ Teach me a word!', '🗣️ Dạy con một từ!'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) {
    if (farm.coins >= v.food[3]) { farm.coins -= v.food[3]; saveFarm(); } else say("Here, this one's on me!", 'Thôi, lần này cho con đó!');
    SFX.chime(); h.bonusStamina = Math.max(h.bonusStamina, 40); h.stamina = h.staminaMax;
    p.tasted = p.tasted || {}; const first = !p.tasted[v.id]; p.tasted[v.id] = true; G.save();
    await reward(v.food[0], T(`Yum, ${v.food[1]}!`, `Ngon quá, ${v.food[2]}!`), first ? T('A new taste for your food passport! Full of energy.', 'Món mới trong hộ chiếu ẩm thực! Tràn đầy năng lượng.') : T('Full of energy!', 'Tràn đầy năng lượng!'));
  }
  if (k === 1) {
    p.words = p.words || {};
    if (v.region === 'au') {
      const left = AUSSIE_SLANG.filter(s => !p.words['au:' + s[0]]), s = left.length ? left[0] : pick(AUSSIE_SLANG);
      p.words['au:' + s[0]] = true; G.save();
      await dialog(v.name, [[`"${s[0]}" means ${s[1].toLowerCase()}! Like this: ${s[4]}`, `"${s[0]}" nghĩa là ${s[2].toLowerCase()}! Ví dụ: ${s[4]}`]]);
      await reward(s[3], `📖 ${s[0]}`, T(`Aussie slang: ${s[1]}`, `Tiếng lóng Úc: ${s[2]}`));
    } else {
      const col = { bac: 2, trung: 3, nam: 4 }[v.region], left = VN_WORDS.filter(w => !p.words['vn:' + w[1]]), w = left.length ? left[0] : pick(VN_WORDS);
      p.words['vn:' + w[1]] = true; G.save();
      const here = w[col], rn = REGION_NAME[v.region];
      await dialog(v.name, [[`Here in the ${rn[0].toLowerCase()} we say "${here}" for ${w[1]}. In the north it's "${w[2]}", in the centre "${w[3]}", and in the south "${w[4]}"!`, `Ở ${rn[1].toLowerCase()} gọi là "${here}". Miền Bắc gọi là "${w[2]}", miền Trung gọi là "${w[3]}", còn miền Nam gọi là "${w[4]}"!`]]);
      await reward(w[0], `📖 ${w[2]} · ${w[3]} · ${w[4]}`, T(`Bắc · Trung · Nam: ${w[1]}`, 'Bắc · Trung · Nam'));
    }
    G.job && G.job('puzzle', 1, h);
  }
}

// ---------- postcards from famous places ----------
async function postcard(G, h, lm) {
  const p = h.profile; p.postcards = p.postcards || {};
  const first = !p.postcards[lm.id]; p.postcards[lm.id] = true; G.save();
  await dialog(lm.name(), [lm.fact]);
  if (first) { G.addCoins(10); const st = G.giveSticker(p); await reward('📮', T('New postcard: ', 'Bưu thiếp mới: ') + lm.name(), T(`+${G.fmt(10)}${st ? ' and a sticker ' + st : ''}`, `+${G.fmt(10)}${st ? ' và hình dán ' + st : ''}`)); }
}

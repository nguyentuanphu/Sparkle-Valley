// Sparkle Valley: boot, the game loop, split-screen, NPCs, quests and rewards.
import { THREE, sprite } from './gfx.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { settings, saveProfiles, farm } from './state.js';
import { T } from './i18n.js';
import { say, hush } from './voice.js';
import { SFX, Music, ac } from './audio.js';
import { fmt } from './money.js';
import { el, esc, $, dist2, pick, wait, clamp } from './util.js';
import { createWorld, paintMap, heightAt, regionAt, REGION_NAMES, SHRINES, TOWERS, LEAFIES, VILLAGE, REVEAL_R, WATER } from './world.js';
import { buildAvatar, buildOwl, buildGourd, avatarURL } from './avatar.js';
import { Hero } from './player.js';
import { Hud, fogMapFor, EMOTES } from './hud.js';
import { pads, initInput } from './input.js';
import { Net } from './net.js';
import { showTitle, showWho, dialog, reward, openPad, openCooking, openShop, toast } from './ui.js';
import { ITEMS, RECIPES, GATHER, STICKERS, QUESTS } from './data.js';
import { openGame, gameOpen, GAMES } from './games/frame.js';
import './games/thinking.js';
import './games/strategy.js';
import './games/vietnam.js';
import './games/market.js';

// ---------- renderer & world ----------
const quality = settings.quality === 'auto' ? ((navigator.hardwareConcurrency || 4) <= 4 || Math.min(screen.width, screen.height) < 500 ? 'low' : 'mid') : settings.quality;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', preserveDrawingBuffer: false, powerPreference: 'high-performance' }); }
catch (e) { $('#boot').innerHTML = `<p>${T('Sorry, this device cannot show the 3D world.', 'Xin lỗi, máy này không hiển thị được thế giới 3D.')}</p>`; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.25 : quality === 'high' ? 2 : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
if (quality !== 'low') { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
{ // soft sky light bouncing off everything, so materials look real rather than flat
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
}
const world = createWorld(scene, quality);
const baseMap = paintMap(256);
const titleCam = new THREE.PerspectiveCamera(50, 1, .3, 1200);

const G = {
  settings, world, scene, pads, heroes: [], huds: [], mode: 'solo', paused: false, partner: null, zoom: 1,
  fogMaps: {}, regionOf: [], interactables: [], gatherState: {}, bubbles: []
};
window.__sv = G; // handy for debugging in the browser console

// ---------- people of the valley ----------
const NPCS = [];
function nameTag(text, color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.font = 'bold 34px Nunito, sans-serif'; const w = Math.min(250, x.measureText(text).width + 30);
  x.fillStyle = 'rgba(15,30,35,.72)'; x.beginPath(); x.roundRect((256 - w) / 2, 8, w, 48, 24); x.fill();
  x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(3, .75, 1); s.renderOrder = 5;
  return s;
}
function addNPC({ id, name, look, model, x, z, face = 0, icon = '💬', talk }) {
  const obj = model || buildAvatar(look, null).root;
  const av = model ? null : obj;
  obj.position.set(x, world.groundAt(x, z), z); obj.rotation.y = face; scene.add(obj);
  const tag = nameTag(name); tag.position.set(x, obj.position.y + (model ? 3.4 : 2.0), z); scene.add(tag);
  const n = { id, name, x, z, obj, tag, avatar: av, talk };
  NPCS.push(n);
  world.colliders.push({ x, z, r: .7 });
  G.interactables.push({ id: 'npc_' + id, x, z, r: 3, icon, label: () => T('Talk to ', 'Nói chuyện với ') + name, act: h => talk(h) });
  return n;
}
const V = VILLAGE;
const kidLook = (style, color, h, hs, hat) => ({ style, color, hat, back: 'none', hair: h, hairStyle: hs, skin: '#f6c7a5', glider: 0 });
let owl, gourd;
function setupNPCs() {
  owl = addNPC({ id: 'owl', name: 'Ông Cú', model: buildOwl(), x: -2, z: -8, face: .3, icon: '🦉', talk: owlTalk });
  addNPC({ id: 'mai', name: 'Cô Mai', look: { style: 'aodai', color: '#e8435a', hat: 'nonla', back: 'none', hair: '#1d1412', hairStyle: 'long', skin: '#f6c7a5', glider: 0 }, x: V.x + 2, z: V.z - 11.6, face: 0, icon: '🛒', talk: maiTalk });
  addNPC({ id: 'ba', name: 'Bác Ba', look: { style: 'overalls', color: '#5b7fbf', hat: 'none', back: 'none', hair: '#8a8a8a', hairStyle: 'short', skin: '#e0aa80', glider: 0 }, x: V.x - 4.5, z: V.z + 13, face: .8, icon: '🍲', talk: baTalk });
  addNPC({ id: 'teo', name: 'Tèo', look: kidLook('shirt', '#ffb52e', '#1d1412', 'spiky', 'none'), x: V.x + 16, z: V.z + 19.6, face: 0, icon: '🪨', talk: h => kidTalk(h, 'oanquan', 'Tèo', ['Want to play Ô ăn quan with me? It is a clever counting game!', 'Chơi Ô ăn quan với tớ không? Trò này phải tính toán giỏi đấy!']) });
  addNPC({ id: 'ti', name: 'Tí', look: kidLook('dress', '#ff7eb8', '#3b2618', 'buns', 'flower'), x: V.x - 18, z: V.z + 2.5, face: 0, icon: '🦶', talk: h => kidTalk(h, 'hopscotch', 'Tí', ['Let’s play hopscotch! Nhảy lò cò!', 'Chơi nhảy lò cò đi!']) });
  addNPC({ id: 'bong', name: 'Bống', look: kidLook('hoodie', '#9a6bff', '#1d1412', 'ponytail', 'bunny'), x: V.x + 10, z: V.z + 4, face: -1, icon: '⭕', talk: h => kidTalk(h, 'caro', 'Bống', ['Can you beat me at Caro? Get your shapes in a row!', 'Bạn có thắng được tớ môn cờ caro không?']) });
  addNPC({ id: 'su', name: 'Su', look: kidLook('overalls', '#5bbf6a', '#3b2618', 'short', 'cap'), x: V.x + 7.5, z: V.z + 18, face: -1.57, icon: '🪢', talk: h => kidTalk(h, 'tug', 'Su', ['Tug of war! Are you strong? Dô ta!', 'Kéo co nào! Bạn có khỏe không? Dô ta!']) });
  gourd = addNPC({ id: 'gourd', name: 'Ông Bầu', model: buildGourd(), x: V.x - V.r + 8, z: V.z + 6, face: -1.2, icon: '🍃', talk: gourdTalk });
  // gentle idle animation
  world.updaters.push((dt, t) => NPCS.forEach((n, k) => {
    if (n.avatar) { n.avatar.children[0].position.y = Math.sin(t * 2 + k) * .03; }
    else n.obj.rotation.z = Math.sin(t * 1.5 + k) * .05;
  }));
}

// ---------- interactables ----------
function setupInteractables() {
  G.interactables.push(...world.interactables);
  SHRINES.forEach(s => G.interactables.push({ id: s.id, x: s.x, z: s.z, r: 4.2, icon: '✨', label: () => T('Enter shrine', 'Vào đền') + ': ' + GAMES[s.game].name(), act: h => playGame(h.i, s.game, 'shrine', s) }));
  TOWERS.forEach(tw => G.interactables.push({ id: tw.id, x: tw.x, z: tw.z, r: 5.5, icon: '🧗', label: () => T('Climb ', 'Leo ') + tw.name(), visible: h => h.pos.y < world.towerMeshes[tw.id].y + 5, act: h => { SFX.whoosh(); h.startTowerClimb(tw); } }));
  LEAFIES.forEach(lf => G.interactables.push({ id: lf.id, x: lf.x, z: lf.z, r: lf.kind === 'rock' ? 2.6 : 1.8, icon: lf.kind === 'rock' ? '🪨' : '✨', auto: lf.kind === 'sparkle',
    label: () => lf.kind === 'rock' ? T('Lift rock', 'Nhấc hòn đá') : T('Touch the sparkle', 'Chạm tia lấp lánh'), visible: h => !h.profile.leafies[lf.id], act: h => foundLeafy(h, lf) }));
  world.pots.forEach((p, k) => G.interactables.push({ id: 'pot' + k, x: p.x, z: p.z, r: 2.8, icon: '🍲', label: () => T('Cook', 'Nấu ăn'), act: h => openCooking(G, h.i) }));
  G.interactables.push({ id: 'statue', x: world.statue.x, z: world.statue.z, r: 3.6, icon: '🪷', label: () => T('Lotus Statue', 'Tượng Sen'), act: statueTalk });
  GATHER.forEach(([item, x, z], k) => {
    const y = Math.max(heightAt(x, z), WATER) + .7, s = sprite(ITEMS[item].icon, 1.1); s.position.set(x, y, z); scene.add(s);
    const st = G.gatherState[k] = { s, ready: 0 };
    world.updaters.push((dt, t) => { s.visible = performance.now() > st.ready; s.position.y = y + Math.sin(t * 2 + k) * .12; });
    G.interactables.push({ id: 'g' + k, x, z, r: 2.4, icon: ITEMS[item].icon, label: () => T('Pick up ', 'Nhặt ') + ITEMS[item].name(), visible: () => performance.now() > st.ready,
      act: h => { st.ready = performance.now() + 120000; give(h, item, 1); } });
  });
}
function nearest(h) {
  let best = null, bd = 1e9;
  for (const it of G.interactables) {
    if (it.visible && !it.visible(h)) continue;
    const d = dist2(h.pos.x, h.pos.z, it.x, it.z);
    if (d < it.r && d < bd && Math.abs((it.y ?? heightAt(it.x, it.z)) - h.pos.y) < 5) { best = it; bd = d; }
  }
  return best;
}

// ---------- rewards ----------
function save() { saveProfiles(); }
function give(h, item, n) {
  const p = h.profile; p.inv[item] = (p.inv[item] || 0) + n; save();
  SFX.pop(n); hudFor(h).toast(`+${n} ${ITEMS[item].icon} ${ITEMS[item].name()}`);
  say(`${n} ${ITEMS[item].name()}!`, `${n} ${ITEMS[item].name()}!`);
}
function addMoney(p, xu) { farm.coins += xu; save(); }
function giveSticker(p) { const left = STICKERS.filter(s => !p.stickers.includes(s)); if (!left.length) return null; const s = pick(left); p.stickers.push(s); save(); return s; }
const hudFor = h => G.huds[h.i];
G.give = give;
G.toast = (h, m) => hudFor(h).toast(m);
G.fx = (x, y, z, ch) => { const s = sprite(ch, 1.4); s.position.set(x, y, z); scene.add(s); const t0 = performance.now(); const f = () => { const k = (performance.now() - t0) / 900; s.position.y = y + k * 2; s.material.opacity = 1 - k; if (k < 1) requestAnimationFrame(f); else scene.remove(s); }; f(); };
G.mount = (h, b) => { h.mount(b); h.profile.quests.buffalo = true; save(); say('Moo! Hold on tight!', 'Ụm bò! Bám chắc nhé!'); hudFor(h).toast(T('Press Jump to get off', 'Bấm Nhảy để xuống')); };

async function playGame(i, id, source, shrine) {
  const h = G.heroes[i]; if (!h || gameOpen()) return;
  G.paused = true; hush();
  const players = G.heroes.map(x => x.profile); if (G.heroes.length > 1 && i === 1) players.reverse();
  const p = h.profile, level = p.levels[id] || 1;
  if (source === 'shrine') { SFX.secret(); say('A shrine! Let’s solve the puzzle.', 'Một ngôi đền! Cùng giải câu đố nào.'); await wait(600); }
  const res = await openGame(id, { players, level, style: source === 'folk' || id === 'market' ? 'village' : 'shrine' });
  G.paused = false;
  if (!res.won) return;
  for (const hero of G.heroes) {
    const q = hero.profile; q.levels[id] = Math.min(5, (q.levels[id] || 1) + 1);
    q.stats.games = (q.stats.games || 0) + 1;
    if (source === 'shrine' && shrine && !q.shrines[shrine.id]) {
      q.shrines[shrine.id] = true; q.orbs++; addMoney(q, 20);
      const st = giveSticker(q);
      if (hero === h) {
        world.setShrineDone(shrine.id, true);
        await reward('🔮', T('Sparkle Orb!', 'Ngọc Lấp Lánh!'), T(`+${fmt(20)} and a new sticker ${st || ''}. Bring 4 orbs to the Lotus Statue!`, `+${fmt(20)} và một hình dán mới ${st || ''}. Mang 4 viên ngọc đến Tượng Sen nhé!`));
      }
    } else if (source === 'folk' || id === 'market') {
      const first = !q.quests['played_' + id];
      q.quests['played_' + id] = true; q.quests[id === 'market' ? 'market' : 'folk'] = true;
      const amt = id === 'market' ? 25 : 12; addMoney(q, amt);
      const st = first ? giveSticker(q) : null;
      if (hero === h) await reward(id === 'market' ? '💰' : '🎉', T(`+${fmt(amt)}!`, `+${fmt(amt)}!`), st ? T(`New sticker ${st}!`, `Hình dán mới ${st}!`) : T('Thank you for playing!', 'Cảm ơn con đã chơi!'));
    } else {
      addMoney(q, 5); if (hero === h) hudFor(h).toast(`+${fmt(5)} 💰`);
    }
  }
  save(); checkQuests(h);
}
G.playGame = playGame;

async function foundLeafy(h, lf) {
  const p = h.profile; if (p.leafies[lf.id]) return;
  p.leafies[lf.id] = true; save();
  if (G.heroes.every(x => x.profile.leafies[lf.id])) world.hideLeafy(lf.id);
  SFX.hee(); G.fx(lf.x, heightAt(lf.x, lf.z) + 1.5, lf.z, '🍃');
  const n = Object.keys(p.leafies).length;
  const line = pick([['Hee hee! You found me!', 'Hí hí! Bạn tìm thấy tớ rồi!'], ['Peekaboo! You found me!', 'Ú òa! Bạn tìm ra tớ rồi!'], ['Yay! I was hiding here!', 'A ha! Tớ trốn ở đây nè!']]);
  say(line[0], line[1]);
  hudFor(h).toast(T(`🍃 Leafy found! ${n}/24`, `🍃 Tìm thấy Lá Lá! ${n}/24`));
  checkQuests(h);
}

// ---------- NPC talks ----------
async function owlTalk(h) {
  const p = h.profile; SFX.hoot();
  if (!p.quests.owl) {
    await dialog('Ông Cú', [
      [`Hoo hoo! Good morning, ${p.name}! Welcome to Sparkle Valley.`, `Hú hú! Chào buổi sáng, ${p.name}! Chào mừng con đến Thung Lũng Lấp Lánh.`],
      ['I am Ông Cú, the wise old owl. This valley is full of puzzles, friends and secrets.', 'Ông là Ông Cú, chú cú già thông thái. Thung lũng này có rất nhiều câu đố, bạn bè và bí mật.'],
      ['See that tall tower glowing orange? Climb it, and your map will light up!', 'Con thấy cái tháp cao màu cam kia không? Leo lên đó, bản đồ của con sẽ sáng lên!'],
      ['Then solve the three shrines here on the plateau, and I will give you a special present.', 'Sau đó giải ba ngôi đền trên cao nguyên này, ông sẽ tặng con một món quà đặc biệt.']
    ]);
    p.quests.owl = true; save(); checkQuests(h); return;
  }
  const done3 = ['sh_pattern', 'sh_count', 'sh_letters'].every(s => p.shrines[s]);
  if (done3 && !p.glider) {
    await dialog('Ông Cú', [
      ['Hoo! You solved all three shrines. How clever you are!', 'Hú! Con giải được cả ba đền rồi. Con thông minh quá!'],
      ['Here is your present: the Leaf Glider! Jump, then press Jump again in the air to float like a leaf.', 'Quà của con đây: Cánh Lá! Nhảy lên, rồi bấm Nhảy lần nữa trên không để bay như chiếc lá.'],
      ['Glide down to Lotus Village. My friends there would love to meet you!', 'Hãy lượn xuống Làng Sen. Các bạn ở đó rất muốn gặp con!']
    ]);
    p.glider = true; save(); h.buildModel();
    await reward('🪂', T('Leaf Glider!', 'Cánh Lá!'), T('Jump, then Jump again in the air', 'Nhảy, rồi bấm Nhảy lần nữa trên không'));
    checkQuests(h); return;
  }
  const q = currentQuest(p);
  const tips = {
    tower1: ['Climb the glowing tower right next to us. Walk up to it and press the action button.', 'Leo lên cái tháp phát sáng ngay cạnh đây. Đi đến gần và bấm nút hành động nhé.'],
    plateau: ['Look for the orange shrines with the beams of light. There are three on the plateau.', 'Tìm những ngôi đền màu cam có cột sáng. Trên cao nguyên có ba ngôi đền.'],
    village: ['Lotus Village is to the east, across the river bridge. Follow the red pin on your map!', 'Làng Sen ở phía đông, qua cây cầu bắc qua sông. Đi theo cái ghim đỏ trên bản đồ nhé!']
  };
  const tip = q && tips[q.id] || ['Explore everywhere! Climb high, look under rocks, and talk to everyone.', 'Khám phá khắp nơi nhé! Leo lên cao, nhìn dưới các hòn đá, và nói chuyện với mọi người.'];
  await dialog('Ông Cú', [['Hoo hoo! ' + tip[0], 'Hú hú! ' + tip[1]]]);
}
async function maiTalk(h) {
  const k = await dialog('Cô Mai', [['Xin chào! Fresh fruit and pretty hats! Would you like to buy something, or help me sell?', 'Xin chào con! Trái cây tươi và mũ xinh đây! Con muốn mua gì, hay giúp cô bán hàng?']],
    [['🛒 Buy', '🛒 Mua'], ['💰 Help sell (earn money)', '💰 Giúp bán hàng (kiếm tiền)'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openShop(G, h.i);
  if (k === 1) playGame(h.i, 'market', 'folk');
}
async function baTalk(h) {
  const k = await dialog('Bác Ba', [['Ah, a young chef! Put ingredients in my pot and see what we can cook. Try rice with mango!', 'À, đầu bếp nhí đây rồi! Cho nguyên liệu vào nồi xem mình nấu được món gì. Thử gạo với xoài xem!']],
    [['🍲 Cook', '🍲 Nấu ăn'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openCooking(G, h.i);
}
async function kidTalk(h, game, name, line) {
  const k = await dialog(name, [line], [['▶ Play!', '▶ Chơi!'], ['👋 Later', '👋 Để sau']]);
  if (k === 0) playGame(h.i, game, 'folk');
}
const GOURD_GIFTS = [[3, 'hat', 'flower'], [6, 'hat', 'bunny'], [10, 'glider', 2], [15, 'hat', 'crown'], [20, 'money', 60], [24, 'glider', 4]];
async function gourdTalk(h) {
  const p = h.profile, n = Object.keys(p.leafies).length;
  const due = GOURD_GIFTS.filter(([need]) => n >= need && !p.quests['gourd' + need]);
  if (!due.length) {
    const next = GOURD_GIFTS.find(([need]) => n < need);
    await dialog('Ông Bầu', [['Yahoo! I love Leafies, the little spirits hiding all over the valley.', 'Ố là la! Ông thích các bạn Lá Lá lắm, chúng trốn khắp thung lũng.'],
      [next ? `You found ${n}. Find ${next[0]} and I will give you a present!` : 'You found every single Leafy! You are amazing!', next ? `Con tìm được ${n} bạn rồi. Tìm đủ ${next[0]} bạn, ông sẽ tặng quà!` : 'Con tìm được tất cả các bạn Lá Lá! Con giỏi quá!'],
      ['Look under odd rocks and touch sparkles on high places!', 'Nhìn dưới những hòn đá lạ và chạm vào tia lấp lánh ở chỗ cao nhé!']]);
    return;
  }
  for (const [need, kind, what] of due) {
    p.quests['gourd' + need] = true;
    if (kind === 'hat') { if (!p.owned.hats.includes(what)) p.owned.hats.push(what); await reward({ flower: '🌸', bunny: '🐰', crown: '👑' }[what], T('A new hat!', 'Mũ mới!'), T('Wear it from your Backpack', 'Đội mũ trong Ba lô nhé')); }
    if (kind === 'glider') { if (!p.owned.gliders.includes(what)) p.owned.gliders.push(what); await reward('🪂', T('A new glider colour!', 'Màu cánh lượn mới!'), ''); }
    if (kind === 'money') { addMoney(p, what); await reward('💰', '+' + fmt(what), ''); }
  }
  save(); say('Thank you for finding my Leafy friends!', 'Cảm ơn con đã tìm các bạn Lá Lá của ông!');
}
async function statueTalk(h) {
  const p = h.profile;
  if (p.orbs < 4) { await dialog(T('Lotus Statue', 'Tượng Sen'), [[`Bring me 4 Sparkle Orbs from the shrines and I will make you stronger. You have ${p.orbs}.`, `Hãy mang đến 4 Ngọc Lấp Lánh từ các ngôi đền, ta sẽ giúp con mạnh hơn. Con đang có ${p.orbs} viên.`]]); return; }
  const k = await dialog(T('Lotus Statue', 'Tượng Sen'), [['Four Sparkle Orbs! What would you like?', 'Bốn Ngọc Lấp Lánh! Con muốn gì nào?']], [['❤️ One more heart', '❤️ Thêm một trái tim'], ['💚 More stamina', '💚 Thêm sức bền'], ['Not now', 'Để sau']]);
  if (k === 0 || k === 1) {
    if (k === 1 && p.staminaMax >= 3) { toast(T('Your stamina is already the biggest!', 'Sức bền đã lớn nhất rồi!')); return; }
    p.orbs -= 4; if (k === 0) { p.hearts = Math.min(12, p.hearts + 1); h.hearts = p.hearts; } else { p.staminaMax = Math.min(3, p.staminaMax + .5); h.stamina = p.staminaMax; }
    p.quests.statue = true; save();
    await reward(k === 0 ? '❤️' : '💚', k === 0 ? T('One more heart!', 'Thêm một trái tim!') : T('More stamina!', 'Thêm sức bền!'), '');
    checkQuests(h);
  }
}

// ---------- quests ----------
const questDone = (p, q) => !!p.quests[q.id] || !!(q.check && q.check(p));
function currentQuest(p) { return QUESTS.find(q => !questDone(p, q)); }
G.currentQuest = currentQuest;
function questTarget(h) {
  const p = h.profile, q = currentQuest(p); if (!q) return null;
  const near = list => list.slice().sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0];
  switch (q.at) {
    case 'owl': return { x: owl.x, z: owl.z };
    case 'tw_plateau': return TOWERS[0];
    case 'plateauShrine': return near(SHRINES.slice(0, 3).filter(s => !p.shrines[s.id]));
    case 'village': return { x: V.x - V.r + 2, z: V.z };
    case 'mai': return NPCS.find(n => n.id === 'mai');
    case 'pot': return near(world.pots);
    case 'kids': return NPCS.find(n => n.id === 'teo');
    case 'buffalo': return near(world.buffalo.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z })));
    case 'leafy': return null;
    case 'statue': return p.orbs >= 4 ? world.statue : near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || world.statue;
    case 'tower': return near(TOWERS.filter(t => !p.towers[t.id]));
    case 'shrine': return near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id]));
  }
  return null;
}
G.questTarget = questTarget;
G.objective = h => { const q = currentQuest(h.profile); return q ? q.title() : T('You finished the adventure! Keep exploring!', 'Con đã hoàn thành cuộc phiêu lưu! Tiếp tục khám phá nhé!'); };
function checkQuests(h) {
  const p = h.profile;
  const k = 'seen_' + (currentQuest(p) || { id: 'all' }).id;
  if (!p.quests[k]) {
    p.quests[k] = true; save();
    const q = currentQuest(p);
    if (q && q.id !== 'owl') setTimeout(() => { hudFor(h)?.toast(T('New goal: ', 'Mục tiêu mới: ') + q.title()); }, 2800);
    if (!q) celebrateAll(h);
  }
}
async function celebrateAll(h) {
  await reward('🏆', T('You are a Sparkle Valley hero!', 'Con là anh hùng Thung Lũng Lấp Lánh!'), T('Every quest done. Amazing!', 'Hoàn thành mọi nhiệm vụ. Tuyệt vời!'));
  if (!h.profile.owned.hats.includes('crown')) { h.profile.owned.hats.push('crown'); save(); }
}

// ---------- hero events ----------
G.onTowerTop = async (h, tw) => {
  const p = h.profile; if (p.towers[tw.id]) { hudFor(h).toast(T('What a view! Jump off and glide!', 'Đẹp quá! Nhảy xuống và lượn nào!')); return; }
  p.towers[tw.id] = true;
  SHRINES.concat(TOWERS).forEach(s => { if (dist2(s.x, s.z, tw.x, tw.z) < REVEAL_R) p.discovered[s.id] = true; });
  save(); delete G.fogMaps[p.id]; world.setTowerDone(tw.id, true);
  SFX.tower(); h.cheerT = 2.5;
  await wait(1200);
  await reward('🗺️', T('Map updated!', 'Bản đồ đã cập nhật!'), tw.name());
  say(p.glider ? 'Now jump off and glide!' : 'Your map is lit up! Look for the orange shrines.', p.glider ? 'Giờ nhảy xuống và lượn nào!' : 'Bản đồ đã sáng lên! Tìm những ngôi đền màu cam nhé.');
  checkQuests(h);
};
G.onGlide = h => { if (!h.profile.quests.glided) { h.profile.quests.glided = true; save(); say('Wheee! You are flying!', 'Vút! Con đang bay rồi!'); } };
G.hint = (h, k) => { if (k === 'tired' && !h._tiredHint) { h._tiredHint = true; hudFor(h).toast(T('Too tired to climb. Rest a moment!', 'Mệt quá không leo được. Nghỉ một chút nhé!')); setTimeout(() => h._tiredHint = false, 6000); } };
G.stats = (h, sp) => { h.profile.stats.steps = (h.profile.stats.steps || 0) + 1; };
G.hurt = (h, n) => {
  h.hearts = Math.max(0, h.hearts - n); SFX.no(); hudFor(h).toast(T('Ouch! Big fall!', 'Ui da! Ngã đau quá!'));
  if (h.hearts <= 0) G.rescue(h, true);
};
G.rescue = async (h, fainted) => {
  if (h._rescuing) return; h._rescuing = true;
  const f = el('div', 'fade white'); document.body.appendChild(f); SFX.travel();
  say(fainted ? 'Oh dear! Ông Cú carried you somewhere safe.' : 'Splash! Ông Cú helped you out of the water.', fainted ? 'Ôi! Ông Cú đã đưa con đến chỗ an toàn.' : 'Ùm! Ông Cú đã kéo con lên bờ.');
  await wait(700);
  h.place(h.lastSafe.x, h.lastSafe.z); h.stamina = h.staminaMax; h.exhausted = false; if (fainted) h.hearts = h.profile.hearts;
  f.classList.add('out'); setTimeout(() => f.remove(), 600); h._rescuing = false;
};
G.travel = async (h, x, z) => {
  const f = el('div', 'fade blue'); document.body.appendChild(f); SFX.travel();
  await wait(650); if (h.riding) h.dismount();
  h.place(x + 4.5, z + 1); h.gliding = false; h.camYaw = Math.PI;
  f.classList.add('out'); setTimeout(() => f.remove(), 700);
};
G.eat = (h, id) => {
  const p = h.profile; if (!p.dishes[id]) return;
  const r = RECIPES.find(r => r.id === id) || { heal: 1, bonus: 0, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
  p.dishes[id]--; save();
  h.hearts = Math.min(p.hearts, h.hearts + r.heal); h.bonusStamina = r.bonus; h.stamina = p.staminaMax + r.bonus; h.exhausted = false;
  SFX.ok(); say(`Yum yum! ${r.name()}!`, `Măm măm! ${r.name()}!`); h.cheerT = 1.2;
};
G.onCooked = (h) => checkQuests(h);
G.rebuildHero = i => { const h = G.heroes[i]; if (h) { h.buildModel(); G.huds[i].refreshWho(); sendHello(); } };
G.fogMapFor = p => G.fogMaps[p.id] || (G.fogMaps[p.id] = fogMapFor(p, baseMap));
G.snapshot = i => {
  const h = G.heroes[i] || G.heroes[0], w = renderer.domElement.width, hh = renderer.domElement.height;
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w / renderer.getPixelRatio(), hh / renderer.getPixelRatio());
  h.cam.aspect = w / hh; h.cam.updateProjectionMatrix(); G.huds.forEach(x => x.root.style.visibility = 'hidden');
  renderer.render(scene, h.cam);
  const c = document.createElement('canvas'), k = Math.min(1, 720 / w); c.width = w * k; c.height = hh * k; c.getContext('2d').drawImage(renderer.domElement, 0, 0, c.width, c.height);
  G.huds.forEach(x => x.root.style.visibility = '');
  return c.toDataURL('image/jpeg', .8);
};
G.openPad = i => { if (G.paused) return; G.paused = true; openPad(G, i); };
G.closePad = () => { G.paused = false; };

// ---------- talking: quick phrases, speech bubbles, voice calls ----------
function bubble(target, text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.font = 'bold 44px Nunito, sans-serif'; const w = Math.min(500, x.measureText(text).width + 50);
  x.fillStyle = '#fff'; x.strokeStyle = '#2a3a40'; x.lineWidth = 6; x.beginPath(); x.roundRect((512 - w) / 2, 6, w, 92, 40); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(236, 96); x.lineTo(256, 124); x.lineTo(276, 96); x.fill();
  x.fillStyle = '#2a3a40'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(3.2, .8, 1); s.renderOrder = 6;
  scene.add(s); G.bubbles.push({ s, target, until: performance.now() + 3500 });
}
G.emote = (i, id) => {
  const e = EMOTES.find(e => e.id === id), h = G.heroes[i]; if (!e || !h) return;
  bubble(h, e.icon + ' ' + T(e.en, e.vi)); h.emoteT = 2;
  say(`${h.profile.name} says: ${e.en}`, `${h.profile.name} nói: ${e.vi}`);
  Net.send({ t: 'emote', id });
};
G.toggleMute = () => { Net.setMuted(!Net.muted); Net.resumeAudio(); G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted)); };
function sendHello() {
  const h = G.heroes[0]; if (!h) return;
  let photo = null;
  if (h.profile.photo) { const c = document.createElement('canvas'); c.width = c.height = 160; const im = new Image(); im.src = h.profile.photo; try { c.getContext('2d').drawImage(im, 0, 0, 160, 160); photo = c.toDataURL('image/jpeg', .7); } catch (e) { } }
  Net.send({ t: 'hello', name: h.profile.name, look: h.profile.look, photo });
  return { name: h.profile.name, look: h.profile.look, photo };
}
Net.on('hello', r => {
  if (G.partner) scene.remove(G.partner.av.root), scene.remove(G.partner.tag);
  const av = buildAvatar(Object.assign({ style: 'shirt', color: '#3d7fd6', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5', glider: 0 }, r.look || {}), r.photo);
  scene.add(av.root); const tag = nameTag(r.name || T('Friend', 'Bạn'), '#9ff0ff'); scene.add(tag);
  G.partner = { av, tag, pos: new THREE.Vector3(0, -50, 0), yaw: 0, st: 'idle', name: r.name };
  SFX.chime(); say(`${r.name} is here! Say hello!`, `${r.name} đã đến! Chào bạn đi!`);
  G.huds.forEach(hd => hd.setCall(true, false, Net.muted));
});
Net.on('emote', d => { const e = EMOTES.find(e => e.id === d.id); if (!e || !G.partner) return; bubble(G.partner, e.icon + ' ' + T(e.en, e.vi)); say(`${G.partner.name} says: ${e.en}`, `${G.partner.name} nói: ${e.vi}`); });
Net.on('left', () => { if (G.partner) { scene.remove(G.partner.av.root); scene.remove(G.partner.tag); G.partner = null; } G.huds.forEach(hd => hd.setCall(false)); toast(T('Your friend left.', 'Bạn đã rời đi.')); });
Net.on('talking', on => G.huds.forEach(hd => hd.setCall(Net.connected, on, Net.muted)));
let netStatus = '';
Net.on('status', s => {
  const msg = {
    waiting: T(`Room code: ${s.code}. Tell your friend this number!`, `Mã phòng: ${s.code}. Đọc số này cho bạn nhé!`), connecting: T('Connecting…', 'Đang kết nối…'), connected: T('Connected! You can talk now.', 'Đã kết nối! Giờ có thể nói chuyện rồi.'),
    nocode: T('No room with that number. Check the code.', 'Không có phòng số này. Kiểm tra lại mã nhé.'), nomic: T('No microphone: your friend will not hear you, but you can still play and use the talk buttons.', 'Không có micrô: bạn sẽ không nghe được con, nhưng vẫn chơi và dùng nút nói được.'),
    left: T('Your friend left.', 'Bạn đã rời đi.'), tapaudio: T('Tap the 🎙️ button to hear your friend.', 'Chạm nút 🎙️ để nghe bạn nói.'), error: T('Could not connect. Check the internet and try again.', 'Không kết nối được. Kiểm tra mạng rồi thử lại.')
  }[s.key] || '';
  netStatus = msg; if (msg) toast(msg); if (G.onNet) G.onNet();
});
G.drawOnlinePanel = (body, redraw) => {
  G.onNet = () => { if (document.body.contains(body)) redraw(); };
  if (Net.connected) {
    body.innerHTML = `<div class="online on"><div class="friend"><img src="${G.partner && G.partner.av ? avatarURL({ photo: Net.remote && Net.remote.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, Net.remote && Net.remote.look) }) : ''}" alt=""><b>${esc(Net.remote ? Net.remote.name : '')}</b></div>
      <p class="note center">${T('You are connected. Talk to each other with your voice, or use the 💬 buttons.', 'Đã kết nối. Hai bạn có thể nói chuyện bằng giọng nói, hoặc dùng nút 💬.')}</p>
      <div class="actions center"><button class="btn big" id="oMute">${Net.muted ? '🔇 ' + T('Unmute', 'Bật mic') : '🎙️ ' + T('Mute', 'Tắt mic')}</button><button class="btn big primary" id="oFly">✨ ${T('Fly to my friend', 'Bay đến chỗ bạn')}</button><button class="btn big danger" id="oEnd">📵 ${T('Hang up', 'Kết thúc')}</button></div></div>`;
    body.querySelector('#oMute').onclick = () => { G.toggleMute(); redraw(); };
    body.querySelector('#oFly').onclick = () => { if (G.partner) { $('.modal.pad')?.remove(); G.paused = false; G.travel(G.heroes[0], G.partner.pos.x - 4.5, G.partner.pos.z - 1); } };
    body.querySelector('#oEnd').onclick = () => { Net.close(); Net.emit('left'); redraw(); };
    return;
  }
  let code = '';
  body.innerHTML = `<div class="online">
    <p class="note center">${T('Play together from two phones or tablets, and talk with your voices! Both need the internet.', 'Chơi cùng nhau từ hai máy và nói chuyện bằng giọng nói! Cả hai máy cần có mạng.')}</p>
    <div class="two-col">
      <div class="ocard"><h3>1. ${T('Start a room', 'Tạo phòng')}</h3><button class="btn big primary" id="oHost">📞 ${T('Start', 'Bắt đầu')}</button><div class="bigcode">${Net.role === 'host' && Net.code ? Net.code : ''}</div></div>
      <div class="ocard"><h3>2. ${T('Join a room', 'Vào phòng')}</h3><div class="codebox">____</div><div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(n => `<button>${n}</button>`).join('')}</div></div>
    </div><p class="note center status">${esc(netStatus)}</p></div>`;
  const box = body.querySelector('.codebox');
  body.querySelector('#oHost').onclick = async () => { ac(); await Net.host(sendHello() || {}); redraw(); };
  body.querySelectorAll('.numpad button').forEach(b => b.onclick = () => {
    const v = b.textContent; SFX.tap();
    if (v === '⌫') code = code.slice(0, -1); else if (v === '✓') { if (code.length === 4) Net.join(code, sendHello() || {}); } else if (code.length < 4) code += v;
    box.textContent = (code + '____').slice(0, 4);
    if (code.length === 4 && v !== '✓') Net.join(code, sendHello() || {});
  });
};

// ---------- layout ----------
function rects() {
  const W = innerWidth, H = innerHeight;
  if (G.heroes.length < 2) return [{ x: 0, y: 0, w: W, h: H }];
  return W >= H ? [{ x: 0, y: 0, w: W / 2, h: H }, { x: W / 2, y: 0, w: W / 2, h: H }] : [{ x: 0, y: 0, w: W, h: H / 2 }, { x: 0, y: H / 2, w: W, h: H / 2 }];
}
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  const r = rects();
  G.heroes.forEach((h, i) => { h.cam.aspect = r[i].w / r[i].h; h.cam.updateProjectionMatrix(); G.huds[i] && G.huds[i].layout(r[i], G.heroes.length > 1); });
  titleCam.aspect = innerWidth / innerHeight; titleCam.updateProjectionMatrix();
  const sp = $('#split'); sp.hidden = G.heroes.length < 2;
  if (G.heroes.length > 1) { const v = innerWidth >= innerHeight; Object.assign(sp.style, v ? { left: innerWidth / 2 - 2 + 'px', top: 0, width: '4px', height: '100%' } : { top: innerHeight / 2 - 2 + 'px', left: 0, height: '4px', width: '100%' }); }
}
addEventListener('resize', resize);
const poll = initInput(renderer.domElement, rects, () => G.paused || !G.heroes.length);
renderer.domElement.addEventListener('wheel', e => { G.zoom = clamp(G.zoom * (e.deltaY > 0 ? 1.1 : .9), .6, 1.8); }, { passive: true });

// ---------- starting a session ----------
function startSession(mode, chosen) {
  G.mode = mode; G.heroes.forEach(h => scene.remove(h.av.root)); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  chosen.forEach((p, i) => {
    const h = new Hero(i, p, scene, world);
    const start = p.pos && Number.isFinite(p.pos.x) ? p.pos : { x: -6 + i * 3, z: -1 };
    h.place(start.x, start.z); h.camYaw = Math.PI * .85;
    G.heroes.push(h); G.huds.push(new Hud(i, h, G)); G.regionOf[i] = null;
  });
  // shrine & tower colours follow the first player
  const p0 = chosen[0];
  SHRINES.forEach(s => world.setShrineDone(s.id, !!p0.shrines[s.id]));
  TOWERS.forEach(t => world.setTowerDone(t.id, !!p0.towers[t.id]));
  LEAFIES.forEach(l => { const o = world.leafyMeshes[l.id]; if (o) o.visible = !chosen.every(p => p.leafies[l.id]); });
  resize(); G.paused = false; playing = true;
  $('#huds').hidden = false;
  const p = chosen[0];
  if (!p.quests.owl) setTimeout(() => say(`Hello ${p.name}! Walk over to the owl and say hi.`, `Chào ${p.name}! Đi đến chỗ chú cú và chào ông nhé.`), 900);
  else say(`Welcome back, ${p.name}!`, `Chào mừng ${p.name} quay lại!`);
  if (mode === 'online') { G.paused = true; openPad(G, 0, 'friend'); }
}

// ---------- the loop ----------
let playing = false, last = performance.now(), t = 0, sendT = 0, saveT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
  world.update(dt, t);
  if (!playing) {
    const a = t * .05;
    titleCam.position.set(Math.cos(a) * 70, 42, Math.sin(a) * 70); titleCam.lookAt(0, 16, 0);
    world.updateSky(0, titleCam.position);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.render(scene, titleCam);
    return;
  }
  poll(dt);
  if (!G.paused && !gameOpen()) {
    G.heroes.forEach((h, i) => {
      if (pads[i].menu()) { G.openPad(i); return; }
      h.update(dt, pads[i], t, G);
      const it = nearest(h);
      if (it && it.auto) it.act(h, G);
      G.huds[i].setAction(it && !it.auto ? it : null);
      if (pads[i].act() && it) { SFX.tap(); it.act(h, G); }
      // discover shrines and towers you walk near
      for (const s of SHRINES.concat(TOWERS)) if (!h.profile.discovered[s.id] && dist2(s.x, s.z, h.pos.x, h.pos.z) < 45) { h.profile.discovered[s.id] = true; save(); }
      const rg = regionAt(h.pos.x, h.pos.z);
      if (rg !== G.regionOf[i]) {
        if (G.regionOf[i] !== null) { G.huds[i].showRegion(REGION_NAMES[rg]()); }
        G.regionOf[i] = rg;
        if (rg === 'village' && !h.profile.quests.village) { h.profile.quests.village = true; save(); say('Welcome to Lotus Village! Xin chào!', 'Chào mừng đến Làng Sen!'); checkQuests(h); }
      }
    });
  } else { pads.forEach(p => { p.act(); p.jump(); p.menu(); }); }
  // music follows the first player
  const h0 = G.heroes[0];
  if (h0 && !gameOpen()) Music.play(h0.gliding ? 'glide' : world.isNight() ? 'night' : G.regionOf[0] === 'village' ? 'village' : regionAt(h0.pos.x, h0.pos.z) === 'plateau' && SHRINES.some(s => dist2(s.x, s.z, h0.pos.x, h0.pos.z) < 8) ? 'shrine' : 'field');
  if (!G.paused) world.updateSky(dt, h0.pos, h0.pos);
  // online partner
  if (G.partner && Net.remote && Net.remote.s) {
    const s = Net.remote.s, P = G.partner; P.pos.lerp(new THREE.Vector3(s.x, s.y, s.z), Math.min(1, dt * 10)); P.yaw = s.yaw;
    P.av.root.position.copy(P.pos); P.av.root.rotation.y = P.yaw; P.av.anim(s.st || 'idle', t, s.sp || 0); P.tag.position.set(P.pos.x, P.pos.y + 2.0, P.pos.z);
  }
  sendT -= dt; if (Net.connected && sendT <= 0 && h0) { sendT = .1; Net.send({ t: 's', x: +h0.pos.x.toFixed(2), y: +h0.pos.y.toFixed(2), z: +h0.pos.z.toFixed(2), yaw: +h0.yaw.toFixed(2), st: h0.state, sp: +h0.speed.toFixed(1) }); }
  // bubbles
  G.bubbles = G.bubbles.filter(b => { const p = b.target.pos; b.s.position.set(p.x, p.y + 2.45, p.z); if (now > b.until) { scene.remove(b.s); return false; } return true; });
  // save positions now and then
  saveT -= dt; if (saveT <= 0) { saveT = 5; G.heroes.forEach(h => { if (h.onGround && !h.towerClimb) h.profile.pos = { x: +h.lastSafe.x.toFixed(1), z: +h.lastSafe.z.toFixed(1) }; }); save(); }
  // render each player's view
  const r = rects(), H = innerHeight;
  renderer.setScissorTest(G.heroes.length > 1);
  G.heroes.forEach((h, i) => {
    const q = r[i];
    renderer.setViewport(q.x, H - q.y - q.h, q.w, q.h); renderer.setScissor(q.x, H - q.y - q.h, q.w, q.h);
    world.updateSky(0, h.cam.position, h.pos);
    renderer.render(scene, h.cam);
    const markers = [];
    const p = h.profile;
    SHRINES.forEach(s => { if (p.discovered[s.id] || p.shrines[s.id]) markers.push({ x: s.x, z: s.z, icon: p.shrines[s.id] ? '🔷' : '🔶', size: 16 }); });
    TOWERS.forEach(tw => { if (p.discovered[tw.id] || p.towers[tw.id]) markers.push({ x: tw.x, z: tw.z, icon: '🗼', size: 18 }); });
    NPCS.forEach(n => markers.push({ x: n.x, z: n.z, icon: '•', size: 14 }));
    G.heroes.forEach((o, j) => { if (j !== i) markers.push({ x: o.pos.x, z: o.pos.z, icon: '🧒', size: 18 }); });
    if (G.partner) markers.push({ x: G.partner.pos.x, z: G.partner.pos.z, icon: '🧒', size: 18 });
    const qt = questTarget(h); if (qt) markers.push({ x: qt.x, z: qt.z, pin: true });
    G.huds[i].update(dt, h.cam, G.fogMapFor(p), markers);
  });
}

// ---------- boot ----------
setupNPCs(); setupInteractables();
resize();
$('#boot').remove();
requestAnimationFrame(frame);
showTitle(() => showWho((mode, chosen) => startSession(mode, chosen)));
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); hush(); } });
addEventListener('pagehide', () => saveProfiles(true));
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { });

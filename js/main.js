// Sparkle Valley: boot, the game loop, split-screen, NPCs, quests and rewards.
import { THREE, sprite, P, merge, toonVC } from './gfx.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { settings, saveSettings, saveProfiles, farm, profiles } from './state.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say, hush, loadClips } from './voice.js';
import { SFX, Music, ac } from './audio.js';
import { fmt } from './money.js';
import { el, esc, $, dist2, pick, wait, clamp } from './util.js';
import { createWorld, paintMap, heightAt, regionAt, REGION_NAMES, MARKET, CHINA, INDIA, SHRINES, TOWERS, LEAFIES, VILLAGE, HOME, PLAYGROUND, REVEAL_R, WATER } from './world.js';
import { buildAvatar, buildOwl, buildGourd, avatarURL, OUTLINED } from './avatar.js';
import { Hero } from './player.js';
import { Hud, fogMapFor, EMOTES } from './hud.js';
import { pads, initInput } from './input.js';
import { Net } from './net.js';
import { showTitle, showWho, dialog, dialogHooks, reward, openPad, openCooking, openShop, toast } from './ui.js';
import { openChat, personaByName, PERSONAS } from './chat.js';
import { voiceCommand, voiceControlOn } from './commands.js';
import { ITEMS, RECIPES, GATHER, STICKERS, QUESTS, dishInfo } from './data.js';
import { openGame, gameOpen, GAMES } from './games/frame.js';
import './games/thinking.js';
import './games/strategy.js';
import './games/vietnam.js';
import './games/market.js';
import './games/farmgames.js';
import './games/folk.js';
import './games/folk2.js';
import { openHowTo } from './howto.js';
import { createFarm, jobProgress, ensureJobs } from './farm.js';
import { createPlaces } from './places.js';
import { createTown } from './town.js';
import { createRegions, LANDMARKS } from './regions.js';
import { createGathering } from './gather.js';
import { createAsia } from './asia.js';
import { createHeritage } from './heritage.js';
import { createPets } from './pets.js';
import { createFerries } from './ferry.js';
import { createPassport } from './passport.js';
import { createFestivals } from './festivals.js';
import { createWeather } from './weather.js';
import { createFun, confetti } from './fun.js';
import { createLearning } from './learn.js';
import { createShowcase } from './showcase.js';
import './games/asia.js';
import './games/music.js';
import './games/cities.js';
import { createRoads } from './roads.js';
import { createCities } from './cities.js';
import { createChatter, LINES as CHAT_LINES } from './chatter.js';
import { createKites } from './kite.js';
import { setupTrading, openTrade } from './trade.js';
import { createSecrets, SECRETS } from './secrets.js';
import { PROLOGUE, showStory, storyCheck, showQuestTale, QUEST_TALES } from './story.js';
import { openWardrobe, openGamesHub, openQuick } from './ui.js';

// ---------- renderer & world ----------
const quality = settings.quality === 'auto' ? ((navigator.hardwareConcurrency || 4) <= 4 || Math.min(screen.width, screen.height) < 500 ? 'low' : 'mid') : settings.quality;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', preserveDrawingBuffer: false, powerPreference: 'high-performance' }); }
catch (e) { $('#boot').innerHTML = `<p>${T('Sorry, this device cannot show the 3D world.', 'Xin lỗi, máy này không hiển thị được thế giới 3D.')}</p>`; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.25 : quality === 'high' ? 2 : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // flat illustrated colours, exactly as painted
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
G.renderer = renderer;

// ---------- people of the valley ----------
const NPCS = [];
G.npcs = NPCS;
function nameTag(name, color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  // drawn in the chosen language, and redrawn when it changes ("Ông Cú" is "Grandpa Owl" in English)
  const draw = () => {
    const text = nm(name); x.clearRect(0, 0, 256, 64);
    x.font = 'bold 34px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(250, x.measureText(text).width + 30);
    x.fillStyle = 'rgba(15,30,35,.72)'; x.beginPath(); x.roundRect((256 - w) / 2, 8, w, 48, 24); x.fill();
    x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33, 240);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(3, .75, 1); s.renderOrder = 5;
  return s;
}
function addNPC({ id, name, look, model, x, z, face = 0, icon = '💬', talk }) {
  const A = model ? null : buildAvatar(look, null), obj = model || A.root;
  const av = model ? null : obj;
  obj.position.set(x, world.groundAt(x, z), z); obj.rotation.y = face; scene.add(obj);
  const tag = nameTag(name); tag.position.set(x, obj.position.y + (model ? 3.4 : 2.0), z); scene.add(tag);
  const n = { id, name, x, z, obj, tag, avatar: av, A, talk }; registerName(name, icon);
  NPCS.push(n);
  world.colliders.push({ x, z, r: .7 });
  G.interactables.push({ id: 'npc_' + id, x, z, r: 3, icon, label: () => T('Talk to ', 'Nói chuyện với ') + nm(name), act: h => talk(h) });
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
  // the Folk Games Playground: friends from Australia and Vietnam, each teaching their own game
  const PG = PLAYGROUND, look = (style, color, hair, hairStyle, hat, skin = '#f6c7a5') => ({ style, color, hat, back: 'none', hair, hairStyle, skin, glider: 0 });
  addNPC({ id: 'jack', name: 'Jack 🇦🇺', look: look('shirt', '#3b6fe0', '#e8c26a', 'short', 'cap', '#ffe3d1'), x: PG.x - 3, z: PG.z - 3, face: .4, icon: '🐺',
    talk: h => kidTalk(h, 'mrwolf', 'Jack', ["G'day! I'm Jack from Australia. Want to play What's the time, Mr Wolf? I'll be the wolf! Grrr!", 'Chào bạn! Tớ là Jack đến từ nước Úc. Chơi "Mấy giờ rồi, ông Sói?" không? Tớ làm sói cho! Gừ gừ!']) });
  addNPC({ id: 'mit', name: 'Mít 🇻🇳', look: look('dress', '#ffd23f', '#1d1412', 'buns', 'flower'), x: PG.x + 1.5, z: PG.z + .5, face: -.6, icon: '🥢',
    talk: h => kidTalk(h, 'chuyen', 'Mít', ['Hi! I am Mít. In Vietnam we play Đánh chuyền with a ball and sticks. Jack calls it Knucklebones!', 'Chào bạn! Tớ là Mít. Ở Việt Nam tụi tớ chơi đánh chuyền với quả bóng và que. Jack gọi là Knucklebones đó!']) });
  addNPC({ id: 'bom', name: 'Bờm 🇻🇳', look: look('tunic', '#e8434a', '#1d1412', 'spiky', 'none'), x: PG.x + 5, z: PG.z - 4, face: -1, icon: '🐉',
    talk: h => kidTalk(h, 'dragon', 'Bờm', ['Let us be a dragon! Hold on tight and sing: Rồng rắn lên mây!', 'Mình làm rồng rắn nào! Bám chặt vào và hát: Rồng rắn lên mây!']) });
  addNPC({ id: 'ruby', name: 'Ruby 🇦🇺', look: look('overalls', '#a66bff', '#a8432a', 'long', 'bow', '#ffe3d1'), x: 44.2, z: 56.4, face: 1.4, icon: '🔮',
    talk: h => kidTalk(h, 'marbles', 'Ruby', ['I have got my lucky shooter marble! Can you knock the marbles out of the ring?', 'Tớ có viên bi cái may mắn nè! Bạn bắn được bi ra khỏi vòng không?']) });
  addNPC({ id: 'lan', name: 'Lan 🇻🇳', look: look('aodai', '#5fd39a', '#3b2618', 'ponytail', 'none'), x: PG.x - 6, z: PG.z + 3, face: 1.2, icon: '🪢',
    talk: h => kidTalk(h, 'skipping', 'Lan', ['Nhảy dây! Skipping! Jump when the rope comes down and count with me!', 'Nhảy dây nào! Nhảy lên khi dây quay xuống và đếm cùng tớ nhé!']) });
  gourd = addNPC({ id: 'gourd', name: 'Ông Bầu', model: buildGourd(), x: V.x - V.r + 8, z: V.z + 6, face: -1.2, icon: '🍃', talk: gourdTalk });
  // outlines only on characters near a player (keeps phones fast)
  let olT = 0; const _wp = new THREE.Vector3();
  world.updaters.push(dt => {
    if ((olT -= dt) > 0) return; olT = .4;
    OUTLINED.forEach(A => { if (!A.root.parent) return; A.root.getWorldPosition(_wp); const near = G.heroes.some(h => dist2(h.pos.x, h.pos.z, _wp.x, _wp.z) < 30); if (A._ol !== near) { A._ol = near; A.outlines.forEach(o => o.visible = near); } });
  });
  // gentle idle animation
  // the children who host folk games are busy playing: they cheer, wave and clap now and then
  const PLAYERS = new Set(['teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan']);
  world.updaters.push((dt, t) => NPCS.forEach((n, k) => {
    if (n.A && PLAYERS.has(n.id)) { const ph = Math.floor(t * .7 + k * 1.3) % 4; n.A.anim(ph === 0 ? 'cheer' : ph === 2 ? 'wave' : 'idle', t + k, 0); }
    else if (n.avatar) { n.avatar.children[0].position.y = Math.sin(t * 2 + k) * .03; }
    else n.obj.rotation.z = Math.sin(t * 1.5 + k) * .05;
  }));
  // and they talk to each other about their games
  const grp = ids => ids.map(id => (NPCS.find(n => n.id === id) || {}).obj).filter(Boolean);
  G.chatGroup(grp(['jack', 'mit', 'bom', 'lan']), CHAT_LINES.playground, { height: 2.7 });
  G.chatGroup(grp(['teo', 'su', 'bong', 'ti']), CHAT_LINES.village, { height: 2.7, face: false });
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
// Floating bubble icons over every activity, so children who can't read can see where the fun is.
function setupBubbles() {
  const tex = {};
  // a round picture bubble with a big name tag underneath
  const mat = (ch, label) => { const key = ch + label; if (tex[key]) return tex[key]; const c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
    const g = x.createRadialGradient(150, 62, 10, 160, 72, 64); g.addColorStop(0, '#ffffff'); g.addColorStop(.8, '#e9f8ff'); g.addColorStop(1, '#9fdcff');
    x.shadowColor = 'rgba(0,40,80,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.fillStyle = g; x.beginPath(); x.arc(160, 70, 62, 0, Math.PI * 2); x.fill(); x.shadowColor = 'transparent';
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.stroke();
    x.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 160, 76);
    if (label) {
      x.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(310, x.measureText(label).width + 34);
      x.fillStyle = 'rgba(255,255,255,.96)'; x.beginPath(); x.roundRect(160 - w / 2, 142, w, 50, 25); x.fill();
      x.strokeStyle = '#ffb52e'; x.lineWidth = 4; x.stroke();
      x.fillStyle = '#3a2a20'; x.fillText(label, 160, 168, 290);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return tex[key] = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); };
  G.bubbleIcons = G.interactables.filter(it => it.bubble).map((it, k) => {
    const label = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, '');
    const s = new THREE.Sprite(mat(it.bubble, label.length > 22 ? label.slice(0, 21) + '…' : label)); s.scale.set(3.2, 2, 1); const y = heightAt(it.x, it.z) + 3.6; s.position.set(it.x, y, it.z); s.userData.it = it; scene.add(s);
    world.updaters.push((dt, t) => { s.position.y = y + Math.sin(t * 2 + k) * .15; const near = G.heroes.some(h => dist2(h.pos.x, h.pos.z, it.x, it.z) < it.r); s.material.opacity = near ? .45 : 1; });
    onLang(() => { const l = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, ''); s.material = mat(it.bubble, l.length > 22 ? l.slice(0, 21) + '…' : l); });
    return s;
  });
}
// Help finding the next goal: a golden light beam with a bouncing "!" over it, and for each player
// a glowing arrow plus a trail of sparkles on the ground leading the way.
function setupGuides() {
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const bang = sprite('❗', 2.4); bang.material.fog = false; scene.add(beam, bang);
  const arrowGeo = new THREE.ConeGeometry(.45, 1.1, 4); arrowGeo.rotateX(Math.PI / 2);
  const feet = sprite('👣', .8).material; // footprints when walking to a place chosen on the map
  const guides = [0, 1].map(() => {
    const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#ffd23f', fog: false }));
    const dots = Array.from({ length: 14 }, () => { const d = sprite('✨', .7); d.material = d.material.clone(); scene.add(d); return d; });
    scene.add(arrow); return { arrow, dots };
  });
  world.updaters.push((dt, t) => {
    const h0 = G.heroes[0], tg0 = h0 && playing ? questTarget(h0) : null;
    beam.visible = bang.visible = !!tg0;
    if (tg0) { const gy = heightAt(tg0.x, tg0.z); beam.position.set(tg0.x, gy + 35, tg0.z); bang.position.set(tg0.x, gy + 5.2 + Math.abs(Math.sin(t * 3)) * .8, tg0.z); beam.material.opacity = .2 + Math.sin(t * 2) * .08; }
    guides.forEach((g, i) => {
      const h = G.heroes[i];
      if (h && h.walkTo && h.walkTo.friend) { const P = G.partners[h.walkTo.friend]; if (!P) h.walkTo = null; else { h.walkTo.x = P.pos.x; h.walkTo.z = P.pos.z; if (dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z) < 4) { SFX.chime(); hudFor(h).toast('👫 ' + T(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name}! Chào bạn đi!`)); say(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name} rồi! Chào bạn đi!`); h.walkTo = null; G.huds[h.i] && G.huds[h.i].toggleEmotes(true); } } }
      if (h && h.walkTo && dist2(h.pos.x, h.pos.z, h.walkTo.x, h.walkTo.z) < 7) { SFX.chime(); hudFor(h).toast('👣 ' + T(`You walked to ${h.walkTo.name}!`, `Con đã đi bộ đến ${h.walkTo.name}!`)); h.walkTo = null; }
      const tg = h && playing ? h.walkTo || questTarget(h) : null;
      const d = tg ? dist2(h.pos.x, h.pos.z, tg.x, tg.z) : 0, show = !!tg && d > 5 && !G.paused;
      g.arrow.visible = show; g.dots.forEach(x => x.visible = show);
      if (!show) return;
      const dx = (tg.x - h.pos.x) / d, dz = (tg.z - h.pos.z) / d;
      g.arrow.position.set(h.pos.x + dx * 1.9, h.pos.y + .35 + Math.sin(t * 5) * .08, h.pos.z + dz * 1.9); g.arrow.rotation.set(0, Math.atan2(dx, dz), 0);
      const flow = (t * 3) % 2.2;
      const want = h.walkTo ? feet : g.sparkle || (g.sparkle = g.dots[0].material.clone());
      g.dots.forEach((x, k) => {
        if (x.material.map !== want.map) { x.material.map = want.map; x.material.needsUpdate = true; }
        const along = 3 + k * 2.2 + flow; if (along > Math.min(d - 1, 34)) { x.visible = false; return; }
        const px = h.pos.x + dx * along, pz = h.pos.z + dz * along;
        x.position.set(px, world.groundAt(px, pz, h.pos.y + 2) + .35, pz); x.material.opacity = 1 - along / 36;
      });
    });
  });
}
// Labels floating over whole areas so they are easy to recognise from far away.
function setupAreaSigns() {
  const sign = (en, vi, icon, x, z, h = 9) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 160; const g = c.getContext('2d');
    const draw = () => {
      const text = T(en, vi); g.clearRect(0, 0, 640, 160);
      g.font = 'bold 64px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(630, g.measureText(text).width + 150);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.roundRect(320 - w / 2, 20, w, 120, 60); g.fill(); g.strokeStyle = '#ff7eb8'; g.lineWidth = 8; g.stroke();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillStyle = '#000'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(icon, 320 - w / 2 + 26, 84);
      g.font = 'bold 60px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#4a2a5a'; g.textAlign = 'center'; g.fillText(text, 320 + 40, 84, w - 120);
    };
    draw();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); s.scale.set(16, 4, 1); s.position.set(x, heightAt(x, z) + h, z); scene.add(s);
    // fade out when you are close (so it never blocks the view), fade in from further away
    world.updaters.push(() => { const d = Math.min(...G.heroes.map(o => dist2(o.pos.x, o.pos.z, x, z)), 1e9); s.material.opacity = clamp((d - 22) / 18, 0, 1); s.visible = s.material.opacity > .02; });
  };
  sign('Lotus Village', 'Làng Sen', '🏮', VILLAGE.x, VILLAGE.z - 4, 14);
  sign('Sunny Farm', 'Nông Trại', '🏡', HOME.x, HOME.z, 13);
  sign('Dawn Plateau', 'Cao Nguyên', '🦉', 0, 4, 12);
  sign('Mirror Lake', 'Hồ Gương', '🌊', 55, 125, 8);
  sign('Bamboo Forest', 'Rừng Tre', '🎋', -100, 85, 16);
  sign('Rice Fields', 'Đồng Lúa', '🌾', 112, -38, 8);
  sign('Two Homes Street', 'Phố Hai Quê', '🏘️', 28, 47, 12);
  sign('Three Regions Market', 'Chợ Ba Miền', '🏮', 121, 83, 12);
  sign('Aussie Corner', 'Góc Nước Úc', '🍦', -117, -12, 12);
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
  // Level = how far this child has got in this game, shifted by the chosen difficulty.
  const p = h.profile, level = Math.min(5, (p.levels[id] || 1) + { easy: 0, medium: 1, hard: 2 }[p.difficulty || 'easy']);
  const little = G.heroes.some(x => x.profile.age !== 'big'), strong = !little && p.difficulty !== 'easy';
  if (source === 'shrine') { SFX.secret(); say('A shrine! Let’s solve the puzzle.', 'Một ngôi đền! Cùng giải câu đố nào.'); await wait(600); }
  const res = await openGame(id, { players, level, little, strong, style: source === 'folk' || id === 'market' ? 'village' : 'shrine' });
  G.paused = false;
  if (!res.won) return;
  // winning Kite Flying earns the whistling kite (diều sáo), which then flies above you everywhere
  if (id === 'kite' && !p.kite) {
    p.kite = true; p.kiteOn = true; save(); G.kites.sync();
    setTimeout(async () => { await reward('🪁', T('A whistling kite!', 'Diều sáo!'), T('It flies above you wherever you go, and its bamboo flute sings in the wind. Switch it on or off in your Backpack.', 'Diều bay theo con khắp nơi, và ống sáo tre hát vi vu trong gió. Bật hoặc tắt trong Ba lô nhé.')); }, 3600);
  }
  for (const hero of G.heroes) {
    // move up a level after every 2 wins
    const q = hero.profile; q.wins[id] = (q.wins[id] || 0) + 1;
    if (q.wins[id] % 2 === 0 && (q.levels[id] || 1) < 5) { q.levels[id] = (q.levels[id] || 1) + 1; if (hero === h) setTimeout(() => { hudFor(h).toast(T('⭐ Level up! ', '⭐ Lên cấp! ') + (q.levels[id])); SFX.chime(); }, 3000); }
    else if (!q.levels[id]) q.levels[id] = 1;
    q.stats.games = (q.stats.games || 0) + 1;
    if (source === 'shrine' && shrine && !q.shrines[shrine.id]) {
      q.shrines[shrine.id] = true; q.orbs++; addMoney(q, 20);
      const st = giveSticker(q);
      if (hero === h) {
        world.setShrineDone(shrine.id, true);
        await reward('🔮', T('Sparkle Orb!', 'Ngọc Lấp Lánh!'), T(`+${fmt(20)} and a new sticker ${st || ''}. Bring 4 orbs to the Lotus Statue!`, `+${fmt(20)} và một hình dán mới ${st || ''}. Mang 4 viên ngọc đến Tượng Sen nhé!`));
      }
    } else if (source === 'folk' || source === 'place' || id === 'market') {
      const first = !q.quests['played_' + id];
      q.quests['played_' + id] = true; if (source !== 'place') q.quests[id === 'market' ? 'market' : 'folk'] = true;
      const amt = id === 'market' ? 25 : source === 'place' ? 8 : 12; addMoney(q, amt);
      const st = first ? giveSticker(q) : null;
      if (hero === h) await reward(id === 'market' ? '💰' : '🎉', T(`+${fmt(amt)}!`, `+${fmt(amt)}!`), st ? T(`New sticker ${st}!`, `Hình dán mới ${st}!`) : T('Thank you for playing!', 'Cảm ơn con đã chơi!'));
    } else {
      addMoney(q, 5); if (hero === h) hudFor(h).toast(`+${fmt(5)} 💰`);
    }
  }
  save(); checkQuests(h);
  G.job('puzzle', 1, h); if (id === 'balloon') G.job('fly', 1, h); if (id === 'bubbles') G.job('bubbles', 1, h);
}
G.playGame = playGame;
G.job = (kind, n = 1, h) => jobProgress(G, kind, n, h);
G.STICKERS = STICKERS;
G.openWardrobe = i => { if (G.paused) return; G.paused = true; G.closeUp = i; openWardrobe(G, i, () => { G.paused = false; G.closeUp = null; }); };

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
      ['I am Ông Cú, the wisest bird in the valley. This valley is full of puzzles, friends and secrets.', 'Ông là Ông Cú, chú cú già thông thái. Thung lũng này có rất nhiều câu đố, bạn bè và bí mật.'],
      ['See that tall tower glowing orange? Climb it, and your map will light up!', 'Con thấy cái tháp cao màu cam kia không? Leo lên đó, bản đồ của con sẽ sáng lên!'],
      ['Then solve the three shrines here on the plateau, and I will give you a special present.', 'Sau đó giải ba ngôi đền trên cao nguyên này, ông sẽ tặng con một món quà đặc biệt.']
    ]);
    G.heroes.forEach(x => { x.profile.quests.owl = true; }); save(); G.heroes.forEach(x => checkQuests(x)); return;
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
  const k = await dialog(name, [line], [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
  if (k === 0) playGame(h.i, game, 'folk');
  if (k === 1) { G.paused = true; openHowTo(game, { onPlay: () => { G.paused = false; playGame(h.i, game, 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
}
// ---------- Two Homes Street: talking to the neighbours ----------
G.kidTalk = (h, game, name, line) => kidTalk(h, game, name, line);
G.townTalk = async (h, who) => {
  if (who === 'sau') {
    const k = await dialog('Cô Sáu', [['Nước mía đây! Fresh sugarcane juice, cold and sweet. A glass gives you lots of energy!', 'Nước mía đây con! Mát lạnh, ngọt lịm. Uống một ly là khỏe re!']],
      [[`🥤 Buy a glass (${fmt(5)})`, `🥤 Mua một ly (${fmt(5)})`], ['👋 Bye', '👋 Tạm biệt']]);
    if (k !== 0) return;
    if (farm.coins < 5) { await dialog('Cô Sáu', [['Not enough money? Here, this one is on me. Have a nice day!', 'Không đủ tiền hả? Thôi cô mời con ly này. Chúc con vui nhé!']]); }
    else addMoney(null, -5);
    SFX.chime(); h.bonusStamina = Math.max(h.bonusStamina, 60); h.stamina = h.staminaMax; h.hearts = Math.max(h.hearts, h.profile.hearts);
    await reward('🥤', T('Yum! Sugarcane juice!', 'Ngon quá! Nước mía!'), T('Full of energy: you can run and climb longer.', 'Tràn đầy năng lượng: chạy và leo được lâu hơn.'));
  }
  if (who === 'tu') {
    const k = await dialog('Chú Tư', [['Hello little one! We are playing cards. Want to join? We can play Snap, an Aussie game my neighbour taught me!', 'Chào con! Tụi chú đang đánh bài. Con chơi không? Mình chơi Snap, trò của Úc mà ông hàng xóm dạy chú đó!']],
      [['▶ Play Snap!', '▶ Chơi Snap!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'snap', 'folk');
    if (k === 1) { G.paused = true; openHowTo('snap', { onPlay: () => { G.paused = false; playGame(h.i, 'snap', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
  if (who === 'tuan') {
    const k = await dialog('Anh Tuấn', [['Đá cầu! We kick the shuttlecock and never let it touch the ground. Want to try?', 'Đá cầu nè! Tụi anh đá quả cầu, không để nó rơi xuống đất. Em thử không?']],
      [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'dacau', 'folk');
    if (k === 1) { G.paused = true; openHowTo('dacau', { onPlay: () => { G.paused = false; playGame(h.i, 'dacau', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
};
// ---------- chatting with villagers ----------
G.chatWith = (i, pid, firstAsk) => { if (!PERSONAS[pid] || gameOpen()) return; const was = G.paused; G.paused = true; openChat(G, i, pid, () => { G.paused = was && !!document.querySelector('.modal'); }, firstAsk); };
G.voiceCommand = i => voiceCommand(G, i); G.voiceControlOn = voiceControlOn;
dialogHooks.canChat = name => !!personaByName(name);
dialogHooks.chat = name => {
  const [pid] = personaByName(name), n = NPCS.find(x => x.id === pid) || { x: 0, z: 0 };
  const h = G.heroes.slice().sort((a, b) => dist2(a.pos.x, a.pos.z, n.x, n.z) - dist2(b.pos.x, b.pos.z, n.x, n.z))[0];
  if (h) G.chatWith(h.i, pid);
};
// ---------- the Games hub: every game, by place, playable straight away ----------
const GAME_SPOT = { music: 'musiccorner', firstwords: 'g_firstwords', tangram: 'g_tangram', snakes: 'g_snakes', rangoli: 'g_rangoli', datnieu: 'g_datnieu', kite: 'g_kite', chichi: 'g_chichi', sackrace: 'g_sackrace', cricket: 'g_cricket', parcel: 'g_parcel', words: 'g_words', snap: 'cards', dacau: 'dacau', mrwolf: 'npc_jack', chuyen: 'npc_mit', dragon: 'npc_bom', marbles: 'npc_ruby', skipping: 'npc_lan', oanquan: 'npc_teo', hopscotch: 'npc_ti', caro: 'npc_bong', tug: 'npc_su', market: 'npc_mai', jigsaw: 'easel', bunny: 'hutch', balloon: 'balloon', bubbles: 'bubbles',
  tower: 'blocks', order: 'order', sortout: 'bear', duckmaze: 'duckmaze', memory: 'chest', tune: 'xylo', shapes: 'theatre', oddone: 'frog' };
G.gameSpot = id => G.interactables.find(it => it.id === (GAME_SPOT[id] || (G.GAME_SPOT || {})[id] || (SHRINES.find(s => s.game === id) || {}).id));
G.openQuick = i => { if (G.paused) return; G.paused = true; openQuick(G, i); };
G.openGamesHub = i => { if (G.paused) return; G.paused = true; openGamesHub(G, i, () => { G.paused = false; }); };
// Games hub / map: fly straight to the friend who runs a game (or a place), then start it there
const npcLike = it => /^(npc_|g_|v_|pc_|cards$|dacau$|musiccorner$|bear$|stall$)/.test(it.id || '');
G.landBy = async (h, x, z) => { await G.travel(h, x - 4.5 + 1.8, z - 1 + 1.4); h.yaw = Math.atan2(x - h.pos.x, z - h.pos.z); h.camYaw = h.yaw + Math.PI; };
G.meetAndPlay = async (i, id) => {
  const h = G.heroes[i], it = G.gameSpot(id); if (!h) return;
  if (!it) { G.playGame(i, id, 'place'); return; }
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 4) await G.landBy(h, it.x, it.z);
  G.fx && G.fx(it.x, heightAt(it.x, it.z) + 2.4, it.z, '🎮'); await wait(500);
  G.playGame(i, id, 'place');
};
// the villager nearest to a place on the map (within 20 m), so travelling lands you right next to them
G.npcNear = (x, z, r = 20) => G.interactables.filter(it => npcLike(it) && Number.isFinite(it.x) && dist2(it.x, it.z, x, z) < r).sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z))[0] || null;
G.travelTo = async (h, x, z) => { const n = G.npcNear(x, z); if (n) { await G.landBy(h, n.x, n.z); hudFor(h).toast('👋 ' + n.label()); } else await G.travel(h, x, z); };
G.goToGame = (i, id) => { const h = G.heroes[i], it = G.gameSpot(id); if (!h || !it) return; (async () => { if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 45) await G.travel(h, it.x - 1.5, it.z + 2); goAndDo(h, it); })(); };
// ---------- objective helpers ----------
G.objectiveIcon = h => { const q = currentQuest(h.profile); return q ? q.icon : '🏆'; };
G.sayObjective = i => { const h = G.heroes[i]; if (!h) return; const q = currentQuest(h.profile); if (!q) return; const tale = QUEST_TALES[q.id]; if (tale) say(tale[2], tale[3]); else say(q.title(), q.title()); };
// "Go" button: walk to the goal (or fly there if it is far away) and start it on arrival.
G.goToObjective = async i => {
  const h = G.heroes[i]; if (!h || G.paused) return;
  const tg = questTarget(h); if (!tg) { G.sayObjective(i); return; }
  const it = G.interactables.filter(x => !x.auto && (!x.visible || x.visible(h))).sort((a, b) => dist2(a.x, a.z, tg.x, tg.z) - dist2(b.x, b.z, tg.x, tg.z))[0];
  const near = it && dist2(it.x, it.z, tg.x, tg.z) < 6 ? it : null;
  say('Let\u2019s go!', 'Đi thôi!');
  if (dist2(h.pos.x, h.pos.z, tg.x, tg.z) > 45) { await G.travel(h, tg.x - 1.5, tg.z + 2); }
  if (near) goAndDo(h, near); else h.goal = { x: tg.x, z: tg.z };
};
const GOURD_GIFTS = [[3, 'money', 15], [6, 'money', 25], [10, 'glider', 2], [15, 'money', 40], [20, 'money', 60], [24, 'glider', 4]];
async function gourdTalk(h) {
  const p = h.profile, n = Object.keys(p.leafies).length;
  const due = GOURD_GIFTS.filter(([need]) => n >= need && !p.quests['gourd' + need]);
  if (!due.length) {
    const next = GOURD_GIFTS.find(([need]) => n < need);
    await dialog('Ông Bầu', [['Yahoo! I love Leafies, the little spirits hiding all over the valley.', 'Ố là la! Ông thích các bạn Lá Lá lắm, chúng trốn khắp thung lũng.'],
      [next ? `You found ${n}. Find ${next[0]} and I will give you a present!` : 'You found every single Leafy! You are amazing!', next ? `Con tìm được ${n} bạn rồi. Tìm đủ ${next[0]} bạn, ông sẽ tặng quà!` : 'Con tìm được tất cả các bạn Lá Lá! Con giỏi quá!'],
      ['Look under odd rocks and touch sparkles on high places!', 'Nhìn dưới những hòn đá lạ và chạm vào tia lấp lánh ở chỗ cao nhé!'],
      ...(G.secrets.hint(h) ? [['Psst… a secret: ' + G.secrets.hint(h), 'Suỵt… bí mật nhé: ' + G.secrets.hint(h)]] : [])]);
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
  if (world.isNight() && !(p.secrets || {}).wish) { G.fx(world.statue.x, heightAt(world.statue.x, world.statue.z) + 8, world.statue.z, '🌠'); await G.secrets.unlock(h, 'wish'); return; }
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
    case 'playground': return NPCS.find(n => n.id === 'jack');
    case 'market': return { x: 99, z: 83 };
    case 'aussie': return { x: -121, z: -12 };
    case 'postcard': return near(LANDMARKS.filter(l => !(p.postcards || {})[l.id]).map(l => ({ x: l.x, z: l.z + 2 })));
    case 'buffalo': return near(world.buffalo.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z })));
    case 'leafy': return near(LEAFIES.filter(l => !p.leafies[l.id]));
    case 'statue': return p.orbs >= 4 ? world.statue : near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || world.statue;
    case 'tower': return near(TOWERS.filter(t => !p.towers[t.id]));
    case 'shrine': return near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id]));
  }
  return null;
}
G.questTarget = questTarget;
G.objective = h => { const q = currentQuest(h.profile); return q ? q.title() : T('You finished the adventure! Keep exploring!', 'Con đã hoàn thành cuộc phiêu lưu! Tiếp tục khám phá nhé!'); };
G.save = save; G.addCoins = xu => addMoney(null, xu); G.giveSticker = p => giveSticker(p); G.reward = reward; G.fmt = fmt;
async function checkQuests(h) {
  const p = h.profile;
  // story chapters open when their quest is done (pause the world while the book is open)
  if (!G._reading) { G._reading = true; try { await storyCheck(G, h, id => questDone(p, QUESTS.find(q => q.id === id))); } finally { G._reading = false; } }
  const k = 'seen_' + (currentQuest(p) || { id: 'all' }).id;
  if (!p.quests[k]) {
    p.quests[k] = true; save();
    const q = currentQuest(p);
    // every new goal is told as a little story; "Let's go!" walks there straight away
    if (q && q.id !== 'owl') setTimeout(async () => {
      // wait until no game, book, chat or menu is open
      for (let k = 0; k < 600 && (gameOpen() || document.querySelector('.storybook, .modal, .dialog, .reward, .howto')); k++) await wait(500);
      if (currentQuest(p) !== q || !playing) return;
      const was = G.paused; G.paused = true; const go = await showQuestTale(q, p.name); G.paused = was;
      if (go) G.goToObjective(h.i); else hudFor(h)?.toast(T('New goal: ', 'Mục tiêu mới: ') + q.title());
    }, 2600);
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
  // Falls never hurt little ones. Big kids on Hard lose a heart (food heals), and are carried to safety at zero.
  if (h.profile.age !== 'big' || h.profile.difficulty !== 'hard') { SFX.bump && SFX.bump(); return; }
  h.hearts = Math.max(0, h.hearts - n); SFX.no(); hudFor(h).toast(T('Oof! Big fall!', 'Ui da! Ngã đau quá!'));
  if (h.hearts <= 0) G.rescue(h, true);
};
G.rescue = async (h, fainted) => {
  if (!fainted && G.pets && G.pets.rescue(h)) return; // a pet comes to pull them out of the water
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
  if (h.cancelCarry) { h.cancelCarry(); h.cancelCarry = null; }
  h.place(x + 4.5, z + 1); h.gliding = false; h.camYaw = Math.PI;
  f.classList.add('out'); setTimeout(() => f.remove(), 700);
};
G.eat = (h, id) => {
  const p = h.profile; if (!p.dishes[id]) return;
  const r = dishInfo(id) || { heal: 1, bonus: 0, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
  p.dishes[id]--; save();
  h.hearts = Math.min(p.hearts, h.hearts + r.heal); h.bonusStamina = r.bonus; h.stamina = p.staminaMax + r.bonus; h.exhausted = false;
  SFX.ok(); say(`Yum yum! ${r.name()}!`, `Măm măm! ${r.name()}!`); h.cheerT = 1.2;
};
G.onCooked = (h) => { checkQuests(h); G.job('cook', 1, h); };
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
G.PLACES = [
  { icon: '🏡', name: () => T('Sunny Farm', 'Nông trại'), x: HOME.x - 4, z: HOME.z + 2 },
  { icon: '🏮', name: () => T('Lotus Village', 'Làng Sen'), x: VILLAGE.x - VILLAGE.r + 6, z: VILLAGE.z },
  { icon: '🐼', name: () => T('China Town', 'Làng Trung Hoa'), x: CHINA.x, z: CHINA.z + 12 },
  { icon: '🐘', name: () => T('India Village', 'Làng Ấn Độ'), x: INDIA.x, z: INDIA.z + 15 },
  { icon: '🦉', name: () => T('Ông Cú', 'Ông Cú'), x: -2, z: -3 },
  { icon: '💃', name: () => T('Dance stage', 'Sân khấu'), x: VILLAGE.x - 6, z: VILLAGE.z + 25 },
  { icon: '🏘️', name: () => T('Two Homes Street', 'Phố Hai Quê'), x: 28, z: 52 },
  { icon: '🏖️', name: () => T('Beach', 'Bãi biển'), x: 6, z: 140 },
  { icon: '🏮', name: () => T('Three Regions Market', 'Chợ Ba Miền'), x: 99, z: 83 },
  { icon: '🍦', name: () => T('Aussie Corner', 'Góc Nước Úc'), x: -121, z: -12 },
  { icon: '🎭', name: () => T('Opera House', 'Nhà hát Opera'), x: 92, z: 128 },
  { icon: '🪨', name: () => T('Uluru', 'Uluru'), x: -128, z: 132 },
  { icon: '🐻', name: () => T('Mr. Bear', 'Bác Gấu'), x: HOME.x - 21, z: HOME.z + 6 }
];
G.changePlayer = () => {
  save(); Net.close(); Net.stopListening(); playing = false; G.paused = true; $('#huds').hidden = true;
  G.heroes.forEach(h => { if (h.riding) h.dismount(); scene.remove(h.av.root); }); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  showWho((mode, chosen) => startSession(mode, chosen));
};
// Children who are not playing right now still wander around the farm.
G.wanderers = [];
function setupWanderers(active) {
  G.wanderers.forEach(w => { scene.remove(w.av.root); scene.remove(w.tag); }); G.wanderers = [];
  for (let i = G.interactables.length - 1; i >= 0; i--) if (/^wander\d/.test(G.interactables[i].id)) G.interactables.splice(i, 1);
  profiles.filter(p => !active.includes(p)).slice(0, 4).forEach((p, k) => {
    const av = buildAvatar(p.look, p.photo), tag = nameTag(p.name);
    const x = HOME.x - 8 + k * 4, z = HOME.z + 4;
    av.root.position.set(x, heightAt(x, z), z); scene.add(av.root); scene.add(tag);
    const w = { av, tag, tx: x, tz: z, pos: av.root.position, yaw: 0, wave: 0 }; G.wanderers.push(w);
    G.interactables.push({ id: 'wander' + k, get x() { return w.pos.x; }, get z() { return w.pos.z; }, r: 2.5, icon: '👋', label: () => T('Say hi to ', 'Chào ') + nm(p.name),
      act: h => { SFX.ok(); w.wave = 2.5; w.tx = w.pos.x; w.tz = w.pos.z; w.yaw = Math.atan2(h.pos.x - w.pos.x, h.pos.z - w.pos.z); say(`Hi ${p.name}! Want to play together later?`, `Chào ${p.name}! Lát nữa mình chơi cùng nhau nhé?`); } });
  });
}
world.updaters.push((dt, t) => G.wanderers.forEach((w, k) => {
  const p = w.pos, dx = w.tx - p.x, dz = w.tz - p.z, d = Math.hypot(dx, dz);
  let st = 'idle', sp = 0;
  if (w.wave > 0) { w.wave -= dt; st = 'wave'; }
  else if (d < .3) { if (Math.random() < dt * .25) { const a = Math.random() * 6.28, r = 4 + Math.random() * 14; w.tx = HOME.x + Math.cos(a) * r; w.tz = HOME.z + Math.sin(a) * r; } }
  else { sp = 2.2; w.yaw = Math.atan2(dx, dz); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; st = 'walk'; }
  world.collide(p, .4); p.y = world.groundAt(p.x, p.z, p.y + 1); w.av.root.rotation.y = w.yaw; w.av.anim(st, t + k, sp); w.tag.position.set(p.x, p.y + 2, p.z);
}));
G.openPad = (i, tab) => { if (G.paused) return; G.paused = true; openPad(G, i, tab); };
G.closePad = () => { G.paused = false; };

// ---------- talking: quick phrases, speech bubbles, voice calls ----------
function bubble(target, text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.font = 'bold 44px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(500, x.measureText(text).width + 50);
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
// Kid-sized mute buttons: 🎵 turns music on/off, 🔊 turns sound effects and the talking voice on/off together.
G.toggleAudio = kind => {
  if (kind === 'music') { settings.music = !settings.music; if (settings.music) Music.refresh(); else Music.stop(); }
  else { const on = !(settings.sound || settings.voice); settings.sound = on; settings.voice = on; if (!on) hush(); }
  saveSettings(); SFX.tap(); G.huds.forEach(h => h.refreshAudio());
};
G.toggleMute = () => { Net.setMuted(!Net.muted); Net.resumeAudio(); G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted)); };
// Keyboard shortcuts on computers (shown as little key badges on the buttons). Player 1's screen.
addEventListener('keydown', e => {
  if (!playing || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
  const k = e.code;
  // Escape closes the top pop-up, chat or game card
  if (k === 'Escape') { const x = [...document.querySelectorAll('.modal .x, .vc-pop .vc-x, .chatwin .x, .dlg-close')].pop(); if (x) { x.click(); e.preventDefault(); } return; }
  if (G.paused || gameOpen() || document.querySelector('.modal, .storybook, .vc-pop')) return;
  const two = G.heroes.length > 1, i = 0;
  const map = { KeyG: () => G.openGamesHub(i), KeyM: () => G.openPad(i, 'map'), KeyB: () => G.openPad(i, 'bag'), KeyK: () => G.voiceCommand(i),
    KeyT: () => G.huds[i].toggleEmotes(), KeyC: () => Net.connected && G.toggleMute(), KeyN: () => G.toggleAudio('music'), KeyO: () => G.toggleAudio('sound'),
    KeyF: () => G.goToObjective(i), KeyP: () => G.openPad(i, 'friend'),
    Equal: () => G.zoomBy(i, .8), NumpadAdd: () => G.zoomBy(i, .8), Minus: () => G.zoomBy(i, 1.25), NumpadSubtract: () => G.zoomBy(i, 1.25) };
  if (two && ['KeyK', 'KeyT'].includes(k)) return;
  const f = map[k]; if (f) { e.preventDefault(); e.stopImmediatePropagation(); f(); }
}, true);
function sendHello() {
  const h = G.heroes[0]; if (!h) return;
  let photo = null;
  if (h.profile.photo) { const c = document.createElement('canvas'); c.width = c.height = 160; const im = new Image(); im.src = h.profile.photo; try { c.getContext('2d').drawImage(im, 0, 0, 160, 160); photo = c.toDataURL('image/jpeg', .7); } catch (e) { } }
  const friend = settings.friendsOn ? settings.friendCode : null;
  Net.send({ t: 'hello', name: h.profile.name, look: h.profile.look, photo, friend });
  return { name: h.profile.name, look: h.profile.look, photo, friend };
}
G.sendHello = sendHello;
// Friends in the same room: one avatar and name tag each.
G.partners = {};
Object.defineProperty(G, 'partner', { get: () => Object.values(G.partners)[0] || null }); // older code: the first friend
Net.on('hello', r => {
  const old = G.partners[r.id]; if (old) { scene.remove(old.av.root); scene.remove(old.tag); }
  const av = buildAvatar(Object.assign({ style: 'shirt', color: '#3d7fd6', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5', glider: 0 }, r.look || {}), r.photo);
  scene.add(av.root); const tag = nameTag(r.name || T('Friend', 'Bạn'), '#9ff0ff'); scene.add(tag);
  G.partners[r.id] = { id: r.id, av, tag, pos: old ? old.pos : new THREE.Vector3(0, -50, 0), yaw: 0, st: 'idle', name: r.name, photoURL: avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) }) };
  if (!old) { SFX.chime(); say(`${r.name} is here! Say hello!`, `${r.name} đã đến! Chào bạn đi!`); }
  G.huds.forEach(hd => hd.setCall(true, false, Net.muted));
  if (G.onNet) G.onNet();
});
Net.on('emote', d => { const e = EMOTES.find(e => e.id === d.id), P = G.partners[d.from]; if (!e || !P) return; bubble(P, e.icon + ' ' + T(e.en, e.vi)); say(`${P.name} says: ${e.en}`, `${P.name} nói: ${e.vi}`); });
Net.on('left', r => {
  const P = G.partners[r.id]; if (P) { scene.remove(P.av.root); scene.remove(P.tag); delete G.partners[r.id]; }
  if (!Net.connected || !Object.keys(G.partners).length) G.huds.forEach(hd => hd.setCall(false));
  toast(T(`${r.name || 'Your friend'} left.`, `${r.name || 'Bạn'} đã rời đi.`)); if (G.onNet) G.onNet();
});
// "Come and meet me!": a friend asks you to come to where they are
Net.on('meet', d => {
  const P = G.partners[d.from]; if (!P || !G.heroes[0]) return;
  SFX.chime(); bubble(P, '📣 ' + T('Come here!', 'Lại đây nè!'));
  dialog(P.name, [[`📣 ${P.name} wants to meet you! Shall we go?`, `📣 ${P.name} muốn gặp con! Mình đi nhé?`]], [['👣 Walk there', '👣 Đi bộ đến'], ['✨ Fly there', '✨ Bay đến'], ['🙂 Not now', '🙂 Để sau']])
    .then(k => { const h = G.heroes[0]; if (k === 0) G.walkToFriend(h, P.id); if (k === 1) G.flyToFriend(h, P.id); if (k === 2) Net.send({ t: 'emote', id: 'wait' }); });
});
G.flyToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; G.travel(h, P.pos.x - 4.5 + 1.5, P.pos.z - 1 + 1.5); setTimeout(() => { bubble(h, '👋 ' + T('Hi!', 'Chào!')); Net.send({ t: 'emote', id: 'hi' }); }, 900); };
G.walkToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; h.walkTo = { friend: id, x: P.pos.x, z: P.pos.z, name: P.name }; say(`Follow the footprints to ${P.name}!`, `Đi theo dấu chân đến chỗ ${P.name} nhé!`); };
G.askFriendToCome = (h, id) => { const P = G.partners[id]; if (!P) return; Net.send({ t: 'meet', to: id }); bubble(h, '📣 ' + T('Come here!', 'Lại đây nè!')); hudFor(h).toast('📣 ' + T(`Asked ${P.name} to come to you`, `Đã gọi ${P.name} đến chỗ con`)); };
// where are my friends? a little card with each friend's distance and direction, and ways to meet
const compass = (h, x, z) => { const a = Math.atan2(x - h.pos.x, -(z - h.pos.z)); return ['⬆️ ' + T('north', 'phía bắc'), '↗️ ' + T('north-east', 'đông bắc'), '➡️ ' + T('east', 'phía đông'), '↘️ ' + T('south-east', 'đông nam'), '⬇️ ' + T('south', 'phía nam'), '↙️ ' + T('south-west', 'tây nam'), '⬅️ ' + T('west', 'phía tây'), '↖️ ' + T('north-west', 'tây bắc')][(Math.round(a / (Math.PI / 4)) + 8) % 8]; };
G.friendWhere = (h, P) => { const rg = regionAt(P.pos.x, P.pos.z); return (REGION_NAMES[rg] ? REGION_NAMES[rg]() : ''); };
G.findFriend = i => {
  const h = G.heroes[i]; if (!h) return null;
  const list = Object.values(G.partners).filter(P => P.pos.y > -40);
  if (!list.length) { G.openPad(i, 'friend'); return ['No friends are in your room yet. Start a room and tell your friend the number!', 'Chưa có bạn nào trong phòng. Tạo phòng rồi đọc số cho bạn nhé!']; }
  document.querySelector('.vc-pop')?.remove();
  const pop = el('div', 'vc-pop friendfind', `<p class="vc-heard">👫 ${T('Where are my friends?', 'Bạn của con ở đâu?')}</p>
    ${list.map(P => { const d = Math.round(dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z)); return `<div class="ff-row"><img src="${P.photoURL || ''}" alt="" ${P.photoURL ? '' : 'hidden'}><div class="ff-txt"><b>${esc(nm(P.name))}</b><small>${d} m · ${compass(h, P.pos.x, P.pos.z)}${G.friendWhere(h, P) ? ' · ' + esc(G.friendWhere(h, P)) : ''}</small></div>
      <div class="ff-btns"><button class="btn primary" data-walk="${P.id}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${P.id}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-call="${P.id}">📣 ${T('Ask to come', 'Gọi bạn đến')}</button></div></div>`; }).join('')}`);
  const x = el('button', 'vc-x', '✕'); pop.appendChild(x); x.onclick = () => pop.remove();
  document.body.appendChild(pop); SFX.tap();
  pop.querySelectorAll('[data-walk]').forEach(b => b.onclick = () => { pop.remove(); G.walkToFriend(h, b.dataset.walk); });
  pop.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { pop.remove(); G.flyToFriend(h, b.dataset.fly); });
  pop.querySelectorAll('[data-call]').forEach(b => b.onclick = () => { pop.remove(); G.askFriendToCome(h, b.dataset.call); });
  return null;
};
let qT = 0; Net.on('quality', () => { if (Date.now() - qT > 1900) { qT = Date.now(); if (G.onNet && document.querySelector('.pad .online.on')) G.onNet(); } });
addEventListener('online', () => { toast(T('Back online!', 'Có mạng lại rồi!')); G.listenFriends && G.listenFriends(); });
addEventListener('offline', () => toast(T('No internet right now. Friends will come back when it returns.', 'Đang mất mạng. Khi có mạng lại, các bạn sẽ quay lại.')));
Net.on('talking', on => G.huds.forEach(hd => hd.setCall(Net.connected, on, Net.muted)));
const _np = new THREE.Vector3();
let netStatus = '';
Net.on('status', s => {
  const msg = {
    waiting: T(`Room code: ${s.code}. Tell your friend this number!`, `Mã phòng: ${s.code}. Đọc số này cho bạn nhé!`), connecting: T('Connecting…', 'Đang kết nối…'), connected: T('Connected! You can talk now.', 'Đã kết nối! Giờ có thể nói chuyện rồi.'),
    nocode: T('No room with that number. Check the code.', 'Không có phòng số này. Kiểm tra lại mã nhé.'), nomic: T('No microphone: your friend will not hear you, but you can still play and use the talk buttons.', 'Không có micrô: bạn sẽ không nghe được con, nhưng vẫn chơi và dùng nút nói được.'),
    left: T('The room has closed.', 'Phòng đã đóng.'), full: T('That room is full (6 players). Start your own room!', 'Phòng đã đủ 6 người. Hãy tạo phòng mới nhé!'), tapaudio: T('Tap the 🎙️ button to hear your friend.', 'Chạm nút 🎙️ để nghe bạn nói.'), cloud: T('Connected through the cloud relay! You can play and use the talk buttons. (Voice calls need a direct link: try both on Wi-Fi, or ask a grown-up to add a relay.)', 'Đã kết nối qua mạng đám mây! Chơi và dùng nút nói được. (Gọi bằng giọng nói cần kết nối trực tiếp: thử cả hai dùng Wi-Fi, hoặc nhờ người lớn thêm máy chủ trung chuyển.)'), error: T('Could not connect. Check the internet and try again.', 'Không kết nối được. Kiểm tra mạng rồi thử lại.'),
    removed: T('The room’s starter asked you to leave the room.', 'Chủ phòng đã mời con ra khỏi phòng.'),
    slow: T('Still connecting… This can take a little longer when you are on different networks.', 'Vẫn đang kết nối… Khi hai máy ở hai mạng khác nhau có thể lâu hơn một chút.'),
    stuck: T('Could not link the two devices. Try: both on Wi-Fi (or both on mobile data), start the room on the other device, or ask a grown-up to add a relay in Grown-ups → Online play.', 'Không nối được hai máy. Thử: cả hai dùng Wi-Fi (hoặc cả hai dùng 4G), để máy kia tạo phòng, hoặc nhờ người lớn thêm máy chủ trung chuyển trong mục Người lớn → Chơi trực tuyến.')
  }[s.key] || '';
  netStatus = msg; if (msg) toast(msg); if (G.onNet) G.onNet(); if (['waiting', 'connected', 'cloud', 'left'].includes(s.key)) G.shareStatus();
});
// ---------- friends: codes, invites, the online panel ----------
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
if (!settings.friendCode) { settings.friendCode = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''); saveSettings(); }
if (!Array.isArray(settings.friends)) settings.friends = [];
const onInvite = inv => {
  SFX.chime(); say(`${inv.name} invites you to play!`, `${inv.name} mời con chơi cùng!`);
  dialog(T('Invitation', 'Lời mời'), [[`👫 ${inv.name} invites you to play together! Join their room ${inv.room}?`, `👫 ${inv.name} mời con chơi cùng! Vào phòng ${inv.room} nhé?`]], [['✅ Join', '✅ Vào'], ['❌ Not now', '❌ Để sau']])
    .then(k => { if (k === 0) Net.join(inv.room, sendHello() || {}); });
};
G.listenFriends = () => {
  if (settings.friendsOn && playing) Net.listenForFriends(settings.friendCode, onInvite); else Net.stopListening();
  // friends' status (online, where in the valley, which room) through the cloud relay
  if (playing && (settings.friendsOn || settings.friends.length)) {
    Net.friendsStart({ code: settings.friendCode, share: !!settings.friendsOn, onInvite, onChange: () => G.onNet && G.onNet() }).then(() => { Net.friendsWatch(settings.friends.map(f => f.code)); G.shareStatus(); });
  } else Net.friendsStop();
};
// what my friends see about me: my name, the place I am in, and my room (only when sharing is switched on)
G.shareStatus = () => { const h = G.heroes[0]; if (!h || !settings.friendsOn) return; Net.friendsShare({ name: h.profile.name, at: G.regionOf[0] || '', room: Net.role ? Net.code : null, players: Net.role ? Net.count : 0 }); };
setInterval(() => { if (playing) G.shareStatus(); }, 45000);
// signal bars: ▂▄▆█ with the strong ones lit
G.netQuality = id => Net.quality(id);
G.barsHTML = n => `<span class="bars b${n}" aria-label="${n}/4"><i></i><i></i><i></i><i></i></span>`;
const routeName = r => r === 'cloud' ? T('cloud relay', 'qua mạng đám mây') : T('direct', 'trực tiếp');
const friendStatus = f => {
  const st = Net.friends.status[f.code];
  if (!st) return `<small class="fst off">⚪ ${T('Not seen yet', 'Chưa thấy')}</small>`;
  if (!st.online || Date.now() - (st.seen || 0) > 3 * 60000) { const m = st.lastOnline ? Math.max(1, Math.round((Date.now() - st.lastOnline) / 60000)) : null; return `<small class="fst off">⚪ ${T('Offline', 'Đang tắt')}${m ? ' · ' + (m < 60 ? T(`${m} min ago`, `${m} phút trước`) : T(`${Math.round(m / 60)} h ago`, `${Math.round(m / 60)} giờ trước`)) : ''}</small>`; }
  const where = st.at && REGION_NAMES[st.at] ? REGION_NAMES[st.at]() : T('in the valley', 'trong thung lũng');
  return `<small class="fst on">🟢 ${T('Online', 'Đang chơi')} · ${esc(where)}${st.room ? ' · ' + T('room', 'phòng') + ' ' + esc(st.room) : ''}</small>`;
};
const addFriend = (code, name) => { code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (code.length !== 6 || code === settings.friendCode) return false; const f = settings.friends.find(x => x.code === code); if (f) { if (name) f.name = name; } else settings.friends.push({ code, name: name || code }); saveSettings(); return true; };
G.drawOnlinePanel = (body, redraw) => {
  G.onNet = () => { if (document.body.contains(body)) redraw(); };
  const h = G.heroes[0];
  const friendsBox = () => `<div class="ocard friends"><h3>👫 ${T('My friends', 'Bạn của con')}</h3>
      <p class="note">${T('My friend code', 'Mã bạn bè của con')}: <b class="fcode">${settings.friendCode}</b></p>
      <label class="tog"><input type="checkbox" id="fOn" ${settings.friendsOn ? 'checked' : ''}> ${T('Friends can see when I am playing and where, and invite me (needs the internet)', 'Bạn bè thấy khi con đang chơi, đang ở đâu, và mời con được (cần có mạng)')}</label>
      <div class="flist">${settings.friends.map(f => `<div class="frow"><span class="fwho">🧒 <b>${esc(nm((Net.friends.status[f.code] || {}).name || f.name))}</b> <small>${f.code}</small>${friendStatus(f)}</span>${(Net.friends.status[f.code] || {}).online && (Net.friends.status[f.code] || {}).room && Net.code !== Net.friends.status[f.code].room ? `<button class="btn primary" data-joinf="${esc(Net.friends.status[f.code].room)}">▶ ${T('Join', 'Vào chơi')}</button>` : ''}${Net.role === 'host' ? `<button class="btn" data-inv="${f.code}">📨 ${T('Invite', 'Mời')}</button>` : ''}<button class="btn" data-rm="${f.code}" aria-label="${T('Remove', 'Xóa')}">✕</button></div>`).join('') || `<p class="note">${T('No friends yet. Add a friend code, or add someone after playing together.', 'Chưa có bạn nào. Nhập mã bạn bè, hoặc thêm bạn sau khi chơi cùng.')}</p>`}</div>
      <div class="vrow"><input type="text" id="fAdd" maxlength="6" placeholder="${T('Friend code', 'Mã bạn bè')}" autocomplete="off"><button class="btn" id="fAddB">＋ ${T('Add', 'Thêm')}</button></div>
      ${Net.role !== 'host' && settings.friends.length ? `<p class="note">${T('Start a room to invite your friends.', 'Tạo phòng để mời bạn bè.')}</p>` : ''}</div>`;
  const bindFriends = () => {
    body.querySelector('#fOn').onchange = e => { settings.friendsOn = e.target.checked; saveSettings(); G.listenFriends(); };
    body.querySelector('#fAddB').onclick = () => { if (addFriend(body.querySelector('#fAdd').value)) { SFX.chime(); redraw(); } else toast(T('A friend code has 6 letters and numbers.', 'Mã bạn bè gồm 6 chữ và số.')); };
    body.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { settings.friends = settings.friends.filter(f => f.code !== b.dataset.rm); saveSettings(); redraw(); });
    body.querySelectorAll('[data-joinf]').forEach(b => b.onclick = () => { SFX.tap(); Net.join(b.dataset.joinf, sendHello() || {}); redraw(); });
    body.querySelectorAll('[data-inv]').forEach(b => b.onclick = async () => { b.disabled = true; const both = await Promise.all([Net.invite(b.dataset.inv, h ? h.profile.name : ''), Net.cloudInvite(b.dataset.inv, h ? h.profile.name : '')]); const ok = both[0] || both[1]; toast(ok ? T('Invitation sent!', 'Đã gửi lời mời!') : T('Your friend is not online right now.', 'Bạn ấy đang không trực tuyến.')); b.disabled = false; });
  };
  if (Net.connected || Net.role === 'host') {
    const list = Object.values(Net.remotes);
    body.innerHTML = `<div class="online on">
      <p class="note center">${Net.code ? T(`Room code <b class="bigcode">${Net.code}</b> · ${Net.count}/6 players`, `Mã phòng <b class="bigcode">${Net.code}</b> · ${Net.count}/6 người chơi`) : ''}</p>
      ${(n => `<p class="note center netline">📶 ${T('This device', 'Máy này')}: ${n.online ? (n.type ? esc(n.type) + ' · ' : '') + (n.eff ? esc(n.eff.toUpperCase()) + ' · ' : '') + (n.down ? n.down + ' Mbps · ' : '') : T('no internet!', 'mất mạng!') + ' · '}${n.cloud ? T(`cloud relay on (${n.brokers} server${n.brokers === 1 ? '' : 's'})`, `đang dùng mạng đám mây (${n.brokers} máy chủ)`) : T('direct link', 'kết nối trực tiếp')}${n.voice ? ' · 🎙️ ' + T('voice on', 'đang gọi') : n.cloud ? ' · ' + T('voice needs a direct link', 'gọi giọng cần kết nối trực tiếp') : ''}</p>`)(Net.netInfo())}
      <div class="plist">${list.map(r => `<div class="prow"><img src="${avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) })}" alt=""><div class="pw"><b>${esc(nm(r.name))}</b>${(q => q ? `<small class="pq">${G.barsHTML(q.bars)} ${q.rtt != null ? q.rtt + ' ms' : '…'} · ${routeName(q.route)}${q.weak ? ' · ' + T('weak', 'yếu') : ''}</small>` : '')(Net.quality(r.id))}</div>
        <button class="btn" data-walkf="${r.id}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${r.id}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-callf="${r.id}">📣 ${T('Ask to come', 'Gọi đến')}</button><button class="btn" data-tr="${r.id}">🔄 ${T('Trade', 'Đổi đồ')}</button>${Net.role === 'host' ? `<button class="btn" data-kick="${r.id}" aria-label="${T('Remove from the room', 'Mời ra khỏi phòng')}">🚪</button>` : ''}${r.friend && !settings.friends.some(f => f.code === r.friend) ? `<button class="btn" data-addf="${r.friend}" data-n="${esc(r.name)}">＋👫</button>` : ''}</div>`).join('') || `<p class="note center">${T('Waiting for friends to join… Tell them the room code!', 'Đang chờ bạn vào… Đọc mã phòng cho bạn nhé!')}</p>`}</div>
      <p class="note center">${T('Talk to each other with your voices, or use the 💬 buttons. Up to 6 players in a room.', 'Nói chuyện bằng giọng nói, hoặc dùng nút 💬. Mỗi phòng tối đa 6 người.')}</p>
      <div class="actions center"><button class="btn big" id="oMute">${Net.muted ? '🔇 ' + T('Unmute', 'Bật mic') : '🎙️ ' + T('Mute', 'Tắt mic')}</button><button class="btn big danger" id="oEnd">📵 ${T('Leave the room', 'Rời phòng')}</button></div>
      ${friendsBox()}</div>`;
    body.querySelector('#oMute').onclick = () => { G.toggleMute(); redraw(); };
    body.querySelector('#oEnd').onclick = () => { Net.close(); Object.keys(G.partners).forEach(id => Net.emit('left', { id, name: G.partners[id].name })); G.huds.forEach(hd => hd.setCall(false)); redraw(); };
    body.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { const P = G.partners[b.dataset.fly]; if (P) { $('.modal.pad')?.remove(); G.paused = false; G.flyToFriend(G.heroes[0], P.id); } });
    body.querySelectorAll('[data-walkf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.walkToFriend(G.heroes[0], b.dataset.walkf); });
    body.querySelectorAll('[data-callf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.askFriendToCome(G.heroes[0], b.dataset.callf); });
    body.querySelectorAll('[data-kick]').forEach(b => b.onclick = () => { if (confirm(T('Remove this player from the room?', 'Mời bạn này ra khỏi phòng?'))) { Net.kick(b.dataset.kick); setTimeout(redraw, 600); } });
    body.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; openTrade(G, G.heroes[0], b.dataset.tr); });
    body.querySelectorAll('[data-addf]').forEach(b => b.onclick = () => { addFriend(b.dataset.addf, b.dataset.n); SFX.chime(); toast(T('Friend added!', 'Đã thêm bạn!')); redraw(); });
    bindFriends();
    return;
  }
  let code = '';
  body.innerHTML = `<div class="online">
    <p class="note center">${T('Play together from up to 6 phones or tablets, and talk with your voices! Everyone needs the internet.', 'Chơi cùng nhau tối đa 6 máy và nói chuyện bằng giọng nói! Mọi máy đều cần có mạng.')}</p>
    <div class="two-col">
      <div class="ocard"><h3>1. ${T('Start a room', 'Tạo phòng')}</h3><button class="btn big primary" id="oHost">📞 ${T('Start', 'Bắt đầu')}</button><div class="bigcode">${Net.role === 'host' && Net.code ? Net.code : ''}</div></div>
      <div class="ocard"><h3>2. ${T('Join a room', 'Vào phòng')}</h3><div class="codebox">____</div><div class="numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(n => `<button>${n}</button>`).join('')}</div></div>
    </div><p class="note center status">${esc(netStatus)}</p>${friendsBox()}</div>`;
  const box = body.querySelector('.codebox');
  body.querySelector('#oHost').onclick = async () => { ac(); await Net.host(sendHello() || {}); redraw(); };
  body.querySelectorAll('.numpad button').forEach(b => b.onclick = () => {
    const v = b.textContent; SFX.tap();
    if (v === '⌫') code = code.slice(0, -1); else if (v === '✓') { if (code.length === 4) Net.join(code, sendHello() || {}); } else if (code.length < 4) code += v;
    box.textContent = (code + '____').slice(0, 4);
    if (code.length === 4 && v !== '✓') Net.join(code, sendHello() || {});
  });
  bindFriends();
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
// Phones (especially iPhone home-screen apps) sometimes report the wrong size after rotating or after the
// keyboard closes, leaving part of the screen empty. Check often and fix the size whenever it drifts.
addEventListener('orientationchange', () => setTimeout(resize, 300));
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(resize, 100));
addEventListener('focusout', () => setTimeout(() => { window.scrollTo(0, 0); resize(); }, 150));
setInterval(() => { const c = renderer.domElement; if (Math.abs(c.clientWidth - innerWidth) > 2 || Math.abs(c.clientHeight - innerHeight) > 2) resize(); }, 700);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function onTap(i, x, y) {
  const h = G.heroes[i]; if (!h || G.paused) return;
  if (h._dancing) { G.places.note(h); return; }
  const r = rects()[i]; ndc.set((x - r.x) / r.w * 2 - 1, -((y - r.y) / r.h) * 2 + 1);
  ray.setFromCamera(ndc, h.cam);
  // tapping a bubble, a water drop or a ripe crop walks there and does it
  const hitB = ray.intersectObjects([...(G.bubbleIcons || []), ...(G.tapTargets || [])], false).find(x => x.object.visible);
  if (hitB) { goAndDo(h, hitB.object.userData.it); return; }
  // tap a person, animal, tree or critter and it reacts (js/fun.js)
  if (G.tapReact && G.tapReact(h, ray)) return;
  const hit = ray.intersectObject(world.terrain, false)[0];
  if (hit) { h.goal = { x: hit.point.x, z: hit.point.z }; G.fx(hit.point.x, hit.point.y + .3, hit.point.z, '✨'); }
}
function goAndDo(h, it) {
  if (!it) return;
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) < (it.plot ? 7 : it.r)) { SFX.tap(); it.act(h, G); return; }
  h.goal = approach(h, it); h.goalAct = it;
}
G.goAndDo = goAndDo;
// stop just in front of an activity rather than inside it
function approach(h, it) { const dx = h.pos.x - it.x, dz = h.pos.z - it.z, d = Math.hypot(dx, dz) || 1, k = Math.max(.5, Math.min(it.r * .6, 2.5)); return { x: it.x + dx / d * k, z: it.z + dz / d * k }; }
const poll = initInput(renderer.domElement, rects, () => G.paused || !G.heroes.length, onTap);
// the mouse wheel zooms the screen under the pointer (split screen has two)
renderer.domElement.addEventListener('wheel', e => { const r = rects(), k = Math.max(0, r.findIndex(q => e.clientX >= q.x && e.clientX < q.x + q.w && e.clientY >= q.y && e.clientY < q.y + q.h)); G.zoomBy(k, e.deltaY > 0 ? 1.1 : .9, true); }, { passive: true });
// zooming out also lifts the camera up, so rooftops no longer pull it back in (it used to look as if zoom did nothing)
G.zoomBy = (i, f, quiet) => {
  const h = G.heroes[i]; if (!h) return;
  const z = clamp((h.zoom || 1) * f, .35, 2.2);
  if (Math.abs(z - (h.zoom || 1)) < .001) { if (!quiet) { SFX.no && SFX.no(); G.huds[i] && G.huds[i].toast(f < 1 ? T('That is as close as it goes!', 'Gần nhất rồi!') : T('That is as far as it goes!', 'Xa nhất rồi!')); } return; }
  h.zoom = z; h.manualCamT = 0; if (!quiet) SFX.tap();
};

// ---------- starting a session ----------
function startSession(mode, chosen) {
  G.mode = mode; G.heroes.forEach(h => scene.remove(h.av.root)); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  chosen.forEach((p, i) => {
    const h = new Hero(i, p, scene, world);
    const start = p.pos && Number.isFinite(p.pos.x) ? p.pos : { x: -3 + i * 2.5, z: -4 };
    h.place(start.x, start.z); h.camYaw = Math.PI * .85;
    G.heroes.push(h); G.huds.push(new Hud(i, h, G)); G.regionOf[i] = null;
  });
  // shrine & tower colours follow the first player
  const p0 = chosen[0];
  SHRINES.forEach(s => world.setShrineDone(s.id, !!p0.shrines[s.id]));
  TOWERS.forEach(t => world.setTowerDone(t.id, !!p0.towers[t.id]));
  LEAFIES.forEach(l => { const o = world.leafyMeshes[l.id]; if (o) o.visible = !chosen.every(p => p.leafies[l.id]); });
  setupWanderers(chosen);
  G.pets.sync(); G.pets.refreshInteractables(); G.kites.sync();
  G.festivals.greet(G.heroes[0]);
  resize(); G.paused = false; playing = true; G.listenFriends();
  $('#huds').hidden = false;
  const p = chosen[0];
  const greet = () => { if (!p.quests.owl) say(`Hello ${p.name}! Walk over to the owl and say hi.`, `Chào ${p.name}! Đi đến chỗ chú cú và chào ông nhé.`); else say(`Welcome back, ${p.name}!`, `Chào mừng ${p.name} quay lại!`); };
  if (!(p.story && p.story.prologue)) {
    G.paused = true;
    showStory(PROLOGUE, chosen.map(x => x.name).join(T(' and ', ' và '))).then(() => { chosen.forEach(x => { x.story = x.story || {}; x.story.prologue = true; }); save(); G.paused = false; greet(); });
  } else greet();
  if (mode === 'online') { G.paused = true; openPad(G, 0, 'friend'); }
}

// ---------- the loop ----------
let playing = false, last = performance.now(), t = 0, sendT = 0, saveT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
  // the 3D world rests while a full-screen game or the storybook is open (saves battery)
  if (gameOpen() || document.querySelector('.storybook') || (G.paused && document.querySelector('.modal'))) return;
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
      if (!h.profile.quests.owl && !G._owlAuto && dist2(h.pos.x, h.pos.z, owl.x, owl.z) < 6) { G._owlAuto = true; owlTalk(h); }
      if (h.goalAct && !h.goal) { const it = h.goalAct; h.goalAct = null; if (dist2(h.pos.x, h.pos.z, it.x, it.z) < it.r + .8) { SFX.tap(); it.act(h, G); } }
      const it = h.carry ? h.carryIt || null : nearest(h);
      if (it && it.auto) it.act(h, G);
      G.huds[i].setAction(it && !it.auto ? it : null);
      h._dancing = G.places.onStage(h);
      if (pads[i].act() && it) { SFX.tap(); it.act(h, G); }
      // discover shrines and towers you walk near
      for (const s of SHRINES.concat(TOWERS)) if (!h.profile.discovered[s.id] && dist2(s.x, s.z, h.pos.x, h.pos.z) < 45) { h.profile.discovered[s.id] = true; save(); }
      const rg = regionAt(h.pos.x, h.pos.z);
      if (rg !== G.regionOf[i]) {
        if (i === 0) setTimeout(() => G.shareStatus(), 50);
        if (G.regionOf[i] !== null) { G.huds[i].showRegion(REGION_NAMES[rg]()); }
        G.regionOf[i] = rg;
        const vis = h.profile.visited = h.profile.visited || {}; if (!vis[rg]) { vis[rg] = true; save(); }
        if (rg === 'village' && !h.profile.quests.village) { h.profile.quests.village = true; save(); say('Welcome to Lotus Village! Xin chào!', 'Chào mừng đến Làng Sen!'); checkQuests(h); }
      }
    });
  } else {
    pads.forEach(p => { p.act(); p.jump(); p.menu(); });
    if (G.closeUp != null && G.heroes[G.closeUp]) { const h = G.heroes[G.closeUp]; h.state = 'idle'; h.finish(dt, t, G, 0); }
  }
  walkedAway();
  // music follows the first player
  const h0 = G.heroes[0];
  if (h0 && !gameOpen()) {
    const rg = G.regionOf[0], nearPond = G.farm && dist2(h0.pos.x, h0.pos.z, G.farm.pondPos.x, G.farm.pondPos.z) < 12;
    Music.play(G.places.dancing ? G.places.song() : h0.gliding ? 'glide' : nearPond ? 'pond' : rg === 'home' ? 'farm' : world.isNight() ? 'night'
      : rg === 'village' ? (Math.floor(t / 90) % 2 ? 'village2' : 'village') : SHRINES.some(s => dist2(s.x, s.z, h0.pos.x, h0.pos.z) < 8) ? 'shrine' : 'field');
  }
  $('#songBtn').hidden = !G.places.dancing || G.paused;
  if (!G.paused) world.updateSky(dt, h0.pos, h0.pos);
  if (G.lookUpT > 0) G.lookUpT -= dt;
  // friends online
  for (const P of Object.values(G.partners)) {
    const r = Net.remotes[P.id]; if (!r || !r.s) continue; const s = r.s;
    P.pos.lerp(_np.set(s.x, s.y, s.z), Math.min(1, dt * 10)); P.yaw = s.yaw;
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
    G.showcaseCam(i, h, dt); // a landmark fly-around takes over the camera
    world.updateSky(0, h.cam.position, h.pos);
    renderer.render(scene, h.cam);
    const markers = [];
    const p = h.profile;
    SHRINES.forEach(s => markers.push({ x: s.x, z: s.z, icon: p.shrines[s.id] ? '🔷' : '🔶', size: 16 }));
    TOWERS.forEach(tw => markers.push({ x: tw.x, z: tw.z, icon: '🗼', size: 18 }));
    G.PLACES.forEach(pl => markers.push({ x: pl.x, z: pl.z, icon: pl.icon, size: 18 }));
    NPCS.forEach(n => markers.push({ x: n.x, z: n.z, icon: '•', size: 14 }));
    G.ferries.ferries.forEach(F => markers.push({ x: F.model.position.x, z: F.model.position.z, icon: '⛴️', size: 16 }));
    G.heroes.forEach((o, j) => { if (j !== i) markers.push({ x: o.pos.x, z: o.pos.z, icon: '🧒', size: 18 }); });
    Object.values(G.partners).forEach(P => { if (P.pos.y > -40) markers.push({ x: P.pos.x, z: P.pos.z, icon: '🧒', size: 18, friend: P.name || '?' }); });
    const qt = questTarget(h); if (qt) markers.push({ x: qt.x, z: qt.z, pin: true });
    G.huds[i].update(dt, h.cam, G.fogMapFor(p), markers);
  });
}

// ---------- boot ----------
loadClips();
createChatter(G);
setupNPCs(); setupInteractables();
G.farm = createFarm(G); world.updaters.push(G.farm.update);
G.places = createPlaces(G); world.updaters.push(G.places.update);
G.town = createTown(G);
G.GAMES_ICON = id => (GAMES[id] || {}).icon || "🎮";
createRegions(G);
G.dialog = (name, lines, choices) => dialog(name, lines, choices);
// little ones (under 5) get big picture buttons in conversations
dialogHooks.little = () => G.heroes.some(h => h.profile.age !== 'big');
// where everyone stood when a conversation opened; walking about 9 m away closes it (checked in the loop)
dialogHooks.where = () => G.heroes.map(h => ({ x: h.pos.x, z: h.pos.z }));
const walkedAway = () => {
  const d = document.querySelector('.dialog:not(.out)'); if (!d || !d._from || !d._autoClose || G.travelling) return;
  if (d._from.length && G.heroes.every((h, k) => !d._from[k] || dist2(h.pos.x, h.pos.z, d._from[k].x, d._from[k].z) > 9)) { d._autoClose(); SFX.tap(); }
};
onLang(() => G.huds.forEach(hd => hd.refreshWho && hd.refreshWho()));
createAsia(G);
createRoads(G);
createCities(G);
createHeritage(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
G.reward = reward;
G.pets = createPets(G);
G.ferries = createFerries(G);
G.kites = createKites(G);
createPassport(G);
G.festivals = createFestivals(G);
G.weather = createWeather(G);
createFun(G);
createLearning(G);
createShowcase(G);
createGathering(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
setupTrading(G);
// "My market stall" at the Three Regions Market: trade with friends who are playing online
{
  const sx = MARKET.x0 + 4, sz = MARKET.roadZ - 4.5, y = heightAt(sx, sz), parts = [];
  parts.push(P(new THREE.BoxGeometry(2.6, .9, 1.2), '#c98a4a', [0, .45, 0]), P(new THREE.BoxGeometry(2.8, .1, 1.4), '#f6e7c8', [0, .95, 0]));
  [[-1.25, -.55], [1.25, -.55], [-1.25, .55], [1.25, .55]].forEach(([x, z]) => parts.push(P(new THREE.CylinderGeometry(.06, .06, 2.3, 6), '#8a5a3b', [x, 1.15, z])));
  for (let i = 0; i < 6; i++) parts.push(P(new THREE.BoxGeometry(.5, .08, 1.7), i % 2 ? '#ffffff' : '#2fb04f', [-1.25 + i * .5, 2.35, 0], [.12, 0, 0]));
  [['#ff4f9a', -.8], ['#ffd23f', -.2], ['#3cc7e8', .4], ['#5fd36a', .9]].forEach(([c, x]) => parts.push(P(new THREE.SphereGeometry(.16, 10, 8), c, [x, 1.12, .15])));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(sx, y, sz); m.castShadow = true; scene.add(m); world.colliders.push({ x: sx, z: sz, r: 1.4 });
  G.interactables.push({ id: 'stall', x: sx, z: sz + 1.2, r: 3, icon: '🏪', label: () => T('My market stall: trade with friends', 'Sạp hàng của con: đổi đồ với bạn'), act: h => G.openTrade(h.i) });
}
// solid things the camera must never go inside: big, opaque, still-standing meshes (collected once, refreshed
// now and then so new houses, landmarks and boats are included)
{
  let list = [];
  const collect = () => {
    list = []; const sphere = new THREE.Sphere();
    scene.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.outline || o.userData.noCam || o === world.terrain || !o.visible) return;
      const mt = o.material; if (!mt || Array.isArray(mt) || mt.transparent || mt.side === THREE.BackSide || mt.isMeshBasicMaterial) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (sphere.radius < 3 || sphere.radius > 120) return; // trees, lamps and stalls are too small to matter
      if (G.heroes.some(h => h.av.root.getObjectById(o.id))) return;
      list.push(o);
    });
    mats = [...new Set(list.map(o => o.material))];
  };
  let at = -1e9;
  let mats = [];
  G.camBlockerMats = () => mats;
  G.camBlockers = () => { const now = performance.now(); if (now - at > 8000) { at = now; collect(); } return list; };
}
G.openTrade = (i, id) => { if (G.paused) return; openTrade(G, G.heroes[i], id); };
G.secrets = createSecrets(G);
ensureJobs();
setupBubbles(); setupAreaSigns(); setupGuides();
$('#songBtn').onclick = () => G.places.nextSong();
resize();
$('#boot').remove();
requestAnimationFrame(frame);
showTitle(() => showWho((mode, chosen) => startSession(mode, chosen)));
import('./state.js').then(S => { if (S.restoredFromCopy) setTimeout(() => toast(T('Your progress was brought back from the safe copy on this device.', 'Tiến trình chơi đã được khôi phục từ bản lưu dự phòng trên máy.')), 1200); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); hush(); } });
addEventListener('pagehide', () => saveProfiles(true));
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) navigator.serviceWorker.register('sw.js').catch(() => { });

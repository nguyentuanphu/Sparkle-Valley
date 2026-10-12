// One HUD per player screen: hearts, money, orbs, a minimap, the current objective, the
// stamina wheel next to the hero, and big touch buttons.
import { THREE } from './gfx.js';
import { T } from './i18n.js';
import { nm } from './i18n.js';
import { ICONS } from './icons.js';
import { farm, saveProfiles } from './state.js';
import { fmt } from './money.js';
import { el, esc, clamp } from './util.js';
import { SIZE, HALF } from './world.js';
import { avatarURL } from './avatar.js';
import { pic, hasArt as hasPic } from './art.js';
import { SFX } from './audio.js';

export const EMOTES = [
  { id: 'hi', icon: '👋', en: 'Hi!', vi: 'Xin chào!' },
  { id: 'come', icon: '🫴', en: 'Come here!', vi: 'Lại đây nè!' },
  { id: 'look', icon: '👀', en: 'Look at this!', vi: 'Nhìn này!' },
  { id: 'go', icon: '🏃', en: "Let's go!", vi: 'Đi thôi!' },
  { id: 'help', icon: '🆘', en: 'Help me please!', vi: 'Giúp tớ với!' },
  { id: 'yay', icon: '🎉', en: 'Yay! We did it!', vi: 'Hoan hô! Mình làm được rồi!' },
  { id: 'love', icon: '💖', en: 'You are my best friend!', vi: 'Bạn là bạn thân nhất của tớ!' },
  { id: 'wait', icon: '✋', en: 'Wait for me!', vi: 'Đợi tớ với!' }
];

export class Hud {
  constructor(i, hero, game) {
    this.i = i; this.hero = hero; this.game = game;
    const root = this.root = el('div', 'hud');
    root.innerHTML = `
      <div class="hud-tl">
        <div class="pcard" role="button" aria-label="${T('Settings', 'Cài đặt')}"><img class="pav" alt=""><i class="pgear">${ICONS.gear}</i><div class="pinfo"><b class="pname"></b><div class="hearts"></div></div></div>
        <div class="chips"><button class="chip c-money" data-chip="money" title="${T('Coins', 'Đồng xu')}"></button><button class="chip c-orbs" data-chip="orbs" title="${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}"></button><button class="chip c-leafy" data-chip="leafy" title="${T('Leafies', 'Bạn Lá')}"></button></div>
        <button class="simplesw" aria-label="${T('Big pictures screen', 'Màn hình hình to')}"><span>${ICONS.bigTiles}</span><b>${T('Big pictures', 'Hình to')}</b></button>
      </div>
      <div class="quest">
        <button class="q-say" aria-label="${T('Hear the goal again', 'Nghe lại nhiệm vụ')}"><span class="q-icon">📍</span><span class="q-text"></span></button>
        <button class="q-go">▶ ${T('Go', 'Đi')}<kbd class="kb">F</kbd></button>
        <button class="q-fam" hidden></button>
      </div>
      <div class="hud-tr">
        <div class="mini-wrap"><canvas class="mini" width="200" height="200"></canvas><i class="mini-n">N</i><i class="mini-me"></i></div>
        <div class="zoom"><span class="clock"></span></div>
        <button class="friendchip" hidden><span class="fc-arrow">➤</span><span class="fc-txt"></span><span class="fc-sig"></span></button>
        <div class="tools"></div>
      </div>
      <div class="zoomer"><button class="z-in" aria-label="${T('Zoom in', 'Phóng to')}">${ICONS.zoomIn}<kbd class="kb">+</kbd></button><button class="z-out" aria-label="${T('Zoom out', 'Thu nhỏ')}">${ICONS.zoomOut}<kbd class="kb">−</kbd></button><button class="z-view" aria-label="${T('Camera view', 'Góc nhìn')}">${pic('🎥')}<kbd class="kb">V</kbd></button><button class="z-where" aria-label="${T('Where is…? Show me the way', 'Ở đâu? Chỉ đường cho con')}" title="${T('Where is…?', 'Ở đâu?')}">${pic('🧭')}<kbd class="kb">Y</kbd></button></div>
      <div class="region"></div>
      <div class="htoast"></div>
      <canvas class="wheel" width="96" height="96"></canvas>
      <div class="dock">
        <button class="dk games" aria-label="${T('Play: games, festivals, stories and songs', 'Vui chơi: trò chơi, lễ hội, truyện và bài hát')}"><span>${ICONS.games}</span><small>${T('Play', 'Vui chơi')}</small><kbd class="kb">G</kbd></button>
        <button class="dk map"><span>${ICONS.map}</span><small>${T('Map', 'Bản đồ')}</small><kbd class="kb">M</kbd></button>
        <button class="dk bag"><span>${ICONS.bag}</span><small>${T('Bag', 'Ba lô')}</small><kbd class="kb">B</kbd></button>
        <button class="dk shop" hidden aria-label="${T('Clothes shop', 'Cửa hàng quần áo')}"><span>${ICONS.shop}</span><small>${T('Shop', 'Cửa hàng')}</small></button>
        <button class="dk voicecmd" hidden><span>${ICONS.ask}</span><small>${T('Ask', 'Hỏi')}</small><kbd class="kb">K</kbd></button>
        <button class="dk chat"><span>${ICONS.talk}</span><small>${T('Talk', 'Nói')}</small><kbd class="kb">T</kbd></button>
        <button class="dk call" hidden><span>${ICONS.callOff}</span><small>${T('Mic off', 'Micrô tắt')}</small><kbd class="kb">C</kbd></button>
        <button class="dk mus"><span>${ICONS.music}</span><small>${T('Music', 'Nhạc')}</small><kbd class="kb">N</kbd></button>
        <button class="dk snd"><span>${ICONS.sound}</span><small>${T('Sound', 'Tiếng')}</small><kbd class="kb">O</kbd></button>
      </div>
      <button class="act" hidden><span class="ai"></span><span class="al"></span><kbd class="kb">E</kbd></button>
      <div class="hud-br">
        <div class="moves"><button class="mv run">${ICONS.run}<small>${T('Run', 'Chạy')}</small><kbd class="kb">Shift</kbd></button><button class="mv jump">${ICONS.jump}<small>${T('Jump', 'Nhảy')}</small><kbd class="kb">Space</kbd></button></div>
      </div>
      <div class="emotes" hidden></div>
      <button class="bigprompt" hidden></button>`;
    document.getElementById('huds').appendChild(root);
    this.q = s => root.querySelector(s);
    this.mini = this.q('.mini').getContext('2d');
    this.wheel = this.q('.wheel'); this.wctx = this.wheel.getContext('2d');
    const pad = game.pads[i];
    const hold = (b, k) => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); pad[k] = true; if (k === '_btnJump') pad._jump = true; b.classList.add('down'); });
      const up = () => { pad[k] = false; b.classList.remove('down'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    };
    hold(this.q('.mv.run'), '_btnRun'); hold(this.q('.mv.jump'), '_btnJump');
    this.q('.act').addEventListener('pointerdown', e => { e.preventDefault(); pad._act = true; });
    this.q('.dk.games').onclick = () => game.openGamesHub(i);
    // the Simple screen (js/simple.js): one player on this device only. Round O (owner): a clear "Big pictures" switch
    // up by the player's card, away from the play buttons (it used to be a teddy in the dock)
    this.q('.simplesw').hidden = game.mode === 'split' || i > 0;
    this.q('.simplesw').onclick = () => { SFX.tap(); game.simple && game.simple.show(); };
    this.q('.pcard').onclick = () => game.openQuick(i);
    this.q('.dk.map').onclick = () => game.openPad(i, 'map');
    this.q('.dk.bag').onclick = () => game.openPad(i, 'bag');
    // (tester's notes, 12 Oct; owner: "bottom bar") the clothes shop has its own button beside the Bag (it was inside
    // the Bag, Bug #29); only while the shop is switched on and one child plays on this device. It opens right here.
    this.q('.dk.shop').onclick = () => { SFX.tap(); game.shop && game.shop.openShop(i); };
    this.q('.dk.chat').onclick = () => this.toggleEmotes();
    this.q('.dk.voicecmd').hidden = !game.voiceControlOn();
    this.q('.dk.voicecmd').onclick = () => game.voiceCommand(i);
    this.q('.dk.call').onclick = () => game.toggleMute();
    this.q('.dk.mus').onclick = () => { if (this._musHeld) { this._musHeld = false; return; } game.toggleAudio('music'); };
    // press and hold Music: the Songs page (round O)
    { const b = this.q('.dk.mus'); let t = 0; b.addEventListener('pointerdown', () => { clearTimeout(t); t = setTimeout(() => { this._musHeld = true; game.openSongs && game.openSongs(); }, 650); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => clearTimeout(t)); }
    this.q('.z-where').onclick = () => game.openWhere && game.openWhere(i);   // (Round U) "Where is…?" sparkles
    this.q('.dk.snd').onclick = () => game.openSound();   // (Round U) the three Sound switches: music, sounds, voice
    this.q('.friendchip').onclick = () => { const r = game.findFriend(i); if (r) game.say && game.say(r[0], r[1]); };
    // (Round V, owner 13 Oct) a tap on the quest folds it to a small chip and hides its arrow and sparkles; a tap on the chip
    // opens it again and says the goal (remembered per child)
    this.q('.q-say').onclick = () => { const p = this.hero.profile; p.questFold = !p.questFold; saveProfiles(); this.foldQuest(); if (!p.questFold) game.sayObjective(i); };
    this.q('.q-go').onclick = () => game.goToObjective(i);
    this.q('.q-fam').onclick = () => game.openPad(i, 'log');   // (Round V) the family mission: its page in Adventures
    // pointerdown (not click) so zoom still works while another finger is on the joystick
    const zb = (b, f) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); game.zoomBy(i, f); });
    zb(this.q('.z-in'), .8); zb(this.q('.z-out'), 1.25);
    this.q('.z-view').addEventListener('pointerdown', e => { e.preventDefault(); game.cycleView(i); });
    this.refreshAudio();
    const em = this.q('.emotes');
    EMOTES.forEach(e => { const b = el('button', 'em', `<span>${e.icon}</span><small>${esc(T(e.en, e.vi))}</small>`); b.onclick = () => { this.toggleEmotes(false); game.emote(i, e.id); }; em.appendChild(b); });
    this.regionT = 0; this.toastT = 0; this.last = {};
    this.refreshWho();
  }
  refreshAudio() {
    const s = this.game.settings, m = this.q('.dk.mus'), d = this.q('.dk.snd');
    m.classList.toggle('off', !s.music); d.classList.toggle('off', !(s.sound || s.voice)); d.querySelector('span').innerHTML = s.sound || s.voice ? ICONS.sound : ICONS.soundOff;
  }
  foldQuest() { const f = !!this.hero.profile.questFold, q = this.q('.quest'); q.classList.toggle('fold', f); this.q('.q-say').setAttribute('aria-label', f ? T('Show the goal', 'Hiện nhiệm vụ') : T('Hide the goal', 'Ẩn nhiệm vụ')); }
  refreshWho() { const p = this.hero.profile; this.q('.pav').src = avatarURL(p); this.q('.pname').textContent = nm(p.name); this.q('.pname').classList.toggle('starname', !!(p.look && p.look.star)); } // (owner, 12 Oct: this week's star tester gets a gold star by the name)
  toggleEmotes(v) { const e = this.q('.emotes'); e.hidden = v == null ? !e.hidden : !v; }
  layout(r, two) {
    Object.assign(this.root.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', transform: r.rot ? `rotate(${r.rot}deg)` : '' });
    this.root.classList.toggle('far', r.rot === 180);   // (two players face to face: this half is turned to the far end)
    const small = two || r.w < 560 || r.h < 420; this.root.classList.toggle('small', small); this.rect = r;
    // on phones the dock has room for four buttons only, so Talk, Music and Sound move to a small row under the clock
    const tools = this.q('.tools'), dock = this.q('.dock');
    for (const k of ['chat', 'mus', 'snd']) { const b = this.q('.dk.' + k); if (small && b.parentNode !== tools) tools.appendChild(b); if (!small && b.parentNode !== dock) dock.appendChild(b); }
    if (!small) dock.insertBefore(this.q('.dk.call'), this.q('.dk.mus'));
  }
  showRegion(name) { const e = this.q('.region'); e.textContent = name; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
  toast(msg) { const e = this.q('.htoast'); e.textContent = msg; e.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove('show'), 3200); }
  setAction(it) {
    const b = this.q('.act');
    if (!it) { b.hidden = true; this.last.act = null; return; }
    const lab = it.label();
    if (this.last.act !== lab) { b.hidden = false; this.q('.act .ai').innerHTML = hasPic(it.icon) ? pic(it.icon) : esc(it.icon || '✋'); this.q('.act .al').textContent = lab; b.classList.toggle('long', lab.length > 18); b.classList.toggle('vlong', lab.length > 34); this.last.act = lab; }
  }
  // a big pulsing button in the middle of the screen (pet rescue, ferry). bigPrompt(null) hides it.
  bigPrompt(html, onTap) {
    const b = this.q('.bigprompt'); b.hidden = !html; if (!html) return;
    b.innerHTML = html; b.classList.toggle('wait', !onTap);
    b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); if (onTap) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); onTap(); } };
  }
  setCall(on, talking, muted) { const b = this.q('.dk.call'); b.hidden = !on; b.querySelector('span').innerHTML = muted ? ICONS.callOff : ICONS.call; b.querySelector('small').textContent = muted ? T('Mic off', 'Micrô tắt') : T('Mic on', 'Micrô bật'); b.classList.toggle('talking', !!talking); b.classList.toggle('mute', !!muted); }   // (r63: it says whether the microphone is on)

  update(dt, camera, fogMap, markers) {
    const h = this.hero, p = h.profile;
    const shopOn = !!(this.game.shop && this.game.shop.on() && this.game.heroes.length < 2);
    if (this.last.shop !== shopOn) { this.last.shop = shopOn; this.q('.dk.shop').hidden = !shopOn; }
    // hearts
    const hk = h.hearts + '/' + p.hearts;
    if (this.last.h !== hk) {
      let s = ''; for (let i = 0; i < p.hearts; i++) { const f = clamp(h.hearts - i, 0, 1); s += `<i class="heart" style="--f:${f}"></i>`; }
      this.q('.hearts').innerHTML = s; this.last.h = hk;
    }
    const mk = fmt(farm.coins) + '|' + p.orbs + '|' + Object.keys(p.leafies).length;
    if (this.last.m !== mk) {
      this.q('.chip.c-money').innerHTML = '<i>🪙</i>' + fmt(farm.coins); this.q('.chip.c-orbs').innerHTML = '<i>🔮</i>' + p.orbs; this.q('.chip.c-leafy').innerHTML = '<i>🍃</i>' + Object.keys(p.leafies).length;
      if (this.last.m) this.q('.chips').classList.add('bump'), setTimeout(() => this.q('.chips').classList.remove('bump'), 400);
      this.last.m = mk;
    }
    // objective + clock
    const obj = this.game.objective(h), qi = this.game.objectiveIcon(h);
    if (this.last.o !== obj) { this.q('.q-text').textContent = obj || ''; this.q('.q-icon').textContent = qi || '📍'; this.q('.quest').hidden = !obj; this.last.o = obj; this.q('.quest').classList.remove('new'); void this.q('.quest').offsetWidth; this.q('.quest').classList.add('new'); this.foldQuest(); }
    this.q('.q-go').hidden = !this.game.questTarget(h);
    // (Round V, owner 13 Oct) a family mission that has started (told to the child, not done yet) shows under the quest too
    const P = this.game.parents, fm = P && P.openFor ? P.openFor(p).find(m => (p.missionsSeen || []).includes(m.id)) : null, fk = fm ? fm.id + ':' + T('e', 'v') : '';
    if (this.last.fm !== fk) { this.last.fm = fk; const b = this.q('.q-fam'); b.hidden = !fm; if (fm) { b.innerHTML = `${pic(fm.icon || '📝')}<span><b>${esc(T('Family mission', 'Nhiệm vụ gia đình'))}</b> ${esc(T(fm.en, fm.vi))}</span>`; b.setAttribute('aria-label', T('Family mission: ', 'Nhiệm vụ gia đình: ') + T(fm.en, fm.vi)); } }
    const night = this.game.world.isNight(), tt = this.game.world.time, hr = Math.floor(tt * 24), mn = Math.floor((tt * 24 - hr) * 60 / 10) * 10;
    const ck = (night ? '🌙 ' : '☀️ ') + String(hr).padStart(2, '0') + ':' + String(mn).padStart(2, '0');
    if (this.last.c !== ck) { this.q('.clock').textContent = ck; this.last.c = ck; }
    this.updateFriend(camera);
    // the minimap is redrawn about 15 times a second, not every frame (canvas text is slow on phones)
    this._miniT = (this._miniT || 0) - dt;
    if (this._miniT <= 0) { this._miniT = .066; this.drawMini(typeof fogMap === 'function' ? fogMap() : fogMap, typeof markers === 'function' ? markers() : markers); }
    this.drawWheel(camera);
  }

  drawMini(fogMap, markers) {
    const x = this.mini, S = 200, h = this.hero, view = 110; // metres across radius
    const k = fogMap.width / SIZE, sx = (h.pos.x + HALF) * k, sz = (h.pos.z + HALF) * k, r = view * k;
    x.clearRect(0, 0, S, S); x.save(); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#cfe9f5'; x.fillRect(0, 0, S, S);
    x.drawImage(fogMap, sx - r, sz - r, r * 2, r * 2, 0, 0, S, S);
    const toMini = (wx, wz) => [S / 2 + (wx - h.pos.x) / view * S / 2, S / 2 + (wz - h.pos.z) / view * S / 2];
    for (const m of markers) {
      const [mx, my] = toMini(m.x, m.z); const off = Math.hypot(mx - S / 2, my - S / 2) > S / 2 - 10;
      if (off && !m.pin && !m.friend) continue;
      let px = mx, py = my;
      if (off) { const a = Math.atan2(my - S / 2, mx - S / 2); px = S / 2 + Math.cos(a) * (S / 2 - 12); py = S / 2 + Math.sin(a) * (S / 2 - 12); }
      if (m.friend) { // a friend online: a blue dot with their first letter, kept on the edge when far away
        x.fillStyle = '#2fa8ff'; x.beginPath(); x.arc(px, py, 11, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke();
        x.fillStyle = '#fff'; x.font = 'bold 13px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(m.friend).charAt(0).toUpperCase(), px, py + 1); continue;
      }
      if (m.pin) { const pulse = 9 + Math.sin(performance.now() / 180) * 2; x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(px, py, pulse, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', px, py + 1); continue; }
      x.font = (m.size || 20) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(m.icon, px, py);
    }
    x.restore();
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); x.stroke();
    this.q('.mini-me').style.transform = `translate(-50%,-50%) rotate(${-h.yaw + Math.PI}rad)`;
  }

  // the nearest online friend: name, distance and an arrow pointing their way (relative to the camera)
  updateFriend(camera) {
    const b = this.q('.friendchip'), h = this.hero;
    const list = Object.values(this.game.partners || {}).filter(P => P.pos.y > -40);
    if (!list.length) { if (!b.hidden) b.hidden = true; return; }
    const P = list.sort((a, c) => Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) - Math.hypot(c.pos.x - h.pos.x, c.pos.z - h.pos.z))[0];
    const d = Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z), near = d < 6;
    b.hidden = false; b.classList.toggle('near', near);
    const pn = nm(P.name), txt = near ? T(`${pn} is here!`, `${pn} ở đây!`) : `${pn} · ${Math.round(d)} m`;
    if (this.last.f !== txt) { this.q('.fc-txt').textContent = txt; this.last.f = txt; }
    const q = this.game.netQuality && this.game.netQuality(P.id), sk = q ? q.bars + (q.route || '') : '';
    if (this.last.sig !== sk) { this.q('.fc-sig').innerHTML = q ? this.game.barsHTML(q.bars) + (q.route === 'cloud' ? '☁️' : '') : ''; this.last.sig = sk; }
    const camA = Math.atan2(camera.position.x - h.pos.x, camera.position.z - h.pos.z) + Math.PI; // the way the camera looks
    const a = Math.atan2(P.pos.x - h.pos.x, P.pos.z - h.pos.z) - camA;
    this.q('.fc-arrow').style.transform = `rotate(${-a - Math.PI / 2}rad)`;
  }
  drawWheel(camera) {
    const h = this.hero, c = this.wctx, max = h.staminaMax, full = h.stamina >= max - .001 && !h.exhausted;
    this.wheelA = clamp((this.wheelA || 0) + (full ? -.05 : .2), 0, 1);
    this.wheel.style.opacity = this.wheelA;
    if (this.wheelA <= 0 || !this.rect) return;
    const v = new THREE.Vector3(h.pos.x, h.pos.y + 1.6, h.pos.z).project(camera);
    const px = (v.x * .5 + .5) * this.rect.w, py = (-v.y * .5 + .5) * this.rect.h;
    this.wheel.style.transform = `translate(${px + 40}px, ${py - 60}px)`;
    c.clearRect(0, 0, 96, 96); c.lineCap = 'round';
    const base = h.profile.staminaMax;
    for (let w = 0; w < Math.ceil(max); w++) {
      const R = 36 - w * 9, cap = Math.min(1, max - w), val = clamp(h.stamina - w, 0, cap); if (R <= 4) break;
      c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(48, 48, R, -Math.PI / 2, -Math.PI / 2 + cap * Math.PI * 2); c.stroke();
      c.strokeStyle = h.exhausted ? '#ff5a4a' : w >= base ? '#ffd23f' : '#7ee35a';
      c.beginPath(); c.arc(48, 48, R, -Math.PI / 2, -Math.PI / 2 + val * Math.PI * 2); c.stroke();
    }
  }
  destroy() { this.root.remove(); }
}

// The explorer's map. The whole valley is always shown (much easier for children to find things);
// places are labelled with big pictures.
export function fogMapFor(profile, baseMap) {
  const c = document.createElement('canvas'); c.width = c.height = baseMap.width; const x = c.getContext('2d');
  x.drawImage(baseMap, 0, 0);
  return c;
}

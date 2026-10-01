// One HUD per player screen: hearts, money, orbs, a minimap, the current objective, the
// stamina wheel next to the hero, and big touch buttons.
import { THREE } from './gfx.js';
import { T } from './i18n.js';
import { farm } from './state.js';
import { fmt } from './money.js';
import { el, esc, clamp } from './util.js';
import { SIZE, HALF } from './world.js';
import { avatarURL } from './avatar.js';

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
        <div class="pcard" role="button" aria-label="${T('Settings', 'Cài đặt')}"><img class="pav" alt=""><i class="pgear">⚙️</i><div class="pinfo"><b class="pname"></b><div class="hearts"></div></div></div>
        <div class="chips"><span class="chip c-money"></span><span class="chip c-orbs"></span><span class="chip c-leafy"></span></div>
      </div>
      <div class="quest">
        <button class="q-say" aria-label="${T('Hear the goal again', 'Nghe lại nhiệm vụ')}"><span class="q-icon">📍</span><span class="q-text"></span></button>
        <button class="q-go">▶ ${T('Go', 'Đi')}</button>
      </div>
      <div class="hud-tr">
        <div class="mini-wrap"><canvas class="mini" width="200" height="200"></canvas><i class="mini-n">N</i><i class="mini-me"></i></div>
        <div class="zoom"><button class="z-in" aria-label="${T('Zoom in', 'Phóng to')}">＋</button><span class="clock"></span><button class="z-out" aria-label="${T('Zoom out', 'Thu nhỏ')}">－</button></div>
      </div>
      <div class="region"></div>
      <div class="htoast"></div>
      <canvas class="wheel" width="96" height="96"></canvas>
      <div class="dock">
        <button class="dk games"><span>🎮</span><small>${T('Games', 'Trò chơi')}</small></button>
        <button class="dk map"><span>🗺️</span><small>${T('Map', 'Bản đồ')}</small></button>
        <button class="dk bag"><span>🎒</span><small>${T('Bag', 'Ba lô')}</small></button>
        <button class="dk voicecmd" hidden><span>🎤</span><small>${T('Ask', 'Hỏi')}</small></button>
        <button class="dk chat"><span>💬</span><small>${T('Talk', 'Nói')}</small></button>
        <button class="dk call" hidden><span>🎙️</span><small>${T('Call', 'Gọi')}</small></button>
        <button class="dk mus"><span>🎵</span><small>${T('Music', 'Nhạc')}</small></button>
        <button class="dk snd"><span>🔊</span><small>${T('Sound', 'Tiếng')}</small></button>
      </div>
      <div class="hud-br">
        <button class="act" hidden><span class="ai"></span><span class="al"></span></button>
        <div class="moves"><button class="mv run">👟<small>${T('Run', 'Chạy')}</small></button><button class="mv jump">⤴<small>${T('Jump', 'Nhảy')}</small></button></div>
      </div>
      <div class="emotes" hidden></div>`;
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
    this.q('.pcard').onclick = () => game.openQuick(i);
    this.q('.dk.map').onclick = () => game.openPad(i, 'map');
    this.q('.dk.bag').onclick = () => game.openPad(i, 'bag');
    this.q('.dk.chat').onclick = () => this.toggleEmotes();
    this.q('.dk.voicecmd').hidden = !game.voiceControlOn();
    this.q('.dk.voicecmd').onclick = () => game.voiceCommand(i);
    this.q('.dk.call').onclick = () => game.toggleMute();
    this.q('.dk.mus').onclick = () => game.toggleAudio('music');
    this.q('.dk.snd').onclick = () => game.toggleAudio('sound');
    this.q('.q-say').onclick = () => game.sayObjective(i);
    this.q('.q-go').onclick = () => game.goToObjective(i);
    this.q('.z-in').onclick = () => game.zoomBy(i, .8);
    this.q('.z-out').onclick = () => game.zoomBy(i, 1.25);
    this.refreshAudio();
    const em = this.q('.emotes');
    EMOTES.forEach(e => { const b = el('button', 'em', `<span>${e.icon}</span><small>${esc(T(e.en, e.vi))}</small>`); b.onclick = () => { this.toggleEmotes(false); game.emote(i, e.id); }; em.appendChild(b); });
    this.regionT = 0; this.toastT = 0; this.last = {};
    this.refreshWho();
  }
  refreshAudio() {
    const s = this.game.settings, m = this.q('.dk.mus'), d = this.q('.dk.snd');
    m.classList.toggle('off', !s.music); d.classList.toggle('off', !(s.sound || s.voice)); d.querySelector('span').textContent = s.sound || s.voice ? '🔊' : '🔇';
  }
  refreshWho() { const p = this.hero.profile; this.q('.pav').src = avatarURL(p); this.q('.pname').textContent = p.name; }
  toggleEmotes(v) { const e = this.q('.emotes'); e.hidden = v == null ? !e.hidden : !v; }
  layout(r, two) { Object.assign(this.root.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); this.root.classList.toggle('small', two || r.w < 560 || r.h < 420); this.rect = r; }
  showRegion(name) { const e = this.q('.region'); e.textContent = name; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
  toast(msg) { const e = this.q('.htoast'); e.textContent = msg; e.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove('show'), 3200); }
  setAction(it) {
    const b = this.q('.act');
    if (!it) { b.hidden = true; this.last.act = null; return; }
    const lab = it.label();
    if (this.last.act !== lab) { b.hidden = false; this.q('.act .ai').textContent = it.icon || '✋'; this.q('.act .al').textContent = lab; this.last.act = lab; }
  }
  setCall(on, talking, muted) { const b = this.q('.dk.call'); b.hidden = !on; b.querySelector('span').textContent = muted ? '🔇' : '🎙️'; b.classList.toggle('talking', !!talking); }

  update(dt, camera, fogMap, markers) {
    const h = this.hero, p = h.profile;
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
    if (this.last.o !== obj) { this.q('.q-text').textContent = obj || ''; this.q('.q-icon').textContent = qi || '📍'; this.q('.quest').hidden = !obj; this.last.o = obj; this.q('.quest').classList.remove('new'); void this.q('.quest').offsetWidth; this.q('.quest').classList.add('new'); }
    this.q('.q-go').hidden = !this.game.questTarget(h);
    const night = this.game.world.isNight(), tt = this.game.world.time, hr = Math.floor(tt * 24), mn = Math.floor((tt * 24 - hr) * 60 / 10) * 10;
    const ck = (night ? '🌙 ' : '☀️ ') + String(hr).padStart(2, '0') + ':' + String(mn).padStart(2, '0');
    if (this.last.c !== ck) { this.q('.clock').textContent = ck; this.last.c = ck; }
    this.drawMini(fogMap, markers);
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
      if (off && !m.pin) continue;
      let px = mx, py = my;
      if (off) { const a = Math.atan2(my - S / 2, mx - S / 2); px = S / 2 + Math.cos(a) * (S / 2 - 12); py = S / 2 + Math.sin(a) * (S / 2 - 12); }
      if (m.pin) { const pulse = 9 + Math.sin(performance.now() / 180) * 2; x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(px, py, pulse, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', px, py + 1); continue; }
      x.font = (m.size || 20) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(m.icon, px, py);
    }
    x.restore();
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); x.stroke();
    this.q('.mini-me').style.transform = `translate(-50%,-50%) rotate(${-h.yaw + Math.PI}rad)`;
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
      const R = 36 - w * 9, cap = Math.min(1, max - w), val = clamp(h.stamina - w, 0, cap);
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

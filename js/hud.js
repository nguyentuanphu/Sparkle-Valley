// One HUD per player screen: hearts, money, orbs, a minimap, the current objective, the
// stamina wheel next to the hero, and big touch buttons.
import { THREE } from './gfx.js';
import { T } from './i18n.js';
import { farm } from './state.js';
import { fmt } from './money.js';
import { el, esc, clamp } from './util.js';
import { SIZE, HALF, TOWERS } from './world.js';
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
        <div class="hearts"></div>
        <div class="chips"><span class="chip c-money"></span><span class="chip c-orbs"></span><span class="chip c-leafy"></span></div>
        <div class="hud-btns"><button class="hb pad" aria-label="${T('Sparkle Pad', 'Bảng Lấp Lánh')}">▦</button><button class="hb chat" aria-label="${T('Talk', 'Nói')}">💬</button><button class="hb call" hidden aria-label="${T('Voice call', 'Gọi thoại')}">🎙️</button></div>
      </div>
      <div class="hud-tr">
        <div class="mini-wrap"><canvas class="mini" width="200" height="200"></canvas><i class="mini-n">N</i><i class="mini-me"></i></div>
        <div class="clock"></div>
      </div>
      <div class="objective"></div>
      <div class="region"></div>
      <div class="htoast"></div>
      <canvas class="wheel" width="96" height="96"></canvas>
      <div class="hud-br">
        <button class="act" hidden><span class="ai"></span><span class="al"></span></button>
        <div class="moves"><button class="mv run">👟<small>${T('Run', 'Chạy')}</small></button><button class="mv jump">⤴<small>${T('Jump', 'Nhảy')}</small></button></div>
      </div>
      <div class="emotes" hidden></div>
      <div class="who-tag"><img alt=""><span></span></div>`;
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
    this.q('.hb.pad').onclick = () => game.openPad(i);
    this.q('.hb.chat').onclick = () => this.toggleEmotes();
    this.q('.hb.call').onclick = () => game.toggleMute();
    const em = this.q('.emotes');
    EMOTES.forEach(e => { const b = el('button', 'em', `<span>${e.icon}</span><small>${esc(T(e.en, e.vi))}</small>`); b.onclick = () => { this.toggleEmotes(false); game.emote(i, e.id); }; em.appendChild(b); });
    this.regionT = 0; this.toastT = 0; this.last = {};
    this.refreshWho();
  }
  refreshWho() { const p = this.hero.profile; this.q('.who-tag img').src = avatarURL(p); this.q('.who-tag span').textContent = p.name; }
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
  setCall(on, talking, muted) { const b = this.q('.hb.call'); b.hidden = !on; b.textContent = muted ? '🔇' : '🎙️'; b.classList.toggle('talking', !!talking); }

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
      this.q('.chip.c-money').textContent = '💰 ' + fmt(farm.coins); this.q('.chip.c-orbs').textContent = '🔮 ' + p.orbs; this.q('.chip.c-leafy').textContent = '🍃 ' + Object.keys(p.leafies).length;
      if (this.last.m) this.q('.chips').classList.add('bump'), setTimeout(() => this.q('.chips').classList.remove('bump'), 400);
      this.last.m = mk;
    }
    // objective + clock
    const obj = this.game.objective(h);
    if (this.last.o !== obj) { this.q('.objective').innerHTML = obj ? `<span>📍</span>${esc(obj)}` : ''; this.q('.objective').hidden = !obj; this.last.o = obj; }
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
    x.fillStyle = '#1b2a2a'; x.fillRect(0, 0, S, S);
    x.drawImage(fogMap, sx - r, sz - r, r * 2, r * 2, 0, 0, S, S);
    const toMini = (wx, wz) => [S / 2 + (wx - h.pos.x) / view * S / 2, S / 2 + (wz - h.pos.z) / view * S / 2];
    for (const m of markers) {
      const [mx, my] = toMini(m.x, m.z); const off = Math.hypot(mx - S / 2, my - S / 2) > S / 2 - 10;
      if (off && !m.pin) continue;
      let px = mx, py = my;
      if (off) { const a = Math.atan2(my - S / 2, mx - S / 2); px = S / 2 + Math.cos(a) * (S / 2 - 12); py = S / 2 + Math.sin(a) * (S / 2 - 12); }
      if (m.pin) { x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(px, py, 8, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); continue; }
      x.font = (m.size || 20) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(m.icon, px, py);
    }
    x.restore();
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 4; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); x.stroke();
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

// Build the explorer's map: blank parchment where no tower has been lit, real terrain where one has.
export function fogMapFor(profile, baseMap, towers = TOWERS, revealR = 130) {
  const c = document.createElement('canvas'); c.width = c.height = baseMap.width; const x = c.getContext('2d');
  x.fillStyle = '#e9dcb8'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = 'rgba(150,120,80,.25)'; x.lineWidth = 1;
  for (let i = 0; i < c.width; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(c.width, i); x.stroke(); }
  const k = c.width / SIZE;
  x.save(); x.beginPath();
  towers.forEach(t => { if (profile.towers[t.id]) { x.moveTo((t.x + HALF) * k + revealR * k, (t.z + HALF) * k); x.arc((t.x + HALF) * k, (t.z + HALF) * k, revealR * k, 0, Math.PI * 2); } });
  // you always know the little patch around the plateau where you woke up
  x.moveTo((HALF + 30) * k, HALF * k); x.arc(HALF * k, HALF * k, 30 * k, 0, Math.PI * 2);
  x.clip(); x.drawImage(baseMap, 0, 0); x.restore();
  return c;
}

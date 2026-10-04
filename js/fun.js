// Little joys: tap anything and it reacts (villagers wave and hop, animals call out, ducks and
// chickens scurry, butterflies flutter off, trees wobble and drop leaves), a confetti burst for
// every celebration, and the sticker scrapbook.
import { THREE } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX, noise } from './audio.js';
import { settings, saveProfiles } from './state.js';
import { STICKERS } from './data.js';
import { PLACES, placeStickers } from './placebook.js';
import { el, esc, pick } from './util.js';
import { modal } from './popups.js';

// ---------- confetti: js/popups.js (architecture step 2), passed on from here ----------
import { confetti } from './popups.js';
export { confetti };

export function createFun(G) {
  const { scene, world } = G;
  G.celebrate = h => { const r = h && G.huds[h.i] && G.huds[h.i].rect; confetti(r); if (h) h.cheerT = 1.6; };

  // ---------- tap reactions ----------
  const wobbles = [], hops = [];
  const o3 = new THREE.Object3D(), m4 = new THREE.Matrix4();
  const LEAF = { round: '🍃', apple: '🍎', pine: '🌲', snowpine: '❄️', bamboo: '🎋', palm: '🥥', bush: '🍃' };
  // returns true when the tap was used
  G.tapReact = (h, ray) => {
    const people = scene.children.filter(c => c.userData.avatar || c.userData.react);
    const targets = [...world.plants.filter(m => m.userData.kind !== 'rock'), ...world.critters.map(c => c.s), ...(G.pets ? G.pets.meshes() : []), ...G.npcs.map(n => n.obj), ...(G.farm ? G.farm.animalObjs() : []), ...(world.buffalo || []).map(b => b.mesh), ...(G.pets && G.pets.yardMeshes ? G.pets.yardMeshes() : []), ...people];
    const hit = ray.intersectObjects(targets, true)[0]; if (!hit || hit.distance > 45) return false;
    if (hit.object.isInstancedMesh && hit.distance > 26) return false; // far-away trees: tapping there walks there
    let o = hit.object;
    // a tree or bush
    if (o.isInstancedMesh && hit.instanceId != null) {
      const k = o.userData.kind; wobbles.push({ im: o, i: hit.instanceId, t: 0 });
      noise(.35, { freq: 1800, vol: .06, q: .6 }); G.fx(hit.point.x, hit.point.y + .5, hit.point.z, LEAF[k] || '🍃');
      if ((k === 'round' || k === 'pine') && Math.random() < .3) setTimeout(() => G.fx(hit.point.x, hit.point.y + 2, hit.point.z, '🐦'), 250);
      return true;
    }
    // a duck, chicken or butterfly
    if (o.userData.critter) { const c = o.userData.critter; c.boost = 1.4; (c.water ? SFX.quack : c.fly ? SFX.squeak : SFX.cluck)(); G.fx(o.position.x, o.position.y + .8, o.position.z, c.fly ? '✨' : '💨'); return true; }
    while (o && !o.userData.react && !o.userData.avatar && o.parent && o.parent !== scene) o = o.parent;
    if (o && o.userData.react) { o.userData.react(h, hit); return true; }
    if (o && o.userData.avatar) {
      const me = G.heroes.find(x => x.av.root === o);
      if (me) { me.cheerT = 1.4; SFX.hee(); G.fx(me.pos.x, me.pos.y + 2.4, me.pos.z, pick(['💖', '⭐', '😄'])); return true; }
      // anyone else: a happy hop and a wave, then walk over if they have something to do
      hops.push({ o, t: 0, y: o.position.y }); SFX.hee(); G.fx(o.position.x, o.position.y + 2.6, o.position.z, '👋');
      const it = G.interactables.filter(i => !i.visible || i.visible(h)).map(i => [i, Math.hypot(i.x - o.position.x, i.z - o.position.z)]).filter(([, d]) => d < 3.5).sort((a, b) => a[1] - b[1])[0];
      if (it) G.goAndDo(h, it[0]);
      return true;
    }
    return false;
  };
  // the water buffaloes moo when tapped (riding is still the button)
  (world.buffalo || []).forEach(b => { b.mesh.userData.react = () => { SFX.moo(); G.fx(b.mesh.position.x, b.mesh.position.y + 2.2, b.mesh.position.z, '💨'); }; });
  // register villagers: hop, wave and say hello, then walk over to talk
  G.npcs.forEach(n => { n.obj.userData.react = h => { hops.push({ o: n.obj, t: 0, y: n.obj.position.y }); SFX.hee(); G.fx(n.x, n.obj.position.y + 2.6, n.z, '👋'); const it = G.interactables.find(i => i.id === 'npc_' + n.id); if (it) G.goAndDo(h, it); }; });
  world.updaters.push(dt => {
    for (let k = wobbles.length - 1; k >= 0; k--) {
      const w = wobbles[k]; w.t += dt; const s = w.im.userData.list[w.i], a = Math.sin(w.t * 28) * .09 * Math.max(0, 1 - w.t / .7);
      o3.position.set(s[0], s[1], s[2]); o3.rotation.set(a, s[3], a * .6); o3.scale.setScalar(s[4]); o3.updateMatrix(); w.im.setMatrixAt(w.i, o3.matrix); w.im.instanceMatrix.needsUpdate = true;
      if (w.t > .7) wobbles.splice(k, 1);
    }
    for (let k = hops.length - 1; k >= 0; k--) { const p = hops[k]; p.t += dt; p.o.position.y = p.y + Math.abs(Math.sin(p.t * 9)) * .5 * Math.max(0, 1 - p.t / .9); if (p.t > .9) { p.o.position.y = p.y; hops.splice(k, 1); } }
    world.critters.forEach(c => { if (c.boost > 0) { c.boost -= dt; c.a += dt * 5; c.s.position.y += Math.abs(Math.sin(c.boost * 12)) * .5; } });
  });

  // ---------- the sticker scrapbook ----------
  G.openScrapbook = (h, after) => {
    const p = h.profile; if (!Array.isArray(p.scrapbook)) p.scrapbook = [[], [], []];
    G.paused = true;
    const m = modal('scrap', ''), card = m.querySelector('.card');
    let page = 0, sel = null;
    const close = () => { saveProfiles(); m.close(); G.paused = false; after && after(); };
    const items = () => p.scrapbook[page];
    const draw = () => {
      // the stickers from games, then the places sticker book's (js/placebook.js), each once
      const owned = [...new Set([...p.stickers, ...PLACES.filter(x => placeStickers(p)[x.id]).map(x => x.icon)])];
      card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>📒 ${T('My scrapbook', 'Sổ dán hình của con')}</h2>
        <div class="sb-pages">${[0, 1, 2].map(k => `<button class="btn ${k === page ? 'primary' : ''}" data-pg="${k}">${T('Page', 'Trang')} ${k + 1}</button>`).join('')}</div>
        <div class="sb-page"></div>
        <div class="sb-tools" ${sel == null ? 'hidden' : ''}><button class="btn" data-t="small">➖</button><button class="btn" data-t="big">➕</button><button class="btn" data-t="turn">↻</button><button class="btn danger" data-t="del">🗑️</button></div>
        <p class="note center">${T('Tap a sticker or photo to put it on the page, then drag it around!', 'Chạm vào hình dán hoặc ảnh để đặt lên trang, rồi kéo đi đâu cũng được!')}</p>
        <div class="sb-tray">${owned.map(s => `<button data-s="${esc(s)}">${s}</button>`).join('')}${p.album.map((src, k) => `<button data-p="${k}" class="ph"><img src="${src}" alt=""></button>`).join('')}${!owned.length && !p.album.length ? `<p class="note">${T('Win stickers and take photos to fill your scrapbook!', 'Hãy thắng hình dán và chụp ảnh để dán vào sổ nhé!')}</p>` : ''}</div>`;
      card.querySelector('.x').onclick = close;
      card.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { page = +b.dataset.pg; sel = null; SFX.tap(); draw(); });
      card.querySelectorAll('[data-s],[data-p]').forEach(b => b.onclick = () => {
        if (items().length >= 30) { SFX.no(); return; }
        items().push(b.dataset.s ? { t: 's', v: b.dataset.s, x: 35 + Math.random() * 30, y: 30 + Math.random() * 30, r: Math.round(Math.random() * 30 - 15), s: 1 } : { t: 'p', v: +b.dataset.p, x: 30 + Math.random() * 30, y: 30 + Math.random() * 30, r: Math.round(Math.random() * 16 - 8), s: 1 });
        sel = items().length - 1; SFX.pop(); saveProfiles(); draw();
      });
      card.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
        const it = items()[sel]; if (!it) return; const t = b.dataset.t;
        if (t === 'small') it.s = Math.max(.5, it.s - .2); if (t === 'big') it.s = Math.min(2.6, it.s + .2); if (t === 'turn') it.r = (it.r + 20) % 360;
        if (t === 'del') { items().splice(sel, 1); sel = null; }
        SFX.tap(); saveProfiles(); draw();
      });
      const pg = card.querySelector('.sb-page');
      items().forEach((it, k) => {
        if (it.t === 'p' && !p.album[it.v]) return;
        const d = el('div', 'sb-item' + (k === sel ? ' sel' : '') + (it.t === 'p' ? ' photo' : ''), it.t === 's' ? it.v : `<img src="${p.album[it.v]}" alt="">`);
        d.style.cssText = `left:${it.x}%;top:${it.y}%;transform:translate(-50%,-50%) rotate(${it.r}deg) scale(${it.s})`;
        d.onpointerdown = e => {
          e.preventDefault(); sel = k; card.querySelector('.sb-tools').hidden = false; pg.querySelectorAll('.sb-item').forEach(x => x.classList.remove('sel')); d.classList.add('sel');
          const R = pg.getBoundingClientRect();
          const move = ev => { it.x = Math.max(0, Math.min(100, (ev.clientX - R.left) / R.width * 100)); it.y = Math.max(0, Math.min(100, (ev.clientY - R.top) / R.height * 100)); d.style.left = it.x + '%'; d.style.top = it.y + '%'; };
          const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); saveProfiles(); };
          addEventListener('pointermove', move); addEventListener('pointerup', up);
        };
        pg.appendChild(d);
      });
    };
    draw();
    say('Make your own scrapbook page!', 'Con tự trang trí sổ dán hình nhé!');
  };
}

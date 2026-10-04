// Screens and pop-ups: title, who's playing, grown-ups settings, photo editor, NPC dialogue,
// the Sparkle Pad (map, backpack, adventure log, album, camera), cooking, shop and online play.
import { T, applyLang, nm, NPC_NAMES, defaultName } from './i18n.js';
import { settings, saveSettings, profiles, saveProfiles, addProfile, removeProfile, exportBackup, importBackup, backupAge, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, SKIN, HAIRSTYLES, GLIDERS, farm, resetFarm, saveFarm, MAX_KIDS } from './state.js';
import { say, spoken, voicePack, voiceDiag, voiceMisses, clearVoiceMisses, voicesFor, onVoices, hasVietnamese, FAMILY_PHRASES, hasClip, clipCount, saveClip, deleteClip, playClip, estimatePitch, pitchFromHz } from './voice.js';
import { startRecording, releaseMic, micProblem } from './recorder.js';
import { SFX, Music, ac } from './audio.js';
import { fmt, cur, spoken as money } from './money.js';
import { el, esc, $, clamp, wait } from './util.js';
import { avatarURL, applyNpcFaces } from './avatar.js';
import { confetti } from './fun.js';
import { ITEMS, RECIPES, findRecipe, SHOP, HAT_ICON, HAT_NAME, REWARD_HATS, dishInfo, QUESTS, STICKERS } from './data.js';
import { SIZE, HALF, SHRINES, TOWERS } from './world.js';
import { GAMES } from './games/frame.js';
import { showStory, storyList } from './story.js';
import { SECRETS } from './secrets.js';
import { LANDMARKS, VENDORS } from './regions.js';
import { AUSSIE_SLANG, VN_WORDS, VN_SLANG } from './words.js';
import { openCredits, creditsFields, bindCreditsFields } from './credits.js';
import { openHowTo } from './howto.js';
import { WILD } from './gather.js';
import { snackOf, eatSnack } from './snacks.js';
import { saveToDevice, savesByShare } from './photos.js';
import { extrasHTML, bindExtras } from './extras.js';
import { canListen } from './listen.js';
import { installButton } from './install.js';
import { BUILD } from './build.js';
import { VOICE_STYLES, clipCountFor, hush, setSpeaker, sayIn, sayDevice } from './voice.js';
import { LEARN } from './words2.js';
import { originFlags } from './icons.js';
import { pic , labelArt } from './art.js';

const PET_ICON = { puppy: '🐶', kitty: '🐱', bunny: '🐰', panda: '🐼', joey: '🦘', calf: '🐃' };
export const STYLE_ICON = { dress: '👗', shirt: '👕', aodai: '🥻', tunic: '🧥', overalls: '👖', hoodie: '🧶' };
export const STYLE_NAME = { dress: () => T('Dress', 'Váy'), shirt: () => T('Shirt & shorts', 'Áo và quần đùi'), aodai: () => 'Áo dài', tunic: () => T('Explorer', 'Nhà thám hiểm'), overalls: () => T('Overalls', 'Quần yếm'), hoodie: () => T('Hoodie', 'Áo nỉ') };
// big text and calm mode change the whole page
export function applyComfort() { if (settings.textSize == null) settings.textSize = settings.bigText ? 1 : 0; document.body.classList.toggle('bigtext', settings.textSize >= 1); document.body.classList.toggle('biggertext', settings.textSize >= 2); document.body.classList.toggle('calm', !!settings.calm); if (Music.key) Music.refresh(); }
applyComfort();
// Captions: every spoken line also appears as text at the bottom (unless a speech box, game or storybook
// is already showing those words). On by default; grown-ups can switch it off.
{
  let cap = null, t = 0;
  spoken.push(text => {
    if (settings.captions === false || !text) return;
    if (document.querySelector('.dialog:not(.out), .storybook, .gl, .howto')) return;
    if (!cap) { cap = el('div', 'caption'); cap.setAttribute('role', 'status'); cap.setAttribute('aria-live', 'polite'); document.body.appendChild(cap); }
    cap.textContent = text; cap.classList.add('show'); clearTimeout(t);
    t = setTimeout(() => cap.classList.remove('show'), 2200 + text.length * 70);
  });
}
export function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200); }

// The Save / Done / Close / Back row at the end of any window floats at the bottom while the page scrolls, and the
// ✕ stays at the top, so they can always be reached without scrolling (this runs for every window, also ones
// drawn again later).
const ENDWORDS = /\b(save|done|close|back|cancel|exit|ok|finish|bye)\b|lưu|xong|đóng|quay lại|hủy|thoát|tạm biệt|💾|✅/i;
function floatEnds(card) {
  const kids = [...card.children].filter(e => !e.hidden && e.offsetParent !== null && !e.classList.contains('x'));
  const last = kids[kids.length - 1]; if (!last) return;
  const isEnd = e => (e.matches('button, .btn, .actions, .bar, .row') && ENDWORDS.test(e.textContent || ''));
  if (isEnd(last) && !last.classList.contains('floatbar')) { if (last.matches('button, .btn')) last.classList.add('floatbtn'); else last.classList.add('actions', 'floatbar'); }
}
const floatWatch = new MutationObserver(list => { const seen = new Set(); for (const r of list) { const c = r.target.closest && r.target.closest('.modal .card'); if (c && !seen.has(c)) { seen.add(c); floatEnds(c); } } });
floatWatch.observe(document.documentElement, { childList: true, subtree: true });
export function modal(cls, html) {
  const m = el('div', 'modal ' + (cls || ''), `<div class="card">${html}</div>`);
  document.body.appendChild(m); requestAnimationFrame(() => floatEnds(m.querySelector('.card')));
  m.close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  return m;
}
const flagBtns = () => `<div class="seg lang"><button data-l="en" class="${settings.lang === 'en' ? 'on' : ''}">${originFlags('au')} English</button><button data-l="vi" class="${settings.lang === 'vi' ? 'on' : ''}">${originFlags('vn')} Tiếng Việt</button></div>`;
// Small, quiet buttons to also learn Chinese or Hindi words (in China Town, India Village and First Words).
const learnBtns = () => `<div class="learnrow" aria-label="${T('Also learn', 'Học thêm')}">🌏 ${Object.entries(LEARN).map(([k, l]) => `<button data-learn="${k}" class="${settings.learnLang === k ? 'on' : ''}" title="${l.name[settings.lang] || l.name.en}">${k === 'zh' ? '中文' : 'हिन्दी'}</button>`).join('')}</div>`;
function bindLearn(root, after) {
  root.querySelectorAll('[data-learn]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const k = b.dataset.learn; settings.learnLang = settings.learnLang === k ? '' : k; saveSettings(); SFX.tap();
    if (settings.learnLang) { const L = LEARN[k], w = L.words[0]; toast(`${L.flag} ${T('Also learning ' + L.name.en, 'Học thêm ' + L.name.vi)}: ${w[3]} (${w[4]})`); sayIn(k, w[3]); }
    after && after();
  });
}
function bindLang(root, after) {
  root.querySelectorAll('.seg.lang button').forEach(b => b.onclick = () => { settings.lang = b.dataset.l; saveSettings(); applyLang(); SFX.tap(); after && after(); });
}

// ---------- Title ----------
export function showTitle(onStart) {
  // a storybook cover: the valley behind, the name on a cream card with little friends floating round it,
  // a big "start" button, and the language choices together on one card at the bottom
  const s = el('div', 'screen title sv2', `
    <div class="tt-bar"><button class="about" aria-label="${T('About', 'Giới thiệu')}">i</button><div class="title-top"></div></div>
    <div class="tt-cover">
      <div class="tt-floaters" aria-hidden="true"><i>🪁</i><i>🏮</i><i>🌸</i><i>⭐</i><i>🦘</i><i>🪷</i></div>
      <div class="logo"><div class="logo-main"></div><div class="logo-sub"></div></div>
    </div>
    <button class="press"><span class="tt-play">▶</span><span class="tt-press"></span></button>
    <div class="tt-panel"><div class="title-foot"></div><div class="title-learn"></div></div>
    <div class="tt-build" aria-hidden="true">${BUILD}</div>`);
  document.body.appendChild(s);
  const redraw = () => {
    s.querySelector('.tt-press').textContent = T('Tap to start', 'Chạm để bắt đầu');
    // two words, two colours (pink and purple) with a white outline: clear and friendly, no glitter
    s.querySelector('.logo-main').innerHTML = (settings.lang === 'vi' ? ['Thung Lũng', 'Lấp Lánh'] : ['Sparkle', 'Valley']).map((w, k) => `<span class="lw lw${k + 1}">${w}</span>`).join(' ');
    s.querySelector('.logo-sub').textContent = T('Two homes · one valley', 'Hai quê hương · một thung lũng');
    s.querySelector('.logo').classList.toggle('vi', settings.lang === 'vi');
    s.querySelector('.about').setAttribute('aria-label', T('About', 'Giới thiệu'));
    s.querySelector('.title-foot').innerHTML = flagBtns();
    s.querySelector('.title-learn').innerHTML = learnBtns(); bindLearn(s, redraw);
    bindLang(s, redraw);
    const top = s.querySelector('.title-top'); top.innerHTML = '';
    const b = installButton(); if (b) top.appendChild(b);
  };
  redraw();
  s.querySelector('.about').onclick = e => { e.stopPropagation(); ac(); openCredits(); };
  s.addEventListener('click', e => { if (e.target.closest('.seg') || e.target.closest('.about') || e.target.closest('.installchip') || e.target.closest('.learnrow')) return; ac(); SFX.chime(); s.remove(); onStart(); });
}

// ---------- Who's playing ----------
export function showWho(onGo) {
  let mode = 'solo', chosen = [];
  const s = el('div', 'screen who sv2');
  document.body.appendChild(s);
  const draw = () => {
    const need = mode === 'split' ? 2 : 1;
    s.innerHTML = `
      <div class="who-card">
        <h2>${T("Who's playing?", 'Ai chơi nào?')}</h2>
        <div class="modes">
          <button data-m="solo" class="${mode === 'solo' ? 'on' : ''}"><span class="mi">🧒</span><b>${T('Play alone', 'Chơi một mình')}</b></button>
          <button data-m="split" class="${mode === 'split' ? 'on' : ''}"><span class="mi">👫</span><b>${T('Two players here', 'Hai bạn cùng máy')}</b></button>
          <button data-m="online" class="${mode === 'online' ? 'on' : ''}"><span class="mi">📞</span><b>${T('Friend far away', 'Bạn ở xa')}</b></button>
        </div>
        <p class="hint">${mode === 'split' ? T('Pick two players', 'Chọn hai bạn') : T('Pick a player', 'Chọn người chơi')}</p>
        <div class="picks">${profiles.map(p => `<button class="pick ${chosen.includes(p.id) ? 'on' : ''}" data-id="${p.id}"><img src="${avatarURL(p)}" alt=""><span>${esc(nm(p.name || '?'))}</span>${chosen.includes(p.id) && need === 2 ? `<i class="num">${chosen.indexOf(p.id) + 1}</i>` : ''}</button>`).join('')}
          <button class="pick add"><span class="plus">+</span><span>${T('New', 'Thêm')}</span></button></div>
        <button class="go" ${chosen.length === need ? '' : 'disabled'}>${T("Let's go!", 'Đi thôi!')} ▶</button>
      </div>
      <button class="grown"><span class="ring"></span>${T('Grown-ups', 'Phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button>`;
    s.querySelectorAll('.modes button').forEach(b => b.onclick = () => { mode = b.dataset.m; chosen = chosen.slice(0, mode === 'split' ? 2 : 1); SFX.tap(); draw(); });
    s.querySelectorAll('.pick[data-id]').forEach(b => b.onclick = () => {
      const id = b.dataset.id; SFX.pop(chosen.length);
      if (chosen.includes(id)) chosen = chosen.filter(x => x !== id);
      else if (need === 1) chosen = [id]; else chosen = [...chosen, id].slice(-2);
      const p = profiles.find(x => x.id === id); if (chosen.includes(id)) say(`Hi ${p.name}!`, `Chào ${p.name}!`);
      draw();
    });
    s.querySelector('.pick.add').onclick = () => profiles.length >= MAX_KIDS ? toast(T(`Up to ${MAX_KIDS} players. Remove one in Grown-ups first.`, `Tối đa ${MAX_KIDS} người chơi. Hãy xóa bớt trong mục Phụ huynh.`)) : openEditor(null, draw);
    s.querySelector('.go').onclick = () => { if (chosen.length !== need) return; SFX.chime(); s.remove(); onGo(mode, chosen.map(id => profiles.find(p => p.id === id))); };
    holdButton(s.querySelector('.grown'), () => openGrownups(draw));
  };
  draw();
}
function holdButton(b, fn) {
  let t = null, start = 0, raf = 0;
  const ring = b.querySelector('.ring');
  const tick = () => { const k = clamp((performance.now() - start) / 1600, 0, 1); ring.style.setProperty('--p', k * 100 + '%'); if (k >= 1) { stop(); fn(); } else raf = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(raf); ring.style.setProperty('--p', '0%'); t = null; };
  b.addEventListener('pointerdown', e => { e.preventDefault(); start = performance.now(); t = 1; tick(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, () => { if (t) stop(); }));
  b.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
}

// ---------- Rename characters ----------
function openRenamer(after) {
  const m = modal('renamer', ''), card = m.querySelector('.card');
  const list = NPC_NAMES.slice().sort((a, b) => defaultName(a.id).localeCompare(defaultName(b.id)));
  const cur = settings.npcNames || {};
  const faces = Object.assign({}, settings.npcFaces || {}); // photo faces: chosen here, kept only when Save is pressed
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>✏️ ${T('Character names', 'Tên nhân vật')}</h2>
    <p class="note">${T('Leave a box empty to keep the usual name (shown in grey). Tap 📷 to give someone a real face from a photo: it goes on their head in the game, and their skin takes the colour of the photo so it looks natural.', 'Để trống để giữ tên mặc định (chữ màu xám). Chạm 📷 để gắn khuôn mặt thật từ ảnh: ảnh được dán lên đầu nhân vật trong game, màu da lấy theo ảnh để trông tự nhiên.')}</p>
    <div class="rn-list">${list.map(n => `<div class="rn-row" data-id="${esc(n.id)}"><button class="rn-face" aria-label="${T('Photo face', 'Ảnh khuôn mặt')}">${faceHTML(n)}</button>
      <label>🇦🇺 English<input type="text" data-l="en" value="${esc((cur[n.id] || {}).en || '')}" placeholder="${esc(defaultName(n.id, 'en'))}"></label>
      <label>🇻🇳 Tiếng Việt<input type="text" data-l="vi" value="${esc((cur[n.id] || {}).vi || '')}" placeholder="${esc(defaultName(n.id, 'vi'))}"></label></div>`).join('')}</div>
    <div class="rn-bar"><button class="btn" id="rnReset">↩️ ${T('Use the usual names', 'Dùng tên mặc định')}</button><button class="btn primary" id="rnSave">💾 ${T('Save', 'Lưu')}</button></div>`;
  const close = () => { m.close(); after && after(); };
  card.querySelector('.x').onclick = close;
  function faceHTML(n) { const f = faces[n.id]; return f ? `<img src="${f.photo}" alt=""><i>✕</i>` : `<span class="rn-ic" aria-hidden="true">${n.icon}</span><b>📷</b>`; }
  card.querySelectorAll('.rn-row').forEach(r => { const b = r.querySelector('.rn-face'), id = r.dataset.id, n = list.find(x => x.id === id);
    b.onclick = () => { SFX.tap(); if (faces[id]) { delete faces[id]; b.innerHTML = faceHTML(n); return; } openCropper(T('A face for ', 'Khuôn mặt cho ') + defaultName(id), f => { if (f) { faces[id] = f; b.innerHTML = faceHTML(n); } }); }; });
  card.querySelector('#rnReset').onclick = () => card.querySelectorAll('.rn-row input').forEach(i => i.value = '');
  card.querySelector('#rnSave').onclick = () => {
    const out = {};
    card.querySelectorAll('.rn-row').forEach(r => { const en = r.querySelector('[data-l=en]').value.trim(), vi = r.querySelector('[data-l=vi]').value.trim(); if (en || vi) out[r.dataset.id] = { en, vi }; });
    settings.npcNames = out; settings.npcFaces = faces; saveSettings(); applyLang(); applyNpcFaces(); SFX.chime && SFX.chime();
    toast(T('Names saved!', 'Đã lưu tên!')); close();
  };
}

// Crop a photo to a round face (drag to move, pinch or slider to zoom). Gives back { photo, skin }: a 256 px JPEG
// and the skin colour sampled round the cheeks and forehead, used for the rest of the head so it blends in.
function openCropper(title, done) {
  let img = null, zoom = 1, ox = 0, oy = 0;
  const m = modal('editor cropper', `<h2>📷 ${esc(title)}</h2>
    <div class="crop-wrap"><canvas width="480" height="480"></canvas>
      <p class="note">${T('Choose a clear, front-facing photo. Fit the face inside the circle: eyebrows near the top, chin near the bottom. Drag to move, pinch or use the slider to zoom.', 'Chọn ảnh rõ, nhìn thẳng. Đặt khuôn mặt vừa trong vòng tròn: lông mày gần mép trên, cằm gần mép dưới. Kéo để di chuyển, chụm hai ngón hoặc dùng thanh trượt để phóng to.')}</p>
      <label class="btn primary" for="cfile">📷 ${T('Take or choose a photo', 'Chụp hoặc chọn ảnh')}</label><input type="file" id="cfile" accept="image/*" class="vh">
      <input type="range" min="1" max="5" step=".01" value="1" hidden aria-label="Zoom"></div>
    <div class="actions floatbar"><span class="grow"></span><button class="btn" id="cCancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" id="cOk" disabled>${T('Use this face', 'Dùng khuôn mặt này')}</button></div>`);
  const cv = m.querySelector('canvas'), cx = cv.getContext('2d'), zr = m.querySelector('input[type=range]'), ok = m.querySelector('#cOk');
  const draw = () => {
    cx.fillStyle = '#f1e9ff'; cx.fillRect(0, 0, 480, 480);
    if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    else { cx.font = '160px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🙂', 240, 250); }
    // guide: the face circle, with eye and chin lines
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, Math.PI * 2, true); cx.fill('evenodd'); cx.restore();
    cx.strokeStyle = '#fff'; cx.lineWidth = 6; cx.beginPath(); cx.arc(240, 240, 205, 0, Math.PI * 2); cx.stroke();
    cx.setLineDash([10, 10]); cx.lineWidth = 2; cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.beginPath(); cx.moveTo(110, 220); cx.lineTo(370, 220); cx.moveTo(170, 410); cx.lineTo(310, 410); cx.stroke(); cx.setLineDash([]);
    zr.hidden = !img; ok.disabled = !img;
  };
  draw();
  m.querySelector('#cfile').onchange = e => { const f = e.target.files[0]; if (!f) return; const url = URL.createObjectURL(f), i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = 1; draw(); URL.revokeObjectURL(url); }; i.src = url; };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
  cv.addEventListener('pointerdown', e => { if (!img) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
  cv.addEventListener('pointermove', e => { const pr = ptrs.get(e.pointerId); if (!pr) return; if (ptrs.size === 1) { const k = 480 / cv.clientWidth; ox += (e.clientX - pr.x) * k; oy += (e.clientY - pr.y) * k; } pr.x = e.clientX; pr.y = e.clientY; if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; zoom = clamp(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0, 1, 5); zr.value = zoom; } draw(); });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const finish = keep => {
    let out = null;
    if (keep && img) {
      const S = 256, o = document.createElement('canvas'); o.width = o.height = S; const c2 = o.getContext('2d'), s = Math.max(480 / img.width, 480 / img.height) * zoom, k = S / 410;
      c2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
      // the skin colour: the middle of each cheek and the forehead
      let r = 0, g = 0, b = 0, n = 0;
      for (const [px, py] of [[.3, .62], [.7, .62], [.5, .32]]) { const d = c2.getImageData(px * S - 8, py * S - 8, 16, 16).data; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
      const hx = v => Math.round(v / n).toString(16).padStart(2, '0');
      out = { photo: o.toDataURL('image/jpeg', .85), skin: '#' + hx(r) + hx(g) + hx(b) };
    }
    m.close(); done(out);
  };
  ok.onclick = () => finish(true); m.querySelector('#cCancel').onclick = () => finish(false);
}
// a sticky row of shortcuts at the top of a long page: one chip per section heading, tap to jump there
function jumpNav(root, after) {
  const hs = [...root.querySelectorAll(':scope > h3, :scope h3.jump')].filter(h => h.textContent.trim());
  if (hs.length < 4) return;
  const nav = el('div', 'jumpnav');
  hs.forEach((h, k) => { const b = el('button', '', esc(h.textContent.trim().replace(/\s+/g, ' ').slice(0, 26))); b.onclick = () => { SFX.tap(); h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; nav.appendChild(b); h.style.scrollMarginTop = '64px'; });
  (after && after.parentNode === root ? after : root.firstElementChild).insertAdjacentElement('afterend', nav);
}
// ---------- Grown-ups: the recorded voices at a glance ----------
// Recorded (offline) voices always play first; the phone's own voice is used only for a line with no recording.
// Those lines are counted here and travel in the backup file, so Sparkle Studio can record them.
function packStatusHTML() {
  const P = voicePack(), miss = voiceMisses().filter(m => m[0] === 'en' || m[0] === 'vi'), n = P ? Object.keys(P.lines).length : 0;
  return `<p class="note">${P ? '✅ ' + T(`${n.toLocaleString()} lines recorded with natural voices. They always play first, even offline; the phone's voice reads only a line that has no recording.`, `${n.toLocaleString('vi-VN')} câu đã thu bằng giọng tự nhiên. Luôn được phát trước, kể cả khi không có mạng; giọng của máy chỉ đọc câu chưa có bản ghi.`) : '⚠️ ' + T('The recorded voices have not loaded yet (they need the internet once).', 'Giọng đã thu chưa tải được (cần có mạng một lần).')}</p>
    ${voiceDiag.lastMiss ? `<p class="note warn">⚠️ ${T('Last time a recording could not play here', 'Lần trước máy này không phát được bản ghi')} (${esc(voiceDiag.lastMiss)}). ${T('Tap anywhere on the screen once, check the side switch is not on silent, then press ▶ below.', 'Chạm vào màn hình một lần, kiểm tra nút gạt bên hông không ở chế độ im lặng, rồi bấm ▶ bên dưới.')}</p>` : ''}
    <div class="actions"><button class="btn" data-pv="f">▶ 👩 ${T('Woman', 'Giọng nữ')}</button><button class="btn" data-pv="m">▶ 👨 ${T('Man', 'Giọng nam')}</button></div>
    <p class="note">${T('Women, girls and grandmas speak with the woman’s voice; men, boys and grandpas with the man’s.', 'Phụ nữ, bé gái và bà nói bằng giọng nữ; đàn ông, bé trai và ông nói bằng giọng nam.')}</p>
    ${miss.length ? `<details class="g-miss"><summary>📝 ${T(`${miss.length} lines on this device had no recording yet`, `${miss.length} câu trên máy này chưa có bản ghi`)}</summary>
      <p class="note">${T('Save a backup (below) and open it in Sparkle Studio → Voices: it records these for the next update.', 'Lưu bản sao (bên dưới) rồi mở trong Sparkle Studio → Giọng đọc: Studio sẽ thu các câu này cho bản cập nhật sau.')}</p>
      <ol class="misslist">${miss.slice(0, 40).map(m => `<li>${m[0] === 'vi' ? '🇻🇳' : '🇦🇺'} ${esc(m[1])} <small>×${m[2]}</small></li>`).join('')}</ol>
      <button class="btn" id="gMissClear">🧹 ${T('Clear the list', 'Xóa danh sách')}</button></details>` : `<p class="note">✅ ${T('Every line said on this device so far had a recording.', 'Mọi câu đã nói trên máy này đều có bản ghi.')}</p>`}`;
}
function bindPackStatus(card, redraw) {
  card.querySelectorAll('[data-pv]').forEach(b => b.onclick = () => { setSpeaker(b.dataset.pv === 'm' ? 'Chú Tư' : 'Cô Mai'); say('Hello! Welcome to Sparkle Valley.', 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.'); setTimeout(() => setSpeaker(null), 300); });
  const c = card.querySelector('#gMissClear'); if (c) c.onclick = () => { clearVoiceMisses(); redraw(); };
}
// ---------- Grown-ups ----------
export function openGrownups(after) {
  const m = modal('grownups', ''); let advOpen = false;
  const card = m.querySelector('.card');
  const draw = () => {
    const vEn = voicesFor('en'), vVi = voicesFor('vi');
    card.innerHTML = `
      <button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
      <h2>${T('Grown-ups', 'Phụ huynh')} <small class="buildtag">${T('Build', 'Bản')} ${BUILD}</small></h2>
      <div class="g-install"></div>
      <h3>${T('Language', 'Ngôn ngữ')}</h3>${flagBtns()}${learnBtns()}
      <label class="tog"><input type="checkbox" id="gBil" ${settings.bilingual ? 'checked' : ''}> ${T('Bilingual voice: also say everything in the other language', 'Giọng song ngữ: nói thêm bằng ngôn ngữ còn lại')}</label>
      <h3>${T('Sound and world', 'Âm thanh và thế giới')}</h3>
      <div class="toggles">
        <label class="tog"><input type="checkbox" id="gVoice" ${settings.voice ? 'checked' : ''}> ${T('Talking voice', 'Giọng nói')}</label>
        <label class="tog"><input type="checkbox" id="gMusic" ${settings.music ? 'checked' : ''}> ${T('Music', 'Nhạc')}</label>
        <label class="tog"><input type="checkbox" id="gSound" ${settings.sound ? 'checked' : ''}> ${T('Sound effects', 'Hiệu ứng âm thanh')}</label>
        <label class="tog"><input type="checkbox" id="gDay" ${settings.alwaysDay ? 'checked' : ''}> ${T('Always daytime', 'Luôn là ban ngày')}</label>
        <label class="tog"><input type="checkbox" id="gRain" ${settings.noRain ? '' : 'checked'}> ${T('Rain showers and rainbows', 'Mưa rào và cầu vồng')}</label>
        <label class="tog"><input type="checkbox" id="gCalm" ${settings.calm ? 'checked' : ''}> ${T('Calm mode: quieter music, fewer moving effects', 'Chế độ êm dịu: nhạc nhỏ hơn, ít hiệu ứng chuyển động')}</label>
        <label class="tog"><input type="checkbox" id="gCap" ${settings.captions === false ? '' : 'checked'}> ${T('Captions: show everything that is said as text', 'Phụ đề: hiện chữ cho mọi câu được nói')}</label>
      </div>
      <h3>🎙️ ${T('Voices', 'Giọng nói')}</h3>
      ${packStatusHTML()}
      <h3>🌙 ${T('Rest time', 'Giờ nghỉ')}</h3>
      <p class="note">${T('After this much play in a day, the explorer yawns and says goodnight. A grown-up can hold a button for 10 more minutes. Counted on this device only.', 'Sau khoảng thời gian chơi này trong ngày, nhà thám hiểm sẽ ngáp và chúc ngủ ngon. Người lớn có thể giữ nút để chơi thêm 10 phút. Chỉ tính trên máy này.')} ${T('Today', 'Hôm nay')}: ${Math.round(settings.playDay === new Date().toDateString() ? settings.playMins || 0 : 0)} ${T('min', 'phút')}</p>
      <div class="seg rest">${['0', '15', '30', '45', '60'].map(k => `<button data-r="${k}" class="${String(settings.restMins || '0') === k ? 'on' : ''}">${k === '0' ? T('Off', 'Tắt') : k + ' ' + T('min', 'phút')}</button>`).join('')}</div>
      <h3>🔠 ${T('Text size', 'Cỡ chữ')}</h3>
      <div class="seg tsize">${[[0, 'A'], [1, 'A'], [2, 'A']].map(([k, l]) => `<button data-ts="${k}" class="${(settings.textSize || 0) === k ? 'on' : ''}" style="font-size:${16 + k * 5}px" aria-label="${[T('Normal', 'Bình thường'), T('Big', 'To'), T('Bigger', 'To hơn')][k]}">${l}</button>`).join('')}</div>
      <div>
      </div>
      <h3>${T('Players', 'Người chơi')}</h3>
      <div class="plist">${profiles.map(p => `<div class="prow"><img src="${avatarURL(p)}" alt=""><div class="pw"><b>${esc(nm(p.name))}</b><small>🔮 ${p.orbs} · ✨ ${Object.keys(p.shrines).length}/12 · 💰 ${fmt(farm.coins)}</small></div><button class="btn" data-ed="${p.id}">${T('Edit', 'Sửa')}</button></div>`).join('')}</div>
      <button class="btn wide" id="gAdd">+ ${T('Add a player', 'Thêm người chơi')}</button>
      <h3>☁️ ${T('Backup to Google Drive or iCloud', 'Sao lưu lên Google Drive hoặc iCloud')}</h3>
      <p class="note">${T('Progress saves automatically on this device. To keep a copy online, tap Save backup and choose Google Drive, or “Save to Files” → iCloud Drive on iPhone and iPad. To bring it back (or onto a new device), tap Open backup and pick the file from Drive or iCloud.', 'Tiến trình tự động lưu trên máy này. Để giữ một bản trên mạng, bấm Lưu bản sao rồi chọn Google Drive, hoặc “Lưu vào Tệp” → iCloud Drive trên iPhone và iPad. Để lấy lại (hoặc chuyển sang máy mới), bấm Mở bản sao và chọn tệp trong Drive hoặc iCloud.')}</p>
      <p class="note backup-when${backupAge() > 7 ? ' old' : ''}">${settings.lastBackup ? T('Last backup: ', 'Lần sao lưu gần nhất: ') + new Date(settings.lastBackup).toLocaleDateString(settings.lang === 'vi' ? 'vi-VN' : 'en-AU') + (backupAge() > 7 ? T(' (over a week ago)', ' (hơn một tuần trước)') : '') : T('No backup saved yet.', 'Chưa có bản sao lưu nào.')}</p>
      <div class="actions"><button class="btn" id="gExp">☁️ ${T('Save backup', 'Lưu bản sao')}</button><label class="btn" for="gImp">📂 ${T('Open backup', 'Mở bản sao')}</label><input type="file" id="gImp" accept=".txt,.json,text/plain,application/json" class="vh"></div>
      <p class="note">${T('The file stays in your own Drive or iCloud: Sparkle Valley has no server and never sees it.', 'Tệp nằm trong Drive hoặc iCloud của bạn: Thung Lũng Lấp Lánh không có máy chủ và không bao giờ xem tệp này.')}</p>
      <details class="g-adv" ${advOpen ? 'open' : ''}><summary>⚙️ ${T('Advanced settings', 'Cài đặt nâng cao')}</summary>
      <h3>${T('Money', 'Tiền tệ')}</h3>
      <div class="seg cur"><button data-c="AUD" class="${settings.currency === 'AUD' ? 'on' : ''}">🇦🇺 AUD $</button><button data-c="VND" class="${settings.currency === 'VND' ? 'on' : ''}">🇻🇳 VND đ</button></div>
      <p class="note">${T('Prices and the market game switch currency. 10c = 2.000đ in this game.', 'Giá cả và trò chơi đi chợ sẽ đổi theo tiền tệ. Trong game, 10 xu Úc = 2.000đ.')}</p>
      <div class="field"><label>💰 ${T('Coins in the piggy bank', 'Tiền trong heo đất')}: <b id="gCoins">${fmt(farm.coins)}</b></label>
        <div class="actions coinadd">${[100, 500, 2000].map(n => `<button class="btn" data-add="${n}">+ ${fmt(n)}</button>`).join('')}</div></div>
      <p class="note">${T('Ran out? Top up the coins the whole family shares (for the shop, market and stalls).', 'Hết tiền? Nạp thêm tiền chung của cả nhà (dùng ở cửa hàng, chợ và các sạp).')}</p>
      <h3>📱 ${T('Phone voice (only for lines with no recording)', 'Giọng của máy (chỉ cho câu chưa có bản ghi)')}</h3>
      <div class="field"><label>English</label><div class="vrow"><select id="vEn">${vEn.map(v => `<option ${v.name === settings.voiceEn ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('Default', 'Mặc định')}</option>`}</select><button class="btn" data-try="en">▶</button></div></div>
      <div class="field"><label>Tiếng Việt</label><div class="vrow"><select id="vVi">${vVi.map(v => `<option ${v.name === settings.voiceVi ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('No Vietnamese voice found', 'Chưa có giọng tiếng Việt')}</option>`}</select><button class="btn" data-try="vi">▶</button></div></div>
      <p class="note">${hasVietnamese() ? '' : T('To add a Vietnamese voice: iPhone/iPad → Settings → Accessibility → Spoken Content → Voices → Vietnamese. Android → Settings → Text-to-speech → Google → Install voice data → Vietnamese. ', 'Thêm giọng tiếng Việt: iPhone/iPad → Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt. Android → Cài đặt → Chuyển văn bản thành giọng nói → Google → Cài đặt dữ liệu giọng nói → Tiếng Việt. ')}${T('Choose an "Enhanced" or "Premium" voice for the most natural sound.', 'Chọn giọng "Nâng cao" hoặc "Cao cấp" để nghe tự nhiên nhất.')}</p>
      <h3>${T('Family voice', 'Giọng của gia đình')}</h3>
      <button class="btn primary wide big" id="gRec">🎙️ ${T('Record your voice for the game', 'Thu giọng của bạn cho trò chơi')}<small class="reccount">🇻🇳 ${clipCountFor('vi')}/${FAMILY_PHRASES.length} · 🇦🇺 ${clipCountFor('en')}/${FAMILY_PHRASES.length}</small></button>
      <p class="note">${T('Each language has its own 11 lines. The game plays your real voice whenever it says one of those lines (praise, “try again”, “you did it”, hello…), in the language the game is set to. Everything else is read by the device voice, tuned towards your voice.', 'Mỗi ngôn ngữ có 11 câu riêng. Trò chơi phát đúng giọng thật của bạn mỗi khi nói một trong các câu đó (khen, “thử lại nhé”, “con làm được rồi”, chào…), theo ngôn ngữ đang chọn. Các câu khác do giọng máy đọc, được chỉnh gần với giọng bạn.')}</p>
      ${extrasHTML()}
      <h3>🎉 ${T('Festivals', 'Lễ hội')}</h3>
      <p class="note">${T('Festivals follow the calendar on this device: Tết, Mid-Autumn, Diwali, Christmas and Australia Day. You can also show one now.', 'Lễ hội theo lịch của máy này: Tết, Trung Thu, Diwali, Giáng Sinh và Ngày Nước Úc. Bạn cũng có thể bật một lễ hội ngay bây giờ.')}</p>
      <div class="seg fest">${[['auto', T('By date', 'Theo lịch')], ['tet', '🧧 Tết'], ['midautumn', '🥮 ' + T('Mid-Autumn', 'Trung Thu')], ['diwali', '🪔 Diwali'], ['christmas', '🎄 ' + T('Christmas', 'Giáng Sinh')], ['ausday', '🇦🇺 ' + T('Australia Day', 'Ngày Nước Úc')], ['none', T('Off', 'Tắt')]].map(([k, l]) => `<button data-f="${k}" class="${(settings.festival || 'auto') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="field"><label>${T('Count players', 'Đếm người chơi')}</label><div class="seg cnt"><button data-c="1" class="${settings.countPlayers !== false ? 'on' : ''}">${T('On', 'Bật')}</button><button data-c="0" class="${settings.countPlayers === false ? 'on' : ''}">${T('Off', 'Tắt')}</button></div></div>
      <p class="note">${T('The game tells its website, without names, photos or places, that this device played (minutes, games, language, version), so the family can see how many children play. Switch it off any time.', 'Trò chơi báo cho trang web của nó, không có tên, ảnh hay địa điểm, rằng máy này đã chơi (số phút, trò chơi, ngôn ngữ, phiên bản), để gia đình biết có bao nhiêu bé chơi. Tắt lúc nào cũng được.')}</p>
      <div class="field"><label>${T('Camera', 'Góc nhìn')}</label><div class="seg cam"><button data-c="easy" class="${settings.camMode !== 'free' ? 'on' : ''}">🧸 ${T('Easy: fixed view from above', 'Dễ: nhìn từ trên, cố định')}</button><button data-c="free" class="${settings.camMode === 'free' ? 'on' : ''}">🧭 ${T('Explorer: drag to look around', 'Tự do: kéo để xoay')}</button></div></div>
      <div class="field"><label>${T('Graphics', 'Đồ họa')}</label><div class="seg q">${['low', 'auto', 'high'].map(q => `<button data-q="${q}" class="${settings.quality === q ? 'on' : ''}">${{ low: T('Fast', 'Nhanh'), auto: T('Auto', 'Tự động'), high: T('Pretty', 'Đẹp') }[q]}</button>`).join('')}</div></div>
      <h3>🏷️ ${T('Character names', 'Tên nhân vật')}</h3>
      <p class="note">${T('Titles follow the language (Grandma / Bà, Auntie / Cô) and names stay as they are in each region. You can rename anyone, in English and in Vietnamese.', 'Danh xưng đổi theo ngôn ngữ (Grandma / Bà, Auntie / Cô) và tên giữ nguyên theo từng vùng. Bạn có thể đổi tên bất kỳ nhân vật nào, bằng tiếng Anh và tiếng Việt.')}</p>
      <button class="btn wide" id="gNames">✏️ ${T('Rename characters', 'Đổi tên nhân vật')}</button>
      <h3>ℹ️ ${T('Credits page', 'Trang giới thiệu')}</h3>${creditsFields()}<button class="btn wide" id="gCredits">ℹ️ ${T('Show the credits page', 'Xem trang giới thiệu')}</button>
      <h3>${T('Farm', 'Nông trại')}</h3>
      <button class="btn danger" id="gFarm">🔄 ${T('Start the farm over', 'Làm lại nông trại')}</button>
      <p class="note">${T('Clears crops, animals, pets, basket and coins. Players, photos, stickers and game levels are kept.', 'Xóa cây trồng, vật nuôi, thú cưng, giỏ hàng và tiền. Giữ lại người chơi, ảnh, hình dán và cấp độ trò chơi.')}</p>
      <h3>🌐 ${T('Online play', 'Chơi trực tuyến')}</h3>
      <p class="note">${T('Online play uses the free PeerJS service to connect two devices directly. Voice goes straight between the devices and is never recorded.', 'Chơi trực tuyến dùng dịch vụ miễn phí PeerJS để nối hai máy trực tiếp. Giọng nói đi thẳng giữa hai máy và không bao giờ được ghi lại.')}</p>
      <label class="tog"><input type="checkbox" id="gAutoMeet" ${settings.autoMeet !== false ? 'checked' : ''}> ${T('Meet friends by themselves: when a friend on the list is playing too, the two games join up (no room number needed)', 'Tự gặp bạn bè: khi một bạn trong danh sách cũng đang chơi, hai máy tự vào chung (không cần đọc mã phòng)')}</label>
      <p class="note">${T('If a friend far away stays on “Connecting…”, your two networks need a relay (TURN server). Free public relays are tried automatically. For a reliable one, make a free account at a TURN service (for example metered.ca), then paste its credentials link here, or a turn: address with its name and password. Both devices need the same relay.', 'Nếu bạn ở xa cứ “Đang kết nối…” mãi, hai mạng cần một máy chủ trung chuyển (TURN). Trò chơi tự thử các máy chủ miễn phí công cộng. Để ổn định hơn, hãy tạo tài khoản miễn phí ở một dịch vụ TURN (ví dụ metered.ca), rồi dán đường link lấy thông tin vào đây, hoặc địa chỉ turn: kèm tên và mật khẩu. Cả hai máy cần dùng cùng máy chủ.')}</p>
      <div class="vrow"><input type="text" id="gTurn" placeholder="https://…/turn/credentials?apiKey=…  ${T('or', 'hoặc')}  turn:…" value="${esc(settings.turnUrl || '')}" autocomplete="off"></div>
      <div class="vrow ${/^turns?:/i.test(settings.turnUrl || '') ? '' : 'vh'}" id="gTurnCred"><input type="text" id="gTurnUser" placeholder="${T('Name', 'Tên')}" value="${esc(settings.turnUser || '')}" autocomplete="off"><input type="password" id="gTurnPass" placeholder="${T('Password', 'Mật khẩu')}" value="${esc(settings.turnPass || '')}" autocomplete="off"></div>
      <div class="actions"><button class="btn" id="gNetCheck">🔍 ${T('Test the connection', 'Kiểm tra kết nối')}</button></div><p class="note" id="gNetRes"></p>
      </details>
      <button class="btn primary wide" id="gDone">💾 ${T('Save & close', 'Lưu và đóng')}</button>`;
    bindLang(card, () => { draw(); after && after(); }); bindLearn(card, () => draw());
    card.querySelector('.g-adv').ontoggle = e => { advOpen = e.currentTarget.open; };
    bindPackStatus(card, () => { const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelector('.x').onclick = card.querySelector('#gDone').onclick = () => { m.close(); after && after(); };
    jumpNav(card, card.querySelector('h2'));
    card.querySelectorAll('.seg.cur button').forEach(b => b.onclick = () => { settings.currency = b.dataset.c; saveSettings(); draw(); });
    card.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const n = +b.dataset.add; if (window.__sv && window.__sv.addCoins) window.__sv.addCoins(n); else { farm.coins += n; saveFarm(); } SFX.coin ? SFX.coin() : SFX.chime(); card.querySelector('#gCoins').textContent = fmt(farm.coins); toast(T('Coins added: ', 'Đã thêm: ') + fmt(n)); });
    card.querySelectorAll('.seg.cam button').forEach(b => b.onclick = () => { settings.camMode = b.dataset.c; saveSettings(); draw(); });
    card.querySelectorAll('.seg.cnt button').forEach(b => b.onclick = () => { settings.countPlayers = b.dataset.c === '1'; saveSettings(); draw(); });
    card.querySelectorAll('.seg.q button').forEach(b => b.onclick = () => { settings.quality = b.dataset.q; saveSettings(); draw(); toast(T('Restart the game to change graphics.', 'Mở lại trò chơi để đổi đồ họa.')); });
    const chk = (id, k, f) => card.querySelector(id).onchange = e => { settings[k] = e.target.checked; saveSettings(); f && f(); };
    card.querySelector('#gAutoMeet').onchange = e => { settings.autoMeet = e.target.checked; saveSettings(); };
    const turnIn = card.querySelector('#gTurn');
    turnIn.oninput = () => { settings.turnUrl = turnIn.value.trim(); saveSettings(); card.querySelector('#gTurnCred').classList.toggle('vh', !/^turns?:/i.test(settings.turnUrl)); };
    card.querySelector('#gTurnUser').oninput = e => { settings.turnUser = e.target.value; saveSettings(); };
    card.querySelector('#gTurnPass').oninput = e => { settings.turnPass = e.target.value; saveSettings(); };
    card.querySelector('#gNetCheck').onclick = async e => {
      const b = e.currentTarget, out = card.querySelector('#gNetRes'); b.disabled = true; out.textContent = '⏳ ' + T('Checking… (about 10 seconds)', 'Đang kiểm tra… (khoảng 10 giây)');
      const { Net } = await import('./net.js'); const r = await Net.check(); b.disabled = false;
      const cloudLine = '<br>' + (r.cloud ? '☁️ ' + T(`Cloud relay: ${r.cloud} servers answer, so friends can always play together (voice calls still need a direct link or a relay).`, `Mạng đám mây: ${r.cloud} máy chủ trả lời, nên các bạn luôn chơi cùng được (gọi bằng giọng nói vẫn cần kết nối trực tiếp hoặc máy chủ trung chuyển).`) : '⚠️ ' + T('Cloud relay: no server answered (the network may block it).', 'Mạng đám mây: không máy chủ nào trả lời (mạng có thể đang chặn).'));
      let msg;
      if (!r.server) msg = r.cloud ? '🟡 ' + T('The meeting service (PeerJS) is not answering, but the cloud relay works: you can still play together.', 'Dịch vụ PeerJS không trả lời, nhưng mạng đám mây hoạt động: vẫn chơi cùng nhau được.') : '❌ ' + T('Cannot reach the PeerJS service. Check the internet connection.', 'Không kết nối được dịch vụ PeerJS. Kiểm tra lại mạng internet.');
      else if (r.relay) msg = '✅ ' + T('Ready to play with friends anywhere (a relay is working).', 'Sẵn sàng chơi với bạn ở bất cứ đâu (máy chủ trung chuyển hoạt động).');
      else if (r.srflx) msg = '🟡 ' + T('Direct links work on most home Wi-Fi. For voice with friends on mobile data or strict networks, add a relay above.', 'Kết nối trực tiếp chạy được với Wi-Fi gia đình. Để gọi giọng nói với bạn dùng 4G hoặc mạng chặt, hãy thêm máy chủ trung chuyển ở trên.');
      else msg = '🟠 ' + T('Direct links only work on the same Wi-Fi. Add a relay above for voice with friends far away.', 'Kết nối trực tiếp chỉ chạy khi cùng Wi-Fi. Thêm máy chủ trung chuyển ở trên để gọi giọng nói với bạn ở xa.');
      out.innerHTML = msg + cloudLine;
    };
    card.querySelector('#gRain').onchange = e => { settings.noRain = !e.target.checked; saveSettings(); };
    chk('#gCalm', 'calm', applyComfort);
    card.querySelector('#gCap').onchange = e => { settings.captions = e.target.checked; saveSettings(); };
    card.querySelectorAll('.seg.tsize button').forEach(b => b.onclick = () => { settings.textSize = +b.dataset.ts; saveSettings(); applyComfort(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelectorAll('.seg.fest button').forEach(b => b.onclick = () => { settings.festival = b.dataset.f; saveSettings(); window.__sv && window.__sv.festivals && window.__sv.festivals.rebuild(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    card.querySelectorAll('.seg.rest button').forEach(b => b.onclick = () => { settings.restMins = b.dataset.r; saveSettings(); const y = m.scrollTop; draw(); m.scrollTop = y; });
    chk('#gBil', 'bilingual'); chk('#gVoice', 'voice'); chk('#gMusic', 'music', () => settings.music ? Music.refresh() : Music.stop()); chk('#gSound', 'sound'); chk('#gDay', 'alwaysDay');
    card.querySelector('#vEn').onchange = e => { settings.voiceEn = e.target.value; saveSettings(); };
    card.querySelector('#vVi').onchange = e => { settings.voiceVi = e.target.value; saveSettings(); };
    card.querySelectorAll('[data-try]').forEach(b => b.onclick = () => {
      sayDevice(b.dataset.try, b.dataset.try === 'vi' ? 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.' : 'Hello! Welcome to Sparkle Valley.');
    });
    card.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => openEditor(profiles.find(p => p.id === b.dataset.ed), () => { draw(); after && after(); }));
    card.querySelector('#gAdd').onclick = () => profiles.length >= MAX_KIDS ? toast(T(`Up to ${MAX_KIDS} players.`, `Tối đa ${MAX_KIDS} người chơi.`)) : openEditor(null, () => { draw(); after && after(); });
    card.querySelector('#gExp').onclick = async () => { const how = await exportBackup(); if (how === 'cancelled') return; toast(how === 'shared' ? T('Backup saved!', 'Đã lưu bản sao!') : T('Backup downloaded. Put it in Drive or iCloud to keep it safe.', 'Đã tải bản sao. Hãy cất vào Drive hoặc iCloud cho an toàn.')); const y = m.scrollTop; draw(); m.scrollTop = y; };
    card.querySelector('#gRec').onclick = () => openRecorder(draw);
    { const b = installButton('btn wide installrow'); if (b) card.querySelector('.g-install').appendChild(b); }
    bindCreditsFields(card); card.querySelector('#gCredits').onclick = () => openCredits();
    card.querySelector('#gNames').onclick = () => openRenamer(() => { const y = m.scrollTop; draw(); m.scrollTop = y; });
    bindExtras(card, () => { const y = m.scrollTop; draw(); m.scrollTop = y; }, toast);
    card.querySelector('#gFarm').onclick = () => { if (confirm(T('Start the farm over? Players and stickers are kept.', 'Làm lại nông trại? Người chơi và hình dán được giữ lại.'))) { resetFarm(); window.__sv && window.__sv.farm && (window.__sv.farm.syncAnimals(), window.__sv.farm.syncPets()); toast(T('A fresh new farm!', 'Nông trại mới tinh!')); } };
    card.querySelector('#gImp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { await importBackup(f); toast(T('Backup loaded!', 'Đã mở bản sao!')); draw(); after && after(); } catch (err) { toast(T('That file is not a Sparkle Valley backup.', 'Tệp này không phải bản sao của Thung Lũng Lấp Lánh.')); } };
  };
  draw();
  onVoices(() => { if (document.body.contains(m)) draw(); });
}

// ---------- Quick settings: tap your picture in the corner ----------
export function openQuick(game, i) {
  const m = modal('qsettings', ''), card = m.querySelector('.card');
  const close = () => { m.close(); game.paused = false; game.huds.forEach(h => h.refreshAudio()); };
  const hero = game.heroes[i], p = hero ? hero.profile : null;
  // one row with a picture, a name and an on/off switch
  const row = (k, icon, label, on, hint = '') => `<button class="qrow qset ${on ? 'on' : ''}" data-k="${k}" aria-pressed="${on}"><span class="qi">${icon}</span><b>${label}${hint ? `<small>${hint}</small>` : ''}</b><i class="qsw"></i></button>`;
  const draw = () => {
    const s = settings, view = (hero && hero.view) || 'follow';
    card.innerHTML = `<div class="qs-head">${p ? `<img class="qs-av" src="${avatarURL(p)}" alt="">` : ''}<div class="qs-title"><h2>${T('Settings', 'Cài đặt')}</h2>${p ? `<small>${esc(nm(p.name || ''))}</small>` : ''}<small class="buildtag">${T('Build', 'Bản')} ${BUILD}</small></div><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <div class="qs-sec"><h4>🌏 ${T('Language', 'Ngôn ngữ')}</h4>${flagBtns()}</div>
      <div class="qs-sec"><h4>🔊 ${T('Sound', 'Âm thanh')}</h4>
        ${row('music', '🎵', T('Music', 'Nhạc'), s.music)}${row('sound', '🔔', T('Sounds', 'Tiếng động'), s.sound)}${row('voice', '🗣️', T('Talking', 'Giọng nói'), s.voice)}
        <div class="qs-sub">${T('Voice style', 'Kiểu giọng')}</div><div class="seg vstyle">${VOICE_STYLES.map(v => `<button data-v="${v.id}" class="${(s.voiceStyle || 'natural') === v.id ? 'on' : ''}">${v.icon} ${v.name()}</button>`).join('')}</div></div>
      <div class="qs-sec"><h4>🎥 ${T('Camera', 'Máy quay')}</h4>
        <div class="qs-views">${(game.VIEWS || []).map(([id, icon, en, vi]) => `<button data-view="${id}" class="${view === id ? 'on' : ''}"><span>${icon}</span>${T(en, vi)}</button>`).join('')}</div>
        ${row('cam', s.camMode === 'free' ? '🧭' : '🧸', T('Easy camera', 'Camera dễ'), s.camMode !== 'free', s.camMode === 'free' ? T('off: drag to look around', 'tắt: kéo để nhìn quanh') : T('turns by itself', 'tự xoay theo con'))}</div>
      <div class="qs-sec"><h4>🎮 ${T('Play', 'Chơi')}</h4>
        ${row('voiceControl', '🎤', T('Voice control', 'Điều khiển bằng giọng nói'), s.voiceControl !== false)}${row('alwaysDay', '☀️', T('Always daytime', 'Luôn ban ngày'), s.alwaysDay)}
        <div class="qs-sub">${T('Text size', 'Cỡ chữ')}</div><div class="seg tsize">${[0, 1, 2].map(k => `<button data-ts="${k}" class="${(s.textSize || 0) === k ? 'on' : ''}" style="font-size:${16 + k * 5}px">A</button>`).join('')}</div></div>
      ${game.festivals ? `<button class="qs-fest" id="qFest"><span>🎉</span><b>${T('Festivals', 'Lễ hội')}</b><small>${T('Tết, Mid-Autumn, Diwali, Christmas, Australia Day: any day you like', 'Tết, Trung Thu, Diwali, Giáng Sinh, Ngày Nước Úc: ngày nào cũng được')}</small></button>` : ''}
      <button class="grown qgrown"><span class="ring"></span>👨‍👩‍👧 ${T('Grown-ups settings', 'Cài đặt phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button>
      <div class="actions floatbar"><button class="btn" id="qWho">👫 ${T('Change player', 'Đổi người chơi')}</button><button class="btn primary" id="qDone">${T('Done', 'Xong')}</button></div>`;
    bindLang(card, draw);
    card.querySelector('.x').onclick = card.querySelector('#qDone').onclick = close;
    card.querySelectorAll('.qset').forEach(b => b.onclick = () => {
      const k = b.dataset.k; SFX.tap();
      if (k === 'cam') s.camMode = s.camMode === 'free' ? 'easy' : 'free';
      else if (k === 'voiceControl') s.voiceControl = s.voiceControl === false;
      else s[k] = !s[k];
      if (k === 'music') { if (s.music) Music.refresh(); else Music.stop(); }
      if (k === 'voice' && !s.voice) hush();
      saveSettings(); document.querySelectorAll('.dk.voicecmd').forEach(x => x.hidden = s.voiceControl === false); keep(draw);
    });
    card.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { game.setView(i, b.dataset.view); keep(draw); });
    card.querySelectorAll('.seg.tsize button').forEach(b => b.onclick = () => { s.textSize = +b.dataset.ts; saveSettings(); applyComfort(); keep(draw); });
    card.querySelectorAll('.seg.vstyle button').forEach(b => b.onclick = () => { s.voiceStyle = b.dataset.v; saveSettings(); keep(draw); say('Hello! Do you like my voice?', 'Xin chào! Con có thích giọng này không?'); });
    const fb = card.querySelector('#qFest'); if (fb) fb.onclick = () => { SFX.tap(); m.close(); openFestivals(game, i); };
    card.querySelector('#qWho').onclick = () => { m.close(); game.changePlayer(); };
    // the full Grown-ups settings, from inside the game (press and hold, so little fingers don't open it by accident)
    holdButton(card.querySelector('.qgrown'), () => openGrownups(() => { draw(); game.huds.forEach(h => { h.refreshAudio(); h.refreshWho(); }); }));
  };
  const keep = f => { const y = m.scrollTop; f(); m.scrollTop = y; };
  draw();
}

// choose a festival to visit (any day of the year)
export function openFestivals(game, i) {
  const m = modal('festpick', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🎉 ${T('Festivals', 'Lễ hội')}</h2>
    <p class="sub">${T('Pick a festival: the village gets ready, fireworks go up and you get a festival present.', 'Chọn một lễ hội: làng trang trí, pháo hoa bay lên và con nhận quà lễ hội.')}</p>
    <div class="festgrid">${game.festivals.list().map(f => `<button class="festbtn${f.today ? ' today' : ''}" data-fest="${f.id}"><span>${pic(f.icon)}</span><b>${esc(f.name)}</b>${f.today ? `<small>${T('Today!', 'Hôm nay!')}</small>` : ''}</button>`).join('')}</div>`);
  const done = () => { m.close(); game.paused = false; };
  m.querySelector('.x').onclick = done;
  m.querySelectorAll('[data-fest]').forEach(b => b.onclick = () => { SFX.tap(); done(); game.festivals.visit(i, b.dataset.fest); });
  say('Which festival shall we visit?', 'Mình đi lễ hội nào nhé?');
}

// ---------- Player editor with photo cropping ----------
export function openEditor(profile, after) {
  const isNew = !profile;
  const p = profile || addProfile();
  const look = Object.assign({}, p.look);
  let photo = p.photo, img = null, zoom = 1, ox = 0, oy = 0;
  const m = modal('editor', `
    <h2>${isNew ? T('New player', 'Người chơi mới') : T('Edit player', 'Sửa người chơi')}</h2>
    <div class="crop-wrap"><canvas id="crop" width="480" height="480"></canvas>
      <p class="note">${T('Use a close-up photo of their face. Drag to move, use the slider to zoom.', 'Dùng ảnh chụp gần khuôn mặt. Kéo để di chuyển, dùng thanh trượt để phóng to.')}</p>
      <label class="btn primary" for="file">📷 ${T('Take or choose a photo', 'Chụp hoặc chọn ảnh')}</label><input type="file" id="file" accept="image/*" class="vh">
      <input type="range" id="zoom" min="1" max="5" step=".01" value="1" hidden aria-label="Zoom"></div>
    <div class="field"><label for="nm">${T('Name', 'Tên')}</label><input id="nm" maxlength="16" value="${esc(p.name)}" placeholder="${T('e.g. Annie or Bin', 'ví dụ: Na hoặc Bin')}"></div>
    <div class="field"><span>${T('Age', 'Tuổi')}</span><div class="seg age"><button data-a="little">🧸 ${T('Little (under 5)', 'Bé nhỏ (dưới 5 tuổi)')}</button><button data-a="big">🎒 ${T('Big kid (5 to 8)', 'Bé lớn (5 đến 8 tuổi)')}</button></div>
      <p class="note">${T('Little: everything is spoken, games stay gentle and nobody can lose. Big kid: harder levels, more reading, and real opponents in strategy games.', 'Bé nhỏ: mọi thứ đều được đọc to, trò chơi nhẹ nhàng và không ai thua. Bé lớn: cấp độ khó hơn, đọc nhiều hơn, và có đối thủ thật trong trò chơi chiến thuật.')}</p></div>
    <div class="field"><span>${T('Difficulty', 'Độ khó')}</span><div class="seg diff"><button data-d="easy">🌱 ${T('Easy', 'Dễ')}</button><button data-d="medium">🌿 ${T('Medium', 'Vừa')}</button><button data-d="hard">🌳 ${T('Hard', 'Khó')}</button></div></div>
    <div class="field"><span>${T('Clothes', 'Trang phục')}</span><div class="chips" id="cOut"></div><div class="chips" id="cCol"></div></div>
    <div class="field"><span>${T('Hat', 'Mũ')}</span><div class="chips" id="cHat"></div></div>
    <div class="field"><span>${T('On the back', 'Sau lưng')}</span><div class="chips" id="cBack"></div></div>
    <div class="field"><span>${T('Hair', 'Tóc')}</span><div class="chips" id="cHs"></div><div class="chips" id="cHair"></div></div>
    <div class="field"><span>${T('Skin', 'Màu da')}</span><div class="chips" id="cSkin"></div></div>
    <div class="actions floatbar">${isNew ? '' : `<button class="btn danger" id="eDel">${T('Remove', 'Xóa')}</button>`}<span class="grow"></span><button class="btn" id="eCancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" id="eSave">${T('Save', 'Lưu')}</button></div>`);
  const cv = m.querySelector('#crop'), cx = cv.getContext('2d'), zr = m.querySelector('#zoom');
  const draw = () => {
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, 480, 480);
    if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    else if (photo) { const i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; draw(); }; i.src = photo; return; }
    else { cx.fillStyle = '#f1e9ff'; cx.fillRect(0, 0, 480, 480); cx.font = '160px serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🙂', 240, 250); }
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, Math.PI * 2, true); cx.fill('evenodd'); cx.restore();
    cx.strokeStyle = '#fff'; cx.lineWidth = 6; cx.beginPath(); cx.arc(240, 240, 205, 0, Math.PI * 2); cx.stroke();
    zr.hidden = !img;
  };
  draw();
  m.querySelector('#file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f), i = new Image();
    i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = 1; draw(); URL.revokeObjectURL(url); };
    i.src = url;
  };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  // drag with one finger to move, pinch with two fingers (or use the slider) to zoom
  const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
  cv.addEventListener('pointerdown', e => { if (!img) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; } });
  cv.addEventListener('pointermove', e => {
    const pr = ptrs.get(e.pointerId); if (!pr) return;
    if (ptrs.size === 1) { const k = 480 / cv.clientWidth; ox += (e.clientX - pr.x) * k; oy += (e.clientY - pr.y) * k; }
    pr.x = e.clientX; pr.y = e.clientY;
    if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; zoom = clamp(zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch0, 1, 5); zr.value = zoom; }
    draw();
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const chips = (id, list, key, render) => {
    const box = m.querySelector(id); box.innerHTML = '';
    list.forEach(v => { const b = el('button', 'chip' + (look[key] === v ? ' on' : '')); b.innerHTML = render(v); b.onclick = () => { look[key] = v; chips(id, list, key, render); }; box.appendChild(b); });
  };
  chips('#cOut', STYLES, 'style', v => `<span>${STYLE_ICON[v]}</span><small>${STYLE_NAME[v]()}</small>`);
  chips('#cCol', OUTFIT_COLORS, 'color', v => `<span class="sw" style="background:${v}"></span>`);
  chips('#cHat', HATS, 'hat', v => HAT_ICON[v]);
  chips('#cBack', BACKS, 'back', v => ({ none: '🙂', wings: '🧚', cape: '🦸' }[v]));
  chips('#cHs', HAIRSTYLES, 'hairStyle', v => ({ short: '💇', buns: '🎀', long: '👩', ponytail: '🐴', spiky: '🦔' }[v]));
  let age = p.age || 'little';
  const ageBtns = () => m.querySelectorAll('.seg.age button').forEach(b => { b.classList.toggle('on', b.dataset.a === age); b.onclick = () => { age = b.dataset.a; ageBtns(); }; });
  ageBtns();
  let diff = p.difficulty || 'easy';
  const diffBtns = () => m.querySelectorAll('.seg.diff button').forEach(b => { b.classList.toggle('on', b.dataset.d === diff); b.onclick = () => { diff = b.dataset.d; diffBtns(); }; });
  diffBtns();
  chips('#cHair', HAIR, 'hair', v => `<span class="sw" style="background:${v}"></span>`);
  chips('#cSkin', SKIN, 'skin', v => `<span class="sw" style="background:${v}"></span>`);
  const finish = save => {
    if (save) {
      p.name = (m.querySelector('#nm').value.trim() || T('Explorer', 'Nhà thám hiểm')).slice(0, 16);
      if (img) {
        const o = document.createElement('canvas'); o.width = o.height = 400; const ox2 = o.getContext('2d');
        ox2.fillStyle = '#fff'; ox2.fillRect(0, 0, 400, 400);
        const s =Math.max(480 / img.width, 480 / img.height) * zoom, k = 400 / 410;
        ox2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
        p.photo = o.toDataURL('image/jpeg', .82);
      }
      Object.assign(p.look, look); p.age = age; p.difficulty = diff; saveProfiles(true);
    } else if (isNew) removeProfile(p.id);
    m.close(); after && after(p);
  };
  m.querySelector('#eSave').onclick = () => finish(true);
  m.querySelector('#eCancel').onclick = () => finish(false);
  const del = m.querySelector('#eDel');
  if (del) del.onclick = () => { if (profiles.length <= 1) return toast(T('Keep at least one player.', 'Cần giữ ít nhất một người chơi.')); if (confirm(T(`Remove ${p.name} and all their progress?`, `Xóa ${p.name} và toàn bộ tiến trình?`))) { removeProfile(p.id); m.close(); after && after(); } };
}

// ---------- NPC dialogue (BotW-style box with a name tag) ----------
// main.js fills these in so villagers' speech boxes get a "💬 Chat" button
export const dialogHooks = {};
export function dialog(name, lines, choices) {
  return new Promise(res => {
    const little = dialogHooks.little && dialogHooks.little();
    const d = el('div', 'dialog' + (little ? ' little' : ''), `<div class="dname">${esc(nm(name))}</div><div class="dtext"></div><div class="dchoices"></div><div class="dnext">▼</div>${little ? `<div class="dpics"><button class="dpic again" aria-label="${T('Hear it again', 'Nghe lại')}">🔁</button><button class="dpic ok" aria-label="${T('OK', 'Được')}">👍</button></div>` : ''}`);
    if (dialogHooks.canChat && dialogHooks.canChat(name)) {
      const ask = el('button', 'dask', '💬 ' + T('Chat', 'Trò chuyện')); d.appendChild(ask);
      ask.onclick = e => { e.stopPropagation(); SFX.tap(); close(-1); dialogHooks.chat(name); };
    }
    document.body.appendChild(d);
    let i = 0;
    const text = d.querySelector('.dtext'), ch = d.querySelector('.dchoices'), next = d.querySelector('.dnext');
    let show = () => {
      const [en, vi] = lines[i]; text.textContent = T(en, vi); setSpeaker(name); say(en, vi);
      const last = i === lines.length - 1;
      ch.innerHTML = ''; next.hidden = last && choices && choices.length;
      if (last && choices && choices.length) choices.forEach((c, k) => { const b = el('button', 'dch', labelArt(T(c[0], c[1]), esc)); b.onclick = e => { e.stopPropagation(); SFX.tap(); close(k); }; ch.appendChild(b); });
    };
    let closed = false;
    const close = k => { if (closed) return; closed = true; setSpeaker(null); d.classList.add('out'); setTimeout(() => d.remove(), 200); res(k); };
    // walking away closes the conversation by itself
    d._autoClose = () => close(-1); d._from = dialogHooks.where ? dialogHooks.where() : null;
    d.onclick = () => { if (choices && i === lines.length - 1 && choices.length) return; SFX.tap(); if (i < lines.length - 1) { i++; show(); } else close(-1); };
    if (little) {
      d.querySelector('.again').onclick = e => { e.stopPropagation(); SFX.tap(); const [en, vi] = lines[i]; setSpeaker(name); say(en, vi); };
      const ok = d.querySelector('.ok'); ok.onclick = e => { e.stopPropagation(); d.onclick(); };
      const upd = () => { ok.hidden = !!(choices && choices.length && i === lines.length - 1); }; const s0 = show; show = () => { s0(); upd(); };
    }
    show();
  });
}

// ---------- reward pop-up ----------
export function reward(big, line, sub) {
  confetti();
  const r = el('div', 'reward', `<div class="rbig">${big}</div><p>${esc(line)}</p>${sub ? `<small>${esc(sub)}</small>` : ''}`);
  document.body.appendChild(r); SFX.secret();
  return new Promise(res => { const go = () => { r.classList.add('out'); setTimeout(() => { r.remove(); res(); }, 250); }; r.onclick = go; setTimeout(go, 2600); });
}

// ---------- the Sparkle Pad ----------
export function openPad(game, i, tab) {
  tab = tab || 'map';
  const hero = game.heroes[i], p = hero.profile;
  const m = modal('pad', '');
  const card = m.querySelector('.card');
  const TABS = [['map', '🗺️', T('Map', 'Bản đồ')], ['bag', '🎒', T('Backpack', 'Ba lô')], ['log', '📜', T('Adventures', 'Nhiệm vụ')], ['album', '⭐', T('Album', 'Bộ sưu tập')], ['passport', '🛂', T('Passport', 'Hộ chiếu')], ['games', '🎲', T('Games', 'Trò chơi')], ['cam', '📷', T('Camera', 'Máy ảnh')]];
  if (game.mode === 'online' || game.mode === 'solo') TABS.push(['friend', '📞', T('Friend', 'Bạn bè')]);
  const draw = () => {
    const sl = card.querySelector('.pad-tabs') ? card.querySelector('.pad-tabs').scrollLeft : 0;
    card.innerHTML = `<div class="pad-head"><div class="pad-tabs">${TABS.map((t, k) => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}"><span>${pic(t[1])}</span><small>${t[2]}<kbd class="padkey">${k + 1}</kbd></small></button>`).join('')}</div><button class="x" aria-label="${T('Close', 'Đóng')}">✕<kbd class="padkey">Esc</kbd></button></div><div class="pad-body"></div>`;
    card.querySelector('.pad-tabs').scrollLeft = sl;
    card.querySelectorAll('.pad-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; SFX.tap(); draw(); });
    card.querySelector('.x').onclick = close;
    const body = card.querySelector('.pad-body');
    ({ map: drawMap, bag: drawBag, log: drawLog, album: drawAlbum, games: drawGames, cam: drawCam, friend: drawFriend, passport: b => game.drawPassport(b, hero) })[tab](body);
  };
  // computer keyboards: 1–8 pick a tab, ← → step through them, Esc closes
  const onKey = e => {
    if (!document.body.contains(m)) { removeEventListener('keydown', onKey, true); return; } // the pad was closed some other way
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    let k = -1; const cur = TABS.findIndex(t => t[0] === tab);
    if (/^Digit[1-9]$/.test(e.code)) k = +e.code.slice(5) - 1;
    else if (e.code === 'ArrowRight' || e.code === 'BracketRight') k = (cur + 1) % TABS.length;
    else if (e.code === 'ArrowLeft' || e.code === 'BracketLeft') k = (cur + TABS.length - 1) % TABS.length;
    if (k >= 0 && TABS[k]) { e.preventDefault(); e.stopImmediatePropagation(); tab = TABS[k][0]; SFX.tap(); draw(); }
  };
  addEventListener('keydown', onKey, true);
  const close = () => { removeEventListener('keydown', onKey, true); m.close(); game.closePad(i); };
  function drawMap(body) {
    const S = 600, cv = el('canvas', 'bigmap'); cv.width = cv.height = S; body.appendChild(cv);
    body.appendChild(el('p', 'note center', T('Tap any picture on the map, or a place below, to fly there.', 'Chạm vào bất kỳ hình nào trên bản đồ, hoặc một nơi bên dưới, để bay đến đó.')));
    // the places, grouped by country and listed from north to south, like a real map: one group at a time,
    // picked from chips (the full list was too long to scroll)
    const GROUPS = [['home', '🏡', T('Our valley', 'Thung lũng nhà mình')], ['vn', '🇻🇳', T('Vietnam', 'Việt Nam')], ['au', '🇦🇺', T('Australia', 'Nước Úc')], ['asia', '🌏', T('China and India', 'Trung Quốc và Ấn Độ')], ['homes', '🏠', T('Homes', 'Nhà')]];
    const named = game.homes ? game.homes.list.filter(hm => hm.H) : [];
    const itemsOf = g => g === 'homes' ? named.map(hm => ({ icon: '🏠', name: hm.name, go: () => game.landBy(hero, hm.door.x, hm.door.z) }))
      : game.PLACES.filter(pl => (pl.g || 'home') === g).sort((a, b) => a.z - b.z).map(pl => ({ icon: pl.icon, name: pl.name, go: () => game.travelTo(hero, pl.x, pl.z) }));
    const groups = GROUPS.filter(([g]) => itemsOf(g).length);
    let gsel = groups.find(([g]) => g === openPad.mapLast) ? openPad.mapLast : groups[0][0];
    const chips = el('div', 'hubtabs mapchips'), list = el('div', 'quick');
    groups.forEach(([g, gi, gname]) => { const c = el('button', '', `<span>${pic(gi)}</span><small>${esc(gname)}</small>`); c.dataset.g = g; c.onclick = () => { gsel = openPad.mapLast = g; SFX.tap(); fill(); }; chips.appendChild(c); });
    const fill = () => {
      chips.querySelectorAll('button').forEach(c => c.classList.toggle('on', c.dataset.g === gsel)); list.innerHTML = '';
      itemsOf(gsel).forEach(it => { const b = el('button', 'qbtn', `<span>${pic(it.icon)}</span><small>${esc(it.name())}</small>`); b.onclick = () => { close(); it.go(); }; list.appendChild(b); });
    };
    body.appendChild(chips); body.appendChild(list); fill();
    const quick = el('div', 'quick'); const ch = el('button', 'qbtn change', `<span>🔄</span><small>${T('Change player', 'Đổi người chơi')}</small>`); ch.onclick = () => { close(); game.changePlayer(); }; quick.appendChild(ch);
    body.appendChild(quick);
    const x = cv.getContext('2d'); x.drawImage(game.fogMapFor(p), 0, 0, S, S);
    const k = S / SIZE, pt = (wx, wz) => [(wx + HALF) * k, (wz + HALF) * k];
    const spots = [];
    const icon = (ch, wx, wz, sz = 26) => { const [a, b] = pt(wx, wz); x.font = sz + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, a, b); };
    SHRINES.forEach(s => { const done = p.shrines[s.id]; const [a, b] = pt(s.x, s.z); x.fillStyle = done ? '#38c8f0' : '#ff8a2a'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 11, 0, Math.PI * 2); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(done ? '✓' : '?', a, b + 1); spots.push({ x: s.x, z: s.z, name: GAMES[s.game] ? GAMES[s.game].name() : '' }); });
    TOWERS.forEach(t => { icon('🗼', t.x, t.z, 28); spots.push({ x: t.x, z: t.z, name: t.name() }); });
    // every main place, with a picture and its name
    game.PLACES.forEach(pl => {
      const [a, b] = pt(pl.x, pl.z); x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.arc(a, b, 22, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#ffb020'; x.lineWidth = 3; x.stroke();
      icon(pl.icon, pl.x, pl.z, 26);
      x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif'; const w = x.measureText(pl.name()).width + 12; x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(a - w / 2, b + 24, w, 20); x.fillStyle = '#3b2558'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(pl.name(), a, b + 34);
      spots.push({ x: pl.x, z: pl.z, name: pl.name(), r: 14 });
    });
    // every ferry and raft stop (tap one to go there and wait for the boat)
    if (game.ferries) game.ferries.ferries.forEach(F => F.stops.forEach(st => { const t = st.dock.pier.tip; icon('⛴️', t.x, t.z, 16); spots.push({ x: t.x, z: t.z, name: '⛴️ ' + st.name(), r: 10 }); }));
    const q = game.questTarget(hero); if (q) { const [a, b] = pt(q.x, q.z); x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(a, b - 14, 9, 0, Math.PI * 2); x.moveTo(a - 7, b - 9); x.lineTo(a, b); x.lineTo(a + 7, b - 9); x.fill(); }
    game.heroes.forEach((h, j) => { const [a, b] = pt(h.pos.x, h.pos.z); x.save(); x.translate(a, b); x.rotate(-h.yaw + Math.PI); x.fillStyle = j === 0 ? '#ffd23f' : '#5fe0ff'; x.strokeStyle = '#3a2a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.fill(); x.stroke(); x.restore(); });
    // every friend online, with their name (tap them to walk, fly or ask them to come)
    Object.values(game.partners || {}).forEach(P => {
      if (P.pos.y < -40) return; const [a, b] = pt(P.pos.x, P.pos.z);
      x.fillStyle = '#2fa8ff'; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(a, b, 13, 0, Math.PI * 2); x.fill(); x.stroke();
      icon('🧒', P.pos.x, P.pos.z, 18);
      x.font = 'bold 14px Fredoka, "Baloo 2", sans-serif'; const w = x.measureText(P.name).width + 12; x.fillStyle = '#2fa8ff'; x.fillRect(a - w / 2, b - 36, w, 20); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(P.name, a, b - 26);
      spots.push({ x: P.pos.x, z: P.pos.z, name: P.name, r: 16, friend: P.id });
    });
    cv.onclick = e => {
      const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left) / r.width * SIZE - HALF, wz = (e.clientY - r.top) / r.height * SIZE - HALF;
      const s = spots.slice().sort((a, b) => Math.hypot(a.x - wx, a.z - wz) - Math.hypot(b.x - wx, b.z - wz)).find(s => Math.hypot(s.x - wx, s.z - wz) < (s.r || 10)); if (!s) return;
      const ok = el('div', 'travel', `<p>${T('Travel to', 'Bay đến')} <b>${esc(s.name)}</b>?</p><button class="btn primary">✨ ${T('Fly there', 'Bay đến đó')}</button><button class="btn walk">👣 ${T('Walk there', 'Đi bộ đến đó')}</button><button class="btn no">${T('No', 'Không')}</button>`);
      body.appendChild(ok);
      if (s.friend) {
        ok.querySelector('.primary').onclick = () => { close(); game.flyToFriend(hero, s.friend); };
        ok.querySelector('.walk').onclick = () => { close(); game.walkToFriend(hero, s.friend); };
        const c = el('button', 'btn', '📣 ' + T('Ask to come', 'Gọi bạn đến')); c.onclick = () => { close(); game.askFriendToCome(hero, s.friend); }; ok.insertBefore(c, ok.querySelector('.no'));
        ok.querySelector('.no').onclick = () => ok.remove(); return;
      }
      ok.querySelector('.primary').onclick = () => { close(); game.travelTo(hero, s.x, s.z); };
      ok.querySelector('.walk').onclick = () => { close(); hero.walkTo = { x: s.x, z: s.z, name: s.name }; say(`Follow the footprints to ${s.name}!`, `Đi theo dấu chân đến ${s.name} nhé!`); };
      ok.querySelector('.no').onclick = () => ok.remove();
    };
  }
  let sellPick = null; // a treasure tapped once in the bag: tap again to sell it
  function drawBag(body) {
    const isGem = id => WILD[id] && WILD[id].kind === 'gem';
    const items = Object.entries(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && !isGem(id)), gems = Object.entries(p.inv).filter(([id, n]) => n > 0 && isGem(id)).sort((a, b) => WILD[b[0]].sell - WILD[a[0]].sell);
    const bought = Object.entries(p.bought || {}).filter(([id, n]) => n > 0 && snackOf(id));
    const dishes = Object.entries(p.dishes).filter(([, n]) => n > 0);
    body.innerHTML = `
      <button class="btn wide" id="bagPets">🐾 ${T('My pets', 'Thú cưng của con')}: ${(p.pets || []).map(pt => (PET_ICON[pt.kind] || '🐾') + ' ' + esc(pt.name || '')).join('  ')}</button>
      <div class="bag-top"><span class="chip">💰 ${fmt(farm.coins)}</span><span class="chip">🔮 ${p.orbs} ${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}</span><span class="chip">🍃 ${Object.keys(p.leafies).length}/24 Leafies</span></div>
      <h3>${T('Food', 'Món ăn')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${dishes.map(([id, n]) => { const r = dishInfo(id) || { icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn') }; return `<button class="slot" data-eat="${id}" title="${esc(r.name())}"><span>${r.icon}</span><b>${n}</b><small>${esc(r.name())}</small></button>`; }).join('') || `<p class="note">${T('Cook at a cooking pot to make food.', 'Nấu ăn ở nồi nấu để có món ăn.')}</p>`}</div>
      <h3>🛍️ ${T('From shops and stalls', 'Mua ở quán và sạp')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${bought.map(([id, n]) => { const v = snackOf(id); return `<button class="slot" data-snack="${id}" title="${esc(T(v.food[1], v.food[2]))}"><span>${v.food[0]}</span><b>${n}</b><small>${esc(T(v.food[1], v.food[2]))}</small></button>`; }).join('') || `<p class="note">${T('Buy food at kiosks, market stalls and from street sellers. It goes in here!', 'Mua đồ ăn ở quán, sạp chợ và các cô gánh hàng rong. Đồ mua sẽ nằm ở đây!')}</p>`}</div>
      <h3>💎 ${T('Treasures', 'Báu vật')} <small>${T('tap twice to sell', 'chạm 2 lần để bán')}</small></h3>
      <div class="slots">${gems.map(([id, n]) => `<button class="slot gemslot ${sellPick === id ? 'on' : ''}" data-sellgem="${id}"><span>${WILD[id].icon}</span><b>${n}</b><small>${sellPick === id ? '💰 ' + T('Sell', 'Bán') + ' ' + fmt(WILD[id].sell) + '?' : esc(WILD[id].name()) + ' · ' + fmt(WILD[id].sell)}</small></button>`).join('') || `<p class="note">${T('Dig at the sparkly mounds of earth and crack rocks open to find treasures!', 'Đào ở những ụ đất lấp lánh và gõ vỡ hòn đá để tìm báu vật!')}</p>`}</div>
      <h3>${T('Ingredients', 'Nguyên liệu')}</h3>
      <div class="slots">${items.map(([id, n]) => `<div class="slot"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></div>`).join('') || `<p class="note">${T('Empty! Shake apple trees and look for herbs and mushrooms.', 'Trống trơn! Rung cây táo và tìm rau thơm, nấm nhé.')}</p>`}</div>
      <h3>${T('Hats', 'Mũ')} <small>${T('tap to wear', 'chạm để đội')}</small></h3>
      <div class="slots">${HATS.concat(REWARD_HATS.filter(h => p.owned.hats.includes(h))).map(h => `<button class="slot ${p.look.hat === h ? 'on' : ''}" data-hat="${h}"><span>${HAT_ICON[h]}</span><small>${esc(HAT_NAME[h]())}</small></button>`).join('')}</div>
      <h3>🪁 ${T('Whistling kite', 'Diều sáo')}</h3>
      <div class="slots">${p.kite ? `<button class="slot ${p.kiteOn !== false ? 'on' : ''}" data-kite="1"><span>🪁</span><small>${p.kiteOn !== false ? T('Flying', 'Đang bay') : T('Put away', 'Cất đi')}</small></button><button class="slot" data-whistle="1"><span>🎶</span><small>${T('Whistle!', 'Thổi sáo!')}</small></button>` : `<p class="note">${T('Win the Kite Flying game to get a kite with a bamboo flute that sings in the wind!', 'Thắng trò Thả Diều để nhận diều sáo hát vi vu trong gió!')}</p>`}</div>
      <h3>${T('Glider', 'Cánh lượn')}</h3>
      <div class="slots">${p.glider ? p.owned.gliders.map(g => `<button class="slot ${p.look.glider === g ? 'on' : ''}" data-gl="${g}"><span class="sw big" style="background:${GLIDERS[g]}"></span></button>`).join('') : `<p class="note">${T('Not yet! Ông Cú has something for you…', 'Chưa có! Ông Cú có món quà cho con đấy…')}</p>`}</div>`;
    jumpNav(body, body.querySelector('.bag-top'));
    body.querySelectorAll('[data-eat]').forEach(b => b.onclick = () => { game.eat(hero, b.dataset.eat); draw(); });
    body.querySelectorAll('[data-snack]').forEach(b => b.onclick = () => { eatSnack(game, hero, b.dataset.snack, true); draw(); });
    body.querySelectorAll('[data-sellgem]').forEach(b => b.onclick = () => {
      const id = b.dataset.sellgem, w = WILD[id];
      if (sellPick !== id) { sellPick = id; SFX.tap(); say(`${w.name()}: ${money(w.sell)}. Tap again to sell it.`, `${w.name()}: ${money(w.sell)}. Chạm lần nữa để bán nhé.`); draw(); return; }
      sellPick = null; p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; farm.coins += w.sell; saveFarm(); game.save(); SFX.coin();
      say(`Sold! Now you have ${money(farm.coins)}.`, `Bán rồi! Giờ con có ${money(farm.coins)}.`); game.job && game.job('sell', 1, hero); draw();
    });
    body.querySelector('#bagPets').onclick = () => { m.close(); game.closePad(i); setTimeout(() => game.pets.openAdopt(hero), 220); };
    body.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { p.look.hat = b.dataset.hat; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
    body.querySelectorAll('[data-kite]').forEach(b => b.onclick = () => { p.kiteOn = p.kiteOn === false; saveProfiles(); game.kites.sync(); SFX.ok(); if (p.kiteOn) game.kites.whistle(hero); draw(); });
    body.querySelectorAll('[data-whistle]').forEach(b => b.onclick = () => { game.kites.whistle(hero); });
    body.querySelectorAll('[data-gl]').forEach(b => b.onclick = () => { p.look.glider = +b.dataset.gl; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
  }
  function drawLog(body) {
    const next = game.currentQuest(p);
    body.innerHTML = `<h3>${T('Main adventure', 'Cuộc phiêu lưu chính')}</h3><ol class="quests">${QUESTS.map(q => { const done = !!p.quests[q.id] || (q.check && q.check(p)); return `<li class="${done ? 'done' : q === next ? 'now' : ''}"><span>${done ? '✅' : q.icon}</span>${esc(q.title())}</li>`; }).join('')}</ol>
      <p class="note">✨ ${T('Shrines solved', 'Đền đã giải')}: ${Object.keys(p.shrines).length}/12 · 🗼 ${T('Towers', 'Tháp')}: ${Object.keys(p.towers).length}/4 · 🍳 ${T('Recipes', 'Công thức')}: ${Object.keys(p.dishes).length}/${RECIPES.length}</p>
      <h3>${T('Recipe book', 'Sổ công thức')}</h3><div class="recipes">${RECIPES.map(r => { const known = p.dishes[r.id] != null; return `<div class="rec ${known ? '' : 'unk'}"><span>${known ? r.icon : '❔'}</span><small>${known ? esc(r.name()) : r.need.map((n, k) => k === 0 ? ITEMS[n].icon : '❔').join(' + ')}</small></div>`; }).join('')}</div>`;
  }
  function drawAlbum(body) {
    const sec = p.secrets || {};
    const pcs = p.postcards || {}, tasted = p.tasted || {}, words = Object.keys(p.words || {});
    const fd = p.found || {}, wk = Object.keys(WILD);
    const treasures = `<h3>💎 ${T('My treasures', 'Báu vật của con')} ${wk.filter(k => fd[k]).length}/${wk.length}</h3><div class="secrets">${wk.map(k => fd[k] ? `<div class="sec on"><span>${WILD[k].icon}</span><small>${esc(WILD[k].name())} ×${fd[k]}</small></div>` : `<div class="sec"><span>❔</span><small>${T({ fruit: 'Wild fruit', flower: 'Wild flower', gem: 'Inside a rock' }[WILD[k].kind], { fruit: 'Quả dại', flower: 'Hoa dại', gem: 'Trong hòn đá' }[WILD[k].kind])}</small></div>`).join('')}</div>
      <p class="note">${T('Pick fruit and flowers in the meadows and bamboo forest. Tap a rock 3 times to crack it open, or dig 3 times at a sparkly mound of earth: the rarest gems are worth the most! Sell treasures from your bag or to Mr. Bear at the farm.', 'Hái quả và hoa ở đồng cỏ và rừng tre. Gõ hòn đá 3 lần để mở nó ra, hoặc đào 3 lần ở ụ đất lấp lánh: đá quý càng hiếm càng đáng giá! Bán báu vật ngay trong túi hoặc cho Bác Gấu ở nông trại.')}</p>`;
    body.innerHTML = `<button class="btn wide big" id="scrapBtn">📒 ${T('My scrapbook: decorate with stickers and photos', 'Sổ dán hình: trang trí bằng hình dán và ảnh')}</button>` + treasures + `<h3>📮 ${T('Postcards', 'Bưu thiếp')} ${Object.keys(pcs).length}/${LANDMARKS.length}</h3><div class="secrets">${LANDMARKS.map(l => pcs[l.id] ? `<button class="sec on" data-pcfact="${l.id}"><span>${l.icon}</span><small>${esc(l.name())}</small></button>` : `<button class="sec" data-fly="${l.id}"><span>❔</span><small>✈️ ${esc(l.name())}</small></button>`).join('')}</div>
      <h3>🍜 ${T('Food passport', 'Hộ chiếu ẩm thực')} ${Object.keys(tasted).length}/${VENDORS.length}</h3><div class="secrets">${VENDORS.map(v => `<div class="sec ${tasted[v.id] ? 'on' : ''}"><span>${tasted[v.id] ? v.food[0] : '❔'}</span><small>${tasted[v.id] ? esc(T(v.food[1], v.food[2])) : esc(v.name)}</small></div>`).join('')}</div>
      <h3>🗣️ ${T('Words I learned', 'Từ con đã học')} ${words.length}</h3><div class="wordlist">${words.map(k => { const [kind, w] = [k.slice(0, 2), k.slice(3)]; if (kind === 'au') { const s = AUSSIE_SLANG.find(x => x[0] === w); return s ? `<span>🇦🇺 <b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}</span>` : ''; } if (kind === 'vs') { const s = VN_SLANG.find(x => x[0] === w); return s ? `<span>🇻🇳 <b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}</span>` : ''; } const v = VN_WORDS.find(x => x[1] === w); return v ? `<span>🇻🇳 ${v[0]} Bắc <b>${esc(v[2])}</b> · Trung <b>${esc(v[3])}</b> · Nam <b>${esc(v[4])}</b></span>` : ''; }).join('') || `<p class="note">${T('Ask the market sellers and the Aussie shopkeepers to teach you a word!', 'Hỏi các cô chú bán hàng ở chợ và ở Góc Nước Úc để học từ mới nhé!')}</p>`}</div>
      <h3>🤫 ${T('Secrets', 'Bí mật')} ${Object.keys(sec).length}/${SECRETS.length}</h3><div class="secrets">${SECRETS.map(s => sec[s.id] ? `<div class="sec on"><span>${s.icon}</span><small>${esc(s.name())}</small></div>` : `<button class="sec" data-hint="${esc(s.hint())}"><span>❔</span><small>${T('Tap for a clue', 'Chạm để nghe gợi ý')}</small></button>`).join('')}</div>
      <h3>📖 ${T('Storybook', 'Sách truyện')}</h3><div class="stories">${storyList(p).map((st, k) => `<button class="qbtn" data-st="${k}"><span>📖</span><small>${esc(st.title())}</small></button>`).join('')}</div>
      <h3>${T('Stickers', 'Hình dán')} ${p.stickers.length}/${STICKERS.length}</h3><div class="stickers">${STICKERS.map(s => `<div class="${p.stickers.includes(s) ? '' : 'miss'}">${p.stickers.includes(s) ? s : '?'}</div>`).join('')}</div>
      <h3>${T('Photos', 'Ảnh chụp')}</h3><div class="photos">${p.album.map((src, k) => `<figure><img src="${src}" alt=""><button class="btn" data-dl="${k}">⬇</button></figure>`).join('') || `<p class="note">${T('Use the Camera tab to take pictures of your adventure!', 'Dùng thẻ Máy ảnh để chụp ảnh chuyến phiêu lưu!')}</p>`}</div>`;
    body.querySelectorAll('[data-hint]').forEach(b => b.onclick = () => { say(b.dataset.hint, b.dataset.hint); toast(b.dataset.hint); });
    body.querySelector('#scrapBtn').onclick = () => { m.close(); game.closePad(i); setTimeout(() => game.openScrapbook(hero), 220); };
    body.querySelectorAll('[data-st]').forEach(b => b.onclick = () => showStory(storyList(p)[+b.dataset.st], p.name));
    body.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { const l = LANDMARKS.find(x => x.id === b.dataset.fly); close(); game.travel(hero, l.x, l.z + (l.id === 'uluru' ? -4 : 3)); });
    body.querySelectorAll('[data-pcfact]').forEach(b => b.onclick = () => { const l = LANDMARKS.find(x => x.id === b.dataset.pcfact); say(l.fact[0], l.fact[1]); toast(T(l.fact[0], l.fact[1])); });
    body.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => savePhoto(p.album[+b.dataset.dl]));
  }
  function drawGames(body) {
    body.innerHTML = `<p class="note">${T('Play any game you have already found again. Every win makes the next one a little harder.', 'Chơi lại các trò con đã tìm thấy. Mỗi lần thắng, trò chơi sẽ khó hơn một chút.')}</p><div class="gamelist"></div>`;
    const list = body.querySelector('.gamelist');
    const found = new Set([...SHRINES.filter(s => p.shrines[s.id]).map(s => s.game), ...Object.keys(p.levels)]);
    Object.values(GAMES).forEach(g => {
      const ok = found.has(g.id);
      const b = el('button', 'gcard' + (ok ? '' : ' locked'), `<span>${ok ? g.icon : '🔒'}</span><b>${esc(ok ? g.name() : '???')}</b>${ok ? `<small>${T('Level', 'Cấp')} ${p.levels[g.id] || 1}</small>` : ''}`);
      if (ok) b.onclick = () => { close(); game.playGame(i, g.id, 'replay'); };
      list.appendChild(b);
    });
  }
  // a photo into the device's own Photos (js/photos.js): iPhone/iPad through the share sheet ("Save Image"),
  // Android and computers as a download
  async function savePhoto(src) {
    const how = await saveToDevice(src);
    if (how === 'downloaded') toast(T('Saved to the phone: look in Photos or Gallery (Downloads).', 'Đã lưu vào máy: xem trong Ảnh hoặc Thư viện (Tải về).'));
    if (how === 'failed') toast(T('Could not save the picture on this device.', 'Không lưu được ảnh trên máy này.'));
  }
  function drawCam(body) {
    const howTo = savesByShare() ? T('Then tap “Save to my photos” and choose “Save Image”.', 'Rồi chạm “Lưu vào ảnh của máy” và chọn “Lưu hình ảnh”.') : T('Then tap “Save to my photos”.', 'Rồi chạm “Lưu vào ảnh của máy”.');
    body.innerHTML = `<div class="cam-prev"></div><div class="actions center"><button class="btn primary big" id="snap">📷 ${T('Take picture', 'Chụp ảnh')}</button><button class="btn big" id="toPhone" hidden>📲 ${T('Save to my photos', 'Lưu vào ảnh của máy')}</button></div><p class="note center">${T('Pictures are kept in your Album.', 'Ảnh được giữ trong Bộ sưu tập.')} ${howTo}</p>`;
    let big = null;
    body.querySelector('#snap').onclick = async () => {
      m.style.visibility = 'hidden'; await wait(60);
      const shot = game.snapshot(i); big = game.snapshot(i, 1600, .9); m.style.visibility = '';
      SFX.chime();
      body.querySelector('.cam-prev').innerHTML = `<img src="${shot}" alt="">`;
      body.querySelector('#toPhone').hidden = false;
      p.album.push(shot); if (p.album.length > 12) p.album.shift(); saveProfiles();
      say('Click! What a lovely picture!', 'Tách! Bức ảnh đẹp quá!');
    };
    body.querySelector('#toPhone').onclick = () => { if (big) { SFX.tap(); savePhoto(big); } };
  }
  function drawFriend(body) { game.drawOnlinePanel(body, () => draw()); }
  draw();
  return { close };
}

// ---------- cooking ----------
export function openCooking(game, i) {
  const hero = game.heroes[i], p = hero.profile;
  const m = modal('cook', '');
  const card = m.querySelector('.card');
  const pot = [];
  const draw = () => {
    const have = Object.entries(p.inv).map(([id, n]) => [id, n - pot.filter(x => x === id).length]).filter(([, n]) => n > 0);
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🍲 ${T('Cooking pot', 'Nồi nấu ăn')}</h2>
      <p class="sub">${T('Put up to 3 things in the pot. Try different mixes to discover Vietnamese dishes!', 'Cho tối đa 3 thứ vào nồi. Thử trộn khác nhau để khám phá món ăn Việt Nam!')}</p>
      <div class="potbox">${[0, 1, 2].map(k => `<button class="pslot" data-k="${k}">${pot[k] ? ITEMS[pot[k]].icon : ''}</button>`).join('')}</div>
      <div class="slots">${have.map(([id, n]) => `<button class="slot" data-add="${id}"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></button>`).join('') || `<p class="note">${T('Your backpack is empty. Find ingredients or buy them from Cô Mai.', 'Ba lô trống rồi. Tìm nguyên liệu hoặc mua ở chỗ Cô Mai nhé.')}</p>`}</div>
      <button class="btn primary wide big" id="cookGo" ${pot.length ? '' : 'disabled'}>🔥 ${T('Cook!', 'Nấu!')}</button>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { if (pot.length < 3) { pot.push(b.dataset.add); SFX.pop(pot.length); draw(); } });
    card.querySelectorAll('.pslot').forEach(b => b.onclick = () => { pot.splice(+b.dataset.k, 1); draw(); });
    card.querySelector('#cookGo').onclick = async () => {
      const r = findRecipe(pot); if (!r) return;
      pot.forEach(id => { p.inv[id]--; if (p.inv[id] <= 0) delete p.inv[id]; });
      const isNew = p.dishes[r.id] == null;
      p.dishes[r.id] = (p.dishes[r.id] || 0) + 1; pot.length = 0; saveProfiles();
      card.innerHTML = `<div class="cooking"><div class="steam">♨️</div><div class="potbig">🍲</div></div>`; SFX.cook();
      await wait(1800); m.close();
      await reward(r.icon, T(`You made ${r.name()}!`, `Con đã nấu ${r.name()}!`), isNew ? T('New recipe! It is in your Backpack.', 'Công thức mới! Món ăn ở trong Ba lô.') : '');
      say(`Yum! ${r.name()}!`, `Ngon quá! ${r.name()}!`);
      game.onCooked(hero, r);
    };
  };
  draw();
}

// ---------- shop ----------
export function openShop(game, i) {
  const hero = game.heroes[i], p = hero.profile;
  const m = modal('shop', '');
  const card = m.querySelector('.card');
  const draw = () => {
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🛒 ${T("Cô Mai's stall", 'Sạp hàng Cô Mai')}</h2>
      <p class="sub">💰 ${T('You have', 'Con có')} <b>${fmt(farm.coins)}</b> ${cur().flag}</p>
      <div class="shoplist">${SHOP.map((s, k) => {
        const owned = s.kind === 'hat' ? p.owned.hats.includes(s.id) : s.kind === 'glider' ? p.owned.gliders.includes(s.id) : false;
        const ic = s.kind === 'item' ? ITEMS[s.id].icon : s.kind === 'hat' ? HAT_ICON[s.id] : `<span class="sw big" style="background:${GLIDERS[s.id]}"></span>`;
        const nm = s.kind === 'item' ? ITEMS[s.id].name() : s.kind === 'hat' ? HAT_NAME[s.id]() : T('Glider colour', 'Màu cánh lượn');
        return `<button class="sitem ${owned ? 'owned' : ''} ${farm.coins < s.price && !owned ? 'poor' : ''}" data-k="${k}"><span class="si">${ic}</span><small>${esc(nm)}</small><b>${owned ? '✓' : fmt(s.price)}</b></button>`;
      }).join('')}</div>`;
    card.querySelector('.x').onclick = () => m.close();
    card.querySelectorAll('.sitem').forEach(b => b.onclick = () => {
      const s = SHOP[+b.dataset.k];
      const owned = s.kind === 'hat' ? p.owned.hats.includes(s.id) : s.kind === 'glider' ? p.owned.gliders.includes(s.id) : false;
      if (owned) return;
      if (s.kind === 'glider' && !p.glider) { say('You need a glider first!', 'Con cần có cánh lượn trước đã!'); return; }
      if (farm.coins < s.price) { SFX.no(); say(`That costs ${fmt(s.price)}. Play games to earn more money!`, `Món này giá ${fmt(s.price)}. Chơi trò chơi để có thêm tiền nhé!`); return; }
      farm.coins -= s.price; SFX.coin();
      if (s.kind === 'item') p.inv[s.id] = (p.inv[s.id] || 0) + 1;
      if (s.kind === 'hat') { p.owned.hats.push(s.id); p.look.hat = s.id; game.rebuildHero(i); }
      if (s.kind === 'glider') { p.owned.gliders.push(s.id); p.look.glider = s.id; game.rebuildHero(i); }
      saveProfiles(); say('Thank you! Here you go!', 'Cảm ơn con! Của con đây!'); draw();
    });
  };
  draw();
}


// ---------- wardrobe (for the children: pictures only, changes show live on the character) ----------
export function openWardrobe(game, i, onClose) {
  const p = game.heroes[i].profile;
  const m = el('div', 'wardrobe');
  document.body.appendChild(m);
  const rows = [
    ['style', STYLES, v => STYLE_ICON[v]], ['color', OUTFIT_COLORS, v => `<span class="sw big" style="background:${v}"></span>`],
    ['hat', HATS, v => HAT_ICON[v]], ['back', BACKS, v => ({ none: '🙂', wings: '🧚', cape: '🦸' }[v])],
    ['hairStyle', HAIRSTYLES, v => ({ short: '💇', buns: '🎀', long: '👩', ponytail: '🐴', spiky: '🦔' }[v])], ['hair', HAIR, v => `<span class="sw big" style="background:${v}"></span>`]
  ];
  const draw = () => {
    m.innerHTML = `<button class="x" aria-label="${T('Done', 'Xong')}">✔️</button>` + rows.map(([k, list, r]) => `<div class="wrow">${list.map(v => `<button class="chip ${p.look[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${r(v)}</button>`).join('')}</div>`).join('');
    m.querySelector('.x').onclick = () => { m.remove(); saveProfiles(); SFX.chime(); say('You look wonderful!', 'Con trông tuyệt quá!'); onClose && onClose(); };
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { p.look[b.dataset.k] = b.dataset.v; SFX.pop(1); game.rebuildHero(i); draw(); });
  };
  draw(); say('Dress up time! Tap the pictures to try things on.', 'Thay đồ nào! Chạm vào hình để thử nhé.');
}

// ---------- grown-ups record the game's most-used lines (one at a time, with a level meter) ----------
const MIC_HELP = {
  insecure: () => T('The microphone only works when the game is opened from a secure https:// address (your Netlify or GitHub Pages link). It does not work when the file is opened straight from a folder.', 'Micrô chỉ hoạt động khi mở trò chơi từ địa chỉ an toàn https:// (đường dẫn Netlify hoặc GitHub Pages). Micrô không hoạt động khi mở tệp trực tiếp từ thư mục.'),
  nomedia: () => T('This browser cannot use the microphone. On iPhone use Safari (iOS 14.3 or newer); on Android use Chrome.', 'Trình duyệt này không dùng được micrô. Trên iPhone hãy dùng Safari (iOS 14.3 trở lên); trên Android hãy dùng Chrome.'),
  denied: () => T('Microphone permission was blocked. iPhone: Settings → Safari → Microphone → Allow (or tap "aA" in the address bar → Website Settings). Android: tap the lock icon by the address → Permissions → Microphone → Allow. Then try again.', 'Quyền dùng micrô đang bị chặn. iPhone: Cài đặt → Safari → Micrô → Cho phép (hoặc chạm "aA" trên thanh địa chỉ → Cài đặt trang web). Android: chạm biểu tượng ổ khóa cạnh địa chỉ → Quyền → Micrô → Cho phép. Rồi thử lại.'),
  nomic: () => T('No microphone was found on this device.', 'Không tìm thấy micrô trên thiết bị này.'),
  other: () => T('The microphone could not start. Close other apps that use it (calls, video) and try again.', 'Không mở được micrô. Hãy đóng các ứng dụng khác đang dùng micrô (gọi điện, video) rồi thử lại.')
};
export function openRecorder(after) {
  const m = modal('rec', ''), card = m.querySelector('.card');
  let idx = Math.max(0, FAMILY_PHRASES.findIndex(p => !hasClip(settings.lang, p.id)));
  let live = null, err = micProblem(), busy = false;
  const L = () => settings.lang;
  const close = () => { if (live) live.stop(); releaseMic(); m.close(); after && after(); };
  const draw = () => {
    const ph = FAMILY_PHRASES[idx], has = hasClip(L(), ph.id), done = FAMILY_PHRASES.filter(p => hasClip(L(), p.id)).length;
    const keep = card.querySelector('.rec-body') ? card.querySelector('.rec-body').scrollTop : 0;
    card.innerHTML = `<div class="rec-head"><h2>🎙️ ${T('Family voice', 'Giọng của gia đình')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div><div class="rec-body">
      <p class="sub">${T('Read each line in a happy voice. The game will say these lines in your own voice.', 'Đọc từng câu bằng giọng vui vẻ. Trò chơi sẽ nói những câu này bằng chính giọng của bạn.')}</p>
      ${flagBtns()}
      ${err ? `<div class="warn">⚠️ ${esc(MIC_HELP[err] ? MIC_HELP[err]() : err)}</div>` : ''}
      <div class="recbig ${live ? 'live' : ''}">
        <div class="rec-n">${T('Line', 'Câu')} ${idx + 1} / ${FAMILY_PHRASES.length} ${has ? '✅' : ''}</div>
        <div class="rec-line">“${esc(L() === 'vi' ? ph.vi : ph.en)}”</div>
        <button class="micbtn" aria-label="${T('Record', 'Thu âm')}">${live ? '⏹' : '🎙️'}</button>
        <div class="rec-hint">${live ? T('Listening… read the line now. Tap to stop.', 'Đang nghe… đọc câu này ngay. Chạm để dừng.') : busy ? T('Saving…', 'Đang lưu…') : T('Tap the microphone, then read the line', 'Chạm vào micrô rồi đọc câu này')}</div>
        <div class="meter"><i></i></div>
        <div class="actions center">
          <button class="btn" id="rPrev" ${idx === 0 ? 'disabled' : ''}>◀ ${T('Back', 'Trước')}</button>
          ${has ? `<button class="btn" id="rPlay">▶ ${T('Listen', 'Nghe lại')}</button><button class="btn danger" id="rDel">✕</button>` : ''}
          <button class="btn primary" id="rNext" ${idx === FAMILY_PHRASES.length - 1 ? 'disabled' : ''}>${T('Next', 'Câu tiếp')} ▶</button>
        </div>
      </div>
      <div class="recdots">${FAMILY_PHRASES.map((p, k) => `<button class="${hasClip(L(), p.id) ? 'has' : ''} ${k === idx ? 'on' : ''}" data-k="${k}" aria-label="${k + 1}">${k + 1}</button>`).join('')}</div>
      <p class="note">${L() === 'vi' ? '🇻🇳 Tiếng Việt' : '🇦🇺 English'}: ${done}/${FAMILY_PHRASES.length} ${T('recorded', 'câu đã thu')} · ${L() === 'vi' ? '🇦🇺 English' : '🇻🇳 Tiếng Việt'}: ${clipCountFor(L() === 'vi' ? 'en' : 'vi')}/${FAMILY_PHRASES.length}${settings.familyPitch ? ' · ' + T('device voice tuned to your pitch', 'giọng máy đã chỉnh theo cao độ của bạn') : ''}</p>
      <label class="tog"><input type="checkbox" id="rUse" ${settings.familyVoice ? 'checked' : ''}> ${T('Use my recordings in the game', 'Dùng giọng thu của tôi trong trò chơi')}</label>
      <p class="note">${T('Recordings stay on this device and are never uploaded. Lines you have not recorded are read by the device voice, tuned to sound closer to yours.', 'Bản thu chỉ lưu trên máy này và không bao giờ được tải lên. Những câu chưa thu sẽ do giọng của máy đọc, được chỉnh cho gần với giọng bạn.')}</p></div>
      <div class="rec-foot"><button class="btn primary big" id="rSave">💾 ${T('Save and close', 'Lưu và đóng')}</button></div>`;
    card.querySelector('.rec-body').scrollTop = keep;
    card.querySelector('.x').onclick = close;
    // recordings are saved as each line is recorded; this saves the settings and closes
    card.querySelector('#rSave').onclick = () => { saveSettings(); SFX.chime && SFX.chime(); toast(T('Saved! The game will use your voice.', 'Đã lưu! Trò chơi sẽ dùng giọng của bạn.')); close(); };
    bindLang(card, () => { idx = Math.max(0, FAMILY_PHRASES.findIndex(p => !hasClip(L(), p.id))); draw(); });
    card.querySelector('#rUse').onchange = e => { settings.familyVoice = e.target.checked; saveSettings(); };
    card.querySelector('#rPrev').onclick = () => { if (!live) { idx--; draw(); } };
    card.querySelector('#rNext').onclick = () => { if (!live) { idx++; draw(); } };
    card.querySelectorAll('.recdots [data-k]').forEach(b => b.onclick = () => { if (!live) { idx = +b.dataset.k; draw(); } });
    const play = card.querySelector('#rPlay'); if (play) play.onclick = () => playClip(L(), ph.id);
    const del = card.querySelector('#rDel'); if (del) del.onclick = async () => { await deleteClip(L(), ph.id); draw(); };
    card.querySelector('.micbtn').onclick = async () => {
      if (busy) return;
      if (live) { live.stop(); return; }
      ac(); // unlock sound for playback inside this tap
      try {
        live = await startRecording({ onLevel: v => { const el = card.querySelector('.meter i'); if (el) el.style.width = (v * 100) + '%'; } });
        err = null; draw();
      } catch (e) { live = null; err = e.code || 'other'; draw(); return; }
      live.finished.then(async blob => {
        live = null; busy = true; draw();
        if (blob.size > 6000) {
          try {
            await saveClip(L(), ph.id, blob);
            const hz = await estimatePitch(blob); if (hz) { settings.familyPitch = +pitchFromHz(hz).toFixed(2); saveSettings(); }
            playClip(L(), ph.id);
            if (idx < FAMILY_PHRASES.length - 1) setTimeout(() => { if (!live) { idx++; draw(); } }, 2200);
          } catch (e) { err = T('Could not save on this device (private browsing?).', 'Không lưu được trên máy này (đang duyệt web ẩn danh?).'); }
        } else err = T('That was too quiet. Hold the phone closer and try again.', 'Âm thanh nhỏ quá. Cầm điện thoại gần hơn rồi thử lại.');
        busy = false; draw();
      });
    };
  };
  draw();
}

// ---------- Games hub ----------
export const folkGames = () => HUB.find(h => h.key === 'folk').games; // the traditional games (js/folkshow.js runs them on a time table)
const HUB = [
  { key: 'learn', icon: '📚', short: () => T('Learning', 'Học'), title: () => T('Learning: numbers, letters, time and more', 'Học: số, chữ, xem giờ và nhiều nữa'), games: ['familyquiz', 'counting', 'numbers', 'sums', 'letters', 'phonics', 'clock', 'shapes', 'colors', 'opposites', 'animalsounds', 'feelings', 'moreless', 'days', 'bodyparts', 'words', 'firstwords', 'pattern', 'sorting', 'memory'] },
  { key: 'folk', icon: '🪁', short: () => T('Folk games', 'Dân gian'), title: () => T('Folk games of Australia, Vietnam, China and India', 'Trò chơi dân gian Úc, Việt Nam, Trung Quốc và Ấn Độ'), games: ['music', 'firstwords', 'tangram', 'snakes', 'rangoli', 'words', 'mrwolf', 'cricket', 'parcel', 'sackrace', 'chuyen', 'dragon', 'datnieu', 'kite', 'chichi', 'marbles', 'skipping', 'dacau', 'snap', 'tienlen', 'oantuti', 'nemlon', 'oanquan', 'hopscotch', 'tug', 'caro', 'goat'] },
  { key: 'cities', icon: '🏙️', short: () => T('Cities', 'Thành phố'), title: () => T('In the cities of Vietnam and Australia', 'Ở các thành phố Việt Nam và Úc'), games: ['puppets', 'dongho', 'dragonfire', 'traffic', 'ferries', 'tram', 'koala'] },
  { key: 'farm', icon: '🏡', short: () => T('Farm', 'Nông trại'), title: () => T('At the farm', 'Ở nông trại'), games: ['bunny', 'eggs', 'balloon', 'bubbles', 'jigsaw', 'tower', 'order', 'sortout', 'duckmaze'] },
  { key: 'village', icon: '🏮', short: () => T('Village', 'Làng Sen'), title: () => T('In Lotus Village', 'Ở Làng Sen'), games: ['market', 'tune', 'shapes', 'oddone', 'memory'] },
  { key: 'shrine', icon: '✨', short: () => T('Puzzles', 'Đố vui'), title: () => T('Puzzle shrines', 'Đền đố vui'), games: ['pattern', 'counting', 'letters', 'numbers', 'colors', 'sorting', 'sudoku', 'hanoi', 'robot', 'maze'] }
];
// The game after this one in the Games hub (the tab the child last used first), for "Next game" after a win.
export function nextGameAfter(id) {
  const secs = [...HUB].sort((a, b) => (b.key === openGamesHub.last) - (a.key === openGamesHub.last));
  for (const sec of secs) { const list = sec.games.filter(g => GAMES[g]), k = list.indexOf(id); if (k >= 0) return list[(k + 1) % list.length]; }
  return null;
}
const HUB_COLORS = ['#ff7eb8', '#ffb52e', '#5fd39a', '#3cc7e8', '#9a6bff', '#ff8a5a'];
export function openGamesHub(game, i, onClose) {
  const p = game.heroes[i].profile;
  const m = modal('hub', ''), card = m.querySelector('.card');
  const close = () => { m.close(); onClose && onClose(); };
  // one category at a time, picked from a row of tabs (the whole list was too long to scroll on a phone)
  const tabs = [...(game.festivals ? [{ key: 'fest', icon: '🎉', short: () => T('Festivals', 'Lễ hội') }] : []), ...HUB, ...(game.taleShelfHTML ? [{ key: 'tales', icon: '📖', short: () => T('Stories', 'Truyện') }] : [])];
  let cur = tabs.find(t => t.key === openGamesHub.last) ? openGamesHub.last : 'learn';
  const card2 = sec => `<div class="hubgrid">${sec.games.filter(id => GAMES[id]).map((id, k) => {
      const g = GAMES[id], lv = p.levels[id] || 1;
      return `<div class="hcard" style="--hc:${HUB_COLORS[(k + sec.key.length) % HUB_COLORS.length]}"><button class="hplay" data-play="${id}"><span class="hi">${pic(g.icon)}</span><b>${esc(g.name())}</b><small>${'⭐'.repeat(lv)}${'☆'.repeat(5 - lv)}</small></button><button class="hgo" data-go="${id}" aria-label="${T('Go there', 'Đi đến đó')}">📍</button><button class="hhow" data-how="${id}" aria-label="${T('How to play', 'Cách chơi')}">📺</button>${g.origin ? `<span class="hflag">${originFlags(g.origin)}</span>` : ''}</div>`;
    }).join('')}</div>`;
  const body = key => {
    if (key === 'fest') return `<h3>🎉 ${T('Festivals: go any day', 'Lễ hội: đi ngày nào cũng được')}</h3><div class="festrow">${game.festivals.list().map(f => `<button class="festbtn${f.today ? ' today' : ''}" data-fest="${f.id}"><span>${pic(f.icon)}</span><b>${esc(f.name)}</b>${f.today ? `<small>${T('Today!', 'Hôm nay!')}</small>` : ''}</button>`).join('')}</div>`;
    if (key === 'tales') return `<h3>📖 ${T('Fairy tales', 'Truyện cổ tích')}</h3><p class="sub">${T('Tap a story: you fly to Grandma Storyteller and she reads it to you.', 'Chạm vào truyện: con bay đến chỗ Bà Kể Chuyện và bà kể cho con nghe.')}</p><div class="talelib">${game.taleShelfHTML(p)}</div>`;
    const sec = HUB.find(x => x.key === key); return `<h3>${sec.icon} ${esc(sec.title())}</h3>${card2(sec)}`;
  };
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>🎮 ${T('Games', 'Trò chơi')}</h2>
    <div class="hubtabs" role="tablist">${tabs.map(t => `<button role="tab" data-tab="${t.key}"><span>${pic(t.icon)}</span><small>${esc(t.short())}</small></button>`).join('')}</div>
    <div class="hubbody"></div>`;
  const draw = () => {
    card.querySelectorAll('.hubtabs [data-tab]').forEach(b => { const on = b.dataset.tab === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const hb = card.querySelector('.hubbody'); hb.innerHTML = body(cur); hb.scrollTop = 0;
    bind(hb);
  };
  card.querySelectorAll('.hubtabs [data-tab]').forEach(b => b.onclick = () => { cur = openGamesHub.last = b.dataset.tab; SFX.tap(); draw(); const row = b.parentElement; row.scrollTo({ left: b.offsetLeft - row.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); }); // sideways only: the page must not jump
  card.querySelector('.x').onclick = close;
  const bind = root => {
    root.querySelectorAll('[data-tale]').forEach(b => b.onclick = () => { close(); game.readTale(i, b.dataset.tale); });
    root.querySelectorAll('[data-fest]').forEach(b => b.onclick = () => { SFX.tap(); close(); game.festivals.visit(i, b.dataset.fest); });
    root.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const id = b.dataset.play; close(); game.meetAndPlay(i, id); });
    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.goToGame(i, b.dataset.go); });
    root.querySelectorAll('[data-how]').forEach(b => b.onclick = () => { const id = b.dataset.how; openHowTo(id, { onPlay: () => { close(); game.playGame(i, id, 'place'); } }); });
  };
  draw();
  say('Which game shall we play?', 'Mình chơi trò gì nào?');
}

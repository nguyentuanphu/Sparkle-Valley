// Screens and pop-ups: title, who's playing, grown-ups settings, photo editor, NPC dialogue,
// the Sparkle Pad (map, backpack, adventure log, album, camera), cooking, shop and online play.
import { T, applyLang, nm, NPC_NAMES, defaultName } from './i18n.js';
import { settings, saveSettings, profiles, saveProfiles, addProfile, removeProfile, exportBackup, importBackup, STYLES, OUTFIT_COLORS, HATS, BACKS, HAIR, SKIN, HAIRSTYLES, GLIDERS, farm, resetFarm, MAX_KIDS } from './state.js';
import { say, voicesFor, onVoices, hasVietnamese, FAMILY_PHRASES, hasClip, clipCount, saveClip, deleteClip, playClip, estimatePitch, pitchFromHz } from './voice.js';
import { startRecording, releaseMic, micProblem } from './recorder.js';
import { SFX, Music, ac } from './audio.js';
import { fmt, cur } from './money.js';
import { el, esc, $, clamp, wait } from './util.js';
import { avatarURL } from './avatar.js';
import { ITEMS, RECIPES, findRecipe, SHOP, HAT_ICON, HAT_NAME, QUESTS, STICKERS } from './data.js';
import { SIZE, HALF, SHRINES, TOWERS } from './world.js';
import { GAMES } from './games/frame.js';
import { showStory, storyList } from './story.js';
import { SECRETS } from './secrets.js';
import { LANDMARKS, VENDORS } from './regions.js';
import { AUSSIE_SLANG, VN_WORDS } from './words.js';
import { openCredits, creditsFields, bindCreditsFields } from './credits.js';
import { openHowTo } from './howto.js';
import { extrasHTML, bindExtras } from './extras.js';
import { canListen } from './listen.js';
import { installButton } from './install.js';
import { VOICE_STYLES, clipCountFor, hush } from './voice.js';

export const STYLE_ICON = { dress: '👗', shirt: '👕', aodai: '🥻', tunic: '🧥', overalls: '👖', hoodie: '🧶' };
export const STYLE_NAME = { dress: () => T('Dress', 'Váy'), shirt: () => T('Shirt & shorts', 'Áo và quần đùi'), aodai: () => 'Áo dài', tunic: () => T('Explorer', 'Nhà thám hiểm'), overalls: () => T('Overalls', 'Quần yếm'), hoodie: () => T('Hoodie', 'Áo nỉ') };
export function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200); }

export function modal(cls, html) {
  const m = el('div', 'modal ' + (cls || ''), `<div class="card">${html}</div>`);
  document.body.appendChild(m);
  m.close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  return m;
}
const flagBtns = () => `<div class="seg lang"><button data-l="en" class="${settings.lang === 'en' ? 'on' : ''}">🇦🇺 English</button><button data-l="vi" class="${settings.lang === 'vi' ? 'on' : ''}">🇻🇳 Tiếng Việt</button></div>`;
function bindLang(root, after) {
  root.querySelectorAll('.seg.lang button').forEach(b => b.onclick = () => { settings.lang = b.dataset.l; saveSettings(); applyLang(); SFX.tap(); after && after(); });
}

// ---------- Title ----------
export function showTitle(onStart) {
  const s = el('div', 'screen title', `
    <div class="logo"><div class="logo-main">Sparkle Valley</div><div class="logo-sub">Thung Lũng Lấp Lánh</div></div>
    <div class="press"></div>
    <div class="title-top"></div>
    <div class="title-foot"></div>`);
  document.body.appendChild(s);
  const redraw = () => {
    s.querySelector('.press').textContent = T('Tap anywhere to start', 'Chạm vào đâu đó để bắt đầu');
    s.querySelector('.title-foot').innerHTML = flagBtns() + `<button class="about" aria-label="${T('About', 'Giới thiệu')}">ℹ️<span> ${T('About', 'Giới thiệu')}</span></button>`;
    bindLang(s, redraw);
    s.querySelector('.about').onclick = e => { e.stopPropagation(); ac(); openCredits(); };
    const top = s.querySelector('.title-top'); top.innerHTML = '';
    const b = installButton(); if (b) top.appendChild(b);
  };
  redraw();
  s.addEventListener('click', e => { if (e.target.closest('.seg') || e.target.closest('.about') || e.target.closest('.installchip')) return; ac(); SFX.chime(); s.remove(); onStart(); });
}

// ---------- Who's playing ----------
export function showWho(onGo) {
  let mode = 'solo', chosen = [];
  const s = el('div', 'screen who');
  document.body.appendChild(s);
  const draw = () => {
    const need = mode === 'split' ? 2 : 1;
    s.innerHTML = `
      <h2>${T("Who's playing?", 'Ai chơi nào?')}</h2>
      <div class="modes">
        <button data-m="solo" class="${mode === 'solo' ? 'on' : ''}">🧒<b>${T('Play alone', 'Chơi một mình')}</b></button>
        <button data-m="split" class="${mode === 'split' ? 'on' : ''}">👫<b>${T('Two players here', 'Hai bạn cùng máy')}</b></button>
        <button data-m="online" class="${mode === 'online' ? 'on' : ''}">📞<b>${T('Friend far away', 'Bạn ở xa')}</b></button>
      </div>
      <p class="hint">${mode === 'split' ? T('Pick two players', 'Chọn hai bạn') : T('Pick a player', 'Chọn người chơi')}</p>
      <div class="picks">${profiles.map(p => `<button class="pick ${chosen.includes(p.id) ? 'on' : ''}" data-id="${p.id}"><img src="${avatarURL(p)}" alt=""><span>${esc(p.name || '?')}</span>${chosen.includes(p.id) && need === 2 ? `<i class="num">${chosen.indexOf(p.id) + 1}</i>` : ''}</button>`).join('')}
        <button class="pick add"><span class="plus">+</span><span>${T('New', 'Thêm')}</span></button></div>
      <button class="go" ${chosen.length === need ? '' : 'disabled'}>${T("Let's go!", 'Đi thôi!')} ▶</button>
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
  card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>✏️ ${T('Character names', 'Tên nhân vật')}</h2>
    <p class="note">${T('Leave a box empty to keep the usual name (shown in grey).', 'Để trống để giữ tên mặc định (chữ màu xám).')}</p>
    <div class="rn-list">${list.map(n => `<div class="rn-row" data-id="${esc(n.id)}"><span class="rn-ic" aria-hidden="true">${n.icon}</span>
      <label>🇦🇺 English<input type="text" data-l="en" value="${esc((cur[n.id] || {}).en || '')}" placeholder="${esc(defaultName(n.id, 'en'))}"></label>
      <label>🇻🇳 Tiếng Việt<input type="text" data-l="vi" value="${esc((cur[n.id] || {}).vi || '')}" placeholder="${esc(defaultName(n.id, 'vi'))}"></label></div>`).join('')}</div>
    <div class="rn-bar"><button class="btn" id="rnReset">↩️ ${T('Use the usual names', 'Dùng tên mặc định')}</button><button class="btn primary" id="rnSave">💾 ${T('Save', 'Lưu')}</button></div>`;
  const close = () => { m.close(); after && after(); };
  card.querySelector('.x').onclick = close;
  card.querySelector('#rnReset').onclick = () => card.querySelectorAll('.rn-row input').forEach(i => i.value = '');
  card.querySelector('#rnSave').onclick = () => {
    const out = {};
    card.querySelectorAll('.rn-row').forEach(r => { const en = r.querySelector('[data-l=en]').value.trim(), vi = r.querySelector('[data-l=vi]').value.trim(); if (en || vi) out[r.dataset.id] = { en, vi }; });
    settings.npcNames = out; saveSettings(); applyLang(); SFX.chime && SFX.chime();
    toast(T('Names saved!', 'Đã lưu tên!')); close();
  };
}

// ---------- Grown-ups ----------
export function openGrownups(after) {
  const m = modal('grownups', '');
  const card = m.querySelector('.card');
  const draw = () => {
    const vEn = voicesFor('en'), vVi = voicesFor('vi');
    card.innerHTML = `
      <button class="x" aria-label="Close">✕</button>
      <h2>${T('Grown-ups', 'Phụ huynh')}</h2>
      <div class="g-install"></div>
      <h3>${T('Language', 'Ngôn ngữ')}</h3>${flagBtns()}
      <label class="tog"><input type="checkbox" id="gBil" ${settings.bilingual ? 'checked' : ''}> ${T('Bilingual voice: also say everything in the other language', 'Giọng song ngữ: nói thêm bằng ngôn ngữ còn lại')}</label>
      <h3>${T('Money', 'Tiền tệ')}</h3>
      <div class="seg cur"><button data-c="AUD" class="${settings.currency === 'AUD' ? 'on' : ''}">🇦🇺 AUD $</button><button data-c="VND" class="${settings.currency === 'VND' ? 'on' : ''}">🇻🇳 VND đ</button></div>
      <p class="note">${T('Prices and the market game switch currency. 10c = 2.000đ in this game.', 'Giá cả và trò chơi đi chợ sẽ đổi theo tiền tệ. Trong game, 10 xu Úc = 2.000đ.')}</p>
      <h3>${T('Voices', 'Giọng nói')}</h3>
      <div class="field"><label>English</label><div class="vrow"><select id="vEn">${vEn.map(v => `<option ${v.name === settings.voiceEn ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('Default', 'Mặc định')}</option>`}</select><button class="btn" data-try="en">▶</button></div></div>
      <div class="field"><label>Tiếng Việt</label><div class="vrow"><select id="vVi">${vVi.map(v => `<option ${v.name === settings.voiceVi ? 'selected' : ''}>${esc(v.name)}</option>`).join('') || `<option>${T('No Vietnamese voice found', 'Chưa có giọng tiếng Việt')}</option>`}</select><button class="btn" data-try="vi">▶</button></div></div>
      <p class="note">${hasVietnamese() ? '' : T('To add a Vietnamese voice: iPhone/iPad → Settings → Accessibility → Spoken Content → Voices → Vietnamese. Android → Settings → Text-to-speech → Google → Install voice data → Vietnamese. ', 'Thêm giọng tiếng Việt: iPhone/iPad → Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt. Android → Cài đặt → Chuyển văn bản thành giọng nói → Google → Cài đặt dữ liệu giọng nói → Tiếng Việt. ')}${T('Choose an "Enhanced" or "Premium" voice for the most natural sound.', 'Chọn giọng "Nâng cao" hoặc "Cao cấp" để nghe tự nhiên nhất.')}</p>
      <h3>${T('Family voice', 'Giọng của gia đình')}</h3>
      <button class="btn primary wide big" id="gRec">🎙️ ${T('Record your voice for the game', 'Thu giọng của bạn cho trò chơi')}<small class="reccount">🇻🇳 ${clipCountFor('vi')}/${FAMILY_PHRASES.length} · 🇦🇺 ${clipCountFor('en')}/${FAMILY_PHRASES.length}</small></button>
      <p class="note">${T('Each language has its own 11 lines. The game plays your real voice whenever it says one of those lines (praise, “try again”, “you did it”, hello…), in the language the game is set to. Everything else is read by the device voice, tuned towards your voice.', 'Mỗi ngôn ngữ có 11 câu riêng. Trò chơi phát đúng giọng thật của bạn mỗi khi nói một trong các câu đó (khen, “thử lại nhé”, “con làm được rồi”, chào…), theo ngôn ngữ đang chọn. Các câu khác do giọng máy đọc, được chỉnh gần với giọng bạn.')}</p>
      ${extrasHTML()}
      <h3>${T('Sound and world', 'Âm thanh và thế giới')}</h3>
      <div class="toggles">
        <label class="tog"><input type="checkbox" id="gVoice" ${settings.voice ? 'checked' : ''}> ${T('Talking voice', 'Giọng nói')}</label>
        <label class="tog"><input type="checkbox" id="gMusic" ${settings.music ? 'checked' : ''}> ${T('Music', 'Nhạc')}</label>
        <label class="tog"><input type="checkbox" id="gSound" ${settings.sound ? 'checked' : ''}> ${T('Sound effects', 'Hiệu ứng âm thanh')}</label>
        <label class="tog"><input type="checkbox" id="gDay" ${settings.alwaysDay ? 'checked' : ''}> ${T('Always daytime', 'Luôn là ban ngày')}</label>
      </div>
      <div class="field"><label>${T('Camera', 'Góc nhìn')}</label><div class="seg cam"><button data-c="easy" class="${settings.camMode !== 'free' ? 'on' : ''}">🧸 ${T('Easy: fixed view from above', 'Dễ: nhìn từ trên, cố định')}</button><button data-c="free" class="${settings.camMode === 'free' ? 'on' : ''}">🧭 ${T('Explorer: drag to look around', 'Tự do: kéo để xoay')}</button></div></div>
      <div class="field"><label>${T('Graphics', 'Đồ họa')}</label><div class="seg q">${['low', 'auto', 'high'].map(q => `<button data-q="${q}" class="${settings.quality === q ? 'on' : ''}">${{ low: T('Fast', 'Nhanh'), auto: T('Auto', 'Tự động'), high: T('Pretty', 'Đẹp') }[q]}</button>`).join('')}</div></div>
      <h3>${T('Players', 'Người chơi')}</h3>
      <div class="plist">${profiles.map(p => `<div class="prow"><img src="${avatarURL(p)}" alt=""><div class="pw"><b>${esc(p.name)}</b><small>🔮 ${p.orbs} · ✨ ${Object.keys(p.shrines).length}/12 · 💰 ${fmt(farm.coins)}</small></div><button class="btn" data-ed="${p.id}">${T('Edit', 'Sửa')}</button></div>`).join('')}</div>
      <button class="btn wide" id="gAdd">+ ${T('Add a player', 'Thêm người chơi')}</button>
      <h3>ℹ️ ${T('Credits page', 'Trang giới thiệu')}</h3>${creditsFields()}<button class="btn wide" id="gCredits">ℹ️ ${T('Show the credits page', 'Xem trang giới thiệu')}</button>
      <h3>🏷️ ${T('Character names', 'Tên nhân vật')}</h3>
      <p class="note">${T('Titles follow the language (Grandma / Bà, Auntie / Cô) and names stay as they are in each region. You can rename anyone, in English and in Vietnamese.', 'Danh xưng đổi theo ngôn ngữ (Grandma / Bà, Auntie / Cô) và tên giữ nguyên theo từng vùng. Bạn có thể đổi tên bất kỳ nhân vật nào, bằng tiếng Anh và tiếng Việt.')}</p>
      <button class="btn wide" id="gNames">✏️ ${T('Rename characters', 'Đổi tên nhân vật')}</button>
      <h3>${T('Farm', 'Nông trại')}</h3>
      <button class="btn danger" id="gFarm">🔄 ${T('Start the farm over', 'Làm lại nông trại')}</button>
      <p class="note">${T('Clears crops, animals, pets, basket and coins. Players, photos, stickers and game levels are kept.', 'Xóa cây trồng, vật nuôi, thú cưng, giỏ hàng và tiền. Giữ lại người chơi, ảnh, hình dán và cấp độ trò chơi.')}</p>
      <h3>${T('Backup', 'Sao lưu')}</h3>
      <p class="note">${T('Progress saves automatically on this device. To move it to another phone or tablet, save a backup file and open it there.', 'Tiến trình tự động lưu trên máy này. Để chuyển sang máy khác, hãy lưu tệp sao lưu và mở nó trên máy kia.')}</p>
      <div class="actions"><button class="btn" id="gExp">⬇ ${T('Save backup', 'Lưu bản sao')}</button><label class="btn" for="gImp">⬆ ${T('Open backup', 'Mở bản sao')}</label><input type="file" id="gImp" accept="application/json,.json" class="vh"></div>
      <p class="note">${T('Online play uses the free PeerJS service to connect two devices directly. Voice goes straight between the devices and is never recorded.', 'Chơi trực tuyến dùng dịch vụ miễn phí PeerJS để nối hai máy trực tiếp. Giọng nói đi thẳng giữa hai máy và không bao giờ được ghi lại.')}</p>
      <button class="btn primary wide" id="gDone">💾 ${T('Save & close', 'Lưu và đóng')}</button>`;
    bindLang(card, () => { draw(); after && after(); });
    card.querySelector('.x').onclick = card.querySelector('#gDone').onclick = () => { m.close(); after && after(); };
    card.querySelectorAll('.seg.cur button').forEach(b => b.onclick = () => { settings.currency = b.dataset.c; saveSettings(); draw(); });
    card.querySelectorAll('.seg.cam button').forEach(b => b.onclick = () => { settings.camMode = b.dataset.c; saveSettings(); draw(); });
    card.querySelectorAll('.seg.q button').forEach(b => b.onclick = () => { settings.quality = b.dataset.q; saveSettings(); draw(); toast(T('Restart the game to change graphics.', 'Mở lại trò chơi để đổi đồ họa.')); });
    const chk = (id, k, f) => card.querySelector(id).onchange = e => { settings[k] = e.target.checked; saveSettings(); f && f(); };
    chk('#gBil', 'bilingual'); chk('#gVoice', 'voice'); chk('#gMusic', 'music', () => settings.music ? Music.refresh() : Music.stop()); chk('#gSound', 'sound'); chk('#gDay', 'alwaysDay');
    card.querySelector('#vEn').onchange = e => { settings.voiceEn = e.target.value; saveSettings(); };
    card.querySelector('#vVi').onchange = e => { settings.voiceVi = e.target.value; saveSettings(); };
    card.querySelectorAll('[data-try]').forEach(b => b.onclick = () => {
      const keep = settings.lang; settings.lang = b.dataset.try; say('Hello! Welcome to Sparkle Valley.', 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.'); settings.lang = keep;
    });
    card.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => openEditor(profiles.find(p => p.id === b.dataset.ed), () => { draw(); after && after(); }));
    card.querySelector('#gAdd').onclick = () => profiles.length >= MAX_KIDS ? toast(T(`Up to ${MAX_KIDS} players.`, `Tối đa ${MAX_KIDS} người chơi.`)) : openEditor(null, () => { draw(); after && after(); });
    card.querySelector('#gExp').onclick = exportBackup;
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
  const draw = () => {
    const s = settings, on = v => v ? 'on' : '';
    card.innerHTML = `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>⚙️ ${T('Settings', 'Cài đặt')}</h2>
      ${flagBtns()}
      <div class="qgrid">
        <button class="qset ${on(s.music)}" data-k="music"><span>🎵</span>${T('Music', 'Nhạc')}</button>
        <button class="qset ${on(s.sound)}" data-k="sound"><span>🔔</span>${T('Sounds', 'Âm thanh')}</button>
        <button class="qset ${on(s.voice)}" data-k="voice"><span>🗣️</span>${T('Talking', 'Giọng nói')}</button>
        ${canListen() ? `<button class="qset ${on(s.voiceControl)}" data-k="voiceControl"><span>🎤</span>${T('Voice control', 'Điều khiển giọng nói')}</button>` : ''}
        <button class="qset ${on(s.camMode !== 'free')}" data-k="cam"><span>${s.camMode === 'free' ? '🧭' : '🧸'}</span>${s.camMode === 'free' ? T('Explorer camera', 'Camera tự do') : T('Easy camera', 'Camera dễ')}</button>
        <button class="qset ${on(s.alwaysDay)}" data-k="alwaysDay"><span>☀️</span>${T('Always daytime', 'Luôn ban ngày')}</button>
      </div>
      <div class="field"><label>${T('Voice style', 'Kiểu giọng')}</label><div class="seg vstyle">${VOICE_STYLES.map(v => `<button data-v="${v.id}" class="${(s.voiceStyle || 'natural') === v.id ? 'on' : ''}">${v.icon} ${v.name()}</button>`).join('')}</div></div>
      <div class="actions"><button class="btn" id="qWho">👫 ${T('Change player', 'Đổi người chơi')}</button><button class="btn primary" id="qDone">${T('Done', 'Xong')}</button></div>`;
    bindLang(card, draw);
    card.querySelector('.x').onclick = card.querySelector('#qDone').onclick = close;
    card.querySelectorAll('.qset').forEach(b => b.onclick = () => {
      const k = b.dataset.k; SFX.tap();
      if (k === 'cam') s.camMode = s.camMode === 'free' ? 'easy' : 'free';
      else s[k] = !s[k];
      if (k === 'music') { if (s.music) Music.refresh(); else Music.stop(); }
      if (k === 'voice' && !s.voice) hush();
      saveSettings(); document.querySelectorAll('.dk.voicecmd').forEach(x => x.hidden = !(s.voiceControl && canListen())); draw();
    });
    card.querySelectorAll('.seg.vstyle button').forEach(b => b.onclick = () => { s.voiceStyle = b.dataset.v; saveSettings(); draw(); say('Hello! Do you like my voice?', 'Xin chào! Con có thích giọng này không?'); });
    card.querySelector('#qWho').onclick = () => { m.close(); game.changePlayer(); };
  };
  draw();
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
    <div class="actions">${isNew ? '' : `<button class="btn danger" id="eDel">${T('Remove', 'Xóa')}</button>`}<span class="grow"></span><button class="btn" id="eCancel">${T('Cancel', 'Hủy')}</button><button class="btn primary" id="eSave">${T('Save', 'Lưu')}</button></div>`);
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
    const d = el('div', 'dialog', `<div class="dname">${esc(nm(name))}</div><div class="dtext"></div><div class="dchoices"></div><div class="dnext">▼</div>`);
    if (dialogHooks.canChat && dialogHooks.canChat(name)) {
      const ask = el('button', 'dask', '💬 ' + T('Chat', 'Trò chuyện')); d.appendChild(ask);
      ask.onclick = e => { e.stopPropagation(); SFX.tap(); close(-1); dialogHooks.chat(name); };
    }
    document.body.appendChild(d);
    let i = 0;
    const text = d.querySelector('.dtext'), ch = d.querySelector('.dchoices'), next = d.querySelector('.dnext');
    const show = () => {
      const [en, vi] = lines[i]; text.textContent = T(en, vi); say(en, vi);
      const last = i === lines.length - 1;
      ch.innerHTML = ''; next.hidden = last && choices && choices.length;
      if (last && choices && choices.length) choices.forEach((c, k) => { const b = el('button', 'dch', esc(T(c[0], c[1]))); b.onclick = e => { e.stopPropagation(); SFX.tap(); close(k); }; ch.appendChild(b); });
    };
    const close = k => { d.classList.add('out'); setTimeout(() => d.remove(), 200); res(k); };
    d.onclick = () => { if (choices && i === lines.length - 1 && choices.length) return; SFX.tap(); if (i < lines.length - 1) { i++; show(); } else close(-1); };
    show();
  });
}

// ---------- reward pop-up ----------
export function reward(big, line, sub) {
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
  const TABS = [['map', '🗺️', T('Map', 'Bản đồ')], ['bag', '🎒', T('Backpack', 'Ba lô')], ['log', '📜', T('Adventures', 'Nhiệm vụ')], ['album', '⭐', T('Album', 'Bộ sưu tập')], ['games', '🎲', T('Games', 'Trò chơi')], ['cam', '📷', T('Camera', 'Máy ảnh')]];
  if (game.mode === 'online' || game.mode === 'solo') TABS.push(['friend', '📞', T('Friend', 'Bạn bè')]);
  const draw = () => {
    card.innerHTML = `<div class="pad-head"><div class="pad-tabs">${TABS.map(t => `<button data-t="${t[0]}" class="${t[0] === tab ? 'on' : ''}"><span>${t[1]}</span><small>${t[2]}</small></button>`).join('')}</div><button class="x" aria-label="Close">✕</button></div><div class="pad-body"></div>`;
    card.querySelectorAll('.pad-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; SFX.tap(); draw(); });
    card.querySelector('.x').onclick = close;
    const body = card.querySelector('.pad-body');
    ({ map: drawMap, bag: drawBag, log: drawLog, album: drawAlbum, games: drawGames, cam: drawCam, friend: drawFriend })[tab](body);
  };
  const close = () => { m.close(); game.closePad(i); };
  function drawMap(body) {
    const S = 600, cv = el('canvas', 'bigmap'); cv.width = cv.height = S; body.appendChild(cv);
    body.appendChild(el('p', 'note center', T('Tap any picture on the map, or a place below, to fly there.', 'Chạm vào bất kỳ hình nào trên bản đồ, hoặc một nơi bên dưới, để bay đến đó.')));
    const quick = el('div', 'quick');
    game.PLACES.forEach(pl => { const b = el('button', 'qbtn', `<span>${pl.icon}</span><small>${esc(pl.name())}</small>`); b.onclick = () => { close(); game.travel(hero, pl.x, pl.z); }; quick.appendChild(b); });
    const ch = el('button', 'qbtn change', `<span>🔄</span><small>${T('Change player', 'Đổi người chơi')}</small>`); ch.onclick = () => { close(); game.changePlayer(); }; quick.appendChild(ch);
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
    const q = game.questTarget(hero); if (q) { const [a, b] = pt(q.x, q.z); x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(a, b - 14, 9, 0, Math.PI * 2); x.moveTo(a - 7, b - 9); x.lineTo(a, b); x.lineTo(a + 7, b - 9); x.fill(); }
    game.heroes.forEach((h, j) => { const [a, b] = pt(h.pos.x, h.pos.z); x.save(); x.translate(a, b); x.rotate(-h.yaw + Math.PI); x.fillStyle = j === 0 ? '#ffd23f' : '#5fe0ff'; x.strokeStyle = '#3a2a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -12); x.lineTo(9, 10); x.lineTo(0, 5); x.lineTo(-9, 10); x.closePath(); x.fill(); x.stroke(); x.restore(); });
    if (game.partner) { const s = game.partner.pos; icon('🧒', s.x, s.z, 22); }
    cv.onclick = e => {
      const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left) / r.width * SIZE - HALF, wz = (e.clientY - r.top) / r.height * SIZE - HALF;
      const s = spots.slice().sort((a, b) => Math.hypot(a.x - wx, a.z - wz) - Math.hypot(b.x - wx, b.z - wz)).find(s => Math.hypot(s.x - wx, s.z - wz) < (s.r || 10)); if (!s) return;
      const ok = el('div', 'travel', `<p>${T('Travel to', 'Bay đến')} <b>${esc(s.name)}</b>?</p><button class="btn primary">✨ ${T('Go!', 'Đi!')}</button><button class="btn">${T('No', 'Không')}</button>`);
      body.appendChild(ok);
      ok.querySelector('.primary').onclick = () => { close(); game.travel(hero, s.x, s.z); };
      ok.querySelector('.btn:not(.primary)').onclick = () => ok.remove();
    };
  }
  function drawBag(body) {
    const items = Object.entries(p.inv).filter(([, n]) => n > 0);
    const dishes = Object.entries(p.dishes).filter(([, n]) => n > 0);
    body.innerHTML = `
      <div class="bag-top"><span class="chip">💰 ${fmt(farm.coins)}</span><span class="chip">🔮 ${p.orbs} ${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}</span><span class="chip">🍃 ${Object.keys(p.leafies).length}/24 Leafies</span></div>
      <h3>${T('Food', 'Món ăn')} <small>${T('tap to eat', 'chạm để ăn')}</small></h3>
      <div class="slots">${dishes.map(([id, n]) => { const r = RECIPES.find(r => r.id === id) || { icon: '🥘', name: () => T('Mystery stew', 'Món hầm bí ẩn') }; return `<button class="slot" data-eat="${id}" title="${esc(r.name())}"><span>${r.icon}</span><b>${n}</b><small>${esc(r.name())}</small></button>`; }).join('') || `<p class="note">${T('Cook at a cooking pot to make food.', 'Nấu ăn ở nồi nấu để có món ăn.')}</p>`}</div>
      <h3>${T('Ingredients', 'Nguyên liệu')}</h3>
      <div class="slots">${items.map(([id, n]) => `<div class="slot"><span>${ITEMS[id].icon}</span><b>${n}</b><small>${esc(ITEMS[id].name())}</small></div>`).join('') || `<p class="note">${T('Empty! Shake apple trees and look for herbs and mushrooms.', 'Trống trơn! Rung cây táo và tìm rau thơm, nấm nhé.')}</p>`}</div>
      <h3>${T('Hats', 'Mũ')} <small>${T('tap to wear', 'chạm để đội')}</small></h3>
      <div class="slots">${HATS.map(h => `<button class="slot ${p.look.hat === h ? 'on' : ''}" data-hat="${h}"><span>${HAT_ICON[h]}</span><small>${esc(HAT_NAME[h]())}</small></button>`).join('')}</div>
      <h3>${T('Glider', 'Cánh lượn')}</h3>
      <div class="slots">${p.glider ? p.owned.gliders.map(g => `<button class="slot ${p.look.glider === g ? 'on' : ''}" data-gl="${g}"><span class="sw big" style="background:${GLIDERS[g]}"></span></button>`).join('') : `<p class="note">${T('Not yet! Ông Cú has something for you…', 'Chưa có! Ông Cú có món quà cho con đấy…')}</p>`}</div>`;
    body.querySelectorAll('[data-eat]').forEach(b => b.onclick = () => { game.eat(hero, b.dataset.eat); draw(); });
    body.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { p.look.hat = b.dataset.hat; saveProfiles(); game.rebuildHero(i); SFX.ok(); draw(); });
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
    body.innerHTML = `<h3>📮 ${T('Postcards', 'Bưu thiếp')} ${Object.keys(pcs).length}/${LANDMARKS.length}</h3><div class="secrets">${LANDMARKS.map(l => pcs[l.id] ? `<button class="sec on" data-pcfact="${l.id}"><span>${l.icon}</span><small>${esc(l.name())}</small></button>` : `<button class="sec" data-fly="${l.id}"><span>❔</span><small>✈️ ${esc(l.name())}</small></button>`).join('')}</div>
      <h3>🍜 ${T('Food passport', 'Hộ chiếu ẩm thực')} ${Object.keys(tasted).length}/${VENDORS.length}</h3><div class="secrets">${VENDORS.map(v => `<div class="sec ${tasted[v.id] ? 'on' : ''}"><span>${tasted[v.id] ? v.food[0] : '❔'}</span><small>${tasted[v.id] ? esc(T(v.food[1], v.food[2])) : esc(v.name)}</small></div>`).join('')}</div>
      <h3>🗣️ ${T('Words I learned', 'Từ con đã học')} ${words.length}</h3><div class="wordlist">${words.map(k => { const [kind, w] = [k.slice(0, 2), k.slice(3)]; if (kind === 'au') { const s = AUSSIE_SLANG.find(x => x[0] === w); return s ? `<span>🇦🇺 <b>${esc(s[0])}</b> = ${esc(T(s[1], s[2]))}</span>` : ''; } const v = VN_WORDS.find(x => x[1] === w); return v ? `<span>🇻🇳 ${v[0]} Bắc <b>${esc(v[2])}</b> · Trung <b>${esc(v[3])}</b> · Nam <b>${esc(v[4])}</b></span>` : ''; }).join('') || `<p class="note">${T('Ask the market sellers and the Aussie shopkeepers to teach you a word!', 'Hỏi các cô chú bán hàng ở chợ và ở Góc Nước Úc để học từ mới nhé!')}</p>`}</div>
      <h3>🤫 ${T('Secrets', 'Bí mật')} ${Object.keys(sec).length}/${SECRETS.length}</h3><div class="secrets">${SECRETS.map(s => sec[s.id] ? `<div class="sec on"><span>${s.icon}</span><small>${esc(s.name())}</small></div>` : `<button class="sec" data-hint="${esc(s.hint())}"><span>❔</span><small>${T('Tap for a clue', 'Chạm để nghe gợi ý')}</small></button>`).join('')}</div>
      <h3>📖 ${T('Storybook', 'Sách truyện')}</h3><div class="stories">${storyList(p).map((st, k) => `<button class="qbtn" data-st="${k}"><span>📖</span><small>${esc(st.title())}</small></button>`).join('')}</div>
      <h3>${T('Stickers', 'Hình dán')} ${p.stickers.length}/${STICKERS.length}</h3><div class="stickers">${STICKERS.map(s => `<div class="${p.stickers.includes(s) ? '' : 'miss'}">${p.stickers.includes(s) ? s : '?'}</div>`).join('')}</div>
      <h3>${T('Photos', 'Ảnh chụp')}</h3><div class="photos">${p.album.map((src, k) => `<figure><img src="${src}" alt=""><button class="btn" data-dl="${k}">⬇</button></figure>`).join('') || `<p class="note">${T('Use the Camera tab to take pictures of your adventure!', 'Dùng thẻ Máy ảnh để chụp ảnh chuyến phiêu lưu!')}</p>`}</div>`;
    body.querySelectorAll('[data-hint]').forEach(b => b.onclick = () => { say(b.dataset.hint, b.dataset.hint); toast(b.dataset.hint); });
    body.querySelectorAll('[data-st]').forEach(b => b.onclick = () => showStory(storyList(p)[+b.dataset.st], p.name));
    body.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { const l = LANDMARKS.find(x => x.id === b.dataset.fly); close(); game.travel(hero, l.x, l.z + (l.id === 'uluru' ? -4 : 3)); });
    body.querySelectorAll('[data-pcfact]').forEach(b => b.onclick = () => { const l = LANDMARKS.find(x => x.id === b.dataset.pcfact); say(l.fact[0], l.fact[1]); toast(T(l.fact[0], l.fact[1])); });
    body.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => { const a = document.createElement('a'); a.href = p.album[+b.dataset.dl]; a.download = 'sparkle-valley-photo.jpg'; a.click(); });
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
  function drawCam(body) {
    body.innerHTML = `<div class="cam-prev"></div><div class="actions center"><button class="btn primary big" id="snap">📷 ${T('Take picture', 'Chụp ảnh')}</button></div><p class="note center">${T('Pictures are saved in your Album.', 'Ảnh được lưu trong Bộ sưu tập.')}</p>`;
    body.querySelector('#snap').onclick = async () => {
      m.style.visibility = 'hidden'; await wait(60);
      const shot = game.snapshot(i); m.style.visibility = '';
      SFX.chime();
      body.querySelector('.cam-prev').innerHTML = `<img src="${shot}" alt="">`;
      p.album.push(shot); if (p.album.length > 12) p.album.shift(); saveProfiles();
      say('Click! What a lovely picture!', 'Tách! Bức ảnh đẹp quá!');
    };
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
    card.innerHTML = `<button class="x" aria-label="Close">✕</button><h2>🍲 ${T('Cooking pot', 'Nồi nấu ăn')}</h2>
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
    card.innerHTML = `<button class="x" aria-label="Close">✕</button><h2>🛒 ${T("Cô Mai's stall", 'Sạp hàng Cô Mai')}</h2>
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
    card.innerHTML = `<button class="x" aria-label="Close">✕</button><h2>🎙️ ${T('Family voice', 'Giọng của gia đình')}</h2>
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
      <p class="note">${T('Recordings stay on this device and are never uploaded. Lines you have not recorded are read by the device voice, tuned to sound closer to yours.', 'Bản thu chỉ lưu trên máy này và không bao giờ được tải lên. Những câu chưa thu sẽ do giọng của máy đọc, được chỉnh cho gần với giọng bạn.')}</p>`;
    card.querySelector('.x').onclick = close;
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
const HUB = [
  { key: 'folk', icon: '🪁', title: () => T('Folk games of Australia & Vietnam', 'Trò chơi dân gian Úc và Việt Nam'), games: ['words', 'mrwolf', 'cricket', 'parcel', 'sackrace', 'chuyen', 'dragon', 'datnieu', 'kite', 'chichi', 'marbles', 'skipping', 'dacau', 'snap', 'oanquan', 'hopscotch', 'tug', 'caro', 'goat'] },
  { key: 'farm', icon: '🏡', title: () => T('At the farm', 'Ở nông trại'), games: ['bunny', 'balloon', 'bubbles', 'jigsaw', 'tower', 'order', 'sortout', 'duckmaze'] },
  { key: 'village', icon: '🏮', title: () => T('In Lotus Village', 'Ở Làng Sen'), games: ['market', 'tune', 'shapes', 'oddone', 'memory'] },
  { key: 'shrine', icon: '✨', title: () => T('Puzzle shrines', 'Đền đố vui'), games: ['pattern', 'counting', 'letters', 'numbers', 'colors', 'sorting', 'hanoi', 'robot', 'maze'] }
];
const HUB_COLORS = ['#ff7eb8', '#ffb52e', '#5fd39a', '#3cc7e8', '#9a6bff', '#ff8a5a'];
export function openGamesHub(game, i, onClose) {
  const p = game.heroes[i].profile;
  const m = modal('hub', ''), card = m.querySelector('.card');
  const close = () => { m.close(); onClose && onClose(); };
  card.innerHTML = `<button class="x" aria-label="Close">✕</button><h2>🎮 ${T('Games', 'Trò chơi')}</h2>
    <p class="sub">${T('Tap a picture to play now. 📺 shows how to play. 📍 walks you there in the valley.', 'Chạm vào hình để chơi ngay. 📺 xem cách chơi. 📍 đi đến chỗ đó trong thung lũng.')}</p>
    ${HUB.map(sec => `<h3>${sec.icon} ${esc(sec.title())}</h3><div class="hubgrid">${sec.games.filter(id => GAMES[id]).map((id, k) => {
      const g = GAMES[id], lv = p.levels[id] || 1;
      return `<div class="hcard" style="--hc:${HUB_COLORS[(k + sec.key.length) % HUB_COLORS.length]}"><button class="hplay" data-play="${id}"><span class="hi">${g.icon}</span><b>${esc(g.name())}</b><small>${'⭐'.repeat(lv)}${'☆'.repeat(5 - lv)}</small></button><button class="hgo" data-go="${id}" aria-label="${T('Go there', 'Đi đến đó')}">📍</button><button class="hhow" data-how="${id}" aria-label="${T('How to play', 'Cách chơi')}">📺</button>${g.origin ? `<span class="hflag">${{ au: '🇦🇺', vn: '🇻🇳', both: '🇻🇳🇦🇺' }[g.origin]}</span>` : ''}</div>`;
    }).join('')}</div>`).join('')}`;
  card.querySelector('.x').onclick = close;
  card.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { const id = b.dataset.play; close(); game.playGame(i, id, 'place'); });
  card.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { close(); game.goToGame(i, b.dataset.go); });
  card.querySelectorAll('[data-how]').forEach(b => b.onclick = () => { const id = b.dataset.how; openHowTo(id, { onPlay: () => { close(); game.playGame(i, id, 'place'); } }); });
  say('Which game shall we play?', 'Mình chơi trò gì nào?');
}

// Sparkle Studio dashboard (runs in the browser, talks to studio.cjs on this computer).
const $ = s => document.querySelector(s);
let LANG = localStorage.getItem('studioLang') || 'vi';
const T = (en, vi) => LANG === 'vi' ? vi : en;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// The same page runs in SparkleStudio.exe (http://localhost:7777/studio/) and online on the game's website (/studio/),
// at the same addresses: the API, the game and its files are under BASE in both. Online, a change needs the "X-Studio" header (other websites can't send it).
const BASE = '/studio', GAME = BASE + '/game/', FILE = p => BASE + '/api/file/' + p;
const api = async (p, body) => { const r = await fetch(BASE + '/api/' + p, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Studio': '1' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (r.status === 401 && j.signin) { signIn(); throw Object.assign(new Error(T('Please sign in.', 'Vui lòng đăng nhập.')), { signin: true }); } if (!r.ok) throw new Error(j.error || r.status); return j; };
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); };
const fail = e => toast('⚠️ ' + (e.message || e));
let INFO = null, CONTENT = {};
const saveContent = async () => { await api('content', CONTENT); toast(T('Saved. Publish to send it to the children’s devices.', 'Đã lưu. Bấm Phát hành để gửi tới máy của các con.')); };

const TABS = [
  ['home', '🏠', 'Home', 'Trang chính'], ['message', '💌', 'Message', 'Lời nhắn'], ['villagers', '🧑', 'Villagers', 'Nhân vật'], ['stories', '📖', 'Stories', 'Truyện'],
  ['quiz', '💛', 'Family quiz', 'Đố vui gia đình'], ['map', '🗺️', 'Map & building', 'Bản đồ & xây dựng'], ['photos', '📷', 'Real photos', 'Ảnh thật'], ['play', '⏰', 'Defaults', 'Mặc định'], ['children', '👧', 'Children', 'Các con'], ['voices', '🎙️', 'Voices', 'Giọng đọc'],
  ['ads', '📣', 'Ads (off)', 'Quảng cáo (tắt)'], ['players', '📊', 'Players', 'Người chơi'], ['publish', '🚀', 'Publish', 'Phát hành'], ['site', '🌐', 'Website', 'Trang web'], ['check', '🩺', 'Check', 'Kiểm tra'], ['settings', '🔑', 'Settings', 'Cài đặt']
];
let cur = location.hash.slice(1) || 'home';
function nav() {
  $('#tabs').innerHTML = TABS.map(([k, i, en, vi]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${i} ${T(en, vi)}</button>`).join('');
  $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => { cur = b.dataset.k; location.hash = cur; render(); });
  document.querySelectorAll('[data-t]').forEach(e => { const [en, vi] = e.dataset.t.split('|'); e.textContent = T(en, vi); });
  document.querySelectorAll('.lang button[data-l]').forEach(b => { b.classList.toggle('on', b.dataset.l === LANG); b.onclick = () => { LANG = b.dataset.l; localStorage.setItem('studioLang', LANG); render(); }; });
}
async function render() {
  nav(); const P = $('#page');
  try {
    INFO = await api('info'); document.body.classList.toggle('online', !!INFO.online);
    if (!INFO.ok && cur !== 'settings') { cur = 'settings'; nav(); toast(T('First, choose the game folder.', 'Trước tiên, chọn thư mục game.')); }
    if (INFO.ok) CONTENT = await api('content');
    await PAGES[cur](P);
  } catch (e) { if (!e.signin) P.innerHTML = `<div class="card badtxt">${esc(e.message)}</div>`; }
}

const PAGES = {};
// ---------- home ----------
PAGES.home = async P => {
  const c = CONTENT;
  P.innerHTML = `<h2>🏠 ${T('Welcome!', 'Xin chào!')}</h2><p class="sub">${T('Change the game for your family here, then press Publish.', 'Chỉnh trò chơi cho gia đình ở đây, rồi bấm Phát hành.')}</p>
  <div class="grid">
    <div class="card stat"><b>${esc(INFO.version)}</b><span>${T('Game version', 'Phiên bản game')}</span></div>
    <div class="card stat"><b>${INFO.voices}</b><span>${T('Voice recordings', 'Bản ghi giọng đọc')}</span></div>
    <div class="card stat"><b>${(c.tales || []).length}</b><span>${T('Family stories', 'Truyện của nhà mình')}</span></div>
    <div class="card stat"><b>${(c.quiz || []).length}</b><span>${T('Quiz questions', 'Câu đố')}</span></div>
    <div class="card stat"><b>${Object.keys(c.faces || {}).length}</b><span>${T('Photo faces', 'Ảnh khuôn mặt')}</span></div>
  </div>
  ${INFO.online ? `<div class="card"><p>☁️ ${T('Sparkle Studio online. The family’s files are kept in GitHub', 'Sparkle Studio trên mạng. Tệp của gia đình được giữ trong GitHub')}: <code>${esc(INFO.game)}</code></p>
    ${INFO.unpublished ? `<p class="warn">✏️ ${T('You have saved changes that are not live yet: press Publish to send them to the children.', 'Bạn có thay đổi đã lưu nhưng chưa phát hành: bấm Phát hành để gửi tới các con.')}</p>` : ''}
    <div class="row" style="max-width:520px"><button class="btn" id="play">▶ ${T('Open the game', 'Mở game')}</button><button class="btn ghost" id="out">🚪 ${T('Sign out', 'Đăng xuất')}</button></div>
    <p class="note">${T('Changes you save here wait in a draft until you Publish; the game shows them after that. The same Studio is in SparkleStudio.exe on the family computer.', 'Thay đổi bạn lưu ở đây chờ trong bản nháp cho tới khi bạn Phát hành; game hiện chúng sau đó. Studio này cũng có trong SparkleStudio.exe trên máy tính gia đình.')}</p></div>`
  : `<div class="card"><p>${T('Game folder', 'Thư mục game')}: <code>${esc(INFO.game)}</code></p>
    <div class="row" style="max-width:520px"><button class="btn" id="play">▶ ${T('Try the game here', 'Chơi thử tại đây')}</button><button class="btn ghost" id="folder">📂 ${T('Open the folder', 'Mở thư mục')}</button></div>
    <p class="note">${T('Trying the game here uses this computer only; the children see changes after you Publish.', 'Chơi thử ở đây chỉ trên máy này; các con thấy thay đổi sau khi bạn Phát hành.')}</p></div>`}`;
  $('#play').onclick = () => window.open(INFO.online ? '/' : GAME, '_blank');
  if ($('#folder')) $('#folder').onclick = () => api('open', { folder: true }).catch(fail);
  if ($('#out')) $('#out').onclick = async () => { await fetch(BASE + '/api/logout'); signIn(); };
};
// ---------- ads: small, inside the valley, OFF until switched on here; with a guide ----------
PAGES.ads = async P => {
  const A = CONTENT.ads = CONTENT.ads || { enabled: false, perDay: 3, items: [] }; A.items = A.items || [];
  const row = (x, i) => `<div class="card adrow" data-i="${i}"><div class="row" style="align-items:flex-start;gap:14px">
      <button class="btn ghost adpic" title="${T('Picture', 'Hình')}">${x.image ? `<img src="${FILE(esc(x.image))}" style="width:120px;height:68px;object-fit:cover;border-radius:8px">` : '🖼️ ' + T('Choose picture', 'Chọn hình')}</button>
      <div style="flex:1"><label>${T('Advertiser', 'Nhà quảng cáo')}</label><input class="ad-by" maxlength="60" value="${esc(x.by || '')}">
      <label>🇦🇺 ${T('Words (English)', 'Lời (tiếng Anh)')}</label><input class="ad-en" maxlength="120" value="${esc(x.en || '')}"><label>🇻🇳 ${T('Words (Vietnamese)', 'Lời (tiếng Việt)')}</label><input class="ad-vi" maxlength="120" value="${esc(x.vi || '')}">
      <label>🔗 ${T('Link (optional, https://…; opens only after a grown-up check)', 'Liên kết (không bắt buộc, https://…; chỉ mở sau khi người lớn trả lời câu đố)')}</label><input class="ad-link" maxlength="300" value="${esc(x.link || '')}">
      <div class="row"><label><input type="checkbox" class="ad-boards" ${!x.where || x.where.includes('boards') ? 'checked' : ''}> ${T('Signboards by the roads', 'Biển bên đường')}</label>
      <label><input type="checkbox" class="ad-end" ${!x.where || x.where.includes('gameend') ? 'checked' : ''}> ${T('Small card after a mini-game', 'Thẻ nhỏ sau trò chơi')}</label>
      <label><input type="checkbox" class="ad-on" ${x.active !== false ? 'checked' : ''}> ${T('Active', 'Đang dùng')}</label></div></div>
      <button class="btn ghost ad-del" title="${T('Remove', 'Xóa')}">🗑️</button></div></div>`;
  P.innerHTML = `<h2>📣 ${T('In-game ads', 'Quảng cáo trong game')}</h2><p class="sub">${T('Ready for later, and switched OFF. Nothing shows in the game until you switch it on here and Publish.', 'Đã chuẩn bị sẵn và đang TẮT. Không có gì hiện trong game cho tới khi bạn bật ở đây và Phát hành.')}</p>
  <div class="card"><label class="row"><input type="checkbox" id="adOn" ${A.enabled === true ? 'checked' : ''}> <b>${T('Show ads in the game', 'Hiện quảng cáo trong game')}</b></label>
    <label>${T('Most cards after mini-games per day (each device)', 'Số thẻ tối đa sau trò chơi mỗi ngày (mỗi máy)')}</label><input type="number" id="adPer" min="0" max="10" value="${A.perDay ?? 3}" style="max-width:100px"></div>
  <div id="adList">${A.items.map(row).join('')}</div>
  <div class="bar"><button class="btn ghost" id="adAdd">+ ${T('Add an ad', 'Thêm quảng cáo')}</button><button class="btn" id="adSave">💾 ${T('Save', 'Lưu')}</button></div>
  <details class="card" open><summary><b>📘 ${T('Guide: ads in a children’s game', 'Hướng dẫn: quảng cáo trong game trẻ em')}</b></summary>
  <ol class="guide">
    <li>${T('How it works: add a picture (JPG/PNG, landscape, about 1200×680, under 600 KB), the words in both languages and, if you like, a link. Choose where it appears, tick “Show ads”, Save, then Publish. Devices get it the next time they are online.', 'Cách hoạt động: thêm hình (JPG/PNG, nằm ngang, khoảng 1200×680, dưới 600 KB), lời bằng hai thứ tiếng và liên kết nếu muốn. Chọn chỗ hiện, đánh dấu “Hiện quảng cáo”, Lưu, rồi Phát hành. Máy các con nhận được lần tới khi có mạng.')}</li>
    <li>${T('Where ads appear: a few signboards beside the roads near the towns, and a small card under the “You did it!” screen of a mini-game (a few times a day at most). Never in the middle of play, never in stories, how-to films or learning questions.', 'Quảng cáo hiện ở đâu: vài tấm biển bên đường gần các thành phố, và một thẻ nhỏ dưới màn hình “Con làm được rồi!” sau trò chơi (tối đa vài lần mỗi ngày). Không bao giờ giữa lúc chơi, trong truyện, phim hướng dẫn hay câu hỏi học tập.')}</li>
    <li>${T('Every ad is labelled “Ad / Quảng cáo”. Links open only after a grown-up answers a sum, and open outside the game.', 'Mỗi quảng cáo đều có nhãn “Ad / Quảng cáo”. Liên kết chỉ mở sau khi người lớn trả lời một phép cộng, và mở ra ngoài game.')}</li>
    <li>${T('Privacy: the game collects nothing. No ad networks, trackers, cookies or counting. Do not add tracking links (with ?utm=… or redirect services) — in many countries collecting data from children under 13 needs a parent’s consent (US COPPA, EU/UK GDPR-K, Australia’s Privacy Act, Vietnam’s Decree 13/2023 on personal data).', 'Quyền riêng tư: game không thu thập gì. Không mạng quảng cáo, không theo dõi, không cookie, không đếm lượt. Đừng dùng liên kết theo dõi (có ?utm=… hay dịch vụ chuyển hướng) — ở nhiều nước, thu thập dữ liệu của trẻ dưới 13 tuổi cần sự đồng ý của cha mẹ (COPPA của Mỹ, GDPR-K của EU/Anh, Luật Quyền riêng tư của Úc, Nghị định 13/2023 của Việt Nam về dữ liệu cá nhân).')}</li>
    <li>${T('What is suitable: things that are good for children and families (books, learning, museums, parks, local family businesses). Not allowed: food and drinks high in sugar, salt or fat, toys with violence, gambling or “loot boxes”, anything for adults. Australia’s AANA Children’s Code and Vietnam’s Advertising Law (2012, Art. 8 and 9) set rules for ads to children; check them, or ask an advisor, before taking money for an ad.', 'Phù hợp: những thứ tốt cho trẻ và gia đình (sách, học tập, bảo tàng, công viên, cửa hàng gia đình ở địa phương). Không được: đồ ăn uống nhiều đường, muối, béo, đồ chơi bạo lực, cờ bạc hay “hộp quà may rủi”, thứ dành cho người lớn. Bộ quy tắc quảng cáo cho trẻ em AANA của Úc và Luật Quảng cáo Việt Nam (2012, Điều 8 và 9) có quy định riêng; hãy xem kỹ hoặc hỏi người tư vấn trước khi nhận tiền quảng cáo.')}</li>
    <li>${T('Words for children: short, friendly, no pressure (“Ask your parents to buy now!” is not allowed). No pretending an ad is part of the story, and no characters from the game selling things.', 'Lời cho trẻ: ngắn, thân thiện, không thúc ép (“Bảo bố mẹ mua ngay!” là không được). Không giả làm một phần câu chuyện, và nhân vật trong game không bán hàng.')}</li>
    <li>${T('To pause all ads at once, untick “Show ads”, Save and Publish. Removing a picture here removes it from the next publish.', 'Để tạm ngưng mọi quảng cáo, bỏ dấu “Hiện quảng cáo”, Lưu và Phát hành. Xóa hình ở đây thì lần phát hành sau sẽ không còn hình đó.')}</li>
  </ol></details>`;
  const collect = () => { A.enabled = $('#adOn').checked; A.perDay = Math.max(0, Math.min(10, +$('#adPer').value || 0));
    P.querySelectorAll('.adrow').forEach(r => { const x = A.items[+r.dataset.i]; x.by = r.querySelector('.ad-by').value.trim(); x.en = r.querySelector('.ad-en').value.trim(); x.vi = r.querySelector('.ad-vi').value.trim();
      const l = r.querySelector('.ad-link').value.trim(); x.link = /^https:\/\//.test(l) ? l : ''; x.active = r.querySelector('.ad-on').checked;
      x.where = [r.querySelector('.ad-boards').checked && 'boards', r.querySelector('.ad-end').checked && 'gameend'].filter(Boolean); }); };
  $('#adAdd').onclick = () => { collect(); A.items.push({ by: '', en: '', vi: '', link: '', where: ['boards', 'gameend'], active: true }); PAGES.ads(P); };
  P.querySelectorAll('.ad-del').forEach(b => b.onclick = () => { collect(); A.items.splice(+b.closest('.adrow').dataset.i, 1); PAGES.ads(P); });
  P.querySelectorAll('.adpic').forEach(b => b.onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = async () => { try { collect(); const i = +b.closest('.adrow').dataset.i, r = await api('adimage', { id: A.items[i].by || 'ad', dataUrl: rd.result }); A.items[i].image = r.image; PAGES.ads(P); } catch (e) { fail(e); } }; rd.readAsDataURL(f); }; inp.click(); });
  $('#adSave').onclick = () => { collect(); if (A.enabled && A.items.some(x => x.active !== false && !x.image)) return toast(T('Each active ad needs a picture.', 'Mỗi quảng cáo đang dùng cần có hình.')); saveContent().catch(fail); };
};
// ---------- message ----------
PAGES.message = async P => {
  const m = CONTENT.message || {};
  P.innerHTML = `<h2>💌 ${T('A message for the children', 'Lời nhắn cho các con')}</h2><p class="sub">${T('Shown once a day when they start playing, and read aloud.', 'Hiện mỗi ngày một lần khi các con bắt đầu chơi, và được đọc to.')}</p>
  <div class="card"><label>🇦🇺 English</label><textarea id="en" maxlength="400">${esc(m.en || '')}</textarea><label>🇻🇳 Tiếng Việt</label><textarea id="vi" maxlength="400">${esc(m.vi || '')}</textarea></div>
  <div class="bar"><button class="btn ghost" id="clear">${T('No message', 'Không nhắn')}</button><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  $('#save').onclick = () => { CONTENT.message = { en: $('#en').value.trim(), vi: $('#vi').value.trim() }; if (!CONTENT.message.en && !CONTENT.message.vi) delete CONTENT.message; saveContent().catch(fail); };
  $('#clear').onclick = () => { delete CONTENT.message; saveContent().then(render).catch(fail); };
};
// ---------- villagers: names and photo faces ----------
PAGES.villagers = async P => {
  const list = await api('names'); CONTENT.names = CONTENT.names || {}; CONTENT.faces = CONTENT.faces || {}; CONTENT.genders = CONTENT.genders || {};
  P.innerHTML = `<h2>🧑 ${T('Villagers: names and faces', 'Nhân vật: tên và khuôn mặt')}</h2><p class="sub">${T('Give anyone a different name, or a real face from a photo. A name or face changed on a child’s device still wins there.', 'Đổi tên ai cũng được, hoặc gắn khuôn mặt thật từ ảnh. Tên hay khuôn mặt đã đổi trên máy của con vẫn được ưu tiên ở máy đó.')}</p>
  <div class="card"><input type="text" id="find" placeholder="🔎 ${T('Find someone…', 'Tìm nhân vật…')}"><table><thead><tr><th></th><th>${T('Name in the game', 'Tên trong game')}</th><th>🇦🇺 English</th><th>🇻🇳 Tiếng Việt</th><th>${T('Voice', 'Giọng')}</th></tr></thead><tbody>${list.map(n => {
    const nm = CONTENT.names[n.id] || {}, f = CONTENT.faces[n.id];
    return `<tr data-id="${esc(n.id)}"><td><button class="face" title="${T('Photo face', 'Ảnh khuôn mặt')}">${f ? `<img class="face" src="${FILE(esc(f.photo))}?${Date.now()}">` : '📷'}</button></td><td><b>${esc(n.id)}</b><br><span class="note">${esc(n.en)}</span></td>
      <td><input type="text" data-l="en" value="${esc(nm.en || '')}" placeholder="${esc(n.en)}"></td><td><input type="text" data-l="vi" value="${esc(nm.vi || '')}" placeholder="${esc(n.id)}"></td>
      <td><select data-g><option value="">${T('auto', 'tự động')}</option><option value="f" ${CONTENT.genders[n.id] === 'f' ? 'selected' : ''}>👩 ${T('woman/girl', 'nữ')}</option><option value="m" ${CONTENT.genders[n.id] === 'm' ? 'selected' : ''}>👨 ${T('man/boy', 'nam')}</option></select></td></tr>`; }).join('')}</tbody></table></div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save names and faces', 'Lưu tên và khuôn mặt')}</button></div>`;
  $('#find').oninput = e => { const q = e.target.value.toLowerCase(); P.querySelectorAll('tbody tr').forEach(r => r.hidden = q && !r.textContent.toLowerCase().includes(q) && !r.dataset.id.toLowerCase().includes(q)); };
  P.querySelectorAll('.face').forEach(b => b.onclick = () => {
    const id = b.closest('tr').dataset.id;
    if (CONTENT.faces[id] && !confirm(T('Choose a new photo? (Cancel removes the face.)', 'Chọn ảnh mới? (Hủy để bỏ khuôn mặt.)'))) { delete CONTENT.faces[id]; b.innerHTML = '📷'; return; }
    cropper(id, async out => { if (!out) return; try { const r = await api('face', { id, dataUrl: out.photo }); CONTENT.faces[id] = { photo: r.photo, skin: out.skin }; b.innerHTML = `<img class="face" src="${FILE(esc(r.photo))}?${Date.now()}">`; } catch (e) { fail(e); } });
  });
  $('#save').onclick = () => { P.querySelectorAll('tbody tr').forEach(r => { const en = r.querySelector('[data-l=en]').value.trim(), vi = r.querySelector('[data-l=vi]').value.trim(), g = r.querySelector('[data-g]').value; if (en || vi) CONTENT.names[r.dataset.id] = { en, vi }; else delete CONTENT.names[r.dataset.id]; if (g) { CONTENT.genders[r.dataset.id] = g; if (en) CONTENT.genders[en] = g; } else delete CONTENT.genders[r.dataset.id]; }); saveContent().catch(fail); };
};
// the round face cropper (drag to move, wheel or slider to zoom); gives { photo: JPEG data URL, skin }
function cropper(id, done) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="card"><h3>📷 ${esc(id)}</h3><canvas class="crop" width="480" height="480"></canvas>
    <p class="note">${T('A clear, front-facing photo. Eyebrows near the top of the circle, chin near the bottom.', 'Ảnh rõ, nhìn thẳng. Lông mày gần mép trên vòng tròn, cằm gần mép dưới.')}</p>
    <div class="row"><input type="file" accept="image/*"><input type="range" min="1" max="5" step=".01" value="1"></div>
    <div class="bar"><button class="btn ghost" data-x>${T('Cancel', 'Hủy')}</button><button class="btn" data-ok disabled>${T('Use this face', 'Dùng khuôn mặt này')}</button></div></div>`;
  document.body.appendChild(m);
  const cv = m.querySelector('canvas'), cx = cv.getContext('2d'), zr = m.querySelector('[type=range]'), ok = m.querySelector('[data-ok]');
  let img = null, zoom = 1, ox = 0, oy = 0, drag = null;
  const draw = () => { cx.fillStyle = '#eee'; cx.fillRect(0, 0, 480, 480); if (img) { const s = Math.max(480 / img.width, 480 / img.height) * zoom; cx.drawImage(img, 240 - img.width * s / 2 + ox, 240 - img.height * s / 2 + oy, img.width * s, img.height * s); }
    cx.save(); cx.fillStyle = 'rgba(30,20,40,.45)'; cx.beginPath(); cx.rect(0, 0, 480, 480); cx.arc(240, 240, 205, 0, 7, true); cx.fill('evenodd'); cx.restore(); cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.beginPath(); cx.arc(240, 240, 205, 0, 7); cx.stroke(); ok.disabled = !img; };
  draw();
  m.querySelector('[type=file]').onchange = e => { const f = e.target.files[0]; if (!f) return; const i = new Image(); i.onload = () => { img = i; zoom = 1; ox = oy = 0; zr.value = 1; draw(); }; i.src = URL.createObjectURL(f); };
  zr.oninput = () => { zoom = +zr.value; draw(); };
  cv.onwheel = e => { e.preventDefault(); zoom = Math.min(5, Math.max(1, zoom * (e.deltaY < 0 ? 1.06 : .94))); zr.value = zoom; draw(); };
  cv.onpointerdown = e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => { if (!drag) return; const k = 480 / cv.clientWidth; ox += (e.clientX - drag[0]) * k; oy += (e.clientY - drag[1]) * k; drag = [e.clientX, e.clientY]; draw(); };
  cv.onpointerup = () => { drag = null; };
  m.querySelector('[data-x]').onclick = () => { m.remove(); done(null); };
  ok.onclick = () => {
    const S = 256, o = document.createElement('canvas'); o.width = o.height = S; const c2 = o.getContext('2d'), s = Math.max(480 / img.width, 480 / img.height) * zoom, k = S / 410;
    c2.drawImage(img, (240 - img.width * s / 2 + ox - 35) * k, (240 - img.height * s / 2 + oy - 35) * k, img.width * s * k, img.height * s * k);
    let r = 0, g = 0, b = 0, n = 0; for (const [px, py] of [[.3, .62], [.7, .62], [.5, .32]]) { const d = c2.getImageData(px * S - 8, py * S - 8, 16, 16).data; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
    const hx = v => Math.round(v / n).toString(16).padStart(2, '0');
    m.remove(); done({ photo: o.toDataURL('image/jpeg', .85), skin: '#' + hx(r) + hx(g) + hx(b) });
  };
}
// ---------- stories ----------
const FLAGS = ['💛', '🇻🇳', '🇦🇺', '🇨🇳', '🇮🇳'];
PAGES.stories = async P => {
  CONTENT.tales = CONTENT.tales || []; let edit = null;
  const list = () => {
    P.innerHTML = `<h2>📖 ${T('The family’s own stories', 'Truyện của nhà mình')}</h2><p class="sub">${T('They appear on the Stories shelf and are read aloud page by page, with the pictures moving.', 'Truyện hiện trên kệ Truyện và được đọc to từng trang, hình ảnh chuyển động.')}</p>
    ${CONTENT.tales.map((t, i) => `<div class="card row"><div style="flex:3"><b>${esc(t.flag)} ${esc(T(t.en, t.vi))}</b><br><span class="note">${t.pages.length} ${T('pages', 'trang')}</span></div><button class="btn small" data-e="${i}">✏️ ${T('Edit', 'Sửa')}</button><button class="btn small bad" data-d="${i}">🗑️</button></div>`).join('') || `<div class="card note">${T('No stories yet.', 'Chưa có truyện nào.')}</div>`}
    <div class="bar"><button class="btn" id="new">➕ ${T('New story', 'Truyện mới')}</button></div>`;
    P.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { edit = +b.dataset.e; editor(); });
    P.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (confirm(T('Delete this story?', 'Xóa truyện này?'))) { CONTENT.tales.splice(+b.dataset.d, 1); saveContent().then(list).catch(fail); } });
    $('#new').onclick = () => { CONTENT.tales.push({ id: 's' + Date.now().toString(36), flag: '💛', en: '', vi: '', pages: [['🏡😊', '', '']] }); edit = CONTENT.tales.length - 1; editor(); };
  };
  const editor = () => {
    const t = CONTENT.tales[edit];
    P.innerHTML = `<h2>✏️ ${T('Story', 'Truyện')}</h2><div class="card"><div class="row"><div><label>${T('Flag', 'Cờ')}</label><select id="flag">${FLAGS.map(f => `<option ${f === t.flag ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
      <div style="flex:3"><label>🇦🇺 ${T('Title', 'Tên truyện')}</label><input type="text" id="ten" value="${esc(t.en)}"></div><div style="flex:3"><label>🇻🇳 ${T('Title', 'Tên truyện')}</label><input type="text" id="tvi" value="${esc(t.vi)}"></div></div></div>
      <div id="pages"></div><div class="bar"><button class="btn ghost" id="add">➕ ${T('Add a page', 'Thêm trang')}</button><button class="btn ghost" id="back">← ${T('Back', 'Quay lại')}</button><button class="btn" id="save">💾 ${T('Save story', 'Lưu truyện')}</button></div>
      <p class="note">${T('Pictures: type or paste emoji (🐉🌊👧). People and animals in them come alive in the story theatre.', 'Hình: gõ hoặc dán biểu tượng cảm xúc (🐉🌊👧). Người và con vật trong đó sẽ cử động trên sân khấu truyện.')}</p>`;
    const pages = () => { $('#pages').innerHTML = t.pages.map((p, i) => `<div class="card page-card" data-i="${i}"><div class="row"><div><label>${T('Page', 'Trang')} ${i + 1} · ${T('pictures', 'hình')}</label><input type="text" class="pics" data-k="0" value="${esc(p[0])}"></div>
      <div class="row" style="flex:0 0 auto"><button class="btn small ghost" data-up>⬆️</button><button class="btn small ghost" data-dn>⬇️</button><button class="btn small bad" data-rm>🗑️</button></div></div>
      <label>🇦🇺 English</label><textarea data-k="1">${esc(p[1])}</textarea><label>🇻🇳 Tiếng Việt</label><textarea data-k="2">${esc(p[2])}</textarea></div>`).join('');
      $('#pages').querySelectorAll('.page-card').forEach(c => { const i = +c.dataset.i;
        c.querySelectorAll('[data-k]').forEach(f => f.oninput = () => { t.pages[i][+f.dataset.k] = f.value; });
        c.querySelector('[data-up]').onclick = () => { if (i) { [t.pages[i - 1], t.pages[i]] = [t.pages[i], t.pages[i - 1]]; pages(); } };
        c.querySelector('[data-dn]').onclick = () => { if (i < t.pages.length - 1) { [t.pages[i + 1], t.pages[i]] = [t.pages[i], t.pages[i + 1]]; pages(); } };
        c.querySelector('[data-rm]').onclick = () => { if (t.pages.length > 1) { t.pages.splice(i, 1); pages(); } }; }); };
    pages();
    $('#add').onclick = () => { t.pages.push(['', '', '']); pages(); };
    $('#back').onclick = list;
    $('#save').onclick = () => { t.flag = $('#flag').value; t.en = $('#ten').value.trim(); t.vi = $('#tvi').value.trim(); if (!t.en && !t.vi) return toast(T('Give the story a title.', 'Đặt tên cho truyện nhé.')); t.pages = t.pages.filter(p => p[1] || p[2]); saveContent().then(list).catch(fail); };
  };
  list();
};
// ---------- family quiz ----------
PAGES.quiz = async P => {
  CONTENT.quiz = CONTENT.quiz || [];
  const draw = () => {
    P.innerHTML = `<h2>💛 ${T('Family quiz', 'Đố vui gia đình')}</h2><p class="sub">${T('Your own questions (“What is Grandma’s name?”). The game “Family Quiz” appears first on the Learning shelf.', 'Câu hỏi của nhà mình (“Bà tên gì?”). Trò “Đố Vui Gia Đình” hiện đầu tiên trên kệ Học.')}</p>
    ${CONTENT.quiz.map((q, i) => `<div class="card" data-i="${i}"><div class="row"><div style="flex:0 0 90px"><label>${T('Picture', 'Hình')}</label><input type="text" data-f="pic" value="${esc(q.pic || '')}"></div>
      <div><label>🇦🇺 ${T('Question', 'Câu hỏi')}</label><input type="text" data-f="q0" value="${esc(q.q[0])}"></div><div><label>🇻🇳 ${T('Question', 'Câu hỏi')}</label><input type="text" data-f="q1" value="${esc(q.q[1])}"></div><button class="btn small bad" data-rm style="flex:0 0 auto">🗑️</button></div>
      ${q.answers.map((a, j) => `<div class="row"><label style="flex:0 0 auto"><input type="radio" name="r${i}" data-right="${j}" ${q.right === j ? 'checked' : ''}> ${T('right', 'đúng')}</label><input type="text" data-a="${j}" data-l="0" value="${esc(a[0])}" placeholder="English"><input type="text" data-a="${j}" data-l="1" value="${esc(a[1])}" placeholder="Tiếng Việt"></div>`).join('')}
      ${q.answers.length < 4 ? `<button class="btn small ghost" data-more>➕ ${T('Another answer', 'Thêm đáp án')}</button>` : ''}</div>`).join('')}
    <div class="bar"><button class="btn ghost" id="new">➕ ${T('New question', 'Câu hỏi mới')}</button><button class="btn" id="save">💾 ${T('Save quiz', 'Lưu câu đố')}</button></div>`;
    P.querySelectorAll('[data-i]').forEach(c => { const q = CONTENT.quiz[+c.dataset.i];
      c.querySelectorAll('[data-f]').forEach(f => f.oninput = () => { if (f.dataset.f === 'pic') q.pic = f.value; else q.q[f.dataset.f === 'q0' ? 0 : 1] = f.value; });
      c.querySelectorAll('[data-a]').forEach(f => f.oninput = () => { q.answers[+f.dataset.a][+f.dataset.l] = f.value; });
      c.querySelectorAll('[data-right]').forEach(f => f.onchange = () => { q.right = +f.dataset.right; });
      c.querySelector('[data-rm]').onclick = () => { CONTENT.quiz.splice(+c.dataset.i, 1); draw(); };
      const mo = c.querySelector('[data-more]'); if (mo) mo.onclick = () => { q.answers.push(['', '']); draw(); }; });
    $('#new').onclick = () => { CONTENT.quiz.push({ q: ['', ''], pic: '❓', answers: [['', ''], ['', '']], right: 0 }); draw(); };
    $('#save').onclick = () => { CONTENT.quiz = CONTENT.quiz.map(q => ({ ...q, answers: q.answers.filter(a => a[0] || a[1]) })).filter(q => (q.q[0] || q.q[1]) && q.answers.length >= 2 && q.right < q.answers.length); saveContent().then(draw).catch(fail); };
  };
  draw();
};
// ---------- defaults sent to every device (applied once each time they change here) ----------
PAGES.play = async P => {
  const d = CONTENT.defaults || {}, opt = (k, list) => list.map(([v, l]) => `<option value="${v}" ${String(d[k] ?? '') === String(v) ? 'selected' : ''}>${l}</option>`).join('');
  const keep = `<option value="">${T('(leave as each device has it)', '(giữ như trên từng máy)')}</option>`;
  P.innerHTML = `<h2>⏰ ${T('Defaults for every device', 'Mặc định cho mọi máy')}</h2><p class="sub">${T('Choose here once for all the children’s devices. Each device takes the new values the next time it opens the game online; a grown-up can still change them on the device.', 'Chọn ở đây một lần cho mọi máy của các con. Mỗi máy nhận giá trị mới khi mở game có mạng lần tới; người lớn vẫn đổi được trên máy.')}</p>
  <div class="card grid">
    <div><label>🌙 ${T('Rest reminder after', 'Nhắc nghỉ sau')}</label><select data-k="restMins">${keep}${opt('restMins', [[0, T('Never', 'Không nhắc')], [15, '15 ' + T('minutes', 'phút')], [20, '20 ' + T('minutes', 'phút')], [30, '30 ' + T('minutes', 'phút')], [45, '45 ' + T('minutes', 'phút')], [60, '60 ' + T('minutes', 'phút')]])}</select></div>
    <div><label>🌏 ${T('Language', 'Ngôn ngữ')}</label><select data-k="lang">${keep}${opt('lang', [['en', '🇦🇺 English'], ['vi', '🇻🇳 Tiếng Việt']])}</select></div>
    <div><label>🗣️ ${T('Bilingual voice', 'Giọng song ngữ')}</label><select data-k="bilingual">${keep}${opt('bilingual', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>💰 ${T('Money', 'Tiền tệ')}</label><select data-k="currency">${keep}${opt('currency', [['AUD', 'AUD $'], ['VND', 'VND đ']])}</select></div>
    <div><label>💬 ${T('Captions', 'Phụ đề')}</label><select data-k="captions">${keep}${opt('captions', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>🌿 ${T('Calm mode', 'Chế độ êm dịu')}</label><select data-k="calm">${keep}${opt('calm', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
    <div><label>🔠 ${T('Text size', 'Cỡ chữ')}</label><select data-k="textSize">${keep}${opt('textSize', [[0, T('Normal', 'Bình thường')], [1, T('Big', 'To')], [2, T('Bigger', 'To hơn')]])}</select></div>
    <div><label>🎵 ${T('Music', 'Nhạc')}</label><select data-k="music">${keep}${opt('music', [['true', T('On', 'Bật')], ['false', T('Off', 'Tắt')]])}</select></div>
  </div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  $('#save').onclick = () => {
    const out = {}; P.querySelectorAll('[data-k]').forEach(s => { const v = s.value; if (v === '') return; out[s.dataset.k] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v; });
    CONTENT.defaults = out; saveContent().catch(fail);
  };
};
// ---------- children: open a backup, see progress, change it, save a new backup ----------
PAGES.children = async P => {
  P.innerHTML = `<h2>👧 ${T('Children and their progress', 'Các con và tiến bộ')}</h2><p class="sub">${T('On a device: ⚙️ Grown-ups → Save backup. Open that file here to see each child’s progress, change names or coins, then save a new backup and open it on the device (Grown-ups → Open backup).', 'Trên máy: ⚙️ Người lớn → Lưu bản sao. Mở tệp đó ở đây để xem tiến bộ của từng con, đổi tên hay xu, rồi lưu bản sao mới và mở lại trên máy (Người lớn → Mở bản sao).')}</p>
  <div class="card"><input type="file" id="f" accept=".txt,.json,text/plain"></div><div id="kids"></div>`;
  $('#f').onchange = async e => {
    const file = e.target.files[0]; if (!file) return; let data;
    try { data = JSON.parse(await file.text()); if (data.app !== 'sparkle-valley' || !Array.isArray(data.profiles)) throw 0; } catch (x) { return toast(T('That is not a Sparkle Valley backup.', 'Đó không phải bản sao Thung Lũng Lấp Lánh.')); }
    const n = o => o ? Object.keys(o).length : 0;
    $('#kids').innerHTML = `<div class="card"><label>💰 ${T('Coins (shared)', 'Xu (dùng chung)')}</label><input type="number" id="coins" value="${+((data.farm || {}).coins) || 0}" min="0" max="99999"></div>` + data.profiles.map((p, i) => `<div class="card" data-i="${i}"><div class="row"><div><label>${T('Name', 'Tên')}</label><input type="text" data-n value="${esc(p.name)}" maxlength="16"></div>
      <div><label>${T('Age', 'Tuổi')}</label><select data-a><option value="little" ${p.age !== 'big' ? 'selected' : ''}>🧸 ${T('Little (under 5)', 'Bé nhỏ (dưới 5)')}</option><option value="big" ${p.age === 'big' ? 'selected' : ''}>🎒 ${T('Big kid (5–8)', 'Bé lớn (5–8)')}</option></select></div></div>
      <p>📮 ${n(p.postcards)} ${T('postcards', 'bưu thiếp')} · 🌟 ${(p.stickers || []).length} ${T('stickers', 'hình dán')} · 🎮 ${Object.values(p.wins || {}).reduce((a, b) => a + b, 0)} ${T('games won', 'trò thắng')} · 📖 ${n(p.tales)} ${T('tales', 'truyện')} · 🔮 ${p.orbs || 0} · 🍃 ${n(p.leafies)}/24 · 🛂 ${n(p.stamps)}</p>
      <details><summary>${T('Levels in each game', 'Cấp độ từng trò')}</summary><p class="note">${Object.entries(p.levels || {}).map(([g, l]) => `${esc(g)} ${'⭐'.repeat(l)}`).join(' · ') || '—'}</p></details></div>`).join('') +
      `<div class="bar"><button class="btn" id="save">💾 ${T('Save a new backup', 'Lưu bản sao mới')}</button></div>`;
    $('#save').onclick = () => {
      $('#kids').querySelectorAll('[data-i]').forEach(c => { const p = data.profiles[+c.dataset.i]; p.name = c.querySelector('[data-n]').value.trim().slice(0, 16) || p.name; p.age = c.querySelector('[data-a]').value; });
      data.farm = data.farm || {}; data.farm.coins = Math.max(0, Math.min(99999, +$('#coins').value || 0)); data.saved = Date.now();
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'text/plain' })); a.download = 'sparkle-valley-backup-' + new Date().toISOString().slice(0, 10) + '-studio.txt'; a.click();
      toast(T('Saved. Open it on the device: Grown-ups → Open backup.', 'Đã lưu. Mở trên máy: Người lớn → Mở bản sao.'));
    };
  };
};
// ---------- voices ----------
// The same lines the game speaks (tools/voice-lines.mjs), worked out here from the game's own files, plus the
// family's stories, quiz and message. Each missing recording can be made with Azure, Piper (free, on this computer)
// or recorded with the microphone.
const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const Q = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\$]|\\.|\$(?!\{))*\x60)`;
const unq = s => s.slice(1, -1).replace(/\\(['"\x60\\])/g, '$1').replace(/\\n/g, ' ');
const PATTERNS = [String.raw`\b(?:say|sayAsync|api\.say|\.say)\(\s*(${Q})\s*,\s*(${Q})`, String.raw`\[\s*(${Q})\s*,\s*(${Q})\s*\]`, String.raw`\[\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\]`, String.raw`\bS\(\s*${Q}\s*,\s*(${Q})\s*,\s*(${Q})\s*\)`, String.raw`\b(?:fact|story|hint|about)\s*:\s*\[\s*(${Q})\s*,\s*(${Q})`];
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
async function allJobs() {
  const files = await api('srcfiles'), seen = new Map();
  for (const f of files) {
    const src = await (await fetch(GAME + f)).text();
    for (const p of PATTERNS) { const re = new RegExp(p, 'g'); let m; while ((m = re.exec(src))) { const en = unq(m[1]).trim(), vi = unq(m[2]).trim(); if (!en || !vi || en.length < 2) continue; if (/^[a-z]{2}:/.test(en) || /^[a-z]{2}:/.test(vi)) continue; if (!VI.test(vi) && en === vi) continue; if (/^[\p{Emoji}\s✓✕+−=]+$/u.test(en)) continue; if (en.split(/\s+/).length < 2 && !/[!?.]$/.test(en)) continue; seen.set(en + '\0' + vi, [en, vi]); } }
  }
  const c = CONTENT, add = (en, vi) => { if (en || vi) seen.set((en || vi) + '\0' + (vi || en), [en || vi, vi || en]); };
  (c.tales || []).forEach(t => { add(t.en, t.vi); t.pages.forEach(p => add(p[1], p[2])); });
  (c.quiz || []).forEach(q => { add(q.q[0], q.q[1]); q.answers.forEach(a => add(a[0] + '!', a[1] + '!')); });
  if (c.message) add(c.message.en, c.message.vi);
  const { swapNames } = await import(GAME + 'js/i18n.js'), { LEARN } = await import(GAME + 'js/words2.js'), { packHash } = await import(GAME + 'js/packhash.js');
  const jobs = new Map(); const put = (lang, text) => { if (text) jobs.set(packHash(lang, text), { lang, text }); };
  for (const [en, vi] of seen.values()) { put('en', swapNames(en, 'en')); put('vi', swapNames(vi, 'vi')); }
  for (const [lang, L] of Object.entries(LEARN)) for (const w of L.words) put(lang, w[3]);
  const cities = await (await fetch(GAME + 'js/cities.js')).text(), re = /\['([^'\\]+)', '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '(zh|hi)'\]/g; let m; while ((m = re.exec(cities))) put(m[2], m[1]);
  // lines built while playing (names, numbers, colours…): collected by tools/voice-harvest.mjs and sent from devices
  for (const l of await api('voices/extra').catch(() => [])) if (CAST[l.lang]) put(l.lang, l.text);
  // the inbox: lines the children's devices had to say with the machine voice, sent by themselves
  INBOX = await api('voices/inbox').catch(() => []);
  for (const l of INBOX) if (CAST[l.lang]) { put(l.lang, l.text); const j = jobs.get(packHash(l.lang, l.text)); if (j) j.asked = l.n; }
  return jobs;
}
let voiceStop = false, INBOX = [];
PAGES.voices = async P => {
  P.innerHTML = `<h2>🎙️ ${T('Voices', 'Giọng đọc')}</h2><p class="sub">${T('New games and stories need new recordings. Lines without one use the device’s own voice until they are made.', 'Trò chơi và truyện mới cần bản ghi mới. Câu nào chưa có thì máy tự đọc bằng giọng của máy cho tới khi có bản ghi.')}</p><div class="card" id="vsum">${T('Counting the lines…', 'Đang đếm các câu…')}</div>`;
  const jobs = await allJobs(), have = await api('voices/have');
  const missing = []; for (const [h, j] of jobs) for (const s of CAST[j.lang]) if (!have[j.lang][s].includes(h)) missing.push({ hash: h, slot: s, ...j });
  missing.sort((a, b) => (b.asked || 0) - (a.asked || 0)); // the inbox first: what the children are hearing now
  const by = L => missing.filter(x => x.lang === L).length, chars = missing.reduce((a, x) => a + x.text.length, 0);
  const asked = missing.filter(x => x.asked), askedSlots = new Set(asked.map(x => x.hash)).size;
  $('#vsum').innerHTML = `${INBOX.length ? `<div class="inbox"><h3>📥 ${T('Inbox: lines the children heard in the machine voice', 'Hộp thư: câu các con nghe bằng giọng máy')}</h3><p>${askedSlots ? `<b class="warn">${askedSlots}</b> ${T('of them still need a recording. Make them first with one click:', 'câu vẫn cần bản ghi. Tạo chúng trước bằng một chạm:')}</p><div class="row"><button class="btn" id="azin" ${!INFO.conf.azure ? 'disabled' : ''}>☁️ ${T('Make the inbox lines with Azure', 'Tạo các câu trong hộp thư bằng Azure')}</button></div>` : `<p class="ok">✅ ${T('Every line the devices asked for has a recording now.', 'Mọi câu các máy hỏi đã có bản ghi.')}</p>`}<p class="note">${T('Devices send these by themselves when they say a line without a recording (never a line with a child’s name). They are also in the list below, marked 📥.', 'Các máy tự gửi khi phải đọc một câu chưa có bản ghi (không bao giờ có câu chứa tên của bé). Chúng cũng nằm trong danh sách bên dưới, có dấu 📥.')}</p></div>` : ''}<p><b>${jobs.size}</b> ${T('lines in the game', 'câu trong game')} · <b class="${missing.length ? 'warn' : 'ok'}">${missing.length}</b> ${T('recordings missing', 'bản ghi còn thiếu')} (🇦🇺 ${by('en')} · 🇻🇳 ${by('vi')} · 🇨🇳 ${by('zh')} · 🇮🇳 ${by('hi')}), ${chars} ${T('characters', 'ký tự')}.</p>
    <div class="row"><button class="btn" id="az" ${!INFO.conf.azure || !missing.length ? 'disabled' : ''}>☁️ ${T('Make them with Azure', 'Tạo bằng Azure')}</button><button class="btn pink" id="pi" ${!INFO.conf.piper || !missing.length ? 'disabled' : ''}>💻 ${T('Make them with Piper (free, offline)', 'Tạo bằng Piper (miễn phí, không cần mạng)')}</button><button class="btn ghost" id="stop" disabled>⏹ ${T('Stop', 'Dừng')}</button></div>
    <p class="note">${!INFO.conf.azure ? T('Azure: add your key in Settings. ', 'Azure: thêm khóa trong Cài đặt. ') : T('Azure free tier: about 20 a minute, so this goes slowly; you can stop and carry on later. ', 'Azure miễn phí: khoảng 20 câu một phút nên hơi chậm; dừng lúc nào cũng được, lần sau làm tiếp. ')}${!INFO.conf.piper ? T('Piper: download it and its voices, then set them in Settings.', 'Piper: tải về cùng giọng đọc, rồi chọn trong Cài đặt.') : ''}</p>
    <div class="prog"><i id="pb"></i></div><p class="note" id="pt"></p></div>
    <div class="card"><h3>📱 ${T('Lines a device said with the machine voice', 'Câu máy đã đọc bằng giọng máy')}</h3><p class="note">${T('On the device: ⚙️ Grown-ups → Save backup. Open that file here: every line it had to say without a recording is added to the list above, ready to make.', 'Trên máy: ⚙️ Phụ huynh → Lưu bản sao. Mở tệp đó ở đây: mọi câu máy phải đọc khi chưa có bản ghi sẽ được thêm vào danh sách trên, sẵn sàng để tạo.')}</p><input type="file" id="vrep" accept=".txt,.json,text/plain"><p class="note" id="vrepres"></p></div>
    <div class="card"><h3>🎤 ${T('Or record them yourselves', 'Hoặc tự thu giọng')}</h3><p class="note">${T('Tap ⏺, read the line, tap ⏹. Your own voice then plays in the game.', 'Bấm ⏺, đọc câu, bấm ⏹. Giọng của bạn sẽ được phát trong game.')}</p>
    <input type="text" id="vf" placeholder="🔎 ${T('Find a line…', 'Tìm câu…')}"><div class="lines"><table><tbody id="vl"></tbody></table></div></div>`;
  const list = q => { $('#vl').innerHTML = missing.filter(x => !q || x.text.toLowerCase().includes(q)).slice(0, 200).map((x, i) => `<tr data-k="${missing.indexOf(x)}"><td><span class="pill">${x.lang} ${x.slot === 'f' ? '👩' : '👨'}</span></td><td>${x.asked ? '📥 ' : ''}${esc(x.text)}</td><td><button class="btn small" data-rec>⏺</button></td></tr>`).join(''); $('#vl').querySelectorAll('[data-rec]').forEach(b => b.onclick = () => record(missing[+b.closest('tr').dataset.k], b)); };
  list(''); $('#vf').oninput = e => list(e.target.value.toLowerCase());
  $('#vrep').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; let d; try { d = JSON.parse(await f.text()); } catch (x) { return toast(T('That is not a Sparkle Valley backup.', 'Đó không phải bản sao Thung Lũng Lấp Lánh.')); }
    const lines = (d.voiceMissing || []).map(m => ({ lang: m[0], text: m[1] }));
    if (!lines.length) { $('#vrepres').textContent = '✅ ' + T('That device had a recording for every line it said.', 'Máy đó có bản ghi cho mọi câu đã nói.') + (d.build ? ` (${T('build', 'bản')} ${esc(d.build)})` : ''); return; }
    const r = await api('voices/extra', { lines }); $('#vrepres').textContent = `✅ ${r.added} ${T('new lines added. Counting again…', 'câu mới được thêm. Đang đếm lại…')}`; setTimeout(render, 900);
  };
  const run = async (engine, only) => {
    voiceStop = false; $('#stop').disabled = false; $('#az').disabled = $('#pi').disabled = true;
    const gap = engine === 'azure' ? 3200 : 0; let done = 0, errs = 0;
    for (const x of [...missing].filter(x => !only || x.asked)) {
      if (voiceStop) break; const t0 = Date.now();
      try { await api('voice', { engine, lang: x.lang, slot: x.slot, hash: x.hash, text: x.text }); done++; missing.splice(missing.indexOf(x), 1); } catch (e) { errs++; $('#pt').textContent = '⚠️ ' + e.message; if (/key|region|Settings|Piper/.test(e.message)) break; }
      $('#pb').style.width = (done / (done + missing.length) * 100) + '%'; $('#pt').textContent = `${done} ${T('made', 'đã tạo')}, ${missing.length} ${T('to go', 'còn lại')}${errs ? `, ${errs} ⚠️` : ''}`;
      const w = gap - (Date.now() - t0); if (w > 0) await new Promise(r => setTimeout(r, w));
    }
    $('#stop').disabled = true; toast(T('Done for now.', 'Xong đợt này.')); list($('#vf').value.toLowerCase());
  };
  $('#az').onclick = () => run('azure'); if ($('#azin')) $('#azin').onclick = () => { $('#azin').disabled = true; run('azure', true); }; $('#pi').onclick = () => run('piper'); $('#stop').onclick = () => { voiceStop = true; };
  async function record(x, btn) {
    if (btn.dataset.on) { btn._rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), rec = new MediaRecorder(stream), parts = [];
      rec.ondataavailable = e => parts.push(e.data); btn._rec = rec; btn.dataset.on = 1; btn.textContent = '⏹';
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); delete btn.dataset.on; btn.textContent = '…';
        const ac = new AudioContext(), buf = await ac.decodeAudioData(await new Blob(parts).arrayBuffer()), data = buf.getChannelData(0);
        if (!window.lamejs) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = BASE + '/ui/lame.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
        const enc = new lamejs.Mp3Encoder(1, buf.sampleRate, 64), pcm = new Int16Array(data.length); for (let i = 0; i < data.length; i++) pcm[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
        const out = []; for (let i = 0; i < pcm.length; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) out.push(b); } out.push(enc.flush());
        const blob = new Blob(out, { type: 'audio/mpeg' }), url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        await api('voice', { engine: 'upload', lang: x.lang, slot: x.slot, hash: x.hash, text: x.text, audio: url }); btn.textContent = '✅'; btn.disabled = true; missing.splice(missing.indexOf(x), 1);
      };
      rec.start();
    } catch (e) { fail(e); }
  }
};
// ---------- publish ----------
let jobTimer = 0;
const watchJob = (out, done) => { clearInterval(jobTimer); jobTimer = setInterval(async () => { const j = await api('job').catch(() => ({})); if (!j.kind) return; out(j); if (j.end) { clearInterval(jobTimer); done && done(j); } }, 1000); };
PAGES.publish = async P => {
  const c = INFO.conf;
  P.innerHTML = `<h2>🚀 ${T('Publish', 'Phát hành')}</h2><p class="sub">${T('Send what you changed here to the children’s devices.', 'Gửi những gì bạn đã đổi ở đây tới máy của các con.')}</p>
  ${INFO.online ? `<div class="card"><h3>🔗 ${T('How it reaches the children', 'Cách đến với các con')}</h3><p>${T('Everything you save here online waits in a draft (the “studio-draft” branch on GitHub). Publish puts all of it live as one change; Netlify updates the website in a minute or two, and each device picks it up the next time the game opens with internet.', 'Mọi thứ bạn lưu ở đây trên mạng nằm chờ trong bản nháp (nhánh “studio-draft” trên GitHub). Phát hành đưa tất cả lên cùng lúc; Netlify cập nhật trang sau một hai phút, và mỗi máy nhận khi mở game có mạng.')}</p>
    <p class="${INFO.unpublished ? 'warn' : 'ok'}">${INFO.unpublished ? '✏️ ' + T('There are saved changes waiting.', 'Có thay đổi đang chờ.') : '✅ ' + T('Nothing waiting: the website has everything.', 'Không có gì đang chờ: trang web đã có đủ.')}</p></div>` : `<div class="card"><h3>🔗 ${T('How it reaches the website', 'Cách đưa lên trang web')}</h3>
    <p>${T('Everything you change here (message, names, faces, stories, quiz, new villagers, defaults, voices, photos) is saved in the game folder on this computer. Nothing goes online until you publish.', 'Mọi thứ bạn đổi ở đây (lời nhắn, tên, khuôn mặt, truyện, câu đố, nhân vật mới, mặc định, giọng đọc, ảnh) được lưu trong thư mục game trên máy tính này. Chưa có gì lên mạng cho tới khi bạn phát hành.')}</p>
    <ol><li>${T('<b>GitHub (recommended)</b>: your Netlify site is built from your GitHub repository. “Publish to GitHub” sends only the files you changed, as one commit; Netlify sees it and updates the website by itself in a minute or two.', '<b>GitHub (nên dùng)</b>: trang Netlify của bạn được dựng từ kho GitHub. “Phát hành lên GitHub” chỉ gửi các tệp bạn đã đổi, thành một commit; Netlify thấy và tự cập nhật trang web sau một hai phút.')}</li>
    <li>${T('<b>Netlify directly</b>: uploads the whole zip. Quick, but the next change on GitHub replaces it, so use it only if the site is not linked to GitHub.', '<b>Netlify trực tiếp</b>: tải cả tệp zip lên. Nhanh, nhưng lần đổi tiếp theo trên GitHub sẽ thay thế nó, nên chỉ dùng khi trang chưa nối với GitHub.')}</li></ol>
    <p class="note">${T('Each device picks up the new content the next time the game opens with internet (it keeps a copy for offline). The build number in the game (e.g. r35) shows which version a device has.', 'Mỗi máy nhận nội dung mới vào lần tới mở game có mạng (và giữ bản để chơi không mạng). Số bản trong game (vd. r35) cho biết máy đang chạy phiên bản nào.')}</p></div>`}
  <div class="card"><h3>🐙 GitHub ${c.github ? '✅ ' + esc(c.githubRepo) + ' · ' + esc(c.githubBranch) : ''}</h3>
    ${c.github ? `<input type="text" id="gmsg" placeholder="${T('What changed? (optional)', 'Đã đổi gì? (không bắt buộc)')}"><div class="row" style="margin-top:8px"><button class="btn" id="gpub">🐙 ${T('Publish to GitHub', 'Phát hành lên GitHub')}</button></div><div class="prog"><i id="gpb"></i></div><p class="note" id="gres"></p>` : `<p class="note">${T('Add a GitHub token and the repository in Settings first.', 'Thêm khóa GitHub và tên kho trong Cài đặt trước.')}</p>`}</div>
  ${INFO.online ? '' : `<div class="card"><h3>📦 ${T('Zip and Netlify', 'Tệp zip và Netlify')}</h3><button class="btn ghost" id="build">📦 ${T('Make the zip', 'Tạo tệp zip')}</button> <span id="bres" class="note"></span>
    <p class="note">${c.netlify ? T('Your Netlify site is set: ', 'Đã có trang Netlify: ') + esc(c.netlifySite) : T('Add a Netlify token and the site name in Settings for one-click upload, or drag the zip onto the site’s Deploys page.', 'Thêm khóa Netlify và tên trang trong Cài đặt để tải lên một chạm, hoặc kéo tệp zip vào trang Deploys.')}</p>
    <button class="btn ghost" id="deploy" ${c.netlify ? '' : 'disabled'}>☁️ ${T('Upload to Netlify', 'Tải lên Netlify')}</button> <span id="dres" class="note"></span></div>`}`;
  if ($('#build')) $('#build').onclick = async () => { $('#bres').textContent = T('Packing…', 'Đang đóng gói…'); try { const r = await api('build', {}); $('#bres').innerHTML = `✅ ${r.files} ${T('files', 'tệp')}, ${(r.bytes / 1e6).toFixed(1)} MB · <a href="${BASE}/api/zip">⬇️ ${T('Download', 'Tải về')}</a>`; } catch (e) { $('#bres').textContent = '⚠️ ' + e.message; } };
  if ($('#deploy')) $('#deploy').onclick = async () => { if (c.github && !confirm(T('Your site is published from GitHub. Upload the zip to Netlify anyway?', 'Trang của bạn được phát hành từ GitHub. Vẫn tải tệp zip lên Netlify?'))) return; $('#dres').textContent = T('Uploading… (a minute or two)', 'Đang tải lên… (một hai phút)'); try { const r = await api('deploy', {}); $('#dres').innerHTML = `✅ ${T('Published!', 'Đã phát hành!')} <a href="${esc(r.url)}" target="_blank">${esc(r.url)}</a>`; } catch (e) { $('#dres').textContent = '⚠️ ' + e.message; } };
  if ($('#gpub')) $('#gpub').onclick = async () => {
    $('#gpub').disabled = true; $('#gres').textContent = T('Starting…', 'Bắt đầu…'); let j0;
    try { j0 = await api('github/publish', { message: $('#gmsg').value }); } catch (e) { $('#gres').textContent = '⚠️ ' + e.message; $('#gpub').disabled = false; return; }
    const show = j => { $('#gpb').style.width = (j.total ? j.done / j.total * 100 : 5) + '%'; $('#gres').textContent = `${j.done}/${j.total || '?'} · ${j.msg || ''}`; };
    const fin = j => {
      $('#gpub').disabled = false;
      $('#gres').innerHTML = j.error ? '⚠️ ' + esc(j.error) : j.result.changed ? `✅ ${j.result.changed} ${T('files sent', 'tệp đã gửi')} · <a href="${esc(j.result.url)}" target="_blank">${T('see the commit', 'xem commit')}</a>. ${T('Netlify updates the site in a minute or two.', 'Netlify cập nhật trang sau một hai phút.')}` : '✅ ' + T('Nothing new to publish: the website already has everything.', 'Không có gì mới: trang web đã có đủ.');
    };
    if (j0.end) { show(j0); fin(j0); } else watchJob(show, fin); // online it is done straight away
  };
};
// ---------- map: add, place, move and remove the family's own villagers ----------
const LOOKS = { style: ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'], hairStyle: ['buns', 'short', 'long', 'ponytail', 'spiky'], color: ['#ff5fa2', '#a66bff', '#3cc7e8', '#ffd23f', '#e8434a', '#5fd39a', '#ff9f43', '#3b6fe0', '#ffffff'], hair: ['#1d1412', '#3b2618', '#6b4226', '#c98b4a', '#e8c26a', '#a8432a', '#d9d9d9'], skin: ['#ffe3d1', '#f6c7a5', '#e0aa80', '#b47a55', '#7a4e33'] };
let mapCanvas = null, mapMode = 'npc', SNAP = null;
// the buildings that are in the game now: the game itself is opened out of sight and asked (it needs a moment)
async function worldSnapshot() {
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-2000px;top:0;width:400px;height:300px;border:0'; f.src = GAME + 'index.html?studio=1'; document.body.appendChild(f);
  try {
    for (let i = 0; i < 120; i++) { await new Promise(r => setTimeout(r, 500)); const G = f.contentWindow && f.contentWindow.__sv; if (G && G.world && G.world.boxes && G.interactables && G.interactables.length > 50) {
      await new Promise(r => setTimeout(r, 1500));
      const lab = it => { try { return typeof it.label === 'function' ? it.label({ i: 0, profile: { leafies: {}, shrines: {} }, pos: { y: 0 } }) : it.id; } catch (e) { return it.id; } };
      const near = (x, z, r) => { let best = '', bd = r; for (const it of G.interactables) { const d = Math.hypot(it.x - x, it.z - z); if (d < bd && !/^g\d|^lf|^wr|^fl|^dig/.test(it.id)) { bd = d; best = lab(it); } } return best; };
      const items = G.world.boxes.filter(b => !b.room && b.x1 - b.x0 < 40 && b.z1 - b.z0 < 40 && b.x1 - b.x0 > 1.5).map(b => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, w: b.x1 - b.x0, d: b.z1 - b.z0 }));
      for (const c of G.world.colliders) if (c.r >= 2.5 && c.r <= 12 && Math.abs(c.r * 20 - Math.round(c.r * 20)) < 1e-6) items.push({ x: c.x, z: c.z, w: c.r * 1.6, d: c.r * 1.6, round: true });
      items.forEach(it => { it.name = near(it.x, it.z, Math.max(it.w, it.d) / 2 + 5).replace(/^(About|Giới thiệu|Talk to|Nói chuyện với):?\s*/i, ''); });
      return items;
    } }
    throw new Error(T('The game did not open in time.', 'Game chưa mở kịp.'));
  } finally { f.remove(); }
}
PAGES.map = async P => {
  CONTENT.npcs = CONTENT.npcs || []; CONTENT.world = CONTENT.world || {}; const WD = CONTENT.world; WD.build = WD.build || []; WD.edits = WD.edits || []; WD.land = WD.land || [];
  P.innerHTML = `<h2>🗺️ ${T('Map: build and change the world', 'Bản đồ: xây dựng và sửa thế giới')}</h2><p class="sub">${T('Add villagers and buildings, move or remove what is there, and make more flat land for new towns. Changes appear in the game after you publish.', 'Thêm nhân vật và nhà cửa, dời hoặc xóa những gì đang có, và làm thêm đất bằng cho phố mới. Thay đổi xuất hiện trong game sau khi phát hành.')}</p><div class="card" id="mapwrap">${T('Drawing the map…', 'Đang vẽ bản đồ…')}</div>`;
  const W = await import(GAME + 'js/world.js'), WE = await import(GAME + 'js/worldedit.js'), TYPES = WE.BUILD_TYPES;
  const S = 800, k = S / W.SIZE, toPx = (x, z) => [(x + W.HALF) * k, (z + W.HALF) * k], toW = (px, py) => [px / k - W.HALF, py / k - W.HALF];
  if (!mapCanvas) mapCanvas = W.paintMap(S);
  const MODES = [['npc', '👥', T('Villagers', 'Nhân vật')], ['build', '🏠', T('Build', 'Xây')], ['move', '↔️', T('Move', 'Dời')], ['remove', '🧹', T('Remove', 'Xóa bỏ')], ['land', '🟫', T('Flat land', 'Đất bằng')]];
  $('#mapwrap').outerHTML = `<div class="card"><div class="row modes">${MODES.map(([m, i, l]) => `<button class="btn small ${mapMode === m ? '' : 'ghost'}" data-mode="${m}">${i} ${l}</button>`).join('')}
      <button class="btn small pink" id="snap">🔎 ${SNAP ? T('Buildings shown', 'Đang hiện nhà cửa') : T('Show the buildings that are there now', 'Hiện nhà cửa đang có')}</button><span class="note" id="snapres"></span></div><p class="note" id="modehelp"></p></div>
    <div class="mapgrid"><div class="card mapbox"><div class="row modes" style="margin-bottom:6px"><span class="note">${T('Zoom', 'Phóng to')}</span>${[1, 2, 3].map(z => `<button class="btn small ghost" data-z="${z}">${z}×</button>`).join('')}</div><div class="mapscroll"><canvas id="mc" width="${S}" height="${S}"></canvas></div></div><div class="card" id="npcform"></div></div>
    <div class="card"><h3>📋 ${T('Your changes', 'Thay đổi của bạn')}</h3><div id="npclist"></div></div><div class="bar"><button class="btn" id="save">💾 ${T('Save the map', 'Lưu bản đồ')}</button></div>`;
  const cv = $('#mc'), g = cv.getContext('2d'); let sel = null, drag = null, zoom = 1, rect = null;
  const HELP = { npc: T('Tap the map to add someone; drag a marker to move them; tap a marker to change or remove them.', 'Chạm bản đồ để thêm người; kéo dấu để dời; chạm dấu để sửa hoặc xóa.'),
    build: T('Choose a building on the right, then tap the map where it should stand. Drag it to move; turn it with the slider.', 'Chọn loại nhà bên phải, rồi chạm vào chỗ muốn xây. Kéo để dời; xoay bằng thanh trượt.'),
    move: T('Tap a building (show the buildings first), then drag the green arrow end to where it should go. Everything inside the circle moves with it: people, stalls, trees.', 'Chạm vào một ngôi nhà (bấm hiện nhà cửa trước), rồi kéo đầu mũi tên xanh tới chỗ mới. Mọi thứ trong vòng tròn đi theo: người, sạp, cây.'),
    remove: T('Tap what should go. Everything inside the red circle is taken away (make the circle bigger or smaller on the right).', 'Chạm vào thứ cần bỏ. Mọi thứ trong vòng tròn đỏ sẽ bị xóa (chỉnh vòng to nhỏ ở bên phải).'),
    land: T('Drag a rectangle on the map to make it flat land for new houses, or grow a whole place on the right.', 'Kéo một hình chữ nhật trên bản đồ để làm đất bằng cho nhà mới, hoặc mở rộng cả một nơi ở bên phải.') };
  let buildType = 'tube';
  const places = [...W.CITIES.map(c => [c.x, c.z, c.name[1], c.icon, c]), [W.VILLAGE.x, W.VILLAGE.z, 'Làng Sen', '🪷'], [W.CHINA.x, W.CHINA.z, 'China Town', '🏮'], [W.INDIA.x, W.INDIA.z, 'India Village', '🪔'], [W.HOME.x, W.HOME.z, 'Sunny Farm', '🏡'], [(W.TOWN.x0 + W.TOWN.x1) / 2, W.TOWN.roadZ, 'Two Homes Street', '🏘️', W.TOWN], [(W.MARKET.x0 + W.MARKET.x1) / 2, W.MARKET.roadZ, 'Chợ Ba Miền', '🧺', W.MARKET], [(W.AUSSIE.x0 + W.AUSSIE.x1) / 2, W.AUSSIE.roadZ, 'Aussie Corner', '🦘', W.AUSSIE]];
  const where = (x, z) => { if (W.heightAt(x, z) < W.WATER + .4) return ['bad', T('in the water', 'dưới nước')]; const rd = W.roadDist(x, z); if (rd.road && rd.d < rd.road.w / 2 + .8) return ['bad', T('on a road', 'giữa đường')]; return ['ok', '']; };
  const draw = () => {
    g.drawImage(mapCanvas, 0, 0, S, S); g.font = 'bold 13px Segoe UI, sans-serif'; g.textAlign = 'center';
    for (const L of WD.land) { const [a, b2] = toPx(L.x0, L.z0), [c, d] = toPx(L.x1, L.z1); g.fillStyle = 'rgba(190,140,70,.45)'; g.fillRect(a, b2, c - a, d - b2); g.strokeStyle = sel && sel.list === 'land' && WD.land[sel.i] === L ? '#8a5cf6' : '#8a5a2a'; g.lineWidth = 2; g.strokeRect(a, b2, c - a, d - b2); }
    if (rect) { const [a, b2] = toPx(rect[0], rect[1]), [c, d] = toPx(rect[2], rect[3]); g.strokeStyle = '#8a5cf6'; g.setLineDash([6, 4]); g.strokeRect(a, b2, c - a, d - b2); g.setLineDash([]); }
    if (SNAP) for (const it of SNAP) { const [a, b2] = toPx(it.x - it.w / 2, it.z - it.d / 2); g.fillStyle = 'rgba(60,50,80,.35)'; g.fillRect(a, b2, it.w * k, it.d * k); }
    for (const [x, z, n, ic] of places) { const [px, py] = toPx(x, z); g.fillStyle = 'rgba(255,255,255,.85)'; const w = g.measureText(ic + ' ' + n).width + 10; g.fillRect(px - w / 2, py - 9, w, 18); g.fillStyle = '#3b2a4f'; g.fillText(ic + ' ' + n, px, py + 4); }
    WD.edits.forEach((e, i) => { const [px, py] = toPx(e.x, e.z), on = sel && sel.list === 'edits' && sel.i === i; g.beginPath(); g.arc(px, py, e.r * k, 0, 7); g.lineWidth = on ? 4 : 2; g.strokeStyle = e.op === 'move' ? '#2f9a5a' : '#d2232a'; g.fillStyle = e.op === 'move' ? 'rgba(47,154,90,.15)' : 'rgba(210,35,42,.18)'; g.fill(); g.stroke();
      if (e.op === 'move') { const [tx, ty] = toPx(e.x + (e.dx || 0), e.z + (e.dz || 0)); g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.stroke(); g.beginPath(); g.arc(tx, ty, Math.max(6, e.r * k), 0, 7); g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]); g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fillStyle = '#2f9a5a'; g.fill(); } else { g.fillStyle = '#d2232a'; g.fillText('✕', px, py + 4); } });
    WD.build.forEach((b, i) => { const [px, py] = toPx(b.x, b.z), on = sel && sel.list === 'build' && sel.i === i; g.font = (on ? 26 : 20) + 'px sans-serif'; g.fillText((TYPES[b.type] || {}).icon || '🏠', px, py + 7); g.font = 'bold 13px Segoe UI, sans-serif'; });
    CONTENT.npcs.forEach((c, i) => { const [px, py] = toPx(c.x, c.z), on = sel && sel.list === 'npcs' && sel.i === i; g.beginPath(); g.arc(px, py, on ? 11 : 8, 0, 7); g.fillStyle = c.gender === 'm' ? '#3b6fe0' : '#ff5fa2'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#3b2a4f'; g.fillText(c.name || '?', px, py - 14); });
  };
  const evPos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
  const hitAt = (px, py) => {
    const [x, z] = toW(px, py);
    for (const [list, arr] of [['npcs', CONTENT.npcs], ['build', WD.build]]) { const i = arr.findIndex(c => Math.hypot(c.x - x, c.z - z) * k < 13); if (i >= 0) return { list, i }; }
    for (let i = 0; i < WD.edits.length; i++) { const e = WD.edits[i]; if (e.op === 'move' && Math.hypot(e.x + (e.dx || 0) - x, e.z + (e.dz || 0) - z) * k < 12) return { list: 'edits', i, end: true }; if (Math.hypot(e.x - x, e.z - z) < e.r) return { list: 'edits', i }; }
    const li = WD.land.findIndex(L => x > Math.min(L.x0, L.x1) && x < Math.max(L.x0, L.x1) && z > Math.min(L.z0, L.z1) && z < Math.max(L.z0, L.z1)); if (li >= 0 && mapMode === 'land') return { list: 'land', i: li };
    return null;
  };
  const snapAt = (x, z) => SNAP && SNAP.find(it => Math.abs(it.x - x) < it.w / 2 + .5 && Math.abs(it.z - z) < it.d / 2 + .5);
  cv.onpointerdown = e => {
    const [px, py] = evPos(e), [x, z] = toW(px, py), h = hitAt(px, py); cv.setPointerCapture(e.pointerId);
    if (h && !(mapMode === 'land' && h.list !== 'land')) { sel = h; drag = { ...h, ox: x, oz: z }; draw(); form(); list(); return; }
    const X = +x.toFixed(1), Z = +z.toFixed(1);
    if (mapMode === 'npc') { CONTENT.npcs.push({ name: T('New friend', 'Bạn mới'), gender: 'f', x: X, z: Z, face: 0, icon: '💬', look: { style: 'shirt', color: '#5fd39a', hairStyle: 'short', hair: '#1d1412', skin: '#f6c7a5', age: 'adult' }, lines: [['Hello! Nice to see you!', 'Xin chào! Gặp con vui quá!']] }); sel = { list: 'npcs', i: CONTENT.npcs.length - 1 }; }
    else if (mapMode === 'build') { WD.build.push({ type: buildType, x: X, z: Z, rot: 0, name: ['', ''], owner: { name: '', line: ['', ''] } }); sel = { list: 'build', i: WD.build.length - 1 }; }
    else if (mapMode === 'move' || mapMode === 'remove') { const b = snapAt(x, z), cx = b ? +b.x.toFixed(1) : X, cz = b ? +b.z.toFixed(1) : Z, r = b ? +Math.min(30, Math.max(b.w, b.d) / 2 + 2).toFixed(1) : 5; WD.edits.push(mapMode === 'move' ? { op: 'move', x: cx, z: cz, r, dx: 15, dz: 0, turn: 0, what: b ? b.name : '' } : { op: 'remove', x: cx, z: cz, r, what: b ? b.name : '' }); sel = { list: 'edits', i: WD.edits.length - 1 }; }
    else if (mapMode === 'land') { rect = [X, Z, X, Z]; drag = { rect: true }; }
    draw(); form(); list();
  };
  cv.onpointermove = e => {
    if (!drag) return; const [px, py] = evPos(e), [x, z] = toW(px, py);
    if (drag.rect) { rect[2] = +x.toFixed(1); rect[3] = +z.toFixed(1); draw(); return; }
    const arr = drag.list === 'npcs' ? CONTENT.npcs : WD[drag.list], it = arr[drag.i]; if (!it) return;
    if (drag.list === 'edits' && drag.end) { it.dx = +(x - it.x).toFixed(1); it.dz = +(z - it.z).toFixed(1); }
    else if (drag.list === 'land') { const ddx = x - drag.ox, ddz = z - drag.oz; it.x0 += ddx; it.x1 += ddx; it.z0 += ddz; it.z1 += ddz; drag.ox = x; drag.oz = z; }
    else { it.x = +x.toFixed(1); it.z = +z.toFixed(1); }
    draw();
  };
  cv.onpointerup = () => { if (drag && drag.rect) { const [x0, z0, x1, z1] = rect; if (Math.abs(x1 - x0) > 3 && Math.abs(z1 - z0) > 3) { WD.land.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); sel = { list: 'land', i: WD.land.length - 1 }; } rect = null; }
    drag = null; draw(); form(); list(); };
  P.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { zoom = +b.dataset.z; cv.style.width = S * zoom + 'px'; cv.style.height = S * zoom + 'px'; });
  P.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mapMode = b.dataset.mode; P.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('ghost', x.dataset.mode !== mapMode)); $('#modehelp').textContent = HELP[mapMode]; sel = null; form(); draw(); });
  $('#modehelp').textContent = HELP[mapMode];
  $('#snap').onclick = async () => { $('#snapres').textContent = T('Opening the game to look… (up to a minute)', 'Đang mở game để xem… (tối đa một phút)'); try { SNAP = await worldSnapshot(); $('#snapres').textContent = `✅ ${SNAP.length} ${T('buildings', 'công trình')}`; draw(); } catch (e) { $('#snapres').textContent = '⚠️ ' + e.message; } };
  const sw = (key, vals, cur) => `<div class="swatches">${vals.map(v => `<button class="sw ${v === cur ? 'on' : ''}" data-${key}="${v}" style="background:${v}"></button>`).join('')}</div>`;
  function form() {
    const F = $('#npcform');
    if (!sel) {
      if (mapMode === 'build') { F.innerHTML = `<h3>🏠 ${T('What to build', 'Xây gì')}</h3><div class="typelist">${Object.entries(TYPES).map(([id, t]) => `<button class="btn small ${id === buildType ? '' : 'ghost'}" data-type="${id}">${t.icon} ${esc(T(t.name[0], t.name[1]))}</button>`).join('')}</div><p class="note">${T('Then tap the map. Houses become homes the children can visit; give them a name and someone living there.', 'Rồi chạm vào bản đồ. Nhà sẽ thành nhà để các con ghé thăm; đặt tên và người ở trong đó.')}</p>`; F.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { buildType = b.dataset.type; form(); }); return; }
      if (mapMode === 'land') { F.innerHTML = `<h3>🟫 ${T('Grow a place', 'Mở rộng một nơi')}</h3><p class="note">${T('Adds flat land all round a town, village or city, ready for new buildings.', 'Thêm đất bằng quanh một phố, làng hay thành phố, sẵn sàng để xây thêm.')}</p><select id="gp">${places.filter(p => p[4]).map((p, i) => `<option value="${i}">${p[3]} ${esc(p[2])}</option>`).join('')}</select><label>${T('Metres all round', 'Số mét mỗi phía')}</label><input type="number" id="gm" value="15" min="5" max="40"><button class="btn" id="gadd" style="margin-top:8px">➕ ${T('Add the land', 'Thêm đất')}</button>`;
        $('#gadd').onclick = () => { const p = places.filter(q => q[4])[+$('#gp').value][4], m = Math.max(5, Math.min(40, +$('#gm').value || 15)); const x0 = p.x0 ?? p.x - (p.w || 13) / 2, x1 = p.x1 ?? p.x + (p.w || 13) / 2, z0 = p.z0 ?? p.z - (p.d || 13) / 2, z1 = p.z1 ?? p.z + (p.d || 13) / 2; WD.land.push({ x0: +(x0 - m).toFixed(1), x1: +(x1 + m).toFixed(1), z0: +(z0 - m).toFixed(1), z1: +(z1 + m).toFixed(1) }); sel = { list: 'land', i: WD.land.length - 1 }; draw(); form(); list(); }; return; }
      F.innerHTML = `<p class="note">${HELP[mapMode]}</p>`; return;
    }
    const del = () => { if (!confirm(T('Remove this change?', 'Bỏ thay đổi này?'))) return; (sel.list === 'npcs' ? CONTENT.npcs : WD[sel.list]).splice(sel.i, 1); sel = null; draw(); form(); list(); };
    const done = `<div class="row"><button class="btn bad" id="fdel">🗑️ ${T('Remove', 'Xóa')}</button><button class="btn ghost" id="fdone">✅ ${T('Done', 'Xong')}</button></div>`;
    const bindDone = () => { $('#fdel').onclick = del; $('#fdone').onclick = () => { sel = null; draw(); form(); list(); }; };
    if (sel.list === 'build') {
      const b = WD.build[sel.i], t = TYPES[b.type] || {}, [okc, why] = where(b.x, b.z); b.name = b.name || ['', '']; b.owner = b.owner || { name: '', line: ['', ''] }; b.owner.line = b.owner.line || ['', ''];
      F.innerHTML = `<h3>${t.icon || '🏠'} ${esc(T(t.name[0], t.name[1]))}</h3><label>${T('Type', 'Loại')}</label><select id="bt">${Object.entries(TYPES).map(([id, x]) => `<option value="${id}" ${id === b.type ? 'selected' : ''}>${x.icon} ${esc(T(x.name[0], x.name[1]))}</option>`).join('')}</select>
        <label>${T('Turn', 'Xoay')}: <span id="brv">${Math.round((b.rot || 0) * 180 / Math.PI)}°</span></label><input type="range" id="br" min="-180" max="180" step="15" value="${Math.round((b.rot || 0) * 180 / Math.PI)}">
        ${t.home ? `<label>${T('Name on the door', 'Tên trên cửa')}</label><div class="row"><input type="text" id="bn0" value="${esc(b.name[0])}" placeholder="English"><input type="text" id="bn1" value="${esc(b.name[1])}" placeholder="Tiếng Việt"></div>
        <label>${T('Who lives there', 'Ai ở đó')}</label><input type="text" id="bo" value="${esc(b.owner.name)}" placeholder="${T('e.g. Bà Tư', 'vd. Bà Tư')}"><label>${T('What they say', 'Họ nói gì')}</label><div class="row"><input type="text" id="bl0" value="${esc(b.owner.line[0])}" placeholder="English"><input type="text" id="bl1" value="${esc(b.owner.line[1])}" placeholder="Tiếng Việt"></div>
        <label>${T('Wall colour', 'Màu tường')}</label>${sw('c', ['#9fd8c8', '#ffb3a0', '#f2d6a0', '#efe0bf', '#cfe6ee', '#f6e27a', '#d9c3f0', '#ffffff'], b.color)}` : ''}
        <p class="${okc === 'ok' ? 'ok' : 'badtxt'}">📍 ${b.x}, ${b.z} ${okc === 'ok' ? '✅' : '⚠️ ' + why}</p>${done}`;
      $('#bt').onchange = e => { b.type = e.target.value; draw(); form(); }; $('#br').oninput = e => { b.rot = +e.target.value * Math.PI / 180; $('#brv').textContent = e.target.value + '°'; };
      if (t.home) { $('#bn0').oninput = e => { b.name[0] = e.target.value; list(); }; $('#bn1').oninput = e => { b.name[1] = e.target.value; }; $('#bo').oninput = e => { b.owner.name = e.target.value; }; $('#bl0').oninput = e => { b.owner.line[0] = e.target.value; }; $('#bl1').oninput = e => { b.owner.line[1] = e.target.value; }; F.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { b.color = x.dataset.c; form(); }); }
      bindDone(); return;
    }
    if (sel.list === 'edits') {
      const e = WD.edits[sel.i];
      F.innerHTML = `<h3>${e.op === 'move' ? '↔️ ' + T('Move', 'Dời') : '🧹 ' + T('Remove', 'Xóa bỏ')}</h3><p>${esc(e.what || T('(whatever is in the circle)', '(mọi thứ trong vòng tròn)'))}</p>
        <label>${T('Circle size (metres)', 'Cỡ vòng tròn (mét)')}: <span id="erv">${e.r}</span></label><input type="range" id="er" min="1" max="30" step=".5" value="${e.r}">
        ${e.op === 'move' ? `<label>${T('Turn', 'Xoay')}: <span id="etv">${Math.round((e.turn || 0) * 180 / Math.PI)}°</span></label><input type="range" id="et" min="-180" max="180" step="15" value="${Math.round((e.turn || 0) * 180 / Math.PI)}"><p class="note">${T('Drag the green dot on the map to where it should go.', 'Kéo chấm xanh trên bản đồ tới chỗ mới.')}</p>` : `<p class="note">${T('Careful: people and shops inside the circle go too.', 'Cẩn thận: người và cửa hàng trong vòng tròn cũng mất.')}</p>`}${done}`;
      $('#er').oninput = x => { e.r = +x.target.value; $('#erv').textContent = e.r; draw(); }; if ($('#et')) $('#et').oninput = x => { e.turn = +x.target.value * Math.PI / 180; $('#etv').textContent = x.target.value + '°'; };
      bindDone(); return;
    }
    if (sel.list === 'land') { const L = WD.land[sel.i]; F.innerHTML = `<h3>🟫 ${T('Flat land', 'Đất bằng')}</h3><p>${Math.round(L.x1 - L.x0)} × ${Math.round(L.z1 - L.z0)} m</p><p class="note">${T('Drag it on the map to move it.', 'Kéo trên bản đồ để dời.')}</p>${done}`; bindDone(); return; }
    // a villager
    const c = CONTENT.npcs[sel.i]; if (!c) { sel = null; return form(); }
    const L = c.look = c.look || {}, [okc, why] = where(c.x, c.z);
    F.innerHTML = `<h3>✏️ ${esc(c.name)}</h3>
      <label>${T('Name (as the children call them)', 'Tên (như các con gọi)')}</label><input type="text" id="fn" value="${esc(c.name)}" maxlength="40">
      <div class="row"><div><label>${T('Voice', 'Giọng')}</label><select id="fg"><option value="f" ${c.gender !== 'm' ? 'selected' : ''}>👩 ${T('woman/girl', 'nữ')}</option><option value="m" ${c.gender === 'm' ? 'selected' : ''}>👨 ${T('man/boy', 'nam')}</option></select></div>
      <div><label>${T('Age', 'Tuổi')}</label><select id="fa">${[['kid', T('child', 'trẻ em')], ['adult', T('grown-up', 'người lớn')], ['old', T('grandparent', 'ông bà')]].map(([v, l]) => `<option value="${v}" ${(L.age || 'adult') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><label>${T('Icon', 'Biểu tượng')}</label><input type="text" id="fi" value="${esc(c.icon || '💬')}" maxlength="4"></div></div>
      <div class="row"><div><label>${T('Clothes', 'Trang phục')}</label><select id="fs">${LOOKS.style.map(v => `<option ${L.style === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div><label>${T('Hair', 'Tóc')}</label><select id="fh">${LOOKS.hairStyle.map(v => `<option ${L.hairStyle === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
      <label>${T('Clothes colour', 'Màu áo')}</label>${sw('c', LOOKS.color, L.color)}<label>${T('Hair colour', 'Màu tóc')}</label>${sw('h', LOOKS.hair, L.hair)}<label>${T('Skin', 'Màu da')}</label>${sw('s', LOOKS.skin, L.skin)}
      <label>${T('What they say (one line per page)', 'Họ nói gì (mỗi dòng một trang)')}</label><div id="flines">${(c.lines || []).map((l, j) => `<div class="row" data-j="${j}"><input type="text" data-l="0" value="${esc(l[0])}" placeholder="English"><input type="text" data-l="1" value="${esc(l[1])}" placeholder="Tiếng Việt"><button class="btn small bad" data-rm style="flex:0 0 auto;min-width:0">✕</button></div>`).join('')}</div>
      <button class="btn small ghost" id="fadd">➕ ${T('Another line', 'Thêm dòng')}</button>
      <p class="${okc === 'ok' ? 'ok' : 'badtxt'}">📍 ${c.x}, ${c.z} ${okc === 'ok' ? '✅' : '⚠️ ' + why + ' – ' + T('drag them a little', 'kéo ra một chút')}</p>${done}`;
    const up = () => { draw(); list(); };
    $('#fn').oninput = e => { c.name = e.target.value; up(); }; $('#fg').onchange = e => { c.gender = e.target.value; up(); };
    $('#fa').onchange = e => { L.age = e.target.value; }; $('#fi').oninput = e => { c.icon = e.target.value; }; $('#fs').onchange = e => { L.style = e.target.value; }; $('#fh').onchange = e => { L.hairStyle = e.target.value; };
    F.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { L.color = b.dataset.c; form(); }); F.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { L.hair = b.dataset.h; form(); }); F.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { L.skin = b.dataset.s; form(); });
    F.querySelectorAll('#flines [data-j]').forEach(r => { const j = +r.dataset.j; r.querySelectorAll('[data-l]').forEach(i => i.oninput = () => { c.lines[j][+i.dataset.l] = i.value; }); r.querySelector('[data-rm]').onclick = () => { c.lines.splice(j, 1); form(); }; });
    $('#fadd').onclick = () => { (c.lines = c.lines || []).push(['', '']); form(); };
    bindDone();
  }
  function list() {
    const chip = (list, i, label, warn) => `<button class="btn small ${sel && sel.list === list && sel.i === i ? '' : 'ghost'}" data-l="${list}" data-i="${i}">${label}${warn ? ' ⚠️' : ''}</button> `;
    const html = [...CONTENT.npcs.map((c, i) => chip('npcs', i, (c.gender === 'm' ? '👨 ' : '👩 ') + esc(c.name), where(c.x, c.z)[0] !== 'ok')), ...WD.build.map((b, i) => chip('build', i, ((TYPES[b.type] || {}).icon || '🏠') + ' ' + esc((b.name && (b.name[1] || b.name[0])) || T((TYPES[b.type] || { name: ['', ''] }).name[0], (TYPES[b.type] || { name: ['', ''] }).name[1])), where(b.x, b.z)[0] !== 'ok')),
      ...WD.edits.map((e, i) => chip('edits', i, (e.op === 'move' ? '↔️ ' : '🧹 ') + esc(e.what || T('area', 'khu vực')))), ...WD.land.map((L, i) => chip('land', i, `🟫 ${Math.round(L.x1 - L.x0)}×${Math.round(L.z1 - L.z0)} m`))];
    $('#npclist').innerHTML = html.join('') || `<p class="note">${T('No changes yet.', 'Chưa có thay đổi.')}</p>`;
    $('#npclist').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { sel = { list: b.dataset.l, i: +b.dataset.i }; draw(); form(); list(); });
  }
  draw(); form(); list();
  $('#save').onclick = () => { CONTENT.npcs = CONTENT.npcs.filter(c => c.name && c.name.trim()).map(c => ({ ...c, name: c.name.trim(), lines: (c.lines || []).filter(l => l[0] || l[1]) })); saveContent().then(() => list()).catch(fail); };
};
// ---------- real photos of every landmark, saved into the game so they work offline ----------
PAGES.photos = async P => {
  const RW = await import(GAME + 'js/realworld.js');
  const items = new Map();
  for (const [id, r] of Object.entries(RW.REAL)) items.set(RW.photoKey(r[0]), { key: RW.photoKey(r[0]), sources: r[0], name: r[0][0].split(/:(.+)/)[1] });
  for (const [kind, src] of Object.entries(RW.REAL_KINDS || {})) if (src && src.length && !items.has(RW.photoKey(src))) items.set(RW.photoKey(src), { key: RW.photoKey(src), sources: src, name: src[0].split(/:(.+)/)[1] });
  const all = [...items.values()];
  const draw = async () => {
    const pix = await api('photos/index'), have = all.filter(x => pix[x.key] && pix[x.key].length).length;
    P.innerHTML = `<h2>📷 ${T('Real photos', 'Ảnh thật')}</h2><p class="sub">${T('The best photos of each real place, from Wikipedia, Wikimedia Commons and Openverse (Creative Commons photos from Flickr and museums), the article’s main picture first, a few from each source. They are saved into the game with who took them and the licence, so children see them even with no internet. Runs on this computer; Publish to send them to the children.', 'Những ảnh đẹp nhất của từng nơi thật, lấy từ Wikipedia, Wikimedia Commons và Openverse (ảnh Creative Commons từ Flickr và các bảo tàng), ảnh chính của bài viết trước, mỗi nguồn vài ảnh. Ảnh được lưu vào game kèm tên người chụp và giấy phép, nên các con xem được cả khi không có mạng. Chạy trên máy này; bấm Phát hành để gửi tới các con.')}</p>
    <div class="card"><p><b>${have}</b> / ${all.length} ${T('places have photos saved', 'nơi đã có ảnh')}.</p>
      <div class="row"><div style="flex:0 0 160px"><label>${T('Photos per place', 'Số ảnh mỗi nơi')}</label><select id="pmax">${[3, 4, 6].map(n => `<option ${n === 4 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <button class="btn" id="pmiss">⬇️ ${T('Get photos for places without any', 'Tải ảnh cho nơi chưa có')}</button><button class="btn ghost" id="pall">🔄 ${T('Get them all again', 'Tải lại tất cả')}</button></div>
      <div class="prog"><i id="ppb"></i></div><p class="note" id="pres"></p></div>
    <div class="grid">${all.map(x => `<div class="card"><b>${esc(x.name)}</b> <button class="btn small ghost" data-get="${esc(x.key)}">🔄</button><div class="thumbs">${(pix[x.key] || []).map(p => `<span class="thumb"><img src="${FILE(esc(p.src))}" title="${esc(p.credit || '')}"><button data-rm="${esc(x.key)}|${esc(p.src)}">✕</button></span>`).join('') || `<span class="note">${T('none yet', 'chưa có')}</span>`}</div></div>`).join('')}</div>`;
    const go = async list => { // one place at a time (online each request must be short), the progress shown here
      P.querySelectorAll('button').forEach(b => b.disabled = true); let done = 0, errs = 0;
      for (const item of list) { $('#pres').textContent = `${done}/${list.length} · ${item.name}${errs ? ' · ⚠️ ' + errs : ''}`; try { await api('photos/get1', { item, max: +$('#pmax').value }); } catch (e) { errs++; } done++; $('#ppb').style.width = (done / list.length * 100) + '%'; }
      toast(errs ? `⚠️ ${errs}` : T('Photos saved.', 'Đã lưu ảnh.')); draw(); };
    $('#pmiss').onclick = () => go(all.filter(x => !(pix[x.key] && pix[x.key].length)));
    $('#pall').onclick = () => go(all);
    P.querySelectorAll('[data-get]').forEach(b => b.onclick = () => go(all.filter(x => x.key === b.dataset.get)));
    P.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { const [key, src] = b.dataset.rm.split('|'); await api('photos/remove', { key, src }); draw(); });
  };
  await draw();
};
// ---------- the website: what is live, recent changes, and managing them ----------
PAGES.site = async P => {
  P.innerHTML = `<h2>🌐 ${T('The website', 'Trang web')}</h2><p class="sub">${T('What is live on Netlify, what changed on GitHub, and buttons to manage them.', 'Những gì đang chạy trên Netlify, những gì đã đổi trên GitHub, và các nút để quản lý.')}</p><div class="card">${T('Asking Netlify and GitHub…', 'Đang hỏi Netlify và GitHub…')}</div>`;
  const s = await api('site/status'), when = d => d ? new Date(d).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const STATE = { ready: '✅', building: '🏗️', enqueued: '⏳', processing: '⚙️', uploading: '⬆️', error: '❌', new: '🆕' };
  const n = s.netlify, g = s.github;
  P.innerHTML = `<h2>🌐 ${T('The website', 'Trang web')}</h2>
  <div class="card"><h3>☁️ Netlify ${n ? `· <a href="${esc(n.url)}" target="_blank">${esc(n.url)}</a>` : ''}</h3>
    ${s.netlifyError ? `<p class="badtxt">⚠️ ${esc(s.netlifyError)}</p>` : !n ? `<p class="note">${T('Add your Netlify token and site in Settings to see the website here.', 'Thêm khóa Netlify và tên trang trong Cài đặt để xem trang web ở đây.')}</p>` : `
      <p class="note">${n.repo ? T('Built from ', 'Dựng từ ') + esc(n.repo) + ' · ' + esc(n.branch || '') : T('Not linked to GitHub (uploads only).', 'Chưa nối với GitHub (chỉ tải lên).')}</p>
      <table><tbody>${n.deploys.map(d => `<tr><td>${STATE[d.state] || '•'} ${d.live ? `<span class="pill">${T('LIVE', 'ĐANG CHẠY')}</span>` : ''}</td><td>${esc(when(d.at))}<br><span class="note">${esc(d.context === 'production' ? T('website', 'trang chính') : T('preview', 'bản xem trước'))} · ${esc(d.branch || '')} ${esc(d.commit)}</span></td><td>${esc(d.title).slice(0, 80)}${d.error ? `<br><span class="badtxt">${esc(d.error).slice(0, 120)}</span>` : ''}</td>
        <td>${d.url ? `<a href="${esc(d.url)}" target="_blank">${T('open', 'mở')}</a>` : ''} ${!d.live && d.state === 'ready' && d.context === 'production' ? `<button class="btn small ghost" data-restore="${esc(d.id)}">↩️ ${T('make this live', 'đưa bản này lên')}</button>` : ''}</td></tr>`).join('')}</tbody></table>
      <div class="row" style="margin-top:8px"><button class="btn" id="rebuild">🔄 ${T('Rebuild the website now', 'Dựng lại trang web ngay')}</button>${n.admin ? `<a class="btn ghost" href="${esc(n.admin)}" target="_blank">⚙️ ${T('Open Netlify', 'Mở Netlify')}</a>` : ''}</div>`}</div>
  <div class="card"><h3>🐙 GitHub ${g ? '· ' + esc(g.repo) : ''}</h3>
    ${s.githubError ? `<p class="badtxt">⚠️ ${esc(s.githubError)}</p>` : !g ? `<p class="note">${T('Add your GitHub token and repository in Settings.', 'Thêm khóa GitHub và tên kho trong Cài đặt.')}</p>` : `
      <h4>📬 ${T('Updates waiting to go live (pull requests)', 'Bản cập nhật chờ đưa lên (pull request)')}</h4>
      ${g.pulls.length ? `<table><tbody>${g.pulls.map(p => `<tr><td>#${p.n}</td><td><a href="${esc(p.url)}" target="_blank">${esc(p.title)}</a><br><span class="note">${esc(p.branch)} · ${esc(when(p.at))}${p.draft ? ' · ' + T('draft', 'bản nháp') : ''}</span></td><td><a href="${esc(p.url)}" target="_blank">${T('preview & check', 'xem & kiểm tra')}</a> <button class="btn small" data-merge="${p.n}">✅ ${T('Merge (put it live)', 'Gộp (đưa lên trang)')}</button></td></tr>`).join('')}</tbody></table>` : `<p class="note">${T('None waiting.', 'Không có bản nào đang chờ.')}</p>`}
      <h4>🕘 ${T('Latest changes on', 'Thay đổi mới nhất trên')} ${esc(g.branch)}</h4>
      <table><tbody>${g.commits.map(c => `<tr><td><a href="${esc(c.url)}" target="_blank">${esc(c.sha)}</a></td><td>${esc(c.msg)}</td><td class="note">${esc(when(c.at))}</td></tr>`).join('')}</tbody></table>`}</div>
  <p class="note">${T('Each pull request gets its own preview link from Netlify (in its checks on GitHub): open it on a phone to try the update before merging.', 'Mỗi pull request có đường dẫn xem trước riêng từ Netlify (trong phần kiểm tra trên GitHub): mở trên điện thoại để thử trước khi gộp.')}</p>`;
  const again = () => setTimeout(() => PAGES.site(P), 1500);
  if ($('#rebuild')) $('#rebuild').onclick = async () => { try { await api('site/rebuild', {}); toast(T('Netlify is rebuilding the website.', 'Netlify đang dựng lại trang web.')); again(); } catch (e) { fail(e); } };
  P.querySelectorAll('[data-restore]').forEach(b => b.onclick = async () => { if (!confirm(T('Make this older version the live website?', 'Đưa phiên bản cũ này lên làm trang chính?'))) return; try { await api('site/restore', { id: b.dataset.restore }); toast(T('Done: that version is live.', 'Xong: phiên bản đó đang chạy.')); again(); } catch (e) { fail(e); } });
  P.querySelectorAll('[data-merge]').forEach(b => b.onclick = async () => { if (!confirm(T('Merge this update? The website changes in a minute or two.', 'Gộp bản cập nhật này? Trang web sẽ đổi sau một hai phút.'))) return; try { await api('github/merge', { n: +b.dataset.merge }); toast(T('Merged. Netlify is building it.', 'Đã gộp. Netlify đang dựng.')); again(); } catch (e) { fail(e); } });
};
// ---------- check ----------
PAGES.check = async P => {
  const r = await api('check');
  P.innerHTML = `<h2>🩺 ${T('Check the game', 'Kiểm tra game')}</h2><div class="card">${r.map(x => `<p class="${x.ok ? 'ok' : 'badtxt'}">${x.ok ? '✅' : '⚠️'} ${esc(T(x.en, x.vi))}</p>`).join('')}</div>`;
};
// ---------- settings ----------
PAGES.settings = async P => {
  const c = INFO.conf;
  if (INFO.online) { // online the keys live in Netlify, where only the site's owner can see them
    const row = (ok, name, what) => `<tr><td>${ok ? '✅' : '➖'}</td><td><code>${name}</code></td><td>${what}</td></tr>`;
    P.innerHTML = `<h2>🔑 ${T('Settings', 'Cài đặt')}</h2><p class="sub">${T('Online, the keys are kept by Netlify, never in the game or on this page. Set them in Netlify → your site → Site configuration → Environment variables, then deploy again.', 'Trên mạng, các khóa do Netlify giữ, không bao giờ nằm trong game hay trang này. Đặt chúng trong Netlify → trang của bạn → Site configuration → Environment variables, rồi deploy lại.')}</p>
    <div class="card"><table><tbody>${row(true, 'STUDIO_PASSWORD', T('the grown-ups’ password for this page (long, used nowhere else)', 'mật khẩu của người lớn cho trang này (dài, không dùng ở chỗ khác)'))}${row(c.github, 'GITHUB_TOKEN', T('fine-grained token, this repository only, Contents: read and write (saving and publishing)', 'khóa fine-grained, chỉ kho này, Contents: đọc và ghi (lưu và phát hành)'))}${row(true, 'GITHUB_REPO', esc(c.githubRepo))}${row(c.azure, 'AZURE_KEY · AZURE_REGION', T('to make voices online', 'để tạo giọng đọc trên mạng'))}${row(c.netlify, 'NETLIFY_TOKEN', T('the Website page', 'trang Trang web'))}</tbody></table>
    <p class="note">${T('Piper (free voices) and the zip work only in SparkleStudio.exe on the family computer.', 'Piper (giọng miễn phí) và tệp zip chỉ có trong SparkleStudio.exe trên máy tính gia đình.')}</p></div>
    <div class="bar"><button class="btn ghost" id="out">🚪 ${T('Sign out', 'Đăng xuất')}</button></div>`;
    $('#out').onclick = async () => { await fetch(BASE + '/api/logout'); signIn(); };
    return;
  }
  P.innerHTML = `<h2>🔑 ${T('Settings', 'Cài đặt')}</h2><p class="sub">${T('Keys are kept only on this computer', 'Các khóa chỉ lưu trên máy tính này')} (<code>${esc(INFO.settingsFile)}</code>), ${T('never in the game.', 'không bao giờ nằm trong game.')}</p>
  <div class="card"><label>📂 ${T('Game folder (the one with index.html)', 'Thư mục game (có tệp index.html)')}</label><input type="text" id="gd" value="${esc(INFO.game || '')}"></div>
  <div class="card"><h3>☁️ Microsoft Azure ${T('voices', 'giọng đọc')}</h3><div class="row"><div><label>KEY 1 ${c.azure ? '✅' : ''}</label><input type="password" id="ak" placeholder="${c.azure ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Region', 'Vùng')}</label><input type="text" id="ar" value="${esc(c.azureRegion)}" placeholder="australiaeast"></div></div></div>
  <div class="card"><h3>💻 Piper (${T('free voices on this computer', 'giọng miễn phí trên máy')})</h3><p class="note">${T('Download piper.exe and voices (.onnx) from github.com/rhasspy/piper; good choices: vi_VN-vais1000-medium, en_GB-southern_english_female-low.', 'Tải piper.exe và giọng (.onnx) ở github.com/rhasspy/piper; nên chọn: vi_VN-vais1000-medium, en_GB-southern_english_female-low.')}</p>
    <label>piper.exe</label><input type="text" id="pe" value="${esc(c.piperExe)}" placeholder="C:\\piper\\piper.exe">
    <div class="row"><div><label>🇦🇺 ${T('English voice (.onnx)', 'Giọng tiếng Anh (.onnx)')}</label><input type="text" id="pen" value="${esc((c.piperModels || {}).en || '')}"></div><div><label>🇻🇳 ${T('Vietnamese voice (.onnx)', 'Giọng tiếng Việt (.onnx)')}</label><input type="text" id="pvi" value="${esc((c.piperModels || {}).vi || '')}"></div></div></div>
  <div class="card"><h3>🚀 Netlify</h3><div class="row"><div><label>${T('Personal access token', 'Khóa truy cập cá nhân')} ${c.netlify ? '✅' : ''}</label><input type="password" id="nt" placeholder="${c.netlify ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Site name or ID (e.g. sparkle-valley.netlify.app)', 'Tên hoặc ID trang (vd. sparkle-valley.netlify.app)')}</label><input type="text" id="ns" value="${esc(c.netlifySite)}"></div></div>
    <p class="note">${T('Netlify → User settings → Applications → New access token.', 'Netlify → User settings → Applications → New access token.')}</p></div>
  <div class="card"><h3>🐙 GitHub</h3><div class="row"><div><label>${T('Fine-grained token (Contents: read and write)', 'Khóa fine-grained (Contents: đọc và ghi)')} ${c.github ? '✅' : ''}</label><input type="password" id="gt" placeholder="${c.github ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : 'github_pat_…'}"></div><div><label>${T('Repository', 'Kho')}</label><input type="text" id="gr" value="${esc(c.githubRepo)}" placeholder="nguyentuanphu/Sparkle-Valley"></div><div><label>${T('Branch', 'Nhánh')}</label><input type="text" id="gb" value="${esc(c.githubBranch || 'main')}"></div></div>
    <p class="note">${T('github.com → Settings → Developer settings → Fine-grained tokens → Generate: only this repository, permissions Contents: Read and write, Pull requests: Read and write.', 'github.com → Settings → Developer settings → Fine-grained tokens → Generate: chỉ kho này, quyền Contents: Read and write và Pull requests: Read and write.')}</p></div>
  <div class="card"><h3>📊 ${T('Players and the online Studio', 'Người chơi và Studio trên mạng')}</h3><div class="row"><div><label>${T('The game’s website', 'Trang web của game')}</label><input type="text" id="su" value="${esc(c.siteUrl)}" placeholder="https://sparklevalley.netlify.app"></div><div><label>${T('Studio password (STUDIO_PASSWORD in Netlify)', 'Mật khẩu Studio (STUDIO_PASSWORD trong Netlify)')} ${c.players ? '✅' : ''}</label><input type="password" id="sp" placeholder="${c.players ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div></div>
    <p class="note">${T('The same Studio is online at the website’s /studio/ page (sign in with this password). The Players page asks the website how many children play.', 'Studio này cũng có trên mạng ở trang /studio/ của trang web (đăng nhập bằng mật khẩu này). Trang Người chơi hỏi trang web có bao nhiêu bé đang chơi.')}</p></div>
  <div class="bar"><button class="btn ghost" id="forget">🗑️ ${T('Forget the keys', 'Xóa các khóa')}</button><button class="btn" id="save">💾 ${T('Save settings', 'Lưu cài đặt')}</button></div>`;
  $('#save').onclick = async () => { try { await api('settings', { gameDir: $('#gd').value, azureKey: $('#ak').value, azureRegion: $('#ar').value, piperExe: $('#pe').value, piperModels: { en: $('#pen').value.trim(), vi: $('#pvi').value.trim() }, netlifyToken: $('#nt').value, netlifySite: $('#ns').value, githubToken: $('#gt').value, githubRepo: $('#gr').value, githubBranch: $('#gb').value, siteUrl: $('#su').value, studioPassword: $('#sp').value }); toast(T('Settings saved.', 'Đã lưu cài đặt.')); render(); } catch (e) { fail(e); } };
  $('#forget').onclick = async () => { if (!confirm(T('Forget the Azure, Netlify and GitHub keys on this computer?', 'Xóa khóa Azure, Netlify và GitHub trên máy này?'))) return; await api('settings', { forget: ['azureKey', 'netlifyToken', 'githubToken', 'studioPassword'] }); toast(T('Keys forgotten.', 'Đã xóa khóa.')); render(); };
};
// ---------- players: how many children play (anonymous counts from the website, netlify/lib/players.mjs) ----------
PAGES.players = async P => {
  P.innerHTML = `<h2>📊 ${T('Players', 'Người chơi')}</h2><div class="card">${T('Asking the website…', 'Đang hỏi trang web…')}</div>`;
  let r; try { r = await api('players'); } catch (e) { P.innerHTML = `<h2>📊 ${T('Players', 'Người chơi')}</h2><div class="card"><p class="badtxt">⚠️ ${esc(e.message)}</p><p class="note">${T('The count comes from the website (it needs a Git deploy on Netlify). In SparkleStudio.exe, put the website and the Studio password in Settings.', 'Số liệu đến từ trang web (cần deploy từ Git trên Netlify). Trong SparkleStudio.exe, điền trang web và mật khẩu Studio trong Cài đặt.')}</p></div>`; return; }
  const big = (n, en, vi) => `<div class="card stat"><b>${n}</b><span>${T(en, vi)}</span></div>`, hrs = m => m >= 120 ? (m / 60).toFixed(m >= 600 ? 0 : 1) + ' h' : m + ' min';
  const max = Math.max(1, ...r.perDay.map(d => d.devices)), W = 600, H = 150, bw = W / r.perDay.length;
  const bars = r.perDay.map((d, i) => `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - 18 - d.devices / max * (H - 30)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(d.devices / max * (H - 30)).toFixed(1)}" rx="3" fill="#8a5cf6"><title>${d.date}: ${d.devices} (${d.newDevices} ${T('new', 'mới')}), ${hrs(d.mins)}</title></rect>${d.newDevices ? `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - 18 - d.newDevices / max * (H - 30)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${(d.newDevices / max * (H - 30)).toFixed(1)}" rx="3" fill="#ff7eb8"/>` : ''}${i % 5 === 4 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" font-size="10" text-anchor="middle" fill="#6b5b80">${d.date.slice(5)}</text>` : ''}`).join('');
  const pct = (n, t) => t ? Math.round(n / t * 100) + '%' : '–', tw = Object.values(r.kinds).reduce((a, b) => a + b, 0);
  const table = (o, name) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${esc(name ? name(k) : k)}</td><td>${n}</td><td>${pct(n, tw)}</td></tr>`).join('');
  P.innerHTML = `<h2>📊 ${T('Players', 'Người chơi')}</h2><p class="sub">${T('Counted without knowing who: each device has a random number, nothing else (no names, photos or places). A grown-up can switch it off on the device: Grown-ups → Advanced → Count players.', 'Đếm mà không biết là ai: mỗi máy chỉ có một số ngẫu nhiên (không tên, không ảnh, không địa điểm). Người lớn có thể tắt trên máy: Phụ huynh → Nâng cao → Đếm người chơi.')}</p>
  <div class="grid">${big(r.today.devices, 'devices playing today', 'máy chơi hôm nay')}${big(r.week.devices, 'this week', 'tuần này')}${big(r.month.devices, 'last 30 days', '30 ngày qua')}${big(r.allTime, 'devices ever', 'máy từ trước tới nay')}${big(r.week.newDevices, 'new this week', 'máy mới tuần này')}${big(hrs(r.minsPerDevice), 'a device plays a day', 'mỗi máy chơi một ngày')}${big(r.kidsPerDevice, 'children per device', 'bé mỗi máy')}</div>
  <div class="card"><h3>📅 ${T('Devices each day (pink: new)', 'Số máy mỗi ngày (hồng: máy mới)')}</h3><svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px">${bars}</svg></div>
  <div class="grid"><div class="card"><h3>🎲 ${T('Most played (30 days)', 'Chơi nhiều nhất (30 ngày)')}</h3><table><tbody>${r.games.map(([g, n]) => `<tr><td>${esc(g)}</td><td>${n}</td></tr>`).join('') || `<tr><td class="note">${T('none yet', 'chưa có')}</td></tr>`}</tbody></table><p class="note">${T('Stories read', 'Truyện đã đọc')}: ${r.tales} · ${T('played with friends online', 'chơi cùng bạn trên mạng')}: ${hrs(r.onlineMins)}</p></div>
  <div class="card"><h3>📱 ${T('Devices this week', 'Thiết bị tuần này')}</h3><table><tbody>${table(r.kinds, k => ({ phone: T('phone', 'điện thoại'), tablet: T('tablet', 'máy tính bảng'), computer: T('computer', 'máy tính') }[k] || k))}</tbody></table><p class="note">${T('Installed as an app', 'Cài như ứng dụng')}: ${pct(r.app, r.weekDeviceDays)}</p>
    <h3>🗣️ ${T('Language', 'Ngôn ngữ')}</h3><table><tbody>${table(r.langs, k => ({ en: 'English', vi: 'Tiếng Việt' }[k] || k))}</tbody></table>
    <h3>🏷️ ${T('Game version on the devices', 'Phiên bản game trên các máy')}</h3><table><tbody>${table(r.builds)}</tbody></table><p class="note">${T('Newest', 'Mới nhất')}: ${esc(INFO.version.split('-').pop())}</p></div></div>
  <p class="note">${T('Made', 'Lúc')} ${esc(new Date(r.made).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-AU'))}</p>`;
};
// ---------- signing in (online only) ----------
function signIn() {
  $('#tabs').innerHTML = ''; document.body.classList.add('online');
  $('#page').innerHTML = `<div class="card signin"><h2>✨ Sparkle Studio</h2><p class="sub">${T('The grown-ups’ dashboard, online. Enter the Studio password.', 'Bảng điều khiển của người lớn, trên mạng. Nhập mật khẩu Studio.')}</p>
    <form id="si"><input type="password" id="pw" autocomplete="current-password" placeholder="${T('Password', 'Mật khẩu')}"><button class="btn" style="margin-top:10px">🔓 ${T('Sign in', 'Đăng nhập')}</button><p class="note" id="sires"></p></form></div>`;
  $('#si').onsubmit = async e => { e.preventDefault(); $('#sires').textContent = '…';
    const r = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#pw').value }) }); const j = await r.json().catch(() => ({}));
    if (r.ok) render(); else $('#sires').textContent = '⚠️ ' + (j.error || r.status); };
  $('#pw').focus();
}
window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (PAGES[k] && k !== cur) { cur = k; render(); } });
render();
// keep the Studio running while this window is open; ⏻ stops it
setInterval(() => { if (INFO && !INFO.online) fetch(BASE + '/api/ping').catch(() => { }); }, 20000);
$('#quit').onclick = async () => {
  if (!confirm(T('Close Sparkle Studio?', 'Đóng Sparkle Studio?'))) return;
  await fetch(BASE + '/api/quit', { method: 'POST' }).catch(() => { });
  document.body.innerHTML = `<main><div class="card"><h2>👋 ${T('Sparkle Studio is closed.', 'Đã đóng Sparkle Studio.')}</h2><p class="sub">${T('You can close this window. Double-click SparkleStudio.exe to open it again.', 'Bạn có thể đóng cửa sổ này. Bấm đúp SparkleStudio.exe để mở lại.')}</p></div></main>`;
  window.close();
};

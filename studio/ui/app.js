// Sparkle Studio dashboard (runs in the browser, talks to studio.cjs on this computer).
const $ = s => document.querySelector(s);
let LANG = localStorage.getItem('studioLang') || 'vi';
const T = (en, vi) => LANG === 'vi' ? vi : en;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const api = async (p, body) => { const r = await fetch('/api/' + p, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; };
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); };
const fail = e => toast('⚠️ ' + (e.message || e));
let INFO = null, CONTENT = {};
const saveContent = async () => { await api('content', CONTENT); toast(T('Saved. Publish to send it to the children’s devices.', 'Đã lưu. Bấm Phát hành để gửi tới máy của các con.')); };

const TABS = [
  ['home', '🏠', 'Home', 'Trang chính'], ['message', '💌', 'Message', 'Lời nhắn'], ['villagers', '🧑', 'Villagers', 'Nhân vật'], ['stories', '📖', 'Stories', 'Truyện'],
  ['quiz', '💛', 'Family quiz', 'Đố vui gia đình'], ['play', '⏰', 'Play time', 'Giờ chơi'], ['children', '👧', 'Children', 'Các con'], ['voices', '🎙️', 'Voices', 'Giọng đọc'],
  ['publish', '🚀', 'Publish', 'Phát hành'], ['check', '🩺', 'Check', 'Kiểm tra'], ['settings', '🔑', 'Settings', 'Cài đặt']
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
    INFO = await api('info');
    if (!INFO.ok && cur !== 'settings') { cur = 'settings'; nav(); toast(T('First, choose the game folder.', 'Trước tiên, chọn thư mục game.')); }
    if (INFO.ok) CONTENT = await api('content');
    await PAGES[cur](P);
  } catch (e) { P.innerHTML = `<div class="card badtxt">${esc(e.message)}</div>`; }
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
  <div class="card"><p>${T('Game folder', 'Thư mục game')}: <code>${esc(INFO.game)}</code></p>
    <div class="row" style="max-width:520px"><button class="btn" id="play">▶ ${T('Try the game here', 'Chơi thử tại đây')}</button><button class="btn ghost" id="folder">📂 ${T('Open the folder', 'Mở thư mục')}</button></div>
    <p class="note">${T('Trying the game here uses this computer only; the children see changes after you Publish.', 'Chơi thử ở đây chỉ trên máy này; các con thấy thay đổi sau khi bạn Phát hành.')}</p></div>`;
  $('#play').onclick = () => window.open('/game/', '_blank');
  $('#folder').onclick = () => api('open', { folder: true }).catch(fail);
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
  const list = await api('names'); CONTENT.names = CONTENT.names || {}; CONTENT.faces = CONTENT.faces || {};
  P.innerHTML = `<h2>🧑 ${T('Villagers: names and faces', 'Nhân vật: tên và khuôn mặt')}</h2><p class="sub">${T('Give anyone a different name, or a real face from a photo. A name or face changed on a child’s device still wins there.', 'Đổi tên ai cũng được, hoặc gắn khuôn mặt thật từ ảnh. Tên hay khuôn mặt đã đổi trên máy của con vẫn được ưu tiên ở máy đó.')}</p>
  <div class="card"><input type="text" id="find" placeholder="🔎 ${T('Find someone…', 'Tìm nhân vật…')}"><table><thead><tr><th></th><th>${T('Name in the game', 'Tên trong game')}</th><th>🇦🇺 English</th><th>🇻🇳 Tiếng Việt</th></tr></thead><tbody>${list.map(n => {
    const nm = CONTENT.names[n.id] || {}, f = CONTENT.faces[n.id];
    return `<tr data-id="${esc(n.id)}"><td><button class="face" title="${T('Photo face', 'Ảnh khuôn mặt')}">${f ? `<img class="face" src="/game/${esc(f.photo)}?${Date.now()}">` : '📷'}</button></td><td><b>${esc(n.id)}</b><br><span class="note">${esc(n.en)}</span></td>
      <td><input type="text" data-l="en" value="${esc(nm.en || '')}" placeholder="${esc(n.en)}"></td><td><input type="text" data-l="vi" value="${esc(nm.vi || '')}" placeholder="${esc(n.id)}"></td></tr>`; }).join('')}</tbody></table></div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save names and faces', 'Lưu tên và khuôn mặt')}</button></div>`;
  $('#find').oninput = e => { const q = e.target.value.toLowerCase(); P.querySelectorAll('tbody tr').forEach(r => r.hidden = q && !r.textContent.toLowerCase().includes(q) && !r.dataset.id.toLowerCase().includes(q)); };
  P.querySelectorAll('.face').forEach(b => b.onclick = () => {
    const id = b.closest('tr').dataset.id;
    if (CONTENT.faces[id] && !confirm(T('Choose a new photo? (Cancel removes the face.)', 'Chọn ảnh mới? (Hủy để bỏ khuôn mặt.)'))) { delete CONTENT.faces[id]; b.innerHTML = '📷'; return; }
    cropper(id, async out => { if (!out) return; try { const r = await api('face', { id, dataUrl: out.photo }); CONTENT.faces[id] = { photo: r.photo, skin: out.skin }; b.innerHTML = `<img class="face" src="/game/${esc(r.photo)}?${Date.now()}">`; } catch (e) { fail(e); } });
  });
  $('#save').onclick = () => { P.querySelectorAll('tbody tr').forEach(r => { const en = r.querySelector('[data-l=en]').value.trim(), vi = r.querySelector('[data-l=vi]').value.trim(); if (en || vi) CONTENT.names[r.dataset.id] = { en, vi }; else delete CONTENT.names[r.dataset.id]; }); saveContent().catch(fail); };
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
// ---------- play time (defaults for devices that haven't chosen) ----------
PAGES.play = async P => {
  const d = CONTENT.defaults || {};
  P.innerHTML = `<h2>⏰ ${T('Play time', 'Giờ chơi')}</h2><p class="sub">${T('A starting value for each device. A setting already chosen on a device stays as it is.', 'Giá trị ban đầu cho mỗi máy. Cài đặt đã chọn trên máy nào thì giữ nguyên ở máy đó.')}</p>
  <div class="card"><label>${T('Remind the children to rest after', 'Nhắc các con nghỉ sau')}</label><select id="rest">${[0, 15, 20, 30, 45, 60].map(m => `<option value="${m}" ${+d.restMins === m ? 'selected' : ''}>${m ? m + ' ' + T('minutes', 'phút') : T('Never', 'Không nhắc')}</option>`).join('')}</select></div>
  <div class="bar"><button class="btn" id="save">💾 ${T('Save', 'Lưu')}</button></div>`;
  $('#save').onclick = () => { CONTENT.defaults = Object.assign(CONTENT.defaults || {}, { restMins: +$('#rest').value }); saveContent().catch(fail); };
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
    const src = await (await fetch('/game/' + f)).text();
    for (const p of PATTERNS) { const re = new RegExp(p, 'g'); let m; while ((m = re.exec(src))) { const en = unq(m[1]).trim(), vi = unq(m[2]).trim(); if (!en || !vi || en.length < 2) continue; if (/^[a-z]{2}:/.test(en) || /^[a-z]{2}:/.test(vi)) continue; if (!VI.test(vi) && en === vi) continue; if (/^[\p{Emoji}\s✓✕+−=]+$/u.test(en)) continue; if (en.split(/\s+/).length < 2 && !/[!?.]$/.test(en)) continue; seen.set(en + '\0' + vi, [en, vi]); } }
  }
  const c = CONTENT, add = (en, vi) => { if (en || vi) seen.set((en || vi) + '\0' + (vi || en), [en || vi, vi || en]); };
  (c.tales || []).forEach(t => { add(t.en, t.vi); t.pages.forEach(p => add(p[1], p[2])); });
  (c.quiz || []).forEach(q => { add(q.q[0], q.q[1]); q.answers.forEach(a => add(a[0] + '!', a[1] + '!')); });
  if (c.message) add(c.message.en, c.message.vi);
  const { swapNames } = await import('/game/js/i18n.js'), { LEARN } = await import('/game/js/words2.js'), { packHash } = await import('/game/js/packhash.js');
  const jobs = new Map(); const put = (lang, text) => { if (text) jobs.set(packHash(lang, text), { lang, text }); };
  for (const [en, vi] of seen.values()) { put('en', swapNames(en, 'en')); put('vi', swapNames(vi, 'vi')); }
  for (const [lang, L] of Object.entries(LEARN)) for (const w of L.words) put(lang, w[3]);
  const cities = await (await fetch('/game/js/cities.js')).text(), re = /\['([^'\\]+)', '(?:[^'\\]|\\.)*', '(?:[^'\\]|\\.)*', '(zh|hi)'\]/g; let m; while ((m = re.exec(cities))) put(m[2], m[1]);
  return jobs;
}
let voiceStop = false;
PAGES.voices = async P => {
  P.innerHTML = `<h2>🎙️ ${T('Voices', 'Giọng đọc')}</h2><p class="sub">${T('New games and stories need new recordings. Lines without one use the device’s own voice until they are made.', 'Trò chơi và truyện mới cần bản ghi mới. Câu nào chưa có thì máy tự đọc bằng giọng của máy cho tới khi có bản ghi.')}</p><div class="card" id="vsum">${T('Counting the lines…', 'Đang đếm các câu…')}</div>`;
  const jobs = await allJobs(), have = await api('voices/have');
  const missing = []; for (const [h, j] of jobs) for (const s of CAST[j.lang]) if (!have[j.lang][s].includes(h)) missing.push({ hash: h, slot: s, ...j });
  const by = L => missing.filter(x => x.lang === L).length, chars = missing.reduce((a, x) => a + x.text.length, 0);
  $('#vsum').innerHTML = `<p><b>${jobs.size}</b> ${T('lines in the game', 'câu trong game')} · <b class="${missing.length ? 'warn' : 'ok'}">${missing.length}</b> ${T('recordings missing', 'bản ghi còn thiếu')} (🇦🇺 ${by('en')} · 🇻🇳 ${by('vi')} · 🇨🇳 ${by('zh')} · 🇮🇳 ${by('hi')}), ${chars} ${T('characters', 'ký tự')}.</p>
    <div class="row"><button class="btn" id="az" ${!INFO.conf.azure || !missing.length ? 'disabled' : ''}>☁️ ${T('Make them with Azure', 'Tạo bằng Azure')}</button><button class="btn pink" id="pi" ${!INFO.conf.piper || !missing.length ? 'disabled' : ''}>💻 ${T('Make them with Piper (free, offline)', 'Tạo bằng Piper (miễn phí, không cần mạng)')}</button><button class="btn ghost" id="stop" disabled>⏹ ${T('Stop', 'Dừng')}</button></div>
    <p class="note">${!INFO.conf.azure ? T('Azure: add your key in Settings. ', 'Azure: thêm khóa trong Cài đặt. ') : T('Azure free tier: about 20 a minute, so this goes slowly; you can stop and carry on later. ', 'Azure miễn phí: khoảng 20 câu một phút nên hơi chậm; dừng lúc nào cũng được, lần sau làm tiếp. ')}${!INFO.conf.piper ? T('Piper: download it and its voices, then set them in Settings.', 'Piper: tải về cùng giọng đọc, rồi chọn trong Cài đặt.') : ''}</p>
    <div class="prog"><i id="pb"></i></div><p class="note" id="pt"></p></div>
    <div class="card"><h3>🎤 ${T('Or record them yourselves', 'Hoặc tự thu giọng')}</h3><p class="note">${T('Tap ⏺, read the line, tap ⏹. Your own voice then plays in the game.', 'Bấm ⏺, đọc câu, bấm ⏹. Giọng của bạn sẽ được phát trong game.')}</p>
    <input type="text" id="vf" placeholder="🔎 ${T('Find a line…', 'Tìm câu…')}"><div class="lines"><table><tbody id="vl"></tbody></table></div></div>`;
  const list = q => { $('#vl').innerHTML = missing.filter(x => !q || x.text.toLowerCase().includes(q)).slice(0, 200).map((x, i) => `<tr data-k="${missing.indexOf(x)}"><td><span class="pill">${x.lang} ${x.slot === 'f' ? '👩' : '👨'}</span></td><td>${esc(x.text)}</td><td><button class="btn small" data-rec>⏺</button></td></tr>`).join(''); $('#vl').querySelectorAll('[data-rec]').forEach(b => b.onclick = () => record(missing[+b.closest('tr').dataset.k], b)); };
  list(''); $('#vf').oninput = e => list(e.target.value.toLowerCase());
  const run = async engine => {
    voiceStop = false; $('#stop').disabled = false; $('#az').disabled = $('#pi').disabled = true;
    const gap = engine === 'azure' ? 3200 : 0; let done = 0, errs = 0;
    for (const x of [...missing]) {
      if (voiceStop) break; const t0 = Date.now();
      try { await api('voice', { engine, lang: x.lang, slot: x.slot, hash: x.hash, text: x.text }); done++; missing.splice(missing.indexOf(x), 1); } catch (e) { errs++; $('#pt').textContent = '⚠️ ' + e.message; if (/key|region|Settings|Piper/.test(e.message)) break; }
      $('#pb').style.width = (done / (done + missing.length) * 100) + '%'; $('#pt').textContent = `${done} ${T('made', 'đã tạo')}, ${missing.length} ${T('to go', 'còn lại')}${errs ? `, ${errs} ⚠️` : ''}`;
      const w = gap - (Date.now() - t0); if (w > 0) await new Promise(r => setTimeout(r, w));
    }
    $('#stop').disabled = true; toast(T('Done for now.', 'Xong đợt này.')); list($('#vf').value.toLowerCase());
  };
  $('#az').onclick = () => run('azure'); $('#pi').onclick = () => run('piper'); $('#stop').onclick = () => { voiceStop = true; };
  async function record(x, btn) {
    if (btn.dataset.on) { btn._rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }), rec = new MediaRecorder(stream), parts = [];
      rec.ondataavailable = e => parts.push(e.data); btn._rec = rec; btn.dataset.on = 1; btn.textContent = '⏹';
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); delete btn.dataset.on; btn.textContent = '…';
        const ac = new AudioContext(), buf = await ac.decodeAudioData(await new Blob(parts).arrayBuffer()), data = buf.getChannelData(0);
        if (!window.lamejs) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/ui/lame.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
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
PAGES.publish = async P => {
  P.innerHTML = `<h2>🚀 ${T('Publish', 'Phát hành')}</h2><p class="sub">${T('Make the zip with everything (game, your content, voices), then put it online.', 'Đóng gói tất cả (game, nội dung của bạn, giọng đọc) thành tệp zip, rồi đưa lên mạng.')}</p>
  <div class="card"><button class="btn" id="build">📦 ${T('Make the zip', 'Tạo tệp zip')}</button> <span id="bres" class="note"></span></div>
  <div class="card"><h3>☁️ Netlify</h3><p class="note">${INFO.conf.netlify ? T('Your Netlify site is set: ', 'Đã có trang Netlify: ') + esc(INFO.conf.netlifySite) : T('Add a Netlify token and the site name in Settings for one-click publishing. Or drag the zip onto your site’s Deploys page.', 'Thêm khóa Netlify và tên trang trong Cài đặt để phát hành một chạm. Hoặc kéo tệp zip vào trang Deploys của site.')}</p>
    <button class="btn pink" id="deploy" ${INFO.conf.netlify ? '' : 'disabled'}>🚀 ${T('Publish to Netlify', 'Phát hành lên Netlify')}</button> <span id="dres" class="note"></span></div>`;
  $('#build').onclick = async () => { $('#bres').textContent = T('Packing…', 'Đang đóng gói…'); try { const r = await api('build', {}); $('#bres').innerHTML = `✅ ${r.files} ${T('files', 'tệp')}, ${(r.bytes / 1e6).toFixed(1)} MB · <a href="/api/zip">⬇️ ${T('Download', 'Tải về')}</a>`; } catch (e) { $('#bres').textContent = '⚠️ ' + e.message; } };
  $('#deploy').onclick = async () => { $('#dres').textContent = T('Uploading… (a minute or two)', 'Đang tải lên… (một hai phút)'); try { const r = await api('deploy', {}); $('#dres').innerHTML = `✅ ${T('Published!', 'Đã phát hành!')} <a href="${esc(r.url)}" target="_blank">${esc(r.url)}</a>`; } catch (e) { $('#dres').textContent = '⚠️ ' + e.message; } };
};
// ---------- check ----------
PAGES.check = async P => {
  const r = await api('check');
  P.innerHTML = `<h2>🩺 ${T('Check the game', 'Kiểm tra game')}</h2><div class="card">${r.map(x => `<p class="${x.ok ? 'ok' : 'badtxt'}">${x.ok ? '✅' : '⚠️'} ${esc(T(x.en, x.vi))}</p>`).join('')}</div>`;
};
// ---------- settings ----------
PAGES.settings = async P => {
  const c = INFO.conf;
  P.innerHTML = `<h2>🔑 ${T('Settings', 'Cài đặt')}</h2><p class="sub">${T('Keys are kept only on this computer', 'Các khóa chỉ lưu trên máy tính này')} (<code>${esc(INFO.settingsFile)}</code>), ${T('never in the game.', 'không bao giờ nằm trong game.')}</p>
  <div class="card"><label>📂 ${T('Game folder (the one with index.html)', 'Thư mục game (có tệp index.html)')}</label><input type="text" id="gd" value="${esc(INFO.game || '')}"></div>
  <div class="card"><h3>☁️ Microsoft Azure ${T('voices', 'giọng đọc')}</h3><div class="row"><div><label>KEY 1 ${c.azure ? '✅' : ''}</label><input type="password" id="ak" placeholder="${c.azure ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Region', 'Vùng')}</label><input type="text" id="ar" value="${esc(c.azureRegion)}" placeholder="australiaeast"></div></div></div>
  <div class="card"><h3>💻 Piper (${T('free voices on this computer', 'giọng miễn phí trên máy')})</h3><p class="note">${T('Download piper.exe and voices (.onnx) from github.com/rhasspy/piper; good choices: vi_VN-vais1000-medium, en_GB-southern_english_female-low.', 'Tải piper.exe và giọng (.onnx) ở github.com/rhasspy/piper; nên chọn: vi_VN-vais1000-medium, en_GB-southern_english_female-low.')}</p>
    <label>piper.exe</label><input type="text" id="pe" value="${esc(c.piperExe)}" placeholder="C:\\piper\\piper.exe">
    <div class="row"><div><label>🇦🇺 ${T('English voice (.onnx)', 'Giọng tiếng Anh (.onnx)')}</label><input type="text" id="pen" value="${esc((c.piperModels || {}).en || '')}"></div><div><label>🇻🇳 ${T('Vietnamese voice (.onnx)', 'Giọng tiếng Việt (.onnx)')}</label><input type="text" id="pvi" value="${esc((c.piperModels || {}).vi || '')}"></div></div></div>
  <div class="card"><h3>🚀 Netlify</h3><div class="row"><div><label>${T('Personal access token', 'Khóa truy cập cá nhân')} ${c.netlify ? '✅' : ''}</label><input type="password" id="nt" placeholder="${c.netlify ? T('(saved, type to replace)', '(đã lưu, gõ để thay)') : ''}"></div><div><label>${T('Site name or ID (e.g. sparkle-valley.netlify.app)', 'Tên hoặc ID trang (vd. sparkle-valley.netlify.app)')}</label><input type="text" id="ns" value="${esc(c.netlifySite)}"></div></div>
    <p class="note">${T('Netlify → User settings → Applications → New access token.', 'Netlify → User settings → Applications → New access token.')}</p></div>
  <div class="bar"><button class="btn ghost" id="forget">🗑️ ${T('Forget the keys', 'Xóa các khóa')}</button><button class="btn" id="save">💾 ${T('Save settings', 'Lưu cài đặt')}</button></div>`;
  $('#save').onclick = async () => { try { await api('settings', { gameDir: $('#gd').value, azureKey: $('#ak').value, azureRegion: $('#ar').value, piperExe: $('#pe').value, piperModels: { en: $('#pen').value.trim(), vi: $('#pvi').value.trim() }, netlifyToken: $('#nt').value, netlifySite: $('#ns').value }); toast(T('Settings saved.', 'Đã lưu cài đặt.')); render(); } catch (e) { fail(e); } };
  $('#forget').onclick = async () => { if (!confirm(T('Forget the Azure and Netlify keys on this computer?', 'Xóa khóa Azure và Netlify trên máy này?'))) return; await api('settings', { forget: ['azureKey', 'netlifyToken'] }); toast(T('Keys forgotten.', 'Đã xóa khóa.')); render(); };
};
window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (PAGES[k] && k !== cur) { cur = k; render(); } });
render();
// keep the Studio running while this window is open; ⏻ stops it
setInterval(() => fetch('/api/ping').catch(() => { }), 20000);
$('#quit').onclick = async () => {
  if (!confirm(T('Close Sparkle Studio?', 'Đóng Sparkle Studio?'))) return;
  await fetch('/api/quit', { method: 'POST' }).catch(() => { });
  document.body.innerHTML = `<main><div class="card"><h2>👋 ${T('Sparkle Studio is closed.', 'Đã đóng Sparkle Studio.')}</h2><p class="sub">${T('You can close this window. Double-click SparkleStudio.exe to open it again.', 'Bạn có thể đóng cửa sổ này. Bấm đúp SparkleStudio.exe để mở lại.')}</p></div></main>`;
  window.close();
};

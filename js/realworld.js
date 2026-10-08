// The real place behind every landmark: "📷 Real photos" shows photographs of the real thing (the pictures
// Wikipedia's editors chose for its article, from Wikimedia Commons, with who took them), slowly panning like a
// film; "🚶 Step inside (360°)" opens Google Street View at the real place, to look round as if standing there.
// Photos saved with the game (photos/, made by Sparkle Studio) show first and work offline; when online, the best
// photos of the article (its main picture first) are added, and every photo shown is kept on this device, so next
// time it works without the internet too. Street View needs the internet.
import { T } from './i18n.js';
import { el, esc, flip } from './util.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { pic } from './art.js';

// id → [Wikipedia article(s) to take the photos from (lang:Title), latitude, longitude]
export const REAL = {
  opera: [['en:Sydney Opera House'], -33.8568, 151.2153], harbour: [['en:Sydney Harbour Bridge'], -33.8523, 151.2108], uluru: [['en:Uluru'], -25.3444, 131.0369],
  banana: [['en:Big Banana'], -30.2766, 153.1365], bondi: [['en:Bondi Beach'], -33.8915, 151.2767], lighthouse: [['vi:Hải đăng Vũng Tàu', 'en:Vũng Tàu'], 10.3348, 107.0773],
  turtle: [['en:Turtle Tower', 'en:Hoàn Kiếm Lake'], 21.0277, 105.8522], onepillar: [['en:One Pillar Pagoda'], 21.0359, 105.8336], chuacau: [['en:Japanese Covered Bridge'], 15.8771, 108.3262],
  benthanh: [['en:Bến Thành Market'], 10.7725, 106.6980], goldenbridge: [['en:Golden Bridge (Vietnam)'], 15.9950, 107.9968], dragonbridge: [['en:Dragon Bridge (Da Nang)'], 16.0612, 108.2270],
  bnclock: [['en:Bắc Ninh'], 21.1861, 106.0763], chuadau: [['en:Dâu Pagoda', 'vi:Chùa Dâu'], 21.0371, 106.0420], butthap: [['vi:Chùa Bút Tháp', 'en:Bút Tháp Pagoda'], 21.0928, 106.0617],
  dendo: [['vi:Đền Đô', 'en:Đô Temple'], 21.1133, 105.9563], quanho: [['en:Quan họ'], 21.1861, 106.0763], vanmieu: [['en:Temple of Literature, Hanoi'], 21.0293, 105.8355],
  puppettheatre: [['en:Water puppetry'], 21.0318, 105.8532], cathedral: [['en:Notre-Dame Cathedral Basilica of Saigon'], 10.7798, 106.6990], postoffice: [['en:Saigon Central Post Office'], 10.7799, 106.7000],
  wheel: [['en:Wheel of Brisbane'], -27.4752, 153.0208], lonepine: [['en:Lone Pine Koala Sanctuary'], -27.5336, 152.9686], flinders: [['en:Flinders Street railway station'], -37.8183, 144.9671],
  wtram: [['en:Trams in Melbourne'], -37.8136, 144.9631], sydneytower: [['en:Sydney Tower'], -33.8705, 151.2089], lunapark: [['en:Luna Park Sydney'], -33.8477, 151.2100],
  bachdinh: [['vi:Bạch Dinh', 'en:Vũng Tàu'], 10.3534, 107.0687], nhatron: [['vi:Nhà Tròn (Bà Rịa)', 'vi:Bà Rịa'], 10.4963, 107.1685],
  halong: [['en:Hạ Long Bay'], 20.9101, 107.1839], hue: [['en:Imperial City of Huế'], 16.4698, 107.5786], myson: [['en:Mỹ Sơn'], 15.7640, 108.1240],
  phongnha: [['en:Phong Nha-Kẻ Bàng National Park'], 17.5906, 106.2833], trangan: [['en:Tràng An Scenic Landscape Complex'], 20.2539, 105.9178], reef: [['en:Great Barrier Reef'], -23.4423, 151.9148],
  sisters: [['en:Three Sisters (Australia)'], -33.7320, 150.3120], exhibition: [['en:Royal Exhibition Building'], -37.8047, 144.9717], kakadu: [['en:Kakadu National Park'], -12.4097, 132.9567],
  forbidden: [['en:Forbidden City'], 39.9163, 116.3972], heaven: [['en:Temple of Heaven'], 39.8822, 116.4066], terracotta: [['en:Terracotta Army'], 34.3841, 109.2785],
  potala: [['en:Potala Palace'], 29.6578, 91.1170], qutub: [['en:Qutb Minar'], 28.5245, 77.1855], redfort: [['en:Red Fort'], 28.6562, 77.2410],
  konark: [['en:Konark Sun Temple'], 19.8876, 86.0945], hampi: [['en:Vittala Temple', 'en:Hampi'], 15.3426, 76.4747], mahabodhi: [['en:Mahabodhi Temple'], 24.6959, 84.9914]
};
// photos for the kinds of houses and the speciality buildings round the cities (no 360° view: go inside instead)
export const REAL_KINDS = {
  tube: ['en:Tube house'], villa: ['en:French colonial architecture in Vietnam', 'en:Vietnamese architecture'], cottage: ['en:Queenslander (architecture)', 'en:Federation architecture'],
  raised: ['en:Queenslander (architecture)'], brick: ['en:Federation architecture'], village: ['en:Vietnamese architecture'], china: ['en:Siheyuan'], india: ['en:Haveli'],
  shop: ['en:Shophouse'], home8: ['en:Tube house'],
  pho: ['en:Phở'], hangma: ['en:Hàng Mã Street', 'en:Hanoi Old Quarter'], dongho: ['en:Đông Hồ painting'], quanhohouse: ['en:Quan họ'], miquang: ['en:Mì Quảng'],
  comtam: ['en:Cơm tấm'], aodai: ['en:Áo dài'], surf: ['en:Surf lifesaving'], terrace: ['en:Terraced house', 'en:Paddington, New South Wales'], laneway: ['en:Laneways of Melbourne', 'en:Hosier Lane'],
  che: ['en:Chè'], footy: ['en:Australian rules football'], queenslander: ['en:Queenslander (architecture)'], lamington: ['en:Lamington']
};

// which photos fit a home: its speciality (from its name) first, else its kind of house
const SPECIAL = [[/phở/i, 'pho'], [/hàng mã/i, 'hangma'], [/đông hồ/i, 'dongho'], [/quan họ/i, 'quanhohouse'], [/mì quảng/i, 'miquang'], [/cơm tấm/i, 'comtam'], [/áo dài/i, 'aodai'],
  [/surf/i, 'surf'], [/terrace/i, 'terrace'], [/laneway|café/i, 'laneway'], [/footy/i, 'footy'], [/queenslander/i, 'queenslander'], [/lamington/i, 'lamington'], [/chè/i, 'che']];
export function homeSources(name, kind) { const sp = SPECIAL.find(([re]) => re.test(name || '')); return REAL_KINDS[sp ? sp[1] : kind] || null; }
const cache = {};
const BAD = /\.(svg|gif|tif|tiff|webm|ogv|ogg|oga|wav|mp3|pdf)$|logo|flag of|map|locator|coat of arms|seal of|icon|diagram|signature|plan of|chart/i;
export const photoKey = sources => sources[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60);
let LOCAL = null; // photos/index.json: { key: [{ src, file, caption, credit }] }
const localPhotos = async key => { if (!LOCAL) LOCAL = fetch('photos/index.json').then(r => r.ok ? r.json() : {}).catch(() => ({})); const L = await LOCAL; return (L[key] || []).map(p => ({ ...p, url: p.src, local: true })); };
const KEEP = 'sv-photos';
async function keptList(key) { try { const c = await caches.open(KEEP), r = await c.match('/photos-list/' + key); return r ? await r.json() : null; } catch (e) { return null; } }
async function keepList(key, list) { try { const c = await caches.open(KEEP); await c.put('/photos-list/' + key, new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { } }
// a photo from Wikimedia, kept on the device the first time it is shown (works offline afterwards)
async function photoURL(p) {
  if (p.local) return p.url;
  try {
    const c = await caches.open(KEEP); let r = await c.match(p.url);
    if (!r) { r = await fetch(p.url, { mode: 'cors', referrerPolicy: 'no-referrer' }); if (!r.ok) return p.url; await c.put(p.url, r.clone()); }
    return URL.createObjectURL(await r.blob());
  } catch (e) { return p.url; }
}
// (round O, owner: "Real photos shows nothing") Wikipedia is retiring the old picture list this used (rest_v1
// media-list), so the photos now come from Wikipedia's main API: the article's pictures with their sizes, captions,
// photographers and licences in one request (generator=images + imageinfo), the article's own main picture first.
// The old list is still tried when the main API gives nothing.
const txt = h => { const d = document.createElement('div'); d.innerHTML = String(h || ''); return d.textContent.replace(/\s+/g, ' ').trim(); };
async function apiPhotos(lang, title) {
  const base = `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&redirects=1&titles=${encodeURIComponent(title)}`;
  const [lead, all] = await Promise.all([
    fetch(base + '&action=query&prop=pageimages&piprop=name').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(base + '&action=query&generator=images&gimlimit=60&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1280').then(r => r.ok ? r.json() : null)
  ]);
  const leadName = ((((lead || {}).query || {}).pages || [])[0] || {}).pageimage || '';
  let out = ((all && all.query && all.query.pages) || []).map(pg => ({ pg, ii: (pg.imageinfo || [])[0] })).filter(({ pg, ii }) => ii && /^image\/(jpeg|png|webp)$/.test(ii.mime || '') && !BAD.test(pg.title || ''))
    .map(({ pg, ii }) => { const md = ii.extmetadata || {}, v = k => md[k] && md[k].value;
      return { url: ii.thumburl || ii.url, file: pg.title, caption: txt(v('ImageDescription')).slice(0, 160), credit: [txt(v('Artist')).slice(0, 60), txt(v('LicenseShortName'))].filter(Boolean).join(' · '), lead: pg.title.replace(/^[^:]+:/, '').replace(/ /g, '_') === leadName.replace(/ /g, '_') }; })
    .filter(p => { try { return new URL(p.url).hostname === 'upload.wikimedia.org'; } catch (e) { return false; } });
  out.sort((a, b) => b.lead - a.lead);
  return out.slice(0, 8);
}
async function restPhotos(lang, title) {
  const t = encodeURIComponent(title.replace(/ /g, '_'));
  const [ml, sum] = await Promise.all([fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${t}`, { headers: { accept: 'application/json' } }), fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${t}`).catch(() => null)]);
  if (!ml.ok) return [];
  const j = await ml.json(), lead = sum && sum.ok ? ((await sum.json()).originalimage || {}).source || '' : '';
  const leadName = lead ? decodeURIComponent(lead.split('/').pop()).replace(/^\d+px-/, '') : '';
  let out = (j.items || []).filter(it => it.type === 'image' && it.showInGallery !== false && !BAD.test(it.title || '') && it.srcset && it.srcset.length).map(it => {
    const pick = it.srcset.find(x => x.scale === '2x') || it.srcset[it.srcset.length - 1], url = pick.src.startsWith('//') ? 'https:' + pick.src : pick.src;
    return { url, file: it.title, caption: it.caption && it.caption.text ? it.caption.text : '' };
  }).filter(p => { try { return new URL(p.url).hostname === 'upload.wikimedia.org'; } catch (e) { return false; } });
  if (leadName) out.sort((a, b) => (b.file.replace(/^File:/, '').replace(/ /g, '_') === leadName) - (a.file.replace(/^File:/, '').replace(/ /g, '_') === leadName));
  return out.slice(0, 8);
}
async function onlinePhotos(sources) {
  for (const s of sources) {
    const [lang, title] = s.split(/:(.+)/);
    for (const way of [apiPhotos, restPhotos]) {
      try { const out = await way(lang, title); if (out && out.length) return out; } catch (e) { /* offline or blocked: try the next way */ }
    }
  }
  return null;
}
async function photosFor(sources) {
  const key = photoKey(sources); if (cache[key]) return cache[key];
  const local = await localPhotos(key);
  const online = navigator.onLine === false ? null : await onlinePhotos(sources);
  if (online) keepList(key, online);
  const more = online || await keptList(key) || [];
  const seen = new Set(local.map(p => p.file)), photos = [...local, ...more.filter(p => !seen.has(p.file))];
  if (!photos.length) return null;
  return (cache[key] = { photos });
}
// who took the photo and its licence (for the credit line)
async function creditFor(file) {
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent(file)}`);
    const j = await r.json(), pg = Object.values((j.query || {}).pages || {})[0], md = pg && pg.imageinfo && pg.imageinfo[0].extmetadata || {};
    const txt = h => { const d = document.createElement('div'); d.innerHTML = String(h || ''); return d.textContent.trim().slice(0, 80); };
    return [txt(md.Artist && md.Artist.value), txt(md.LicenseShortName && md.LicenseShortName.value)].filter(Boolean).join(' · ');
  } catch (e) { return ''; }
}

// the photo viewer: big, slowly panning photos; swipe or ◀ ▶; the 360° button when there is a real place to stand in
export function openPhotos(name, sources, { icon = '📷', id = null, onClose } = {}) {
  const real = id && REAL[id];
  const m = el('div', 'realview', `<div class="rv-stage"><div class="rv-load">${pic(icon)}<p>${T('Finding real photos…', 'Đang tìm ảnh thật…')}</p></div></div>
    <div class="rv-top"><b>${esc(name)}</b><button class="rv-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <button class="rv-prev" aria-label="${T('Back', 'Trước')}">◀</button><button class="rv-next" aria-label="${T('Next', 'Tiếp')}">▶</button>
    <div class="rv-bot"><div class="rv-dots"></div><div class="rv-cap"></div>${real ? `<button class="rv-360">🚶 ${T('Step inside (360°)', 'Bước vào xem 360°')}</button>` : ''}</div>`);
  document.body.appendChild(m); SFX.tap();
  const stage = m.querySelector('.rv-stage'), dots = m.querySelector('.rv-dots'), cap = m.querySelector('.rv-cap');
  let list = [], k = 0, auto = 0, closed = false;
  const close = () => { if (closed) return; closed = true; clearInterval(auto); m.classList.add('out'); setTimeout(() => m.remove(), 250); onClose && onClose(); };
  m.querySelector('.rv-x').onclick = () => { SFX.tap(); close(); };
  if (real) m.querySelector('.rv-360').onclick = () => { SFX.tap(); openStreetView(id); };
  const show = i => {
    if (!list.length) return; k = (i + list.length) % list.length; const p = list[k];
    const im = el('img', 'rv-img'); im.alt = name; im.referrerPolicy = 'no-referrer'; im.style.setProperty('--px', (k % 2 ? 1 : -1) * 3 + '%');
    photoURL(p).then(u => { im.src = u; });
    im.onload = () => { stage.querySelectorAll('.rv-img.on').forEach(o => { o.classList.remove('on'); setTimeout(() => o.remove(), 900); }); im.classList.add('on'); };
    stage.appendChild(im);
    dots.innerHTML = list.map((_, j) => `<i class="${j === k ? 'on' : ''}"></i>`).join('');
    cap.innerHTML = `<span>📷 ${esc((p.caption || '').slice(0, 120))}</span><a href="https://commons.wikimedia.org/wiki/${encodeURIComponent(p.file)}" target="_blank" rel="noopener">${T('Photo', 'Ảnh')}: ${esc(p.credit || 'Wikimedia Commons')}</a>`;
    if (!p.credit) creditFor(p.file).then(c => { if (c) { p.credit = c; if (list[k] === p) cap.querySelector('a').textContent = `${T('Photo', 'Ảnh')}: ${c}`; } });
  };
  const step = d => { SFX.tap(); clearInterval(auto); show(k + d); auto = setInterval(() => show(k + 1), 7000); };
  m.querySelector('.rv-prev').onclick = () => step(-1); m.querySelector('.rv-next').onclick = () => step(1);
  let sx = null; stage.addEventListener('pointerdown', e => { sx = e.clientX; }); stage.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 40) step((e.clientX - sx) * flip(stage) < 0 ? 1 : -1); sx = null; });
  photosFor(sources).then(r => {
    if (closed) return;
    if (!r) {
      stage.querySelector('.rv-load').innerHTML = `${pic(icon)}<p>${T('The photos of this place are still on their way. They will be here next time!', 'Ảnh thật của nơi này đang trên đường tới. Lần sau sẽ có nhé!')}</p>`;
      say('The photos of this place are still on their way. They will be here next time!', 'Ảnh thật của nơi này đang trên đường tới. Lần sau sẽ có nhé!'); m.classList.add('none'); return;
    }
    list = r.photos; stage.querySelector('.rv-load').remove(); m.classList.toggle('one', list.length < 2);
    show(0); auto = setInterval(() => show(k + 1), 7000);
    say(`Here is the real ${name}!`, `Đây là ${name} thật nè!`);
  });
  return m;
}
// The real place, inside the game (owner, round H: "show it in game instead of jumping to the web or an app"): a window
// with the real spot from above (satellite map) and from the street (look around), both embedded; ✕ goes back to the
// valley. Without the internet it says so instead.
export function openStreetView(id) {
  const r = REAL[id]; if (!r) return;
  const [, lat, lng] = r, hl = T('en', 'vi');
  const src = { map: `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=18&hl=${hl}&output=embed`, street: `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&hl=${hl}&output=svembed` };
  const m = el('div', 'modal rvmap', `<div class="card"><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <div class="rvm-tabs"><button class="btn primary" data-v="map">🗺️ ${T('From above', 'Nhìn từ trên cao')}</button><button class="btn" data-v="street">👀 ${T('Look around', 'Nhìn xung quanh')}</button></div>
    <div class="rvm-frame">${navigator.onLine === false ? `<p class="note center">${T('The real place needs the internet. Try again when you are online!', 'Xem nơi thật cần có mạng. Khi có mạng con thử lại nhé!')}</p>` : `<iframe title="${T('The real place', 'Nơi thật')}" src="${src.map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`}</div></div>`);
  document.body.appendChild(m);
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
  m.querySelector('.x').onclick = () => { SFX.tap(); close(); };
  m.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { SFX.tap(); m.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('primary', x === b)); const f = m.querySelector('iframe'); if (f) f.src = src[b.dataset.v]; if (b.dataset.v === 'street') say('Look around! Drag to turn, and tap the arrows to walk.', 'Nhìn xung quanh nhé! Kéo để xoay, chạm mũi tên để đi.'); });
  say('Here is the real place!', 'Đây là nơi thật nè!');
  return m;
}

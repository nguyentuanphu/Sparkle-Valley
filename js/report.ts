// The play report for grown-ups (round F): for each child, how long they played each day this week, which games
// they played most and how far they got, the places, postcards and words they collected. Nothing leaves the device.
// Counting listens to the event bus (architecture step 1): ActivityCompleted / ActivityAbandoned add a game to the
// day; main.js adds a minute for every minute of real play (not while the game is put away or paused on a menu).
//   profile.stats.days = { 'YYYY-MM-DD': { min, games } } (the last 30 days)   profile.stats.played = { gameId: times }
import { T, nm } from './i18n.js';
import { events } from './core/events.js';
import { parse } from './core/ids.js';
import { GAMES } from './games/registry.js';
import { PLACES, placeStickers, placeName } from './placebook.js';
import { customAlbum } from './custom.js';
import { modal } from './popups.js';
import { pic } from './art.js';
import { esc } from './util.js';

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const days = p => { const s = p.stats = p.stats || {}; s.days = s.days && typeof s.days === 'object' ? s.days : {}; return s.days; };
const today = p => { const d = days(p), k = dayKey(); if (!d[k]) { d[k] = { min: 0, games: 0 }; const keys = Object.keys(d).sort(); while (keys.length > 30) delete d[keys.shift()]; } return d[k]; };
/** one more minute of play for this child */
export const addMinute = p => { today(p).min++; };

export function createReport(G, { save }) {
  const profileOf = playerId => { const n = (parse(playerId) || {}).name; return (G.heroes.find(h => h.profile.id === n) || {}).profile; };
  const played = (players, defId) => {
    const game = (parse(defId) || {}).name;
    for (const id of players || []) { const p = profileOf(id); if (!p) continue; today(p).games++; const pl = p.stats.played = p.stats.played || {}; if (game) pl[game] = (pl[game] || 0) + 1; }
    save();
  };
  events.on('ActivityStarted', e => { G._actPlayers = G._actPlayers || {}; G._actPlayers[e.activityId] = e.players; });
  events.on('ActivityCompleted', e => played(e.players, e.defId));
  events.on('ActivityAbandoned', e => { const pl = (G._actPlayers || {})[e.activityId]; if (pl) played(pl, e.activityId.replace(/^act:([^/]+)\/.*$/, 'game:$1')); });
}

// the report window
export function openReport(p) {
  const d = days(p), week = [...Array(7)].map((_, k) => { const t = new Date(); t.setDate(t.getDate() - 6 + k); const key = dayKey(t); return { key, t, ...(d[key] || { min: 0, games: 0 }) }; });
  const most = Math.max(30, ...week.map(x => x.min)), weekMin = week.reduce((a, x) => a + x.min, 0), weekGames = week.reduce((a, x) => a + x.games, 0);
  const pl: Record<string, number> = (p.stats && p.stats.played) || {}, top = Object.entries(pl).filter(([id]) => GAMES[id]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const st = placeStickers(p), places = PLACES.filter(x => st[x.id]), fam = customAlbum(), famGot = fam.filter(c => (p.familyCards || {})[c.id]).length;
  const dayName = t => t.toLocaleDateString(T('en-AU', 'vi-VN'), { weekday: 'short' });
  const m = modal('report', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>
    <h2>${pic('📊')} ${T('Play report', 'Báo cáo chơi')}: ${esc(nm(p.name))}</h2>
    <p class="note">${T('Kept on this device only.', 'Chỉ lưu trên máy này.')} ${p.age === 'big' ? T('Big kid (5 to 8)', 'Bé lớn (5 đến 8 tuổi)') : T('Little (under 5)', 'Bé nhỏ (dưới 5 tuổi)')} · ${T({ easy: 'Easy', medium: 'Medium', hard: 'Hard' }[p.difficulty] || 'Easy', { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' }[p.difficulty] || 'Dễ')}</p>
    <h3>${T('This week', 'Tuần này')}: ${weekMin} ${T('minutes', 'phút')}, ${weekGames} ${T('games', 'trò chơi')}</h3>
    <div class="rep-week">${week.map(x => `<div class="rep-day"><i style="height:${Math.round(x.min / most * 100)}%"></i><b>${x.min}</b><small>${esc(dayName(x.t))}</small></div>`).join('')}</div>
    <h3>${T('Favourite games', 'Trò chơi yêu thích')}</h3>
    ${top.length ? `<ol class="rep-games">${top.map(([id, n]) => `<li><span>${pic(GAMES[id].icon)}</span><b>${esc(GAMES[id].name())}</b><small>${n}× · ${T('level', 'cấp')} ${(p.levels || {})[id] || 1}${(p.wins || {})[id] ? ` · ${(p.wins || {})[id]} ${T('wins', 'lần thắng')}` : ''}</small></li>`).join('')}</ol>` : `<p class="note">${T('No games played yet.', 'Chưa chơi trò nào.')}</p>`}
    <h3>${T('Collected', 'Đã sưu tầm')}</h3>
    <ul class="rep-list">
      <li>${pic('📒')} ${T('Places', 'Nơi đã đến')}: ${places.length}/${PLACES.length}${places.length ? ' (' + places.slice(0, 8).map(x => esc(placeName(x.id))).join(', ') + (places.length > 8 ? '…' : '') + ')' : ''}</li>
      <li>${pic('📮')} ${T('Landmark postcards', 'Bưu thiếp danh lam')}: ${Object.keys(p.postcards || {}).length}${fam.length ? ` · ${pic('💌')} ${T('family postcards', 'bưu thiếp gia đình')}: ${famGot}/${fam.length}` : ''}</li>
      <li>${pic('🗣️')} ${T('Words learned', 'Từ đã học')}: ${Object.keys(p.words || {}).length} · ${pic('✨')} ${T('Shrines', 'Đền')}: ${Object.keys(p.shrines || {}).length}/12</li>
    </ul>
    <div class="rp-bar actions"><button class="btn" data-print>${pic('🖨️')} ${T('Print or save as PDF', 'In hoặc lưu PDF')}</button><button class="btn ghost" data-close>${T('Close', 'Đóng')}</button></div>`);
  const close = () => m.close();
  m.querySelector('.x').onclick = close; m.querySelector('[data-close]').onclick = close;
  // (r89, owner's iPhone screenshot) an app opened from the Home Screen ignores print() on iPhone and iPad, so there the
  // report is made into a one-page PDF on the device and handed to the share sheet (Print, Save to Files, Mail); a
  // browser that cannot share files saves it instead. Everywhere else the browser's own print window opens as before.
  m.querySelector('[data-print]').onclick = async () => {
    if (!homeScreenApp()) { document.body.classList.add('printing-report'); print(); setTimeout(() => document.body.classList.remove('printing-report'), 500); return; }
    const name = `${T('Play report', 'Báo cáo chơi')} ${String(nm(p.name)).replace(/[^\p{L}\p{N} ]+/gu, '')} ${dayKey()}.pdf`;
    const file = new File([reportPDF({ title: `${T('Play report', 'Báo cáo chơi')}: ${nm(p.name)}`, note: m.querySelector('.note')?.textContent || '',
      week: week.map(x => ({ label: dayName(x.t), min: x.min })), total: `${T('This week', 'Tuần này')}: ${weekMin} ${T('minutes', 'phút')}, ${weekGames} ${T('games', 'trò chơi')}`,
      gamesTitle: T('Favourite games', 'Trò chơi yêu thích'), games: top.map(([id, n]) => `${GAMES[id].name()}: ${n}× · ${T('level', 'cấp')} ${(p.levels || {})[id] || 1}${(p.wins || {})[id] ? ` · ${(p.wins || {})[id]} ${T('wins', 'lần thắng')}` : ''}`),
      collectedTitle: T('Collected', 'Đã sưu tầm'), collected: [...m.querySelectorAll('.rep-list li')].map(li => (li.textContent || '').trim()) })], name, { type: 'application/pdf' });
    try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  };
  return m;
}

// an app started from the Home Screen (iOS only marks it with navigator.standalone; others with the display mode)
const homeScreenApp = () => ('standalone' in navigator && navigator.standalone === true) || ['standalone', 'fullscreen'].some(d => matchMedia(`(display-mode: ${d})`).matches) && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;

type ReportPage = { title: string; note: string; week: { label: string; min: number }[]; total: string; gamesTitle: string; games: string[]; collectedTitle: string; collected: string[] };
// the report drawn on an A4 page (the device's own fonts, so Vietnamese prints right), as a one-page PDF holding that picture
export function reportPDF(r: ReportPage): Uint8Array<ArrayBuffer> {
  const W = 1240, H = 1754, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); if (!g) throw new Error('no canvas');
  const font = (px: number, bold = false) => `${bold ? '800 ' : ''}${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const wrap = (text: string, x: number, y: number, max: number, lh: number) => { let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > max && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; };
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a2a78';
  g.font = font(56, true); let y = wrap(r.title, 90, 150, W - 180, 66);
  g.fillStyle = '#5b5368'; g.font = font(28); y = wrap(r.note, 90, y, W - 180, 38) + 20;
  g.fillStyle = '#7b4bd6'; g.font = font(38, true); y = wrap(r.total, 90, y, W - 180, 48) + 10;
  const most = Math.max(30, ...r.week.map(d => d.min)), bw = (W - 180) / r.week.length, top = y, base = y + 300;
  r.week.forEach((d, i) => { const x = 90 + i * bw, h = d.min / most * 260; g.fillStyle = '#7fb8ff'; g.fillRect(x + bw * .18, base - h, bw * .64, Math.max(4, h));
    g.fillStyle = '#3b2a4f'; g.font = font(28, true); g.textAlign = 'center'; g.fillText(String(d.min), x + bw / 2, base + 40); g.font = font(24); g.fillText(d.label, x + bw / 2, base + 74); g.textAlign = 'left'; });
  y = Math.max(top, base) + 150;
  for (const [head, list] of [[r.gamesTitle, r.games], [r.collectedTitle, r.collected]] as const) {
    g.fillStyle = '#7b4bd6'; g.font = font(38, true); g.fillText(head, 90, y); y += 56;
    g.fillStyle = '#3b2a4f'; g.font = font(30); for (const t of list.length ? list : ['–']) y = wrap('• ' + t, 110, y, W - 220, 40) + 6;
    y += 30;
  }
  const jpeg = Uint8Array.from(atob(c.toDataURL('image/jpeg', .9).split(',')[1]), ch => ch.charCodeAt(0));
  return pdfOf(jpeg, W, H);
}
// a one-page A4 PDF showing one JPEG picture (the smallest valid file: catalogue, pages, page, picture, drawing)
export function pdfOf(jpeg: Uint8Array, w: number, h: number): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], offs: number[] = []; let len = 0;
  const put = (b: Uint8Array | string) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
  const draw = `q 595 0 0 842 0 0 cm /Im Do Q`;
  put('%PDF-1.4\n');
  const obj = (n: number, body: (string | Uint8Array)[]) => { offs[n] = len; put(`${n} 0 obj\n`); body.forEach(put); put('\nendobj\n'); };
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  obj(3, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im 4 0 R >> >> /Contents 5 0 R >>']);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  obj(5, [`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`]);
  const xref = len; put(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}

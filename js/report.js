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
  const pl = (p.stats && p.stats.played) || {}, top = Object.entries(pl).filter(([id]) => GAMES[id]).sort((a, b) => b[1] - a[1]).slice(0, 6);
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
    <div class="bar"><button class="btn" data-print>${pic('🖨️')} ${T('Print or save as PDF', 'In hoặc lưu PDF')}</button><button class="btn ghost" data-close>${T('Close', 'Đóng')}</button></div>`);
  const close = () => m.close();
  m.querySelector('.x').onclick = close; m.querySelector('[data-close]').onclick = close;
  m.querySelector('[data-print]').onclick = () => { document.body.classList.add('printing-report'); print(); setTimeout(() => document.body.classList.remove('printing-report'), 500); };
  return m;
}

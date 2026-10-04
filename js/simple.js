// The Simple screen (owner, round I: "a simplified screen for under 5, with an option to switch to the normal screen;
// big kids can switch to it too"). Instead of walking the 3D valley, a little child sees a winding path of big
// pictures: tap one and it starts at once (a game, a story), or the explorer flies there (a place). The voice says
// what was tapped; the 🔊 button says the screen again; nothing is locked and nothing needs reading.
//   Bottom bar: 🎮 Games · 📖 Stories · 🗺️ Places · 🌳 Valley (the 3D world). Grown-ups: press and hold, as everywhere.
// Which screen a child starts on is kept per child (profile.screen: 'simple' | 'valley'); until a child has chosen,
// under-5s start on the Simple screen and big kids in the valley. Two players on one device always use the valley.
// When a game or story started here ends, the Simple screen comes back by itself.
import { T, both } from './i18n.js';
import { el, esc } from './util.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { saveProfiles } from './state.js';
import { GAMES, gameOpen } from './games/frame.js';
import { HUB, holdButton, openGrownups } from './ui.js';

export const wantsSimple = p => (p.screen ? p.screen === 'simple' : p.age !== 'big');
// stars on the path: played once, twice, four times
export const starsOf = (p, id) => { const w = (p.wins || {})[id] || 0; return w >= 4 ? 3 : w >= 2 ? 2 : w >= 1 ? 1 : 0; };
const firstPic = s => (String(s).match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/u) || ['📖'])[0];
export const TABS = [
  { key: 'games', icon: '🎮', label: () => T('Games', 'Trò chơi'), say: ['Tap a picture to play!', 'Chạm vào một hình để chơi nhé!'] },
  { key: 'tales', icon: '📖', label: () => T('Stories', 'Truyện'), say: ['Tap a picture to hear a story!', 'Chạm vào một hình để nghe kể chuyện nhé!'] },
  { key: 'places', icon: '🗺️', label: () => T('Places', 'Nơi chốn'), say: ['Where shall we fly to?', 'Mình bay đến đâu nào?'] }
];

export function createSimple(G) {
  let m = null, tab = 'games', back = false;
  const hero = () => G.heroes[0];
  const solo = () => G.heroes.length === 1;
  const gameIds = () => { const seen = new Set(); for (const s of HUB) for (const id of s.games) if (GAMES[id]) seen.add(id); return [...seen]; };
  function stops() {
    const p = hero().profile;
    if (tab === 'tales') return (G.TALES || []).map(t => ({ key: t.id, icon: firstPic(t.pages[0][0]), badge: t.flag, name: t.title(), voice: both(t.title), stars: (p.tales || {})[t.id] ? 1 : 0, max: 1 }));
    if (tab === 'places') return (G.PLACES || []).map((pl, k) => ({ key: String(k), icon: pl.icon, name: pl.name(), voice: both(pl.name), stars: 0, max: 0 }));
    return gameIds().map(id => ({ key: id, icon: GAMES[id].icon, name: GAMES[id].name(), voice: both(GAMES[id].name), stars: starsOf(p, id), max: 3 }));
  }
  // a phone on its side (owner, round I: "ensure the screen also works in landscape"): the bar becomes a rail on the
  // left and the path winds sideways, scrolling left and right, like a road across the screen
  const wideQ = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (max-height: 560px)') : null;
  const wide = () => !!(wideQ && wideQ.matches);
  function layoutWide(n, h) {
    const gx = 168, mid = Math.max(130, h / 2 - 6), pts = [];
    for (let k = 0; k < n; k++) pts.push({ x: 96 + k * gx, y: mid + (k % 2 ? 30 : -30) });
    return { pts, w: 96 + n * gx };
  }
  // where each stop sits: a snake of rows across the screen, joined by a winding road
  function layout(n, w) {
    const cols = w < 520 ? 2 : w < 820 ? 3 : w < 1100 ? 4 : 5, gx = w / cols, gy = 216, pts = [];
    for (let k = 0; k < n; k++) { const r = Math.floor(k / cols), c = k % cols, cc = r % 2 ? cols - 1 - c : c; pts.push({ x: gx * (cc + .5), y: 96 + r * gy + (c % 2) * 18 }); }
    return { pts, h: 96 + Math.ceil(n / cols) * gy + 40 };
  }
  const roadWide = pts => pts.map((q, k) => k ? `C${pts[k - 1].x + 70},${pts[k - 1].y} ${q.x - 70},${q.y} ${q.x},${q.y}` : `M${q.x - 120},${q.y} L${q.x},${q.y}`).join(' ');
  const road = pts => pts.map((q, k) => { if (!k) return `M${q.x},${q.y}`; const a = pts[k - 1], my = (a.y + q.y) / 2; return a.y === q.y || Math.abs(a.y - q.y) < 40 ? `C${(a.x + q.x) / 2},${a.y - 30} ${(a.x + q.x) / 2},${q.y + 30} ${q.x},${q.y}` : `C${a.x + (a.x < q.x ? 90 : -90)},${my} ${q.x + (a.x < q.x ? -90 : 90)},${my} ${q.x},${q.y}`; }).join(' ');
  function draw() {
    if (!m) return;
    const list = stops(), path = m.querySelector('.sp-path'), sc = m.querySelector('.sp-scroll'), isWide = wide();
    m.classList.toggle('wide', isWide);
    let w, h, pts, d;
    if (isWide) { h = sc.clientHeight || innerHeight - 80; ({ pts, w } = layoutWide(list.length, h)); d = roadWide(pts); }
    else { w = path.clientWidth || innerWidth; ({ pts, h } = layout(list.length, w)); d = road(pts); }
    const next = list.findIndex(s => s.max && !s.stars);
    path.innerHTML = `<svg class="sp-road" width="${w}" height="${h}" aria-hidden="true"><path d="${d}"/><path class="dash" d="${d}"/></svg>` +
      list.map((s, k) => `<button class="sp-stop${k === next ? ' next' : ''}" data-k="${k}" style="left:${pts[k].x}px;top:${pts[k].y}px" aria-label="${esc(s.name)}">
        <span class="sp-pic">${pic(s.icon)}${s.badge ? `<i class="sp-badge">${s.badge}</i>` : ''}</span>
        ${s.max ? `<span class="sp-stars" aria-hidden="true">${[...Array(s.max)].map((_, j) => `<i class="${j < s.stars ? 'on' : ''}">★</i>`).join('')}</span>` : ''}
        <b class="sp-name">${esc(s.name)}</b></button>`).join('');
    path.style.height = h + 'px'; path.style.width = isWide ? w + 'px' : '';
    m.querySelectorAll('.sp-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    path.querySelectorAll('.sp-stop').forEach(b => b.onclick = () => go(list[+b.dataset.k]));
  }
  function go(s) {
    SFX.tap(); say(s.voice[0], s.voice[1]);
    const i = 0, h = hero();
    if (tab === 'games') { back = true; hide(); setTimeout(() => G.playGame(i, s.key, 'simple'), 350); }
    else if (tab === 'tales') { const t = (G.TALES || []).find(x => x.id === s.key); if (!t) return; back = true; hide(); setTimeout(() => G.readTaleNow(h, t), 350); }
    else { const pl = G.PLACES[+s.key]; back = false; leave(); setTimeout(() => G.travelTo(h, pl.x, pl.z), 350); }
  }
  function show(t) {
    if (!solo() || !hero()) return;
    if (t) tab = t;
    if (!m) {
      m = el('div', 'simple-screen');
      const p = hero().profile;
      m.innerHTML = `<div class="sp-top"><span class="sp-me">${p.photo ? `<img src="${p.photo}" alt="">` : pic('🙂')}<b>${esc(p.name)}</b></span>
        <button class="sp-again" aria-label="${T('Say it again', 'Nói lại')}">${pic('🔊')}</button>
        <button class="grown sp-grown"><span class="ring"></span>${pic('⚙️')}<small>${T('Grown-ups: press and hold', 'Người lớn: nhấn giữ')}</small></button></div>
        <div class="sp-scroll"><div class="sp-path"></div></div>
        <nav class="sp-tabs">${TABS.map(x => `<button data-tab="${x.key}"><span>${pic(x.icon)}</span><small>${esc(x.label())}</small></button>`).join('')}
          <button class="sp-valley"><span>${pic('🌳')}</span><small>${T('Valley', 'Thung lũng')}</small></button></nav>`;
      document.body.appendChild(m);
      m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { SFX.tap(); tab = b.dataset.tab; draw(); const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0; const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); });
      m.querySelector('.sp-again').onclick = () => { const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); };
      m.querySelector('.sp-valley').onclick = () => { SFX.tap(); choose('valley'); leave(); say('Off you go! Explore the valley.', 'Đi nào! Khám phá thung lũng thôi.'); };
      holdButton(m.querySelector('.sp-grown'), () => openGrownups(() => draw()));
      addEventListener('resize', draw);
      if (wideQ && wideQ.addEventListener) wideQ.addEventListener('change', draw);
    }
    m.hidden = false; G.paused = true; document.body.classList.add('simple-on');
    choose('simple'); draw();
    const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]);
  }
  function hide() { if (m) m.hidden = true; document.body.classList.remove('simple-on'); G.paused = false; }
  function leave() { back = false; hide(); }
  function choose(screen) { const p = hero() && hero().profile; if (p && p.screen !== screen) { p.screen = screen; saveProfiles(); } }
  // back to the path when the game or story started here is over (and nothing else is open)
  setInterval(() => {
    if (m && !m.hidden && !gameOpen()) G.paused = true; // the valley stays still behind it, also after a talk box closes
    if (!back || !m || !m.hidden || G.paused || gameOpen() || document.querySelector('.modal, .dialog, .storybook, .theatre, .reward')) return;
    back = false; show();
  }, 700);
  return {
    show, hide: leave, get open() { return !!m && !m.hidden; }, get tab() { return tab; },
    // at the start of a session: the Simple screen for a child who wants it
    start() { if (solo() && wantsSimple(hero().profile)) { const wait = setInterval(() => { if (document.querySelector('.storybook')) return; clearInterval(wait); if (solo() && wantsSimple(hero().profile)) show(); }, 400); } else if (m) leave(); }
  };
}

// The Simple screen (owner, round I: "a simplified screen for under 5, with an option to switch to the normal screen;
// big kids can switch to it too"). Instead of walking the 3D valley, a child sees a winding path of big pictures in a
// little storybook landscape: tap one and it starts (a game, a story), or the explorer flies there (a place).
//   Round J (owner's brief "an adventure world containing places children want to visit"):
//   · each tab opens on its groups (Animals, Music, Numbers…; stories by country; places by region: round M, owner:
//     "categorised into groups for easier understanding"); tap a group to walk its path; ⬅ at the top goes back to the
//     groups. An under-5 sees at most six stops at once, and a signpost at the end of the path leads on
//   · a game or story opens straight over this screen, which stays behind it (round M: the valley no longer flashes
//     up first), and the path is there again when it ends
//   · a tap answers at once: the picture grows and bounces, little stars burst, the voice says its name, then it opens;
//     a second tap while that happens is ignored, so a game never starts twice
//   · 🔎 Discover: every area as a big picture (and, for big kids, a search box)
//   · Ông Cú sits by the path, points at the next one to try and cheers when a new star is won; he never pops up
//   · big kids (5+) also see a ✨ on games that are new since they last looked, and choose
//     with two taps (the first one shows it, the second one plays), so a slip of the finger never starts a game
//   Bottom bar: 🎮 Games · 📖 Stories · 🗺️ Places · 🔎 Discover · 🌳 Valley (the 3D world). Grown-ups: press and hold.
// Which screen a child starts on is kept per child (profile.screen: 'simple' | 'valley'); until a child has chosen,
// under-5s start on the Simple screen and big kids in the valley. Two players on one device always use the valley.
// When a game or story started here ends, the Simple screen comes back by itself.
import { T, both } from './i18n.js';
import { el, esc } from './util.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { saveProfiles, reduceMotion } from './state.js';
import { GAMES, gameOpen } from './games/frame.js';
import { holdButton, openGrownups } from './ui.js';
import { AREAS, TALE_AREAS, PLACE_AREAS, LITTLE_PAGE, gamesIn, pages } from './content/activities.js';

// a star drawn on the picture card (round I, owner: "stars without a strip, placed on the icon"): gold when earned
const STAR = 'M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z';
export const wantsSimple = p => (p.screen ? p.screen === 'simple' : p.age !== 'big');
// stars on the path: played once, twice, four times
export const starsOf = (p, id) => { const w = (p.wins || {})[id] || 0; return w >= 4 ? 3 : w >= 2 ? 2 : w >= 1 ? 1 : 0; };
const firstPic = s => (String(s).match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}️?)*/u) || ['📖'])[0];
export const TABS = [
  { key: 'games', icon: '🎮', label: () => T('Games', 'Trò chơi'), say: ['Tap a picture to play!', 'Chạm vào một hình để chơi nhé!'] },
  { key: 'tales', icon: '📖', label: () => T('Stories', 'Truyện'), say: ['Tap a picture to hear a story!', 'Chạm vào một hình để nghe kể chuyện nhé!'] },
  { key: 'places', icon: '🗺️', label: () => T('Places', 'Nơi chốn'), say: ['Where shall we fly to?', 'Mình bay đến đâu nào?'] }
];
// for search: no accents, no case ("dap nieu" finds "Đập Niêu")
const plain = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

// the little storybook landscape behind the path: hills, trees, a pond, a sun and slow clouds (drawn once; it only moves
// gently and stands still in Calm mode, with the device's Reduce motion, and whenever the screen is hidden)
const SCENE = `<svg class="sp-land" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <circle cx="62" cy="70" r="34" fill="#fff3b0"/><circle cx="62" cy="70" r="24" fill="#ffe27a"/>
  <g class="sp-cloud c1"><ellipse cx="250" cy="92" rx="34" ry="14" fill="#fff"/><ellipse cx="272" cy="84" rx="22" ry="14" fill="#fff"/><ellipse cx="232" cy="86" rx="16" ry="11" fill="#fff"/></g>
  <g class="sp-cloud c2"><ellipse cx="120" cy="170" rx="28" ry="11" fill="#fff" opacity=".85"/><ellipse cx="138" cy="163" rx="17" ry="11" fill="#fff" opacity=".85"/></g>
  <path d="M0 520 C80 470 150 480 220 510 S340 470 400 490 V800 H0Z" fill="#a9dc90"/>
  <path d="M0 610 C70 580 140 600 210 590 S330 560 400 585 V800 H0Z" fill="#93cf7c"/>
  <path d="M0 700 C90 680 170 700 250 690 S350 670 400 680 V800 H0Z" fill="#84c46f"/>
  <g class="sp-tree"><rect x="22" y="470" width="8" height="34" rx="3" fill="#a5734a"/><circle cx="26" cy="458" r="22" fill="#6fbf5c"/><circle cx="14" cy="470" r="13" fill="#7ccb68"/></g>
  <g class="sp-tree t2"><rect x="364" y="440" width="8" height="40" rx="3" fill="#a5734a"/><circle cx="368" cy="428" r="24" fill="#62b351"/><circle cx="382" cy="442" r="14" fill="#74c262"/></g>
  <ellipse cx="330" cy="742" rx="52" ry="16" fill="#8fd3f0"/><ellipse class="sp-ripple" cx="330" cy="742" rx="26" ry="6" fill="none" stroke="#e6f7ff" stroke-width="2"/>
  <g fill="#ff9fc4"><circle cx="70" cy="640" r="4"/><circle cx="96" cy="660" r="4"/><circle cx="300" cy="630" r="4"/></g>
  <g fill="#fff27a"><circle cx="180" cy="720" r="4"/><circle cx="214" cy="742" r="4"/></g>
</svg><span class="sp-fly">${pic('🦋')}</span><i class="sp-twinkle"></i>`;

export function createSimple(G) {
  let m = null, tab = 'games', back = false, busy = false, sel = null, finding = false;
  const at = { games: 0, tales: 0, places: 0 }; // which page of the path each tab is on
  const group = { games: null, tales: null, places: null }; // the group open in each tab (null: the groups themselves)
  let launched = 0, opened = false, starsBefore = 0; // a game or story started from here (when), and whether it is open yet
  const lastStars = {};
  const hero = () => G.heroes[0];
  const solo = () => G.heroes.length === 1;
  const little = () => hero().profile.age !== 'big';
  // every stop of one tab, by area (from the one activity list)
  function areasOf(t) {
    const p = hero().profile, lt = little();
    if (t === 'tales') {
      const tales = G.TALES || [], known = TALE_AREAS.slice(0, 4).map(a => a.key);
      return TALE_AREAS.map(a => ({ area: a, items: tales.filter(x => a.key === '💛' ? !known.includes(x.flag) : x.flag === a.key)
        .map(x => ({ kind: 'tale', key: x.id, icon: firstPic(x.pages[0][0]), badge: x.flag, name: x.title(), voice: both(x.title), stars: (p.tales || {})[x.id] ? 1 : 0, max: 1 })) }));
    }
    if (t === 'places') return PLACE_AREAS.map(a => ({ area: a, items: (G.PLACES || []).map((pl, k) => ({ pl, k })).filter(x => x.pl.g === a.key)
      .map(({ pl, k }) => ({ kind: 'place', key: String(k), icon: pl.icon, name: pl.name(), voice: both(pl.name), stars: 0, max: 0 })) }));
    return AREAS.map(a => ({ area: a, items: gamesIn(GAMES, a.key, lt).map(g => ({ kind: 'game', key: g.id, icon: GAMES[g.id].icon, name: GAMES[g.id].name(), voice: both(GAMES[g.id].name), stars: starsOf(p, g.id), max: 3, level: g.level })) }));
  }
  // the groups of a tab, as stops: each with its picture and name
  const tabOf = t => TABS.find(y => y.key === t);
  const groupsOf = t => areasOf(t).filter(a => a.items.length);
  // the pages of the path: the groups, or the open group's stops; an under-5 gets at most six at a time, a big kid all
  function viewsOf(t) {
    const split = items => little() ? pages(items, LITTLE_PAGE) : [items];
    if (!group[t]) { const tb = tabOf(t), all = { key: 'groups', icon: tb.icon, name: tb.label }; const gs = groupsOf(t).map(({ area, items }) => ({ kind: 'group', key: area.key, icon: area.icon, name: area.name(), voice: both(area.name), stars: 0, max: 0, count: items.length }));
      return split(gs).map((items, i, ps) => ({ area: all, items, i, of: ps.length, groups: true })); }
    const a = groupsOf(t).find(x => x.area.key === group[t]); if (!a) { group[t] = null; return viewsOf(t); }
    return split(a.items).map((items, i, ps) => ({ area: a.area, items, i, of: ps.length }));
  }
  const idOf = s => s.kind + ':' + s.key;
  // ✨ new: games, stories and places that came after the child last looked (the first visit only remembers them all)
  function seenSet() {
    const p = hero().profile;
    if (!Array.isArray(p.seenActs)) { p.seenActs = ['games', 'tales', 'places'].flatMap(t => areasOf(t).flatMap(a => a.items.map(idOf))); saveProfiles(); }
    return new Set(p.seenActs);
  }
  function remember(s) { const p = hero().profile, seen = seenSet(); if (!seen.has(idOf(s))) { p.seenActs.push(idOf(s)); saveProfiles(); } }
  const totalStars = () => { const p = hero().profile; return Object.keys(GAMES).reduce((a, id) => a + starsOf(p, id), 0) + Object.keys(p.tales || {}).length; };

  // a phone on its side (owner, round I: "ensure the screen also works in landscape"): the bar becomes a rail on the
  // left and the path winds sideways, scrolling left and right, like a road across the screen
  const wideQ = typeof matchMedia === 'function' ? matchMedia('(orientation: landscape) and (max-height: 560px)') : null;
  const wide = () => !!(wideQ && wideQ.matches);
  // each stop is placed by the middle of its picture; its stars and full name hang below it (names are never cut:
  // the label is as wide as its column allows and the rows move apart to fit the tallest one)
  function layoutWide(n, h, tall) {
    const gx = 184, mid = Math.max(70, Math.min(h / 2 - 20, h - tall + 30)), pts = [];
    for (let k = 0; k < n; k++) pts.push({ x: 104 + k * gx, y: mid + (k % 2 ? 26 : -26) });
    return { pts, w: 104 + n * gx, lw: gx - 16 };
  }
  // where each stop sits: a snake of rows across the screen, joined by a winding road
  function layout(n, w, tall) {
    const cols = w < 520 ? 2 : w < 820 ? 3 : w < 1100 ? 4 : 5, gx = w / cols, gy = Math.max(200, tall + 40), pts = [];
    for (let k = 0; k < n; k++) { const r = Math.floor(k / cols), c = k % cols, cc = r % 2 ? cols - 1 - c : c; pts.push({ x: gx * (cc + .5), y: 76 + r * gy + (c % 2) * 18 }); }
    return { pts, h: 76 + (Math.ceil(n / cols) - 1) * gy + tall + 40, lw: Math.min(230, gx - 14), gx };
  }
  const roadWide = pts => pts.map((q, k) => k ? `C${pts[k - 1].x + 70},${pts[k - 1].y} ${q.x - 70},${q.y} ${q.x},${q.y}` : `M${q.x - 120},${q.y} L${q.x},${q.y}`).join(' ');
  const road = pts => pts.map((q, k) => { if (!k) return `M${q.x},${q.y}`; const a = pts[k - 1], my = (a.y + q.y) / 2; return a.y === q.y || Math.abs(a.y - q.y) < 40 ? `C${(a.x + q.x) / 2},${a.y - 30} ${(a.x + q.x) / 2},${q.y + 30} ${q.x},${q.y}` : `C${a.x + (a.x < q.x ? 90 : -90)},${my} ${q.x + (a.x < q.x ? -90 : 90)},${my} ${q.x},${q.y}`; }).join(' ');
  const starsHTML = s => s.max ? `<span class="sp-stars n${s.max}" aria-hidden="true">${[...Array(s.max)].map((_, j) => `<svg class="${j < s.stars ? 'on' : ''}" viewBox="0 0 24 24"><path d="${STAR}"/></svg>`).join('')}</span>` : '';
  let list = [];
  function draw() {
    if (!m) return;
    const views = viewsOf(tab); at[tab] = Math.min(at[tab], views.length - 1);
    const v = views[at[tab]] || { area: AREAS[0], items: [], i: 0, of: 1 }, lt = little(), seen = lt ? null : seenSet();
    list = v.items.map(s => ({ ...s, isNew: !!seen && !seen.has(idOf(s)) }));
    // the signpost at the end: this group's next stops, or else on to the next group
    if (at[tab] < views.length - 1) list.push({ kind: 'sign', key: 'more', icon: v.area.icon, name: T('More', 'Còn nữa'), voice: ['Here are some more!', 'Còn nữa đây!'], stars: 0, max: 0 });
    else if (group[tab]) { const gs = groupsOf(tab), k = gs.findIndex(x => x.area.key === group[tab]), nx = gs[(k + 1) % gs.length].area; if (gs.length > 1) list.push({ kind: 'sign', key: 'group', to: nx.key, icon: nx.icon, name: nx.name(), voice: both(nx.name), stars: 0, max: 0 }); }
    else if (views.length > 1) list.push({ kind: 'sign', key: 'first', icon: v.area.icon, name: T('Back to the start', 'Về đầu'), voice: ['Back to the start!', 'Về đầu nào!'], stars: 0, max: 0 });
    const path = m.querySelector('.sp-path'), sc = m.querySelector('.sp-scroll'), isWide = wide();
    m.classList.toggle('wide', isWide); m.classList.toggle('big', !lt);
    // the chip at the top: in a group it says which one and takes you back to all the groups (⬅)
    const area = m.querySelector('.sp-area'), inGroup = !!group[tab]; area.classList.toggle('back', inGroup);
    area.innerHTML = `${inGroup ? '<i class="sp-backarrow">⬅</i>' : ''}${pic(v.area.icon)}<b>${esc(v.area.name())}${v.of > 1 ? ` <small>${v.i + 1}/${v.of}</small>` : ''}</b>`;
    area.setAttribute('aria-label', inGroup ? T('All groups', 'Tất cả các nhóm') : v.area.name());
    const next = list.findIndex(s => s.max && !s.stars), H = sc.clientHeight || innerHeight - 80, W = path.clientWidth || innerWidth;
    const place = tall => isWide ? layoutWide(list.length, H, tall) : layout(list.length, W, tall);
    let L = place(230);
    path.style.setProperty('--lw', L.lw + 'px');
    path.innerHTML = `<svg class="sp-road" aria-hidden="true"><path/><path class="dash"/></svg>` +
      list.map((s, k) => `<button class="sp-stop${s.kind === 'sign' ? ' sign' : ''}${k === next ? ' next' : ''}${sel === idOf(s) ? ' sel' : ''}" data-k="${k}" aria-label="${esc(s.name)}">
        <span class="sp-pic">${pic(s.icon)}${s.badge ? `<i class="sp-badge">${s.badge}</i>` : ''}${s.kind === 'sign' ? `<i class="sp-arrow">${pic('👉')}</i>` : ''}${s.isNew ? `<i class="sp-new">${pic('✨')}</i>` : ''}${starsHTML(s)}</span>
        <b class="sp-name">${esc(s.name)}</b>${!lt && s.kind !== 'sign' && s.kind !== 'group' ? `<span class="sp-play">${T('Play', 'Chơi')} ▶</span>` : ''}</button>`).join('') +
      `<button class="sp-owl" aria-label="${T('Ông Cú', 'Ông Cú')}">${pic('🦉')}</button>`;
    // measure the tallest stop (its name may take two or three lines), then place them all
    const btns = [...path.querySelectorAll('.sp-stop')], tall = Math.max(150, ...btns.map(b => b.offsetHeight));
    L = place(tall);
    const w = isWide ? L.w : W, h = isWide ? H : L.h, d = isWide ? roadWide(L.pts) : road(L.pts);
    btns.forEach((b, k) => { b.style.left = L.pts[k].x + 'px'; b.style.top = L.pts[k].y + 'px'; });
    const svg = path.querySelector('svg'); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    path.style.height = h + 'px'; path.style.width = isWide ? w + 'px' : '';
    // Ông Cú stands beside the one to try next, on the side with room, and points at it
    const owl = path.querySelector('.sp-owl'), q = L.pts[next >= 0 ? next : 0];
    if (q) { const left = isWide ? false : q.x > W / 2, dx = isWide ? 0 : left ? -84 : 84; owl.style.left = q.x + dx + 'px'; owl.style.top = (isWide ? q.y - 96 : q.y) + 'px'; owl.classList.toggle('left', left); owl.classList.toggle('up', isWide); }
    owl.onclick = () => { SFX.tap(); owl.classList.remove('cheer'); void owl.offsetWidth; owl.classList.add('cheer'); const s = list[next >= 0 ? next : 0]; if (s) say(s.voice[0], s.voice[1]); };
    m.querySelectorAll('.sp-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    path.querySelectorAll('.sp-stop').forEach(b => b.onclick = () => go(list[+b.dataset.k], b));
  }
  // the tap: grow, bounce and sparkle at once, say the name, then open it (twice-tapping can't start it twice)
  function go(s, btn) {
    if (busy || !s) return;
    const top = () => { const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0; };
    if (s.kind === 'sign') { SFX.tap(); say(s.voice[0], s.voice[1]); if (s.key === 'group') { group[tab] = s.to; at[tab] = 0; } else if (s.key === 'first') at[tab] = 0; else at[tab]++; sel = null; draw(); top(); return; }
    if (s.kind === 'group') { SFX.tap(); say(s.voice[0], s.voice[1]); group[tab] = s.key; at[tab] = 0; sel = null; draw(); top(); return; }
    if (!little() && sel !== idOf(s)) { // a big kid: the first tap shows it, the second one plays it
      SFX.tap(); sel = idOf(s); say(s.voice[0], s.voice[1]);
      m.querySelectorAll('.sp-stop.sel').forEach(b => b.classList.remove('sel')); if (btn) btn.classList.add('sel');
      return;
    }
    busy = true; sel = null; SFX.tap(); say(s.voice[0], s.voice[1]); remember(s);
    if (btn) { btn.classList.add('tapped'); const pc = btn.querySelector('.sp-pic'); for (let i = 0; i < 6; i++) { const sp = el('i', 'sp-spark'); sp.style.setProperty('--a', i * 60 + 'deg'); pc.appendChild(sp); } }
    const wait = reduceMotion() ? 200 : 450, i = 0, h = hero();
    setTimeout(() => {
      // games and stories open straight over this screen (it stays behind them); a place flies there in the valley
      if (s.kind === 'game') { launched = Date.now(); opened = false; starsBefore = totalStars(); G.playGame(i, s.key, 'simple'); }
      else if (s.kind === 'tale') { const t = (G.TALES || []).find(x => x.id === s.key); if (!t) { busy = false; return; } launched = Date.now(); opened = false; starsBefore = totalStars(); G.readTaleNow(h, t); }
      else { const pl = G.PLACES[+s.key]; back = false; leave(); setTimeout(() => G.travelTo(h, pl.x, pl.z), 50); }
    }, wait);
  }
  // 🔎 Discover: every area as a big picture; big kids can also type a name
  function discover(open) {
    finding = open; const f = m.querySelector('.sp-find'); f.hidden = !open; if (!open) return;
    const lt = little(), groups = TABS.map(t => ({ t, views: viewsOf(t.key) }));
    const cards = groups.map(({ t }) => `<h3>${pic(t.icon)} ${esc(t.label())}</h3><div class="sp-cards">${groupsOf(t.key).map(({ area }) => `<button class="sp-card" data-t="${t.key}" data-a="${esc(area.key)}" aria-label="${esc(area.name())}">${pic(area.icon)}<b>${esc(area.name())}</b></button>`).join('')}</div>`).join('');
    f.innerHTML = `<div class="sp-find-top">${lt ? '' : `<input class="sp-q" type="search" placeholder="${T('Find a game, story or place…', 'Tìm trò chơi, truyện, nơi chốn…')}" aria-label="${T('Search', 'Tìm kiếm')}">`}<button class="sp-find-x" aria-label="${T('Close', 'Đóng')}">✕</button></div><div class="sp-found">${cards}</div>`;
    f.querySelector('.sp-find-x').onclick = () => { SFX.tap(); discover(false); };
    const bind = () => f.querySelectorAll('.sp-card').forEach(b => b.onclick = () => {
      SFX.tap();
      if (b.dataset.s) { const s = found[+b.dataset.s]; discover(false); tab = s.tab; group[tab] = s.area; at[tab] = 0; sel = null; const vs = viewsOf(tab); at[tab] = Math.max(0, vs.findIndex(v => v.items.some(x => idOf(x) === idOf(s.stop)))); draw(); const btn = [...m.querySelectorAll('.sp-stop')].find(x => list[+x.dataset.k] && idOf(list[+x.dataset.k]) === idOf(s.stop)); if (btn) go(list[+btn.dataset.k], btn); return; }
      tab = b.dataset.t; group[tab] = b.dataset.a; at[tab] = 0; sel = null; discover(false); draw(); const v = viewsOf(tab)[0]; say(...both(v.area.name));
      const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0;
    });
    let found = []; bind();
    const q = f.querySelector('.sp-q');
    if (q) q.oninput = () => {
      const w = plain(q.value.trim()); if (!w) { f.querySelector('.sp-found').innerHTML = cards; bind(); return; }
      found = groups.flatMap(({ t }) => groupsOf(t.key).flatMap(({ area, items }) => items.map(stop => ({ tab: t.key, area: area.key, stop })))).filter(x => plain(x.stop.voice[0] + ' ' + x.stop.voice[1]).includes(w)).slice(0, 24);
      f.querySelector('.sp-found').innerHTML = found.length ? `<div class="sp-cards">${found.map((x, k) => `<button class="sp-card" data-s="${k}">${pic(x.stop.icon)}<b>${esc(x.stop.name)}</b></button>`).join('')}</div>` : `<p class="sp-none">${pic('🤔')} ${T('Nothing with that name yet.', 'Chưa có tên nào như vậy.')}</p>`;
      bind();
    };
  }
  function show(t) {
    if (!solo() || !hero()) return;
    if (t) tab = t;
    if (!m) {
      m = el('div', 'simple-screen');
      const p = hero().profile;
      m.innerHTML = `<div class="sp-scene">${SCENE}</div><div class="sp-top"><span class="sp-me">${p.photo ? `<img src="${p.photo}" alt="">` : pic('🙂')}<b>${esc(p.name)}</b></span>
        <button class="sp-area"></button>
        <button class="sp-again" aria-label="${T('Say it again', 'Nói lại')}">${pic('🔊')}</button>
        <button class="grown sp-grown"><span class="ring"></span>${pic('⚙️')}<small>${T('Grown-ups: press and hold', 'Người lớn: nhấn giữ')}</small></button></div>
        <div class="sp-scroll"><div class="sp-path"></div></div>
        <nav class="sp-tabs">${TABS.map(x => `<button data-tab="${x.key}"><span>${pic(x.icon)}</span><small>${esc(x.label())}</small></button>`).join('')}
          <button class="sp-discover"><span>${pic('🔎')}</span><small>${T('Discover', 'Khám phá')}</small></button>
          <button class="sp-valley"><span>${pic('🌳')}</span><small>${T('Valley', 'Thung lũng')}</small></button></nav>
        <div class="sp-find" hidden></div>`;
      document.body.appendChild(m);
      m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (busy) return; SFX.tap(); discover(false); tab = b.dataset.tab; group[tab] = null; at[tab] = 0; sel = null; draw(); const sc = m.querySelector('.sp-scroll'); sc.scrollTop = 0; sc.scrollLeft = 0; const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); });
      m.querySelector('.sp-again').onclick = () => { const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); };
      m.querySelector('.sp-discover').onclick = () => { if (busy) return; SFX.tap(); discover(!finding); if (finding) say('Where shall we go?', 'Mình đi đâu nào?'); };
      // the chip: in a group, back to all the groups; otherwise Discover
      m.querySelector('.sp-area').onclick = () => { if (busy) return; SFX.tap(); if (group[tab]) { group[tab] = null; at[tab] = 0; sel = null; draw(); const x = tabOf(tab); say(x.say[0], x.say[1]); } else { discover(!finding); if (finding) say('Where shall we go?', 'Mình đi đâu nào?'); } };
      m.querySelector('.sp-valley').onclick = () => { if (busy) return; SFX.tap(); choose('valley'); leave(); say('Off you go! Explore the valley.', 'Đi nào! Khám phá thung lũng thôi.'); };
      holdButton(m.querySelector('.sp-grown'), () => openGrownups(() => draw()));
      addEventListener('resize', draw);
      if (wideQ && wideQ.addEventListener) wideQ.addEventListener('change', draw);
      // the landscape stands still while the page is hidden (another app, a locked phone)
      document.addEventListener('visibilitychange', () => m.classList.toggle('still', document.hidden || reduceMotion()));
    }
    busy = false; sel = null; discover(false);
    m.hidden = false; G.paused = true; document.body.classList.add('simple-on'); m.classList.toggle('still', reduceMotion());
    choose('simple'); draw();
    // a new star since the path was last open: Ông Cú cheers
    const who = hero().profile.name, now = totalStars(), owl = m.querySelector('.sp-owl');
    if (lastStars[who] != null && now > lastStars[who] && owl) { owl.classList.add('cheer'); say('Well done! You won a new star!', 'Giỏi lắm! Con được thêm một ngôi sao!'); }
    else { const x = TABS.find(y => y.key === tab); say(x.say[0], x.say[1]); }
    lastStars[who] = now;
  }
  function hide() { if (m) m.hidden = true; document.body.classList.remove('simple-on'); G.paused = false; }
  function leave() { back = false; hide(); }
  function choose(screen) { const p = hero() && hero().profile; if (p && p.screen !== screen) { p.screen = screen; saveProfiles(); } }
  // back to the path when the game or story started here is over (and nothing else is open)
  setInterval(() => {
    // a game or story started from this screen: it opens over it; when it has closed again, the path is ready (stars
    // brought up to date, Ông Cú cheers a new one); if it never opened (a question came first), the screen is free again
    if (launched && m && !m.hidden) {
      const up = gameOpen() || !!document.querySelector('.theatre, .gl');
      if (up) opened = true;
      else if (opened && !document.querySelector('.reward, .dialog')) { launched = 0; busy = false; draw(); if (totalStars() > starsBefore) { const owl = m.querySelector('.sp-owl'); if (owl) owl.classList.add('cheer'); say('Well done! You won a new star!', 'Giỏi lắm! Con được thêm một ngôi sao!'); } lastStars[hero().profile.name] = totalStars(); }
      else if (!opened && Date.now() - launched > 6000) { launched = 0; busy = false; }
    }
    if (m && !m.hidden && !gameOpen()) G.paused = true; // the valley stays still behind it, also after a talk box closes
    if (!back || !m || !m.hidden || G.paused || gameOpen() || document.querySelector('.modal, .dialog, .storybook, .theatre, .reward')) return;
    back = false; show();
  }, 700);
  return {
    show, hide: leave, get open() { return !!m && !m.hidden; }, get tab() { return tab; },
    // what the path shows now (for the checks): the area, which page of it, and the stops
    get view() { const v = m && viewsOf(tab)[at[tab]]; return v ? { groups: !!v.groups, area: v.area.key, page: v.i, of: v.of, pages: viewsOf(tab).length, stops: list.filter(s => s.kind !== 'sign').map(s => s.key) } : null; },
    // open a group (tests, and anything that wants to take a child straight to one)
    openGroup(t, key) { tab = t; group[t] = key; at[t] = 0; sel = null; draw(); },
    // at the start of a session: the Simple screen for a child who wants it
    start() { if (solo() && wantsSimple(hero().profile)) { const wait = setInterval(() => { if (document.querySelector('.storybook')) return; clearInterval(wait); if (solo() && wantsSimple(hero().profile)) show(); }, 400); } else if (m) leave(); }
  };
}

// "📺 How to play": a short narrated film for every game. Each film is a few animated picture cards (games with a
// guide film in js/content/films.js are acted in 3D by village children instead)
// with a voice telling the story of the game and how to play it. Folk games also tell where the game
// comes from and how to play it for real with friends.
// If a grown-up drops a real video into videos/<game id>.mp4, that video is played instead.
import { T } from './i18n.js';
import { sayAsync, hush } from './voice.js';
import { Music, SFX } from './audio.js';
import { GAMES } from './games/registry.js';
import { el, esc, wait } from './util.js';
import { CAST, SCENES } from './cartoon.js';
import { pic, hasArt } from './art.js';
import { stageOf } from './tales.js';
import { featureOn } from './custom.js';

import { HOWTO, originLabel } from './howto.js';
const S = (pic, en, vi) => ({ pic, en, vi });
const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = s => seg ? [...seg.segment(s)].map(x => x.segment).filter(x => x.trim()) : Array.from(s).filter(x => x.trim());
const videoOK = {};
async function hasVideo(id) {
  if (id in videoOK) return videoOK[id];
  try { const r = await fetch(`videos/${id}.mp4`, { method: 'HEAD' }); videoOK[id] = r.ok && /video/.test(r.headers.get('content-type') || 'video'); }
  catch (e) { videoOK[id] = false; }
  return videoOK[id];
}

// ---------- the real game playing by itself (Kid UI films, 10 Oct) ----------
// A guide in js/content/films.js can have demo: { play(D), turn(D) }. The game's own code runs on the guide's screen
// (a quiet copy: no stars, coins or saving), and D moves a glowing hand that really taps and drags on it:
//   D.find(sel) / D.all(sel)     the game's things        D.tap(el)               the hand taps it
//   D.down(canvas, [x, y]), D.move(canvas, [x, y], ms), D.up(canvas)   a real drag, in the canvas's own units
//   D.say(en, vi, also)          a spoken line (with something done at the same time)
//   D.point(el) / D.ghost(canvas, from, to)   on the child's turn: the hand only shows where to tap or drag
//   D.until(test, ms)            waits for the child (D.taps counts their taps); false after ms
const STOP = new Error('stop');
function demoKit(box, cap, alive, paused) {
  const stage = box.querySelector('.gl-stage'), help = box.querySelector('.gl-help'), hand = box.querySelector('.ht-hand');
  let closed = false, mine = false, ghostT = 0; const cleanups = [];
  const check = () => { if (!alive()) throw STOP; };
  const sleep = async ms => { const end = performance.now() + ms; while (performance.now() < end || paused()) { check(); await wait(Math.min(120, Math.max(10, end - performance.now()))); } check(); };
  const local = (x, y) => { const r = box.getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const place = (x, y, glide = true) => { const [lx, ly] = local(x, y); hand.hidden = false; hand.classList.toggle('glide', glide); hand.style.left = lx + 'px'; hand.style.top = ly + 'px'; };
  const centre = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const onCanvas = (c, [x, y]) => { const r = c.getBoundingClientRect(), k = r.width / c._w; return [r.left + x * k, r.top + y * k]; };
  const press = () => { hand.classList.remove('press'); void hand.offsetWidth; hand.classList.add('press'); };
  const ptr = (c, type, [x, y]) => { mine = true; try { c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true })); } finally { mine = false; } };
  let at = [0, 0];
  const D = {
    hand, taps: 0, moves: 0, turn: false, stage,
    // the game's api, as js/games/frame.js gives it, but quiet: its words show without being spoken
    api: { stage, level: 1, players: [{ name: '' }], two: false, partnerName: null, T, el, online: null, little: true, strong: false,
      say: (en, vi) => { help.textContent = T(en, vi); }, show: (en, vi) => { help.textContent = T(en, vi); }, sfx: SFX, wait,
      onCleanup: f => cleanups.push(f), dots() { }, right() { SFX.ok(); }, wrong() { SFX.no && SFX.no(); }, praise() { SFX.chime && SFX.chime(); },
      get closed() { return closed; }, async win() { closed = true; } },
    async find(sel, ms = 4000) { for (let t = 0; t < ms; t += 100) { const e = stage.querySelector(sel); if (e) return e; await sleep(100); } throw new Error('demo: no ' + sel); },
    all: sel => [...stage.querySelectorAll(sel)],
    wait: sleep,
    async say(en, vi, also) { const a = Promise.resolve(also); a.catch(() => { }); check(); cap.textContent = T(en, vi); await Promise.all([sayAsync(en, vi), a]); check(); await sleep(250); },
    async tap(e) { place(...centre(e)); await sleep(900); press(); await sleep(200); mine = true; try { e.click(); } finally { mine = false; } D.moves++; await sleep(450); },
    // a drag on a canvas game (the real pointer events, so the game moves exactly as it would for a finger)
    async down(c, p) { if (!c._cap) { c._cap = true; c.setPointerCapture = () => { }; } at = onCanvas(c, p); place(...at); await sleep(900); press(); ptr(c, 'pointerdown', at); await sleep(250); },
    async move(c, p, ms = 1000) { const from = at, to = onCanvas(c, p), t0 = performance.now(); hand.classList.remove('glide'); for (;;) { const k = Math.min(1, (performance.now() - t0) / ms); at = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]; place(...at, false); ptr(c, 'pointermove', at); if (k >= 1) break; await sleep(30); } },
    async up(c) { ptr(c, 'pointerup', at); D.moves++; hand.classList.add('lift'); await sleep(300); hand.classList.remove('lift'); },
    // the child's turn: show, don't do
    point(e) { place(...centre(e)); hand.classList.add('hint'); },
    ghost(c, from, to) { const a = onCanvas(c, from), b = onCanvas(c, to); hand.classList.add('hint'); let k = 0; clearInterval(ghostT); ghostT = setInterval(() => { if (!alive() || D.taps) { clearInterval(ghostT); hand.hidden = true; return; } k = (k + .025) % 1.4; const q = Math.min(1, k); place(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, false); }, 30); },
    async until(test, ms) { const end = performance.now() + ms; while (!test()) { if (performance.now() > end) return false; await sleep(150); } return true; },
    end() { closed = true; clearInterval(ghostT); cleanups.forEach(f => { try { f(); } catch (e) { } }); }
  };
  // the child's own taps (the hand's taps are not counted); the hand goes away once they have a go
  const mineTap = () => { if (!mine && D.turn) { D.taps++; hand.classList.remove('hint'); hand.hidden = true; } };
  box.addEventListener('pointerup', mineTap, true);
  return D;
}

// Opens the film. onPlay (optional) is called if the child taps "Play now" at the end.
export function openHowTo(id, { onPlay, onClose } = {}) {
  const g = GAMES[id], h = HOWTO[id] || { steps: [S(g ? g.icon : '🎮', 'Tap and try! There is no wrong way to play.', 'Cứ chạm và thử! Không có cách chơi nào sai cả.')] };
  const cards = [S(g ? g.icon : '🎮', g ? g.name() : '', g ? g.name() : '')]; cards[0].title = true;
  if (h.origin) cards.push(h.origin);
  cards.push(...h.steps);
  if (h.real) cards.push(h.real);
  cards.push(Object.assign(S('⭐ 🎉', 'Now it is your turn. Have fun!', 'Giờ đến lượt con. Chơi vui nhé!'), { end: true }));
  const prevMusic = Music.key; Music.play('none');
  // (owner, 16 Oct AEDT: "the text in How to play should be the same position as the film") like a story film: the title
  // in a bar above the picture, the words in a box under it, nothing written over the picture
  const m = el('div', 'howto', `<div class="ht-film"><div class="ht-top"><b class="ht-title">${esc(T('How to play', 'Cách chơi'))}${g ? ': ' + esc(g.name()) : ''}</b></div><div class="ht-screen"></div><div class="ht-cap"></div><div class="ht-bar"><i></i></div></div>
    <div class="ht-ctl"><button class="ht-b ht-prev" aria-label="${T('Back', 'Lùi')}">⏮</button><button class="ht-b ht-pp" aria-label="${T('Pause', 'Tạm dừng')}">⏸</button><button class="ht-b ht-next" aria-label="${T('Next', 'Tiếp')}">⏭</button>
    ${onPlay ? `<button class="ht-play">▶ ${T('Play now', 'Chơi ngay')}</button>` : ''}</div><button class="ht-x" aria-label="${T('Close', 'Đóng')}">✕</button>`);
  document.body.appendChild(m);
  const screen = m.querySelector('.ht-screen'), cap = m.querySelector('.ht-cap'), bar = m.querySelector('.ht-bar i'), pp = m.querySelector('.ht-pp');
  let k = 0, paused = false, closed = false, token = 0;
  // (round R) games with a guide film: every card is acted in 3D by village children (js/film.js)
  // (loaded only when a guide opens, so starting the game stays small)
  let film = null, demo = null, endDemo = null;
  const ready = featureOn('storyFilms', true) ? import('./content/films.js').then(async C => {
    if (!C.GUIDES[id] || closed) return; const F = await import('./film.js'); film = F.createFilm(screen, C.GUIDES[id]); if (film) m.classList.add('film');
    // (Kid UI films, 10 Oct) the real game plays its first moves by itself, after the steps
    if (film && C.GUIDES[id].demo && GAMES[id]) { demo = C.GUIDES[id].demo; const at = cards.findIndex(c => c === h.real || c.end); cards.splice(at, 0, Object.assign(S('👆', 'Watch the game play by itself.', 'Xem trò chơi tự chơi nhé.'), { demo: true })); }
  }).catch(e => console.warn('film', e)) : Promise.resolve();
  const close = () => { if (closed) return; closed = true; token++; hush(); if (endDemo) endDemo(); if (film) film.close(); m.remove(); Music.play(prevMusic || 'field'); onClose && onClose(); };
  const show = async () => {
    const my = ++token; if (endDemo) endDemo(); await ready; if (my !== token || closed) return;
    const c = cards[k];
    bar.style.width = ((k + 1) / cards.length * 100) + '%';
    const pics = [...String(c.pic).matchAll(/\S+/g)].map(x => x[0]);
    // every card is a little cartoon scene: a painted backdrop that fits the words, a child who tells you how to
    // play (talking while the line is read), and the game's things drawn in the valley's own style
    const st = c.title ? 'palace' : c.end ? 'meadow' : stageOf(c.en), host = ['🧒', '👧', '👦'][k % 3];
    const art = p => hasArt(p) ? pic(p) : graphemes(p).map(q => hasArt(q) ? pic(q) : `<span class="emo">${q}</span>`).join('');
    const scene = SCENES[st] ? `<svg class="sc ht-sc" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${SCENES[st]()}</svg>` : '';
    screen.className = 'ht-screen' + (c.title ? ' title' : '') + (c.end ? ' end' : '');
    if (film) return c.demo ? showDemo(my) : showFilm(my, c);
    screen.innerHTML = scene + (c.title ? `<div class="ht-titlecard"><span class="ht-big">${art(c.pic)}</span><b class="ht-name">${esc(T(c.en, c.vi))}</b>${originLabel(id) ? `<small>${esc(originLabel(id))}</small>` : ''}</div>`
      : `<span class="ht-host th-c in-l${k > 1 ? ' still' : ''}" style="--d:0s">${CAST[host]()}</span><div class="ht-props">${pics.map((p, i) => `<span class="ht-pic${p === '👆' || p === '👇' ? ' finger' : ''}" style="--d:${.3 + i * .35}s">${art(p)}</span>`).join('')}</div>`);
    setTimeout(() => { const hs = screen.querySelector('.ht-host'); if (hs) hs.classList.remove('walking'); }, 1500);
    cap.textContent = c.title ? T('How to play ', 'Cách chơi ') + T(c.en, c.vi) : T(c.en, c.vi);
    SFX.pop && SFX.pop(k);
    const t0 = performance.now();
    screen.classList.add('speaking');
    await sayAsync(c.title ? T('How to play ', 'Cách chơi ') + T(c.en, c.vi) : c.en, c.title ? T('How to play ', 'Cách chơi ') + c.vi : c.vi);
    screen.classList.remove('speaking');
    const left = 2600 - (performance.now() - t0); if (left > 0) await wait(left);
    await wait(700);
    while (paused && my === token && !closed) await wait(200);
    if (my !== token || closed) return;
    if (k < cards.length - 1) { k++; show(); }
  };
  const showFilm = async (my, c) => {
    screen.querySelectorAll('.ht-titlecard').forEach(x => x.remove());
    cap.textContent = c.title ? T('How to play ', 'Cách chơi ') + T(c.en, c.vi) + (originLabel(id) ? ' · ' + originLabel(id) : '') : T(c.en, c.vi);
    SFX.pop && SFX.pop(k);
    const played = film.page(cards.slice(0, k).filter(x => !x.demo).length); // (the real game's turn has no film page)
    await sayAsync(c.title ? T('How to play ', 'Cách chơi ') + T(c.en, c.vi) : c.en, c.title ? T('How to play ', 'Cách chơi ') + c.vi : c.vi);
    if (my !== token || closed) return;
    film.narrated(); await played; await wait(500);
    while (paused && my === token && !closed) await wait(200);
    if (my !== token || closed) return;
    if (k < cards.length - 1) { k++; show(); }
  };
  // the real game on the guide's screen: it plays its first moves with the glowing hand, then the child has a go
  const showDemo = async my => {
    screen.querySelectorAll('.ht-titlecard').forEach(x => x.remove());
    film.pause(); screen.classList.add('demo'); SFX.pop && SFX.pop(k);
    const box = el('div', 'ht-demo', `<div class="gl-help"></div><div class="gl-stage"></div><div class="ht-hand" hidden>${pic('👆')}</div>`); screen.appendChild(box);
    const D = demoKit(box, cap, () => my === token && !closed, () => paused);
    endDemo = () => { endDemo = null; D.end(); box.remove(); screen.classList.remove('demo'); };
    m.__demo = D; // (the checks look at it)
    Promise.resolve().then(() => GAMES[id].run(D.api)).catch(e => console.warn('demo', id, e));
    try {
      await demo.play(D); D.hand.hidden = true;
      await D.say('Your turn!', 'Tới lượt con!'); D.turn = true;
      await demo.turn(D); D.hand.hidden = true;
      await D.say('Now you know how to play!', 'Giờ con biết chơi rồi!');
    } catch (e) { if (e !== STOP) console.warn('demo', id, e); return; }
    if (my !== token || closed) return;
    if (k < cards.length - 1) { k++; show(); }
  };
  m.querySelector('.ht-x').onclick = close;
  m.querySelector('.ht-prev').onclick = () => { k = Math.max(0, k - 1); paused = false; pp.textContent = '⏸'; hush(); show(); };
  m.querySelector('.ht-next').onclick = () => { k = Math.min(cards.length - 1, k + 1); paused = false; pp.textContent = '⏸'; hush(); show(); };
  pp.onclick = () => { paused = !paused; pp.textContent = paused ? '▶' : '⏸'; if (paused) hush(); };
  const pb = m.querySelector('.ht-play'); if (pb) pb.onclick = () => { close(); onPlay(); };
  // a real video, if one has been added for this game
  hasVideo(id).then(ok => {
    if (!ok || closed) return show();
    token++; m.classList.add('video'); if (film) { film.close(); m.classList.remove('film'); }
    const v = el('video', 'ht-video'); v.src = `videos/${id}.mp4`; v.controls = true; v.playsInline = true; v.autoplay = true;
    screen.replaceWith(v); cap.textContent = ''; m.querySelector('.ht-ctl').querySelectorAll('.ht-b').forEach(b => b.hidden = true);
    v.onerror = () => { v.replaceWith(screen); m.classList.remove('video'); m.querySelectorAll('.ht-b').forEach(b => b.hidden = false); show(); };
  });
  return close;
}

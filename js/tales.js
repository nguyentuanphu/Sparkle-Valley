// The tale theatre: a fairy tale read aloud page by page (in the language chosen in settings), over a
// living picture. Each page's pictures become little actors on a painted stage: birds fly, frogs hop,
// fish swim, rain falls, trees sway, the moon glows. The stage (sky, sea, forest, palace, night…) is
// picked from the words on the page. Tap ◀ ▶ to turn pages, 🔊 to hear it again, ⏯ to read by itself.
import { T } from './i18n.js';
import { sayAsync, hush } from './voice.js';
import { SFX, Music } from './audio.js';
import { el, esc, wait } from './util.js';
import { CAST, SCENES } from './cartoon.js';
import { pic, hasArt } from './art.js';

const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = s => seg ? [...seg.segment(s)].map(x => x.segment).filter(x => x.trim()) : Array.from(s).filter(x => x.trim() && !/[‍️]/.test(x));

// how each picture moves
const MOVES = [
  [/🐦|🕊|🦅|🐝|🦋|🪁|☁|🦚|🐦‍⬛|🧚|🦉|🐉|✨|⭐|🌟/u, 'fly'],
  [/🐟|🐠|🐊|🐢|🐍|🦈|🐬|🚣|⛵|🛶/u, 'swim'],
  [/🐸|🐇|🦘|🐒|🐭|🐿|🐐|🐓/u, 'hop'],
  [/🌧|💧|💦/u, 'drip'], [/🌊/u, 'wave'], [/☀|🌕|🌙|🌞|🌈|💡|👑/u, 'glow'],
  [/🔥|🧨|🎉|🧧|🏮/u, 'flick'], [/🌳|🎋|🌾|🌱|🌿|🌸|🍃|🌵/u, 'sway'],
  [/❤|💖|💚|💞|💕/u, 'beat'], [/🏃|💨|🐴|🦤|🏁/u, 'run'], [/🥚|🎁|🍉|🥭|🍈|🍏|🎃|🥥/u, 'wobble'],
  [/👦|👧|👩|👨|🧑|👵|👴|👶|👸|🤴|🧙|🐘|🐂|🦁|🐯|🐱|🐺|🐼|🐨|🧒/u, 'talk']
];
const moveOf = e => (MOVES.find(([re]) => re.test(e)) || [0, 'float'])[1];
// which painted stage suits the words of this page
const STAGES = [
  [/night|moon|star|dark|milky|lantern|howl/i, 'night'], [/sea|river|lake|water|flood|island|swim|boat|well|rain/i, 'sea'],
  [/mountain|hill|sky|cloud|fly|flew|heaven|clouds/i, 'sky'], [/forest|bush|tree|bamboo|jungle|wood/i, 'forest'],
  [/king|palace|prince|princess|emperor|queen|festival/i, 'palace'], [/rice|field|farm|garden|village|plant|seed/i, 'field'],
  [/desert|hot|dry|thirsty/i, 'desert']
];
export const stageOf = en => (STAGES.find(([re]) => re.test(en)) || [0, 'meadow'])[1];

// sync (round H, reading together online): { send(page), listen(fn) } — a page turned here turns for every friend reading
export function openTheatre(tale, { name = '', onDone, startPage = 0, sync = null } = {}) {
  let fromFriend = false;
  return new Promise(resolve => {
    let k = startPage, auto = true, alive = true, token = 0;
    const prev = Music.key; Music.play('none');
    const m = el('div', 'theatre', `
      <div class="th-top"><span class="th-flag">${tale.flag}</span><b class="th-title">${esc(tale.title())}</b><button class="th-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <div class="th-stage"><div class="th-bg"></div><div class="th-actors"></div><div class="th-fx"></div></div>
      <div class="th-text"></div>
      <div class="th-bar"><button class="th-prev" aria-label="${T('Back', 'Trang trước')}">◀</button><button class="th-hear" aria-label="${T('Hear it again', 'Nghe lại')}">${pic('🔊')}</button><button class="th-auto on" aria-label="${T('Read by itself', 'Tự đọc')}">⏯</button><div class="th-dots"></div><button class="th-next" aria-label="${T('Next', 'Trang sau')}">▶</button></div>`);
    document.body.appendChild(m);
    const stage = m.querySelector('.th-stage'), bg = m.querySelector('.th-bg'), actors = m.querySelector('.th-actors'), fx = m.querySelector('.th-fx'), text = m.querySelector('.th-text'), dots = m.querySelector('.th-dots');
    const draw = async () => {
      const my = ++token, [pics, en, vi] = tale.pages[k], st = stageOf(en);
      stage.className = 'th-stage st-' + st; bg.innerHTML = SCENES[st] ? `<svg class="sc" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${SCENES[st]()}</svg>` : STAGE_ART[st] || '';
      // actors: spread across the stage, each entering from its side, then moving its own way
      // on a narrow (phone) stage fewer, smaller actors, spread over the whole width, so nobody overlaps
      const narrow = stage.clientWidth < 560, list = graphemes(pics).slice(0, narrow ? 4 : 7);
      actors.innerHTML = list.map((e, i) => {
        const n = list.length, x = n === 1 ? 50 : (narrow ? 12 : 14) + i * ((narrow ? 76 : 72) / (n - 1)), y = 38 + ((i * 37) % 3) * 9 - (moveOf(e) === 'fly' ? 24 : 0);
        const size = n <= 2 ? 22 : n <= 4 ? 17 : 13;
        // people are drawn cartoon characters who walk in; animals and things are the game's drawn pictures
        const base = e.replace(/\u200d.*$|[\u{1F3FB}-\u{1F3FF}\uFE0F]/gu, ''), fairy = base === '🧚';
        if (CAST[base]) { const gy = fairy ? 42 : 80 + (i % 2) * 7, sc = (fairy ? .8 : .9 + (gy - 80) / 50) * (narrow ? (n >= 3 ? .62 : .8) : 1); return `<span class="th-a th-c${fairy ? ' flying' : ' walking'} in-${i % 2 ? 'r' : 'l'}" style="left:${x}%;top:${gy}%;--sc:${sc.toFixed(2)};--d:${(i * .25).toFixed(2)}s;z-index:${gy}">${CAST[base]()}</span>`; }
        return `<span class="th-a mv-${moveOf(e)} in-${i % 2 ? 'r' : 'l'}" style="left:${x}%;top:${y}%;font-size:min(${size}vw, ${size * 1.25}vh);--d:${(i * .18).toFixed(2)}s">${hasArt(e) ? pic(e) : e}</span>`;
      }).join('');
      // weather and sparkles that fit the page
      fx.innerHTML = '';
      if (/🌧|rain|mưa/i.test(pics + en)) for (let i = 0; i < 26; i++) fx.appendChild(el('i', 'th-rain', '')).style.cssText = `left:${(i * 37) % 100}%;animation-delay:${(i % 9) * .13}s`;
      if (st === 'night') for (let i = 0; i < 18; i++) fx.appendChild(el('i', 'th-star', '✦')).style.cssText = `left:${(i * 53) % 100}%;top:${(i * 29) % 45}%;animation-delay:${(i % 5) * .4}s`;
      if (/✨|magic|thần|fairy|Bụt/i.test(pics + en)) for (let i = 0; i < 10; i++) fx.appendChild(el('i', 'th-spark', pic('✨'))).style.cssText = `left:${10 + (i * 41) % 80}%;top:${10 + (i * 23) % 60}%;animation-delay:${(i % 6) * .3}s`;
      text.innerHTML = `<p>${esc(T(en, vi).replace(/\{name\}/g, name))}</p>`;
      dots.innerHTML = tale.pages.map((_, i) => `<i class="${i === k ? 'on' : i < k ? 'done' : ''}"></i>`).join('');
      if (sync && !fromFriend) sync.send(k);
      m.querySelector('.th-prev').disabled = k === 0;
      m.querySelector('.th-next').innerHTML = k === tale.pages.length - 1 ? pic('🏁') : '▶';
      SFX.page ? SFX.page() : SFX.tap();
      await wait(450); if (!alive || my !== token) return;
      // characters stop walking once they are in place, and talk while the page is read
      setTimeout(() => actors.querySelectorAll('.th-c').forEach(a => a.classList.remove('walking')), 1900);
      const t0 = performance.now(); stage.classList.add('speaking'); await sayAsync(en, vi); stage.classList.remove('speaking');
      // with the voice off (or very fast), leave time to look at the picture and read the words
      const need = Math.min(9000, 1500 + T(en, vi).length * 55) - (performance.now() - t0); if (need > 0) await wait(need);
      if (!alive || my !== token || !auto) return;
      await wait(1100); if (!alive || my !== token || !auto) return;
      next();
    };
    const finish = done => { if (!alive) return; alive = false; hush(); m.classList.add('out'); setTimeout(() => m.remove(), 300); Music.play(prev || 'field'); resolve(done); onDone && onDone(done); };
    const next = () => { if (k < tale.pages.length - 1) { k++; draw(); } else { SFX.chime && SFX.chime(); finish(true); } };
    // a friend turned the page
    if (sync) sync.listen(p => { if (!alive || p === k || p < 0 || p >= tale.pages.length) return; fromFriend = true; k = p; draw(); fromFriend = false; });
    m.querySelector('.th-next').onclick = () => { SFX.tap(); next(); };
    m.querySelector('.th-prev').onclick = () => { if (k > 0) { SFX.tap(); k--; draw(); } };
    m.querySelector('.th-hear').onclick = () => { const [, en, vi] = tale.pages[k]; token++; sayAsync(en, vi); };
    m.querySelector('.th-auto').onclick = e => { auto = !auto; e.currentTarget.classList.toggle('on', auto); if (auto) draw(); };
    m.querySelector('.th-x').onclick = () => finish(false);
    // swipe left / right to turn the page
    let sx = null; stage.addEventListener('pointerdown', e => { sx = e.clientX; }); stage.addEventListener('pointerup', e => { if (sx == null) return; const d = e.clientX - sx; sx = null; if (d < -50) next(); else if (d > 50 && k > 0) { k--; draw(); } });
    const onKey = e => { if (!alive) return removeEventListener('keydown', onKey, true); if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); next(); } else if (e.code === 'ArrowLeft' && k > 0) { e.preventDefault(); e.stopImmediatePropagation(); k--; draw(); } else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(false); } };
    addEventListener('keydown', onKey, true);
    draw();
  });
}

// painted stage backdrops (simple shapes, coloured by CSS)
const STAGE_ART = {
  sea: '<i class="sun"></i><i class="hill h1"></i><i class="waves w1"></i><i class="waves w2"></i>',
  night: '<i class="moon"></i><i class="hill h1"></i><i class="hill h2"></i>',
  sky: '<i class="sun"></i><i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i><i class="mount m1"></i><i class="mount m2"></i>',
  forest: '<i class="sun"></i><i class="tree t1"></i><i class="tree t2"></i><i class="tree t3"></i><i class="tree t4"></i><i class="ground"></i>',
  palace: '<i class="sun"></i><i class="palace"></i><i class="ground"></i><i class="cloud c1"></i>',
  field: '<i class="sun"></i><i class="cloud c2"></i><i class="paddy"></i><i class="ground"></i>',
  desert: '<i class="sun big"></i><i class="dune d1"></i><i class="dune d2"></i>',
  meadow: '<i class="sun"></i><i class="cloud c1"></i><i class="cloud c3"></i><i class="hill h1"></i><i class="hill h2"></i>'
};

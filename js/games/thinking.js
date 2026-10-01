// Shrine puzzles that build early thinking skills: patterns, counting, letters, numbers,
// shapes, colours, ordering by size and memory.
import { register, untilRight, choiceButtons, tapOne } from './frame.js';
import { T, ALPHABET, VI_LETTER_NAMES, LETTER_WORDS, numWord, COLORS, colorName } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { shuffle, pick, el, wait } from '../util.js';

const FRUIT = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍉', '🍐'];
const ANIMALS = ['🐶', '🐱', '🐰', '🐸', '🐥', '🐷', '🐼', '🦊'];
const others = (pool, not, n) => shuffle(pool.filter(x => !not.includes(x))).slice(0, n);

// ---------- What comes next? ----------
register({
  id: 'pattern', icon: '🔁', name: () => T('What Comes Next?', 'Tiếp Theo Là Gì?'),
  async run(api) {
    const rounds = 4;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const pool = shuffle(r % 2 ? ANIMALS : FRUIT);
      const shapes = api.level <= 1 ? ['AB'] : api.level === 2 ? ['AB', 'AAB', 'ABC'] : ['AAB', 'ABB', 'ABC', 'AABB', 'ABCB'];
      const pat = pick(shapes), map = { A: pool[0], B: pool[1], C: pool[2] };
      const seq = []; while (seq.length < Math.max(5, pat.length * 2 + 1)) seq.push(map[pat[seq.length % pat.length]]);
      const answer = seq.pop();
      const row = el('div', 'seq');
      seq.forEach((s, i) => { const c = el('div', 'seq-item', s); c.style.animationDelay = i * .08 + 's'; row.appendChild(c); });
      const q = el('div', 'seq-item q', '?'); row.appendChild(q); api.stage.appendChild(row);
      api.say('What comes next?', 'Tiếp theo là gì nhỉ?');
      const opts = shuffle([answer, ...others(Object.values(map).concat(pool.slice(3)), [answer], 2)]);
      const btns = choiceButtons(api, opts, o => o);
      const b = await untilRight(api, btns, e => e._v === answer); if (!b) return;
      q.textContent = answer; q.classList.add('right'); api.praise(); await wait(1200);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Counting ----------
register({
  id: 'counting', icon: '🔢', name: () => T('Count With Me', 'Cùng Đếm Nào'),
  async run(api) {
    const rounds = 4, max = [5, 5, 10, 15, 20][Math.min(4, api.level - 1)];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = 1 + Math.floor(Math.random() * max), thing = pick([...FRUIT, ...ANIMALS]);
      const box = el('div', 'count-box');
      for (let i = 0; i < n; i++) { const s = el('span', 'count-item', thing); s.style.animationDelay = i * .05 + 's'; box.appendChild(s); if (i % 5 === 4) box.appendChild(el('br')); }
      api.stage.appendChild(box);
      api.say('How many can you count?', 'Có bao nhiêu nhỉ? Đếm cùng nhé!');
      // Tapping an item counts it out loud.
      let counted = 0;
      box.querySelectorAll('.count-item').forEach(s => s.onclick = () => { if (s.classList.contains('done')) return; s.classList.add('done'); counted++; sayIn(settings.lang, numWord(counted)); api.sfx.pop(counted); });
      const opts = shuffle([n, ...shuffle([n - 2, n - 1, n + 1, n + 2].filter(v => v >= 1 && v <= max + 2)).slice(0, 2)]);
      const btns = choiceButtons(api, opts, o => `<b class="num">${o}</b>`);
      const b = await untilRight(api, btns, e => e._v === n); if (!b) return;
      api.say(`${n}! Great counting!`, `${numWord(n)}! Đếm giỏi quá!`); await wait(1500);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Letters (English A–Z or the 29 Vietnamese letters) ----------
function letterName(L) { return settings.lang === 'vi' ? VI_LETTER_NAMES[L] || L : L; }
register({
  id: 'letters', icon: '🔤', name: () => T('Letter Hunt', 'Tìm Chữ Cái'),
  async run(api) {
    const rounds = 4, alpha = ALPHABET[settings.lang] || ALPHABET.en, words = LETTER_WORDS[settings.lang] || LETTER_WORDS.en;
    const span = Math.min(alpha.length, [8, 12, 18, 29, 29][Math.min(4, api.level - 1)]);
    const pool = alpha.slice(0, span), lower = api.level >= 3;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const L = pick(pool), n = api.level <= 1 ? 3 : 4;
      const opts = shuffle([L, ...others(pool, [L], n - 1)]);
      const card = el('div', 'letter-card', lower ? `<b>${L}</b>` : `<span class="ear">👂</span>`); api.stage.appendChild(card);
      const ask = () => lower ? api.say(`Find the small letter that matches ${L}`, `Tìm chữ thường giống chữ ${letterName(L)}`) : api.say(`Find the letter ${L}`, `Tìm chữ ${letterName(L)}`);
      ask(); card.onclick = ask;
      const btns = choiceButtons(api, opts, o => `<b class="letter">${lower ? o.toLowerCase() : o}</b>`, 'choice balloon');
      btns.forEach((b, i) => b.style.setProperty('--bc', COLORS[i % COLORS.length].hex));
      const b = await untilRight(api, btns, e => e._v === L); if (!b) return;
      const w = words[L];
      card.innerHTML = `<b>${L}</b><span class="pic">${w ? w[0] : ''}</span><small>${w ? w[1] : ''}</small>`;
      if (w) api.say(`${L} is for ${w[1]}!`, `${letterName(L)}: ${w[1]}!`);
      await wait(2200);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Number train: fill the missing number ----------
register({
  id: 'numbers', icon: '🚂', name: () => T('Number Train', 'Đoàn Tàu Số'),
  async run(api) {
    const rounds = 4, max = [5, 10, 10, 20, 20][Math.min(4, api.level - 1)];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const len = 4, start = 1 + Math.floor(Math.random() * (max - len + 1)), back = api.level >= 4 && Math.random() < .4;
      const seq = Array.from({ length: len }, (_, i) => back ? start + len - 1 - i : start + i);
      const hole = api.level <= 1 ? len - 1 : 1 + Math.floor(Math.random() * (len - 1));
      const train = el('div', 'train', '<span class="engine">🚂</span>');
      seq.forEach((v, i) => train.appendChild(el('div', 'car' + (i === hole ? ' q' : ''), i === hole ? '?' : String(v))));
      api.stage.appendChild(train);
      api.say('Which number is missing?', 'Số nào còn thiếu nhỉ?');
      const ans = seq[hole];
      const opts = shuffle([ans, ...shuffle([ans - 2, ans - 1, ans + 1, ans + 2].filter(v => v >= 0 && !seq.includes(v))).slice(0, 2)]);
      const btns = choiceButtons(api, opts, o => `<b class="num">${o}</b>`);
      const b = await untilRight(api, btns, e => e._v === ans); if (!b) return;
      train.querySelector('.q').textContent = ans; train.querySelector('.q').classList.add('right');
      train.classList.add('go'); api.sfx.whoosh(); api.say(`${ans}! Choo choo!`, `${numWord(ans)}! Tu tu xình xịch!`); await wait(1600);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Shapes ----------
const SHAPES = {
  circle: ['circle', 'hình tròn', '<circle cx="50" cy="50" r="40"/>'],
  square: ['square', 'hình vuông', '<rect x="12" y="12" width="76" height="76" rx="4"/>'],
  triangle: ['triangle', 'hình tam giác', '<path d="M50 8 92 88H8z"/>'],
  star: ['star', 'ngôi sao', '<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z"/>'],
  heart: ['heart', 'trái tim', '<path d="M50 88S8 62 8 34c0-14 11-24 23-24 9 0 15 5 19 12 4-7 10-12 19-12 12 0 23 10 23 24 0 28-42 54-42 54z"/>'],
  rectangle: ['rectangle', 'hình chữ nhật', '<rect x="6" y="26" width="88" height="48" rx="4"/>'],
  diamond: ['diamond', 'hình thoi', '<path d="M50 6 90 50 50 94 10 50z"/>'],
  oval: ['oval', 'hình bầu dục', '<ellipse cx="50" cy="50" rx="44" ry="28"/>']
};
const svgShape = (k, fill) => `<svg viewBox="0 0 100 100" class="shape"><g fill="${fill}">${SHAPES[k][2]}</g></svg>`;
register({
  id: 'shapes', icon: '🔷', name: () => T('Shadow Shapes', 'Bóng Hình Ai Đây'),
  async run(api) {
    const rounds = 4, keys = Object.keys(SHAPES).slice(0, [4, 6, 8, 8, 8][Math.min(4, api.level - 1)]);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const k = pick(keys), name = SHAPES[k];
      const shadow = el('div', 'shadow-box', svgShape(k, '#1d2a3a')); api.stage.appendChild(shadow);
      api.say(`Which shape makes this shadow?`, `Hình nào tạo ra cái bóng này?`);
      const opts = shuffle([k, ...others(keys, [k], api.level <= 1 ? 2 : 3)]);
      const btns = choiceButtons(api, opts, o => svgShape(o, COLORS[keys.indexOf(o) % COLORS.length].hex));
      const b = await untilRight(api, btns, e => e._v === k); if (!b) return;
      shadow.innerHTML = svgShape(k, COLORS[keys.indexOf(k) % COLORS.length].hex);
      api.say(`A ${name[0]}!`, `${name[1][0].toUpperCase() + name[1].slice(1)}!`); await wait(1500);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Colours and mixing ----------
const MIX = [['red', 'yellow', 'orange'], ['blue', 'yellow', 'green'], ['red', 'blue', 'purple'], ['red', 'white', 'pink']];
const C = n => n === 'white' ? { hex: '#ffffff', en: 'white', vi: 'trắng' } : COLORS.find(c => c.en === n);
const blob = c => `<span class="paint" style="--pc:${c.hex}"></span>`;
register({
  id: 'colors', icon: '🎨', name: () => T('Rainbow Paints', 'Pha Màu Cầu Vồng'),
  async run(api) {
    const rounds = 4;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      if (api.level <= 1 || r < 2 && api.level === 2) {
        const target = pick(COLORS), opts = shuffle([target, ...others(COLORS, [target], 2)]);
        api.stage.appendChild(el('div', 'big-emoji', '🎈'));
        api.say(`Tap the ${target.en} balloon!`, `Chạm vào bóng bay màu ${target.vi}!`);
        const btns = choiceButtons(api, opts, o => `<span class="balloon-shape" style="--bc:${o.hex}"></span>`, 'choice plain');
        const b = await untilRight(api, btns, e => e._v === target); if (!b) return;
        api.say(`${target.en}!`, `Màu ${target.vi}!`);
      } else {
        const [a, b2, res] = pick(MIX), A = C(a), B = C(b2), R = C(res);
        api.stage.appendChild(el('div', 'mix', `${blob(A)}<b>+</b>${blob(B)}<b>=</b><span class="paint q">?</span>`));
        api.say(`What colour do ${A.en} and ${B.en} make?`, `Màu ${A.vi} trộn với màu ${B.vi} ra màu gì?`);
        const opts = shuffle([R, ...others(COLORS, [R, A, B], 2)]);
        const btns = choiceButtons(api, opts, o => blob(o), 'choice plain');
        const b = await untilRight(api, btns, e => e._v === R); if (!b) return;
        const q = api.stage.querySelector('.paint.q'); q.style.setProperty('--pc', R.hex); q.textContent = ''; q.classList.add('right');
        api.say(`${A.en} and ${B.en} make ${R.en}!`, `${A.vi} với ${B.vi} thành màu ${R.vi}!`);
      }
      await wait(1700);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Ordering by size ----------
register({
  id: 'sorting', icon: '📏', name: () => T('Small to Big', 'Từ Bé Đến Lớn'),
  async run(api) {
    const rounds = 3;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = Math.min(5, 2 + api.level + (r > 0 ? 1 : 0) - 1 + 1), thing = pick(['🐘', '🐢', '🌻', '🏠', '🐟', '🍉', '🐻', '🚗']);
      const bigFirst = api.level >= 3 && r === rounds - 1;
      const sizes = Array.from({ length: n }, (_, i) => 34 + i * (90 / n));
      const order = bigFirst ? sizes.slice().reverse() : sizes;
      api.say(bigFirst ? 'Tap from the biggest to the smallest!' : 'Tap from the smallest to the biggest!', bigFirst ? 'Chạm từ lớn nhất đến bé nhất nhé!' : 'Chạm từ bé nhất đến lớn nhất nhé!');
      const shelf = el('div', 'shelf'); api.stage.appendChild(shelf);
      const line = el('div', 'size-line'); api.stage.appendChild(line);
      const btns = shuffle(sizes).map(s => { const b = el('button', 'sizer', thing); b.style.fontSize = s + 'px'; b._v = s; line.appendChild(b); return b; });
      for (let i = 0; i < n; i++) {
        const b = await untilRight(api, btns.filter(x => !x.disabled), e => e._v === order[i]); if (!b) return;
        b.disabled = true; shelf.appendChild(b); api.sfx.pop(i);
      }
      api.praise(); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Memory pairs (co-op: two players take turns and share the score) ----------
register({
  id: 'memory', icon: '🃏', name: () => T('Memory Match', 'Lật Hình Ghi Nhớ'),
  async run(api) {
    const pairs = [3, 4, 6, 6, 8][Math.min(4, api.level - 1)];
    const faces = shuffle([...ANIMALS, ...FRUIT]).slice(0, pairs);
    const deck = shuffle([...faces, ...faces]);
    const grid = el('div', 'mem-grid'); grid.style.setProperty('--cols', pairs <= 3 ? 3 : pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4);
    api.stage.appendChild(grid);
    const cards = deck.map(f => { const c = el('button', 'mem', `<span class="back">⭐</span><span class="front">${f}</span>`); c._v = f; grid.appendChild(c); return c; });
    let turn = 0, found = 0;
    const who = () => api.two ? api.players[turn % 2].name : null;
    const prompt = () => api.two ? api.say(`${who()}, your turn! Flip two cards.`, `${who()} ơi, đến lượt con! Lật hai thẻ nhé.`) : api.say('Find the matching pairs!', 'Tìm hai hình giống nhau nhé!');
    prompt(); api.dots(pairs, 0);
    for (;;) {
      const open = [];
      while (open.length < 2) {
        const c = await tapOne(cards.filter(x => !x.classList.contains('flip')));
        if (api.closed) return; c.classList.add('flip'); api.sfx.tap(); open.push(c);
      }
      await wait(700);
      if (open[0]._v === open[1]._v) {
        open.forEach(c => c.classList.add('got')); found++; api.dots(pairs, found); api.sfx.chime(); api.praise();
        if (found === pairs) break;
      } else { open.forEach(c => c.classList.remove('flip')); turn++; if (api.two) prompt(); }
    }
    await wait(800); return api.win();
  }
});

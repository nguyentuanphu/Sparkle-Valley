// Traditional Vietnamese games played with the village kids:
// Ô ăn quan, cờ caro, nhảy lò cò and kéo co. With two players they become head-to-head.
import { register, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { el, wait, pick } from '../util.js';

// ---------- Ô ăn quan (Mandarin Square Capturing) ----------
// Squares 1–5 belong to the bottom player, 7–11 to the top player, 0 and 6 are the mandarins.
const isQuan = i => i === 0 || i === 6;
const owner = i => (i >= 1 && i <= 5 ? 0 : i >= 7 ? 1 : -1);
function simulate(st, from, dir) {
  const s = { seeds: st.seeds.slice(), big: st.big.slice(), score: st.score.slice() }, me = owner(from), steps = [];
  let hand = s.seeds[from], pos = from; s.seeds[from] = 0; steps.push({ k: 'pick', i: from });
  for (;;) {
    while (hand > 0) { pos = (pos + dir + 12) % 12; s.seeds[pos]++; hand--; steps.push({ k: 'drop', i: pos }); }
    const next = (pos + dir + 12) % 12;
    if (isQuan(next)) break;
    if (s.seeds[next] > 0) { hand = s.seeds[next]; s.seeds[next] = 0; pos = next; steps.push({ k: 'pick', i: next }); continue; }
    let cur = next;
    for (;;) {
      const after = (cur + dir + 12) % 12, val = s.seeds[after] + (s.big[after] ? 10 : 0);
      if (s.seeds[cur] !== 0 || val === 0) break;
      s.score[me] += val; s.seeds[after] = 0; s.big[after] = false; steps.push({ k: 'take', i: after, n: val });
      cur = (after + dir + 12) % 12;
    }
    break;
  }
  return { s, steps };
}
register({
  id: 'oanquan', icon: '🪨', name: () => T('Ô Ăn Quan (Mandarin Squares)', 'Ô Ăn Quan'),
  async run(api) {
    const names = api.two ? [api.players[0].name, api.players[1].name] : [api.players[0].name, 'Tèo'];
    let st = { seeds: [0, 5, 5, 5, 5, 5, 0, 5, 5, 5, 5, 5], big: [true, false, false, false, false, false, true, false, false, false, false, false], score: [0, 0] };
    const wrap = el('div', 'oaq-wrap'); api.stage.appendChild(wrap);
    const scoreEl = el('div', 'oaq-score'); wrap.appendChild(scoreEl);
    const board = el('div', 'oaq'); wrap.appendChild(board);
    const cells = {};
    const mk = (i, cls) => { const c = el('button', 'oaq-c ' + cls); c._i = i; cells[i] = c; return c; };
    board.appendChild(mk(0, 'quan qleft'));
    const mid = el('div', 'oaq-mid'); board.appendChild(mid);
    const top = el('div', 'oaq-row top'), bot = el('div', 'oaq-row bot'); mid.append(top, bot);
    [11, 10, 9, 8, 7].forEach(i => top.appendChild(mk(i, 'sq')));
    [1, 2, 3, 4, 5].forEach(i => bot.appendChild(mk(i, 'sq')));
    board.appendChild(mk(6, 'quan qright'));
    const seedHTML = (n, big) => (big ? '<i class="bigstone"></i>' : '') + Array.from({ length: Math.min(n, 14) }, () => '<i class="seed"></i>').join('') + `<b class="n">${n + (big ? 10 : 0)}</b>`;
    const draw = () => {
      for (const i in cells) cells[i].innerHTML = seedHTML(st.seeds[i], st.big[i]);
      scoreEl.innerHTML = `<span class="p0">🙂 ${names[0]}: <b>${st.score[0]}</b></span><span class="p1">${api.two ? '🙂' : '🧒'} ${names[1]}: <b>${st.score[1]}</b></span>`;
    };
    draw();
    api.say('Ô ăn quan! Pick one of your squares and a direction. Drop one seed in each square. Land next to an empty square and you capture the seeds after it!',
      'Ô ăn quan! Chọn một ô của con và chọn hướng. Rải mỗi ô một hạt. Gặp ô trống thì được ăn các hạt ở ô sau đó!');
    const play = async (from, dir) => {
      const { s, steps } = simulate(st, from, dir);
      const view = { seeds: st.seeds.slice(), big: st.big.slice(), score: st.score.slice() };
      for (const stp of steps) {
        if (api.closed) return;
        const c = cells[stp.i];
        if (stp.k === 'pick') { view.seeds[stp.i] = 0; api.sfx.tap(); }
        if (stp.k === 'drop') { view.seeds[stp.i]++; api.sfx.pop(stp.i); }
        if (stp.k === 'take') { view.seeds[stp.i] = 0; view.big[stp.i] = false; api.sfx.coin(); c.classList.add('taken'); setTimeout(() => c.classList.remove('taken'), 600); }
        c.classList.add('hl'); setTimeout(() => c.classList.remove('hl'), 260);
        for (const i in cells) cells[i].innerHTML = seedHTML(view.seeds[i], view.big[i]);
        await wait(stp.k === 'take' ? 600 : 260);
      }
      const took = s.score[owner(from)] - st.score[owner(from)];
      st = s; draw();
      if (took) api.say(`Captured ${took}!`, `Ăn được ${took} hạt!`);
    };
    const pickAI = () => {
      const opts = [];
      for (let i = 7; i <= 11; i++) if (st.seeds[i]) for (const d of [1, -1]) { const r = simulate(st, i, d); opts.push({ i, d, gain: r.s.score[1] - st.score[1] }); }
      opts.sort((a, b) => b.gain - a.gain);
      return api.level <= 1 && Math.random() < .55 ? pick(opts) : opts[0];
    };
    let turn = 0;
    const over = () => !st.big[0] && !st.big[6] && st.seeds[0] === 0 && st.seeds[6] === 0;
    while (!over()) {
      const range = turn === 0 ? [1, 2, 3, 4, 5] : [7, 8, 9, 10, 11];
      if (range.every(i => st.seeds[i] === 0)) {
        // Out of seeds: put one back in each square (from your own pile, or borrowed).
        range.forEach(i => st.seeds[i] = 1); st.score[turn] = Math.max(0, st.score[turn] - 5); draw();
        api.say(`${names[turn]} puts out 5 new seeds.`, `${names[turn]} rải lại 5 hạt mới.`); await wait(1400);
      }
      board.classList.toggle('turn-top', turn === 1); board.classList.toggle('turn-bot', turn === 0);
      if (turn === 1 && !api.two) {
        api.show('Tèo is thinking…', 'Tèo đang suy nghĩ…'); await wait(1000);
        const m = pickAI(); await play(m.i, m.d);
      } else {
        api.show(`${names[turn]}: pick a square`, `${names[turn]}: chọn một ô`);
        if (api.two) sayIn(settings.lang, T(`${names[turn]}'s turn`, `Đến lượt ${names[turn]}`));
        let from, dir;
        for (;;) {
          const c = await tapOne(range.map(i => cells[i]).filter(c => st.seeds[c._i] > 0)); if (api.closed) return;
          from = c._i;
          const arrows = el('div', 'oaq-arrows', `<button data-d="l">⬅️</button><button data-d="r">➡️</button>`); c.appendChild(arrows);
          const b = await tapOne([...arrows.querySelectorAll('button'), ...range.map(i => cells[i]).filter(x => x !== c)]);
          arrows.remove(); if (api.closed) return;
          if (b.dataset && b.dataset.d) { const right = b.dataset.d === 'r'; dir = turn === 0 ? (right ? 1 : -1) : (right ? -1 : 1); break; }
        }
        await play(from, dir);
      }
      turn = 1 - turn; await wait(300);
    }
    // Game over: each side keeps the seeds left on its row.
    for (let i = 1; i <= 5; i++) { st.score[0] += st.seeds[i]; st.seeds[i] = 0; }
    for (let i = 7; i <= 11; i++) { st.score[1] += st.seeds[i]; st.seeds[i] = 0; }
    draw();
    const w = st.score[0] === st.score[1] ? -1 : st.score[0] > st.score[1] ? 0 : 1;
    const title = w < 0 ? T("It's a tie!", 'Hòa rồi!') : T(`${names[w]} wins!`, `${names[w]} thắng!`);
    await wait(800);
    return api.win({ title, titleVi: w < 0 ? 'Hòa rồi!' : `${names[w]} thắng!` });
  }
});

// ---------- Cờ caro (tic-tac-toe / four in a row) ----------
register({
  id: 'caro', icon: '⭕', name: () => T('Caro (Noughts & Crosses)', 'Cờ Caro'),
  async run(api) {
    const N = api.level <= 1 ? 3 : 6, K = api.level <= 1 ? 3 : 4, P = ['🌸', '🍀'];
    const names = api.two ? [api.players[0].name, api.players[1].name] : [api.players[0].name, 'Bống'];
    const b = Array(N * N).fill(-1);
    const grid = el('div', 'caro'); grid.style.setProperty('--n', N); api.stage.appendChild(grid);
    const cells = b.map((_, i) => { const c = el('button', 'caro-c'); c._i = i; grid.appendChild(c); return c; });
    const lineAt = (i, who) => {
      const x = i % N, y = Math.floor(i / N);
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const run = [i];
        for (const s of [1, -1]) for (let k = 1; k < K; k++) { const nx = x + dx * k * s, ny = y + dy * k * s; if (nx < 0 || ny < 0 || nx >= N || ny >= N || b[ny * N + nx] !== who) break; run.push(ny * N + nx); }
        if (run.length >= K) return run;
      }
      return null;
    };
    const aiMove = () => {
      const free = b.map((v, i) => v < 0 ? i : -1).filter(i => i >= 0);
      const test = who => free.find(i => { b[i] = who; const w = lineAt(i, who); b[i] = -1; return w; });
      const win = test(1); if (win != null) return win;
      const block = test(0); if (block != null && (api.level > 1 || Math.random() < .6)) return block;
      const c = Math.floor(N / 2) * N + Math.floor(N / 2); if (b[c] < 0 && Math.random() < .7) return c;
      const near = free.filter(i => { const x = i % N, y = Math.floor(i / N); return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].some(([dx, dy]) => b[(y + dy) * N + x + dx] === 1 && x + dx >= 0 && x + dx < N); });
      return pick(near.length && Math.random() < .6 ? near : free);
    };
    api.say(K === 3 ? 'Get three in a row to win! Across, down or slanted.' : 'Get four in a row to win!', K === 3 ? 'Xếp được ba hình thẳng hàng là thắng! Ngang, dọc hay chéo đều được.' : 'Xếp được bốn hình thẳng hàng là thắng!');
    let turn = 0, winner = -1;
    for (let moves = 0; moves < N * N; moves++) {
      let i;
      if (turn === 1 && !api.two) { api.show('Bống is thinking…', 'Bống đang suy nghĩ…'); await wait(700); i = aiMove(); }
      else { api.show(`${names[turn]} ${P[turn]}`, `${names[turn]} ${P[turn]}`); const c = await tapOne(cells.filter(c => b[c._i] < 0)); if (api.closed) return; i = c._i; }
      b[i] = turn; cells[i].textContent = P[turn]; cells[i].classList.add('put'); api.sfx.pop(moves);
      const line = lineAt(i, turn);
      if (line) { line.forEach(k => cells[k].classList.add('win')); winner = turn; break; }
      turn = 1 - turn;
    }
    await wait(900);
    const title = winner < 0 ? T("It's a tie! Good thinking!", 'Hòa rồi! Suy nghĩ giỏi lắm!') : winner === 0 || api.two ? T(`${names[winner]} wins!`, `${names[winner]} thắng!`) : T('Bống wins this time. Great try!', 'Lần này Bống thắng. Con cố gắng giỏi lắm!');
    return api.win({ title, titleVi: title });
  }
});

// ---------- Nhảy lò cò (hopscotch): hop in order and skip the square with the stone ----------
register({
  id: 'hopscotch', icon: '🦶', name: () => T('Hopscotch', 'Nhảy Lò Cò'),
  async run(api) {
    const rounds = 3, N = api.level <= 1 ? 6 : api.level === 2 ? 8 : 10, back = api.level >= 3;
    const LAYOUT = { 6: [[1], [2], [3], [4, 5], [6]], 8: [[1], [2], [3], [4, 5], [6], [7, 8]], 10: [[1], [2], [3], [4, 5], [6], [7, 8], [9], [10]] }[N];
    api.say('Nhảy lò cò! Throw the stone, then hop on every number in order. Skip the square with the stone!', 'Nhảy lò cò! Ném viên đá, rồi nhảy lần lượt theo số. Nhớ bỏ qua ô có viên đá nhé!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const court = el('div', 'hop'); api.stage.appendChild(court);
      const sq = {};
      LAYOUT.slice().reverse().forEach(row => { const rr = el('div', 'hop-row'); row.forEach(n => { const b = el('button', 'hop-sq', `<b>${n}</b>`); b._n = n; sq[n] = b; rr.appendChild(b); }); court.appendChild(rr); });
      const stone = 1 + Math.floor(Math.random() * N);
      await wait(400); api.sfx.whoosh();
      sq[stone].classList.add('stone'); sq[stone].insertAdjacentHTML('beforeend', '<i class="pebble">🪨</i>');
      api.say(`The stone landed on ${stone}. Hop over it!`, `Viên đá rơi vào ô số ${numWord(stone)}. Nhảy qua ô đó nhé!`);
      const path = []; for (let n = 1; n <= N; n++) if (n !== stone) path.push(n);
      if (back) for (let n = N - 1; n >= 1; n--) if (n !== stone) path.push(n);
      for (let k = 0; k < path.length; k++) {
        const want = path[k];
        for (;;) {
          const b = await tapOne(Object.values(sq)); if (api.closed) return;
          if (b._n === want) { b.classList.remove('hopped'); void b.offsetWidth; b.classList.add('hopped'); api.sfx.jump(); sayIn(settings.lang, numWord(want)); break; }
          if (b._n === stone) api.wrong(b, `Skip the stone! Hop to ${want}.`, `Bỏ qua viên đá! Nhảy sang ô ${numWord(want)}.`);
          else api.wrong(b, `Hop to ${want}!`, `Nhảy vào ô ${numWord(want)}!`);
        }
      }
      sq[stone].classList.add('right'); api.praise(); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Kéo co (tug of war): tap as fast as you can ----------
register({
  id: 'tug', icon: '🪢', name: () => T('Tug of War', 'Kéo Co'),
  async run(api) {
    const names = api.two ? [api.players[0].name, api.players[1].name] : [api.players[0].name, T('Village kids', 'Các bạn trong làng')];
    for (let attempt = 0; attempt < 5; attempt++) {
      api.stage.innerHTML = '';
      const field = el('div', 'tug', `<div class="team tleft">🧒🧒<b>${names[0]}</b></div><div class="rope"><i class="mark"></i><i class="line"></i></div><div class="team tright"><b>${names[1]}</b>👧👦</div>`);
      api.stage.appendChild(field);
      const btns = el('div', 'tug-btns'); api.stage.appendChild(btns);
      const b0 = el('button', 'pill big pull p0', '💪 ' + T('Pull!', 'Kéo!')); btns.appendChild(b0);
      let b1 = null; if (api.two) { b1 = el('button', 'pill big pull p1', T('Pull!', 'Kéo!') + ' 💪'); btns.appendChild(b1); }
      api.say(attempt === 0 ? 'Dô ta! Tap the pull button as fast as you can!' : 'Again! Dô ta!', attempt === 0 ? 'Dô ta! Bấm nút Kéo thật nhanh nào!' : 'Lại nào! Dô ta!');
      await wait(1200);
      let x = 0, done = -1, last = performance.now();
      const mark = field.querySelector('.mark'), rope = field.querySelector('.rope');
      const pull = d => { x += d * .045; api.sfx.pop(Math.abs(Math.round(x * 10))); };
      b0.onclick = () => pull(-1); if (b1) b1.onclick = () => pull(1);
      const aiRate = [1.9, 2.3, 2.8, 3.2, 3.6][Math.min(4, api.level - 1)] + attempt * -.25;
      await new Promise(res => {
        const tick = now => {
          if (api.closed) return res();
          const dt = Math.min(.1, (now - last) / 1000); last = now;
          if (!api.two && Math.random() < aiRate * dt) pull(1);
          mark.style.left = (50 + x * 40) + '%'; rope.style.transform = `translateX(${x * 30}%)`;
          if (x <= -1 || x >= 1) { done = x <= -1 ? 0 : 1; return res(); }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      if (api.closed) return;
      if (done === 0 || api.two) return api.win({ title: T(`${names[done]} win!`, `${names[done]} thắng rồi!`), titleVi: `${names[done]} thắng rồi!` });
      api.say('So close! Let’s go again!', 'Suýt nữa thôi! Chơi lại nào!'); await wait(1600);
    }
    return api.win({ title: T('What a strong team!', 'Đội mình khỏe quá!'), titleVi: 'Đội mình khỏe quá!' });
  }
});
